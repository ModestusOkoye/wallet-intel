const ARKHAM_BASE = 'https://api.arkm.com';

async function parseSearchIntent(naturalQuery) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://wallet-intel.vercel.app',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        {
          role: 'system',
          content: `Parse wallet search queries into JSON. Return ONLY valid JSON with: entityType, count (default 10), chains (array, empty=all), searchQuery (1-3 words). No explanation.`
        },
        {
          role: 'user',
          content: `Query: "${naturalQuery}"\n\nJSON only:`
        }
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenRouter error: ${response.status} — ${errBody}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '{}';

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {
      entityType: 'unknown',
      count: 10,
      chains: [],
      tags: [],
      searchQuery: naturalQuery.slice(0, 50),
    };
  }
}

async function searchArkham(params) {
  const { searchQuery, count, chains } = params;

  const headers = {
    'API-Key': process.env.ARKHAM_API_KEY,
    'Content-Type': 'application/json',
  };

  const searchUrl = new URL(`${ARKHAM_BASE}/intelligence/search`);
  searchUrl.searchParams.set('query', searchQuery);
  searchUrl.searchParams.set('filterLimits', JSON.stringify({ arkhamEntities: 15, addresses: 15 }));

  const searchRes = await fetch(searchUrl.toString(), { headers });

  if (!searchRes.ok) {
    throw new Error(`Arkham API error: ${searchRes.status} ${await searchRes.text()}`);
  }

  const searchData = await searchRes.json();
  console.log('[arkham]', JSON.stringify(searchData).slice(0, 500));
  let results = [];

  if (searchData.arkhamEntities) {
    for (const entity of searchData.arkhamEntities) {
      results.push({
        address: entity.id,
        chain: 'ethereum',
        entityName: entity.name,
        entityType: entity.type,
        label: entity.note || entity.name,
        website: entity.twitter || null,
        arkhamUrl: `https://intel.arkm.com/explorer/entity/${entity.id}`,
      });
    }
  }
  if (searchData.arkhamAddresses) {
    for (const addr of searchData.arkhamAddresses) {
      results.push({
        address: addr.address,
        chain: addr.chain || 'ethereum',
        entityName: addr.arkhamEntity?.name || addr.arkhamLabel?.name || 'Unknown',
        entityType: addr.arkhamEntity?.type || addr.arkhamLabel?.labelType || 'unknown',
        label: addr.arkhamLabel?.name || addr.arkhamEntity?.name || null,
        website: addr.arkhamEntity?.website || null,
        arkhamUrl: `https://platform.arkhamintelligence.com/explorer/address/${addr.address}`,
      });
    }
  }

  if (chains && chains.length > 0) {
    results = results.filter((r) =>
      chains.some((c) => r.chain?.toLowerCase().includes(c.toLowerCase()))
    );
  }

  const seen = new Set();
  results = results.filter((r) => {
    const key = `${r.address}-${r.chain}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return results.slice(0, count);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return res.status(400).json({ error: 'Query must be at least 3 characters' });
  }

  try {
    const params = await parseSearchIntent(query.trim());
    const wallets = await searchArkham(params);

    return res.status(200).json({
      success: true,
      query: query.trim(),
      parsedIntent: params,
      count: wallets.length,
      wallets,
    });
  } catch (err) {
    console.error('[llm-search] ERROR:', err.message);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      success: false,
    });
  }
}
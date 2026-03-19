export default async function handler(req, res) {
  const apiKey = process.env.ARKHAM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  if (req.method === 'POST') {
    const { addresses } = req.body;
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0)
      return res.status(400).json({ error: 'addresses array required' });

    const valid = addresses
      .map(a => String(a).trim().replace(/["'\s]/g, ''))
      .filter(a => /^0x[a-fA-F0-9]{40}$/.test(a));

    if (valid.length === 0)
      return res.status(400).json({ error: 'No valid Ethereum addresses found' });

    const chunks = [];
    for (let i = 0; i < valid.length; i += 50) chunks.push(valid.slice(i, i + 50));

    try {
      const results = {};
      for (const chunk of chunks) {
        const r = await fetch('https://api.arkm.com/intelligence/address/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'API-Key': apiKey },
          body: JSON.stringify({ addresses: chunk }),
        });
        if (!r.ok) return res.status(r.status).json({ error: await r.text() });
        const data = await r.json();
        // Arkham wraps results in an "addresses" key — extract it
        const inner = data.addresses || data;
        Object.assign(results, inner);
      }
      return res.status(200).json(results);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  if (req.method === 'GET') {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'address param required' });
    try {
      const r = await fetch(`https://api.arkm.com/transfers?base=${address}&flow=all&limit=30&usdGte=500`, {
        headers: { 'API-Key': apiKey },
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      return res.status(200).json(await r.json());
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
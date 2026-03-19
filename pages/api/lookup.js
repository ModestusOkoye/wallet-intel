export default async function handler(req, res) {
  const apiKey = process.env.ARKHAM_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // POST — batch address label lookup
  if (req.method === 'POST') {
    const { addresses } = req.body;
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'addresses array required' });
    }

    const chunks = [];
    for (let i = 0; i < addresses.length; i += 50) {
      chunks.push(addresses.slice(i, i + 50));
    }

    try {
      const results = {};
      for (const chunk of chunks) {
        const response = await fetch('https://api.arkm.com/intelligence/address/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'API-Key': apiKey },
          body: JSON.stringify({ addresses: chunk }),
        });
        if (!response.ok) {
          const text = await response.text();
          return res.status(response.status).json({ error: `Arkham API error: ${text}` });
        }
        const data = await response.json();
        Object.assign(results, data);
      }
      return res.status(200).json(results);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET — transfers for relationship map
  if (req.method === 'GET') {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'address param required' });

    try {
      const url = `https://api.arkm.com/transfers?base=${address}&flow=all&limit=30&usdGte=500`;
      const response = await fetch(url, {
        headers: { 'API-Key': apiKey },
      });
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: `Arkham API error: ${text}` });
      }
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
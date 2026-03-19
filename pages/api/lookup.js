export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { addresses } = req.body;

  if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
    return res.status(400).json({ error: "No addresses provided" });
  }

  const apiKey = process.env.ARKHAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  // Arkham batch limit is 50 addresses per request
  const BATCH_SIZE = 50;
  const chunks = [];
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    chunks.push(addresses.slice(i, i + BATCH_SIZE));
  }

  try {
    const allResults = [];

    for (const chunk of chunks) {
      const response = await fetch(
        "https://api.arkm.com/intelligence/address/batch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "API-Key": apiKey,
          },
          body: JSON.stringify({ addresses: chunk }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Arkham API error:", response.status, errorText);
        return res.status(response.status).json({
          error: `Arkham API error: ${response.status} ${errorText}`,
        });
      }

      const data = await response.json();
      console.log("Arkham raw response:", JSON.stringify(data, null, 2));

      const addressMap = data.addresses || {};

      // Build a lowercase lookup map to handle Arkham's mixed-case keys
      const lowerMap = {};
      for (const [key, value] of Object.entries(addressMap)) {
        lowerMap[key.toLowerCase()] = value;
      }

      for (const address of chunk) {
        const info = lowerMap[address.toLowerCase()] || null;
        const entity = info?.arkhamEntity || null;
        const label = info?.arkhamLabel || null;

        allResults.push({
          address,
          entity: entity?.name || null,
          entityType: entity?.type || null,
          label: label?.name || null,
          labelType: label?.labelType || label?.chainType || null,
        });
      }
    }

    return res.status(200).json({ results: allResults });
  } catch (err) {
    console.error("Lookup error:", err);
    return res.status(500).json({ error: err.message });
  }
}
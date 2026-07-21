export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID video tidak boleh kosong' });

  const ytUrl = `https://www.youtube.com/watch?v=${id}`;

  const fetchWithTimeout = async (url, options, time = 7000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), time);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  // Daftar instance Cobalt v10 & mirror publik yang aktif
  const cobaltInstances = [
    'https://api.cobalt.tools',
    'https://cobalt.api.scipy.software',
    'https://co.wuk.sh',
    'https://cobalt.q0.is'
  ];

  const tryCobaltInstance = async (domain) => {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    };

    // 1. Format Payload Cobalt v10 (Terbaru)
    const payloadV10 = {
      url: ytUrl,
      downloadMode: 'audio',
      audioFormat: 'mp3'
    };

    try {
      let res = await fetchWithTimeout(domain, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadV10)
      });

      if (!res.ok) {
        res = await fetchWithTimeout(`${domain}/api/json`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payloadV10)
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
        if (data.status === 'redirect' || data.status === 'tunnel') return data.url;
      }
    } catch (e) {
      // Jika v10 gagal, lanjut mencoba payload legacy
    }

    // 2. Format Payload Cobalt Legacy (Fallback)
    const payloadLegacy = {
      url: ytUrl,
      isAudioOnly: true,
      aFormat: 'mp3'
    };

    const resLegacy = await fetchWithTimeout(`${domain}/api/json`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payloadLegacy)
    });

    if (!resLegacy.ok) throw new Error(`Instance ${domain} merespons dengan status ${resLegacy.status}`);

    const dataLegacy = await resLegacy.json();
    if (dataLegacy.url) return dataLegacy.url;

    throw new Error(`Gagal mengekstrak stream dari ${domain}`);
  };

  try {
    // Jalankan permohonan ke seluruh server mirror secara paralel
    const scrapers = cobaltInstances.map(domain => tryCobaltInstance(domain));
    const streamUrl = await Promise.any(scrapers);

    return res.status(200).json({ url: streamUrl });
  } catch (err) {
    console.error('Semua target instance gagal:', err.message);
    return res.status(500).json({ 
      error: 'Layanan audio background sedang padat. Silakan gunakan mode Video.' 
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID video kosong' });

  const ytUrl = `https://www.youtube.com/watch?v=${id}`;

  // Waktu tunggu dilonggarkan (6 detik) karena Cobalt kadang butuh waktu menembus enkripsi
  const fetchWithTimeout = async (url, options, time = 6000) => {
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

  try {
    // ☠️ SENJATA UTAMA: COBALT API (The Current Meta)
    const fetchCobalt = async (domain) => {
      const res = await fetchWithTimeout(`${domain}/api/json`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Minta format audio mp3 secara spesifik tanpa video
        body: JSON.stringify({
          url: ytUrl,
          isAudioOnly: true,
          aFormat: 'mp3' 
        })
      });
      
      if (!res.ok) throw new Error(`Cobalt ${domain} diblokir`);
      
      const data = await res.json();
      if (data.url) return data.url;
      throw new Error('URL gagal diekstrak dari Cobalt');
    };

    // Daftar instance Cobalt paling stabil saat ini
    const cobaltInstances = [
      'https://api.cobalt.tools', // Server Utama Resmi
      'https://co.wuk.sh',        // Server Mirror 1
      'https://cobalt.q0.is'      // Server Mirror 2
    ];

    // 🚀 THE RACE: Kirim pasukan ke semua server, ambil yang pertama kali membalas!
    const scrapers = cobaltInstances.map(fetchCobalt);
    const streamUrl = await Promise.any(scrapers);

    // Kirim URL bersih ke frontend
    return res.status(200).json({ url: streamUrl });

  } catch (err) {
    console.error('Semua target server Cobalt gagal:', err.message);
    return res.status(500).json({ error: 'Pertahanan YouTube terlalu tebal. Coba lagi nanti.' });
  }
}

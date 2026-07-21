// api/youtube-search.js
// Vercel serverless function — Bypass public stream (Auto-Race & Strict Timeout)

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query kosong.' });
  }

  // Daftar server bypass rahasia (Piped Instances)
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://api.piped.projectsegfau.lt'
  ];

  // Fungsi penembak jitu buat 1 server dengan batas kesabaran 4 detik
  const fetchFromInstance = async (instance) => {
    const controller = new AbortController();
    // Kalau 4 detik gak balas, langsung batalin paksa (mencegah Vercel Timeout)
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const ytRes = await fetch(`${instance}/search?q=${encodeURIComponent(q)}&filter=all`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal // Pasang pelatuk pembatalan
      });
      
      if (!ytRes.ok) throw new Error('Server menolak');
      
      const text = await ytRes.text();
      if (!text) throw new Error('Data kosong');
      
      const data = JSON.parse(text);
      if (!data.items || data.items.length === 0) throw new Error('Tidak ada lagu');

      // Kalau lolos semua, format datanya
      return data.items
        .filter(item => item.type === 'stream')
        .slice(0, 15) // Batasi 15 lagu teratas
        .map(item => ({
          videoId: item.url.replace('/watch?v=', ''),
          title: item.title,
          channel: item.uploaderName,
          thumb: item.thumbnail,
        }));
    } finally {
      clearTimeout(timeoutId); // Bersihkan timer kalau berhasil/gagal
    }
  };

  try {
    // 🔥 MODE BALAPAN: Tembak ke-3 server sekaligus! 
    // Promise.any akan langsung beres begitu ada 1 server yang duluan ngasih hasil valid.
    const items = await Promise.any(instances.map(fetchFromInstance));
    
    return res.status(200).json({ items });
  } catch (err) {
    // Kalau apes banget ke-3 servernya lagi mati/lemot semua dalam 4 detik itu
    return res.status(500).json({ error: 'Semua jalur bypass sibuk. Coba detik depan.' });
  }
}

// api/youtube-search.js
// Vercel serverless function — Bypass public stream (Anti-Limit & Multi-Server Failover)

export default async function handler(req, res) {
  const { q } = req.query

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query kosong.' })
  }

  // 🔥 Daftar server bypass rahasia (Piped Instances)
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://api.piped.projectsegfau.lt'
  ]

  // Coba bobol server satu per satu
  for (const instance of instances) {
    try {
      // Tambahin User-Agent palsu biar gak dikira bot sama servernya
      const ytRes = await fetch(`${instance}/search?q=${encodeURIComponent(q)}&filter=all`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      const text = await ytRes.text()
      // Kalau response kosong (dicegat), abaikan dan lompat ke server berikutnya
      if (!text) continue 
      
      const data = JSON.parse(text)
      if (!data.items) continue

      const items = data.items
        .filter(item => item.type === 'stream')
        .slice(0, 15) // Batasi 15 lagu teratas
        .map(item => ({
          videoId: item.url.replace('/watch?v=', ''),
          title: item.title,
          channel: item.uploaderName,
          thumb: item.thumbnail,
        }))

      // Kalau sukses nyedot data, langsung kirim ke PWA dan hentikan perburuan
      return res.status(200).json({ items })
    } catch (err) {
      // Kalau server ini error/timeout, abaikan dan lanjut sikat server berikutnya
      console.error(`Gagal di server ${instance}:`, err.message)
    }
  }

  // Kalau apes banget ke-3 server tumbang bersamaan (sangat jarang terjadi)
  // Pesan error ini dikirim dalam format JSON rapi, jadi gak bakal bikin frontend PWA lu crash!
  return res.status(500).json({ error: 'Semua jalur bypass sedang sibuk. Coba beberapa saat lagi.' })
}

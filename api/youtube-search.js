// api/youtube-search.js
// Vercel serverless function — Bypass public stream (Anti-Limit & Tanpa API Key)

export default async function handler(req, res) {
  const { q } = req.query

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query kosong.' })
  }

  try {
    // Nembak langsung ke public API Piped (Bebas limit, tanpa butuh YOUTUBE_API_KEY)
    const ytRes = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=all`)
    const data = await ytRes.json()

    if (!ytRes.ok || !data.items) {
      throw new Error('Gagal mengambil data dari server pencarian.')
    }

    const items = data.items
      .filter(item => item.type === 'stream')
      .slice(0, 15) // Menyesuaikan maxResults awal lu
      .map(item => ({
        videoId: item.url.replace('/watch?v=', ''),
        title: item.title,
        channel: item.uploaderName,
        thumb: item.thumbnail,
      }))

    return res.status(200).json({ items })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server pencarian sedang sibuk.' })
  }
}

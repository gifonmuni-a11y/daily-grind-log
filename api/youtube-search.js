// api/youtube-search.js
// Vercel serverless function. Proxies YouTube Data API v3 search
// so the API key never touches the browser.
//
// Setup (dari Replit shell, sama seperti env var kamu yang lain):
//   vercel link
//   vercel env add YOUTUBE_API_KEY
// Ambil key gratis di: https://console.cloud.google.com
// -> aktifkan "YouTube Data API v3" -> Credentials -> Create API key

export default async function handler(req, res) {
  const { q } = req.query

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query kosong.' })
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY belum di-set di Vercel.' })
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(q)}&key=${apiKey}`

  try {
    const ytRes = await fetch(url)
    const data = await ytRes.json()

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'YouTube API error.' })
    }

    const items = (data.items || []).map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    }))

    return res.status(200).json({ items })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

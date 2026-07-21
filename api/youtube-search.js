import { Innertube, UniversalCache } from 'youtubei.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query kosong.' });
  }

  try {
    // Inisialisasi Innertube khusus untuk serverless Vercel (Tanpa cache lokal & local session)
    const youtube = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
    
    // Eksekusi pencarian
    const search = await youtube.search(q, { type: 'video' });

    // Format data agar persis seperti yang diminta frontend PWA
    const items = search.results.map((video) => ({
      videoId: video.id,
      title: video.title?.text || 'Tanpa Judul',
      channel: video.author?.name || 'Unknown Artist',
      thumb: video.thumbnails?.[video.thumbnails.length - 1]?.url || video.thumbnails?.[0]?.url || '',
      duration: video.duration?.text || '',
    })).slice(0, 15);

    return res.status(200).json({ items });
    
  } catch (error) {
    console.error('InnerTube Vercel Error:', error);
    return res.status(500).json({ error: 'Gagal memproses pencarian: ' + error.message });
  }
}

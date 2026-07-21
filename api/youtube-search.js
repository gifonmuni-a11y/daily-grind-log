import { Innertube } from 'youtubei.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query kosong.' });
  }

  try {
    // Inisialisasi InnerTube (Langsung nembak ke YouTube tanpa limit!)
    const youtube = await Innertube.create();
    
    // Cari video
    const search = await youtube.search(q, { type: 'video' });

    // Format data disamakan 100% dengan format lama agar frontend tidak error
    const items = search.results.map((video) => ({
      videoId: video.id,
      title: video.title.text,
      channel: video.author.name,
      thumb: video.thumbnails[video.thumbnails.length - 1]?.url || '',
      duration: video.duration?.text || 'Unknown',
    })).slice(0, 15);

    // Kembalikan dalam bentuk objek { items } persis seperti Piped API
    return res.status(200).json({ items });
    
  } catch (error) {
    console.error('Error dari InnerTube:', error);
    return res.status(500).json({ error: 'Gagal mencari lagu. Server sedang sibuk.' });
  }
}

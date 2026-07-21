import { Innertube, UniversalCache } from 'youtubei.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID video kosong.' });
  }

  try {
    // Inisialisasi Innertube ala Vercel (anti server sibuk)
    const youtube = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
    
    // Dapatkan info detail video berdasarkan ID
    const info = await youtube.getInfo(id);
    
    // Perintahkan Innertube untuk mencari format audio murni (tanpa video) kualitas terbaik
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    
    if (!format || !format.url) {
      throw new Error('Format audio tidak ditemukan');
    }

    // Kembalikan URL direct audio ke frontend
    return res.status(200).json({ url: format.url });
    
  } catch (error) {
    console.error('Stream Error:', error);
    return res.status(500).json({ error: 'Gagal mengambil stream audio.' });
  }
}

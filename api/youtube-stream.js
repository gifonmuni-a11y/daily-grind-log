import { Innertube, UniversalCache } from 'youtubei.js';

// Global instance: Biar nggak usah start-up mesin dari nol setiap kali lagu ganti
let youtube = null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID video kosong.' });
  }

  try {
    // Inisialisasi cuma sekali pas pertama kali dipanggil
    if (!youtube) {
      youtube = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
      });
    }
    
    // PENTING: Gunakan getBasicInfo agar jauuuh lebih cepat! (menghindari Vercel Timeout 10 detik)
    const info = await youtube.getBasicInfo(id);
    
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    
    if (!format || !format.url) {
      throw new Error('Format audio tidak ditemukan');
    }

    return res.status(200).json({ url: format.url });
    
  } catch (error) {
    console.error('Stream Error:', error);
    return res.status(500).json({ error: 'Gagal mengambil stream audio.' });
  }
}

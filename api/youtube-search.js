import { Innertube } from 'youtubei.js';

// 🎯 FIX UTAMA: Letakkan instance di LUAR handler (Singleton Pattern)
// Dengan cara ini, Vercel reuse koneksi yang sudah ada tanpa bikin sesi baru terus-menerus.
// Hasilnya: Pencarian super ngebut dan IP server lu aman dari blokir YouTube!
let ytInstance = null;

async function getYoutube() {
  if (!ytInstance) {
    ytInstance = await Innertube.create({
      generate_session_locally: true,
    });
  }
  return ytInstance;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query kosong.' });
  }

  try {
    // Ambil instance youtube yang sudah di-cache / hangat
    const youtube = await getYoutube();
    
    // Eksekusi pencarian ke YouTube
    const search = await youtube.search(q, { type: 'video' });

    // 🎯 FIX FILTER DATA: youtubei.js kadang menyelipkan objek non-video (seperti lembar info/iklan) 
    // Kita filter ketat yang tipenya beneran 'Video' biar gak bikin frontend crash atau nge-blank hitam
    const videoResults = search.results 
      ? search.results.filter(item => item.type === 'Video') 
      : [];

    // Format data sesuai kemauan komponen frontend PWA lu
    const items = videoResults.map((video) => {
      // Cari resolusi thumbnail terbaik yang tersedia
      const thumbnailList = video.thumbnails || [];
      let bestThumb = thumbnailList.length > 0 
        ? thumbnailList[thumbnailList.length - 1]?.url 
        : '';

      // 🎯 FIX DIAGNOSIS GAMBAR KOSONG: YouTube kadang ngasih URL berawalan "//" tanpa "https:"
      // Ini yang sering bikin PWA bingung dan nampilin lingkaran hitam kosong!
      if (bestThumb.startsWith('//')) {
        bestThumb = `https:${bestThumb}`;
      }

      return {
        videoId: video.id,
        title: video.title?.text || 'Tanpa Judul',
        channel: video.author?.name || 'Unknown Artist',
        thumb: bestThumb,
        duration: video.duration?.text || '',
      };
    }).slice(0, 15);

    // Tambahkan Cache-Control di tingkat Edge Serverless biar performa makin gila dan hemat kuota
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=60');

    return res.status(200).json({ items });
    
  } catch (error) {
    console.error('InnerTube Vercel Error:', error);
    
    // Tangkap status 429 jika emang beneran kena limit dari YouTube
    if (error.status === 429 || error.message?.includes('429')) {
      return res.status(429).json({ error: 'Limit pencarian habis, coba beberapa saat lagi' });
    }
    
    return res.status(500).json({ error: 'Gagal memproses pencarian.' });
  }
}

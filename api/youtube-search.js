export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query kosong.' });
  }

  try {
    // 🎯 TRIK KILAT: Langsung tembak halaman hasil pencarian YouTube versi web desktop
    // Ditambahkan parameter '&sp=EgIQAQ%253D%253D' untuk mengunci hasil pencarian agar HANYA berupa video
    const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`;
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) throw new Error('YouTube menolak koneksi');

    const html = await response.text();
    
    // Ekstrak data JSON internal YouTube (ytInitialData) menggunakan Regex kilat
    const regex = /var ytInitialData = ({.*?});/;
    const match = html.match(regex);
    
    if (!match) {
      throw new Error('Gagal membaca struktur data YouTube');
    }

    const searchData = JSON.parse(match[1]);
    
    // Telusuri lorong objek JSON YouTube untuk mengambil deretan video
    const contents = searchData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
    
    // Filter data agar hanya mengambil object video asli dan bersihkan strukturnya
    const items = contents
      .filter(item => item.videoRenderer)
      .map(item => {
        const video = item.videoRenderer;
        
        // Ambil resolusi thumbnail terbaik
        const thumbs = video.thumbnail?.thumbnails || [];
        let bestThumb = thumbs.length > 0 ? thumbs[thumbs.length - 1]?.url : '';
        
        if (bestThumb.startsWith('//')) {
          bestThumb = `https:${bestThumb}`;
        }

        return {
          videoId: video.videoId,
          title: video.title?.runs?.[0]?.text || 'Tanpa Judul',
          channel: video.ownerText?.runs?.[0]?.text || 'Unknown Channel',
          thumb: bestThumb,
          duration: video.lengthText?.simpleText || ''
        };
      })
      .slice(0, 15);

    // Pasang cache di server tepi (Edge Cache) selama 15 menit biar kalau dicari lagi makin instan
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');

    return res.status(200).json({ items });

  } catch (error) {
    console.error('Super Scraper Error:', error);
    return res.status(500).json({ error: 'Gagal memproses pencarian cepat.' });
  }
}

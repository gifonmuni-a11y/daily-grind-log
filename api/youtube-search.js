export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query kosong.' });
  }

  let items = [];
  let apiSuccess = false;

  // 🎯 KUMPULAN 5 API KEY DARI VERCEL
  // Pastikan nama variabel ini SAMA PERSIS dengan yang lu ketik di menu Environment Variables Vercel
  const API_KEYS = [
    process.env.YOUTUBE_API_KEY,
    process.env.YOUTUBE_API_KEY_2,
    process.env.YOUTUBE_API_KEY_3,
    process.env.YOUTUBE_API_KEY_4,
    process.env.YOUTUBE_API_KEY_5
  ].filter(Boolean); // Buang key yang kosong/undefined

  // ====================================================================
  // STRATEGI 1: JALUR VIP (Rotasi 5 API Key Resmi)
  // ====================================================================
  if (API_KEYS.length > 0) {
    for (let i = 0; i < API_KEYS.length; i++) {
      try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(q)}&type=video&key=${API_KEYS[i]}`;
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const apiData = await response.json();
          items = apiData.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumb: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
            duration: '' // Catatan: API v3 gak ngasih durasi video buat hemat kuota
          }));
          
          apiSuccess = true;
          console.log(`✅ Sukses pakai API Key ke-${i + 1}`);
          break; // Kalau sukses dapet data, STOP looping-nya
        }
      } catch (error) {
        console.warn(`⚠️ API Key ke-${i + 1} Gagal. Lanjut kunci berikutnya...`);
      }
    }
  }

  // ====================================================================
  // STRATEGI 2: JALUR FALLBACK (Titanium Scraper - Tahan Banting)
  // Berjalan OTOMATIS jika kelima API Key di atas limit/habis kuota
  // ====================================================================
  if (!apiSuccess) {
    console.log("⚠️ Semua API Key limit/kosong. Beralih ke Titanium Scraper...");
    try {
      const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg;' // Bypass persetujuan cookie
        }
      });

      if (!response.ok) throw new Error('YouTube menolak koneksi scraper');

      const html = await response.text();
      
      // Multi-pattern Regex anti error
      const patterns = [
        /var ytInitialData = ({.*?});\s*<\/script>/s,
        /window\["ytInitialData"\] = ({.*?});\s*<\/script>/s,
        /ytInitialData\s*=\s*({.+?})\s*;\s*<\/script>/s
      ];

      let match = null;
      for (const pattern of patterns) {
        match = html.match(pattern);
        if (match) break;
      }

      if (!match) throw new Error('Gagal membaca struktur data YouTube');

      const searchData = JSON.parse(match[1]);
      const sections = searchData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

      // Looping pintar melewati Iklan/Shorts
      for (const section of sections) {
        if (section.itemSectionRenderer?.contents) {
          const videos = section.itemSectionRenderer.contents
            .filter(item => item.videoRenderer)
            .map(item => {
              const video = item.videoRenderer;
              const thumbs = video.thumbnail?.thumbnails || [];
              thumbs.sort((a, b) => a.width - b.width);
              let bestThumb = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : '';
              if (bestThumb.startsWith('//')) bestThumb = `https:${bestThumb}`;
              bestThumb = bestThumb.split('?')[0];

              return {
                videoId: video.videoId,
                title: video.title?.runs?.[0]?.text || 'Tanpa Judul',
                channel: video.ownerText?.runs?.[0]?.text || 'Unknown Channel',
                thumb: bestThumb,
                duration: video.lengthText?.simpleText || ''
              };
            });

          if (videos.length > 0) items = [...items, ...videos];
        }
      }

      items = items.slice(0, 15);
      if (items.length === 0) throw new Error('Video kosong');
      
      console.log('🕵️‍♂️ Sukses menggunakan Titanium Scraper');

    } catch (scraperError) {
      console.error('❌ Super Scraper Error:', scraperError.message);
      return res.status(500).json({ error: 'Gagal memproses pencarian cepat. Sistem sedang sibuk.' });
    }
  }

  // Set Cache biar makin instan
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');

  return res.status(200).json({ items });
}

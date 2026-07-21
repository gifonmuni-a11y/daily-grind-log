export default async function handler(req, res) {
  // Hanya izinkan method GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ID video tidak boleh kosong' });
  }

  // Fungsi utilitas untuk membatasi waktu tunggu agar tidak nyangkut (maksimal 4.5 detik)
  const fetchWithTimeout = async (url, time = 4500) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), time);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    // 1. JARINGAN PIPED (Utama & Paling Handal)
    const pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://pipedapi.tokhmi.xyz',
      'https://api.piped.projectsegfau.lt'
    ];
    
    const fetchPiped = async (domain) => {
      const res = await fetchWithTimeout(`${domain}/streams/${id}`);
      if (!res.ok) throw new Error(`Piped error dari ${domain}`);
      const data = await res.json();
      
      // Ambil format audio m4a atau webm
      const audio = data.audioStreams?.find(a => a.mimeType?.includes('audio/mp4') || a.mimeType?.includes('audio/webm')) || data.audioStreams?.[0];
      if (!audio?.url) throw new Error('Audio stream kosong');
      return audio.url;
    };

    // 2. JARINGAN INVIDIOUS (Cadangan)
    const invidiousInstances = [
      'https://invidious.nerdvpn.de',
      'https://inv.tux.pizza'
    ];
    
    const fetchInvidious = async (domain) => {
      const res = await fetchWithTimeout(`${domain}/api/v1/videos/${id}`);
      if (!res.ok) throw new Error(`Invidious error dari ${domain}`);
      const data = await res.json();
      
      const audio = data.formatStreams?.find(s => s.type.includes('audio/mp4') || s.type.includes('audio/webm'));
      if (!audio?.url) throw new Error('Audio stream kosong');
      return audio.url;
    };

    // 3. BALAPAN SERVER (Promise.any)
    // Akan mengambil respons PERTAMA yang berhasil mengembalikan link
    const allScrapers = [
      ...pipedInstances.map(fetchPiped),
      ...invidiousInstances.map(fetchInvidious)
    ];

    const streamUrl = await Promise.any(allScrapers);

    // Kembalikan URL yang sukses ke Frontend
    return res.status(200).json({ url: streamUrl });

  } catch (err) {
    console.error('Semua target server gagal atau timeout:', err.message);
    return res.status(500).json({ error: 'Jalur gelap YouTube sedang sibuk, coba lagu lain.' });
  }
}

import { Innertube, UniversalCache } from 'youtubei.js';

let ytInstance = null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID video tidak valid' });
  }

  try {
    // Inisialisasi Innertube sebagai client Smart TV untuk menghindari bot detection
    if (!ytInstance) {
      ytInstance = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        client_type: 'TV'
      });
    }

    // Mengunduh stream audio langsung sebagai Web ReadableStream
    const stream = await ytInstance.download(id, {
      type: 'audio',
      quality: 'best',
      client: 'TV'
    });

    // Set Header HTTP agar browser mengenali response sebagai audio stream
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Meneruskan (pipe) chunk data dari Web Stream ke Node.js Response
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }

    return res.end();

  } catch (err) {
    console.error('Dark Stream Error:', err.message || err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Gagal mengambil stream audio.' });
    }
    return res.end();
  }
}

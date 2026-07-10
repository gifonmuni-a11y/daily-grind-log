export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let text;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    text = body?.text || '';
  } catch (e) {
    return res.status(400).json({ error: 'Body tidak valid.' });
  }

  if (!text.trim()) return res.status(400).json({ error: 'Teks kosong.' });

  // Inisialisasi kredensial proyek Supabase kamu secara langsung
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVla2VpeHZ2cnNweWd1YXdxbW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDg1NDcsImV4cCI6MjA5ODM4NDU0N30.dtCY8398z_1MltxLqlTHqAjlL_pXnizCJlckUzLiRmE";
  const SUPABASE_URL = "https://eekeixvvrspyguawqmnl.supabase.co";

  try {
    // Mengambil API key ElevenLabs langsung via REST API resmi Supabase
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/secrets?key_name=eq.elevenlabs&select=key_value`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!supabaseResponse.ok) throw new Error('Gagal mengambil key dari Supabase');
    
    const secretsData = await supabaseResponse.json();
    if (!secretsData || secretsData.length === 0) {
      throw new Error('Key elevenlabs tidak ditemukan di database');
    }

    const apiKey = secretsData[0].key_value;
    const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Model suara Rachel premium

    // Kirim data teks ke ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.75 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs Error: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audioBuffer);
  } catch (err) {
    return res.status(500).json({ error: 'Gagal generate suara: ' + err.message });
  }
}

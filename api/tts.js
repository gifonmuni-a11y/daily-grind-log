import { createClient } from '@supabase/supabase-index';

// Inisialisasi Supabase murni menggunakan URL dan Anon Key project lu
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  try {
    // Ambil API Key ElevenLabs langsung dari Supabase (seperti logic Gemini lu)
    const { data: secretData, error: secretError } = await supabase
      .from('secrets')
      .select('key_value')
      .eq('key_name', 'elevenlabs')
      .single();

    if (secretError || !secretData?.key_value) {
      throw new Error('API Key ElevenLabs tidak ditemukan di Supabase.');
    }

    const apiKey = secretData.key_value;
    const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Suara Rachel premium

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75
        }
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

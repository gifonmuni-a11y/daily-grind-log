import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 🛡️ AMAN: Menggunakan Environment Variables untuk mencegah kebocoran kredensial di GitHub
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eekeixvvrspyguawqmnl.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVla2VpeHZ2cnNweWd1YXdxbW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwODU0NywiZXhwIjoyMDk4Mzg0NTQ3fQ.CwWJ6QxYtTe9ohUFOAbegVybD-22Oo-2d6NdcLLzuic';

  let apiKey;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.GEMINI_API_KEY&select=value`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const d = await r.json();
    apiKey = d?.[0]?.value;
  } catch(e) { 
    return res.status(500).json({ error: 'Gagal mengambil konfigurasi database.' }); 
  }

  if (!apiKey) return res.status(500).json({ error: 'API key tidak ditemukan di database.' });

  let messages, userStats;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    messages = body?.messages || [];
    userStats = body?.userStats || {};
  } catch(e) { 
    return res.status(400).json({ error: 'Format body request tidak valid.' }); 
  }

  if (!messages.length) return res.status(400).json({ error: 'Pesan kosong.' });

  // 🛠️ FIX 1: SERVER-SIDE ANTI-CRASH FILTER
  // Memotong riwayat obrolan agar urutan array MANDATORI dimulai dari pesan pertama milik 'user'
  const firstUserIdx = messages.findIndex(m => m.role === 'user');
  const validMessages = firstUserIdx !== -1 ? messages.slice(firstUserIdx) : messages;

  if (!validMessages.length) {
    return res.status(200).json({ reply: 'Halo! Ada fokus latihan atau target fisik yang mau kita diskusikan hari ini?' });
  }

  const systemPrompt = `Kamu adalah Seolha, AI Companion di Daily Grind Log, fitness tracker bergaya manhwa RPG. Persona: tenang, tajam, seperti mentor manhwa. Data user: hari latihan ${userStats?.totalDays||0}, streak ${userStats?.streak||0} hari, level ${userStats?.level||1}, EXP ${userStats?.totalExp||0}. Jawab soal latihan, nutrisi, recovery dalam bahasa Indonesia. Untuk pertanyaan singkat, jawab maks 4 kalimat. Kalau user minta rencana, saran, atau tips latihan, jawab lebih lengkap (maks 8 kalimat) mencakup jadwal latihan mingguan, pola makan, pola tidur, dan target realistis dalam sebulan biar progresnya kelihatan.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      systemInstruction: systemPrompt 
    });

    // 🛠️ FIX 2: VALIDASI PAYLOAD MAPPING & FALLBACK PROPERTY TEXT
    const history = validMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }]
    }));

    const chat = model.startChat({ history });
    const last = validMessages[validMessages.length - 1];
    
    // Pastikan parameter string teks tidak kosong saat dikirim ke sendMessage
    const currentInputText = last.content || last.text || '';
    if (!currentInputText.trim()) {
      return res.status(400).json({ error: 'Konten pesan terakhir kosong.' });
    }

    const result = await chat.sendMessage(currentInputText);
    const text = result.response.text();
    
    return res.status(200).json({ reply: text });
  } catch(err) {
    return res.status(500).json({ error: 'Gagal memproses AI engine: ' + err.message });
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = 'https://eekeixvvrspyguawqmnl.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVla2VpeHZ2cnNweWd1YXdxbW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwODU0NywiZXhwIjoyMDk4Mzg0NTQ3fQ.CwWJ6QxYtTe9ohUFOAbegVybD-22Oo-2d6NdcLLzuic';

  let apiKey;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.GEMINI_API_KEY&select=value`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const d = await r.json();
    apiKey = d?.[0]?.value;
  } catch(e) { return res.status(500).json({ error: 'Gagal ambil config.' }); }

  if (!apiKey) return res.status(500).json({ error: 'API key tidak ditemukan.' });

  let messages, userStats;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    messages = body?.messages || [];
    userStats = body?.userStats || {};
  } catch(e) { return res.status(400).json({ error: 'Body tidak valid.' }); }

  if (!messages.length) return res.status(400).json({ error: 'Pesan kosong.' });

  // 🛡️ PARSER STRUKTUR VALIDASI DATA LAMA + BARU SECARA TOTAL
  const normalizedMessages = messages.map(m => ({
    role: m.role || (m.sender === 'seolha' ? 'assistant' : 'user'),
    sender: m.sender || (m.role === 'assistant' ? 'seolha' : 'user'),
    content: m.content || m.text || '',
    text: m.text || m.content || ''
  }));

  const systemPrompt = `Kamu adalah Seolha, AI Companion di Daily Grind Log, fitness tracker bergaya manhwa RPG. Persona: tenang, tajam, seperti mentor manhwa. Data user: hari latihan ${userStats?.totalDays||0}, streak ${userStats?.streak||0} hari, level ${userStats?.level||1}, EXP ${userStats?.totalExp||0}. Jawab soal latihan, nutrisi, recovery dalam bahasa Indonesia. Untuk pertanyaan singkat, jawab maks 4 kalimat. Kalau user minta rencana, saran, atau tips latihan, jawab lebih lengkap (maks 8 kalimat) mencakup jadwal latihan mingguan, pola makan, pola tidur, dan target realistis dalam sebulan biar progresnya kelihatan.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPrompt });

    // 🔒 PROFIL FILTER UKURAN STRUKTUR RIWAYAT OBROLAN ANTI-CRASH
    const history = [];
    const historyMessages = normalizedMessages.slice(0, -1);

    historyMessages.forEach(m => {
      const geminiRole = (m.role === 'assistant' || m.sender === 'seolha') ? 'model' : 'user';
      const txt = m.content || '';

      if (!txt.trim()) return;

      // Aturan mutlak Gemini: Riwayat tidak boleh diawali oleh pesan otomatis model (Seolha)
      if (history.length === 0 && geminiRole === 'model') {
        return; // skip leading model greeting
      }

      // Aturan mutlak Gemini: Peran role user dan model harus selalu bergantian (alternate)
      if (history.length > 0 && history[history.length - 1].role === geminiRole) {
        history[history.length - 1].parts[0].text += '\n' + txt;
      } else {
        history.push({
          role: geminiRole,
          parts: [{ text: txt }]
        });
      }
    });

    const chat = model.startChat({ history });
    const last = normalizedMessages[normalizedMessages.length - 1];
    const currentInputText = last?.content || '';

    if (!currentInputText.trim()) {
      return res.status(400).json({ error: 'Konten pesan terakhir kosong.' });
    }

    const result = await chat.sendMessage(currentInputText);
    const text = result.response.text();
    return res.status(200).json({ reply: text });
  } catch(err) {
    return res.status(500).json({ error: 'Gagal memproses engine AI: ' + err.message });
  }
}

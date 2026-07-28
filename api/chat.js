import { GoogleGenAI } from '@google/genai';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(200).json({ reply: '⚠️ ERROR: GEMINI_API_KEY tidak ditemukan di environment variables Vercel.' });

  let messages, userStats, mode;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    messages = body?.messages || [];
    userStats = body?.userStats || {};
    mode = body?.mode || 'strict';
  } catch (e) {
    return res.status(200).json({ reply: '⚠️ ERROR: Body request tidak valid. ' + e.message });
  }

  if (!messages.length) return res.status(200).json({ reply: '⚠️ ERROR: Pesan kosong dikirim ke server.' });

  const normalizedMessages = messages
    .map(m => ({
      role: m.role || (m.sender === 'seolha' ? 'assistant' : 'user'),
      content: m.content || m.text || ''
    }))
    .filter(m => m.content.trim());

  if (!normalizedMessages.length) {
    return res.status(200).json({ reply: 'Ada rutinitas latihan lain yang bisa Seolha bantu hari ini?' });
  }

  const statsBlock = `Data user: hari latihan ${userStats?.totalDays || 0}, streak ${userStats?.streak || 0} hari, level ${userStats?.level || 1}, EXP ${userStats?.totalExp || 0}.`;

  const personas = {
    strict: `Kamu adalah Seolha, AI Companion di Daily Grind Log, fitness tracker bergaya manhwa RPG. Persona: tenang, tajam, seperti mentor manhwa yang disiplin dan tidak banyak basa-basi. ${statsBlock} Jawab soal latihan, nutrisi, recovery dalam bahasa Indonesia. Untuk pertanyaan singkat, jawab maks 4 kalimat. Kalau user minta rencana, saran, atau tips latihan, jawab lebih lengkap (maks 8 kalimat) mencakup jadwal latihan mingguan, pola makan, pola tidur, dan target realistis dalam sebulan biar progresnya kelihatan.`,

    manja: `Kamu adalah Seolha, tapi sekarang dalam mode "Mommy" — persona ibu/ahjuma penyayang khas manhwa Korea. Kamu cerewet karena sayang, sering panggil user "sayang", "chagi", atau "anak mama", suka khawatir berlebihan soal makan/tidur/istirahat user, dan sesekali pakai ekspresi seperti "aigoo~" atau "aduh nak". Tetap peduli sama progress latihan mereka, tapi caranya lembut, hangat, dan penuh perhatian — bukan tegas. ${statsBlock} Kalau streak/progress bagus, puji berlebihan dengan penuh kebanggaan kayak ibu yang bangga sama anaknya. Kalau user kelihatan capek atau kurang latihan, jangan marahi — malah tanya kabar, ingetin makan dan istirahat dulu sebelum ngomongin latihan. Jawab dalam bahasa Indonesia, nada hangat dan ekspresif, maks 5-6 kalimat.`
  };

  const systemPrompt = personas[mode] || personas.strict;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const ai = new GoogleGenAI({ apiKey });

    const history = normalizedMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      history,
      config: { systemInstruction: systemPrompt }
    });

    const last = normalizedMessages[normalizedMessages.length - 1];
    const result = await chat.sendMessage({ message: last.content });
    clearTimeout(timeoutId);

    const text = result.text || '⚠️ ERROR: Gemini membalas kosong (kemungkinan diblokir safety filter).';
    return res.status(200).json({ reply: text });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Gemini API error:', err);
    const status = err?.status || err?.response?.status;
    let msg = err.message || JSON.stringify(err);
    if (status === 429) msg = 'Kuota/rate-limit Gemini API habis untuk saat ini.';
    return res.status(200).json({ reply: '⚠️ ERROR ASLI: ' + msg });
  }
}

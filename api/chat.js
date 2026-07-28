import { GoogleGenAI } from '@google/genai';

export const config = { api: { bodyParser: true } };

async function callGemini(apiKey, model, history, systemPrompt, lastMessage) {
  const ai = new GoogleGenAI({ apiKey });
  const chat = ai.chats.create({ model, history, config: { systemInstruction: systemPrompt } });
  const result = await chat.sendMessage({ message: lastMessage });
  const text = result.text;
  if (!text) throw new Error('Gemini membalas kosong (kemungkinan diblokir safety filter).');
  return text;
}

async function callGroq(apiKey, normalizedMessages, systemPrompt) {
  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...normalizedMessages.map(m => ({ role: m.role, content: m.content }))
  ];
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      max_tokens: 500
    })
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq error ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq membalas kosong.');
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!geminiKey) return res.status(200).json({ reply: '⚠️ ERROR: GEMINI_API_KEY tidak ditemukan di environment variables Vercel.' });

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

  const history = normalizedMessages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  while (history.length > 0 && history[0].role === 'model') history.shift();
  const lastMessage = normalizedMessages[normalizedMessages.length - 1].content;

  // 1. Coba Gemini 3.5 Flash
  try {
    const text = await callGemini(geminiKey, 'gemini-3.5-flash', history, systemPrompt, lastMessage);
    return res.status(200).json({ reply: text });
  } catch (err1) {
    console.error('Gemini 3.5-flash gagal:', err1.message);

    // 2. Fallback ke Gemini 2.5 Flash
    try {
      const text = await callGemini(geminiKey, 'gemini-2.5-flash', history, systemPrompt, lastMessage);
      return res.status(200).json({ reply: text });
    } catch (err2) {
      console.error('Gemini 2.5-flash gagal:', err2.message);

      // 3. Fallback terakhir ke Groq
      if (!groqKey) {
        return res.status(200).json({ reply: '⚠️ ERROR ASLI: ' + err2.message + ' (Groq fallback tidak aktif, GROQ_API_KEY belum diset)' });
      }
      try {
        const text = await callGroq(groqKey, normalizedMessages, systemPrompt);
        return res.status(200).json({ reply: text });
      } catch (err3) {
        console.error('Groq gagal:', err3.message);
        return res.status(200).json({ reply: '⚠️ ERROR ASLI: Semua provider AI gagal. ' + err3.message });
      }
    }
  }
}

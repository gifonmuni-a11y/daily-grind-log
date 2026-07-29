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

async function callOpenAICompatible(providerName, baseUrl, apiKey, model, normalizedMessages, systemPrompt, extraHeaders = {}) {
  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...normalizedMessages.map(m => ({ role: m.role, content: m.content }))
  ];
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...extraHeaders
    },
    body: JSON.stringify({ model, messages: chatMessages, max_tokens: 500 })
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`${providerName} error ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${providerName} membalas kosong.`);
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const githubKey = process.env.GITHUB_MODELS_TOKEN;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;

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

  const attempts = [
    { name: 'Gemini 3.5-flash', run: () => callGemini(geminiKey, 'gemini-3.5-flash', history, systemPrompt, lastMessage) },
    { name: 'Gemini 2.5-flash', run: () => callGemini(geminiKey, 'gemini-2.5-flash', history, systemPrompt, lastMessage) },
  ];

  if (groqKey) {
    attempts.push({
      name: 'Groq',
      run: () => callOpenAICompatible('Groq', 'https://api.groq.com/openai/v1/chat/completions', groqKey, 'llama-3.3-70b-versatile', normalizedMessages, systemPrompt)
    });
  }
  if (githubKey) {
    attempts.push({
      name: 'GitHub Models',
      run: () => callOpenAICompatible('GitHub Models', 'https://models.github.ai/inference/chat/completions', githubKey, 'openai/gpt-4.1', normalizedMessages, systemPrompt)
    });
  }
  if (openrouterKey) {
    attempts.push({
      name: 'OpenRouter',
      run: () => callOpenAICompatible('OpenRouter', 'https://openrouter.ai/api/v1/chat/completions', openrouterKey, 'meta-llama/llama-3.3-70b-instruct:free', normalizedMessages, systemPrompt, {
        'HTTP-Referer': 'https://daily-grind-log.vercel.app',
        'X-Title': 'Daily Grind Log - Seolha'
      })
    });
  }
  if (cerebrasKey) {
    attempts.push({
      name: 'Cerebras',
      run: () => callOpenAICompatible('Cerebras', 'https://api.cerebras.ai/v1/chat/completions', cerebrasKey, 'llama-3.3-70b', normalizedMessages, systemPrompt)
    });
  }

  const errors = [];
  for (const attempt of attempts) {
    try {
      const text = await attempt.run();
      return res.status(200).json({ reply: text });
    } catch (err) {
      console.error(`${attempt.name} gagal:`, err.message);
      errors.push(`${attempt.name}: ${err.message}`);
    }
  }

  return res.status(200).json({ reply: '⚠️ ERROR ASLI: Semua provider AI gagal.\n' + errors.join('\n') });
}

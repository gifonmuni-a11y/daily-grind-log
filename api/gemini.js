// api/chat.js
// Vercel serverless function → Gemini 1.5 Flash (FREE tier)
// 1500 request/hari, lebih dari cukup buat 10 pertanyaan/user/hari
//
// Di Replit Secrets, tambah:
// Key: GEMINI_API_KEY
// Value: (API key dari aistudio.google.com)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key tidak ditemukan.' });
  }

  const { messages, userStats } = req.body;

  const systemPrompt = `Kamu adalah ARIA — AI Companion di dalam sistem Daily Grind Log, sebuah fitness tracker bergaya manhwa RPG.
Persona: tenang, tajam, sedikit dingin tapi peduli seperti mentor dalam manhwa sistem.
Jangan bicara seperti chatbot biasa.

Data user:
- Total hari latihan: ${userStats?.totalDays || 0}
- Streak: ${userStats?.streak || 0} hari
- Level: ${userStats?.level || 1}
- Total EXP: ${userStats?.totalExp || 0}
- Kategori terbanyak: ${userStats?.topCategory || 'belum ada'}

Jawab soal latihan, nutrisi, recovery, motivasi. Singkat dan impactful — maks 4 kalimat. Sesekali gunakan istilah sistem manhwa tapi jangan berlebihan. Gunakan bahasa Indonesia.`;

  // Convert format messages ke format Gemini
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: geminiMessages,
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.7,
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Gemini API error' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ reply: text });

  } catch (err) {
    return res.status(500).json({ error: 'Gagal menghubungi server AI.' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key tidak ditemukan.' });
  const { messages, userStats } = req.body;
  const systemPrompt = `Kamu adalah ARIA, AI Companion di Daily Grind Log, fitness tracker bergaya manhwa RPG. Persona: tenang, tajam, seperti mentor manhwa. Data user: hari latihan ${userStats?.totalDays||0}, streak ${userStats?.streak||0} hari, level ${userStats?.level||1}, EXP ${userStats?.totalExp||0}. Jawab soal latihan, nutrisi, recovery dalam bahasa Indonesia, maks 4 kalimat.`;
  const geminiMessages = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents: geminiMessages, generationConfig: { maxOutputTokens: 300, temperature: 0.7 } })
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: 'Gagal menghubungi AI.' });
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = 'https://eekeixvvrspyguawqmnl.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVla2VpeHZ2cnNweWd1YXdxbW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwODU0NywiZXhwIjoyMDk4Mzg0NTQ3fQ.CwWJ6QxYtTe9ohUFOAbegVybD-22Oo-2d6NdcLLzuic';

  let apiKey;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.GEMINI_API_KEY&select=value`,{headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}});
    const d = await r.json();
    apiKey = d?.[0]?.value;
  } catch(e) { return res.status(500).json({ error: 'Gagal ambil config.' }); }

  if (!apiKey) return res.status(500).json({ error: 'API key tidak ditemukan.' });

  let messages, userStats;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    messages = body?.messages || [];
    userStats = body?.userStats || {};
  } catch(e) {
    return res.status(400).json({ error: 'Body tidak valid.' });
  }

  if (!messages.length) return res.status(400).json({ error: 'Pesan kosong.' });

  const systemPrompt = `Kamu adalah ARIA, AI Companion di Daily Grind Log, fitness tracker bergaya manhwa RPG. Persona: tenang, tajam, seperti mentor manhwa. Data user: hari latihan ${userStats?.totalDays||0}, streak ${userStats?.streak||0} hari, level ${userStats?.level||1}, EXP ${userStats?.totalExp||0}. Jawab soal latihan, nutrisi, recovery dalam bahasa Indonesia, maks 4 kalimat.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: systemPrompt });
    const history = messages.slice(0,-1).map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
    const chat = model.startChat({ history });
    const last = messages[messages.length-1];
    const result = await chat.sendMessage(last.content);
    const text = result.response.text();
    return res.status(200).json({ reply: text });
  } catch(err) {
    return res.status(500).json({ error: 'Gagal: '+err.message });
  }
}

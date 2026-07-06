import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const SUPABASE_URL = 'https://eekeixvvrspyguawqmnl.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVla2VpeHZ2cnNweWd1YXdxbW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwODU0NywiZXhwIjoyMDk4Mzg0NTQ3fQ.CwWJ6QxYtTe9ohUFOAbegVybD-22Oo-2d6NdcLLzuic';

  let apiKey;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.GEMINI_API_KEY&select=value`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const d = await r.json();
    apiKey = d?.[0]?.value;
  } catch(e) { return res.status(500).json({ error: 'Config error' }); }

  try {
    const { messages, userStats } = req.body;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash', 
        systemInstruction: `Kamu Seolha, AI fitness log. Data user: ${JSON.stringify(userStats)}.` 
    });
    
    // Filter history supaya user selalu jadi yang pertama
    const history = messages.filter(m => m.content).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    
    const chat = model.startChat({ history: history.slice(0, -1) });
    const result = await chat.sendMessage(history[history.length - 1].parts[0].text);
    return res.status(200).json({ reply: result.response.text() });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

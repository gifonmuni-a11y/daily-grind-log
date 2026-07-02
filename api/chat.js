cat > api/chat.js << 'EOF'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const SUPABASE_URL = 'https://eekeixvvrspyguawqmnl.supabase.co';
  const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVla2VpeHZ2cnNweWd1YXdxbW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwODU0NywiZXhwIjoyMDk4Mzg0NTQ3fQ.CwWJ6QxYtTe9ohUFOAbegVybD-22Oo-2d6NdcLLzuic';
  let apiKey;
  try {
    const configRes = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.GEMINI_API_KEY&select=value`,{headers:{'apikey':SUPABASE_SERVICE_KEY,'Authorization':`Bearer ${SUPABASE_SERVICE_KEY}`}});
    const configData = await configRes.json();
    apiKey = configData?.[0]?.value;
  } catch(e) { return res.status(500).json({ error: 'Gagal mengambil konfigurasi.' }); }
  if (!apiKey) return res.status(500).json({ error: 'API key tidak ditemukan.' });
  const { messages, userStats } = req.body;
  const systemPrompt = `Kamu adalah ARIA, AI Companion di Daily Grind Log, fitness tracker bergaya manhwa RPG. Persona: tenang, tajam, seperti mentor manhwa. Data user: hari latihan ${userStats?.totalDays||0}, streak ${userStats?.streak||0} hari, level ${userStats?.level||1}, EXP ${userStats?.totalExp||0}. Jawab soal latihan, nutrisi, recovery dalam bahasa Indonesia, maks 4 kalimat.`;
  const geminiMessages = messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:geminiMessages,generationConfig:{maxOutputTokens:300,temperature:0.7}})});
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ reply: text });
  } catch(err) { return res.status(500).json({ error: 'Gagal menghubungi AI.' }); }
}
EOF
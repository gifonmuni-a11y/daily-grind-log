import { useState, useRef, useEffect } from 'react';

const FAQ = [
  { q: 'Pemula mulai dari mana?', a: 'Mulai 3x seminggu (push-up, squat, plank), 1 hari istirahat di antaranya. Kuasai teknik dulu 3-4 minggu sebelum nambah beban. Imbangi protein cukup dan tidur 7-8 jam, target konsisten sebulan penuh tanpa bolong.' },
  { q: 'Kardio atau angkat beban?', a: 'Keduanya, gantian — misal Senin/Rabu/Jumat angkat beban, Selasa/Kamis kardio ringan 20-30 menit. Kombinasi ini plus tidur cukup bikin metabolisme dan jantung sama-sama kebentuk dalam sebulan.' },
  { q: 'Berapa lama hasil keliatan?', a: 'Strength naik dalam 2-3 minggu kalau latihan konsisten 3-4x seminggu. Perubahan visual mulai kelihatan minggu 6-8, asal pola makan dan tidur 7-8 jam juga dijaga, bukan cuma latihannya doang.' },
  { q: 'Istirahat berapa hari?', a: 'Minimal 1-2 hari rest per minggu, jangan latihan otot yang sama 2 hari berturut-turut. Otot tumbuh saat istirahat dan tidur — jaga jam tidur konsisten biar progres sebulan gak keganggu.' },
  { q: 'Protein sehari berapa?', a: 'Target 1.6-2.2g per kg berat badan, sebar ke 3-4 waktu makan. Sumber: telur, dada ayam, ikan, tahu, tempe. Konsisten sebulan plus latihan rutin baru kelihatan efeknya.' },
];

function resolveTZ() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
  } catch {
    return 'Asia/Jakarta';
  }
}

function getClock(tz) {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date());
  }
}

function getGreeting(tz) {
  let hour;
  try {
    hour = parseInt(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: tz }).format(new Date()).replace(/\D/g, ''), 10);
  } catch {
    hour = parseInt(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date()).replace(/\D/g, ''), 10);
  }
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  if (hour >= 18 && hour < 22) return 'Selamat malam';
  return 'Selamat tidur';
}

export default function CompanionAI({ userStats, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [energy, setEnergy] = useState(5);
  const [tz] = useState(resolveTZ);
  const [clock, setClock] = useState(() => getClock(tz));
  const [greeting] = useState(() => getGreeting(tz));
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const id = setInterval(() => setClock(getClock(tz)), 30000);
    return () => clearInterval(id);
  }, [tz]);

  const send = async (text) => {
    if (!text.trim() || loading || energy <= 0) return;
    const userMsg = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);
    setEnergy(e => e - 1);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, userStats }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'Error.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Koneksi gagal.' }]);
    } finally {
      setLoading(false);
    }
  };

  const useFaq = (item) => {
    setMessages(prev => [...prev, { role: 'user', content: item.q }, { role: 'assistant', content: item.a }]);
  };

  const F = { fontFamily: "'JetBrains Mono', monospace" };
  const FR = { fontFamily: "'Rajdhani', sans-serif" };
  const FI = { fontFamily: "'Inter', sans-serif" };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#100E16', borderTop: '1px solid #2A2636', borderRadius: '16px 16px 0 0', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #211D2C', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C5CFF', boxShadow: '0 0 8px rgba(124,92,255,0.8)' }} />
            <span style={{ ...FR, fontWeight: 700, fontSize: 15, color: '#EDEAF6' }}>Seolha</span>
            <span style={{ ...F, fontSize: 9, color: '#5C5868', textTransform: 'uppercase', letterSpacing: '0.2em' }}>AI Companion</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ ...F, fontSize: 10, color: '#5C5868' }}>{clock}</span>
            <span style={{ ...F, fontSize: 10, color: energy > 0 ? '#2DD4BF' : '#E0444C' }}>{energy}/5 energi</span>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} type="button"
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9CA3AF', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 9999 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <p style={{ ...F, fontSize: 11, color: '#5C5868', lineHeight: 1.7 }}>{greeting}, Trainer.<br/>Tanya apapun soal latihan, nutrisi, atau recovery.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', background: m.role === 'user' ? 'rgba(124,92,255,0.15)' : '#0A0A0E', border: `1px solid ${m.role === 'user' ? 'rgba(124,92,255,0.3)' : '#211D2C'}`, ...FI, fontSize: 13, color: '#EDEAF6', lineHeight: 1.6 }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px', background: '#0A0A0E', border: '1px solid #211D2C', width: 'fit-content' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C5CFF', animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        <div style={{ padding: '8px 20px', borderTop: '1px solid #211D2C', flexShrink: 0 }}>
          <p style={{ ...F, fontSize: 9, color: '#5C5868', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>FAQ — 0 energi</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {FAQ.map((f, i) => (
              <button key={i} onClick={() => useFaq(f)} style={{ ...F, fontSize: 10, padding: '6px 10px', border: '1px solid #3A3548', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{f.q}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 20px 24px', borderTop: '1px solid #211D2C', display: 'flex', gap: 10, flexShrink: 0 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder={energy > 0 ? 'Tanya Seolha...' : 'Energi habis hari ini.'}
            disabled={energy <= 0 || loading}
            style={{ flex: 1, background: '#0A0A0E', border: '1px solid #211D2C', color: '#EDEAF6', padding: '10px 14px', ...FI, fontSize: 13, outline: 'none' }}/>
          <button onClick={() => send(input)} disabled={energy <= 0 || loading || !input.trim()}
            style={{ width: 42, height: 42, background: energy > 0 && input.trim() ? '#7C5CFF' : '#211D2C', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={energy > 0 && input.trim() ? '#0A0A0E' : '#5C5868'} strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

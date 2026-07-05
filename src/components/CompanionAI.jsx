import { useState, useRef, useEffect } from 'react';
// FIX: Import sistem deteksi tingkat kasta untuk dipahami oleh Seolha
import { getRankTier } from '../lib/expSystem';
import { getTitleTierColor } from '../lib/rankColors';

const FAQ = [
  { q: 'Pemula mulai dari mana?', a: 'Mulai 3x seminggu full body — push-up, squat, plank. Kuasai teknik dulu 3-4 minggu sebelum nambah beban.' },
  { q: 'Kardio atau angkat beban?', a: 'Keduanya. Angkat beban untuk massa dan metabolisme, kardio untuk jantung. Kombinasikan.' },
  { q: 'Berapa lama hasil keliatan?', a: 'Strength naik 2-3 minggu. Perubahan visual mulai 6-8 minggu dengan konsistensi dan nutrisi yang bener.' },
  { q: 'Istirahat berapa hari?', a: 'Minimal 1-2 hari rest per minggu. Otot tumbuh saat istirahat, bukan saat latihan.' },
  { q: 'Protein sehari berapa?', a: 'Target 1.6-2.2g per kg berat badan. Sumber: telur, dada ayam, ikan, tahu, tempe.' },
];

const DAILY_QUOTES = [
  'Mulai hari dengan gerakan. Satu sesi kecil lebih baik dari nol.',
  'Konsistensi mengalahkan intensitas. Hadir tiap hari lebih penting dari sekali habis-habisan.',
  'Tubuh lo beradaptasi dari apa yang lo lakukan berulang. Bukan dari apa yang lo lakukan sekali.',
  'Progress bukan garis lurus. Naik turun itu normal, yang penting tetap bergerak.',
  'Recovery bukan kelemahan. Tidur dan istirahat adalah bagian dari program.',
  'Makan yang bener itu 70% dari hasilnya. Latihan keras tapi makan sembarangan hasilnya lambat.',
  'Satu set lebih baik dari tidak sama sekali. Jangan tunggu mood sempurna.',
  'Bandingkan diri lo sama lo kemarin, bukan sama orang lain.',
  'Otot tumbuh saat istirahat, bukan saat latihan. Tidur 7-8 jam itu wajib.',
  'Teknik yang bener lebih penting dari beban yang berat. Ego lifting bikin cedera.',
  'Dehidrasi nurunin performa 10-20%. Minum air sebelum haus.',
  'Warm up bukan buang waktu. Itu investasi biar sesi latihan lo lebih efektif.',
  'Kalau lo nunggu motivasi, lo gak akan pernah mulai. Disiplin yang ngerjain sisanya.',
  'Setiap rep yang lo selesaikan saat capek itu yang bikin lo lebih kuat.',
  'Form dulu, berat belakangan. Selalu.',
  'Jangan skip leg day. Otot kaki itu engine terbesar di tubuh lo.',
  'Compound movement dulu — squat, deadlift, bench, pull-up — sebelum isolasi.',
  'Progressive overload: nambah sedikit tiap minggu. Itu kuncinya.',
  'Kalau sesi kemarin berat banget, itu tanda lo butuh deload, bukan push harder.',
  'Satu kebiasaan kecil yang konsisten ngalahin program bagus yang gak dijalanin.',
  'Rest day itu aktif recovery — jalan kaki, stretching, mobilitas. Bukan rebahan total.',
  'Catat progress lo. Yang diukur yang berkembang.',
  'Jangan cuma fokus ke berat badan. Foto, ukuran, dan kekuatan lebih jujur.',
  'Pre-workout terbaik? Tidur cukup dan makan yang bener.',
  'Otot lo gak bisa tumbuh kalau lo terus menerus di deficit kalori terlalu dalam.',
  'Stretching setelah latihan bukan cuma buat fleksibilitas — itu bantu recovery.',
  'Kalau lo bisa ngobrol normal sambil "cardio", intensitasnya kurang.',
  'Muscle soreness bukan indikator latihan yang bagus. Tanda overtraining juga bisa sama.',
  'Set goal yang spesifik. Bukan "mau kurus", tapi "mau push-up 20 reps dalam 8 minggu".',
  'Paling susah itu bukan latihannya — tapi keluar pintu dan mulai.',
];

function getQuoteOfDay() {
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_QUOTES.length;
  return DAILY_QUOTES[dayIndex];
}

function getGreeting() {
  const wib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const hour = wib.getHours();
  const pad = n => String(n).padStart(2, '0');
  const timeStr = pad(hour) + ':' + pad(wib.getMinutes()) + ' WIB';
  let salam;
  if (hour >= 4 && hour < 11) salam = 'Selamat pagi';
  else if (hour >= 11 && hour < 15) salam = 'Selamat siang';
  else if (hour >= 15 && hour < 18) salam = 'Selamat sore';
  else if (hour >= 18 && hour < 22) salam = 'Selamat malam';
  else salam = 'Selamat tidur';
  return { salam, timeStr, quote: getQuoteOfDay() };
}

export default function CompanionAI({ userStats, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [energy, setEnergy] = useState(5);
  const bottomRef = useRef(null);
  const { salam, timeStr, quote } = getGreeting();

  // FIX: Kalkulasi nama kasta user secara real-time berdasarkan level saat ini
  const userTierName = getRankTier(userStats?.level || 1);
  const userTierColor = getTitleTierColor(userTierName);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    window.history.pushState({ companion: true }, '');
    const handlePop = () => onClose();
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [onClose]);

  const handleClose = () => {
    if (window.history.state && window.history.state.companion) {
      window.history.back();
    } else {
      onClose();
    }
  };

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
    setMessages(prev => [...prev,
      { role: 'user', content: item.q },
      { role: 'assistant', content: item.a }
    ]);
  };

  const F = { fontFamily: "'JetBrains Mono', monospace" };
  const FR = { fontFamily: "'Rajdhani', sans-serif" };
  const FI = { fontFamily: "'Inter', sans-serif" };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        WebkitBackdropFilter: 'blur(6px)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#100E16',
          borderTop: '2px solid #2A2636',
          borderRadius: '16px 16px 0 0',
          height: '82vh',
          display: 'flex', flexDirection: 'column',
          position: 'relative',
          zIndex: 10000,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #211D2C', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C5CFF', boxShadow: '0 0 8px rgba(124,92,255,0.8)' }} />
            <span style={{ ...FR, fontWeight: 700, fontSize: 15, color: '#EDEAF6' }}>Seolha</span>
            <span style={{ ...F, fontSize: 9, color: '#5C5868', textTransform: 'uppercase', letterSpacing: '0.2em' }}>AI Companion</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ ...F, fontSize: 10, color: energy > 0 ? '#2DD4BF' : '#E0444C' }}>{energy}/5 energi</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              style={{
                background: '#2A2636',
                border: '1px solid #3A3548',
                color: '#EDEAF6',
                cursor: 'pointer',
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                zIndex: 10001,
                position: 'relative',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ background: '#0A0A0E', border: '1px solid #211D2C', padding: '14px 16px', marginBottom: 4 }}>
              <p style={{ ...F, fontSize: 10, color: '#7C5CFF', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 6px' }}>{timeStr}</p>
              {/* FIX: Seolha sekarang menyapa user sesuai nama kasta terkininya dengan warna dinamis */}
              <p style={{ ...FR, fontWeight: 700, fontSize: 17, color: '#EDEAF6', margin: '0 0 8px' }}>
                {salam}, <span style={{ color: userTierColor }}>{userTierName}</span>.
              </p>
              <p style={{ ...FI, fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, margin: 0 }}>{quote}</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px',
                background: m.role === 'user' ? 'rgba(124,92,255,0.15)' : '#0A0A0E',
                border: '1px solid ' + (m.role === 'user' ? 'rgba(124,92,255,0.3)' : '#211D2C'),
                ...FI, fontSize: 13, color: '#EDEAF6', lineHeight: 1.6,
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px', background: '#0A0A0E', border: '1px solid #211D2C', width: 'fit-content' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C5CFF', animation: 'pulse 1.2s ease-in-out ' + (i*0.2) + 's infinite' }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '8px 20px', borderTop: '1px solid #211D2C', flexShrink: 0 }}>
          <p style={{ ...F, fontSize: 9, color: '#5C5868', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>FAQ — 0 energi</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {FAQ.map((f, i) => (
              <button key={i} onClick={() => useFaq(f)}
                style={{ ...F, fontSize: 10, padding: '6px 10px', border: '1px solid #3A3548', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
                {f.q}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 20px 28px', borderTop: '1px solid #211D2C', display: 'flex', gap: 10, flexShrink: 0 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder={energy > 0 ? 'Tanya Seolha...' : 'Energi habis hari ini.'}
            disabled={energy <= 0 || loading}
            style={{ flex: 1, background: '#0A0A0E', border: '1px solid #211D2C', color: '#EDEAF6', padding: '10px 14px', ...FI, fontSize: 13, outline: 'none', borderRadius: 0 }}
          />
          <button
            onClick={() => send(input)}
            disabled={energy <= 0 || loading || !input.trim()}
            style={{ width: 44, height: 44, background: energy > 0 && input.trim() ? '#7C5CFF' : '#211D2C', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={energy > 0 && input.trim() ? '#0A0A0E' : '#5C5868'} strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

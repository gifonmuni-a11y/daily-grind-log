import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, Battery } from 'lucide-react';

export default function CompanionAI({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Halo! Saya Companion AI asisten RPG Grind kamu. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const chatEndRef = useRef(null);

  const STORAGE_KEY_COUNT = `gemini_chat_count_${userId || 'guest'}`;
  const STORAGE_KEY_DATE = `gemini_chat_date_${userId || 'guest'}`;

  // 10 PERTANYAAN MANFAAT & PALING DIBUTUHKAN PEMULA (Riset Otot & Fitness)
  const faqList = [
    {
      label: "💪 Pemula Mulai Dari Mana?",
      q: "Bagaimana cara mulai latihan untuk pemula biar tidak bingung?",
      a: "Mulai dengan latihan beban tubuh (bodyweight) seperti Push-up, Squat, dan Lunges 3x seminggu. Fokus kuasai tekniknya dulu selama 2-4 minggu sebelum menambah beban berat, agar otot terlatih dan terhindar dari cedera."
    },
    {
      label: "🔥 Bagus Kardio atau Angkat Beban?",
      q: "Lebih baik latihan kardio dulu atau angkat beban dulu untuk pemula?",
      a: "Lakukan angkat beban terlebih dahulu saat energimu masih penuh, baru tutup dengan kardio (seperti jalan cepat atau sepeda) selama 15-20 menit. Ini cara terbaik untuk membakar lemak sekaligus mempertahankan massa otot."
    },
    {
      label: "🥚 Butuh Protein Berapa Banyak?",
      q: "Berapa banyak protein yang harus saya makan setiap hari?",
      a: "Idealnya pemula membutuhkan sekitar 1.2 hingga 2 gram protein per kilogram berat badanmu setiap hari. Sumber terbaiknya bisa dari dada ayam, telur, tahu, tempe, daging sapi, atau ikan."
    },
    {
      label: "🛌 Aturan Istirahat (Recovery)",
      q: "Apakah otot tumbuh saat kita latihan atau saat istirahat?",
      a: "Otot justru rusak saat kamu latihan, dan tumbuh menjadi lebih kuat saat kamu ISTIRAHAT dan TIDUR (7-8 jam). Jangan melatih otot yang sama 2 hari berturut-turut, beri jeda minimal 48 jam untuk pemulihan."
    },
    {
      label: "📈 Cara Mengatasi Otot Pegal (DOMS)",
      q: "Kenapa badan saya pegal-pegal parah setelah pertama kali latihan?",
      a: "Itu dinamakan DOMS (Delayed Onset Muscle Soreness) dan sangat normal bagi pemula karena otot beradaptasi. Cara mengatasinya: tetap aktif bergerak ringan (jalan santai), minum air putih yang cukup, lakukan stretching, dan mandi air hangat."
    },
    {
      label: "⏱️ Berapa Lama Durasi Latihan?",
      q: "Berapa lama durasi latihan gym atau workout yang ideal?",
      a: "Durasi ideal adalah 45 hingga 60 menit saja per sesi. Latihan lebih dari 90 menit tidak disarankan karena tubuh akan kelelahan, menurunkan fokus teknik, dan memicu hormon stres (kortisol) yang bisa mengikis otot."
    },
    {
      label: "🥛 Suplemen yang Wajib?",
      q: "Apakah pemula wajib minum susu Whey Protein atau Creatine?",
      a: "Tidak wajib. Suplemen sifatnya hanya pembantu. Prioritaskan dulu makanan asli (telur, ayam, nasi). Jika makanan harianmu kurang protein, baru dibantu Whey. Untuk penambah tenaga, Creatine bisa dipertimbangkan nanti setelah 3 bulan konsisten."
    },
    {
      label: "🥗 Makan Sebelum vs Sesudah Workout",
      q: "Lebih penting makan sebelum workout atau sesudah workout?",
      a: "Keduanya penting! Makan karbohidrat kompleks (seperti pisang/roti) 1-2 jam SEBELUM latihan untuk sumber energi. Makan protein + karbohidrat (seperti nasi + ayam) maksimal 2 jam SESUDAH latihan untuk memperbaiki jaringan otot."
    },
    {
      label: "⚖️ Turun BB vs Bentuk Otot",
      q: "Bisa tidak menurunkan berat badan sekaligus membentuk otot?",
      a: "Bisa, proses ini disebut Body Recomposition. Caranya: lakukan defisit kalori tipis (kurangi porsi makan sedikit), tetap angkat beban dengan intensitas tinggi, dan pastikan asupan protein harianmu terpenuhi dengan sangat ketat."
    },
    {
      label: "🛑 Kapan Harus Rest Day?",
      q: "Berapa hari dalam seminggu saya harus libur latihan?",
      a: "Ambil libur (Rest Day) sebanyak 2-3 hari dalam seminggu. Contoh jadwal populer untuk pemula adalah Senin-Rabu-Jumat latihan, sedangkan Selasa-Kamis-Sabtu-Minggu digunakan untuk istirahat total atau aktif recovery."
    }
  ];

  // Mengatur dan mengecek limit harian 5x lewat localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem(STORAGE_KEY_DATE);
    const savedCount = localStorage.getItem(STORAGE_KEY_COUNT);

    if (savedDate !== today) {
      localStorage.setItem(STORAGE_KEY_DATE, today);
      localStorage.setItem(STORAGE_KEY_COUNT, '0');
      setChatCount(0);
    } else if (savedCount) {
      setChatCount(parseInt(savedCount, 10));
    }
  }, [userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Fitur FAQ Terbimbing (0 Token / Gratis)
  const handleFAQ = (question, answer) => {
    setMessages(prev => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: answer }
    ]);
  };

  // Fitur Custom Chat AI (Limit 5x Sehari)
  const handleSendCustomChat = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    if (chatCount >= 5) {
      setMessages(prev => [
        ...prev,
        { role: 'user', text: input.trim() },
        { role: 'assistant', text: '⚠️ [SYSTEM]: Energi AI kamu habis hari ini. Silakan kembali besok!' }
      ]);
      setInput('');
      return;
    }

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      // Mengirim chat ke Serverless Function internal kita sendiri di Vercel
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Kamu adalah asisten kebugaran & RPG game bernama Companion AI di aplikasi Daily Grind Log. Jawab dengan singkat, padat, penuh motivasi, dan gunakan gaya bahasa santai/gamer. Pertanyaan: ${userText}` }] }]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || data.error);
      }

      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, sistem AI sedang mengalami gangguan koneksi.';

      setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
      
      const newCount = chatCount + 1;
      setChatCount(newCount);
      localStorage.setItem(STORAGE_KEY_COUNT, newCount.toString());

    } catch (error) {
      console.error("Detail Eror AI:", error);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', text: `❌ ${error.message || 'Gagal terhubung ke inti AI.'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tombol Floating */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-accent text-white rounded-full shadow-[0_0_15px_#7C5CFFaa] hover:scale-105 transition-transform z-50 flex items-center justify-center"
        style={{ backgroundColor: '#7C5CFF' }}
      >
        <Bot size={24} />
      </button>

      {/* Modal Popup Chat Box */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#100E16] border border-[#211D2C] flex flex-col h-[500px] shadow-2xl animate-fade-in rounded-lg overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-3 border-b border-[#211D2C] bg-[#1a1625] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#7C5CFF]" />
                <span className="font-display font-bold tracking-wide text-sm text-[#EDEAF6]">COMPANION AI ASSISTANT</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 font-mono text-xs text-gray-400 bg-black/40 px-2 py-0.5 border border-[#211D2C]">
                  <Battery size={12} className={chatCount >= 5 ? 'text-red-500' : 'text-green-400'} />
                  <span>ENERGY: {5 - chatCount}/5</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Area Chat */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs bg-[#0C0A10]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-2.5 rounded border ${
                    msg.role === 'user' 
                      ? 'bg-[#211D2C] border-[#7C5CFF]/30 text-[#EDEAF6]' 
                      : 'bg-[#16121e] border-[#211D2C] text-gray-300'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#16121e] border border-[#211D2C] p-2.5 text-gray-400 animate-pulse">
                    ⚡ Membaca cetak biru otot...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Menu Slider 10 Pertanyaan Terbimbing */}
            <div className="p-2 bg-[#120F1A] border-t border-[#211D2C]">
              <div className="text-[10px] text-gray-500 font-mono mb-1 px-1 tracking-wider uppercase">💡 FAQ Pemula (0 Energi):</div>
              <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
                {faqList.map((faq, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleFAQ(faq.q, faq.a)}
                    className="bg-[#1C1829] border border-[#2D273E] text-gray-300 px-2.5 py-1 text-[11px] rounded hover:text-white hover:border-[#7C5CFF] transition-all flex-shrink-0"
                  >
                    {faq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Input Chat */}
            <form onSubmit={handleSendCustomChat} className="p-2 border-t border-[#211D2C] flex gap-2 bg-[#100E16]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={chatCount >= 5 || loading}
                placeholder={chatCount >= 5 ? "Energi AI habis..." : "Tanya bebas ke AI (Maks 5x/hari)..."}
                className="flex-1 bg-[#16121e] border border-[#211D2C] text-[#EDEAF6] px-3 py-2 text-xs focus:outline-none focus:border-[#7C5CFF] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={chatCount >= 5 || loading || !input.trim()}
                className="bg-[#7C5CFF] text-white p-2 border border-[#7C5CFF] hover:bg-[#6b4ee0] disabled:opacity-40 transition-colors"
              >
                <Send size={14} />
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}

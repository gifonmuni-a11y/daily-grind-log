import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2, Award, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getRankTier } from '../lib/expSystem'

// DATA POOL LEGENDA INDONESIA & DUNIA (MISI DINAMIS HARIAN)
const LEGENDARY_QUESTS = [
  {
    name: 'ADE RAI',
    title: 'Kasta: Master Fitness Indonesia',
    quote: 'Kesehatan dan otot kuat bukan tujuan utama, melainkan modal dasar paling berharga untuk mencapai semua impian raksasamu.',
    mission: 'Latihan beban intens & jaga porsi makan hari ini tanpa jebol.',
    bonus: 50
  },
  {
    name: 'ARNOLD SCHWARZENEGGER',
    title: 'Kasta: Dewa Bodybuilding Dunia',
    quote: 'Satu-satunya cara untuk meruntuhkan batasan fisikmu adalah dengan terus menembus rasa sakit itu tanpa rasa takut.',
    mission: 'Tambah repetisi atau beban melebihi batas nyaman biasanya hari ini.',
    bonus: 50
  },
  {
    name: 'DAVID GOGGINS',
    title: 'Kasta: Manusia Mental Baja',
    quote: 'Saat pikiranmu berkata sudah selesai, sebenarnya fisikmu baru menggunakan 40 persen kekuatan aslinya. Tetap keras!',
    mission: 'Selesaikan sesi latihan penuh hari ini tanpa menyerah di tengah jalan.',
    bonus: 50
  },
  {
    name: 'DEDDY CORBUZIER',
    title: 'Kasta: Mentor Ketangguhan Mental',
    quote: 'Rasa malas itu bukan kepribadian, itu cuma alasan dari mental yang lemah. Bangun sekarang dan paksa dirimu ke medan latihan!',
    mission: 'Jangan tunda jam latihan, eksekusi log tepat waktu hari ini.',
    bonus: 50
  },
  {
    name: 'CRISTIANO RONALDO',
    title: 'Kasta: Raja Kedisiplinan Mutlak',
    quote: 'Bakat tanpa kerja keras jangka panjang tidak akan pernah berarti apa-apa di panggung tertinggi dunia.',
    mission: 'Fokus penuh pada konsistensi gerakan dan ketepatan form eksekusi.',
    bonus: 50
  },
  {
    name: 'DENNY SUMARGO',
    title: 'Kasta: Pebasket & Mentalitas Juara',
    quote: 'Kemenangan sejati didapatkan saat kamu berhasil mengalahkan rasa ingin menyerah yang berisik di dalam kepalamu sendiri.',
    mission: 'Lawan rasa mager, lakukan minimal 15 menit conditioning harian.',
    bonus: 50
  },
  {
    name: 'DWAYNE JOHNSON (THE ROCK)',
    title: 'Kasta: Monster Konsistensi',
    quote: 'Sukses bukan tentang menjadi yang paling hebat dalam semalam, tapi tentang konsistensi kerja keras berdarah-darah setiap hari.',
    mission: 'Pertahankan dan amankan grafik streak harianmu jangan sampai pecah.',
    bonus: 50
  },
  {
    name: 'BUNG KARNO',
    title: 'Kasta: Proklamator & Pemantik Jiwa',
    quote: 'Gantungkan cita-cita latihanmu setinggi langit! Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.',
    mission: 'Set target log mingguan tertinggi dan catat sesi dengan performa terbaik.',
    bonus: 50
  }
]

export default function CompanionAI({ userStats, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyCount, setDailyCount] = useState(0)
  const messagesEndRef = useRef(null)

  const currentTier = getRankTier(userStats?.level || 1)

  // LOGIKA AMBIL QUEST LEGENDA BERDASARKAN TANGGAL HARI INI (OTOMATIS ROTASI)
  const getDailyLegendQuest = () => {
    const dayIndex = new Date().getDate() % LEGENDARY_QUESTS.length
    return LEGENDARY_QUESTS[dayIndex]
  }
  const currentLegend = getDailyLegendQuest()

  // GREETING SINKRON JAM 6 SORE KE ATAS = SELAMAT MALAM
  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr >= 5 && hr < 11) return 'Selamat pagi'
    if (hr >= 11 && hr < 15) return 'Selamat siang'
    if (hr >= 15 && hr < 18) return 'Selamat sore'
    return 'Selamat malam'
  }

  useEffect(() => {
    setMessages([
      { 
        sender: 'seolha', 
        text: `${getGreeting()}, ${currentTier}. Paling susah itu bukan latihannya — tapi keluar pintu dan mulai.` 
      }
    ])
    fetchDailyLimit()
  }, [currentTier])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchDailyLimit = async () => {
    try {
      const d = new Date()
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('ai_usage')
        .select('count')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single()

      if (data) setDailyCount(data.count)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSend = async (e, customMsg = null, isFaq = false) => {
    if (e) e.preventDefault()
    const msgToSend = customMsg || input
    if (!msgToSend.trim() || loading) return

    if (!isFaq && dailyCount >= 5) {
      setMessages(prev => [...prev, 
        { sender: 'user', text: msgToSend },
        { sender: 'seolha', text: 'Energi aku sudah habis untuk hari ini (Batas 5 pertanyaan telah tercapai). Kita obrol lagi besok ya!' }
      ])
      if (!customMsg) setInput('')
      return
    }

    const newMessages = [...messages, { sender: 'user', text: msgToSend }]
    if (!customMsg) setInput('')
    setMessages(newMessages)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const formattedHistory = newMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: formattedHistory,
          userStats: userStats
        })
      })

      if (response.ok) {
        const resData = await response.json()
        const replyText = resData.reply || 'Maaf, sinyal pikiran aku terganggu.'
        setMessages(prev => [...prev, { sender: 'seolha', text: replyText }])
        
        if (!isFaq) {
          setDailyCount(prev => prev + 1)
        }
      } else {
        setMessages(prev => [...prev, { sender: 'seolha', text: 'Gagal mendapatkan respon dari engine chat.' }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'seolha', text: 'Koneksi ke Seolha terputus.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md p-4 max-w-lg mx-auto select-none">
      
      {/* HEADER CHAT ASSISTANT */}
      <div className="flex items-center justify-between pb-3 border-b border-[#211D2C]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-display font-bold text-text-high tracking-wider">Seolha</span>
          <span className="font-mono text-[10px] text-text-dim uppercase">AI Companion</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-accent">{5 - dailyCount}/5 energi</span>
          <button onClick={onClose} className="p-1 hover:bg-border-hover rounded text-text-dim transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* WIDGET TEMPAT KHUSUS: DAILY EVENT QUEST DARI PARA LEGENDA (TERPISAH SEOLHA) */}
      <div className="mt-3 mx-0.5 p-3 bg-[#110F18] border border-amber-500/40 relative overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.05)]">
        <div className="absolute top-0 right-0 bg-amber-500 text-black font-mono text-[8px] font-black px-2 py-0.5 uppercase tracking-widest">
          EVENT QUEST
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <Award size={12} className="text-amber-400" />
          <span className="font-display font-black text-xs text-amber-400 tracking-wide uppercase">
            {currentLegend.name} <span className="text-text-dim font-mono text-[10px] lowercase font-normal">({currentLegend.title})</span>
          </span>
        </div>
        <p className="font-body text-xs text-text-high italic leading-relaxed bg-[#0A0A0E]/50 p-2 border border-[#211D2C]/40">
          "{currentLegend.quote}"
        </p>
        <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-text-dim border-t border-[#211D2C]/50 pt-2">
          <span className="truncate pr-4 text-[#EDEAF6]">🎯 Target Misi: {currentLegend.mission}</span>
          <span className="text-amber-400 font-bold shrink-0">+{currentLegend.bonus} EXP</span>
        </div>
      </div>

      {/* WINDOW LAYAR UTAMA RENDER CHAT */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 font-body text-sm leading-relaxed ${m.sender === 'user' ? 'bg-accent text-white rounded-tl-xl rounded-tr-xl rounded-bl-xl' : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6] rounded-tl-xl rounded-tr-xl rounded-br-xl'}`}>
              {m.sender === 'seolha' && (
                <div className="font-mono text-[10px] text-accent font-bold uppercase mb-1 flex items-center gap-1">
                  <Bot size={10} /> SEOLHA
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#100E16] border border-[#211D2C] p-3 rounded-xl flex items-center gap-2 font-mono text-xs text-text-dim">
              <Loader2 size={12} className="animate-spin text-accent" />
              Seolha sedang berpikir...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* PANEL PERTANYAAN FAQ - 0 ENERGI */}
      <div className="mb-2 bg-background pt-2">
        <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-1.5">FAQ — 0 ENERGI</div>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => handleSend(null, 'Pemula mulai dari mana?', true)}
            disabled={loading}
            className="flex-1 text-left text-xs px-3 py-2 bg-[#100E16] border border-[#211D2C] text-text-high font-body hover:border-accent transition-colors truncate"
          >
            Pemula mulai dari mana?
          </button>
          <button 
            type="button" 
            onClick={() => handleSend(null, 'Kardio atau angkat beban?', true)}
            disabled={loading}
            className="flex-1 text-left text-xs px-3 py-2 bg-[#100E16] border border-[#211D2C] text-text-high font-body hover:border-accent transition-colors truncate"
          >
            Kardio atau angkat beban?
          </button>
        </div>
      </div>

      {/* FIELD INPUT CHAT BOX */}
      <form onSubmit={(e) => handleSend(e)} className="pt-2 border-t border-[#211D2C] flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya Seolha..." className="flex-1 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2.5 text-sm text-text-high focus:outline-none focus:border-accent" />
        <button type="submit" disabled={loading || !input.trim()} className="w-11 h-11 bg-accent flex items-center justify-center text-white disabled:opacity-40"><Send size={16} /></button>
      </form>
    </div>
  )
}

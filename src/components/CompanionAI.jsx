import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2, Quote, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getRankTier } from '../lib/expSystem'

const LEGENDARY_QUOTES = [
  {
    id: 'legend_1',
    name: 'ADE RAI',
    quote: 'Kesehatan dan otot kuat bukan tujuan utama, melainkan modal dasar paling berharga untuk mencapai semua impian raksasamu.',
    mission: 'Latihan beban intens & jaga porsi makan hari ini tanpa jebol.'
  },
  {
    id: 'legend_2',
    name: 'ARNOLD SCHWARZENEGGER',
    quote: 'Satu-satunya cara untuk meruntuhkan batasan fisikmu adalah dengan terus menembus rasa sakit itu tanpa rasa takut.',
    mission: 'Tambah repetisi atau beban melebihi batas nyaman biasanya hari ini.'
  },
  {
    id: 'legend_3',
    name: 'DAVID GOGGINS',
    quote: 'Saat pikiranmu berkata sudah selesai, sebenarnya fisikmu baru menggunakan 40 persen kekuatan aslinya. Tetap keras!',
    mission: 'Selesaikan sesi latihan penuh hari ini tanpa menyerah di tengah jalan.'
  },
  {
    id: 'legend_4',
    name: 'DEDDY CORBUZIER',
    quote: 'Rasa malas itu bukan kepribadian, itu cuma alasan dari mental yang lemah. Bangun sekarang dan paksa dirimu ke medan latihan!',
    mission: 'Jangan tunda jam latihan, eksekusi log tepat waktu hari ini.'
  },
  {
    id: 'legend_5',
    name: 'CRISTIANO RONALDO',
    quote: 'Bakat tanpa kerja keras jangka panjang tidak akan pernah berarti apa-apa di panggung tertinggi dunia.',
    mission: 'Fokus penuh pada konsistensi gerakan dan ketepatan form eksekusi.'
  },
  {
    id: 'legend_6',
    name: 'DENNY SUMARGO',
    quote: 'Kemenangan sejati didapatkan saat kamu berhasil mengalahkan rasa ingin menyerah yang berisik di dalam kepalamu sendiri.',
    mission: 'Lawan rasa mager, lakukan minimal 15 menit conditioning harian.'
  },
  {
    id: 'legend_7',
    name: 'THE ROCK',
    quote: 'Sukses bukan tentang menjadi yang paling hebat dalam semalam, tapi tentang konsistensi kerja keras berdarah-darah setiap hari.',
    mission: 'Pertahankan dan amankan grafik streak harianmu jangan sampai pecah.'
  },
  {
    id: 'legend_8',
    name: 'BUNG KARNO',
    quote: 'Gantungkan cita-cita latihanmu setinggi langit! Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.',
    mission: 'Set target log mingguan tertinggi dan catat sesi dengan performa terbaik.'
  }
]

export default function CompanionAI({ userStats, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyCount, setDailyCount] = useState(0)
  const [isQuestClaimed, setIsQuestClaimed] = useState(false)
  const [liveTime, setLiveTime] = useState('') // State jam digital harian
  const messagesEndRef = useRef(null)

  const currentTier = getRankTier(userStats?.level || 1)
  
  // LOGIKA JAM DIGITAL AKTIF (DIPERBAHARUI TIAP DETIK)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setLiveTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // REGEX PARSER UNTUK MENGEKSTRAK ID VIDEO YOUTUBE DARI DALAM TEKS CHAT
  const extractYoutubeId = (text) => {
    if (!text) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const matches = text.match(regExp)
    if (matches && matches[2].length === 11) {
      return matches[2]
    }
    // Fallback pencarian url di dalam string paragraf panjang
    const inlineReg = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const inlineMatches = text.match(inlineReg)
    return inlineMatches ? inlineMatches[1] : null
  }

  const getTodayDateStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const getDailyQuote = () => {
    const dayIndex = new Date().getDate() % LEGENDARY_QUOTES.length
    return LEGENDARY_QUOTES[dayIndex]
  }
  const todayQuote = getDailyQuote()

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
    checkQuestPersistence()
  }, [currentTier])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchDailyLimit = async () => {
    try {
      const today = getTodayDateStr()
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

  const checkQuestPersistence = () => {
    const today = getTodayDateStr()
    const savedClaim = localStorage.getItem(`claim_${today}_${todayQuote.id}`)
    if (savedClaim === 'true') {
      setIsQuestClaimed(true)
    }
  }

  const handleClaimLegendQuest = () => {
    if (isQuestClaimed) return
    const today = getTodayDateStr()
    localStorage.setItem(`claim_${today}_${todayQuote.id}`, 'true')
    setIsQuestClaimed(true)
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

    // SINKRONISASI JAWABAN FAQ SECARA LOKAL + LINK EMBED YOUTUBE RELEVAN (0 ENERGI ASLI)
    if (isFaq) {
      window.setTimeout(() => {
        let faqReply = ''
        if (msgToSend.includes('Pemula')) {
          faqReply = `Sebagai seorang ${currentTier}, langkah awal terbaik di Daily Grind Log adalah membangun fondasi konsistensi gerakan dasar.\n\nFokuslah pada latihan beban seluruh tubuh (Full-Body Workout) menggunakan berat badan sendiri seperti Squat, Push-up, dan Plank.\n\nTonton video panduan gerakan dasar full-body berikut ini untuk menyelaraskan form latihanmu:\nhttps://www.youtube.com/watch?v=UItWltVZZmE`
        } else {
          faqReply = `Kardio dan Angkat Beban adalah dua pilar kekuatan yang saling melengkapi, ${currentTier}.\n\n1. **Angkat Beban:** Wajib diutamakan untuk merobek jaringan otot lama agar tumbuh menjadi massa otot baru yang lebih padat.\n2. **Kardio:** Berfungsi menjaga stamina kapasitas jantung dan paru-paru.\n\nTonton penjelasan ilmiah perbandingan kardio vs angkat beban di sini:\nhttps://www.youtube.com/watch?v=gcNh17CkW64`
        }
        setMessages(prev => [...prev, { sender: 'seolha', text: faqReply }])
        setLoading(false)
      }, 250)
      return
    }

    try {
      const formattedHistory = newMessages
        .filter((_, idx) => idx > 0)
        .map(m => ({
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
        setDailyCount(prev => prev + 1)
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
      
      {/* HEADER TOP BAR - KEMBALI DIISI CLOCK DIGITAL REAL-TIME */}
      <div className="flex items-center justify-between pb-2 border-b border-[#211D2C]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-display font-bold text-text-high tracking-wider">Seolha</span>
          <span className="font-mono text-[10px] text-text-dim uppercase">AI Companion</span>
        </div>
        <div className="flex items-center gap-3">
          {/* DIGITAL WATCH WIDGET */}
          <div className="flex items-center gap-1 font-mono text-xs text-text-dim bg-[#100E16] px-2 py-0.5 border border-[#211D2C]">
            <Clock size={11} className="text-accent" />
            <span>{liveTime || '00:00:00'}</span>
          </div>
          <span className="font-mono text-xs text-accent">{5 - dailyCount}/5 energi</span>
          <button onClick={onClose} className="p-1 hover:bg-border-hover rounded text-text-dim transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* COMPACT DAILY QUOTE WIDGET */}
      <div className="mt-2.5 p-2.5 bg-[#100E16] border border-[#211D2C] flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Quote size={11} className="text-accent" />
          <span className="font-mono text-[10px] text-accent font-bold tracking-wider uppercase">DAILY QUOTE: {todayQuote.name}</span>
        </div>
        <p className="font-body text-xs text-text-high italic leading-relaxed pl-1.5 border-l-2 border-[#211D2C]">
          "{todayQuote.quote}"
        </p>
        
        <button 
          type="button"
          onClick={handleClaimLegendQuest}
          disabled={isQuestClaimed}
          className={`mt-1 w-full p-2 border text-left flex items-start gap-2.5 transition-all ${isQuestClaimed ? 'bg-emerald-950/20 border-emerald-500/40 opacity-80' : 'bg-[#0A0A0E] border-accent/30 hover:border-accent active:scale-[0.99]'}`}
        >
          {isQuestClaimed ? (
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full border border-accent/60 shrink-0 mt-0.5 flex items-center justify-center font-mono text-[8px] text-accent font-bold">!</div>
          )}
          <div className="flex-1 min-w-0 font-mono text-[11px] leading-tight text-left">
            <div className={`font-bold mb-0.5 ${isQuestClaimed ? 'text-emerald-400' : 'text-text-high'}`}>
              {isQuestClaimed ? 'EVENT QUEST COMPLETED' : 'TERIMA EVENT QUEST'}
            </div>
            <p className="whitespace-normal break-words font-body text-[11px] leading-normal text-text-dim">
              Misi: {todayQuote.mission}
            </p>
          </div>
          <span className={`shrink-0 font-bold text-[11px] ${isQuestClaimed ? 'text-emerald-400' : 'text-accent'}`}>
            {isQuestClaimed ? 'DONE' : '+50 EXP'}
          </span>
        </button>
      </div>

      {/* CHAT CONTAINER LAYAR UTAMA - DIDUKUNG EMBED VIDEO PLAYER DETECTOR */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        {messages.map((m, i) => {
          const ytVideoId = extractYoutubeId(m.text)
          return (
            <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-3 font-body text-sm leading-relaxed ${m.sender === 'user' ? 'bg-accent text-white rounded-tl-xl rounded-tr-xl rounded-bl-xl' : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6] rounded-tl-xl rounded-tr-xl rounded-br-xl'}`}>
                {m.sender === 'seolha' && (
                  <div className="font-mono text-[10px] text-accent font-bold uppercase mb-1 flex items-center gap-1">
                    <Bot size={10} /> SEOLHA
                  </div>
                )}
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
              
              {/* RENDERING IFRAME YOUTUBE DETECTED DI BAWAH CHAT BUBBLE */}
              {m.sender === 'seolha' && ytVideoId && (
                <div className="w-[85%] mt-2 p-1 bg-[#100E16] border border-[#211D2C] rounded-lg shadow-xl overflow-hidden aspect-video">
                  <iframe
                    className="w-full h-full rounded"
                    src={`https://www.youtube.com/embed/${ytVideoId}`}
                    title="YouTube Video Guide"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )
        })}
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

      {/* HORIZONTAL SWIPE / SCROLL FAQ AREA - REAKTIF & HALUS */}
      <div className="mb-2 bg-background pt-1.5">
        <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-1.5">FAQ — 0 ENERGI</div>
        <div 
          className="flex gap-2 overflow-x-auto pb-1 flex-nowrap scrollbar-none" 
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <button 
            type="button" 
            onClick={() => handleSend(null, 'Pemula mulai dari mana?', true)}
            disabled={loading}
            className="flex-shrink-0 w-[200px] text-left text-xs px-3 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-body hover:border-accent transition-colors whitespace-normal break-words active:scale-[0.98]"
          >
            Pemula mulai dari mana?
          </button>
          <button 
            type="button" 
            onClick={() => handleSend(null, 'Kardio atau angkat beban?', true)}
            disabled={loading}
            className="flex-shrink-0 w-[200px] text-left text-xs px-3 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-body hover:border-accent transition-colors whitespace-normal break-words active:scale-[0.98]"
          >
            Kardio atau angkat beban?
          </button>
        </div>
      </div>

      {/* INPUT FORM BOX */}
      <form onSubmit={(e) => handleSend(e)} className="pt-2 border-t border-[#211D2C] flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya Seolha..." className="flex-1 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2.5 text-sm text-text-high focus:outline-none focus:border-accent" />
        <button type="submit" disabled={loading || !input.trim()} className="w-11 h-11 bg-accent flex items-center justify-center text-white disabled:opacity-40"><Send size={16} /></button>
      </form>
    </div>
  )
}

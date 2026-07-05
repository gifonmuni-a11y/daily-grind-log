import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2, Quote, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getRankTier } from '../lib/expSystem'

const LEGENDARY_QUOTES = [
  { id: 'legend_1', name: 'ADE RAI', quote: 'Kesehatan dan otot kuat bukan tujuan utama, melainkan modal dasar paling berharga untuk mencapai semua impian raksasamu.', mission: 'Latihan beban intens & jaga porsi makan hari ini tanpa jebol.' },
  { id: 'legend_2', name: 'ARNOLD SCHWARZENEGGER', quote: 'Satu-satunya cara untuk meruntuhkan batasan fisikmu adalah dengan terus menembus rasa sakit itu tanpa rasa takut.', mission: 'Tambah repetisi atau beban melebihi batas nyaman biasanya hari ini.' },
  { id: 'legend_3', name: 'DAVID GOGGINS', quote: 'Saat pikiranmu berkata sudah selesai, sebenarnya fisikmu baru menggunakan 40 persen kekuatan aslinya. Tetap keras!', mission: 'Selesaikan sesi latihan penuh hari ini tanpa menyerah di tengah jalan.' },
  { id: 'legend_4', name: 'DEDDY CORBUZIER', quote: 'Rasa malas itu bukan kepribadian, itu cuma alasan dari mental yang lemah. Bangun sekarang dan paksa dirimu ke medan latihan!', mission: 'Jangan tunda jam latihan, eksekusi log tepat waktu hari ini.' },
  { id: 'legend_5', name: 'CRISTIANO RONALDO', quote: 'Bakat tanpa kerja keras jangka panjang tidak akan pernah berarti apa-apa di panggung tertinggi dunia.', mission: 'Fokus penuh pada konsistensi gerakan dan ketepatan form eksekusi.' },
  { id: 'legend_6', name: 'DENNY SUMARGO', quote: 'Kemenangan sejati didapatkan saat kamu berhasil mengalahkan rasa ingin menyerah yang berisik di dalam kepalamu sendiri.', mission: 'Lawan rasa mager, lakukan minimal 15 menit conditioning harian.' },
  { id: 'legend_7', name: 'THE ROCK', quote: 'Sukses bukan tentang menjadi yang paling hebat dalam semalam, tapi tentang konsistensi kerja keras berdarah-darah setiap hari.', mission: 'Pertahankan dan amankan grafik streak harianmu jangan sampai pecah.' },
  { id: 'legend_8', name: 'BUNG KARNO', quote: 'Gantungkan cita-cita latihanmu setinggi langit! Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.', mission: 'Set target log mingguan tertinggi dan catat sesi dengan performa terbaik.' }
]

// POOL VIDEO BERSIH: Hanya menyisakan ID video yang terbukti sukses dan lolos uji coba embed PWA lu
const VALID_YOUTUBE_POOL = {
  mulai: ['UItWltVZZmE'],
  kardio_angkat: ['GY1JhB9BEkk'],
  latihan: ['cbKkB3POqaY'],
  makanan: ['mzpDEPg7-3E'],
  tidur: ['-lu1Nmttz4w'],
  kesalahan: ['rH447xP0INg']
}

export default function CompanionAI({ userStats, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyCount, setDailyCount] = useState(0)
  const [isQuestClaimed, setIsQuestClaimed] = useState(false)
  const [liveTime, setLiveTime] = useState('')
  const messagesEndRef = useRef(null)

  const currentTier = getRankTier(userStats?.level || 1)
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setLiveTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const renderMessageText = (text) => {
    if (!text) return null
    return text.split('\n').map((line, idx) => {
      let processedLine = line
      const boldRegex = /\*\*(.*?)\*\*/g
      const parts = []
      let lastIndex = 0
      let match

      const isBullet = line.trim().startsWith('* ')
      if (isBullet) {
        processedLine = line.trim().substring(2)
      }

      while ((match = boldRegex.exec(processedLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(processedLine.substring(lastIndex, match.index))
        }
        parts.push(<strong key={match.index} className="text-accent font-black">{match[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      if (lastIndex < processedLine.length) {
        parts.push(processedLine.substring(lastIndex))
      }

      const content = parts.length > 0 ? parts : processedLine

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1 font-body text-sm text-[#EDEAF6]">
            <span className="text-accent text-xs mt-1.5">•</span>
            <div className="flex-1 whitespace-pre-wrap leading-relaxed">{content}</div>
          </div>
        )
      }

      return (
        <p key={idx} className="whitespace-pre-wrap font-body text-sm text-[#EDEAF6] leading-relaxed my-1">
          {content}
        </p>
      )
    })
  }

  const extractYoutubeId = (text) => {
    if (!text) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const matches = text.match(regExp)
    if (matches && matches[2].length === 11) return matches[2]
    const inlineReg = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const inlineMatches = text.match(inlineReg)
    return inlineMatches ? inlineMatches[1] : null
  }

  const scanDynamicChatVideos = (userText, aiText) => {
    const combined = `${userText} ${aiText}`.toLowerCase()
    
    if (combined.includes('video') || combined.includes('vidio') || combined.includes('tonton') || combined.includes('link')) {
      if (combined.includes('tidur') || combined.includes('sleep') || combined.includes('recovery') || combined.includes('istirahat')) {
        return VALID_YOUTUBE_POOL.tidur.map(id => ({ type: 'video', src: id }))
      }
      if (combined.includes('makan') || combined.includes('nutrisi') || combined.includes('diet') || combined.includes('kalori')) {
        return VALID_YOUTUBE_POOL.makanan.map(id => ({ type: 'video', src: id }))
      }
      if (combined.includes('kardio') || combined.includes('cardio') || combined.includes('angkat') || combined.includes('beban')) {
        return VALID_YOUTUBE_POOL.kardio_angkat.map(id => ({ type: 'video', src: id }))
      }
      if (combined.includes('salah') || combined.includes('fatal') || combined.includes('dosa')) {
        return VALID_YOUTUBE_POOL.kesalahan.map(id => ({ type: 'video', src: id }))
      }
      if (combined.includes('jenis') || combined.includes('cara') || combined.includes('gerakan') || combined.includes('push up') || combined.includes('ringan') || combined.includes('latihan')) {
        return VALID_YOUTUBE_POOL.latihan.map(id => ({ type: 'video', src: id }))
      }
      return VALID_YOUTUBE_POOL.mulai.map(id => ({ type: 'video', src: id }))
    }
    return null
  }

  useEffect(() => {
    setMessages([
      { 
        sender: 'seolha', 
        text: `Selamat malam, ${currentTier}. Ada yang bisa saya bantu untuk menemani latihan hari ini?`,
        media: null
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
      const today = new Date().toISOString().split('T')[0]
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('ai_usage').select('count').eq('user_id', session.user.id).eq('date', today).single()
      if (data) setDailyCount(data.count)
    } catch (e) {
      console.error(e)
    }
  }

  const checkQuestPersistence = () => {
    const today = new Date().toISOString().split('T')[0]
    const savedClaim = localStorage.getItem(`claim_${today}_${LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].id}`)
    if (savedClaim === 'true') setIsQuestClaimed(true)
  }

  const handleClaimLegendQuest = () => {
    if (isQuestClaimed) return
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`claim_${today}_${LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].id}`, 'true')
    setIsQuestClaimed(true)
  }

  const handleSend = async (e, customMsg = null, isFaq = false) => {
    if (e) e.preventDefault()
    const msgToSend = customMsg || input
    if (!msgToSend.trim() || loading) return

    if (!isFaq && dailyCount >= 5) {
      setMessages(prev => [...prev, 
        { sender: 'user', text: msgToSend },
        { sender: 'seolha', text: 'Energi aku sudah habis untuk hari ini (Batas 5 pertanyaan telah tercapai). Kita obrol lagi besok ya!', media: null }
      ])
      if (!customMsg) setInput('')
      return
    }

    if (!customMsg) setInput('')
    const currentMessages = [...messages, { sender: 'user', text: msgToSend }]
    setMessages(currentMessages)
    setLoading(true)

    if (isFaq) {
      const cleanMsg = msgToSend.toLowerCase()
      let faqReply = ''
      let videoIdsArray = []

      if (cleanMsg.includes('mulai dari mana')) {
        videoIdsArray = VALID_YOUTUBE_POOL.mulai
        faqReply = `Sebagai seorang ${currentTier}, langkah awal terbaik adalah membangun fondasi konsistensi tanpa memikirkan beban berat dulu.\n\n* **Fokus Utama:** Latihan beban seluruh tubuh (Full-Body Workout) menggunakan berat badan sendiri seperti Squat, Push-up, dan Plank.\n* **Frekuensi:** Lakukan sebanyak 3 kali seminggu secara berkala. Berikut panduan form gerakan dasar dari Seolha:`
      } 
      else if (cleanMsg.includes('kardio atau angkat')) {
        videoIdsArray = VALID_YOUTUBE_POOL.kardio_angkat
        faqReply = `Kardio dan Angkat Beban memiliki peran masing-masing, ${currentTier}.\n\n1. **Angkat Beban:** Wajib diutamakan untuk merobek otot lama agar tumbuh menjadi massa otot baru yang padat.\n2. **Kardio:** Menjaga kapasitas stamina kerja jantung.\n\nSaran eksekusi: Dahulukan Angkat Beban selagi energi penuh, lalu tutup dengan 15 menit Latihan Kardio.`
      }
      else if (cleanMsg.includes('latihan')) {
        videoIdsArray = VALID_YOUTUBE_POOL.latihan
        faqReply = `Untuk pemula, persiapkan mental untuk menguasai gerakan dasar dengan form yang sempurna, ${currentTier}.\n\n* **Jenis Latihan Utama:** Gerakan Compound seperti Push-Up (dada/tricep), Pull-Up/Inverted Row (punggung/bicep), dan Squat (kaki).\n* **Cara Latihan:** Lakukan 3 set per gerakan dengan repetisi terkontrol (8-12 repetisi). Istirahat 1-2 menit antar set. Jaga otot inti (core) selalu terkunci rapat.`
      }
      else if (cleanMsg.includes('makan') || cleanMsg.includes('nutrisi')) {
        videoIdsArray = VALID_YOUTUBE_POOL.makanan
        faqReply = `Nutrisi adalah 70% penentu keberhasilan progres RPG fisikmu, ${currentTier}.\n\n* **Bulking (Naik Berat Otot):** Surplus kalori bersih dari sumber makanan utuh.\n* **Cutting (Turun Lemak):** Defisit kalori terkontrol.\n* **Kebutuhan Protein:** Konsumsi 1.5x - 2x berat badan gram protein harian. Maksimalkan opsi murah lokal: Dada ayam, telur ayam, tempe, tahu, dan ikan kembung. Hindari gorengan minyak berlebih.`
      }
      else if (cleanMsg.includes('tidur') || cleanMsg.includes('recovery')) {
        videoIdsArray = VALID_YOUTUBE_POOL.tidur
        faqReply = `Ingat ini, ${currentTier}: Otot tidak bertumbuh saat kamu mengangkat beban di gym, melainkan saat kamu tidur nyenyak.\n\n* **Durasi Mandatori:** 7-8 jam per hari secara konsisten.\n* **Manfaat Deep Sleep:** Mempercepat sintesis protein dan memicu pelepasan Growth Hormone (HGH) secara maksimal untuk memulihkan jaringan otot yang rusak.`
      }
      else if (cleanMsg.includes('kesalahan')) {
        videoIdsArray = VALID_YOUTUBE_POOL.kesalahan
        faqReply = `Hindari 4 dosa besar pemula ini agar terhindar dari cedera kronis, ${currentTier}:\n\n1. **Ego Lifting:** Memaksa beban terlalu berat padahal form gerakan berantakan.\n2. **Kurang Konsisten:** Berhenti latihan hanya karena otot belum kelihatan dalam 2 minggu.\n3. **Mengabaikan Nutrisi:** Mengira latihan keras bisa menutupi pola makan berantakan/begadang.\n4. **Asal Tiru:** Langsung meniru program latihan atlet profesional tanpa fondasi dasar.`
      }

      const mappedMediaArray = videoIdsArray.map(id => ({ type: 'video', src: id }))
      setMessages(prev => [...prev, { sender: 'seolha', text: faqReply, media: mappedMediaArray }])
      setLoading(false)
      return
    }

    try {
      // MANDATORY PAYLOAD SLICER: Memotong welcome greeting message agar array pengiriman wajib diawali oleh role 'user'
      const conversationMessages = currentMessages.filter(m => !m.text.includes('Gagal mendapatkan respon'))
      const firstUserIdx = conversationMessages.findIndex(m => m.sender === 'user')
      const cleanHistory = firstUserIdx !== -1 ? conversationMessages.slice(firstUserIdx) : conversationMessages

      // ALIGN ROLE SPECIFICATION: Menggunakan role 'assistant' sesuai standard Vercel AI SDK PWA lu
      const formattedHistory = cleanHistory.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: formattedHistory, userStats })
      })

      if (response.ok) {
        const resData = await response.json()
        let replyText = resData.reply || 'Ada fokus rutinitas latihan lain yang mau diselaraskan?'
        
        let mediaPayload = null
        const explicitId = extractYoutubeId(replyText)
        if (explicitId) {
          replyText = replyText.replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/g, '')
          mediaPayload = [{ type: 'video', src: explicitId }]
        } else {
          mediaPayload = scanDynamicChatVideos(msgToSend, replyText)
        }

        setMessages(prev => [...prev, { sender: 'seolha', text: replyText, media: mediaPayload }])
        setDailyCount(prev => prev + 1)
      } else {
        setMessages(prev => [...prev, { sender: 'seolha', text: 'Gagal mendapatkan respon dari engine chat.', media: null }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'seolha', text: 'Gagal mendapatkan respon dari engine chat.', media: null }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md p-4 max-w-lg mx-auto select-none">
      
      {/* HEADER TOP BAR PANEL */}
      <div className="flex items-center justify-between pb-2 border-b border-[#211D2C]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-display font-bold text-text-high tracking-wider">Seolha</span>
          <span className="font-mono text-[10px] text-text-dim uppercase">AI Companion</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-mono text-xs text-text-high bg-[#100E16] px-2 py-0.5 border border-[#211D2C]">
            <Clock size={11} className="text-accent" />
            <span>{liveTime || '00:00'}</span>
          </div>
          <div className="w-[1px] h-4 bg-[#211D2C]" />
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-text-high bg-[#100E16] border border-[#7C5CFF]/30 px-2 py-1 rounded shadow-[0_0_10px_rgba(124,92,255,0.05)]">
            <svg className="w-3.5 h-3.5 text-[#7C5CFF] fill-current" viewBox="0 0 24 24">
              <path d="M16 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm4 4h2v4h-2v-4z"/>
            </svg>
            <span>{5 - dailyCount}/5 Energi</span>
          </div>
          <div className="w-[1px] h-4 bg-[#211D2C]" />
          <button onClick={onClose} className="p-1 hover:bg-border-hover rounded text-text-dim transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* COMPACT DAILY QUOTE COMPONENT */}
      <div className="mt-2.5 p-2.5 bg-[#100E16] border border-[#211D2C] flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Quote size={11} className="text-accent" />
          <span className="font-mono text-[10px] text-accent font-bold tracking-wider uppercase">DAILY QUOTE: {LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].name}</span>
        </div>
        <p className="font-body text-xs text-text-high italic leading-relaxed pl-1.5 border-l-2 border-[#211D2C]">
          "{LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].quote}"
        </p>
        <button 
          type="button"
          onClick={handleClaimLegendQuest}
          disabled={isQuestClaimed}
          className={`mt-1 w-full p-2 border text-left flex items-start gap-2.5 transition-all ${isQuestClaimed ? 'bg-emerald-950/20 border-emerald-500/40 opacity-80' : 'bg-[#0A0A0E] border-accent/30 hover:border-accent active:scale-[0.99]'}`}
        >
          {isQuestClaimed ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-accent/60 shrink-0 mt-0.5 flex items-center justify-center font-mono text-[8px] text-accent font-bold">!</div>}
          <div className="flex-1 min-w-0 font-mono text-[11px] leading-tight text-left">
            <div className={`font-bold mb-0.5 ${isQuestClaimed ? 'text-emerald-400' : 'text-text-high'}`}>{isQuestClaimed ? 'EVENT QUEST COMPLETED' : 'TERIMA EVENT QUEST'}</div>
            <p className="whitespace-normal break-words font-body text-[11px] leading-normal text-text-dim">Misi: {LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].mission}</p>
          </div>
          <span className={`shrink-0 font-bold text-[11px] ${isQuestClaimed ? 'text-emerald-400' : 'text-accent'}`}>{isQuestClaimed ? 'DONE' : '+50 EXP'}</span>
        </button>
      </div>

      {/* INTERACTIVE CHAT SCREEN VIEWPORT */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 font-body text-sm leading-relaxed ${m.sender === 'user' ? 'bg-accent text-white rounded-xl' : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6] rounded-xl'}`}>
              {m.sender === 'seolha' && <div className="font-mono text-[10px] text-accent font-bold uppercase mb-1 flex items-center gap-1"><Bot size={10} /> SEOLHA</div>}
              <div className="flex flex-col">{m.sender === 'seolha' ? renderMessageText(m.text) : <p className="whitespace-pre-wrap">{m.text}</p>}</div>
            </div>
            
            {m.sender === 'seolha' && m.media && Array.isArray(m.media) && m.media.map((med, midx) => (
              med.type === 'video' && (
                <div key={midx} className="w-[85%] mt-2 p-1 bg-[#100E16] border border-[#211D2C] rounded-lg shadow-xl overflow-hidden aspect-video">
                  <iframe
                    className="w-full h-full rounded"
                    src={`https://www.youtube.com/embed/${med.src}?playsinline=1&enablejsapi=1&rel=0&modestbranding=1`}
                    title={`PWA Inline Stream ${midx}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )
            ))}
          </div>
        ))}
        {/* MODIFIED LOADING COMPONENT: Custom loading text sesuai permintaan lo */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#100E16] border border-[#211D2C] p-3 rounded-xl flex items-center gap-2 font-mono text-xs text-text-dim">
              <Loader2 size={12} className="animate-spin text-accent" />
              Seolha sedang berpikir
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* CUSTOMIZED HORIZONTAL SCROLL FAQ AREA */}
      <div className="mb-2 bg-background pt-1.5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5 bg-gradient-to-r from-[#7C5CFF] to-[#3B82F6] bg-clip-text text-transparent">
          0 ENERGI — SWIPE →
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 flex-nowrap" style={{ scrollbarWidth: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <style dangerouslySetInnerHTML={{__html: `
            div::-webkit-scrollbar { height: 4px !important; background: #100E16 !important; }
            div::-webkit-scrollbar-thumb { background: #7C5CFF !important; border-radius: 2px !important; }
            div::-webkit-scrollbar-track { background: #161420 !important; }
          `}} />

          <button type="button" onClick={() => handleSend(null, 'Pemula mulai dari mana?', true)} disabled={loading} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent transition-colors active:scale-[0.98]">Mulai dari mana?</button>
          <button type="button" onClick={() => handleSend(null, 'Kardio atau angkat beban?', true)} disabled={loading} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent transition-colors active:scale-[0.98]">Kardio atau angkat?</button>
          <button type="button" onClick={() => handleSend(null, 'Jenis & Cara Latihan Pemula', true)} disabled={loading} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent transition-colors active:scale-[0.98]">Cara & Jenis Latihan</button>
          <button type="button" onClick={() => handleSend(null, 'Pola Makan & Nutrisi Pemula', true)} disabled={loading} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent transition-colors active:scale-[0.98]">Nutrisi & Makan</button>
          <button type="button" onClick={() => handleSend(null, 'Pola Tidur & Recovery Pemula', true)} disabled={loading} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent transition-colors active:scale-[0.98]">Tidur & Recovery</button>
          <button type="button" onClick={() => handleSend(null, 'Kesalahan Fatal Pemula', true)} disabled={loading} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent transition-colors active:scale-[0.98]">Kesalahan Fatal</button>
        </div>
      </div>

      {/* INPUT CONTROLLER FIELD */}
      <form onSubmit={(e) => handleSend(e)} className="pt-2 border-t border-[#211D2C] flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya Seolha..." className="flex-1 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2.5 text-sm text-text-high focus:outline-none" />
        <button type="submit" disabled={loading || !input.trim()} className="w-11 h-11 bg-accent flex items-center justify-center text-white"><Send size={16} /></button>
      </form>
    </div>
  )
}

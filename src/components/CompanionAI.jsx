import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2, Quote, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getRankTier } from '../lib/expSystem'
import { claimQuest } from '../lib/dailyQuests'

const LEGENDARY_QUOTES = [
  { id: 'legend_1', name: 'ADE RAI', quote: 'Kesehatan dan otot kuat bukan tujuan utama, melainkan modal dasar paling berharga untuk mencapai semua impian raksasamu.', mission: 'Latihan beban intens & jaga porsi makan hari ini tanpa jebol.' },
  { id: 'legend_2', name: 'ARNOLD SCHWARZENEGGER', quote: 'Satu-satunya cara untuk meruntuhkan batasan fisikmu adalah dengan terus menembus rasa sakit itu tanpa rasa takut.', mission: 'Tambah repetisi atau beban melebihi batas nyaman biasanya hari ini.' },
  { id: 'legend_3', name: 'DAVID GOGGINS', quote: 'Saat pikiranmu berkata sudah selesai, sebenarnya fisikmu baru menggunakan 40 persen kekuatan aslinya. Tetap keras!', mission: 'Selesaikan sesi latihan penuh hari ini tanpa menyerah di tengah jalan.' },
  { id: 'legend_4', name: 'DEDDY CORBUZIER', quote: 'Rasa malas itu bukan kepribadian, itu cuma alasan dari mental yang lemah. Bangun sekarang dan paksa dirimu ke medan latihan!', mission: 'Jangan tunda jam latihan, eksekusi log tepat waktu hari ini.' },
  { id: 'legend_5', name: 'CRISTIANO RONALDO', quote: 'Bakat tanpa kerja keras jangka panjang tidak akan pernah berarti apa-apa di panggung tertinggi dunia.', mission: 'Fokus penuh pada konsistensi gerakan dan ketepatan form eksekusi.' },
  { id: 'legend_6', name: 'DENNY SUMARGO', quote: 'Kemenangan sejati didapatkan saat kamu berhasil mengalahkan rasa ingin menyerah yang berisik di dalam kepalamu sendiri.', mission: 'Lawan rasa mager, lakukan minimal 15 menit conditioning harian.' },
  { id: 'legend_7', name: 'THE ROCK', quote: 'Sukses bukan tentang menjadi yang paling hebat dalam semalam, tapi tentang konsistensi kerja keras berdarah-darah setiap hari.', mission: 'Pertahankan dan amankan grafik streak harianmu jangan sampai pcah.' },
  { id: 'legend_8', name: 'BUNG KARNO', quote: 'Gantungkan cita-cita latihanmu setinggi langit! Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.', mission: 'Set target log mingguan tertinggi dan catat sesi dengan performa terbaik.' }
]

// POOL VIDEO PUBLIK ANTI-PRIVATE & ALLOW EMBED (SUDAH DI-VALIDASI)
const VALID_YOUTUBE_POOL = {
  mulai: ['GY1JhB9BEkk', 'cbKkB3POqaY', 'UItWltVZZmE', 'VaoV1PrU38I', 'rS89E7X922E'],
  kardio_angkat: ['cbKkB3POqaY', 'GY1JhB9BEkk', 'xY9mE_B2ZpM', '958b9Oun_Mo', 'UItWltVZZmE'],
  latihan: ['cbKkB3POqaY', 'GY1JhB9BEkk', 'UItWltVZZmE', 'OQz76N3SGoA', 'j68bWf6yG_Y'],
  makanan: ['mzpDEPg7-3E', 'xyQe5N6L2K8', 'Z_M-hC-3U_8', 'GY1JhB9BEkk', 'cbKkB3POqaY'],
  tidur: ['-lu1Nmttz4w', 't0kACis_dJE', '3e_tS3GZfH0', 'UItWltVZZmE', 'GY1JhB9BEkk'],
  kesalahan: ['rH447xP0INg', 'E3_vE68g0Gk', 'bI6Gg9rKNFY', 'cbKkB3POqaY', 'GY1JhB9BEkk']
}

export default function CompanionAI({ userStats, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false) // Bisa bernilai false, 'thinking', atau 'validating'
  const [dailyCount, setDailyCount] = useState(0)
  const [isQuestClaimed, setIsQuestClaimed] = useState(false)
  const [liveTime, setLiveTime] = useState('')
  const messagesEndRef = useRef(null)

  const currentTier = getRankTier(userStats?.level || 1)
  
  const getDynamicGreeting = () => {
    const now = new Date()
    const hrs = now.getHours()
    
    if (hrs >= 0 && hrs < 4) return "Selamat pagi"
    if (hrs >= 4 && hrs < 8) return "Bangun dan waktunya bersinar"
    if (hrs >= 8 && hrs < 11) return "Selamat beraktivitas"
    if (hrs === 11) return "Selamat siang"
    if (hrs === 12) return "Selamat istirahat"
    if (hrs >= 13 && hrs < 15) return "Selamat siang"
    if (hrs >= 15 && hrs < 18) return "Selamat sore"
    return "Selamat malam"
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setLiveTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // 🛡️ PARSER COMPONENT: BERSIHIN (*) DAN FORSA WARNA UNGU JADE PURPLE (#7C5CFF) PADA TEKS TEBAL
  const renderMessageText = (text) => {
    if (!text) return null
    return text.split('\n').map((line, idx) => {
      let cleanLine = line.trim()
      if (!cleanLine) return <div key={idx} className="h-2" />

      const isBullet = cleanLine.startsWith('* ') || cleanLine.startsWith('- ')
      if (isBullet) cleanLine = cleanLine.substring(2).trim()

      const parts = []
      const boldRegex = /\*\*(.*?)\*\*/g
      let lastIndex = 0
      let match

      while ((match = boldRegex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index))
        }
        parts.push(
          <strong key={match.index} className="text-[#7C5CFF] font-black">
            {match[1]}
          </strong>
        )
        lastIndex = boldRegex.lastIndex
      }
      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex))
      }

      const content = parts.length > 0 ? parts : cleanLine
      const finalizedContent = Array.isArray(content)
        ? content.map(p => typeof p === 'string' ? p.replace(/\*/g, '') : p)
        : typeof content === 'string' ? content.replace(/\*/g, '') : content

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1 font-body text-sm text-[#EDEAF6]">
            <span className="text-[#7C5CFF] text-xs mt-1.5">•</span>
            <div className="flex-1 whitespace-pre-wrap leading-relaxed">{finalizedContent}</div>
          </div>
        )
      }
      return <p key={idx} className="whitespace-pre-wrap font-body text-sm text-[#EDEAF6] leading-relaxed my-1">{finalizedContent}</p>
    })
  }

  const extractYoutubeId = (text) => {
    if (!text) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const matches = text.match(regExp)
    if (matches && matches[2].length === 11) return matches[2]
    return null
  }

  const scanDynamicChatVideos = (userText, aiText) => {
    const combined = `${userText} ${aiText}`.toLowerCase()
    let poolKey = 'mulai'
    if (combined.includes('tidur') || combined.includes('sleep') || combined.includes('recovery')) poolKey = 'tidur'
    else if (combined.includes('makan') || combined.includes('nutrisi') || combined.includes('diet')) poolKey = 'makanan'
    else if (combined.includes('kardio') || combined.includes('angkat') || combined.includes('beban')) poolKey = 'kardio_angkat'
    else if (combined.includes('salah') || combined.includes('fatal') || combined.includes('dosa')) poolKey = 'kesalahan'
    else if (combined.includes('jenis') || combined.includes('cara') || combined.includes('latihan')) poolKey = 'latihan'
    
    const arr = VALID_YOUTUBE_POOL[poolKey]
    return [{ type: 'video', src: arr[Math.floor(Math.random() * arr.length)] }]
  }

  useEffect(() => {
    const greetingText = getDynamicGreeting()
    setMessages([
      { 
        sender: 'seolha', 
        role: 'assistant',
        text: `${greetingText}, ${currentTier}. Ada yang bisa saya bantu untuk menemani latihan hari ini?`,
        content: `${greetingText}, ${currentTier}. Ada yang bisa saya bantu untuk menemani latihan hari ini?`,
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
    } catch (e) { console.error(e) }
  }

  const checkQuestPersistence = () => {
    const today = new Date().toISOString().split('T')[0]
    const savedClaim = localStorage.getItem(`claim_${today}_${LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].id}`)
    if (savedClaim === 'true') setIsQuestClaimed(true)
  }

  const handleClaimLegendQuest = async () => {
    if (isQuestClaimed) return
    const today = new Date().toISOString().split('T')[0]
    const quoteId = LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].id
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: currentStats } = await supabase.from('user_stats').select('total_exp').eq('user_id', session.user.id).single()
      const currentExp = currentStats?.total_exp || userStats?.totalExp || 0
      const newExp = currentExp + 50

      await supabase.from('user_stats').update({ total_exp: newExp }).eq('user_id', session.user.id)
      localStorage.setItem(`claim_${today}_${quoteId}`, 'true')
      setIsQuestClaimed(true)
      
      if (typeof window !== 'undefined') window.location.reload()
    } catch (e) { console.error(e) }
  }

  const handleSend = async (e, customMsg = null, isFaq = false) => {
    if (e) e.preventDefault()
    const msgToSend = customMsg || input
    if (!msgToSend.trim() || loading) return

    if (!isFaq && dailyCount >= 5) {
      setMessages(prev => [...prev, 
        { sender: 'user', role: 'user', text: msgToSend, content: msgToSend },
        { sender: 'seolha', role: 'assistant', text: 'Energi aku sudah habis untuk hari ini (Batas 5 pertanyaan telah tercapai). Kita obrol lagi besok ya!', content: 'Energi aku sudah habis untuk hari ini (Batas 5 pertanyaan telah tercapai). Kita obrol lagi besok ya!', media: null }
      ])
      if (!customMsg) setInput('')
      return
    }

    if (!customMsg) setInput('')
    const currentMessages = [...messages, { sender: 'user', role: 'user', text: msgToSend, content: msgToSend }]
    setMessages(currentMessages)
    
    // ⏳ STEP 1: PROSES BERPIKIR TEXT ENGINE
    setLoading('thinking')

    if (isFaq) {
      const cleanMsg = msgToSend.toLowerCase()
      let faqReply = ''
      let poolKey = 'mulai'

      if (cleanMsg.includes('mulai dari mana')) { poolKey = 'mulai'; faqReply = `Sebagai seorang **${currentTier}**, langkah awal terbaik adalah membangun fondasi konsistensi tanpa memikirkan beban berat dulu.\n\n* **Fokus Utama:** Latihan beban seluruh tubuh (Full-Body Workout) menggunakan berat badan sendiri seperti Squat, Push-up, dan Plank.\n* **Frekuensi:** Lakukan sebanyak 3 kali seminggu secara berkala. Berikut panduan form gerakan dasar dari Seolha:` }
      else if (cleanMsg.includes('kardio atau angkat')) { poolKey = 'kardio_angkat'; faqReply = `Kardio dan Angkat Beban memiliki peran masing-masing, **${currentTier}**.\n\n1. **Angkat Beban:** Wajib diutamakan untuk merobek otot lama agar tumbuh menjadi massa otot baru yang padat.\n2. **Kardio:** Menjaga kapasitas stamina kerja jantung.\n\nSaran eksekusi: Dahulukan Angkat Beban selagi energi penuh, lalu tutup dengan 15 menit Latihan Kardio.` }
      else if (cleanMsg.includes('latihan')) { poolKey = 'latihan'; faqReply = `Untuk pemula, persiapkan mental untuk menguasai gerakan dasar dengan form yang sempurna, **${currentTier}**.\n\n* **Jenis Latihan Utama:** Gerakan Compound seperti Push-Up (dada/tricep), Pull-Up/Inverted Row (punggung/bicep), dan Squat (kaki).\n* **Cara Latihan:** Lakukan 3 set per gerakan dengan repetisi terkontrol (8-12 repetisi). Istirahat 1-2 menit antar set. Jaga otot inti (core) selalu terkunci rapat.` }
      else if (cleanMsg.includes('makan') || cleanMsg.includes('nutrisi')) { poolKey = 'makanan'; faqReply = `Nutrisi adalah 70% penentu keberhasilan progres RPG fisikmu, **${currentTier}**.\n\n* **Bulking (Naik Berat Otot):** Surplus kalori bersih dari sumber makanan utuh.\n* **Cutting (Turun Lemak):** Defisit kalori terkontrol.\n* **Kebutuhan Protein:** Konsumsi 1.5x - 2x berat badan gram protein harian.` }
      else if (cleanMsg.includes('tidur') || cleanMsg.includes('recovery')) { poolKey = 'tidur'; faqReply = `Otot tidak bertumbuh saat kamu mengangkat beban di gym, melainkan saat kamu tidur nyenyak, **${currentTier}**.\n\n* **Durasi Mandatori:** 7-8 jam per hari secara konsisten.\n* **Manfaat Deep Sleep:** Mempercepat sintesis protein dan memicu pelepasan Growth Hormone (HGH).` }
      else if (cleanMsg.includes('kesalahan')) { poolKey = 'kesalahan'; faqReply = `Hindari 4 dosa besar pemula ini agar terhindar dari cedera kronis, **${currentTier}**:\n\n1. **Ego Lifting:** Memaksa beban terlalu berat.\n2. **Kurang Konsisten:** Berhenti latihan dalam 2 minggu.\n3. **Mengabaikan Nutrisi:** Pola makan berantakan.\n4. **Asal Tiru:** Meniru program atlet pro.` }

      setTimeout(() => {
        // ⏳ STEP 2: PROSES VALIDASI MEDIA UNBLOCKED DARI 5 VALUE POOL
        setLoading('validating')
        setTimeout(() => {
          const arr = VALID_YOUTUBE_POOL[poolKey]
          const chosenId = arr[Math.floor(Math.random() * arr.length)]
          setMessages(prev => [...prev, { sender: 'seolha', role: 'assistant', text: faqReply, content: faqReply, media: [{ type: 'video', src: chosenId }] }])
          setLoading(false)
        }, 1200)
      }, 1000)
      return
    }

    try {
      const formattedHistory = currentMessages.map(m => ({
        role: m.role || (m.sender === 'seolha' ? 'assistant' : 'user'),
        content: m.content || m.text || ''
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: formattedHistory, userStats })
      })

      if (response.ok) {
        const resData = await response.json()
        let replyText = resData.reply || 'Ada progres lain yang mau kita diskusikan?'
        
        // ⏳ STEP 2: MUTASI KE VALIDASI MEDIA SEBELUM OBROLAN DITAMPILKAN
        setLoading('validating')
        await new Promise(resolve => setTimeout(resolve, 1400))

        let mediaPayload = null
        const explicitId = extractYoutubeId(replyText)
        if (explicitId) {
          replyText = replyText.replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/g, '')
          mediaPayload = [{ type: 'video', src: explicitId }]
        } else {
          mediaPayload = scanDynamicChatVideos(msgToSend, replyText)
        }
        setMessages(prev => [...prev, { sender: 'seolha', role: 'assistant', text: replyText, content: replyText, media: mediaPayload }])
        setDailyCount(prev => prev + 1)
      } else {
        setMessages(prev => [...prev, { sender: 'seolha', role: 'assistant', text: 'Gagal mendapatkan respon dari engine chat.', content: 'Gagal mendapatkan respon dari engine chat.', media: null }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'seolha', role: 'assistant', text: 'Gagal mendapatkan respon dari engine chat.', content: 'Gagal mendapatkan respon dari engine chat.', media: null }])
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md p-4 max-w-lg mx-auto select-none">
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

      <div className="mt-2.5 p-2.5 bg-[#100E16] border border-[#211D2C] flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Quote size={11} className="text-accent" />
          <span className="font-mono text-[10px] text-accent font-bold tracking-wider uppercase">DAILY QUOTE: {LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].name}</span>
        </div>
        <p className="font-body text-xs text-text-high italic leading-relaxed pl-1.5 border-l-2 border-[#211D2C]">
          "{LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].quote}"
        </p>
        <button type="button" onClick={handleClaimLegendQuest} disabled={isQuestClaimed} className={`mt-1 w-full p-2 border text-left flex items-start gap-2.5 transition-all ${isQuestClaimed ? 'bg-emerald-950/20 border-emerald-500/40 opacity-80 text-emerald-400' : 'bg-[#0A0A0E] border-accent/30 text-text-high hover:border-accent'}`}>
          <div className="flex-1 font-mono text-[11px] leading-tight">
            <div className="font-bold mb-0.5">{isQuestClaimed ? 'EVENT QUEST COMPLETED' : 'TERIMA EVENT QUEST'}</div>
            <p className="whitespace-normal break-words font-body text-[11px] text-text-dim">Misi: {LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].mission}</p>
          </div>
          <span className="shrink-0 font-bold text-[11px]">{isQuestClaimed ? 'DONE' : '+50 EXP'}</span>
        </button>
      </div>

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
                  <iframe className="w-full h-full rounded" src={`https://www.youtube.com/embed/${med.src}?playsinline=1&enablejsapi=1&rel=0&modestbranding=1`} title={`Stream ${midx}`} frameBorder="0" allowFullScreen />
                </div>
              )
            ))}
          </div>
        ))}
        
        {/* ⏳ VALIDASI NOTIFIKASI DINAMIS BERTAHAP SANG MENTOR */}
        {loading === 'thinking' && (
          <div className="flex justify-start">
            <div className="bg-[#100E16] border border-[#211D2C] p-3 rounded-xl flex items-center gap-2 font-mono text-xs text-text-dim">
              <Loader2 size={12} className="animate-spin text-accent" />
              Seolha sedang berpikir
            </div>
          </div>
        )}
        {loading === 'validating' && (
          <div className="flex justify-start">
            <div className="bg-[#100E16] border border-[#211D2C] p-3 rounded-xl flex items-center gap-2 font-mono text-xs text-text-dim">
              <Loader2 size={12} className="animate-spin text-[#7C5CFF]" />
              Seolha sedang memvalidasi media
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mb-2 bg-background pt-1.5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5 text-accent">0 ENERGI — SWIPE →</div>
        <div className="flex gap-2 overflow-x-auto pb-2 flex-nowrap" style={{ scrollbarWidth: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <style dangerouslySetInnerHTML={{__html: `
            div::-webkit-scrollbar { height: 4px !important; background: #100E16 !important; }
            div::-webkit-scrollbar-thumb { background: #7C5CFF !important; border-radius: 2px !important; }
          `}} />
          <button type="button" onClick={() => handleSend(null, 'Pemula mulai dari mana?', true)} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono uppercase tracking-wide hover:border-accent transition-colors">Mulai dari mana?</button>
          <button type="button" onClick={() => handleSend(null, 'Kardio atau angkat beban?', true)} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono uppercase tracking-wide hover:border-accent transition-colors">Kardio atau angkat?</button>
          <button type="button" onClick={() => handleSend(null, 'Jenis & Cara Latihan Pemula', true)} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono uppercase tracking-wide hover:border-accent transition-colors">Cara & Jenis Latihan</button>
          <button type="button" onClick={() => handleSend(null, 'Pola Makan & Nutrisi Pemula', true)} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono uppercase tracking-wide hover:border-accent transition-colors">Nutrisi & Makan</button>
          <button type="button" onClick={() => handleSend(null, 'Pola Tidur & Recovery Pemula', true)} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono uppercase tracking-wide hover:border-accent transition-colors">Tidur & Recovery</button>
          <button type="button" onClick={() => handleSend(null, 'Kesalahan Fatal Pemula', true)} className="flex-shrink-0 w-[170px] text-center text-xs px-2.5 py-2.5 bg-[#100E16] border border-[#211D2C] text-text-high font-mono uppercase tracking-wide hover:border-accent transition-colors">Kesalahan Fatal</button>
        </div>
      </div>

      <form onSubmit={(e) => handleSend(e)} className="pt-2 border-t border-[#211D2C] flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya Seolha..." className="flex-1 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2.5 text-sm text-text-high focus:outline-none" />
        <button type="submit" className="w-11 h-11 bg-accent flex items-center justify-center text-white"><Send size={16} /></button>
      </form>
    </div>
  )
}

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

// PREMIUM DARK-MODE RECOVERY CARD REPOSITORIES UNTUK AKURASI DAFTAR 17533.JPG
const SYSTEM_IMAGE_CARDS = {
  beban: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'><rect width='320' height='180' fill='%230F0E17'/><rect x='10' y='10' width='300' height='160' rx='6' fill='%23161420' stroke='%23211D2C' stroke-width='1'/><text x='30' y='45' fill='%237C5CFF' font-family='monospace' font-size='12' font-weight='bold'>STRENGTH HYBRID PROTOCOL</text><line x1='30' y1='55' x2='290' y2='55' stroke='%23211D2C' stroke-width='1'/><text x='35' y='85' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Target Sesi: Ledakan Daya & Kontraksi Sempurna</text><text x='35' y='105' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Fokus Form: Jaga Kestabilan Sendi & Tempo Gerakan</text><rect x='220' y='140' width='70' height='14' rx='2' fill='%237C5CFF' opacity='0.2'/><text x='234' y='151' fill='%237C5CFF' font-family='monospace' font-size='9' font-weight='bold'>STRENGTH</text></svg>",
  kardio: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'><rect width='320' height='180' fill='%230F0E17'/><rect x='10' y='10' width='300' height='160' rx='6' fill='%23161420' stroke='%23211D2C' stroke-width='1'/><text x='30' y='45' fill='%237C5CFF' font-family='monospace' font-size='12' font-weight='bold'>ENDURANCE CARDIO SYSTEM</text><line x1='30' y1='55' x2='290' y2='55' stroke='%23211D2C' stroke-width='1'/><text x='35' y='85' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Pembakaran Lemak Maksimal & Penguatan Jantung</text><text x='35' y='105' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Aktivitas: Running, Cycling, Swimming, HIIT</text><rect x='220' y='140' width='70' height='14' rx='2' fill='%237C5CFF' opacity='0.2'/><text x='239' y='151' fill='%237C5CFF' font-family='monospace' font-size='9' font-weight='bold'>ENDURE</text></svg>",
  fleksibilitas: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'><rect width='320' height='180' fill='%230F0E17'/><rect x='10' y='10' width='300' height='160' rx='6' fill='%23161420' stroke='%23211D2C' stroke-width='1'/><text x='30' y='45' fill='%237C5CFF' font-family='monospace' font-size='12' font-weight='bold'>FLEXIBILITY & MOBILITY MATRIX</text><line x1='30' y1='55' x2='290' y2='55' stroke='%23211D2C' stroke-width='1'/><text x='35' y='85' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Pelebaran Jangkauan Gerak Sendi (ROM)</text><text x='35' y='105' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Aktivitas: Yoga, Stretching, Fascia Release</text><rect x='220' y='140' width='70' height='14' rx='2' fill='%237C5CFF' opacity='0.2'/><text x='236' y='151' fill='%237C5CFF' font-family='monospace' font-size='9' font-weight='bold'>FLEX_ROM</text></svg>",
  pemulihan: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'><rect width='320' height='180' fill='%230F0E17'/><rect x='10' y='10' width='300' height='160' rx='6' fill='%23161420' stroke='%23211D2C' stroke-width='1'/><text x='30' y='45' fill='%237C5CFF' font-family='monospace' font-size='12' font-weight='bold'>RECOVERY & REST TIME</text><line x1='30' y1='55' x2='290' y2='55' stroke='%23211D2C' stroke-width='1'/><text x='35' y='85' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Mode: Deaktivasi Sistem Otot & Perbaikan Jaringan</text><text x='35' y='105' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Fokus Utama: Kualitas Tidur LeLap & Hidrasi Cairan</text><rect x='220' y='140' width='70' height='14' rx='2' fill='%237C5CFF' opacity='0.2'/><text x='238' y='151' fill='%237C5CFF' font-family='monospace' font-size='9' font-weight='bold'>RECOVER</text></svg>",
  makanan: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'><rect width='320' height='180' fill='%230F0E17'/><rect x='10' y='10' width='300' height='160' rx='6' fill='%23161420' stroke='%23211D2C' stroke-width='1'/><text x='30' y='45' fill='%237C5CFF' font-family='monospace' font-size='12' font-weight='bold'>ANABOLIC KITCHEN MATRIX</text><line x1='30' y1='55' x2='290' y2='55' stroke='%23211D2C' stroke-width='1'/><text x='35' y='85' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Rekomendasi Menu: Dada Ayam Panggang, Sayur Hijau</text><text x='35' y='105' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Makro Nutrisi: Protein Tinggi, Serat Serap Tinggi</text><rect x='220' y='140' width='70' height='14' rx='2' fill='%237C5CFF' opacity='0.2'/><text x='232' y='151' fill='%237C5CFF' font-family='monospace' font-size='9' font-weight='bold'>NUTRITION</text></svg>",
  lainnya: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'><rect width='320' height='180' fill='%230F0E17'/><rect x='10' y='10' width='300' height='160' rx='6' fill='%23161420' stroke='%23211D2C' stroke-width='1'/><text x='30' y='45' fill='%237C5CFF' font-family='monospace' font-size='12' font-weight='bold'>CUSTOM HYBRID QUEST MATRIX</text><line x1='30' y1='55' x2='290' y2='55' stroke='%23211D2C' stroke-width='1'/><text x='35' y='85' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Aktivitas Kustom Terdeteksi Lewat Log Sistem</text><text x='35' y='105' fill='%23EDEAF6' font-family='sans-serif' font-size='11'>• Eksekusi Instruksi Sesuai Saran Pelatih Seolha</text><rect x='220' y='140' width='70' height='14' rx='2' fill='%237C5CFF' opacity='0.2'/><text x='238' y='151' fill='%237C5CFF' font-family='monospace' font-size='9' font-weight='bold'>CUSTOM</text></svg>"
}

// VIDEO POOL UTK TOTAL AKURASI SELURUH ITEM 17533.JPG
const VIDEO_ROUTING_POOL = {
  beban: ['UItWltVZZmE', '7K37eH7fG34', 'ixkQaYn5eg0'], // Push, Pull, Legs, Chest, Back, Upper, Lower, Shoulders, Arms, Glutes, Functional, Powerlifting, Olympic, CrossFit
  kardio: ['2MoGxae-zyo', 'unV8VdfR4bE', 'ml6cT4AZFrI'], // Cardio, HIIT, Running, Cycling, Swimming, Sport-specific, Boxing/Combat
  fleksibilitas: ['Kx48H27666Y', 'inpokvFX0o8', 'm07_u_G9_9U'], // Mobility, Stretching, Yoga, Meditasi
  pemulihan: ['t0kACis_dJE', 'qwz9z6q_JmY', '5M1v9v7F7xM'], // Recovery, Rest, Sleep
  makanan: ['3_9yOQ83PjI', '7tU2-QeCjGg', 'OThf70NlV2M'], // Makanan, Diet, Resep
  lainnya: ['UItWltVZZmE', '2MoGxae-zyo'] // Fallback + Lainnya
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
      setLiveTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const extractYoutubeId = (text) => {
    if (!text) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const matches = text.match(regExp)
    if (matches && matches[2].length === 11) return matches[2]
    const inlineReg = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const inlineMatches = text.match(inlineReg)
    return inlineMatches ? inlineMatches[1] : null
  }

  const validateVideoId = async (id) => {
    if (!id || id.length !== 11) return false
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`)
      const data = await res.json()
      return !data.error && data.title
    } catch {
      return false
    }
  }

  const resolveValidatedMedia = async (category, textUrlId) => {
    if (textUrlId) {
      const isPrimaryOk = await validateVideoId(textUrlId)
      if (isPrimaryOk) return { type: 'video', src: textUrlId }
    }

    const pool = VIDEO_ROUTING_POOL[category] || VIDEO_ROUTING_POOL.lainnya
    for (const vidId of pool) {
      if (vidId !== textUrlId) {
        const isBackupOk = await validateVideoId(vidId)
        if (isBackupOk) return { type: 'video', src: vidId }
      }
    }

    return { type: 'image', src: SYSTEM_IMAGE_CARDS[category] || SYSTEM_IMAGE_CARDS.lainnya }
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
        text: `${getGreeting()}, ${currentTier}. Paling susah itu bukan latihannya — tapi keluar pintu dan mulai.`,
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
    if (savedClaim === 'true') setIsQuestClaimed(true)
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
        { sender: 'seolha', text: 'Energi aku sudah habis untuk hari ini (Batas 5 pertanyaan telah tercapai). Kita obrol lagi besok ya!', media: null }
      ])
      if (!customMsg) setInput('')
      return
    }

    const newMessages = [...messages, { sender: 'user', text: msgToSend }]
    if (!customMsg) setInput('')
    setMessages(newMessages)
    setLoading(true)

    if (isFaq) {
      let faqReply = ''
      let mediaAsset = null
      
      if (msgToSend.includes('Pemula')) {
        mediaAsset = await resolveValidatedMedia('beban', 'UItWltVZZmE')
        faqReply = `Sebagai seorang ${currentTier}, langkah awal terbaik di Daily Grind Log adalah membangun fondasi konsistensi gerakan dasar.\n\nFokuslah pada latihan beban seluruh tubuh (Full-Body Workout) menggunakan berat badan sendiri seperti Squat, Push-up, dan Plank.\n\nBerikut panduan visual aman pilihan Seolha untuk menyelaraskan form latihanmu:`
      } else {
        mediaAsset = await resolveValidatedMedia('kardio', 'gcNh17CkW64')
        faqReply = `Kardio dan Angkat Beban adalah dua pilar kekuatan yang saling melengkapi, ${currentTier}.\n\n1. **Angkat Beban:** Wajib diutamakan untuk merobek jaringan otot lama agar tumbuh menjadi massa otot baru yang lebih padat.\n2. **Kardio:** Berfungsi menjaga stamina kapasitas jantung.\n\nBerikut panduan latihan penyeimbang yang terverifikasi aktif:`
      }

      setMessages(prev => [...prev, { sender: 'seolha', text: faqReply, media: mediaAsset }])
      setLoading(false)
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
        let replyText = resData.reply || 'Maaf, sinyal pikiran aku terganggu.'
        
        // INTERCEPTOR MATRIX UTK AKURASI TOTAL LIST 17533.JPG
        let matchedCategory = 'lainnya'
        const lowerText = replyText.toLowerCase()
        const inputLower = msgToSend.toLowerCase()

        // 1. Kelompok Beban/Strength (Push, Pull, Legs, Upper, Lower, Full Body, Chest, Back, Shoulders, Arms, Core, Glutes, Powerlifting, Olympic, CrossFit, Functional)
        if (lowerText.includes('push') || lowerText.includes('pull') || lowerText.includes('legs') || lowerText.includes('upper') || lowerText.includes('lower') || lowerText.includes('body') || lowerText.includes('chest') || lowerText.includes('back') || lowerText.includes('shoulder') || lowerText.includes('arms') || lowerText.includes('core') || lowerText.includes('abs') || lowerText.includes('glutes') || lowerText.includes('lifting') || lowerText.includes('crossfit') || lowerText.includes('functional') || lowerText.includes('beban')) {
          matchedCategory = 'beban'
        }
        // 2. Kelompok Kardio/Endurance (Cardio, HIIT, Running, Cycling, Swimming, Boxing/Combat, Sport-specific)
        else if (lowerText.includes('kardio') || lowerText.includes('cardio') || lowerText.includes('hiit') || lowerText.includes('run') || lowerText.includes('cycle') || lowerText.includes('sepeda') || lowerText.includes('swim') || lowerText.includes('renang') || lowerText.includes('box') || lowerText.includes('combat') || lowerText.includes('sport')) {
          matchedCategory = 'kardio'
        }
        // 3. Kelompok Fleksibilitas/Yoga (Mobility, Stretching, Yoga, Meditasi, Mindfulness)
        else if (lowerText.includes('mobility') || lowerText.includes('stretch') || lowerText.includes('yoga') || lowerText.includes('meditasi') || lowerText.includes('mindful') || lowerText.includes('tenang') || lowerText.includes('mental')) {
          matchedCategory = 'fleksibilitas'
        }
        // 4. Kelompok Recovery & Rest (Recovery, Rest)
        else if (lowerText.includes('tidur') || lowerText.includes('sleep') || lowerText.includes('istirahat') || lowerText.includes('recovery') || lowerText.includes('rest')) {
          matchedCategory = 'pemulihan'
        }
        // 5. Kelompok Masakan/Nutrisi
        else if (lowerText.includes('makan') || lowerText.includes('dada ayam') || lowerText.includes('nutrisi') || lowerText.includes('sayur') || lowerText.includes('diet') || lowerText.includes('resep')) {
          matchedCategory = 'makanan'
        }

        const explicitId = extractYoutubeId(replyText)
        if (explicitId) {
          replyText = replyText.replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/g, '')
        }

        const finalMedia = await resolveValidatedMedia(matchedCategory, explicitId)

        setMessages(prev => [...prev, { sender: 'seolha', text: replyText, media: finalMedia }])
        setDailyCount(prev => prev + 1)
      } else {
        setMessages(prev => [...prev, { sender: 'seolha', text: 'Gagal mendapatkan respon dari engine chat.', media: null }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'seolha', text: 'Koneksi ke Seolha terputus.', media: null }])
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
          
          <span className="font-mono text-xs text-accent bg-[#100E16] px-2 py-0.5 border border-accent/20 rounded">
            [ {5 - dailyCount}/5 Energi 🔋 ]
          </span>
          
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

      {/* INTERACTIVE CHAT SCREEN VIEWPORT */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        {messages.map((m, i) => {
          return (
            <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-3 font-body text-sm leading-relaxed ${m.sender === 'user' ? 'bg-accent text-white rounded-tl-xl rounded-tr-xl rounded-bl-xl' : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6] rounded-tl-xl rounded-tr-xl rounded-bl-xl'}`}>
                {m.sender === 'seolha' && (
                  <div className="font-mono text-[10px] text-accent font-bold uppercase mb-1 flex items-center gap-1">
                    <Bot size={10} /> SEOLHA
                  </div>
                )}
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
              
              {/* RENDERING EMBED MEDIA (VALIDATED IFRAME PLAYERS OR SYSTEM CARD VECTOR ILLUSTS) */}
              {m.sender === 'seolha' && m.media && (
                <div className="w-[85%] mt-2 p-1 bg-[#100E16] border border-[#211D2C] rounded-lg shadow-xl overflow-hidden aspect-video transform-gpu animate-scaleUp">
                  {m.media.type === 'video' ? (
                    <iframe
                      className="w-full h-full rounded"
                      src={`https://www.youtube.com/embed/${m.media.src}?playsinline=1&enablejsapi=1&rel=0&modestbranding=1`}
                      title="PWA Secured Inline Stream Guide"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full rounded overflow-hidden flex items-center justify-center bg-[#0A0A0E]">
                      <img src={m.media.src} alt="System Framework Graphics Matrix" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#100E16] border border-[#211D2C] p-3 rounded-xl flex items-center gap-2 font-mono text-xs text-text-dim">
              <Loader2 size={12} className="animate-spin text-accent" />
              Seolha sedang menyelaraskan media visual aktif...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* HORIZONTAL FAQ BOX AREA */}
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

      {/* INPUT FORM FIELD */}
      <form onSubmit={(e) => handleSend(e)} className="pt-2 border-t border-[#211D2C] flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya Seolha..." className="flex-1 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2.5 text-sm text-text-high focus:outline-none focus:border-accent" />
        <button type="submit" disabled={loading || !input.trim()} className="w-11 h-11 bg-accent flex items-center justify-center text-white disabled:opacity-40"><Send size={16} /></button>
      </form>
    </div>
  )
}
import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2, Quote, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getRankTier } from '../lib/expSystem'
import { claimQuest } from '../lib/dailyQuests' // Import fungsi claim yang baru

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
  
  // 🕒 LOGIKA WAKTU BARU
  const getDynamicGreeting = () => {
    const now = new Date()
    const hrs = now.getHours()
    const min = now.getMinutes()
    const time = hrs * 100 + min

    if (time >= 0 && time <= 359) return "Selamat pagi"
    if (time >= 400 && time <= 759) return "Bangun dan waktunya bersinar"
    if (time >= 800 && time <= 1059) return "Selamat beraktivitas"
    if (time >= 1100 && time <= 1159) return "Selamat siang"
    if (time >= 1200 && time <= 1259) return "Selamat istirahat"
    if (time >= 1300 && time <= 1459) return "Selamat siang"
    if (time >= 1500 && time <= 1759) return "Selamat sore"
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

  const renderMessageText = (text) => {
    if (!text) return null
    return text.split('\n').map((line, idx) => {
      let processedLine = line
      const boldRegex = /\*\*(.*?)\*\*/g
      const parts = []
      let lastIndex = 0
      let match

      const isBullet = line.trim().startsWith('* ')
      if (isBullet) processedLine = line.trim().substring(2)

      while ((match = boldRegex.exec(processedLine)) !== null) {
        if (match.index > lastIndex) parts.push(processedLine.substring(lastIndex, match.index))
        parts.push(<strong key={match.index} className="text-accent font-black">{match[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      if (lastIndex < processedLine.length) parts.push(processedLine.substring(lastIndex))

      const content = parts.length > 0 ? parts : processedLine

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1 font-body text-sm text-[#EDEAF6]">
            <span className="text-accent text-xs mt-1.5">•</span>
            <div className="flex-1 whitespace-pre-wrap leading-relaxed">{content}</div>
          </div>
        )
      }
      return <p key={idx} className="whitespace-pre-wrap font-body text-sm text-[#EDEAF6] leading-relaxed my-1">{content}</p>
    })
  }

  const scanDynamicChatVideos = (userText, aiText) => {
    const combined = `${userText} ${aiText}`.toLowerCase()
    if (combined.includes('video') || combined.includes('vidio') || combined.includes('tonton') || combined.includes('link')) {
      if (combined.includes('tidur') || combined.includes('sleep') || combined.includes('recovery')) return VALID_YOUTUBE_POOL.tidur.map(id => ({ type: 'video', src: id }))
      if (combined.includes('makan') || combined.includes('nutrisi') || combined.includes('diet')) return VALID_YOUTUBE_POOL.makanan.map(id => ({ type: 'video', src: id }))
      if (combined.includes('kardio') || combined.includes('angkat') || combined.includes('beban')) return VALID_YOUTUBE_POOL.kardio_angkat.map(id => ({ type: 'video', src: id }))
      if (combined.includes('salah') || combined.includes('fatal') || combined.includes('dosa')) return VALID_YOUTUBE_POOL.kesalahan.map(id => ({ type: 'video', src: id }))
      if (combined.includes('jenis') || combined.includes('cara') || combined.includes('latihan')) return VALID_YOUTUBE_POOL.latihan.map(id => ({ type: 'video', src: id }))
      return VALID_YOUTUBE_POOL.mulai.map(id => ({ type: 'video', src: id }))
    }
    return null
  }

  useEffect(() => {
    const greetingText = getDynamicGreeting()
    setMessages([{ sender: 'seolha', text: `${greetingText}, ${currentTier}. Ada yang bisa saya bantu untuk menemani latihan hari ini?`, media: null }])
    fetchDailyLimit()
    checkQuestPersistence()
  }, [currentTier])

  const handleClaimLegendQuest = async () => {
    if (isQuestClaimed) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const quest = LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length]
    const success = await claimQuest(session.user.id, quest.id, 50)
    if (success) {
      setIsQuestClaimed(true)
      window.location.reload()
    }
  }

  const handleSend = async (e, customMsg = null, isFaq = false) => {
    if (e) e.preventDefault()
    const msgToSend = customMsg || input
    if (!msgToSend.trim() || loading) return

    if (!isFaq && dailyCount >= 5) {
      setMessages(prev => [...prev, { sender: 'user', text: msgToSend }, { sender: 'seolha', text: 'Energi aku sudah habis untuk hari ini.', media: null }])
      if (!customMsg) setInput('')
      return
    }

    if (!customMsg) setInput('')
    setMessages(prev => [...prev, { sender: 'user', text: msgToSend }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: msgToSend }], userStats })
      })
      const resData = await response.json()
      setMessages(prev => [...prev, { sender: 'seolha', text: resData.reply, media: scanDynamicChatVideos(msgToSend, resData.reply) }])
    } catch(err) {
      setMessages(prev => [...prev, { sender: 'seolha', text: 'Gagal mendapatkan respon.', media: null }])
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md p-4 max-w-lg mx-auto select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-[#211D2C]">
        <span className="font-display font-bold text-text-high">Seolha</span>
        <button onClick={onClose} className="p-1 text-text-dim"><X size={18} /></button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-3 text-sm ${m.sender === 'user' ? 'bg-accent text-white rounded-xl' : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6] rounded-xl'}`}>
              {renderMessageText(m.text)}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-text-dim italic">Seolha sedang berpikir...</div>}
      </div>
      
      {/* INPUT */}
      <form onSubmit={(e) => handleSend(e)} className="pt-2 border-t border-[#211D2C] flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2 text-sm text-text-high" />
        <button type="submit" className="bg-accent text-white px-4">Send</button>
      </form>
    </div>
  )
}

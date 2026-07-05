import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getRankTier } from '../lib/expSystem'

export default function CompanionAI({ userStats, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyCount, setDailyCount] = useState(0)
  const messagesEndRef = useRef(null)

  const currentTier = getRankTier(userStats?.level || 1)

  // SINKRONISASI WAKTU UTK GREETING (JAM 21:24 = SELAMAT MALAM)
  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr >= 5 && hr < 11) return 'Selamat pagi'
    if (hr >= 11 && hr < 15) return 'Selamat siang'
    if (hr >= 15 && hr < 19) return 'Selamat sore'
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

    // Jika bukan pertanyaan FAQ gratis, cek batasan limit harian energi
    if (!isFaq && dailyCount >= 5) {
      setMessages(prev => [...prev, 
        { sender: 'user', text: msgToSend },
        { sender: 'seolha', text: 'Energi aku sudah habis untuk hari ini (Batas 5 pertanyaan telah tercapai). Kita obrol lagi besok ya!' }
      ])
      if (!customMsg) setInput('')
      return
    }

    if (!customMsg) setInput('')
    setMessages(prev => [...prev, { sender: 'user', text: msgToSend }])
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // MUTLAK MENGARAH KE /api/chat (chat.js) SESUAI BACKEND ASLI LO
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: msgToSend,
          tier: currentTier,
          level: userStats?.level || 1,
          userId: session?.user?.id
        })
      })

      if (response.ok) {
        const resData = await response.json()
        const replyText = resData.reply || resData.text || resData.message || 'Maaf, sinyal pikiran aku terganggu.'
        setMessages(prev => [...prev, { sender: 'seolha', text: replyText }])
        
        // Kuota energi hanya berkurang jika bertanya di luar FAQ
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
      {/* HEADER CHAT */}
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

      {/* AREA PESAN OBROLAN */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
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

      {/* KEMBALIKAN PERTANYAAN FAQ - O ENERGI */}
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

      {/* FORM INPUT TEKS BOX */}
      <form onSubmit={(e) => handleSend(e)} className="pt-2 border-t border-[#211D2C] flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya Seolha..." className="flex-1 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2.5 text-sm text-text-high focus:outline-none focus:border-accent" />
        <button type="submit" disabled={loading || !input.trim()} className="w-11 h-11 bg-accent flex items-center justify-center text-white disabled:opacity-40"><Send size={16} /></button>
      </form>
    </div>
  )
}
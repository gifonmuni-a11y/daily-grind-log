import React, { useEffect } from 'react'
import { Trophy, Zap, Flame, Target, Sparkles } from 'lucide-react'
import SystemFrame from './SystemFrame'

export default function AchievementUnlockModal({ isOpen, achievement, onClose }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen || !achievement) return null

  // VARIASI IKON BERDASARKAN ID ACHIEVEMENT
  const getIcon = (id) => {
    const code = String(id).toLowerCase()
    if (code.includes('awaken')) return <Zap size={48} className="text-yellow-400" />
    if (code.includes('stop') || code.includes('flame') || code.includes('grind')) return <Flame size={48} className="text-rose-500" />
    if (code.includes('strike') || code.includes('target')) return <Target size={48} className="text-cyan-400" />
    return <Trophy size={48} className="text-amber-400" />
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0A0A0E]/90 backdrop-blur-md">
      <div className="absolute w-[280px] h-[280px] bg-accent/10 rounded-full filter blur-[60px] animate-pulse" />
      
      <SystemFrame className="w-full max-w-sm bg-[#0F0E17] p-6 flex flex-col items-center text-center relative" size={16}>
        <Sparkles size={24} className="text-amber-400 mb-2 animate-bounce" />
        <h1 className="font-display font-black text-2xl text-text-high uppercase mb-4">PENCAPAIAN BARU!</h1>
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#211D2C] to-[#0A0A0E] border border-accent/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(124,92,255,0.2)]">
          {getIcon(achievement.id)}
        </div>

        <h2 className="font-mono text-lg text-accent font-bold uppercase tracking-wider">{achievement.title}</h2>
        <p className="font-body text-xs text-text-muted mt-2 mb-6 px-2">{achievement.desc}</p>
        
        <button 
          onClick={onClose} 
          className="w-full py-2.5 bg-accent text-white font-mono font-bold uppercase text-xs tracking-widest"
          style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 10px, 10px 100%, 0 calc(100% - 10px))' }}
        >
          KONFIRMASI
        </button>
      </SystemFrame>
    </div>
  )
}
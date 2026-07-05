import React, { useEffect } from 'react'
import { Shield, Sparkles } from 'lucide-react'
import SystemFrame from './SystemFrame'

export default function AchievementUnlockModal({ isOpen, achievement, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen || !achievement) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0A0A0E]/90 backdrop-blur-md">
      <div className="absolute w-[280px] h-[280px] bg-cyan-500/20 rounded-full filter blur-[60px] animate-pulse" />
      <div className="absolute w-[180px] h-[180px] bg-amber-500/15 rounded-full filter blur-[40px] animate-ping" style={{ animationDuration: '2.5s' }} />

      <SystemFrame 
        className="w-full max-w-sm bg-[#0F0E17] p-6 flex flex-col items-center text-center relative overflow-hidden"
        size={16}
        style={{ 
          border: '1px solid #06B6D4',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)' 
        }}
      >
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 via-amber-400 to-cyan-500" />

        <div className="flex items-center gap-1 mb-1 animate-pulse">
          <Sparkles size={12} className="text-amber-400" />
          <p className="font-mono text-[10px] tracking-[0.25em] text-cyan-400 font-black uppercase">
            ACHIEVEMENT UNLOCKED
          </p>
          <Sparkles size={12} className="text-amber-400" />
        </div>

        <h1 className="font-display font-black text-2xl text-text-high tracking-wide mb-5 uppercase">
          PENCAPAIAN BARU!
        </h1>

        <div className="relative my-3 flex items-center justify-center w-24 h-24 bg-cyan-950/20 border border-cyan-800/40 rounded-full shadow-inner">
          <div className="absolute inset-1 border border-dashed border-amber-400/40 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
          <Shield size={44} className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-bounce" />
        </div>

        <div className="mt-3 w-full mb-6">
          <h2 className="font-mono text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-text-high to-amber-300 font-extrabold uppercase tracking-wide">
            {achievement.title}
          </h2>
          <p className="font-body text-xs text-gray-400 mt-2 px-4 leading-relaxed bg-[#0A0A0E] py-2 border border-[#211D2C]">
            {achievement.desc}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 font-mono text-xs font-bold tracking-widest uppercase border transition-all duration-300 bg-cyan-950/30 border-cyan-500 text-cyan-300 hover:bg-cyan-500 hover:text-[#0A0A0E]"
          style={{ boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)' }}
        >
          KONFIRMASI
        </button>
      </SystemFrame>
    </div>
  )
}

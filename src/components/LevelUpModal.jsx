import React from 'react'
import { Award, Star, Crown, Flame, Rocket, Zap } from 'lucide-react'
import SystemFrame from './SystemFrame'

export default function LevelUpModal({ isOpen, oldTier, newTier, newLevel, onClose }) {
  if (!isOpen) return null

  // VARIASI IKON MEGAH TIAP TIER KASTA
  const getTierIcon = (tier) => {
    const t = String(tier).toUpperCase()
    if (t.includes('OVERLORD')) return <Crown size={52} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
    if (t.includes('MYTHICAL')) return <Flame size={52} className="text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
    if (t.includes('GRAND MASTER')) return <Rocket size={52} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
    if (t.includes('MASTER')) return <Star size={52} className="text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.6)]" />
    if (t.includes('CHALLENGER')) return <Zap size={52} className="text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.6)]" />
    return <Award size={52} className="text-blue-400" />
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0A0E]/95 backdrop-blur-md">
      <div className="absolute w-[320px] h-[320px] bg-accent/10 rounded-full filter blur-[80px]" />
      
      <SystemFrame className="w-full max-w-sm bg-[#0F0E17] p-6 flex flex-col items-center text-center relative" size={20} style={{ border: '1px solid #211D2C' }}>
        <h1 className="font-display font-black text-3xl text-transparent bg-clip-text bg-gradient-to-b from-text-high to-text-dim tracking-widest mb-6">TIER UP!</h1>
        
        <div className="w-28 h-28 rounded-full bg-[#100E16] border border-[#211D2C] flex items-center justify-center mb-4 shadow-inner">
          {getTierIcon(newTier)}
        </div>
        
        <span className="font-mono text-[10px] text-text-dim tracking-widest uppercase mb-1">GELAR BARU DICAPAI</span>
        <h2 className="font-display font-black text-2xl uppercase tracking-wider text-accent">{newTier}</h2>
        
        <div className="mt-4 px-4 py-1.5 bg-[#100E16] border border-[#211D2C] font-mono text-xs text-text-high">
          {oldTier || 'TRAINER'} ➔ <span className="text-accent font-bold">LVL {newLevel}</span>
        </div>
        
        <button 
          onClick={onClose} 
          className="mt-8 w-full py-3 font-display font-black text-sm tracking-wider text-white bg-accent hover:bg-accent-hover transition-colors"
          style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
        >
          KLAIM KEKUATAN
        </button>
      </SystemFrame>
    </div>
  )
}
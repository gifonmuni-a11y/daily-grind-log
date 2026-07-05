import React, { useEffect } from 'react'
import { Award } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { getTitleTierColor, getTitleTierGlow } from '../lib/rankColors'

export default function LevelUpModal({ isOpen, oldTier, newTier, newLevel, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const tierColor = getTitleTierColor(newTier)
  const tierGlow = getTitleTierGlow(newTier)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0A0E]/95 backdrop-blur-md">
      <div className="absolute w-[350px] h-[350px] bg-rose-600/20 rounded-full filter blur-[80px] animate-pulse" />
      <div className="absolute w-[200px] h-[200px] bg-amber-500/20 rounded-full filter blur-[60px] animate-ping" style={{ animationDuration: '3s' }} />

      <SystemFrame 
        className="w-full max-w-sm bg-[#0F0E17] p-6 flex flex-col items-center text-center relative overflow-hidden"
        size={20}
        style={{ 
          border: `1px solid ${tierColor}66`,
          boxShadow: `0 0 35px ${tierColor}44` 
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-rose-500" />
        <p className="font-mono text-xs tracking-[0.2em] text-amber-400 font-extrabold uppercase animate-pulse mb-1">
          ⚔️ PROMOSI PANGKAT ⚔️
        </p>
        <h1 className="font-display font-black text-3xl text-transparent bg-clip-text bg-gradient-to-b from-text-high via-gray-100 to-gray-400 tracking-wide mb-6">
          TIER UP!
        </h1>

        <div className="relative my-4 flex items-center justify-center w-28 h-28">
          <div 
            className="absolute inset-0 rounded-full border border-dashed animate-spin" 
            style={{ borderColor: `${tierColor}44`, animationDuration: '12s' }} 
          />
          <div 
            className="w-20 h-20 rotate-45 flex items-center justify-center border-2 shadow-2xl"
            style={{ 
              background: 'linear-gradient(135deg, #1A1625 0%, #0A0A0E 100%)',
              borderColor: tierColor,
              boxShadow: tierGlow !== 'none' ? tierGlow : `0 0 20px ${tierColor}66`
            }}
          >
            <div className="-rotate-45">
              <Award size={36} style={{ color: tierColor }} className="animate-bounce" />
            </div>
          </div>
        </div>

        <div className="mt-4 w-full">
          <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">GELAR BARU DICAPAI</p>
          <h2 
            className="font-display font-black text-2xl uppercase tracking-wider mt-1 filter drop-shadow-md"
            style={{ color: tierColor }}
          >
            {newTier}
          </h2>
          <div className="mt-4 mb-6 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2 flex items-center justify-center gap-4 font-mono text-sm rounded">
            <span className="text-gray-500 uppercase text-xs">{oldTier}</span>
            <span className="text-amber-400 font-bold">➜</span>
            <span className="text-text-high font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              LVL {newLevel}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 font-mono text-xs font-bold tracking-widest uppercase border"
          style={{ 
            background: `linear-gradient(90deg, ${tierColor}22, transparent)`, 
            borderColor: tierColor,
            color: '#EDEAF6' 
          }}
        >
          KLAIM KEKUATAN
        </button>
      </SystemFrame>
    </div>
  )
}

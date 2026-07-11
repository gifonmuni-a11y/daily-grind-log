import React, { useState } from 'react'
import { Edit2, Trash2, Share2, Calendar, Clock, Loader2, ShieldCheck } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { getRankColor, getRankGlow } from '../lib/rankColors'
import * as shareUtils from '../lib/shareCard'

export default function EntryCard({ entry, profile, level, streak, onEdit, onDeleteTrigger }) {
  const [isDownloading, setIsDownloading] = useState(false)
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Invalid Date'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Invalid Date'
    return d.toLocaleDateString('id-ID', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getRankLabel = (rank) => {
    return { S: 'OVERLOAD', A: 'MYTHICAL', B: 'GRAND MASTER', C: 'MASTER', D: 'PLATINUM', E: 'GOLD' }[rank] || 'BRONZE'
  }

  const getRankExp = (rank) => {
    return { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }[rank] || 0
  }

  const rankColor = getRankColor(entry.rank, true)
  const rankGlow = getRankGlow(entry.rank, true)
  const displayDuration = entry.duration || entry.duration_minutes

  const handleShareClick = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const generateFn = shareUtils.generateShareCard || shareUtils.default
      if (typeof generateFn === 'function') {
        const customizedEntry = { ...entry, note: entry.note || entry.notes }
        const result = await generateFn({ profile, entry: customizedEntry, level, streak })
        if (result && result.dataUrl) {
          const downloadLink = document.createElement('a')
          downloadLink.download = `grind-log-day-${entry.day_number || 'session'}.png`
          downloadLink.href = result.dataUrl
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="mx-4 mb-5 relative animate-in fade-in duration-200">
      <SystemFrame
        className="bg-[#100E16] p-4 flex flex-col relative overflow-hidden"
        size={14}
        style={{ border: '1px solid #211D2C' }}
      >
        {/* 🎯 PERBARUI UKURAN FOTO 1:1 KOTAK PRESISI PREMIUM */}
        {entry.image_url && (
          <div className="relative w-full aspect-square bg-[#0A0A0E] border border-[#211D2C] mb-4 overflow-hidden rounded-lg">
            <img
              src={entry.image_url}
              alt={entry.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E17]/60 to-transparent pointer-events-none" />
          </div>
        )}

        <div className="flex gap-4 items-start z-20">
          <div 
            className="w-14 h-14 shrink-0 flex flex-col items-center justify-center border text-center relative rounded-md"
            style={{ 
              borderColor: rankColor, 
              background: 'linear-gradient(135deg, #100E16 0%, #0A0A0E 100%)',
              boxShadow: rankGlow 
            }}
          >
            <span className="font-display font-black text-xl leading-none" style={{ color: rankColor }}>
              {entry.rank}
            </span>
            <span className="font-mono text-[7px] tracking-tight uppercase mt-1 text-text-dim">
              {getRankLabel(entry.rank)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-text-dim font-mono text-[11px] flex-wrap mb-1.5">
              <span className="text-accent font-bold bg-[#7C5CFF]/10 px-1.5 py-0.5 rounded">DAY #{entry.day_number}</span>
              {entry.category && (
                <span className="bg-[#211D2C] px-1.5 py-0.5 text-[10px] text-gray-300 uppercase rounded">
                  {entry.category}
                </span>
              )}
              <div className="flex items-center gap-1 text-text-dim">
                <Calendar size={11} />
                <span>{formatDate(entry.entry_date)}</span>
              </div>
              {displayDuration && (
                <div className="flex items-center gap-1 text-text-dim">
                  <Clock size={11} />
                  <span>{displayDuration}</span>
                </div>
              )}
            </div>

            <h3 className="font-display font-bold text-base text-[#EDEAF6] uppercase tracking-wide mb-1 leading-tight">
              {entry.title || 'Untitled Session'}
            </h3>

            {entry.notes && (
              <p className="font-body text-xs text-[#8B8696] leading-relaxed whitespace-pre-wrap mt-1">
                {entry.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#211D2C]/60 z-20">
          <span className="font-mono text-xs font-bold" style={{ color: rankColor }}>
            +{getRankExp(entry.rank)} EXP
          </span>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={handleShareClick}
              disabled={isDownloading}
              className="p-2 hover:bg-[#211D2C] rounded-lg text-text-dim hover:text-accent transition-colors disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin text-accent" /> : <Share2 size={14} />}
            </button>
            <button 
              onClick={() => onEdit(entry)} 
              className="p-2 hover:bg-[#211D2C] rounded-lg text-text-dim hover:text-white transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={() => onDeleteTrigger(entry.id)} 
              className="p-2 hover:bg-[#211D2C] rounded-lg text-text-dim hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </SystemFrame>
    </div>
  )
}

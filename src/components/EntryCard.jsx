import React from 'react'
import { Edit2, Trash2, Share2, Calendar, Clock } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { getRankColor, getRankGlow } from '../lib/rankColors'
// Mengimpor utility share bawaan aplikasi lo untuk auto-download image
import * as shareUtils from '../lib/shareCard'

export default function EntryCard({ entry, profile, level, streak, onEdit, onDelete }) {
  
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
    return { S: 'LEGENDARY', A: 'EXCELLENT', B: 'GOOD', C: 'AVERAGE', D: 'POOR', E: 'FAILED' }[rank] || 'UNKNOWN'
  }

  const getRankExp = (rank) => {
    return { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }[rank] || 0
  }

  const rankColor = getRankColor(entry.rank, true)
  const rankGlow = getRankGlow(entry.rank, true)

  // Fungsi memicu otomatis download gambar share card dari lib bawaan lo
  const handleShareClick = () => {
    const shareFn = shareUtils.default || shareUtils.shareCard || shareUtils.downloadShareCard
    if (typeof shareFn === 'function') {
      shareFn(entry, profile, { level, streak })
    } else {
      alert('Sistem download share card sedang bersiap, coba sekali lagi.')
    }
  }

  return (
    <div className="mx-4 mb-4 relative">
      <SystemFrame
        className="bg-panel p-4 flex flex-col relative overflow-hidden"
        size={14}
        style={{ border: '1px solid #211D2C' }}
      >
        
        {/* LANDSCAPE IMAGE AT TOP (Hanya muncul jika ada foto latihan) */}
        {entry.image_url && (
          <div className="relative w-full h-44 bg-[#0A0A0E] border border-[#211D2C] mb-3 overflow-hidden z-10">
            <img
              src={entry.image_url}
              alt={entry.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E17]/50 to-transparent pointer-events-none" />
          </div>
        )}

        {/* MIDDLE SECTION: SPLIT LAYOUT (RANK BADGE LEFT, TEXT INFOS RIGHT) */}
        <div className="flex gap-4 items-start z-20">
          
          {/* LEFT SIDE: SQUARE RANK BADGE BOX */}
          <div 
            className="w-14 h-14 shrink-0 flex flex-col items-center justify-center border text-center relative"
            style={{ 
              borderColor: rankColor, 
              background: 'linear-gradient(135deg, #100E16 0%, #0A0A0E 100%)',
              boxShadow: rankGlow 
            }}
          >
            <span className="font-display font-black text-xl leading-none" style={{ color: rankColor }}>
              {entry.rank}
            </span>
            <span className="font-mono text-[8px] tracking-wider uppercase mt-1 text-text-dim">
              {getRankLabel(entry.rank)}
            </span>
          </div>

          {/* RIGHT SIDE: METADATA & TITLE STACK */}
          <div className="flex-1 min-w-0">
            
            {/* Metadata Badges & Tags Line */}
            <div className="flex items-center gap-2 text-text-dim font-mono text-[11px] flex-wrap mb-1">
              <span className="text-accent font-bold">DAY #{entry.day_number}</span>
              {entry.category && (
                <span className="bg-[#211D2C] px-1.5 py-0.5 text-[10px] text-gray-300 uppercase">
                  {entry.category}
                </span>
              )}
              <div className="flex items-center gap-1 text-text-dim">
                <Calendar size={11} />
                <span>{formatDate(entry.entry_date)}</span>
              </div>
              {entry.duration_minutes && (
                <div className="flex items-center gap-1 text-text-dim">
                  <Clock size={11} />
                  <span>{entry.duration_minutes} menit</span>
                </div>
              )}
            </div>

            {/* Title Sesi */}
            <h3 className="font-display font-bold text-base text-text-high uppercase tracking-wide mb-1 leading-tight">
              {entry.title || 'Untitled Session'}
            </h3>

            {/* Notes Sesi */}
            {entry.notes && (
              <p className="font-body text-xs text-text-muted leading-relaxed whitespace-pre-wrap mt-1">
                {entry.notes}
              </p>
            )}
          </div>
        </div>

        {/* BOTTOM ROW SECTION: EXP VALUE & ACTION ICON BUTTONS */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#211D2C]/40 z-20">
          <span className="font-mono text-xs font-bold" style={{ color: rankColor }}>
            +{getRankExp(entry.rank)} EXP
          </span>
          
          {/* Icons Row Action */}
          <div className="flex items-center gap-1">
            <button 
              onClick={handleShareClick}
              className="p-1.5 hover:bg-border-hover text-text-dim hover:text-accent transition-colors"
              title="Otomatis Download Share Card"
            >
              <Share2 size={14} />
            </button>
            <button 
              onClick={() => onEdit(entry)} 
              className="p-1.5 hover:bg-border-hover text-text-dim hover:text-text-high transition-colors"
              title="Edit Sesi"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={() => onDelete(entry.id)} 
              className="p-1.5 hover:bg-border-hover text-text-dim hover:text-danger transition-colors"
              title="Hapus Sesi"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

      </SystemFrame>
    </div>
  )
}

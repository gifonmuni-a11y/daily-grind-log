import { useState } from 'react'
import { Edit2, Trash2, Share2, Calendar, Clock, Eye } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { getRankColor, getRankGlow } from '../lib/rankColors'

export default function EntryCard({ entry, profile, level, streak, onEdit, onDelete }) {
  // State interaktif lokal untuk memindahkan titik potong gambar secara real-time
  const [cropPosition, setCropPosition] = useState('object-center')

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Invalid Date'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Invalid Date'
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const rankColor = getRankColor(entry.rank, true)
  const rankGlow = getRankGlow(entry.rank, true)

  const cycleCrop = () => {
    if (cropPosition === 'object-center') setCropPosition('object-top')
    else if (cropPosition === 'object-top') setCropPosition('object-bottom')
    else setCropPosition('object-center')
  }

  const getCropLabel = () => {
    if (cropPosition === 'object-top') return 'Fokus: Atas'
    if (cropPosition === 'object-bottom') return 'Fokus: Bawah'
    return 'Fokus: Tengah'
  }

  return (
    <div className="mx-4 mb-4 relative group">
      <SystemFrame
        className="bg-panel p-4 flex flex-col relative overflow-hidden"
        size={14}
        style={{ border: '1px solid #211D2C' }}
      >
        {/* ACTION BUTTONS (TOP RIGHT) */}
        <div className="absolute top-3 right-3 flex items-center gap-1 z-30">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 hover:bg-border-hover text-text-dim hover:text-text-high transition-colors"
            title="Edit Sesi"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 hover:bg-border-hover text-text-dim hover:text-danger transition-colors"
            title="Hapus Sesi"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* METADATA HEADER */}
        <div className="flex items-center gap-2 flex-wrap mb-3 pr-16">
          <span className="font-mono text-[10px] bg-accent/10 border border-accent/30 text-accent px-2 py-0.5 tracking-wider uppercase">
            DAY #{entry.day_number}
          </span>
          {entry.category && (
            <span className="font-mono text-[10px] bg-border-hover border border-text-dim/20 text-text-dim px-2 py-0.5 tracking-wider uppercase">
              {entry.category}
            </span>
          )}
          <div className="flex items-center gap-1 text-text-dim font-mono text-[11px] ml-1">
            <Calendar size={11} />
            <span>{formatDate(entry.entry_date)}</span>
          </div>
        </div>

        {/* TITLE & CONTENT CONTAINER */}
        <div className="flex flex-col gap-2">
          <h3 className="font-display font-black text-lg text-text-high tracking-wide uppercase leading-tight">
            {entry.title || 'Untitled Session'}
          </h3>
          
          {entry.notes && (
            <p className="font-body text-xs text-text-muted leading-relaxed whitespace-pre-wrap bg-[#0A0A0E]/60 p-2.5 border border-[#211D2C]/40 mb-2">
              {entry.notes}
            </p>
          )}
        </div>

        {/* PREMIUM 3:4 ASPECT RATIO IMAGE CONTAINER WITH CROP POSITION SELECTOR */}
        {entry.image_url && (
          <div className="relative w-full aspect-[3/4] bg-[#0A0A0E] border border-[#211D2C] my-2 overflow-hidden z-10 group/img">
            <img
              src={entry.image_url}
              alt={entry.title}
              className={`w-full h-full object-cover transition-all duration-300 ${cropPosition}`}
            />
            
            {/* BUTTON INTERAKTIF UNTUK PILIH CROP DI HP */}
            <button
              onClick={cycleCrop}
              className="absolute bottom-3 left-3 bg-[#0F0E17]/90 border border-[#3A3548] text-text-high font-mono text-[10px] px-2 py-1 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity shadow-xl"
            >
              <Eye size={10} className="text-accent" />
              {getCropLabel()}
            </button>
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E17] via-transparent to-transparent opacity-40 pointer-events-none" />
          </div>
        )}

        {/* METRICS & RANK BADGE LOWER BOX */}
        <div className="mt-2 pt-3 border-t border-[#211D2C]/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-text-dim font-mono text-xs">
            {entry.duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-text-muted" />
                <span>{entry.duration_minutes} mnt</span>
              </div>
            )}
          </div>

          {/* DYNAMIC GLOWING RANK CREST */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-text-dim uppercase tracking-widest">RANK</span>
            <div
              className="w-9 h-9 flex items-center justify-center font-display font-black text-sm border transition-all duration-300 shadow-md"
              style={{
                color: rankColor,
                borderColor: rankColor,
                boxShadow: rankGlow,
                background: `linear-gradient(135deg, #100E16 0%, #0A0A0E 100%)`
              }}
            >
              {entry.rank}
            </div>
          </div>
        </div>

      </SystemFrame>
    </div>
  )
}

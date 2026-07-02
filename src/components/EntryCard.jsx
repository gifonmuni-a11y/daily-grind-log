import { useState } from 'react'
import { Calendar, Clock, ChevronDown, Share2, Edit2, Trash2 } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { generateShareCard } from '../lib/shareCard'
import { getRankColor, getRankGlow, getAmbientAlpha } from '../lib/rankColors'

const RANK_LABELS = {
  S: 'LEGENDARY', A: 'EXCELLENT', B: 'GOOD', C: 'AVERAGE', D: 'POOR', E: 'FAILED'
}

export default function EntryCard({ entry, profile, level, streak, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [sharing, setSharing] = useState(false)
  const rankColor = getRankColor(entry.rank, true)
  const rankGlow = getRankGlow(entry.rank, true)
  const ambientAlpha = getAmbientAlpha(entry.rank)
  const exp = { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }[entry.rank] || 0

  const dateStr = new Date(entry.entry_date).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  async function handleShare() {
    setSharing(true)
    try {
      const { dataUrl, imageLoadFailed } = await generateShareCard({ profile, entry, level, streak })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `grind-day-${entry.day_number}.png`
      link.click()
      if (imageLoadFailed) {
        window.alert(
          'Kartu share berhasil dibuat, tapi foto entry gagal dimuat (kemungkinan bucket Supabase Storage belum public atau CORS belum diizinkan). Kartu tetap didownload tanpa foto.'
        )
      }
    } catch (e) {
      console.error('Share error', e)
      window.alert('Gagal membuat kartu share. Coba lagi atau periksa koneksi/gambar entry.')
    }
    setSharing(false)
  }

  return (
    <SystemFrame
      className="bg-panel mx-4 mb-3 overflow-hidden animate-fade-in"
      cornerColor={rankColor}
      size={14}
      style={{ boxShadow: `inset 0 -3px 16px -6px ${rankColor}${ambientAlpha}` }}
    >
      {entry.image_url && (
        <div className="relative w-full h-40 overflow-hidden">
          <img
            src={entry.image_url}
            alt="entry"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 50%, #100E16)' }}
          />
          <div
            className="absolute bottom-2 left-2 px-2 py-1 font-mono text-xs font-bold"
            style={{
              background: '#0A0A0Ecc',
              color: rankColor,
              border: `1px solid ${rankColor}66`,
            }}
          >
            +{exp} EXP
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex flex-col items-center justify-center w-14 h-14 shrink-0 font-display font-bold text-3xl"
            style={{
              background: rankColor + '22',
              border: `2px solid ${rankColor}66`,
              color: rankColor,
              boxShadow: rankGlow,
            }}
          >
            {entry.rank}
            <span className="font-mono text-xs font-normal" style={{ color: rankColor + 'cc', fontSize: '9px', lineHeight: 1 }}>
              {RANK_LABELS[entry.rank]}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs text-gray-400">DAY #{entry.day_number}</span>
              <span
                className="font-mono text-xs px-1.5 py-0.5"
                style={{ background: '#211D2C', color: '#D1D5DB' }}
              >
                {entry.category}
              </span>
            </div>
            <h3 className="font-display font-semibold text-lg text-text-high leading-tight">
              {entry.title}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={10} />
                {dateStr}
              </span>
              {entry.duration && (
                <span className="font-mono text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={10} />
                  {entry.duration}
                </span>
              )}
            </div>
          </div>
        </div>

        {entry.note && (
          <div className="mt-3">
            <p
              className={`font-body text-sm text-gray-300 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}
            >
              {entry.note}
            </p>
            {entry.note.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="font-mono text-xs text-accent mt-1 flex items-center gap-1"
              >
                {expanded ? 'Tutup' : 'Baca selengkapnya'}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>
        )}

        <div
          className="flex items-center justify-between mt-4 pt-3"
          style={{ borderTop: '1px solid #211D2C' }}
        >
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-gray-400">+</span>
            <span
              className="font-mono text-sm font-bold"
              style={{ color: rankColor }}
            >
              {exp} EXP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              disabled={sharing}
              className="p-1.5 hover:bg-border-hover transition-colors"
              title="Share"
            >
              <Share2 size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 hover:bg-border-hover transition-colors"
              title="Edit"
            >
              <Edit2 size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 hover:bg-border-hover transition-colors"
              title="Hapus"
            >
              <Trash2 size={14} className="text-danger" />
            </button>
          </div>
        </div>
      </div>
    </SystemFrame>
  )
}

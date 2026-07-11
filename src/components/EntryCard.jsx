import React, { useState } from 'react'
import { Edit2, Trash2, Share2, Calendar, Clock, Loader2 } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { getRankColor, getRankGlow } from '../lib/rankColors'
// Mengimpor file generator kartu milik lu
import * as shareUtils from '../lib/shareCard'

export default function EntryCard({ entry, profile, level, streak, onEdit, onDelete }) {
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
    return { S: 'LEGENDARY', A: 'EXCELLENT', B: 'GOOD', C: 'AVERAGE', D: 'POOR', E: 'FAILED' }[rank] || 'UNKNOWN'
  }

  const getRankExp = (rank) => {
    return { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }[rank] || 0
  }

  const rankColor = getRankColor(entry.rank, true)
  const rankGlow = getRankGlow(entry.rank, true)

  // FIX DURASI: Membaca teks bebas (seperti "3 jam 5 menit") langsung dari entry.duration
  const displayDuration = entry.duration || entry.duration_minutes

  // FIX SHARE ENGINE: Mengirimkan satu paket objek tunggal dan memicu unduhan otomatis berkas png
  const handleShareClick = async () => {
    if (isDownloading) return
    setIsDownloading(true)

    try {
      // Mencari fungsi utama generateShareCard di dalam berkas lib lu
      const generateFn = shareUtils.generateShareCard || shareUtils.default
      
      if (typeof generateFn === 'function') {
        // Toleransi nama variabel catatan: duplikasi notes ke note agar terbaca oleh canvas generator lu
        const customizedEntry = {
          ...entry,
          note: entry.note || entry.notes
        }

        // Mengirimkan satu paket objek tunggal sesuai syarat destructuring di shareCard.js lu
        const result = await generateFn({ 
          profile, 
          entry: customizedEntry, 
          level, 
          streak 
        })
        
        // Pemicu unduhan otomatis berkas gambar png ke HP lu
        if (result && result.dataUrl) {
          const downloadLink = document.createElement('a')
          downloadLink.download = `grind-log-day-${entry.day_number || 'session'}.png`
          downloadLink.href = result.dataUrl
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        } else {
          alert('Gagal mengambil data gambar share card.')
        }
      } else {
        alert('Fungsi generator kartu tidak ditemukan di berkas lib.')
      }
    } catch (err) {
      console.error('Error saat men-download share card:', err)
      alert('Gagal memproses download share card. Periksa koneksi atau gambar ilustrasi Anda.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="mx-4 mb-4 relative">
      <SystemFrame
        className="bg-panel p-4 flex flex-col relative overflow-hidden"
        size={14}
        style={{ border: '1px solid #211D2C' }}
      >
        
        {/* LANDSCAPE IMAGE AT TOP */}
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

        {/* MIDDLE SECTION: CLASSIC SPLIT LAYOUT */}
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
              {/* MENAMPILKAN TEKS DURASI SECARA AKURAT */}
              {displayDuration && (
                <div className="flex items-center gap-1 text-text-dim">
                  <Clock size={11} />
                  <span>{displayDuration}</span>
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
              disabled={isDownloading}
              className="p-1.5 hover:bg-border-hover text-text-dim hover:text-accent transition-colors disabled:opacity-50"
              title="Otomatis Download Share Card"
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin text-accent" />
              ) : (
                <Share2 size={14} />
              )}
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
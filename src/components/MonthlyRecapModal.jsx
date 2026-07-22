import { useRef, useState } from 'react'
import { X, Download, Share2, Trophy, Zap, Target, Flame } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { getRankColor } from '../lib/rankColors'

const RANK_EXP = { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }
const RANK_ORDER = ['S', 'A', 'B', 'C', 'D', 'E']
const PWA_LOGO_SRC = '/icon-192.png' // ganti sesuai path logo PWA kamu

// Ganti 'category' di bawah ini kalau field kategori sesi kamu namanya beda
function getCategory(entry) {
  return entry.category || 'Lainnya'
}

export default function MonthlyRecapModal({ entries = [], targetMonth, onClose }) {
  const [generating, setGenerating] = useState(false)
  const canvasRef = useRef(null)

  // targetMonth: objek Date di bulan yang mau direkap (default: bulan kemarin)
  const recapDate = targetMonth || (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d
  })()

  const monthEntries = entries.filter(e => {
    const d = new Date(e.entry_date)
    return d.getFullYear() === recapDate.getFullYear() && d.getMonth() === recapDate.getMonth()
  })

  const totalSesi = monthEntries.length
  const totalExp = monthEntries.reduce((sum, e) => sum + (RANK_EXP[e.rank] || 0), 0)

  const bestRank = RANK_ORDER.find(r => monthEntries.some(e => e.rank === r)) || '-'

  const categoryCount = monthEntries.reduce((acc, e) => {
    const c = getCategory(e)
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

  const monthLabel = recapDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  // Data grafik: total EXP per minggu di bulan itu
  const weeksInMonth = Math.ceil(
    (new Date(recapDate.getFullYear(), recapDate.getMonth() + 1, 0).getDate() +
      new Date(recapDate.getFullYear(), recapDate.getMonth(), 1).getDay()) / 7
  )
  const weeklyExp = Array.from({ length: weeksInMonth }, () => 0)
  monthEntries.forEach(e => {
    const d = new Date(e.entry_date)
    const firstDayOffset = new Date(recapDate.getFullYear(), recapDate.getMonth(), 1).getDay()
    const weekIndex = Math.floor((d.getDate() + firstDayOffset - 1) / 7)
    weeklyExp[weekIndex] += RANK_EXP[e.rank] || 0
  })
  const maxWeeklyExp = Math.max(...weeklyExp, 1)

  async function generateImage() {
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = 480 * scale
    canvas.height = 640 * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    // Background
    ctx.fillStyle = '#0A0A0E'
    ctx.fillRect(0, 0, 480, 640)
    ctx.strokeStyle = '#211D2C'
    ctx.lineWidth = 2
    ctx.strokeRect(8, 8, 464, 624)

    // Logo
    try {
      const logo = await loadImage(PWA_LOGO_SRC)
      ctx.drawImage(logo, 24, 28, 40, 40)
    } catch (_) {
      // kalau logo gagal dimuat, lanjut tanpa logo
    }

    ctx.fillStyle = '#F5F5F5'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('DAILY GRIND LOG', 76, 46)
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '13px sans-serif'
    ctx.fillText(`Rekap Bulanan · ${monthLabel}`, 76, 66)

    // Divider
    ctx.strokeStyle = '#211D2C'
    ctx.beginPath()
    ctx.moveTo(24, 92)
    ctx.lineTo(456, 92)
    ctx.stroke()

    // Stat cards
    const stats = [
      { label: 'TOTAL SESI', value: `${totalSesi}` },
      { label: 'TOTAL EXP', value: `${totalExp}` },
      { label: 'BEST RANK', value: bestRank },
      { label: 'TOP KATEGORI', value: topCategory },
    ]
    stats.forEach((s, i) => {
      const x = 24 + (i % 2) * 220
      const y = 116 + Math.floor(i / 2) * 76
      ctx.fillStyle = '#12121a'
      ctx.fillRect(x, y, 208, 64)
      ctx.strokeStyle = '#7C5CFF33'
      ctx.strokeRect(x, y, 208, 64)
      ctx.fillStyle = '#6B7280'
      ctx.font = '11px monospace'
      ctx.fillText(s.label, x + 14, y + 24)
      ctx.fillStyle = '#7C5CFF'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(String(s.value), x + 14, y + 50)
    })

    // Chart title
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '12px monospace'
    ctx.fillText('EXP PER MINGGU', 24, 300)

    // Bar chart
    const chartTop = 316
    const chartHeight = 140
    const barGap = 16
    const barWidth = (432 - barGap * (weeklyExp.length - 1)) / weeklyExp.length
    weeklyExp.forEach((exp, i) => {
      const h = (exp / maxWeeklyExp) * chartHeight
      const x = 24 + i * (barWidth + barGap)
      const y = chartTop + (chartHeight - h)
      ctx.fillStyle = '#7C5CFF'
      ctx.fillRect(x, y, barWidth, h)
      ctx.fillStyle = '#6B7280'
      ctx.font = '11px monospace'
      ctx.fillText(`M${i + 1}`, x + barWidth / 2 - 8, chartTop + chartHeight + 20)
    })

    // Footer
    ctx.fillStyle = '#4B5563'
    ctx.font = '10px monospace'
    ctx.fillText('Dibuat otomatis oleh Daily Grind Log', 24, 600)

    return canvas
  }

  async function handleDownload() {
    setGenerating(true)
    try {
      const canvas = await generateImage()
      const link = document.createElement('a')
      link.download = `rekap-${recapDate.getFullYear()}-${recapDate.getMonth() + 1}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setGenerating(false)
    }
  }

  async function handleShare() {
    setGenerating(true)
    try {
      const canvas = await generateImage()
      canvas.toBlob(async blob => {
        const file = new File([blob], `rekap-${monthLabel}.png`, { type: 'image/png' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Rekap Bulanan Daily Grind Log',
            text: `Rekap ${monthLabel}: ${totalSesi} sesi, ${totalExp} EXP!`,
          })
        } else {
          // Fallback: kalau Web Share API gak didukung, download aja
          const link = document.createElement('a')
          link.download = `rekap-${monthLabel}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
        setGenerating(false)
      }, 'image/png')
    } catch (_) {
      setGenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,10,14,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <SystemFrame className="bg-panel w-full max-w-md flex flex-col overflow-hidden" size={16}>
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #211D2C' }}
        >
          <div className="flex items-center gap-2">
            <img src={PWA_LOGO_SRC} alt="logo" className="w-6 h-6" onError={e => { e.currentTarget.style.display = 'none' }} />
            <h2 className="font-display font-bold text-lg text-text-high">REKAP {monthLabel.toUpperCase()}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-border-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3" style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={12} className="text-accent" />
                <p className="font-mono text-[10px] text-gray-500 uppercase">Total Sesi</p>
              </div>
              <p className="font-display font-bold text-xl text-text-high">{totalSesi}</p>
            </div>
            <div className="p-3" style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={12} className="text-accent" />
                <p className="font-mono text-[10px] text-gray-500 uppercase">Total EXP</p>
              </div>
              <p className="font-display font-bold text-xl text-accent">{totalExp}</p>
            </div>
            <div className="p-3" style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy size={12} className="text-amber-400" />
                <p className="font-mono text-[10px] text-gray-500 uppercase">Best Rank</p>
              </div>
              <p className="font-display font-bold text-xl" style={{ color: getRankColor(bestRank, true) }}>{bestRank}</p>
            </div>
            <div className="p-3" style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={12} className="text-danger" />
                <p className="font-mono text-[10px] text-gray-500 uppercase">Top Kategori</p>
              </div>
              <p className="font-display font-bold text-sm text-text-high truncate">{topCategory}</p>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] text-gray-500 uppercase mb-2">EXP per Minggu</p>
            <div className="flex gap-2 items-end h-20">
              {weeklyExp.map((exp, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-accent transition-all duration-300"
                      style={{ height: `${Math.max((exp / maxWeeklyExp) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">M{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors disabled:opacity-50"
              style={{ background: '#7C5CFF1A', border: '1px solid #7C5CFF44', color: '#7C5CFF' }}
            >
              <Download size={14} />
              Download
            </button>
            <button
              onClick={handleShare}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors disabled:opacity-50"
              style={{ background: '#0A0A0E', border: '1px solid #211D2C', color: '#F5F5F5' }}
            >
              <Share2 size={14} />
              Share
            </button>
          </div>
        </div>
      </SystemFrame>
    </div>
  )
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
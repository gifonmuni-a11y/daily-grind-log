import { useState } from 'react'
import SystemFrame from './SystemFrame'
import { BarChart2, Calendar } from 'lucide-react'
import { getRankColor } from '../lib/rankColors'

const RANK_EXP = { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }

export default function StatsDashboard({ entries }) {
  const [viewMode, setViewMode] = useState('week') // 'week' | 'month'

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
    return new Date(now.getFullYear(), now.getMonth(), i + 1)
  })

  const entryByDate = entries.reduce((acc, e) => {
    const d = new Date(e.entry_date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!acc[key] || (RANK_EXP[e.rank] || 0) > (RANK_EXP[acc[key].rank] || 0)) {
      acc[key] = e
    }
    return acc
  }, {})

  const dayLabels = ['M', 'S', 'Ss', 'R', 'K', 'J', 'Sb']
  const rankOrder = ['S', 'A', 'B', 'C', 'D', 'E']

  // Statistik ringkas buat mode "Bulan Ini"
  const monthEntries = entries.filter(e => {
    const d = new Date(e.entry_date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const monthTotalExp = monthEntries.reduce((sum, e) => sum + (RANK_EXP[e.rank] || 0), 0)
  const monthNameId = now.toLocaleDateString('id-ID', { month: 'long' })

  const activeDays = viewMode === 'week' ? last7Days : currentMonthDays

  return (
    <SystemFrame className="bg-panel mx-4 mb-4 p-4" size={14}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-accent" />
          <h3 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-widest">
            {viewMode === 'week' ? 'AKTIVITAS 7 HARI' : `AKTIVITAS ${monthNameId.toUpperCase()}`}
          </h3>
        </div>

        <div className="flex gap-1 shrink-0" style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
          <button
            onClick={() => setViewMode('week')}
            className="font-mono text-[10px] px-2 py-1 transition-colors"
            style={{
              color: viewMode === 'week' ? '#7C5CFF' : '#6B7280',
              background: viewMode === 'week' ? '#7C5CFF1A' : 'transparent',
            }}
          >
            7 HARI
          </button>
          <button
            onClick={() => setViewMode('month')}
            className="font-mono text-[10px] px-2 py-1 transition-colors"
            style={{
              color: viewMode === 'month' ? '#7C5CFF' : '#6B7280',
              background: viewMode === 'month' ? '#7C5CFF1A' : 'transparent',
            }}
          >
            BULAN INI
          </button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="flex items-center gap-3 mb-3 font-mono text-[11px] text-gray-400">
          <span>{monthEntries.length} sesi</span>
          <span className="text-gray-700">•</span>
          <span className="text-accent">{monthTotalExp} EXP</span>
        </div>
      )}

      <div
        className={`flex gap-2 items-end h-16 ${viewMode === 'month' ? 'overflow-x-auto scrollbar-thin' : ''}`}
      >
        {activeDays.map((d, i) => {
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
          const entry = entryByDate[key]
          const isToday = d.toDateString() === now.toDateString()
          const color = entry ? getRankColor(entry.rank, true) : '#211D2C'
          const height = entry ? '100%' : '20%'

          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5"
              style={viewMode === 'month' ? { minWidth: 14, flex: '0 0 auto' } : { flex: 1 }}
            >
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full transition-all duration-300"
                  style={{
                    height,
                    background: color,
                    opacity: entry ? 1 : 0.4,
                    minHeight: 4,
                  }}
                />
              </div>
              <span
                className="font-mono text-xs"
                style={{ color: isToday ? '#7C5CFF' : '#9CA3AF' }}
              >
                {viewMode === 'week' ? dayLabels[d.getDay()] : d.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 mt-3 flex-wrap">
        {rankOrder.map(rank => (
          <div key={rank} className="flex items-center gap-1">
            <div className="w-2 h-2" style={{ background: getRankColor(rank, true) }} />
            <span className="font-mono text-xs text-gray-400">{rank}</span>
          </div>
        ))}
      </div>
    </SystemFrame>
  )
}
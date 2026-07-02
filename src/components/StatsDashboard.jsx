import SystemFrame from './SystemFrame'
import { BarChart2 } from 'lucide-react'
import { getRankColor } from '../lib/rankColors'

export default function StatsDashboard({ entries }) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const entryByDate = entries.reduce((acc, e) => {
    const d = new Date(e.entry_date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!acc[key] || ({ S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }[e.rank] || 0) > ({ S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }[acc[key].rank] || 0)) {
      acc[key] = e
    }
    return acc
  }, {})

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const rankOrder = ['S', 'A', 'B', 'C', 'D', 'E']

  return (
    <SystemFrame className="bg-panel mx-4 mb-4 p-4" size={14}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={14} className="text-accent" />
        <h3 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-widest">
          7-Day Activity
        </h3>
      </div>

      <div className="flex gap-2 items-end h-16">
        {last7Days.map((d, i) => {
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
          const entry = entryByDate[key]
          const isToday = i === 6
          const color = entry ? getRankColor(entry.rank, true) : '#211D2C'
          const height = entry ? '100%' : '20%'

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
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
                {dayLabels[d.getDay()]}
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

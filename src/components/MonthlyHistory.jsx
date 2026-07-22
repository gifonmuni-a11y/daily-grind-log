import { useState } from 'react'
import { X, ChevronRight, Calendar } from 'lucide-react'
import SystemFrame from './SystemFrame'
import MonthlyRecapModal from './MonthlyRecapModal'
import { getRankColor } from '../lib/rankColors'

const RANK_EXP = { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }
const RANK_ORDER = ['S', 'A', 'B', 'C', 'D', 'E']

export default function MonthlyHistory({ entries = [], onClose }) {
  const [selectedMonth, setSelectedMonth] = useState(null)

  const monthMap = entries.reduce((acc, e) => {
    const d = new Date(e.entry_date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!acc[key]) {
      acc[key] = { date: new Date(d.getFullYear(), d.getMonth(), 1), entries: [] }
    }
    acc[key].entries.push(e)
    return acc
  }, {})

  const months = Object.values(monthMap).sort((a, b) => b.date - a.date)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,10,14,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <SystemFrame className="bg-panel w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" size={16}>
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #211D2C' }}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            <h2 className="font-display font-bold text-xl text-text-high">RIWAYAT BULANAN</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-border-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-2 scrollbar-thin">
          {months.length === 0 && (
            <p className="font-body text-sm text-gray-500 text-center py-8">
              Belum ada riwayat bulanan.
            </p>
          )}

          {months.map(({ date, entries: monthEntries }) => {
            const totalExp = monthEntries.reduce((sum, e) => sum + (RANK_EXP[e.rank] || 0), 0)
            const bestRank = RANK_ORDER.find(r => monthEntries.some(e => e.rank === r)) || '-'
            const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

            return (
              <button
                key={label}
                onClick={() => setSelectedMonth(date)}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-border-hover text-left"
                style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}
              >
                <div>
                  <p className="font-display font-bold text-sm text-text-high">{label}</p>
                  <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-gray-500">
                    <span>{monthEntries.length} sesi</span>
                    <span className="text-gray-700">•</span>
                    <span className="text-accent">{totalExp} EXP</span>
                    <span className="text-gray-700">•</span>
                    <span style={{ color: getRankColor(bestRank, true) }}>Best {bestRank}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-600 shrink-0" />
              </button>
            )
          })}
        </div>
      </SystemFrame>

      {selectedMonth && (
        <MonthlyRecapModal
          entries={entries}
          targetMonth={selectedMonth}
          onClose={() => setSelectedMonth(null)}
        />
      )}
    </div>
  )
}
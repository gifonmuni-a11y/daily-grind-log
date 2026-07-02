import { Edit2, Trash2 } from 'lucide-react'
import { getRankColor } from '../lib/rankColors'

export default function CompactRow({ entry, onEdit, onDelete }) {
  const rankColor = getRankColor(entry.rank, true)
  const exp = { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }[entry.rank] || 0

  const dateStr = new Date(entry.entry_date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short'
  })

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-panel transition-colors"
      style={{ borderBottom: '1px solid #211D2C' }}
    >
      <div
        className="w-8 h-8 flex items-center justify-center font-display font-bold text-sm shrink-0"
        style={{ background: rankColor + '22', color: rankColor, border: `1px solid ${rankColor}44` }}
      >
        {entry.rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-400 shrink-0">#{entry.day_number}</span>
          <span className="font-display font-semibold text-sm text-text-high truncate">
            {entry.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-400">{dateStr}</span>
          <span
            className="font-mono text-xs px-1.5 py-0.5"
            style={{ background: '#211D2C', color: '#D1D5DB' }}
          >
            {entry.category}
          </span>
        </div>
      </div>

      <span className="font-mono text-xs shrink-0 font-semibold" style={{ color: rankColor }}>
        +{exp}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(entry)}
          className="p-1 hover:bg-border-hover transition-colors"
        >
          <Edit2 size={12} className="text-gray-400" />
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1 hover:bg-border-hover transition-colors"
        >
          <Trash2 size={12} className="text-danger" />
        </button>
      </div>
    </div>
  )
}

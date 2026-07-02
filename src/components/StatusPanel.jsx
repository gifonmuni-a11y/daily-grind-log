import SystemFrame from './SystemFrame'
import { TrendingUp, Award, Target, Activity } from 'lucide-react'
import { getRankColor, getRankGlow, isHighTier } from '../lib/rankColors'
import { getEffectiveTotalExp } from '../lib/expSystem'

export default function StatusPanel({ entries, userId }) {
  const rankCounts = entries.reduce((acc, e) => {
    acc[e.rank] = (acc[e.rank] || 0) + 1
    return acc
  }, {})

  const totalSessions = entries.length
  const totalExp = getEffectiveTotalExp(entries, userId)

  const rankOrder = ['S', 'A', 'B', 'C', 'D', 'E']
  const topRank = rankOrder.find(r => rankCounts[r] > 0) || '—'
  const topRankColor = topRank !== '—' ? getRankColor(topRank, true) : '#9CA3AF'

  const categoryMap = entries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1
    return acc
  }, {})
  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  return (
    <SystemFrame className="bg-panel mx-4 mb-4 p-4" size={14}>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={14} className="text-accent" />
        <h3 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-widest">
          Status Overview
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat icon={<Target size={12} />} label="Sessions" value={totalSessions} />
        <Stat icon={<TrendingUp size={12} />} label="Total EXP" value={totalExp} color="#7C5CFF" />
        <Stat icon={<Award size={12} />} label="Best Rank" value={topRank} color={topRankColor} />
        <Stat label="Top Category" value={topCategory} small />
      </div>

      <div>
        <p className="font-mono text-xs text-gray-400 mb-2 uppercase tracking-wider">Rank Distribution</p>
        <div className="flex gap-2">
          {rankOrder.map(rank => {
            const count = rankCounts[rank] || 0
            const active = count > 0
            const color = getRankColor(rank, active)
            const glow = getRankGlow(rank, active)
            return (
              <div key={rank} className="flex-1 text-center">
                <div
                  className="font-mono text-xs font-bold mb-1"
                  style={{
                    color,
                    textShadow: glow !== 'none' ? `0 0 6px ${color}` : 'none',
                  }}
                >
                  {rank}
                </div>
                <div
                  className="font-mono text-xs"
                  style={{ color }}
                >
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SystemFrame>
  )
}

function Stat({ icon, label, value, color, small }) {
  return (
    <div
      className="p-3"
      style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <span
        className={`font-display font-bold ${small ? 'text-base' : 'text-xl'} text-text-high`}
        style={color ? { color } : {}}
      >
        {value}
      </span>
    </div>
  )
}

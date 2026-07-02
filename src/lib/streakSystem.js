export function calcStreak(entries) {
  if (!entries || entries.length === 0) return 0

  const uniqueDays = [
    ...new Set(
      entries.map(e => {
        const d = new Date(e.entry_date)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })
    )
  ].sort((a, b) => b.localeCompare(a))

  if (uniqueDays.length === 0) return 0

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) return 0

  let streak = 1
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const current = new Date(uniqueDays[i])
    const next = new Date(uniqueDays[i + 1])
    const diffMs = current - next
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export const rankExp = { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }

export function calcLevel(totalExp) {
  let level = 1
  let expSpentOnPrevLevels = 0
  while (true) {
    const maxExpThisLevel = Math.round(100 * Math.pow(level, 1.5))
    if (totalExp - expSpentOnPrevLevels < maxExpThisLevel) {
      return {
        level,
        expIntoLevel: totalExp - expSpentOnPrevLevels,
        expForNext: maxExpThisLevel
      }
    }
    expSpentOnPrevLevels += maxExpThisLevel
    level++
  }
}

export function getTotalExp(entries) {
  return entries.reduce((sum, e) => sum + (rankExp[e.rank] || 0), 0)
}

function bonusExpKey(userId) {
  return `dgl_bonus_exp_${userId}`
}

export function getBonusExp(userId) {
  if (!userId) return 0
  try {
    const raw = localStorage.getItem(bonusExpKey(userId))
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

export function addBonusExp(userId, amount) {
  if (!userId) return
  const current = getBonusExp(userId)
  localStorage.setItem(bonusExpKey(userId), String(current + amount))
}

export function getEffectiveTotalExp(entries, userId) {
  return getTotalExp(entries) + getBonusExp(userId)
}

export function getRankLabel(level) {
  if (level >= 50) return 'OVERLOAD'
  if (level >= 40) return 'MYTHICAL'
  if (level >= 30) return 'GRAND MASTER'
  if (level >= 25) return 'MASTER'
  if (level >= 20) return 'PLATINUM'
  if (level >= 10) return 'GOLD'
  if (level >= 5) return 'SILVER'
  return 'BRONZE'
}

export function getRankTier(level) {
  if (level >= 50) return 'Overload'
  if (level >= 40) return 'Mythical'
  if (level >= 30) return 'Grand Master'
  if (level >= 25) return 'Master'
  if (level >= 20) return 'Platinum'
  if (level >= 10) return 'Gold'
  if (level >= 5) return 'Silver'
  return 'Bronze'
}

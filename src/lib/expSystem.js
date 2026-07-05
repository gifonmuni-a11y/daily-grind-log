export const rankExp = { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }

export function calcLevel(totalExp) {
  let level = 1
  let expSpentOnPrevLevels = 0
  while (true) {
    // RUMUS BARU: Disesuaikan agar Level 80 tercapai dalam ~1 tahun (365 hari)
    const maxExpThisLevel = Math.round(50 + (level * 15)) 
    
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
  if (level >= 80) return 'OVERLOAD'
  if (level >= 60) return 'MYTHICAL'
  if (level >= 45) return 'GRAND MASTER'
  if (level >= 30) return 'MASTER'
  if (level >= 20) return 'CHALLENGER'
  if (level >= 12) return 'EXPERT TRAINER'
  if (level >= 5) return 'ELITE TRAINER'
  return 'TRAINER'
}

export function getRankTier(level) {
  if (level >= 80) return 'Overload'
  if (level >= 60) return 'Mythical'
  if (level >= 45) return 'Grand Master'
  if (level >= 30) return 'Master'
  if (level >= 20) return 'Challenger'
  if (level >= 12) return 'Expert Trainer'
  if (level >= 5) return 'Elite Trainer'
  return 'Trainer'
}

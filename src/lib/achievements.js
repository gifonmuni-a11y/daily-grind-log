export const ACHIEVEMENTS = [
  {
    id: 'striker',
    title: 'Striker',
    desc: 'Catat 10 sesi latihan Boxing/Combat.',
    check: (entries) => entries.filter(e => e.category === 'Boxing/Combat').length >= 10,
  },
  {
    id: 'immortal',
    title: 'Immortal',
    desc: 'Capai 7-day streak tanpa putus.',
    check: (_entries, streak) => streak >= 7,
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    desc: 'Capai 30-day streak tanpa putus.',
    check: (_entries, streak) => streak >= 30,
  },
  {
    id: 'iron_grind',
    title: 'Iron Grind',
    desc: 'Catat total 30 sesi latihan.',
    check: (entries) => entries.length >= 30,
  },
  {
    id: 'century',
    title: 'Centurion',
    desc: 'Catat total 100 sesi latihan.',
    check: (entries) => entries.length >= 100,
  },
  {
    id: 'legendary_performer',
    title: 'Legendary Performer',
    desc: 'Raih 5 sesi dengan rank S.',
    check: (entries) => entries.filter(e => e.rank === 'S').length >= 5,
  },
  {
    id: 'all_rounder',
    title: 'All-Rounder',
    desc: 'Coba minimal 5 kategori latihan berbeda.',
    check: (entries) => new Set(entries.map(e => e.category)).size >= 5,
  },
  {
    id: 'lifter',
    title: 'Lifter',
    desc: 'Catat 10 sesi latihan Powerlifting.',
    check: (entries) => entries.filter(e => e.category === 'Powerlifting').length >= 10,
  },
  {
    id: 'cardio_king',
    title: 'Cardio King',
    desc: 'Catat 10 sesi latihan Cardio.',
    check: (entries) => entries.filter(e => e.category === 'Cardio').length >= 10,
  },
]

export function getUnlockedAchievements(entries, streak) {
  return ACHIEVEMENTS.filter(a => a.check(entries, streak))
}

function equippedTitleKey(userId) {
  return `dgl_equipped_title_${userId}`
}

export function getEquippedTitle(userId) {
  if (!userId) return null
  try {
    return localStorage.getItem(equippedTitleKey(userId)) || null
  } catch {
    return null
  }
}

export function setEquippedTitle(userId, achievementId) {
  if (!userId) return
  if (achievementId === null) {
    localStorage.removeItem(equippedTitleKey(userId))
  } else {
    localStorage.setItem(equippedTitleKey(userId), achievementId)
  }
}

export const ACHIEVEMENTS = [
  {
    id: 'awakened',
    title: 'Awakened',
    desc: 'Pernah log latihan apapun 3 hari berturut-turut.',
    check: (_entries, longest) => longest >= 3,
  },
  {
    id: 'striker',
    title: 'Striker',
    desc: 'Catat 10 sesi latihan Boxing/Combat.',
    check: (entries) => entries.filter(e => e.category === 'Boxing/Combat').length >= 10,
  },
  {
    id: 'immortal',
    title: 'Immortal',
    desc: 'Pernah capai 7-day streak tanpa putus.',
    check: (_entries, longest) => longest >= 7,
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    desc: 'Pernah capai 30-day streak tanpa putus.',
    check: (_entries, longest) => longest >= 30,
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

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Streak TERPANJANG sepanjang sejarah entries (bukan cuma yang jalan sekarang),
// biar achievement streak gak "ilang" lagi kalau user break streak-nya.
function longestStreak(entries) {
  if (!entries || entries.length === 0) return 0
  const dayKeys = [...new Set(entries.map(e => dateKey(new Date(e.entry_date))))].sort()
  let longest = 1
  let current = 1
  for (let i = 1; i < dayKeys.length; i++) {
    const diffDays = Math.round((new Date(dayKeys[i]) - new Date(dayKeys[i - 1])) / 86400000)
    if (diffDays === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else if (diffDays > 1) {
      current = 1
    }
  }
  return longest
}

export function getUnlockedAchievements(entries) {
  const longest = longestStreak(entries)
  return ACHIEVEMENTS.filter(a => a.check(entries, longest))
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
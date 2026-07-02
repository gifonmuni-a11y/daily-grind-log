const QUEST_POOL = [
  {
    id: 'log_today',
    label: 'Catat Latihan Hari Ini',
    desc: 'Log minimal 1 sesi latihan hari ini.',
    exp: 5,
    check: (entriesToday) => entriesToday.length >= 1,
  },
  {
    id: 'high_rank',
    label: 'Raih Rank A atau S',
    desc: 'Selesaikan sesi hari ini dengan rank A atau S.',
    exp: 10,
    check: (entriesToday) => entriesToday.some(e => e.rank === 'A' || e.rank === 'S'),
  },
  {
    id: 'log_note',
    label: 'Tulis Catatan Lengkap',
    desc: 'Log sesi hari ini dengan catatan (note) minimal 20 karakter.',
    exp: 5,
    check: (entriesToday) => entriesToday.some(e => (e.note || '').trim().length >= 20),
  },
  {
    id: 'two_sessions',
    label: 'Double Session',
    desc: 'Log 2 sesi latihan dalam satu hari.',
    exp: 10,
    check: (entriesToday) => entriesToday.length >= 2,
  },
  {
    id: 'with_photo',
    label: 'Bukti Visual',
    desc: 'Log sesi hari ini lengkap dengan foto.',
    exp: 5,
    check: (entriesToday) => entriesToday.some(e => !!e.image_url),
  },
]

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function seededPick(seed, arr, count) {
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const pool = [...arr]
  const picked = []
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  return picked
}

function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function getTodaysQuests(userId) {
  const key = todayKey()
  const seed = hashStr(`${userId}-${key}`)
  return seededPick(seed, QUEST_POOL, 3)
}

function claimedStorageKey(userId) {
  return `dgl_quests_claimed_${userId}_${todayKey()}`
}

export function getClaimedQuestIds(userId) {
  try {
    const raw = localStorage.getItem(claimedStorageKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function claimQuest(userId, questId) {
  const claimed = getClaimedQuestIds(userId)
  if (claimed.includes(questId)) return
  claimed.push(questId)
  localStorage.setItem(claimedStorageKey(userId), JSON.stringify(claimed))
}

export function getEntriesToday(entries) {
  const key = todayKey()
  return entries.filter(e => {
    const d = new Date(e.entry_date)
    const eKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return eKey === key
  })
}

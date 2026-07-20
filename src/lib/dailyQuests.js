import { supabase } from './supabaseClient'

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
    desc: 'Log sesi hari ini dengan catatan (note) minimal 10 karakter.',
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

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayKey() {
  return dateKey(new Date())
}

function yesterdayKey() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateKey(d)
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

function sameCombo(a, b) {
  if (a.length !== b.length) return false
  const idsA = a.map(q => q.id).sort()
  const idsB = b.map(q => q.id).sort()
  return idsA.every((id, i) => id === idsB[i])
}

export function getTodaysQuests(userId) {
  const seed = hashStr(`${userId}-${todayKey()}`)
  const ySeed = hashStr(`${userId}-${yesterdayKey()}`)
  const yesterdayCombo = seededPick(ySeed, QUEST_POOL, 3)

  let combo = seededPick(seed, QUEST_POOL, 3)
  let attempt = 1
  while (sameCombo(combo, yesterdayCombo) && attempt <= 10) {
    combo = seededPick(seed + attempt * 7919, QUEST_POOL, 3)
    attempt++
  }
  return combo
}

export function getEntriesToday(entries) {
  const key = todayKey()
  return entries.filter(e => dateKey(new Date(e.entry_date)) === key)
}

export async function fetchQuestClaims(userId) {
  const { data, error } = await supabase
    .from('quest_claims')
    .select('*')
    .eq('user_id', userId)
  if (error) {
    console.error('Gagal ambil quest_claims:', error.message)
    return []
  }
  return data || []
}

export function getClaimedTodayIds(claims) {
  const key = todayKey()
  return claims.filter(c => c.claimed_date === key).map(c => c.quest_id)
}

export function getTotalQuestExp(claims) {
  return claims.reduce((sum, c) => sum + (c.exp_awarded || 0), 0)
}

export async function claimQuest(userId, questId, expAwarded) {
  const { error: insertError } = await supabase
    .from('quest_claims')
    .insert({
      user_id: userId,
      quest_id: questId,
      claimed_date: todayKey(),
      exp_awarded: expAwarded,
    })
  if (insertError) {
    if (insertError.code !== '23505') {
      console.error('Gagal klaim quest:', insertError.message)
    }
    return false
  }

  // ✅ FIX: EXP disimpan di tabel `profiles` (kolom `exp`), bukan `user_stats`
  // (tabel `user_stats` tidak pernah ada di database, makanya EXP tidak pernah nambah).
  // Pakai RPC atomik `increment_exp` biar aman dari race condition kalau ada
  // beberapa quest yang diklaim hampir bersamaan.
  const { error: expError } = await supabase.rpc('increment_exp', {
    p_user_id: userId,
    p_amount: expAwarded,
  })

  if (expError) {
    console.error('Gagal update EXP:', expError.message)
  }

  return true
}

// ==========================================
// 1. SISTEM WARNA RANK LOG HARIAN (LAMA)
// ==========================================
export const RANK_TIER_COLORS = {
  S: '#7C5CFF',
  A: '#2DD4BF',
  B: '#E5E7EB',
  C: '#E5E7EB',
  D: '#9CA3AF',
  E: '#9CA3AF',
}

export const RANK_DIM_COLOR = '#3A3548'

export function isHighTier(rank) {
  return rank === 'S' || rank === 'A'
}

export function getRankColor(rank, isActive = true) {
  if (!isActive) return RANK_DIM_COLOR
  return RANK_TIER_COLORS[rank] || RANK_DIM_COLOR
}

export function getRankGlow(rank, isActive = true) {
  if (!isActive || !isHighTier(rank)) return 'none'
  const color = RANK_TIER_COLORS[rank]
  return `0 0 10px ${color}66`
}

export function getAmbientAlpha(rank) {
  if (isHighTier(rank)) return '55'
  if (rank === 'B' || rank === 'C') return '22'
  return '10'
}

// ==========================================
// 2. SISTEM GELAR & TIER LEVEL RPG (BARU)
// ==========================================
export const TITLE_TIER_ORDER = [
  'Bronze', 'Silver', 'Gold', 'Platinum', 'Master', 'Grand Master', 'Mythical', 'Overload',
]

export const TITLE_TIER_COLORS = {
  Bronze: '#B08D57',
  Silver: '#C7CDD6',
  Gold: '#F4C542',
  Platinum: '#8FE3D6',
  Master: '#7C5CFF',
  'Grand Master': '#E14CE3',
  Mythical: '#FF5C7A',
  Overload: '#FFD24C',
}

export const TITLE_TIER_GLOW = {
  Bronze: 'none',
  Silver: 'none',
  Gold: '0 0 8px #F4C54266',
  Platinum: '0 0 10px #8FE3D677',
  Master: '0 0 12px #7C5CFF88',
  'Grand Master': '0 0 14px #E14CE399',
  Mythical: '0 0 16px #FF5C7Aaa',
  Overload: '0 0 20px #FFD24Ccc',
}

export function getTitleTierColor(tier) {
  return TITLE_TIER_COLORS[tier] || TITLE_TIER_COLORS.Bronze
}

export function getTitleTierGlow(tier) {
  return TITLE_TIER_GLOW[tier] || 'none'
}

// Fungsi utama yang dicari-cari oleh ProfileHeader agar build tidak eror
export const getRankDetails = (level) => {
  if (level >= 80) {
    return { 
      name: 'OVERLOAD', 
      color: 'text-red-500 border-red-500 bg-red-950/40 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' 
    };
  }
  if (level >= 60) {
    return { 
      name: 'MYTHICAL', 
      color: 'text-amber-400 border-amber-400 bg-amber-950/40 shadow-[0_0_10px_rgba(251,191,36,0.4)]' 
    };
  }
  if (level >= 45) {
    return { 
      name: 'GRAND MASTER', 
      color: 'text-cyan-400 border-cyan-400 bg-cyan-950/40' 
    };
  }
  if (level >= 30) {
    return { 
      name: 'MASTER', 
      color: 'text-purple-400 border-purple-400 bg-purple-950/40' 
    };
  }
  if (level >= 20) {
    return { 
      name: 'PLATINUM', 
      color: 'text-teal-300 border-teal-300 bg-teal-950/40' 
    };
  }
  if (level >= 12) {
    return { 
      name: 'GOLD', 
      color: 'text-yellow-500 border-yellow-500 bg-yellow-950/20' 
    };
  }
  if (level >= 5) {
    return { 
      name: 'SILVER', 
      color: 'text-slate-300 border-slate-300 bg-slate-800/40' 
    };
  }
  return { 
    name: 'BRONZE', 
    color: 'text-violet-400 border-violet-400 bg-violet-950/40' 
  };
};

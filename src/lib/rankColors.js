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
  'Trainer', 'Elite Trainer', 'Expert Trainer', 'Challenger', 'Master', 'Grand Master', 'Mythical', 'Overload',
]

export const TITLE_TIER_COLORS = {
  Trainer: '#9CA3AF',
  'Elite Trainer': '#60A5FA',
  'Expert Trainer': '#F59E0B',
  Challenger: '#2DD4BF',
  Master: '#7C5CFF',
  'Grand Master': '#E14CE3',
  Mythical: '#FF5C7A',
  Overload: '#F59E0B', // Base emas
}

export const TITLE_TIER_GLOW = {
  Trainer: 'none',
  'Elite Trainer': 'none',
  'Expert Trainer': '0 0 8px #F59E0B66',
  Challenger: '0 0 10px #2DD4BF77',
  Master: '0 0 12px #7C5CFF88',
  'Grand Master': '0 0 14px #E14CE399',
  Mythical: '0 0 16px #FF5C7Aaa',
  Overload: '0 0 25px #D946EFaa, 0 0 10px #F59E0B77', // Efek ledakan energi Ungu-Emas
}

export function getTitleTierColor(tier) {
  return TITLE_TIER_COLORS[tier] || TITLE_TIER_COLORS.Trainer
}

export function getTitleTierGlow(tier) {
  return TITLE_TIER_GLOW[tier] || 'none'
}

// Logic penentuan nama rank otomatis berdasarkan tingkatan level
export const getRankDetails = (level) => {
  if (level >= 80) {
    return { 
      name: 'OVERLOAD', 
      // FIX: Warna tag profil di-upgrade pakai gradasi Emas-Ungu berkilau + Animasi berdenyut pulse
      color: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-fuchsia-500 to-purple-500 border-fuchsia-500 bg-purple-950/40 shadow-[0_0_20px_rgba(217,70,239,0.6)] font-black animate-pulse' 
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
      name: 'CHALLENGER', 
      color: 'text-teal-300 border-teal-300 bg-teal-950/40' 
    };
  }
  if (level >= 12) {
    return { 
      name: 'EXPERT TRAINER', 
      color: 'text-amber-400 border-amber-400 bg-amber-950/20' 
    };
  }
  if (level >= 5) {
    return { 
      name: 'ELITE TRAINER', 
      color: 'text-blue-400 border-blue-400 bg-blue-950/40' 
    };
  }
  return { 
    name: 'TRAINER', 
    color: 'text-slate-400 border-slate-400 bg-slate-900/40' 
  };
};

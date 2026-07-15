import { Edit2, Music, Flame, Zap } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { calcLevel, getEffectiveTotalExp, getRankTier } from '../lib/expSystem'
import { getRankDetails, getTitleTierColor, getTitleTierGlow } from '../lib/rankColors'
import { ACHIEVEMENTS, getEquippedTitle } from '../lib/achievements'

function getSpotifyEmbedUrl(link) {
  if (!link) return null
  try {
    const url = new URL(link)
    if (!url.hostname.includes('spotify.com')) return null
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length >= 2) {
      const [type, id] = parts
      if (['playlist', 'track', 'album', 'artist', 'show', 'episode'].includes(type)) {
        return `https://open.spotify.com/embed/${type}/${id}`
      }
    }
  } catch {
    return null
  }
  return null
}

export default function ProfileHeader({ profile, entries, streak, userId, onEditClick }) {
  const totalExp = getEffectiveTotalExp(entries, userId, profile?.exp || 0)
  const { level, expIntoLevel, expForNext } = calcLevel(totalExp)
  const expPct = Math.min(100, Math.round((expIntoLevel / expForNext) * 100))
  
  const rank = getRankDetails(level)
  const rankLabel = rank.name
  const rankClasses = rank.color

  const tierName = getRankTier(level) 
  const currentTierColor = getTitleTierColor(tierName)
  const currentTierGlow = getTitleTierGlow(tierName)

  const dayNumber = entries.length > 0 ? Math.max(...entries.map(e => e.day_number)) : 0
  const spotifyEmbedUrl = getSpotifyEmbedUrl(profile?.spotify_link)
  const equippedId = getEquippedTitle(userId)
  const equippedAchievement = ACHIEVEMENTS.find(a => a.id === equippedId)

  return (
    <div className="relative">
      {/* BANNER PROFILE */}
      <div className="relative w-full overflow-hidden" style={{ height: 180 }}>
        {profile?.banner_url ? (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.banner_url})` }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #100E16 0%, #1a1625 50%, #211D2C 100%)',
            }}
          >
            <div className="w-full h-full opacity-30"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #7C5CFF11 0px, #7C5CFF11 1px, transparent 1px, transparent 20px)',
              }}
            />
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 55%, #0A0A0E)' }}
        />
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-start gap-3 mb-3">
          {/* AVATAR DENGAN SIKU UNGU ORIGINAL KEMBALI */}
          <div className="relative shrink-0 -mt-10">
            <SystemFrame
              size={12}
              className="w-20 h-20 bg-panel shrink-0"
              style={{ boxShadow: currentTierGlow !== 'none' ? currentTierGlow : `0 0 12px ${currentTierColor}55` }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-display font-bold text-3xl"
                  style={{ background: `${currentTierColor}22`, color: currentTierColor }}
                >
                  {(profile?.name || 'T')[0].toUpperCase()}
                </div>
              )}
            </SystemFrame>
            <div
              className="absolute -bottom-1 -right-1 font-mono text-xs font-bold px-1.5 py-0.5 z-10 transition-colors duration-300"
              style={{ background: currentTierColor, color: '#0A0A0E', fontSize: '10px' }}
            >
              {level}
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-1 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h2
                className="font-display font-bold text-xl text-text-high truncate min-w-0"
                title={profile?.name || 'Trainer'}
              >
                {profile?.name || 'Trainer'}
              </h2>
              <span
                className={`font-mono text-xs px-2 py-0.5 border shrink-0 whitespace-nowrap transition-all duration-300 ${rankClasses}`}
              >
                {rankLabel}
              </span>
            </div>
            {equippedAchievement && (
              <p
                className="font-mono text-xs mt-0.5 tracking-wider uppercase opacity-90 transition-colors duration-300"
                style={{ color: currentTierColor }}
              >
                「{equippedAchievement.title}」
              </p>
            )}
            {profile?.bio && (
              <p className="font-body text-xs text-gray-400 mt-1 break-words">{profile.bio}</p>
            )}
          </div>

          <button
            onClick={onEditClick}
            className="p-2 mt-1 shrink-0 hover:bg-border-hover transition-colors"
            style={{ border: '1px solid #211D2C' }}
          >
            <Edit2 size={14} className="text-gray-400" />
          </button>
        </div>

        {/* LOG PANEL STATS */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-danger" />
            <span className="font-mono text-sm font-medium text-text-high">{streak}</span>
            <span className="font-mono text-xs text-gray-400">day streak</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-accent" />
            <span className="font-mono text-sm font-medium text-text-high">{totalExp}</span>
            <span className="font-mono text-xs text-gray-400">total EXP</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-gray-400">DAY</span>
            <span className="font-mono text-sm font-medium text-text-high">#{dayNumber}</span>
          </div>
        </div>

        {/* EXP BAR */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-mono text-xs text-gray-400">
              LVL {level} → {level + 1}
            </span>
            <span className="font-mono text-xs text-accent">
              {expIntoLevel} / {expForNext} EXP
            </span>
          </div>
          <div className="w-full h-1.5 bg-border overflow-hidden">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${expPct}%`,
                background: 'linear-gradient(90deg, #7C5CFF, #2DD4BF)',
                boxShadow: '0 0 8px #7C5CFFaa',
              }}
            />
          </div>
        </div>

        {/* SPOTIFY NOW PLAYING */}
        {profile?.spotify_link && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1.5 font-mono text-xs text-gray-400">
              <Music size={12} />
              <span>Now Playing</span>
            </div>
            {spotifyEmbedUrl ? (
              <iframe
                src={spotifyEmbedUrl}
                width="100%"
                height="80"
                style={{ borderRadius: 8, border: 'none' }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Now Playing"
              />
            ) : (
              <a
                href={profile.spotify_link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-gray-400 hover:text-text-high transition-colors underline break-all"
              >
                {profile.spotify_link}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

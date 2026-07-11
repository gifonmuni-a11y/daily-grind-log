import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, LogOut, HelpCircle, Sparkles, Loader2, Bot, Target, CheckCircle2, Circle, Award, Trophy, Lock, Map } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { calcStreak } from '../lib/streakSystem'
import { calcLevel, getRankTier } from '../lib/expSystem'
import { buildDummyEntries } from '../lib/dummyData'
import {
  getTodaysQuests,
  getEntriesToday,
  fetchQuestClaims,
  getClaimedTodayIds,
  getTotalQuestExp,
  claimQuest,
} from '../lib/dailyQuests'
import {
  ACHIEVEMENTS,
  getUnlockedAchievements,
  getEquippedTitle,
  setEquippedTitle,
} from '../lib/achievements'
import ProfileHeader from '../components/ProfileHeader'
import ProfileEditModal from '../components/ProfileEditModal'
import StatusPanel from '../components/StatusPanel'
import StatsDashboard from '../components/StatsDashboard'
import FilterTabs from '../components/FilterTabs'
import EntryCard from '../components/EntryCard'
import CompactRow from '../components/CompactRow'
import LogModal from '../components/LogModal'
import AboutModal from '../components/AboutModal'
import CompanionAI from '../components/CompanionAI'
import LevelUpModal from '../components/LevelUpModal'
import AchievementUnlockModal from '../components/AchievementUnlockModal'
import FitnessFoodMap from '../components/FitnessFoodMap'

function filterEntries(entries, filter) {
  const now = new Date()
  const startOf = (unit) => {
    const d = new Date(now)
    if (unit === 'week') {
      const day = d.getDay()
      d.setDate(d.getDate() - day)
    } else if (unit === 'month') {
      d.setDate(1)
    } else if (unit === 'lastMonth') {
      d.setMonth(d.getMonth() - 1)
      d.setDate(1)
    } else if (unit === 'year') {
      d.setMonth(0); d.setDate(1)
    }
    d.setHours(0, 0, 0, 0)
    return d
  }

  if (filter === 'Minggu ini') {
    const start = startOf('week')
    return entries.filter(e => new Date(e.entry_date) >= start)
  }
  if (filter === 'Bulan ini') {
    const start = startOf('month')
    return entries.filter(e => new Date(e.entry_date) >= start)
  }
  if (filter === 'Bulan lalu') {
    const start = startOf('lastMonth')
    const end = startOf('month')
    return entries.filter(e => {
      const d = new Date(e.entry_date)
      return d >= start && d < end
    })
  }
  if (filter === 'Tahun ini') {
    const start = startOf('year')
    return entries.filter(e => new Date(e.entry_date) >= start)
  }
  return entries
}

export default function Home({ session }) {
  const userId = session.user.id
  const [profile, setProfile] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [showLogModal, setShowLogModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showCompanion, setShowCompanion] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [seeding, setSeeding] = useState(false)
  const [questClaims, setQuestClaims] = useState([])
  const [claimingId, setClaimingId] = useState(null)
  const [equippedTitleId, setEquippedTitleId] = useState(() => getEquippedTitle(userId))

  // STATE HALAMAN UTAMA DOCK BAR
  const [activeTab, setActiveTab] = useState('grind') 
  
  // STATE KONTROL POPUP LOGOUT AMAN
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const prevLevelRef = useRef(null)
  const prevUnlockedIdsRef = useRef(null)

  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState({ oldTier: '', newTier: '', newLevel: 1 })
  const [showAchievementUnlock, setShowAchievementUnlock] = useState(false)
  const [activeUnlockAchievement, setActiveUnlockAchievement] = useState(null)

  const fetchProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!data) {
      await supabase.from('profiles').upsert({ id: userId, name: 'Trainer' })
      const { data: created } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(created)
    } else {
      setProfile(data)
    }
  }, [userId])

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
    if (!error) setEntries(data || [])
  }, [userId])

  const fetchQuestClaimsData = useCallback(async () => {
    const claims = await fetchQuestClaims(userId)
    setQuestClaims(claims)
  }, [userId])

  useEffect(() => {
    Promise.all([fetchProfile(), fetchEntries(), fetchQuestClaimsData()]).finally(() => setLoading(false))
  }, [fetchProfile, fetchEntries, fetchQuestClaimsData])

  const filteredEntries = filterEntries(entries, activeFilter)
  const cardEntries = filteredEntries.slice(0, 3)
  const compactEntries = filteredEntries.slice(3)
  const streak = calcStreak(entries)
  const entriesExp = entries.reduce((sum, e) => sum + ({ S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }[e.rank] || 0), 0)
  const entriesToday = getEntriesToday(entries)
  const todaysQuests = getTodaysQuests(userId)
  const claimedTodayIds = getClaimedTodayIds(questClaims)
  const questBonusExp = getTotalQuestExp(questClaims)
  const totalExp = entriesExp + questBonusExp
  const { level } = calcLevel(totalExp)
  const maxDayNumber = entries.length > 0 ? Math.max(...entries.map(e => e.day_number)) : 0
  const userStats = { totalDays: entries.length, streak, totalExp, level }
  const unlockedAchievements = getUnlockedAchievements(entries)
  const equippedAchievement = ACHIEVEMENTS.find(a => a.id === equippedTitleId) || null

  useEffect(() => {
    if (loading) return

    const currentIds = unlockedAchievements.map(a => a.id)

    if (prevLevelRef.current === null) {
      prevLevelRef.current = level
      prevUnlockedIdsRef.current = currentIds
      return
    }

    if (level > prevLevelRef.current) {
      const oldTier = getRankTier(prevLevelRef.current)
      const newTier = getRankTier(level)
      if (newTier !== oldTier) {
        setLevelUpData({ oldTier, newTier, newLevel: level })
        setShowLevelUp(true)
      }
    }

    prevLevelRef.current = level

    if (prevUnlockedIdsRef.current) {
      const newlyUnlocked = unlockedAchievements.find(a => !prevUnlockedIdsRef.current.includes(a.id))
      if (newlyUnlocked) {
        setActiveUnlockAchievement(newlyUnlocked)
        setShowAchievementUnlock(true)
      }
      prevUnlockedIdsRef.current = currentIds
    }
  }, [loading, level, unlockedAchievements])

  async function handleDelete(id) {
    if (!window.confirm('Hapus entry ini?')) return
    await supabase.from('entries').delete().eq('id', id)
    await fetchEntries()
  }

  bin
  function handleEdit(entry) {
    setEditEntry(entry)
    setShowLogModal(true)
  }

  function handleNewLog() {
    setEditEntry(null)
    setShowLogModal(true)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleSeedDummyData() {
    if (seeding) return
    if (!window.confirm('Isi data contoh (5 sesi dummy)?')) return
    setSeeding(true)
    const maxDay = entries.length > 0 ? Math.max(...entries.map(e => e.day_number)) : 0
    const dummyEntries = buildDummyEntries(userId, maxDay)
    const { error } = await supabase.from('entries').insert(dummyEntries)
    if (!error) await fetchEntries()
    setSeeding(false)
  }

  async function handleClaimQuest(quest) {
    if (claimingId) return
    setClaimingId(quest.id)
    const success = await claimQuest(userId, quest.id, quest.exp)
    if (success) {
      await fetchQuestClaimsData()
      await Promise.all([fetchProfile(), fetchEntries()])
    }
    setClaimingId(null)
  }

  function handleToggleTitle(achievementId) {
    if (equippedTitleId === achievementId) {
      setEquippedTitle(userId, null)
      setEquippedTitleId(null)
    } else {
      setEquippedTitle(userId, achievementId)
      setEquippedTitleId(achievementId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-text-dim text-sm animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* AREA KONTEN UTAMA */}
      <div className="max-w-lg mx-auto pb-32 w-full flex-1">
        
        {/* HEADER UTAMA GLOBAL */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #211D2C' }}>
          <span className="font-display font-bold text-base text-accent tracking-widest">DAILY GRIND LOG</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowAboutModal(true)} className="p-2 hover:bg-border-hover transition-colors">
              <HelpCircle size={16} className="text-text-dim" />
            </button>
            <button onClick={() => setShowLogoutConfirm(true)} className="p-2 hover:bg-border-hover transition-colors">
              <LogOut size={16} className="text-text-dim" />
            </button>
          </div>
        </div>

        {/* HALAMAN 1: DASHBOARD UTAMA (LOG HARIAN) */}
        {activeTab === 'grind' && (
          <>
            <ProfileHeader profile={profile} entries={entries} streak={streak} userId={userId} onEditClick={() => setShowProfileModal(true)} />

            <div className="mx-4 mt-4 mb-4" style={{ border: '1px solid #211D2C' }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #211D2C' }}>
                <Target size={14} className="text-accent" />
                <span className="font-mono text-xs text-text-dim uppercase tracking-widest">Daily Quest</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {todaysQuests.map(quest => {
                  const isDone = quest.check(entriesToday)
                  const isClaimed = claimedTodayIds.includes(quest.id)
                  return (
                    <div key={quest.id} className="flex items-center justify-between gap-3 px-3 py-3" style={{ background: isClaimed ? 'transparent' : (isDone ? 'rgba(124,92,255,0.08)' : '#0A0A0E'), border: '1px solid ' + (isDone && !isClaimed ? 'rgba(124,92,255,0.4)' : '#211D2C'), opacity: isClaimed ? 0.5 : 1 }}>
                      <div className="flex items-center gap-3 min-w-0">
                        {isClaimed ? <CheckCircle2 size={18} className="text-accent flex-shrink-0" /> : <Circle size={18} className={isDone ? 'text-accent flex-shrink-0' : 'text-text-dim flex-shrink-0'} />}
                        <div className="min-w-0">
                          <p className="font-body text-sm truncate" style={{ color: '#EDEAF6' }}>{quest.label}</p>
                          <p className="font-body text-xs text-text-dim truncate">{quest.desc}</p>
                        </div>
                      </div>
                      {isClaimed ? <span className="font-mono text-xs text-text-dim flex-shrink-0">Selesai</span> : isDone ? (
                        <button onClick={() => handleClaimQuest(quest)} disabled={claimingId === quest.id} className="font-mono text-xs px-3 py-1.5 flex-shrink-0" style={{ background: '#7C5CFF', color: '#fff' }}>
                          {claimingId === quest.id ? <Loader2 size={12} className="animate-spin" /> : `+${quest.exp} EXP`}
                        </button>
                      ) : <span className="font-mono text-xs text-text-dim flex-shrink-0">+{quest.exp} EXP</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mx-4 mb-4" style={{ border: '1px solid #211D2C' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #211D2C' }}>
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-accent" />
                  <span className="font-mono text-xs text-text-dim uppercase tracking-widest">Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</span>
                </div>
                {equippedAchievement && <span className="font-mono text-xs text-accent">Title: {equippedAchievement.title}</span>}
              </div>
              <div className="p-3 grid grid-cols-3 gap-2">
                {ACHIEVEMENTS.map(ach => {
                  const unlocked = unlockedAchievements.some(u => u.id === ach.id)
                  const isEquipped = equippedTitleId === ach.id
                  return (
                    <button key={ach.id} onClick={() => unlocked && handleToggleTitle(ach.id)} disabled={!unlocked} className="flex flex-col items-center justify-center text-center px-2 py-3 gap-1.5" style={{ background: isEquipped ? 'rgba(124,92,255,0.15)' : '#0A0A0E', border: '1px solid ' + (isEquipped ? '#7C5CFF' : '#211D2C'), opacity: unlocked ? 1 : 0.35 }}>
                      {unlocked ? <Trophy size={20} className={isEquipped ? 'text-accent' : 'text-text-dim'} /> : <Lock size={20} className="text-text-dim" />}
                      <span className="font-mono text-xs text-text-dim uppercase">{ach.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <StatusPanel entries={entries} />
            <StatsDashboard entries={entries} />
            <FilterTabs active={activeFilter} onChange={setActiveFilter} />

            {filteredEntries.length === 0 ? (
              <div className="mx-4 py-16 text-center">
                <p className="font-display text-2xl font-bold text-text-dim mb-2">NO ENTRIES</p>
                <button onClick={handleNewLog} className="font-display font-semibold text-base px-6 py-3" style={{ background: '#7C5CFF', color: '#EDEAF6' }}>LOG SESI PERTAMA</button>
              </div>
            ) : (
              <>
                {cardEntries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} profile={profile} level={level} streak={streak} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
                {compactEntries.length > 0 && (
                  <div className="mx-4 mb-3" style={{ border: '1px solid #211D2C' }}>
                    <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid #211D2C', background: '#100E16' }}>
                      <span className="font-mono text-xs text-text-dim uppercase tracking-widest">{compactEntries.length} Sesi Lainnya</span>
                    </div>
                    {compactEntries.map(entry => (
                      <CompactRow key={entry.id} entry={entry} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* HALAMAN 2: HUB DATA FITNESS & FOOD */}
        {activeTab === 'radar' && <FitnessFoodMap />}

      </div>

      {/* 🧭 NAVIGATION DOCK MELAYANG PREMIUM */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#100E16]/95 backdrop-blur-md border border-[#211D2C] px-5 py-2.5 flex items-center gap-5 z-40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-w-[90%] w-max">
        <button 
          type="button" 
          onClick={handleNewLog} 
          className="w-12 h-12 rounded-xl bg-[#211D2C] border border-[#312C42] hover:bg-[#7C5CFF]/20 flex items-center justify-center text-white transition-all active:scale-95 flex-shrink-0"
        >
          <Plus size={22} />
        </button>

        <button 
          type="button" 
          onClick={() => setActiveTab(activeTab === 'radar' ? 'grind' : 'radar')} 
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
            activeTab === 'radar' 
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.6)] border border-[#a28eff]' 
              : 'bg-[#1A1625] text-[#7C5CFF] border border-[#2B243C] hover:bg-[#7C5CFF]/10'
          }`}
        >
          <Map size={24} className={activeTab === 'radar' ? 'animate-pulse' : ''} />
        </button>

        <button 
          type="button" 
          onClick={() => setShowCompanion(true)} 
          className="w-12 h-12 rounded-xl bg-[#211D2C] border border-[#312C42] hover:bg-[#7C5CFF]/20 flex items-center justify-center text-white transition-all active:scale-95 flex-shrink-0"
        >
          <Bot size={22} />
        </button>
      </div>

      {/* OVERLAY DIALOG MODAL KONFIRMASI LOG OUT PREMIUM */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs p-5 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col gap-4 select-none animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center">
              <h3 className="font-mono text-xs uppercase font-black text-white tracking-widest mb-1">Konfirmasi Keluar</h3>
              <p className="font-body text-[10px] text-[#EDEAF6]/50 leading-relaxed">Lu yakin mau log out dari akun Daily Grind Log ini? Sesi latihan lu bakal dikunci aman di server.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 bg-[#211D2C] border border-[#312C42] text-[#EDEAF6]/60 font-bold rounded-lg hover:text-white active:scale-95 transition-all"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="py-2.5 bg-[#EF4444] text-white font-black rounded-lg shadow-[0_0_12px_rgba(239,68,68,0.25)] hover:bg-[#DC2626] active:scale-95 transition-all"
              >
                SETUJU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODAL PENDUKUNG APLIKASI */}
      {showCompanion && <CompanionAI userStats={userStats} profile={profile} onClose={() => setShowCompanion(false)} />}
      {showLogModal && <LogModal userId={userId} maxDayNumber={maxDayNumber} editEntry={editEntry} onClose={() => { setShowLogModal(false); setEditEntry(null) }} onSaved={fetchEntries} />}
      {showProfileModal && <ProfileEditModal profile={profile} userId={userId} onClose={() => setShowProfileModal(false)} onSaved={fetchProfile} />}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} entries={entries} userId={userId} />}

      <LevelUpModal isOpen={showLevelUp} oldTier={levelUpData.oldTier} newTier={levelUpData.newTier} newLevel={levelUpData.newLevel} onClose={() => setShowLevelUp(false)} />
      <AchievementUnlockModal isOpen={showAchievementUnlock} achievement={activeUnlockAchievement} onClose={() => setShowAchievementUnlock(false)} />
    </div>
  )
}

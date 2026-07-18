import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, LogOut, HelpCircle, Sparkles, Loader2, Bot, Target, CheckCircle2, Circle, Award, Trophy, Lock, Map, AlertTriangle, Swords } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { calcStreak } from '../lib/streakSystem'
import { calcLevel, getRankTier, getEffectiveTotalExp } from '../lib/expSystem'
import { buildDummyEntries } from '../lib/dummyData'
import {
  getTodaysQuests,
  getEntriesToday,
  fetchQuestClaims,
  getClaimedTodayIds,
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
import LogModal from '../components/LogModal'
import AboutModal from '../components/AboutModal'
import CompanionAI from '../components/CompanionAI'
import LevelUpModal from '../components/LevelUpModal'
import AchievementUnlockModal from '../components/AchievementUnlockModal'
import FitnessFoodMap from '../components/FitnessFoodMap'
import AdminPanel from '../components/AdminPanel'
import QuestBoard from '../components/QuestBoard'
import { requestNotificationPermission, sendSystemNotification } from '../lib/notificationSystem'

// 🎯 DIRECT SUPABASE STORAGE AUDIO URL MAPPER
const AUDIO_URLS = {
  tiers: {
    'ELITE TRAINER': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/Tier/elitetrainer.mp3',
    'EXPERT TRAINER': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/Tier/experttrainer.mp3',
    'CHALLENGER': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/Tier/challenger.mp3',
    'MASTER': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/Tier/master.mp3',
    'GRAND MASTER': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/Tier/grandmaster.mp3',
    'MYTHICAL': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/Tier/mythical.mp3',
    'OVERLORD': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/Tier/overlord.mp3'
  },
  achievements: {
    'AWAKENED': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/achievement/awakened.mp3',
    'STRIKER': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/achievement/striker.mp3',
    'IMMORTAL': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/achievement/immortal.mp3',
    'UNSTOPPABLE': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/achievement/unstoppable.mp3',
    'IRON GRIND': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/achievement/irongrind.mp3',
    'CENTURION': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/achievement/centurion.mp3',
    'LEGENDARY PERFORMER': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/achievement/legendaryperformer.mp3',
    'ALL-ROUNDER': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/achievement/lifter.mp3',
    'CARDIO KING': 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/achievement/cardioking.mp3'
  },
  welcome: {
    normal: 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/welcome/welcome.mp3',
    reminder: 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/welcome/welcomeback&updatelog.mp3'
  },
  others: {
    pecahStreak: 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/lainnya/pecahstreak.mp3',
    logOut: 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/lainnya/logout.mp3',
    hapusLog: 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/lainnya/hapuslogharian.mp3',
    updateLog: 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/lainnya/updatelogharian.mp3'
  }
}

function filterEntries(entries, filter) {
  if (!filter || filter === 'Semua') return entries
  const now = new Date()
  const startOf = (unit) => {
    const d = new Date(now)
    if (unit === 'week') {
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      d.setDate(diff)
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
  const [draftData, setDraftData] = useState(null) // 🎯 STATE BARU: Penangkap data QuestBoard

  const [seeding, setSeeding] = useState(false)
  const [questClaims, setQuestClaims] = useState([])
  const [claimingId, setClaimingId] = useState(null)
  const [equippedTitleId, setEquippedTitleId] = useState(() => getEquippedTitle(userId))

  const [activeTab, setActiveTab] = useState('grind') 
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showBackConfirm, setShowBackConfirm] = useState(false) 
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const prevLevelRef = useRef(null)
  const prevUnlockedIdsRef = useRef(null)
  // 🎯 SECURITY BY NAVIGATION: Mengunci sistem trap back ketika player memilih keluar mutlak
  const isExitingRef = useRef(false)

  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState({ oldTier: '', newTier: '', newLevel: 1 })
  const [showAchievementUnlock, setShowAchievementUnlock] = useState(false)
  const [activeUnlockAchievement, setActiveUnlockAchievement] = useState(null)

  const [showWelcomeCover, setShowWelcomeCover] = useState(true)
  const [dismissWarnPopup, setDismissWarnPopup] = useState(false)
  // 🎯 STATE MANHWA CUSTOM POPUP: Mengaktifkan modal box kustom pelacak streak hancur
  const [showStreakBreakModal, setShowStreakBreakModal] = useState(false)

  const [showAdminModal, setShowAdminModal] = useState(false)
  const adminTimerRef = useRef(null)

  // 🎯 FUNGSI BARU: Nangkep Evaluasi dari QuestBoard ke LogModal
  const handleFinalizeBattle = (data) => {
    setDraftData(data)
    setEditEntry(null)
    setShowLogModal(true)
  }

  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    
    const handlePopState = (e) => {
      // 🛠️ FIX EMERGENCY EXIT: Jika status keluar aktif, biarkan sistem melompat keluar secara natural
      if (isExitingRef.current) return;
      e.preventDefault();
      setShowBackConfirm(true);
      window.history.pushState(null, null, window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleAdminPressStart = () => {
    adminTimerRef.current = setTimeout(() => {
      setShowAdminModal(true)
    }, 10000)
  }

  const handleAdminPressEnd = () => {
    if (adminTimerRef.current) {
      clearTimeout(adminTimerRef.current)
    }
  }

  const fetchProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!data) {
      await supabase.from('profiles').upsert({ id: userId, name: 'Trainer', exp: 0 })
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

  useEffect(() => {
    if (!userId) return

    const profileChannel = supabase
      .channel(`public:profiles:id=eq.${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const newProfile = payload.new
          
          setProfile((prevProfile) => {
            if (newProfile.status === 'warned' && (prevProfile?.status !== 'warned' || newProfile.warning_msg !== prevProfile?.warning_msg || newProfile.warning_title !== prevProfile?.warning_title)) {
              setDismissWarnPopup(false)
              localStorage.removeItem(`dg_read_warn_${newProfile.warning_msg}`)
            }
            return newProfile
          })

          if (newProfile.status === 'warned') {
            sendSystemNotification(newProfile.warning_title || "Notifikasi by founder HW", {
              body: newProfile.warning_msg || "Menerima pesan baru.",
              tag: "user-warning",
              image: newProfile.warning_img_url || ""
            })
          } else if (newProfile.status === 'banned') {
            sendSystemNotification("AKUN DIBEKUKAN", {
              body: "Sistem mendeteksi pelanggaran berat. Akses ditangguhkan.",
              tag: "user-banned"
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profileChannel)
    }
  }, [userId])

  const filteredEntries = filterEntries(entries, activeFilter)
  const streak = calcStreak(entries)
  
  const totalExp = getEffectiveTotalExp(entries, userId, profile?.exp || 0)
  
  const entriesToday = getEntriesToday(entries)
  const todaysQuests = getTodaysQuests(userId)
  const claimedTodayIds = getClaimedTodayIds(questClaims)
  const { level } = calcLevel(totalExp)
  const maxDayNumber = entries.length > 0 ? Math.max(...entries.map(e => e.day_number)) : 0
  const userStats = { totalDays: entries.length, streak, totalExp, level }
  const unlockedAchievements = getUnlockedAchievements(entries)
  const equippedAchievement = ACHIEVEMENTS.find(a => a.id === equippedTitleId) || null

  const handleWelcomeInitialization = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const audioCtx = new AudioContext()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(780, audioCtx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(1650, audioCtx.currentTime + 0.12)
        
        gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18)
        
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.18)
      }
    } catch (e) {
      console.log("Web Audio Engine tidak didukung pada browser ini:", e)
    }

    const todayStr = new Date().toLocaleDateString('en-CA')
    const hasLogToday = entries.some(e => e.entry_date === todayStr)
    const selectedWelcomeAudio = hasLogToday ? AUDIO_URLS.welcome.normal : AUDIO_URLS.welcome.reminder

    const welcomeAudio = new Audio(selectedWelcomeAudio)
    welcomeAudio.play().catch(err => console.log("Gagal memuat file audio welcome:", err))

    if ('Notification' in window) {
      requestNotificationPermission()
    }

    setShowWelcomeCover(false)

    if (profile?.status === 'warned') {
      const isExpired = profile.warning_expires_at && new Date() > new Date(profile.warning_expires_at)
      const isAlreadyReadOnce = profile.warning_type === 'once' && localStorage.getItem(`dg_read_warn_${profile.warning_msg}`) === 'true'

      if (!isExpired && !isAlreadyReadOnce) {
        sendSystemNotification(profile.warning_title || "Notifikasi by founder HW", {
          body: profile.warning_msg || "Menerima pesan baru.",
          tag: "user-warning",
          image: profile.warning_img_url || ""
        })
      }
    }
  }

  function handleDeleteRequest(id) {
    setDeleteTargetId(id)
  }

  const confirmDeleteSesi = async () => {
    if (!deleteTargetId) return
    const deleteAudio = new Audio(AUDIO_URLS.others.hapusLog)
    deleteAudio.play().catch(e => console.log(e))
    
    await supabase.from('entries').delete().eq('id', deleteTargetId)
    setDeleteTargetId(null)
    await fetchEntries()
  }

  function handleEdit(entry) {
    setEditEntry(entry)
    setShowLogModal(true)
  }

  function handleNewLog() {
    setEditEntry(null)
    setDraftData(null)
    setShowLogModal(true)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const triggerLogoutModalWithVoice = () => {
    const logoutAudio = new Audio(AUDIO_URLS.others.logOut)
    logoutAudio.play().catch(e => console.log(e))
    setShowLogoutConfirm(true)
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

  const isWarningExpired = profile?.warning_expires_at && new Date() > new Date(profile.warning_expires_at)
  const isWarningDismissedOnce = profile?.warning_type === 'once' && localStorage.getItem(`dg_read_warn_${profile?.warning_msg}`) === 'true'

  const handleDismissWarning = () => {
    if (profile?.warning_type === 'once') {
      localStorage.setItem(`dg_read_warn_${profile.warning_msg}`, 'true')
    }
    setDismissWarnPopup(true)
  }

  // 1️⃣ OPTIMASI TIMING PERDANA: Splash Screen Cover harus jadi rajanya, tampil pertama tanpa diblokir skeleton
  if (showWelcomeCover) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0A0A0E] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
        <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs rounded-none p-5 flex flex-col gap-4 relative shadow-2xl text-center">
          <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-[3px] border-l-[3px] border-[#7C5CFF] z-[110]" />
          <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-[3px] border-r-[3px] border-[#7C5CFF] z-[110]" />
          <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-[3px] border-l-[3px] border-[#7C5CFF] z-[110]" />
          <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-[3px] border-r-[3px] border-[#7C5CFF] z-[110]" />
          
          <div className="border border-[#211D2C] relative p-3 rounded-none bg-black/40 flex items-center justify-center gap-2">
            <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
            <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
            <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
            <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />
            <span className="font-display font-black text-xs uppercase tracking-wider text-[#7C5CFF]">SYSTEM SIAP</span>
          </div>
          
          <p className="font-mono text-[10px] text-[#8B8696] uppercase tracking-wide leading-relaxed">
            Koneksi AI Seolha  Terdeteksi.<br/>Ketuk tombol untuk sinkronisasi suara.
          </p>
          
          <button 
            type="button" 
            onClick={handleWelcomeInitialization}
            className="w-full py-3 bg-[#7C5CFF] text-white font-black rounded-none uppercase tracking-wider text-xs shadow-lg hover:bg-[#6b52e0] font-mono animate-pulse"
          >
            MASUK SYSTEM
          </button>
        </div>
      </div>
    )
  }

  // 2️⃣ KONDISI SKELETON: Hanya muncul setelah "MASUK SYSTEM" dan JIKA koneksi user lemot (loading masih true)
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between select-none animate-pulse">
        <div className="max-w-lg mx-auto pb-32 w-full flex-1">
          {/* Skeleton Top Navbar */}
          <div className="flex items-center justify-between px-4 bg-[#0A0A0E]" style={{ height: '56px', borderBottom: '1px solid #211D2C' }}>
            <div className="flex items-center gap-3 h-full">
              <div className="w-14 h-full bg-[#100E16]" />
              <div className="w-36 h-4 bg-[#211D2C]" />
            </div>
            <div className="flex gap-2">
              <div className="w-7 h-7 bg-[#100E16]" />
              <div className="w-7 h-7 bg-[#100E16]" />
            </div>
          </div>

          {/* Skeleton ProfileHeader */}
          <div className="p-4 bg-[#0A0A0E] space-y-4" style={{ borderBottom: '1px solid #211D2C' }}>
            <div className="w-full h-28 bg-[#100E16] border border-[#211D2C]" />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#211D2C] border border-[#312C42]" />
              <div className="flex-1 space-y-2">
                <div className="w-28 h-4 bg-[#211D2C]" />
                <div className="w-44 h-3 bg-[#100E16]" />
              </div>
            </div>
          </div>

          {/* Skeleton Daily Quest Container */}
          <div className="mx-4 mt-4 mb-4" style={{ border: '1px solid #211D2C' }}>
            <div className="px-4 py-3 bg-[#0A0A0E]" style={{ borderBottom: '1px solid #211D2C' }}>
              <div className="w-24 h-3 bg-[#211D2C]" />
            </div>
            <div className="p-3 flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#0A0A0E]" style={{ border: '1px solid #211D2C' }}>
                  <div className="flex items-center gap-3 w-2/3">
                    <div className="w-4 h-4 bg-[#211D2C] rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-full h-3 bg-[#211D2C]" />
                      <div className="w-2/3 h-2 bg-[#100E16]" />
                    </div>
                  </div>
                  <div className="w-14 h-6 bg-[#100E16]" />
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Achievements Container */}
          <div className="mx-4 mb-4" style={{ border: '1px solid #211D2C' }}>
            <div className="px-4 py-3 bg-[#0A0A0E]" style={{ borderBottom: '1px solid #211D2C' }}>
              <div className="w-36 h-3 bg-[#211D2C]" />
            </div>
            <div className="p-3 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#0A0A0E]" style={{ border: '1px solid #211D2C' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton Fixed Menu Dock */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#100E16]/95 border border-[#211D2C] px-5 py-2.5 flex items-center gap-5 rounded-2xl max-w-[90%] w-max">
          <div className="w-12 h-12 rounded-xl bg-[#211D2C]" />
          <div className="w-14 h-14 rounded-2xl bg-[#211D2C]" />
          <div className="w-12 h-12 rounded-xl bg-[#211D2C]" />
        </div>
      </div>
    )
  }

  if (profile?.status === 'banned') {
    return (
      <div className="min-h-screen bg-[#0A0A0E] flex items-center justify-center p-4 font-mono select-none">
        <div className="bg-[#100E16] border border-red-500/30 p-5 w-full max-w-xs text-center relative text-red-400 text-xs">
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-red-500" />
          <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-red-500" />
          <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-red-500" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-red-500" />
          <p className="font-bold uppercase tracking-widest mb-2">AKSES SYSTEM DIBEKUKAN</p>
          <p className="text-[10px] text-gray-500 uppercase leading-relaxed">
            {profile.warning_msg || "Akun Anda telah ditangguhkan secara permanen oleh administrator."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div className="max-w-lg mx-auto pb-32 w-full flex-1">
        
        <div className="flex items-center justify-between px-4 bg-[#0A0A0E]" style={{ height: '56px', borderBottom: '1px solid #211D2C' }}>
          <div 
            onClassName={handleAdminPressStart}
            onMouseUp={handleAdminPressEnd}
            onMouseLeave={handleAdminPressEnd}
            onTouchStart={handleAdminPressStart}
            onTouchEnd={handleAdminPressEnd}
            className="flex items-center gap-3 cursor-pointer select-none h-full"
          >
            <img 
              src="/notification-icon.gif" 
              alt="Grind System Icon" 
              style={{ height: '100%', width: '56px' }}
              className="object-cover flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="font-display font-bold text-base text-accent tracking-widest active:text-[#7C5CFF] transition-colors flex items-center h-full">
              DAILY GRIND LOG
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setShowAboutModal(true)} className="p-2 hover:bg-border-hover transition-colors">
              <HelpCircle size={16} className="text-text-dim" />
            </button>
            <button onClick={triggerLogoutModalWithVoice} className="p-2 hover:bg-border-hover transition-colors">
              <LogOut size={16} className="text-text-dim" />
            </button>
          </div>
        </div>

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
            
            <div className="mt-8 mb-5 mx-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <FilterTabs active={activeFilter} onChange={setActiveFilter} />
            </div>

            {filteredEntries.length === 0 ? (
              <div className="mx-4 py-16 text-center">
                <p className="font-display text-2xl font-bold text-text-dim mb-2">NO ENTRIES</p>
                <button onClick={handleNewLog} className="font-display font-semibold text-base px-6 py-3" style={{ background: '#7C5CFF', color: '#EDEAF6' }}>LOG SESI PERTAMA</button>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredEntries.map(entry => (
                  <EntryCard 
                    key={entry.id} 
                    entry={entry} 
                    profile={profile} 
                    level={level} 
                    streak={streak} 
                    onEdit={handleEdit} 
                    onDelete={handleDeleteRequest} 
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 🎯 TAB BARU: QUESTBOARD (Sudah di-update dengan onBack) */}
        {activeTab === 'battle' && (
          <QuestBoard 
            onFinalizeBattle={handleFinalizeBattle} 
            onBack={() => setActiveTab('grind')} 
          />
        )}

        {activeTab === 'radar' && <FitnessFoodMap onBackToHome={() => setActiveTab('grind')} />}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#100E16]/95 backdrop-blur-md border border-[#211D2C] px-5 py-2.5 flex items-center gap-4 z-40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-w-[95%] w-max">
        
        {/* 🎯 TOMBOL BARU DI DOCK: SWORDS (QUESTBOARD) */}
        <button 
          type="button" 
          onClick={() => setActiveTab(activeTab === 'battle' ? 'grind' : 'battle')} 
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
            activeTab === 'battle' ? 'bg-[#7C5CFF]/20 text-[#7C5CFF] border border-[#7C5CFF]' : 'bg-[#211D2C] text-white border border-[#312C42] hover:bg-[#7C5CFF]/20'
          }`}
        >
          <Swords size={22} className={activeTab === 'battle' ? 'animate-pulse' : ''} />
        </button>

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

      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs p-5 rounded-none relative shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col gap-4 select-none animate-in fade-in zoom-in-95 duration-150">
            <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-[#7C5CFF] z-50" />
            <div className="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-2 border-r-2 border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-2 border-l-2 border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-[#7C5CFF] z-50" />
            
            <div className="border border-[#211D2C] relative p-3 rounded-none bg-black/40 flex items-center justify-center">
              <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />
              <span className="font-display font-black text-xs uppercase tracking-wider text-[#7C5CFF]">DESTRUKSI LOG</span>
            </div>
            <p className="font-mono text-[10px] text-[#EDEAF6]/50 leading-relaxed uppercase tracking-wider text-center">
              Sesi ini akan dihapus secara permanen dari server database. Lanjutkan?
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px] mt-1">
              <button type="button" onClick={() => setDeleteTargetId(null)} className="py-2.5 border border-[#211D2C] text-[#EDEAF6]/60 font-bold uppercase transition-all active:scale-95">BATAL</button>
              <button type="button" onClick={confirmDeleteSesi} className="py-2.5 bg-[#7C5CFF] text-white font-black uppercase transition-all active:scale-95 shadow-[0_0_10px_rgba(124,92,255,0.4)]">HAPUS</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs p-5 rounded-none relative shadow-lg flex flex-col gap-4">
            <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-[#7C5CFF] z-50" />
            <div className="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-2 border-r-2 border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-2 border-l-2 border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-[#7C5CFF] z-50" />
            
            <div className="border border-[#211D2C] relative p-3 rounded-none bg-black/40 flex items-center justify-center">
              <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />
              <span className="font-display font-black text-xs uppercase tracking-wider text-[#7C5CFF]">KONFIRMASI KELUAR</span>
            </div>
            <p className="font-mono text-[10px] text-[#EDEAF6]/50 leading-relaxed uppercase tracking-wider text-center">
              kamu mau meninggalku ya.. Lu yakin mau log out dari akun Daily Grind Log ini?
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px] mt-1">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="py-2.5 border border-[#211D2C] text-white uppercase transition-all active:scale-95">BATAL</button>
              <button type="button" onClick={handleSignOut} className="py-2.5 bg-[#7C5CFF] text-white font-black uppercase transition-all active:scale-95 shadow-[0_0_10px_rgba(124,92,255,0.4)]">SETUJU</button>
            </div>
          </div>
        </div>
      )}

      {showBackConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs p-5 rounded-none relative shadow-[0_15px_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 font-mono text-center">
            <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-[#7C5CFF] z-50" />
            <div className="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-2 border-r-2 border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-2 border-l-2 border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-[#7C5CFF] z-50" />

            <div className="border border-[#211D2C] relative p-3 rounded-none bg-black/40 flex items-center justify-center gap-2">
              <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />
              <span className="font-display font-black text-xs uppercase tracking-wider text-[#7C5CFF]">
                NOTIFIKASI BY SYSTEM
              </span>
            </div>

            <p className="text-[10px] text-[#EDEAF6]/70 leading-relaxed uppercase tracking-wide px-1">
              yakin mau keluar dari Daily Grind Log
            </p>

            <div className="grid grid-cols-2 gap-3 text-[11px] mt-1 font-bold">
              <button 
                type="button" 
                onClick={() => setShowBackConfirm(false)} 
                className="py-2.5 border border-[#211D2C] text-[#EDEAF6]/60 uppercase tracking-wider transition-all active:scale-95"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={() => {
                  isExitingRef.current = true;
                  setShowBackConfirm(false);
                  window.close();
                  window.history.go(-window.history.length || -10);
                }} 
                className="py-2.5 bg-[#7C5CFF] text-white uppercase tracking-wider transition-all active:scale-95 font-black shadow-[0_0_12px_rgba(124,92,255,0.4)]"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {profile?.status === 'warned' && !dismissWarnPopup && !isWarningExpired && !isWarningDismissedOnce && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs p-5 rounded-none relative shadow-2xl flex flex-col gap-4 text-center font-mono">
            
            <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-[3px] border-l-[3px] border-[#7C5CFF] z-50" />
            <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-[3px] border-r-[3px] border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-[3px] border-l-[3px] border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-[3px] border-r-[3px] border-[#7C5CFF] z-50" />

            <div className="border border-[#211D2C] relative p-3 rounded-none bg-black/40 flex items-center justify-center gap-2">
              <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />
              <AlertTriangle size={14} className="text-[#7C5CFF]" />
              <span className="font-black text-xs uppercase tracking-wider text-[#7C5CFF]">
                {profile.warning_title || "Notifikasi by founder HW"}
              </span>
            </div>

            <p className="text-[10px] text-[#EDEAF6]/80 leading-relaxed uppercase tracking-wide px-1">
              {profile.warning_msg}
            </p>

            <div className="relative border border-[#211D2C] bg-[#7C5CFF] mt-1">
              <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#9A80FF]" />
              <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#9A80FF]" />
              <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#9A80FF]" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#9A80FF]" />
              <button 
                type="button" 
                onClick={handleDismissWarning}
                className="w-full py-2.5 bg-transparent text-white font-black uppercase tracking-wider text-[11px] rounded-none outline-none transition-all active:scale-95 text-center block shadow-[0_0_12px_rgba(124,92,255,0.3)]"
              >
                IYA
              </button>
            </div>
          </div>
        </div>
      )}

      {showStreakBreakModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs p-5 rounded-none relative shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col gap-4 font-mono text-center">
            <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-[#7C5CFF] z-50" />
            <div className="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-2 border-r-2 border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-2 border-l-2 border-[#7C5CFF] z-50" />
            <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-[#7C5CFF] z-50" />
            
            <div className="border border-[#211D2C] relative p-3 rounded-none bg-black/40 flex items-center justify-center gap-2">
              <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />
              <span className="font-display font-black text-xs uppercase tracking-wider text-[#7C5CFF]">NOTIFIKASI STREAK</span>
            </div>
            
            <p className="text-[10px] text-[#EDEAF6]/70 leading-relaxed uppercase tracking-wide px-1">
              sayang sekali pecah streak kamu
            </p>
            
            <div className="relative border border-[#211D2C] bg-[#7C5CFF] mt-1">
              <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#9A80FF]" />
              <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#9A80FF]" />
              <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#9A80FF]" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#9A80FF]" />
              <button 
                type="button" 
                onClick={() => setShowStreakBreakModal(false)}
                className="w-full py-2.5 bg-transparent text-white font-black uppercase tracking-wider text-[11px] rounded-none outline-none transition-all active:scale-95 text-center block shadow-[0_0_12px_rgba(124,92,255,0.3)]"
              >
                OKE
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompanion && <CompanionAI userStats={userStats} profile={profile} onClose={() => setShowCompanion(false)} />}
      
      {/* 🎯 LOG MODAL UPDATE UNTUK NANGKEP DATA DRAFT */}
      {showLogModal && (
        <LogModal 
          userId={userId} 
          maxDayNumber={maxDayNumber} 
          editEntry={editEntry} 
          draftData={draftData}
          onClose={() => { setShowLogModal(false); setEditEntry(null); setDraftData(null) }} 
          onSaved={() => {
            const updateAudio = new Audio(AUDIO_URLS.others.updateLog)
            updateAudio.play().catch(e => console.log(e))
            fetchEntries()
            fetchProfile() 
            setActiveFilter('Semua') 
          }} 
        />
      )}
      
      {showProfileModal && <ProfileEditModal profile={profile} userId={userId} onClose={() => setShowProfileModal(false)} onSaved={fetchProfile} />}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} entries={entries} userId={userId} />}

      <LevelUpModal isOpen={showLevelUp} oldTier={levelUpData.oldTier} newTier={levelUpData.newTier} newLevel={levelUpData.newLevel} onClose={() => setShowLevelUp(false)} />
      <AchievementUnlockModal isOpen={showAchievementUnlock} achievement={activeUnlockAchievement} onClose={() => setShowAchievementUnlock(false)} />
      
      {showAdminModal && (
        <AdminPanel 
          userId={userId} 
          onClose={() => setShowAdminModal(false)} 
        />
      )}

    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { Camera, User, Activity, Zap, Shield, Brain, Eye, ChevronLeft, Pencil, Check, Download, Upload, HardDrive } from 'lucide-react'

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const AREA_STAT_MAP = {
  Chest: 'str', Back: 'str', Shoulders: 'str',
  Arms: 'agi', Core: 'agi',
  Legs: 'vit'
}

const JOB_MAP = {
  Chest: 'STRIKER', Back: 'STRIKER', Shoulders: 'STRIKER',
  Arms: 'BRAWLER', Core: 'ASSASSIN', Legs: 'TANK'
}

const TITLE_MAP = { EX: 'ABSOLUTE BEING', SSS: 'RULER', SS: 'SOVEREIGN', S: 'MONARCH', A: 'AWAKENED', B: 'HUNTER', C: 'NOVICE', D: 'E-RANK', '-': 'UNRANKED' }

const BASE_STATS = { str: 15, agi: 12, vit: 14, int: 10, per: 11 }
const RANK_ORDER = { EX: 8, SSS: 7, SS: 6, S: 5, A: 4, B: 3, C: 2, D: 1, rest: 0 }

// --- SYSTEM UI SOUND EFFECT (NO FILE NEEDED) ---
const playSystemClick = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square'; // Suara mekanis/digital
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.05, ctx.currentTime); // Volume
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.03);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Abaikan jika browser tidak support autoplay audio
  }
}

// Tambahan argumen currentDayIndex biar cuma ngitung sampai hari ini
function computePlayerProgress(schedule, currentDayIndex) {
  const bonus = { str: 0, agi: 0, vit: 0, int: 0, per: 0 }
  const uniqueExercises = new Set()
  const focusCount = {}
  let totalExp = 0
  let totalSessions = 0
  let bestRank = 'D'
  let hasAnyData = false

  DAYS.forEach((day, index) => {
    // SYSTEM LIVE: Abaikan hari yang belum dilewati dalam minggu ini
    if (index > currentDayIndex) return;

    const dayData = schedule[day] || { items: [], focus: 'Chest' }
    const items = dayData.items || []
    let dailyVolume = 0

    items.forEach(item => {
      const match = item.text.match(/(.+) \[\s*(\d+)\s*KG\s*X\s*(\d+)\s*REPS\s*\]/i)
      if (match) {
        uniqueExercises.add(match[1].trim())
        dailyVolume += parseInt(match[2], 10) * parseInt(match[3], 10)
      } else {
        uniqueExercises.add(item.text)
      }
    })

    const dailyExp = items.length > 0 ? Math.floor(items.length * 15 + dailyVolume / 25) : 0
    totalExp += dailyExp

    if (dailyExp > 0) {
      hasAnyData = true
      totalSessions++
      focusCount[dayData.focus] = (focusCount[dayData.focus] || 0) + 1

      const statKey = AREA_STAT_MAP[dayData.focus] || 'str'
      bonus[statKey] += Math.floor(dailyVolume / 200)

      let rank = 'D'
      if (dailyExp >= 600) rank = 'EX'
      else if (dailyExp >= 450) rank = 'SSS'
      else if (dailyExp >= 360) rank = 'SS'
      else if (dailyExp >= 280) rank = 'S'
      else if (dailyExp >= 200) rank = 'A'
      else if (dailyExp >= 120) rank = 'B'
      else if (dailyExp >= 50) rank = 'C'
      if (RANK_ORDER[rank] > RANK_ORDER[bestRank]) bestRank = rank
    }
  })

  bonus.int = totalSessions
  bonus.per = uniqueExercises.size

  let dominantFocus = 'Chest'
  let maxCount = 0
  Object.entries(focusCount).forEach(([focus, count]) => {
    if (count > maxCount) { maxCount = count; dominantFocus = focus }
  })

  const level = 1 + Math.floor(totalExp / 500)
  const currentLevelExp = totalExp % 500

  return {
    level,
    str: BASE_STATS.str + bonus.str,
    agi: BASE_STATS.agi + bonus.agi,
    vit: BASE_STATS.vit + bonus.vit,
    int: BASE_STATS.int + bonus.int,
    per: BASE_STATS.per + bonus.per,
    exp: currentLevelExp,
    nextExp: 500,
    job: hasAnyData ? JOB_MAP[dominantFocus] : 'NONE',
    title: hasAnyData ? (TITLE_MAP[bestRank] || 'AWAKENED') : 'AWAKENED'
  }
}

function loadSchedule() {
  try {
    const saved = localStorage.getItem('dg_workout_schedule')
    if (!saved) return null
    return JSON.parse(saved)
  } catch (e) {
    return null
  }
}

export default function StatusWindow({ onBack }) {
  const [avatar, setAvatar] = useState(null)
  const [schedule, setSchedule] = useState(() => loadSchedule() || {})
  const [playerName, setPlayerName] = useState('PLAYER')
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const todayIndex = useMemo(() => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1
  }, [])

  useEffect(() => {
    const savedAvatar = localStorage.getItem('dg_status_avatar')
    if (savedAvatar) setAvatar(savedAvatar)

    const savedName = localStorage.getItem('dg_player_name')
    if (savedName) setPlayerName(savedName)

    const fresh = loadSchedule()
    if (fresh) setSchedule(fresh)

    const handleSync = () => {
      const updated = loadSchedule()
      if (updated) setSchedule(updated)
    }
    window.addEventListener('dg-schedule-updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('dg-schedule-updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const stats = useMemo(() => computePlayerProgress(schedule, todayIndex), [schedule, todayIndex])

  const startEditingName = () => {
    playSystemClick();
    setNameDraft(playerName)
    setIsEditingName(true)
  }

  const saveName = () => {
    playSystemClick();
    const trimmed = nameDraft.trim()
    const finalName = trimmed.length > 0 ? trimmed.slice(0, 20) : 'PLAYER'
    setPlayerName(finalName)
    localStorage.setItem('dg_player_name', finalName)
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') saveName()
    if (e.key === 'Escape') setIsEditingName(false)
  }

  const handlePhotoUpload = (e) => {
    playSystemClick();
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setAvatar(base64String)
        localStorage.setItem('dg_status_avatar', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  // --- SYSTEM BACKUP & RESTORE FUNCTIONS ---
  const handleExportData = () => {
    playSystemClick();
    const systemData = {
      dg_workout_schedule: localStorage.getItem('dg_workout_schedule'),
      dg_player_name: localStorage.getItem('dg_player_name'),
      dg_status_avatar: localStorage.getItem('dg_status_avatar'),
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(systemData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `GrindLog_SystemData_${new Date().toISOString().slice(0,10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = (e) => {
    playSystemClick();
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result)
        if (importedData.dg_workout_schedule) localStorage.setItem('dg_workout_schedule', importedData.dg_workout_schedule)
        if (importedData.dg_player_name) localStorage.setItem('dg_player_name', importedData.dg_player_name)
        if (importedData.dg_status_avatar) localStorage.setItem('dg_status_avatar', importedData.dg_status_avatar)
        
        alert('[SYSTEM RESTORED] Data berhasil dipulihkan. Sistem akan dimuat ulang.')
        window.location.reload()
      } catch (err) {
        alert('[ERROR] File korup atau format tidak sesuai protokol!')
      }
    }
    reader.readAsText(file)
  }

  const expPercent = Math.min((stats.exp / stats.nextExp) * 100, 100)

  return (
    <div className="w-full h-full bg-[#0A0A0E] text-white font-mono p-4 pb-32 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6 border-b border-[#211D2C] pb-4">
        <button
          onClick={() => { playSystemClick(); onBack(); }}
          className="p-2 bg-[#100E16] border border-[#211D2C] hover:bg-[#7C5CFF]/20 text-white transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-black tracking-widest text-[#7C5CFF] uppercase">
          STATUS WINDOW
        </h1>
        <span className="ml-auto text-[8px] text-[#7C5CFF]/70 border border-[#7C5CFF]/40 px-2 py-1 tracking-widest uppercase">
          SYNCED
        </span>
      </div>

      {/* PLAYER CARD */}
      <div className="relative bg-[#100E16] border border-[#211D2C] p-5 shadow-[0_0_30px_rgba(124,92,255,0.1)] mb-6">
        <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-[#7C5CFF]" />
        <div className="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-2 border-r-2 border-[#7C5CFF]" />
        <div className="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-2 border-l-2 border-[#7C5CFF]" />
        <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-[#7C5CFF]" />

        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">

          <div className="relative group flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 border-2 border-[#312C42] bg-[#0A0A0E] overflow-hidden relative shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              {avatar ? (
                <img src={avatar} alt="Player Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#312C42] gap-2">
                  <User size={40} />
                  <span className="text-[10px] tracking-widest uppercase">NO IMAGE</span>
                </div>
              )}

              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
                <Camera size={24} className="text-[#7C5CFF] mb-1" />
                <span className="text-[10px] text-white tracking-wider uppercase font-bold">Upload</span>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#7C5CFF] text-white text-[10px] font-black px-3 py-1 tracking-widest uppercase shadow-[0_0_10px_rgba(124,92,255,0.4)] whitespace-nowrap">
              LV. {stats.level}
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b border-[#211D2C] pb-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Name</p>
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      onBlur={saveName}
                      maxLength={20}
                      className="bg-black border border-[#7C5CFF] text-[#EDEAF6] text-sm font-bold tracking-wider px-2 py-1 w-full outline-none"
                    />
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={saveName}
                      className="p-1.5 bg-[#7C5CFF] text-[#100E16] flex-shrink-0"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startEditingName}
                    className="flex items-center gap-1.5 group outline-none"
                  >
                    <p className="text-sm font-bold tracking-wider text-[#EDEAF6]">{playerName}</p>
                    <Pencil size={11} className="text-[#7C5CFF]/50 group-hover:text-[#7C5CFF] transition-colors" />
                  </button>
                )}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Job</p>
                <p className="text-sm font-bold tracking-wider text-[#7C5CFF]">{stats.job}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Title</p>
                <p className="text-sm font-bold tracking-wider text-[#EDEAF6]">{stats.title}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-1">
                <p className="text-[10px] text-[#7C5CFF] uppercase tracking-widest font-bold">Experience</p>
                <p className="text-[10px] text-gray-400 font-mono">{stats.exp} / {stats.nextExp}</p>
              </div>
              <div className="w-full h-2 bg-[#211D2C] overflow-hidden">
                <div
                  className="h-full bg-[#7C5CFF] shadow-[0_0_10px_rgba(124,92,255,0.6)] transition-all duration-500"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#100E16] border border-[#211D2C] p-4 relative">
          <h2 className="text-xs font-black text-[#7C5CFF] tracking-widest uppercase mb-4 flex items-center gap-2">
            <Activity size={14} /> Physical Stats
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#211D2C] text-red-400 group-hover:bg-red-500/20 transition-colors"><Zap size={14} /></div>
                <span className="text-xs tracking-wider text-gray-300">STRENGTH (STR)</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.str}</span>
            </div>
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#211D2C] text-green-400 group-hover:bg-green-500/20 transition-colors"><Activity size={14} /></div>
                <span className="text-xs tracking-wider text-gray-300">AGILITY (AGI)</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.agi}</span>
            </div>
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#211D2C] text-blue-400 group-hover:bg-blue-500/20 transition-colors"><Shield size={14} /></div>
                <span className="text-xs tracking-wider text-gray-300">VITALITY (VIT)</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.vit}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#100E16] border border-[#211D2C] p-4 relative">
          <h2 className="text-xs font-black text-[#7C5CFF] tracking-widest uppercase mb-4 flex items-center gap-2">
            <Brain size={14} /> Mental Stats
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#211D2C] text-purple-400 group-hover:bg-purple-500/20 transition-colors"><Brain size={14} /></div>
                <span className="text-xs tracking-wider text-gray-300">INTELLIGENCE (INT)</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.int}</span>
            </div>
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#211D2C] text-yellow-400 group-hover:bg-yellow-500/20 transition-colors"><Eye size={14} /></div>
                <span className="text-xs tracking-wider text-gray-300">PERCEPTION (PER)</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.per}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA MANAGEMENT ZONE (BACKUP & RESTORE) */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 relative shadow-lg">
        <h2 className="text-[10px] font-black text-[#8B8696] tracking-widest uppercase mb-3 flex items-center gap-1.5 border-b border-[#211D2C] pb-2">
          <HardDrive size={12} /> DATABASE SYSTEM MANAGEMENT
        </h2>
        <div className="text-[9px] text-gray-500 mb-4 leading-relaxed uppercase tracking-wider">
          Simpan progres sistem Anda secara lokal. Berguna saat Anda berpindah perangkat atau menghapus cache memori.
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 py-3 bg-[#211D2C] hover:bg-[#312C42] border border-[#312C42] text-[#7C5CFF] text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <Download size={14} /> BACKUP DATA
          </button>
          
          <label className="flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-[#211D2C] border border-dashed border-[#312C42] text-[#EDEAF6]/60 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer">
            <Upload size={14} /> RESTORE
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportData} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

    </div>
  )
}

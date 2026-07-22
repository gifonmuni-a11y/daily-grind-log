import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Plus, Trash2, ChevronDown, BookOpen, X, 
  DownloadCloud, Target, HardDrive, Flame, Zap, Trophy, TrendingUp
} from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const GENERATED_RANGE = Array.from({ length: 100 }, (_, i) => i + 1);

const EXERCISE_DATABASE = [
  'Barbell Bench Press (Dada Barbel)', 'Dumbbell Incline Press (Dada Atas)', 'Chest Fly Machine (Mesin Dada)', 'Cable Crossover (Kabel Dada)',
  'Weighted Pull Up (Tarik Badan Beban)', 'Barbell Bent Over Row (Dayung Barbel)', 'Seated Cable Row (Dayung Kabel)', 'Lat Pulldown (Tarik Punggung)',
  'Overhead Barbell Press (Dorong Bahu)', 'Dumbbell Lateral Raise (Bahu Samping)', 'Cable Face Pull (Bahu Belakang)',
  'Barbell Bicep Curl (Bicep Barbel)', 'Tricep Overhead Extension (Tricep Atas)', 'Cable Tricep Pushdown (Tricep Bawah)',
  'Barbell Back Squat (Jongkok Barbel)', 'Leg Press Machine (Mesin Kaki)', 'Bulgarian Split Squat (Jongkok 1 Kaki)', 'Dumbbell Lunge (Langkah Beban)',
  'Romanian Deadlift (Angkat Beban Paha)', 'Lying Leg Curl Machine (Mesin Tekuk Kaki)', 'Seated Leg Extension (Mesin Lurus Kaki)', 'Standing Calf Raise (Jinjit Betis)',
  'Hanging Leg Raise (Angkat Kaki Gantung)', 'Cable Crunch (Perut Kabel)', 'Ab Wheel Rollout (Roda Perut)',
  'Treadmill Interval Sprint (Lari Treadmill)', 'Rowing Machine (Mesin Dayung)', 'Stationary Bike (Sepeda Statis)',
  'Latihan Kustom (Isi Manual)'
];

const ANATOMY_AREAS = [
  { id: 'Chest', name: 'DADA / PUSH', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80' },
  { id: 'Back', name: 'PUNGGUNG / PULL', img: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=80' },
  { id: 'Shoulders', name: 'BAHU / DELTOID', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=400&q=80' },
  { id: 'Arms', name: 'LENGAN / ARMS', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80' },
  { id: 'Legs', name: 'PAHA / QUADS', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80' },
  { id: 'Core', name: 'PERUT / CORE', img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=400&q=80' }
];

const SYS_COLORS = {
  rankEX: "#FF4D6D",
  rankSSS: "#FFD86B",
  rankSS: "#FF9F5C",
  rankS: "#9B8CFF",
  rankA: "#3FE6C4",
  rankB: "#EFEDFA",
  rankC: "#9C99B8",
  rankD: "#6E6B8F",
  rest: "#312C42",
};

const CornerBrackets = () => (
  <>
    <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF] pointer-events-none z-10" />
  </>
);

function RankBadge({ rank, size = 26 }) {
  const color = SYS_COLORS[`rank${rank}`] || SYS_COLORS.rest;
  const isRest = rank === "rest" || !rank;
  return (
    <div className="flex items-center justify-center font-mono font-black border" style={{ width: size, height: size, fontSize: size * 0.44, color: isRest ? "#7E7AA0" : color, background: isRest ? "transparent" : `${color}20`, borderColor: isRest ? '#312C42' : color }}>
      {isRest ? "-" : rank}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="p-3 bg-black/40 border border-[#211D2C] relative">
      <CornerBrackets />
      <div className="font-mono uppercase text-[#EDEAF6]/50 tracking-widest text-[9px]">{label}</div>
      <div className="font-mono font-black mt-1 text-lg truncate" style={{ color: color || "#EDEAF6" }}>{value}</div>
    </div>
  );
}

// Helper buat ngambil nama hari ini dari index JS Date
const getTodayIndex = () => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
};

export default function JadwalLatihan({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState('fullbody');
  
  const [showCalendarAppPrompt, setShowCalendarAppPrompt] = useState(false);
  const [customAlert, setCustomAlert] = useState({ isOpen: false, message: '' });

  const [view, setView] = useState("week"); 
  
  // Set default Recap & Active tab ke HARI INI
  const [selectedDayRecap, setSelectedDayRecap] = useState(getTodayIndex); 
  const [activeDay, setActiveDay] = useState(() => DAYS[getTodayIndex()]);
  
  const [schedule, setSchedule] = useState(() => {
    return DAYS.reduce((acc, day) => ({ 
      ...acc, 
      [day]: { focus: 'Chest', items: [] } 
    }), {});
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); 
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customExerciseText, setCustomExerciseText] = useState('');
  const [selectedKg, setSelectedKg] = useState('40');
  const [selectedReps, setSelectedReps] = useState('12');

  useEffect(() => {
    const saved = localStorage.getItem('dg_workout_schedule');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = {};
        DAYS.forEach(day => {
          if (parsed[day] && !Array.isArray(parsed[day])) {
            normalized[day] = parsed[day];
          } else {
            normalized[day] = { focus: 'Chest', items: [] };
          }
        });
        setSchedule(normalized);
      } catch (e) { console.error(e); }
    }
    const timer = setTimeout(() => setIsLoading(false), 400);

    const handlePopState = (e) => { e.preventDefault(); onBack(); };
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => { clearTimeout(timer); window.removeEventListener('popstate', handlePopState); };
  }, [onBack]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('dg_workout_schedule', JSON.stringify(schedule));
      window.dispatchEvent(new Event('dg-schedule-updated')); 
    }
  }, [schedule, isLoading]);

  // Kalkulasi rekap sinkron hari ini
  const syncedStats = useMemo(() => {
    const todayIndex = getTodayIndex();
    const weekMap = [];
    const detailMap = {};
    const rankDist = { EX: 0, SSS: 0, SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 };
    let totalWeekExp = 0;
    let totalSessions = 0;
    let bestRank = 'D';

    const rankOrder = { 'EX': 8, 'SSS': 7, 'SS': 6, 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'rest': 0 };

    DAYS.forEach((day, index) => {
      const dayData = schedule[day] || { items: [], focus: 'Chest' };
      const items = dayData.items || [];
      let dailyVolume = 0;
      const parsedExercises = [];

      items.forEach((item) => {
        const match = item.text.match(/(.+) \[\s*(\d+)\s*KG\s*X\s*(\d+)\s*REPS\s*\]/i);
        if (match) {
          const name = match[1].trim();
          const kg = parseInt(match[2], 10);
          const reps = parseInt(match[3], 10);
          dailyVolume += (kg * reps);
          parsedExercises.push({ name, sets: `${reps} Reps @${kg}kg` });
        } else {
          parsedExercises.push({ name: item.text, sets: "Auto" });
        }
      });

      const dailyExp = items.length > 0 ? Math.floor((items.length * 15) + (dailyVolume / 25)) : 0;
      
      // LIVE SYSTEM: Total hitungan cuma sampai hari ini aja biar sinkron sama status window
      if (index <= todayIndex) {
        totalWeekExp += dailyExp;
        if (dailyExp > 0) totalSessions++;
      }

      let rank = 'rest';
      if (dailyExp > 0) {
        if (dailyExp < 50) rank = 'D';
        else if (dailyExp < 120) rank = 'C';
        else if (dailyExp < 200) rank = 'B';
        else if (dailyExp < 280) rank = 'A';
        else if (dailyExp < 360) rank = 'S';
        else if (dailyExp < 450) rank = 'SS';
        else if (dailyExp < 600) rank = 'SSS';
        else rank = 'EX';
        
        // Update rank & dist cuma kalau hari tsb udah masuk hitungan (live hari ini)
        if (index <= todayIndex) {
          rankDist[rank]++;
          if (rankOrder[rank] > rankOrder[bestRank]) bestRank = rank;
        }
      }

      weekMap.push({ label: day.substring(0, 3), rank, exp: dailyExp });
      
      detailMap[index] = items.length > 0 ? {
        dayLabel: `${day.toUpperCase()} LOG`,
        category: dayData.focus.toUpperCase(),
        rank: rank,
        durationMin: items.length * 10, 
        exp: dailyExp,
        exercises: parsedExercises
      } : null;
    });

    const monthCells = [];
    for (let i = 0; i < 30; i++) {
      const dayIndex = i % 7;
      monthCells.push(weekMap[dayIndex].rank);
    }

    return { 
      weekMap, 
      detailMap, 
      monthCells,
      totalWeekExp, 
      totalSessions, 
      bestRank: bestRank === 'rest' ? '-' : bestRank, 
      rankDist 
    };
  }, [schedule]);


  const handleSetData = (type, id) => {
    setSchedule(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], [type]: id } }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const coreName = selectedExercise === 'Latihan Kustom (Isi Manual)' ? customExerciseText.trim() : selectedExercise.split(' (')[0];
    if (!coreName) return;
    
    const fullLogText = `${coreName} [ ${selectedKg} KG X ${selectedReps} REPS ]`;
    
    setSchedule(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        items: [...prev[activeDay].items, { id: Date.now(), text: fullLogText }]
      }
    }));
    
    setSelectedExercise('');
    setCustomExerciseText('');
    setOpenDropdown(null);
    setIsAdding(false);
  };

  const handleDeleteItem = (day, id) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], items: prev[day].items.filter(item => item.id !== id) }
    }));
  };

  const executeCloudRouting = (mode) => {
    setShowCalendarAppPrompt(false);
    let title = ''; let details = '';

    if (mode === 'daily') {
      const dayData = schedule[activeDay];
      if (dayData.items.length === 0) {
        setCustomAlert({ isOpen: true, message: `JADWAL HARI ${activeDay.toUpperCase()} KOSONG! ISI DULU SEBELUM SINKRONISASI.` });
        return;
      }
      title = encodeURIComponent(`[GRIND LOG] HARI ${activeDay.toUpperCase()}`);
      details = encodeURIComponent(dayData.items.map((it, idx) => `${idx + 1}. ${it.text}`).join('\n'));
    } 
    else if (mode === 'weekly') {
      title = encodeURIComponent(`[GRIND LOG] JADWAL 1 MINGGU FULL`);
      let fullDetails = [];
      DAYS.forEach(day => {
        const dayItems = schedule[day].items;
        if (dayItems.length > 0) {
          fullDetails.push(`=== ${day.toUpperCase()} ===`);
          dayItems.forEach((it, idx) => fullDetails.push(`${idx + 1}. ${it.text}`));
          fullDetails.push(''); 
        }
      });
      if (fullDetails.length === 0) {
        setCustomAlert({ isOpen: true, message: 'SELURUH JADWAL MINGGUAN KOSONG! ISI MINIMAL 1 HARI SEBELUM SINKRONISASI.' });
        return;
      }
      details = encodeURIComponent(fullDetails.join('\n'));
    }

    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&recur=RRULE:FREQ=WEEKLY`;
    window.open(gCalUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-2 mx-4 animate-pulse">
        <div className="bg-[#100E16] border border-[#211D2C] p-4 h-16" />
        <div className="bg-[#100E16] border border-[#211D2C] p-4 h-24" />
      </div>
    );
  }

  const currentDayData = schedule[activeDay] || { focus: 'Chest', items: [] };
  
  const weekBarValues = syncedStats.weekMap.map((d) => d.exp);
  const weekPeak = weekBarValues.indexOf(Math.max(...weekBarValues));
  
  const monthBarValues = [
    Math.floor(syncedStats.totalWeekExp * 0.7),
    Math.floor(syncedStats.totalWeekExp * 0.85),
    Math.floor(syncedStats.totalWeekExp * 0.95),
    syncedStats.totalWeekExp
  ];

  return (
    <div className="flex flex-col gap-5 font-mono animate-in fade-in duration-200 mt-2 mx-2 sm:mx-4 select-none pb-32" onContextMenu={(e) => e.preventDefault()}>
      
      {/* HEADER NAVIGASI SYSTEM */}
      <div className="flex items-center justify-between bg-[#100E16] border border-[#211D2C] p-3 shadow-lg relative">
        <CornerBrackets />
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-[#211D2C] text-[#7C5CFF] active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[#7C5CFF] font-bold text-[10px] tracking-widest uppercase flex items-center gap-1">
              [MODUL SISTEM]
            </span>
            <span className="font-display font-black text-sm text-white uppercase tracking-widest">
              JADWAL LATIHAN
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#14121C] border border-[#312C42] text-[#A28EFF] text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all relative"
        >
          <BookOpen size={12} /> PANDUAN
        </button>
      </div>

      {/* CLOUD ALARM CONTROL CARD */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 shadow-lg relative flex flex-col gap-2">
        <CornerBrackets />
        <span className="text-[10px] text-white font-black uppercase tracking-wider flex items-center gap-1">
          [INTEGRASI ALARM KALENDER]
        </span>
        <button
          type="button"
          onClick={() => setShowCalendarAppPrompt(true)}
          className="w-full mt-1 py-3 bg-[#211D2C] text-[#7C5CFF] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 relative border border-[#312C42]"
        >
          <HardDrive size={13} /> HUBUNGKAN KE KALENDER CLOUD
        </button>
      </div>

      {/* SINKRONISASI REKAP (WEEK & MONTH TABS) */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 relative shadow-lg">
        <CornerBrackets />
        <div className="flex items-center justify-between mb-4 border-b border-[#211D2C] pb-2">
          <span className="font-black text-[#7C5CFF] text-[10px] tracking-widest uppercase flex items-center gap-1.5">
            <Target size={12} /> [MODUL REKAP ANALITIK]
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => setView("week")} className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border ${view === "week" ? "bg-[#7C5CFF] text-[#100E16] border-[#7C5CFF]" : "bg-transparent text-[#EDEAF6]/40 border-[#312C42]"}`}>MINGGU INI</button>
            <button onClick={() => setView("month")} className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border ${view === "month" ? "bg-[#7C5CFF] text-[#100E16] border-[#7C5CFF]" : "bg-transparent text-[#EDEAF6]/40 border-[#312C42]"}`}>BULAN INI</button>
          </div>
        </div>

        {/* Status Bar Global */}
        <div className="flex items-center justify-between bg-black/40 border border-[#211D2C] px-3 py-3 relative mb-4">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 font-black text-xs text-[#7C5CFF]"><Flame size={12} /> SYNC</div>
            <div className="text-[8px] text-[#EDEAF6]/50 tracking-widest uppercase mt-1">STATUS</div>
          </div>
          <div className="w-[1px] h-8 bg-[#312C42]" />
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 font-black text-xs text-white">
              <Zap size={12} /> {view === "week" ? syncedStats.totalWeekExp : syncedStats.totalWeekExp * 4}
            </div>
            <div className="text-[8px] text-[#EDEAF6]/50 tracking-widest uppercase mt-1">{view === "week" ? "MINGGUAN EXP" : "BULANAN EXP"}</div>
          </div>
        </div>

        {view === "week" ? (
          <>
            {/* Rank Strip 7 Hari */}
            <div className="flex justify-between gap-1 mb-4">
              {syncedStats.weekMap.map((d, i) => (
                <button key={i} onClick={() => setSelectedDayRecap(i)} className={`flex-1 flex flex-col items-center gap-1.5 p-2 transition-colors border ${selectedDayRecap === i ? "bg-[#211D2C] border-[#7C5CFF]" : "bg-transparent border-transparent"}`}>
                  <RankBadge rank={d.rank} size={22} />
                  <span className={`text-[8px] font-bold tracking-widest uppercase ${selectedDayRecap === i ? "text-[#7C5CFF]" : "text-[#EDEAF6]/50"}`}>{d.label}</span>
                </button>
              ))}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatCard label="SESI AKTIF" value={`${syncedStats.totalSessions} HARI`} color="#7C5CFF" />
              <StatCard label="BEST RANK" value={syncedStats.bestRank} color={SYS_COLORS[`rank${syncedStats.bestRank}`]} />
            </div>

            {/* Bar Chart Grafik Mingguan */}
            <div className="bg-black/40 border border-[#211D2C] p-3 relative mb-4">
              <div className="flex items-center justify-between text-[9px] text-[#EDEAF6]/50 tracking-widest font-bold uppercase mb-3 border-b border-[#211D2C] pb-2">
                <span className="flex items-center gap-1"><TrendingUp size={10} /> GRAFIK EXP MINGGUAN</span>
                <span className="text-[#7C5CFF]">+{syncedStats.totalWeekExp} XP</span>
              </div>
              <div className="flex items-end gap-1.5 h-20">
                {weekBarValues.map((v, i) => (
                  <div key={i} className="flex-1 transition-all duration-500 relative" style={{ height: `${Math.max((v / (Math.max(...weekBarValues) || 1)) * 100, 5)}%`, background: i === weekPeak ? "#7C5CFF" : "#312C42" }}>
                    {v > 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] text-[#EDEAF6]/60">{v}</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-2">
                {syncedStats.weekMap.map((d, i) => <span key={i} className="flex-1 text-center text-[7px] text-[#EDEAF6]/40 uppercase">{d.label[0]}</span>)}
              </div>
            </div>

            {/* Detail Harian Sesuai Pilihan Dropdown */}
            {syncedStats.detailMap[selectedDayRecap] ? (
              <div className="bg-[#14121C] border border-[#312C42] p-3 relative">
                <div className="flex justify-between items-center mb-3 border-b border-[#211D2C] pb-2">
                  <span className="text-[10px] text-white font-black">{syncedStats.detailMap[selectedDayRecap].dayLabel}</span>
                  <span className="text-[9px] bg-[#7C5CFF]/20 text-[#7C5CFF] border border-[#7C5CFF] px-2 py-0.5 font-bold">RANK {syncedStats.detailMap[selectedDayRecap].rank}</span>
                </div>
                <div className="flex flex-col gap-2 mb-3 max-h-32 overflow-y-auto pr-1">
                  {syncedStats.detailMap[selectedDayRecap].exercises.map((ex, i) => (
                    <div key={i} className="flex justify-between items-center bg-black p-2 border border-[#211D2C]">
                      <span className="text-[9px] text-[#EDEAF6] font-bold truncate max-w-[65%]">{ex.name}</span>
                      <span className="text-[8px] text-[#7C5CFF]">{ex.sets}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[8px] text-[#EDEAF6]/50 tracking-widest pt-2 border-t border-[#211D2C]">
                  <span>EXP: <b className="text-[#7C5CFF]">+{syncedStats.detailMap[selectedDayRecap].exp}</b></span>
                  <span>DURASI: <b className="text-white">{syncedStats.detailMap[selectedDayRecap].durationMin}M</b></span>
                </div>
              </div>
            ) : (
              <div className="bg-[#14121C] border border-[#211D2C] p-4 text-center text-[9px] text-[#EDEAF6]/30 uppercase tracking-widest font-bold">
                TIDAK ADA DATA LATIHAN DI HARI INI
              </div>
            )}
          </>
        ) : (
          <>
            {/* FITUR BULANAN (MONTH HEATMAP) */}
            <div className="bg-[#14121C] border border-[#312C42] p-3 relative mb-4">
              <div className="flex items-center justify-between font-mono uppercase mb-3 text-[10px] tracking-widest border-b border-[#211D2C] pb-2 text-[#EDEAF6]/50">
                <span>KALENDER RANK</span>
                <b className="text-[#7C5CFF]">PROYEKSI BULAN INI</b>
              </div>
              <div className="grid grid-cols-7 mb-1.5 text-center text-[8px] text-[#EDEAF6]/40 font-bold">
                {['S','S','R','K','J','S','M'].map((d, i) => <span key={i}>{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {syncedStats.monthCells.map((rank, i) => (
                  <div key={i} className="aspect-square border" style={{
                    background: rank === 'rest' ? 'transparent' : `${SYS_COLORS[`rank${rank}`]}20`,
                    borderColor: rank === 'rest' ? '#312C42' : SYS_COLORS[`rank${rank}`]
                  }} />
                ))}
              </div>
            </div>

            {/* Stat Cards Bulanan */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatCard label="TOTAL SESI BULAN INI" value={`${syncedStats.totalSessions * 4} HARI`} color="#7C5CFF" />
              <StatCard label="RANK DOMINAN" value={syncedStats.bestRank} color={SYS_COLORS[`rank${syncedStats.bestRank}`]} />
            </div>

            {/* Bar Chart Grafik 4 Minggu */}
            <div className="bg-black/40 border border-[#211D2C] p-3 relative mb-4">
              <div className="flex items-center justify-between text-[9px] text-[#EDEAF6]/50 tracking-widest font-bold uppercase mb-3 border-b border-[#211D2C] pb-2">
                <span className="flex items-center gap-1"><TrendingUp size={10} /> EXP PER MINGGU</span>
                <span className="text-[#7C5CFF]">4 MINGGU</span>
              </div>
              <div className="flex items-end gap-2 h-20">
                {monthBarValues.map((v, i) => (
                  <div key={i} className="flex-1 transition-all duration-500 relative" style={{ height: `${Math.max((v / (Math.max(...monthBarValues) || 1)) * 100, 5)}%`, background: i === 3 ? "#7C5CFF" : "#312C42" }}>
                    {v > 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] text-[#EDEAF6]/60">{v}</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                {["M1", "M2", "M3", "M4"].map((l, i) => <span key={i} className="flex-1 text-center text-[7px] text-[#EDEAF6]/40 uppercase font-bold">{l}</span>)}
              </div>
            </div>

            {/* Pencapaian Bulanan */}
            <div className="bg-[#14121C] border border-[#312C42] p-3 relative">
              <div className="flex items-center justify-between font-mono uppercase mb-3 text-[10px] tracking-widest border-b border-[#211D2C] pb-2 text-white">
                <span className="flex items-center gap-1"><Trophy size={12} className="text-[#7C5CFF]"/> PENCAPAIAN BULAN INI</span>
                <span className="bg-[#7C5CFF]/20 text-[#7C5CFF] border border-[#7C5CFF] px-2 py-0.5 font-bold">TERKUNCI</span>
              </div>
              <div className="flex flex-col gap-2">
                {syncedStats.totalWeekExp === 0 ? (
                  <div className="text-center py-4 text-[9px] text-[#EDEAF6]/40 tracking-widest font-bold">LATIHAN DULU BIAR DAPAT BADGE</div>
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-black p-2 border border-[#211D2C]">
                      <span className="text-[9px] text-[#EDEAF6] font-bold">TOTAL VOLUME BEBAN</span>
                      <span className="text-[8px] text-[#7C5CFF] font-black">NAIK 5%</span>
                    </div>
                    <div className="flex justify-between items-center bg-black p-2 border border-[#211D2C]">
                      <span className="text-[9px] text-[#EDEAF6] font-bold">KONSISTENSI JADWAL</span>
                      <span className="text-[8px] text-[#7C5CFF] font-black">TERJAGA</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* TABS HARI UTAMA JADWAL */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden mt-2">
        {DAYS.map(day => {
          const isActive = activeDay === day;
          const hasItems = (schedule[day]?.items?.length || 0) > 0;
          return (
            <button
              key={day}
              onClick={() => { setActiveDay(day); setIsAdding(false); setOpenDropdown(null); }}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider transition-all relative flex-shrink-0 flex items-center gap-2 border ${
                isActive 
                  ? 'bg-[#211D2C] text-white border-[#312C42]' 
                  : 'bg-[#100E16] border-[#211D2C] text-[#EDEAF6]/40 hover:bg-[#211D2C]'
              }`}
            >
              {day}
              {hasItems && <span className={`w-1.5 h-1.5 ${isActive ? 'bg-[#7C5CFF]' : 'bg-[#312C42]'}`} />}
            </button>
          )
        })}
      </div>

      {/* MATRIKS ANATOMI */}
      <div className="flex flex-col gap-2 bg-[#100E16] border border-[#211D2C] p-3 relative shadow-lg">
        <CornerBrackets />
        <span className="text-[9px] uppercase font-bold text-[#7C5CFF] tracking-widest flex items-center gap-1 border-b border-[#211D2C] pb-2">
          <Target size={10} /> [TARGET ANATOMI OTOT]
        </span>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {ANATOMY_AREAS.map(area => {
            const isTarget = currentDayData.focus === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => handleSetData('focus', area.id)}
                className={`group h-16 relative overflow-hidden text-left font-mono border transition-all duration-200 ${isTarget ? 'border-[#312C42]' : 'border-[#211D2C] opacity-40 hover:opacity-75'}`}
              >
                <img src={area.img} alt={area.name} className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0" loading="lazy" />
                <div className={`absolute inset-0 transition-opacity duration-300 ${isTarget ? 'bg-gradient-to-r from-[#0A0A0E] via-[#0A0A0E]/80 to-transparent' : 'bg-black/80'}`} />
                <div className="absolute inset-y-0 left-2 flex flex-col justify-center">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isTarget ? 'text-[#7C5CFF]' : 'text-[#EDEAF6]/50'}`}>{area.name}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* PANEL DAFTAR AKTIVITAS (FORM INPUT) */}
      <div className="bg-[#100E16] border border-[#211D2C] flex flex-col relative shadow-md min-h-[220px]">
        <CornerBrackets />
        <div className="bg-[#14121C] border-b border-[#211D2C] p-3 flex justify-between items-center relative z-10">
          <span className="text-[#7C5CFF] font-black text-xs uppercase tracking-widest">
            [DAFTAR EKSEKUSI GERAKAN]
          </span>
          <span className="text-[9px] text-[#EDEAF6]/40 font-bold uppercase tracking-widest">{(currentDayData.items?.length || 0)} KOMPONEN</span>
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1">
          {(!currentDayData.items || currentDayData.items.length === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-[#EDEAF6]/30 uppercase text-center font-bold tracking-widest py-10">
              SLOT KOSONG / HARI PEMULIHAN
            </div>
          ) : (
            currentDayData.items.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-black/40 border border-[#211D2C] relative transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[#7C5CFF] text-[10px] font-black">#{idx + 1}</span>
                  <span className="text-[#EDEAF6] text-xs font-bold uppercase tracking-wide truncate">{item.text}</span>
                </div>
                <button type="button" onClick={() => handleDeleteItem(activeDay, item.id)} className="text-[#EDEAF6]/20 hover:text-red-400 p-1.5 transition-colors z-10 relative">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}

          {isAdding ? (
            <form onSubmit={handleAddItem} className="mt-auto pt-4 flex flex-col gap-4 border-t border-[#211D2C] relative z-20">
              
              <div className="relative z-[60]">
                <span className="text-[8px] font-black text-[#EDEAF6]/40 uppercase tracking-widest mb-1.5 block">KATEGORI GERAKAN:</span>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'exercise' ? null : 'exercise')}
                  className="w-full bg-black border border-[#312C42] text-white text-xs p-3.5 flex items-center justify-between text-left font-mono relative"
                >
                  <span className="font-bold uppercase text-[#EDEAF6] truncate pr-4">{selectedExercise || 'PILIH PROTOKOL GERAKAN...'}</span>
                  <ChevronDown size={14} className="text-[#7C5CFF] flex-shrink-0" />
                </button>

                {openDropdown === 'exercise' && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-[#100E16] border border-[#7C5CFF] max-h-56 overflow-y-auto z-[100] shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col">
                    {EXERCISE_DATABASE.map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => { setSelectedExercise(ex); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-3 text-[10px] font-mono uppercase font-bold border-b border-[#211D2C] ${selectedExercise === ex ? 'bg-[#211D2C] text-[#7C5CFF]' : 'text-[#EDEAF6]/70 hover:bg-[#211D2C]'}`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedExercise === 'Latihan Kustom (Isi Manual)' && (
                <div className="relative z-[10]">
                  <input
                    autoFocus
                    type="text"
                    placeholder="INPUT MANUAL NAMA GERAKAN..."
                    value={customExerciseText}
                    onChange={(e) => setCustomExerciseText(e.target.value)}
                    className="w-full bg-black border border-[#312C42] text-white text-xs p-3.5 outline-none font-mono uppercase font-bold"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 relative z-[50]">
                <div className="relative">
                  <span className="text-[8px] font-black text-[#EDEAF6]/40 uppercase tracking-widest mb-1.5 block">BEBAN (KG):</span>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'kg' ? null : 'kg')}
                    className="w-full bg-black border border-[#312C42] text-white font-bold text-xs p-3.5 flex items-center justify-between font-mono relative"
                  >
                    <span>{selectedKg} KG</span>
                    <ChevronDown size={14} className="text-[#7C5CFF]" />
                  </button>
                  {openDropdown === 'kg' && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-[#100E16] border border-[#7C5CFF] max-h-48 overflow-y-auto z-[100] flex flex-col shadow-2xl">
                      {GENERATED_RANGE.map(val => (
                        <button
                          key={`kg-${val}`}
                          type="button"
                          onClick={() => { setSelectedKg(val.toString()); setOpenDropdown(null); }}
                          className={`w-full text-left px-4 py-2.5 text-[10px] font-mono font-bold uppercase border-b border-[#211D2C] ${selectedKg === val.toString() ? 'bg-[#211D2C] text-[#7C5CFF]' : 'text-[#EDEAF6]/70 hover:bg-[#211D2C]'}`}
                        >
                          {val} KG
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <span className="text-[8px] font-black text-[#EDEAF6]/40 uppercase tracking-widest mb-1.5 block">REPETISI:</span>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'reps' ? null : 'reps')}
                    className="w-full bg-black border border-[#312C42] text-white font-bold text-xs p-3.5 flex items-center justify-between font-mono relative"
                  >
                    <span>{selectedReps} REPS</span>
                    <ChevronDown size={14} className="text-[#7C5CFF]" />
                  </button>
                  {openDropdown === 'reps' && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-[#100E16] border border-[#7C5CFF] max-h-48 overflow-y-auto z-[100] flex flex-col shadow-2xl">
                      {GENERATED_RANGE.map(val => (
                        <button
                          key={`rep-${val}`}
                          type="button"
                          onClick={() => { setSelectedReps(val.toString()); setOpenDropdown(null); }}
                          className={`w-full text-left px-4 py-2.5 text-[10px] font-mono font-bold uppercase border-b border-[#211D2C] ${selectedReps === val.toString() ? 'bg-[#211D2C] text-[#7C5CFF]' : 'text-[#EDEAF6]/70 hover:bg-[#211D2C]'}`}
                        >
                          {val} REPETISI
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2 relative z-10">
                <button type="button" onClick={() => { setIsAdding(false); setOpenDropdown(null); }} className="py-3 bg-transparent border border-[#312C42] text-[10px] font-black text-[#EDEAF6]/70 hover:text-white uppercase tracking-widest">
                  BATAL
                </button>
                <button type="submit" className="py-3 bg-[#211D2C] text-[#7C5CFF] text-[10px] font-black uppercase tracking-widest relative border border-[#312C42]">
                  SIMPAN
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-auto py-3.5 border border-dashed border-[#312C42] text-[#EDEAF6]/40 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-1.5 hover:bg-[#211D2C] hover:text-white transition-all active:scale-95 relative z-10"
            >
              <Plus size={14} /> TAMBAH BLOK GERAKAN
            </button>
          )}
        </div>
      </div>

      {/* MODAL OTORISASI KALENDER */}
      {showCalendarAppPrompt && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#312C42] w-full max-w-sm p-5 relative shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col gap-4 text-center font-mono">
            <CornerBrackets />
            
            <div className="w-12 h-12 bg-black border border-[#312C42] flex items-center justify-center mx-auto text-[#7C5CFF] relative">
              <DownloadCloud size={20} className="animate-pulse" />
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[#7C5CFF] font-black text-xs uppercase tracking-widest">[INTEGRASI CLOUD]</span>
              <span className="text-white font-bold text-sm uppercase">PILIH METODE SINKRONISASI</span>
            </div>
            
            <div className="text-[9px] text-[#EDEAF6]/60 leading-relaxed uppercase tracking-wide border-t border-b border-[#211D2C] py-3 text-left">
              <p>✦ HARI INI SAJA: Mengirim jadwal <span className="text-[#7C5CFF]">[{activeDay}]</span> ke 1 slot event Kalender.</p>
              <p className="mt-2">✦ FULL 1 MINGGU: Menyatukan seluruh jadwal <span className="text-[#7C5CFF]">[Senin s/d Minggu]</span> ke dalam 1 Catatan Event Kalender raksasa sekaligus.</p>
              <p className="mt-3 text-red-400 font-bold">PERHATIAN: WAJIB INSTALL GOOGLE CALENDAR UNTUK NOTIFIKASI OPTIMAL.</p>
            </div>
            
            <div className="flex flex-col gap-2 mt-1">
              <button 
                type="button" 
                onClick={() => executeCloudRouting('daily')} 
                className="w-full py-3 bg-[#14121C] text-[#EDEAF6] font-black text-[10px] uppercase border border-[#312C42] relative active:scale-95 transition-transform"
              >
                SINKRONISASI HARI INI SAJA
              </button>
              
              <button 
                type="button" 
                onClick={() => executeCloudRouting('weekly')} 
                className="w-full py-3 bg-[#211D2C] text-[#7C5CFF] font-black text-[10px] uppercase border border-[#312C42] relative active:scale-95 transition-transform"
              >
                SINKRONISASI FULL 1 MINGGU
              </button>
              
              <a 
                href="https://play.google.com/store/apps/details?id=com.google.android.calendar" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-3 mt-1 bg-[#7C5CFF] text-white font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg relative active:scale-95 transition-transform"
              >
                <DownloadCloud size={14} />
                DOWNLOAD DI PLAYSTORE
              </a>

              <button 
                type="button" 
                onClick={() => setShowCalendarAppPrompt(false)} 
                className="w-full py-3 text-[#EDEAF6]/40 text-[10px] font-bold uppercase mt-1 hover:text-white"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT DIALOG CUSTOM */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#100E16] border border-red-900/50 w-full max-w-xs p-5 relative text-center font-mono flex flex-col gap-4 shadow-2xl">
            <CornerBrackets />
            <span className="text-red-400 font-black text-xs tracking-widest">[SYSTEM WARNING]</span>
            <p className="text-[9px] text-[#EDEAF6]/70 leading-relaxed tracking-wide">{customAlert.message}</p>
            <button
              type="button"
              onClick={() => setCustomAlert({ isOpen: false, message: '' })}
              className="w-full py-3 bg-[#211D2C] text-white font-black text-xs uppercase relative active:scale-95 mt-1 border border-[#312C42]"
            >
              KONFIRMASI
            </button>
          </div>
        </div>
      )}

      {/* MODAL PANDUAN DOKUMEN SISTEM */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#312C42] w-full max-w-md relative flex flex-col max-h-[85vh]">
            <CornerBrackets />
            <div className="bg-[#14121C] border-b border-[#211D2C] p-4 flex justify-between items-center relative z-10">
              <span className="text-white font-display font-black text-xs uppercase tracking-widest">[DOKUMEN PANDUAN]</span>
              <button onClick={() => setShowGuideModal(false)} className="text-[#EDEAF6]/50 hover:text-white"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-4 border-b border-[#211D2C] bg-black/20 text-[9px] font-black uppercase tracking-wider text-center">
              <button onClick={() => setGuideTab('fullbody')} className={`py-3.5 border-r border-[#211D2C] ${guideTab === 'fullbody' ? 'text-[#7C5CFF] bg-[#211D2C]' : 'text-[#EDEAF6]/50'}`}>Full Body</button>
              <button onClick={() => setGuideTab('bulking')} className={`py-3.5 border-r border-[#211D2C] ${guideTab === 'bulking' ? 'text-[#7C5CFF] bg-[#211D2C]' : 'text-[#EDEAF6]/50'}`}>Bulking</button>
              <button onClick={() => setGuideTab('cutting')} className={`py-3.5 border-r border-[#211D2C] ${guideTab === 'cutting' ? 'text-[#7C5CFF] bg-[#211D2C]' : 'text-[#EDEAF6]/50'}`}>Cutting</button>
              <button onClick={() => setGuideTab('cal')} className={`py-3.5 ${guideTab === 'cal' ? 'text-[#7C5CFF] bg-[#211D2C]' : 'text-[#EDEAF6]/50'}`}>Kalori</button>
            </div>

            <div className="p-5 overflow-y-auto text-[10px] uppercase text-[#EDEAF6]/80 flex flex-col gap-4 leading-relaxed font-mono">
              {guideTab === 'fullbody' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold flex items-center gap-1">PROTOKOL 1 BULAN FULL BODY</div>
                  <div className="bg-black border border-[#312C42] p-3 flex flex-col gap-2 text-[#7C5CFF] relative">
                    <div>1. BARBELL SQUAT (3 SET X 8-10 REPS)</div>
                    <div>2. BENCH PRESS (3 SET X 8-10 REPS)</div>
                    <div>3. BARBELL ROW (3 SET X 8-10 REPS)</div>
                    <div>4. OVERHEAD PRESS (2 SET X 10 REPS)</div>
                  </div>
                  <p>Mekanisme Pemulihan: Berdasarkan riset ilmiah, otot besar membutuhkan waktu istirahat 48 jam penuh demi sintesis glikogen maksimal. Lakukan latihan hanya pada Senin, Rabu, Jumat.</p>
                </>
              )}
              {guideTab === 'bulking' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold flex items-center gap-1">PROTOKOL REKAYASA BULKING</div>
                  <div className="bg-black border border-[#312C42] p-3 flex flex-col gap-2 text-[#7C5CFF] relative">
                    <div>M1: COBA BEBAN DASAR (50KG X 10 REPS)</div>
                    <div>M2: NAIKKAN INTENSITAS (+2.5KG)</div>
                    <div>M3: JAGA BEBAN, NAIKKAN JADI 12 REPS</div>
                    <div>M4: DELOAD REDUKSI VOLUME</div>
                  </div>
                  <p>Asupan Nutrisi Mandat: Wajib surplus energi konstan sebanyak 300 hingga 500 kalori di atas ambang kebutuhan tubuh harian Anda.</p>
                </>
              )}
              {guideTab === 'cutting' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold flex items-center gap-1">PROTOKOL REDUKSI LEMAK (CUTTING)</div>
                  <div className="bg-black border border-[#312C42] p-3 flex flex-col gap-2 text-[#7C5CFF] relative">
                    <div>1. BENCH PRESS (PERTAHANKAN BEBAN)</div>
                    <div>2. LAT PULLDOWN (JAGA INTENSITAS)</div>
                    <div>3. HIIIT CARDIO (15 MENIT DI AKHIR SESI)</div>
                  </div>
                  <p>Strategi Defisit: Pangkas suplai kalori hingga menyentuh ambang batas defisit 500 kalori di bawah TDEE harian.</p>
                </>
              )}
              {guideTab === 'cal' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold flex items-center gap-1">FORMULA KALORI & MANAJEMEN TIDUR</div>
                  <p className="bg-black p-3 border border-[#312C42] relative text-white text-[9px]">
                    PRIA = (10 X BERAT KG) + (6.25 X TINGGI CM) - (5 X UMUR) + 5
                  </p>
                  <p>Target Protein Utama: Konsumsi makro protein murni minimal 1.6g hingga 2.2g per kilogram berat badan.</p>
                  <p>Pola Istirahat: Tidur lelap selama 7 hingga 9 jam dalam kegelapan total untuk regenerasi hormonal.</p>
                </>
              )}
            </div>

            <div className="p-4 bg-black/40 border-t border-[#211D2C] relative z-10">
              <button onClick={() => setShowGuideModal(false)} className="w-full py-3 bg-[#211D2C] text-[10px] font-black text-white tracking-widest uppercase active:scale-95 relative border border-[#312C42]">
                TUTUP DOKUMEN
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

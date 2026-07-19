import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Plus, Trash2, ChevronDown, BookOpen, X, 
  DownloadCloud, Target, Shield, HardDrive, Flame, Zap, Trophy, TrendingUp, Dumbbell 
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

// ---- DESIGN TOKENS CLAUDE RECAP ----
const C = {
  bg: "#08060F",
  panel: "#15121F",
  panel2: "#1B1729",
  border: "#332C52",
  border2: "#241F3A",
  violet: "#8B7EF0",
  violetSoft: "#5D53A8",
  teal: "#3FE6C4",
  text: "#EFEDFA",
  dim: "#7E7AA0",
  dim2: "#4E4A70",
  rankS: "#9B8CFF",
  rankA: "#3FE6C4",
  rankB: "#EFEDFA",
  rankC: "#9C99B8",
  rankD: "#6E6B8F",
};

const RANK_COLOR = {
  S: C.rankS,
  A: C.rankA,
  B: C.rankB,
  C: C.rankC,
  D: C.rankD,
  rest: C.dim2,
};

const DEFAULT_WEEK = [
  { label: "Sen", rank: "rest", exp: 0 },
  { label: "Sel", rank: "B", exp: 60 },
  { label: "Rab", rank: "S", exp: 95 },
  { label: "Kam", rank: "rest", exp: 0 },
  { label: "Jum", rank: "A", exp: 80 },
  { label: "Sab", rank: "S", exp: 105 },
  { label: "Min", rank: "rest", exp: 0 },
];

const DEFAULT_WEEK_DETAIL = {
  2: {
    dayLabel: "Rabu · Day #24",
    category: "Push",
    rank: "S",
    durationMin: 58,
    exp: 95,
    exercises: [
      { name: "Bench Press", sets: "4×8 @70kg", pr: true },
      { name: "Overhead Press", sets: "3×10 @40kg", pr: false },
      { name: "Incline DB Press", sets: "3×12 @24kg", pr: false },
      { name: "Triceps Pushdown", sets: "3×15 @35kg", pr: false },
    ],
  },
};

const DEFAULT_MONTH_CELLS = [
  "rest", "B", "S", "rest", "A", "A", "rest",
  "B", "A", "S", "rest", "B", "S", "rest",
  "rest", "A", "B", "B", "A", "S", "rest",
  "B", "A", "", "rest", "", "", "",
  "future", "future", "future",
];

const RANK_DIST = { S: 15, A: 1, B: 1, C: 1, D: 3 };

// ---- CLAUDE UI HELPERS ----
function BracketFrame({ children, style }) {
  const corner = { position: "absolute", width: 14, height: 14 };
  return (
    <div style={{ position: "relative", ...style }}>
      <div style={{ ...corner, top: 0, left: 0, borderTop: `2px solid ${C.violet}`, borderLeft: `2px solid ${C.violet}`, opacity: 0.8 }} />
      <div style={{ ...corner, top: 0, right: 0, borderTop: `2px solid ${C.teal}`, borderRight: `2px solid ${C.teal}`, opacity: 0.8 }} />
      <div style={{ ...corner, bottom: 0, left: 0, borderBottom: `2px solid ${C.teal}`, borderLeft: `2px solid ${C.teal}`, opacity: 0.8 }} />
      <div style={{ ...corner, bottom: 0, right: 0, borderBottom: `2px solid ${C.violet}`, borderRight: `2px solid ${C.violet}`, opacity: 0.8 }} />
      {children}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl p-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
      <div className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: "0.08em", color: C.dim }}>{label}</div>
      <div className="font-mono font-bold mt-1" style={{ fontSize: 19, color: color || C.text }}>{value}</div>
    </div>
  );
}

function RankBadge({ rank, size = 26 }) {
  const color = RANK_COLOR[rank] || C.dim2;
  const isRest = rank === "rest" || !rank;
  return (
    <div className="flex items-center justify-center rounded-md font-mono font-extrabold" style={{ width: size, height: size, fontSize: size * 0.44, color: isRest ? C.dim2 : color, background: isRest ? "transparent" : `${color}26`, border: isRest ? `1px dashed ${C.dim2}` : `1px solid ${color}` }}>
      {isRest ? "–" : rank}
    </div>
  );
}

function RankDistribution({ dist }) {
  return (
    <div className="flex justify-between rounded-xl p-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
      {Object.entries(dist).map(([rank, count]) => (
        <div key={rank} className="text-center flex-1">
          <div className="font-mono font-bold" style={{ fontSize: 12, color: RANK_COLOR[rank] }}>{rank}</div>
          <div className="font-mono mt-1" style={{ fontSize: 13, color: C.text }}>{count}</div>
        </div>
      ))}
    </div>
  );
}

function BarChart({ values, labels, peakIndex }) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: 88 }}>
        {values.map((v, i) => (
          <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max((v / max) * 100, 4)}%`, background: i === peakIndex ? `linear-gradient(180deg, ${C.teal}, #1F8F7C)` : `linear-gradient(180deg, ${C.violet}, ${C.violetSoft})` }} />
        ))}
      </div>
      <div className="flex gap-2 mt-1.5">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center font-mono" style={{ fontSize: 8, color: C.dim }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function DailyDetail({ detail }) {
  if (!detail) {
    return (
      <div className="rounded-2xl p-4 text-center font-mono" style={{ background: C.panel2, border: `1px solid ${C.border}`, fontSize: 11, color: C.dim }}>
        Belum ada sesi di hari ini.
      </div>
    );
  }
  return (
    <BracketFrame style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 14px 14px" }}>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-mono m-0" style={{ fontSize: 16, color: C.text }}>{detail.dayLabel}</h3>
        <span className="font-mono uppercase font-bold rounded-full" style={{ fontSize: 9, padding: "3px 8px", background: C.teal, color: C.bg }}>Rank {detail.rank}</span>
      </div>
      <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
        {detail.exercises.map((ex, i) => (
          <li key={i} className="flex items-center justify-between rounded-lg px-2.5 py-2" style={{ background: C.panel, border: `1px solid ${C.border2}` }}>
            <span className="font-semibold" style={{ fontSize: 11.5, color: C.text }}>{ex.name}</span>
            <span className="font-mono" style={{ fontSize: 10.5, color: C.dim }}>{ex.sets}{ex.pr && <span className="font-mono ml-1.5" style={{ fontSize: 9, color: C.teal }}>PR</span>}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between mt-3 pt-2.5 font-mono" style={{ borderTop: `1px dashed ${C.border2}`, fontSize: 9.5, color: C.dim }}>
        <div>Durasi <b style={{ color: C.text, fontSize: 12.5 }}>{detail.durationMin} mnt</b></div>
        <div>EXP <b style={{ color: C.text, fontSize: 12.5 }}>+{detail.exp}</b></div>
        <div>Kategori <b style={{ color: C.text, fontSize: 12.5 }}>{detail.category}</b></div>
      </div>
    </BracketFrame>
  );
}

function MonthHeatmap({ cells }) {
  const weekdays = ["S", "S", "R", "K", "J", "S", "M"];
  return (
    <BracketFrame style={{ background: "linear-gradient(180deg, rgba(139,126,240,0.05), transparent)", borderRadius: 12, padding: "16px 14px 14px" }}>
      <div className="flex items-center justify-between font-mono uppercase mb-3" style={{ fontSize: 10.5, letterSpacing: "0.1em", color: C.dim }}>
        <span>Kalender Rank</span><b style={{ color: C.teal, fontWeight: 600 }}>Bulan Ini</b>
      </div>
      <div className="grid grid-cols-7 mb-1.5">
        {weekdays.map((d, i) => <span key={i} className="text-center font-mono" style={{ fontSize: 8, color: C.dim }}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((rank, i) => {
          if (rank === "future") return <div key={i} style={{ aspectRatio: "1", borderRadius: 5, border: `1px dashed #221E38` }} />;
          if (rank === "rest" || rank === "") return <div key={i} style={{ aspectRatio: "1", borderRadius: 5, border: rank === "rest" ? `1px dashed ${C.dim2}` : "none", background: rank === "" ? "#1C1830" : "transparent" }} />;
          return <div key={i} style={{ aspectRatio: "1", borderRadius: 5, background: RANK_COLOR[rank] }} />;
        })}
      </div>
    </BracketFrame>
  );
}

// ---- CUSTOM MANHWA CORNERS UNTUK ELEMEN LAIN ----
const CornerBrackets = () => (
  <>
    <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF] pointer-events-none z-10" />
  </>
);

// ==========================================
// MAIN COMPONENT EXPORT
// ==========================================
export default function JadwalLatihan({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState('fullbody');
  
  const [showCalendarAppPrompt, setShowCalendarAppPrompt] = useState(false);
  const [customAlert, setCustomAlert] = useState({ isOpen: false, message: '' });

  // Recap & Schedule States
  const [view, setView] = useState("week"); // "week" | "month"
  const [selectedDayRecap, setSelectedDayRecap] = useState(2);
  
  const [schedule, setSchedule] = useState(() => {
    return DAYS.reduce((acc, day) => ({ 
      ...acc, 
      [day]: { focus: 'Chest', items: [] } 
    }), {});
  });
  
  const [activeDay, setActiveDay] = useState('Senin');
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
      } catch (e) {
        console.error(e);
      }
    }
    const timer = setTimeout(() => setIsLoading(false), 400);

    const handlePopState = (e) => {
      e.preventDefault();
      onBack();
    };
    
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBack]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('dg_workout_schedule', JSON.stringify(schedule));
    }
  }, [schedule, isLoading]);

  const handleSetData = (type, id) => {
    setSchedule(prev => ({
      ...prev,
      [activeDay]: { ...prev[activeDay], [type]: id }
    }));
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

    let title = '';
    let details = '';

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
        <div className="bg-[#100E16] border border-[#211D2C] p-4 h-16 rounded-none" />
        <div className="bg-[#100E16] border border-[#211D2C] p-4 h-24 rounded-none" />
      </div>
    );
  }

  const currentDayData = schedule[activeDay] || { focus: 'Chest', items: [] };
  
  // Data for Claude's Recap
  const weekBarValues = DEFAULT_WEEK.map((d) => d.exp);
  const weekPeak = weekBarValues.indexOf(Math.max(...weekBarValues));
  const streak = 19;
  const weekExp = 340;
  const totalExp = 1670;
  const level = 12;
  const dayNumber = 24;

  return (
    <div className="flex flex-col gap-5 font-mono animate-in fade-in duration-200 mt-2 mx-2 sm:mx-4 select-none pb-32" onContextMenu={(e) => e.preventDefault()}>
      
      {/* 1. HEADER NAVIGASI SYSTEM */}
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

      {/* 2. CLOUD ALARM CONTROL CARD */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 shadow-lg relative flex flex-col gap-2">
        <CornerBrackets />
        <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
          [INTEGRASI ALARM KALENDER HP]
        </span>
        <p className="text-[9px] text-[#EDEAF6]/50 uppercase leading-relaxed tracking-wide">
          Atur jadwal alarm olahraga Anda. Pilih untuk sinkronisasi per hari atau kirim seluruh jadwal mingguan sekaligus.
        </p>
        <button
          type="button"
          onClick={() => setShowCalendarAppPrompt(true)}
          className="w-full mt-1 py-3 bg-[#211D2C] text-[#7C5CFF] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 relative border border-[#312C42]"
        >
          <CornerBrackets />
          <HardDrive size={13} /> HUBUNGKAN KE KALENDER
        </button>
      </div>

      {/* 3. CLAUDE RECAP SYSTEM (MENGGANTIKAN ARSENAL) */}
      <div className="w-full mx-auto rounded-3xl overflow-hidden font-sans pb-4" style={{ background: C.bg, border: "1px solid #211D33", boxShadow: "0 30px 70px -20px rgba(0,0,0,0.8)" }}>
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1.5 font-mono uppercase" style={{ fontSize: 10, letterSpacing: "0.16em", color: C.teal }}>
            <Target size={12} />
            Modul Rekap
          </div>
          <h2 className="font-mono m-0 mt-1" style={{ fontSize: 19, color: C.text }}>
            {view === "week" ? "Rekap Mingguan" : "Rekap Bulanan"}
          </h2>
        </div>

        <div className="flex gap-1.5 px-4 mt-3">
          {["week", "month"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="font-mono rounded-lg px-2.5 py-1.5"
              style={{
                fontSize: 9.5, letterSpacing: "0.04em",
                border: `1px solid ${view === v ? C.violet : C.border}`,
                background: view === v ? C.violet : "transparent",
                color: view === v ? C.bg : C.dim,
                fontWeight: view === v ? 700 : 400,
              }}
            >
              {v === "week" ? "Minggu Ini" : "Bulan Ini"}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mx-4 mt-3.5 rounded-2xl px-3.5 py-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 font-mono font-bold" style={{ fontSize: 15, color: "#FF9A4D" }}>
              <Flame size={14} />
              {view === "week" ? streak : `${Math.round(streak / 7)}mgu`}
            </div>
            <div className="font-mono uppercase mt-0.5" style={{ fontSize: 8, color: C.dim, letterSpacing: "0.08em" }}>Streak</div>
          </div>
          <div style={{ width: 1, height: 26, background: C.border }} />
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 font-mono font-bold" style={{ fontSize: 15, color: C.teal }}>
              <Zap size={14} />
              {view === "week" ? weekExp : totalExp}
            </div>
            <div className="font-mono uppercase mt-0.5" style={{ fontSize: 8, color: C.dim, letterSpacing: "0.08em" }}>{view === "week" ? "EXP Minggu Ini" : "Total EXP"}</div>
          </div>
          <div style={{ width: 1, height: 26, background: C.border }} />
          <div className="text-center flex-1">
            <div className="font-mono font-bold" style={{ fontSize: 15, color: C.text }}>
              {view === "week" ? `#${dayNumber}` : `LVL ${level}`}
            </div>
            <div className="font-mono uppercase mt-0.5" style={{ fontSize: 8, color: C.dim, letterSpacing: "0.08em" }}>{view === "week" ? "Day" : "Level"}</div>
          </div>
        </div>

        {view === "week" ? (
          <>
            <div className="flex justify-between gap-1.5 mx-4 mt-3 mb-1">
              {DEFAULT_WEEK.map((d, i) => (
                <button key={i} onClick={() => setSelectedDayRecap(i)} className="flex-1 flex flex-col items-center gap-1.5 rounded-lg py-2" style={{ background: selectedDayRecap === i ? "rgba(139,126,240,0.12)" : "transparent" }}>
                  <RankBadge rank={d.rank} />
                  <span className="font-mono uppercase" style={{ fontSize: 9, color: selectedDayRecap === i ? C.violet : C.dim }}>{d.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5 mx-4 mt-2">
              <StatCard label="Sessions" value={DEFAULT_WEEK.filter((d) => d.rank !== "rest").length} color={C.violet} />
              <StatCard label="Total EXP" value={weekExp} color={C.teal} />
              <StatCard label="Best Rank" value="S" color={C.rankS} />
              <StatCard label="Top Category" value="Push" />
            </div>
            <div className="mx-4 mt-2.5">
              <RankDistribution dist={RANK_DIST} />
            </div>
            <div className="mx-4 mt-3.5">
              <BracketFrame style={{ borderRadius: 12, padding: "16px 14px 14px", background: "linear-gradient(180deg, rgba(139,126,240,0.05), transparent)" }}>
                <div className="flex items-center justify-between font-mono uppercase mb-3" style={{ fontSize: 10.5, letterSpacing: "0.1em", color: C.dim }}>
                  <span className="flex items-center gap-1.5"><TrendingUp size={12} />Grafik EXP Harian</span>
                  <b style={{ color: C.teal, fontWeight: 600 }}>+{weekExp} XP</b>
                </div>
                <BarChart values={weekBarValues} labels={DEFAULT_WEEK.map((d) => d.label[0])} peakIndex={weekPeak} />
              </BracketFrame>
            </div>
            <div className="mx-4 mt-3.5">
              <DailyDetail detail={DEFAULT_WEEK_DETAIL[selectedDayRecap]} />
            </div>
          </>
        ) : (
          <>
            <div className="mx-4 mt-3.5">
              <MonthHeatmap cells={DEFAULT_MONTH_CELLS} />
            </div>
            <div className="grid grid-cols-2 gap-2.5 mx-4 mt-3.5">
              <StatCard label="Total Sessions" value={18} color={C.violet} />
              <StatCard label="Total EXP" value={totalExp} color={C.teal} />
              <StatCard label="Best Rank" value="S" color={C.rankS} />
              <StatCard label="Top Category" value="Push" />
            </div>
            <div className="mx-4 mt-2.5">
              <RankDistribution dist={RANK_DIST} />
            </div>
            <div className="mx-4 mt-3.5">
              <BracketFrame style={{ borderRadius: 12, padding: "16px 14px 14px", background: "linear-gradient(180deg, rgba(139,126,240,0.05), transparent)" }}>
                <div className="flex items-center justify-between font-mono uppercase mb-3" style={{ fontSize: 10.5, letterSpacing: "0.1em", color: C.dim }}>
                  <span className="flex items-center gap-1.5"><TrendingUp size={12} />EXP per Minggu</span>
                  <b style={{ color: C.teal, fontWeight: 600 }}>4 minggu</b>
                </div>
                <BarChart values={[55, 75, 100, 40]} labels={["Mgu 1", "Mgu 2", "Mgu 3", "Mgu 4"]} peakIndex={2} />
              </BracketFrame>
            </div>
            <div className="mx-4 mt-3.5 mb-1">
              <BracketFrame style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 14px 14px" }}>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-mono m-0 flex items-center gap-1.5" style={{ fontSize: 16, color: C.text }}><Trophy size={14} style={{ color: C.teal }} />Pencapaian Bulan Ini</h3>
                  <span className="font-mono uppercase font-bold rounded-full" style={{ fontSize: 9, padding: "3px 8px", background: C.teal, color: C.bg }}>4/10 Badge</span>
                </div>
                <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
                  {[
                    { name: "Squat 1RM", sets: "90 → 100kg", pr: true },
                    { name: "Deadlift 1RM", sets: "120 → 130kg", pr: true },
                    { name: "Sesi terpanjang", sets: "1j 24mnt", pr: false },
                    { name: "Title unlocked", sets: "Legendary Performer", pr: false },
                  ].map((ex, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg px-2.5 py-2" style={{ background: C.panel, border: `1px solid ${C.border2}` }}>
                      <span className="font-semibold" style={{ fontSize: 11.5, color: C.text }}>{ex.name}</span>
                      <span className="font-mono" style={{ fontSize: 10.5, color: C.dim }}>{ex.sets}{ex.pr && <span className="font-mono ml-1.5" style={{ fontSize: 9, color: C.teal }}>PR</span>}</span>
                    </li>
                  ))}
                </ul>
              </BracketFrame>
            </div>
          </>
        )}
      </div>

      {/* 4. TABS HARI */}
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
              {isActive && <CornerBrackets />}
              {day}
              {hasItems && <span className={`w-1.5 h-1.5 ${isActive ? 'bg-[#7C5CFF]' : 'bg-[#312C42]'}`} />}
            </button>
          )
        })}
      </div>

      {/* 5. MATRIKS KATEGORI ANATOMI OTOT SAJA (ARSENAL DIHAPUS) */}
      <div className="flex flex-col gap-2 bg-[#100E16] border border-[#211D2C] p-3 relative">
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
                {isTarget && <CornerBrackets />}
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

      {/* 6. PANEL DAFTAR AKTIVITAS (Form & List) */}
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
                <CornerBrackets />
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
                  <CornerBrackets />
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
                  <CornerBrackets />
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
                    <CornerBrackets />
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
                    <CornerBrackets />
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
                <button type="button" onClick={() => { setIsAdding(false); setOpenDropdown(null); }} className="py-3 bg-transparent border border-[#312C42] text-xs font-black text-[#EDEAF6]/70 hover:text-white uppercase">
                  BATAL
                </button>
                <button type="submit" className="py-3 bg-[#211D2C] text-[#7C5CFF] text-xs font-black uppercase relative border border-[#312C42]">
                  <CornerBrackets /> SIMPAN
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

      {/* 7. MODAL OTORISASI KALENDER (TOMBOL DOWNLOAD DIUBAH KE LINK A-TAG) */}
      {showCalendarAppPrompt && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#312C42] w-full max-w-sm p-5 relative shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col gap-4 text-center font-mono">
            <CornerBrackets />
            
            <div className="w-12 h-12 bg-black border border-[#312C42] flex items-center justify-center mx-auto text-[#7C5CFF] relative">
              <CornerBrackets />
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
                <CornerBrackets /> SINKRONISASI HARI INI SAJA
              </button>
              
              <button 
                type="button" 
                onClick={() => executeCloudRouting('weekly')} 
                className="w-full py-3 bg-[#211D2C] text-[#7C5CFF] font-black text-[10px] uppercase border border-[#312C42] relative active:scale-95 transition-transform"
              >
                <CornerBrackets /> SINKRONISASI FULL 1 MINGGU
              </button>
              
              <a 
                href="https://play.google.com/store/apps/details?id=com.google.android.calendar" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-3 mt-1 bg-[#7C5CFF] text-white font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg relative active:scale-95 transition-transform"
              >
                <DownloadCloud size={16} />
                DOWNLOAD DI PLAYSTORE
              </a>

              <button 
                type="button" 
                onClick={() => setShowCalendarAppPrompt(false)} 
                className="w-full py-3 text-[#EDEAF6]/40 text-xs font-bold uppercase mt-1 hover:text-white"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ALERT DIALOG CUSTOM */}
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
              <CornerBrackets /> KONFIRMASI
            </button>
          </div>
        </div>
      )}

      {/* 9. MODAL PANDUAN DOKUMEN SISTEM */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#312C42] w-full max-w-md relative flex flex-col max-h-[85vh]">
            <CornerBrackets />
            <div className="bg-[#14121C] border-b border-[#211D2C] p-4 flex justify-between items-center relative z-10">
              <span className="text-white font-display font-black text-xs uppercase tracking-widest">[DOKUMEN PANDUAN]</span>
              <button onClick={() => setShowGuideModal(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
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
                    <CornerBrackets />
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
                    <CornerBrackets />
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
                    <CornerBrackets />
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
                    <CornerBrackets />
                    PRIA = (10 X BERAT KG) + (6.25 X TINGGI CM) - (5 X UMUR) + 5
                  </p>
                  <p>Target Protein Utama: Konsumsi makro protein murni minimal 1.6g hingga 2.2g per kilogram berat badan.</p>
                  <p>Pola Istirahat: Tidur lelap selama 7 hingga 9 jam dalam kegelapan total untuk regenerasi hormonal.</p>
                </>
              )}
            </div>

            <div className="p-4 bg-black/40 border-t border-[#211D2C] relative z-10">
              <button onClick={() => setShowGuideModal(false)} className="w-full py-3 bg-[#211D2C] text-xs font-black text-white uppercase active:scale-95 relative border border-[#312C42]">
                <CornerBrackets /> TUTUP DOKUMEN
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

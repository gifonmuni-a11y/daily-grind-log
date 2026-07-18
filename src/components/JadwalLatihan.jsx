import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronDown, BookOpen, X, Play, DownloadCloud, Target, Shield, Activity, HardDrive } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const GENERATED_RANGE = Array.from({ length: 100 }, (_, i) => i + 1);

const EXERCISE_DATABASE = [
  'Barbell Bench Press', 'Dumbbell Incline Press', 'Chest Fly Machine', 'Cable Crossover',
  'Weighted Pull Up', 'Barbell Bent Over Row', 'Seated Cable Row', 'Lat Pulldown',
  'Overhead Barbell Press', 'Dumbbell Lateral Raise', 'Cable Face Pull',
  'Barbell Bicep Curl', 'Tricep Overhead Extension', 'Cable Tricep Pushdown',
  'Barbell Back Squat', 'Leg Press Machine', 'Bulgarian Split Squat', 'Dumbbell Lunge',
  'Romanian Deadlift', 'Lying Leg Curl Machine', 'Seated Leg Extension', 'Standing Calf Raise',
  'Hanging Leg Raise', 'Cable Crunch', 'Ab Wheel Rollout',
  'Treadmill Interval Sprint', 'Rowing Machine', 'Stationary Bike',
  'Latihan Kustom'
];

// DATA TERIALISASI: TERPISAH ANATOMI & ALAT
const ANATOMY_AREAS = [
  { id: 'Chest', name: 'DADA / PUSH', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80' },
  { id: 'Back', name: 'PUNGGUNG / PULL', img: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=80' },
  { id: 'Shoulders', name: 'BAHU / DELTOID', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=400&q=80' },
  { id: 'Arms', name: 'LENGAN / ARMS', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80' },
  { id: 'Legs', name: 'PAHA / QUADS', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80' },
  { id: 'Core', name: 'PERUT / CORE', img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=400&q=80' }
];

const EQUIPMENT_AREAS = [
  { id: 'Barbell', name: 'BARBELL RIG', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80' },
  { id: 'Dumbbell', name: 'DUMBBELL ZONE', img: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=400&q=80' },
  { id: 'Machine', name: 'MACHINE RIG', img: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=400&q=80' },
  { id: 'Calisthenics', name: 'BODYWEIGHT', img: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=400&q=80' },
  { id: 'Cardio', name: 'CARDIO STATION', img: 'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?auto=format&fit=crop&w=400&q=80' },
  { id: 'Hybrid', name: 'HYBRID SYSTEM', img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?auto=format&fit=crop&w=400&q=80' }
];

// Komponen Visual Sudut (Manhwa System Corner Brackets)
const CornerBrackets = () => (
  <>
    <div className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t-2 border-l-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -top-[1px] -right-[1px] w-2.5 h-2.5 border-t-2 border-r-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -bottom-[1px] -left-[1px] w-2.5 h-2.5 border-b-2 border-l-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b-2 border-r-2 border-[#7C5CFF] pointer-events-none z-10" />
  </>
);

export default function JadwalLatihan({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState('fullbody');
  
  // States Modal Kalender
  const [showCalendarAppPrompt, setShowCalendarAppPrompt] = useState(false);

  const [schedule, setSchedule] = useState(() => {
    return DAYS.reduce((acc, day) => ({ 
      ...acc, 
      [day]: { focus: 'FullBody', equip: 'Hybrid', items: [] } 
    }), {});
  });
  
  const [activeDay, setActiveDay] = useState('Senin');
  const [isAdding, setIsAdding] = useState(false);
  
  // Custom Dropdown States (NO NATIVE SELECT)
  const [openDropdown, setOpenDropdown] = useState(null); // 'exercise', 'kg', 'reps', null
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
            normalized[day] = { focus: 'Chest', equip: 'Barbell', items: [] };
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

  // LOGIC AUTO-REKAP (Membaca Kg & Reps dari teks)
  const recapData = useMemo(() => {
    let totalWeeklyVolume = 0;
    let totalItems = 0;

    DAYS.forEach(day => {
      schedule[day].items.forEach(item => {
        totalItems += 1;
        const match = item.text.match(/(\d+)\s*KG\s*X\s*(\d+)\s*REPS/i);
        if (match) {
          const kg = parseInt(match[1], 10);
          const reps = parseInt(match[2], 10);
          totalWeeklyVolume += (kg * reps);
        }
      });
    });

    return {
      items: totalItems,
      weekly: totalWeeklyVolume,
      monthly: totalWeeklyVolume * 4
    };
  }, [schedule]);

  const handleSetData = (type, id) => {
    setSchedule(prev => ({
      ...prev,
      [activeDay]: { ...prev[activeDay], [type]: id }
    }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const coreName = selectedExercise === 'Latihan Kustom' ? customExerciseText.trim() : selectedExercise;
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

  const executeCloudRouting = () => {
    setShowCalendarAppPrompt(false);
    const dayData = schedule[activeDay];
    if (dayData.items.length === 0) return;

    const title = encodeURIComponent(`[GRIND LOG] HARI LATIHAN`);
    const details = encodeURIComponent(dayData.items.map((it, idx) => `${idx + 1}. ${it.text}`).join('\n'));
    
    // Direct Intent Web Cal
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

  const currentDayData = schedule[activeDay] || { focus: 'Chest', equip: 'Barbell', items: [] };

  return (
    <div className="flex flex-col gap-5 font-mono animate-in fade-in duration-200 mt-2 mx-4 select-none pb-32" onContextMenu={(e) => e.preventDefault()}>
      
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
          className="flex items-center gap-1.5 px-3 py-2 bg-[#211D2C] border border-[#312C42] text-[#A28EFF] text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all relative"
        >
          <BookOpen size={12} /> PANDUAN
        </button>
      </div>

      {/* CLOUD ALARM CONTROL CARD */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 shadow-lg relative flex flex-col gap-2">
        <CornerBrackets />
        <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
          [INTEGRASI ALARM KALENDER HP]
        </span>
        <p className="text-[9px] text-[#EDEAF6]/50 uppercase leading-relaxed tracking-wide">
          Sistem akan mengirimkan jadwal hari {activeDay} ke aplikasi Kalender bawaan perangkat sebagai rutinitas berulang mingguan.
        </p>
        <button
          type="button"
          onClick={() => setShowCalendarAppPrompt(true)}
          className="w-full mt-1 py-3 bg-[#7C5CFF] text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(124,92,255,0.2)] flex items-center justify-center gap-1.5 relative border border-[#9E85FF]"
        >
          <HardDrive size={13} /> HUBUNGKAN KE KALENDER
        </button>
      </div>

      {/* AUTO-REKAP PROGRESS SYSTEM */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 shadow-lg relative flex flex-col gap-3">
        <CornerBrackets />
        <span className="text-[10px] text-[#7C5CFF] font-bold uppercase tracking-wider border-b border-[#211D2C] pb-2">
          [REKAPITULASI PROYEKSI VOLUME LATIHAN]
        </span>
        
        {recapData.items === 0 ? (
          <div className="text-[10px] text-[#EDEAF6]/40 text-center py-2 uppercase font-bold tracking-widest">
            TIDAK ADA PROGRESS TERDETEKSI
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col bg-black/40 border border-[#211D2C] p-2.5 relative">
              <CornerBrackets />
              <span className="text-[8px] text-[#EDEAF6]/50 uppercase font-bold">TOTAL VOLUME / MINGGU</span>
              <span className="text-sm font-black text-white">{recapData.weekly.toLocaleString()} <span className="text-[9px] text-[#7C5CFF]">KG</span></span>
            </div>
            <div className="flex flex-col bg-[#7C5CFF]/10 border border-[#7C5CFF]/30 p-2.5 relative">
              <CornerBrackets />
              <span className="text-[8px] text-[#7C5CFF] uppercase font-bold">PROYEKSI / BULAN</span>
              <span className="text-sm font-black text-[#7C5CFF]">{recapData.monthly.toLocaleString()} <span className="text-[9px] text-white">KG</span></span>
            </div>
          </div>
        )}
      </div>

      {/* TABS HARI */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {DAYS.map(day => {
          const isActive = activeDay === day;
          const hasItems = (schedule[day]?.items?.length || 0) > 0;
          return (
            <button
              key={day}
              onClick={() => { setActiveDay(day); setIsAdding(false); setOpenDropdown(null); }}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider transition-all relative flex-shrink-0 flex items-center gap-2 border ${
                isActive 
                  ? 'bg-[#7C5CFF] text-white border-[#9E85FF] shadow-[0_0_10px_rgba(124,92,255,0.4)]' 
                  : 'bg-[#100E16] border-[#211D2C] text-[#EDEAF6]/40 hover:bg-[#211D2C]'
              }`}
            >
              {isActive && <CornerBrackets />}
              {day}
              {hasItems && <span className={`w-1.5 h-1.5 ${isActive ? 'bg-white' : 'bg-[#7C5CFF]'}`} />}
            </button>
          )
        })}
      </div>

      {/* MATRIKS GAMBAR KATEGORI */}
      <div className="flex flex-col gap-4">
        {/* SECTION 1: ANATOMI OTOT */}
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
                  className={`group h-16 relative overflow-hidden text-left font-mono border transition-all duration-200 ${isTarget ? 'border-[#7C5CFF] shadow-[0_0_10px_rgba(124,92,255,0.2)]' : 'border-[#211D2C] opacity-40 hover:opacity-75'}`}
                >
                  {isTarget && <CornerBrackets />}
                  <img src={area.img} alt={area.name} className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0" loading="lazy" />
                  <div className={`absolute inset-0 transition-opacity duration-300 ${isTarget ? 'bg-gradient-to-r from-[#0A0A0E] via-[#0A0A0E]/80 to-transparent' : 'bg-black/80'}`} />
                  <div className="absolute inset-y-0 left-2 flex flex-col justify-center">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isTarget ? 'text-white' : 'text-[#EDEAF6]/50'}`}>{area.name}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* SECTION 2: PERALATAN ALAT GYM */}
        <div className="flex flex-col gap-2 bg-[#100E16] border border-[#211D2C] p-3 relative">
          <CornerBrackets />
          <span className="text-[9px] uppercase font-bold text-[#7C5CFF] tracking-widest flex items-center gap-1 border-b border-[#211D2C] pb-2">
            <Shield size={10} /> [ARSENAL PERALATAN GYM]
          </span>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {EQUIPMENT_AREAS.map(area => {
              const isTarget = currentDayData.equip === area.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleSetData('equip', area.id)}
                  className={`group h-16 relative overflow-hidden text-left font-mono border transition-all duration-200 ${isTarget ? 'border-[#7C5CFF] shadow-[0_0_10px_rgba(124,92,255,0.2)]' : 'border-[#211D2C] opacity-40 hover:opacity-75'}`}
                >
                  {isTarget && <CornerBrackets />}
                  <img src={area.img} alt={area.name} className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0" loading="lazy" />
                  <div className={`absolute inset-0 transition-opacity duration-300 ${isTarget ? 'bg-gradient-to-r from-[#0A0A0E] via-[#0A0A0E]/80 to-transparent' : 'bg-black/80'}`} />
                  <div className="absolute inset-y-0 left-2 flex flex-col justify-center">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isTarget ? 'text-white' : 'text-[#EDEAF6]/50'}`}>{area.name}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* PANEL TARGET AKTIVITAS - HILANGKAN OVERFLOW HIDDEN BIAR DROPDOWN BISA KELUAR */}
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
              <div key={item.id} className="flex items-center justify-between p-3 bg-black/40 border border-[#211D2C] relative hover:border-[#7C5CFF]/50 transition-colors">
                <CornerBrackets />
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[#7C5CFF] text-[10px] font-black">#{idx + 1}</span>
                  <span className="text-[#EDEAF6] text-xs font-bold uppercase tracking-wide truncate">{item.text}</span>
                </div>
                <button type="button" onClick={() => handleDeleteItem(activeDay, item.id)} className="text-[#EDEAF6]/20 hover:text-red-400 p-1.5 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}

          {/* DYNAMIC FORM ROW INPUT DENGAN CUSTOM UI DROPDOWN */}
          {isAdding ? (
            <form onSubmit={handleAddItem} className="mt-auto pt-4 flex flex-col gap-4 border-t border-[#211D2C] relative z-20">
              
              {/* Dropdown 1: Jenis Gerakan */}
              <div className="relative">
                <span className="text-[8px] font-black text-[#EDEAF6]/40 uppercase tracking-widest mb-1.5 block">KATEGORI GERAKAN:</span>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'exercise' ? null : 'exercise')}
                  className="w-full bg-black border border-[#7C5CFF] text-white text-xs p-3.5 flex items-center justify-between text-left font-mono relative"
                >
                  <CornerBrackets />
                  <span className="font-bold uppercase text-[#EDEAF6] truncate pr-4">{selectedExercise || 'PILIH PROTOKOL GERAKAN...'}</span>
                  <ChevronDown size={14} className="text-[#7C5CFF] flex-shrink-0" />
                </button>

                {openDropdown === 'exercise' && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-[#100E16] border border-[#7C5CFF] max-h-56 overflow-y-auto z-[100] shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col">
                    <CornerBrackets />
                    {EXERCISE_DATABASE.map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => { setSelectedExercise(ex); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-3 text-[10px] font-mono uppercase font-bold border-b border-[#211D2C] ${selectedExercise === ex ? 'bg-[#7C5CFF] text-white' : 'text-[#EDEAF6]/70 hover:bg-[#211D2C] hover:text-[#7C5CFF]'}`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedExercise === 'Latihan Kustom' && (
                <div className="relative">
                  <CornerBrackets />
                  <input
                    autoFocus
                    type="text"
                    placeholder="INPUT MANUAL NAMA GERAKAN..."
                    value={customExerciseText}
                    onChange={(e) => setCustomExerciseText(e.target.value)}
                    className="w-full bg-black border border-[#7C5CFF] text-white text-xs p-3.5 outline-none font-mono uppercase font-bold"
                    required
                  />
                </div>
              )}

              {/* 🎯 CUSTOM DROPDOWN UNTUK KG & REPS */}
              <div className="grid grid-cols-2 gap-3 relative z-10">
                {/* Selector KG */}
                <div className="relative">
                  <span className="text-[8px] font-black text-[#EDEAF6]/40 uppercase tracking-widest mb-1.5 block">BEBAN (KG):</span>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'kg' ? null : 'kg')}
                    className="w-full bg-black border border-[#7C5CFF]/60 text-white font-bold text-xs p-3.5 flex items-center justify-between font-mono relative"
                  >
                    <CornerBrackets />
                    <span>{selectedKg} KG</span>
                    <ChevronDown size={14} className="text-[#7C5CFF]" />
                  </button>
                  {openDropdown === 'kg' && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-[#100E16] border border-[#7C5CFF] max-h-48 overflow-y-auto z-[100] flex flex-col shadow-2xl">
                      <CornerBrackets />
                      {GENERATED_RANGE.map(val => (
                        <button
                          key={`kg-${val}`}
                          type="button"
                          onClick={() => { setSelectedKg(val.toString()); setOpenDropdown(null); }}
                          className={`w-full text-left px-4 py-2.5 text-[10px] font-mono font-bold uppercase border-b border-[#211D2C] ${selectedKg === val.toString() ? 'bg-[#7C5CFF] text-white' : 'text-[#EDEAF6]/70 hover:bg-[#211D2C]'}`}
                        >
                          {val} KG
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selector REPS */}
                <div className="relative">
                  <span className="text-[8px] font-black text-[#EDEAF6]/40 uppercase tracking-widest mb-1.5 block">REPETISI:</span>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'reps' ? null : 'reps')}
                    className="w-full bg-black border border-[#7C5CFF]/60 text-white font-bold text-xs p-3.5 flex items-center justify-between font-mono relative"
                  >
                    <CornerBrackets />
                    <span>{selectedReps} REPS</span>
                    <ChevronDown size={14} className="text-[#7C5CFF]" />
                  </button>
                  {openDropdown === 'reps' && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-[#100E16] border border-[#7C5CFF] max-h-48 overflow-y-auto z-[100] flex flex-col shadow-2xl">
                      <CornerBrackets />
                      {GENERATED_RANGE.map(val => (
                        <button
                          key={`rep-${val}`}
                          type="button"
                          onClick={() => { setSelectedReps(val.toString()); setOpenDropdown(null); }}
                          className={`w-full text-left px-4 py-2.5 text-[10px] font-mono font-bold uppercase border-b border-[#211D2C] ${selectedReps === val.toString() ? 'bg-[#7C5CFF] text-white' : 'text-[#EDEAF6]/70 hover:bg-[#211D2C]'}`}
                        >
                          {val} REPETISI
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button type="button" onClick={() => { setIsAdding(false); setOpenDropdown(null); }} className="py-3 bg-transparent border border-[#211D2C] text-xs font-black text-[#EDEAF6]/70 hover:text-white uppercase relative">
                  <CornerBrackets /> BATAL
                </button>
                <button type="submit" className="py-3 bg-[#7C5CFF] text-white text-xs font-black uppercase shadow-[0_0_15px_rgba(124,92,255,0.3)] relative">
                  <CornerBrackets /> SIMPAN
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-auto py-3.5 border border-dashed border-[#312C42] text-[#EDEAF6]/40 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-1.5 hover:bg-[#211D2C] hover:text-white transition-all active:scale-95 relative"
            >
              <Plus size={14} /> TAMBAH BLOK GERAKAN
            </button>
          )}
        </div>
      </div>

      {/* MODAL PERINTAH DOWNLOAD APLIKASI KALENDER (SYSTEM REQUIREMENT) */}
      {showCalendarAppPrompt && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#7C5CFF] w-full max-w-sm p-5 relative shadow-[0_0_30px_rgba(124,92,255,0.2)] flex flex-col gap-4 text-center font-mono">
            <CornerBrackets />
            <div className="w-12 h-12 bg-black border border-[#7C5CFF]/50 flex items-center justify-center mx-auto text-[#7C5CFF] relative">
              <CornerBrackets />
              <DownloadCloud size={20} className="animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#7C5CFF] font-black text-xs uppercase tracking-widest">[SYSTEM REQUIREMENT]</span>
              <span className="text-white font-bold text-sm uppercase">WAJIB GOOGLE KALENDER</span>
            </div>
            <p className="text-[10px] text-[#EDEAF6]/60 leading-relaxed uppercase tracking-wide border-t border-b border-[#211D2C] py-3">
              UNTUK MENGHINDARI ERROR BROWSER WEB, SISTEM MENGHARUSKAN ANDA MEMILIKI APLIKASI RESMI GOOGLE CALENDAR TERPASANG DI PERANGKAT INI.
            </p>
            <div className="flex flex-col gap-2 mt-1">
              <a 
                href="https://play.google.com/store/apps/details?id=com.google.android.calendar" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-3 bg-[#211D2C] text-[#7C5CFF] font-black text-xs uppercase relative flex items-center justify-center gap-2"
              >
                <CornerBrackets /> DOWNLOAD DI PLAYSTORE
              </a>
              <button 
                type="button" 
                onClick={executeCloudRouting} 
                className="w-full py-3 bg-[#7C5CFF] text-white font-black text-xs uppercase shadow-lg relative"
              >
                <CornerBrackets /> LANJUTKAN SINKRONISASI
              </button>
              <button 
                type="button" 
                onClick={() => setShowCalendarAppPrompt(false)} 
                className="w-full py-3 text-[#EDEAF6]/40 text-xs font-bold uppercase mt-1"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PANDUAN DOKUMEN SISTEM */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-md relative shadow-[0_0_50px_rgba(124,92,255,0.2)] flex flex-col max-h-[85vh]">
            <CornerBrackets />
            <div className="bg-[#14121C] border-b border-[#211D2C] p-4 flex justify-between items-center relative z-10">
              <span className="text-white font-display font-black text-xs uppercase tracking-widest">[DOKUMEN PANDUAN]</span>
              <button onClick={() => setShowGuideModal(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-4 border-b border-[#211D2C] bg-black/20 text-[9px] font-black uppercase tracking-wider text-center">
              <button onClick={() => setGuideTab('fullbody')} className={`py-3.5 border-r border-[#211D2C] ${guideTab === 'fullbody' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Full Body</button>
              <button onClick={() => setGuideTab('bulking')} className={`py-3.5 border-r border-[#211D2C] ${guideTab === 'bulking' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Bulking</button>
              <button onClick={() => setGuideTab('cutting')} className={`py-3.5 border-r border-[#211D2C] ${guideTab === 'cutting' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Cutting</button>
              <button onClick={() => setGuideTab('cal')} className={`py-3.5 ${guideTab === 'cal' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Kalori</button>
            </div>

            <div className="p-5 overflow-y-auto text-[10px] uppercase text-[#EDEAF6]/80 flex flex-col gap-4 leading-relaxed font-mono">
              {guideTab === 'fullbody' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold flex items-center gap-1">PROTOKOL 1 BULAN FULL BODY</div>
                  <p className="text-[#EDEAF6]/40">REKOMENDASI GERAKAN INTI HARIAN:</p>
                  <div className="bg-black border border-[#211D2C] p-3 flex flex-col gap-2 text-[#7C5CFF] relative">
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
                  <p className="text-[#EDEAF6]/40">POLA BEBAN ANGKATAN PROGRESIF:</p>
                  <div className="bg-black border border-[#211D2C] p-3 flex flex-col gap-2 text-[#7C5CFF] relative">
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
                  <p className="text-[#EDEAF6]/40">DEFISIT & DEFEND MASSA:</p>
                  <div className="bg-black border border-[#211D2C] p-3 flex flex-col gap-2 text-[#7C5CFF] relative">
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
                  <p className="font-bold text-[#A28EFF]">METODE MIFFLIN-ST JEOR:</p>
                  <p className="bg-black p-3 border border-[#211D2C] relative text-white text-[9px]">
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

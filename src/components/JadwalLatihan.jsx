import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ShieldAlert, Check, ChevronDown, BookOpen, X, Zap, Key, Award, Activity, Shield } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// Generator Array Kuantitas 1-100 Tanpa Hardcode Manual
const GENERATED_RANGE = Array.from({ length: 100 }, (_, i) => i + 1);

const EXERCISE_DATABASE = [
  // Upper Body Tools & Movements
  'Barbell Bench Press', 'Dumbbell Incline Press', 'Chest Fly Machine', 'Cable Crossover',
  'Weighted Pull Up', 'Barbell Bent Over Row', 'Seated Cable Row', 'Lat Pulldown Wide',
  'Overhead Barbell Press', 'Dumbbell Lateral Raise', 'Cable Face Pull', 'Dumbbell Shrugs',
  'Barbell Bicep Curl', 'Incline Dumbbell Curl', 'Tricep Overhead Extension', 'Cable Tricep Pushdown',
  // Lower Body Tools & Movements
  'Barbell Back Squat', 'Leg Press Machine', 'Bulgarian Split Squat', 'Dumbbell Lunge',
  'Romanian Deadlift', 'Lying Leg Curl Machine', 'Seated Leg Extension', 'Standing Calf Raise',
  // Core & Engine
  'Hanging Leg Raise', 'Cable Crunch Pro', 'Ab Wheel Rollout',
  'Treadmill Interval Sprint', 'Rowing Machine Elite', 'Stationary Bike Assault',
  // Custom Override Flag
  'Latihan Kustom'
];

// 20 KATEGORI VISUAL VALID LENGKAP ATAS SAMPAI BAWAH + ALAT (UNSPLASH CDN GURANTEED SUCCESS)
const FOCUS_AREAS = [
  // Anatomi Tubuh Bagian Atas (Upper Body)
  { id: 'Chest', name: '[ANATOMI] DADA / CHEST COMPLEX', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80' },
  { id: 'Back', name: '[ANATOMI] PUNGGUNG / LATISSIMUS', img: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=80' },
  { id: 'Shoulders', name: '[ANATOMI] BAHU / DELTOID MATRIX', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=400&q=80' },
  { id: 'Biceps', name: '[ANATOMI] LENGAN DEPAN / BICEPS', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80' },
  { id: 'Triceps', name: '[ANATOMI] LENGAN BELAKANG / TRICEPS', img: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=400&q=80' },
  { id: 'Forearms', name: '[ANATOMI] LENGAN BAWAH / FOREARMS', img: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=400&q=80' },
  { id: 'Traps', name: '[ANATOMI] PUNDAK ATAS / TRAPEZIUS', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a25f1?auto=format&fit=crop&w=400&q=80' },
  
  // Anatomi Tubuh Bagian Bawah & Tengah (Lower & Mid Body)
  { id: 'Quads', name: '[ANATOMI] PAHA DEPAN / QUADRICEPS', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80' },
  { id: 'Hamstrings', name: '[ANATOMI] PAHA BELAKANG / HAMSTRINGS', img: 'https://images.unsplash.com/photo-1434596955112-0f2fe645c827?auto=format&fit=crop&w=400&q=80' },
  { id: 'Glutes', name: '[ANATOMI] BOKONG / GLUTEUS MAXIMUS', img: 'https://images.unsplash.com/photo-1590556409324-aa1d726e5c3c?auto=format&fit=crop&w=400&q=80' },
  { id: 'Calves', name: '[ANATOMI] BETIS / CALVES REGION', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80' },
  { id: 'Abs', name: '[ANATOMI] PERUT INTI / CORE INTI', img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=400&q=80' },
  { id: 'LowerBack', name: '[ANATOMI] PINGGANG BAWAH / ERECTOR', img: 'https://images.unsplash.com/photo-1594737625751-a2bc665d59f1?auto=format&fit=crop&w=400&q=80' },
  
  // Segmentasi Jenis Alat Gym (Equipment Arsenal)
  { id: 'Barbell', name: '[ALAT] RIG BARBELL / OLYMPIC AXIS', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80' },
  { id: 'Dumbbell', name: '[ALAT] DUMBBELL FREEWEIGHT ZONE', img: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=400&q=80' },
  { id: 'Cable', name: '[ALAT] CABLE STATION MULTI-PULLEY', img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?auto=format&fit=crop&w=400&q=80' },
  { id: 'Machine', name: '[ALAT] PLATE-LOADED MECHANICAL RIG', img: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=400&q=80' },
  { id: 'Bodyweight', name: '[ALAT] CALISTHENICS / BEBAN TUBUH', img: 'https://images.unsplash.com/photo-1596716904963-44b24f65c822?auto=format&fit=crop&w=400&q=80' },
  { id: 'Cardio', name: '[ALAT] CARDIO STATION / VELOCITY ENGINE', img: 'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?auto=format&fit=crop&w=400&q=80' },
  { id: 'Comprehensive', name: '[ALAT] HYBRID SYSTEM INTEGRATION', img: 'https://images.unsplash.com/photo-1546483875-c070497e8ec6?auto=format&fit=crop&w=400&q=80' }
];

export default function JadwalLatihan({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState('fullbody');
  
  const [customAlert, setCustomAlert] = useState({ isOpen: false, message: '' });
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const [schedule, setSchedule] = useState(() => {
    return DAYS.reduce((acc, day) => ({ 
      ...acc, 
      [day]: { focus: 'Comprehensive', items: [] } 
    }), {});
  });
  
  const [activeDay, setActiveDay] = useState('Senin');
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State Menggunakan Dropdown Dinamis
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customExerciseText, setCustomExerciseText] = useState('');
  const [selectedKg, setSelectedKg] = useState('40'); // Default awal penengah
  const [selectedReps, setSelectedReps] = useState('12');

  useEffect(() => {
    const saved = localStorage.getItem('dg_workout_schedule');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = {};
        DAYS.forEach(day => {
          if (parsed[day]) {
            if (Array.isArray(parsed[day])) {
              normalized[day] = { focus: 'Comprehensive', items: parsed[day] };
            } else {
              normalized[day] = parsed[day];
            }
          } else {
            normalized[day] = { focus: 'Comprehensive', items: [] };
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

  const handleSetFocusArea = (focusId) => {
    setSchedule(prev => ({
      ...prev,
      [activeDay]: { ...prev[activeDay], focus: focusId }
    }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const coreName = selectedExercise === 'Latihan Kustom' ? customExerciseText.trim() : selectedExercise;
    if (!coreName) return;
    
    // Formulasi string gabungan detail target muatan beban gawai
    const fullLogText = `${coreName} (${selectedKg} KG X ${selectedReps} REPS)`;
    
    setSchedule(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        items: [...prev[activeDay].items, { id: Date.now(), text: fullLogText }]
      }
    }));
    
    setSelectedExercise('');
    setCustomExerciseText('');
    setIsAdding(false);
  };

  const handleDeleteItem = (day, id) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], items: prev[day].items.filter(item => item.id !== id) }
    }));
  };

  const handleInitiateSync = () => {
    const dayData = schedule[activeDay];
    if (!dayData.items || dayData.items.length === 0) {
      setCustomAlert({
        isOpen: true,
        message: `SLOT KOSONG! SILAKAN ISI TARGET GERAKAN HARI ${activeDay.toUpperCase()} TERLEBIH DAHULU SEBELUM MELAKUKAN SINKRONISASI.`
      });
      return;
    }
    setShowPermissionPrompt(true);
  };

  const executeCloudRouting = () => {
    setShowPermissionPrompt(false);
    const dayData = schedule[activeDay];
    const focusObj = FOCUS_AREAS.find(f => f.id === dayData.focus) || FOCUS_AREAS[0];
    const title = encodeURIComponent(`[DAILY GRIND LOG] ${focusObj.name}`);
    const details = encodeURIComponent(dayData.items.map((it, idx) => `${idx + 1}. ${it.text}`).join('\n'));
    
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&recur=RRULE:FREQ=WEEKLY`;
    window.open(gCalUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-2 mx-4 animate-pulse">
        <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-2xl h-16" />
        <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-2xl h-24" />
        <div className="h-48 bg-[#100E16] rounded-2xl" />
      </div>
    );
  }

  const currentDayData = schedule[activeDay] || { focus: 'Comprehensive', items: [] };

  return (
    <div className="flex flex-col gap-5 font-mono animate-in fade-in duration-200 mt-2 mx-4 select-none pb-32" onContextMenu={(e) => e.preventDefault()}>
      
      {/* HEADER NAVIGASI */}
      <div className="flex items-center justify-between bg-[#100E16] border border-[#211D2C] p-3 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-[#211D2C] text-[#7C5CFF] rounded-xl active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[#7C5CFF] font-bold text-[10px] tracking-widest uppercase flex items-center gap-1">
              ✦ [MODULE: SCHEDULER]
            </span>
            <span className="font-display font-black text-sm text-white uppercase tracking-widest">
              JADWAL LATIHAN
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 text-[#A28EFF] rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_15px_rgba(124,92,255,0.1)]"
        >
          <BookOpen size={12} /> Panduan
        </button>
      </div>

      {/* HUBUNGKAN KALENDER HP MODUL */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-2xl shadow-lg flex flex-col gap-2">
        <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
          ✦ [INTEGRASI HUBUNGAN KALENDER HP]
        </span>
        <p className="text-[9px] text-[#EDEAF6]/50 uppercase leading-relaxed tracking-wide">
          Petakan seluruh alur target gerakan hari {activeDay} langsung ke sistem pengingat internal gawai secara otomatis.
        </p>
        <button
          type="button"
          onClick={handleInitiateSync}
          className="w-full mt-1 py-3 bg-[#7C5CFF] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-[0_4px_15px_rgba(124,92,255,0.4)] flex items-center justify-center gap-1.5"
        >
          <Zap size={13} className="fill-white" /> Hubungkan Ke Kalender HP
        </button>
      </div>

      {/* HORIZONTAL TABS HARI */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {DAYS.map(day => {
          const isActive = activeDay === day;
          const hasItems = (schedule[day]?.items?.length || 0) > 0;
          return (
            <button
              key={day}
              onClick={() => { setActiveDay(day); setIsAdding(false); }}
              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all relative flex-shrink-0 flex items-center gap-2 ${
                isActive 
                  ? 'bg-[#7C5CFF] text-white shadow-[0_4px_14px_rgba(124,92,255,0.5)] border border-[#a28eff]' 
                  : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6]/40 hover:bg-[#211D2C]'
              }`}
            >
              {day}
              {hasItems && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-purple-400 animate-pulse'}`} />}
            </button>
          )
        })}
      </div>

      {/* 20 DYNAMIC PRESET CATEGORIES MATRIX SCROLL WINDOW */}
      <div className="flex flex-col gap-2 bg-[#100E16] border border-[#211D2C] p-3.5 rounded-2xl shadow-inner">
        <span className="text-[9px] uppercase font-bold text-[#EDEAF6]/40 ml-1 tracking-widest flex items-center gap-1">
          <Shield size={10} className="text-[#7C5CFF]" /> ✦ [ARSENAL KATEGORI UTAMA TUBUH & PERALATAN GYM]:
        </span>
        <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin] scrollbar-thumb-[#7C5CFF] scrollbar-track-black/40">
          {FOCUS_AREAS.map(area => {
            const isTarget = currentDayData.focus === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => handleSetFocusArea(area.id)}
                className={`group h-20 rounded-2xl relative overflow-hidden text-left font-mono border transition-all duration-300 ${isTarget ? 'border-[#7C5CFF] shadow-[0_0_15px_rgba(124,92,255,0.2)] ring-1 ring-[#7C5CFF]' : 'border-[#211D2C] opacity-40 hover:opacity-75'}`}
              >
                <img src={area.img} alt={area.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className={`absolute inset-0 transition-opacity duration-300 ${isTarget ? 'bg-gradient-to-t from-[#0A0A0E] via-[#0A0A0E]/50' : 'bg-black/75'}`} />
                <div className="absolute bottom-1.5 left-2 right-2 flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-wide leading-tight ${isTarget ? 'text-white shadow-sm' : 'text-[#EDEAF6]/50'}`}>{area.name}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* DETIL GERAKAN UTAMA */}
      <div className="bg-[#100E16] border border-[#211D2C] rounded-2xl flex flex-col relative overflow-hidden shadow-md min-h-[200px]">
        <div className="bg-[#14121C] border-b border-[#211D2C] p-3 flex justify-between items-center">
          <span className="text-[#7C5CFF] font-black text-xs uppercase tracking-widest">
            ✦ [STRUKTUR BATTLE TARGET]
          </span>
          <span className="text-[9px] text-[#EDEAF6]/40 font-bold uppercase tracking-widest">{(currentDayData.items?.length || 0)} Aktif</span>
        </div>

        <div className="p-4 flex flex-col gap-2.5 flex-1">
          {(!currentDayData.items || currentDayData.items.length === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-[#EDEAF6]/30 uppercase text-center font-bold tracking-widest py-10">
              Slot Gerakan Kosong / Hari Pemulihan Otot
            </div>
          ) : (
            currentDayData.items.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-black/40 border border-[#211D2C] rounded-xl hover:border-[#7C5CFF]/25 transition-colors">
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

          {/* DYNAMIC FORM ROW INPUT DENGAN MULTI-DROPDOWN 1-100 */}
          {isAdding ? (
            <form onSubmit={handleAddItem} className="mt-auto pt-2 flex flex-col gap-3.5 animate-in slide-in-from-bottom-3 duration-200">
              
              {/* Dropdown 1: Jenis Alat / Nama Gerakan */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full bg-black border border-[#7C5CFF] text-white text-xs p-3.5 rounded-xl flex items-center justify-between text-left font-mono focus:ring-1 focus:ring-[#7C5CFF]"
                >
                  <span className="font-bold uppercase text-[#EDEAF6]">{selectedExercise || 'PILIH ARSENAL PERALATAN / GERAKAN...'}</span>
                  <ChevronDown size={14} className="text-[#7C5CFF]" />
                </button>

                {showDropdown && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#14121C] border border-[#312C42] max-h-48 overflow-y-auto z-50 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-0.5">
                    {EXERCISE_DATABASE.map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => { setSelectedExercise(ex); setShowDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-xs font-mono rounded-xl uppercase font-bold ${selectedExercise === ex ? 'bg-[#7C5CFF] text-white' : 'text-[#EDEAF6]/70 hover:bg-[#7C5CFF]/15'}`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedExercise === 'Latihan Kustom' && (
                <input
                  autoFocus
                  type="text"
                  placeholder="INPUT MANUAL LATIHAN KUSTOM..."
                  value={customExerciseText}
                  onChange={(e) => setCustomExerciseText(e.target.value)}
                  className="w-full bg-black border border-[#7C5CFF] text-white text-xs p-3.5 rounded-xl outline-none font-mono uppercase font-bold focus:shadow-[0_0_15px_rgba(124,92,255,0.2)]"
                  required
                />
              )}

              {/* 🎯 TACTICAL SELECTOR COMPONENT (1-100 KG & 1-100 REPS DROPDOWNS) */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Selector Berat (Kg) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-black text-[#EDEAF6]/40 uppercase tracking-widest ml-1">UKURAN BEBAN BEBAN:</span>
                  <div className="relative">
                    <select
                      value={selectedKg}
                      onChange={(e) => setSelectedKg(e.target.value)}
                      className="w-full bg-black border border-[#7C5CFF]/60 text-white font-bold text-xs p-3 rounded-xl appearance-none font-mono focus:outline-none focus:border-[#7C5CFF] uppercase cursor-pointer"
                    >
                      {GENERATED_RANGE.map(val => (
                        <option key={`kg-${val}`} value={val} className="bg-[#14121C] text-white font-bold">{val} KG</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-3.5 text-[#7C5CFF] pointer-events-none" />
                  </div>
                </div>

                {/* Selector Repetisi (Reps) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-black text-[#EDEAF6]/40 uppercase tracking-widest ml-1">KUANTITAS REPETISI:</span>
                  <div className="relative">
                    <select
                      value={selectedReps}
                      onChange={(e) => setSelectedReps(e.target.value)}
                      className="w-full bg-black border border-[#7C5CFF]/60 text-white font-bold text-xs p-3 rounded-xl appearance-none font-mono focus:outline-none focus:border-[#7C5CFF] uppercase cursor-pointer"
                    >
                      {GENERATED_RANGE.map(val => (
                        <option key={`rep-${val}`} value={val} className="bg-[#14121C] text-white font-bold">{val} REPETISI</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-3.5 text-[#7C5CFF] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Tombol Eksekusi Form */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button type="button" onClick={() => { setIsAdding(false); setSelectedExercise(''); }} className="py-3 bg-transparent border border-[#211D2C] text-xs font-black text-white uppercase rounded-xl active:scale-95">Batal</button>
                <button type="submit" className="py-3 bg-[#7C5CFF] text-white text-xs font-black uppercase rounded-xl shadow-md active:scale-95">Simpan Modul</button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-auto py-3 border border-dashed border-[#312C42] text-[#EDEAF6]/40 text-[10px] uppercase font-black tracking-widest rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#211D2C] hover:text-white transition-all active:scale-95"
            >
              <Plus size={14} /> Tambah Konfigurasi Latihan
            </button>
          )}
        </div>
      </div>

      {/* MODAL OTORISASI INTERNAL */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs p-5 rounded-2xl relative shadow-2xl flex flex-col gap-4 text-center font-mono">
            <div className="w-12 h-12 rounded-full bg-[#7C5CFF]/10 flex items-center justify-center mx-auto text-[#7C5CFF] border border-[#7C5CFF]/20">
              <Key size={20} className="animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#7C5CFF] font-black text-xs uppercase tracking-widest">[SYSTEM REQUEST: ACCESS]</span>
              <span className="text-white font-bold text-sm uppercase">OTORISASI KALENDER HP</span>
            </div>
            <p className="text-[10px] text-[#EDEAF6]/60 leading-relaxed uppercase tracking-wide">
              APLIKASI MEMERLUKAN IZIN UNTUK MENGHUBUNGKAN DRAFT JADWAL KE CLOUD STORAGE ENGINE KALENDER DI PERANGKAT ANDA. SETUJUI AKSES?
            </p>
            <div className="grid grid-cols-2 gap-2.5 mt-2 font-bold text-xs">
              <button type="button" onClick={() => setShowPermissionPrompt(false)} className="py-2.5 border border-[#211D2C] text-[#EDEAF6]/60 uppercase rounded-xl active:scale-95">TOLAK</button>
              <button type="button" onClick={executeCloudRouting} className="py-2.5 bg-[#7C5CFF] text-white font-black uppercase rounded-xl shadow-lg active:scale-95">IZINKAN</button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT DIALOG CUSTOM */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#100E16] border border-red-500/30 w-full max-w-xs p-5 rounded-2xl text-center font-mono flex flex-col gap-4 relative shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert size={18} />
            </div>
            <span className="text-red-400 font-black text-xs tracking-widest">[SYSTEM WARNING]</span>
            <p className="text-[9px] text-[#EDEAF6]/70 leading-relaxed tracking-wide">{customAlert.message}</p>
            <button
              type="button"
              onClick={() => setCustomAlert({ isOpen: false, message: '' })}
              className="w-full py-2.5 bg-[#211D2C] text-white font-black text-xs uppercase rounded-xl active:scale-95 mt-1"
            >
              KONFIRMASI SYSTEM
            </button>
          </div>
        </div>
      )}

      {/* MODAL PANDUAN JURNAL SCIENTIFIC */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-md rounded-2xl overflow-hidden relative shadow-[0_0_50px_rgba(124,92,255,0.2)] flex flex-col max-h-[85vh]">
            
            <div className="bg-[#14121C] border-b border-[#211D2C] p-4 flex justify-between items-center">
              <span className="text-white font-display font-black text-xs uppercase tracking-widest">✦ [MODULE: COMPENDIUM GUIDE]</span>
              <button onClick={() => setShowGuideModal(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-4 border-b border-[#211D2C] bg-black/20 text-[9px] font-black uppercase tracking-wider text-center">
              <button onClick={() => setGuideTab('fullbody')} className={`py-3.5 ${guideTab === 'fullbody' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Full Body</button>
              <button onClick={() => setGuideTab('bulking')} className={`py-3.5 ${guideTab === 'bulking' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Bulking</button>
              <button onClick={() => setGuideTab('cutting')} className={`py-3.5 ${guideTab === 'cutting' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Cutting</button>
              <button onClick={() => setGuideTab('cal')} className={`py-3.5 ${guideTab === 'cal' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Kalori/Nutrisi</button>
            </div>

            <div className="p-5 overflow-y-auto text-[10px] uppercase text-[#EDEAF6]/80 flex flex-col gap-4 leading-relaxed font-mono">
              {guideTab === 'fullbody' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold flex items-center gap-1"><Award size={12} className="text-[#7C5CFF]" /> PROTOKOL 1 BULAN FULL BODY</div>
                  <p className="text-gray-400">Rekomendasi Gerakan Inti Efektif Harian:</p>
                  <div className="bg-black/30 border border-[#211D2C] p-2.5 rounded-xl flex flex-col gap-1 text-[#A28EFF]">
                    <div>1. BARBELL SQUAT (3 SET X 8-10 REPS) - TARGET PAHA/GLUTES</div>
                    <div>2. BENCH PRESS (3 SET X 8-10 REPS) - TARGET DADA UTAMA</div>
                    <div>3. BARBELL ROW (3 SET X 8-10 REPS) - TARGET PUNGGUNG ATAS</div>
                    <div>4. OVERHEAD PRESS (2 SET X 10 REPS) - TARGET BAHU KOMPLEKS</div>
                  </div>
                  <p>Mekanisme Pemulihan: Berdasarkan riset ilmiah, otot besar membutuhkan waktu istirahat 48 jam penuh demi sintesis glikogen maksimal. Lakukan latihan hanya pada Senin, Rabu, Jumat.</p>
                </>
              )}

              {guideTab === 'bulking' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold flex items-center gap-1"><Activity size={12} className="text-[#7C5CFF]" /> PROTOKOL DRAFT REKAYASA BULKING</div>
                  <p className="text-gray-400">Rekomendasi Pola Beban Angkatan Progresif:</p>
                  <div className="bg-black/30 border border-[#211D2C] p-2.5 rounded-xl flex flex-col gap-1 text-[#A28EFF]">
                    <div>M1: COBA BEBAN 1RM DASAR (MISAL 50KG X 10 REPS)</div>
                    <div>M2: NAIKKAN INTENSITAS BEBAN (+2.5KG / MENJADI 52.5KG)</div>
                    <div>M3: JAGA BEBAN SAMA, TAMBAH TARGET MENJADI 12 REPS</div>
                    <div>M4: DELOAD REDUKSI VOLUME SEBELUM SIKLUS BERIKUTNYA</div>
                  </div>
                  <p>Asupan Nutrisi Mandat: Wajib surplus energi konstan sebanyak 300 hingga 500 kalori di atas ambang kebutuhan tubuh harian Anda demi mendukung hipertrofi.</p>
                </>
              )}

              {guideTab === 'cutting' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold flex items-center gap-1"><ShieldAlert size={12} className="text-[#7C5CFF]" /> PROTOKOL REDUKSI LEMAK (CUTTING)</div>
                  <p className="text-gray-400">Rekomendasi Kombinasi Defisit & Defend Massa:</p>
                  <div className="bg-black/30 border border-[#211D2C] p-2.5 rounded-xl flex flex-col gap-1 text-[#A28EFF]">
                    <div>1. BENCH PRESS BERAT (PERTAHANKAN BEBAN AWAL)</div>
                    <div>2. LAT PULLDOWN STABIL (JAGA INTENSITAS INTENS)</div>
                    <div>3. HIIIT CARDIO SPRINT (15 MENIT DI AKHIR SESI)</div>
                  </div>
                  <p>Strategi Defisit: Pangkas suplai karbohidrat harian hingga menyentuh ambang batas defisit 500 kalori di bawah TDEE, sembari mendongkrak retensi protein.</p>
                </>
              )}

              {guideTab === 'cal' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold flex items-center gap-1"><Zap size={12} className="text-[#7C5CFF]" /> RUMUS FORMULA KALORI & MANAJEMEN SIRKADIAN</div>
                  <p className="font-bold text-[#A28EFF]">METODE MIFFLIN-ST JEOR:</p>
                  <p className="bg-black/40 p-2 rounded-xl border border-[#211D2C]">
                    PRIA: BMR = (10 X BERAT KG) + (6.25 X TINGGI CM) - (5 X UMUR) + 5
                  </p>
                  <p>Target Protein Utama: Konsumsi makro protein murni minimal 1.6g hingga 2.2g per kilogram berat badan per hari secara disiplin.</p>
                  <p>Pola Istirahat Mutlak: Tidur lelap selama 7 hingga 9 jam dalam kegelapan total untuk optimalisasi regenerasi hormonal alami tubuh.</p>
                </>
              )}
            </div>

            <div className="p-4 bg-black/40 border-t border-[#211D2C]">
              <button onClick={() => setShowGuideModal(false)} className="w-full py-3 bg-[#211D2C] text-xs font-black text-white uppercase rounded-xl active:scale-95">
                TUTUP ARSIP DOKUMEN
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

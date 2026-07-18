import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Plus, Trash2, ShieldAlert, Check, ChevronDown, BookOpen, X, Zap } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const EXERCISE_DATABASE = [
  'Bench Press', 'Incline Dumbbell Press', 'Chest Fly', 'Push Up',
  'Pull Up', 'Barbell Row', 'Lat Pulldown', 'Deadlift',
  'Barbell Squat', 'Leg Press', 'Bulgarian Split Squat', 'Leg Curl', 'Calf Raise',
  'Overhead Press', 'Lateral Raise', 'Face Pull',
  'Bicep Curl', 'Tricep Pushdown', 'Hammer Curl',
  'Plank', 'Crunch', 'Hanging Leg Raise',
  'Running / Treadmill', 'Cycling', 'Jump Rope',
  'Latihan Kustom'
];

const FOCUS_AREAS = [
  { id: 'FullBody', name: 'FULL BODY / COMPREHENSIVE', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80' },
  { id: 'Chest', name: 'DADA / PUSH FOCUS', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80' },
  { id: 'Back', name: 'PUNGGUNG / PULL FOCUS', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a25f1?auto=format&fit=crop&w=400&q=80' },
  { id: 'Legs', name: 'PAHA & BETIS / LEGS FOCUS', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80' },
  { id: 'Shoulders', name: 'BAHU & LENGAN / ARMS FOCUS', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80' },
  { id: 'Cardio', name: 'KETAHANAN / CARDIO & ENDURANCE', img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=400&q=80' }
];

export default function JadwalLatihan({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState('fullbody');
  
  const [schedule, setSchedule] = useState(() => {
    return DAYS.reduce((acc, day) => ({ 
      ...acc, 
      [day]: { focus: 'FullBody', items: [] } 
    }), {});
  });
  
  const [activeDay, setActiveDay] = useState('Senin');
  const [isAdding, setIsAdding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customExerciseText, setCustomExerciseText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('dg_workout_schedule');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = {};
        DAYS.forEach(day => {
          if (parsed[day]) {
            if (Array.isArray(parsed[day])) {
              normalized[day] = { focus: 'FullBody', items: parsed[day] };
            } else {
              normalized[day] = parsed[day];
            }
          } else {
            normalized[day] = { focus: 'FullBody', items: [] };
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
    const finalName = selectedExercise === 'Latihan Kustom' ? customExerciseText.trim() : selectedExercise;
    if (!finalName) return;
    
    setSchedule(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        items: [...prev[activeDay].items, { id: Date.now(), text: finalName }]
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

  // 🎯 GOOGLE CALENDAR CLOUD ROUTER LINK GENERATOR INTEGRATION
  const handleCloudSyncCalendar = () => {
    const dayData = schedule[activeDay];
    if (dayData.items.length === 0) {
      alert("Silakan isi gerakan latihan terlebih dahulu untuk hari ini.");
      return;
    }
    const focusObj = FOCUS_AREAS.find(f => f.id === dayData.focus) || FOCUS_AREAS[0];
    const title = encodeURIComponent(`[SYSTEM LOG] ${focusObj.name}`);
    const details = encodeURIComponent(dayData.items.map((it, idx) => `${idx + 1}. ${it.text}`).join('\n'));
    
    // Format UTC Cloud URL Generator string untuk entri jadwal instan
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&recur=RRULE:FREQ=WEEKLY`;
    window.open(gCalUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-2 mx-4 animate-pulse">
        <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl h-16" />
        <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl h-24" />
        <div className="grid grid-cols-2 gap-2 h-44" />
      </div>
    );
  }

  const currentDayData = schedule[activeDay] || { focus: 'FullBody', items: [] };

  return (
    <div className="flex flex-col gap-5 font-mono animate-in fade-in duration-200 mt-2 mx-4 select-none pb-32" onContextMenu={(e) => e.preventDefault()}>
      
      {/* MENU NAVIGASI CORE */}
      <div className="flex items-center justify-between bg-[#100E16] border border-[#211D2C] p-3 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-[#211D2C] text-[#7C5CFF] rounded-lg active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[#7C5CFF] font-bold text-[10px] tracking-widest uppercase flex items-center gap-1">
              ✦ [SYSTEM MODULE: SCHEDULER]
            </span>
            <span className="font-display font-black text-sm text-white uppercase tracking-widest">
              JADWAL LATIHAN
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#7C5CFF]/20 border border-[#7C5CFF]/50 text-[#9E85FF] rounded-lg text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all"
        >
          <BookOpen size={12} /> Panduan
        </button>
      </div>

      {/* CLOUD ACTION BOX */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl shadow-lg relative flex flex-col gap-2">
        <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
          ✦ [INTEGRASI KALENDER CLOUD SYSTEM]
        </span>
        <p className="text-[9px] text-[#EDEAF6]/50 uppercase leading-relaxed tracking-wide">
          Gunakan modul di bawah untuk langsung memetakan jadwal latihan hari {activeDay} ke aplikasi kalender bawaan perangkat tanpa unduhan berkas fisik.
        </p>
        <button
          type="button"
          onClick={handleCloudSyncCalendar}
          className="w-full mt-1 py-2.5 bg-[#7C5CFF] text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-[0_0_15px_rgba(124,92,255,0.3)] flex items-center justify-center gap-1.5"
        >
          <Zap size={12} /> Hubungkan Ke Kalender HP
        </button>
      </div>

      {/* TABS HARI */}
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {DAYS.map(day => {
          const isActive = activeDay === day;
          const hasItems = (schedule[day]?.items?.length || 0) > 0;
          return (
            <button
              key={day}
              onClick={() => { setActiveDay(day); setIsAdding(false); }}
              className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all relative flex-shrink-0 flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.5)] border border-[#a28eff]' 
                  : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6]/40 hover:bg-[#211D2C]'
              }`}
            >
              {day}
              {hasItems && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-400'}`} />}
            </button>
          )
        })}
      </div>

      {/* GRID TARGET FOKUS OTOT */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] uppercase font-bold text-[#EDEAF6]/40 ml-1 tracking-widest">✦ [PILIH AREA FOKUS UTAMA HARI GERAKAN]:</span>
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_AREAS.map(area => {
            const isTarget = currentDayData.focus === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => handleSetFocusArea(area.id)}
                className={`group h-24 rounded-xl relative overflow-hidden text-left font-mono border transition-all duration-300 ${isTarget ? 'border-[#7C5CFF] shadow-[0_0_15px_rgba(124,92,255,0.3)]' : 'border-[#211D2C] opacity-50'}`}
              >
                <img src={area.img} alt={area.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className={`absolute inset-0 ${isTarget ? 'bg-gradient-to-t from-[#0A0A0E] via-[#0A0A0E]/50' : 'bg-black/80'}`} />
                <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wide leading-tight ${isTarget ? 'text-white' : 'text-[#EDEAF6]/60'}`}>{area.name}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* AREA DAFTAR RUTINITAS */}
      <div className="bg-[#100E16] border border-[#211D2C] rounded-xl flex flex-col relative overflow-hidden shadow-md min-h-[200px]">
        <div className="bg-[#14121C] border-b border-[#211D2C] p-3 flex justify-between items-center">
          <span className="text-[#7C5CFF] font-black text-xs uppercase tracking-widest">
            ✦ [DAFTAR TARGET OLAHRAGA]
          </span>
          <span className="text-[9px] text-[#EDEAF6]/40 font-bold uppercase">{(currentDayData.items?.length || 0)} Slot Terisi</span>
        </div>

        <div className="p-3.5 flex flex-col gap-2.5 flex-1">
          {(!currentDayData.items || currentDayData.items.length === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-[#EDEAF6]/30 uppercase text-center font-bold tracking-widest py-8">
              Jadwal Kosong / Rest Day
            </div>
          ) : (
            currentDayData.items.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 bg-black/40 border border-[#211D2C] rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[#7C5CFF] text-[10px] font-black">#{idx + 1}</span>
                  <span className="text-[#EDEAF6] text-xs font-bold uppercase tracking-wide truncate">{item.text}</span>
                </div>
                <button type="button" onClick={() => handleDeleteItem(activeDay, item.id)} className="text-[#EDEAF6]/20 hover:text-red-400 p-1.5">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}

          {/* SYSTEM DROPDOWN INPUT ENGINE */}
          {isAdding ? (
            <form onSubmit={handleAddItem} className="mt-auto pt-2 flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-150">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full bg-black border border-[#7C5CFF] text-white text-xs p-3 rounded-xl flex items-center justify-between text-left font-mono"
                >
                  <span>{selectedExercise || 'Pilih Jenis Gerakan...'}</span>
                  <ChevronDown size={14} className="text-[#7C5CFF]" />
                </button>

                {showDropdown && (
                  <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#14121C] border border-[#211D2C] max-h-48 overflow-y-auto z-50 rounded-xl shadow-2xl">
                    {EXERCISE_DATABASE.map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => { setSelectedExercise(ex); setShowDropdown(false); }}
                        className="w-full text-left p-2.5 text-xs font-mono text-[#EDEAF6]/80 hover:bg-[#7C5CFF]/20 hover:text-white border-b border-[#211D2C]/40 uppercase"
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
                  placeholder="Ketik Latihan Asing / Custom..."
                  value={customExerciseText}
                  onChange={(e) => setCustomExerciseText(e.target.value)}
                  className="w-full bg-black border border-[#7C5CFF] text-white text-xs p-3 rounded-xl outline-none font-mono uppercase"
                  required
                />
              )}

              <div className="flex gap-2 w-full">
                <button type="button" onClick={() => { setIsAdding(false); setSelectedExercise(''); }} className="flex-1 py-2.5 bg-transparent border border-[#211D2C] text-xs font-bold text-white uppercase rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#7C5CFF] text-white text-xs font-black uppercase rounded-xl shadow-md">Simpan</button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-auto py-2.5 border border-dashed border-[#312C42] text-[#EDEAF6]/40 text-[10px] uppercase font-black tracking-widest rounded-xl flex items-center justify-center gap-1.5"
            >
              <Plus size={13} /> Tambah Komponen Latihan
            </button>
          )}
        </div>
      </div>

      {/* 🎯 MODAL PANDUAN JURNAL SCIENTIFIC SYSTEM COMPENDIUM */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-md rounded-xl overflow-hidden relative shadow-[0_0_40px_rgba(124,92,255,0.25)] flex flex-col max-h-[85vh]">
            
            {/* Siku Dekorasi Antarmuka */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#7C5CFF]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#7C5CFF]" />
            
            <div className="bg-[#14121C] border-b border-[#211D2C] p-4 flex justify-between items-center">
              <span className="text-white font-display font-black text-xs uppercase tracking-widest">✦ [SYSTEM SYSTEM: COMPENDIUM GUIDE]</span>
              <button onClick={() => setShowGuideModal(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>

            {/* TAB SELECTOR KATEGORI PANDUAN */}
            <div className="grid grid-cols-4 border-b border-[#211D2C] bg-black/20 text-[9px] font-black uppercase tracking-wider text-center">
              <button onClick={() => setGuideTab('fullbody')} className={`py-3 ${guideTab === 'fullbody' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Full Body</button>
              <button onClick={() => setGuideTab('bulking')} className={`py-3 ${guideTab === 'bulking' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Bulking</button>
              <button onClick={() => setGuideTab('cutting')} className={`py-3 ${guideTab === 'cutting' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Cutting</button>
              <button onClick={() => setGuideTab('cal')} className={`py-3 ${guideTab === 'cal' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF] bg-[#100E16]' : 'text-gray-500'}`}>Kalori/Nutrisi</button>
            </div>

            {/* KONTEN UTAMA FILTER PANDUAN */}
            <div className="p-5 overflow-y-auto text-[10px] uppercase text-[#EDEAF6]/80 flex flex-col gap-4 leading-relaxed font-mono">
              
              {guideTab === 'fullbody' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold">✦ METODE FULL BODY 1 BULAN (Riset Dr. Brad Schoenfeld)</div>
                  <p>Struktur Latihan: 3 Hari Per Minggu (Misal: Senin, Rabu, Jumat). Target seluruh kelompok otot utama dalam satu sesi untuk merangsang sintesis protein otot secara maksimal.</p>
                  <p>Pemulihan Otot Harian: Jurnal Kekuatan membuktikan otot membutuhkan waktu 24–48 jam untuk pemulihan intensitas sedang, dan hingga 72 jam setelah beban berat ekstrim. Jangan lewatkan Rest Day (Selasa, Kamis, Sabtu, Minggu).</p>
                </>
              )}

              {guideTab === 'bulking' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold">✦ MODUL PENINGKATAN MASSA (Bulking Strategy)</div>
                  <p>Fokus Utama: Progresi Beban (Progressive Overload). Wajib menaikkan beban angkatan secara bertahap (misal naik 2.5kg - 5kg) atau menambah repetisi secara konsisten setiap minggu.</p>
                  <p>Kebutuhan Energi: Surplus kalori terstruktur sebesar 300 - 500 kalori di atas ambang batas TDEE harian Anda untuk mendukung pembentukan jaringan sel otot baru.</p>
                </>
              )}

              {guideTab === 'cutting' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold">✦ MODUL DESTRUKSI LEMAK (Cutting Strategy)</div>
                  <p>Fokus Utama: Mempertahankan Massa Otot saat berada dalam kondisi kekurangan energi. Pertahankan intensitas beban angkutan setinggi mungkin, jangan kurangi beban latihan.</p>
                  <p>Defisit Kalori: Batasi asupan energi sekitar 500 kalori di bawah kebutuhan harian untuk memaksa tubuh menggunakan cadangan lemak subkutan sebagai bahan bakar.</p>
                </>
              )}

              {guideTab === 'cal' && (
                <>
                  <div className="border-l-2 border-[#7C5CFF] pl-2 text-white font-bold">✦ FORMULA PENGHITUNGAN KALORI & POLA TIDUR (Dr. Eric Helms)</div>
                  <p>Rumus TDEE Dasar (Mifflin-St Jeor):<br/>
                     Pria: BMR = (10 x Berat kg) + (6.25 x Tinggi cm) - (5 x Umur) + 5<br/>
                     Kalikan nilai BMR dengan level aktivitas fisik (1.2 untuk mageran, 1.55 untuk aktif gym) untuk menemukan total TDEE harian Anda.</p>
                  <p>Pola Makan & Makro: Konsumsi protein 1.6 hingga 2.2 gram per kilogram berat badan Anda setiap hari untuk menjaga retensi nitrogen jaringan.</p>
                  <p>Pola Tidur (Siklus Sirkadian): Wajib tidur 7-9 jam dalam kondisi gelap total untuk memicu sekresi optimal Growth Hormone (GH) sebagai agen pemulihan biologis tubuh.</p>
                </>
              )}

            </div>

            <div className="p-4 bg-black/40 border-t border-[#211D2C]">
              <button onClick={() => setShowGuideModal(false)} className="w-full py-2.5 bg-[#211D2C] text-xs font-bold text-white uppercase rounded-xl active:scale-95 transition-transform">
                Tutup Dokumen Panduan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

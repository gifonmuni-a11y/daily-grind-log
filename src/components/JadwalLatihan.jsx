import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Plus, Trash2, Edit3, ShieldAlert, Check, ChevronDown } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function JadwalLatihan({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState(() => {
    return DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
  });
  
  const [activeDay, setActiveDay] = useState('Senin');
  const [isEditing, setIsEditing] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  // Hardware Back Button Trap & Skeleton Delay
  useEffect(() => {
    const saved = localStorage.getItem('dg_workout_schedule');
    if (saved) {
      setSchedule(JSON.parse(saved));
    }

    const timer = setTimeout(() => setIsLoading(false), 500);

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

  // Simpan ke local storage tiap kali jadwal berubah
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('dg_workout_schedule', JSON.stringify(schedule));
    }
  }, [schedule, isLoading]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    
    setSchedule(prev => ({
      ...prev,
      [activeDay]: [...prev[activeDay], { id: Date.now(), text: newItemText.trim() }]
    }));
    setNewItemText('');
    setIsEditing(false);
  };

  const handleDeleteItem = (day, id) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter(item => item.id !== id)
    }));
  };

  // --- SKELETON LOADING ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-2 mx-4 animate-pulse">
        <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl shadow-lg h-16" />
        <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl shadow-lg h-24" />
        <div className="bg-[#100E16] border border-[#211D2C] rounded-xl h-64" />
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-5 font-mono animate-in fade-in duration-200 mt-2 mx-4 select-none pb-32"
      onContextMenu={(e) => e.preventDefault()} // Anti-Scraping
    >
      {/* HEADER NAVIGASI */}
      <div className="flex items-center gap-3 bg-[#100E16] border border-[#211D2C] p-3 rounded-xl shadow-lg">
        <button onClick={onBack} className="p-2 bg-[#211D2C] text-[#7C5CFF] rounded-lg active:scale-95 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col">
          <span className="text-[#7C5CFF] font-bold text-[10px] tracking-widest uppercase flex items-center gap-1">
            <Calendar size={10} /> Training Planner
          </span>
          <span className="font-display font-black text-sm text-white uppercase tracking-widest">
            JADWAL LATIHAN
          </span>
        </div>
      </div>

      {/* SYSTEM HEADER */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl shadow-lg relative flex flex-col gap-3">
        <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-[#7C5CFF]" />
        <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-[#7C5CFF]" />
        <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-[#7C5CFF]" />
        <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-[#7C5CFF]" />

        <div className="text-[10px] text-[#EDEAF6]/60 leading-relaxed tracking-wide uppercase">
          Rancang cetak biru (Blueprint) rutinitas mingguanmu di sini. Data akan tersimpan otomatis di perangkatmu.
        </div>
      </div>

      {/* DAY SELECTOR TABS */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(day => {
          const isActive = activeDay === day;
          const hasItems = schedule[day].length > 0;
          return (
            <button
              key={day}
              onClick={() => { setActiveDay(day); setIsEditing(false); }}
              className={`py-3 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all relative flex flex-col items-center gap-1 ${
                isActive 
                  ? 'bg-[#7C5CFF] text-white shadow-[0_0_10px_rgba(124,92,255,0.4)]' 
                  : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6]/50 hover:bg-[#211D2C]'
              }`}
            >
              {day.slice(0, 3)}
              {hasItems && !isActive && <span className="w-1 h-1 bg-emerald-400 rounded-full" />}
              {hasItems && isActive && <span className="w-1 h-1 bg-white rounded-full" />}
            </button>
          )
        })}
      </div>

      {/* CONTENT LIST UNTUK HARI YANG DIPILIH */}
      <div className="bg-[#100E16] border border-[#211D2C] rounded-xl flex flex-col relative overflow-hidden shadow-md min-h-[250px]">
        <div className="bg-[#14121C] border-b border-[#211D2C] p-3 flex justify-between items-center">
          <span className="text-[#7C5CFF] font-black text-xs uppercase tracking-widest">
            TARGET HARI {activeDay}
          </span>
          <span className="text-[10px] text-[#EDEAF6]/40 font-bold">{schedule[activeDay].length} Tugas</span>
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1">
          {schedule[activeDay].length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[10px] text-[#EDEAF6]/30 uppercase text-center font-bold tracking-widest">
              Belum ada jadwal.
              <br/>Hari Istirahat (Rest Day)?
            </div>
          ) : (
            schedule[activeDay].map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-black/40 border border-[#211D2C] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-[#7C5CFF] text-[10px] font-black">{idx + 1}.</span>
                  <span className="text-[#EDEAF6] text-xs font-bold uppercase tracking-wide">{item.text}</span>
                </div>
                <button 
                  onClick={() => handleDeleteItem(activeDay, item.id)}
                  className="text-[#EDEAF6]/20 hover:text-red-400 p-1 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}

          {/* FORM TAMBAH JADWAL */}
          {isEditing ? (
            <form onSubmit={handleAddItem} className="mt-auto pt-2 flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Misal: Push Day / Squat 4 set..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="flex-1 bg-black border border-[#7C5CFF] text-white text-xs p-2.5 rounded-lg outline-none font-mono placeholder-[#EDEAF6]/30"
              />
              <button 
                type="submit" 
                className="bg-[#7C5CFF] text-white p-2.5 rounded-lg active:scale-95 transition-all shadow-[0_0_10px_rgba(124,92,255,0.3)]"
              >
                <Check size={16} strokeWidth={3} />
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-auto py-3 border border-dashed border-[#312C42] text-[#EDEAF6]/50 text-[10px] uppercase font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#211D2C] hover:text-white transition-all"
            >
              <Plus size={14} /> Tambah Rutinitas
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

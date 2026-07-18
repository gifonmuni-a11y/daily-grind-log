import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Plus, Trash2, ShieldAlert, Check, Download, Zap, Sparkles } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// Asset visual premiumimages dari Unsplash CDN dengan optimalisasi kompresi web
const FOCUS_AREAS = [
  { id: 'Chest', name: 'DADA / PUSH Focus', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80' },
  { id: 'Back', name: 'PUNGGUNG / PULL Focus', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a25f1?auto=format&fit=crop&w=400&q=80' },
  { id: 'Legs', name: 'PAHA & BETIS / LEGS Focus', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80' },
  { id: 'Shoulders', name: 'BAHU & LENGAN / ARMS Focus', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80' },
  { id: 'Core', name: 'PERUT & INTI / CORE Focus', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80' },
  { id: 'Cardio', name: 'KETAHANAN FLUIDA / CARDIO & FULLBODY', img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=400&q=80' }
];

// Mapping Hari ke format iCalendar (.ics standard rule)
const ICS_DAY_MAP = { 'Senin': 'MO', 'Selasa': 'TU', 'Rabu': 'WE', 'Kamis': 'TH', 'Jumat': 'FR', 'Sabtu': 'SA', 'Minggu': 'SU' };
const ICS_DATE_MAP = { 'Senin': '20260720', 'Selasa': '20260721', 'Rabu': '20260722', 'Kamis': '20260723', 'Jumat': '20260724', 'Sabtu': '20260725', 'Minggu': '20260726' };

export default function JadwalLatihan({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  
  // State schedule terstruktur rapi memuat fokus area dan list latihan
  const [schedule, setSchedule] = useState(() => {
    return DAYS.reduce((acc, day) => ({ 
      ...acc, 
      [day]: { focus: 'Cardio', items: [] } 
    }), {});
  });
  
  const [activeDay, setActiveDay] = useState('Senin');
  const [isEditing, setIsEditing] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  // Sinkronisasi data lokal & Trap navigasi fisik
  useEffect(() => {
    const saved = localStorage.getItem('dg_workout_schedule');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Konversi penyesuaian data lama jika berupa array biasa agar tidak crash
        const normalized = {};
        DAYS.forEach(day => {
          if (parsed[day]) {
            if (Array.isArray(parsed[day])) {
              normalized[day] = { focus: 'Cardio', items: parsed[day] };
            } else {
              normalized[day] = parsed[day];
            }
          } else {
            normalized[day] = { focus: 'Cardio', items: [] };
          }
        });
        setSchedule(normalized);
      } catch (e) {
        console.error("Error parsing local schedule:", e);
      }
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

  // Auto-Save Trigger Perubahan State
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
    if (!newItemText.trim()) return;
    
    setSchedule(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        items: [...prev[activeDay].items, { id: Date.now(), text: newItemText.trim() }]
      }
    }));
    setNewItemText('');
    setIsEditing(false);
  };

  const handleDeleteItem = (day, id) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        items: prev[day].items.filter(item => item.id !== id)
      }
    }));
  };

  // 🎯 CORE ENGINE REALISASI NOTIF: Kompilasi data ke berkas .ics standard untuk alarm kalender bawaan HP
  const handleExportToCalendar = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Daily Grind Log//System Workout Planner//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    DAYS.forEach(day => {
      const dayData = schedule[day];
      if (dayData.items.length === 0) return; // Lewati hari kosong / rest day

      const focusObj = FOCUS_AREAS.find(f => f.id === dayData.focus) || FOCUS_AREAS[5];
      const dateStr = ICS_DATE_MAP[day];
      const dayCode = ICS_DAY_MAP[day];
      
      const summary = `⚔️ SYSTEM LOG: ${focusObj.name}`;
      const description = dayData.items.map((it, idx) => `${idx + 1}. ${it.text}`).join('\\n');

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${dayCode}@dailygrindlog.internal`,
        `DTSTART;TZID=Asia/Jakarta:${dateStr}T070000`, // Set jam latihan standard 07:00 pagi
        `DTEND;TZID=Asia/Jakarta:${dateStr}T083000`,
        `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`, // Rule berulang berkala otomatis setiap minggu
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT15M', // Alarm berbunyi 15 menit sebelum waktu latihan tiba di HP player
        'ACTION:DISPLAY',
        'DESCRIPTION:Panggilan Latihan Sistem Terdeteksi!',
        'END:VALARM',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'DailyGrind_Workout_Schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SKELETON ENGINE TRANSISI ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-2 mx-4 animate-pulse">
        <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl h-16" />
        <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl h-24" />
        <div className="grid grid-cols-2 gap-2 h-44" />
      </div>
    );
  }

  const currentDayData = schedule[activeDay] || { focus: 'Cardio', items: [] };

  return (
    <div 
      className="flex flex-col gap-5 font-mono animate-in fade-in duration-200 mt-2 mx-4 select-none pb-32"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ATAS HEADER */}
      <div className="flex items-center justify-between bg-[#100E16] border border-[#211D2C] p-3 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-[#211D2C] text-[#7C5CFF] rounded-lg active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[#7C5CFF] font-bold text-[10px] tracking-widest uppercase flex items-center gap-1">
              <Sparkles size={10} className="animate-pulse" /> Blueprint Routine
            </span>
            <span className="font-display font-black text-sm text-white uppercase tracking-widest">
              JADWAL LATIHAN
            </span>
          </div>
        </div>

        {/* 🎯 ACTION BUTTON CALENDAR ALARM NOTIF */}
        <button
          type="button"
          onClick={handleExportToCalendar}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#7C5CFF]/10 border border-[#7C5CFF]/40 text-[#7C5CFF] rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-[#7C5CFF] hover:text-white transition-all active:scale-95 shadow-[0_0_15px_rgba(124,92,255,0.1)]"
        >
          <Download size={12} /> Sync Alarm HP
        </button>
      </div>

      {/* DASHBOARD INFO */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl shadow-lg relative flex flex-col gap-1">
        <div className="absolute top-0 right-3 bg-[#7C5CFF]/20 text-[#7C5CFF] text-[8px] px-2 py-0.5 border-x border-b border-[#7C5CFF]/30 tracking-widest uppercase font-bold">SYSTEM ACTIVE</div>
        <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert size={12} className="text-[#7C5CFF]" /> Panduan Kalibrasi
        </span>
        <p className="text-[9px] text-[#EDEAF6]/50 uppercase leading-relaxed tracking-wide mt-1">
          Rancang latihan mingguan, lalu ketuk tombol <span className="text-[#7C5CFF] font-bold">Sync Alarm HP</span> di atas untuk mendaftarkannya pada kalender utama gawai secara permanen beserta notifikasi.
        </p>
      </div>

      {/* HORIZONTAL WEEK SELECTOR */}
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {DAYS.map(day => {
          const isActive = activeDay === day;
          const hasItems = (schedule[day]?.items?.length || 0) > 0;
          return (
            <button
              key={day}
              onClick={() => { setActiveDay(day); setIsEditing(false); }}
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

      {/* 🎯 FITUR REALISASI FOTO REFERENSI: BATTLE GRID AREA FOKUS OTOT */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] uppercase font-bold text-[#EDEAF6]/40 ml-1 tracking-widest">PILIH AREA FOKUS HARI {activeDay.toUpperCase()}:</span>
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_AREAS.map(area => {
            const isTarget = currentDayData.focus === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => handleSetFocusArea(area.id)}
                className={`group h-24 rounded-xl relative overflow-hidden text-left font-mono border transition-all duration-300 ${isTarget ? 'border-[#7C5CFF] shadow-[0_0_15px_rgba(124,92,255,0.3)] ring-1 ring-[#7C5CFF]' : 'border-[#211D2C] opacity-55 hover:opacity-85'}`}
              >
                {/* Visual Image Render */}
                <img src={area.img} alt={area.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {/* Manhwa System Shadow Layer Filter Overlay */}
                <div className={`absolute inset-0 transition-colors duration-300 ${isTarget ? 'bg-gradient-to-t from-[#0A0A0E] via-[#0A0A0E]/60 to-[#7C5CFF]/10' : 'bg-black/75'}`} />
                
                {/* Focus Metadata Display */}
                <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
                  {isTarget && <span className="text-[#7C5CFF] text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5"><Zap size={8} /> TARGET LOCK</span>}
                  <span className={`text-[9px] font-bold uppercase tracking-wide leading-tight ${isTarget ? 'text-white' : 'text-[#EDEAF6]/60'}`}>{area.name}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* LIST INTI SPESIFIK DETAIL GERAKAN */}
      <div className="bg-[#100E16] border border-[#211D2C] rounded-xl flex flex-col relative overflow-hidden shadow-md min-h-[220px] mt-1">
        <div className="bg-[#14121C] border-b border-[#211D2C] p-3 flex justify-between items-center">
          <span className="text-[#7C5CFF] font-black text-xs uppercase tracking-widest flex items-center gap-1">
            📋 DETIL AKTIVITAS
          </span>
          <span className="text-[9px] text-[#EDEAF6]/40 font-bold uppercase tracking-wider">{(currentDayData.items?.length || 0)} Rencana</span>
        </div>

        <div className="p-3.5 flex flex-col gap-2.5 flex-1">
          {(!currentDayData.items || currentDayData.items.length === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-[#EDEAF6]/30 uppercase text-center font-bold tracking-widest gap-1 py-10">
              <span>Slot Jadwal Kosong</span>
              <span className="text-[8px] font-normal text-gray-600">(Ketuk tombol tambah di bawah)</span>
            </div>
          ) : (
            currentDayData.items.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 bg-black/40 border border-[#211D2C] rounded-xl group hover:border-[#7C5CFF]/40 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[#7C5CFF] text-[10px] font-black w-4 text-center">#{idx + 1}</span>
                  <span className="text-[#EDEAF6] text-xs font-bold uppercase tracking-wide truncate">{item.text}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => handleDeleteItem(activeDay, item.id)}
                  className="text-[#EDEAF6]/20 hover:text-red-400 p-1.5 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}

          {/* DYNAMIC FORM ROW */}
          {isEditing ? (
            <form onSubmit={handleAddItem} className="mt-auto pt-2 flex gap-2 animate-in slide-in-from-bottom-2 duration-150">
              <input
                autoFocus
                type="text"
                placeholder="Misal: Squat 4 Set x 12 Reps / 80Kg"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="flex-1 bg-black border border-[#7C5CFF] text-white text-xs p-2.5 rounded-xl outline-none font-mono placeholder-[#EDEAF6]/20 focus:shadow-[0_0_10px_rgba(124,92,255,0.2)]"
                required
              />
              <button 
                type="submit" 
                className="bg-[#7C5CFF] text-white px-3.5 rounded-xl active:scale-95 transition-all shadow-[0_0_10px_rgba(124,92,255,0.4)] flex items-center justify-center"
              >
                <Check size={16} strokeWidth={3} />
              </button>
            </form>
          ) : (
            <button 
              type="button"
              onClick={() => setIsEditing(true)}
              className="mt-auto py-2.5 border border-dashed border-[#312C42] text-[#EDEAF6]/40 text-[10px] uppercase font-black tracking-widest rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#211D2C] hover:text-white transition-all active:scale-95"
            >
              <Plus size={13} /> Tambah Gerakan Baru
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

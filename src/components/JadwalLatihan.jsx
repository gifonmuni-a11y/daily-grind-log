import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, User, Zap, Activity, Shield, Target, TrendingUp, Save, Camera 
} from 'lucide-react';

const SYS_COLORS = {
  primary: "#7C5CFF",
  bg: "#100E16",
  panel: "#14121C",
  border: "#211D2C",
  borderActive: "#312C42",
  textMuted: "rgba(237, 234, 246, 0.4)",
  textBright: "#EDEAF6"
};

const CornerBrackets = () => (
  <>
    <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF] pointer-events-none z-10" />
    <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF] pointer-events-none z-10" />
  </>
);

function ProgressBar({ label, value, max, color, icon: Icon }) {
  const percentage = Math.min(value / (max / 100), 100);
  return (
    <div className="mb-4 relative">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#EDEAF6] flex items-center gap-1.5">
          <Icon size={12} style={{ color }} /> {label}
        </span>
        <span className="text-[10px] font-black" style={{ color }}>
          {value} <span className="text-[#EDEAF6]/40">/ {max}</span>
        </span>
      </div>
      <div className="h-2 w-full bg-black border border-[#211D2C] relative overflow-hidden">
        <div 
          className="h-full transition-all duration-1000 ease-out relative"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
        </div>
      </div>
    </div>
  );
}

export default function StatusWindow({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [syncedExp, setSyncedExp] = useState(0);
  const [avatar, setAvatar] = useState(null);
  
  const [playerData, setPlayerData] = useState({
    weightPR: 0,
    cardioMin: 0,
    bodyWeight: 0,
  });

  useEffect(() => {
    const savedSchedule = localStorage.getItem('dg_workout_schedule');
    let totalExpCalc = 0;
    if (savedSchedule) {
      try {
        const schedule = JSON.parse(savedSchedule);
        Object.values(schedule).forEach(day => {
          if (day.items && Array.isArray(day.items)) {
            let dailyVolume = 0;
            day.items.forEach(item => {
              const match = item.text.match(/(.+) \[\s{0,}(\d+)\s{0,}KG\s{0,}X\s{0,}(\d+)\s{0,}REPS\s{0,}\]/i);
              if (match) {
                dailyVolume += Math.imul(parseInt(match[2], 10), parseInt(match[3], 10));
              }
            });
            totalExpCalc += day.items.length > 0 ? Math.floor(Math.imul(day.items.length, 15) + (dailyVolume / 25)) : 0;
          }
        });
      } catch (e) { console.error(e); }
    }
    
    setSyncedExp(Math.imul(totalExpCalc, 4));

    const savedStats = localStorage.getItem('dg_player_status');
    if (savedStats) {
      try {
        setPlayerData(JSON.parse(savedStats));
      } catch (e) { console.error(e); }
    }

    const savedAvatar = localStorage.getItem('dg_status_avatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
    
    setIsLoading(false);
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatar(base64String);
        localStorage.setItem('dg_status_avatar', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStats = (e) => {
    e.preventDefault();
    localStorage.setItem('dg_player_status', JSON.stringify(playerData));
    
    const btn = document.getElementById('btn-save-stats');
    if(btn) {
      btn.innerText = "[ TERSIMPAN ]";
      btn.style.color = "#3FE6C4";
      setTimeout(() => {
        btn.innerText = "KALIBRASI SISTEM";
        btn.style.color = SYS_COLORS.primary;
      }, 2000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPlayerData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseInt(value, 10) || 0
    }));
  };

  const stats = useMemo(() => {
    const level = Math.floor(syncedExp / 500) + 1;
    const currentLevelExp = syncedExp % 500;
    
    const str = 10 + Math.floor((playerData.weightPR || 0) / 2.5);
    const agi = 10 + Math.floor((playerData.cardioMin || 0) / 3);
    
    let vitBonus = 0;
    if (playerData.bodyWeight > 0) {
      vitBonus = 5; 
    }
    const vit = 10 + Math.floor(level + (level / 2)) + vitBonus;

    let jobClass = "KANDIDAT PEMULA";
    if (level >= 15) jobClass = "MONARCH OF IRON";
    else if (level >= 10) jobClass = "VETERAN LIFTER";
    else if (level >= 5) jobClass = "AWAKENED HUNTER";

    return { level, currentLevelExp, str, agi, vit, jobClass };
  }, [syncedExp, playerData]);

  if (isLoading) return <div className="p-4 bg-[#100E16] h-screen animate-pulse" />;

  return (
    <div className="flex flex-col gap-5 font-mono animate-in fade-in duration-200 mt-2 mx-2 sm:mx-4 select-none pb-32">
      
      <div className="flex items-center justify-between bg-[#100E16] border border-[#211D2C] p-3 shadow-lg relative">
        <CornerBrackets />
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-[#211D2C] text-[#7C5CFF] active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[#7C5CFF] font-bold text-[10px] tracking-widest uppercase flex items-center gap-1">
              [INFORMASI PEMAIN]
            </span>
            <span className="font-display font-black text-sm text-white uppercase tracking-widest text-green-400">
              STATUS WINDOW (VERSI BARU)
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#100E16] border border-[#211D2C] p-5 shadow-lg relative flex flex-col items-center justify-center text-center">
        <CornerBrackets />
        
        <div className="w-24 h-24 border-2 border-[#7C5CFF] bg-[#14121C] mb-3 relative shadow-[0_0_15px_rgba(124,92,255,0.3)]">
          <CornerBrackets />
          {avatar ? (
            <img src={avatar} alt="Player Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#7C5CFF] gap-2">
              <User size={32} />
              <span className="text-[8px] tracking-widest uppercase font-bold">NO IMAGE</span>
            </div>
          )}
          
          {/* TOMBOL KAMERA PERMANENNYA DI SINI */}
          <label className="absolute -bottom-3 -right-3 bg-[#7C5CFF] border border-[#211D2C] p-2 cursor-pointer z-20 flex items-center justify-center shadow-[0_0_10px_rgba(124,92,255,0.5)] active:scale-95 transition-all">
            <Camera size={16} className="text-white" />
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </label>
        </div>
        
        <h2 className="text-white font-black text-xl tracking-widest uppercase">PLAYER</h2>
        <span className="text-[10px] text-[#3FE6C4] font-bold tracking-widest uppercase mt-1 px-3 py-1 bg-[#3FE6C4]/10 border border-[#3FE6C4]/30">
          CLASS: {stats.jobClass}
        </span>

        <div className="w-full mt-5 relative">
          <div className="flex justify-between items-end mb-1 px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7C5CFF]">LEVEL {stats.level}</span>
            <span className="text-[9px] font-black text-[#EDEAF6]/50">{stats.currentLevelExp} / 500 EXP</span>
          </div>
          <div className="h-1.5 w-full bg-black border border-[#211D2C] overflow-hidden">
            <div 
              className="h-full bg-[#7C5CFF] transition-all duration-1000"
              style={{ width: `${stats.currentLevelExp / 5}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-[#100E16] border border-[#211D2C] p-4 shadow-lg relative">
        <CornerBrackets />
        <span className="font-black text-[#7C5CFF] text-[10px] tracking-widest uppercase flex items-center gap-1.5 mb-4 border-b border-[#211D2C] pb-2">
          <Activity size={12} /> [ATRIBUT FISIK]
        </span>
        
        <ProgressBar label="STR (STRENGTH)" value={stats.str} max={100} color="#FF4D4D" icon={Zap} />
        <ProgressBar label="AGI (AGILITY)" value={stats.agi} max={100} color="#3FE6C4" icon={TrendingUp} />
        <ProgressBar label="VIT (VITALITY)" value={stats.vit} max={100} color="#7C5CFF" icon={Shield} />
      </div>

      <div className="bg-[#14121C] border border-[#312C42] p-4 shadow-lg relative">
        <CornerBrackets />
        <div className="flex justify-between items-center mb-4 border-b border-[#211D2C] pb-2">
          <span className="font-black text-white text-[10px] tracking-widest uppercase flex items-center gap-1.5">
            <Target size={12} className="text-[#7C5CFF]"/> [KALIBRASI REKOR]
          </span>
          <span className="text-[8px] text-[#EDEAF6]/40 uppercase tracking-widest">Update Manual</span>
        </div>

        <form onSubmit={handleSaveStats} className="flex flex-col gap-3">
          
          <div className="relative">
            <span className="text-[8px] font-black text-[#FF4D4D] uppercase tracking-widest mb-1.5 block">MAX ANGKATAN BEBAN (KG):</span>
            <div className="relative">
              <CornerBrackets />
              <input
                type="number"
                name="weightPR"
                value={playerData.weightPR || ''}
                onChange={handleInputChange}
                placeholder="Misal: 100"
                className="w-full bg-black border border-[#211D2C] focus:border-[#FF4D4D] text-white text-xs p-3.5 outline-none font-mono uppercase font-bold transition-colors"
              />
            </div>
            <p className="text-[7px] text-[#EDEAF6]/40 mt-1">[ INFO ] Meningkatkan Atribut STR</p>
          </div>

          <div className="relative">
            <span className="text-[8px] font-black text-[#3FE6C4] uppercase tracking-widest mb-1.5 block">REKOR KARDIO TERLAMA (MENIT):</span>
            <div className="relative">
              <CornerBrackets />
              <input
                type="number"
                name="cardioMin"
                value={playerData.cardioMin || ''}
                onChange={handleInputChange}
                placeholder="Misal: 30"
                className="w-full bg-black border border-[#211D2C] focus:border-[#3FE6C4] text-white text-xs p-3.5 outline-none font-mono uppercase font-bold transition-colors"
              />
            </div>
            <p className="text-[7px] text-[#EDEAF6]/40 mt-1">[ INFO ] Meningkatkan Atribut AGI</p>
          </div>

          <div className="relative">
            <span className="text-[8px] font-black text-[#7C5CFF] uppercase tracking-widest mb-1.5 block">BERAT BADAN SAAT INI (KG):</span>
            <div className="relative">
              <CornerBrackets />
              <input
                type="number"
                name="bodyWeight"
                value={playerData.bodyWeight || ''}
                onChange={handleInputChange}
                placeholder="Misal: 75"
                className="w-full bg-black border border-[#211D2C] focus:border-[#7C5CFF] text-white text-xs p-3.5 outline-none font-mono uppercase font-bold transition-colors"
              />
            </div>
            <p className="text-[7px] text-[#EDEAF6]/40 mt-1">[ INFO ] Meningkatkan Atribut VIT bersama dengan Level Karakter</p>
          </div>

          <button 
            type="submit" 
            id="btn-save-stats"
            className="w-full mt-4 py-3.5 bg-[#211D2C] text-[#7C5CFF] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 relative border border-[#312C42]"
          >
            <CornerBrackets />
            <Save size={14} /> KALIBRASI SISTEM
          </button>
        </form>
      </div>

    </div>
  );
}

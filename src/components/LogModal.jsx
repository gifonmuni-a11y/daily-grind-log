import React, { useState, useEffect } from 'react'
import { X, Loader2, Upload, ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function LogModal({ userId, maxDayNumber, editEntry, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [dayNumber, setDayNumber] = useState(maxDayNumber + 1)
  
  // Timezone aman dengan format en-CA (YYYY-MM-DD)
  const [entryDate, setEntryDate] = useState(() => new Date().toLocaleDateString('en-CA'))

  const [title, setTitle] = useState('')
  const [rank, setRank] = useState('B')
  const [category, setCategory] = useState('Push')
  const [customCategory, setCustomCategory] = useState('')
  const [note, setNote] = useState('')
  const [duration, setDuration] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const [showCategorySelector, setShowCategorySelector] = useState(false)
  
  // STATE CUSTOM RPG SYSTEM CALENDAR OVERLAY
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth()) // 0-11
  const [calendarViewMode, setCalendarViewMode] = useState('days') // 'days' atau 'years'

  const categories = [
    'Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body',
    'Chest', 'Back', 'Shoulders', 'Arms', 'Core/Abs', 'Glutes',
    'Cardio', 'HIIT', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
    'CrossFit', 'Functional', 'Mobility', 'Stretching', 'Yoga',
    'Boxing/Combat', 'Swimming', 'Running', 'Cycling', 'Sport-specific',
    'Recovery', 'Rest', '+ Lainnya'
  ];

  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const yearOptions = Array.from({ length: 16 }, (_, i) => 2020 + i);

  useEffect(() => {
    if (editEntry) {
      setDayNumber(editEntry.day_number)
      setEntryDate(editEntry.entry_date)
      setTitle(editEntry.title || '')
      setRank(editEntry.rank || 'B')
      setDuration(editEntry.duration || '')
      setNote(editEntry.note || editEntry.notes || '')
      setImageUrl(editEntry.image_url || '')
      
      if (categories.includes(editEntry.category)) {
        setCategory(editEntry.category)
        setCustomCategory('')
      } else {
        setCategory('+ Lainnya')
        setCustomCategory(editEntry.category || '')
      }

      if (editEntry.entry_date) {
        const parsedDate = new Date(editEntry.entry_date);
        if (!isNaN(parsedDate.getTime())) {
          setCalendarYear(parsedDate.getFullYear());
          setCalendarMonth(parsedDate.getMonth());
        }
      }
    }
  }, [editEntry])

  const getDisplayDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Pilih Tanggal';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const generateCalendarDays = () => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    
    const dayCells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      dayCells.push(day);
    }
    return dayCells;
  };

  const handleSelectDay = (day) => {
    if (!day) return;
    const mm = String(calendarMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setEntryDate(`${calendarYear}-${mm}-${dd}`);
    setShowDatePicker(false);
  };

  const changeMonth = (direction) => {
    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(prev => prev - 1);
      } else {
        setCalendarMonth(prev => prev - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(prev => prev + 1);
      } else {
        setCalendarMonth(prev => prev + 1);
      }
    }
  };

  // KUSTOM WARNA RANK KOTAK (D & E SEKARANG ABU-ABU)
  const getRankStyle = (r, isActive) => {
    if (!isActive) return { border: '1px solid #211D2C', color: '#8B8696', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '0px' }
    if (r === 'S') return { border: '1px solid #7C5CFF', color: '#7C5CFF', boxShadow: '0 0 10px rgba(124,92,255,0.4)', backgroundColor: 'rgba(124,92,255,0.1)', borderRadius: '0px' }
    if (r === 'A') return { border: '1px solid #2DD4BF', color: '#2DD4BF', boxShadow: '0 0 10px rgba(45,212,191,0.4)', backgroundColor: 'rgba(45,212,191,0.1)', borderRadius: '0px' }
    if (r === 'D' || r === 'E') return { border: '1px solid #6B7280', color: '#6B7280', boxShadow: '0 0 10px rgba(107, 114, 128, 0.4)', backgroundColor: 'rgba(107, 114, 128, 0.1)', borderRadius: '0px' }
    return { border: '1px solid #FFFFFF', color: '#FFFFFF', boxShadow: '0 0 10px rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0px' }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploadingImage(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    try {
      const bucketName = 'entry-images'
      const { data, error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(fileName)
      setImageUrl(publicData.publicUrl)
    } catch (err) {
      alert('Gagal upload foto: ' + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    const finalCategory = category === '+ Lainnya' ? customCategory : category;

    const payload = {
      user_id: userId,
      day_number: parseInt(dayNumber),
      entry_date: entryDate,
      title: title.trim(),
      rank,
      category: finalCategory,
      duration: duration.trim(),
      note: note.trim(),
      image_url: imageUrl.trim() !== '' ? imageUrl : null
    }

    try {
      if (editEntry) {
        await supabase.from('entries').update(payload).eq('id', editEntry.id)
      } else {
        await supabase.from('entries').insert([payload])
      }
      onSaved()
      onClose()
    } catch (err) {
      alert('Error simpan data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      
      {/* OUTER FRAME UTAMA: KOTAK LANCIP (rounded-none) STATIS TANPA SCROLL BIAR SIKU UNGU TERKUNCI MATI */}
      <div className="w-full max-w-md bg-[#100E16] border border-[#211D2C] rounded-none flex flex-col max-h-[88vh] relative border-box shadow-2xl overflow-hidden">
        
        {/* SIKU KUSTOM UNGU TEBAL [3px] TERKUNCI PERMANEN DI UJUNG TEPI BORDER LUAR */}
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-[3px] border-l-[3px] border-[#7C5CFF] z-50" />
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-[3px] border-r-[3px] border-[#7C5CFF] z-50" />
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-[3px] border-l-[3px] border-[#7C5CFF] z-50" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-[3px] border-r-[3px] border-[#7C5CFF] z-50" />

        {/* INNER CONTAINER SCROLL ZONE: Tempat scrolling form biar siku di atas gak ikut kegeret pas di-scroll */}
        <div className="w-full p-6 overflow-y-auto flex flex-col gap-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          <div className="flex justify-between items-center border-b border-[#211D2C]/60 pb-2">
            <h2 className="text-white font-display font-black text-sm uppercase tracking-wider">{editEntry ? 'EDIT SESI' : 'LOG SESI BARU'}</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs text-[#EDEAF6] pb-2">
            
            {/* INPUT DAY DAN TOMBOL TANGGAL */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-[#8B8696] tracking-wide font-mono">DAY #</label>
                <input type="number" value={dayNumber} onChange={(e) => setDayNumber(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded-none outline-none focus:border-[#7C5CFF] font-mono" required />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-[#8B8696] tracking-wide font-mono">TANGGAL</label>
                <button
                  type="button"
                  onClick={() => { setCalendarViewMode('days'); setShowDatePicker(true); }}
                  className="w-full bg-black border border-[#211D2C] p-2.5 text-white rounded-none font-mono flex items-center justify-between text-left text-xs focus:border-[#7C5CFF] outline-none hover:bg-black/80"
                >
                  <span className="truncate">{getDisplayDateLabel(entryDate)}</span>
                  <Calendar size={13} className="text-[#7C5CFF] flex-shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* CUSTOM POPUP KALENDER RPG SYSTEM OVERLAY DENGAN SIKU TEBAL 3PX */}
            {showDatePicker && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-100">
                <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-sm rounded-none p-4 flex flex-col gap-3 relative shadow-2xl">
                  
                  {/* SIKU TEBAL 3PX TERKUNCI PAS DI TEPIAN BOX KALENDER */}
                  <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-[3px] border-l-[3px] border-[#7C5CFF] z-45" />
                  <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-[3px] border-r-[3px] border-[#7C5CFF] z-45" />
                  <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-[3px] border-l-[3px] border-[#7C5CFF] z-45" />
                  <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-[3px] border-r-[3px] border-[#7C5CFF] z-45" />

                  {/* HEADER KALENDER: NAVIGASI BULAN & TOMBOL KLIK EDIT TAHUN INSTAN */}
                  <div className="flex justify-between items-center border-b border-[#211D2C] pb-2 text-xs">
                    <button type="button" onClick={() => { if(calendarViewMode==='years') setCalendarViewMode('days'); else changeMonth('prev'); }} className="p-1.5 hover:bg-[#211D2C] rounded-none text-[#7C5CFF] transition-colors"><ChevronLeft size={16} /></button>
                    
                    <div className="flex gap-1.5 font-display font-black uppercase tracking-wider items-center">
                      <button 
                        type="button" 
                        onClick={() => setCalendarViewMode('days')} 
                        className={`hover:text-[#7C5CFF] transition-colors ${calendarViewMode === 'days' ? 'text-white' : 'text-[#8B8696]'}`}
                      >
                        {indonesianMonths[calendarMonth]}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setCalendarViewMode(calendarViewMode === 'years' ? 'days' : 'years')} 
                        className="px-1.5 py-0.5 rounded-none border border-[#211D2C] bg-black/60 flex items-center gap-1 hover:border-[#7C5CFF] text-[#7C5CFF] transition-all font-mono"
                      >
                        <span>{calendarYear}</span>
                        <ChevronDown size={10} className="mt-0.5" />
                      </button>
                    </div>

                    <button type="button" onClick={() => { if(calendarViewMode==='years') setCalendarViewMode('days'); else changeMonth('next'); }} className="p-1.5 hover:bg-[#211D2C] rounded-none text-[#7C5CFF] transition-colors"><ChevronRight size={16} /></button>
                  </div>

                  {/* KONDISI TAMPILAN 1: GRID PILIHAN TAHUN TACTICAL */}
                  {calendarViewMode === 'years' ? (
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-[9px] uppercase text-[#8B8696] tracking-widest pl-1 block">Pilih Tahun Ekspedisi:</span>
                      <div className="grid grid-cols-4 gap-1.5 p-1 max-h-[180px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {yearOptions.map(yr => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => { setCalendarYear(yr); setCalendarViewMode('days'); }}
                            className={`py-2 rounded-none font-mono text-xs border text-center transition-all ${
                              calendarYear === yr 
                                ? 'bg-[#7C5CFF]/20 border-[#7C5CFF] text-white font-bold shadow-[0_0_8px_rgba(124,92,255,0.3)]' 
                                : 'bg-black/40 border-[#211D2C] text-[#EDEAF6]/60 hover:text-white hover:border-[#7C5CFF]'
                            }`}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* KONDISI TAMPILAN 2: GRID UTAMA HARI BULANAN */
                    <>
                      <div className="grid grid-cols-7 text-center font-mono text-[9px] font-bold text-[#8B8696] mb-1">
                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(dayName => (
                          <span key={dayName}>{dayName}</span>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                        {generateCalendarDays().map((day, idx) => {
                          if (!day) return <div key={idx} className="bg-transparent" />;

                          const mmStr = String(calendarMonth + 1).padStart(2, '0');
                          const ddStr = String(day).padStart(2, '0');
                          const cellDateStr = `${calendarYear}-${mmStr}-${ddStr}`;
                          
                          const isSelected = entryDate === cellDateStr;
                          const isToday = new Date().toLocaleDateString('en-CA') === cellDateStr;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectDay(day)}
                              className={`py-1.5 rounded-none text-center transition-all relative font-mono text-xs ${
                                isSelected 
                                  ? 'bg-[#7C5CFF] text-white font-bold shadow-[0_0_8px_rgba(124,92,255,0.4)]' 
                                  : isToday 
                                    ? 'bg-emerald-950/40 border-2 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_6px_rgba(16,185,129,0.2)]' 
                                    : 'text-[#EDEAF6] hover:bg-[#211D2C] hover:text-[#7C5CFF]'
                              } ${isSelected && isToday ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black' : ''}`}
                            >
                              <span>{day}</span>
                              {isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <button 
                    type="button" 
                    onClick={() => setShowDatePicker(false)} 
                    className="w-full py-2.5 bg-[#211D2C] border border-[#312C42] rounded-none font-mono text-[10px] text-white mt-1 uppercase tracking-wider font-bold"
                  >
                    Tutup Kalender
                  </button>
                </div>
              </div>
            )}

            {/* INPUT FIELD JUDUL SESI */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#8B8696] tracking-wide font-mono">JUDUL SESI *</label>
              <input type="text" placeholder="Contoh: Push Day — Chest Focus" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded-none outline-none focus:border-[#7C5CFF] font-mono" required />
            </div>

            {/* SELECTION GRID UNTUK RANK */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#8B8696] tracking-wide font-mono">RANK</label>
              <div className="grid grid-cols-6 gap-1.5">
                {['S', 'A', 'B', 'C', 'D', 'E'].map(r => (
                  <button key={r} type="button" onClick={() => setRank(r)} style={getRankStyle(r, rank === r)} className="py-2.5 font-bold text-xs transition-all rounded-none uppercase tracking-wider text-center font-mono">{r}</button>
                ))}
              </div>
            </div>

            {/* SELECTION OVERLAY UNTUK KATEGORI LENGKAP */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] uppercase text-[#8B8696] tracking-wide font-mono">KATEGORI</label>
              <button type="button" onClick={() => setShowCategorySelector(true)} className="w-full bg-black border border-[#211D2C] p-2.5 text-white rounded-none font-mono flex items-center justify-between text-left text-xs focus:border-[#7C5CFF] outline-none">
                <span>{category === '+ Lainnya' ? (customCategory || '+ Lainnya') : category}</span>
                <ChevronDown size={14} className="text-[#7C5CFF]" />
              </button>

              {showCategorySelector && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs rounded-none p-4 flex flex-col gap-3 max-h-[70vh] relative">
                    <div className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t-2 border-l-2 border-[#7C5CFF] z-45" />
                    <div className="absolute -top-[1px] -right-[1px] w-2.5 h-2.5 border-t-2 border-r-2 border-[#7C5CFF] z-45" />
                    <div className="absolute -bottom-[1px] -left-[1px] w-2.5 h-2.5 border-b-2 border-l-2 border-[#7C5CFF] z-45" />
                    <div className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b-2 border-r-2 border-[#7C5CFF] z-45" />

                    <span className="font-mono text-xs uppercase font-black text-white border-b border-[#211D2C] pb-2 tracking-wider">PILIH KATEGORI</span>
                    <div className="overflow-y-auto flex flex-col gap-1 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {categories.map(cat => (
                        <button key={cat} type="button" onClick={() => { setCategory(cat); if(cat !== '+ Lainnya') setShowCategorySelector(false); }} className={`w-full p-2.5 rounded-none text-left text-xs font-mono border transition-all ${category === cat ? 'bg-[#7C5CFF]/20 border-[#7C5CFF] text-white' : 'bg-black/50 border-transparent text-[#EDEAF6]/60 hover:text-white'}`}>{cat}</button>
                      ))}
                    </div>
                    {category === '+ Lainnya' && (
                      <input autoFocus type="text" placeholder="Ketik kategori baru..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full bg-black border border-[#7C5CFF] p-2.5 text-white rounded-none text-xs mt-2 outline-none font-mono" />
                    )}
                    <button type="button" onClick={() => setShowCategorySelector(false)} className="w-full py-2.5 bg-[#211D2C] border border-[#312C42] rounded-none font-mono text-[10px] text-white font-bold uppercase mt-2">Selesai</button>
                  </div>
                </div>
              )}
            </div>

            {/* INPUT DURASI */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#8B8696] tracking-wide font-mono">DURASI</label>
              <input type="text" placeholder="Contoh: 1h 30m" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded-none outline-none focus:border-[#7C5CFF] font-mono" />
            </div>

            {/* INPUT TEXTAREA CATATAN GRINDING */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#8B8696] tracking-wide font-mono">CATATAN</label>
              <textarea placeholder="PR baru, perasaan saat latihan, dll..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded-none outline-none focus:border-[#7C5CFF] font-mono" rows="3" />
            </div>

            {/* ZONE UPLOAD GAMBAR DAN PREVIEW */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#8B8696] tracking-wide font-mono">FOTO / ILUSTRASI</label>
              <div className="flex items-center justify-center border border-dashed border-[#211D2C] p-4 bg-black/40 rounded-none relative min-h-[90px] transition-all hover:bg-black/60">
                {imageUrl ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <img src={imageUrl} className="max-h-24 object-contain rounded-none border border-[#211D2C]" alt="preview" />
                    <button type="button" onClick={() => setImageUrl('')} className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1 font-mono">Hapus Foto</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-1.5 cursor-pointer text-[#8B8696] w-full py-2 justify-center font-mono">
                    {uploadingImage ? <Loader2 size={16} className="animate-spin text-[#7C5CFF]" /> : <Upload size={16} />}
                    <span className="text-[10px] uppercase font-bold tracking-wider">{uploadingImage ? 'Uploading...' : 'Upload foto'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploadingImage} />
                  </label>
                )}
              </div>
            </div>

            {/* ACTION TOMBOL BATAL & SIMPAN */}
            <div className="grid grid-cols-2 gap-3 mt-3 font-mono">
              <button type="button" onClick={onClose} className="py-3 bg-transparent border border-[#211D2C] text-[#EDEAF6] rounded-none hover:bg-[#211D2C] transition-colors uppercase tracking-wider font-bold">Batal</button>
              <button type="submit" disabled={loading || uploadingImage} className="py-3 bg-[#7C5CFF] text-white font-black rounded-none hover:bg-[#6b52e0] transition-colors uppercase tracking-wider shadow-lg flex items-center justify-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />} SIMPAN SESI
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

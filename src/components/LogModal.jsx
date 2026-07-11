import React, { useState, useEffect } from 'react'
import { X, Loader2, Upload, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function LogModal({ userId, maxDayNumber, editEntry, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [dayNumber, setDayNumber] = useState(maxDayNumber + 1)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState('')
  const [rank, setRank] = useState('B')
  const [category, setCategory] = useState('Push')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const [showCategorySelector, setShowCategorySelector] = useState(false)

  const categories = [
    'Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body',
    'Chest', 'Back', 'Shoulders', 'Arms', 'Core/Abs', 'Glutes',
    'Cardio', 'HIIT', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
    'CrossFit', 'Functional', 'Mobility', 'Stretching', 'Yoga',
    'Boxing/Combat', 'Swimming', 'Running', 'Cycling', 'Sport-specific',
    'Recovery', 'Rest', '+ Lainnya'
  ];

  useEffect(() => {
    if (editEntry) {
      setDayNumber(editEntry.day_number)
      setEntryDate(editEntry.entry_date)
      setTitle(editEntry.title || '')
      setRank(editEntry.rank || 'B')
      setCategory(editEntry.category || 'Push')
      setDuration(editEntry.duration || '')
      setNotes(editEntry.notes || '')
      setImageUrl(editEntry.image_url || '')
    }
  }, [editEntry])

  const getRankStyle = (r, isActive) => {
    if (!isActive) return { border: '1px solid #211D2C', color: '#8B8696', backgroundColor: 'rgba(0,0,0,0.4)' }
    if (r === 'S') return { border: '1px solid #7C5CFF', color: '#7C5CFF', boxShadow: '0 0 10px rgba(124,92,255,0.4)', backgroundColor: 'rgba(124,92,255,0.1)' }
    if (r === 'A') return { border: '1px solid #2DD4BF', color: '#2DD4BF', boxShadow: '0 0 10px rgba(45,212,191,0.4)', backgroundColor: 'rgba(45,212,191,0.1)' }
    return { border: '1px solid #FFFFFF', color: '#FFFFFF', boxShadow: '0 0 10px rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)' }
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

    const payload = {
      user_id: userId,
      day_number: parseInt(dayNumber),
      entry_date: entryDate,
      title: title.trim(),
      rank,
      category,
      duration: duration.trim(),
      notes: notes.trim(),
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
    <div className="fixed inset-0 z-50 bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#100E16] border-t sm:border border-[#211D2C] p-6 rounded-t-2xl sm:rounded-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-[#211D2C]/60 pb-2">
          <h2 className="text-white font-display font-black text-sm uppercase tracking-wider">{editEntry ? 'EDIT SESI' : 'LOG SESI BARU'}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs text-[#EDEAF6]">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#8B8696] tracking-wide">DAY #</label>
              <input type="number" value={dayNumber} onChange={(e) => setDayNumber(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded-lg outline-none focus:border-[#7C5CFF]" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#8B8696] tracking-wide">TANGGAL</label>
              <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded-lg outline-none focus:border-[#7C5CFF]" required />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-[#8B8696] tracking-wide">JUDUL SESI *</label>
            <input type="text" placeholder="Contoh: Push Day — Chest Focus" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded-lg outline-none focus:border-[#7C5CFF]" required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-[#8B8696] tracking-wide">RANK</label>
            <div className="grid grid-cols-6 gap-1.5">
              {['S', 'A', 'B', 'C', 'D', 'E'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRank(r)}
                  style={getRankStyle(r, rank === r)}
                  className="py-2.5 font-bold text-xs transition-all rounded-md uppercase tracking-wider text-center"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 relative">
            <label className="text-[10px] uppercase text-[#8B8696] tracking-wide">KATEGORI</label>
            <button
              type="button"
              onClick={() => setShowCategorySelector(true)}
              className="w-full bg-black border border-[#211D2C] p-2.5 text-white rounded-lg font-mono flex items-center justify-between text-left text-xs focus:border-[#7C5CFF] outline-none"
            >
              <span>{category}</span>
              <ChevronDown size={14} className="text-[#7C5CFF]" />
            </button>

            {showCategorySelector && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs rounded-xl p-4 flex flex-col gap-3 max-h-[70vh]">
                  <span className="font-mono text-xs uppercase font-black text-white border-b border-[#211D2C] pb-2 tracking-wider">PILIH KATEGORI GRIND</span>
                  <div className="overflow-y-auto flex flex-col gap-1 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#7C5CFF #0A0A0E' }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setCategory(cat); setShowCategorySelector(false); }}
                        className={`w-full p-2.5 rounded-lg text-left text-xs font-mono border transition-all ${category === cat ? 'bg-[#7C5CFF]/20 border-[#7C5CFF] text-white' : 'bg-black/50 border-transparent text-[#EDEAF6]/60 hover:text-white'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setShowCategorySelector(false)} className="w-full py-2.5 bg-[#211D2C] border border-[#312C42] rounded-lg font-mono text-[10px] text-white font-bold uppercase">Batal</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-[#8B8696] tracking-wide">DURASI</label>
            <input type="text" placeholder="Contoh: 1h 30m" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded-lg outline-none focus:border-[#7C5CFF]" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-[#8B8696] tracking-wide">CATATAN</label>
            <textarea placeholder="PR baru, perasaan saat latihan, dll..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded-lg outline-none focus:border-[#7C5CFF]" rows="3" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-[#8B8696] tracking-wide">FOTO / ILUSTRASI</label>
            <div className="flex items-center justify-center border border-dashed border-[#211D2C] p-4 bg-black/40 rounded-xl relative min-h-[90px] transition-all hover:bg-black/60">
              {imageUrl ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <img src={imageUrl} className="max-h-24 object-contain rounded-lg border border-[#211D2C]" alt="preview" />
                  <button type="button" onClick={() => setImageUrl('')} className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">Hapus Foto</button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-1.5 cursor-pointer text-[#8B8696] w-full py-2 justify-center">
                  {uploadingImage ? <Loader2 size={16} className="animate-spin text-[#7C5CFF]" /> : <Upload size={16} />}
                  <span className="text-[10px] uppercase font-bold tracking-wider">{uploadingImage ? 'Uploading...' : 'Upload foto'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploadingImage} />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3 font-mono">
            <button type="button" onClick={onClose} className="py-3 bg-transparent border border-[#211D2C] text-[#EDEAF6] rounded-lg hover:bg-[#211D2C] transition-colors uppercase tracking-wider font-bold">
              Batal
            </button>
            <button type="submit" disabled={loading || uploadingImage} className="py-3 bg-[#7C5CFF] text-white font-black rounded-lg hover:bg-[#6b52e0] transition-colors uppercase tracking-wider shadow-lg flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              SIMPAN SESI
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { X, Loader2, Camera } from 'lucide-react'
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

  // 🎯 DAFTAR 31 KATEGORI ASLI LU DARI SCREENSHOT (100% FIX & URUT)
  const categories = [
    'Push',
    'Pull',
    'Legs',
    'Upper Body',
    'Lower Body',
    'Full Body',
    'Chest',
    'Back',
    'Shoulders',
    'Arms',
    'Core/Abs',
    'Glutes',
    'Cardio',
    'HIIT',
    'Calisthenics',
    'Powerlifting',
    'Olympic Lifting',
    'CrossFit',
    'Functional',
    'Mobility',
    'Stretching',
    'Yoga',
    'Boxing/Combat',
    'Swimming',
    'Running',
    'Cycling',
    'Sport-specific',
    'Recovery',
    'Rest',
    '+ Lainnya'
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploadingImage(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage.from('grind-images').upload(fileName, file)
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage.from('grind-images').getPublicUrl(fileName)
      setImageUrl(data.publicUrl)
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
      image_url: imageUrl
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#100E16] border border-[#211D2C] p-5 rounded-xl shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-[#211D2C] pb-2">
          <h2 className="text-white font-bold text-sm uppercase">{editEntry ? 'Edit Sesi' : 'Log Sesi Baru'}</h2>
          <button onClick={onClose} className="text-gray-500"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 font-mono text-xs text-[#EDEAF6]">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-text-dim">Day #</label>
              <input type="number" value={dayNumber} onChange={(e) => setDayNumber(e.target.value)} className="bg-black border border-[#211D2C] p-2 text-white rounded text-sm outline-none" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-text-dim">Tanggal</label>
              <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="bg-black border border-[#211D2C] p-2 text-white rounded text-sm outline-none" required />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-text-dim">Judul Gerakan</label>
            <input type="text" placeholder="Nama latihan..." value={title} onChange={(e) => setTitle(e.target.value)} className="bg-black border border-[#211D2C] p-2 text-white rounded text-sm outline-none" required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-text-dim">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 text-white rounded text-sm outline-none cursor-pointer">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-text-dim">Rank</label>
            <div className="flex gap-1">
              {['S', 'A', 'B', 'C', 'D', 'E'].map(r => (
                <button key={r} type="button" onClick={() => setRank(r)} className={`flex-1 py-2 border text-xs font-bold transition-all rounded ${rank === r ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white' : 'bg-black border-[#211D2C] text-gray-400'}`}>{r}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-text-dim">Durasi</label>
            <input type="text" placeholder="Contoh: 1h 30m" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-black border border-[#211D2C] p-2 text-white rounded text-sm outline-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-text-dim">Catatan</label>
            <textarea placeholder="PR baru, perasaan saat latihan, dll..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-black border border-[#211D2C] p-2 text-white rounded text-sm outline-none" rows="3" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase text-text-dim">Foto / Ilustrasi</label>
            <div className="flex items-center justify-center border border-dashed border-[#211D2C] p-4 bg-black/40 rounded-xl relative min-h-[80px]">
              {imageUrl ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <img src={imageUrl} className="max-h-24 object-contain rounded" alt="preview" />
                  <button type="button" onClick={() => setImageUrl('')} className="text-[10px] text-red-400 font-bold">Hapus Foto</button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-1 cursor-pointer text-text-dim">
                  {uploadingImage ? <Loader2 size={16} className="animate-spin text-[#7C5CFF]" /> : <Camera size={16} />}
                  <span className="text-[10px] uppercase font-bold">{uploadingImage ? 'Uploading...' : 'Upload foto'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploadingImage} />
                </label>
              )}
            </div>
          </div>

          <button type="submit" disabled={loading} className="bg-[#7C5CFF] text-white p-2.5 rounded font-bold text-sm mt-2 transition-all active:scale-[0.98]">
            {loading ? 'Menyimpan...' : 'SIMPAN SESI'}
          </button>
        </form>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { X, Loader2, Camera, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import SystemFrame from './SystemFrame'

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
    } else {
      setDayNumber(maxDayNumber + 1)
      setEntryDate(new Date().toISOString().split('T')[0])
      setTitle('')
      setRank('B')
      setCategory('Push')
      setDuration('')
      setNotes('')
      setImageUrl('')
    }
  }, [editEntry, maxDayNumber])

  // 🎯 CORE ENGINE CROP 1:1 FOTO OTOMATIS BERBASIS DATA CANVAS BLOB COMPRESSION
  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImage(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const sideLen = Math.min(img.width, img.height)
        canvas.width = 600
        canvas.height = 600
        const ctx = canvas.getContext('2d')
        
        // Pangkas tengah kotak rasio 1:1
        const sx = (img.width - sideLen) / 2
        const sy = (img.height - sideLen) / 2
        ctx.drawImage(img, sx, sy, sideLen, sideLen, 0, 0, 600, 600)

        canvas.toBlob(async (blob) => {
          const fileName = `${userId}/${Date.now()}_cropped.png`
          const { data, error } = await supabase.storage.from('grind-images').upload(fileName, blob, { contentType: 'image/png' })
          if (!error && data) {
            const { data: publicData } = supabase.storage.from('grind-images').getPublicUrl(fileName)
            setImageUrl(publicData.publicUrl)
          }
          setUploadingImage(false)
        }, 'image/png', 0.85)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
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

    let error
    if (editEntry) {
      const { error: err } = await supabase.from('entries').update(payload).eq('id', editEntry.id)
      error = err
    } else {
      const { error: err } = await supabase.from('entries').insert([payload])
      error = err
    }

    setLoading(false)
    if (!error) { onSaved(); onClose(); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#100E16] border-t sm:border border-[#211D2C] p-5 rounded-t-2xl sm:rounded-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#211D2C] pb-3">
          <span className="font-display font-black text-sm uppercase text-white tracking-widest">{editEntry ? 'Modifikasi Log Latihan' : 'Log Sesi Baru'}</span>
          <button onClick={onClose} className="p-1 hover:bg-[#211D2C] rounded-lg text-text-dim hover:text-white"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs text-[#EDEAF6]">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-text-dim">Day #</label><input type="number" required value={dayNumber} onChange={(e) => setDayNumber(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 rounded-lg" /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-text-dim">Tanggal</label><input type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 rounded-lg" /></div>
          </div>

          <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-text-dim">Judul Gerakan</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Chest Press & Squat Hypertrophy" className="bg-black border border-[#211D2C] p-2.5 rounded-lg" /></div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-text-dim">Rank</label>
            <div className="grid grid-cols-6 gap-1.5">
              {['S', 'A', 'B', 'C', 'D', 'E'].map(r => (
                <button key={r} type="button" onClick={() => setRank(r)} className={`py-2.5 font-bold border transition-all rounded-md ${rank === r ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white' : 'bg-black/40 border-[#211D2C] text-text-dim'}`}>{r}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-text-dim">Kategori</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-black border border-[#211D2C] p-2.5 rounded-lg"><option value="Push">Push</option><option value="Pull">Pull</option><option value="Legs">Legs</option><option value="Arms">Arms</option><option value="Core">Core</option><option value="Cardio">Cardio</option><option value="Rest">Rest</option></select></div>

          <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-text-dim">Durasi</label><input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Contoh: 1 jam 15 menit" className="bg-black border border-[#211D2C] p-2.5 rounded-lg" /></div>

          <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-text-dim">Catatan</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tulis rincian beban, repetisi, atau evaluasi core..." rows="3" className="bg-black border border-[#211D2C] p-2.5 rounded-lg" /></div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase text-text-dim">Foto Bukti Fisik (1:1 Auto-Crop)</label>
            <div className="flex items-center justify-center border border-dashed border-[#211D2C] p-4 bg-black/40 rounded-xl relative">
              {imageUrl ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <img src={imageUrl} className="w-24 h-24 object-cover rounded-lg border border-[#211D2C]" alt="Preview" />
                  <button type="button" onClick={() => setImageUrl('')} className="text-[10px] text-red-400 font-bold">Hapus Foto</button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-1.5 cursor-pointer text-text-dim py-2">
                  {uploadingImage ? <Loader2 size={20} className="animate-spin text-[#7C5CFF]" /> : <Camera size={20} />}
                  <span className="text-[10px] tracking-wide font-bold uppercase">{uploadingImage ? 'Sedang Memotong...' : 'Upload & Crop Foto'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploadingImage} />
                </label>
              )}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#7C5CFF] text-white font-display font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2 flex items-center justify-center gap-1.5">{loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {editEntry ? 'Simpan Perubahan' : 'Eksekusi Sesi'}</button>
        </form>
      </div>
    </div>
  )
}

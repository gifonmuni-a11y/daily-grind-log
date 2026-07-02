import { useState, useRef } from 'react'
import { X, Upload, Loader2, ChevronDown } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { supabase } from '../lib/supabaseClient'
import { getRankColor } from '../lib/rankColors'

const RANKS = ['S', 'A', 'B', 'C', 'D', 'E']
const RANK_LABELS = { S: 'Legendary', A: 'Excellent', B: 'Good', C: 'Average', D: 'Poor', E: 'Failed' }

const CATEGORIES = [
  'Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body',
  'Chest', 'Back', 'Shoulders', 'Arms', 'Core/Abs', 'Glutes',
  'Cardio', 'HIIT', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
  'CrossFit', 'Functional', 'Mobility', 'Stretching', 'Yoga',
  'Boxing/Combat', 'Swimming', 'Running', 'Cycling', 'Sport-specific',
  'Recovery', 'Rest', '+ Lainnya'
]

export default function LogModal({ userId, maxDayNumber, editEntry, onClose, onSaved }) {
  const isEdit = !!editEntry
  const [form, setForm] = useState({
    title: editEntry?.title || '',
    note: editEntry?.note || '',
    duration: editEntry?.duration || '',
    rank: editEntry?.rank || 'B',
    category: editEntry?.category || 'Push',
    day_number: editEntry?.day_number ?? (maxDayNumber + 1),
    entry_date: editEntry?.entry_date
      ? new Date(editEntry.entry_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  })
  const [customCategory, setCustomCategory] = useState(
    CATEGORIES.includes(editEntry?.category) ? '' : (editEntry?.category || '')
  )
  const [showCustomInput, setShowCustomInput] = useState(
    !CATEGORIES.includes(editEntry?.category || 'Push')
  )
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(editEntry?.image_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleCategoryChange(val) {
    if (val === '+ Lainnya') {
      setShowCustomInput(true)
      set('category', customCategory || '')
    } else {
      setShowCustomInput(false)
      setCustomCategory('')
      set('category', val)
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Judul wajib diisi.'); return }
    const finalCategory = showCustomInput ? customCategory.trim() : form.category
    if (!finalCategory) { setError('Kategori wajib diisi.'); return }
    setLoading(true)
    setError('')

    let imageUrl = editEntry?.image_url || null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filePath = `${userId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('entry-images')
        .upload(filePath, imageFile, { upsert: true })

      if (uploadErr) {
        setError('Gagal upload gambar: ' + uploadErr.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('entry-images').getPublicUrl(filePath)
      imageUrl = urlData.publicUrl
    }

    const payload = {
      user_id: userId,
      title: form.title.trim(),
      note: form.note.trim() || null,
      duration: form.duration.trim() || null,
      rank: form.rank,
      category: finalCategory,
      day_number: Number(form.day_number),
      entry_date: new Date(form.entry_date).toISOString(),
      image_url: imageUrl,
    }

    let dbError
    if (isEdit) {
      const { error: err } = await supabase
        .from('entries')
        .update(payload)
        .eq('id', editEntry.id)
      dbError = err
    } else {
      const { error: err } = await supabase
        .from('entries')
        .insert(payload)
      dbError = err
    }

    setLoading(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      onSaved()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,10,14,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <SystemFrame
        className="bg-panel w-full max-w-lg max-h-[90vh] overflow-y-auto"
        size={16}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #211D2C' }}
        >
          <h2 className="font-display font-bold text-xl text-text-high">
            {isEdit ? 'EDIT ENTRY' : 'LOG SESI BARU'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-border-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Day #">
              <input
                type="number"
                min="1"
                value={form.day_number}
                onChange={e => set('day_number', e.target.value)}
                className="input-base"
              />
            </Field>
            <Field label="Tanggal">
              <input
                type="date"
                value={form.entry_date}
                onChange={e => set('entry_date', e.target.value)}
                className="input-base"
              />
            </Field>
          </div>

          <Field label="Judul Sesi *">
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Contoh: Push Day — Chest Focus"
              className="input-base"
              required
            />
          </Field>

          <Field label="Rank">
            <div className="flex gap-2">
              {RANKS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('rank', r)}
                  className="flex-1 py-2 font-display font-bold transition-all"
                  style={{
                    background: form.rank === r ? getRankColor(r, true) + '33' : 'transparent',
                    border: `1px solid ${form.rank === r ? getRankColor(r, true) : '#211D2C'}`,
                    color: form.rank === r ? getRankColor(r, true) : '#9CA3AF',
                  }}
                  title={RANK_LABELS[r]}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="font-mono text-xs text-text-dim mt-1">{RANK_LABELS[form.rank]}</p>
          </Field>

          <Field label="Kategori">
            <div className="relative">
              <select
                value={showCustomInput ? '+ Lainnya' : form.category}
                onChange={e => handleCategoryChange(e.target.value)}
                className="input-base pr-8 appearance-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
              />
            </div>
            {showCustomInput && (
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="Tulis kategori kustom..."
                className="input-base mt-2"
              />
            )}
          </Field>

          <Field label="Durasi">
            <input
              type="text"
              value={form.duration}
              onChange={e => set('duration', e.target.value)}
              placeholder="Contoh: 1h 30m"
              className="input-base"
            />
          </Field>

          <Field label="Catatan">
            <textarea
              value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="PR baru, perasaan saat latihan, dll..."
              rows={3}
              className="input-base resize-none"
            />
          </Field>

          <Field label="Foto / Ilustrasi">
            {imagePreview && (
              <div className="relative mb-2">
                <img src={imagePreview} alt="preview" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageFile(null) }}
                  className="absolute top-2 right-2 p-1 bg-background"
                >
                  <X size={14} className="text-danger" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full py-2.5 font-mono text-xs text-text-dim flex items-center justify-center gap-2 transition-colors hover:bg-border-hover"
              style={{ border: '1px dashed #211D2C' }}
            >
              <Upload size={14} />
              {imagePreview ? 'Ganti foto' : 'Upload foto'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </Field>

          {error && (
            <p className="font-mono text-xs text-danger">{error}</p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-mono text-sm text-text-muted transition-colors hover:bg-border-hover"
              style={{ border: '1px solid #211D2C' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 font-display font-semibold text-lg tracking-wider flex items-center justify-center gap-2"
              style={{
                background: loading ? '#3A3548' : '#7C5CFF',
                color: '#EDEAF6',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'MENYIMPAN...' : (isEdit ? 'SIMPAN PERUBAHAN' : 'SIMPAN SESI')}
            </button>
          </div>
        </form>
      </SystemFrame>

      <style>{`
        .input-base {
          width: 100%;
          background: #0A0A0E;
          border: 1px solid #211D2C;
          color: #EDEAF6;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          padding: 8px 12px;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-base:focus { border-color: #7C5CFF; }
        .input-base::placeholder { color: #5C5868; }
        .input-base option { background: #100E16; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
      `}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

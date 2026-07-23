import { useState, useRef } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { supabase } from '../lib/supabaseClient'

export default function ProfileEditModal({ profile, userId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    spotify_link: profile?.spotify_link || '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(profile?.banner_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const avatarRef = useRef()
  const bannerRef = useRef()

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleBannerChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  async function uploadImage(file, path) {
    const { error: err } = await supabase.storage
      .from('profile-images')
      .upload(path, file, { upsert: true })
    if (err) throw err
    const { data } = supabase.storage.from('profile-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama wajib diisi.'); return }
    setLoading(true)
    setError('')

    try {
      let avatarUrl = profile?.avatar_url || null
      let bannerUrl = profile?.banner_url || null
      
      // 🎯 SENJATA ANTI-CACHE: Bikin timestamp acak berdasarkan waktu saat ini
      const timestamp = new Date().getTime()

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const rawUrl = await uploadImage(avatarFile, `${userId}/avatar.${ext}`)
        // 🎯 FIX: Tempelkan timestamp ke URL agar browser selalu me-refresh foto baru
        avatarUrl = `${rawUrl}?t=${timestamp}`
      }

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop()
        const rawUrl = await uploadImage(bannerFile, `${userId}/banner.${ext}`)
        // 🎯 FIX: Tempelkan timestamp ke URL agar browser selalu me-refresh foto baru
        bannerUrl = `${rawUrl}?t=${timestamp}`
      }

      const { error: dbErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: form.name.trim(),
          bio: form.bio.trim() || null,
          spotify_link: form.spotify_link.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        })

      if (dbErr) throw dbErr
      
      // onSaved() akan otomatis me-refresh data profil di PWA lu dengan URL yang baru
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,14,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <SystemFrame className="bg-panel w-full max-w-lg max-h-[90vh] overflow-y-auto" size={16}>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #211D2C' }}
        >
          <h2 className="font-display font-bold text-xl text-text-high">EDIT PROFIL</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-border-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
              Banner
            </label>
            <div
              className="w-full h-24 relative overflow-hidden cursor-pointer"
              style={{ border: '1px dashed #211D2C' }}
              onClick={() => bannerRef.current?.click()}
            >
              {bannerPreview ? (
                <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center gap-2 text-text-dim">
                  <Upload size={16} />
                  <span className="font-mono text-xs">Upload banner</span>
                </div>
              )}
            </div>
            <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          </div>

          <div>
            <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
              Avatar
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 relative overflow-hidden cursor-pointer shrink-0"
                style={{ border: '2px solid #7C5CFF' }}
                onClick={() => avatarRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-display font-bold text-2xl text-accent"
                    style={{ background: '#7C5CFF22' }}
                  >
                    {(form.name || 'T')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="font-mono text-xs text-text-dim hover:text-text-muted transition-colors flex items-center gap-1"
              >
                <Upload size={12} />
                Ganti avatar
              </button>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          <Field label="Nama *">
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Nama Trainer"
              className="pe-input"
              required
            />
          </Field>

          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Ceritakan journey kamu..."
              rows={2}
              className="pe-input resize-none"
            />
          </Field>

          <Field label="Spotify Playlist Link">
            <input
              type="url"
              value={form.spotify_link}
              onChange={e => set('spotify_link', e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="pe-input"
            />
          </Field>

          {error && <p className="font-mono text-xs text-danger">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-mono text-sm text-text-muted hover:bg-border-hover transition-colors"
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
              {loading ? 'MENYIMPAN...' : 'SIMPAN PROFIL'}
            </button>
          </div>
        </form>
      </SystemFrame>

      <style>{`
        .pe-input {
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
        .pe-input:focus { border-color: #7C5CFF; }
        .pe-input::placeholder { color: #5C5868; }
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

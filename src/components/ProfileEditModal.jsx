import { useState, useRef } from 'react'
import { X, Upload, Loader2, Move, ZoomIn } from 'lucide-react'
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
  
  // Menggunakan fallback nilai jika kolom dari DB masih kosong
  const [avatarZoom, setAvatarZoom] = useState(profile?.avatar_zoom ?? 100)
  const [avatarOffset, setAvatarOffset] = useState(profile?.avatar_offset ?? 0)
  const [bannerZoom, setBannerZoom] = useState(profile?.banner_zoom ?? 100)
  const [bannerOffset, setBannerOffset] = useState(profile?.banner_offset ?? 0)

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
    setAvatarZoom(100)
    setAvatarOffset(0)
  }

  function handleBannerChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
    setBannerZoom(100)
    setBannerOffset(0)
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

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        avatarUrl = await uploadImage(avatarFile, `${userId}/avatar.${ext}`)
      }

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop()
        bannerUrl = await uploadImage(bannerFile, `${userId}/banner.${ext}`)
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
          avatar_zoom: Number(avatarZoom) || 100,
          avatar_offset: Number(avatarOffset) || 0,
          banner_zoom: Number(bannerZoom) || 100,
          banner_offset: Number(bannerOffset) || 0,
        })

      if (dbErr) throw dbErr
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,10,14,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <SystemFrame className="bg-panel w-full max-w-lg max-h-[90vh] overflow-y-auto" size={16}>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #211D2C' }}
        >
          <h2 className="font-display font-bold text-xl text-text-high">EDIT PROFIL</h2>
          <button onClick={onClose} className="p-1 hover:bg-border-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
              Banner Latar
            </label>
            <div
              className="w-full h-28 relative overflow-hidden cursor-pointer bg-black/40"
              style={{ border: '1px dashed #211D2C' }}
              onClick={() => bannerRef.current?.click()}
            >
              {bannerPreview ? (
                <img 
                  src={bannerPreview} 
                  alt="banner" 
                  className="w-full h-full pointer-events-none select-none" 
                  style={{
                    objectFit: 'cover',
                    transform: `scale(${(bannerZoom || 100) / 100}) translateY(${bannerOffset || 0}px)`,
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center gap-2 text-text-dim">
                  <Upload size={16} />
                  <span className="font-mono text-xs">Upload banner</span>
                </div>
              )}
            </div>
            
            {bannerPreview && (
              <div className="mt-2 p-2 bg-[#0A0A0E] border border-[#211D2C] flex flex-col gap-2 rounded-sm">
                <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
                  <ZoomIn size={12} className="text-accent" />
                  <span>ZOOM: {bannerZoom}%</span>
                  <input 
                    type="range" min="100" max="250" 
                    value={bannerZoom} 
                    onChange={e => setBannerZoom(e.target.value)} 
                    className="flex-1 accent-[#7C5CFF] h-1 bg-border"
                  />
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
                  <Move size={12} className="text-accent" />
                  <span>VERTIKAL: {bannerOffset}px</span>
                  <input 
                    type="range" min="-100" max="100" 
                    value={bannerOffset} 
                    onChange={e => setBannerOffset(e.target.value)} 
                    className="flex-1 accent-[#7C5CFF] h-1 bg-border"
                  />
                </div>
              </div>
            )}
            <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          </div>

          <div>
            <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
              Avatar (Rasio 1:1)
            </label>
            <div className="flex items-start gap-4">
              <div
                className="w-20 h-20 relative overflow-hidden cursor-pointer shrink-0 bg-black/40"
                style={{ border: '2px solid #7C5CFF' }}
                onClick={() => avatarRef.current?.click()}
              >
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="avatar" 
                    className="w-full h-full pointer-events-none select-none" 
                    style={{
                      objectFit: 'cover',
                      transform: `scale(${(avatarZoom || 100) / 100}) translate(${avatarOffset || 0}px, ${avatarOffset || 0}px)`,
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-display font-bold text-2xl text-accent"
                    style={{ background: '#7C5CFF22' }}
                  >
                    {(form.name || 'T')[0].toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  className="font-mono text-xs text-text-dim hover:text-text-muted transition-colors flex items-center gap-1 self-start"
                >
                  <Upload size={12} />
                  Ganti Gambar Avatar
                </button>

                {avatarPreview && (
                  <div className="p-2 bg-[#0A0A0E] border border-[#211D2C] flex flex-col gap-2 rounded-sm w-full">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
                      <ZoomIn size={12} className="text-accent" />
                      <span>ZOOM:</span>
                      <input 
                        type="range" min="100" max="300" 
                        value={avatarZoom} 
                        onChange={e => setAvatarZoom(e.target.value)} 
                        className="flex-1 accent-[#7C5CFF] h-1 bg-border"
                      />
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
                      <Move size={12} className="text-accent" />
                      <span>GESER:</span>
                      <input 
                        type="range" min="-50" max="50" 
                        value={avatarOffset} 
                        onChange={e => setAvatarOffset(e.target.value)} 
                        className="flex-1 accent-[#7C5CFF] h-1 bg-border"
                      />
                    </div>
                  </div>
                )}
              </div>
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
              placeholder="http://spotify.com/..."
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
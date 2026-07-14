import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Shield, Loader2, AlertTriangle, UserX, Trash2, ShieldCheck, Lock, Trash } from 'lucide-react'

export default function AdminPanel({ userId, onClose }) {
  // Pengamanan Lapis Baves: Ganti dengan UUID Akun Supabase lu sendiri
  const ADMIN_UUID = "d4ccb677-a547-4a7a-9b9b-ce2be6723ecd"
  // Pengamanan Lapis Kedua: Password gerbang konsol
  const ADMIN_PASSWORD_KEY = "FounderGRIND1" 

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  
  // State baru untuk penanganan durasi notif kustom
  const [warningText, setWarningText] = useState('')
  const [durationSetting, setDurationSetting] = useState('once') // 'once', '30', '60', '90', '1440'

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault()
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault()
      }
    }

    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const fetchAllUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, status, warning_msg, warning_type, warning_expires_at, created_at')
        .order('created_at', { ascending: false })
      if (!error) setUsers(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && userId === ADMIN_UUID) {
      fetchAllUsers()
    }
  }, [isAuthenticated])

  const handleLoginAdmin = (e) => {
    e.preventDefault()
    if (userId !== ADMIN_UUID) {
      setAuthError("AKSES DI-TOLAK: UUID PERANGKAT TIDAK COCOK.")
      return
    }
    if (passwordInput === ADMIN_PASSWORD_KEY) {
      setIsAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError("PASSWORD KONSOL SALAH. AKSES DI-BLOKIR.")
    }
  }

  // 🎯 MODERASI: EMIT WARNING DENGAN KALIBRASI WAKTU KUSTOM
  const handleGiveWarning = async (targetId) => {
    if (!warningText.trim()) return
    setActionLoadingId(targetId)

    let expiresAt = null
    const type = durationSetting === 'once' ? 'once' : 'duration'

    if (durationSetting !== 'once') {
      const minutes = parseInt(durationSetting, 10)
      const now = new Date()
      expiresAt = new Date(now.getTime() + minutes * 60000).toISOString()
    }

    await supabase
      .from('profiles')
      .update({ 
        status: 'warned', 
        warning_msg: warningText.trim(),
        warning_type: type,
        warning_expires_at: expiresAt
      })
      .eq('id', targetId)

    setWarningText('')
    setDurationSetting('once')
    setSelectedUser(null)
    await fetchAllUsers()
    setActionLoadingId(null)
  }

  // 🎯 MODERASI BARU: HAPUS WARN / NOTIFIKASI KHUSUS SECARA TOTAL
  const handleClearWarning = async (targetId) => {
    setActionLoadingId(targetId)
    await supabase
      .from('profiles')
      .update({ 
        status: 'active', 
        warning_msg: null,
        warning_type: 'once',
        warning_expires_at: null
      })
      .eq('id', targetId)
    await fetchAllUsers()
    setActionLoadingId(null)
  }

  const handleBanUser = async (targetId) => {
    if (!window.confirm("Konfirmasi pembekuan akun target?")) return
    setActionLoadingId(targetId)
    await supabase
      .from('profiles')
      .update({ 
        status: 'banned', 
        warning_msg: 'AKUN DIBEKUKAN OLEH ADMIN KARENA PELANGGARAN HAK CIPTA/KONTEN.',
        warning_type: 'once',
        warning_expires_at: null
      })
      .eq('id', targetId)
    await fetchAllUsers()
    setActionLoadingId(null)
  }

  const handleDeleteUser = async (targetId) => {
    if (!window.confirm("Hapus profile user ini secara permanen dari basis data?")) return
    setActionLoadingId(targetId)
    await supabase.from('entries').delete().eq('user_id', targetId)
    await supabase.from('profiles').delete().eq('id', targetId)
    await fetchAllUsers()
    setActionLoadingId(null)
  }

  if (userId !== ADMIN_UUID) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 font-mono select-none">
        <div className="bg-[#100E16] border border-red-500/30 p-5 w-full max-w-xs text-center relative text-red-400 text-xs">
          <p className="font-bold uppercase tracking-widest mb-1">PROSEDUR ILEGAL</p>
          <p className="text-[10px] text-gray-600 uppercase">Perangkat lu tidak terdaftar sebagai pengembang sistem inti.</p>
          <button onClick={onClose} className="mt-4 w-full py-2 bg-red-950/30 border border-red-500/40 text-red-200 uppercase text-[10px] tracking-wider font-bold">KEMBALI</button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 font-mono select-none">
        <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs p-5 relative shadow-2xl flex flex-col gap-4">
          <div className="border border-[#211D2C] p-3 bg-black/40 flex items-center justify-center gap-2">
            <Lock size={14} className="text-[#7C5CFF]" />
            <span className="text-[#7C5CFF] font-black text-xs tracking-wider uppercase">DEKRIPSI OTORITAS</span>
          </div>
          <form onSubmit={handleLoginAdmin} className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-wider">MASUKKAN PIN KONSOL UTAMA</label>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)}
                className="bg-black border border-[#211D2C] p-2.5 text-white outline-none focus:border-[#7C5CFF] text-center font-bold tracking-widest"
                required
              />
            </div>
            {authError && <p className="text-[9px] text-red-400 text-center uppercase tracking-wide animate-pulse">{authError}</p>}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button type="button" onClick={onClose} className="py-2 bg-transparent border border-[#211D2C] text-gray-400 uppercase tracking-wider text-[10px]">BATAL</button>
              <button type="submit" className="py-2 bg-[#7C5CFF] text-white font-bold uppercase tracking-wider text-[10px]">VERIFIKASI</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0E] z-[200] flex flex-col font-mono text-xs text-[#EDEAF6] select-none p-4 overflow-y-auto">
      <div className="max-w-md mx-auto w-full flex flex-col gap-4 pb-12">
        
        <div className="border border-[#211D2C] relative p-3 rounded-none bg-[#100E16] flex justify-between items-center">
          <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-[#7C5CFF]" />
            <span className="font-black text-xs uppercase tracking-wider text-[#7C5CFF]">KONSOL MODERASI GLOBAL</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-[10px] border border-[#211D2C] px-2 py-0.5 bg-black/40">CLOSE</button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">DAFTAR AKUN TRAINER TERDAFTAR ({users.length}):</span>
          
          {loadingUsers ? (
            <div className="py-8 text-center text-gray-500 animate-pulse uppercase tracking-wider">Sinkronisasi Data User...</div>
          ) : users.map(u => (
            <div key={u.id} className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col gap-3 relative">
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-white text-sm tracking-wide uppercase">{u.name || 'Anonymous Trainer'}</p>
                  <p className="text-[9px] text-gray-500 font-mono tracking-tighter mt-0.5">UID: {u.id}</p>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase ${
                  u.status === 'banned' ? 'bg-red-950 text-red-400 border border-red-950' :
                  u.status === 'warned' ? 'bg-purple-950 text-[#7C5CFF] border border-[#2B243C]' : 'bg-emerald-950 text-emerald-400 border border-emerald-950'
                }`}>
                  {u.status}
                </span>
              </div>

              {u.warning_msg && (
                <div className="bg-black/50 border border-dashed border-[#211D2C] p-2 text-[9px] text-[#7C5CFF] uppercase tracking-wide leading-relaxed flex flex-col gap-1">
                  <div>PESAN PERINGATAN: {u.warning_msg}</div>
                  <div className="text-gray-500 text-[8px]">
                    SETINGAN: {u.warning_type === 'once' ? 'CUMA 1X MUNCUL' : `TIMED EXPIRATION (${u.warning_expires_at})`}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 mt-1">
                
                <div className="relative border border-[#211D2C] bg-[#16141F]">
                  <div className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t border-l border-[#7C5CFF]" />
                  <div className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t border-r border-[#7C5CFF]" />
                  <div className="absolute -bottom-[1px] -left-[1px] w-1.5 h-1.5 border-b border-l border-[#7C5CFF]" />
                  <div className="absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b border-r border-[#7C5CFF]" />
                  <button 
                    onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                    disabled={actionLoadingId === u.id}
                    className="w-full py-1.5 bg-transparent text-[#7C5CFF] hover:text-white flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider outline-none"
                  >
                    WARN
                  </button>
                </div>

                {/* TOMBOL MANUAL HAPUS PEMBERITAHUAN / WARN */}
                <div className="relative border border-[#211D2C] bg-[#16141F]">
                  <div className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t border-l border-red-500" />
                  <div className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t border-r border-red-500" />
                  <div className="absolute -bottom-[1px] -left-[1px] w-1.5 h-1.5 border-b border-l border-red-500" />
                  <div className="absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b border-r border-red-500" />
                  <button 
                    onClick={() => handleClearWarning(u.id)}
                    disabled={actionLoadingId === u.id || u.status !== 'warned'}
                    className="w-full py-1.5 bg-transparent text-red-400 disabled:opacity-20 flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider outline-none"
                  >
                    <Trash size={10} /> HAPUS
                  </button>
                </div>

                <div className="relative border border-[#211D2C] bg-[#16141F]">
                  <button 
                    onClick={() => handleBanUser(u.id)}
                    disabled={actionLoadingId === u.id || u.status === 'banned'}
                    className="w-full py-1.5 bg-transparent text-gray-500 disabled:opacity-30 flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider outline-none"
                  >
                    BAN
                  </button>
                </div>

                <div className="relative border border-[#211D2C] bg-[#16141F]">
                  <button 
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={actionLoadingId === u.id}
                    className="w-full py-1.5 bg-transparent text-gray-500 hover:text-white flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider outline-none"
                  >
                    DROP
                  </button>
                </div>

              </div>

              {selectedUser?.id === u.id && (
                <div className="mt-3 border-t border-[#211D2C] pt-3 flex flex-col gap-3 animate-in fade-in duration-100">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-gray-500 uppercase tracking-wider">ISI NOTIFIKASI KHUSUS</label>
                    <input 
                      type="text"
                      placeholder="Misal: halo guys gitu"
                      value={warningText}
                      onChange={(e) => setWarningText(e.target.value)}
                      className="bg-black border border-[#211D2C] p-2 text-white font-mono text-[10px] outline-none focus:border-[#7C5CFF]"
                    />
                  </div>

                  {/* FITUR DURASI KUSTOM SESUAI TEMA */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-gray-500 uppercase tracking-wider">SETTING TIMING KEMUNCULAN NOTIF</label>
                    <select
                      value={durationSetting}
                      onChange={(e) => setDurationSetting(e.target.value)}
                      className="bg-black border border-[#211D2C] p-2 text-white font-mono text-[10px] outline-none focus:border-[#7C5CFF]"
                    >
                      <option value="once">CUMA 1X MUNCUL (LANGSUNG HILANG PAS USER KLIK IYA)</option>
                      <option value="30">30 MENIT</option>
                      <option value="60">1 JAM</option>
                      <option value="90">1 JAM 30 MENIT</option>
                      <option value="1440">24 JAM</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setSelectedUser(null)} className="px-3 py-1 bg-transparent text-gray-400 text-[9px] border border-[#211D2C] uppercase font-bold">Batal</button>
                    <button onClick={() => handleGiveWarning(u.id)} className="px-3 py-1 bg-[#7C5CFF] text-white text-[9px] uppercase font-black">FIRE NOTIF</button>
                  </div>
                </div>
              )}

            </div>
          ))
          }
        </div>
      </div>
    </div>
  )
}

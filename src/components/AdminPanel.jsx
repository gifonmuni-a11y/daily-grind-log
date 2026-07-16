import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  Shield, Loader2, AlertTriangle, UserX, Trash2, 
  Lock, Trash, Megaphone, Plus, Minus, RotateCcw, ChevronDown, Award
} from 'lucide-react'

// Kalkulator Level Akurat untuk Sistem PWA RPG Manhwa
function getComputedLevel(exp) {
  const totalExp = Number(exp) || 0
  let lvl = 1
  let currentBasis = 0
  
  while (true) {
    const nextLvlRequirement = 100 + (lvl - 1) * 50
    if (totalExp >= currentBasis + nextLvlRequirement) {
      currentBasis += nextLvlRequirement
      lvl++
    } else {
      break
    }
  }
  return lvl
}

export default function AdminPanel({ userId, onClose }) {

  // 🎯 MASUKKAN UUID AKUN SUPABASE LU DI SINI AGAR AKSES KONSOL TERBUKA
  const ADMIN_UUID = "d4ccb677-a547-4a7a-9b9b-ce2be6723ecd"
  const ADMIN_PASSWORD_KEY = "FounderGRIND1" 

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  
  const [warningText, setWarningText] = useState('')
  const [durationSetting, setDurationSetting] = useState('once')
  
  const [broadcastText, setBroadcastText] = useState('')
  const [expInput, setExpInput] = useState('50')
  
  const [dbError, setDbError] = useState('')
  const [systemNotice, setSystemNotice] = useState({ isOpen: false, title: '', message: '', type: 'info' })
  const [systemConfirm, setSystemConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  const triggerNotice = (title, message, type = 'info') => {
    setSystemNotice({ isOpen: true, title, message, type })
  }

  const triggerConfirm = (title, message, onConfirmAction) => {
    setSystemConfirm({ isOpen: true, title, message, onConfirm: onConfirmAction })
  }

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

  useEffect(() => {
    if (isAuthenticated) {
      const audioUrl = "https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Mp3/welcome/welcometoadminpanel.mp3"
      const audio = new Audio(audioUrl)
      audio.volume = 0.8
      audio.play().catch(err => console.log("Autoplay diblokir browser:", err))
    }
  }, [isAuthenticated])

  const fetchAllUsers = async () => {
    setLoadingUsers(true)
    setDbError('')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        setDbError(`PEMBATASAN DATABASE: ${error.message}`)
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      setDbError(`PENGECUALIAN SISTEM: ${err.message}`)
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
      setAuthError("AKSES DITOLAK: KREDENSIAL PERANGKAT TIDAK SAH.")
      return
    }
    if (passwordInput === ADMIN_PASSWORD_KEY) {
      setIsAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError("DEKRIPSI GAGAL: KUNCI AKSES SALAH ATAU RUSAK.")
    }
  }

  const handleBroadcastAll = async (e) => {
    e.preventDefault()
    if (!broadcastText.trim()) return
    setActionLoadingId('broadcast')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'warned',
          warning_msg: `[PENGUMUMAN SISTEM]: ${broadcastText.trim()}`,
          warning_type: 'once',
          warning_expires_at: null
        })
        .not('id', 'is', null)

      if (error) {
        triggerNotice("SIARAN GAGAL", error.message, "error")
      } else {
        triggerNotice("SIARAN BERHASIL", "Notifikasi massal berhasil ditembak ke seluruh Player.", "success")
        setBroadcastText('')
        await fetchAllUsers()
      }
    } catch (err) {
      triggerNotice("SISTEM CRASH", err.message, "error")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleAdjustExp = async (targetUser, operation) => {
    setActionLoadingId(targetUser.id)
    let currentExp = Number(targetUser.exp) || 0
    const value = Number(expInput) || 0

    if (operation === 'add') currentExp += value
    if (operation === 'sub') currentExp = Math.max(0, currentExp - value)
    if (operation === 'reset') currentExp = 0

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ exp: currentExp })
        .eq('id', targetUser.id)
      
      if (error) {
        triggerNotice("PEMBARUAN GAGAL", error.message, "error")
      } else {
        await fetchAllUsers()
        setSelectedUser(prev => prev ? { ...prev, exp: currentExp } : null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteAsset = (targetUser, assetType) => {
    triggerConfirm(
      "KONFIRMASI HAPUS ASET",
      `Apakah kamu yakin ingin menghapus paksa berkas data ${assetType === 'avatar' ? 'Foto Profil' : 'Background Banner'} milik Player [${targetUser.name}]?`,
      async () => {
        setActionLoadingId(targetUser.id)
        const updateField = {}
        if (assetType === 'avatar') updateField.avatar_url = null
        if (assetType === 'banner') updateField.banner_url = null

        try {
          const { error } = await supabase
            .from('profiles')
            .update(updateField)
            .eq('id', targetUser.id)
          
          if (error) {
            triggerNotice("PENGHAPUSAN GAGAL", error.message, "error")
          } else {
            await fetchAllUsers()
            setSelectedUser(prev => prev ? { ...prev, ...updateField } : null)
            triggerNotice("ASET DIBERSIHKAN", `Berkas ${assetType} berhasil dihapus permanen dari server.`, "success")
          }
        } catch (err) {
          console.error(err)
        } finally {
          setActionLoadingId(null)
        }
      }
    )
  }

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

    const { error } = await supabase
      .from('profiles')
      .update({ 
        status: 'warned', 
        warning_msg: warningText.trim(),
        warning_type: type,
        warning_expires_at: expiresAt
      })
      .eq('id', targetId)

    if (error) triggerNotice("NOTIFIKASI GAGAL", error.message, "error")
    setWarningText('')
    setDurationSetting('once')
    setSelectedUser(null)
    await fetchAllUsers()
    setActionLoadingId(null)
  }

  const handleClearWarning = async (targetId) => {
    setActionLoadingId(targetId)
    const { error } = await supabase
      .from('profiles')
      .update({ 
        status: 'active', 
        warning_msg: null,
        warning_type: 'once',
        warning_expires_at: null
      })
      .eq('id', targetId)
    if (error) triggerNotice("PEMBERSIHAN GAGAL", error.message, "error")
    await fetchAllUsers()
    setActionLoadingId(null)
  }

  const handleBanUser = (targetId) => {
    triggerConfirm(
      "KONFIRMASI BEKUKAN AKUN",
      "Apakah kamu yakin ingin membekukan status akun target ini dari database sistem utama?",
      async () => {
        setActionLoadingId(targetId)
        const { error } = await supabase
          .from('profiles')
          .update({ 
            status: 'banned', 
            warning_msg: 'AKUN DIBEKUKAN OLEH ADMIN KARENA PELANGGARAN SYARAT LAYANAN SYSTEM.',
            warning_type: 'once',
            warning_expires_at: null
          })
          .eq('id', targetId)
        
        if (error) {
          triggerNotice("PEMBEKUAN GAGAL", error.message, "error")
        } else {
          triggerNotice("AKUN DIBEKUKAN", "Status akun Player berhasil dibekukan total.", "success")
          await fetchAllUsers()
        }
        setActionLoadingId(null)
      }
    )
  }

  const handleDeleteUser = (targetId) => {
    triggerConfirm(
      "HAPUS DATA PERMANEN (DROP)",
      "PERINGATAN KRITIKAL: Tindakan ini akan menghapus profile dan seluruh catatan data sesi secara permanen dari server. Lanjutkan?",
      async () => {
        setActionLoadingId(targetId)
        await supabase.from('entries').delete().eq('user_id', targetId)
        const { error } = await supabase.from('profiles').delete().eq('id', targetId)
        
        if (error) {
          triggerNotice("PENGHAPUSAN GAGAL", error.message, "error")
        } else {
          triggerNotice("DATA DIHAPUS", "Seluruh riwayat data user berhasil dimusnahkan.", "success")
          await fetchAllUsers()
        }
        setActionLoadingId(null)
      }
    )
  }

  if (userId !== ADMIN_UUID) {
    return (
      <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-4 font-mono select-none">
        <div className="bg-[#100E16] border border-red-500/40 p-5 w-full max-w-xs text-center relative text-red-400 text-xs">
          <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-red-500" />
          <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-red-500" />
          <p className="font-bold uppercase tracking-widest mb-2 text-sm flex items-center justify-center gap-1.5 text-red-500">
            <AlertTriangle size={14} /> AKSES ILEGAL DETEKSI
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide leading-relaxed">Perangkat anda tidak terdaftar sebagai pengembang atau otoritas founder sistem inti.</p>
          <button onClick={onClose} className="mt-4 w-full py-2 bg-red-950/20 border border-red-500/50 text-red-200 uppercase tracking-wider font-bold hover:bg-red-950/40 transition-colors">KEMBALI KESISTEM</button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-4 font-mono select-none">
        <div className="bg-[#100E16] border border-[#211D2C] w-full max-w-xs p-5 relative shadow-2xl flex flex-col gap-4">
          <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
          <div className="border border-[#211D2C] p-3 bg-black/40 flex items-center justify-center gap-2">
            <Lock size={14} className="text-[#7C5CFF]" />
            <span className="text-[#7C5CFF] font-black text-xs tracking-wider uppercase">OTORITAS DEKRIPSI SISTEM</span>
          </div>
          <form onSubmit={handleLoginAdmin} className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-wider text-center">MASUKKAN PIN KONSOL UTAMA FOUNDER</label>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)}
                className="bg-black border border-[#211D2C] p-2.5 text-white outline-none focus:border-[#7C5CFF] text-center font-bold tracking-widest transition-colors"
                required
              />
            </div>
            {authError && <p className="text-[9px] text-red-400 text-center uppercase tracking-wide animate-pulse">{authError}</p>}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button type="button" onClick={onClose} className="py-2 bg-transparent border border-[#211D2C] text-gray-400 uppercase tracking-wider text-[10px] hover:text-white transition-colors">BATAL</button>
              <button type="submit" className="py-2 bg-[#7C5CFF] text-white font-bold uppercase tracking-wider text-[10px] hover:bg-[#6b4ee6] transition-colors">VERIFIKASI</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#000000] z-[200] flex flex-col font-mono text-xs text-[#EDEAF6] select-none p-4 overflow-y-auto">
      
      {/* 🎯 CUSTOM MODAL DIALOG KONFIRMASI (KUSTOM MANHWA STYLE) */}
      {systemConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4">
          <div className="bg-[#100E16] border-2 border-[#7C5CFF] p-5 w-full max-w-xs relative flex flex-col gap-3 shadow-[0_0_25px_rgba(124,92,255,0.3)]">
            <div className="absolute -top-[2px] -left-[2px] w-3 h-3 border-t-2 border-l-2 border-white" />
            <div className="absolute -bottom-[2px] -right-[2px] w-3 h-3 border-b-2 border-r-2 border-white" />
            <div className="text-[#7C5CFF] font-black text-xs tracking-widest uppercase border-b border-[#211D2C] pb-1.5 flex items-center gap-1.5">
              <Shield size={13} /> [ {systemConfirm.title} ]
            </div>
            <p className="text-[10px] text-gray-300 uppercase leading-relaxed tracking-wide">{systemConfirm.message}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                onClick={() => setSystemConfirm({ isOpen: false, title: '', message: '', onConfirm: null })} 
                className="py-1.5 bg-transparent border border-[#211D2C] text-gray-400 font-bold uppercase tracking-wider text-[10px] hover:text-white transition-colors"
              >
                BATALKAN
              </button>
              <button 
                onClick={() => {
                  if(systemConfirm.onConfirm) systemConfirm.onConfirm();
                  setSystemConfirm({ isOpen: false, title: '', message: '', onConfirm: null });
                }} 
                className="py-1.5 bg-[#7C5CFF] text-white font-black uppercase tracking-wider text-[10px] shadow-[0_0_10px_rgba(124,92,255,0.4)]"
              >
                EKSEKUSI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 CUSTOM MODAL PEMBERITAHUAN (KUSTOM MANHWA STYLE) */}
      {systemNotice.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4">
          <div className="bg-[#100E16] border border-[#211D2C] p-5 w-full max-w-xs relative flex flex-col gap-3 shadow-2xl">
            <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-[#7C5CFF]" />
            <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-[#7C5CFF]" />
            <div className="text-white font-black text-xs tracking-widest uppercase border-b border-[#211D2C] pb-1.5 flex items-center gap-1.5">
              <Award size={13} className="text-[#7C5CFF]" /> [ {systemNotice.title} ]
            </div>
            <p className="text-[10px] text-gray-400 uppercase leading-relaxed tracking-wide">{systemNotice.message}</p>
            <button 
              onClick={() => setSystemNotice({ isOpen: false, title: '', message: '', type: 'info' })} 
              className="mt-2 w-full py-1.5 bg-[#16141F] border border-[#7C5CFF]/40 text-[#7C5CFF] font-bold uppercase tracking-wider text-[10px] hover:bg-[#7C5CFF]/10 transition-all"
            >
              KONFIRMASI
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto w-full flex flex-col gap-4 pb-12">
        
        {/* PANEL BAR ATAS */}
        <div className="border border-[#211D2C] relative p-3 rounded-none bg-[#100E16] flex justify-between items-center">
          <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-[#7C5CFF]" />
            <span className="font-black text-xs uppercase tracking-wider text-[#7C5CFF]">KONSOL UTAMA MModerasi FOUNDER</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-[10px] border border-[#211D2C] px-2 py-0.5 bg-black/40 transition-colors">TUTUP</button>
        </div>

        {dbError && (
          <div className="bg-red-950/20 border border-red-500/40 p-3 text-red-400 font-bold text-[10px] uppercase tracking-wider leading-relaxed">
            PERINGATAN SISTEM // {dbError}
          </div>
        )}

        {/* WIDGET BROADCAST MASSAL KE EVERYONE */}
        <div className="bg-[#100E16] border border-[#211D2C] p-3 relative flex flex-col gap-2">
          <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />
          
          <div className="flex items-center gap-1.5 text-[#7C5CFF] font-bold text-[10px] uppercase tracking-wider">
            <Megaphone size={12} />
            <span>PANEL NOTIFIKASI MASSAL SYSTEM (@everyone)</span>
          </div>
          <form onSubmit={handleBroadcastAll} className="flex flex-col gap-2">
            <input 
              type="text"
              placeholder="Ketik pengumuman sistem untuk ditembak ke seluruh player..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="bg-black border border-[#211D2C] p-2 text-white font-mono text-[11px] rounded-none outline-none focus:border-[#7C5CFF] transition-colors"
            />
            <button
              type="submit"
              disabled={actionLoadingId === 'broadcast' || !broadcastText.trim()}
              className="w-full py-2 bg-[#7C5CFF] text-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 transition-opacity hover:bg-[#6b4ee6]"
            >
              {actionLoadingId === 'broadcast' ? 'MENGIRIMKAN DATA PAKET...' : 'TEMBAK PENGUMUMAN MASSAL'}
            </button>
          </form>
        </div>

        {/* DAFTAR PLAYER */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">DATABASE PLAYER AKTIF ({users.length}):</span>
          
          {loadingUsers ? (
            <div className="py-8 text-center text-gray-500 animate-pulse uppercase tracking-wider">SINKRONISASI DATA SERVER DATA...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-6 text-gray-600 border border-dashed border-[#211D2C] uppercase text-[10px]">
              TIDAK ADA DATA PLAYER TERDETEKSI DI MATRIX.
            </div>
          ) : users.map(u => {
            const userLevel = getComputedLevel(u.exp)

            return (
              <div key={u.id} className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col gap-3 relative shadow-md">
                <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#7C5CFF]" />
                <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#7C5CFF]" />
                <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#7C5CFF]" />
                <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#7C5CFF]" />

                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm tracking-wide uppercase">{u.name || 'Subjek Anonim'}</p>
                      <span className="text-[9px] font-mono font-bold bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/30 px-1.5 py-0.2 tracking-widest">
                        LVL {userLevel}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono tracking-tighter mt-0.5">UID: {u.id} | EXP: {u.exp || 0}</p>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase ${
                    u.status === 'banned' ? 'bg-red-950/40 text-red-400 border border-red-900/50' :
                    u.status === 'warned' ? 'bg-purple-950/40 text-[#7C5CFF] border border-[#2B243C]' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                  }`}>
                    {u.status}
                  </span>
                </div>

                {u.warning_msg && (
                  <div className="bg-black/50 border border-dashed border-[#211D2C] p-2 text-[9px] text-[#7C5CFF] uppercase tracking-wide leading-relaxed flex flex-col gap-1">
                    <div>LAMPIRAN NOTIF: {u.warning_msg}</div>
                    <div className="text-gray-500 text-[8px] tracking-wide">
                      JENIS DURASI: {u.warning_type === 'once' ? '1X MUNCUL LALU HILANG (ONCE)' : 'COOLDOWN BERDURASI AKTIF'}
                    </div>
                  </div>
                )}

                {/* MATRIX AKSI TOMBOL MODERASI */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="relative border border-[#211D2C] bg-[#16141F]">
                    <div className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t border-l border-[#7C5CFF]" />
                    <button 
                      onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                      disabled={actionLoadingId === u.id}
                      className="w-full py-2 bg-transparent text-[#7C5CFF] hover:text-white flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider outline-none transition-colors"
                    >
                      SETEL NOTIF
                    </button>
                  </div>

                  <div className="relative border border-[#211D2C] bg-[#16141F]">
                    <div className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t border-l border-red-500" />
                    <button 
                      onClick={() => handleClearWarning(u.id)}
                      disabled={actionLoadingId === u.id || u.status !== 'warned'}
                      className="w-full py-2 bg-transparent text-red-400 disabled:opacity-20 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider outline-none transition-colors"
                    >
                      HAPUS NOTIF
                    </button>
                  </div>

                  <div className="relative border border-[#211D2C] bg-[#16141F]">
                    <button 
                      onClick={() => handleBanUser(u.id)}
                      disabled={actionLoadingId === u.id || u.status === 'banned'}
                      className="w-full py-2 bg-transparent text-gray-500 disabled:opacity-30 text-[10px] font-bold uppercase tracking-wider outline-none hover:text-red-400 transition-colors"
                    >
                      BEKUKAN AKUN
                    </button>
                  </div>

                  <div className="relative border border-[#211D2C] bg-[#16141F]">
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={actionLoadingId === u.id}
                      className="w-full py-2 bg-transparent text-gray-500 hover:text-white text-[10px] font-bold uppercase tracking-wider outline-none hover:text-red-500 transition-colors"
                    >
                      HAPUS PROFILE
                    </button>
                  </div>
                </div>

                {/* DRAWER ACCORDION PENGATURAN KUSTOM */}
                {selectedUser?.id === u.id && (
                  <div className="mt-3 border-t border-[#211D2C] pt-3 flex flex-col gap-4 animate-in fade-in duration-150">
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-gray-500 uppercase tracking-wider">ISI KONTEN NOTIFIKASI KHUSUS</label>
                        <input 
                          type="text"
                          placeholder="Misal: Halo, terdeteksi pelanggaran sesi data..."
                          value={warningText}
                          onChange={(e) => setWarningText(e.target.value)}
                          className="bg-black border border-[#211D2C] p-2.5 text-white font-mono text-[11px] rounded-none outline-none focus:border-[#7C5CFF]"
                        />
                      </div>

                      {/* 🎯 CUSTOM DROPDOWN SYSTEM: Full Tema Manhwa Game Tanpa Default Browser Select */}
                      <div className="flex flex-col gap-1 relative">
                        <label className="text-[8px] text-gray-500 uppercase tracking-wider">PARAMETER DURASI KEMUNCULAN NOTIF</label>
                        <div className="relative w-full">
                          <select
                            value={durationSetting}
                            onChange={(e) => setDurationSetting(e.target.value)}
                            className="w-full bg-black border border-[#211D2C] p-2.5 pr-10 text-white font-mono text-[11px] rounded-none outline-none focus:border-[#7C5CFF] appearance-none cursor-pointer transition-colors"
                          >
                            <option value="once" className="bg-[#100E16] text-white">CUMA 1X MUNCUL (KLIK OKE LANGSUNG HILANG TEMPELANNYA)</option>
                            <option value="30" className="bg-[#100E16] text-white">KUNCI MUNCUL TERUS SELAMA 30 MENIT</option>
                            <option value="60" className="bg-[#100E16] text-white">KUNCI MUNCUL TERUS SELAMA 1 JAM</option>
                            <option value="90" className="bg-[#100E16] text-white">KUNCI MUNCUL TERUS SELAMA 1 JAM 30 MENIT</option>
                            <option value="1440" className="bg-[#100E16] text-white">KUNCI MUNCUL TERUS SELAMA 24 JAM</option>
                          </select>
                          <div className="absolute pointer-events-none top-3.5 right-3 text-gray-500">
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 text-[10px] mb-1">
                        <button type="button" onClick={() => setSelectedUser(null)} className="px-3 py-1.5 bg-transparent text-gray-400 border border-[#211D2C] uppercase font-bold hover:text-white transition-colors">BATAL</button>
                        <button type="button" onClick={() => handleGiveWarning(u.id)} className="px-3 py-1.5 bg-[#7C5CFF] text-white uppercase font-black tracking-widest hover:bg-[#6b4ee6] transition-colors">TEMBAK NOTIF</button>
                      </div>
                    </div>

                    {/* MANIPULASI DATA STATS EXP MANHWA SYSTEM */}
                    <div className="border-t border-[#211D2C]/60 pt-3 flex flex-col gap-2">
                      <label className="text-[8px] text-[#7C5CFF] uppercase tracking-wider font-bold">// MANIPULASI INDEKS DATA EXP PLAYER</label>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-gray-500">JUMLAH ADJUSTMENT:</span>
                        <input 
                          type="number"
                          value={expInput}
                          onChange={(e) => setExpInput(e.target.value)}
                          className="w-20 bg-black border border-[#211D2C] p-1 text-white text-center text-xs outline-none focus:border-[#7C5CFF]"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mt-1">
                        <button type="button" onClick={() => handleAdjustExp(u, 'add')} className="py-1.5 bg-transparent border border-emerald-600 text-emerald-400 hover:bg-emerald-950/20 text-[9px] font-bold uppercase tracking-wide transition-colors">
                          TAMBAH EXP
                        </button>
                        <button type="button" onClick={() => handleAdjustExp(u, 'sub')} className="py-1.5 bg-transparent border border-red-600 text-red-400 hover:bg-red-950/20 text-[9px] font-bold uppercase tracking-wide transition-colors">
                          KURANGI EXP
                        </button>
                        <button type="button" onClick={() => handleAdjustExp(u, 'reset')} className="py-1.5 bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-800 text-[9px] font-bold uppercase tracking-wide transition-colors">
                          RESET KE 0
                        </button>
                      </div>
                    </div>

                    {/* HAPUS PAKSA ELEMEN KONTEN */}
                    <div className="border-t border-[#211D2C]/60 pt-3 flex flex-col gap-2">
                      <label className="text-[8px] text-red-400 uppercase tracking-wider font-bold">// PEMBERSIHAN PAKSA ASET GAMBAR PROFIL</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          type="button" 
                          onClick={() => handleDeleteAsset(u, 'avatar')}
                          className="py-1.5 bg-transparent border border-red-500/40 text-red-300 text-[9px] font-bold uppercase tracking-wide hover:bg-red-950/20 transition-all"
                        >
                          HAPUS AVATAR
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteAsset(u, 'banner')}
                          className="py-1.5 bg-transparent border border-red-500/40 text-red-300 text-[9px] font-bold uppercase tracking-wide hover:bg-red-950/20 transition-all"
                        >
                          HAPUS BACKGROUND
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

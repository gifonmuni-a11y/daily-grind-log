import React, { useRef, useState, useEffect } from 'react'
import { X, Download, Share2, Loader2, Award } from 'lucide-react'
import html2canvas from 'html2canvas'
import { supabase } from '../lib/supabaseClient'
import { calcLevel, getEffectiveTotalExp } from '../lib/expSystem'

export default function MonthlyRecapModal({ entries = [], targetMonth, onClose, profile: propProfile, level: propLevel }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [userData, setUserData] = useState({
    name: propProfile?.name || 'TRAINER',
    level: propLevel || 1
  })

  // Sinkronisasi/Fetch data user untuk ditampilkan di kartu rekap
  useEffect(() => {
    const loadUserData = async () => {
      if (propProfile?.name && propLevel) {
        setUserData({ name: propProfile.name, level: propLevel })
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          const totalExp = getEffectiveTotalExp(entries, user.id, prof?.exp || 0)
          const { level: calculatedLevel } = calcLevel(totalExp)

          setUserData({
            name: prof?.name || 'TRAINER',
            level: calculatedLevel || 1
          })
        }
      } catch (err) {
        console.error('Gagal memuat profil untuk kartu rekap:', err)
      }
    }

    loadUserData()
  }, [propProfile, propLevel, entries])

  // Perhitungan Data Rekap Bulanan
  const now = targetMonth ? new Date(targetMonth) : new Date()
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const monthlyEntries = entries.filter(e => {
    const d = new Date(e.entry_date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const totalSesi = monthlyEntries.length
  const totalExp = monthlyEntries.reduce((acc, curr) => acc + (curr.exp_gained || 0), 0)

  // Hitung Top Kategori
  const categoryCounts = {}
  monthlyEntries.forEach(e => {
    const cat = e.category || 'Lainnya'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })
  const topKategori = Object.keys(categoryCounts).length > 0
    ? Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b)
    : '-'

  // Hitung Best Rank
  const rankPriority = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 }
  let bestRank = '-'
  monthlyEntries.forEach(e => {
    if (e.rank && (!bestRank || rankPriority[e.rank] > (rankPriority[bestRank] || 0))) {
      bestRank = e.rank
    }
  })

  // Hitung EXP per Minggu (M1 - M5)
  const weeklyExp = [0, 0, 0, 0, 0]
  monthlyEntries.forEach(e => {
    const day = new Date(e.entry_date).getDate()
    const weekIndex = Math.min(Math.floor((day - 1) / 7), 4)
    weeklyExp[weekIndex] += (e.exp_gained || 0)
  })
  const maxWeeklyExp = Math.max(...weeklyExp, 1)

  // Fungsi Download Kartu Rekap sebagai Gambar
  const handleDownloadImage = async () => {
    if (!cardRef.current || downloading) return
    setDownloading(true)

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A0A0E',
        scale: 2,
        useCORS: true,
        logging: false
      })

      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `GrindLog_Rekap_${monthName.replace(/\s+/g, '_')}.png`
      link.click()
    } catch (err) {
      console.error('Gagal mengunduh gambar:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        
        {/* TOMBOL AKSI ATAS */}
        <div className="flex items-center justify-between text-white">
          <span className="font-mono text-xs text-[#8B8696] uppercase tracking-wider">
            PRATINJAU SHARE
          </span>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#211D2C] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* --- KARTU YANG AKAN DI-SHARE --- */}
        <div 
          ref={cardRef} 
          className="bg-[#0A0A0E] border border-[#211D2C] p-5 rounded-none flex flex-col gap-5 text-white relative shadow-2xl select-none"
        >
          {/* Accent Corner Lines */}
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-[#7C5CFF]" />

          {/* HEADER KARTU: LOGO PWA + JUDUL + PROFIL USER */}
          <div className="flex items-center justify-between border-b border-[#211D2C] pb-4">
            {/* SISI KIRI: Logo PWA & Judul Rekap */}
            <div className="flex items-center gap-3">
              <img 
                src="/notification-icon.gif" 
                alt="PWA Logo" 
                className="w-9 h-9 object-cover rounded-lg border border-[#211D2C] flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <div className="flex flex-col">
                <span className="font-display font-black text-xs text-white tracking-widest leading-none">
                  DAILY GRIND LOG
                </span>
                <span className="font-mono text-[9px] text-[#8B8696] tracking-wider uppercase mt-1">
                  Rekap Bulanan · {monthName}
                </span>
              </div>
            </div>

            {/* SISI KANAN: Nama User & Level Badge */}
            <div className="flex flex-col items-end pl-2">
              <span className="font-display font-black text-xs text-[#7C5CFF] tracking-wider uppercase truncate max-w-[100px]">
                {userData.name}
              </span>
              <span className="font-mono text-[9px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">
                LV.{userData.level}
              </span>
            </div>
          </div>

          {/* GRID STATISTIK BULANAN */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col gap-1">
              <span className="font-mono text-[9px] text-[#8B8696] uppercase tracking-wider">TOTAL SESI</span>
              <span className="font-display font-black text-xl text-[#7C5CFF]">{totalSesi}</span>
            </div>
            <div className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col gap-1">
              <span className="font-mono text-[9px] text-[#8B8696] uppercase tracking-wider">TOTAL EXP</span>
              <span className="font-display font-black text-xl text-[#7C5CFF]">{totalExp}</span>
            </div>
            <div className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col gap-1">
              <span className="font-mono text-[9px] text-[#8B8696] uppercase tracking-wider">BEST RANK</span>
              <span className="font-display font-black text-xl text-[#7C5CFF]">{bestRank}</span>
            </div>
            <div className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col gap-1">
              <span className="font-mono text-[9px] text-[#8B8696] uppercase tracking-wider">TOP KATEGORI</span>
              <span className="font-display font-black text-sm text-[#7C5CFF] truncate">{topKategori}</span>
            </div>
          </div>

          {/* GRAFIK BAR EXP PER MINGGU */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="font-mono text-[9px] text-[#8B8696] uppercase tracking-wider">EXP PER MINGGU</span>
            <div className="h-28 bg-[#100E16] border border-[#211D2C] p-3 flex items-end justify-between gap-2">
              {weeklyExp.map((exp, idx) => {
                const heightPercent = maxWeeklyExp > 0 ? Math.max((exp / maxWeeklyExp) * 100, 8) : 8
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div 
                      className="w-full bg-[#7C5CFF] transition-all duration-300 rounded-xs"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="font-mono text-[8px] text-[#8B8696]">M{idx + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* FOOTER KARTU */}
          <div className="pt-2 border-t border-[#211D2C]/50 flex items-center justify-between">
            <span className="font-mono text-[8px] text-[#8B8696] uppercase tracking-wider">
              Dibuat otomatis oleh Daily Grind Log
            </span>
          </div>

        </div>

        {/* TOMBOL UNDUH GAMBAR */}
        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={downloading}
          className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6b52e0] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {downloading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>MEMPROSES GAMBAR...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>SIMPAN KARTU REKAP (PNG)</span>
            </>
          )}
        </button>

      </div>
    </div>
  )
}

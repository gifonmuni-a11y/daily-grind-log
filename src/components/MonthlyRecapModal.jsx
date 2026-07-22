import React, { useRef, useState, useEffect } from 'react'
import { X, Download, Share2, Loader2, Award } from 'lucide-react'
import html2canvas from 'html2canvas'
import { supabase } from '../lib/supabaseClient'
import { calcLevel, getEffectiveTotalExp } from '../lib/expSystem'

const RANK_EXP = { S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }

export default function MonthlyRecapModal({ entries = [], targetMonth, onClose, profile: propProfile, level: propLevel }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [userData, setUserData] = useState({
    name: propProfile?.name || 'TRAINER',
    level: propLevel || 1
  })

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

  const now = targetMonth ? new Date(targetMonth) : new Date()
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const monthlyEntries = entries.filter(e => {
    const d = new Date(e.entry_date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const totalSesi = monthlyEntries.length
  
  const totalExp = monthlyEntries.reduce((acc, curr) => {
    const exp = curr.exp_gained || RANK_EXP[curr.rank] || 0
    return acc + exp
  }, 0)

  const categoryCounts = {}
  monthlyEntries.forEach(e => {
    const cat = e.category || 'Lainnya'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })
  const topKategori = Object.keys(categoryCounts).length > 0
    ? Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b)
    : '-'

  const rankPriority = { 'S': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0, 'E': -1 }
  let bestRank = '-'
  monthlyEntries.forEach(e => {
    if (e.rank && (!bestRank || rankPriority[e.rank] > (rankPriority[bestRank] || 0))) {
      bestRank = e.rank
    }
  })

  const weeklyExp = [0, 0, 0, 0, 0]
  monthlyEntries.forEach(e => {
    const day = new Date(e.entry_date).getDate()
    const weekIndex = Math.min(Math.floor((day - 1) / 7), 4)
    const exp = e.exp_gained || RANK_EXP[e.rank] || 0
    weeklyExp[weekIndex] += exp
  })
  const maxWeeklyExp = Math.max(...weeklyExp, 1)

  const handleAction = async (actionType) => {
    if (!cardRef.current || downloading) return
    setDownloading(true)

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A0A0E',
        scale: 4, 
        useCORS: true,
        logging: false
      })

      if (actionType === 'download') {
        const image = canvas.toDataURL('image/png', 1.0)
        const link = document.createElement('a')
        link.href = image
        link.download = `GrindLog_Rekap_${monthName.replace(/\s+/g, '_')}.png`
        link.click()
        setDownloading(false)
      } else if (actionType === 'share') {
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error('Blob gagal dibuat')
          const file = new File([blob], `GrindLog_Rekap_${monthName.replace(/\s+/g, '_')}.png`, { type: 'image/png' })
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: 'Daily Grind Log',
                text: `Rekap Bulan ${monthName}`,
                files: [file]
              })
            } catch (shareErr) {
              console.error('Batal share:', shareErr)
            }
          } else {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = file.name
            link.click()
            URL.revokeObjectURL(url)
          }
          setDownloading(false)
        }, 'image/png', 1.0)
      }
    } catch (err) {
      console.error('Gagal memproses gambar:', err)
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between text-white">
          <span className="font-mono text-xs text-[#8B8696] uppercase tracking-wider">
            PRATINJAU KARTU
          </span>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#211D2C] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div 
          ref={cardRef} 
          className="bg-[#0A0A0E] border border-[#211D2C] p-5 rounded-none flex flex-col gap-5 text-white relative shadow-2xl select-none"
        >
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-[#7C5CFF]" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-[#7C5CFF]" />

          <div className="flex items-center justify-between border-b border-[#211D2C] pb-4">
            <div className="flex items-center gap-3">
              <img 
                src="/icons/icon-maskable.png" 
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

            <div className="flex flex-col items-end pl-2">
              <span className="font-display font-black text-xs text-[#7C5CFF] tracking-wider uppercase max-w-[100px] text-right leading-relaxed break-words">
                {userData.name}
              </span>
              <span className="font-mono text-[9px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">
                LV.{userData.level}
              </span>
            </div>
          </div>

          {/* FIX: Mengganti flex gap dengan block margin dan leading-none biar html2canvas nggak ngaco baca baseline teksnya */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col">
              <span className="font-mono text-[9px] text-[#8B8696] uppercase tracking-wider block leading-none mb-1.5">TOTAL SESI</span>
              <span className="font-display font-black text-xl text-[#7C5CFF] block leading-none">{totalSesi}</span>
            </div>
            <div className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col">
              <span className="font-mono text-[9px] text-[#8B8696] uppercase tracking-wider block leading-none mb-1.5">TOTAL EXP</span>
              <span className="font-display font-black text-xl text-[#7C5CFF] block leading-none">{totalExp}</span>
            </div>
            <div className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col">
              <span className="font-mono text-[9px] text-[#8B8696] uppercase tracking-wider block leading-none mb-1.5">BEST RANK</span>
              <span className="font-display font-black text-xl text-[#7C5CFF] block leading-none">{bestRank}</span>
            </div>
            <div className="bg-[#100E16] border border-[#211D2C] p-3 flex flex-col">
              <span className="font-mono text-[9px] text-[#8B8696] uppercase tracking-wider block leading-none mb-1.5">TOP KATEGORI</span>
              <span className="font-display font-black text-sm text-[#7C5CFF] block leading-tight break-words">{topKategori}</span>
            </div>
          </div>

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

          <div className="pt-2 border-t border-[#211D2C]/50 flex items-center justify-between">
            <span className="font-mono text-[8px] text-[#8B8696] uppercase tracking-wider">
              Dibuat otomatis oleh Daily Grind Log
            </span>
          </div>

        </div>

        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={() => handleAction('download')}
            disabled={downloading}
            className="flex-1 py-3 bg-[#211D2C] hover:bg-[#2d283c] text-white font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={16} />
            <span>UNDUH</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleAction('share')}
            disabled={downloading}
            className="flex-[2] py-3 bg-[#7C5CFF] hover:bg-[#6b52e0] text-white font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>MEMPROSES...</span>
              </>
            ) : (
              <>
                <Share2 size={16} />
                <span>BAGIKAN KARTU</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

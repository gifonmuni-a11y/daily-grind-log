import React, { useEffect, useState } from 'react'

export default function SecurityGuard() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // 1. Blokir Klik Kanan
    const handleContextMenu = (e) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)

    // 2. Blokir Seleksi Teks (Anti-scraping)
    document.body.style.userSelect = 'none'

    // 3. Deteksi Screenshot (Deterrence/Peringatan)
    // Seringkali saat screenshot di mobile, browser akan kehilangan fokus (blur) sejenak
    const handleBlur = () => {
      // Ini nembak peringatan kalau aplikasi kehilangan fokus
      // User bakal ngira mereka ketangkep basah
      setShowWarning(true)
    }

    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('blur', handleBlur)
      document.body.style.userSelect = 'auto'
    }
  }, [])

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-[#100E16] border border-red-500/50 p-8 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <h1 className="text-red-500 font-black text-2xl mb-4 uppercase tracking-widest">PERINGATAN!</h1>
            <p className="text-white font-mono text-sm">GRIND mendeteksi screenshot anda. Segala bentuk pencurian data adalah pelanggaran privasi!</p>
            <button 
              onClick={() => setShowWarning(false)} 
              className="mt-6 px-6 py-3 bg-red-500 text-white font-bold rounded-lg w-full"
            >
              MENGERTI
            </button>
          </div>
        </div>
      )}
    </>
  )
}

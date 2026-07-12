import React, { useEffect } from 'react'

export default function SecurityGuard() {
  useEffect(() => {
    // 1. Blokir Klik Kanan (Desktop)
    const handleContextMenu = (e) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)

    // 2. Blokir Seleksi Teks & Gambar (Anti-scraping)
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.body.style.userSelect = 'auto'
    }
  }, [])

  // 🎯 Pop-up blur/screenshot dihapus total biar gak ngeganggu lu lagi
  return null
}

import { useEffect, useState } from 'react'

export default function useMonthlyRecap() {
  const [showRecap, setShowRecap] = useState(false)
  const [recapMonth, setRecapMonth] = useState(null)

  useEffect(() => {
    const today = new Date()
    if (today.getDate() !== 1) return

    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const storageKey = `recap_shown_${prevMonth.getFullYear()}-${prevMonth.getMonth()}`

    if (!localStorage.getItem(storageKey)) {
      setRecapMonth(prevMonth)
      setShowRecap(true)
      localStorage.setItem(storageKey, 'true')
    }
  }, [])

  return { showRecap, recapMonth, closeRecap: () => setShowRecap(false) }
}
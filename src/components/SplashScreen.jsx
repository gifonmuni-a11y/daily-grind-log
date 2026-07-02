import { useEffect, useState } from 'react'
import SystemFrame from './SystemFrame'

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('INITIALIZING SYSTEM...')

  useEffect(() => {
    const steps = [
      { pct: 20, text: 'LOADING MODULES...', delay: 300 },
      { pct: 50, text: 'SYNCING DATA...', delay: 700 },
      { pct: 80, text: 'CALIBRATING EXP ENGINE...', delay: 1200 },
      { pct: 100, text: 'SYSTEM READY', delay: 1700 },
    ]

    steps.forEach(({ pct, text, delay }) => {
      setTimeout(() => {
        setProgress(pct)
        setStatusText(text)
      }, delay)
    })

    setTimeout(() => {
      onComplete()
    }, 2400)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-8 w-full max-w-xs px-6">
        <SystemFrame className="px-8 py-6 text-center" size={20}>
          <h1 className="font-display text-4xl font-bold text-accent tracking-widest">
            DAILY
          </h1>
          <h1 className="font-display text-4xl font-bold text-text-high tracking-widest">
            GRIND LOG
          </h1>
        </SystemFrame>

        <div className="w-full">
          <div className="flex justify-between mb-2">
            <span className="font-mono text-xs text-text-dim uppercase">System Load</span>
            <span className="font-mono text-xs text-accent">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7C5CFF, #2DD4BF)',
              }}
            />
          </div>
          <p className="font-mono text-xs text-text-dim mt-3 text-center tracking-widest">
            {statusText}
          </p>
        </div>
      </div>
    </div>
  )
}

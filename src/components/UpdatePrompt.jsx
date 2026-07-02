import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registration && setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000)
    },
  })

  function close() {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[100]">
      <div
        className="p-4 flex items-start gap-3"
        style={{ background: '#100E16', border: '1px solid #7C5CFF55', boxShadow: '0 0 20px #00000088' }}
      >
        <RefreshCw size={18} className="text-accent shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {needRefresh ? (
            <>
              <p className="font-display font-semibold text-sm text-text-high mb-1">
                Update tersedia
              </p>
              <p className="font-body text-xs text-gray-400 mb-3">
                Ada versi baru Daily Grind Log. Karena app ini PWA, versi lama bisa masih
                tersimpan di HP/browser kamu — tekan tombol di bawah untuk refresh dan pakai
                versi terbaru. Kalau masih terasa sama, coba clear cache/data situs ini.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="font-mono text-xs px-3 py-1.5 shrink-0"
                  style={{ background: '#7C5CFF', color: '#EDEAF6' }}
                >
                  REFRESH SEKARANG
                </button>
                <button
                  onClick={close}
                  className="font-mono text-xs px-3 py-1.5 shrink-0 text-gray-400"
                  style={{ border: '1px solid #211D2C' }}
                >
                  NANTI
                </button>
              </div>
            </>
          ) : (
            <p className="font-body text-xs text-gray-400">
              App siap dipakai offline.
            </p>
          )}
        </div>
        <button onClick={close} className="shrink-0 p-1 hover:bg-border-hover transition-colors">
          <X size={14} className="text-gray-500" />
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2, AlertTriangle, SkipForward, SkipBack, PictureInPicture2, ListMusic } from 'lucide-react'

// v2 — nambah: queue, next/prev manual, auto-advance pas lagu abis,
// dan Picture-in-Picture (kalau browser-nya support documentPictureInPicture).

let ytApiPromise = null
function loadYouTubeIframeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise((resolve) => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => resolve(window.YT)
  })
  return ytApiPromise
}

export default function YouTubeSearchPlayer() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [pipSupported, setPipSupported] = useState(false)
  const [pipActive, setPipActive] = useState(false)

  const debounceRef = useRef(null)
  const playerContainerRef = useRef(null)
  const playerRef = useRef(null)
  const pipWindowRef = useRef(null)
  const queueRef = useRef(queue)
  const currentIndexRef = useRef(currentIndex)

  queueRef.current = queue
  currentIndexRef.current = currentIndex

  const nowPlaying = currentIndex >= 0 ? queue[currentIndex] : null

  useEffect(() => {
    setPipSupported(typeof window !== 'undefined' && 'documentPictureInPicture' in window)
  }, [])

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setError(''); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mencari lagu.')
      setResults((data.items || []).slice(0, 6))
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(query), 450)
    return () => clearTimeout(debounceRef.current)
  }, [query, runSearch])

  function goToIndex(index) {
    const q = queueRef.current
    if (index < 0 || index >= q.length) return
    setCurrentIndex(index)
    const track = q[index]
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(track.videoId)
    }
  }

  function handleNext() {
    goToIndex(currentIndexRef.current + 1)
  }

  function handlePrev() {
    goToIndex(currentIndexRef.current - 1)
  }

  function playNow(track) {
    setQueue(q => {
      const exists = q.findIndex(t => t.videoId === track.videoId)
      if (exists !== -1) {
        setCurrentIndex(exists)
        return q
      }
      const newQueue = [...q, track]
      setCurrentIndex(newQueue.length - 1)
      return newQueue
    })
  }

  function addToQueue(track) {
    setQueue(q => (q.find(t => t.videoId === track.videoId) ? q : [...q, track]))
  }

  // Inisialisasi YT Player sekali, dipasang ke div kontainer.
  useEffect(() => {
    let cancelled = false
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !playerContainerRef.current || playerRef.current) return
      playerRef.current = new YT.Player(playerContainerRef.current, {
        height: '100%',
        width: '100%',
        playerVars: { autoplay: 1, playsinline: 1 },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              handleNext()
            }
          },
        },
      })
    })
    return () => { cancelled = true }
  }, [])

  // Load video baru pas currentIndex berubah (misal dari klik hasil search).
  useEffect(() => {
    if (!nowPlaying || !playerRef.current || !playerRef.current.loadVideoById) return
    playerRef.current.loadVideoById(nowPlaying.videoId)
  }, [currentIndex])

  async function togglePip() {
    if (!pipSupported) return
    try {
      if (pipActive && pipWindowRef.current) {
        pipWindowRef.current.close()
        return
      }
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 320,
        height: 220,
      })
      pipWindowRef.current = pipWin
      setPipActive(true)

      const holder = document.createElement('div')
      holder.style.cssText = 'width:100%;height:100%;background:#000;'
      pipWin.document.body.style.margin = '0'
      pipWin.document.body.appendChild(holder)
      const playerEl = document.getElementById(playerRef.current.getIframe().id)
      holder.appendChild(playerEl)

      pipWin.addEventListener('pagehide', () => {
        if (playerContainerRef.current) {
          playerContainerRef.current.appendChild(playerEl)
        }
        setPipActive(false)
        pipWindowRef.current = null
      })
    } catch (err) {
      console.log('PIP error:', err)
    }
  }

  return (
    <div>
      <div className="relative mb-2">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari lagu di YouTube..."
          className="w-full font-body text-xs py-2 pl-8 pr-8 outline-none transition-colors"
          style={{ background: '#0A0A0E', border: '1px solid #211D2C', color: '#EDEAF6' }}
          onFocus={e => e.target.style.borderColor = '#7C5CFF'}
          onBlur={e => e.target.style.borderColor = '#211D2C'}
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim">
            <X size={13} />
          </button>
        )}
        {loading && (
          <Loader2 size={13} className="absolute right-8 top-1/2 -translate-y-1/2 text-accent animate-spin" />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 px-2.5 py-2 mb-2" style={{ background: '#0A0A0E', border: '1px solid rgba(220,60,60,0.4)' }}>
          <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
          <p className="font-mono text-[10px] text-red-400">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto mb-2">
          {results.map(track => (
            <div
              key={track.videoId}
              className="flex items-center gap-2 p-1.5"
              style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}
            >
              <button onClick={() => playNow(track)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <img src={track.thumb} alt="" className="w-10 h-8 object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-body text-xs truncate" style={{ color: '#EDEAF6' }}>{track.title}</p>
                  <p className="font-mono text-[10px] text-text-dim truncate">{track.channel}</p>
                </div>
              </button>
              <button
                onClick={() => addToQueue(track)}
                className="shrink-0 w-7 h-7 flex items-center justify-center text-text-dim hover:text-accent transition-colors"
                title="Tambah ke antrian"
              >
                <ListMusic size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: nowPlaying ? 'block' : 'none' }}>
        <div style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
          <div className="flex items-center gap-2 px-2 py-1.5" style={{ borderBottom: '1px solid #211D2C' }}>
            <p className="font-body text-[11px] truncate flex-1" style={{ color: '#EDEAF6' }}>
              {nowPlaying?.title}
            </p>
            {pipSupported && (
              <button onClick={togglePip} className="shrink-0 text-text-dim hover:text-accent transition-colors" title="Picture-in-Picture">
                <PictureInPicture2 size={14} />
              </button>
            )}
          </div>
          <div className="aspect-video w-full">
            <div ref={playerContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>
          <div className="flex items-center justify-center gap-6 py-2" style={{ borderTop: '1px solid #211D2C' }}>
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="text-text-dim disabled:opacity-30 hover:text-accent transition-colors"
            >
              <SkipBack size={16} />
            </button>
            <span className="font-mono text-[10px] text-text-dim">
              {currentIndex + 1} / {queue.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex >= queue.length - 1}
              className="text-text-dim disabled:opacity-30 hover:text-accent transition-colors"
            >
              <SkipForward size={16} />
            </button>
          </div>
        </div>
      </div>

      {!pipSupported && nowPlaying && (
        <p className="font-mono text-[9px] text-text-dim text-center mt-1.5 uppercase tracking-widest">
          PIP gak didukung browser ini — coba Chrome versi terbaru
        </p>
      )}

      {queue.length > 1 && (
        <div className="mt-3">
          <p className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1.5">Antrian</p>
          <div className="flex flex-col gap-1">
            {queue.map((t, i) => (
              <button
                key={t.videoId}
                onClick={() => goToIndex(i)}
                className="font-mono text-[10px] truncate px-1 text-left"
                style={{ color: i === currentIndex ? '#7C5CFF' : '#6B706A' }}
              >
                {i === currentIndex ? '▶ ' : '· '}{t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {!query && !nowPlaying && (
        <p className="font-mono text-[10px] text-text-dim text-center py-3 uppercase tracking-widest">
          Ketik buat cari lagu
        </p>
      )}
    </div>
  )
}

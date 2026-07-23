import { useState, useEffect, useRef } from 'react'
import { Search, X, AlertTriangle, Play, SkipForward, SkipBack, ListMusic, Trash2, MonitorPlay, Headphones } from 'lucide-react'

// Bersihin HTML entity dari judul video
function decodeHtmlEntities(str) {
  if (!str) return ''
  const entities = {
    '&quot;': '"', '&amp;': '&', '&#39;': "'", '&apos;': "'",
    '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&#x27;': "'", '&#x2F;': '/'
  }
  return str.replace(/&#?\w+;/g, m => entities[m] ?? m)
}

// Load YouTube Iframe API Resmi
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
  const [playMode, setPlayMode] = useState('video') // 'video' atau 'background'
  const playModeRef = useRef(playMode)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [showQueue, setShowQueue] = useState(false)
  const [addedId, setAddedId] = useState(null)
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef(null)

  const playerContainerRef = useRef(null)
  const playerRef = useRef(null)
  const ytReadyRef = useRef(false)
  const searchTimeoutRef = useRef(null)

  const nowPlaying = currentIndex >= 0 ? queue[currentIndex] : null

  useEffect(() => { playModeRef.current = playMode }, [playMode])

  // --- LIVE SEARCH OTOMATIS (Dengan Deteksi Sinyal Lag) ---
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(async () => {
      // Cek koneksi lokal dulu sebelum nembak server
      if (!navigator.onLine) {
        setError('Koneksi internet terputus')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`)
        
        if (res.status === 429) {
          throw new Error('Limit pencarian habis, coba beberapa saat lagi')
        }

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal mencari lagu.')
        setResults(data.items || [])
      } catch (err) {
        // 🎯 FIX: Deteksi apakah eror karena sinyal lag/RTO atau servernya yang down
        if (err.name === 'TypeError' || err.message.includes('fetch')) {
          setError('Koneksi internet lambat / timeout')
        } else {
          setError(err.message || 'Server pencarian sedang sibuk')
        }
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [query])

  // --- ERROR AUTO-DISMISS ---
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleClearSearch = () => {
    setQuery('')
    setResults([])
    setError('')
  }

  // Init YouTube Official Player (Stabil & Sekali Load Permanen)
  useEffect(() => {
    let cancelled = false
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !playerContainerRef.current || playerRef.current) return
      const currentOrigin = window.location.origin

      playerRef.current = new YT.Player(playerContainerRef.current, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1, playsinline: 1, enablejsapi: 1, rel: 0, controls: 1,
          origin: currentOrigin, widget_referrer: currentOrigin
        },
        events: {
          onReady: () => { ytReadyRef.current = true },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              playNextRef.current()
            }
          },
        },
      })
    })
    return () => { cancelled = true }
  }, [])

  const playNextRef = useRef(() => {})
  const playPrevRef = useRef(() => {})

  // --- FUNGSI PUTAR MUSIK ---
  function playIndex(idx) {
    if (idx < 0 || idx >= queue.length) return
    const track = queue[idx]
    setCurrentIndex(idx)

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(track.videoId)
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.channel,
        artwork: [{ src: track.thumb, sizes: '512x512', type: 'image/jpeg' }]
      })
      navigator.mediaSession.setActionHandler('play', () => playerRef.current?.playVideo())
      navigator.mediaSession.setActionHandler('pause', () => playerRef.current?.pauseVideo())
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextRef.current())
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevRef.current())
    }
  }

  function playNext() {
    setQueue(q => {
      setCurrentIndex(ci => {
        const nextIdx = ci + 1
        if (nextIdx < q.length) {
          setTimeout(() => playIndex(nextIdx), 0)
          return ci 
        }
        return ci
      })
      return q
    })
  }

  function playPrev() {
    setQueue(q => {
      setCurrentIndex(ci => {
        const prevIdx = ci - 1
        if (prevIdx >= 0) {
          setTimeout(() => playIndex(prevIdx), 0)
          return ci
        }
        return ci
      })
      return q
    })
  }

  useEffect(() => { playNextRef.current = playNext }, [queue, currentIndex])
  useEffect(() => { playPrevRef.current = playPrev }, [queue, currentIndex])

  function playTrackNow(track) {
    setQueue(prev => {
      const existingIdx = prev.findIndex(t => t.videoId === track.videoId)
      if (existingIdx !== -1) {
        setTimeout(() => playIndex(existingIdx), 0)
        return prev
      }
      const newQueue = [...prev, track]
      setTimeout(() => playIndex(newQueue.length - 1), 0)
      return newQueue
    })
  }

  // Cek antrean ganda
  function addToQueue(track) {
    let alreadyIn = false
    setQueue(prev => {
      if (prev.some(t => t.videoId === track.videoId)) { alreadyIn = true; return prev }
      return [...prev, track]
    })
    setAddedId(track.videoId)
    setTimeout(() => setAddedId(id => (id === track.videoId ? null : id)), 600)
    setToast(alreadyIn ? 'Sudah ada di antrean' : 'Ditambahkan ke antrean')
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 1500)
  }

  function removeFromQueue(idx) {
    setQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== idx)
      if (idx < currentIndex) {
        setCurrentIndex(ci => ci - 1)
      } else if (idx === currentIndex) {
        if (newQueue.length === 0) {
          setCurrentIndex(-1)
          playerRef.current?.stopVideo?.()
        } else {
          const nextIdx = Math.min(idx, newQueue.length - 1)
          setTimeout(() => playIndex(nextIdx), 0)
        }
      }
      return newQueue
    })
  }

  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1
  const hasPrev = currentIndex > 0

  return (
    <div>
      {/* TOGGLE MODE */}
      <div className="flex bg-[#0A0A0E] rounded-lg p-1 mb-3 border border-[#211D2C]">
        <button
          onClick={() => setPlayMode('video')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all ${
            playMode === 'video' ? 'bg-[#7C5CFF] text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <MonitorPlay size={14} /> Video
        </button>
        <button
          onClick={() => setPlayMode('background')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all ${
            playMode === 'background' ? 'bg-[#2DD4BF] text-[#000]' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Headphones size={14} /> Background
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari lagu di YouTube (Live Search)..."
          className="w-full font-body text-xs py-2 pl-8 pr-16 outline-none transition-colors rounded"
          style={{ background: '#0A0A0E', border: '1px solid #211D2C', color: '#EDEAF6' }}
          onFocus={e => e.target.style.borderColor = '#7C5CFF'}
          onBlur={e => e.target.style.borderColor = '#211D2C'}
        />
        
        {loading ? (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="rounded-full animate-bounce" style={{ width: 3, height: 3, background: '#7C5CFF', animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }} />
            ))}
          </span>
        ) : query && (
          <button type="button" onClick={handleClearSearch} className="absolute right-10 top-1/2 -translate-y-1/2 text-text-dim hover:text-white">
            <X size={13} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowQueue(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: showQueue ? '#7C5CFF' : '#6B6580' }}
        >
          <ListMusic size={14} />
        </button>
      </div>

      {/* ERROR BOX */}
      {error && (
        <div onClick={() => setError('')} className="flex items-center justify-center gap-1.5 px-2.5 py-2 mb-3 cursor-pointer transition-opacity rounded-md" style={{ background: '#0A0A0E', border: '1px solid rgba(220,60,60,0.4)' }}>
          <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
          <p className="font-mono text-[10px] text-red-400">{error}</p>
        </div>
      )}

      {/* SKELETON LOADING */}
      {!showQueue && loading && results.length === 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2 p-1.5" style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
              <div className="w-12 h-9 flex-shrink-0 animate-pulse" style={{ background: '#211D2C' }} />
              <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                <div className="h-2.5 rounded-sm animate-pulse" style={{ background: '#211D2C', width: `${70 - i * 10}%` }} />
                <div className="h-2 rounded-sm animate-pulse" style={{ background: '#211D2C', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HASIL SEARCH */}
      {!showQueue && results.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-3">
          {results.map(track => (
            <div key={track.videoId} className="flex items-center gap-2 p-1.5" style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
              <button onClick={() => playTrackNow(track)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <img src={track.thumb} alt="" className="w-12 h-9 object-cover flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[11px] truncate" style={{ color: '#EDEAF6' }}>{decodeHtmlEntities(track.title)}</p>
                  <p className="font-mono text-[9px] text-text-dim truncate mt-0.5">{decodeHtmlEntities(track.channel)}</p>
                </div>
              </button>
              <button
                onClick={() => addToQueue(track)}
                className="px-1 shrink-0 transition-all duration-300 active:scale-90"
                style={{ color: addedId === track.videoId ? '#7C5CFF' : '#6B6580', transform: addedId === track.videoId ? 'scale(1.3)' : 'scale(1)' }}
              >
                <ListMusic size={13} />
              </button>
              <button onClick={() => playTrackNow(track)} className="text-text-dim px-1 shrink-0 transition-transform active:scale-90 active:text-[#7C5CFF]">
                <Play size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TOAST BOX */}
      {toast && (
        <div onClick={() => setToast('')} className="mb-3 cursor-pointer text-center font-body text-[10px] py-1.5 px-3 transition-opacity rounded-md" style={{ background: 'rgba(124,92,255,0.12)', border: '1px solid #7C5CFF', color: '#7C5CFF' }}>
          {toast}
        </div>
      )}

      {/* QUEUE PANEL */}
      {showQueue && (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-3">
          {queue.length === 0 && <p className="font-mono text-[10px] text-text-dim text-center py-3">Antrean kosong</p>}
          {queue.map((track, idx) => (
            <div key={track.videoId + idx} className="flex items-center gap-2 p-1.5" style={{ background: idx === currentIndex ? 'rgba(124,92,255,0.1)' : '#0A0A0E', border: idx === currentIndex ? '1px solid #7C5CFF' : '1px solid #211D2C' }}>
              <button onClick={() => playIndex(idx)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <img src={track.thumb} alt="" className="w-10 h-8 object-cover flex-shrink-0" />
                <p className="font-body text-[11px] truncate" style={{ color: idx === currentIndex ? '#7C5CFF' : '#EDEAF6' }}>
                  {decodeHtmlEntities(track.title)}
                </p>
              </button>
              <button onClick={() => removeFromQueue(idx)} className="text-text-dim px-1 shrink-0">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PLAYER UTAMA */}
      <div style={{ display: nowPlaying ? 'block' : 'none' }}>
        <div style={{ background: '#0A0A0E', border: '1px solid #211D2C', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
          
          <div className="flex items-start gap-2 px-2 py-1.5" style={{ borderBottom: '1px solid #211D2C' }}>
            <p className="font-body text-[11px] flex-1" style={{ color: playMode === 'video' ? '#7C5CFF' : '#2DD4BF' }}>
              Memutar:{' '}
              <span style={{ color: '#EDEAF6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {decodeHtmlEntities(nowPlaying?.title)}
              </span>
            </p>
          </div>

          {/* 🎯 FIX ABSOLUTE CONTAINER: Elemen Iframe YouTube dibuat abadi di sini, tidak dihancurkan saat ganti mode */}
          <div 
            className="aspect-video w-full transition-all duration-300" 
            style={
              playMode === 'video' 
                ? { display: 'block' } 
                : { position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', overflow: 'hidden' }
            }
          >
            <div ref={playerContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Mode Background (Tampilan visual piringan musik pengganti video) */}
          {playMode === 'background' && (
            <div className="aspect-video w-full flex flex-col items-center justify-center relative p-4 bg-[#050508] overflow-hidden">
              <img 
                src={nowPlaying?.thumb} 
                className="w-20 h-20 rounded-full object-cover shadow-[0_0_20px_#2DD4BF] mb-3 animate-[spin_10s_linear_infinite]"
                alt="cover"
              />
              <p className="font-mono text-[10px] text-[#2DD4BF] z-10 font-bold uppercase tracking-widest mb-1 text-center">
                Mode Pemutar Stabil Aktif
              </p>
              <p className="font-mono text-[9px] text-gray-500 z-10">Bebas dari gangguan server sibuk</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 py-2" style={{ borderTop: '1px solid #211D2C' }}>
            <button onClick={playPrev} disabled={!hasPrev} className="disabled:opacity-30 p-2 rounded-full transition-all duration-200 active:scale-90" style={{ color: '#EDEAF6' }}>
              <SkipBack size={16} />
            </button>
            <button onClick={playNext} disabled={!hasNext} className="disabled:opacity-30 p-2 rounded-full transition-all duration-200 active:scale-90" style={{ color: '#EDEAF6' }}>
              <SkipForward size={16} />
            </button>
          </div>
        </div>
      </div>

      {!query && !nowPlaying && !showQueue && (
        <p className="font-mono text-[10px] text-text-dim text-center py-4 uppercase tracking-widest">
          Ketik untuk mencari musik secara live
        </p>
      )}
    </div>
  )
}

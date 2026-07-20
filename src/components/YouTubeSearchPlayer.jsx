import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, AlertTriangle, Play, SkipForward, SkipBack, ListMusic, Trash2 } from 'lucide-react'

// Bersihin HTML entity (&quot; &amp; &#39; dll) dari judul video hasil API
function decodeHtmlEntities(str) {
  if (!str) return ''
  const entities = {
    '&quot;': '"', '&amp;': '&', '&#39;': "'", '&apos;': "'",
    '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&#x27;': "'", '&#x2F;': '/'
  }
  return str.replace(/&#?\w+;/g, m => entities[m] ?? m)
}

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

  // Queue state: array of tracks, currentIndex points into it
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [showQueue, setShowQueue] = useState(false)
  const [addedId, setAddedId] = useState(null)
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef(null)

  const debounceRef = useRef(null)
  const playerContainerRef = useRef(null)
  const playerRef = useRef(null)
  const ytReadyRef = useRef(false)

  const nowPlaying = currentIndex >= 0 ? queue[currentIndex] : null

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

  // Init YT player once
  useEffect(() => {
    let cancelled = false
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !playerContainerRef.current || playerRef.current) return
      const currentOrigin = window.location.origin

      playerRef.current = new YT.Player(playerContainerRef.current, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          enablejsapi: 1,
          rel: 0,
          controls: 1,
          origin: currentOrigin,
          widget_referrer: currentOrigin
        },
        events: {
          onReady: () => { ytReadyRef.current = true },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              playNextRef.current()
            }
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState =
                event.data === YT.PlayerState.PLAYING ? 'playing' : 'paused'
            }
          },
        },
      })
    })
    return () => { cancelled = true }
  }, [])

  // Keep a ref to playNext so the onStateChange closure (created once) always
  // calls the latest version instead of a stale one.
  const playNextRef = useRef(() => {})

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
          // defer actual load to next tick so we use fresh queue
          setTimeout(() => playIndex(nextIdx), 0)
          return ci // will be corrected by playIndex
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

  const playPrevRef = useRef(() => {})
  useEffect(() => { playNextRef.current = playNext }, [queue, currentIndex])
  useEffect(() => { playPrevRef.current = playPrev }, [queue, currentIndex])

  // Tap a search result: add to queue (if not already) and play it immediately
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

  function addToQueue(track) {
    let alreadyIn = false
    setQueue(prev => {
      if (prev.some(t => t.videoId === track.videoId)) { alreadyIn = true; return prev }
      return [...prev, track]
    })

    // Feedback visual: tombol berkedip ungu + toast kecil muncul
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
        // currently playing track removed — stop or move to next
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
      <div className="relative mb-3">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari lagu di YouTube..."
          className="w-full font-body text-xs py-2 pl-8 pr-16 outline-none transition-colors"
          style={{ background: '#0A0A0E', border: '1px solid #211D2C', color: '#EDEAF6' }}
          onFocus={e => e.target.style.borderColor = '#7C5CFF'}
          onBlur={e => e.target.style.borderColor = '#211D2C'}
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-8 top-1/2 -translate-y-1/2 text-text-dim">
            <X size={13} />
          </button>
        )}
        {loading && (
          <span className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="rounded-full animate-bounce"
                style={{
                  width: 3, height: 3, background: '#7C5CFF',
                  animationDelay: `${i * 0.15}s`, animationDuration: '0.9s'
                }}
              />
            ))}
          </span>
        )}
        <button
          onClick={() => setShowQueue(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: showQueue ? '#7C5CFF' : '#6B6580' }}
        >
          <ListMusic size={14} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 px-2.5 py-2 mb-2" style={{ background: '#0A0A0E', border: '1px solid rgba(220,60,60,0.4)' }}>
          <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
          <p className="font-mono text-[10px] text-red-400">{error}</p>
        </div>
      )}

      {/* Skeleton loading (bukan spinner) */}
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

      {/* Search results */}
      {!showQueue && results.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-3">
          {results.map(track => (
            <div
              key={track.videoId}
              className="flex items-center gap-2 p-1.5"
              style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}
            >
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
                style={{
                  color: addedId === track.videoId ? '#7C5CFF' : '#6B6580',
                  transform: addedId === track.videoId ? 'scale(1.3)' : 'scale(1)',
                  filter: addedId === track.videoId ? 'drop-shadow(0 0 4px #7C5CFF)' : 'none'
                }}
                title="Tambah ke antrean"
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

      {/* Toast kecil pas nambah ke antrean */}
      {toast && (
        <div
          className="mb-3 text-center font-body text-[10px] py-1.5 px-3 transition-opacity"
          style={{ background: 'rgba(124,92,255,0.12)', border: '1px solid #7C5CFF', color: '#7C5CFF' }}
        >
          {toast}
        </div>
      )}

      {/* Queue panel */}
      {showQueue && (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-3">
          {queue.length === 0 && (
            <p className="font-mono text-[10px] text-text-dim text-center py-3">Antrean kosong</p>
          )}
          {queue.map((track, idx) => (
            <div
              key={track.videoId + idx}
              className="flex items-center gap-2 p-1.5"
              style={{
                background: idx === currentIndex ? 'rgba(124,92,255,0.1)' : '#0A0A0E',
                border: idx === currentIndex ? '1px solid #7C5CFF' : '1px solid #211D2C'
              }}
            >
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

      {/* Player */}
      <div style={{ display: nowPlaying ? 'block' : 'none' }}>
        <div style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
          <div className="flex items-start gap-2 px-2 py-1.5" style={{ borderBottom: '1px solid #211D2C' }}>
            <p className="font-body text-[11px] flex-1" style={{ color: '#7C5CFF' }}>
              Memutar:{' '}
              <span
                style={{
                  color: '#EDEAF6',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {decodeHtmlEntities(nowPlaying?.title)}
              </span>
            </p>
          </div>
          <div className="aspect-video w-full">
            <div ref={playerContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>
          <div className="flex items-center justify-center gap-4 py-2" style={{ borderTop: '1px solid #211D2C' }}>
            <button
              onClick={playPrev}
              disabled={!hasPrev}
              className="disabled:opacity-30 p-2 rounded-full transition-all duration-200 active:scale-90"
              style={{ color: '#EDEAF6' }}
              onMouseDown={e => { e.currentTarget.style.background = 'rgba(124,92,255,0.25)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(124,92,255,0.6)' }}
              onMouseUp={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
              onTouchStart={e => { e.currentTarget.style.background = 'rgba(124,92,255,0.25)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(124,92,255,0.6)' }}
              onTouchEnd={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={playNext}
              disabled={!hasNext}
              className="disabled:opacity-30 p-2 rounded-full transition-all duration-200 active:scale-90"
              style={{ color: '#EDEAF6' }}
              onMouseDown={e => { e.currentTarget.style.background = 'rgba(124,92,255,0.25)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(124,92,255,0.6)' }}
              onMouseUp={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
              onTouchStart={e => { e.currentTarget.style.background = 'rgba(124,92,255,0.25)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(124,92,255,0.6)' }}
              onTouchEnd={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <SkipForward size={16} />
            </button>
          </div>
        </div>
      </div>

      {!query && !nowPlaying && !showQueue && (
        <p className="font-mono text-[10px] text-text-dim text-center py-4 uppercase tracking-widest">
          Ketik untuk mencari musik
        </p>
      )}
    </div>
  )
}

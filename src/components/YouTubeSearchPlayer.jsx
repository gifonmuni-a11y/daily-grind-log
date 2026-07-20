import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2, AlertTriangle, Play } from 'lucide-react'

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

// Audio kosong untuk memancing Media Session HP
const SILENT_MP3 = "data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq/zD/"

export default function YouTubeSearchPlayer() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nowPlaying, setNowPlaying] = useState(null)

  const debounceRef = useRef(null)
  const playerContainerRef = useRef(null)
  const playerRef = useRef(null)
  const audioRef = useRef(null)

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

  function playVideo(track) {
    setNowPlaying(track)
    
    if (audioRef.current) {
      audioRef.current.play().catch(() => {})
    }

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(track.videoId)
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.channel,
        artwork: [{ src: track.thumb, sizes: '512x512', type: 'image/jpeg' }]
      })

      navigator.mediaSession.setActionHandler('play', () => {
        playerRef.current?.playVideo()
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        playerRef.current?.pauseVideo()
      })
    }
  }

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
          rel: 1,
          controls: 1,
          // 🎯 FIX REKOMENDASI: Wajib inject origin dan referrer biar YT gak ngeblokir klik dari dalam iframe
          origin: currentOrigin,
          widget_referrer: currentOrigin
        },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
               if (audioRef.current) audioRef.current.play().catch(() => {})
               if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing"
            } 
            else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
               if (audioRef.current) audioRef.current.pause()
               if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused"
            }
          },
        },
      })
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <audio ref={audioRef} src={SILENT_MP3} loop playsInline style={{ display: 'none' }} />

      <div className="relative mb-3">
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
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-3">
          {results.map(track => (
            <button
              key={track.videoId}
              onClick={() => playVideo(track)}
              className="flex items-center gap-2 p-1.5 text-left transition-colors hover:border-accent"
              style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}
            >
              <img src={track.thumb} alt="" className="w-12 h-9 object-cover flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-body text-[11px] truncate" style={{ color: '#EDEAF6' }}>{track.title}</p>
                <p className="font-mono text-[9px] text-text-dim truncate mt-0.5">{track.channel}</p>
              </div>
              <Play size={12} className="text-text-dim mr-2 shrink-0" />
            </button>
          ))}
        </div>
      )}

      <div style={{ display: nowPlaying ? 'block' : 'none' }}>
        <div style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
          <div className="flex items-center gap-2 px-2 py-1.5" style={{ borderBottom: '1px solid #211D2C' }}>
            <p className="font-body text-[11px] truncate flex-1" style={{ color: '#7C5CFF' }}>
              Memutar: <span style={{ color: '#EDEAF6' }}>{nowPlaying?.title}</span>
            </p>
          </div>
          <div className="aspect-video w-full">
            <div ref={playerContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>

      {!query && !nowPlaying && (
        <p className="font-mono text-[10px] text-text-dim text-center py-4 uppercase tracking-widest">
          Ketik untuk mencari musik
        </p>
      )}
    </div>
  )
}
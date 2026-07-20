import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2, AlertTriangle, Play } from 'lucide-react'

// v3 — Clean version: No custom queue, No PiP manual, full Native YouTube Player features
// Ditambah trik Dummy Audio biar tembus Background Play di HP.

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

// URL audio kosong (silent mp3) berdurasi 0.1 detik untuk menipu OS HP
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
  const audioRef = useRef(null) // Ref untuk audio dummy

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

  // Fungsi Play Track Baru (Dipanggil pas user klik hasil search)
  function playVideo(track) {
    setNowPlaying(track)
    
    // Pancing audio dummy untuk minta izin background play ke OS
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio dummy pancingan gagal:', e))
    }

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(track.videoId)
    }

    // Update info di Lock Screen HP
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.channel,
        artwork: [{ src: track.thumb, sizes: '512x512', type: 'image/jpeg' }]
      })

      // Sambungkan tombol play/pause di lock screen HP ke Iframe YouTube
      navigator.mediaSession.setActionHandler('play', () => {
        playerRef.current?.playVideo()
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        playerRef.current?.pauseVideo()
      })
    }
  }

  // Inisialisasi YouTube Player
  useEffect(() => {
    let cancelled = false
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !playerContainerRef.current || playerRef.current) return
      
      playerRef.current = new YT.Player(playerContainerRef.current, {
        height: '100%',
        width: '100%',
        // playerVars dibiarkan standar agar tombol next/rekomendasi bawaan YT muncul
        playerVars: { 
          autoplay: 1, 
          playsinline: 1, 
          enablejsapi: 1,
          rel: 1, // Penting: Biarkan rekomendasi video muncul saat video selesai
          controls: 1 // Munculkan kontrol bawaan YT
        },
        events: {
          onStateChange: (event) => {
            // SINKRONISASI STATUS YOUTUBE DENGAN OS HP LU
            if (event.data === YT.PlayerState.PLAYING) {
               // Putar audio dummy agar HP tidak mematikan PWA di background
               if (audioRef.current) audioRef.current.play().catch(() => {})
               if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing"
            } 
            else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
               // Pause audio dummy
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
      {/* 🎯 AUDIO DUMMY: Kunci utama trik background play */}
      <audio ref={audioRef} src={SILENT_MP3} loop playsInline style={{ display: 'none' }} />

      {/* SEARCH BAR */}
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

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-center gap-1.5 px-2.5 py-2 mb-2" style={{ background: '#0A0A0E', border: '1px solid rgba(220,60,60,0.4)' }}>
          <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
          <p className="font-mono text-[10px] text-red-400">{error}</p>
        </div>
      )}

      {/* SEARCH RESULTS */}
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

      {/* YOUTUBE PLAYER CONTAINER */}
      <div style={{ display: nowPlaying ? 'block' : 'none' }}>
        <div style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
          <div className="flex items-center gap-2 px-2 py-1.5" style={{ borderBottom: '1px solid #211D2C' }}>
            <p className="font-body text-[11px] truncate flex-1" style={{ color: '#7C5CFF' }}>
              Memutar: <span style={{ color: '#EDEAF6' }}>{nowPlaying?.title}</span>
            </p>
          </div>
          {/* Iframe YT akan dirender di dalam div ini */}
          <div className="aspect-video w-full">
            <div ref={playerContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
        
        {/* Catatan Info */}
        <p className="font-mono text-[9px] text-text-dim mt-2 text-center">
          *Klik rekomendasi di dalam video untuk lanjut memutar.
        </p>
      </div>

      {/* EMPTY STATE */}
      {!query && !nowPlaying && (
        <p className="font-mono text-[10px] text-text-dim text-center py-4 uppercase tracking-widest">
          Ketik untuk mencari musik
        </p>
      )}
    </div>
  )
}
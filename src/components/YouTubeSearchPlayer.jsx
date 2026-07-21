import { useState, useEffect, useRef } from 'react'
import { Search, X, AlertTriangle, Play, SkipForward, SkipBack, ListMusic, Trash2, MonitorPlay, FolderMusic, Upload, Timer, Share2, Disc3 } from 'lucide-react'

// Bersihkan HTML entity
function decodeHtmlEntities(str) {
  if (!str) return ''
  const entities = { '&quot;': '"', '&amp;': '&', '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' }
  return str.replace(/&#?\w+;/g, m => entities[m] ?? m)
}

// Inisialisasi Database Lokal (IndexedDB) untuk MP3
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HoarderMusicDB', 1)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('local_songs')) {
        db.createObjectStore('local_songs', { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Load YouTube API
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
  const [activeTab, setActiveTab] = useState('youtube') // 'youtube' atau 'local'
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  
  const [localSongs, setLocalSongs] = useState([])
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [showQueue, setShowQueue] = useState(false)
  const [addedId, setAddedId] = useState(null)
  
  const [sleepTimer, setSleepTimer] = useState(null) // Dalam menit

  const playerContainerRef = useRef(null)
  const playerRef = useRef(null)
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)
  const searchTimeoutRef = useRef(null)
  const toastTimerRef = useRef(null)

  const nowPlaying = currentIndex >= 0 ? queue[currentIndex] : null

  // --- MUAT LAGU LOKAL DARI INDEXED DB ---
  const loadLocalSongs = async () => {
    try {
      const db = await initDB()
      const tx = db.transaction('local_songs', 'readonly')
      const store = tx.objectStore('local_songs')
      const request = store.getAll()
      request.onsuccess = () => setLocalSongs(request.result.reverse())
    } catch (err) {
      console.error('Gagal memuat lagu lokal:', err)
    }
  }

  useEffect(() => { loadLocalSongs() }, [])

  // --- HANDLE UPLOAD MP3 ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validasi file
    if (!file.type.includes('audio')) {
      setError('Hanya file audio (MP3/WAV) yang didukung.')
      return
    }

    try {
      const newSong = {
        id: 'local_' + Date.now(),
        type: 'local',
        videoId: 'local_' + Date.now(), // Fallback ID
        title: file.name.replace(/\.[^/.]+$/, ""), // Hapus ekstensi .mp3
        channel: 'Lokal Storage',
        thumb: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop', // Cover default estetik
        blob: file
      }

      const db = await initDB()
      const tx = db.transaction('local_songs', 'readwrite')
      tx.objectStore('local_songs').add(newSong)
      
      tx.oncomplete = () => {
        setToast('Lagu berhasil disimpan ke brankas lokal!')
        loadLocalSongs()
        setActiveTab('local')
      }
    } catch (err) {
      setError('Gagal menyimpan lagu.')
    }
    e.target.value = '' // Reset input
  }

  // --- HAPUS LAGU LOKAL ---
  const deleteLocalSong = async (id, e) => {
    e.stopPropagation()
    try {
      const db = await initDB()
      const tx = db.transaction('local_songs', 'readwrite')
      tx.objectStore('local_songs').delete(id)
      tx.oncomplete = () => loadLocalSongs()
    } catch (err) {
      console.error(err)
    }
  }

  // --- LIVE SEARCH YOUTUBE ---
  useEffect(() => {
    if (activeTab !== 'youtube' || !query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal mencari lagu.')
        
        // Tandai sebagai tipe youtube
        const formatted = (data.items || []).map(item => ({ ...item, type: 'youtube' }))
        setResults(formatted)
      } catch (err) {
        setError('Server pencarian sedang sibuk')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [query, activeTab])

  // --- SLEEP TIMER LOGIC ---
  useEffect(() => {
    if (!sleepTimer) return
    const timerId = setTimeout(() => {
      playerRef.current?.pauseVideo?.()
      audioRef.current?.pause()
      setSleepTimer(null)
      setToast('Waktu habis. Musik dihentikan otomatis 💤')
    }, sleepTimer * 60 * 1000)
    
    return () => clearTimeout(timerId)
  }, [sleepTimer])

  // --- AUTO DISMISS ERROR & TOAST ---
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const showToast = (msg) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2000)
  }

  // --- INIT YOUTUBE PLAYER ---
  useEffect(() => {
    let cancelled = false
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !playerContainerRef.current || playerRef.current) return
      const currentOrigin = window.location.origin

      playerRef.current = new YT.Player(playerContainerRef.current, {
        height: '100%',
        width: '100%',
        playerVars: { autoplay: 1, playsinline: 1, enablejsapi: 1, rel: 0, controls: 1, origin: currentOrigin },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) playNextRef.current()
          },
        },
      })
    })
    return () => { cancelled = true }
  }, [])

  const playNextRef = useRef(() => {})
  const playPrevRef = useRef(() => {})

  // --- FUNGSI PUTAR MUSIK (HYBRID YOUTUBE & LOCAL) ---
  function playIndex(idx) {
    if (idx < 0 || idx >= queue.length) return
    const track = queue[idx]
    setCurrentIndex(idx)

    // Matikan kedua mesin sebelum mengganti lagu
    playerRef.current?.pauseVideo?.()
    audioRef.current?.pause()

    if (track.type === 'local' && track.blob) {
      // Putar via Audio HTML5 Lokal
      const url = URL.createObjectURL(track.blob)
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play().catch(e => console.log('Autoplay ke-block:', e))
      }
    } else {
      // Putar via YouTube Iframe
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(track.videoId)
      }
    }

    // Media Session Update (Lockscreen UI)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.channel,
        artwork: [{ src: track.thumb, sizes: '512x512', type: 'image/jpeg' }]
      })
      navigator.mediaSession.setActionHandler('play', () => {
        track.type === 'local' ? audioRef.current?.play() : playerRef.current?.playVideo()
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        track.type === 'local' ? audioRef.current?.pause() : playerRef.current?.pauseVideo()
      })
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextRef.current())
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevRef.current())
    }
  }

  function playNext() {
    setQueue(q => {
      setCurrentIndex(ci => {
        const nextIdx = ci + 1
        if (nextIdx < q.length) { setTimeout(() => playIndex(nextIdx), 0); return ci }
        return ci
      })
      return q
    })
  }

  function playPrev() {
    setQueue(q => {
      setCurrentIndex(ci => {
        const prevIdx = ci - 1
        if (prevIdx >= 0) { setTimeout(() => playIndex(prevIdx), 0); return ci }
        return ci
      })
      return q
    })
  }

  useEffect(() => { playNextRef.current = playNext }, [queue, currentIndex])
  useEffect(() => { playPrevRef.current = playPrev }, [queue, currentIndex])

  function playTrackNow(track) {
    setQueue(prev => {
      const existingIdx = prev.findIndex(t => (t.id || t.videoId) === (track.id || track.videoId))
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
      if (prev.some(t => (t.id || t.videoId) === (track.id || track.videoId))) { alreadyIn = true; return prev }
      return [...prev, track]
    })
    
    const trackId = track.id || track.videoId
    setAddedId(trackId)
    setTimeout(() => setAddedId(id => (id === trackId ? null : id)), 600)
    showToast(alreadyIn ? 'Sudah ada di antrean' : 'Ditambahkan ke antrean')
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
          audioRef.current?.pause()
        } else {
          const nextIdx = Math.min(idx, newQueue.length - 1)
          setTimeout(() => playIndex(nextIdx), 0)
        }
      }
      return newQueue
    })
  }

  const handleSetTimer = () => {
    if (!sleepTimer) { setSleepTimer(30); showToast('Sleep Timer aktif: 30 Menit') }
    else if (sleepTimer === 30) { setSleepTimer(60); showToast('Sleep Timer aktif: 60 Menit') }
    else { setSleepTimer(null); showToast('Sleep Timer dimatikan') }
  }

  const handleShare = () => {
    // Placeholder untuk Tahap 2 (Web Share / Canvas Image)
    showToast('Fitur Share Kartu Estetik segera hadir! 🎨')
  }

  return (
    <div>
      {/* HIDDEN AUDIO ELEMENT UNTUK MP3 LOKAL */}
      <audio ref={audioRef} onEnded={playNext} />
      <input 
        type="file" 
        accept="audio/mp3, audio/wav, audio/m4a" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* TABS HYBRID (YOUTUBE vs LOKAL) */}
      <div className="flex bg-[#0A0A0E] rounded-lg p-1 mb-3 border border-[#211D2C]">
        <button
          onClick={() => setActiveTab('youtube')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all ${
            activeTab === 'youtube' ? 'bg-[#7C5CFF] text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <MonitorPlay size={14} /> YouTube
        </button>
        <button
          onClick={() => setActiveTab('local')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all ${
            activeTab === 'local' ? 'bg-[#2DD4BF] text-[#000]' : 'text-gray-500 hover:text-white'
          }`}
        >
          <FolderMusic size={14} /> Lokal MP3
        </button>
      </div>

      {/* HEADER ACTION (SEARCH ATAU UPLOAD) */}
      <div className="relative mb-3 flex gap-2">
        {activeTab === 'youtube' ? (
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari video & lagu di YouTube..."
              className="w-full font-body text-xs py-2 pl-8 pr-8 outline-none transition-colors rounded"
              style={{ background: '#0A0A0E', border: '1px solid #211D2C', color: '#EDEAF6' }}
              onFocus={e => e.target.style.borderColor = '#7C5CFF'}
              onBlur={e => e.target.style.borderColor = '#211D2C'}
            />
            {loading ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5">
                {[0, 1, 2].map(i => <span key={i} className="w-1 h-1 bg-[#7C5CFF] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </span>
            ) : query && (
              <button onClick={() => { setQuery(''); setResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>
        ) : (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-body rounded border border-dashed border-[#2DD4BF] text-[#2DD4BF] bg-[#050508] hover:bg-[#2DD4BF] hover:text-black transition-all"
          >
            <Upload size={14} /> Tambah Lagu dari HP
          </button>
        )}

        <button
          onClick={() => setShowQueue(s => !s)}
          className="flex items-center justify-center px-3 rounded border border-[#211D2C] bg-[#0A0A0E]"
          style={{ color: showQueue ? '#7C5CFF' : '#6B6580' }}
        >
          <ListMusic size={14} />
        </button>
      </div>

      {/* ERROR / TOAST */}
      {error && (
        <div onClick={() => setError('')} className="flex items-center justify-center gap-1.5 px-2.5 py-2 mb-3 cursor-pointer transition-opacity rounded-md border border-red-900/50 bg-[#0A0A0E]">
          <AlertTriangle size={12} className="text-red-400" />
          <p className="font-mono text-[10px] text-red-400">{error}</p>
        </div>
      )}
      {toast && (
        <div onClick={() => setToast('')} className="mb-3 cursor-pointer text-center font-body text-[10px] py-1.5 px-3 transition-opacity rounded-md" style={{ background: 'rgba(124,92,255,0.12)', border: '1px solid #7C5CFF', color: '#7C5CFF' }}>
          {toast}
        </div>
      )}

      {/* DAFTAR HASIL (YOUTUBE / LOKAL) */}
      {!showQueue && (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-3">
          {/* List Lokal */}
          {activeTab === 'local' && localSongs.length === 0 && (
            <p className="text-center text-[10px] font-mono text-gray-500 py-6">Brankas lokal kosong. Upload file MP3 kamu.</p>
          )}
          
          {(activeTab === 'local' ? localSongs : results).map(track => {
            const trackId = track.id || track.videoId
            return (
              <div key={trackId} className="flex items-center gap-2 p-1.5 bg-[#0A0A0E] border border-[#211D2C] rounded-md">
                <button onClick={() => playTrackNow(track)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <img src={track.thumb} alt="" className="w-12 h-9 object-cover rounded-sm flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[11px] text-[#EDEAF6] truncate">{decodeHtmlEntities(track.title)}</p>
                    <p className="font-mono text-[9px] text-gray-500 truncate mt-0.5">{decodeHtmlEntities(track.channel)}</p>
                  </div>
                </button>

                {activeTab === 'local' && (
                  <button onClick={(e) => deleteLocalSong(track.id, e)} className="text-red-500/50 hover:text-red-500 px-1">
                    <Trash2 size={13} />
                  </button>
                )}

                <button
                  onClick={() => addToQueue(track)}
                  className="px-1 transition-all"
                  style={{ color: addedId === trackId ? (activeTab === 'local' ? '#2DD4BF' : '#7C5CFF') : '#6B6580', transform: addedId === trackId ? 'scale(1.2)' : 'scale(1)' }}
                >
                  <ListMusic size={13} />
                </button>
                <button onClick={() => playTrackNow(track)} className="text-gray-500 px-1 hover:text-[#7C5CFF]">
                  <Play size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ANTRIAN (QUEUE) */}
      {showQueue && (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-3">
          {queue.length === 0 && <p className="font-mono text-[10px] text-gray-500 text-center py-4">Antrean kosong</p>}
          {queue.map((track, idx) => {
            const isPlaying = idx === currentIndex
            const themeColor = track.type === 'local' ? '#2DD4BF' : '#7C5CFF'
            return (
              <div key={(track.id || track.videoId) + idx} className="flex items-center gap-2 p-1.5 rounded border" style={{ background: isPlaying ? `${themeColor}15` : '#0A0A0E', borderColor: isPlaying ? themeColor : '#211D2C' }}>
                <button onClick={() => playIndex(idx)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <img src={track.thumb} alt="" className="w-10 h-8 object-cover rounded-sm" />
                  <p className="font-body text-[11px] truncate" style={{ color: isPlaying ? themeColor : '#EDEAF6' }}>
                    {decodeHtmlEntities(track.title)}
                  </p>
                </button>
                <button onClick={() => removeFromQueue(idx)} className="text-gray-500 px-1 hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* PEMUTAR UTAMA (THE PLAYER) */}
      <div style={{ display: nowPlaying ? 'block' : 'none' }}>
        <div className="bg-[#0A0A0E] border border-[#211D2C] rounded overflow-hidden">
          
          {/* Player Header (Title + Extra Controls) */}
          <div className="flex items-center gap-2 px-2 py-2 border-b border-[#211D2C]">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: nowPlaying?.type === 'local' ? '#2DD4BF' : '#7C5CFF' }}>
                {nowPlaying?.type === 'local' ? 'Lokal MP3 Background' : 'YouTube Video Player'}
              </p>
              <p className="font-body text-[11px] text-[#EDEAF6] truncate">{decodeHtmlEntities(nowPlaying?.title)}</p>
            </div>
            
            {/* SLEEP TIMER & SHARE BUTTONS */}
            <div className="flex items-center gap-2 border-l border-[#211D2C] pl-2">
              <button onClick={handleSetTimer} className="relative transition-colors" style={{ color: sleepTimer ? '#FBBF24' : '#6B6580' }}>
                <Timer size={14} />
                {sleepTimer && <span className="absolute -top-1.5 -right-2 text-[8px] font-bold bg-[#FBBF24] text-black px-1 rounded-full">{sleepTimer}</span>}
              </button>
              <button onClick={handleShare} className="text-[#6B6580] hover:text-white transition-colors">
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {/* VISUAL PLAYER AREA */}
          <div className="aspect-video w-full bg-[#050508] relative flex items-center justify-center overflow-hidden">
            
            {/* Container YouTube (Sembunyi jika muter MP3 Lokal) */}
            <div 
              ref={playerContainerRef} 
              className="absolute inset-0 w-full h-full"
              style={{ opacity: nowPlaying?.type === 'youtube' ? 1 : 0, pointerEvents: nowPlaying?.type === 'youtube' ? 'auto' : 'none' }}
            />

            {/* Visualizer Lokal MP3 (Tampil jika muter MP3 Lokal) */}
            {nowPlaying?.type === 'local' && (
              <div className="flex flex-col items-center justify-center z-10 w-full h-full bg-[#050508]">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full border border-[#2DD4BF] animate-ping opacity-20" />
                  <img src={nowPlaying.thumb} className="w-20 h-20 rounded-full object-cover shadow-[0_0_20px_rgba(45,212,191,0.5)] animate-[spin_8s_linear_infinite]" alt="cover" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#050508] rounded-full border border-[#2DD4BF]" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-[#2DD4BF]">
                  <Disc3 size={12} className="animate-pulse" />
                  <p className="font-mono text-[9px] uppercase tracking-widest">Memutar di Latar Belakang</p>
                </div>
              </div>
            )}
          </div>

          {/* MAIN CONTROLS */}
          <div className="flex items-center justify-center gap-6 py-2.5 border-t border-[#211D2C]">
            <button onClick={playPrev} disabled={!hasPrev} className="disabled:opacity-30 text-[#EDEAF6] active:scale-90 transition-transform">
              <SkipBack size={18} />
            </button>
            <button onClick={playNext} disabled={!hasNext} className="disabled:opacity-30 text-[#EDEAF6] active:scale-90 transition-transform">
              <SkipForward size={18} />
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}

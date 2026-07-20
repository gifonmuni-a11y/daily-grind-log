import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2, AlertTriangle } from 'lucide-react'

// Versi ringkas MusicPlayer, didesain buat nempel di dalam box
// "MUSIC PLAYLIST" pada ProfileHeader — bukan halaman penuh.

export default function YouTubeSearchPlayer() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nowPlaying, setNowPlaying] = useState(null)
  const debounceRef = useRef(null)

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

      {results.length > 0 && !nowPlaying && (
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
          {results.map(track => (
            <button
              key={track.videoId}
              onClick={() => setNowPlaying(track)}
              className="flex items-center gap-2 p-1.5 text-left"
              style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}
            >
              <img src={track.thumb} alt="" className="w-10 h-8 object-cover flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-body text-xs truncate" style={{ color: '#EDEAF6' }}>{track.title}</p>
                <p className="font-mono text-[10px] text-text-dim truncate">{track.channel}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {nowPlaying && (
        <div style={{ background: '#0A0A0E', border: '1px solid #211D2C' }}>
          <div className="flex items-center gap-2 px-2 py-1.5" style={{ borderBottom: '1px solid #211D2C' }}>
            <p className="font-body text-[11px] truncate flex-1" style={{ color: '#EDEAF6' }}>{nowPlaying.title}</p>
            <button onClick={() => setNowPlaying(null)} className="shrink-0 text-text-dim">
              <X size={13} />
            </button>
          </div>
          <div className="aspect-video w-full">
            <iframe
              key={nowPlaying.videoId}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${nowPlaying.videoId}?autoplay=1`}
              title={nowPlaying.title}
              allow="autoplay; encrypted-media"
            />
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

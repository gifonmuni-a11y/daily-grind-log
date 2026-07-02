import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabaseClient'
import SplashScreen from './components/SplashScreen'
import LoginScreen from './components/LoginScreen'
import Home from './pages/Home'

function parseAuthErrorFromUrl() {
  const hash = window.location.hash
  const search = window.location.search
  const raw = hash && hash.length > 1 ? hash.substring(1) : (search && search.length > 1 ? search.substring(1) : '')
  if (!raw) return null
  const params = new URLSearchParams(raw)
  if (params.has('error') || params.has('error_description')) {
    const desc = params.get('error_description') || params.get('error')
    return desc ? desc.replace(/\+/g, ' ') : 'Link login tidak valid atau sudah kedaluwarsa.'
  }
  return null
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    const errorFromUrl = parseAuthErrorFromUrl()
    if (errorFromUrl) {
      setAuthError(errorFromUrl)
    }

    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
      if (window.location.hash || window.location.search) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSplashComplete = useCallback(() => {
    setTimeout(() => setShowSplash(false), 200)
  }, [])

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-text-dim text-xs animate-pulse tracking-widest">
          AUTHENTICATING...
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginScreen initialError={authError} />
  }

  return <Home key={session.user.id} session={session} />
}

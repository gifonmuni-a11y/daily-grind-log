import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import SystemFrame from './SystemFrame'
import { Zap, Mail } from 'lucide-react'

export default function LoginScreen({ initialError }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(initialError || '')

  async function handleSend(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 flex items-center justify-center"
              style={{ background: '#7C5CFF22', border: '2px solid #7C5CFF' }}
            >
              <Zap size={32} className="text-accent" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-text-high tracking-wider">
            DAILY GRIND LOG
          </h1>
          <p className="font-body text-text-muted mt-2 text-sm">
            Track your training. Level up your life.
          </p>
        </div>

        <SystemFrame className="bg-panel p-6" size={18}>
          {!sent ? (
            <form onSubmit={handleSend} className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2 bg-background border border-border px-3 py-2.5">
                  <Mail size={16} className="text-text-dim shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="trainer@email.com"
                    required
                    className="bg-transparent text-text-high font-body text-sm flex-1 outline-none placeholder:text-text-dim"
                  />
                </div>
              </div>

              {error && (
                <p className="font-mono text-xs text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="relative w-full font-display font-semibold text-lg tracking-widest py-3 transition-all"
                style={{
                  background: loading ? '#3A3548' : '#7C5CFF',
                  color: '#EDEAF6',
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                }}
              >
                {loading ? 'MENGIRIM...' : 'KIRIM MAGIC LINK'}
              </button>

              <p className="font-body text-xs text-text-dim text-center">
                Tidak perlu password. Cek email untuk link login.
              </p>
            </form>
          ) : (
            <div className="text-center py-4">
              <div
                className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
                style={{ background: '#2DD4BF22', border: '2px solid #2DD4BF' }}
              >
                <Mail size={28} className="text-accent-jade" />
              </div>
              <h2 className="font-display text-2xl font-bold text-text-high mb-2">
                CEK EMAIL KAMU
              </h2>
              <p className="font-body text-text-muted text-sm">
                Link masuk sudah dikirim ke
              </p>
              <p className="font-mono text-accent text-sm mt-1">{email}</p>
              <p className="font-body text-text-dim text-xs mt-4">
                Klik link di email untuk masuk. Link berlaku 1 jam.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-5 font-mono text-xs text-text-dim underline hover:text-text-muted transition-colors"
              >
                Ganti email
              </button>
            </div>
          )}
        </SystemFrame>
      </div>
    </div>
  )
}

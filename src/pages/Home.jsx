import { useState, useEffect, useCallback } from 'react'
import { Plus, LogOut, HelpCircle, Sparkles, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { calcStreak } from '../lib/streakSystem'
import { calcLevel } from '../lib/expSystem'
import { buildDummyEntries } from '../lib/dummyData'
import ProfileHeader from '../components/ProfileHeader'
import ProfileEditModal from '../components/ProfileEditModal'
import StatusPanel from '../components/StatusPanel'
import StatsDashboard from '../components/StatsDashboard'
import FilterTabs from '../components/FilterTabs'
import EntryCard from '../components/EntryCard'
import CompactRow from '../components/CompactRow'
import LogModal from '../components/LogModal'
import AboutModal from '../components/AboutModal'
import CompanionAI from '../components/CompanionAI'

function filterEntries(entries, filter) {
  const now = new Date()
  const startOf = (unit) => {
    const d = new Date(now)
    if (unit === 'week') {
      const day = d.getDay()
      d.setDate(d.getDate() - day)
    } else if (unit === 'month') {
      d.setDate(1)
    } else if (unit === 'lastMonth') {
      d.setMonth(d.getMonth() - 1)
      d.setDate(1)
    } else if (unit === 'year') {
      d.setMonth(0); d.setDate(1)
    }
    d.setHours(0, 0, 0, 0)
    return d
  }

  if (filter === 'Minggu ini') {
    const start = startOf('week')
    return entries.filter(e => new Date(e.entry_date) >= start)
  }
  if (filter === 'Bulan ini') {
    const start = startOf('month')
    return entries.filter(e => new Date(e.entry_date) >= start)
  }
  if (filter === 'Bulan lalu') {
    const start = startOf('lastMonth')
    const end = startOf('month')
    return entries.filter(e => {
      const d = new Date(e.entry_date)
      return d >= start && d < end
    })
  }
  if (filter === 'Tahun ini') {
    const start = startOf('year')
    return entries.filter(e => new Date(e.entry_date) >= start)
  }
  return entries
}

export default function Home({ session }) {
  const userId = session.user.id
  const [profile, setProfile] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [showLogModal, setShowLogModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [seeding, setSeeding] = useState(false)

  const fetchProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!data) {
      await supabase.from('profiles').upsert({ id: userId, name: 'Trainer' })
      const { data: created } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(created)
    } else {
      setProfile(data)
    }
  }, [userId])

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
    if (!error) setEntries(data || [])
  }, [userId])

  useEffect(() => {
    Promise.all([fetchProfile(), fetchEntries()]).finally(() => setLoading(false))
  }, [fetchProfile, fetchEntries])

  async function handleDelete(id) {
    if (!window.confirm('Hapus entry ini?')) return
    await supabase.from('entries').delete().eq('id', id)
    await fetchEntries()
  }

  function handleEdit(entry) {
    setEditEntry(entry)
    setShowLogModal(true)
  }

  function handleNewLog() {
    setEditEntry(null)
    setShowLogModal(true)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleSeedDummyData() {
    if (seeding) return
    if (!window.confirm('Isi data contoh (5 sesi dummy)? Cocok buat lihat tampilan app sebelum log sesi asli.')) return
    setSeeding(true)
    const maxDay = entries.length > 0 ? Math.max(...entries.map(e => e.day_number)) : 0
    const dummyEntries = buildDummyEntries(userId, maxDay)
    const { error } = await supabase.from('entries').insert(dummyEntries)
    if (error) {
      window.alert('Gagal isi data contoh: ' + error.message)
    } else {
      await fetchEntries()
    }
    setSeeding(false)
  }

  const filteredEntries = filterEntries(entries, activeFilter)
  const cardEntries = filteredEntries.slice(0, 3)
  const compactEntries = filteredEntries.slice(3)
  const streak = calcStreak(entries)
  const totalExp = entries.reduce((sum, e) => sum + ({ S: 100, A: 70, B: 45, C: 20, D: 10, E: 5 }[e.rank] || 0), 0)
  const { level } = calcLevel(totalExp)
  const maxDayNumber = entries.length > 0 ? Math.max(...entries.map(e => e.day_number)) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-text-dim text-sm animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid #211D2C' }}
        >
          <span className="font-display font-bold text-base text-accent tracking-widest">
            DAILY GRIND LOG
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAboutModal(true)}
              className="p-2 hover:bg-border-hover transition-colors"
              title="Tentang & Bantuan"
            >
              <HelpCircle size={16} className="text-text-dim" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-border-hover transition-colors"
              title="Sign out"
            >
              <LogOut size={16} className="text-text-dim" />
            </button>
          </div>
        </div>

        <ProfileHeader
          profile={profile}
          entries={entries}
          streak={streak}
          userId={userId}
          onEditClick={() => setShowProfileModal(true)}
        />

        <StatusPanel entries={entries} />
        <StatsDashboard entries={entries} />

        <FilterTabs active={activeFilter} onChange={setActiveFilter} />

        {filteredEntries.length === 0 ? (
          <div className="mx-4 py-16 text-center">
            <p className="font-display text-2xl font-bold text-text-dim mb-2">NO ENTRIES</p>
            <p className="font-body text-sm text-text-dim mb-6">
              {activeFilter === 'Semua'
                ? 'Belum ada sesi yang dilog. Mulai sekarang!'
                : `Tidak ada sesi di periode "${activeFilter}".`}
            </p>
            {activeFilter === 'Semua' && (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleNewLog}
                  className="font-display font-semibold text-base px-6 py-3 tracking-wider"
                  style={{
                    background: '#7C5CFF',
                    color: '#EDEAF6',
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                  }}
                >
                  LOG SESI PERTAMA
                </button>
                <button
                  onClick={handleSeedDummyData}
                  disabled={seeding}
                  className="font-mono text-xs px-4 py-2 flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
                  style={{ border: '1px solid #211D2C' }}
                >
                  {seeding ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  Isi Data Contoh
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {cardEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                profile={profile}
                level={level}
                streak={streak}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}

            {compactEntries.length > 0 && (
              <div className="mx-4 mb-3" style={{ border: '1px solid #211D2C' }}>
                <div
                  className="flex items-center gap-2 px-4 py-2"
                  style={{ borderBottom: '1px solid #211D2C', background: '#100E16' }}
                >
                  <span className="font-mono text-xs text-text-dim uppercase tracking-widest">
                    {compactEntries.length} Sesi Lainnya
                  </span>
                </div>
                {compactEntries.map(entry => (
                  <CompactRow
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tombol Log Baru digeser ke kiri (right-24) agar tidak menimpa tombol AI */}
      <button
        onClick={handleNewLog}
        className="fixed bottom-6 right-24 w-14 h-14 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-40"
        style={{
          background: '#7C5CFF',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
        title="Log sesi baru"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Komponen Widget Companion AI */}
      <CompanionAI userId={userId} />

      {showLogModal && (
        <LogModal
          userId={userId}
          maxDayNumber={maxDayNumber}
          editEntry={editEntry}
          onClose={() => { setShowLogModal(false); setEditEntry(null) }}
          onSaved={fetchEntries}
        />
      )}

      {showProfileModal && (
        <ProfileEditModal
          profile={profile}
          userId={userId}
          onClose={() => setShowProfileModal(false)}
          onSaved={fetchProfile}
        />
      )}

      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
    </div>
  )
}

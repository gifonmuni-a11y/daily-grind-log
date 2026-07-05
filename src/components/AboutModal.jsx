import { X, Zap, Flame, TrendingUp, RefreshCw, Target, Award, Bot, Lock, CheckCircle2 } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { getRankColor } from '../lib/rankColors'
import { ACHIEVEMENTS, getUnlockedAchievements } from '../lib/achievements'

const RANK_ROWS = [
  { rank: 'S', label: 'Legendary', exp: 100 },
  { rank: 'A', label: 'Excellent', exp: 70 },
  { rank: 'B', label: 'Good', exp: 45 },
  { rank: 'C', label: 'Average', exp: 20 },
  { rank: 'D', label: 'Poor', exp: 10 },
  { rank: 'E', label: 'Failed', exp: 5 },
]

export default function AboutModal({ onClose, entries = [], userId = '' }) {
  // Ambil daftar achievement yang sudah berhasil di-unlock oleh user
  const unlockedAchievements = getUnlockedAchievements(entries)
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,10,14,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <SystemFrame className="bg-panel w-full max-w-lg max-h-[93vh] flex flex-col overflow-hidden" size={16}>
        
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #211D2C' }}
        >
          <h2 className="font-display font-bold text-xl text-text-high">TENTANG & BANTUAN</h2>
          <button onClick={onClose} className="p-1 hover:bg-border-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-6 scrollbar-thin">
          <section>
            <p className="font-body text-sm text-gray-300 leading-relaxed">
              Daily Grind Log adalah jurnal latihan dengan sistem RPG: setiap sesi yang kamu catat
              memberi EXP sesuai kualitasnya, EXP menaikkan level, dan konsistensi harianmu dilacak
              lewat streak.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-accent" />
              <h3 className="font-display font-bold text-base text-text-high">Sistem Rank & EXP</h3>
            </div>
            <p className="font-body text-xs text-gray-400 mb-3">
              Setiap kali log sesi, pilih rank sesuai seberapa baik sesi itu berjalan. Rank menentukan
              EXP yang kamu dapat:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {RANK_ROWS.map(({ rank, label, exp }) => {
                const color = getRankColor(rank, true)
                return (
                  <div
                    key={rank}
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ background: '#0A0A0E', border: `1px solid ${color}44` }}
                  >
                    <span
                      className="font-display font-bold text-lg w-6 text-center"
                      style={{ color }}
                    >
                      {rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-gray-300 truncate">{label}</p>
                      <p className="font-mono text-xs" style={{ color }}>+{exp} EXP</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-accent" />
              <h3 className="font-display font-bold text-base text-text-high">Level & Urutan Tier</h3>
            </div>
            <p className="font-body text-xs text-gray-400 leading-relaxed">
              Total EXP dari semua sesi menentukan level kamu. Semakin tinggi level, semakin besar
              EXP yang dibutuhkan untuk naik. Gelar rank kamu akan naik otomatis sesuai tingkatan level:
            </p>
            <div className="mt-2 font-mono text-[11px] text-gray-300 bg-[#0A0A0E] p-3 border border-[#211D2C] leading-relaxed">
              <div>• <span style={{ color: '#9CA3AF' }}>TRAINER</span> : Level 1+</div>
              <div>• <span style={{ color: '#60A5FA' }}>ELITE TRAINER</span> : Level 5+</div>
              <div>• <span style={{ color: '#F59E0B' }}>EXPERT TRAINER</span> : Level 12+</div>
              <div>• <span style={{ color: '#2DD4BF' }}>CHALLENGER</span> : Level 20+</div>
              <div>• <span style={{ color: '#7C5CFF' }}>MASTER</span> : Level 30+</div>
              <div>• <span style={{ color: '#E14CE3' }}>GRAND MASTER</span> : Level 45+</div>
              <div>• <span style={{ color: '#FF5C7A' }}>MYTHICAL</span> : Level 60+</div>
              <div className="text-accent font-bold animate-pulse">• <span style={{ color: '#FFD24C' }}>OVERLOAD</span> : Level 80+</div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Flame size={16} className="text-danger" />
              <h3 className="font-display font-bold text-base text-text-high">Streak</h3>
            </div>
            <p className="font-body text-xs text-gray-400 leading-relaxed">
              Streak menghitung berapa hari berturut-turut kamu log sesi latihan. Lewatkan satu hari
              tanpa log, streak akan reset ke 0.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-accent" />
              <h3 className="font-display font-bold text-base text-text-high">Daily Quest</h3>
            </div>
            <p className="font-body text-xs text-gray-400 leading-relaxed">
              Tiap hari muncul 3 dari 5 kemungkinan quest, dipilih otomatis dan konsisten sepanjang
              hari itu (gak akan sama persis dengan kombinasi kemarin, besok ganti lagi). Selesaikan
              syaratnya lewat sesi yang kamu log hari itu, lalu ketuk tombol klaim untuk dapat EXP
              bonus — EXP ini langsung nambah ke total EXP dan level kamu.
            </p>
          </section>

          {/* VISUAL POP-UP & BADGE ACHIEVEMENT VFX SECTION */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-accent" />
              <h3 className="font-display font-bold text-base text-text-high">Achievements</h3>
            </div>
            <p className="font-body text-xs text-gray-400 mb-3">
              Badge kebuka otomatis begitu syaratnya kepenuhi. Ketuk badge yang udah kebuka di
              halaman utama untuk dijadikan title profil kamu.
            </p>
            <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1 shrink-0 scrollbar-thin">
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedIds.has(ach.id)
                // Deteksi achievement berstatus EPIC/HARDCORE (misal streak 30 hari atau 100 sesi)
                const isEpic = ach.id === 'unstoppable' || ach.id === 'century'

                // 1. TAMPILAN JIKA TERKUNCI (LOCKED)
                if (!isUnlocked) {
                  return (
                    <div
                      key={ach.id}
                      className="flex items-start gap-3 px-3 py-2.5 border border-dashed border-gray-800 bg-[#07070a] opacity-40 select-none"
                    >
                      <Lock size={14} className="text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-mono text-xs text-gray-500 uppercase tracking-wide font-bold">{ach.title}</p>
                        <p className="font-body text-[11px] text-gray-600 mt-0.5 leading-relaxed">{ach.desc}</p>
                      </div>
                    </div>
                  )
                }

                // 2. TAMPILAN EPIC UNLOCKED (GOLD & CRIMSON LIGHT EXPLOSION TYPE)
                if (isEpic) {
                  return (
                    <div
                      key={ach.id}
                      className="flex items-start gap-3 px-3 py-2.5 border border-rose-500 bg-gradient-to-r from-rose-950/30 via-[#0A0A0E] to-amber-950/20 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse relative overflow-hidden"
                    >
                      {/* Efek Garis Menyala Cyber Fantasy */}
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-rose-500" />
                      <CheckCircle2 size={14} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono text-xs text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 uppercase tracking-wider font-extrabold">
                            🔥 {ach.title}
                          </p>
                          <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 font-mono uppercase font-bold tracking-tight">EPIC</span>
                        </div>
                        <p className="font-body text-[11px] text-gray-200 mt-0.5 leading-relaxed">{ach.desc}</p>
                      </div>
                    </div>
                  )
                }

                // 3. TAMPILAN STANDARD UNLOCKED (GOLD & CYAN NEON UI TYPE)
                return (
                  <div
                    key={ach.id}
                    className="flex items-start gap-3 px-3 py-2.5 border border-cyan-500 bg-gradient-to-r from-cyan-950/20 via-[#0A0A0E] to-amber-950/10 shadow-[0_0_12px_rgba(6,182,212,0.3)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-0.5 h-full bg-cyan-400" />
                    <CheckCircle2 size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-mono text-xs text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-300 uppercase tracking-wide font-bold">
                        {ach.title}
                      </p>
                      <p className="font-body text-[11px] text-gray-300 mt-0.5 leading-relaxed">{ach.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Bot size={16} className="text-accent" />
              <h3 className="font-display font-bold text-base text-text-high">Seolha (AI Companion)</h3>
            </div>
            <p className="font-body text-xs text-gray-400 leading-relaxed">
              Seolha adalah pendamping AI yang tau progress asli kamu (level, streak, total EXP) dan
              bisa diajak diskusi soal latihan. Pertanyaan FAQ gratis (0 energi), sedangkan chat bebas
              pakai energi — 5 energi per hari, reset tiap hari. Buka lewat tombol robot di pojok kanan
              bawah layar.
            </p>
          </section>

          <section
            className="p-3 mb-2 shrink-0"
            style={{ background: '#7C5CFF11', border: '1px solid #7C5CFF33' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={16} className="text-accent" />
              <h3 className="font-display font-bold text-sm text-text-high">Catatan Update App (PWA)</h3>
            </div>
            <p className="font-body text-xs text-gray-400 leading-relaxed">
              App ini berjalan sebagai PWA (bisa di-install seperti app biasa). Setelah ada update
              tampilan/fitur baru, browser/HP kamu mungkin masih menyimpan versi lama. Kalau tampilan
              terasa tidak berubah atau ada yang aneh setelah update, coba{' '}
              <span className="text-text-high font-medium">refresh halaman</span> atau{' '}
              <span className="text-text-high font-medium">clear cache/data situs</span> ini di
              browser kamu.
            </p>
          </section>
        </div>
      </SystemFrame>
    </div>
  )
}

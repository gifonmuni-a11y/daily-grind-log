import { X, Zap, Flame, TrendingUp, RefreshCw } from 'lucide-react'
import SystemFrame from './SystemFrame'
import { getRankColor } from '../lib/rankColors'

const RANK_ROWS = [
  { rank: 'S', label: 'Legendary', exp: 100 },
  { rank: 'A', label: 'Excellent', exp: 70 },
  { rank: 'B', label: 'Good', exp: 45 },
  { rank: 'C', label: 'Average', exp: 20 },
  { rank: 'D', label: 'Poor', exp: 10 },
  { rank: 'E', label: 'Failed', exp: 5 },
]

export default function AboutModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,10,14,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <SystemFrame className="bg-panel w-full max-w-lg max-h-[90vh] overflow-y-auto" size={16}>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #211D2C' }}
        >
          <h2 className="font-display font-bold text-xl text-text-high">TENTANG & BANTUAN</h2>
          <button onClick={onClose} className="p-1 hover:bg-border-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">
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
              <h3 className="font-display font-bold text-base text-text-high">Level</h3>
            </div>
            <p className="font-body text-xs text-gray-400 leading-relaxed">
              Total EXP dari semua sesi menentukan level kamu. Semakin tinggi level, semakin besar
              EXP yang dibutuhkan untuk naik ke level berikutnya. Gelar (Bronze, Silver, Gold,
              Platinum, Diamond, Legend, Mythic) naik otomatis sesuai level.
            </p>
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

          <section
            className="p-3"
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

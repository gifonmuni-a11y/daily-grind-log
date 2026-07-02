const FILTERS = ['Minggu ini', 'Bulan ini', 'Bulan lalu', 'Tahun ini', 'Semua']

export default function FilterTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className="shrink-0 font-mono text-xs px-3 py-1.5 transition-all"
          style={{
            background: active === f ? '#7C5CFF22' : 'transparent',
            color: active === f ? '#7C5CFF' : '#8B8696',
            border: active === f ? '1px solid #7C5CFF66' : '1px solid #211D2C',
          }}
        >
          {f}
        </button>
      ))}
    </div>
  )
}

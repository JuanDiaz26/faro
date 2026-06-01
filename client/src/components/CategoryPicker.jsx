// Grilla de categorías para tocar. Filtra por tipo (expense | income).
export default function CategoryPicker({ categories, type, value, onChange }) {
  const filtered = categories.filter((c) => c.type === type)

  return (
    <div className="grid grid-cols-4 gap-2">
      {filtered.map((cat) => {
        const selected = value === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all ${
              selected
                ? 'ring-2 ring-emerald-500 bg-emerald-50'
                : 'bg-slate-100 hover:bg-slate-200'
            }`}
            style={selected ? { backgroundColor: `${cat.color}22` } : undefined}
          >
            <span className="text-2xl leading-none">{cat.icon}</span>
            <span className="mt-1 text-[10px] leading-tight text-slate-700 line-clamp-2">
              {cat.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

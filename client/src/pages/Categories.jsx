import { useEffect, useState } from 'react'
import { useCategoriesStore } from '../store/categories'
import CategoryForm from '../components/CategoryForm'
import Fab from '../components/Fab'
import BackButton from '../components/BackButton'
import { CardListSkeleton } from '../components/Skeleton'

export default function Categories() {
  const { categories, loading, error, fetch, refresh } = useCategoriesStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetch()
  }, [fetch])

  const expenses = categories.filter((c) => c.type === 'expense')
  const incomes = categories.filter((c) => c.type === 'income')

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (c) => {
    setEditing(c)
    setFormOpen(true)
  }

  return (
    <div className="px-4 pb-4 pt-1.5 space-y-3">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BackButton />
          <h1 className="text-2xl font-bold text-slate-800">Categorías</h1>
        </div>
        <span className="text-xs text-slate-500">{categories.length} en total</span>
      </header>

      {loading && <CardListSkeleton />}
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {!loading && !error && (
        <>
          <Section
            title="Gastos"
            color="text-rose-500"
            items={expenses}
            onItemClick={openEdit}
            emptyMsg="Sin categorías de gasto."
          />
          <Section
            title="Ingresos"
            color="text-emerald-600"
            items={incomes}
            onItemClick={openEdit}
            emptyMsg="Sin categorías de ingreso."
          />
        </>
      )}

      <Fab onClick={openNew} label="Nueva categoría" />

      <CategoryForm
        open={formOpen}
        category={editing}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />
    </div>
  )
}

function Section({ title, color, items, onItemClick, emptyMsg }) {
  return (
    <div>
      <h2 className={`text-xs font-semibold uppercase tracking-wide px-1 mb-1.5 ${color}`}>
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
          {emptyMsg}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {items.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onItemClick(c)}
                className="w-full flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm active:scale-[0.99] transition-transform"
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full text-xl shrink-0"
                  style={{ backgroundColor: `${c.color}22` }}
                >
                  {c.icon}
                </div>
                <div className="min-w-0 text-left">
                  <div className="font-medium text-slate-800 truncate">{c.name}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

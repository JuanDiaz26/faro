import { useEffect, useMemo, useState } from 'react'
import { getTransactions } from '../api/transactions'
import { useCategoriesStore } from '../store/categories'
import { formatMoney, isoFromDate } from '../utils/format'
import TransactionForm from '../components/TransactionForm'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const TYPE_OPTIONS = [
  { v: '', label: 'Todos' },
  { v: 'expense', label: 'Gastos' },
  { v: 'income', label: 'Ingresos' },
]

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
  transfer: 'Transfer',
}

function recentMonths(n = 12) {
  const out = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: `${MESES[d.getMonth()]} ${d.getFullYear()}`,
    })
  }
  return out
}

function relativeDate(isoDate) {
  const today = new Date()
  if (isoDate === isoFromDate(today)) return 'Hoy'
  const y = new Date(today)
  y.setDate(y.getDate() - 1)
  if (isoDate === isoFromDate(y)) return 'Ayer'
  const d = new Date(`${isoDate}T00:00`)
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3).toLowerCase()}`
}

export default function History() {
  const now = new Date()
  const months = useMemo(() => recentMonths(12), [])
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  })
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const { categories, loaded, fetch } = useCategoriesStore()
  useEffect(() => {
    if (!loaded) fetch()
  }, [loaded, fetch])

  const refresh = () => {
    setLoading(true)
    setError(null)
    const params = { month: period.month, year: period.year }
    if (typeFilter) params.type = typeFilter
    if (categoryFilter) params.category_id = Number(categoryFilter)
    getTransactions(params)
      .then(setItems)
      .catch((e) => setError(e.message || 'Error al cargar'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.month, period.year, typeFilter, categoryFilter])

  const ingresos = items
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const gastos = items
    .filter((t) => t.type !== 'income')
    .reduce((s, t) => s + t.amount, 0)
  const total = ingresos - gastos

  return (
    <div className="p-4 space-y-3">
      <header className="pt-4">
        <h1 className="text-2xl font-bold text-slate-800">Historial</h1>
      </header>

      {/* Filtros */}
      <div className="space-y-2">
        <select
          value={`${period.year}-${period.month}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-').map(Number)
            setPeriod({ month: m, year: y })
          }}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          {months.map((m) => (
            <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
              {m.label}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setTypeFilter(opt.v)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === opt.v
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading && <div className="text-slate-500 text-sm">Cargando…</div>}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              No hay transacciones con esos filtros.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(t)}
                    className="w-full flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm active:scale-[0.99] transition-transform"
                  >
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full text-xl shrink-0"
                      style={{ backgroundColor: `${t.category_color}22` }}
                    >
                      {t.category_icon}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium text-slate-800 truncate">
                        {t.description || t.category_name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {t.description ? `${t.category_name} · ` : ''}
                        {relativeDate(t.date)}
                        {t.payment_method && ` · ${PAYMENT_LABELS[t.payment_method]}`}
                      </div>
                    </div>
                    <div
                      className={`font-bold whitespace-nowrap ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '−'} {formatMoney(t.amount)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm text-sm space-y-1">
              <div className="text-slate-500">
                {items.length} transacción{items.length === 1 ? '' : 'es'}
              </div>
              {ingresos > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Ingresos</span>
                  <span className="text-emerald-600 font-semibold">
                    {formatMoney(ingresos)}
                  </span>
                </div>
              )}
              {gastos > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Gastos</span>
                  <span className="text-red-500 font-semibold">
                    {formatMoney(gastos)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-700 font-semibold">Balance</span>
                <span
                  className={`font-bold ${
                    total >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {formatMoney(total)}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <TransactionForm
        open={Boolean(editing)}
        transaction={editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
    </div>
  )
}

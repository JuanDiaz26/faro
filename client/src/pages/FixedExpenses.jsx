import { useCallback, useEffect, useState } from 'react'
import { getFixedExpenses } from '../api/fixedExpenses'
import { formatMoney, daysUntilNextDue } from '../utils/format'
import FixedExpenseForm from '../components/FixedExpenseForm'
import TransactionForm from '../components/TransactionForm'
import Fab from '../components/Fab'

export default function FixedExpenses() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // Para el flujo "Pagar"
  const [payOpen, setPayOpen] = useState(false)
  const [payDefaults, setPayDefaults] = useState(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    getFixedExpenses()
      .then(setItems)
      .catch((e) => setError(e.message || 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const totalMonthly = items.reduce((s, x) => s + x.amount, 0)

  const handlePay = (item, e) => {
    e.stopPropagation()
    setPayDefaults({
      type: 'expense',
      category_id: item.category_id,
      amount: item.amount,
      description: item.name,
    })
    setPayOpen(true)
  }

  return (
    <div className="p-4 space-y-3">
      <header className="pt-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Gastos Fijos</h1>
        {items.length > 0 && (
          <span className="text-xs text-slate-500">
            {items.length} activo{items.length === 1 ? '' : 's'}
          </span>
        )}
      </header>

      {loading && <div className="text-slate-500 text-sm">Cargando…</div>}
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {!loading && !error && (
        <>
          {items.length > 0 && (
            <div className="rounded-2xl bg-slate-800 p-4 text-white shadow-sm">
              <div className="text-xs text-slate-300">Total mensual</div>
              <div className="mt-1 text-3xl font-bold">{formatMoney(totalMonthly)}</div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              No tenés gastos fijos cargados.
              <br />
              Tocá <span className="font-semibold text-beam-600">+</span> para agregar
              tu alquiler, telefonía, suscripciones, etc.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((x) => {
                const daysToDue = daysUntilNextDue(x.due_day)
                return (
                  <li key={x.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(x)
                        setFormOpen(true)
                      }}
                      className="w-full text-left rounded-2xl bg-white p-3 shadow-sm active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-full text-xl shrink-0"
                          style={{ backgroundColor: `${x.category_color}22` }}
                        >
                          {x.category_icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800 truncate">{x.name}</div>
                          <div className="text-xs text-slate-500 truncate">
                            {x.category_name}
                            {x.due_day && ` · día ${x.due_day}`}
                            {daysToDue !== null &&
                              ` · ${daysToDue === 0 ? 'vence hoy' : `en ${daysToDue}d`}`}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-rose-500">
                            {formatMoney(x.amount)}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handlePay(x, e)}
                            className="mt-1 text-[11px] bg-beam-500 text-white px-2.5 py-1 rounded-full font-semibold active:scale-95 shadow-beam"
                          >
                            Pagar
                          </button>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      <Fab
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
        label="Nuevo gasto fijo"
      />

      <FixedExpenseForm
        open={formOpen}
        expense={editing}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />

      <TransactionForm
        open={payOpen}
        defaults={payDefaults}
        onClose={() => setPayOpen(false)}
        onSaved={() => {
          // Después de pagar no necesitamos refrescar fijos (no cambian),
          // pero el Dashboard sí va a re-fetchear cuando vuelvas.
        }}
      />
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { getBudgetStatus } from '../api/budgets'
import { formatMoney, formatMonth } from '../utils/format'
import BudgetForm from '../components/BudgetForm'
import BackButton from '../components/BackButton'

// Devuelve "green" | "amber" | "red" | "none" según porcentaje gastado.
function levelFor(pct, hasBudget) {
  if (!hasBudget) return 'none'
  if (pct >= 100) return 'red'
  if (pct >= 80) return 'amber'
  return 'green'
}

const BAR_COLOR = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
}

const TEXT_COLOR = {
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-rose-600',
}

export default function Budgets() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    getBudgetStatus(month, year)
      .then(setStatus)
      .catch((e) => setError(e.message || 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [month, year])

  useEffect(() => {
    refresh()
  }, [refresh])

  const withBudget = (status?.items || []).filter((i) => i.monthly_limit != null)
  const withoutBudget = (status?.items || []).filter((i) => i.monthly_limit == null)
  const totalPct =
    status && status.total_limit > 0
      ? (status.total_spent_in_budgeted / status.total_limit) * 100
      : 0

  return (
    <div className="px-4 pb-4 pt-1.5 space-y-3">
      <header className="flex items-center gap-1">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Presupuestos</h1>
          <p className="text-sm text-slate-500">{formatMonth(now)}</p>
        </div>
      </header>

      {loading && <div className="text-slate-500 text-sm">Cargando…</div>}
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {!loading && !error && status && (
        <>
          {/* Resumen global */}
          {status.budgets_count > 0 && (
            <div className="rounded-2xl bg-slate-800 p-4 text-white shadow-sm">
              <div className="flex items-baseline justify-between">
                <div className="text-xs text-slate-300">Total gastado / presupuestado</div>
                {status.over_budget_count > 0 && (
                  <div className="text-[10px] bg-rose-500/20 text-red-200 px-2 py-0.5 rounded-full">
                    🚨 {status.over_budget_count} excedidas
                  </div>
                )}
              </div>
              <div className="mt-1 text-2xl font-bold">
                {formatMoney(status.total_spent_in_budgeted)}{' '}
                <span className="text-slate-400 text-base font-normal">
                  / {formatMoney(status.total_limit)}
                </span>
              </div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    totalPct >= 100 ? 'bg-rose-500' : totalPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, totalPct)}%` }}
                />
              </div>
            </div>
          )}

          {/* Con presupuesto */}
          {withBudget.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 px-1 mb-2">
                Con límite
              </h2>
              <ul className="space-y-2">
                {withBudget.map((i) => (
                  <BudgetCard key={i.category_id} item={i} onClick={() => setEditing(i)} />
                ))}
              </ul>
            </div>
          )}

          {/* Sin presupuesto */}
          {withoutBudget.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 px-1 mb-2 mt-4">
                Sin límite definido
              </h2>
              <ul className="space-y-2">
                {withoutBudget.map((i) => (
                  <UnbudgetedCard key={i.category_id} item={i} onClick={() => setEditing(i)} />
                ))}
              </ul>
            </div>
          )}

          {withBudget.length === 0 && (
            <div className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
              Tocá cualquier categoría de abajo para ponerle un límite mensual.
            </div>
          )}
        </>
      )}

      <BudgetForm
        open={Boolean(editing)}
        item={editing}
        month={month}
        year={year}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
    </div>
  )
}

function BudgetCard({ item, onClick }) {
  const pct = item.monthly_limit > 0 ? (item.spent / item.monthly_limit) * 100 : 0
  const level = levelFor(pct, true)
  const remaining = item.monthly_limit - item.spent

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99] transition-transform space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">{item.category_icon}</span>
            <span className="font-medium text-slate-800 truncate">{item.category_name}</span>
          </div>
          <div className={`text-sm font-bold ${TEXT_COLOR[level]}`}>
            {Math.round(pct)}%
          </div>
        </div>

        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${BAR_COLOR[level]} transition-all`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-500">
          <span>
            {formatMoney(item.spent)} de {formatMoney(item.monthly_limit)}
          </span>
          <span className={remaining < 0 ? 'text-rose-600 font-semibold' : ''}>
            {remaining >= 0
              ? `Quedan ${formatMoney(remaining)}`
              : `Excedido en ${formatMoney(-remaining)}`}
          </span>
        </div>
      </button>
    </li>
  )
}

function UnbudgetedCard({ item, onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{item.category_icon}</span>
          <div className="min-w-0">
            <div className="font-medium text-slate-800 truncate">{item.category_name}</div>
            <div className="text-xs text-slate-500">
              Gastado {formatMoney(item.spent)} · sin límite
            </div>
          </div>
        </div>
        <span className="text-xs text-beam-600 font-semibold">Definir →</span>
      </button>
    </li>
  )
}

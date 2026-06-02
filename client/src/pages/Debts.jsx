import { useCallback, useEffect, useState } from 'react'
import { getDebts } from '../api/debts'
import { formatMoney, daysUntilNextDue } from '../utils/format'
import DebtForm from '../components/DebtForm'
import Fab from '../components/Fab'

export default function Debts() {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    getDebts()
      .then(setDebts)
      .catch((e) => setError(e.message || 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const totalRemaining = debts.reduce((sum, d) => sum + d.remaining_amount, 0)

  return (
    <div className="p-4 space-y-3">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Deudas</h1>
        {debts.length > 0 && (
          <span className="text-xs text-slate-500">
            {debts.length} activa{debts.length === 1 ? '' : 's'}
          </span>
        )}
      </header>

      {loading && <div className="text-slate-500 text-sm">Cargando…</div>}
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {!loading && !error && (
        <>
          {debts.length > 0 && (
            <div className="rounded-2xl bg-slate-800 p-4 text-white shadow-sm">
              <div className="text-xs text-slate-300">Total adeudado</div>
              <div className="mt-1 text-3xl font-bold">{formatMoney(totalRemaining)}</div>
            </div>
          )}

          {debts.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              No tenés deudas cargadas todavía.
              <br />
              Tocá el botón <span className="font-semibold text-beam-600">+</span> para
              agregar tu tarjeta o préstamo.
            </div>
          ) : (
            <ul className="space-y-2">
              {debts.map((d) => (
                <DebtCard key={d.id} debt={d} onClick={() => setEditing(d)} />
              ))}
            </ul>
          )}
        </>
      )}

      <Fab onClick={() => setCreating(true)} label="Nueva deuda" />

      <DebtForm
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={refresh}
      />

      <DebtForm
        open={Boolean(editing)}
        debt={editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
    </div>
  )
}

function DebtCard({ debt, onClick }) {
  const paid = debt.total_amount - debt.remaining_amount
  const pctPaid = debt.total_amount > 0 ? Math.min(100, (paid / debt.total_amount) * 100) : 0
  const daysToDue = daysUntilNextDue(debt.due_day)

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99] transition-transform space-y-2"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 truncate">{debt.name}</h3>
          {debt.due_day && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full whitespace-nowrap">
              📅 día {debt.due_day}
            </span>
          )}
        </div>

        <div className="text-2xl font-bold text-rose-500">
          {formatMoney(debt.remaining_amount)}
        </div>

        {debt.total_amount > 0 && (
          <>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${pctPaid}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>de {formatMoney(debt.total_amount)}</span>
              <span>{Math.round(pctPaid)}% pagado</span>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 pt-1">
          {daysToDue !== null && (
            <span>
              Vence en <span className="font-semibold text-slate-700">{daysToDue} días</span>
            </span>
          )}
          {debt.minimum_payment > 0 && (
            <span>
              Mínimo:{' '}
              <span className="font-semibold text-slate-700">
                {formatMoney(debt.minimum_payment)}
              </span>
            </span>
          )}
          {debt.interest_rate > 0 && (
            <span>
              TNA: <span className="font-semibold text-slate-700">{debt.interest_rate}%</span>
            </span>
          )}
        </div>
      </button>
    </li>
  )
}

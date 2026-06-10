import { useCallback, useEffect, useState } from 'react'
import { getGoals, getMovements, getSavingsSummary } from '../api/savings'
import { formatMoney, formatMonth } from '../utils/format'
import SavingsGoalForm from '../components/SavingsGoalForm'
import SavingsMovementForm from '../components/SavingsMovementForm'
import Fab from '../components/Fab'
import { CardListSkeleton } from '../components/Skeleton'

const SOURCE_LABELS = {
  sueldo: '💼 Sueldo',
  aguinaldo: '🎁 Aguinaldo',
  bono: '⭐ Bono',
  extra: '💸 Extra',
  otro: '📦 Otro',
}

export default function Savings() {
  const [goals, setGoals] = useState([])
  const [looseMovements, setLooseMovements] = useState([])
  const [summary, setSummary] = useState({
    total_saved: 0,
    month_saved: 0,
    loose_saved: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modales
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [movementFormOpen, setMovementFormOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState(null)

  const now = new Date()

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getGoals(),
      getMovements({ only_loose: 'true' }),
      getSavingsSummary(now.getMonth() + 1, now.getFullYear()),
    ])
      .then(([g, m, s]) => {
        setGoals(g)
        setLooseMovements(m)
        setSummary(s)
      })
      .catch((e) => setError(e.message || 'Error al cargar'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="px-4 pb-4 pt-1.5 space-y-3">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Ahorro</h1>
        <button
          type="button"
          onClick={() => {
            setEditingGoal(null)
            setGoalFormOpen(true)
          }}
          className="text-xs text-beam-600 font-semibold"
        >
          + Nueva meta
        </button>
      </header>

      {loading && <CardListSkeleton />}
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Total ahorrado */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-sm">
            <div className="text-xs text-emerald-100">Total ahorrado</div>
            <div className="mt-1 text-3xl font-bold">{formatMoney(summary.total_saved)}</div>
            <div className="mt-3 flex items-center justify-between text-xs text-emerald-50">
              <span>
                En {formatMonth(now)}:{' '}
                <span className="font-semibold">{formatMoney(summary.month_saved)}</span>
              </span>
              {summary.loose_saved > 0 && (
                <span>
                  Suelto: <span className="font-semibold">{formatMoney(summary.loose_saved)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Metas */}
          <div>
            <h2 className="text-sm font-semibold text-slate-600 px-1 mb-2">
              Metas
            </h2>
            {goals.length === 0 ? (
              <div className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
                Todavía no tenés metas. Tocá <span className="font-semibold text-beam-600">+ Nueva meta</span> y armá tu primera (moto, compu, viaje…).
              </div>
            ) : (
              <ul className="space-y-2">
                {goals.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onClick={() => {
                      setEditingGoal(g)
                      setGoalFormOpen(true)
                    }}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Movimientos sueltos */}
          {looseMovements.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 px-1 mb-2 mt-4">
                Ahorro suelto
              </h2>
              <ul className="space-y-2">
                {looseMovements.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMovement(m)
                        setMovementFormOpen(true)
                      }}
                      className="w-full flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm active:scale-[0.99] transition-transform"
                    >
                      <div className="text-left min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {m.description || (m.source ? SOURCE_LABELS[m.source] : m.amount < 0 ? 'Retiro' : 'Aporte')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {m.source && m.description ? SOURCE_LABELS[m.source] + ' · ' : ''}
                          {m.date}
                        </div>
                      </div>
                      <div className={`font-bold whitespace-nowrap ${m.amount < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {m.amount < 0 ? '− ' : '+ '}{formatMoney(Math.abs(m.amount))}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Fab
        onClick={() => {
          setEditingMovement(null)
          setMovementFormOpen(true)
        }}
        label="Nuevo aporte"
      />

      <SavingsGoalForm
        open={goalFormOpen}
        goal={editingGoal}
        onClose={() => setGoalFormOpen(false)}
        onSaved={refresh}
      />
      <SavingsMovementForm
        open={movementFormOpen}
        movement={editingMovement}
        onClose={() => setMovementFormOpen(false)}
        onSaved={refresh}
      />
    </div>
  )
}

function GoalCard({ goal, onClick }) {
  const pct =
    goal.target_amount > 0
      ? Math.min(100, Math.max(0, (goal.current_amount / goal.target_amount) * 100))
      : 0
  const remaining = Math.max(0, goal.target_amount - goal.current_amount)
  const reached = goal.current_amount >= goal.target_amount

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99] transition-transform space-y-2"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl shrink-0"
            style={{ backgroundColor: `${goal.color}22` }}
          >
            {goal.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-800 truncate">{goal.name}</div>
            <div className="text-xs text-slate-500">
              {formatMoney(goal.current_amount)} de {formatMoney(goal.target_amount)}
            </div>
          </div>
          <div className="text-right">
            <div
              className={`font-bold ${reached ? 'text-emerald-600' : 'text-slate-700'}`}
            >
              {reached ? '✓' : `${Math.round(pct)}%`}
            </div>
          </div>
        </div>

        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: goal.color,
            }}
          />
        </div>

        {!reached && remaining > 0 && (
          <div className="text-xs text-slate-500">
            Falta {formatMoney(remaining)}
          </div>
        )}
      </button>
    </li>
  )
}

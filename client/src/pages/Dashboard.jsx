import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMonthlySummary, getTotalBalance } from '../api/transactions'
import { getDebts } from '../api/debts'
import { getFixedExpenses } from '../api/fixedExpenses'
import { getCards } from '../api/cards'
import { getBudgetStatus } from '../api/budgets'
import { getSavingsSummary } from '../api/savings'
import { getAgenda } from '../api/tasks'
import {
  formatMoney,
  monthLabel,
  daysLeftInMonth,
  daysUntilNextDue,
  todayLocalISO,
} from '../utils/format'
import { usePeriodStore } from '../store/period'
import TransactionForm from '../components/TransactionForm'
import Fab from '../components/Fab'
import SpendingChart from '../components/SpendingChart'
import MonthNav from '../components/MonthNav'
import { DashboardSkeleton } from '../components/Skeleton'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({ ingresos: 0, gastos: 0, balance: 0, count: 0 })
  const [totalBalance, setTotalBalance] = useState({ total_ingresos: 0, total_gastos: 0, balance: 0 })
  const [debts, setDebts] = useState([])
  const [fixed, setFixed] = useState([])
  const [cards, setCards] = useState([])
  const [budgetStatus, setBudgetStatus] = useState({ budgets_count: 0, over_budget_count: 0 })
  const [savings, setSavings] = useState({ month_saved: 0, total_saved: 0 })
  const [todayTasks, setTodayTasks] = useState({ pending: 0, total: 0 })
  const [modalOpen, setModalOpen] = useState(false)
  const { month, year, isCurrent } = usePeriodStore()
  const now = new Date()
  const viewingCurrent = isCurrent()

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getMonthlySummary(month, year),
      getTotalBalance(),
      getDebts(),
      getFixedExpenses(),
      getCards(),
      getBudgetStatus(month, year),
      getSavingsSummary(month, year),
    ])
      .then(([s, tb, d, fx, cs, bs, sv]) => {
        setSummary(s)
        setTotalBalance(tb)
        setDebts(d)
        setFixed(fx)
        setCards(cs)
        setBudgetStatus(bs)
        setSavings(sv)
      })
      .catch((e) => setError(e.message || 'Error al conectar con la API'))
      .finally(() => setLoading(false))
  }, [month, year])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Tareas de hoy: independiente del mes seleccionado, con su propio catch
  // para no romper el dashboard financiero si el endpoint fallara.
  useEffect(() => {
    getAgenda(todayLocalISO())
      .then((a) => {
        const all = [...a.today, ...a.overdue]
        setTodayTasks({ pending: all.filter((t) => !t.done).length, total: all.length })
      })
      .catch(() => setTodayTasks({ pending: 0, total: 0 }))
  }, [])

  // Próximos vencimientos: deudas activas (con due_day + remaining>0) + gastos fijos activos.
  const upcomingDebts = debts
    .filter((d) => d.due_day && d.remaining_amount > 0)
    .map((d) => ({
      key: `debt-${d.id}`,
      kind: 'debt',
      name: d.name,
      amount: d.minimum_payment > 0 ? d.minimum_payment : d.remaining_amount,
      due_day: d.due_day,
      daysToDue: daysUntilNextDue(d.due_day),
      to: '/debts',
    }))

  const upcomingFixed = fixed
    .filter((f) => f.due_day)
    .map((f) => ({
      key: `fixed-${f.id}`,
      kind: 'fixed',
      name: f.name,
      amount: f.amount,
      due_day: f.due_day,
      daysToDue: daysUntilNextDue(f.due_day),
      to: '/fixed',
      icon: f.category_icon,
    }))

  const upcomingCards = cards
    .filter((c) => c.due_day && c.next_statement_estimate > 0)
    .map((c) => ({
      key: `card-${c.id}`,
      kind: 'card',
      name: `Resumen ${c.name}`,
      amount: c.next_statement_estimate,
      due_day: c.due_day,
      daysToDue: daysUntilNextDue(c.due_day),
      to: '/cards',
      icon: '💳',
    }))

  const upcoming = [...upcomingDebts, ...upcomingFixed, ...upcomingCards]
    .sort((a, b) => a.daysToDue - b.daysToDue)
    .slice(0, 5)

  const totalCardsEstimate = cards.reduce(
    (s, c) => s + (c.next_statement_estimate || 0),
    0
  )

  return (
    <div className="px-4 pb-4 pt-1.5 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{monthLabel(month, year)}</h1>
          <p className="text-sm text-slate-500">
            {viewingCurrent
              ? `Quedan ${daysLeftInMonth(now)} días del mes`
              : 'Mes pasado'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <img
            src="/faro-icon.png"
            alt="Faro"
            className="w-9 h-9 rounded-xl shadow-sm"
          />
          <span className="text-base font-bold tracking-tight text-navy-900">Faro</span>
        </div>
      </header>

      {!loading && !error && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-5 text-white shadow-lg ring-1 ring-navy-700/40">
          {/* Beam decorativo — el haz del faro */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-beam-500/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-4 h-2 w-2 rounded-full bg-beam-400 shadow-[0_0_16px_4px_rgba(251,191,36,0.6)]"
          />

          <div className="relative">
            <div className="text-[11px] uppercase tracking-wider text-navy-200/80 font-semibold">
              Saldo disponible
            </div>
            <div
              className={`mt-1 text-3xl font-bold ${
                totalBalance.balance - savings.total_saved >= 0 ? 'text-white' : 'text-rose-300'
              }`}
            >
              {formatMoney(totalBalance.balance - savings.total_saved)}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-navy-200/70">
              <span>
                Balance neto:{' '}
                <span className="font-semibold text-white/90">
                  {formatMoney(totalBalance.balance)}
                </span>
              </span>
              {savings.total_saved > 0 && (
                <span>
                  Ahorro:{' '}
                  <span className="font-semibold text-emerald-300">
                    −{formatMoney(savings.total_saved)}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && <DashboardSkeleton />}

      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
          <div className="font-semibold">No se pudo conectar con la API</div>
          <div className="mt-1 text-xs opacity-80">{error}</div>
          <div className="mt-2 text-xs opacity-80">¿El server está corriendo en :3000?</div>
        </div>
      )}

      {!loading && !error && (
        <>
          {todayTasks.pending > 0 && (
            <Link
              to="/tasks"
              className="block rounded-2xl bg-white border border-beam-100 p-3 shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">
                  ✅ Tenés{' '}
                  <span className="font-semibold text-beam-600">
                    {todayTasks.pending} tarea{todayTasks.pending === 1 ? '' : 's'}
                  </span>{' '}
                  para hoy
                </span>
                <span className="text-beam-500">›</span>
              </div>
            </Link>
          )}

          <MonthNav />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1 mb-1.5">
              {viewingCurrent ? 'Este mes' : monthLabel(month, year)}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Ingresos" amount={summary.ingresos} color="text-emerald-600" />
              <StatCard label="Gastos" amount={summary.gastos} color="text-rose-500" />
              <StatCard
                label="Balance"
                amount={summary.balance}
                color={summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
            {summary.count === 0
              ? 'Todavía no cargaste transacciones este mes. Tocá el botón "+" para empezar.'
              : `${summary.count} transacción${summary.count === 1 ? '' : 'es'} este mes`}
          </div>

          {/* Gráfico de gastos por categoría — solo si hay gastos */}
          {summary.gastos > 0 && (
            <SpendingChart categories={summary.by_category || []} />
          )}

          {/* Alerta de presupuestos excedidos */}
          {budgetStatus.over_budget_count > 0 && (
            <Link
              to="/budgets"
              className="block rounded-2xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between">
                <span>
                  🚨 <span className="font-semibold">
                    {budgetStatus.over_budget_count} categoría{budgetStatus.over_budget_count === 1 ? '' : 's'}
                  </span> excediendo el presupuesto
                </span>
                <span className="text-rose-400">›</span>
              </div>
            </Link>
          )}

          {/* Nudge de ahorro + Libre para gastar (balance neto del ahorro apartado) */}
          <Link
            to="/savings"
            className="block rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Ahorrado este mes</div>
                <div
                  className={`mt-1 text-xl font-bold ${
                    savings.month_saved > 0 ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                >
                  {formatMoney(savings.month_saved)}
                </div>
                {savings.total_saved > 0 && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Total acumulado: {formatMoney(savings.total_saved)}
                  </div>
                )}
              </div>
              <span className="text-3xl">💰</span>
            </div>

            {savings.month_saved > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Libre para gastar</span>
                <span
                  className={`text-base font-bold ${
                    summary.balance - savings.month_saved >= 0
                      ? 'text-emerald-600'
                      : 'text-rose-500'
                  }`}
                >
                  {formatMoney(summary.balance - savings.month_saved)}
                </span>
              </div>
            )}
          </Link>

          {upcoming.length > 0 && (
            <div className="rounded-2xl bg-white shadow-sm">
              <div className="px-4 pt-4">
                <h2 className="font-semibold text-slate-800">Próximos vencimientos</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {upcoming.map((u) => (
                  <li key={u.key}>
                    <Link
                      to={u.to}
                      className="flex items-center justify-between px-4 py-3 active:bg-slate-50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">
                          {u.kind === 'debt' ? '💳' : u.icon || '🔁'}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 truncate">{u.name}</div>
                          <div className="text-xs text-slate-500">
                            {u.daysToDue === 0
                              ? 'Vence hoy'
                              : u.daysToDue === 1
                              ? 'Vence mañana'
                              : `Vence en ${u.daysToDue} días`}
                            {' · día '}
                            {u.due_day}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-rose-500 whitespace-nowrap">
                        {formatMoney(u.amount)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Fab onClick={() => setModalOpen(true)} label="Cargar transacción" />

      <TransactionForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
      />
    </div>
  )
}

function StatCard({ label, amount, color }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-bold ${color}`}>{formatMoney(amount)}</div>
    </div>
  )
}

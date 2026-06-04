import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAgenda, getTasksRange, toggleTask } from '../api/tasks'
import { getLifeGoals } from '../api/lifeGoals'
import { isoFromDate, todayLocalISO } from '../utils/format'
import TaskForm from '../components/TaskForm'
import LifeGoalForm from '../components/LifeGoalForm'
import Fab from '../components/Fab'
import { CardListSkeleton } from '../components/Skeleton'

const WEEK_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const GRID_HEAD = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const RECUR_LABEL = { daily: 'Todos los días', weekly: 'Semanal', monthly: 'Mensual', once: '' }

// --- helpers de fecha (lunes como inicio de semana) ---
const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  x.setHours(0, 0, 0, 0)
  return x
}
const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7))
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0)
const parseISO = (s) => {
  const [y, m, dd] = s.split('-').map(Number)
  return new Date(y, m - 1, dd)
}

function recurText(t) {
  if (t.recurrence === 'monthly' && t.day_of_month) return `Mensual · día ${t.day_of_month}`
  return RECUR_LABEL[t.recurrence] || ''
}

function dayLabel(iso) {
  if (iso === todayLocalISO()) return 'Hoy'
  if (iso === isoFromDate(addDays(new Date(), 1))) return 'Mañana'
  return parseISO(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function targetText(iso) {
  if (!iso) return null
  const target = parseISO(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((target - today) / 86400000)
  const fecha = target.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  if (days < 0) return `${fecha} · vencida`
  if (days === 0) return `${fecha} · hoy`
  if (days <= 60) return `${fecha} · en ${days} días`
  return fecha
}

export default function Tasks() {
  const [view, setView] = useState('week') // 'week' | 'month'
  const [selected, setSelected] = useState(todayLocalISO())
  const [daysData, setDaysData] = useState({})
  const [overdue, setOverdue] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  const selDate = parseISO(selected)

  // Rango a traer según la vista
  const [rangeFrom, rangeTo] = useMemo(() => {
    if (view === 'week') {
      const from = startOfWeek(selDate)
      return [from, addDays(from, 6)]
    }
    const gridStart = startOfWeek(startOfMonth(selDate))
    const monthEnd = endOfMonth(selDate)
    const gridEnd = addDays(gridStart, Math.ceil((((monthEnd - gridStart) / 86400000) + 1) / 7) * 7 - 1)
    return [gridStart, gridEnd]
  }, [view, selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getTasksRange(isoFromDate(rangeFrom), isoFromDate(rangeTo)),
      getAgenda(todayLocalISO()),
      getLifeGoals(),
    ])
      .then(([range, agenda, g]) => {
        setDaysData(range.days)
        setOverdue(agenda.overdue)
        setGoals(g)
      })
      .catch((e) => setError(e.message || 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [rangeFrom, rangeTo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleToggle = async (task, dateISO, e) => {
    e.stopPropagation()
    const flip = (list) => list.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    setDaysData((prev) => ({ ...prev, [dateISO]: flip(prev[dateISO] || []) }))
    setOverdue((prev) => flip(prev))
    try {
      await toggleTask(task.id, dateISO)
    } catch {
      refresh()
    }
  }

  const openEditTask = (t) => {
    setEditingTask(t)
    setTaskFormOpen(true)
  }

  const shiftPeriod = (dir) => {
    setSelected(isoFromDate(addDays(selDate, view === 'week' ? dir * 7 : 0)))
    if (view === 'month') {
      const m = new Date(selDate.getFullYear(), selDate.getMonth() + dir, 1)
      // mantener día válido
      setSelected(isoFromDate(m))
    }
  }

  const selectedTasks = daysData[selected] || []
  const pendingSel = selectedTasks.filter((t) => !t.done).length

  const activeGoals = goals.filter((g) => g.status !== 'done')
  const doneGoals = goals.filter((g) => g.status === 'done')

  const periodLabel =
    view === 'week'
      ? `${isoFromDate(startOfWeek(selDate)) === isoFromDate(startOfWeek(new Date())) ? 'Esta semana' : 'Semana'}`
      : selDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="px-4 pb-4 pt-1.5 space-y-3">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Tareas</h1>
        <button
          type="button"
          onClick={() => { setEditingGoal(null); setGoalFormOpen(true) }}
          className="text-xs text-beam-600 font-semibold"
        >
          + Nueva meta
        </button>
      </header>

      {/* Segmento Semana / Mes */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
        {[
          { v: 'week', label: 'Semana' },
          { v: 'month', label: 'Mes' },
        ].map((s) => (
          <button
            key={s.v}
            type="button"
            onClick={() => setView(s.v)}
            className={`py-2 rounded-lg text-sm font-semibold transition ${
              view === s.v ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Navegador de período */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftPeriod(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 active:bg-slate-100"
          aria-label="Anterior"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm font-semibold text-slate-700 capitalize">{periodLabel}</span>
        <button
          type="button"
          onClick={() => shiftPeriod(1)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 active:bg-slate-100"
          aria-label="Siguiente"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Selector visual */}
      {view === 'week' ? (
        <WeekStrip from={startOfWeek(selDate)} selected={selected} daysData={daysData} onPick={setSelected} />
      ) : (
        <MonthGrid from={rangeFrom} to={rangeTo} monthOf={selDate} selected={selected} daysData={daysData} onPick={setSelected} />
      )}

      {loading && <CardListSkeleton rows={3} />}
      {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {!loading && !error && (
        <>
          {/* Atrasadas (solo cuando mirás hoy/esta semana, para no distraer) */}
          {overdue.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-rose-500 px-1 mb-1.5">
                Atrasadas
              </h2>
              <ul className="space-y-2">
                {overdue.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={(task, e) => handleToggle(task, todayLocalISO(), e)} onEdit={openEditTask} overdue />
                ))}
              </ul>
            </div>
          )}

          {/* Tareas del día seleccionado */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1 mb-1.5 capitalize">
              {dayLabel(selected)}
              {selectedTasks.length > 0 && (
                <span className="text-slate-400 normal-case"> · {pendingSel} pendiente{pendingSel === 1 ? '' : 's'}</span>
              )}
            </h2>
            {selectedTasks.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                Sin tareas este día. Tocá <span className="font-semibold text-beam-600">+</span> para agregar una.
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedTasks.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={(task, e) => handleToggle(task, selected, e)} onEdit={openEditTask} />
                ))}
              </ul>
            )}
          </div>

          {/* Metas */}
          <div className="pt-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1 mb-1.5">
              Metas
            </h2>
            {activeGoals.length === 0 && doneGoals.length === 0 ? (
              <div className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
                Sin metas todavía. Tocá <span className="font-semibold text-beam-600">+ Nueva meta</span> y planteá un objetivo.
              </div>
            ) : (
              <ul className="space-y-2">
                {activeGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} onClick={() => { setEditingGoal(g); setGoalFormOpen(true) }} />
                ))}
                {doneGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} done onClick={() => { setEditingGoal(g); setGoalFormOpen(true) }} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Fab
        onClick={() => { setEditingTask(null); setTaskFormOpen(true) }}
        label="Nueva tarea"
      />

      <TaskForm
        open={taskFormOpen}
        task={editingTask}
        defaultDate={selected}
        onClose={() => setTaskFormOpen(false)}
        onSaved={refresh}
      />
      <LifeGoalForm
        open={goalFormOpen}
        goal={editingGoal}
        onClose={() => setGoalFormOpen(false)}
        onSaved={refresh}
      />
    </div>
  )
}

function hasPending(list) {
  return list && list.some((t) => !t.done)
}

function WeekStrip({ from, selected, daysData, onPick }) {
  const today = todayLocalISO()
  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEK_SHORT.map((wd, i) => {
        const d = addDays(from, i)
        const iso = isoFromDate(d)
        const isSel = iso === selected
        const isToday = iso === today
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onPick(iso)}
            className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
              isSel ? 'bg-beam-500 text-white shadow-beam' : 'bg-white text-slate-700 shadow-sm'
            }`}
          >
            <span className={`text-[10px] ${isSel ? 'text-beam-50' : 'text-slate-400'}`}>{wd}</span>
            <span className={`text-base font-bold ${isToday && !isSel ? 'text-beam-600' : ''}`}>{d.getDate()}</span>
            <span
              className={`mt-0.5 w-1.5 h-1.5 rounded-full ${
                hasPending(daysData[iso]) ? (isSel ? 'bg-white' : 'bg-beam-500') : 'bg-transparent'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

function MonthGrid({ from, to, monthOf, selected, daysData, onPick }) {
  const today = todayLocalISO()
  const cells = []
  const end = parseISO(isoFromDate(to))
  for (let d = parseISO(isoFromDate(from)); d <= end; d = addDays(d, 1)) {
    cells.push(new Date(d))
  }
  const curMonth = monthOf.getMonth()

  return (
    <div className="rounded-2xl bg-white p-2 shadow-sm">
      <div className="grid grid-cols-7">
        {GRID_HEAD.map((h, i) => (
          <div key={i} className="text-center text-[10px] text-slate-400 font-semibold py-1">{h}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d) => {
          const iso = isoFromDate(d)
          const isSel = iso === selected
          const isToday = iso === today
          const inMonth = d.getMonth() === curMonth
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              className={`relative aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${
                isSel
                  ? 'bg-beam-500 text-white font-bold shadow-beam'
                  : isToday
                  ? 'text-beam-600 font-bold'
                  : inMonth
                  ? 'text-slate-700'
                  : 'text-slate-300'
              }`}
            >
              {d.getDate()}
              {hasPending(daysData[iso]) && (
                <span
                  className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                    isSel ? 'bg-white' : 'bg-beam-500'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TaskRow({ task, onToggle, onEdit, overdue = false }) {
  const sub = [task.time_of_day, recurText(task), task.notes].filter(Boolean).join(' · ')
  return (
    <li>
      <div
        onClick={() => onEdit(task)}
        className="w-full flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
      >
        <button
          type="button"
          onClick={(e) => onToggle(task, e)}
          aria-label={task.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
          className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.done
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : overdue
              ? 'border-rose-400'
              : 'border-slate-300'
          }`}
        >
          {task.done && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${task.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {task.title}
          </div>
          {sub && <div className="text-xs text-slate-500 truncate">{sub}</div>}
        </div>
        {overdue && (
          <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold shrink-0">
            atrasada
          </span>
        )}
      </div>
    </li>
  )
}

function GoalCard({ goal, done = false, onClick }) {
  const target = targetText(goal.target_date)
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99] transition-transform space-y-2 ${
          done ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl text-2xl shrink-0"
            style={{ backgroundColor: `${goal.color}22` }}
          >
            {goal.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold truncate ${done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
              {goal.title}
            </div>
            {target && <div className="text-xs text-slate-500">{target}</div>}
          </div>
          <div className="text-right">
            <div className={`font-bold ${done ? 'text-emerald-600' : 'text-slate-700'}`}>
              {done ? '✓' : `${goal.progress}%`}
            </div>
          </div>
        </div>
        {!done && (
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }} />
          </div>
        )}
      </button>
    </li>
  )
}

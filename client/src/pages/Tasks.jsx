import { useCallback, useEffect, useState } from 'react'
import { getAgenda, toggleTask } from '../api/tasks'
import { getLifeGoals } from '../api/lifeGoals'
import { todayLocalISO } from '../utils/format'
import TaskForm from '../components/TaskForm'
import LifeGoalForm from '../components/LifeGoalForm'
import Fab from '../components/Fab'
import { CardListSkeleton } from '../components/Skeleton'

const RECUR_LABEL = {
  daily: 'Todos los días',
  weekly: 'Semanal',
  monthly: 'Mensual',
  once: '',
}

function recurText(t) {
  if (t.recurrence === 'monthly' && t.day_of_month) return `Mensual · día ${t.day_of_month}`
  return RECUR_LABEL[t.recurrence] || ''
}

function targetText(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d)
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
  const [today, setToday] = useState([])
  const [overdue, setOverdue] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  const date = todayLocalISO()

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([getAgenda(date), getLifeGoals()])
      .then(([agenda, g]) => {
        setToday(agenda.today)
        setOverdue(agenda.overdue)
        setGoals(g)
      })
      .catch((e) => setError(e.message || 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [date])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleToggle = async (task, e) => {
    e.stopPropagation()
    // Optimista
    const flip = (arr) =>
      arr.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    setToday((prev) => flip(prev))
    try {
      await toggleTask(task.id, date)
    } catch {
      setToday((prev) => flip(prev)) // revertir
    }
  }

  const openEditTask = (t) => {
    setEditingTask(t)
    setTaskFormOpen(true)
  }

  const activeGoals = goals.filter((g) => g.status !== 'done')
  const doneGoals = goals.filter((g) => g.status === 'done')
  const pendingToday = today.filter((t) => !t.done).length

  const fechaLarga = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="px-4 pb-4 pt-1.5 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tareas</h1>
          <p className="text-sm text-slate-500 capitalize">{fechaLarga}</p>
        </div>
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
          {/* Resumen del día */}
          <div className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 p-4 text-white shadow-sm">
            <div className="text-xs text-navy-200/80">Hoy</div>
            <div className="mt-1 text-lg font-bold">
              {pendingToday === 0
                ? today.length > 0
                  ? '¡Todo hecho! 🎉'
                  : 'Sin tareas para hoy'
                : `${pendingToday} tarea${pendingToday === 1 ? '' : 's'} pendiente${
                    pendingToday === 1 ? '' : 's'
                  }`}
            </div>
          </div>

          {/* Atrasadas */}
          {overdue.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-rose-500 px-1 mb-1.5">
                Atrasadas
              </h2>
              <ul className="space-y-2">
                {overdue.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={handleToggle} onEdit={openEditTask} overdue />
                ))}
              </ul>
            </div>
          )}

          {/* Hoy */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1 mb-1.5">
              Para hoy
            </h2>
            {today.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                No tenés tareas para hoy. Tocá <span className="font-semibold text-beam-600">+</span> para agregar una.
              </div>
            ) : (
              <ul className="space-y-2">
                {today.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={handleToggle} onEdit={openEditTask} />
                ))}
              </ul>
            )}
          </div>

          {/* Metas */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1 mb-1.5">
              Metas
            </h2>
            {activeGoals.length === 0 && doneGoals.length === 0 ? (
              <div className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
                Sin metas todavía. Tocá <span className="font-semibold text-beam-600">+ Nueva meta</span> y planteá un objetivo (recibirte, un viaje, un hábito…).
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
        onClick={() => {
          setEditingTask(null)
          setTaskFormOpen(true)
        }}
        label="Nueva tarea"
      />

      <TaskForm
        open={taskFormOpen}
        task={editingTask}
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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
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
            <div
              className="h-full transition-all"
              style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
            />
          </div>
        )}
      </button>
    </li>
  )
}

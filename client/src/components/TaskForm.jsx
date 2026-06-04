import { useEffect, useRef, useState } from 'react'
import { createTask, updateTask, deleteTask } from '../api/tasks'
import { todayLocalISO } from '../utils/format'
import useBodyScrollLock from '../hooks/useBodyScrollLock'
import { useUIStore } from '../store/ui'

const RECURRENCES = [
  { v: 'once', label: 'Una vez' },
  { v: 'daily', label: 'Cada día' },
  { v: 'weekly', label: 'Semanal' },
  { v: 'monthly', label: 'Mensual' },
]

const WEEKDAYS = [
  { v: 1, label: 'L' },
  { v: 2, label: 'M' },
  { v: 3, label: 'M' },
  { v: 4, label: 'J' },
  { v: 5, label: 'V' },
  { v: 6, label: 'S' },
  { v: 0, label: 'D' },
]

export default function TaskForm({ open, onClose, onSaved, task = null, defaultDate = null }) {
  const isEditing = Boolean(task)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [recurrence, setRecurrence] = useState('once')
  const [dueDate, setDueDate] = useState(defaultDate || todayLocalISO())
  const [weekdays, setWeekdays] = useState([]) // array de 0-6
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [time, setTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const titleRef = useRef(null)

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setNotes(task.notes || '')
      setRecurrence(task.recurrence)
      setDueDate(task.due_date || todayLocalISO())
      setWeekdays(task.weekdays ? task.weekdays.split(',').map(Number) : [])
      setDayOfMonth(task.day_of_month ? String(task.day_of_month) : '1')
      setTime(task.time_of_day || '')
    } else {
      setTitle('')
      setNotes('')
      setRecurrence('once')
      setDueDate(defaultDate || todayLocalISO())
      setWeekdays([])
      setDayOfMonth('1')
      setTime('')
    }
    setError(null)
    setTimeout(() => titleRef.current?.focus(), 100)
  }, [open, task])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const toggleWeekday = (d) =>
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )

  const canSubmit =
    !submitting &&
    !deleting &&
    title.trim() &&
    (recurrence !== 'weekly' || weekdays.length > 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        title: title.trim(),
        notes: notes.trim() || null,
        recurrence,
        time_of_day: time || null,
        due_date: recurrence === 'once' ? dueDate : null,
        weekdays:
          recurrence === 'weekly' ? [...weekdays].sort().join(',') : null,
        day_of_month: recurrence === 'monthly' ? Number(dayOfMonth) : null,
      }
      const saved = isEditing
        ? await updateTask(task.id, payload)
        : await createTask(payload)
      onSaved?.(saved)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return
    const ok = await useUIStore.getState().confirm({
      title: 'Borrar tarea',
      message: `"${task.title}" se va a borrar. No se puede deshacer.`,
      confirmText: 'Borrar',
      danger: true,
    })
    if (!ok) return
    setDeleting(true)
    try {
      await deleteTask(task.id)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al borrar')
    } finally {
      setDeleting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-4 shadow-2xl"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {isEditing ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 text-3xl leading-none w-8 h-8"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="mt-4">
          <label className="text-xs text-slate-500">¿Qué tenés que hacer?</label>
          <input
            ref={titleRef}
            type="text"
            maxLength={80}
            placeholder="Ir al gym, retirar paquete, estudiar cap. 3…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base"
          />
        </div>

        {/* Recurrencia */}
        <div className="mt-4">
          <label className="text-xs text-slate-500">¿Cada cuánto?</label>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {RECURRENCES.map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setRecurrence(r.v)}
                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                  recurrence === r.v
                    ? 'bg-beam-500 text-white shadow-beam'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campos según recurrencia */}
        {recurrence === 'once' && (
          <div className="mt-4">
            <label className="text-xs text-slate-500">Fecha</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        )}

        {recurrence === 'weekly' && (
          <div className="mt-4">
            <label className="text-xs text-slate-500">¿Qué días?</label>
            <div className="mt-1 flex gap-1.5">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => toggleWeekday(d.v)}
                  className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-colors ${
                    weekdays.includes(d.v)
                      ? 'bg-beam-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {recurrence === 'monthly' && (
          <div className="mt-4">
            <label className="text-xs text-slate-500">Día del mes</label>
            <input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Hora opcional */}
        <div className="mt-4">
          <label className="text-xs text-slate-500">Hora (opcional)</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {/* Notas */}
        <div className="mt-4">
          <label className="text-xs text-slate-500">Notas (opcional)</label>
          <input
            type="text"
            maxLength={140}
            placeholder="Detalle, dirección, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
        )}

        <div className="mt-6 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="py-3 rounded-xl bg-beam-500 text-white font-semibold shadow-beam disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {submitting ? 'Guardando…' : isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="w-full py-2 text-sm text-rose-600 font-semibold disabled:opacity-50"
            >
              {deleting ? 'Borrando…' : '🗑 Borrar tarea'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

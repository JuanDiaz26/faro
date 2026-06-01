import { useEffect, useRef, useState } from 'react'
import {
  createMovement,
  updateMovement,
  deleteMovement,
  getGoals,
} from '../api/savings'
import { todayLocalISO } from '../utils/format'
import useBodyScrollLock from '../hooks/useBodyScrollLock'

const SOURCES = [
  { id: 'sueldo', label: 'Sueldo', icon: '💼' },
  { id: 'aguinaldo', label: 'Aguinaldo', icon: '🎁' },
  { id: 'bono', label: 'Bono', icon: '⭐' },
  { id: 'extra', label: 'Extra', icon: '💸' },
  { id: 'otro', label: 'Otro', icon: '📦' },
]

export default function SavingsMovementForm({
  open,
  onClose,
  onSaved,
  movement = null,
}) {
  const isEditing = Boolean(movement)
  const [goals, setGoals] = useState([])
  const [goalId, setGoalId] = useState('')
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState(null)
  const [date, setDate] = useState(todayLocalISO())
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const amountRef = useRef(null)

  useEffect(() => {
    if (!open) return
    getGoals().then(setGoals).catch(() => setGoals([]))
  }, [open])

  useEffect(() => {
    if (!open) return
    if (movement) {
      setGoalId(movement.goal_id ? String(movement.goal_id) : '')
      setAmount(String(movement.amount))
      setSource(movement.source)
      setDate(movement.date)
      setDescription(movement.description || '')
    } else {
      setGoalId('')
      setAmount('')
      setSource(null)
      setDate(todayLocalISO())
      setDescription('')
    }
    setError(null)
    setTimeout(() => amountRef.current?.focus(), 100)
  }, [open, movement])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const canSubmit = !submitting && !deleting && Number(amount) > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        goal_id: goalId ? Number(goalId) : null,
        amount: Number(amount),
        date,
        source: source || null,
        description: description.trim() || null,
      }
      const saved = isEditing
        ? await updateMovement(movement.id, payload)
        : await createMovement(payload)
      onSaved?.(saved)
      onClose()
    } catch (err) {
      const apiErr = err.response?.data
      setError(apiErr?.error || apiErr?.detail || err.message || 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return
    if (!window.confirm('¿Borrar este aporte? No se puede deshacer.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteMovement(movement.id)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al borrar')
    } finally {
      setDeleting(false)
    }
  }

  useBodyScrollLock(open)

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
            {isEditing ? 'Editar aporte' : 'Nuevo aporte'}
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
          <label className="text-xs text-slate-500">Monto</label>
          <div className="flex items-center mt-1">
            <span className="text-3xl text-slate-400 mr-1">$</span>
            <input
              ref={amountRef}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-3xl font-bold bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Para</label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">💰 Suelto (sin meta específica)</option>
            {goals
              .filter((g) => g.active)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.icon} {g.name}
                </option>
              ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Origen (opcional)</label>
          <div className="mt-1 grid grid-cols-5 gap-2">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(source === s.id ? null : s.id)}
                className={`rounded-xl p-2 text-center transition-colors ${
                  source === s.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <div className="text-lg leading-none">{s.icon}</div>
                <div className="mt-1 text-[10px]">{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Descripción</label>
            <input
              type="text"
              maxLength={140}
              placeholder="Opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
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
              {deleting ? 'Borrando…' : '🗑 Borrar aporte'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

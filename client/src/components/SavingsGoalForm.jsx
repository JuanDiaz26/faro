import { useEffect, useRef, useState } from 'react'
import { createGoal, updateGoal, deleteGoal } from '../api/savings'
import useBodyScrollLock from '../hooks/useBodyScrollLock'
import { useUIStore } from '../store/ui'

const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#14b8a6']

export default function SavingsGoalForm({ open, onClose, onSaved, goal = null }) {
  const isEditing = Boolean(goal)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState('#10b981')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (goal) {
      setName(goal.name)
      setTarget(String(goal.target_amount))
      setIcon(goal.icon || '🎯')
      setColor(goal.color || '#10b981')
      setDescription(goal.description || '')
      setActive(Boolean(goal.active))
    } else {
      setName('')
      setTarget('')
      setIcon('🎯')
      setColor('#10b981')
      setDescription('')
      setActive(true)
    }
    setError(null)
    setTimeout(() => nameRef.current?.focus(), 100)
  }, [open, goal])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const canSubmit =
    !submitting && !deleting && name.trim() && Number(target) > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        target_amount: Number(target),
        icon: icon.trim() || '🎯',
        color,
        description: description.trim() || null,
      }
      if (isEditing) payload.active = active
      const saved = isEditing
        ? await updateGoal(goal.id, payload)
        : await createGoal(payload)
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
    const ok = await useUIStore.getState().confirm({
      title: 'Borrar meta',
      message: `Los aportes de "${goal.name}" pasan a "Suelto" (no se pierden).`,
      confirmText: 'Borrar',
      danger: true,
    })
    if (!ok) return
    setDeleting(true)
    setError(null)
    try {
      await deleteGoal(goal.id)
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
            {isEditing ? 'Editar meta' : 'Nueva meta'}
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

        <div className="mt-4 flex items-center gap-3">
          <input
            type="text"
            maxLength={4}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-16 h-16 rounded-xl border border-slate-200 text-center text-3xl"
            style={{ backgroundColor: `${color}22` }}
          />
          <div className="flex-1">
            <label className="text-xs text-slate-500">Nombre de la meta</label>
            <input
              ref={nameRef}
              type="text"
              placeholder="Moto, compu, viaje…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Color</label>
          <div className="mt-1 flex gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-slate-700' : ''}`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Monto objetivo</label>
          <div className="flex items-center mt-1 rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-slate-400 mr-1 text-lg">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full text-lg font-semibold bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Descripción (opcional)</label>
          <input
            type="text"
            maxLength={140}
            placeholder="Notas, fecha estimada…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {isEditing && (
          <label className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-700">
              <span className="font-medium">Meta activa</span>
              <span className="block text-xs text-slate-500">
                Desactivá para archivarla sin borrarla
              </span>
            </span>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-5 h-5 accent-emerald-500"
            />
          </label>
        )}

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
              {deleting ? 'Borrando…' : '🗑 Borrar meta'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

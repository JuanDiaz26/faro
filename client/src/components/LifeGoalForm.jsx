import { useEffect, useRef, useState } from 'react'
import { createLifeGoal, updateLifeGoal, deleteLifeGoal } from '../api/lifeGoals'
import useBodyScrollLock from '../hooks/useBodyScrollLock'
import { useUIStore } from '../store/ui'

const PALETTE = ['#F59E0B', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#ef4444']
const EMOJIS = ['🎯', '🏆', '📚', '💪', '✈️', '🏍️', '💻', '🏠', '🎓', '🚀', '🧠', '❤️']

export default function LifeGoalForm({ open, onClose, onSaved, goal = null }) {
  const isEditing = Boolean(goal)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState('#F59E0B')
  const [targetDate, setTargetDate] = useState('')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('active')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const titleRef = useRef(null)

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    if (goal) {
      setTitle(goal.title)
      setDescription(goal.description || '')
      setIcon(goal.icon || '🎯')
      setColor(goal.color || '#F59E0B')
      setTargetDate(goal.target_date || '')
      setProgress(goal.progress || 0)
      setStatus(goal.status || 'active')
    } else {
      setTitle('')
      setDescription('')
      setIcon('🎯')
      setColor('#F59E0B')
      setTargetDate('')
      setProgress(0)
      setStatus('active')
    }
    setError(null)
    setTimeout(() => titleRef.current?.focus(), 100)
  }, [open, goal])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const canSubmit = !submitting && !deleting && title.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        icon: icon.trim() || '🎯',
        color,
        target_date: targetDate || null,
        progress: Number(progress),
        status,
      }
      const saved = isEditing
        ? await updateLifeGoal(goal.id, payload)
        : await createLifeGoal(payload)
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
      title: 'Borrar meta',
      message: `"${goal.title}" se va a borrar. No se puede deshacer.`,
      confirmText: 'Borrar',
      danger: true,
    })
    if (!ok) return
    setDeleting(true)
    try {
      await deleteLifeGoal(goal.id)
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
            <label className="text-xs text-slate-500">Meta</label>
            <input
              ref={titleRef}
              type="text"
              maxLength={80}
              placeholder="Recibirme, aprender inglés, correr 10k…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-6 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setIcon(e)}
              className={`h-9 text-xl rounded-lg ${icon === e ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Color</label>
          <div className="mt-1 flex flex-wrap gap-2">
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
          <label className="text-xs text-slate-500">Fecha objetivo (opcional)</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500 flex items-center justify-between">
            <span>Progreso</span>
            <span className="font-semibold text-slate-700">{progress}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="w-full mt-1 accent-beam-500"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Descripción (opcional)</label>
          <input
            type="text"
            maxLength={140}
            placeholder="Por qué te importa, primer paso…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {isEditing && (
          <label className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-700">
              <span className="font-medium">Marcar como lograda</span>
              <span className="block text-xs text-slate-500">La meta pasa a "Logradas"</span>
            </span>
            <input
              type="checkbox"
              checked={status === 'done'}
              onChange={(e) => setStatus(e.target.checked ? 'done' : 'active')}
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

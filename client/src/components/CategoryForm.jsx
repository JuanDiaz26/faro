import { useEffect, useRef, useState } from 'react'
import { createCategory, updateCategory, deleteCategory } from '../api/categories'
import useBodyScrollLock from '../hooks/useBodyScrollLock'

const PALETTE = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#06b6d4',
]

// Sugerencias rápidas — se puede tipear cualquier emoji igual.
const EMOJI_SUGGESTIONS = [
  '🍔', '🛒', '🏠', '🚗', '⛽', '💊',
  '📱', '👕', '🎬', '✈️', '🎓', '🏥',
  '💼', '🎁', '🐶', '☕', '🍺', '🏋️',
  '📦', '💰', '🎯', '🔁', '🧾', '🪙',
]

export default function CategoryForm({ open, onClose, onSaved, category = null }) {
  const isEditing = Boolean(category)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏷️')
  const [color, setColor] = useState('#10b981')
  const [type, setType] = useState('expense')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (category) {
      setName(category.name)
      setIcon(category.icon || '🏷️')
      setColor(category.color || '#10b981')
      setType(category.type)
    } else {
      setName('')
      setIcon('🏷️')
      setColor('#10b981')
      setType('expense')
    }
    setError(null)
    setTimeout(() => nameRef.current?.focus(), 100)
  }, [open, category])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const canSubmit = !submitting && !deleting && name.trim() && icon.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        icon: icon.trim() || '🏷️',
        color,
        type,
      }
      const saved = isEditing
        ? await updateCategory(category.id, payload)
        : await createCategory(payload)
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
    if (!window.confirm(`¿Borrar la categoría "${category.name}"? Solo se puede si no está en uso.`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteCategory(category.id)
      onSaved?.()
      onClose()
    } catch (err) {
      const data = err.response?.data
      if (data?.usage) {
        const used = Object.entries(data.usage)
          .filter(([, n]) => n > 0)
          .map(([k, n]) => `${k}: ${n}`)
          .join(', ')
        setError(`${data.error} (${used})`)
      } else {
        setError(data?.error || err.message || 'Error al borrar')
      }
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
            {isEditing ? 'Editar categoría' : 'Nueva categoría'}
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

        {/* Toggle tipo */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 rounded-lg text-sm font-semibold transition ${
              type === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 rounded-lg text-sm font-semibold transition ${
              type === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'
            }`}
          >
            Ingreso
          </button>
        </div>

        {/* Icono + nombre */}
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
            <label className="text-xs text-slate-500">Nombre</label>
            <input
              ref={nameRef}
              type="text"
              maxLength={30}
              placeholder="Suplementos, Mascota, Cafecito…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base"
            />
          </div>
        </div>

        {/* Sugerencias de emoji */}
        <div className="mt-3">
          <label className="text-xs text-slate-500">Sugerencias</label>
          <div className="mt-1 grid grid-cols-8 gap-1">
            {EMOJI_SUGGESTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className={`h-9 text-xl rounded-lg ${
                  icon === e ? 'bg-slate-200' : 'hover:bg-slate-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
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
              {deleting ? 'Borrando…' : '🗑 Borrar categoría'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

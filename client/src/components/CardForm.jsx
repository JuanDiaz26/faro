import { useEffect, useRef, useState } from 'react'
import { createCard, updateCard, deleteCard } from '../api/cards'

const PALETTE = ['#FF6B00', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#f59e0b', '#64748b']

export default function CardForm({ open, onClose, onSaved, card = null }) {
  const isEditing = Boolean(card)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#FF6B00')
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (card) {
      setName(card.name)
      setColor(card.color || '#FF6B00')
      setClosingDay(card.closing_day ? String(card.closing_day) : '')
      setDueDay(card.due_day ? String(card.due_day) : '')
      setActive(Boolean(card.active))
    } else {
      setName('')
      setColor('#FF6B00')
      setClosingDay('')
      setDueDay('')
      setActive(true)
    }
    setError(null)
    setTimeout(() => nameRef.current?.focus(), 100)
  }, [open, card])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const canSubmit = !submitting && !deleting && name.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        color,
        closing_day: closingDay ? Number(closingDay) : null,
        due_day: dueDay ? Number(dueDay) : null,
      }
      if (isEditing) payload.active = active
      const saved = isEditing
        ? await updateCard(card.id, payload)
        : await createCard(payload)
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
    if (
      !window.confirm(
        `¿Borrar "${card.name}"? Se borran TODOS sus cargos pendientes. No se puede deshacer.`
      )
    )
      return
    setDeleting(true)
    setError(null)
    try {
      await deleteCard(card.id)
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
            {isEditing ? 'Editar tarjeta' : 'Nueva tarjeta'}
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
          <label className="text-xs text-slate-500">Nombre</label>
          <input
            ref={nameRef}
            type="text"
            placeholder="Naranja, Visa Galicia, Master..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base"
          />
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

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500">Día de cierre</label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              placeholder="1–31"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Día de vencimiento</label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              placeholder="1–31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {isEditing && (
          <label className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-700">
              <span className="font-medium">Tarjeta activa</span>
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
              {deleting ? 'Borrando…' : '🗑 Borrar tarjeta'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useCategoriesStore } from '../store/categories'
import useBodyScrollLock from '../hooks/useBodyScrollLock'
import { useUIStore } from '../store/ui'
import {
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
} from '../api/fixedExpenses'
import CategoryPicker from './CategoryPicker'

export default function FixedExpenseForm({ open, onClose, onSaved, expense = null }) {
  const isEditing = Boolean(expense)
  const { categories, loaded, fetch } = useCategoriesStore()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(null)
  const [dueDay, setDueDay] = useState('')
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (open && !loaded) fetch()
  }, [open, loaded, fetch])

  useEffect(() => {
    if (!open) return
    if (expense) {
      setName(expense.name)
      setAmount(String(expense.amount))
      setCategoryId(expense.category_id)
      setDueDay(expense.due_day ? String(expense.due_day) : '')
      setActive(Boolean(expense.active))
    } else {
      setName('')
      setAmount('')
      setCategoryId(null)
      setDueDay('')
      setActive(true)
    }
    setError(null)
    setTimeout(() => nameRef.current?.focus(), 100)
  }, [open, expense])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const canSubmit =
    !submitting && !deleting && name.trim() && Number(amount) > 0 && categoryId

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        category_id: categoryId,
        name: name.trim(),
        amount: Number(amount),
        due_day: dueDay ? Number(dueDay) : null,
      }
      if (isEditing) payload.active = active
      const saved = isEditing
        ? await updateFixedExpense(expense.id, payload)
        : await createFixedExpense(payload)
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
      title: 'Borrar gasto fijo',
      message: `"${expense.name}" se va a borrar. No se puede deshacer.`,
      confirmText: 'Borrar',
      danger: true,
    })
    if (!ok) return
    setDeleting(true)
    setError(null)
    try {
      await deleteFixedExpense(expense.id)
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
            {isEditing ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
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
            placeholder="Ej: Alquiler, Telefonía, Spotify"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500">Monto mensual</label>
            <div className="flex items-center mt-1 rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-slate-400 mr-1">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Día del mes</label>
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

        <div className="mt-4">
          <label className="text-xs text-slate-500">Categoría</label>
          <div className="mt-1">
            {!loaded ? (
              <div className="text-slate-400 text-sm">Cargando categorías…</div>
            ) : (
              <CategoryPicker
                categories={categories}
                type="expense"
                value={categoryId}
                onChange={setCategoryId}
              />
            )}
          </div>
        </div>

        {isEditing && (
          <label className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-700">
              <span className="font-medium">Activo</span>
              <span className="block text-xs text-slate-500">
                Desactivá para archivarlo sin borrarlo
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
              {deleting ? 'Borrando…' : '🗑 Borrar gasto fijo'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

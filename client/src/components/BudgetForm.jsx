import { useEffect, useRef, useState } from 'react'
import { createBudget, updateBudget, deleteBudget } from '../api/budgets'
import { formatMoney } from '../utils/format'

// `item` viene del endpoint /status: tiene category_id, monthly_limit, spent, budget_id.
// month/year son del periodo activo.
export default function BudgetForm({ open, onClose, onSaved, item, month, year }) {
  const isEditing = Boolean(item?.budget_id)
  const [limit, setLimit] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const limitRef = useRef(null)

  useEffect(() => {
    if (!open || !item) return
    setLimit(item.monthly_limit ? String(item.monthly_limit) : '')
    setError(null)
    setTimeout(() => limitRef.current?.focus(), 100)
  }, [open, item])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !item) return null

  const canSubmit = !submitting && !deleting && Number(limit) > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      if (isEditing) {
        await updateBudget(item.budget_id, { monthly_limit: Number(limit) })
      } else {
        await createBudget({
          category_id: item.category_id,
          monthly_limit: Number(limit),
          month,
          year,
        })
      }
      onSaved?.()
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
    if (!window.confirm(`¿Quitar el presupuesto de "${item.category_name}"?`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteBudget(item.budget_id)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al borrar')
    } finally {
      setDeleting(false)
    }
  }

  const spent = item.spent || 0
  const limitNum = Number(limit) || 0
  const wouldExceed = limitNum > 0 && spent > limitNum
  const remaining = Math.max(0, limitNum - spent)

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
            {isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
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

        {/* Categoría (read-only) */}
        <div
          className="mt-4 flex items-center gap-3 rounded-xl p-3"
          style={{ backgroundColor: `${item.category_color}22` }}
        >
          <span className="text-2xl">{item.category_icon}</span>
          <div>
            <div className="font-semibold text-slate-800">{item.category_name}</div>
            <div className="text-xs text-slate-500">
              Ya gastaste {formatMoney(spent)} este mes
            </div>
          </div>
        </div>

        {/* Límite mensual */}
        <div className="mt-4">
          <label className="text-xs text-slate-500">Límite mensual</label>
          <div className="flex items-center mt-1 rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-2xl text-slate-400 mr-1">$</span>
            <input
              ref={limitRef}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {limitNum > 0 && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
            {wouldExceed ? (
              <div className="text-red-600 font-medium">
                ⚠ Ya excediste este límite por {formatMoney(spent - limitNum)}
              </div>
            ) : (
              <div className="text-slate-700">
                Te quedarían <span className="font-semibold">{formatMoney(remaining)}</span> para
                este mes
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
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
              className="py-3 rounded-xl bg-emerald-500 text-white font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Guardando…' : isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="w-full py-2 text-sm text-red-600 font-semibold disabled:opacity-50"
            >
              {deleting ? 'Quitando…' : '🗑 Quitar presupuesto'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

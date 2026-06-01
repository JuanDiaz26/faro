import { useEffect, useRef, useState } from 'react'
import { useCategoriesStore } from '../store/categories'
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../api/transactions'
import { todayLocalISO } from '../utils/format'
import CategoryPicker from './CategoryPicker'

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo', icon: '💵' },
  { id: 'debit', label: 'Débito', icon: '💳' },
  { id: 'credit', label: 'Crédito', icon: '🪙' },
  { id: 'transfer', label: 'Transfer', icon: '📲' },
]

// `transaction` opcional → si está, modo edición. Si no, modo creación.
// `defaults` opcional → prellenar campos en modo creación (ej: "Pagar gasto fijo").
export default function TransactionForm({
  open,
  onClose,
  onSaved,
  transaction = null,
  defaults = null,
}) {
  const isEditing = Boolean(transaction)
  const { categories, loaded, fetch } = useCategoriesStore()
  const [type, setType] = useState('expense')
  const [categoryId, setCategoryId] = useState(null)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [date, setDate] = useState(todayLocalISO())
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const amountRef = useRef(null)

  useEffect(() => {
    if (open && !loaded) fetch()
  }, [open, loaded, fetch])

  // Precargar (edición) / prellenar (defaults) / resetear (creación pura) al abrir.
  useEffect(() => {
    if (!open) return
    if (transaction) {
      setType(transaction.type === 'income' ? 'income' : 'expense')
      setCategoryId(transaction.category_id)
      setAmount(String(transaction.amount))
      setPaymentMethod(transaction.payment_method)
      setDate(transaction.date)
      setDescription(transaction.description || '')
    } else if (defaults) {
      setType(defaults.type || 'expense')
      setCategoryId(defaults.category_id ?? null)
      setAmount(defaults.amount != null ? String(defaults.amount) : '')
      setPaymentMethod(defaults.payment_method ?? null)
      setDate(defaults.date || todayLocalISO())
      setDescription(defaults.description || '')
    } else {
      setType('expense')
      setCategoryId(null)
      setAmount('')
      setPaymentMethod(null)
      setDate(todayLocalISO())
      setDescription('')
    }
    setError(null)
    setTimeout(() => amountRef.current?.focus(), 100)
  }, [open, transaction, defaults])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleTypeChange = (newType) => {
    setType(newType)
    setCategoryId(null)
  }

  const canSubmit = !submitting && !deleting && Number(amount) > 0 && categoryId

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        category_id: categoryId,
        amount: Number(amount),
        date,
        type,
        payment_method: paymentMethod,
        description: description.trim() || null,
      }
      const saved = isEditing
        ? await updateTransaction(transaction.id, payload)
        : await createTransaction(payload)
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
    if (!window.confirm('¿Borrar esta transacción? No se puede deshacer.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteTransaction(transaction.id)
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
            {isEditing ? 'Editar transacción' : 'Cargar transacción'}
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

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {[
            { v: 'expense', label: 'Gasto', activeClass: 'bg-red-500' },
            { v: 'income', label: 'Ingreso', activeClass: 'bg-emerald-500' },
          ].map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => handleTypeChange(t.v)}
              className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                type === t.v ? `${t.activeClass} text-white` : 'text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

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
          <label className="text-xs text-slate-500">Categoría</label>
          <div className="mt-1">
            {!loaded ? (
              <div className="text-slate-400 text-sm">Cargando categorías…</div>
            ) : (
              <CategoryPicker
                categories={categories}
                type={type}
                value={categoryId}
                onChange={setCategoryId}
              />
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Método de pago (opcional)</label>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() =>
                  setPaymentMethod(paymentMethod === pm.id ? null : pm.id)
                }
                className={`rounded-xl p-2 text-center transition-colors ${
                  paymentMethod === pm.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <div className="text-lg leading-none">{pm.icon}</div>
                <div className="mt-1 text-[10px]">{pm.label}</div>
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
              max={todayLocalISO()}
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
              {deleting ? 'Borrando…' : '🗑 Borrar transacción'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

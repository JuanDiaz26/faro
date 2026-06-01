import { useEffect, useRef, useState } from 'react'
import { createDebt, updateDebt, deleteDebt } from '../api/debts'
import useBodyScrollLock from '../hooks/useBodyScrollLock'

// `debt` opcional → modo edición. Sin él, modo creación.
export default function DebtForm({ open, onClose, onSaved, debt = null }) {
  const isEditing = Boolean(debt)
  const [name, setName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [remainingAmount, setRemainingAmount] = useState('')
  const [minimumPayment, setMinimumPayment] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (debt) {
      setName(debt.name)
      setTotalAmount(String(debt.total_amount))
      setRemainingAmount(String(debt.remaining_amount))
      setMinimumPayment(debt.minimum_payment ? String(debt.minimum_payment) : '')
      setDueDay(debt.due_day ? String(debt.due_day) : '')
      setInterestRate(debt.interest_rate ? String(debt.interest_rate) : '')
      setActive(Boolean(debt.active))
    } else {
      setName('')
      setTotalAmount('')
      setRemainingAmount('')
      setMinimumPayment('')
      setDueDay('')
      setInterestRate('')
      setActive(true)
    }
    setError(null)
    setTimeout(() => nameRef.current?.focus(), 100)
  }, [open, debt])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // En modo creación, si toco total y no toqué restante, copio total → restante.
  const handleTotalChange = (v) => {
    setTotalAmount(v)
    if (!isEditing && (remainingAmount === '' || remainingAmount === totalAmount)) {
      setRemainingAmount(v)
    }
  }

  const canSubmit =
    !submitting &&
    !deleting &&
    name.trim() &&
    Number(totalAmount) >= 0 &&
    Number(remainingAmount) >= 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        total_amount: Number(totalAmount),
        remaining_amount: Number(remainingAmount),
        interest_rate: interestRate ? Number(interestRate) : 0,
        minimum_payment: minimumPayment ? Number(minimumPayment) : 0,
        due_day: dueDay ? Number(dueDay) : null,
      }
      if (isEditing) payload.active = active
      const saved = isEditing
        ? await updateDebt(debt.id, payload)
        : await createDebt(payload)
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
    if (!window.confirm(`¿Borrar la deuda "${debt.name}"? No se puede deshacer.`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteDebt(debt.id)
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
            {isEditing ? 'Editar deuda' : 'Nueva deuda'}
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
            placeholder="Ej: Tarjeta Naranja, Préstamo PSA"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500">Monto total</label>
            <div className="flex items-center mt-1 rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-slate-400 mr-1">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0"
                value={totalAmount}
                onChange={(e) => handleTotalChange(e.target.value)}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Restante</label>
            <div className="flex items-center mt-1 rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-slate-400 mr-1">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0"
                value={remainingAmount}
                onChange={(e) => setRemainingAmount(e.target.value)}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500">Pago mínimo mensual</label>
            <div className="flex items-center mt-1 rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-slate-400 mr-1">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="Opcional"
                value={minimumPayment}
                onChange={(e) => setMinimumPayment(e.target.value)}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
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

        <div className="mt-4">
          <label className="text-xs text-slate-500">Tasa de interés anual % (opcional)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {isEditing && (
          <label className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-700">
              <span className="font-medium">Deuda activa</span>
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
              {deleting ? 'Borrando…' : '🗑 Borrar deuda'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { createCharge, updateCharge, deleteCharge } from '../api/cards'
import { todayLocalISO } from '../utils/format'
import useBodyScrollLock from '../hooks/useBodyScrollLock'

// `charge` para modo edición. `cardId` requerido siempre.
export default function ChargeForm({ open, onClose, onSaved, cardId, charge = null }) {
  const isEditing = Boolean(charge)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [chargeKind, setChargeKind] = useState('installment') // 'installment' | 'recurring'
  const [totalMonths, setTotalMonths] = useState('')
  const [paidMonths, setPaidMonths] = useState('0')
  const [chargeDate, setChargeDate] = useState(todayLocalISO())
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const descRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (charge) {
      setDescription(charge.description)
      setAmount(String(charge.amount))
      if (charge.total_months) {
        setChargeKind('installment')
        setTotalMonths(String(charge.total_months))
        const paid = charge.total_months - (charge.remaining_months ?? 0)
        setPaidMonths(String(Math.max(0, paid)))
      } else {
        setChargeKind('recurring')
        setTotalMonths('')
        setPaidMonths('0')
      }
      setChargeDate(charge.charge_date)
      setActive(Boolean(charge.active))
    } else {
      setDescription('')
      setAmount('')
      setChargeKind('installment')
      setTotalMonths('')
      setPaidMonths('0')
      setChargeDate(todayLocalISO())
      setActive(true)
    }
    setError(null)
    setTimeout(() => descRef.current?.focus(), 100)
  }, [open, charge])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const canSubmit =
    !submitting &&
    !deleting &&
    description.trim() &&
    Number(amount) > 0 &&
    (chargeKind === 'recurring' || Number(totalMonths) > 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      let remaining_months = null
      let total_months = null
      if (chargeKind === 'installment') {
        total_months = Number(totalMonths)
        const paid = Math.max(0, Math.min(total_months, Number(paidMonths) || 0))
        remaining_months = total_months - paid
      }
      const payload = {
        card_id: cardId,
        description: description.trim(),
        amount: Number(amount),
        remaining_months,
        total_months,
        charge_date: chargeDate,
      }
      if (isEditing) payload.active = active
      const saved = isEditing
        ? await updateCharge(charge.id, payload)
        : await createCharge(payload)
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
    if (!window.confirm(`¿Borrar "${charge.description}"? No se puede deshacer.`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteCharge(charge.id)
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
            {isEditing ? 'Editar cargo' : 'Nuevo cargo'}
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
          <label className="text-xs text-slate-500">Descripción</label>
          <input
            ref={descRef}
            type="text"
            placeholder="TV Samsung, Spotify, Impuesto cheque..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Monto mensual</label>
          <div className="flex items-center mt-1 rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-slate-400 mr-1 text-lg">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-lg font-semibold bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {[
            { v: 'installment', label: 'Cuotas' },
            { v: 'recurring', label: 'Recurrente' },
          ].map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setChargeKind(t.v)}
              className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                chargeKind === t.v ? 'bg-slate-800 text-white' : 'text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-1 px-1">
          {chargeKind === 'installment'
            ? 'Cuotas: cae N veces más y se archiva.'
            : 'Recurrente: cae cada mes hasta que la archives.'}
        </p>

        {chargeKind === 'installment' && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">Cuotas totales</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="Ej: 8"
                value={totalMonths}
                onChange={(e) => setTotalMonths(e.target.value)}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Ya pagadas</label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={paidMonths}
                onChange={(e) => setPaidMonths(e.target.value)}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs text-slate-500">Fecha del consumo</label>
          <input
            type="date"
            value={chargeDate}
            onChange={(e) => setChargeDate(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {isEditing && (
          <label className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-700">
              <span className="font-medium">Activo</span>
              <span className="block text-xs text-slate-500">
                Desactivá para excluirlo del próximo resumen
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
              {deleting ? 'Borrando…' : '🗑 Borrar cargo'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

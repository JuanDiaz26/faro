import { useCallback, useEffect, useState } from 'react'
import {
  getCards,
  getCharges,
  closeStatement,
} from '../api/cards'
import { useCategoriesStore } from '../store/categories'
import { formatMoney, daysUntilNextDue } from '../utils/format'
import BackButton from '../components/BackButton'
import CardForm from '../components/CardForm'
import ChargeForm from '../components/ChargeForm'
import TransactionForm from '../components/TransactionForm'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function Cards() {
  const { categories, loaded: catsLoaded, fetch: fetchCats } = useCategoriesStore()
  const [cards, setCards] = useState([])
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!catsLoaded) fetchCats()
  }, [catsLoaded, fetchCats])

  // Modales
  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [chargeFormOpen, setChargeFormOpen] = useState(false)
  const [editingCharge, setEditingCharge] = useState(null)
  const [chargeFormCardId, setChargeFormCardId] = useState(null)
  const [payOpen, setPayOpen] = useState(false)
  const [payDefaults, setPayDefaults] = useState(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([getCards(), getCharges({ active: 'true' })])
      .then(([c, ch]) => {
        setCards(c)
        setCharges(ch)
      })
      .catch((e) => setError(e.message || 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const chargesByCard = charges.reduce((acc, c) => {
    if (!acc[c.card_id]) acc[c.card_id] = []
    acc[c.card_id].push(c)
    return acc
  }, {})

  const handleOpenCharge = (cardId, charge = null) => {
    setChargeFormCardId(cardId)
    setEditingCharge(charge)
    setChargeFormOpen(true)
  }

  const handlePay = (card) => {
    const now = new Date()
    // Buscamos la categoría "Pago deudas" por nombre (resiliente a reordenamiento del seed).
    const payDebtCat = categories.find(
      (c) => c.type === 'expense' && c.name === 'Pago deudas'
    )
    setPayDefaults({
      type: 'expense',
      category_id: payDebtCat?.id ?? null,
      amount: card.next_statement_estimate,
      description: `Resumen ${card.name} - ${MESES[now.getMonth()]}`,
    })
    setPayOpen(true)
  }

  const handleClose = async (card) => {
    const ok = window.confirm(
      `⚠ Cerrar resumen de ${card.name}\n\n` +
        'SOLO confirmá si YA te llegó el resumen real de la tarjeta.\n' +
        'Esta acción NO se puede deshacer fácilmente.\n\n' +
        `Próximo resumen actual: ${formatMoney(card.next_statement_estimate)}\n\n` +
        '• Cuotas pendientes: bajan 1 mes\n' +
        '• Cargos al último mes: se archivan\n' +
        '• Recurrentes: siguen igual\n\n' +
        'Después usás "Pagar" para registrar el pago del resumen como gasto.'
    )
    if (!ok) return
    try {
      const result = await closeStatement(card.id)
      refresh()
      if (result.archived_count > 0) {
        window.alert(
          `✓ Resumen cerrado.\nSe archivaron ${result.archived_count} cargo${
            result.archived_count === 1 ? '' : 's'
          } al llegar al último mes.`
        )
      }
    } catch (err) {
      window.alert(err.response?.data?.error || 'Error al cerrar resumen')
    }
  }

  return (
    <div className="p-4 space-y-3">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BackButton />
          <h1 className="text-2xl font-bold text-slate-800">Tarjetas</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingCard(null)
            setCardFormOpen(true)
          }}
          className="text-xs text-beam-600 font-semibold"
        >
          + Nueva tarjeta
        </button>
      </header>

      {loading && <div className="text-slate-500 text-sm">Cargando…</div>}
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {!loading && !error && (
        <>
          {cards.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              No tenés tarjetas cargadas todavía.
              <br />
              Tocá <span className="font-semibold text-beam-600">+ Nueva tarjeta</span> para
              empezar a trackear tu próximo resumen.
            </div>
          ) : (
            <ul className="space-y-4">
              {cards.map((card) => (
                <CardSection
                  key={card.id}
                  card={card}
                  charges={chargesByCard[card.id] || []}
                  onEditCard={() => {
                    setEditingCard(card)
                    setCardFormOpen(true)
                  }}
                  onAddCharge={() => handleOpenCharge(card.id, null)}
                  onEditCharge={(c) => handleOpenCharge(card.id, c)}
                  onPay={() => handlePay(card)}
                  onClose={() => handleClose(card)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <CardForm
        open={cardFormOpen}
        card={editingCard}
        onClose={() => setCardFormOpen(false)}
        onSaved={refresh}
      />
      <ChargeForm
        open={chargeFormOpen}
        cardId={chargeFormCardId}
        charge={editingCharge}
        onClose={() => setChargeFormOpen(false)}
        onSaved={refresh}
      />
      <TransactionForm
        open={payOpen}
        defaults={payDefaults}
        onClose={() => setPayOpen(false)}
        onSaved={() => {}}
      />
    </div>
  )
}

function CardSection({ card, charges, onEditCard, onAddCharge, onEditCharge, onPay, onClose }) {
  const daysToDue = daysUntilNextDue(card.due_day)
  const daysToClose = daysUntilNextDue(card.closing_day)

  return (
    <li className="rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Header de la tarjeta */}
      <button
        type="button"
        onClick={onEditCard}
        className="w-full text-left p-4 active:bg-slate-50"
        style={{ borderLeft: `4px solid ${card.color}` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">💳 {card.name}</h3>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {card.closing_day && daysToClose !== null && (
                <>Cierra en {daysToClose}d (día {card.closing_day})</>
              )}
              {card.due_day && daysToDue !== null && (
                <> · vence en {daysToDue}d (día {card.due_day})</>
              )}
            </div>
          </div>
          <span className="text-slate-300 text-lg">›</span>
        </div>

        <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: `${card.color}15` }}>
          <div className="text-[11px] text-slate-600">Próximo resumen estimado</div>
          <div className="text-2xl font-bold mt-0.5" style={{ color: card.color }}>
            {formatMoney(card.next_statement_estimate)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {card.active_charges_count} cargo{card.active_charges_count === 1 ? '' : 's'} activo{card.active_charges_count === 1 ? '' : 's'}
          </div>
        </div>
      </button>

      {/* Lista de cargos */}
      {charges.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {charges.map((ch) => (
            <li key={ch.id}>
              <button
                type="button"
                onClick={() => onEditCharge(ch)}
                className="w-full flex items-center justify-between px-4 py-2 active:bg-slate-50"
              >
                <div className="text-left min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {ch.description}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {ch.total_months
                      ? `Cuota ${ch.total_months - ch.remaining_months + 1}/${ch.total_months}`
                      : 'Recurrente'}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  {formatMoney(ch.amount)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Acciones */}
      <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
        <button
          type="button"
          onClick={onAddCharge}
          className="py-3 text-xs font-semibold text-beam-600 active:bg-slate-50"
        >
          + Cargo
        </button>
        <button
          type="button"
          onClick={onPay}
          disabled={card.next_statement_estimate <= 0}
          className="py-3 text-xs font-semibold text-slate-700 active:bg-slate-50 disabled:text-slate-300"
        >
          Pagar
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={card.active_charges_count === 0}
          className="py-3 text-xs font-semibold text-slate-700 active:bg-slate-50 disabled:text-slate-300"
        >
          Cerrar resumen
        </button>
      </div>
    </li>
  )
}

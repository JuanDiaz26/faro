// Lógica de tarjetas de crédito + cargos pendientes + cierre de resumen.
const db = require('../db/database')

// ─── TARJETAS ────────────────────────────────────────────

// GET /api/cards  → lista con `next_statement_estimate` calculado.
async function listCards(req, res) {
  const includeArchived = req.query.active === 'false'
  const where = includeArchived ? '' : 'WHERE c.active = 1'
  const rows = await db.prepare(
      `SELECT c.*,
              COALESCE(SUM(CASE WHEN ch.active = 1 THEN ch.amount ELSE 0 END), 0) AS next_statement_estimate,
              SUM(CASE WHEN ch.active = 1 THEN 1 ELSE 0 END) AS active_charges_count
       FROM credit_cards c
       LEFT JOIN card_charges ch ON ch.card_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.active DESC, c.id ASC`
    )
    .all()
  res.json(rows)
}

async function getCard(req, res) {
  const row = await db.prepare(
      `SELECT c.*,
              COALESCE(SUM(CASE WHEN ch.active = 1 THEN ch.amount ELSE 0 END), 0) AS next_statement_estimate
       FROM credit_cards c
       LEFT JOIN card_charges ch ON ch.card_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`
    )
    .get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Tarjeta no encontrada' })
  res.json(row)
}

async function createCard(req, res) {
  const {
    name,
    color = '#FF6B00',
    closing_day = null,
    due_day = null,
  } = req.body
  const { lastInsertRowid } = await db.prepare(
      `INSERT INTO credit_cards (name, color, closing_day, due_day, active)
       VALUES (@name, @color, @closing_day, @due_day, 1)`
    )
    .run({ name, color, closing_day, due_day })
  const created = await db.prepare('SELECT * FROM credit_cards WHERE id = ?').get(lastInsertRowid)
  res.status(201).json({ ...created, next_statement_estimate: 0, active_charges_count: 0 })
}

async function updateCard(req, res) {
  const id = Number(req.params.id)
  const {
    name,
    color = '#FF6B00',
    closing_day = null,
    due_day = null,
    active = true,
  } = req.body
  const { changes } = await db.prepare(
      `UPDATE credit_cards SET
         name = @name,
         color = @color,
         closing_day = @closing_day,
         due_day = @due_day,
         active = @active
       WHERE id = @id`
    )
    .run({
      id,
      name,
      color,
      closing_day,
      due_day,
      active: active ? 1 : 0,
    })
  if (!changes) return res.status(404).json({ error: 'Tarjeta no encontrada' })
  res.json(await db.prepare('SELECT * FROM credit_cards WHERE id = ?').get(id))
}

async function removeCard(req, res) {
  // CASCADE en FK borra los charges asociados automáticamente.
  const { changes } = await db.prepare('DELETE FROM credit_cards WHERE id = ?').run(req.params.id)
  if (!changes) return res.status(404).json({ error: 'Tarjeta no encontrada' })
  res.status(204).send()
}

// POST /api/cards/:id/close-statement
// Decrementa remaining_months de los cargos activos con cuotas; archiva los que llegan a 0.
async function closeStatement(req, res) {
  const id = Number(req.params.id)
  const card = await db.prepare('SELECT * FROM credit_cards WHERE id = ?').get(id)
  if (!card) return res.status(404).json({ error: 'Tarjeta no encontrada' })

  // Atómico: decrementar cuotas y archivar las que llegan a 0.
  const [, archived] = await db.batch([
    {
      sql: `UPDATE card_charges
              SET remaining_months = remaining_months - 1
              WHERE card_id = @id
                AND active = 1
                AND remaining_months IS NOT NULL
                AND remaining_months > 0`,
      args: { id },
    },
    {
      sql: `UPDATE card_charges
              SET active = 0
              WHERE card_id = @id
                AND remaining_months IS NOT NULL
                AND remaining_months <= 0`,
      args: { id },
    },
  ])
  const archivedCount = Number(archived.rowsAffected || 0)

  const updatedCard = await db.prepare(
      `SELECT c.*,
              COALESCE(SUM(CASE WHEN ch.active = 1 THEN ch.amount ELSE 0 END), 0) AS next_statement_estimate
       FROM credit_cards c
       LEFT JOIN card_charges ch ON ch.card_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`
    )
    .get(id)

  res.json({ card: updatedCard, archived_count: archivedCount })
}

module.exports = {
  listCards,
  getCard,
  createCard,
  updateCard,
  removeCard,
  closeStatement,
}

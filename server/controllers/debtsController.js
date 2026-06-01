// Lógica de negocio de deudas (Tarjeta Naranja, préstamos, etc).
const db = require('../db/database')

// GET /api/debts  (por defecto solo activas; ?active=false trae también las archivadas)
function getAll(req, res) {
  const includeArchived = req.query.active === 'false'
  const sql = includeArchived
    ? 'SELECT * FROM debts ORDER BY active DESC, remaining_amount DESC, id DESC'
    : 'SELECT * FROM debts WHERE active = 1 ORDER BY remaining_amount DESC, id DESC'
  res.json(db.prepare(sql).all())
}

// GET /api/debts/:id
function getOne(req, res) {
  const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Deuda no encontrada' })
  res.json(row)
}

// POST /api/debts
function create(req, res) {
  const {
    name,
    total_amount,
    remaining_amount,
    interest_rate = 0,
    minimum_payment = 0,
    due_day = null,
  } = req.body

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO debts (name, total_amount, remaining_amount, interest_rate, minimum_payment, due_day, active)
       VALUES (@name, @total_amount, @remaining_amount, @interest_rate, @minimum_payment, @due_day, 1)`
    )
    .run({
      name,
      total_amount,
      remaining_amount,
      interest_rate,
      minimum_payment,
      due_day,
    })

  const created = db.prepare('SELECT * FROM debts WHERE id = ?').get(lastInsertRowid)
  res.status(201).json(created)
}

// PUT /api/debts/:id
function update(req, res) {
  const id = Number(req.params.id)
  const {
    name,
    total_amount,
    remaining_amount,
    interest_rate = 0,
    minimum_payment = 0,
    due_day = null,
    active = true,
  } = req.body

  const { changes } = db
    .prepare(
      `UPDATE debts SET
         name             = @name,
         total_amount     = @total_amount,
         remaining_amount = @remaining_amount,
         interest_rate    = @interest_rate,
         minimum_payment  = @minimum_payment,
         due_day          = @due_day,
         active           = @active
       WHERE id = @id`
    )
    .run({
      id,
      name,
      total_amount,
      remaining_amount,
      interest_rate,
      minimum_payment,
      due_day,
      active: active ? 1 : 0,
    })

  if (changes === 0) {
    return res.status(404).json({ error: 'Deuda no encontrada' })
  }

  res.json(db.prepare('SELECT * FROM debts WHERE id = ?').get(id))
}

// DELETE /api/debts/:id
function remove(req, res) {
  const { changes } = db.prepare('DELETE FROM debts WHERE id = ?').run(req.params.id)
  if (changes === 0) {
    return res.status(404).json({ error: 'Deuda no encontrada' })
  }
  res.status(204).send()
}

module.exports = { getAll, getOne, create, update, remove }

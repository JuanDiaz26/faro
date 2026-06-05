// Lógica de negocio de transacciones.
const db = require('../db/database')

// SELECT base con datos de la categoría embebidos (para el frontend).
const SELECT_WITH_CATEGORY = `
  SELECT t.*,
         c.name  AS category_name,
         c.icon  AS category_icon,
         c.color AS category_color
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
`

// GET /api/transactions  (filtros opcionales: month, year, category_id, type, payment_method)
async function getAll(req, res) {
  const { month, year, category_id, type, payment_method } = req.query
  const conditions = []
  const params = {}

  if (month) {
    conditions.push("CAST(strftime('%m', t.date) AS INTEGER) = @month")
    params.month = Number(month)
  }
  if (year) {
    conditions.push("CAST(strftime('%Y', t.date) AS INTEGER) = @year")
    params.year = Number(year)
  }
  if (category_id) {
    conditions.push('t.category_id = @category_id')
    params.category_id = Number(category_id)
  }
  if (type) {
    conditions.push('t.type = @type')
    params.type = type
  }
  if (payment_method) {
    conditions.push('t.payment_method = @payment_method')
    params.payment_method = payment_method
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `${SELECT_WITH_CATEGORY} ${where} ORDER BY t.date DESC, t.id DESC`
  const stmt = db.prepare(sql)

  const rows = conditions.length ? await stmt.all(params) : await stmt.all()
  res.json(rows)
}

// GET /api/transactions/summary?month=&year=  (default = mes/año actual)
async function summary(req, res) {
  const now = new Date()
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1
  const year = req.query.year ? Number(req.query.year) : now.getFullYear()

  const rows = await db.prepare(
      `SELECT type, SUM(amount) AS total, COUNT(*) AS count
       FROM transactions
       WHERE CAST(strftime('%m', date) AS INTEGER) = @month
         AND CAST(strftime('%Y', date) AS INTEGER) = @year
       GROUP BY type`
    )
    .all({ month, year })

  const byType = Object.fromEntries(rows.map((r) => [r.type, r]))
  const ingresos = byType.income?.total || 0
  const gastos = byType.expense?.total || 0
  const count = rows.reduce((sum, r) => sum + r.count, 0)

  // Breakdown de gastos por categoría (para el gráfico del Dashboard).
  const byCategory = await db.prepare(
      `SELECT c.id   AS category_id,
              c.name AS name,
              c.icon AS icon,
              c.color AS color,
              SUM(t.amount) AS total,
              COUNT(t.id) AS count
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE CAST(strftime('%m', t.date) AS INTEGER) = @month
         AND CAST(strftime('%Y', t.date) AS INTEGER) = @year
         AND t.type = 'expense'
       GROUP BY c.id
       ORDER BY total DESC`
    )
    .all({ month, year })

  res.json({
    month,
    year,
    ingresos,
    gastos,
    balance: ingresos - gastos,
    count,
    by_category: byCategory,
  })
}

// GET /api/transactions/balance  — totales históricos (sin filtro de mes)
// Útil para mostrar el saldo real cuando un sueldo de fin de mes
// "cubre" el mes calendario siguiente.
async function balance(req, res) {
  const rows = await db.prepare(
      `SELECT type, SUM(amount) AS total
       FROM transactions
       GROUP BY type`
    )
    .all()

  const byType = Object.fromEntries(rows.map((r) => [r.type, r.total]))
  const ingresos = byType.income || 0
  const gastos = byType.expense || 0
  res.json({
    total_ingresos: ingresos,
    total_gastos: gastos,
    balance: ingresos - gastos,
  })
}

// GET /api/transactions/:id
async function getOne(req, res) {
  const row = await db.prepare(`${SELECT_WITH_CATEGORY} WHERE t.id = ?`).get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Transacción no encontrada' })
  res.json(row)
}

// POST /api/transactions
async function create(req, res) {
  const {
    category_id,
    amount,
    description = null,
    date,
    type,
    payment_method = null,
  } = req.body

  const { lastInsertRowid } = await db.prepare(
      `INSERT INTO transactions (category_id, amount, description, date, type, payment_method)
       VALUES (@category_id, @amount, @description, @date, @type, @payment_method)`
    )
    .run({ category_id, amount, description, date, type, payment_method })

  const created = await db.prepare(`${SELECT_WITH_CATEGORY} WHERE t.id = ?`).get(lastInsertRowid)
  res.status(201).json(created)
}

// PUT /api/transactions/:id
async function update(req, res) {
  const id = Number(req.params.id)
  const {
    category_id,
    amount,
    description = null,
    date,
    type,
    payment_method = null,
  } = req.body

  const { changes } = await db.prepare(
      `UPDATE transactions
       SET category_id    = @category_id,
           amount         = @amount,
           description    = @description,
           date           = @date,
           type           = @type,
           payment_method = @payment_method
       WHERE id = @id`
    )
    .run({ id, category_id, amount, description, date, type, payment_method })

  if (changes === 0) {
    return res.status(404).json({ error: 'Transacción no encontrada' })
  }

  const updated = await db.prepare(`${SELECT_WITH_CATEGORY} WHERE t.id = ?`).get(id)
  res.json(updated)
}

// DELETE /api/transactions/:id
async function remove(req, res) {
  const { changes } = await db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id)
  if (changes === 0) {
    return res.status(404).json({ error: 'Transacción no encontrada' })
  }
  res.status(204).send()
}

module.exports = { getAll, summary, balance, getOne, create, update, remove }

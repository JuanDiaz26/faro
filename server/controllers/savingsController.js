// Lógica de negocio de Ahorro: metas (savings_goals) + aportes (savings_movements).
const db = require('../db/database')

// ─── METAS ───────────────────────────────────────────────

// GET /api/savings/goals  (con monto actual calculado)
async function listGoals(req, res) {
  const includeArchived = req.query.active === 'false'
  const where = includeArchived ? '' : 'WHERE g.active = 1'
  const rows = await db.prepare(
      `SELECT g.*,
              COALESCE(SUM(m.amount), 0) AS current_amount,
              COUNT(m.id) AS movements_count
       FROM savings_goals g
       LEFT JOIN savings_movements m ON m.goal_id = g.id
       ${where}
       GROUP BY g.id
       ORDER BY g.active DESC, g.id DESC`
    )
    .all()
  res.json(rows)
}

async function getGoal(req, res) {
  const row = await db.prepare(
      `SELECT g.*, COALESCE(SUM(m.amount), 0) AS current_amount
       FROM savings_goals g
       LEFT JOIN savings_movements m ON m.goal_id = g.id
       WHERE g.id = ?
       GROUP BY g.id`
    )
    .get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Meta no encontrada' })
  res.json(row)
}

async function createGoal(req, res) {
  const {
    name,
    target_amount,
    icon = '🎯',
    color = '#10b981',
    description = null,
  } = req.body
  const { lastInsertRowid } = await db.prepare(
      `INSERT INTO savings_goals (name, target_amount, icon, color, description, active)
       VALUES (@name, @target_amount, @icon, @color, @description, 1)`
    )
    .run({ name, target_amount, icon, color, description })
  const created = await db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(lastInsertRowid)
  res.status(201).json({ ...created, current_amount: 0 })
}

async function updateGoal(req, res) {
  const id = Number(req.params.id)
  const {
    name,
    target_amount,
    icon = '🎯',
    color = '#10b981',
    description = null,
    active = true,
  } = req.body
  const { changes } = await db.prepare(
      `UPDATE savings_goals SET
         name = @name,
         target_amount = @target_amount,
         icon = @icon,
         color = @color,
         description = @description,
         active = @active
       WHERE id = @id`
    )
    .run({
      id,
      name,
      target_amount,
      icon,
      color,
      description,
      active: active ? 1 : 0,
    })
  if (!changes) return res.status(404).json({ error: 'Meta no encontrada' })
  const updated = await db.prepare(
      `SELECT g.*, COALESCE(SUM(m.amount), 0) AS current_amount
       FROM savings_goals g
       LEFT JOIN savings_movements m ON m.goal_id = g.id
       WHERE g.id = ?
       GROUP BY g.id`
    )
    .get(id)
  res.json(updated)
}

async function removeGoal(req, res) {
  // Por FK con ON DELETE SET NULL, los movimientos no se borran: pasan a "suelto".
  const { changes } = await db.prepare('DELETE FROM savings_goals WHERE id = ?').run(req.params.id)
  if (!changes) return res.status(404).json({ error: 'Meta no encontrada' })
  res.status(204).send()
}

// ─── MOVIMIENTOS ─────────────────────────────────────────

const SELECT_MOVEMENT_WITH_GOAL = `
  SELECT m.*,
         g.name  AS goal_name,
         g.icon  AS goal_icon,
         g.color AS goal_color
  FROM savings_movements m
  LEFT JOIN savings_goals g ON g.id = m.goal_id
`

async function listMovements(req, res) {
  const { goal_id, month, year, only_loose } = req.query
  const conditions = []
  const params = {}
  if (goal_id) {
    conditions.push('m.goal_id = @goal_id')
    params.goal_id = Number(goal_id)
  }
  if (only_loose === 'true') {
    conditions.push('m.goal_id IS NULL')
  }
  if (month) {
    conditions.push("CAST(strftime('%m', m.date) AS INTEGER) = @month")
    params.month = Number(month)
  }
  if (year) {
    conditions.push("CAST(strftime('%Y', m.date) AS INTEGER) = @year")
    params.year = Number(year)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `${SELECT_MOVEMENT_WITH_GOAL} ${where} ORDER BY m.date DESC, m.id DESC`
  const stmt = db.prepare(sql)
  res.json(conditions.length ? await stmt.all(params) : await stmt.all())
}

async function createMovement(req, res) {
  const {
    goal_id = null,
    amount,
    date,
    source = null,
    description = null,
    expense = null,
  } = req.body
  const isWithdrawal = Number(amount) < 0

  // Retiro "gastado": además del movimiento, registramos el gasto real para que
  // el saldo disponible no se infle. Ambos inserts van en un batch atómico.
  if (isWithdrawal && expense && expense.category_id) {
    const results = await db.batch([
      {
        sql: `INSERT INTO savings_movements (goal_id, amount, date, source, description)
              VALUES (@goal_id, @amount, @date, @source, @description)`,
        args: { goal_id, amount, date, source: null, description },
      },
      {
        sql: `INSERT INTO transactions (category_id, amount, date, type, payment_method, description)
              VALUES (@category_id, @amount, @date, 'expense', @payment_method, @description)`,
        args: {
          category_id: expense.category_id,
          amount: Math.abs(Number(amount)),
          date,
          payment_method: expense.payment_method || null,
          description: description || 'Retiro de ahorro',
        },
      },
    ])
    const movementId = Number(results[0].lastInsertRowid)
    const created = await db.prepare(`${SELECT_MOVEMENT_WITH_GOAL} WHERE m.id = ?`).get(movementId)
    return res.status(201).json(created)
  }

  // Aporte, o retiro que vuelve al efectivo: solo el movimiento.
  const { lastInsertRowid } = await db.prepare(
      `INSERT INTO savings_movements (goal_id, amount, date, source, description)
       VALUES (@goal_id, @amount, @date, @source, @description)`
    )
    .run({ goal_id, amount, date, source, description })
  const created = await db.prepare(`${SELECT_MOVEMENT_WITH_GOAL} WHERE m.id = ?`)
    .get(lastInsertRowid)
  res.status(201).json(created)
}

async function updateMovement(req, res) {
  const id = Number(req.params.id)
  const { goal_id = null, amount, date, source = null, description = null } = req.body
  const { changes } = await db.prepare(
      `UPDATE savings_movements
         SET goal_id = @goal_id,
             amount = @amount,
             date = @date,
             source = @source,
             description = @description
         WHERE id = @id`
    )
    .run({ id, goal_id, amount, date, source, description })
  if (!changes) return res.status(404).json({ error: 'Movimiento no encontrado' })
  const updated = await db.prepare(`${SELECT_MOVEMENT_WITH_GOAL} WHERE m.id = ?`).get(id)
  res.json(updated)
}

async function removeMovement(req, res) {
  const { changes } = await db.prepare('DELETE FROM savings_movements WHERE id = ?')
    .run(req.params.id)
  if (!changes) return res.status(404).json({ error: 'Movimiento no encontrado' })
  res.status(204).send()
}

// ─── SUMMARY ─────────────────────────────────────────────

// GET /api/savings/summary?month=&year=  (default = mes/año actual)
async function summary(req, res) {
  const now = new Date()
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1
  const year = req.query.year ? Number(req.query.year) : now.getFullYear()

  const totalRow = await db.prepare(
      'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM savings_movements'
    )
    .get()

  const monthRow = await db.prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
       FROM savings_movements
       WHERE CAST(strftime('%m', date) AS INTEGER) = @month
         AND CAST(strftime('%Y', date) AS INTEGER) = @year`
    )
    .get({ month, year })

  const looseRow = await db.prepare(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM savings_movements WHERE goal_id IS NULL'
    )
    .get()

  res.json({
    month,
    year,
    total_saved: totalRow.total,
    total_movements: totalRow.count,
    month_saved: monthRow.total,
    month_movements: monthRow.count,
    loose_saved: looseRow.total,
  })
}

module.exports = {
  listGoals,
  getGoal,
  createGoal,
  updateGoal,
  removeGoal,
  listMovements,
  createMovement,
  updateMovement,
  removeMovement,
  summary,
}

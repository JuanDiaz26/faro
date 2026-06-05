// Lógica de presupuestos: límites mensuales por categoría + status (gastado vs límite).
const db = require('../db/database')

// GET /api/budgets?month=&year=  → lista cruda de presupuestos del mes.
async function getAll(req, res) {
  const now = new Date()
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1
  const year = req.query.year ? Number(req.query.year) : now.getFullYear()

  const rows = await db.prepare(
      `SELECT b.*,
              c.name  AS category_name,
              c.icon  AS category_icon,
              c.color AS category_color
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       WHERE b.month = @month AND b.year = @year
       ORDER BY b.monthly_limit DESC`
    )
    .all({ month, year })
  res.json(rows)
}

// GET /api/budgets/status?month=&year=
// Devuelve TODAS las categorías de gasto con su límite (si existe) y lo gastado.
async function status(req, res) {
  const now = new Date()
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1
  const year = req.query.year ? Number(req.query.year) : now.getFullYear()

  const items = await db.prepare(
      `SELECT
         c.id    AS category_id,
         c.name  AS category_name,
         c.icon  AS category_icon,
         c.color AS category_color,
         b.id    AS budget_id,
         b.monthly_limit,
         COALESCE(t.spent, 0) AS spent
       FROM categories c
       LEFT JOIN budgets b
         ON b.category_id = c.id AND b.month = @month AND b.year = @year
       LEFT JOIN (
         SELECT category_id, SUM(amount) AS spent
         FROM transactions
         WHERE CAST(strftime('%m', date) AS INTEGER) = @month
           AND CAST(strftime('%Y', date) AS INTEGER) = @year
           AND type = 'expense'
         GROUP BY category_id
       ) t ON t.category_id = c.id
       WHERE c.type = 'expense'
       ORDER BY
         CASE WHEN b.monthly_limit IS NULL THEN 1 ELSE 0 END,
         spent DESC`
    )
    .all({ month, year })

  // Agregados útiles para Dashboard
  const withBudget = items.filter((i) => i.monthly_limit != null)
  const overBudget = withBudget.filter((i) => i.spent > i.monthly_limit)
  const totalLimit = withBudget.reduce((s, i) => s + i.monthly_limit, 0)
  const totalSpentInBudgeted = withBudget.reduce((s, i) => s + i.spent, 0)

  res.json({
    month,
    year,
    items,
    budgets_count: withBudget.length,
    over_budget_count: overBudget.length,
    total_limit: totalLimit,
    total_spent_in_budgeted: totalSpentInBudgeted,
  })
}

async function create(req, res) {
  const { category_id, monthly_limit, month, year } = req.body
  const { lastInsertRowid } = await db.prepare(
      `INSERT INTO budgets (category_id, monthly_limit, month, year)
       VALUES (?, ?, ?, ?)`
    )
    .run(category_id, monthly_limit, month, year)
  const created = await db.prepare('SELECT * FROM budgets WHERE id = ?').get(lastInsertRowid)
  res.status(201).json(created)
}

async function update(req, res) {
  const id = Number(req.params.id)
  const { monthly_limit } = req.body
  const { changes } = await db.prepare('UPDATE budgets SET monthly_limit = ? WHERE id = ?')
    .run(monthly_limit, id)
  if (!changes) return res.status(404).json({ error: 'Presupuesto no encontrado' })
  res.json(await db.prepare('SELECT * FROM budgets WHERE id = ?').get(id))
}

async function remove(req, res) {
  const { changes } = await db.prepare('DELETE FROM budgets WHERE id = ?')
    .run(req.params.id)
  if (!changes) return res.status(404).json({ error: 'Presupuesto no encontrado' })
  res.status(204).send()
}

module.exports = { getAll, status, create, update, remove }

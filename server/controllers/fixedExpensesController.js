// Lógica de negocio de gastos fijos recurrentes (alquiler, telefonía, etc).
const db = require('../db/database')

const SELECT_WITH_CATEGORY = `
  SELECT f.*,
         c.name  AS category_name,
         c.icon  AS category_icon,
         c.color AS category_color
  FROM fixed_expenses f
  JOIN categories c ON c.id = f.category_id
`

function getAll(req, res) {
  const includeArchived = req.query.active === 'false'
  const where = includeArchived ? '' : 'WHERE f.active = 1'
  const rows = db
    .prepare(
      `${SELECT_WITH_CATEGORY} ${where}
       ORDER BY f.active DESC,
                CASE WHEN f.due_day IS NULL THEN 1 ELSE 0 END,
                f.due_day ASC,
                f.id DESC`
    )
    .all()
  res.json(rows)
}

function getOne(req, res) {
  const row = db.prepare(`${SELECT_WITH_CATEGORY} WHERE f.id = ?`).get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Gasto fijo no encontrado' })
  res.json(row)
}

function create(req, res) {
  const { category_id, name, amount, due_day = null } = req.body
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO fixed_expenses (category_id, name, amount, due_day, active)
       VALUES (@category_id, @name, @amount, @due_day, 1)`
    )
    .run({ category_id, name, amount, due_day })
  const created = db
    .prepare(`${SELECT_WITH_CATEGORY} WHERE f.id = ?`)
    .get(lastInsertRowid)
  res.status(201).json(created)
}

function update(req, res) {
  const id = Number(req.params.id)
  const {
    category_id,
    name,
    amount,
    due_day = null,
    active = true,
  } = req.body

  const { changes } = db
    .prepare(
      `UPDATE fixed_expenses SET
         category_id = @category_id,
         name        = @name,
         amount      = @amount,
         due_day     = @due_day,
         active      = @active
       WHERE id = @id`
    )
    .run({
      id,
      category_id,
      name,
      amount,
      due_day,
      active: active ? 1 : 0,
    })

  if (!changes) return res.status(404).json({ error: 'Gasto fijo no encontrado' })

  const updated = db.prepare(`${SELECT_WITH_CATEGORY} WHERE f.id = ?`).get(id)
  res.json(updated)
}

function remove(req, res) {
  const { changes } = db
    .prepare('DELETE FROM fixed_expenses WHERE id = ?')
    .run(req.params.id)
  if (!changes) return res.status(404).json({ error: 'Gasto fijo no encontrado' })
  res.status(204).send()
}

module.exports = { getAll, getOne, create, update, remove }

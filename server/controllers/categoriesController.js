// Lógica de negocio de categorías.
const db = require('../db/database')

// GET /api/categories  (opcional ?type=expense|income)
function getAll(req, res) {
  const { type } = req.query
  const rows = type
    ? db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY id').all(type)
    : db.prepare('SELECT * FROM categories ORDER BY id').all()
  res.json(rows)
}

// GET /api/categories/:id
function getOne(req, res) {
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Categoría no encontrada' })
  res.json(row)
}

// POST /api/categories
function create(req, res) {
  const { name, color, icon, type } = req.body
  const { lastInsertRowid } = db
    .prepare('INSERT INTO categories (name, color, icon, type) VALUES (?, ?, ?, ?)')
    .run(name, color, icon, type)
  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(lastInsertRowid)
  res.status(201).json(created)
}

// PUT /api/categories/:id
function update(req, res) {
  const id = Number(req.params.id)
  const { name, color, icon, type } = req.body

  // Si cambia el tipo y la categoría tiene transacciones, no permito (rompería la consistencia).
  const current = db.prepare('SELECT type FROM categories WHERE id = ?').get(id)
  if (!current) return res.status(404).json({ error: 'Categoría no encontrada' })
  if (current.type !== type) {
    const used = db
      .prepare('SELECT 1 FROM transactions WHERE category_id = ? LIMIT 1')
      .get(id)
    if (used) {
      return res.status(409).json({
        error: 'No se puede cambiar el tipo: la categoría ya tiene transacciones.',
      })
    }
  }

  db.prepare(
    `UPDATE categories
     SET name = @name, color = @color, icon = @icon, type = @type
     WHERE id = @id`
  ).run({ id, name, color, icon, type })

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
  res.json(updated)
}

// DELETE /api/categories/:id  (rechaza si está en uso)
function remove(req, res) {
  const id = Number(req.params.id)

  const usage = {
    transactions: db
      .prepare('SELECT COUNT(*) AS c FROM transactions WHERE category_id = ?')
      .get(id).c,
    fixed_expenses: db
      .prepare('SELECT COUNT(*) AS c FROM fixed_expenses WHERE category_id = ?')
      .get(id).c,
    budgets: db
      .prepare('SELECT COUNT(*) AS c FROM budgets WHERE category_id = ?')
      .get(id).c,
    card_charges: db
      .prepare('SELECT COUNT(*) AS c FROM card_charges WHERE category_id = ?')
      .get(id).c,
  }
  const totalUsage = Object.values(usage).reduce((a, b) => a + b, 0)
  if (totalUsage > 0) {
    return res.status(409).json({
      error: 'Categoría en uso, no se puede borrar.',
      usage,
    })
  }

  const { changes } = db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  if (changes === 0) return res.status(404).json({ error: 'Categoría no encontrada' })
  res.status(204).send()
}

module.exports = { getAll, getOne, create, update, remove }

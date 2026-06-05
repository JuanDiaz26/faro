// CRUD de cargos pendientes de tarjeta.
const db = require('../db/database')

const SELECT_WITH_RELATED = `
  SELECT ch.*,
         c.name  AS card_name,
         c.color AS card_color,
         cat.name  AS category_name,
         cat.icon  AS category_icon,
         cat.color AS category_color
  FROM card_charges ch
  JOIN credit_cards c ON c.id = ch.card_id
  LEFT JOIN categories cat ON cat.id = ch.category_id
`

async function getAll(req, res) {
  const { card_id, active } = req.query
  const conditions = []
  const params = {}
  if (card_id) {
    conditions.push('ch.card_id = @card_id')
    params.card_id = Number(card_id)
  }
  if (active === 'true') conditions.push('ch.active = 1')
  if (active === 'false') conditions.push('ch.active = 0')
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `${SELECT_WITH_RELATED} ${where} ORDER BY ch.active DESC, ch.id DESC`
  const stmt = db.prepare(sql)
  res.json(conditions.length ? await stmt.all(params) : await stmt.all())
}

async function getOne(req, res) {
  const row = await db.prepare(`${SELECT_WITH_RELATED} WHERE ch.id = ?`).get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Cargo no encontrado' })
  res.json(row)
}

async function create(req, res) {
  const {
    card_id,
    description,
    amount,
    remaining_months = null,
    total_months = null,
    category_id = null,
    charge_date,
  } = req.body
  const { lastInsertRowid } = await db.prepare(
      `INSERT INTO card_charges
        (card_id, description, amount, remaining_months, total_months, category_id, charge_date, active)
       VALUES (@card_id, @description, @amount, @remaining_months, @total_months, @category_id, @charge_date, 1)`
    )
    .run({
      card_id,
      description,
      amount,
      remaining_months,
      total_months,
      category_id,
      charge_date,
    })
  const created = await db.prepare(`${SELECT_WITH_RELATED} WHERE ch.id = ?`)
    .get(lastInsertRowid)
  res.status(201).json(created)
}

async function update(req, res) {
  const id = Number(req.params.id)
  const {
    card_id,
    description,
    amount,
    remaining_months = null,
    total_months = null,
    category_id = null,
    charge_date,
    active = true,
  } = req.body
  const { changes } = await db.prepare(
      `UPDATE card_charges SET
         card_id          = @card_id,
         description      = @description,
         amount           = @amount,
         remaining_months = @remaining_months,
         total_months     = @total_months,
         category_id      = @category_id,
         charge_date      = @charge_date,
         active           = @active
       WHERE id = @id`
    )
    .run({
      id,
      card_id,
      description,
      amount,
      remaining_months,
      total_months,
      category_id,
      charge_date,
      active: active ? 1 : 0,
    })
  if (!changes) return res.status(404).json({ error: 'Cargo no encontrado' })
  const updated = await db.prepare(`${SELECT_WITH_RELATED} WHERE ch.id = ?`).get(id)
  res.json(updated)
}

async function remove(req, res) {
  const { changes } = await db.prepare('DELETE FROM card_charges WHERE id = ?').run(req.params.id)
  if (!changes) return res.status(404).json({ error: 'Cargo no encontrado' })
  res.status(204).send()
}

module.exports = { getAll, getOne, create, update, remove }

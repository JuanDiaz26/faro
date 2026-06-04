// Metas / objetivos personales (Fase 2). Distinto de savings_goals (plata).
const db = require('../db/database')

// GET /api/life-goals
function getAll(req, res) {
  const rows = db
    .prepare(
      `SELECT * FROM life_goals
       ORDER BY status = 'done', target_date IS NULL, target_date, id`
    )
    .all()
  res.json(rows)
}

// POST /api/life-goals
function create(req, res) {
  const {
    title,
    description = null,
    icon = '🎯',
    color = '#F59E0B',
    target_date = null,
    progress = 0,
    status = 'active',
  } = req.body

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO life_goals (title, description, icon, color, target_date, progress, status)
       VALUES (@title, @description, @icon, @color, @target_date, @progress, @status)`
    )
    .run({ title, description, icon, color, target_date, progress, status })

  res.status(201).json(db.prepare('SELECT * FROM life_goals WHERE id = ?').get(lastInsertRowid))
}

// PUT /api/life-goals/:id
function update(req, res) {
  const id = Number(req.params.id)
  const {
    title,
    description = null,
    icon = '🎯',
    color = '#F59E0B',
    target_date = null,
    progress = 0,
    status = 'active',
  } = req.body

  const { changes } = db
    .prepare(
      `UPDATE life_goals SET title=@title, description=@description, icon=@icon,
        color=@color, target_date=@target_date, progress=@progress, status=@status
       WHERE id=@id`
    )
    .run({ id, title, description, icon, color, target_date, progress, status })

  if (changes === 0) return res.status(404).json({ error: 'Meta no encontrada' })
  res.json(db.prepare('SELECT * FROM life_goals WHERE id = ?').get(id))
}

// DELETE /api/life-goals/:id
function remove(req, res) {
  const { changes } = db.prepare('DELETE FROM life_goals WHERE id = ?').run(req.params.id)
  if (changes === 0) return res.status(404).json({ error: 'Meta no encontrada' })
  res.status(204).send()
}

module.exports = { getAll, create, update, remove }

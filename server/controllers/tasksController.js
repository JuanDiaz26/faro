// Lógica de tareas / recordatorios (agenda in-app).
const db = require('../db/database')

// ¿La tarea aplica en la fecha dada? (date = objeto Date local)
function taskAppliesOn(task, date) {
  const iso = isoLocal(date)
  switch (task.recurrence) {
    case 'daily':
      return true
    case 'weekly': {
      if (!task.weekdays) return false
      const dow = date.getDay() // 0=domingo
      return task.weekdays.split(',').map((s) => Number(s.trim())).includes(dow)
    }
    case 'monthly':
      return task.day_of_month === date.getDate()
    case 'once':
    default:
      return task.due_date === iso
  }
}

function isoLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISO(iso) {
  // iso = 'YYYY-MM-DD' → Date local a medianoche
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// GET /api/tasks  → todas las tareas activas (para gestión)
function getAll(req, res) {
  const rows = db
    .prepare('SELECT * FROM tasks WHERE active = 1 ORDER BY time_of_day IS NULL, time_of_day, id')
    .all()
  res.json(rows)
}

// GET /api/tasks/agenda?date=YYYY-MM-DD
// Devuelve las tareas que aplican ese día + si están hechas + tareas 'once' vencidas no hechas.
function agenda(req, res) {
  const dateISO = req.query.date || isoLocal(new Date())
  const date = parseISO(dateISO)

  const tasks = db.prepare('SELECT * FROM tasks WHERE active = 1').all()
  const completions = db
    .prepare('SELECT task_id FROM task_completions WHERE date = ?')
    .all(dateISO)
  const doneSet = new Set(completions.map((c) => c.task_id))

  // Tareas del día
  const today = tasks
    .filter((t) => taskAppliesOn(t, date))
    .map((t) => ({ ...t, done: doneSet.has(t.id), overdue: false }))

  // Tareas 'once' vencidas y NO hechas (due_date < hoy, sin completion alguna)
  const overdue = tasks
    .filter((t) => t.recurrence === 'once' && t.due_date && t.due_date < dateISO)
    .filter((t) => {
      const c = db
        .prepare('SELECT 1 FROM task_completions WHERE task_id = ? LIMIT 1')
        .get(t.id)
      return !c
    })
    .map((t) => ({ ...t, done: false, overdue: true }))

  res.json({ date: dateISO, today, overdue })
}

// GET /api/tasks/range?from=YYYY-MM-DD&to=YYYY-MM-DD
// Devuelve { days: { 'YYYY-MM-DD': [tareas con done] } } para todo el rango.
// Alimenta las vistas Semana y Mes del frontend con una sola llamada.
function range(req, res) {
  const { from, to } = req.query
  if (!from || !to) return res.status(400).json({ error: 'from y to requeridos' })

  const tasks = db.prepare('SELECT * FROM tasks WHERE active = 1').all()
  const comps = db
    .prepare('SELECT task_id, date FROM task_completions WHERE date >= ? AND date <= ?')
    .all(from, to)

  const doneByDate = {}
  for (const c of comps) {
    if (!doneByDate[c.date]) doneByDate[c.date] = new Set()
    doneByDate[c.date].add(c.task_id)
  }

  const days = {}
  const end = parseISO(to)
  for (let d = parseISO(from); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = isoLocal(d)
    days[iso] = tasks
      .filter((t) => taskAppliesOn(t, d))
      .map((t) => ({ ...t, done: doneByDate[iso] ? doneByDate[iso].has(t.id) : false }))
  }

  res.json({ from, to, days })
}

// POST /api/tasks
function create(req, res) {
  const {
    title,
    notes = null,
    recurrence = 'once',
    weekdays = null,
    day_of_month = null,
    due_date = null,
    time_of_day = null,
  } = req.body

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO tasks (title, notes, recurrence, weekdays, day_of_month, due_date, time_of_day)
       VALUES (@title, @notes, @recurrence, @weekdays, @day_of_month, @due_date, @time_of_day)`
    )
    .run({ title, notes, recurrence, weekdays, day_of_month, due_date, time_of_day })

  const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(lastInsertRowid)
  res.status(201).json(created)
}

// PUT /api/tasks/:id
function update(req, res) {
  const id = Number(req.params.id)
  const {
    title,
    notes = null,
    recurrence = 'once',
    weekdays = null,
    day_of_month = null,
    due_date = null,
    time_of_day = null,
  } = req.body

  const { changes } = db
    .prepare(
      `UPDATE tasks SET title=@title, notes=@notes, recurrence=@recurrence,
        weekdays=@weekdays, day_of_month=@day_of_month, due_date=@due_date,
        time_of_day=@time_of_day WHERE id=@id`
    )
    .run({ id, title, notes, recurrence, weekdays, day_of_month, due_date, time_of_day })

  if (changes === 0) return res.status(404).json({ error: 'Tarea no encontrada' })
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id))
}

// DELETE /api/tasks/:id  (borrado real; las completions caen por CASCADE)
function remove(req, res) {
  const { changes } = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
  if (changes === 0) return res.status(404).json({ error: 'Tarea no encontrada' })
  res.status(204).send()
}

// POST /api/tasks/:id/toggle  { date }  → marca/desmarca completado ese día
function toggle(req, res) {
  const id = Number(req.params.id)
  const date = req.body.date || isoLocal(new Date())

  const exists = db
    .prepare('SELECT id FROM task_completions WHERE task_id = ? AND date = ?')
    .get(id, date)

  if (exists) {
    db.prepare('DELETE FROM task_completions WHERE id = ?').run(exists.id)
    return res.json({ task_id: id, date, done: false })
  }
  db.prepare('INSERT INTO task_completions (task_id, date) VALUES (?, ?)').run(id, date)
  res.json({ task_id: id, date, done: true })
}

module.exports = { getAll, agenda, range, create, update, remove, toggle }

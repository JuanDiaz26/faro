// Backup completo de la base: export e import en JSON.
// Pensado para migrar datos local → producción o para tener red de seguridad.
const db = require('../db/database')
const pkg = require('../package.json')

// Aceptamos backups tageados como "faro" (nuevo) o "eje" (alias del nombre previo).
const VALID_APP_TAGS = new Set(['faro', 'eje'])

// Orden importa: padres antes que hijos (para imports con FKs ON).
const TABLES = [
  'categories',
  'debts',
  'credit_cards',
  'savings_goals',
  'incomes',
  'transactions',
  'fixed_expenses',
  'savings_movements',
  'card_charges',
  'budgets',
  'life_goals',
  'tasks',
  'task_completions',
]

// GET /api/backup/export → JSON con todas las tablas.
async function exportAll(req, res) {
  const data = {}
  for (const t of TABLES) {
    data[t] = await db.prepare(`SELECT * FROM ${t}`).all()
  }
  res.json({
    app: 'faro',
    version: pkg.version || '0.1.0',
    exported_at: new Date().toISOString(),
    data,
  })
}

// POST /api/backup/import → reemplaza TODO con los datos del payload.
// Atómico: si algo falla, rollback automático.
async function importAll(req, res) {
  const payload = req.body
  if (!payload || !VALID_APP_TAGS.has(payload.app) || !payload.data) {
    return res.status(400).json({ error: 'Backup inválido: falta app:"faro" o data.' })
  }
  const data = payload.data

  // Validar que las claves presentes sean arrays; las ausentes se tratan como vacías.
  for (const t of TABLES) {
    if (data[t] === undefined) {
      data[t] = []
    } else if (!Array.isArray(data[t])) {
      return res
        .status(400)
        .json({ error: `Backup inválido: la tabla "${t}" no es un array.` })
    }
  }

  try {
    // Armamos TODAS las sentencias y las corremos en una sola transacción atómica.
    const stmts = []
    // Borrar en orden inverso (hijos primero) para no chocar con FKs.
    for (const t of [...TABLES].reverse()) {
      stmts.push({ sql: `DELETE FROM ${t}` })
    }
    // Resetear autoincrement para preservar IDs del export.
    stmts.push({ sql: 'DELETE FROM sqlite_sequence' })

    for (const t of TABLES) {
      const rows = data[t]
      if (rows.length === 0) continue
      const cols = Object.keys(rows[0])
      const placeholders = cols.map((c) => `@${c}`).join(', ')
      const sql = `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${placeholders})`
      for (const row of rows) stmts.push({ sql, args: row })
    }

    await db.batch(stmts)

    const counts = Object.fromEntries(TABLES.map((t) => [t, data[t].length]))
    res.json({ ok: true, restored: counts })
  } catch (e) {
    res.status(500).json({ error: `Error al restaurar: ${e.message}` })
  }
}

module.exports = { exportAll, importAll }

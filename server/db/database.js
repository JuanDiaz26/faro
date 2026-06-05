// Capa de datos sobre libSQL (@libsql/client). Compatible con SQLite,
// funciona local (archivo) y en la nube (Turso) según variables de entorno.
//
// DATABASE_URL: 'libsql://...' de Turso en producción.
//   Si no está, usa un archivo local server/db/finanzas.db (dev).
// DATABASE_AUTH_TOKEN: token de Turso (solo en producción).
//
// Se expone un shim estilo better-sqlite3 (prepare().get/all/run) PERO ASÍNCRONO,
// para que los controllers cambien lo mínimo: agregar async/await.

const fs = require('node:fs')
const path = require('node:path')
const { createClient } = require('@libsql/client')
const { categories: seedCategories } = require('./seed')

const LOCAL_PATH = process.env.DB_PATH || path.join(__dirname, 'finanzas.db')
const url = process.env.DATABASE_URL || `file:${LOCAL_PATH}`
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined
const isRemote = !url.startsWith('file:')

// Asegurar carpeta local si aplica.
if (!isRemote) {
  const dir = path.dirname(LOCAL_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const client = createClient(authToken ? { url, authToken } : { url })

// Normaliza los args de .get/.all/.run al formato de libsql.
function normalize(callArgs) {
  if (callArgs.length === 0) return undefined
  if (callArgs.length === 1) {
    const a = callArgs[0]
    if (a === undefined || a === null) return undefined
    if (Array.isArray(a)) return a
    if (typeof a === 'object') return a // named params { name: value }
    return [a] // escalar suelto → posicional
  }
  return callArgs // varios posicionales
}

function prepare(sql) {
  const exec = async (callArgs) => {
    const args = normalize(callArgs)
    return client.execute(args === undefined ? sql : { sql, args })
  }
  return {
    async get(...callArgs) {
      const res = await exec(callArgs)
      return res.rows[0]
    },
    async all(...callArgs) {
      const res = await exec(callArgs)
      return res.rows
    },
    async run(...callArgs) {
      const res = await exec(callArgs)
      return {
        changes: Number(res.rowsAffected || 0),
        lastInsertRowid:
          res.lastInsertRowid != null ? Number(res.lastInsertRowid) : null,
      }
    },
  }
}

// Transacción atómica de escritura. stmts: array de { sql, args } o string.
async function batch(stmts) {
  return client.batch(stmts, 'write')
}

// Aplica schema + seed. Idempotente. Llamar UNA vez al arrancar (await).
let ready = false
async function init() {
  if (ready) return
  try {
    await client.execute('PRAGMA foreign_keys = ON')
  } catch {
    // En remoto puede no aplicar; lo ignoramos.
  }

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await client.executeMultiple(schema)

  const r = await client.execute('SELECT COUNT(*) AS count FROM categories')
  if (Number(r.rows[0].count) === 0) {
    await batch(
      seedCategories.map((c) => ({
        sql: 'INSERT INTO categories (name, icon, color, type) VALUES (:name, :icon, :color, :type)',
        args: c,
      }))
    )
    console.log(`🌱 ${seedCategories.length} categorías sembradas (DB nueva)`)
  }

  ready = true
  console.log(`📦 DB lista (${isRemote ? 'Turso/remoto' : 'local: ' + url})`)
}

module.exports = { prepare, batch, init, client }

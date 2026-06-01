// Conexión compartida a SQLite (better-sqlite3, síncrono).
// Una sola instancia para toda la app. Aplica el schema de forma idempotente
// y siembra las categorías iniciales si la tabla está vacía (primera vez en deploy).
//
// DB_PATH: si está definida usa esa ruta (ej: /data/finanzas.db en Railway).
// Si no, usa server/db/finanzas.db (modo local).

const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')
const { categories: seedCategories } = require('./seed')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'finanzas.db')
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')

// Asegurar que el directorio padre exista (importante para /data en Railway).
const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 1) Aplicar el schema (CREATE TABLE IF NOT EXISTS).
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'))

// 2) Sembrar categorías solo si la tabla está vacía.
const { count } = db.prepare('SELECT COUNT(*) AS count FROM categories').get()
if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO categories (name, icon, color, type) VALUES (@name, @icon, @color, @type)'
  )
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row)
  })
  insertMany(seedCategories)
  console.log(`🌱 ${seedCategories.length} categorías sembradas (DB nueva)`)
}

console.log(`📦 SQLite lista en ${DB_PATH}`)

module.exports = db

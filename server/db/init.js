// Inicializa la base de datos: aplica el schema y siembra las categorías.
// Idempotente: se puede correr varias veces sin duplicar datos.
//   node db/init.js         (o)   npm run init-db
// Reset total:  rm db/finanzas.db && npm run init-db

const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')
const { categories } = require('./seed')

const DB_PATH = path.join(__dirname, 'finanzas.db')
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 1. Aplicar el schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')
db.exec(schema)
console.log('✅ Schema aplicado')

// 2. Sembrar categorías solo si la tabla está vacía
const { count } = db.prepare('SELECT COUNT(*) AS count FROM categories').get()

if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO categories (name, icon, color, type) VALUES (@name, @icon, @color, @type)'
  )
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row)
  })
  insertMany(categories)
  console.log(`🌱 ${categories.length} categorías sembradas`)
} else {
  console.log(`ℹ️  La tabla categories ya tiene ${count} filas, no se siembra de nuevo`)
}

db.close()
console.log(`📦 DB lista en ${DB_PATH}`)

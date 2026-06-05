const path = require('node:path')
const fs = require('node:fs')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const categoriesRouter = require('./routes/categories')
const transactionsRouter = require('./routes/transactions')
const debtsRouter = require('./routes/debts')
const savingsRouter = require('./routes/savings')
const fixedExpensesRouter = require('./routes/fixed-expenses')
const cardsRouter = require('./routes/cards')
const cardChargesRouter = require('./routes/card-charges')
const budgetsRouter = require('./routes/budgets')
const tasksRouter = require('./routes/tasks')
const lifeGoalsRouter = require('./routes/life-goals')
const backupRouter = require('./routes/backup')
const errorHandler = require('./middleware/errorHandler')
const { init } = require('./db/database')

const app = express()
const PORT = process.env.PORT || 3000

// Seguridad básica + CORS + parseo de JSON.
// Helmet con CSP relajada para que el SW + Workbox + assets PWA funcionen.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
)
app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Rutas de recursos
app.use('/api/categories', categoriesRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/debts', debtsRouter)
app.use('/api/savings', savingsRouter)
app.use('/api/fixed-expenses', fixedExpensesRouter)
app.use('/api/cards', cardsRouter)
app.use('/api/card-charges', cardChargesRouter)
app.use('/api/budgets', budgetsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/life-goals', lifeGoalsRouter)
app.use('/api/backup', backupRouter)

// 404 explícito para APIs desconocidas (antes del catch-all del frontend).
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta API no encontrada' })
})

// --- Servir el frontend buildeado (modo deploy) ---
// En dev no existe ../client/dist; en producción Vite lo genera.
const CLIENT_DIST = path.resolve(__dirname, '..', 'client', 'dist')
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST))
  // SPA fallback: cualquier otra ruta devuelve index.html.
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
  console.log(`🖥️  Sirviendo frontend desde ${CLIENT_DIST}`)
} else {
  // En desarrollo sin dist: solo devolvemos 404 para rutas no-API.
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' })
  })
}

// Manejador central de errores (debe ir último)
app.use(errorHandler)

// Aplicamos schema + seed (async) y recién ahí levantamos el server.
init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Faro corriendo en http://localhost:${PORT}`)
    })
  })
  .catch((e) => {
    console.error('❌ No se pudo inicializar la base de datos:', e)
    process.exit(1)
  })

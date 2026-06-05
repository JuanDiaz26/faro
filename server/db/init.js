// Inicializa la base de datos: aplica schema + seed de categorías.
// Idempotente. Uso: node db/init.js  (o)  npm run init-db
const { init } = require('./database')

init()
  .then(() => {
    console.log('✅ DB inicializada')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Error inicializando DB:', e)
    process.exit(1)
  })

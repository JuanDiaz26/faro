// Manejador central de errores. better-sqlite3 lanza errores síncronos que
// Express captura y enruta hasta acá.

function errorHandler(err, req, res, _next) {
  console.error('❌', err.message)

  // Errores de SQLite (FK inexistente, UNIQUE duplicado, etc.) → 400 cliente
  if (typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
    return res.status(400).json({
      error: 'Restricción de base de datos violada',
      detail: err.message,
    })
  }

  res.status(500).json({ error: 'Error interno del servidor' })
}

module.exports = errorHandler

// Corre las reglas de express-validator y corta con 400 si hay errores.
const { validationResult } = require('express-validator')

function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validación fallida',
      details: errors.array().map((e) => ({ campo: e.path, mensaje: e.msg })),
    })
  }
  next()
}

module.exports = validate

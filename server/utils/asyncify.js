// Envuelve los métodos de un controller async para que cualquier error
// (promesa rechazada) llegue al middleware de errores de Express 4,
// que por sí solo no captura errores async.
module.exports = function asyncify(controller) {
  const wrapped = {}
  for (const key of Object.keys(controller)) {
    const fn = controller[key]
    wrapped[key] =
      typeof fn === 'function'
        ? (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
        : fn
  }
  return wrapped
}

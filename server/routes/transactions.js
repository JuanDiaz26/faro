const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middleware/validate')
const controller = require('../controllers/transactionsController')

const router = express.Router()

// YYYY-MM-DD del día de hoy en hora del servidor (la app es single-user local).
const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Reglas de validación reutilizadas en POST y PUT.
const transactionBodyRules = [
  body('category_id').isInt({ gt: 0 }).withMessage('category_id debe ser un entero válido'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount debe ser un número mayor a 0'),
  body('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date debe ser YYYY-MM-DD')
    .custom((value) => {
      if (value > todayISO()) throw new Error('date no puede ser futura')
      return true
    }),
  body('type').isIn(['expense', 'income']).withMessage('type inválido'),
  body('payment_method')
    .optional({ values: 'null' })
    .isIn(['cash', 'debit', 'credit', 'transfer'])
    .withMessage('payment_method inválido'),
  body('description').optional({ values: 'null' }).isString().trim(),
]

// GET /api/transactions  (con filtros)
router.get(
  '/',
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('month debe ser 1-12'),
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('year inválido'),
  query('category_id').optional().isInt({ gt: 0 }).withMessage('category_id inválido'),
  query('type').optional().isIn(['expense', 'income']),
  query('payment_method').optional().isIn(['cash', 'debit', 'credit', 'transfer']),
  validate,
  controller.getAll
)

// GET /api/transactions/summary  (DEBE ir antes que /:id)
router.get(
  '/summary',
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  validate,
  controller.summary
)

// GET /api/transactions/balance  — totales históricos (también antes que /:id)
router.get('/balance', controller.balance)

// GET /api/transactions/:id
router.get(
  '/:id',
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  validate,
  controller.getOne
)

// POST /api/transactions
router.post('/', ...transactionBodyRules, validate, controller.create)

// PUT /api/transactions/:id
router.put(
  '/:id',
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  ...transactionBodyRules,
  validate,
  controller.update
)

// DELETE /api/transactions/:id
router.delete(
  '/:id',
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  validate,
  controller.remove
)

module.exports = router

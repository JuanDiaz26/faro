const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middleware/validate')
const asyncify = require('../utils/asyncify')
const c = asyncify(require('../controllers/budgetsController'))

const router = express.Router()

const monthYearOptional = [
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('month debe ser 1-12'),
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('year inválido'),
]

const bodyRules = [
  body('category_id').isInt({ gt: 0 }).withMessage('category_id inválido'),
  body('monthly_limit').isFloat({ gt: 0 }).withMessage('monthly_limit debe ser > 0'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('month debe ser 1-12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('year inválido'),
]

// /status DEBE ir antes que /:id-like rutas (no hay /:id-like, pero por consistencia).
router.get('/status', ...monthYearOptional, validate, c.status)

router.get('/', ...monthYearOptional, validate, c.getAll)

router.post('/', ...bodyRules, validate, c.create)

router.put(
  '/:id',
  param('id').isInt({ gt: 0 }),
  body('monthly_limit').isFloat({ gt: 0 }),
  validate,
  c.update
)

router.delete(
  '/:id',
  param('id').isInt({ gt: 0 }),
  validate,
  c.remove
)

module.exports = router

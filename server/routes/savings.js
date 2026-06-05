const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middleware/validate')
const asyncify = require('../utils/asyncify')
const c = asyncify(require('../controllers/savingsController'))

const router = express.Router()

// ─── METAS ───────────────────────────────────────────────

const goalBodyRules = [
  body('name').trim().notEmpty().withMessage('name es requerido'),
  body('target_amount').isFloat({ gt: 0 }).withMessage('target_amount debe ser > 0'),
  body('icon').optional().isString(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color debe ser hex'),
  body('description').optional({ values: 'null' }).isString().trim(),
]

router.get(
  '/goals',
  query('active').optional().isIn(['true', 'false']),
  validate,
  c.listGoals
)

router.get(
  '/goals/:id',
  param('id').isInt({ gt: 0 }),
  validate,
  c.getGoal
)

router.post('/goals', ...goalBodyRules, validate, c.createGoal)

router.put(
  '/goals/:id',
  param('id').isInt({ gt: 0 }),
  ...goalBodyRules,
  body('active').optional().isBoolean(),
  validate,
  c.updateGoal
)

router.delete(
  '/goals/:id',
  param('id').isInt({ gt: 0 }),
  validate,
  c.removeGoal
)

// ─── MOVIMIENTOS ─────────────────────────────────────────

const movementBodyRules = [
  body('goal_id').optional({ values: 'null' }).isInt({ gt: 0 }).withMessage('goal_id inválido'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount debe ser > 0'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date debe ser YYYY-MM-DD'),
  body('source')
    .optional({ values: 'null' })
    .isIn(['sueldo', 'aguinaldo', 'bono', 'extra', 'otro'])
    .withMessage('source inválido'),
  body('description').optional({ values: 'null' }).isString().trim(),
]

router.get(
  '/movements',
  query('goal_id').optional().isInt({ gt: 0 }),
  query('only_loose').optional().isIn(['true', 'false']),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  validate,
  c.listMovements
)

router.post('/movements', ...movementBodyRules, validate, c.createMovement)

router.put(
  '/movements/:id',
  param('id').isInt({ gt: 0 }),
  ...movementBodyRules,
  validate,
  c.updateMovement
)

router.delete(
  '/movements/:id',
  param('id').isInt({ gt: 0 }),
  validate,
  c.removeMovement
)

// ─── SUMMARY ─────────────────────────────────────────────

router.get(
  '/summary',
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  validate,
  c.summary
)

module.exports = router

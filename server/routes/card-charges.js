const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middleware/validate')
const c = require('../controllers/cardChargesController')

const router = express.Router()

const bodyRules = [
  body('card_id').isInt({ gt: 0 }).withMessage('card_id inválido'),
  body('description').trim().notEmpty().withMessage('description es requerida'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount debe ser > 0'),
  body('remaining_months')
    .optional({ values: 'null' })
    .isInt({ min: 0 })
    .withMessage('remaining_months inválido'),
  body('total_months')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('total_months inválido'),
  body('category_id').optional({ values: 'null' }).isInt({ gt: 0 }),
  body('charge_date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('charge_date debe ser YYYY-MM-DD'),
]

router.get(
  '/',
  query('card_id').optional().isInt({ gt: 0 }),
  query('active').optional().isIn(['true', 'false']),
  validate,
  c.getAll
)

router.get(
  '/:id',
  param('id').isInt({ gt: 0 }),
  validate,
  c.getOne
)

router.post('/', ...bodyRules, validate, c.create)

router.put(
  '/:id',
  param('id').isInt({ gt: 0 }),
  ...bodyRules,
  body('active').optional().isBoolean(),
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

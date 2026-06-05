const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middleware/validate')
const asyncify = require('../utils/asyncify')
const controller = asyncify(require('../controllers/debtsController'))

const router = express.Router()

const debtBodyRules = [
  body('name').trim().notEmpty().withMessage('name es requerido'),
  body('total_amount').isFloat({ min: 0 }).withMessage('total_amount debe ser ≥ 0'),
  body('remaining_amount').isFloat({ min: 0 }).withMessage('remaining_amount debe ser ≥ 0'),
  body('interest_rate').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('interest_rate inválido'),
  body('minimum_payment').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('minimum_payment inválido'),
  body('due_day').optional({ values: 'null' }).isInt({ min: 1, max: 31 }).withMessage('due_day debe ser 1-31'),
]

router.get(
  '/',
  query('active').optional().isIn(['true', 'false']),
  validate,
  controller.getAll
)

router.get(
  '/:id',
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  validate,
  controller.getOne
)

router.post('/', ...debtBodyRules, validate, controller.create)

router.put(
  '/:id',
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  ...debtBodyRules,
  body('active').optional().isBoolean().withMessage('active debe ser booleano'),
  validate,
  controller.update
)

router.delete(
  '/:id',
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  validate,
  controller.remove
)

module.exports = router

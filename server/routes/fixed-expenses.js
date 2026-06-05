const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middleware/validate')
const asyncify = require('../utils/asyncify')
const controller = asyncify(require('../controllers/fixedExpensesController'))

const router = express.Router()

const bodyRules = [
  body('category_id').isInt({ gt: 0 }).withMessage('category_id inválido'),
  body('name').trim().notEmpty().withMessage('name es requerido'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount debe ser > 0'),
  body('due_day')
    .optional({ values: 'null' })
    .isInt({ min: 1, max: 31 })
    .withMessage('due_day debe ser 1-31'),
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

router.post('/', ...bodyRules, validate, controller.create)

router.put(
  '/:id',
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  ...bodyRules,
  body('active').optional().isBoolean(),
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

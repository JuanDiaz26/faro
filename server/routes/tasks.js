const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middleware/validate')
const asyncify = require('../utils/asyncify')
const controller = asyncify(require('../controllers/tasksController'))

const router = express.Router()

const bodyRules = [
  body('title').trim().notEmpty().withMessage('title es requerido'),
  body('recurrence')
    .isIn(['once', 'daily', 'weekly', 'monthly'])
    .withMessage('recurrence inválida'),
  body('weekdays').optional({ values: 'null' }).isString(),
  body('day_of_month').optional({ values: 'null' }).isInt({ min: 1, max: 31 }),
  body('due_date').optional({ values: 'null' }).matches(/^\d{4}-\d{2}-\d{2}$/),
  body('time_of_day').optional({ values: 'null' }).matches(/^\d{2}:\d{2}$/),
  body('notes').optional({ values: 'null' }).isString(),
]

// /agenda DEBE ir antes que /:id
router.get(
  '/agenda',
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  validate,
  controller.agenda
)

router.get(
  '/range',
  query('from').matches(/^\d{4}-\d{2}-\d{2}$/),
  query('to').matches(/^\d{4}-\d{2}-\d{2}$/),
  validate,
  controller.range
)

router.get('/', controller.getAll)
router.post('/', ...bodyRules, validate, controller.create)
router.put('/:id', param('id').isInt({ gt: 0 }), ...bodyRules, validate, controller.update)
router.delete('/:id', param('id').isInt({ gt: 0 }), validate, controller.remove)
router.post(
  '/:id/toggle',
  param('id').isInt({ gt: 0 }),
  body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  validate,
  controller.toggle
)

module.exports = router

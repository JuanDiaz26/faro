const express = require('express')
const { body, param } = require('express-validator')
const validate = require('../middleware/validate')
const controller = require('../controllers/lifeGoalsController')

const router = express.Router()

const bodyRules = [
  body('title').trim().notEmpty().withMessage('title es requerido'),
  body('description').optional({ values: 'null' }).isString(),
  body('icon').optional({ values: 'null' }).isString(),
  body('color').optional({ values: 'null' }).matches(/^#[0-9A-Fa-f]{6}$/),
  body('target_date').optional({ values: 'null' }).matches(/^\d{4}-\d{2}-\d{2}$/),
  body('progress').optional({ values: 'null' }).isInt({ min: 0, max: 100 }),
  body('status').optional({ values: 'null' }).isIn(['active', 'done']),
]

router.get('/', controller.getAll)
router.post('/', ...bodyRules, validate, controller.create)
router.put('/:id', param('id').isInt({ gt: 0 }), ...bodyRules, validate, controller.update)
router.delete('/:id', param('id').isInt({ gt: 0 }), validate, controller.remove)

module.exports = router

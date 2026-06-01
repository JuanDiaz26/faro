const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middleware/validate')
const controller = require('../controllers/categoriesController')

const router = express.Router()

const bodyRules = [
  body('name').trim().notEmpty().withMessage('name es requerido'),
  body('color').matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color debe ser hex #RRGGBB'),
  body('icon').trim().notEmpty().withMessage('icon es requerido'),
  body('type').isIn(['expense', 'income']).withMessage("type debe ser 'expense' o 'income'"),
]

router.get(
  '/',
  query('type').optional().isIn(['expense', 'income']).withMessage("type debe ser 'expense' o 'income'"),
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

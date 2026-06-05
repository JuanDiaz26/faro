const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middleware/validate')
const asyncify = require('../utils/asyncify')
const c = asyncify(require('../controllers/cardsController'))

const router = express.Router()

const bodyRules = [
  body('name').trim().notEmpty().withMessage('name es requerido'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color debe ser hex'),
  body('closing_day').optional({ values: 'null' }).isInt({ min: 1, max: 31 }),
  body('due_day').optional({ values: 'null' }).isInt({ min: 1, max: 31 }),
]

router.get(
  '/',
  query('active').optional().isIn(['true', 'false']),
  validate,
  c.listCards
)

router.get(
  '/:id',
  param('id').isInt({ gt: 0 }),
  validate,
  c.getCard
)

router.post('/', ...bodyRules, validate, c.createCard)

router.put(
  '/:id',
  param('id').isInt({ gt: 0 }),
  ...bodyRules,
  body('active').optional().isBoolean(),
  validate,
  c.updateCard
)

router.delete(
  '/:id',
  param('id').isInt({ gt: 0 }),
  validate,
  c.removeCard
)

router.post(
  '/:id/close-statement',
  param('id').isInt({ gt: 0 }),
  validate,
  c.closeStatement
)

module.exports = router

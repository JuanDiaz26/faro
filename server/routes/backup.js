const express = require('express')
const asyncify = require('../utils/asyncify')
const controller = asyncify(require('../controllers/backupController'))

const router = express.Router()

router.get('/export', controller.exportAll)
// Subimos hasta ~50mb por si hay muchísimas transacciones en el backup.
router.post('/import', express.json({ limit: '50mb' }), controller.importAll)

module.exports = router

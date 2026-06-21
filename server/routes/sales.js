const express = require('express')
const router = express.Router()
const SalesController = require('../controllers/sales')

router.get('/stats',  SalesController.getStats)
router.get('/',       SalesController.getAll)
router.get('/:id',    SalesController.getOne)
router.post('/',      SalesController.create)
router.put('/:id',    SalesController.update)
router.delete('/:id', SalesController.delete)

module.exports = router
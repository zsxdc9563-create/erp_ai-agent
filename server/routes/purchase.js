const express = require('express')
const router = express.Router()
const PurchaseController = require('../controllers/purchase')

router.get('/',     PurchaseController.getAll)
router.get('/:id',  PurchaseController.getOne)
router.post('/',    PurchaseController.create)
router.put('/:id',  PurchaseController.update)
router.delete('/:id', PurchaseController.delete)

module.exports = router
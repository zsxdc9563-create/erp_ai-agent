const express = require('express')
const router = express.Router()
const SupplierController = require('../controllers/supplier')

router.get('/',     SupplierController.getAll)
router.get('/:id',  SupplierController.getOne)
router.post('/',    SupplierController.create)
router.put('/:id',  SupplierController.update)
router.delete('/:id', SupplierController.delete)

module.exports = router
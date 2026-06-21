const express = require('express')
const router = express.Router()
const ReportController = require('../controllers/report')

router.get('/summary',            ReportController.getSummary)
router.get('/monthly-sales',      ReportController.getMonthlySales)
router.get('/monthly-purchase',   ReportController.getMonthlyPurchase)
router.get('/sales-status',       ReportController.getSalesStatusDist)
router.get('/purchase-status',    ReportController.getPurchaseStatusDist)
router.get('/top-customers',      ReportController.getTopCustomers)
router.get('/top-suppliers',      ReportController.getTopSuppliers)
router.get('/inventory-category', ReportController.getInventoryByCategory)

module.exports = router
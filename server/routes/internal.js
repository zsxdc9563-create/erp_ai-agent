const express = require('express')
const router = express.Router()
const InventoryController = require('../controllers/inventory')

// 專給 AI agent 用的內部 API（不掛 auth）
router.get('/low-stock', InventoryController.getLowStock)

module.exports = router
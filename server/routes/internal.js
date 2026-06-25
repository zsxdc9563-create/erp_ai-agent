const express = require('express')
const router = express.Router()
const pool = require('../config/database')

// 庫存不足
router.get('/low-stock', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM inventory_items WHERE stock < safe_stock'
  )
  res.json({ success: true, data: rows })
})

// 全部庫存
router.get('/inventory', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM inventory_items')
  res.json({ success: true, data: rows })
})

// 供應商
router.get('/suppliers', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM suppliers')
  res.json({ success: true, data: rows })
})

// 客戶
router.get('/customers', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM customers')
  res.json({ success: true, data: rows })
})

// 銷售訂單
router.get('/sales', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT s.*, c.name as customer_name 
    FROM sales_orders s
    LEFT JOIN customers c ON s.customerId = c.id
    ORDER BY s.orderDate DESC
    LIMIT 50
  `)
  res.json({ success: true, data: rows })
})

// 採購訂單
router.get('/purchase', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT p.*, s.name as supplier_name
    FROM purchase_orders p
    LEFT JOIN suppliers s ON p.supplierId = s.id
    ORDER BY p.orderDate DESC
    LIMIT 50
  `)
  res.json({ success: true, data: rows })
})

module.exports = router
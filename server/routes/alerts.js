const express = require('express')
const router = express.Router()
const db = require('../config/database')

router.get('/low-stock', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, category, stock, safe_stock, unit, location
      FROM inventory_items
      WHERE stock <= safe_stock
      ORDER BY stock ASC
    `)
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
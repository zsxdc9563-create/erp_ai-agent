const pool = require('../config/database')

const ReportModel = {
  // 月份銷售統計
  async getMonthlySales() {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(amount) as total
      FROM sales_orders
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
      LIMIT 12
    `)
    return rows
  },

  // 月份進貨統計
  async getMonthlyPurchase() {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(amount) as total
      FROM purchase_orders
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
      LIMIT 12
    `)
    return rows
  },

  // 銷貨狀態分佈
  async getSalesStatusDist() {
    const [rows] = await pool.query(`
      SELECT status, COUNT(*) as count, SUM(amount) as total
      FROM sales_orders
      GROUP BY status
    `)
    return rows
  },

  // 進貨狀態分佈
  async getPurchaseStatusDist() {
    const [rows] = await pool.query(`
      SELECT status, COUNT(*) as count, SUM(amount) as total
      FROM purchase_orders
      GROUP BY status
    `)
    return rows
  },

  // 前五大客戶
  async getTopCustomers() {
    const [rows] = await pool.query(`
      SELECT customer, COUNT(*) as count, SUM(amount) as total
      FROM sales_orders
      GROUP BY customer
      ORDER BY total DESC
      LIMIT 5
    `)
    return rows
  },

  // 前五大供應商
  async getTopSuppliers() {
    const [rows] = await pool.query(`
      SELECT supplier, COUNT(*) as count, SUM(amount) as total
      FROM purchase_orders
      GROUP BY supplier
      ORDER BY total DESC
      LIMIT 5
    `)
    return rows
  },

  // 庫存分類統計
  async getInventoryByCategory() {
    const [rows] = await pool.query(`
      SELECT category, COUNT(*) as count, SUM(stock) as totalStock
      FROM inventory_items
      GROUP BY category
    `)
    return rows
  },

  // 總覽數字
  async getSummary() {
    const [[sales]]     = await pool.query('SELECT COUNT(*) as count, SUM(amount) as total FROM sales_orders')
    const [[purchase]]  = await pool.query('SELECT COUNT(*) as count, SUM(amount) as total FROM purchase_orders')
    const [[inventory]] = await pool.query('SELECT COUNT(*) as count FROM inventory_items')
    const [[lowStock]]  = await pool.query('SELECT COUNT(*) as count FROM inventory_items WHERE stock < safe_stock')
    const [[suppliers]] = await pool.query('SELECT COUNT(*) as count FROM suppliers')
    const [[customers]] = await pool.query('SELECT COUNT(*) as count FROM customers')

    return {
      sales:     { count: sales.count,     total: sales.total || 0 },
      purchase:  { count: purchase.count,  total: purchase.total || 0 },
      inventory: { count: inventory.count, lowStock: lowStock.count },
      suppliers: { count: suppliers.count },
      customers: { count: customers.count }
    }
  }
}

module.exports = ReportModel
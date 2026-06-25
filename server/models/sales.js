const pool = require('../config/database')

const SalesModel = {
  async findAll({ search, status } = {}) {
    let query = 'SELECT * FROM sales_orders WHERE 1=1'
    const params = []
    if (search) {
      query += ' AND (customer LIKE ? OR item LIKE ? OR id LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    query += ' ORDER BY created_at DESC'
    const [rows] = await pool.query(query, params)
    return rows
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM sales_orders WHERE id = ?', [id])
    return row
  },

  async getStats() {
    const [[{ total }]] = await pool.query('SELECT SUM(amount) as total FROM sales_orders')
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM sales_orders')
    const [byStatus] = await pool.query('SELECT status, COUNT(*) as count FROM sales_orders GROUP BY status')
    const statusMap = {}
    byStatus.forEach(s => { statusMap[s.status] = s.count })
    return { totalAmount: total || 0, count, byStatus: statusMap }
  },

  async create({ customer, item, qty, price, date, payment }) {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM sales_orders')
    const id = `SO-2024-${String(Number(count) + 78).padStart(4, '0')}`
    const amount = (Number(qty) || 0) * (Number(price) || 0)
    const orderDate = date || new Date().toISOString().slice(0, 10)

    await pool.query(`
      INSERT INTO sales_orders (id, customer, item, qty, unit, amount, date, payment, status)
      VALUES (?, ?, ?, ?, '個', ?, ?, ?, '待確認')
    `, [id, customer, item, Number(qty) || 0, amount, orderDate, payment || '轉帳'])

    return await SalesModel.findById(id)
  },

  async update(id, data) {
    const existing = await SalesModel.findById(id)
    if (!existing) return null

    await pool.query(`
      UPDATE sales_orders
      SET customer=?, item=?, qty=?, amount=?, date=?, payment=?, status=?
      WHERE id=?
    `, [
      data.customer || existing.customer,
      data.item     || existing.item,
      data.qty      || existing.qty,
      data.amount   || existing.amount,
      data.date     || existing.date,
      data.payment  || existing.payment,
      data.status   || existing.status,
      id
    ])

    return await SalesModel.findById(id)
  },

  async delete(id) {
    const existing = await SalesModel.findById(id)
    if (!existing) return false
    await pool.query('DELETE FROM sales_orders WHERE id = ?', [id])
    return true
  }
}

module.exports = SalesModel
const pool = require('../database')

const PurchaseModel = {
  async findAll({ search, status } = {}) {
    let query = 'SELECT * FROM purchase_orders WHERE 1=1'
    const params = []
    if (search) {
      query += ' AND (supplier LIKE ? OR item LIKE ? OR id LIKE ?)'
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
    const [[row]] = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [id])
    return row
  },

  async create({ supplier, item, qty, unit, price, date, note }) {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM purchase_orders')
    const id = `PO-2024-${String(Number(count) + 41).padStart(4, '0')}`
    const amount = (Number(qty) || 0) * (Number(price) || 0)
    const orderDate = date || new Date().toISOString().slice(0, 10)

    await pool.query(`
      INSERT INTO purchase_orders (id, supplier, item, qty, unit, amount, date, status, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, '待入庫', ?)
    `, [id, supplier, item, Number(qty) || 0, unit || '個', amount, orderDate, note || ''])

    return await PurchaseModel.findById(id)
  },

  async update(id, data) {
    const existing = await PurchaseModel.findById(id)
    if (!existing) return null

    await pool.query(`
      UPDATE purchase_orders
      SET supplier=?, item=?, qty=?, unit=?, amount=?, date=?, status=?
      WHERE id=?
    `, [
      data.supplier || existing.supplier,
      data.item     || existing.item,
      data.qty      || existing.qty,
      data.unit     || existing.unit,
      data.amount   || existing.amount,
      data.date     || existing.date,
      data.status   || existing.status,
      id
    ])

    return await PurchaseModel.findById(id)
  },

  async delete(id) {
    const existing = await PurchaseModel.findById(id)
    if (!existing) return false
    await pool.query('DELETE FROM purchase_orders WHERE id = ?', [id])
    return true
  }
}

module.exports = PurchaseModel
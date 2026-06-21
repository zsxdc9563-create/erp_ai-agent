const pool = require('../database')

const InventoryModel = {
  async findAll({ search, status, category } = {}) {
    let query = 'SELECT * FROM inventory_items WHERE 1=1'
    const params = []
    if (search) {
      query += ' AND (name LIKE ? OR id LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }
    if (status === '庫存不足') query += ' AND stock < safe_stock'
    if (status === '超量')     query += ' AND stock > max_stock * 0.9'
    if (status === '正常')     query += ' AND stock >= safe_stock AND stock <= max_stock * 0.9'

    const [rows] = await pool.query(query, params)
    return rows.map(InventoryModel.format)
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM inventory_items WHERE id = ?', [id])
    return row ? InventoryModel.format(row) : null
  },

  async findLowStock() {
    const [rows] = await pool.query('SELECT * FROM inventory_items WHERE stock < safe_stock')
    return rows.map(InventoryModel.format)
  },

  async create({ name, category, stock, safeStock, unit, location }) {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM inventory_items')
    const id = `INV-${String(Number(count) + 1).padStart(3, '0')}`
    const safeStockNum = Number(safeStock) || 0

    await pool.query(`
      INSERT INTO inventory_items (id, name, category, stock, safe_stock, max_stock, unit, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, category || '電子元件', Number(stock) || 0, safeStockNum, safeStockNum * 5, unit || '個', location || 'TBD'])

    return await InventoryModel.findById(id)
  },

  async adjust(id, { type, qty }) {
    const item = await InventoryModel.findById(id)
    if (!item) return null

    const amount = Number(qty) || 0
    let newStock = item.stock

    if (type === '入庫')      newStock += amount
    else if (type === '出庫') newStock = Math.max(0, item.stock - amount)
    else if (type === '盤點') newStock = amount

    const today = new Date().toISOString().slice(0, 10)
    await pool.query('UPDATE inventory_items SET stock = ?, last_update = ? WHERE id = ?', [newStock, today, id])

    return await InventoryModel.findById(id)
  },

  format(row) {
    return {
      id:         row.id,
      name:       row.name,
      category:   row.category,
      stock:      row.stock,
      safeStock:  row.safe_stock,
      maxStock:   row.max_stock,
      unit:       row.unit,
      location:   row.location,
      lastUpdate: row.last_update
    }
  }
}

module.exports = InventoryModel
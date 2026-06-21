const pool = require('../database')

const SupplierModel = {
  async findAll({ search } = {}) {
    let query = 'SELECT * FROM suppliers WHERE 1=1'
    const params = []
    if (search) {
      query += ' AND (name LIKE ? OR contact LIKE ? OR phone LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    query += ' ORDER BY created_at DESC'
    const [rows] = await pool.query(query, params)
    return rows
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id])
    return row
  },

  async create({ name, contact, phone, email, address, note }) {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM suppliers')
    const id = `SUP-${String(Number(count) + 1).padStart(3, '0')}`

    await pool.query(`
      INSERT INTO suppliers (id, name, contact, phone, email, address, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, name, contact || '', phone || '', email || '', address || '', note || ''])

    return await SupplierModel.findById(id)
  },

  async update(id, data) {
    const existing = await SupplierModel.findById(id)
    if (!existing) return null

    await pool.query(`
      UPDATE suppliers SET name=?, contact=?, phone=?, email=?, address=?, note=? WHERE id=?
    `, [
      data.name    || existing.name,
      data.contact || existing.contact,
      data.phone   || existing.phone,
      data.email   || existing.email,
      data.address || existing.address,
      data.note    || existing.note,
      id
    ])

    return await SupplierModel.findById(id)
  },

  async delete(id) {
    const existing = await SupplierModel.findById(id)
    if (!existing) return false
    await pool.query('DELETE FROM suppliers WHERE id = ?', [id])
    return true
  }
}

module.exports = SupplierModel
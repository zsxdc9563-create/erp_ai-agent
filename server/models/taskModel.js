const pool = require('../config/database')

const TaskModel = {
  async getAll() {
    const [rows] = await pool.query(
      `SELECT t.*, 
        u1.name as assigned_name, 
        u2.name as created_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       ORDER BY t.created_at DESC`
    )
    return rows
  },

  async create(title, description, assigned_to, created_by) {
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, assigned_to, created_by) VALUES (?, ?, ?, ?)',
      [title, description, assigned_to || null, created_by]
    )
    return result.insertId
  },

  async updateStatus(id, status) {
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id])
  },

  async delete(id) {
    await pool.query('DELETE FROM tasks WHERE id = ?', [id])
  },

  async getUsers() {
    const [rows] = await pool.query('SELECT id, name FROM users')
    return rows
  }
}

module.exports = TaskModel
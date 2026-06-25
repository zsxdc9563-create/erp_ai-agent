const express = require('express')
const router = express.Router()
const pool = require('../config/database')
const auth = require('../middleware/auth')

const ADMIN = '系統管理員'
const MANAGER = '主管'


const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.userRole)) {
    return res.status(403).json({ success: false, message: '權限不足' })
  }
  next()
}

// 所有人都能讀取
router.get('/', auth, async (req, res) => {
  try {
    const [tasks] = await pool.query(`
      SELECT t.*, 
        u1.name as assigned_name,
        u2.name as creator_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      ORDER BY t.created_at DESC
    `)
    res.json({ success: true, data: tasks })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 主管、管理員才能新增
router.post('/', auth, requireRole(ADMIN, MANAGER), async (req, res) => {
  try {
    const { title, description, assigned_to } = req.body
    if (!title) return res.status(400).json({ success: false, message: '請輸入任務標題' })
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, assigned_to, created_by) VALUES (?, ?, ?, ?)',
      [title, description || null, assigned_to || null, req.userId]
    )
    res.json({ success: true, data: { id: result.insertId } })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 主管、管理員才能移動
router.patch('/:id/status', auth, requireRole(ADMIN, MANAGER), async (req, res) => {
  try {
    const { status } = req.body
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id])
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 只有管理員能刪除
router.delete('/:id', auth, requireRole(ADMIN), async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})



// 取得所有使用者（指派任務用）
router.get('/users', auth, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, role FROM users')
    res.json({ success: true, data: users })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})
module.exports = router
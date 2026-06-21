const express = require('express')
const router = express.Router()
const pool = require('../database')

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '請輸入帳號與密碼' })
    }
    const [[user]] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    )
    if (!user) {
      return res.status(401).json({ success: false, message: '帳號或密碼錯誤' })
    }
    res.json({
      success: true,
      data: {
        id: user.id, name: user.name,
        email: user.email, role: user.role,
        token: `token-${user.id}-${Date.now()}`
      }
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

router.post('/logout', async (req, res) => {
  res.json({ success: true, message: '已登出' })
})

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ success: false, message: '未登入' })
    const userId = token.split('-')[1]
    const [[user]] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?', [userId]
    )
    if (!user) return res.status(401).json({ success: false, message: '使用者不存在' })
    res.json({ success: true, data: user })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

module.exports = router
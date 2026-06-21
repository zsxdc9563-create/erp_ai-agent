const express = require('express')
const cors = require('cors')
const path = require('path')
const logger = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const auth = require('./middleware/auth')

const app = express()
const PORT = process.env.PORT || 3000

// ── Middleware（全部在路由之前）──
app.use(cors())
app.use(express.json())
app.use(logger)

// ── 路由 ──
// 公開路由
app.use('/api/auth', require('./routes/auth'))

// AI 路由（不掛 auth）
app.use('/api/ai', require('./routes/ai'))

// 內部 API（給 AI agent 用，不掛 auth）
app.use('/api/internal', require('./routes/internal'))

// 受保護路由
app.use('/api/purchase',  auth, require('./routes/purchase'))
app.use('/api/sales',     auth, require('./routes/sales'))
app.use('/api/inventory', auth, require('./routes/inventory'))
app.use('/api/suppliers', auth, require('./routes/suppliers'))
app.use('/api/customers', auth, require('./routes/customers'))
app.use('/api/reports',   auth, require('./routes/reports'))

// 錯誤處理
app.use(errorHandler)

// Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`✅ ERP Server running at http://localhost:${PORT}`)
})
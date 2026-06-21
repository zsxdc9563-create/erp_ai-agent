const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'sabrina123',
  database: process.env.DB_NAME || 'erp_system',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
})


// 測試連線
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL 連線成功')
    conn.release()
  })
  .catch(err => {
    console.error('❌ MySQL 連線失敗:', err.message)
  })

module.exports = pool
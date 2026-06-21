const logger = (req, res, next) => {
  const start = Date.now()
  const time = new Date().toLocaleTimeString('zh-TW')

  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    const color = status >= 400 ? '❌' : status >= 300 ? '🔄' : '✅'
    console.log(`${color} [${time}] ${req.method} ${req.path} ${status} ${duration}ms`)
  })

  next()
}

module.exports = logger
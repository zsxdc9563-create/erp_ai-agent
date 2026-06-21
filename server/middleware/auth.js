const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登入，請先登入' })
  }

  // 驗證 token 格式 token-{userId}-{timestamp}
  const parts = token.split('-')
  if (parts.length < 3 || parts[0] !== 'token') {
    return res.status(401).json({ success: false, message: 'Token 無效' })
  }

  // 把 userId 放進 req 供後續使用
  req.userId = parts[1]
  next()
}

module.exports = auth
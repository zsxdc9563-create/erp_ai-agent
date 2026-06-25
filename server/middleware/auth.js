const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, message: '未登入，請先登入' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.userId = decoded.userId
    req.userRole = decoded.role

    next()
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token 無效或已過期' })
  }
}

module.exports = auth
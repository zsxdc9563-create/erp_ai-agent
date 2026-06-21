const SalesModel = require('../models/sales')

const SalesController = {
  async getAll(req, res) {
    try {
      const { search, status } = req.query
      const data = await SalesModel.findAll({ search, status })
      res.json({ success: true, data, total: data.length })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getOne(req, res) {
    try {
      const data = await SalesModel.findById(req.params.id)
      if (!data) return res.status(404).json({ success: false, message: '找不到該銷貨單' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getStats(req, res) {
    try {
      const data = await SalesModel.getStats()
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async create(req, res) {
    try {
      const { customer, item } = req.body
      if (!customer || !item) {
        return res.status(400).json({ success: false, message: '客戶與品項為必填' })
      }
      const data = await SalesModel.create(req.body)
      res.status(201).json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async update(req, res) {
    try {
      const data = await SalesModel.update(req.params.id, req.body)
      if (!data) return res.status(404).json({ success: false, message: '找不到該銷貨單' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async delete(req, res) {
    try {
      const result = await SalesModel.delete(req.params.id)
      if (!result) return res.status(404).json({ success: false, message: '找不到該銷貨單' })
      res.json({ success: true, message: '已刪除' })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  }
}

module.exports = SalesController
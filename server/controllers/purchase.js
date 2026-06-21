const PurchaseModel = require('../models/purchase')

const PurchaseController = {
  async getAll(req, res) {
    try {
      const { search, status } = req.query
      const data = await PurchaseModel.findAll({ search, status })
      res.json({ success: true, data, total: data.length })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getOne(req, res) {
    try {
      const data = await PurchaseModel.findById(req.params.id)
      if (!data) return res.status(404).json({ success: false, message: '找不到該進貨單' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async create(req, res) {
    try {
      const { supplier, item } = req.body
      if (!supplier || !item) {
        return res.status(400).json({ success: false, message: '供應商與品項為必填' })
      }
      const data = await PurchaseModel.create(req.body)
      res.status(201).json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async update(req, res) {
    try {
      const data = await PurchaseModel.update(req.params.id, req.body)
      if (!data) return res.status(404).json({ success: false, message: '找不到該進貨單' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async delete(req, res) {
    try {
      const result = await PurchaseModel.delete(req.params.id)
      if (!result) return res.status(404).json({ success: false, message: '找不到該進貨單' })
      res.json({ success: true, message: '已刪除' })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  }
}

module.exports = PurchaseController
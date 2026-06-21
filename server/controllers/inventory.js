const InventoryModel = require('../models/inventory')

const InventoryController = {
  async getAll(req, res) {
    try {
      const { search, status, category } = req.query
      const data = await InventoryModel.findAll({ search, status, category })
      res.json({ success: true, data, total: data.length })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getOne(req, res) {
    try {
      const data = await InventoryModel.findById(req.params.id)
      if (!data) return res.status(404).json({ success: false, message: '找不到品項' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getLowStock(req, res) {
    try {
      const data = await InventoryModel.findLowStock()
      res.json({ success: true, data, count: data.length })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async create(req, res) {
    try {
      const { name } = req.body
      if (!name) return res.status(400).json({ success: false, message: '品項名稱為必填' })
      const data = await InventoryModel.create(req.body)
      res.status(201).json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async adjust(req, res) {
    try {
      const data = await InventoryModel.adjust(req.params.id, req.body)
      if (!data) return res.status(404).json({ success: false, message: '找不到品項' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  }
}

module.exports = InventoryController
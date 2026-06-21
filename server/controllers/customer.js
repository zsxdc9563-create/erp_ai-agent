const CustomerModel = require('../models/customer')

const CustomerController = {
  async getAll(req, res) {
    try {
      const { search } = req.query
      const data = await CustomerModel.findAll({ search })
      res.json({ success: true, data, total: data.length })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getOne(req, res) {
    try {
      const data = await CustomerModel.findById(req.params.id)
      if (!data) return res.status(404).json({ success: false, message: '找不到客戶' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async create(req, res) {
    try {
      const { name } = req.body
      if (!name) return res.status(400).json({ success: false, message: '客戶名稱為必填' })
      const data = await CustomerModel.create(req.body)
      res.status(201).json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async update(req, res) {
    try {
      const data = await CustomerModel.update(req.params.id, req.body)
      if (!data) return res.status(404).json({ success: false, message: '找不到客戶' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async delete(req, res) {
    try {
      const result = await CustomerModel.delete(req.params.id)
      if (!result) return res.status(404).json({ success: false, message: '找不到客戶' })
      res.json({ success: true, message: '已刪除' })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  }
}

module.exports = CustomerController
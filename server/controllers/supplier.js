const SupplierModel = require('../models/supplier')

const SupplierController = {
  async getAll(req, res) {
    try {
      const { search } = req.query
      const data = await SupplierModel.findAll({ search })
      res.json({ success: true, data, total: data.length })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getOne(req, res) {
    try {
      const data = await SupplierModel.findById(req.params.id)
      if (!data) return res.status(404).json({ success: false, message: '找不到供應商' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async create(req, res) {
    try {
      const { name } = req.body
      if (!name) return res.status(400).json({ success: false, message: '供應商名稱為必填' })
      const data = await SupplierModel.create(req.body)
      res.status(201).json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async update(req, res) {
    try {
      const data = await SupplierModel.update(req.params.id, req.body)
      if (!data) return res.status(404).json({ success: false, message: '找不到供應商' })
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async delete(req, res) {
    try {
      const result = await SupplierModel.delete(req.params.id)
      if (!result) return res.status(404).json({ success: false, message: '找不到供應商' })
      res.json({ success: true, message: '已刪除' })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  }
}

module.exports = SupplierController
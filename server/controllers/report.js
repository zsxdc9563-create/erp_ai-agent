const ReportModel = require('../models/report')

const ReportController = {
  async getSummary(req, res) {
    try {
      const data = await ReportModel.getSummary()
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getMonthlySales(req, res) {
    try {
      const data = await ReportModel.getMonthlySales()
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getMonthlyPurchase(req, res) {
    try {
      const data = await ReportModel.getMonthlyPurchase()
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getSalesStatusDist(req, res) {
    try {
      const data = await ReportModel.getSalesStatusDist()
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getPurchaseStatusDist(req, res) {
    try {
      const data = await ReportModel.getPurchaseStatusDist()
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getTopCustomers(req, res) {
    try {
      const data = await ReportModel.getTopCustomers()
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getTopSuppliers(req, res) {
    try {
      const data = await ReportModel.getTopSuppliers()
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  },

  async getInventoryByCategory(req, res) {
    try {
      const data = await ReportModel.getInventoryByCategory()
      res.json({ success: true, data })
    } catch (e) {
      res.status(500).json({ success: false, message: e.message })
    }
  }
}

module.exports = ReportController
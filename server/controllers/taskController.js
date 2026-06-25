const TaskModel = require('../models/taskModel')

exports.getAll = async (req, res) => {
  try {
    const tasks = await TaskModel.getAll()
    res.json({ success: true, data: tasks })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { title, description, assigned_to } = req.body
    if (!title) return res.status(400).json({ success: false, message: '請輸入標題' })
    const id = await TaskModel.create(title, description, assigned_to, req.userId)
    res.json({ success: true, data: { id } })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
}

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    await TaskModel.updateStatus(req.params.id, status)
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await TaskModel.delete(req.params.id)
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
}

exports.getUsers = async (req, res) => {
  try {
    const users = await TaskModel.getUsers()
    res.json({ success: true, data: users })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
}
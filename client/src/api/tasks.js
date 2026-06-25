import { apiFetch } from './index'

const BASE = '/api/tasks'

export const fetchTasks = () => apiFetch(`${BASE}`)

export const createTask = (data) => apiFetch(`${BASE}`, { method: 'POST', body: JSON.stringify(data) })

export const updateTaskStatus = (id, status) => apiFetch(`${BASE}/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })

export const deleteTask = (id) => apiFetch(`${BASE}/${id}`, { method: 'DELETE' })

export const fetchUsers = () => apiFetch(`${BASE}/users`)
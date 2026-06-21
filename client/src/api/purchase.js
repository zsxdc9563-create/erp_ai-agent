import { apiFetch } from './index'

const BASE = '/api/purchase'

export async function fetchOrders(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiFetch(`${BASE}?${query}`)
}

export async function createOrder(data) {
  return apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateOrder(id, data) {
  return apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteOrder(id) {
  return apiFetch(`${BASE}/${id}`, { method: 'DELETE' })
}
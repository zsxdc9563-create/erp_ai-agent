import { apiFetch } from './index'

const BASE = '/api/sales'

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

export async function fetchStats() {
  return apiFetch(`${BASE}/stats`)
}
import { apiFetch } from './index'

const BASE = '/api/inventory'

export async function fetchItems(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiFetch(`${BASE}?${query}`)
}

export async function createItem(data) {
  return apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function adjustStock(id, data) {
  return apiFetch(`${BASE}/${id}/adjust`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function fetchLowStock() {
  return apiFetch(`${BASE}/alerts/low-stock`)
}
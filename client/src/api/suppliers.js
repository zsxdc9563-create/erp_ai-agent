import { apiFetch } from './index'

const BASE = '/api/suppliers'

export async function fetchSuppliers(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiFetch(`${BASE}?${query}`)
}

export async function createSupplier(data) {
  return apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateSupplier(id, data) {
  return apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteSupplier(id) {
  return apiFetch(`${BASE}/${id}`, { method: 'DELETE' })
}
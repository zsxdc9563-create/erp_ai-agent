import { apiFetch } from './index'

const BASE = '/api/customers'

export async function fetchCustomers(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiFetch(`${BASE}?${query}`)
}

export async function createCustomer(data) {
  return apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCustomer(id, data) {
  return apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteCustomer(id) {
  return apiFetch(`${BASE}/${id}`, { method: 'DELETE' })
}
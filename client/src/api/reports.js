import { apiFetch } from './index'

const BASE = '/api/reports'

export async function fetchSummary() {
  return apiFetch(`${BASE}/summary`)
}

export async function fetchMonthlySales() {
  return apiFetch(`${BASE}/monthly-sales`)
}

export async function fetchMonthlyPurchase() {
  return apiFetch(`${BASE}/monthly-purchase`)
}

export async function fetchSalesStatus() {
  return apiFetch(`${BASE}/sales-status`)
}

export async function fetchPurchaseStatus() {
  return apiFetch(`${BASE}/purchase-status`)
}

export async function fetchTopCustomers() {
  return apiFetch(`${BASE}/top-customers`)
}

export async function fetchTopSuppliers() {
  return apiFetch(`${BASE}/top-suppliers`)
}

export async function fetchInventoryByCategory() {
  return apiFetch(`${BASE}/inventory-category`)
}
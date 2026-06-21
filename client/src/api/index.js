// 統一 fetch 工具，自動帶入 token
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('erp_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }

  const res = await fetch(url, { ...options, headers })

  // token 過期或未登入
  if (res.status === 401) {
    localStorage.removeItem('erp_token')
    localStorage.removeItem('erp_user')
    window.location.href = '/login'
    return
  }

  return res.json()
}
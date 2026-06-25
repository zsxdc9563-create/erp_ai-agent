import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 從 localStorage 讀取已登入的使用者資料和 token
  const user = ref(JSON.parse(localStorage.getItem('erp_user') || 'null'))
  const token = ref(localStorage.getItem('erp_token') || '')

  // 計算屬性：判斷是否已登入
  const isLoggedIn = computed(() => !!user.value && !!token.value)

  // 計算屬性：取得使用者名稱
  const userName = computed(() => user.value?.name || '')

  // 計算屬性：取得使用者角色
  const userRole = computed(() => user.value?.role || '')

  // 計算屬性：取得使用者 ID（Kanban 指派任務用）
  const userId = computed(() => user.value?.id || null)

  // 登入後儲存使用者資料和 token
  function setUser(data) {
    user.value = { id: data.id, name: data.name, email: data.email, role: data.role }
    token.value = data.token
    localStorage.setItem('erp_user', JSON.stringify(user.value))
    localStorage.setItem('erp_token', data.token)
  }

  // 登出：清除所有使用者資料
  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('erp_user')
    localStorage.removeItem('erp_token')
  }

  return { user, token, isLoggedIn, userName, userRole, userId, setUser, logout }
})
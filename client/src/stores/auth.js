import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('erp_user') || 'null'))
  const token = ref(localStorage.getItem('erp_token') || '')

  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const userName = computed(() => user.value?.name || '')
  const userRole = computed(() => user.value?.role || '')

  function setUser(data) {
    user.value = { id: data.id, name: data.name, email: data.email, role: data.role }
    token.value = data.token
    localStorage.setItem('erp_user', JSON.stringify(user.value))
    localStorage.setItem('erp_token', data.token)
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('erp_user')
    localStorage.removeItem('erp_token')
  }

  return { user, token, isLoggedIn, userName, userRole, setUser, logout }
})
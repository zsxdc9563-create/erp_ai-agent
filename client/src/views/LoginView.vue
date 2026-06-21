<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">⬡</div>
        <h1 class="login-title">ERP System</h1>
        <p class="login-sub">企業資源規劃系統</p>
      </div>

      <div class="login-form">
        <div class="form-group">
          <label>電子郵件</label>
          <input
            ref="emailRef"
            v-model="email"
            type="email"
            class="form-control"
            placeholder="sabrina@erp.com"
            @keyup.enter="login"
          />  
        </div>
        <div class="form-group">
          <label>密碼</label>
          <div class="password-wrap">
            <input
                ref="passwordRef"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                placeholder="輸入密碼"
                @keyup.enter="login"
              />
            <button class="toggle-pw" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button class="btn-login" @click="login" :disabled="loading">
          {{ loading ? '登入中...' : '登入' }}
        </button>

        <div class="hint">
        <p>測試帳號：</p>
        <p>sabrina@erp.com / sabrina123</p>
        <p>wang@erp.com / user123</p>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const emailRef = ref(null)
const passwordRef = ref(null)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

onMounted(() => {
  // 每 500ms 同步一次 autofill 的值
  setInterval(() => {
    if (emailRef.value) email.value = emailRef.value.value
    if (passwordRef.value) password.value = passwordRef.value.value
  }, 500)
})

async function login() {
  if (emailRef.value) email.value = emailRef.value.value
  if (passwordRef.value) password.value = passwordRef.value.value

  if (!email.value || !password.value) {
    errorMsg.value = '請輸入帳號與密碼'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })
    const data = await res.json()
    if (data.success) {
      authStore.setUser(data.data)
      router.push('/dashboard')
    } else {
      errorMsg.value = data.message || '登入失敗'
    }
  } catch (e) {
    errorMsg.value = '伺服器連線失敗'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--color-sidebar);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.login-header { text-align: center; margin-bottom: 32px; }
.login-logo { font-size: 40px; color: var(--color-accent); }
.login-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin-top: 8px; }
.login-sub { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }

.login-form { display: flex; flex-direction: column; gap: 16px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }

.form-control {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border var(--transition);
  width: 100%;
}
.form-control:focus { border-color: var(--color-accent); }

.password-wrap { position: relative; }
.password-wrap .form-control { padding-right: 40px; }
.toggle-pw {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%);
  border: none; background: none;
  cursor: pointer; font-size: 16px;
}

.error-msg {
  background: var(--color-danger-light);
  color: var(--color-danger);
  padding: 10px 14px;
  border-radius: var(--border-radius);
  font-size: 13px;
}

.btn-login {
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background var(--transition);
  margin-top: 4px;
}
.btn-login:hover { background: var(--color-accent-dark); }
.btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

.hint {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-bg);
  padding: 10px;
  border-radius: var(--border-radius);
  line-height: 1.8;
}
</style>
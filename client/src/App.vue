<template>
  <!-- 登入頁面：不顯示 Sidebar -->
  <div v-if="route.path === '/login'" class="login-layout">
    <router-view />
  </div>

  <!-- 主系統：顯示完整 Sidebar 版面 -->
  <div v-else class="erp-layout">
    <!-- 手機遮罩 -->
    <div v-if="sidebarOpen" class="sidebar-mask" @click="sidebarOpen = false"></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen, collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo" @click="router.push('/home')" style="cursor:pointer">
          <span class="logo-icon">⬡</span>
          <div class="logo-text">
            <span class="logo-title">ERP System</span>
            <span class="logo-sub">企業資源規劃</span>
          </div>
        </div>
        <button class="sidebar-close" @click="sidebarOpen = false">✕</button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">核心模組</div>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
          @click="sidebarOpen = false"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">{{ userInitial }}</div>
          <div class="user-detail">
            <span class="user-name">{{ authStore.userName || 'Sabrina Chen' }}</span>
            <span class="user-role">{{ authStore.userRole || '系統管理員' }}</span>
          </div>
          
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="main-wrapper">
      <header class="top-header">
        <div class="header-left">
          <button class="menu-btn" @click="sidebarOpen = true">☰</button>
          <!-- 👇 新增：桌面版收合鈕 -->
          <button
            class="collapse-btn"
            @click="toggleCollapse"
            :title="sidebarCollapsed ? '展開側邊欄' : '收合側邊欄'"
          >
            {{ sidebarCollapsed ? '⮞' : '⮜' }}
          </button>
          <div>
            <h1 class="page-title">{{ route.meta?.title }}</h1>
            <div class="breadcrumb">
              <span>首頁</span><span class="sep">/</span>
              <span class="current">{{ route.meta?.title }}</span>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="header-time">
            <div class="time-main">{{ currentTime }}</div>
            <div class="time-date">{{ currentDate }}</div>
          </div>

          <div class="header-actions">
            <button class="btn-icon" @click="showAI = !showAI; showNotify = false; showSettings = false" title="AI 助手">🤖</button>
            <button class="btn-icon" @click="showNotify = !showNotify; showSettings = false; showAI = false" title="通知">
              <span>🔔</span>
              <span class="dot" v-if="notifications.length > 0"></span>
            </button>
            <button class="btn-icon" @click="showSettings = !showSettings; showNotify = false; showAI = false" title="設定">⚙️</button>
          </div>
        </div>
      </header>

      <!-- 通知面板 -->
      <div v-if="showNotify" class="panel notify-panel">
        <div class="panel-header">
          <span class="panel-title">🔔 通知</span>
          <button class="panel-clear" @click="notifications = []">全部清除</button>
        </div>
        <div class="panel-body">
          <div v-if="notifications.length === 0" class="panel-empty">沒有新通知</div>
          <div v-for="n in notifications" :key="n.id" class="notify-item" :class="n.type">
            <span class="notify-icon">{{ n.icon }}</span>
            <div class="notify-content">
              <div class="notify-title">{{ n.title }}</div>
              <div class="notify-msg">{{ n.message }}</div>
              <div class="notify-time">{{ n.time }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 設定面板 -->
      <div v-if="showSettings" class="panel settings-panel">
        <div class="panel-header">
          <span class="panel-title">⚙️ 系統設定</span>
        </div>
        <div class="panel-body">
          <div class="setting-item">
            <span class="setting-label">使用者</span>
            <span class="setting-value">{{ authStore.userName }}</span>
          </div>
          <div class="setting-item">
            <span class="setting-label">角色</span>
            <span class="setting-value">{{ authStore.userRole }}</span>
          </div>
          <div class="setting-item">
            <span class="setting-label">系統版本</span>
            <span class="setting-value">v1.0.0</span>
          </div>
          <div class="setting-item">
            <span class="setting-label">資料庫</span>
            <span class="setting-value">MySQL 9.7</span>
          </div>
          <div class="setting-divider"></div>
          <button class="setting-logout" @click="logout">🚪 登出系統</button>
        </div>
      </div>

      <!-- AI 助手面板 -->
      <div v-if="showAI" class="panel ai-panel">
        <div class="panel-header">
          <span class="panel-title">🤖 AI 助手</span>
        </div>
        <div class="ai-mode-row">
          <button
            class="ai-mode-btn"
            :class="{ active: aiMode === 'news' }"
            @click="aiMode = 'news'"
          >📰 查時事</button>
          <button
            class="ai-mode-btn"
            :class="{ active: aiMode === 'erp' }"
            @click="aiMode = 'erp'"
          >📊 查庫存</button>
        </div>
        <div class="panel-body">
          <div class="ai-input-row">
            <input
              v-model="aiQuery"
              class="ai-input"
              :placeholder="aiMode === 'news' ? '輸入主題，例如：台積電 法說會' : '例如：目前哪些庫存不足？'"
              @keyup.enter="askAI"
              :disabled="aiLoading"
            />
            <button class="ai-send" @click="askAI" :disabled="aiLoading">
              {{ aiLoading ? '查詢中…' : '送出' }}
            </button>
          </div>

          <div v-if="aiLoading" class="ai-hint">
            {{ aiMode === 'news' ? '正在查詢網路新聞並整理，約需 30 秒…' : '正在查詢 ERP 資料並整理，約需 30 秒…' }}
          </div>
          <div v-if="aiError" class="ai-error">{{ aiError }}</div>
          <div v-if="aiAnswer" class="ai-answer">{{ aiAnswer }}</div>

          <div v-if="aiSources.length" class="ai-sources">
            <div class="ai-sources-title">資料來源</div>
            <a v-for="(s, i) in aiSources" :key="i" :href="s.url" target="_blank" class="ai-source">
              [{{ i + 1 }}] {{ s.title }}
            </a>
          </div>
        </div>
      </div>

      <main class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchLowStock } from '@/api/inventory'

const route = useRoute()                  
const router = useRouter()        
const authStore = useAuthStore()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
function toggleCollapse() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const showNotify = ref(false)
const showSettings = ref(false)
const notifications = ref([])

// AI 助手
const showAI = ref(false)
const aiQuery = ref('')
const aiAnswer = ref('')
const aiSources = ref([])
const aiLoading = ref(false)
const aiError = ref('')
const aiMode = ref('news')

async function askAI() {
  if (!aiQuery.value.trim() || aiLoading.value) return
  aiLoading.value = true
  aiError.value = ''
  aiAnswer.value = ''
  aiSources.value = []
  try {
    const url = aiMode.value === 'erp' ? '/api/ai/erp' : '/api/ai/news'
    console.log('=== AI 請求 ===', url, aiQuery.value.trim())
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: aiQuery.value.trim() })
    })
    if (!res.ok) throw new Error('AI 服務回應異常（' + res.status + '）')
    const data = await res.json()
    console.log('=== AI 回應 ===', JSON.stringify(data))
    if (!data) throw new Error('回應為空')
    aiAnswer.value = data.answer || '沒有取得回答'
    aiSources.value = data.sources || []
  } catch (e) {
    aiError.value = '查詢失敗：' + e.message
  } finally {
    aiLoading.value = false
  }
}

const navItems = [
  { path: '/dashboard', icon: '📊', label: '總覽儀表板' },
  { path: '/purchase',  icon: '📦', label: '進貨管理' },
  { path: '/sales',     icon: '🛒', label: '銷貨管理' },
  { path: '/inventory', icon: '🏪', label: '存貨管理' },
  { path: '/suppliers', icon: '🏭', label: '供應商管理' },
  { path: '/customers', icon: '👥', label: '客戶管理' },
  { path: '/reports',   icon: '📈', label: '報表分析' },
  { path: '/kanban', icon: '📋', label: '工作看板' },
]

const now = ref(new Date())
let timer = null

const currentTime = computed(() => {
  return now.value.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

const currentDate = computed(() => {
  return now.value.toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })
})

const userInitial = computed(() => authStore.userName?.[0] || 'S')

async function logout() {
  authStore.logout()
  router.push('/login')
}

async function loadNotifications() {
  try {
    const res = await fetchLowStock()
    if (res.success && res.data.length > 0) {
      notifications.value = res.data.map(item => ({
        id: item.id,
        icon: '⚠️',
        type: 'warning',
        title: '庫存不足警示',
        message: `${item.name} 現有庫存 ${item.stock} ${item.unit}，低於安全庫存 ${item.safeStock} ${item.unit}`,
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
      }))
    }
  } catch (e) {
    console.error('載入通知失敗', e)
  }
}

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
  if (authStore.isLoggedIn) {
    loadNotifications()
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>


/* 時間 */
.header-time { display: flex; flex-direction: column; align-items: flex-end; }
.time-main { font-size: 16px; font-weight: 700; color: var(--color-text-primary); font-family: 'JetBrains Mono', monospace; }
.time-date { font-size: 11px; color: var(--color-text-secondary); }

/* 面板 */
.panel {
  position: fixed;
  top: calc(var(--header-height) + 8px);
  right: 16px;
  width: 320px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  z-index: 300;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}
.panel-title { font-size: 14px; font-weight: 600; }
.panel-clear { border: none; background: none; font-size: 12px; color: var(--color-accent); cursor: pointer; }
.panel-body { max-height: 360px; overflow-y: auto; }
.panel-empty { padding: 24px; text-align: center; color: var(--color-text-muted); font-size: 13px; }

/* 通知 */
.notify-item {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #F3F4F6;
}
.notify-item:last-child { border-bottom: none; }
.notify-item.warning { background: #FFFBEB; }
.notify-icon { font-size: 18px; flex-shrink: 0; }
.notify-content { flex: 1; min-width: 0; }
.notify-title { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.notify-msg { font-size: 12px; color: var(--color-text-secondary); line-height: 1.5; }
.notify-time { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }

/* 設定 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F3F4F6;
}
.setting-label { font-size: 13px; color: var(--color-text-secondary); }
.setting-value { font-size: 13px; font-weight: 500; }
.setting-divider { height: 1px; background: var(--color-border); margin: 8px 0; }
.setting-logout {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: var(--color-danger);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}
.setting-logout:hover { background: var(--color-danger-light); }



.erp-layout { display: flex; height: 100vh; overflow: hidden; position: relative; }

.sidebar {
  width: var(--sidebar-width);
  background: var(--color-sidebar);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease, transform 0.3s ease;
  z-index: 200;
}

.sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo { display: flex; align-items: center; gap: 10px; }
.logo-icon { font-size: 24px; color: var(--color-accent); }
.logo-text { display: flex; flex-direction: column; }
.logo-title { font-size: 15px; font-weight: 700; color: #fff; }
.logo-sub { font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 1px; }

.sidebar-close {
  display: none;
  border: none;
  background: rgba(255,255,255,0.1);
  color: white;
  width: 28px; height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  align-items: center;
  justify-content: center;
}

.sidebar-nav { flex: 1; padding: 16px 10px; overflow-y: auto; }
.nav-section-label {
  font-size: 10px; font-weight: 600;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase; letter-spacing: 1.5px;
  padding: 0 8px 10px;
}

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--border-radius);
  color: rgba(255,255,255,0.55);
  text-decoration: none; font-size: 13.5px;
  margin-bottom: 2px; transition: all var(--transition);
}
.nav-item:hover { background: var(--color-sidebar-hover); color: rgba(255,255,255,0.85); }
.nav-item.active { background: var(--color-accent); color: #fff; font-weight: 500; }
.nav-icon { font-size: 16px; }
.nav-label { flex: 1; }

.sidebar-footer { padding: 14px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.user-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--color-accent); color: white;
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.user-detail { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.user-name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 11px; color: rgba(255,255,255,0.35); }

.logout-btn {
  border: none;
  background: rgba(255,255,255,0.1);
  color: white;
  width: 28px; height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.logout-btn:hover { background: rgba(255,255,255,0.2); }

.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

.top-header {
  height: var(--header-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 0 24px; flex-shrink: 0; gap: 12px;
}

.header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.page-title { font-size: 16px; font-weight: 600; white-space: nowrap; }
.breadcrumb { font-size: 12px; color: var(--color-text-muted); display: flex; gap: 6px; }
.breadcrumb .sep { opacity: 0.4; }
.breadcrumb .current { color: var(--color-accent); }

.menu-btn {
  display: none;
  border: none; background: var(--color-bg);
  border-radius: var(--border-radius);
  width: 36px; height: 36px;
  font-size: 18px; cursor: pointer;
  align-items: center; justify-content: center;
  flex-shrink: 0;
}

.header-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.header-date { font-size: 12px; color: var(--color-text-secondary); white-space: nowrap; }
.header-actions { display: flex; gap: 8px; }

.btn-icon {
  width: 34px; height: 34px; border: none;
  background: var(--color-bg); border-radius: var(--border-radius);
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 16px; position: relative;
}
.btn-icon:hover { background: var(--color-border); }
.dot {
  position: absolute; top: 6px; right: 6px;
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--color-danger); border: 1.5px solid white;
}

.content-area { flex: 1; overflow-y: auto; padding: 24px; }

.sidebar-mask {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 199;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }



/* AI 助手 */
.ai-panel { width: 380px; }
.ai-input-row { display: flex; gap: 8px; padding: 12px 16px; }
.ai-input {
  flex: 1; padding: 8px 10px; font-size: 13px;
  border: 1px solid var(--color-border); border-radius: var(--border-radius);
  font-family: inherit;
}
.ai-send {
  border: none; background: var(--color-accent); color: white;
  border-radius: var(--border-radius); padding: 0 14px;
  font-size: 13px; cursor: pointer; font-family: inherit; white-space: nowrap;
}
.ai-send:disabled { opacity: 0.6; cursor: not-allowed; }
.ai-hint { padding: 0 16px 12px; font-size: 12px; color: var(--color-text-muted); }
.ai-error { padding: 0 16px 12px; font-size: 12px; color: var(--color-danger); }
.ai-answer {
  padding: 12px 16px; font-size: 13px; line-height: 1.7;
  white-space: pre-wrap; border-top: 1px solid #F3F4F6;
}
.ai-sources { padding: 8px 16px 14px; border-top: 1px solid #F3F4F6; }
.ai-sources-title { font-size: 11px; color: var(--color-text-muted); margin-bottom: 6px; }
.ai-source { display: block; font-size: 12px; color: var(--color-accent); text-decoration: none; margin-bottom: 4px; line-height: 1.5; }
.ai-source:hover { text-decoration: underline; }

.ai-mode-row {
  display: flex; gap: 6px;
  padding: 10px 16px 0;
}
.ai-mode-btn {
  flex: 1; padding: 6px 0;
  font-size: 12px; cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--border-radius);
  font-family: inherit;
}
.ai-mode-btn.active {
  background: var(--color-accent); color: white;
  border-color: var(--color-accent);
}




/* === 桌面版收合：只剩 icon === */
@media (min-width: 769px) {
  .sidebar.collapsed { width: var(--sidebar-collapsed-width, 68px); }

  /* 收合時隱藏所有文字，只留圖示 */
  .sidebar.collapsed .logo-text,
  .sidebar.collapsed .logo-sub,
  .sidebar.collapsed .nav-label,
  .sidebar.collapsed .nav-section-label,
  .sidebar.collapsed .user-detail { display: none; }

  /* 剩下的圖示置中 */
  .sidebar.collapsed .logo,
  .sidebar.collapsed .nav-item,
  .sidebar.collapsed .user-info { justify-content: center; }
  .sidebar.collapsed .nav-item { padding: 10px; }
}

.collapse-btn {
  border: none; background: var(--color-bg);
  border-radius: var(--border-radius);
  width: 36px; height: 36px;
  font-size: 14px; cursor: pointer; flex-shrink: 0;
  color: var(--color-text-secondary);
  display: flex; align-items: center; justify-content: center;
}
.collapse-btn:hover { background: var(--color-border); }

@media (max-width: 480px) {
  .collapse-btn { display: none; }
  .content-area { padding: 12px; }
  .page-title { font-size: 14px; }
}
</style>
<template>
  <div class="home-page">
    <!-- 歡迎區塊 -->
    <div class="hero">
      <div class="hero-content">
        <div class="hero-logo">⬡</div>
        <h1 class="hero-title">ERP System</h1>
        <p class="hero-sub">企業資源規劃系統 — 整合採購、銷售、庫存、客戶於一體</p>
        <div class="hero-info">
          <span>👤 {{ authStore.userName }}</span>
          <span>🔑 {{ authStore.userRole }}</span>
          <span>🕐 {{ currentTime }}</span>
        </div>
        <button class="hero-btn" @click="router.push('/dashboard')">
          進入系統 →
        </button>
      </div>
    </div>

    <!-- 快速統計 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.label" @click="router.push(stat.path)">
        <div class="stat-icon" :style="{ background: stat.bg }">{{ stat.icon }}</div>
        <div class="stat-body">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        <div class="stat-arrow">→</div>
      </div>
    </div>

    <!-- 模組導覽 -->
    <div class="modules-section">
      <h2 class="section-title">系統模組</h2>
      <div class="modules-grid">
        <div
          v-for="mod in modules"
          :key="mod.path"
          class="module-card"
          @click="router.push(mod.path)"
        >
          <div class="module-icon">{{ mod.icon }}</div>
          <div class="module-name">{{ mod.name }}</div>
          <div class="module-desc">{{ mod.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 系統資訊 -->
    <div class="system-info">
      <div class="info-card" v-for="info in systemInfo" :key="info.label">
        <div class="info-label">{{ info.label }}</div>
        <div class="info-value">{{ info.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchSummary } from '@/api/reports'

const router = useRouter()
const authStore = useAuthStore()
const summary = ref({})

const currentTime = computed(() => {
  return new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })
})

const stats = computed(() => [
  { icon: '💰', label: '總銷售額', value: 'NT$ ' + Number(summary.value.sales?.total || 0).toLocaleString(), bg: '#ECFDF5', path: '/sales' },
  { icon: '📦', label: '總進貨額', value: 'NT$ ' + Number(summary.value.purchase?.total || 0).toLocaleString(), bg: '#EEF2FF', path: '/purchase' },
  { icon: '🏪', label: '庫存品項', value: (summary.value.inventory?.count || 0) + ' 項', bg: '#EFF6FF', path: '/inventory' },
  { icon: '⚠️', label: '庫存不足', value: (summary.value.inventory?.lowStock || 0) + ' 項', bg: '#FEF2F2', path: '/inventory' },
  { icon: '👥', label: '客戶數', value: (summary.value.customers?.count || 0) + ' 家', bg: '#ECFDF5', path: '/customers' },
  { icon: '🏭', label: '供應商數', value: (summary.value.suppliers?.count || 0) + ' 家', bg: '#FFFBEB', path: '/suppliers' },
])

const modules = [
  { icon: '📊', name: '總覽儀表板', desc: '查看系統整體數據與即時狀態', path: '/dashboard' },
  { icon: '📦', name: '進貨管理', desc: '管理採購訂單與供應商進貨', path: '/purchase' },
  { icon: '🛒', name: '銷貨管理', desc: '管理銷售訂單與客戶出貨', path: '/sales' },
  { icon: '🏪', name: '存貨管理', desc: '管理庫存品項與庫存調整', path: '/inventory' },
  { icon: '🏭', name: '供應商管理', desc: '管理供應商資料與聯絡資訊', path: '/suppliers' },
  { icon: '👥', name: '客戶管理', desc: '管理客戶資料與聯絡資訊', path: '/customers' },
  { icon: '📈', name: '報表分析', desc: '查看銷售趨勢與業績報表', path: '/reports' },
]

const systemInfo = [
  { label: '系統版本', value: 'v1.0.0' },
  { label: '前端框架', value: 'Vue 3 + Vite' },
  { label: '後端框架', value: 'Node.js + Express' },
  { label: '資料庫', value: 'MySQL 9.7' },
  { label: '建立日期', value: '2026-06-12' },
]

onMounted(async () => {
  const res = await fetchSummary()
  if (res.success) summary.value = res.data
})
</script>

<style scoped>
.home-page { display: flex; flex-direction: column; gap: 24px; }

/* Hero */
.hero {
  background: linear-gradient(135deg, #1A1D27 0%, #2D3142 100%);
  border-radius: var(--border-radius-lg);
  padding: 48px 40px;
  text-align: center;
}
.hero-logo { font-size: 48px; color: var(--color-accent); margin-bottom: 12px; }
.hero-title { font-size: 32px; font-weight: 800; color: white; margin-bottom: 8px; }
.hero-sub { font-size: 15px; color: rgba(255,255,255,0.6); margin-bottom: 20px; }
.hero-info {
  display: flex; align-items: center; justify-content: center;
  gap: 20px; margin-bottom: 24px;
  font-size: 13px; color: rgba(255,255,255,0.5);
}
.hero-btn {
  background: var(--color-accent);
  color: white; border: none;
  border-radius: var(--border-radius);
  padding: 12px 28px;
  font-size: 15px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  transition: background var(--transition);
}
.hero-btn:hover { background: var(--color-accent-dark); }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; transition: all var(--transition);
  box-shadow: var(--shadow-sm);
}
.stat-card:hover { border-color: var(--color-accent); transform: translateY(-2px); }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.stat-body { flex: 1; min-width: 0; }
.stat-value { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-label { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }
.stat-arrow { font-size: 14px; color: var(--color-text-muted); flex-shrink: 0; }

/* Modules */
.section-title { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
.modules-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.module-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  cursor: pointer; transition: all var(--transition);
  box-shadow: var(--shadow-sm);
}
.module-card:hover { border-color: var(--color-accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.module-icon { font-size: 28px; margin-bottom: 10px; }
.module-name { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
.module-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.5; }

/* System Info */
.system-info {
  display: flex; gap: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.info-card {
  flex: 1; padding: 16px 20px;
  border-right: 1px solid var(--color-border);
  text-align: center;
}
.info-card:last-child { border-right: none; }
.info-label { font-size: 11px; color: var(--color-text-muted); margin-bottom: 4px; }
.info-value { font-size: 13px; font-weight: 600; }

@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .modules-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .hero { padding: 32px 20px; }
  .hero-title { font-size: 24px; }
  .hero-info { flex-direction: column; gap: 8px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .modules-grid { grid-template-columns: repeat(2, 1fr); }
  .system-info { flex-direction: column; }
  .info-card { border-right: none; border-bottom: 1px solid var(--color-border); }
}
</style>
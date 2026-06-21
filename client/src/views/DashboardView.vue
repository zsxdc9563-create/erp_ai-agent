<template>
  <div class="dashboard">
    <!-- 歡迎列 -->
    <div class="welcome-bar">
      <div>
        <h2 class="welcome-title">早安，Sabrina 👋</h2>
        <p class="welcome-sub">{{ currentDate }}，今天也加油！</p>
      </div>
      <div class="welcome-actions">
        <router-link to="/purchase" class="quick-btn">＋ 新增進貨單</router-link>
        <router-link to="/sales" class="quick-btn primary">＋ 新增銷貨單</router-link>
      </div>
    </div>

    <!-- KPI 卡片 -->
    <div class="kpi-grid">
      <div class="kpi-card" v-for="kpi in kpiData" :key="kpi.label">
        <div class="kpi-icon" :style="{ background: kpi.bg }">{{ kpi.icon }}</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
        <div class="kpi-trend" :class="kpi.trendUp ? 'up' : 'down'">
          {{ kpi.trendUp ? '▲' : '▼' }} {{ kpi.trend }}
        </div>
      </div>
    </div>

    <!-- 中間區塊 -->
    <div class="mid-grid">
      <!-- 最新進貨單 -->
      <div class="section-card">
        <div class="card-header-simple">
          <h3 class="card-title">最新進貨單</h3>
          <router-link to="/purchase" class="view-all">查看全部 →</router-link>
        </div>
        <div class="list-items">
          <div v-for="o in recentPurchase" :key="o.id" class="list-item">
            <div class="list-left">
              <div class="list-avatar purple">{{ o.supplier[0] }}</div>
              <div>
                <div class="list-title">{{ o.supplier }}</div>
                <div class="list-sub">{{ o.item }}</div>
              </div>
            </div>
            <div class="list-right">
              <div class="list-amount">NT$ {{ o.amount.toLocaleString() }}</div>
              <span class="badge" :class="purchaseBadge(o.status)">{{ o.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新銷貨單 -->
      <div class="section-card">
        <div class="card-header-simple">
          <h3 class="card-title">最新銷貨單</h3>
          <router-link to="/sales" class="view-all">查看全部 →</router-link>
        </div>
        <div class="list-items">
          <div v-for="o in recentSales" :key="o.id" class="list-item">
            <div class="list-left">
              <div class="list-avatar green">{{ o.customer[0] }}</div>
              <div>
                <div class="list-title">{{ o.customer }}</div>
                <div class="list-sub">{{ o.item }}</div>
              </div>
            </div>
            <div class="list-right">
              <div class="list-amount">NT$ {{ o.amount.toLocaleString() }}</div>
              <span class="badge" :class="salesBadge(o.status)">{{ o.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 庫存警示 -->
    <div class="section-card" v-if="lowStock.length > 0">
      <div class="card-header-simple">
        <h3 class="card-title">⚠️ 庫存不足警示</h3>
        <router-link to="/inventory" class="view-all">查看全部 →</router-link>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>品項編號</th>
              <th>品項名稱</th>
              <th>分類</th>
              <th>現有庫存</th>
              <th>安全庫存</th>
              <th>倉庫位置</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in lowStock" :key="item.id" class="table-row">
              <td class="mono text-accent">{{ item.id }}</td>
              <td class="font-medium text-danger">{{ item.name }}</td>
              <td><span class="cat-badge">{{ item.category }}</span></td>
              <td class="text-danger font-medium">{{ item.stock.toLocaleString() }} {{ item.unit }}</td>
              <td class="text-secondary">{{ item.safeStock.toLocaleString() }} {{ item.unit }}</td>
              <td class="text-secondary">{{ item.location }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 模組捷徑 -->
    <div class="shortcut-grid">
      <router-link to="/purchase" class="shortcut-card">
        <div class="shortcut-icon">📦</div>
        <div class="shortcut-label">進貨管理</div>
        <div class="shortcut-sub">{{ purchaseCount }} 筆進貨單</div>
      </router-link>
      <router-link to="/sales" class="shortcut-card">
        <div class="shortcut-icon">🛒</div>
        <div class="shortcut-label">銷貨管理</div>
        <div class="shortcut-sub">{{ salesCount }} 筆銷貨單</div>
      </router-link>
      <router-link to="/inventory" class="shortcut-card">
        <div class="shortcut-icon">🏪</div>
        <div class="shortcut-label">存貨管理</div>
        <div class="shortcut-sub">{{ inventoryCount }} 項品項</div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchOrders as fetchPurchase } from '@/api/purchase'
import { fetchOrders as fetchSales } from '@/api/sales'
import { fetchItems, fetchLowStock } from '@/api/inventory'

const purchaseOrders = ref([])
const salesOrders = ref([])
const inventoryItems = ref([])
const lowStock = ref([])

const currentDate = computed(() => new Date().toLocaleDateString('zh-TW', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
}))

const recentPurchase = computed(() => purchaseOrders.value.slice(0, 4))
const recentSales = computed(() => salesOrders.value.slice(0, 4))
const purchaseCount = computed(() => purchaseOrders.value.length)
const salesCount = computed(() => salesOrders.value.length)
const inventoryCount = computed(() => inventoryItems.value.length)

const kpiData = computed(() => [
  {
  icon: '💰', label: '本月銷售額',
  value: 'NT$ ' + salesOrders.value.reduce((s, o) => s + Number(o.amount), 0).toLocaleString(),
  bg: '#ECFDF5', trend: '15.2%', trendUp: true
},
{
  icon: '📦', label: '本月進貨額',
  value: 'NT$ ' + purchaseOrders.value.reduce((s, o) => s + Number(o.amount), 0).toLocaleString(),
  bg: '#EEF2FF', trend: '8.4%', trendUp: true
    },
  {
    icon: '⚠️', label: '庫存不足',
    value: lowStock.value.length + ' 項',
    bg: '#FFFBEB', trend: '需補貨', trendUp: false
  },
  {
    icon: '📋', label: '待處理單數',
    value: purchaseOrders.value.filter(o => o.status === '待入庫').length +
           salesOrders.value.filter(o => o.status === '待確認').length,
    bg: '#FEF2F2', trend: '待處理', trendUp: false
  },
])

function purchaseBadge(s) {
  return { '已完成': 'badge-success', '待入庫': 'badge-warning', '異常': 'badge-danger' }[s] || 'badge-gray'
}
function salesBadge(s) {
  return { '已出貨': 'badge-success', '處理中': 'badge-info', '待確認': 'badge-warning' }[s] || 'badge-gray'
}

async function loadAll() {
  try {
    const [p, s, i, l] = await Promise.all([
      fetchPurchase(), fetchSales(), fetchItems(), fetchLowStock()
    ])
    if (p.success) purchaseOrders.value = p.data
    if (s.success) salesOrders.value = s.data
    if (i.success) inventoryItems.value = i.data
    if (l.success) lowStock.value = l.data
  } catch (e) {
    console.error('Dashboard 載入失敗', e)
  }
}

onMounted(loadAll)
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }

/* Welcome */
.welcome-bar {
  background: linear-gradient(135deg, #4F7EFF 0%, #3A6AE8 100%);
  border-radius: var(--border-radius-lg);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.welcome-title { font-size: 20px; font-weight: 700; color: white; }
.welcome-sub { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; }
.welcome-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.quick-btn {
  padding: 8px 16px;
  border-radius: var(--border-radius);
  font-size: 13px; font-weight: 500;
  text-decoration: none;
  background: rgba(255,255,255,0.15);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  transition: background var(--transition);
}
.quick-btn:hover { background: rgba(255,255,255,0.25); }
.quick-btn.primary { background: white; color: var(--color-accent); border-color: white; }
.quick-btn.primary:hover { background: #f0f4ff; }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: var(--shadow-sm);
}
.kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.kpi-body { flex: 1; }
.kpi-value { font-size: 20px; font-weight: 700; }
.kpi-label { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
.kpi-trend { font-size: 12px; font-weight: 500; white-space: nowrap; }
.kpi-trend.up { color: var(--color-success); }
.kpi-trend.down { color: var(--color-warning); }

/* Mid grid */
.mid-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* Section card */
.section-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.card-header-simple {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}
.card-title { font-size: 15px; font-weight: 600; }
.view-all { font-size: 12px; color: var(--color-accent); text-decoration: none; }
.view-all:hover { text-decoration: underline; }

/* List */
.list-items { padding: 8px 0; }
.list-item {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid #F3F4F6;
  gap: 12px;
}
.list-item:last-child { border-bottom: none; }
.list-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.list-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.list-avatar.purple { background: #EEF2FF; color: var(--color-accent); }
.list-avatar.green { background: #ECFDF5; color: var(--color-success); }
.list-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.list-sub { font-size: 11px; color: var(--color-text-muted); }
.list-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.list-amount { font-size: 13px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }

/* Table */
.table-wrap { overflow-x: auto; }
table th { background: #F8F9FC; padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
table td { padding: 11px 16px; border-bottom: 1px solid #F3F4F6; font-size: 13.5px; }
.table-row:hover td { background: #FFF5F5; }
.table-row:last-child td { border-bottom: none; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
.font-medium { font-weight: 500; }
.text-accent { color: var(--color-accent); }
.text-danger { color: var(--color-danger); }
.text-secondary { color: var(--color-text-secondary); }
.cat-badge { font-size: 12px; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; color: var(--color-text-secondary); }

/* Shortcuts */
.shortcut-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.shortcut-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  text-align: center;
  text-decoration: none;
  transition: all var(--transition);
  box-shadow: var(--shadow-sm);
}
.shortcut-card:hover { border-color: var(--color-accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.shortcut-icon { font-size: 28px; margin-bottom: 8px; }
.shortcut-label { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.shortcut-sub { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }

/* RWD */
@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .mid-grid { grid-template-columns: 1fr; }
  .welcome-bar { flex-direction: column; align-items: flex-start; }
  .shortcut-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
}
@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .kpi-value { font-size: 15px; }
  .kpi-trend { display: none; }
  .shortcut-grid { grid-template-columns: repeat(3, 1fr); }
  .shortcut-icon { font-size: 22px; }
  .shortcut-label { font-size: 12px; }
}
</style>
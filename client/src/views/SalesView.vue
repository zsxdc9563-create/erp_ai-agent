<template>
  <div class="module-page">
    <!-- KPI -->
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

    <!-- Chart + Top Customers -->
    <div class="two-col">
      <!-- Sales trend chart (pure CSS) -->
      <div class="section-card chart-card">
        <div class="card-header-simple">
          <h2 class="card-title">本月銷售趨勢</h2>
          <div class="tab-group">
            <button
              v-for="t in ['週', '月', '季']"
              :key="t"
              :class="['tab-btn', { active: activeTab === t }]"
              @click="activeTab = t"
            >{{ t }}</button>
          </div>
        </div>
        <div class="bar-chart">
          <div
            v-for="(bar, i) in chartBars"
            :key="i"
            class="bar-item"
          >
            <div class="bar-wrap">
              <div class="bar-fill" :style="{ height: bar.pct + '%' }">
                <span class="bar-tooltip">NT${{ bar.val }}萬</span>
              </div>
            </div>
            <div class="bar-label">{{ bar.label }}</div>
          </div>
        </div>
      </div>

      <!-- Top customers -->
      <div class="section-card">
        <div class="card-header-simple">
          <h2 class="card-title">前五大客戶</h2>
        </div>
        <div class="customer-list">
          <div v-for="(c, i) in topCustomers" :key="c.name" class="customer-row">
            <div class="rank" :class="`rank-${i+1}`">{{ i + 1 }}</div>
            <div class="customer-info">
              <span class="customer-name">{{ c.name }}</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: c.pct + '%' }"></div>
              </div>
            </div>
            <div class="customer-amount">NT$ {{ c.amount.toLocaleString() }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sales Orders Table -->
    <div class="section-card">
      <div class="card-header">
        <h2 class="card-title">銷貨單列表</h2>
        <div class="toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input v-model="searchQuery" class="search-input" placeholder="搜尋客戶 / 品項..." />
          </div>
          <select v-model="statusFilter" class="filter-select">
            <option value="">全部狀態</option>
            <option value="已出貨">已出貨</option>
            <option value="處理中">處理中</option>
            <option value="待確認">待確認</option>
          </select>
          <button class="btn-outline" @click="exportData">📤 匯出 CSV</button>
          <button class="btn-primary" @click="showModal = true">＋ 新增銷貨單</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>銷貨單號</th>
              <th>客戶</th>
              <th>品項</th>
              <th>數量</th>
              <th>金額</th>
              <th>銷貨日期</th>
              <th>付款方式</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id" class="table-row">
              <td class="mono font-medium text-accent">{{ order.id }}</td>
              <td>
                <div class="supplier-cell">
                  <div class="customer-avatar">{{ order.customer[0] }}</div>
                  {{ order.customer }}
                </div>
              </td>
              <td>{{ order.item }}</td>
              <td>{{ order.qty.toLocaleString() }} {{ order.unit }}</td>
              <td class="mono">NT$ {{ order.amount.toLocaleString() }}</td>
              <td class="text-secondary">{{ order.date }}</td>
              <td><span class="payment-tag">{{ order.payment }}</span></td>
              <td>
                <span class="badge" :class="statusClass(order.status)">{{ order.status }}</span>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn-action" title="查看">👁</button>
                  <button class="btn-action" title="列印">🖨️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="page-info">共 {{ filteredOrders.length }} 筆</span>
        <div class="page-btns">
          <button class="page-btn">‹</button>
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">›</button>
        </div>
      </div>
    </div>

    <!-- Modal placeholder -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新增銷貨單</h3>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>客戶名稱</label>
              <input v-model="newOrder.customer" class="form-control" placeholder="輸入客戶名稱" />
            </div>
            <div class="form-group">
              <label>品項名稱</label>
              <input v-model="newOrder.item" class="form-control" placeholder="輸入品項" />
            </div>
            <div class="form-group">
              <label>數量</label>
              <input v-model.number="newOrder.qty" type="number" class="form-control" placeholder="0" />
            </div>
            <div class="form-group">
              <label>單價 (NT$)</label>
              <input v-model.number="newOrder.price" type="number" class="form-control" placeholder="0" />
            </div>
            <div class="form-group">
              <label>銷貨日期</label>
              <input v-model="newOrder.date" type="date" class="form-control" />
            </div>
            <div class="form-group">
              <label>付款方式</label>
              <select v-model="newOrder.payment" class="form-control">
                <option>現金</option><option>轉帳</option><option>月結30</option><option>月結60</option>
              </select>
            </div>
          </div>
          <div class="amount-preview" v-if="newOrder.qty && newOrder.price">
            預估金額：<strong>NT$ {{ (newOrder.qty * newOrder.price).toLocaleString() }}</strong>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="submitOrder">確認新增</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchOrders, createOrder, fetchStats } from '@/api/sales'
import { exportToCSV } from '@/utils/export'



const searchQuery = ref('')
const statusFilter = ref('')
const showModal = ref(false)
const activeTab = ref('週')
const loading = ref(false)

const newOrder = ref({ customer: '', item: '', qty: null, price: null, date: '', payment: '轉帳' })

const orders = ref([])
const stats = ref({ totalAmount: 0, count: 0, byStatus: {} })

const kpiData = computed(() => [
  { icon: '💳', label: '本月銷售額', value: 'NT$ ' + stats.value.totalAmount.toLocaleString(), bg: '#ECFDF5', trend: '15.2%', trendUp: true },
  { icon: '📄', label: '本月銷貨單', value: stats.value.count, bg: '#EEF2FF', trend: '6', trendUp: true },
  { icon: '👥', label: '活躍客戶', value: new Set(orders.value.map(o => o.customer)).size, bg: '#EFF6FF', trend: '3', trendUp: true },
  { icon: '⏳', label: '待出貨', value: orders.value.filter(o => o.status === '待確認').length, bg: '#FFFBEB', trend: '2', trendUp: false },
])

const chartBars = [
  { label: '週一', val: 42, pct: 55 },
  { label: '週二', val: 68, pct: 85 },
  { label: '週三', val: 35, pct: 44 },
  { label: '週四', val: 80, pct: 100 },
  { label: '週五', val: 60, pct: 75 },
  { label: '週六', val: 22, pct: 28 },
  { label: '週日', val: 10, pct: 13 },
]

const topCustomers = computed(() => {
  const map = {}
  orders.value.forEach(o => {
    map[o.customer] = (map[o.customer] || 0) + o.amount
  })
  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const max = sorted[0]?.[1] || 1
  return sorted.map(([name, amount]) => ({
    name, amount, pct: Math.round((amount / max) * 100)
  }))
})

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    const matchSearch = !searchQuery.value || o.customer.includes(searchQuery.value) || o.item.includes(searchQuery.value)
    const matchStatus = !statusFilter.value || o.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

async function loadData() {
  loading.value = true
  try {
    const [ordersRes, statsRes] = await Promise.all([fetchOrders(), fetchStats()])
    if (ordersRes.success) orders.value = ordersRes.data
    if (statsRes.success) stats.value = statsRes.data
  } catch (e) {
    console.error('載入失敗', e)
  } finally {
    loading.value = false
  }
}

async function submitOrder() {
  if (!newOrder.value.customer) return
  try {
    const res = await createOrder(newOrder.value)
    if (res.success) {
      orders.value.unshift(res.data)
      showModal.value = false
    }
  } catch (e) {
    alert('新增失敗，請稍後再試')
  }
}

function statusClass(s) {
  return { '已出貨': 'badge-success', '處理中': 'badge-info', '待確認': 'badge-warning' }[s] || 'badge-gray'
}

function exportData() {
  exportToCSV(filteredOrders.value, '銷貨單', [
    { label: '銷貨單號', key: 'id' },
    { label: '客戶',     key: 'customer' },
    { label: '品項',     key: 'item' },
    { label: '數量',     key: 'qty' },
    { label: '單位',     key: 'unit' },
    { label: '金額',     key: 'amount' },
    { label: '銷貨日期', key: 'date' },
    { label: '付款方式', key: 'payment' },
    { label: '狀態',     key: 'status' },
  ])
}


onMounted(loadData)
</script>

<style scoped>
.module-page { display: flex; flex-direction: column; gap: 20px; }

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
.kpi-trend.down { color: var(--color-danger); }

.two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; }

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

.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.tab-group { display: flex; gap: 4px; }
.tab-btn {
  border: 1px solid var(--color-border);
  background: white;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all var(--transition);
}
.tab-btn.active { background: var(--color-accent); color: white; border-color: var(--color-accent); }

/* Bar chart */
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 20px 20px 16px;
  height: 180px;
}

.bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }

.bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  position: relative;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(to top, var(--color-accent), #88AAFF);
  border-radius: 4px 4px 0 0;
  transition: height 0.4s ease;
  position: relative;
  cursor: pointer;
}

.bar-fill:hover .bar-tooltip { opacity: 1; }

.bar-tooltip {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-text-primary);
  color: white;
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}

.bar-label { font-size: 11px; color: var(--color-text-secondary); }

/* Customers */
.customer-list { padding: 12px 20px; }

.customer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #F3F4F6;
}
.customer-row:last-child { border-bottom: none; }

.rank {
  width: 22px; height: 22px;
  border-radius: 50%;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: #F3F4F6;
  color: var(--color-text-secondary);
}
.rank-1 { background: #FEF9C3; color: #92400E; }
.rank-2 { background: #F1F5F9; color: #475569; }
.rank-3 { background: #FEF2E8; color: #9A3412; }

.customer-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.customer-name { font-size: 13px; font-weight: 500; }

.progress-bar { height: 4px; background: #F3F4F6; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-accent); border-radius: 2px; }

.customer-amount { font-size: 12.5px; font-weight: 500; color: var(--color-text-secondary); white-space: nowrap; font-family: 'JetBrains Mono', monospace; }

/* Table */
.toolbar { display: flex; align-items: center; gap: 10px; }
.search-box { display: flex; align-items: center; gap: 6px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 6px 12px; }
.search-icon { font-size: 13px; opacity: 0.5; }
.search-input { border: none; background: transparent; outline: none; font-size: 13px; width: 180px; font-family: inherit; }
.filter-select { border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 7px 10px; font-size: 13px; background: var(--color-bg); outline: none; cursor: pointer; font-family: inherit; }
.btn-primary { background: var(--color-accent); color: white; border: none; border-radius: var(--border-radius); padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background var(--transition); font-family: inherit; }
.btn-primary:hover { background: var(--color-accent-dark); }


.btn-outline {
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-outline:hover { background: var(--color-accent-dark); }



.table-wrap { overflow-x: auto; }
table th { background: #F8F9FC; padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
table td { padding: 12px 16px; border-bottom: 1px solid #F3F4F6; font-size: 13.5px; }
.table-row:hover td { background: #F8F9FF; }
.table-row:last-child td { border-bottom: none; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
.font-medium { font-weight: 500; }
.text-accent { color: var(--color-accent); }
.text-secondary { color: var(--color-text-secondary); }

.supplier-cell { display: flex; align-items: center; gap: 8px; }
.customer-avatar { width: 26px; height: 26px; border-radius: 50%; background: #ECFDF5; color: var(--color-success); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }

.payment-tag { font-size: 12px; color: var(--color-text-secondary); background: #F3F4F6; padding: 2px 8px; border-radius: 4px; }

.action-btns { display: flex; gap: 6px; }
.btn-action { width: 28px; height: 28px; border: 1px solid var(--color-border); border-radius: 6px; background: white; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.btn-action:hover { background: var(--color-bg); }

.pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid var(--color-border); }
.page-info { font-size: 13px; color: var(--color-text-secondary); }
.page-btns { display: flex; gap: 4px; }
.page-btn { width: 30px; height: 30px; border: 1px solid var(--color-border); border-radius: 6px; background: white; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; }
.page-btn.active { background: var(--color-accent); color: white; border-color: var(--color-accent); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: var(--border-radius-lg); width: 560px; max-width: 95vw; box-shadow: var(--shadow-md); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--color-border); }
.modal-header h3 { font-size: 15px; font-weight: 600; }
.modal-close { border: none; background: none; font-size: 16px; cursor: pointer; color: var(--color-text-secondary); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.modal-body { padding: 20px; }
.modal-footer { padding: 14px 20px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 10px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12.5px; font-weight: 500; color: var(--color-text-secondary); }
.form-control { border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 8px 10px; font-size: 13.5px; font-family: inherit; outline: none; transition: border var(--transition); }
.form-control:focus { border-color: var(--color-accent); }
.amount-preview { margin-top: 12px; padding: 10px 14px; background: var(--color-accent-light); border-radius: var(--border-radius); font-size: 13px; color: var(--color-accent); }
.btn-secondary { border: 1px solid var(--color-border); background: white; border-radius: var(--border-radius); padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: inherit; }

/* ── RWD ── */
@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .two-col { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .kpi-value { font-size: 16px; }
  .two-col { grid-template-columns: 1fr; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .toolbar { flex-wrap: wrap; width: 100%; }
  .search-input { width: 120px; }
  .btn-primary { width: 100%; justify-content: center; }
  table th, table td { padding: 8px 10px; font-size: 12px; }
  .modal { width: 95vw; }
  .form-grid { grid-template-columns: 1fr; }
  .bar-chart { height: 140px; }
}

@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .kpi-card { padding: 12px; gap: 8px; }
  .kpi-icon { width: 36px; height: 36px; font-size: 16px; }
  .kpi-value { font-size: 15px; }
  .kpi-label { font-size: 11px; }
  .kpi-trend { display: none; }
  .tab-group { display: none; }
  .pagination { flex-direction: column; gap: 8px; align-items: center; }
}


</style>

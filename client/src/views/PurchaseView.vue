<template>
  <div class="module-page">
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card" v-for="kpi in kpiData" :key="kpi.label">
        <!-- KPI 圖示 -->
    <div class="kpi-icon" :style="{ background: kpi.bg }">
      <i :class="kpi.icon"></i>
    </div>
        <div class="kpi-body">
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
        <div class="kpi-trend" :class="kpi.trendUp ? 'up' : 'down'">
          <!-- 趨勢箭頭 -->
          <i :class="kpi.trendUp ? 'fi fi-rr-arrow-trend-up' : 'fi fi-rr-arrow-trend-down'"></i>
          {{ kpi.trend }}
        </div>
      </div>
    </div>

    <!-- Actions + Filter Bar -->
    <div class="section-card">
      <div class="card-header">
        <h2 class="card-title">進貨單列表</h2>
        <div class="toolbar">
          <div class="search-box">
            <!-- 搜尋圖示 -->
            <i class="fi fi-rr-search search-icon"></i>
            <input v-model="searchQuery" class="search-input" placeholder="搜尋供應商 / 品項..." />
          </div>
          <select v-model="statusFilter" class="filter-select">
            <option value="">全部狀態</option>
            <option value="待入庫">待入庫</option>
            <option value="已完成">已完成</option>
            <option value="異常">異常</option>
          </select>
          <!-- 匯出 CSV 按鈕 -->
          <button class="btn-outline" @click="exportData">
            <i class="fi fi-rr-file-export"></i> 匯出 CSV
          </button>
          <button class="btn-primary" @click="openNewOrder">＋ 新增進貨單</button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>進貨單號</th>
              <th>供應商</th>
              <th>品項</th>
              <th>數量</th>
              <th>金額</th>
              <th>進貨日期</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id" class="table-row">
              <td class="mono font-medium text-accent">{{ order.id }}</td>
              <td>
                <div class="supplier-cell">
                  <div class="supplier-avatar">{{ order.supplier[0] }}</div>
                  {{ order.supplier }}
                </div>
              </td>
              <td>{{ order.item }}</td>
              <td>{{ order.qty.toLocaleString() }} {{ order.unit }}</td>
              <td class="mono">NT$ {{ Number(order.amount).toLocaleString() }}</td>
              <td class="text-secondary">{{ order.date }}</td>
              <td>
                <span class="badge" :class="statusClass(order.status)">{{ order.status }}</span>
              </td>
              <td>
                <div class="action-btns">
                  <!-- 查看按鈕 -->
<button class="btn-action" @click="viewOrder(order)" title="查看">
  <i class="fi fi-rr-eye"></i>
</button>
<!-- 編輯按鈕 -->
<button class="btn-action" @click="editOrder(order)" title="編輯">
  <i class="fi fi-rr-edit"></i>
</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="8" class="empty-row">查無資料</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
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

    <!-- New Order Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新增進貨單</h3>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>供應商</label>
              <select v-model="newOrder.supplier" class="form-control">
                <option value="">請選擇供應商</option>
                <option v-for="s in suppliers" :key="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>品項名稱</label>
              <input v-model="newOrder.item" class="form-control" placeholder="輸入品項名稱" />
            </div>
            <div class="form-group">
              <label>數量</label>
              <input v-model.number="newOrder.qty" type="number" class="form-control" placeholder="0" />
            </div>
            <div class="form-group">
              <label>單位</label>
              <select v-model="newOrder.unit" class="form-control">
                <option>個</option><option>箱</option><option>公斤</option><option>公升</option>
              </select>
            </div>
            <div class="form-group">
              <label>單價 (NT$)</label>
              <input v-model.number="newOrder.price" type="number" class="form-control" placeholder="0" />
            </div>
            <div class="form-group">
              <label>進貨日期</label>
              <input v-model="newOrder.date" type="date" class="form-control" />
            </div>
          </div>
          <div class="form-group full-width">
            <label>備註</label>
            <textarea v-model="newOrder.note" class="form-control" rows="2" placeholder="備註說明..."></textarea>
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
import { fetchOrders, createOrder } from '@/api/purchase'
import { exportToCSV } from '@/utils/export'

const searchQuery = ref('')
const statusFilter = ref('')
const showModal = ref(false)
const loading = ref(false)
const error = ref('')

const suppliers = ['台灣電子材料', '聯合科技', '精誠資訊', '德記洋行', '大聯大控股']

const newOrder = ref({
  supplier: '', item: '', qty: null, unit: '個', price: null, date: '', note: ''
})

const orders = ref([])

const kpiData = computed(() => [
  // 本月進貨單數量
  { icon: 'fi fi-rr-list-check', label: '本月進貨單', value: orders.value.length, bg: '#EEF2FF', trend: '12%', trendUp: true },
  // 本月進貨總金額
  { icon: 'fi fi-rr-sack-dollar', label: '本月進貨金額', value: 'NT$ ' + orders.value.reduce((s, o) => s + Number(o.amount), 0).toLocaleString(), bg: '#ECFDF5', trend: '8.4%', trendUp: true },
  // 待入庫數量
  { icon: 'fi fi-rr-time-fast', label: '待入庫', value: orders.value.filter(o => o.status === '待入庫').length, bg: '#FFFBEB', trend: '2', trendUp: false },
  // 異常單數
  { icon: 'fi fi-rr-triangle-warning', label: '異常單數', value: orders.value.filter(o => o.status === '異常').length, bg: '#FEF2F2', trend: '1', trendUp: false },
])

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    const matchSearch = !searchQuery.value ||
      o.supplier.includes(searchQuery.value) ||
      o.item.includes(searchQuery.value) ||
      o.id.includes(searchQuery.value)
    const matchStatus = !statusFilter.value || o.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetchOrders()
    if (res.success) orders.value = res.data
  } catch (e) {
    error.value = '載入失敗，請確認後端伺服器是否運行'
  } finally {
    loading.value = false
  }
}

function openNewOrder() {
  newOrder.value = { supplier: '', item: '', qty: null, unit: '個', price: null, date: '', note: '' }
  showModal.value = true
}

async function submitOrder() {
  if (!newOrder.value.supplier || !newOrder.value.item) return
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

function exportData() {
  exportToCSV(filteredOrders.value, '進貨單', [
    { label: '進貨單號', key: 'id' },
    { label: '供應商',   key: 'supplier' },
    { label: '品項',     key: 'item' },
    { label: '數量',     key: 'qty' },
    { label: '單位',     key: 'unit' },
    { label: '金額',     key: 'amount' },
    { label: '進貨日期', key: 'date' },
    { label: '狀態',     key: 'status' },
  ])
}

function statusClass(status) {
  return { '已完成': 'badge-success', '待入庫': 'badge-warning', '異常': 'badge-danger' }[status] || 'badge-gray'
}

function viewOrder(order) { alert(`查看進貨單：${order.id}`) }
function editOrder(order) { alert(`編輯進貨單：${order.id}`) }

onMounted(loadOrders)
</script>

<style scoped>
.module-page { display: flex; flex-direction: column; gap: 20px; }

.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); }
.kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.kpi-body { flex: 1; }
.kpi-value { font-size: 20px; font-weight: 700; color: var(--color-text-primary); }
.kpi-label { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
.kpi-trend { font-size: 12px; font-weight: 500; white-space: nowrap; }
.kpi-trend.up { color: var(--color-success); }
.kpi-trend.down { color: var(--color-danger); }

.section-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border); }
.card-title { font-size: 15px; font-weight: 600; }
.toolbar { display: flex; align-items: center; gap: 10px; }
.search-box { display: flex; align-items: center; gap: 6px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 6px 12px; }
.search-icon { font-size: 13px; opacity: 0.5; }
.search-input { border: none; background: transparent; outline: none; font-size: 13px; width: 180px; font-family: inherit; }
.filter-select { border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 7px 10px; font-size: 13px; background: var(--color-bg); outline: none; cursor: pointer; font-family: inherit; }
.btn-primary { background: var(--color-accent); color: white; border: none; border-radius: var(--border-radius); padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background var(--transition); font-family: inherit; }
.btn-primary:hover { background: var(--color-accent-dark); }
.btn-outline { background: white; border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 8px 14px; font-size: 13px; cursor: pointer; font-family: inherit; transition: background var(--transition); }
.btn-outline:hover { background: var(--color-bg); }

.table-wrap { overflow-x: auto; }
table th { background: #F8F9FC; padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
table td { padding: 12px 16px; border-bottom: 1px solid #F3F4F6; font-size: 13.5px; color: var(--color-text-primary); }
.table-row:hover td { background: #F8F9FF; }
.table-row:last-child td { border-bottom: none; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
.font-medium { font-weight: 500; }
.text-accent { color: var(--color-accent); }
.text-secondary { color: var(--color-text-secondary); }
.supplier-cell { display: flex; align-items: center; gap: 8px; }
.supplier-avatar { width: 26px; height: 26px; border-radius: 50%; background: var(--color-accent-light); color: var(--color-accent); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.action-btns { display: flex; gap: 6px; }
.btn-action { width: 28px; height: 28px; border: 1px solid var(--color-border); border-radius: 6px; background: white; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.btn-action:hover { background: var(--color-bg); }
.empty-row { text-align: center; color: var(--color-text-muted); padding: 32px !important; }

.pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid var(--color-border); }
.page-info { font-size: 13px; color: var(--color-text-secondary); }
.page-btns { display: flex; gap: 4px; }
.page-btn { width: 30px; height: 30px; border: 1px solid var(--color-border); border-radius: 6px; background: white; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; }
.page-btn:hover { background: var(--color-bg); }
.page-btn.active { background: var(--color-accent); color: white; border-color: var(--color-accent); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: var(--border-radius-lg); width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-md); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--color-border); }
.modal-header h3 { font-size: 15px; font-weight: 600; }
.modal-close { border: none; background: none; font-size: 16px; cursor: pointer; color: var(--color-text-secondary); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.modal-body { padding: 20px; }
.modal-footer { padding: 14px 20px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 10px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full-width { margin-top: 4px; }
.form-group label { font-size: 12.5px; font-weight: 500; color: var(--color-text-secondary); }
.form-control { border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 8px 10px; font-size: 13.5px; font-family: inherit; outline: none; transition: border var(--transition); }
.form-control:focus { border-color: var(--color-accent); }
textarea.form-control { resize: vertical; }
.amount-preview { margin-top: 12px; padding: 10px 14px; background: var(--color-accent-light); border-radius: var(--border-radius); font-size: 13px; color: var(--color-accent); }
.btn-secondary { border: 1px solid var(--color-border); background: white; border-radius: var(--border-radius); padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: inherit; }

@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .kpi-value { font-size: 16px; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .toolbar { flex-wrap: wrap; width: 100%; }
  .search-input { width: 120px; }
  .btn-primary { width: 100%; justify-content: center; }
  table th, table td { padding: 8px 10px; font-size: 12px; }
  .modal { width: 95vw; }
  .form-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .kpi-card { padding: 12px; gap: 8px; }
  .kpi-icon { width: 36px; height: 36px; font-size: 16px; }
  .kpi-value { font-size: 15px; }
  .kpi-label { font-size: 11px; }
  .kpi-trend { display: none; }
  .pagination { flex-direction: column; gap: 8px; align-items: center; }
}
</style>
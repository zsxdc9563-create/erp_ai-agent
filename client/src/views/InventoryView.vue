<template>
  <div class="module-page">
    <!-- KPI -->
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
        <div class="kpi-badge" :class="kpi.urgent ? 'urgent' : ''">
          {{ kpi.sub }}
        </div>
      </div>
    </div>

    <!-- Alert banner for low stock -->
    <div class="alert-banner" v-if="lowStockItems.length > 0">
      <!-- 警示圖示 -->
      <i class="fi fi-rr-triangle-warning alert-icon"></i>
      <span>有 <strong>{{ lowStockItems.length }}</strong> 項品項庫存不足，請儘速補貨！</span>
      <button class="alert-link" @click="statusFilter = '庫存不足'">查看詳情 →</button>
    </div>

    <!-- Category cards -->
    <div class="category-grid">
      <div
        v-for="cat in categories"
        :key="cat.name"
        class="cat-card"
        :class="{ selected: selectedCategory === cat.name }"
        @click="selectedCategory = selectedCategory === cat.name ? '' : cat.name"
      >
        <!-- 分類圖示 -->
        <div class="cat-icon"><i :class="cat.icon"></i></div>
        <div class="cat-name">{{ cat.name }}</div>
        <div class="cat-count">{{ cat.count }} 項</div>
      </div>
    </div>

    <!-- Inventory table -->
    <div class="section-card">
      <div class="card-header">
        <h2 class="card-title">存貨清單</h2>
        <div class="toolbar">
          <div class="search-box">
            <i class="fi fi-rr-search search-icon"></i>
            <input v-model="searchQuery" class="search-input" placeholder="搜尋品項 / 編號..." />
          </div>
          <select v-model="statusFilter" class="filter-select">
            <option value="">全部狀態</option>
            <option value="正常">正常</option>
            <option value="庫存不足">庫存不足</option>
            <option value="超量">超量</option>
          </select>
          <!-- 匯出按鈕 -->
          <button class="btn-outline" @click="exportData">
            <i class="fi fi-rr-file-export"></i> 匯出
          </button>
          <button class="btn-primary" @click="showModal = true">＋ 新增品項</button>
        </div>
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
              <th>庫存狀態</th>
              <th>庫存比例</th>
              <th>倉庫位置</th>
              <th>最後異動</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id" class="table-row">
              <td class="mono text-accent">{{ item.id }}</td>
              <td class="font-medium">{{ item.name }}</td>
              <td>
                <span class="cat-badge">{{ item.category }}</span>
              </td>
              <td>
                <span :class="stockTextClass(item)">
                  {{ item.stock.toLocaleString() }} {{ item.unit }}
                </span>
              </td>
              <td class="text-secondary">{{ item.safeStock.toLocaleString() }} {{ item.unit }}</td>
              <td>
                <span class="badge" :class="stockBadgeClass(item)">{{ stockStatus(item) }}</span>
              </td>
              <td style="min-width: 120px;">
                <div class="stock-bar-wrap">
                  <div class="stock-bar">
                    <div
                      class="stock-fill"
                      :class="stockFillClass(item)"
                      :style="{ width: Math.min(stockPct(item), 100) + '%' }"
                    ></div>
                  </div>
                  <span class="stock-pct">{{ stockPct(item) }}%</span>
                </div>
              </td>
              <td class="text-secondary">{{ item.location }}</td>
              <td class="text-secondary">{{ item.lastUpdate }}</td>
              <td>
                <div class="action-btns">
                  <!-- 庫存調整按鈕 -->
                <button class="btn-action" @click="adjustStock_(item)" title="調整">
                  <i class="fi fi-rr-scale"></i>
                </button>
                <!-- 歷史記錄按鈕 -->
                <button class="btn-action" title="歷史">
                  <i class="fi fi-rr-list-check"></i>
                </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span class="page-info">共 {{ filteredItems.length }} 筆</span>
        <div class="page-btns">
          <button class="page-btn">‹</button>
          <button class="page-btn active">1</button>
          <button class="page-btn">›</button>
        </div>
      </div>
    </div>

    <!-- Adjust Stock Modal -->
    <div v-if="showAdjustModal" class="modal-overlay" @click.self="showAdjustModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>庫存調整 — {{ adjustItem?.name }}</h3>
          <button class="modal-close" @click="showAdjustModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="adjust-info">
            <div class="info-row">
              <span>品項編號</span><strong>{{ adjustItem?.id }}</strong>
            </div>
            <div class="info-row">
              <span>現有庫存</span><strong>{{ adjustItem?.stock?.toLocaleString() }} {{ adjustItem?.unit }}</strong>
            </div>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>調整類型</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="adjustType" value="入庫" /> 入庫（增加）
              </label>
              <label class="radio-label">
                <input type="radio" v-model="adjustType" value="出庫" /> 出庫（減少）
              </label>
              <label class="radio-label">
                <input type="radio" v-model="adjustType" value="盤點" /> 盤點修正
              </label>
            </div>
          </div>
          <div class="form-group" style="margin-top: 14px;">
            <label>調整數量</label>
            <input v-model.number="adjustQty" type="number" class="form-control" placeholder="0" />
          </div>
          <div class="form-group" style="margin-top: 14px;">
            <label>調整原因</label>
            <textarea v-model="adjustReason" class="form-control" rows="2" placeholder="說明調整原因..."></textarea>
          </div>
          <div class="amount-preview" v-if="adjustQty">
            調整後庫存：<strong>
              {{ adjustType === '入庫' ? (adjustItem?.stock || 0) + adjustQty :
                 adjustType === '出庫' ? (adjustItem?.stock || 0) - adjustQty :
                 adjustQty }} {{ adjustItem?.unit }}
            </strong>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAdjustModal = false">取消</button>
          <button class="btn-primary" @click="confirmAdjust">確認調整</button>
        </div>
      </div>
    </div>

    <!-- New Item Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新增品項</h3>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>品項名稱</label>
              <input v-model="newItem.name" class="form-control" placeholder="輸入品項名稱" />
            </div>
            <div class="form-group">
              <label>分類</label>
              <select v-model="newItem.category" class="form-control">
                <option v-for="c in categories" :key="c.name">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>初始庫存</label>
              <input v-model.number="newItem.stock" type="number" class="form-control" placeholder="0" />
            </div>
            <div class="form-group">
              <label>安全庫存</label>
              <input v-model.number="newItem.safeStock" type="number" class="form-control" placeholder="0" />
            </div>
            <div class="form-group">
              <label>單位</label>
              <select v-model="newItem.unit" class="form-control">
                <option>個</option><option>箱</option><option>公斤</option><option>公升</option><option>組</option>
              </select>
            </div>
            <div class="form-group">
              <label>倉庫位置</label>
              <input v-model="newItem.location" class="form-control" placeholder="如：A-01-03" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="submitItem">確認新增</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchItems, createItem, adjustStock, fetchLowStock } from '@/api/inventory'
import { exportToCSV } from '@/utils/export'


const searchQuery = ref('')
const statusFilter = ref('')
const selectedCategory = ref('')
const showModal = ref(false)
const showAdjustModal = ref(false)
const adjustItem = ref(null)
const adjustType = ref('入庫')
const adjustQty = ref(null)
const adjustReason = ref('')
const loading = ref(false)

const newItem = ref({ name: '', category: '電子元件', stock: null, safeStock: null, unit: '個', location: '' })

const categories = [
  // 各分類圖示
  { name: '電子元件', icon: 'fi fi-rr-microchip', count: 0 },
  { name: '機械零件', icon: 'fi fi-rr-settings', count: 0 },
  { name: '原物料',   icon: 'fi fi-rr-flask', count: 0 },
  { name: '半成品',   icon: 'fi fi-rr-tool-box', count: 0 },
  { name: '成品',     icon: 'fi fi-rr-box-alt', count: 0 },
]

const items = ref([])
const lowStockItems = ref([])

const categoriesWithCount = computed(() => {
  return categories.map(c => ({
    ...c,
    count: items.value.filter(i => i.category === c.name).length
  }))
})

const kpiData = computed(() => [
  // 品項總數
  { icon: 'fi fi-rr-warehouse-alt', label: '品項總數', value: items.value.length, bg: '#EEF2FF', sub: `${categoriesWithCount.value.length} 類`, urgent: false },
  // 庫存總值
  { icon: 'fi fi-rr-sack-dollar', label: '庫存總值', value: 'NT$ ' + (items.value.reduce((s, i) => s + i.stock * 100, 0)).toLocaleString(), bg: '#ECFDF5', sub: '已評估', urgent: false },
  // 庫存不足數量
  { icon: 'fi fi-rr-triangle-warning', label: '庫存不足', value: lowStockItems.value.length, bg: '#FFFBEB', sub: '需補貨', urgent: lowStockItems.value.length > 0 },
  // 本月異動筆數
  { icon: 'fi fi-rr-refresh', label: '本月異動', value: 127, bg: '#EFF6FF', sub: '筆記錄', urgent: false },
])

const filteredItems = computed(() => {
  return items.value.filter(i => {
    const matchSearch = !searchQuery.value || i.name.includes(searchQuery.value) || i.id.includes(searchQuery.value)
    const matchStatus = !statusFilter.value || stockStatus(i) === statusFilter.value
    const matchCat = !selectedCategory.value || i.category === selectedCategory.value
    return matchSearch && matchStatus && matchCat
  })
})

async function loadData() {
  loading.value = true
  try {
    const [itemsRes, lowRes] = await Promise.all([fetchItems(), fetchLowStock()])
    if (itemsRes.success) items.value = itemsRes.data
    if (lowRes.success) lowStockItems.value = lowRes.data
  } catch (e) {
    console.error('載入失敗', e)
  } finally {
    loading.value = false
  }
}

async function submitItem() {
  if (!newItem.value.name) return
  try {
    const res = await createItem(newItem.value)
    if (res.success) {
      items.value.push(res.data)
      showModal.value = false
    }
  } catch (e) {
    alert('新增失敗，請稍後再試')
  }
}

async function confirmAdjust() {
  if (!adjustQty.value || !adjustItem.value) return
  try {
    const res = await adjustStock(adjustItem.value.id, {
      type: adjustType.value,
      qty: adjustQty.value,
      reason: adjustReason.value
    })
    if (res.success) {
      const idx = items.value.findIndex(i => i.id === adjustItem.value.id)
      if (idx !== -1) items.value[idx] = res.data
      const lowRes = await fetchLowStock()
      if (lowRes.success) lowStockItems.value = lowRes.data
      showAdjustModal.value = false
    }
  } catch (e) {
    alert('調整失敗，請稍後再試')
  }
}

function adjustStock_(item) {
  adjustItem.value = item
  adjustType.value = '入庫'
  adjustQty.value = null
  adjustReason.value = ''
  showAdjustModal.value = true
}

function stockPct(item) {
  return Math.round((item.stock / item.maxStock) * 100)
}

function stockStatus(item) {
  if (item.stock < item.safeStock) return '庫存不足'
  if (item.stock > item.maxStock * 0.9) return '超量'
  return '正常'
}

function stockBadgeClass(item) {
  return { '正常': 'badge-success', '庫存不足': 'badge-danger', '超量': 'badge-warning' }[stockStatus(item)]
}

function stockFillClass(item) {
  return { '正常': 'fill-normal', '庫存不足': 'fill-danger', '超量': 'fill-warning' }[stockStatus(item)]
}

function stockTextClass(item) {
  return stockStatus(item) === '庫存不足' ? 'text-danger font-medium' : ''
}

function exportData() {
  exportToCSV(filteredItems.value, '存貨清單', [
    { label: '品項編號', key: 'id' },
    { label: '品項名稱', key: 'name' },
    { label: '分類',     key: 'category' },
    { label: '現有庫存', key: 'stock' },
    { label: '安全庫存', key: 'safeStock' },
    { label: '單位',     key: 'unit' },
    { label: '倉庫位置', key: 'location' },
    { label: '最後異動', key: 'lastUpdate' },
  ])
}

onMounted(loadData)
</script>

<style scoped>
.module-page { display: flex; flex-direction: column; gap: 20px; }

.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); }
.kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.kpi-body { flex: 1; }
.kpi-value { font-size: 20px; font-weight: 700; }
.kpi-label { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
.kpi-badge { font-size: 12px; font-weight: 500; color: var(--color-text-muted); white-space: nowrap; }
.kpi-badge.urgent { color: var(--color-danger); font-weight: 600; }

/* Alert */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-warning-light);
  border: 1px solid #FCD34D;
  border-radius: var(--border-radius);
  padding: 10px 16px;
  font-size: 13.5px;
  color: #92400E;
}
.alert-icon { font-size: 16px; }
.alert-link { margin-left: auto; background: none; border: none; color: var(--color-warning); font-weight: 600; cursor: pointer; font-size: 13px; font-family: inherit; }

/* Category */
.category-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.cat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: 14px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition);
  box-shadow: var(--shadow-sm);
}
.cat-card:hover { border-color: var(--color-accent); }
.cat-card.selected { border-color: var(--color-accent); background: var(--color-accent-light); }
.cat-icon { font-size: 22px; margin-bottom: 6px; }
.cat-name { font-size: 13px; font-weight: 500; }
.cat-count { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }

/* Table card */
.section-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border); }
.card-title { font-size: 15px; font-weight: 600; }

.toolbar { display: flex; align-items: center; gap: 10px; }
.search-box { display: flex; align-items: center; gap: 6px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 6px 12px; }
.search-icon { font-size: 13px; opacity: 0.5; }
.search-input { border: none; background: transparent; outline: none; font-size: 13px; width: 160px; font-family: inherit; }
.filter-select { border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 7px 10px; font-size: 13px; background: var(--color-bg); outline: none; cursor: pointer; font-family: inherit; }
.btn-primary { background: var(--color-accent); color: white; border: none; border-radius: var(--border-radius); padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-outline { background: white; border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 8px 14px; font-size: 13px; cursor: pointer; font-family: inherit; transition: background var(--transition); }
.btn-outline:hover { background: var(--color-bg); }

.table-wrap { overflow-x: auto; }
table th { background: #F8F9FC; padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
table td { padding: 11px 16px; border-bottom: 1px solid #F3F4F6; font-size: 13.5px; }
.table-row:hover td { background: #F8F9FF; }
.table-row:last-child td { border-bottom: none; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
.font-medium { font-weight: 500; }
.text-accent { color: var(--color-accent); }
.text-secondary { color: var(--color-text-secondary); }
.text-danger { color: var(--color-danger); }

.cat-badge { font-size: 12px; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; color: var(--color-text-secondary); }

.stock-bar-wrap { display: flex; align-items: center; gap: 8px; }
.stock-bar { flex: 1; height: 6px; background: #F3F4F6; border-radius: 3px; overflow: hidden; }
.stock-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
.fill-normal { background: var(--color-success); }
.fill-danger { background: var(--color-danger); }
.fill-warning { background: var(--color-warning); }
.stock-pct { font-size: 11px; color: var(--color-text-muted); min-width: 30px; }

.action-btns { display: flex; gap: 6px; }
.btn-action { width: 28px; height: 28px; border: 1px solid var(--color-border); border-radius: 6px; background: white; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.btn-action:hover { background: var(--color-bg); }

.pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid var(--color-border); }
.page-info { font-size: 13px; color: var(--color-text-secondary); }
.page-btns { display: flex; gap: 4px; }
.page-btn { width: 30px; height: 30px; border: 1px solid var(--color-border); border-radius: 6px; background: white; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; }
.page-btn.active { background: var(--color-accent); color: white; border-color: var(--color-accent); }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: var(--border-radius-lg); width: 520px; max-width: 95vw; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--color-border); }
.modal-header h3 { font-size: 15px; font-weight: 600; }
.modal-close { border: none; background: none; font-size: 16px; cursor: pointer; color: var(--color-text-secondary); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.modal-body { padding: 20px; }
.modal-footer { padding: 14px 20px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 10px; }

.adjust-info { background: var(--color-bg); border-radius: var(--border-radius); padding: 12px 14px; }
.info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
.info-row span { color: var(--color-text-secondary); }

.radio-group { display: flex; gap: 20px; margin-top: 4px; }
.radio-label { display: flex; align-items: center; gap: 6px; font-size: 13.5px; cursor: pointer; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12.5px; font-weight: 500; color: var(--color-text-secondary); }
.form-control { border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 8px 10px; font-size: 13.5px; font-family: inherit; outline: none; transition: border var(--transition); }
.form-control:focus { border-color: var(--color-accent); }
textarea.form-control { resize: vertical; }
.amount-preview { margin-top: 12px; padding: 10px 14px; background: var(--color-accent-light); border-radius: var(--border-radius); font-size: 13px; color: var(--color-accent); }
.btn-secondary { border: 1px solid var(--color-border); background: white; border-radius: var(--border-radius); padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: inherit; }

/* ── RWD ── */
@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .category-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .kpi-value { font-size: 16px; }
  .category-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .cat-card { padding: 10px; }
  .cat-icon { font-size: 18px; }
  .cat-name { font-size: 12px; }
  .cat-count { font-size: 10px; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .toolbar { flex-wrap: wrap; width: 100%; }
  .search-input { width: 120px; }
  .btn-primary { width: 100%; justify-content: center; }
  .btn-outline { width: 100%; justify-content: center; }
  table th, table td { padding: 8px 10px; font-size: 12px; }
  .modal { width: 95vw; }
  .form-grid { grid-template-columns: 1fr; }
  .alert-banner { flex-wrap: wrap; font-size: 12px; }
}

@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .kpi-card { padding: 12px; gap: 8px; }
  .kpi-icon { width: 36px; height: 36px; font-size: 16px; }
  .kpi-value { font-size: 15px; }
  .kpi-label { font-size: 11px; }
  .kpi-badge { display: none; }
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .stock-bar-wrap { flex-direction: column; align-items: flex-start; gap: 2px; }
  .pagination { flex-direction: column; gap: 8px; align-items: center; }
}


</style>

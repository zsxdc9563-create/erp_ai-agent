<template>
  <div class="module-page">
    <!-- 總覽 KPI -->
    <div class="kpi-grid">
      <div class="kpi-card" v-for="kpi in kpiData" :key="kpi.label">
        <div class="kpi-icon" :style="{ background: kpi.bg }">{{ kpi.icon }}</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
      </div>
    </div>

    <!-- 月份趨勢圖 -->
    <div class="two-col">
      <div class="section-card">
        <div class="card-header-simple">
          <h3 class="card-title">📈 月份銷售趨勢</h3>
        </div>
        <div class="chart-wrap">
          <Bar v-if="salesChartData" :data="salesChartData" :options="chartOptions" />
          <div v-else class="empty-chart">載入中...</div>
        </div>
      </div>

      <div class="section-card">
        <div class="card-header-simple">
          <h3 class="card-title">📦 月份進貨趨勢</h3>
        </div>
        <div class="chart-wrap">
          <Bar v-if="purchaseChartData" :data="purchaseChartData" :options="chartOptions" />
          <div v-else class="empty-chart">載入中...</div>
        </div>
      </div>
    </div>

    <!-- 狀態分佈圓餅圖 -->
    <div class="two-col">
      <div class="section-card">
        <div class="card-header-simple">
          <h3 class="card-title">🛒 銷貨狀態分佈</h3>
        </div>
        <div class="chart-wrap pie-wrap">
          <Doughnut v-if="salesStatusChartData" :data="salesStatusChartData" :options="pieOptions" />
          <div v-else class="empty-chart">載入中...</div>
        </div>
      </div>

      <div class="section-card">
        <div class="card-header-simple">
          <h3 class="card-title">📦 進貨狀態分佈</h3>
        </div>
        <div class="chart-wrap pie-wrap">
          <Doughnut v-if="purchaseStatusChartData" :data="purchaseStatusChartData" :options="pieOptions" />
          <div v-else class="empty-chart">載入中...</div>
        </div>
      </div>
    </div>

    <!-- 前五大 -->
    <div class="two-col">
      <div class="section-card">
        <div class="card-header-simple">
          <h3 class="card-title">👥 前五大客戶</h3>
        </div>
        <div class="chart-wrap">
          <Bar v-if="topCustomersChartData" :data="topCustomersChartData" :options="horizontalOptions" />
          <div v-else class="empty-chart">載入中...</div>
        </div>
      </div>

      <div class="section-card">
        <div class="card-header-simple">
          <h3 class="card-title">🏭 前五大供應商</h3>
        </div>
        <div class="chart-wrap">
          <Bar v-if="topSuppliersChartData" :data="topSuppliersChartData" :options="horizontalOptions" />
          <div v-else class="empty-chart">載入中...</div>
        </div>
      </div>
    </div>

    <!-- 庫存分類 -->
    <div class="section-card">
      <div class="card-header-simple">
        <h3 class="card-title">🏪 庫存分類統計</h3>
      </div>
      <div class="chart-wrap">
        <Bar v-if="inventoryCategoryChartData" :data="inventoryCategoryChartData" :options="chartOptions" />
        <div v-else class="empty-chart">載入中...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  fetchSummary, fetchMonthlySales, fetchMonthlyPurchase,
  fetchSalesStatus, fetchPurchaseStatus,
  fetchTopCustomers, fetchTopSuppliers, fetchInventoryByCategory
} from '@/api/reports'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const summary = ref({})
const monthlySales = ref([])
const monthlyPurchase = ref([])
const salesStatus = ref([])
const purchaseStatus = ref([])
const topCustomers = ref([])
const topSuppliers = ref([])
const inventoryCategory = ref([])

const kpiData = computed(() => [
  { icon: '💰', label: '總銷售額', value: 'NT$ ' + Number(summary.value.sales?.total || 0).toLocaleString(), bg: '#ECFDF5' },
  { icon: '📦', label: '總進貨額', value: 'NT$ ' + Number(summary.value.purchase?.total || 0).toLocaleString(), bg: '#EEF2FF' },
  { icon: '🏪', label: '庫存品項', value: summary.value.inventory?.count || 0, bg: '#EFF6FF' },
  { icon: '👥', label: '客戶數',   value: summary.value.customers?.count || 0, bg: '#ECFDF5' },
  { icon: '🏭', label: '供應商數', value: summary.value.suppliers?.count || 0, bg: '#FFFBEB' },
  { icon: '⚠️', label: '庫存不足', value: summary.value.inventory?.lowStock || 0, bg: '#FEF2F2' },
])

// Chart Options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
    x: { grid: { display: false } }
  }
}

const horizontalOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, grid: { color: '#F3F4F6' } },
    y: { grid: { display: false } }
  }
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' }
  }
}

// Chart Data
const salesChartData = computed(() => {
  if (!monthlySales.value.length) return null
  return {
    labels: monthlySales.value.map(i => i.month),
    datasets: [{
      label: '銷售額',
      data: monthlySales.value.map(i => Number(i.total)),
      backgroundColor: '#4F7EFF',
      borderRadius: 4
    }]
  }
})

const purchaseChartData = computed(() => {
  if (!monthlyPurchase.value.length) return null
  return {
    labels: monthlyPurchase.value.map(i => i.month),
    datasets: [{
      label: '進貨額',
      data: monthlyPurchase.value.map(i => Number(i.total)),
      backgroundColor: '#10B981',
      borderRadius: 4
    }]
  }
})

const salesStatusChartData = computed(() => {
  if (!salesStatus.value.length) return null
  const colors = { '已出貨': '#10B981', '處理中': '#3B82F6', '待確認': '#F59E0B' }
  return {
    labels: salesStatus.value.map(i => i.status),
    datasets: [{
      data: salesStatus.value.map(i => Number(i.count)),
      backgroundColor: salesStatus.value.map(i => colors[i.status] || '#9CA3AF')
    }]
  }
})

const purchaseStatusChartData = computed(() => {
  if (!purchaseStatus.value.length) return null
  const colors = { '已完成': '#10B981', '待入庫': '#F59E0B', '異常': '#EF4444' }
  return {
    labels: purchaseStatus.value.map(i => i.status),
    datasets: [{
      data: purchaseStatus.value.map(i => Number(i.count)),
      backgroundColor: purchaseStatus.value.map(i => colors[i.status] || '#9CA3AF')
    }]
  }
})

const topCustomersChartData = computed(() => {
  if (!topCustomers.value.length) return null
  return {
    labels: topCustomers.value.map(i => i.customer),
    datasets: [{
      label: '銷售額',
      data: topCustomers.value.map(i => Number(i.total)),
      backgroundColor: '#4F7EFF',
      borderRadius: 4
    }]
  }
})

const topSuppliersChartData = computed(() => {
  if (!topSuppliers.value.length) return null
  return {
    labels: topSuppliers.value.map(i => i.supplier),
    datasets: [{
      label: '進貨額',
      data: topSuppliers.value.map(i => Number(i.total)),
      backgroundColor: '#10B981',
      borderRadius: 4
    }]
  }
})

const inventoryCategoryChartData = computed(() => {
  if (!inventoryCategory.value.length) return null
  return {
    labels: inventoryCategory.value.map(i => i.category),
    datasets: [{
      label: '庫存數量',
      data: inventoryCategory.value.map(i => Number(i.totalStock)),
      backgroundColor: ['#4F7EFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderRadius: 4
    }]
  }
})

async function loadAll() {
  try {
    const [s, ms, mp, ss, ps, tc, ts, ic] = await Promise.all([
      fetchSummary(), fetchMonthlySales(), fetchMonthlyPurchase(),
      fetchSalesStatus(), fetchPurchaseStatus(),
      fetchTopCustomers(), fetchTopSuppliers(), fetchInventoryByCategory()
    ])
    if (s.success)  summary.value = s.data
    if (ms.success) monthlySales.value = ms.data
    if (mp.success) monthlyPurchase.value = mp.data
    if (ss.success) salesStatus.value = ss.data
    if (ps.success) purchaseStatus.value = ps.data
    if (tc.success) topCustomers.value = tc.data
    if (ts.success) topSuppliers.value = ts.data
    if (ic.success) inventoryCategory.value = ic.data
  } catch (e) {
    console.error('報表載入失敗', e)
  }
}



onMounted(loadAll) 
</script>

<style scoped>
.module-page { display: flex; flex-direction: column; gap: 20px; }

.kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.kpi-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); }
.kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.kpi-body { flex: 1; min-width: 0; }
.kpi-value { font-size: 16px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi-label { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.section-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.card-header-simple { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border); }
.card-title { font-size: 15px; font-weight: 600; }

.chart-wrap { padding: 16px 20px; height: 220px; }
.pie-wrap { height: 260px; }
.empty-chart { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-text-muted); font-size: 13px; }

@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .two-col { grid-template-columns: 1fr; }
}
</style>
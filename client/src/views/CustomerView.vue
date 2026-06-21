<template>
  <div class="module-page">
    <!-- KPI -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#ECFDF5">👥</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ customers.length }}</div>
          <div class="kpi-label">客戶總數</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#EEF2FF">💳</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ customers.length }}</div>
          <div class="kpi-label">合作中</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#EFF6FF">🛒</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ customers.length }}</div>
          <div class="kpi-label">本月有訂單</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#FFFBEB">⭐</div>
        <div class="kpi-body">
          <div class="kpi-value">5</div>
          <div class="kpi-label">VIP 客戶</div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="section-card">
      <div class="card-header">
        <h2 class="card-title">客戶列表</h2>
        <div class="toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input v-model="searchQuery" class="search-input" placeholder="搜尋客戶..." />
          </div>
          <button class="btn-outline" @click="exportData">📤 匯出 CSV</button>
          <button class="btn-primary" @click="openModal()">＋ 新增客戶</button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>編號</th>
              <th>客戶名稱</th>
              <th>聯絡人</th>
              <th>電話</th>
              <th>Email</th>
              <th>地址</th>
              <th>建立日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCustomers" :key="c.id" class="table-row">
              <td class="mono text-accent">{{ c.id }}</td>
              <td>
                <div class="name-cell">
                  <div class="avatar-circle">{{ c.name[0] }}</div>
                  <span class="font-medium">{{ c.name }}</span>
                </div>
              </td>
              <td>{{ c.contact }}</td>
              <td>{{ c.phone }}</td>
              <td class="text-accent">{{ c.email }}</td>
              <td class="text-secondary">{{ c.address }}</td>
              <td class="text-secondary">{{ c.created_at?.slice(0,10) }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-action" @click="openModal(c)" title="編輯">✏️</button>
                  <button class="btn-action btn-danger" @click="deleteItem(c)" title="刪除">🗑️</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="8" class="empty-row">查無資料</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span class="page-info">共 {{ filteredCustomers.length }} 筆</span>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editItem ? '編輯客戶' : '新增客戶' }}</h3>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>客戶名稱 *</label>
              <input v-model="form.name" class="form-control" placeholder="輸入客戶名稱" />
            </div>
            <div class="form-group">
              <label>聯絡人</label>
              <input v-model="form.contact" class="form-control" placeholder="輸入聯絡人" />
            </div>
            <div class="form-group">
              <label>電話</label>
              <input v-model="form.phone" class="form-control" placeholder="02-XXXX-XXXX" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="form.email" class="form-control" placeholder="example@email.com" />
            </div>
          </div>
          <div class="form-group" style="margin-top:14px">
            <label>地址</label>
            <input v-model="form.address" class="form-control" placeholder="輸入地址" />
          </div>
          <div class="form-group" style="margin-top:14px">
            <label>備註</label>
            <textarea v-model="form.note" class="form-control" rows="2" placeholder="備註..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="submitForm">{{ editItem ? '確認更新' : '確認新增' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers'
import { exportToCSV } from '@/utils/export'

const customers = ref([])
const searchQuery = ref('')
const showModal = ref(false)
const editItem = ref(null)

const form = ref({ name: '', contact: '', phone: '', email: '', address: '', note: '' })

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  return customers.value.filter(c =>
    c.name.includes(searchQuery.value) ||
    c.contact.includes(searchQuery.value) ||
    c.phone.includes(searchQuery.value)
  )
})

async function loadData() {
  const res = await fetchCustomers()
  if (res.success) customers.value = res.data
}

function openModal(item = null) {
  editItem.value = item
  form.value = item
    ? { name: item.name, contact: item.contact, phone: item.phone, email: item.email, address: item.address, note: item.note || '' }
    : { name: '', contact: '', phone: '', email: '', address: '', note: '' }
  showModal.value = true
}

async function submitForm() {
  if (!form.value.name) return
  try {
    if (editItem.value) {
      const res = await updateCustomer(editItem.value.id, form.value)
      if (res.success) {
        const idx = customers.value.findIndex(c => c.id === editItem.value.id)
        if (idx !== -1) customers.value[idx] = res.data
      }
    } else {
      const res = await createCustomer(form.value)
      if (res.success) customers.value.unshift(res.data)
    }
    showModal.value = false
  } catch (e) {
    alert('操作失敗，請稍後再試')
  }
}

async function deleteItem(item) {
  if (!confirm(`確定要刪除「${item.name}」嗎？`)) return
  const res = await deleteCustomer(item.id)
  if (res.success) customers.value = customers.value.filter(c => c.id !== item.id)
}

function exportData() {
  exportToCSV(filteredCustomers.value, '客戶', [
    { label: '編號',   key: 'id' },
    { label: '客戶名稱', key: 'name' },
    { label: '聯絡人', key: 'contact' },
    { label: '電話',   key: 'phone' },
    { label: 'Email',  key: 'email' },
    { label: '地址',   key: 'address' },
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

.section-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border); }
.card-title { font-size: 15px; font-weight: 600; }
.toolbar { display: flex; align-items: center; gap: 10px; }
.search-box { display: flex; align-items: center; gap: 6px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 6px 12px; }
.search-icon { font-size: 13px; opacity: 0.5; }
.search-input { border: none; background: transparent; outline: none; font-size: 13px; width: 180px; font-family: inherit; }
.btn-primary { background: var(--color-accent); color: white; border: none; border-radius: var(--border-radius); padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-outline { background: white; border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 8px 14px; font-size: 13px; cursor: pointer; font-family: inherit; }
.btn-outline:hover { background: var(--color-bg); }

.table-wrap { overflow-x: auto; }
table th { background: #F8F9FC; padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
table td { padding: 12px 16px; border-bottom: 1px solid #F3F4F6; font-size: 13.5px; }
.table-row:hover td { background: #F8F9FF; }
.table-row:last-child td { border-bottom: none; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
.font-medium { font-weight: 500; }
.text-accent { color: var(--color-accent); }
.text-secondary { color: var(--color-text-secondary); }

.name-cell { display: flex; align-items: center; gap: 8px; }
.avatar-circle { width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: var(--color-success); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.action-btns { display: flex; gap: 6px; }
.btn-action { width: 28px; height: 28px; border: 1px solid var(--color-border); border-radius: 6px; background: white; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.btn-action:hover { background: var(--color-bg); }
.btn-danger:hover { background: var(--color-danger-light); border-color: var(--color-danger); }

.empty-row { text-align: center; color: var(--color-text-muted); padding: 32px !important; }
.pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid var(--color-border); }
.page-info { font-size: 13px; color: var(--color-text-secondary); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: var(--border-radius-lg); width: 540px; max-width: 95vw; box-shadow: var(--shadow-md); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--color-border); }
.modal-header h3 { font-size: 15px; font-weight: 600; }
.modal-close { border: none; background: none; font-size: 16px; cursor: pointer; color: var(--color-text-secondary); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.modal-body { padding: 20px; }
.modal-footer { padding: 14px 20px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 10px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12.5px; font-weight: 500; color: var(--color-text-secondary); }
.form-control { border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 8px 10px; font-size: 13.5px; font-family: inherit; outline: none; transition: border var(--transition); }
.form-control:focus { border-color: var(--color-accent); }
textarea.form-control { resize: vertical; }
.btn-secondary { border: 1px solid var(--color-border); background: white; border-radius: var(--border-radius); padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: inherit; }

@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .card-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .toolbar { flex-wrap: wrap; width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
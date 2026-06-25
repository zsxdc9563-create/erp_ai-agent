<template>
  <div class="home-page">

    <!-- 快速統計 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.label" @click="router.push(stat.path)">
        <div class="stat-icon" :style="{ background: stat.bg }">
        <i :class="stat.icon"></i>
    </div>
        <div class="stat-body">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        <div class="stat-arrow">→</div>
      </div>
    </div>

    <!-- 工作看板 -->
    <div class="kanban-section">
      <div class="kanban-header">
        <h2 class="section-title">工作看板</h2>
        <button class="add-task-btn" v-if="canEdit" @click="showAddModal = true">+ 新增任務</button>
      </div>
      <div class="kanban-board">
        <div
          v-for="col in columns"
          :key="col.key"
          class="kanban-col"
          @dragover.prevent
          @drop="onDrop(col.key)"
        >
          <div class="col-header" :style="{ borderColor: col.color }">
            <span class="col-title">{{ col.label }}</span>
            <span class="col-count" :style="{ background: col.color }">{{ getColumnTasks(col.key).length }}</span>
          </div>
          <div class="col-body">
            <div
              v-for="task in getColumnTasks(col.key)"
              :key="task.id"
              class="task-card"
              :draggable="canEdit"
              @dragstart="canEdit && onDragStart(task.id)"
            >
              <div class="task-title">{{ task.title }}</div>
              <div class="task-desc" v-if="task.description">{{ task.description }}</div>
              <div class="task-footer">
                  <span class="task-assignee" v-if="task.assigned_name">👤 {{ task.assigned_name }}</span>
                  <span class="task-creator">by {{ task.creator_name }}</span>
                  <span class="task-date">{{ new Date(task.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</span>
                  <button class="task-delete" v-if="isAdmin" @click="handleDelete(task.id)">✕</button>
                </div>
            </div>
            <div v-if="getColumnTasks(col.key).length === 0" class="col-empty">拖曳卡片到這裡</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增任務 Modal -->
    <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
      <div class="modal">
        <h3>新增任務</h3>
        <input v-model="newTask.title" placeholder="任務標題 *" class="modal-input" />
        <textarea v-model="newTask.description" placeholder="描述（選填）" class="modal-textarea"></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showAddModal = false">取消</button>
          <button class="btn-confirm" @click="handleAddTask">新增</button>
        </div>
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
          <div class="module-icon"><i :class="mod.icon"></i></div>
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
import { fetchTasks, createTask, updateTaskStatus, deleteTask } from '@/api/tasks'

const router = useRouter()
const authStore = useAuthStore()
const summary = ref({})

const currentTime = computed(() => {
  return new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })
})

const stats = computed(() => [
  { icon: 'fi fi-rr-sack-dollar', label: '總銷售額', value: 'NT$ ' + Number(summary.value.sales?.total || 0).toLocaleString(), bg: '#ECFDF5', path: '/sales' },
  { icon: 'fi fi-rr-box-alt', label: '總進貨額', value: 'NT$ ' + Number(summary.value.purchase?.total || 0).toLocaleString(), bg: '#EEF2FF', path: '/purchase' },
  { icon: 'fi fi-rr-warehouse-alt', label: '庫存品項', value: (summary.value.inventory?.count || 0) + ' 項', bg: '#EFF6FF', path: '/inventory' },
  { icon: 'fi fi-rr-triangle-warning', label: '庫存不足', value: (summary.value.inventory?.lowStock || 0) + ' 項', bg: '#FEF2F2', path: '/inventory' },
  { icon: 'fi fi-rr-users', label: '客戶數', value: (summary.value.customers?.count || 0) + ' 家', bg: '#ECFDF5', path: '/customers' },
  { icon: 'fi fi-rr-industry-alt', label: '供應商數', value: (summary.value.suppliers?.count || 0) + ' 家', bg: '#FFFBEB', path: '/suppliers' },
])

const modules = [
  { icon: 'fi fi-rr-chart-histogram', name: '總覽儀表板', desc: '查看系統整體數據與即時狀態', path: '/dashboard' },
  { icon: 'fi fi-rr-box-alt', name: '進貨管理', desc: '管理採購訂單與供應商進貨', path: '/purchase' },
  { icon: 'fi fi-rr-shopping-cart', name: '銷貨管理', desc: '管理銷售訂單與客戶出貨', path: '/sales' },
  { icon: 'fi fi-rr-warehouse-alt', name: '存貨管理', desc: '管理庫存品項與庫存調整', path: '/inventory' },
  { icon: 'fi fi-rr-industry-alt', name: '供應商管理', desc: '管理供應商資料與聯絡資訊', path: '/suppliers' },
  { icon: 'fi fi-rr-users', name: '客戶管理', desc: '管理客戶資料與聯絡資訊', path: '/customers' },
  { icon: 'fi fi-rr-stats', name: '報表分析', desc: '查看銷售趨勢與業績報表', path: '/reports' },
]

const systemInfo = [
  { label: '系統版本', value: 'v1.0.0' },
  { label: '前端框架', value: 'Vue 3 + Vite' },
  { label: '後端框架', value: 'Node.js + Express' },
  { label: '資料庫', value: 'MySQL 9.7' },
  { label: '建立日期', value: '2026-06-12' },
]

// Kanban
const tasks = ref([])
const showAddModal = ref(false)
const newTask = ref({ title: '', description: '', assigned_to: '' })

const columns = [
  { key: 'todo', label: '待處理', color: '#6366F1' },
  { key: 'in_progress', label: '進行中', color: '#F59E0B' },
  { key: 'review', label: '審核中', color: '#3B82F6' },
  { key: 'done', label: '完成', color: '#10B981' },
]

const getColumnTasks = (status) => tasks.value.filter(t => t.status === status)

const loadTasks = async () => {
  const res = await fetchTasks()
  if (res.success) tasks.value = res.data
}

const handleAddTask = async () => {
  if (!newTask.value.title) return
  await createTask(newTask.value)
  newTask.value = { title: '', description: '', assigned_to: '' }
  showAddModal.value = false
  await loadTasks()
}

const handleDelete = async (id) => {
  await deleteTask(id)
  await loadTasks()
}

// 拖曳

const isAdmin = computed(() => authStore.userRole === '系統管理員')
const isManager = computed(() => authStore.userRole === '主管')
const canEdit = computed(() => isAdmin.value || isManager.value)
const dragTaskId = ref(null)
const onDragStart = (id) => { dragTaskId.value = id }
const onDrop = async (status) => {
  if (dragTaskId.value) {
    await updateTaskStatus(dragTaskId.value, status)
    dragTaskId.value = null
    await loadTasks()
  }
}

onMounted(async () => {
  const res = await fetchSummary()
  if (res.success) summary.value = res.data
  await loadTasks()
})
</script>

<style scoped>
.home-page { display: flex; flex-direction: column; gap: 24px; }
.task-date { font-size: 10px; color: var(--color-text-muted); }
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

/* Kanban */
.kanban-section { display: flex; flex-direction: column; gap: 14px; }
.kanban-header { display: flex; align-items: center; justify-content: space-between; }
.add-task-btn {
  background: var(--color-accent); color: white;
  border: none; border-radius: var(--border-radius);
  padding: 8px 16px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}
.add-task-btn:hover { background: var(--color-accent-dark); }
.kanban-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kanban-col {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden; box-shadow: var(--shadow-sm);
}
.col-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  border-top: 3px solid;
  border-bottom: 1px solid var(--color-border);
}
.col-title { font-size: 13px; font-weight: 700; }
.col-count {
  color: white; font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 99px;
}
.col-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 120px; }
.task-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 10px 12px; cursor: grab;
}
.task-card:active { cursor: grabbing; }
.task-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.task-desc { font-size: 11px; color: var(--color-text-secondary); margin-bottom: 6px; line-height: 1.4; }
.task-footer { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-text-muted); }
.task-assignee { flex: 1; }
.task-creator { margin-left: auto; }
.task-delete {
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; font-size: 12px; padding: 0 2px;
}
.task-delete:hover { color: #EF4444; }
.col-empty { font-size: 12px; color: var(--color-text-muted); text-align: center; padding: 20px 0; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--color-surface);
  border-radius: var(--border-radius-lg);
  padding: 24px; width: 400px;
  display: flex; flex-direction: column; gap: 12px;
}
.modal h3 { font-size: 16px; font-weight: 700; margin: 0; }
.modal-input, .modal-textarea {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 10px 12px; font-size: 13px;
  font-family: inherit; background: var(--color-bg);
  color: var(--color-text); width: 100%; box-sizing: border-box;
}
.modal-textarea { height: 80px; resize: vertical; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel {
  background: none; border: 1px solid var(--color-border);
  border-radius: var(--border-radius); padding: 8px 16px;
  font-size: 13px; cursor: pointer; font-family: inherit;
}
.btn-confirm {
  background: var(--color-accent); color: white;
  border: none; border-radius: var(--border-radius);
  padding: 8px 16px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}



@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .modules-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .modules-grid { grid-template-columns: repeat(2, 1fr); }
  .system-info { flex-direction: column; }
  .info-card { border-right: none; border-bottom: 1px solid var(--color-border); }
}
</style>
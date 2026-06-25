<template>
  <div class="kanban-page">
    <div class="kanban-header">
      <h2 class="page-title">工作看板</h2>
      <!-- 只有管理員和主管才能看到新增按鈕 -->
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
        <!-- 欄位標題 + 任務數量 -->
        <div class="col-header" :style="{ borderColor: col.color }">
          <span class="col-title">{{ col.label }}</span>
          <span class="col-count" :style="{ background: col.color }">{{ getColumnTasks(col.key).length }}</span>
        </div>

        <div class="col-body">
          <!-- 任務卡片：管理員/主管可拖曳，一般員工只能看自己的 -->
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
              <!-- 顯示被指派的人 -->
              <span class="task-assignee" v-if="task.assigned_name">👤 {{ task.assigned_name }}</span>
              <!-- 顯示建立者 -->
              <span class="task-creator">by {{ task.creator_name }}</span>
              <!-- 顯示建立時間 -->
              <span class="task-date">{{ formatDate(task.created_at) }}</span>
              <!-- 只有管理員才能刪除 -->
              <button class="task-delete" v-if="isAdmin" @click="handleDelete(task.id)">✕</button>
            </div>
          </div>
          <div v-if="getColumnTasks(col.key).length === 0" class="col-empty">拖曳卡片到這裡</div>
        </div>
      </div>
    </div>

    <!-- 新增任務 Modal -->
    <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
      <div class="modal">
        <h3>新增任務</h3>
        <!-- 任務標題（必填） -->
        <input v-model="newTask.title" placeholder="任務標題 *" class="modal-input" />
        <!-- 任務描述（選填） -->
        <textarea v-model="newTask.description" placeholder="描述（選填）" class="modal-textarea"></textarea>
        <!-- 指派給誰：只有管理員才能看到 -->
        <div v-if="isAdmin" class="modal-field">
          <label class="modal-label">指派給</label>
          <select v-model="newTask.assigned_to" class="modal-select">
            <option value="">不指派</option>
            <option v-for="u in users" :key="u.id" :value="u.id">
              {{ u.name }}（{{ u.role }}）
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showAddModal = false">取消</button>
          <button class="btn-confirm" @click="handleAddTask">新增</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchTasks, createTask, updateTaskStatus, deleteTask, fetchUsers } from '@/api/tasks'

const authStore = useAuthStore()

// 權限判斷
const isAdmin = computed(() => authStore.userRole === '系統管理員')
const isManager = computed(() => authStore.userRole === '主管')
const canEdit = computed(() => isAdmin.value || isManager.value)

// 任務列表和使用者列表
const tasks = ref([])
const users = ref([])

// 控制新增 Modal 顯示
const showAddModal = ref(false)

// 新任務的初始資料
const newTask = ref({ title: '', description: '', assigned_to: '' })

// 看板欄位定義
const columns = [
  { key: 'todo', label: '待處理', color: '#6366F1' },
  { key: 'in_progress', label: '進行中', color: '#F59E0B' },
  { key: 'review', label: '審核中', color: '#3B82F6' },
  { key: 'done', label: '完成', color: '#10B981' },
]

// 根據角色過濾任務：一般員工只看指派給自己的，管理員/主管看全部
const getColumnTasks = (status) => {
  if (!canEdit.value) {
    return tasks.value.filter(t => t.status === status && t.assigned_to === authStore.userId)
  }
  return tasks.value.filter(t => t.status === status)
}

// 格式化日期時間
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// 載入所有任務
const loadTasks = async () => {
  const res = await fetchTasks()
  if (res.success) tasks.value = res.data
}

// 載入所有使用者（指派用）
const loadUsers = async () => {
  const res = await fetchUsers()
  if (res.success) users.value = res.data
}

// 新增任務
const handleAddTask = async () => {
  if (!newTask.value.title) return
  await createTask(newTask.value)
  newTask.value = { title: '', description: '', assigned_to: '' }
  showAddModal.value = false
  await loadTasks()
}

// 刪除任務（只有管理員）
const handleDelete = async (id) => {
  await deleteTask(id)
  await loadTasks()
}

// 拖曳開始：記錄被拖曳的任務 ID
const dragTaskId = ref(null)
const onDragStart = (id) => { dragTaskId.value = id }

// 拖曳放下：更新任務狀態
const onDrop = async (status) => {
  if (dragTaskId.value) {
    await updateTaskStatus(dragTaskId.value, status)
    dragTaskId.value = null
    await loadTasks()
  }
}

// 頁面載入時取得任務和使用者列表
onMounted(async () => {
  await loadTasks()
  if (isAdmin.value) await loadUsers()
})
</script>

<style scoped>
.kanban-page { display: flex; flex-direction: column; gap: 20px; }
.kanban-header { display: flex; align-items: center; justify-content: space-between; }
.page-title { font-size: 18px; font-weight: 700; }
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
  padding: 12px 14px; border-top: 3px solid;
  border-bottom: 1px solid var(--color-border);
}
.col-title { font-size: 13px; font-weight: 700; }
.col-count {
  color: white; font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 99px;
}
.col-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 200px; }
.task-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 10px 12px; cursor: grab;
}
.task-card:active { cursor: grabbing; }
.task-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.task-desc { font-size: 11px; color: var(--color-text-secondary); margin-bottom: 6px; line-height: 1.4; }
.task-footer { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-text-muted); flex-wrap: wrap; }
.task-assignee { flex: 1; }
.task-date { font-size: 10px; }
.task-delete {
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; font-size: 12px; padding: 0 2px;
}
.task-delete:hover { color: #EF4444; }
.col-empty { font-size: 12px; color: var(--color-text-muted); text-align: center; padding: 20px 0; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: var(--color-surface); border-radius: var(--border-radius-lg);
  padding: 24px; width: 400px; display: flex; flex-direction: column; gap: 12px;
}
.modal h3 { font-size: 16px; font-weight: 700; margin: 0; }
.modal-input, .modal-textarea, .modal-select {
  border: 1px solid var(--color-border); border-radius: var(--border-radius);
  padding: 10px 12px; font-size: 13px; font-family: inherit;
  background: var(--color-bg); color: var(--color-text);
  width: 100%; box-sizing: border-box;
}
.modal-textarea { height: 80px; resize: vertical; }
.modal-field { display: flex; flex-direction: column; gap: 6px; }
.modal-label { font-size: 12px; color: var(--color-text-secondary); font-weight: 500; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel {
  background: none; border: 1px solid var(--color-border);
  border-radius: var(--border-radius); padding: 8px 16px;
  font-size: 13px; cursor: pointer; font-family: inherit;
}
.btn-confirm {
  background: var(--color-accent); color: white; border: none;
  border-radius: var(--border-radius); padding: 8px 16px;
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
}
</style>
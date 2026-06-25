import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/home',
    name: 'Home',
    component: () => import ('../views/HomeView.vue'),
    meta: { title: '首頁', public: false}
  },



  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登入', public: true }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { title: '總覽儀表板', icon: '📊' }
  },
  {
    path: '/purchase',
    name: 'Purchase',
    component: () => import('../views/PurchaseView.vue'),
    meta: { title: '進貨管理', icon: '📦' }
  },
  {
    path: '/sales',
    name: 'Sales',
    component: () => import('../views/SalesView.vue'),
    meta: { title: '銷貨管理', icon: '🛒' }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('../views/InventoryView.vue'),
    meta: { title: '存貨管理', icon: '🏪' }
  },
  {
    path: '/suppliers',
    name: 'Suppliers',
    component: () => import('../views/SupplierView.vue'),
    meta: { title: '供應商管理', icon: '🏭' }
  },
  {
    path: '/customers',
    name: 'Customers',
    component: () => import('../views/CustomerView.vue'),
    meta: { title: '客戶管理', icon: '👥' }
  },
  {
  path: '/reports',
  name: 'Reports',
  component: () => import('../views/ReportView.vue'),
  meta: { title: '報表分析', icon: '📈' }
},
  
{
    path: '/kanban',
    name: 'Kanban',
    component: () => import('../views/KanbanView.vue'),
    meta: { title: '工作看板', icon: '📋' }
  }




]




//  路由設定，使用懶加載方式引入組件，並在 meta 中定義頁面標題和圖示
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 前端守門員
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('erp_token')

  // 需要登入的頁面,但沒 token → 去登入頁
  if (!to.meta.public && !token) {
    return next('/login')
  }
  // 已登入卻想去登入頁 → 導去 dashboard
  if (to.path === '/login' && token) {
    return next('/dashboard')
  }
  // 其他情況正常放行
  return next()
})

export default router
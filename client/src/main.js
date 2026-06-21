import { createApp } from 'vue'//               引入 Vue 的 createApp 函數
import { createPinia } from 'pinia' //         引入 Pinia 的 createPinia 函數
import App from './App.vue'//              引入主組件 App.vue
import router from './router/index.js'//    
import './assets/main.css'// 引入全局樣式


const app = createApp(App)//              創建 Vue 應用實例
app.use(createPinia())//              使用 Pinia 狀態管理
app.use(router)//           使用 Vue Router 進行路由管理
app.mount('#app')//             將應用掛載到 DOM 中的 #app 元素上   

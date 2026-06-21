
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],   // 載入 Vue 插件
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))   //// ← 設定 @ 代表 src 資料夾
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000', // 代理到後端 API 伺服器
        changeOrigin: true
      }
    }
  }
}   )

# ERP 企業資源規劃系統

Vue 3 + Vite 前端 / Node.js + Express 後端的全端 ERP 系統

## 專案結構

```
erp-system/
├── package.json          # 根目錄，管理 server + 同時啟動腳本
├── server/               # Node.js Express 後端
│   ├── index.js          # 伺服器入口點
│   └── routes/
│       ├── purchase.js   # 進貨模組 API
│       ├── sales.js      # 銷貨模組 API
│       ├── inventory.js  # 存貨模組 API
│       └── reports.js    # 報表模組 API（銷售/採購統計、排行、分類庫存）
└── client/               # Vue 3 + Vite 前端
    ├── index.html
    ├── vite.config.js    # Proxy /api → localhost:3000；@ alias → ./src
    └── src/
        ├── main.js
        ├── App.vue       # 主框架 + Sidebar
        ├── router/       # Vue Router
        ├── api/          # 前端 API 封裝層
        │   └── reports.js     # 報表相關 API 函式
        ├── views/
        │   ├── PurchaseView.vue   # 進貨管理
        │   ├── SalesView.vue      # 銷貨管理
        │   ├── InventoryView.vue  # 存貨管理
        │   └── ReportView.vue     # 報表分析（統計圖表 / 排行）
        └── assets/
            └── main.css
```

## 快速啟動

### 1. 安裝所有依賴
```bash
# 根目錄
npm install

# 前端
cd client && npm install && cd ..
```

### 2. 開發模式（前後端同時啟動）
```bash
npm run dev
```
- 前端：http://localhost:5173
- 後端 API：http://localhost:3000/api

### 3. 生產模式
```bash
npm run build      # 打包前端
npm run server     # 啟動 server（同時 serve 前端靜態檔）
```

## API 端點

| 模組 | 方法 | 路徑 | 說明 |
|------|------|------|------|
| 進貨 | GET  | /api/purchase | 取得進貨單列表 |
| 進貨 | POST | /api/purchase | 新增進貨單 |
| 進貨 | PUT  | /api/purchase/:id | 更新進貨單 |
| 銷貨 | GET  | /api/sales | 取得銷貨單列表 |
| 銷貨 | POST | /api/sales | 新增銷貨單 |
| 銷貨 | GET  | /api/sales/stats | 銷售統計 |
| 存貨 | GET  | /api/inventory | 取得存貨列表 |
| 存貨 | POST | /api/inventory | 新增品項 |
| 存貨 | PATCH| /api/inventory/:id/adjust | 庫存調整 |
| 存貨 | GET  | /api/inventory/alerts/low-stock | 低庫存警示 |
| 報表 | GET  | /api/reports/sales-status | 銷售狀態統計 |
| 報表 | GET  | /api/reports/purchase-status | 採購狀態統計 |
| 報表 | GET  | /api/reports/top-customers | 銷售排行（前幾名客戶） |
| 報表 | GET  | /api/reports/top-suppliers | 採購排行（前幾名供應商） |
| 報表 | GET  | /api/reports/inventory-by-category | 各分類庫存統計 |

> 報表端點路徑為對應 `client/src/api/reports.js` 內的函式
> （`fetchSalesStatus` / `fetchPurchaseStatus` / `fetchTopCustomers` /
> `fetchTopSuppliers` / `fetchInventoryByCategory`）。
> 請與 `server/routes/reports.js` 實際註冊的路由核對，確保前後端一致。

## 報表模組說明

報表頁 `ReportView.vue` 透過 `src/api/reports.js` 封裝層呼叫後端，
資料流程為：

```
ReportView.vue  →  src/api/reports.js  →  /api/reports/*  →  server/routes/reports.js
   (畫面渲染)        (API 函式封裝)         (Vite proxy)         (查詢資料庫並回傳)
```

封裝層集中管理所有報表 API，畫面只負責呈現，方便後續維護與替換資料來源。

## 後續擴充計劃

- [ ] 連接 PostgreSQL / MySQL 資料庫
- [ ] JWT 身份驗證 + RBAC 權限控管
- [ ] Dashboard 總覽頁面
- [x] 報表分析頁面（ReportView）
- [ ] 報表匯出（CSV / PDF / Excel）
- [ ] 供應商 / 客戶管理模組
- [ ] 盤點單功能
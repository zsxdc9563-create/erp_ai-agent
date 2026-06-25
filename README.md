# ERP System with Local AI Agent

一套自建的全端 ERP 系統，整合採購、銷售、庫存、客戶等模組，並內建一個**全地端（不依賴雲端 API）的 AI 助手**。

AI 助手有兩種模式：
- **查時事**：透過自架的 SearXNG 搜尋 + 爬蟲抓取新聞正文，交給本地 LLM 摘要（RAG）。
- **查庫存**：AI 自動讀取資料庫 Schema，判斷要查哪張資料表，直接對 MySQL 查詢後用自然語言回答。

> 學習導向專案，採用標準三層架構（Routes → Controllers → Models），重點在理解每一層的職責。

---

## 目錄

- [技術架構](#技術架構)
- [資料流](#資料流)
- [技術棧](#技術棧)
- [專案結構](#專案結構)
- [功能模組](#功能模組)
- [環境需求](#環境需求)
- [安裝步驟](#安裝步驟)
- [啟動](#啟動需四個服務同時運行)
- [API 文件](#api-文件)
- [設計重點](#設計重點)
- [常見問題](#常見問題)

---

## 技術架構

```
                    Vue 3 前端 (:5174/5175)
                          │  HTTP
                          ▼
                Node.js / Express (:3000) ─────► MySQL 9.7（ERP 資料）
                     │            ▲
        proxy        │            │ 內部 API（/api/internal/*，不掛 auth）
       /api/ai/*     │            │ 供 AI 查 ERP 資料
                     ▼            │
                Python / FastAPI (:8000)
                     │
                     ├─► SearXNG (Docker, :8080) ─► 網頁爬蟲 (httpx + trafilatura)
                     │        （/news：查時事）
                     │
                     ├─► MySQL（直接連線，讀取 Schema + 資料）
                     │        （/erp：Text-to-SQL 查詢）
                     │
                     └─► Gemma 4（本地 GGUF, llama-cpp-python, CPU）
                              （判斷資料表 → 執行查詢 → 生成回答）
```

---

## 資料流

**查時事（/news）：**
```
Vue → Node (proxy /api/ai/news) → Python (/news)
    → SearXNG 搜尋 → 爬蟲抓正文 (trafilatura)
    → 組成 prompt → Gemma 生成摘要 → 逐層回傳
```

**查 ERP 資料（/erp）：**
```
Vue → Node (proxy /api/ai/erp) → Python (/erp)
    → 啟動時自動讀取 MySQL Schema（SHOW CREATE TABLE）
    → 關鍵字判斷要查哪張資料表
    → 自動組成 SQL（LIKE 模糊搜尋 / SUM 統計）
    → 直接查 MySQL → 組成 context
    → Gemma 根據資料生成回答 → 逐層回傳
```

---

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Vue 3、Vite、Vue Router、Pinia、Chart.js、Flaticon Uicons |
| 後端 | Node.js、Express、JWT 驗證 |
| 資料庫 | MySQL 9.7 |
| AI 服務 | Python、FastAPI、uvicorn |
| LLM | Google Gemma 4 (E4B, GGUF Q4_K_S)、llama-cpp-python（CPU 推論） |
| 搜尋 / 爬蟲 | SearXNG（Docker）、httpx、trafilatura |
| 環境變數 | python-dotenv（ai-agent）、dotenv（Node） |

---

## 專案結構

```
erp-system/
├── client/                 # Vue 3 前端
│   ├── src/
│   │   ├── api/            # API 呼叫封裝（apiFetch）
│   │   │   ├── index.js    #   統一 fetch 工具，自動帶 JWT token
│   │   │   ├── tasks.js    #   工作看板 API
│   │   │   └── ...         #   其他模組 API
│   │   ├── views/          # 各頁面
│   │   │   ├── HomeView.vue      #   首頁（含工作看板）
│   │   │   ├── KanbanView.vue    #   獨立工作看板頁面
│   │   │   ├── DashboardView.vue #   總覽儀表板
│   │   │   └── ...               #   其他模組頁面
│   │   ├── stores/         # Pinia 狀態管理
│   │   │   └── auth.js     #   使用者登入狀態（JWT、角色）
│   │   ├── router/         # 路由 + 守衛
│   │   └── App.vue         # 主版面（Sidebar、Header、AI 助手面板）
│   ├── index.html          # 引入 Flaticon Uicons CDN
│   └── .env                # 前端環境變數（VITE_API_URL）
├── server/                 # Node / Express 後端
│   ├── routes/             # 路由層
│   │   ├── ai.js           #   /api/ai/*   → 代理至 Python
│   │   ├── internal.js     #   /api/internal/* → 供 AI 讀 ERP 資料（不掛 auth）
│   │   ├── tasks.js        #   /api/tasks → 工作看板 CRUD（含角色權限）
│   │   └── ...             #   其餘業務路由（掛 auth）
│   ├── controllers/        # 控制器層
│   │   ├── aiController.js #   轉發 /news、/erp 給 Python
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js         #   JWT 驗證中介層
│   │   ├── logger.js       #   請求日誌
│   │   └── errorHandler.js #   統一錯誤處理
│   ├── models/             # 資料存取層（連 MySQL）
│   └── index.js            # 進入點（middleware + 路由註冊）
├── ai-agent/               # Python AI 微服務
│   ├── main.py             # FastAPI 進入點（/chat、/news、/erp）
│   ├── search.py           # SearXNG 搜尋 + 爬蟲（search_and_scrape）
│   ├── model/              # GGUF 模型檔（.gitignore，不進 git）
│   ├── searxng/            # SearXNG 設定（settings.yml）
│   ├── docker-compose.yml  # 啟動 SearXNG
│   ├── .env                # AI 服務環境變數（DB 連線）
│   └── requirements.txt
└── .env                    # 後端環境變數（DB、JWT_SECRET）
```

---

## 功能模組

### ERP 核心模組
| 模組 | 功能 |
|---|---|
| 首頁 | 快速統計、工作看板（首頁版）、系統模組導覽 |
| 總覽儀表板 | 銷售額、進貨額、庫存概況、圖表分析 |
| 進貨管理 | 採購訂單 CRUD、匯出 CSV |
| 銷貨管理 | 銷售訂單 CRUD、匯出 CSV |
| 存貨管理 | 庫存品項管理、庫存不足警示 |
| 供應商管理 | 供應商資料 CRUD |
| 客戶管理 | 客戶資料 CRUD |
| 報表分析 | 月份銷售趨勢、採購趨勢、圓餅圖 |

### 工作看板（Kanban）
- 四欄看板：待處理 / 進行中 / 審核中 / 完成
- 拖曳移動卡片
- 首頁嵌入版 + `/kanban` 獨立頁面
- **三層角色權限：**

| 角色 | 新增 | 讀取 | 拖曳移動 | 刪除 | 指派給人 |
|---|---|---|---|---|---|
| 系統管理員 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 主管 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 一般使用者 | ❌ | 只看自己的 | ❌ | ❌ | ❌ |

### AI 助手
- **查時事**：輸入主題，自動搜尋新聞並整理摘要
- **查庫存**：用自然語言查詢 ERP 資料（支援模糊搜尋、月份統計）
  - 自動判斷要查哪張資料表
  - 支援：供應商、客戶、庫存、採購訂單、銷售訂單
  - 統計類問題（銷售額、進貨額）自動使用 SUM 查詢

### 系統功能
- JWT 登入驗證
- 三層角色管理（系統管理員 / 主管 / 一般使用者）
- 庫存不足通知（右上角鈴鐺）
- 側邊欄收合
- Flaticon Uicons 圖示系統（CDN，`fi fi-rr-*` / `fi fi-sr-*`）

---

## 環境需求

- Node.js 18+
- Python 3.10+
- MySQL 9.7
- Docker Desktop
- 約 8GB RAM（CPU 推論）

---

## 安裝步驟

### 1. 前端 / 後端

```bash
npm install                             # 後端依賴（專案根目錄）
cd client && npm install && cd ..       # 前端依賴
```

設定根目錄 `.env`：
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密碼
DB_NAME=erp_system
JWT_SECRET=你的JWT密鑰
```

設定前端 `client/.env`：
```env
VITE_API_URL=http://localhost:3000
```

建立 MySQL 資料庫 `erp_system` 並匯入資料表。

### 2. AI 微服務

```bash
cd ai-agent
python -m venv venv
venv\Scripts\Activate.ps1          # Windows PowerShell
pip install -r requirements.txt
```

設定 `ai-agent/.env`：
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密碼
DB_NAME=erp_system
```

> PowerShell 擋執行時：`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3. 下載模型（GGUF，約 5.4GB）

```bash
huggingface-cli download bartowski/google_gemma-4-E4B-it-GGUF \
  --include "google_gemma-4-E4B-it-Q4_K_S.gguf" \
  --local-dir ./model
```

> ⚠️ 用 **GGUF** 量化版，而非官方 `safetensors`。

### 4. SearXNG（Docker）

`ai-agent/searxng/settings.yml` 需開啟 JSON 輸出：

```yaml
search:
  formats:
    - html
    - json
server:
  secret_key: "請改成隨機字串"
  limiter: false
```

---

## 啟動（需四個服務同時運行）

| 服務 | 指令 | Port |
|---|---|---|
| Docker / SearXNG | `docker compose up -d`（在 ai-agent/） | 8080 |
| Python AI | `python -m uvicorn main:app --host 0.0.0.0 --port 8000`（venv 下） | 8000 |
| Node 後端 | `node server/index.js`（專案根目錄） | 3000 |
| Vue 前端 | `cd client && npm run dev` | 5174/5175 |

開啟 `http://localhost:5174`，使用測試帳號登入：

| 帳號 | 密碼 | 角色 |
|---|---|---|
| sabrina@erp.com | sabrina123 | 系統管理員 |
| wang@erp.com | user123 | 一般使用者 |

---

## API 文件

### 路由總覽

| 來源 | 路徑 | 說明 | 權限 |
|---|---|---|---|
| 前端 | `POST /api/auth/login` | 登入取得 JWT | 公開 |
| 前端 | `POST /api/ai/news` | 查時事 | 需登入 |
| 前端 | `POST /api/ai/erp` | 查 ERP 資料 | 需登入 |
| 前端 | `GET /api/tasks` | 取得工作任務 | 需登入 |
| 前端 | `POST /api/tasks` | 新增任務 | 主管以上 |
| 前端 | `PATCH /api/tasks/:id/status` | 移動任務 | 主管以上 |
| 前端 | `DELETE /api/tasks/:id` | 刪除任務 | 管理員 |

Python 服務互動式文件（自動生成）：`http://127.0.0.1:8000/docs`

---

### Python AI 服務（:8000）

#### `POST /news`　查時事（RAG）

**Request**
```json
{ "query": "台積電 法說會" }
```

**Response**
```json
{
  "answer": "根據最新新聞...",
  "sources": [
    { "title": "外資喊台積電目標價", "url": "https://..." }
  ]
}
```

---

#### `POST /erp`　查 ERP 資料

**Request**
```json
{ "query": "6月銷售額多少" }
```

**Response**
```json
{
  "answer": "6月銷售額為 750,500.00 元。",
  "raw": [{ "訂單數": 5, "總金額": "750500.00", "平均金額": "150100.00" }]
}
```

支援查詢類型：
- 人員搜尋：`林百里是客戶還是廠商？`
- 地址查詢：`德記洋行的地址是哪裡？`
- 統計查詢：`6月銷售額多少？`、`本公司6月進貨額`
- 庫存查詢：`目前哪些庫存不足？`

---

## 設計重點

- **Node 為唯一 API 閘道**：前端只與 Node 溝通，Python 由 Node 代理，權限控管集中於 Node。
- **Text-to-SQL 架構**：AI 服務啟動時自動讀取 MySQL Schema（含範例資料），根據使用者問題判斷資料表，程式碼組成安全的 SQL 查詢（不讓 AI 直接產生 SQL，避免 injection 和語法錯誤）。
- **三層角色權限**：前端隱藏按鈕 + 後端 `requireRole` middleware 雙重保護。
- **JWT 驗證**：`middleware/auth.js` 統一驗證，`dotenv` 管理密鑰，密鑰不寫死在程式碼中。
- **Flaticon Uicons**：介面圖示全面採用 `fi fi-rr-*` / `fi fi-sr-*`，透過 CDN 引入，無需下載。
- **RAG 模式**：先檢索（搜尋／查資料庫）再交給 LLM 生成，避免幻覺、補足即時資訊。
- **全地端推論**：模型在本機跑，資料不外傳、無 API 費用。
- **datetime 序列化**：MySQL 回傳的 `datetime` 物件統一轉成字串再回傳，避免 JSON 序列化失敗。

---

## 常見問題

| 症狀 | 原因 | 解法 |
|---|---|---|
| 前端 502 / `ECONNREFUSED` | Node 未啟動 | `node server/index.js` |
| `無法連線到 AI 服務` | Python 未啟動 | 重新執行 uvicorn |
| `secretOrPrivateKey must have a value` | `.env` 沒有 `JWT_SECRET` | 在根目錄 `.env` 加入 `JWT_SECRET=...` |
| AI 查詢回應為空 / null | Python 回傳 datetime 物件無法序列化 | 確認 `query_db` 有轉換 datetime |
| Python `WinError 10061` | SearXNG / Docker 未啟動，或 Node 未啟動 | 開 Docker Desktop / 啟動 Node |
| SearXNG API 回 HTML | `settings.yml` 未開 JSON | 加入 `formats: [html, json]` 並重啟容器 |
| 改了程式無效 | 服務未重新載入 | 重啟該服務 |
| 載入模型很慢 | CPU 推論、模型約 5GB | 屬正常，首次載入需 10–30 秒 |
| AI 查詢資料表錯誤 | 問題關鍵字不在判斷清單 | 在 `main.py` 關鍵字清單補充 |
| Flaticon 圖示不顯示 | CDN 連線失敗或未引入 | 確認 `index.html` 有引入 Uicons CDN |

---

## License

本專案僅供學習使用。Gemma 4 採 Apache 2.0 授權。
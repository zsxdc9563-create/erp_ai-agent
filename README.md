# ERP System with Local AI Agent

一套自建的全端 ERP 系統，整合採購、銷售、庫存、客戶等模組，並內建一個**全地端（不依賴雲端 API）的 AI 助手**。

AI 助手有兩種模式：
- **📰 查時事**：透過自架的 SearXNG 搜尋 + 爬蟲抓取新聞正文，交給本地 LLM 摘要（RAG）。
- **📊 查庫存**：讓本地 LLM 讀取 ERP 內部資料（庫存等），用自然語言回答。

> 學習導向專案，採用標準三層架構（Routes → Controllers → Models），重點在理解每一層的職責。

---

## 目錄

- [技術架構](#技術架構)
- [資料流](#資料流)
- [技術棧](#技術棧)
- [專案結構](#專案結構)
- [環境需求](#環境需求)
- [安裝步驟](#安裝步驟)
- [啟動](#啟動需四個服務同時運行)
- [API 文件](#api-文件)
- [設計重點](#設計重點)
- [常見問題](#常見問題)

---

## 技術架構

```
                    Vue 3 前端 (:5173)
                          │  HTTP
                          ▼
                Node.js / Express (:3000) ─────► MySQL 8.0（ERP 資料）
                     │            ▲
        proxy        │            │ 內部 API（/api/internal/*，不掛 auth）
       /api/ai/*     │            │ 供 AI 查 ERP 資料
                     ▼            │
                Python / FastAPI (:8000)
                     │
                     ├─► SearXNG (Docker, :8080) ─► 網頁爬蟲 (httpx + trafilatura)
                     │        （/news：查時事）
                     │
                     ├─► Node 內部 API ─► MySQL
                     │        （/erp：查 ERP 庫存資料）
                     │
                     └─► Gemma 4（本地 GGUF, llama-cpp-python, CPU）
                              （讀取上述資料後生成回答）
```

---

## 資料流

**查時事（/news）：**
```
Vue → Node (proxy /api/ai/news) → Python (/news)
    → SearXNG 搜尋 → 爬蟲抓正文 (trafilatura)
    → 組成 prompt → Gemma 生成摘要 → 逐層回傳
```

**查庫存（/erp）：**
```
Vue → Node (proxy /api/ai/erp) → Python (/erp)
    → Node 內部 API (/api/internal/low-stock) → MySQL
    → 組成 prompt → Gemma 生成回答 → 逐層回傳
```

---

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Vue 3、Vite、Vue Router、Chart.js |
| 後端 | Node.js、Express |
| 資料庫 | MySQL 8.0 |
| AI 服務 | Python、FastAPI、uvicorn |
| LLM | Google Gemma 4 (E4B, GGUF Q4_K_S)、llama-cpp-python（CPU 推論） |
| 搜尋 / 爬蟲 | SearXNG（Docker）、httpx、trafilatura |

---

## 專案結構

```
erp-system/
├── client/                 # Vue 3 前端
│   └── src/
│       ├── api/            # API 呼叫封裝（apiFetch）
│       ├── views/          # 各頁面
│       ├── router/         # 路由 + 守衛
│       └── App.vue         # 主版面（含右上角 AI 助手面板）
├── server/                 # Node / Express 後端
│   ├── routes/             # 路由層
│   │   ├── ai.js           #   /api/ai/*   → 代理至 Python
│   │   ├── internal.js     #   /api/internal/* → 供 AI 讀 ERP 資料（不掛 auth）
│   │   └── inventory.js …  #   其餘業務路由（掛 auth）
│   ├── controllers/        # 控制器層
│   │   ├── aiController.js #   轉發 /news、/erp 給 Python
│   │   └── inventory.js …
│   ├── models/             # 資料存取層（連 MySQL）
│   └── index.js            # 進入點（middleware + 路由註冊）
└── ai-agent/               # Python AI 微服務
    ├── main.py             # FastAPI 進入點（/chat、/news、/erp）
    ├── search.py           # SearXNG 搜尋 + 爬蟲（search_and_scrape）
    ├── model/              # GGUF 模型檔（.gitignore，不進 git）
    ├── searxng/            # SearXNG 設定（settings.yml）
    ├── docker-compose.yml  # 啟動 SearXNG
    └── requirements.txt
```

---

## 環境需求

- Node.js 18+
- Python 3.10+
- MySQL 8.0
- Docker Desktop
- 約 8GB RAM / VRAM（CPU 推論即可）

---

## 安裝步驟

### 1. 前端 / 後端

```bash
npm install                 # 後端依賴（專案根目錄）
cd client && npm install && cd ..   # 前端依賴
```

設定 `.env`（資料庫連線等），並建立 MySQL 資料庫 `erp_system`。

`.env` 範例（請勿提交至 git）：
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密碼
DB_NAME=erp_system
```

### 2. AI 微服務

```bash
cd ai-agent
python -m venv venv
venv\Scripts\Activate.ps1          # Windows PowerShell
pip install -r requirements.txt
```

> PowerShell 擋執行時：`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3. 下載模型（GGUF，約 5.4GB）

只下載單一檔案，不要 clone 整個 repo：

```bash
huggingface-cli download bartowski/google_gemma-4-E4B-it-GGUF \
  --include "google_gemma-4-E4B-it-Q4_K_S.gguf" \
  --local-dir ./model
```

> ⚠️ 用 **GGUF** 量化版，而非官方 `safetensors`（後者未量化、約 15GB，一般機器無法載入）。

### 4. SearXNG（Docker）

`ai-agent/searxng/settings.yml` 需開啟 JSON 輸出：

```yaml
search:
  formats:
    - html
    - json          # 必須加，否則 API 回傳 HTML 而非 JSON
server:
  secret_key: "請改成隨機字串"
  limiter: false    # 本機自用，關閉限流避免程式呼叫被擋
```

---

## 啟動（需四個服務同時運行）

| 服務 | 指令 | Port |
|---|---|---|
| Docker / SearXNG | `docker compose up -d`（在 ai-agent/） | 8080 |
| Python AI | `uvicorn main:app --reload --port 8000`（venv 下） | 8000 |
| Node + 前端 | `npm run dev`（專案根目錄） | 3000 / 5173 |

開啟 `http://localhost:5173`，登入後點右上角 🤖。

---

## API 文件

### 路由總覽

| 來源 | 路徑 | 代理至 | 說明 |
|---|---|---|---|
| 前端 | `POST /api/ai/news` | Python `/news` | 查時事 |
| 前端 | `POST /api/ai/erp` | Python `/erp` | 查庫存 |
| 內部 | `GET /api/internal/low-stock` | MySQL | 供 AI 讀庫存（不掛 auth） |

Python 服務互動式文件（自動生成）：`http://127.0.0.1:8000/docs`

---

### Python AI 服務（:8000）

#### `GET /`
健康檢查。

**Response**
```json
{ "status": "ok", "message": "AI agent service is running" }
```

---

#### `POST /chat`
純對話，不檢索任何資料。

**Request**
```json
{ "message": "用一句話介紹你自己" }
```

**Response**
```json
{ "answer": "我是一個由 Google DeepMind 開發的開放權重語言模型 Gemma 4。" }
```

---

#### `POST /news`　查時事（RAG）

流程：SearXNG 搜尋 → 爬蟲抓正文 → 餵給 Gemma 摘要。

**Request**
```json
{ "query": "台積電 法說會" }
```

**Response**
```json
{
  "answer": "根據最新新聞，外資於法說會前調升台積電目標價至 3,500 元，預估第二季毛利率達 69% [1]...",
  "sources": [
    { "title": "外資喊台積電目標價3,500元", "url": "https://www.ctee.com.tw/news/..." },
    { "title": "AI需求強勁驅動台積電成長逾30%", "url": "https://money.udn.com/money/story/..." }
  ]
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `answer` | string | Gemma 依新聞正文生成的摘要 |
| `sources` | array | 參考來源（標題 + 連結） |

---

#### `POST /erp`　查 ERP 庫存

流程：呼叫 Node 內部 API 取庫存 → 餵給 Gemma 回答。

**Request**
```json
{ "query": "目前哪些庫存不足？" }
```

**Response**
```json
{
  "answer": "目前有 2 項庫存低於安全水位：\n1. 工業馬達 #B2：庫存 8 個（安全 15）\n2. 原料塑膠粒 (ABS)：庫存 120 公斤（安全 500）",
  "raw": [
    { "id": "INV-002", "name": "工業馬達 #B2", "stock": 8, "safeStock": 15, "unit": "個" },
    { "id": "INV-004", "name": "原料塑膠粒 (ABS)", "stock": 120, "safeStock": 500, "unit": "公斤" }
  ]
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `answer` | string | Gemma 依庫存資料生成的回答 |
| `raw` | array | 原始庫存資料 |

---

### Node 內部 API（:3000，供 AI 呼叫）

#### `GET /api/internal/low-stock`
查詢低於安全庫存的品項（不掛 auth，僅供本機內部呼叫）。

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "INV-002",
      "name": "工業馬達 #B2",
      "category": "機械零件",
      "stock": 8,
      "safeStock": 15,
      "maxStock": 50,
      "unit": "個",
      "location": "B-02-04"
    }
  ],
  "count": 1
}
```

---

### 錯誤處理

各端點以 `try/except` 包覆；發生錯誤時回傳結構化訊息，方便前端顯示與除錯：

```json
{ "answer": "❌ 後端出錯：ConnectError: [WinError 10061] 無法連線..." }
```

| HTTP 狀態 | 意義 |
|---|---|
| 200 | 成功（即使 `answer` 內含錯誤訊息，代表服務本身正常） |
| 401 | 未授權（業務路由需登入 token） |
| 500 | 後端內部錯誤 |
| 502 | Node 連不到 Python（AI 服務未啟動） |

---

## 設計重點

- **Node 為唯一 API 閘道**：前端只與 Node 溝通，Python 由 Node 代理，權限控管集中於 Node。
- **AI 查 ERP 走內部路由**：`/api/internal/*` 不掛 auth，供 Python 服務內部呼叫並讀取 MySQL（僅限本機開發；正式環境應改用內部 API key 等機制）。
- **Express middleware 順序**：`express.json()` 必須在所有路由之前，否則 `req.body` 為 undefined。
- **RAG 模式**：先檢索（搜尋／查庫存）再交給 LLM 生成，避免幻覺、補足即時資訊。
- **全地端推論**：模型在本機跑，資料不外傳、無 API 費用。
- **context 控制**：`n_ctx=8192`，並截斷爬取正文、限制 `max_tokens`，避免超出上下文視窗。

---

## 常見問題

| 症狀 | 原因 | 解法 |
|---|---|---|
| 前端 502 / `ECONNREFUSED` | Node 未啟動 | `npm run dev` |
| `無法連線到 AI 服務` | Python 未啟動 | `uvicorn main:app --reload --port 8000` |
| Python `WinError 10061` | SearXNG / Docker 未啟動，或 Node 未啟動 | 開 Docker Desktop / 啟動 Node |
| SearXNG API 回 HTML | `settings.yml` 未開 JSON | 加入 `formats: [html, json]` 並重啟容器 |
| 改了程式無效 | 服務未重新載入 | 重啟該服務（uvicorn 看是否出現 Reloading） |
| 載入模型很慢 | CPU 推論、模型約 5GB | 屬正常，首次載入需 10–30 秒 |

---

## License

本專案僅供學習使用。Gemma 4 採 Apache 2.0 授權。
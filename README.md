# ERP System with Local AI Agent

一套自建的全端 ERP 系統，整合採購、銷售、庫存、客戶等模組，並內建一個**全地端（不依賴雲端 API）的 AI 助手**。

AI 助手有兩種模式：
- **📰 查時事**：透過自架的 SearXNG 搜尋 + 爬蟲抓取新聞正文，交給本地 LLM 摘要（RAG）。
- **📊 查庫存**：讓本地 LLM 讀取 ERP 內部資料（庫存等），用自然語言回答。

> 學習導向專案，採用標準三層架構（Routes → Controllers → Models），重點在理解每一層的職責。

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

### 資料流

**查時事（/news）：**
```
Vue → Node (proxy) → Python → SearXNG → 爬蟲抓正文 → Gemma → 回傳
```

**查庫存（/erp）：**
```
Vue → Node (proxy) → Python → Node 內部 API (/api/internal) → MySQL → Gemma → 回傳
```

| 層 | 技術 |
|---|---|
| 前端 | Vue 3、Vite、Vue Router、Chart.js |
| 後端 | Node.js、Express |
| 資料庫 | MySQL 8.0 |
| AI 服務 | Python、FastAPI、uvicorn |
| LLM | Google Gemma 4 (E4B, GGUF Q4_K_S)、llama-cpp-python（CPU） |
| 搜尋 | SearXNG（Docker）、httpx、trafilatura |

---

## 專案結構

```
erp-system/
├── client/                 # Vue 3 前端
│   └── src/
│       ├── api/            # API 呼叫封裝
│       ├── views/          # 各頁面
│       ├── router/         # 路由 + 守衛
│       └── App.vue         # 主版面（含右上角 AI 助手）
├── server/                 # Node / Express 後端
│   ├── routes/             # 路由層（含 ai.js、internal.js）
│   ├── controllers/        # 控制器層
│   ├── models/             # 資料存取層（連 MySQL）
│   └── index.js            # 進入點
└── ai-agent/               # Python AI 微服務
    ├── main.py             # FastAPI 進入點（/chat、/news、/erp）
    ├── search.py           # SearXNG 搜尋 + 爬蟲
    ├── model/              # GGUF 模型檔（不進 git）
    ├── searxng/            # SearXNG 設定
    └── docker-compose.yml  # 啟動 SearXNG
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
# 安裝後端依賴（專案根目錄）
npm install

# 安裝前端依賴
cd client && npm install && cd ..
```

設定 `.env`（資料庫連線等），並建立 MySQL 資料庫 `erp_system`。

### 2. AI 微服務

```bash
cd ai-agent
python -m venv venv
venv\Scripts\Activate.ps1          # Windows PowerShell
pip install -r requirements.txt
```

> 若 PowerShell 擋執行：`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3. 下載模型（GGUF，約 5.4GB）

只下載單一檔案，不要 clone 整個 repo：

```bash
huggingface-cli download bartowski/google_gemma-4-E4B-it-GGUF \
  --include "google_gemma-4-E4B-it-Q4_K_S.gguf" \
  --local-dir ./model
```

> ⚠️ 用 **GGUF** 量化版，不是官方 `safetensors`（後者未量化、約 15GB，一般機器跑不動）。

### 4. SearXNG（Docker）

`ai-agent/searxng/settings.yml` 需開啟 JSON 輸出：

```yaml
search:
  formats:
    - html
    - json          # 必須加，否則 API 回 HTML
server:
  limiter: false    # 本機自用關閉限流
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

## API 端點（Python :8000）

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/` | 健康檢查 |
| POST | `/chat` | 純對話 |
| POST | `/news` | 查時事（SearXNG → 爬蟲 → LLM） |
| POST | `/erp` | 查 ERP 內部資料（Node 內部 API → MySQL → LLM） |

互動式 API 文件：`http://127.0.0.1:8000/docs`

---

## 設計重點

- **Node 為唯一 API 閘道**：前端只與 Node 溝通，Python 由 Node 代理，權限控管集中於 Node。
- **AI 查 ERP 走內部路由**：`/api/internal/*` 不掛 auth，供 Python 服務內部呼叫並讀取 MySQL（本機開發用）。
- **RAG 模式**：先檢索（搜尋/查庫存）再交給 LLM 生成，避免幻覺、補足即時資訊。
- **全地端推論**：模型在本機跑，資料不外傳、無 API 費用。

---

## 常見問題

| 症狀 | 原因 | 解法 |
|---|---|---|
| 前端 502 / `ECONNREFUSED` | Node 未啟動 | `npm run dev` |
| `無法連線到 AI 服務` | Python 未啟動 | `uvicorn ...` |
| `WinError 10061` | SearXNG / Docker 未啟動 | 開 Docker Desktop |
| 改了程式無效 | 服務未重新載入 | 重啟該服務 |

---

## License

本專案僅供學習使用。Gemma 4 採 Apache 2.0 授權。
from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel
from llama_cpp import Llama
from search import search_and_scrape
import httpx

# 用一個 dict 存放常駐的模型
ml_models = {}

@asynccontextmanager               
async def lifespan(app: FastAPI):
    # 伺服器啟動時：載入模型一次（常駐）
    print("載入模型中...請稍候")
    ml_models["llm"] = Llama(
        model_path="./model/google_gemma-4-E4B-it-Q4_K_S.gguf",
        n_ctx=8192,
        n_gpu_layers=0,
        verbose=False,
    )
    print("模型載入完成，服務就緒 ✅") # 5GB 的 Gemma 已經常駐在記憶體裡，待命中
    yield
    # 伺服器關閉時：清掉模型
    ml_models.clear()

app = FastAPI(lifespan=lifespan) 

# 定義請求的格式：前端要傳一個 message 字串
class ChatRequest(BaseModel):
    message: str

# 健康檢查用，開瀏覽器看得到
@app.get("/")
def root():
    return {"status": "ok", "message": "AI agent service is running"}

# 聊天端點
@app.post("/chat")
def chat(req: ChatRequest):
    llm = ml_models["llm"]
    output = llm.create_chat_completion(
        messages=[{"role": "user", "content": req.message}]
    )
    answer = output["choices"][0]["message"]["content"]
    return {"answer": answer}


class NewsRequest(BaseModel):
    query: str

@app.post("/news")
def news(req: NewsRequest):
    try:
        # 1) 查時事 + 抓正文
        docs = search_and_scrape(req.query, top_k=2)

        if not docs:
            return {"answer": "抱歉，這個主題目前查不到可用的新聞內容。", "sources": []}

        # 2) 組參考資料
        context = ""
        for i, d in enumerate(docs, 1):
            context += f"[{i}] {d['title']}\n{d['content']}\n\n"

        # 3) 組 prompt
        prompt = f"""以下是關於「{req.query}」的最新新聞資料：

{context}

請根據上面的新聞資料，用繁體中文摘要回答關於「{req.query}」的重點。
請務必只根據上面提供的資料回答，不要編造。回答時可標註來源編號，例如 [1]、[2]。"""

        # 4) 餵給 Gemma
        llm = ml_models["llm"]
        output = llm.create_chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
        )
        answer = output["choices"][0]["message"]["content"]

        return {
            "answer": answer,
            "sources": [{"title": d["title"], "url": d["url"]} for d in docs],
        }

    except Exception as e:
        # 把真正的錯誤印出來 + 回傳，方便除錯
        import traceback
        traceback.print_exc()
        return {"answer": f"❌ 後端出錯：{type(e).__name__}: {str(e)}", "sources": []}
    



ERP_API_URL = "http://localhost:3000/api/internal"

class ErpRequest(BaseModel):
    query: str

@app.post("/erp")
def erp(req: ErpRequest):
    try:
        # 1) 打 Node 內部 API 拿庫存不足資料
        resp = httpx.get(f"{ERP_API_URL}/low-stock", timeout=15)
        result = resp.json()
        items = result.get("data", [])

        if not items:
            return {"answer": "目前沒有庫存不足的品項。", "raw": []}

        # 2) 把資料組成乾淨好讀的文字
        context = ""
        for it in items:
            name = it.get("name", "未知品項")
            stock = it.get("stock", "?")
            safe = it.get("safeStock", "?")
            unit = it.get("unit", "")
            category = it.get("category", "")
            location = it.get("location", "")
            context += (
                f"- {name}（分類：{category}）："
                f"目前庫存 {stock} {unit}，安全庫存 {safe} {unit}，"
                f"儲位 {location}\n"
            )

        # 3) 組 prompt
        prompt = f"""以下是 ERP 系統目前「庫存不足」的品項資料：

{context}

使用者問題：{req.query}

請根據上面的庫存資料，用繁體中文清楚回答。只根據資料回答，不要編造數字。"""

        # 4) 餵給 Gemma
        llm = ml_models["llm"]
        output = llm.create_chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
        )
        answer = output["choices"][0]["message"]["content"]

        return {"answer": answer, "raw": items}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"answer": f"❌ 後端出錯：{type(e).__name__}: {str(e)}"}
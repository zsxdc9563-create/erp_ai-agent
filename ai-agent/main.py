from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel
from llama_cpp import Llama
from search import search_and_scrape
import mysql.connector
import re
import json
from dotenv import load_dotenv
import os

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "erp_system")
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

def get_schema_with_samples():
    """讀取資料表結構 + 每個表的前2筆範例資料"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    # 取得所有資料表
    cursor.execute("SHOW TABLES")
    tables = [list(row.values())[0] for row in cursor.fetchall()]
    
    schema_text = ""
    for table in tables:
        # 取得建表語法
        cursor.execute(f"SHOW CREATE TABLE `{table}`")
        create_sql = cursor.fetchone()["Create Table"]
        schema_text += f"{create_sql};\n\n"
        
        # 取得前2筆範例資料
        cursor.execute(f"SELECT * FROM `{table}` LIMIT 2")
        rows = cursor.fetchall()
        if rows:
            schema_text += f"-- {table} 範例資料：\n"
            for row in rows:
                values = ", ".join(f"{k}={v}" for k, v in row.items())
                schema_text += f"-- {values}\n"
            schema_text += "\n"
    
    cursor.close()
    conn.close()
    return schema_text


def clean_rows(rows):
    """把 datetime 物件轉成字串"""
    import datetime
    result = []
    for row in rows:
        clean = {}
        for k, v in row.items():
            if isinstance(v, (datetime.datetime, datetime.date, datetime.timedelta)):
                clean[k] = str(v)
            else:
                clean[k] = v
        result.append(clean)
    return result



def query_db(sql):
    """執行 SQL 查詢"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # 把 datetime 物件轉成字串
    import datetime
    clean_rows = []
    for row in rows:
        clean_row = {}
        for k, v in row.items():
            if isinstance(v, (datetime.datetime, datetime.date)):
                clean_row[k] = str(v)
            elif isinstance(v, datetime.timedelta):
                clean_row[k] = str(v)
            else:
                clean_row[k] = v
        clean_rows.append(clean_row)
    return clean_rows




def search_all_columns(table, keyword):
    """自動讀取資料表所有文字欄位，組成 LIKE 查詢"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    # 查該表所有文字類型的欄位
    cursor.execute(f"""
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '{DB_CONFIG["database"]}'
        AND TABLE_NAME = '{table}'
        AND DATA_TYPE IN ('varchar', 'text', 'char', 'longtext', 'mediumtext')
    """)
    columns = [row['COLUMN_NAME'] for row in cursor.fetchall()]
    print(f"=== {table} 文字欄位：{columns} ===")
    
    if not columns:
        cursor.close()
        conn.close()
        return []
    
    # 組成 WHERE 條件
    where = " OR ".join(f"`{col}` LIKE '%{keyword}%'" for col in columns)
    sql = f"SELECT * FROM `{table}` WHERE {where} LIMIT 20"
    print(f"=== 執行 SQL：{sql} ===")
    
    cursor.execute(sql)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


def query_stats(table, query_type, filters=None):
    """處理統計類查詢（SUM、COUNT、AVG）"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    where = f"WHERE {filters}" if filters else ""
    
    if table == 'sales_orders':
        sql = f"SELECT COUNT(*) as 訂單數, SUM(amount) as 總金額, AVG(amount) as 平均金額 FROM sales_orders {where}"
    elif table == 'purchase_orders':
        sql = f"SELECT COUNT(*) as 訂單數, SUM(amount) as 總金額, AVG(amount) as 平均金額 FROM purchase_orders {where}"
    elif table == 'inventory_items':
        sql = f"SELECT COUNT(*) as 品項數, SUM(stock) as 總庫存 FROM inventory_items {where}"
    
    print(f"=== 統計 SQL：{sql} ===")
    cursor.execute(sql)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

# 常駐模型
ml_models = {}
db_schema = ""

@asynccontextmanager               
async def lifespan(app: FastAPI):
    global db_schema
    print("載入模型中...請稍候")
    ml_models["llm"] = Llama(
        model_path="./model/google_gemma-4-E4B-it-Q4_K_S.gguf",
        n_ctx=8192,
        n_gpu_layers=0,
        verbose=False,
    )
    print("模型載入完成 ✅")

    print("讀取資料庫結構中...")
    db_schema = get_schema_with_samples()
    print("資料庫結構讀取完成 ✅")
    print(db_schema)
    yield
    ml_models.clear()

app = FastAPI(lifespan=lifespan)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def root():
    return {"status": "ok", "message": "AI agent service is running"}

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
        docs = search_and_scrape(req.query, top_k=2)

        if not docs:
            return {"answer": "抱歉，這個主題目前查不到可用的新聞內容。", "sources": []}

        context = ""
        for i, d in enumerate(docs, 1):
            context += f"[{i}] {d['title']}\n{d['content']}\n\n"

        prompt = f"""以下是關於「{req.query}」的最新新聞資料：

{context}

請根據上面的新聞資料，用繁體中文摘要回答關於「{req.query}」的重點。
請務必只根據上面提供的資料回答，不要編造。回答時可標註來源編號，例如 [1]、[2]。"""

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
        import traceback
        traceback.print_exc()
        return {"answer": f"❌ 後端出錯：{type(e).__name__}: {str(e)}", "sources": []}


class ErpRequest(BaseModel):
    query: str

@app.post("/erp")
def erp(req: ErpRequest):
    try:
        llm = ml_models["llm"]
        query = req.query

        # 第一步：判斷是否為統計類問題
        is_stats = any(w in query for w in ['多少', '總額', '金額', '幾筆', '統計', '合計', '加總', '銷售額', '採購額', '進貨額'])

        # 判斷月份
        month_match = re.search(r'(\d+)月', query)
        month_filter = None
        if month_match:
            month = month_match.group(1).zfill(2)
            month_filter = f"DATE_FORMAT(date, '%m') = '{month}'"
            print(f"=== 月份篩選：{month} 月 ===")

        # 抽取搜尋關鍵字
        stopwords = ['是', '的', '嗎', '哪', '什麼', '有', '哪些', '還是', '廠商', '供應商', '庫存', '訂單', '地址', '電話', '聯絡', '客戶', '請問', '告訴我', '多少', '總額', '金額', '幾筆', '統計', '合計', '加總', '銷售額', '採購額', '進貨額', '月', '本公司', '我們', '公司']
        keywords = query
        for w in stopwords:
            keywords = keywords.replace(w, ' ')
        keyword = keywords.strip().split()[0] if keywords.strip() else query
        print(f"=== 搜尋關鍵字：{keyword} ===")
        print(f"=== 是否統計問題：{is_stats} ===")

        # 第二步：判斷查哪些表
        if any(w in query for w in ['供應商', '廠商', '進貨來源']):
            tables_to_search = ['suppliers']
        elif any(w in query for w in ['客戶', '買家']):
            tables_to_search = ['customers']
        elif any(w in query for w in ['庫存', '存貨', '品項', '零件', '原料']):
            tables_to_search = ['inventory_items']
        elif any(w in query for w in ['採購', '採購訂單', '進貨單', '進貨', '進貨額']):
            tables_to_search = ['purchase_orders']
        elif any(w in query for w in ['銷售', '出貨', '銷貨', '銷售訂單', '銷售額']):
            tables_to_search = ['sales_orders']
        else:
            tables_to_search = ['suppliers', 'customers']
        print(f"=== 查詢資料表：{tables_to_search} ===")

        
        # 第三步：執行查詢
        rows = []
        for table in tables_to_search:
            try:
                if is_stats:
                    result = query_stats(table, 'sum', month_filter)
                else:
                    result = search_all_columns(table, keyword)
                rows.extend(result)
                print(f"✅ {table} 查到 {len(result)} 筆")
            except Exception as e:
                print(f"❌ {table} 查詢失敗：{e}")

        if not rows:
            return {"answer": "資料庫中查無相關資料。", "raw": [], "accuracy": 0}

        # 第四步：組 context
        context = "\n".join(
            ", ".join(f"{k}: {v}" for k, v in row.items())
            for row in rows
        )

        # 第五步：AI 回答
        answer_prompt = f"""以下是從 ERP 資料庫查詢到的資料：

{context}

使用者問題：{query}

請用一句話直接回答，不要說多餘的話。
金額數字請加上千分位逗號，例如 750,500.00。"""

        output = llm.create_chat_completion(
            messages=[{"role": "user", "content": answer_prompt}],
            max_tokens=512,
        )
        answer = output["choices"][0]["message"]["content"]

        
        # 第六步：數字比對良率（只比對金額和數量）
        answer_clean = answer.replace(',', '')
        answer_numbers = set(re.findall(r'\d+\.?\d*', answer_clean))
        
        erp_numbers = set()
        skip_keys = {'id', 'created_at', 'last_update', 'date', 'updated_at'}
        for row in rows:
            for k, v in row.items():
                if k in skip_keys:
                    continue
                if v is not None:
                    nums = re.findall(r'\d+\.?\d*', str(v).replace(',', ''))
                    erp_numbers.update(nums)

        print(f"=== ERP 數字：{erp_numbers} ===")
        print(f"=== AI 數字：{answer_numbers} ===")

        matched = answer_numbers & erp_numbers
        total = len(erp_numbers)
        accuracy = round(len(matched) / total * 100, 1) if total > 0 else 0
        print(f"=== 良率：{accuracy}% ===")

        return {
            "answer": answer,
            "raw": rows,
            
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"answer": f"❌ 後端出錯：{type(e).__name__}: {str(e)}"}



# 手動重新讀取 DB Schema
@app.post("/refresh-schema")
def refresh_schema():
    global db_schema
    try:
        db_schema = get_schema_with_samples()
        return {"success": True, "message": "Schema 已更新"}
    except Exception as e:
        return {"success": False, "message": str(e)}
import httpx                               
import trafilatura

SEARXNG_URL = "http://localhost:8080/search"


#SearXNG只搜新聞引擎，回來的就幾乎都是文章頁。
def search_and_scrape(query: str, top_k: int = 3):
    # 1) 問 SearXNG 拿結果
    resp = httpx.get(
        SEARXNG_URL,
        params={"q": query, "format": "json", "categories": "news"}, #  只搜新聞分類
        timeout=20,
    )
    results = resp.json().get("results", [])[:top_k]

    # 2) 逐筆抓網頁、抽正文
    docs = []
    for item in results:
        url = item.get("url")
        title = item.get("title", "")
        try:
            html = httpx.get(url, timeout=15, follow_redirects=True).text
            text = trafilatura.extract(html)  # 抽乾淨正文
            if text:
                docs.append({
                    "title": title,
                    "url": url,
                    "content": text[:800],  # 截斷，避免太長
                })
                print(f"✅ 抓到：{title}")
            else:
                print(f"⚠️ 抽不出正文，跳過：{title}")
        except Exception as e:
            print(f"❌ 抓取失敗，跳過：{title}（{e}）")

    return docs


# 直接執行這個檔時，測試一下
if __name__ == "__main__":
    query = "台積電 法說會" # 具體事件，會配對到新聞報導文章
    print(f"搜尋：{query}\n")
    docs = search_and_scrape(query)
    print(f"\n共抓到 {len(docs)} 篇：\n")
    for d in docs:
        print("=" * 60)
        print(f"標題：{d['title']}")
        print(f"網址：{d['url']}")
        print(f"內容前200字：{d['content'][:200]}")
        print()
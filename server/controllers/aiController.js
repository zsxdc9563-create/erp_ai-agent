const PYTHON_AI_URL = "http://localhost:8000";

// 轉發「時事查詢」給 Python AI 服務
exports.getNews = async (req, res) => {
  try {
    const { query } = req.body;

    
    if (!query) {
      return res.status(400).json({ error: "缺少 query 參數" });
    }

    // 呼叫 Python 的 /news（用 Node 內建 fetch）
    const response = await fetch(`${PYTHON_AI_URL}/news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "AI 服務回應異常" });
    }

    const data = await response.json();
    res.json(data); // 把 Python 回的 { answer, sources } 原封不動傳回前端
  } catch (err) {
    console.error("呼叫 AI 服務失敗:", err.message);
    res.status(500).json({ error: "無法連線到 AI 服務" });
  }
};

// 轉發「ERP 查詢」給 Python
exports.getErp = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "缺少 query 參數" });

    const response = await fetch("http://localhost:8000/erp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return res.status(502).json({ error: "AI 服務回應異常" });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("呼叫 AI 服務失敗:", err.message);
    res.status(500).json({ error: "無法連線到 AI 服務" });
  }
};
from llama_cpp import Llama

# 載入模型（第一次會花 10~30 秒把模型讀進記憶體）
print("載入模型中...請稍候")
llm = Llama(
    model_path="./model/google_gemma-4-E4B-it-Q4_K_S.gguf",
    n_ctx=8192,        # context 長度，8GB 先別開太大
    n_gpu_layers=0,    # 先全部用 CPU 跑，確認會動；之後再考慮 GPU
    verbose=False,     # 關掉一堆底層 log，輸出乾淨點
)

print("模型載入完成，開始問問題...\n")

# 丟一句話給 Gemma
output = llm.create_chat_completion(
    messages=[
        {"role": "user", "content": "請用一句話介紹你自己。"}
    ]
)

# 印出回答
print("Gemma 的回答：")
print(output["choices"][0]["message"]["content"])
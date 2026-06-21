const express = require('express')//載入 Express 框架。
const router = express.Router()//建立一個「路由器物件」，用來集中管理某一類 API。
const InventoryController = require('../controllers/inventory')//載入控制器檔案（controllers/inventory.js），裡面應該定義了各種處理庫存的函式。

router.get('/alerts/low-stock', InventoryController.getLowStock)//功能：可能是檢查哪些商品庫存不足。
router.get('/',       InventoryController.getAll)//功能：取得所有庫存資料。
router.get('/:id',    InventoryController.getOne)//功能：取得某一筆庫存（依照 id）。
router.post('/',      InventoryController.create)//功能：新增一筆庫存資料。                                     
router.patch('/:id/adjust', InventoryController.adjust)   //  功能：調整某一筆庫存（例如加減數量）。                      

module.exports = router //模組輸出
//把這個 router 匯出，讓主程式（例如 app.js 或 server.js）可以用
//→ 這樣所有路由就會掛在 /inventory 底下。
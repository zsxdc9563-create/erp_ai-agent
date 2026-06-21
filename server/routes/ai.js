const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.post("/news", aiController.getNews);               
router.post("/erp", aiController.getErp);                         

module.exports = router;
/**
 * historical.routes.js
 * --------------------
 * Historical data preview, upload, validation, and ML training router.
 */

const express = require("express");
const {
  previewHistoricalDataEndpoint,
  uploadHistoricalDataEndpoint,
  trainModelEndpoint,
  getModelStatusEndpoint,
} = require("../controllers/historical.controller");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/plugin/historical-data/preview", optionalAuth, previewHistoricalDataEndpoint);
router.post("/plugin/historical-data/upload", optionalAuth, uploadHistoricalDataEndpoint);
router.post("/plugin/historical-data/train", optionalAuth, trainModelEndpoint);
router.post("/plugin/train-model", optionalAuth, trainModelEndpoint);
router.get("/plugin/model-status/:tenant_id", optionalAuth, getModelStatusEndpoint);

module.exports = router;

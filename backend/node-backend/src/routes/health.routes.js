/**
 * health.routes.js
 * ----------------
 * System Health & DB Connectivity Check Endpoint.
 */

const express = require("express");
const prisma = require("../config/prisma");

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    await prisma.$queryRawUnsafe("SELECT 1;");
    return res.status(200).json({
      status: "ok",
      service: "ai-queue-node-backend",
      version: "2.5.0",
      database: "connected",
    });
  } catch (err) {
    return res.status(200).json({
      status: "degraded",
      service: "ai-queue-node-backend",
      version: "2.5.0",
      database: "disconnected",
      error: err.message,
    });
  }
});

module.exports = router;

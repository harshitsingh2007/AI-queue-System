/**
 * queue.routes.js
 * ---------------
 * Queue lifecycle routes.
 */

const express = require("express");
const {
  joinQueueEndpoint,
  serveNextEndpoint,
  completeEndpoint,
  noShowEndpoint,
  countersEndpoint,
  getQueueEndpoint,
  getQueueHistoryEndpoint,
  getAnalyticsEndpoint,
  triggerDailyClosureEndpoint,
} = require("../controllers/queue.controller");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/join", optionalAuth, joinQueueEndpoint);
router.post("/queue/join", optionalAuth, joinQueueEndpoint);
router.post("/serve-next", optionalAuth, serveNextEndpoint);
router.post("/complete", optionalAuth, completeEndpoint);
router.post("/no-show", optionalAuth, noShowEndpoint);
router.post("/counters", optionalAuth, countersEndpoint);
router.get("/queue/:tenant_id", optionalAuth, getQueueEndpoint);
router.get("/queue/snapshot/:tenant_id", optionalAuth, getQueueEndpoint);
router.get("/snapshot/:tenant_id", optionalAuth, getQueueEndpoint);
router.get("/queue/:tenant_id/history", optionalAuth, getQueueHistoryEndpoint);
router.get("/analytics/:tenant_id", optionalAuth, getAnalyticsEndpoint);
router.post("/daily-closure", optionalAuth, triggerDailyClosureEndpoint);

module.exports = router;

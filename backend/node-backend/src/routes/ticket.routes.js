/**
 * ticket.routes.js
 * ----------------
 * Ticket operations router.
 */

const express = require("express");
const {
  cancelTicketEndpoint,
  adjustQueueEndpoint,
  getTicketDetailsEndpoint,
  transferTicketEndpoint,
  reAnnounceEndpoint,
} = require("../controllers/ticket.controller");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Cancel endpoints
router.post("/tickets/:ticket_id/cancel", optionalAuth, cancelTicketEndpoint);
router.post("/plugin/tickets/:ticket_id/cancel", optionalAuth, cancelTicketEndpoint);
router.post("/plugin/cancel", optionalAuth, cancelTicketEndpoint);

// Adjust endpoints
router.post("/tickets/:ticket_id/adjust", optionalAuth, adjustQueueEndpoint);
router.post("/tickets/:ticket_id/adjust-queue", optionalAuth, adjustQueueEndpoint);
router.post("/plugin/tickets/:ticket_id/adjust-queue", optionalAuth, adjustQueueEndpoint);
router.post("/plugin/adjust-queue", optionalAuth, adjustQueueEndpoint);

// Ticket details, transfer, re-announce
router.get("/plugin/ticket/:ticket_id", optionalAuth, getTicketDetailsEndpoint);
router.post("/plugin/transfer-ticket", optionalAuth, transferTicketEndpoint);
router.post("/plugin/re-announce", optionalAuth, reAnnounceEndpoint);

module.exports = router;

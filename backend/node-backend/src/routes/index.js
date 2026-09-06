/**
 * routes/index.js
 * ---------------
 * Central API Gateway aggregator.
 */

const express = require("express");
const authRoutes = require("./auth.routes");
const queueRoutes = require("./queue.routes");
const ticketRoutes = require("./ticket.routes");
const appointmentRoutes = require("./appointment.routes");
const familyRoutes = require("./family.routes");
const hospitalRoutes = require("./hospital.routes");
const historicalRoutes = require("./historical.routes");
const qrRoutes = require("./qr.routes");
const healthRoutes = require("./health.routes");
const { getUserHistory } = require("../controllers/auth.controller");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Health check
router.use("/", healthRoutes);

// Auth routes (/api/v1/auth/*)
router.use("/api/v1/auth", authRoutes);

// Queue, Counter & Analytics routes (/api/v1/plugin/*)
router.use("/api/v1/plugin", queueRoutes);

// Ticket routes (/api/v1/* and /api/v1/plugin/*)
router.use("/api/v1", ticketRoutes);

// Additional ticket history alias: /api/v1/plugin/tickets/history/:identifier
router.get("/api/v1/plugin/tickets/history/:identifier", optionalAuth, getUserHistory);

// Appointment routes (/api/v1/plugin/appointments/*)
router.use("/api/v1", appointmentRoutes);

// Family members routes (/api/v1/family-members and /api/v1/users/:email/family-members)
router.use("/api/v1", familyRoutes);

// Hospital & SuperAdmin routes (/api/v1/hospital/*, /api/v1/superadmin/*, /api/v1/admin/*)
router.use("/api/v1", hospitalRoutes);

// Historical data & ML training (/api/v1/plugin/historical-data/*, /api/v1/plugin/train-model)
router.use("/api/v1", historicalRoutes);

// QR generator routes (/api/v1/plugin/qr/*, /api/v1/plugin/ticket-qr/*)
router.use("/api/v1", qrRoutes);

module.exports = router;

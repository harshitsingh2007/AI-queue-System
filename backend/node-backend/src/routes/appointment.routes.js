/**
 * appointment.routes.js
 * ----------------------
 * Appointment scheduling routes.
 */

const express = require("express");
const {
  bookAppointmentEndpoint,
  checkInAppointmentEndpoint,
  getUserAppointmentsEndpoint,
  getTenantAppointmentsEndpoint,
} = require("../controllers/appointment.controller");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/plugin/appointments/book", optionalAuth, bookAppointmentEndpoint);
router.post("/plugin/appointments/check-in", optionalAuth, checkInAppointmentEndpoint);
router.get("/plugin/appointments/user/:email", optionalAuth, getUserAppointmentsEndpoint);
router.get("/plugin/appointments/tenant/:tenant_id", optionalAuth, getTenantAppointmentsEndpoint);

module.exports = router;

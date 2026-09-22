/**
 * patientHistory.routes.js
 * ------------------------
 * Express routes for Patient Follow-Up & Medical History.
 */

const express = require("express");
const {
  getPatientHistoryEndpoint,
  getTicketPatientHistoryEndpoint,
  getPatientHistorySummaryEndpoint,
  getPatientVisitsEndpoint,
  getPatientPrescriptionsEndpoint,
  getPatientReportsEndpoint,
} = require("../controllers/patientHistory.controller");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Ticket-linked patient history (Fast lookup for active doctor consultation)
router.get("/tickets/:ticketId/patient-history", optionalAuth, getTicketPatientHistoryEndpoint);
router.get("/plugin/tickets/:ticketId/patient-history", optionalAuth, getTicketPatientHistoryEndpoint);
router.get("/plugin/patient-history", optionalAuth, getPatientHistoryEndpoint);

// Patient-centric medical history endpoints
router.get("/patients/:patientId/history", optionalAuth, getPatientHistoryEndpoint);
router.get("/patients/:patientId/history/summary", optionalAuth, getPatientHistorySummaryEndpoint);
router.get("/patients/:patientId/visits", optionalAuth, getPatientVisitsEndpoint);
router.get("/patients/:patientId/prescriptions", optionalAuth, getPatientPrescriptionsEndpoint);
router.get("/patients/:patientId/reports", optionalAuth, getPatientReportsEndpoint);

module.exports = router;

/**
 * qr.routes.js
 * ------------
 * QR code endpoints router.
 */

const express = require("express");
const { generateHospitalQr, generateTicketQr } = require("../controllers/qr.controller");

const router = express.Router();

router.get("/plugin/qr/:tenant_id", generateHospitalQr);
router.get("/plugin/ticket-qr/:ticket_id", generateTicketQr);

module.exports = router;

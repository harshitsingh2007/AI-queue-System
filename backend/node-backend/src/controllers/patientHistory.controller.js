/**
 * patientHistory.controller.js
 * ----------------------------
 * Express controller for Patient Medical History, Past Visits, Prescriptions,
 * and Diagnostic Reports.
 */

const {
  getFullPatientMedicalHistory,
  getPatientHistorySummary,
  getPatientVisitHistory,
  getPatientPrescriptions,
  getPatientReports,
  findPatientIdentity,
} = require("../services/patientHistoryService");

/**
 * GET /api/v1/patients/:patientId/history
 * Complete medical history for a specific patient.
 */
async function getPatientHistoryEndpoint(req, res, next) {
  try {
    const patientId = req.params.patientId || req.query.patient_id;
    const ticketId = req.query.ticket_id || req.params.ticketId;
    const phone = req.query.phone;
    const hospitalId = req.query.hospital_id || req.query.tenant_id || req.user?.primary_hospital_code || "city-hospital-01";
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);

    const history = await getFullPatientMedicalHistory({
      patient_id: patientId,
      ticket_id: ticketId,
      user_id: req.user?.id,
      phone,
      hospital_id: hospitalId,
      page,
      limit,
    });

    return res.status(200).json(history);
  } catch (error) {
    console.error("Patient history fetch error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * GET /api/v1/tickets/:ticketId/patient-history
 * Quick medical history for the patient on an active or past ticket.
 */
async function getTicketPatientHistoryEndpoint(req, res, next) {
  try {
    const ticketId = req.params.ticketId || req.params.ticket_id || req.query.ticket_id;
    const hospitalId = req.query.hospital_id || req.query.tenant_id || "city-hospital-01";
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 5, 10);

    if (!ticketId) {
      return res.status(400).json({ status: "error", message: "Ticket ID is required." });
    }

    const history = await getFullPatientMedicalHistory({
      ticket_id: ticketId,
      hospital_id: hospitalId,
      page,
      limit,
    });

    return res.status(200).json(history);
  } catch (error) {
    console.error("Ticket patient history error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * GET /api/v1/patients/:patientId/history/summary
 */
async function getPatientHistorySummaryEndpoint(req, res, next) {
  try {
    const patientId = req.params.patientId || req.query.patient_id;
    const hospitalId = req.query.hospital_id || req.query.tenant_id;
    const summary = await getPatientHistorySummary(patientId, hospitalId);
    return res.status(200).json({ status: "success", summary });
  } catch (error) {
    console.error("Patient summary error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * GET /api/v1/patients/:patientId/visits
 */
async function getPatientVisitsEndpoint(req, res, next) {
  try {
    const patientId = req.params.patientId;
    const hospitalId = req.query.hospital_id || req.query.tenant_id;
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const department = req.query.department || "all";

    const data = await getPatientVisitHistory(patientId, hospitalId, { page, limit, department });
    return res.status(200).json({ status: "success", ...data });
  } catch (error) {
    console.error("Patient visits fetch error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * GET /api/v1/patients/:patientId/prescriptions
 */
async function getPatientPrescriptionsEndpoint(req, res, next) {
  try {
    const patientId = req.params.patientId;
    const hospitalId = req.query.hospital_id || req.query.tenant_id;
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);

    const data = await getPatientPrescriptions(patientId, hospitalId, { page, limit });
    return res.status(200).json({ status: "success", ...data });
  } catch (error) {
    console.error("Patient prescriptions fetch error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * GET /api/v1/patients/:patientId/reports
 */
async function getPatientReportsEndpoint(req, res, next) {
  try {
    const patientId = req.params.patientId;
    const hospitalId = req.query.hospital_id || req.query.tenant_id;

    const data = await getPatientReports(patientId, hospitalId);
    return res.status(200).json({ status: "success", ...data });
  } catch (error) {
    console.error("Patient reports fetch error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

module.exports = {
  getPatientHistoryEndpoint,
  getTicketPatientHistoryEndpoint,
  getPatientHistorySummaryEndpoint,
  getPatientVisitsEndpoint,
  getPatientPrescriptionsEndpoint,
  getPatientReportsEndpoint,
};

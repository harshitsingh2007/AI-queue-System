/**
 * doctor.routes.js
 * ----------------
 * Doctor duty status endpoints: Active, On Break, Emergency Round, Off Duty.
 */

const express = require("express");
const { optionalAuth } = require("../middleware/auth");
const { getDoctorDutyStatus, setDoctorDutyStatus } = require("../services/ticketService");
const { getDoctorShiftSummary } = require("../services/doctorService");

const router = express.Router();

/**
 * GET /api/v1/doctor/shift-summary
 * Query params: doctor_id, doctor_email, doctor_name, tenant_id, days
 * Returns today's consulted count, avg duration, transfers breakdown, and last 7-day analytics.
 */
router.get("/doctor/shift-summary", optionalAuth, async (req, res) => {
  try {
    const doctorId = req.query.doctor_id || req.user?.id || null;
    const doctorEmail = req.query.doctor_email || req.user?.email || null;
    const doctorName = req.query.doctor_name || req.user?.name || req.user?.username || null;
    const tenantId = req.query.tenant_id || req.user?.primary_hospital_code || "city-hospital-01";
    const days = parseInt(req.query.days || "7", 10) || 7;

    const summaryData = await getDoctorShiftSummary({
      tenantId,
      doctorId,
      doctorEmail,
      doctorName,
      days,
    });

    return res.json({
      status: "success",
      summary: summaryData,
    });
  } catch (err) {
    console.error("[Doctor Shift Summary Route Error]", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
});

/**
 * GET /api/v1/doctor/duty-status/:identifier
 * identifier can be doctor user_id or email
 */
router.get("/doctor/duty-status/:identifier", optionalAuth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const dutyInfo = getDoctorDutyStatus(identifier, identifier);
    // dutyInfo is null if no status has been set — frontend should keep its localStorage value
    return res.json({
      status: "success",
      duty: dutyInfo, // may be null
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});


/**
 * PUT /api/v1/doctor/duty-status
 * POST /api/v1/doctor/duty-status
 * Body: { doctor_id, doctor_email, status, break_type, note, tenant_id }
 */
const updateDutyStatusHandler = async (req, res) => {
  try {
    const {
      doctor_id,
      doctor_email,
      status,
      break_type,
      note,
      doctor_name,
      tenant_id,
    } = req.body;

    const identifier = doctor_id || doctor_email || req.user?.id || req.user?.email;
    if (!identifier) {
      return res.status(400).json({ status: "error", message: "Doctor identifier (id or email) is required." });
    }

    const updated = await setDoctorDutyStatus(identifier, {
      status,
      break_type,
      note,
      doctor_name,
      userId: doctor_id || req.user?.id,
      email: doctor_email || req.user?.email,
    });

    // Broadcast update via Socket.IO if available
    const io = req.app.get("io");
    if (io) {
      const payload = {
        doctor_id: doctor_id || req.user?.id,
        doctor_email: doctor_email || req.user?.email,
        doctor_name: doctor_name || updated.doctor_name,
        duty: updated,
        tenant_id: tenant_id || "city-hospital-01",
      };
      if (tenant_id) {
        io.to(tenant_id).emit("doctor_duty_status_changed", payload);
      } else {
        io.emit("doctor_duty_status_changed", payload);
      }
    }

    return res.json({
      status: "success",
      message: `Doctor duty status updated to ${updated.status}`,
      duty: updated,
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

router.put("/doctor/duty-status", optionalAuth, updateDutyStatusHandler);
router.post("/doctor/duty-status", optionalAuth, updateDutyStatusHandler);

module.exports = router;

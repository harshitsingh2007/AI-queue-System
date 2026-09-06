/**
 * appointment.controller.js
 * --------------------------
 * Appointment Scheduling & Daily Check-in Controllers.
 */

const {
  bookAppointment,
  checkInAppointment,
  getUserAppointments,
  getTenantAppointments,
} = require("../services/appointmentService");
const { verifyFamilyMemberOwnership } = require("../services/familyService");
const { getIo, broadcastQueueUpdate } = require("../socket");

async function bookAppointmentEndpoint(req, res, next) {
  try {
    const {
      tenant_id = "city-hospital-01",
      consumer_type = "hospital",
      service_category,
      patient_name,
      user_email = "",
      appointment_date,
      time_slot,
      family_member_id = null,
    } = req.body;

    let patientId = null;
    if (family_member_id && (user_email || req.user?.email)) {
      const emailToCheck = user_email || req.user?.email;
      const fm = await verifyFamilyMemberOwnership(emailToCheck, family_member_id);
      patientId = fm.patient_id;
    }

    const appointment = await bookAppointment({
      tenantId: tenant_id,
      consumerType: consumer_type,
      serviceCategory: service_category,
      patientName: patient_name,
      userEmail: user_email || req.user?.email || "",
      appointmentDate: appointment_date,
      timeSlot: time_slot,
      patientId,
    });

    return res.status(200).json({
      status: "success",
      appointment,
    });
  } catch (error) {
    next(error);
  }
}

async function checkInAppointmentEndpoint(req, res, next) {
  try {
    const { appointment_id } = req.body;
    if (!appointment_id) {
      return res.status(400).json({ status: "error", message: "Appointment ID is required." });
    }

    const result = await checkInAppointment(appointment_id);
    const io = getIo();
    if (io) {
      await broadcastQueueUpdate(io, result.appointment.tenant_id);
    }

    return res.status(200).json({
      status: "success",
      appointment: result.appointment,
      ticket: result.ticket,
    });
  } catch (error) {
    next(error);
  }
}

async function getUserAppointmentsEndpoint(req, res, next) {
  try {
    const email = req.params.email;
    const name = req.query.name;

    let results = await getUserAppointments(email);
    if (results.length === 0 && name && name.trim().toLowerCase() !== email.trim().toLowerCase()) {
      results = await getUserAppointments(name);
    }

    return res.status(200).json({
      appointments: results,
    });
  } catch (error) {
    next(error);
  }
}

async function getTenantAppointmentsEndpoint(req, res, next) {
  try {
    const tenantId = req.params.tenant_id;
    const department = req.query.department || null;
    const activeOnly = req.query.active_only === "true";

    const appointments = await getTenantAppointments(tenantId, department, activeOnly);
    return res.status(200).json({
      appointments,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  bookAppointmentEndpoint,
  checkInAppointmentEndpoint,
  getUserAppointmentsEndpoint,
  getTenantAppointmentsEndpoint,
};

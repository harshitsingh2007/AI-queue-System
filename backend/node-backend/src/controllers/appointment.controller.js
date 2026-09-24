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
  cancelAppointment,
} = require("../services/appointmentService");
const { verifyFamilyMemberOwnership, resolveOrCreateFamilyMember } = require("../services/familyService");
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
      const fm = await resolveOrCreateFamilyMember({
        userEmailOrId: emailToCheck,
        memberId: family_member_id,
        name: patient_name,
      });
      if (fm) {
        patientId = fm.patient_id;
      }
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

async function cancelAppointmentEndpoint(req, res, next) {
  try {
    const aptId = req.params.appointment_id || req.body?.appointment_id;
    const reason = req.body?.reason || "Patient requested cancellation";
    const requesterEmail = req.user?.email || req.headers["x-user-email"] || null;

    if (!aptId) {
      return res.status(400).json({ status: "error", message: "Appointment ID is required." });
    }

    const result = await cancelAppointment(aptId, reason, requesterEmail);

    const io = getIo();
    if (io) {
      io.emit("appointment_updated", { appointment_id: aptId, status: "cancelled", reason });
      if (result.ticket_id) {
        io.emit("ticket_cancelled", { ticket_id: result.ticket_id });
      }
      io.emit("queue_updated", { timestamp: new Date().toISOString() });
    }

    return res.status(200).json({
      status: "success",
      message: `Appointment ${aptId} cancelled successfully.`,
      appointment: result,
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
  cancelAppointmentEndpoint,
};

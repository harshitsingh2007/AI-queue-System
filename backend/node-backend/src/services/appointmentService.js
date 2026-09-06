/**
 * appointmentService.js
 * ----------------------
 * Hybrid Appointment Scheduling & Daily Check-in Engine.
 */

const crypto = require("crypto");
const prisma = require("../config/prisma");
const engine = require("./queueEngine");
const { joinQueue } = require("./ticketService");
const { getCurrentQueueDate, parseQueueDate, queueDateToPrismaDate, dtToEpoch } = require("../utils/timezone");
const { PRIORITY_ROUTINE } = require("../utils/clinicalComplexity");

/**
 * Books a clinical appointment for a patient or dependent family member.
 */
async function bookAppointment({
  tenantId = "city-hospital-01",
  consumerType = "hospital",
  serviceCategory = "consultation",
  patientName = "Patient",
  userEmail = "",
  appointmentDate,
  timeSlot,
  patientId = null,
}) {
  const aptId = `APT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const deptCode = String(serviceCategory || "consultation").trim().toLowerCase();
  const qDateStr = parseQueueDate(appointmentDate);
  const qDateObj = queueDateToPrismaDate(qDateStr);

  const hid = await engine.resolveHospitalId(tenantId);
  const deptId = await engine.resolveDepartmentId(hid, deptCode);

  let pid = patientId;
  if (!pid) {
    pid = await engine.resolvePatientId(userEmail, patientName);
  }

  const appointment = await prisma.appointments.create({
    data: {
      appointment_id: aptId,
      hospital_id: hid,
      patient_id: pid,
      department_id: deptId,
      consumer_type: consumerType || "hospital",
      service_category: deptCode,
      appointment_date: qDateObj,
      time_slot: timeSlot,
      status: "scheduled",
      ticket_id: "",
    },
    include: {
      hospitals: true,
      patients: true,
      departments: true,
    },
  });

  // Log appointment status history
  await prisma.appointment_status_history.create({
    data: {
      appointment_id: aptId,
      old_status: null,
      new_status: "scheduled",
      reason: "Initial Booking",
    },
  });

  return {
    appointment_id: aptId,
    tenant_id: tenantId,
    patient_name: patientName,
    user_email: userEmail,
    service_category: deptCode,
    appointment_date: qDateStr,
    time_slot: timeSlot,
    status: "scheduled",
  };
}

/**
 * Check-in Appointment: Validates date, transitions status to checked_in, creates today's active ticket.
 */
async function checkInAppointment(appointmentId) {
  const cleanAptId = String(appointmentId || "").trim();
  const apt = await prisma.appointments.findUnique({
    where: { appointment_id: cleanAptId },
    include: {
      hospitals: true,
      patients: {
        include: { users: true },
      },
      departments: true,
    },
  });

  if (!apt) {
    const err = new Error(`Appointment '${cleanAptId}' not found.`);
    err.status = 404;
    throw err;
  }

  if (["completed", "cancelled"].includes(apt.status.toLowerCase())) {
    const err = new Error(`Cannot check in: Appointment status is ${apt.status.toUpperCase()}.`);
    err.status = 400;
    throw err;
  }

  if (apt.status.toLowerCase() === "expired") {
    const err = new Error("Cannot check in: Appointment has expired.");
    err.status = 400;
    throw err;
  }

  const aptDate = parseQueueDate(apt.appointment_date);
  const today = getCurrentQueueDate();

  if (aptDate > today) {
    const err = new Error(
      `Check-in not available yet: Your appointment is scheduled for ${aptDate} at ${apt.time_slot || ""}.`
    );
    err.status = 400;
    throw err;
  }

  if (aptDate < today) {
    const err = new Error(`Cannot check in: Your appointment date (${aptDate}) has expired.`);
    err.status = 400;
    throw err;
  }

  // Generate priority queue ticket for today's active queue
  const ticket = await joinQueue({
    tenantId: apt.hospitals?.hospital_code || "city-hospital-01",
    consumerType: apt.consumer_type || "hospital",
    serviceCategory: apt.service_category || "consultation",
    name: apt.patients?.name || "Patient",
    priorityLevel: PRIORITY_ROUTINE,
    userEmail: apt.patients?.users?.email || "",
    patientId: apt.patient_id,
    queueDate: today,
    appointmentId: cleanAptId,
    status: "waiting",
  });

  await prisma.appointments.update({
    where: { appointment_id: cleanAptId },
    data: {
      status: "checked_in",
      ticket_id: ticket.ticket_id,
      updated_at: new Date(),
    },
  });

  await prisma.appointment_status_history.create({
    data: {
      appointment_id: cleanAptId,
      old_status: apt.status,
      new_status: "checked_in",
      reason: `Checked in as Token #${ticket.ticket_id}`,
    },
  });

  return {
    appointment: {
      ...apt,
      appointment_date: aptDate,
      status: "checked_in",
      ticket_id: ticket.ticket_id,
      tenant_id: apt.hospitals?.hospital_code || "city-hospital-01",
    },
    ticket,
  };
}

/**
 * Retrieves appointments for a given user email, username, or patient name.
 */
async function getUserAppointments(identifier) {
  const cleanId = String(identifier || "").trim().toLowerCase();
  if (!cleanId) return [];

  // 1. Resolve user ID if exists
  const user = await prisma.users.findFirst({
    where: {
      OR: [{ email: { equals: cleanId, mode: "insensitive" } }, { username: { equals: cleanId, mode: "insensitive" } }],
    },
  });
  const uid = user ? user.id : null;

  const appointments = await prisma.appointments.findMany({
    where: {
      OR: [
        ...(uid
          ? [
              { patients: { user_id: uid } },
              { patients: { family_members: { some: { user_id: uid } } } },
            ]
          : []),
        { patients: { users: { email: { equals: cleanId, mode: "insensitive" } } } },
        { patients: { users: { username: { equals: cleanId, mode: "insensitive" } } } },
        { patients: { name: { equals: cleanId, mode: "insensitive" } } },
      ],
    },
    include: {
      hospitals: true,
      patients: {
        include: { users: true },
      },
      departments: true,
      tickets: true,
    },
    orderBy: { created_at: "desc" },
  });

  return appointments.map((a) => ({
    appointment_id: a.appointment_id,
    tenant_id: a.hospitals?.hospital_code || "city-hospital-01",
    consumer_type: a.consumer_type,
    service_category: a.service_category,
    patient_name: a.patients?.name || "Patient",
    user_email: a.patients?.users?.email || "",
    appointment_date: parseQueueDate(a.appointment_date),
    time_slot: a.time_slot,
    status: a.status,
    ticket_id: a.ticket_id || "",
    created_at: a.created_at ? a.created_at.toISOString() : null,
    prescription_notes: a.tickets[0]?.prescription_notes || "",
  }));
}

/**
 * Retrieves appointments for a given hospital tenant.
 */
async function getTenantAppointments(tenantId, department = null, activeOnly = false) {
  const hid = await engine.resolveHospitalId(tenantId);
  const where = { hospital_id: hid };

  if (department && department !== "all") {
    const deptId = await engine.resolveDepartmentId(hid, department);
    if (deptId) where.department_id = deptId;
  }

  if (activeOnly) {
    where.status = { in: ["scheduled", "checked_in", "waiting", "serving"] };
  }

  const rows = await prisma.appointments.findMany({
    where,
    include: {
      hospitals: true,
      patients: {
        include: { users: true },
      },
    },
    orderBy: [{ appointment_date: "asc" }, { time_slot: "asc" }],
  });

  return rows.map((a) => ({
    appointment_id: a.appointment_id,
    tenant_id: a.hospitals?.hospital_code || tenantId,
    consumer_type: a.consumer_type,
    service_category: a.service_category,
    patient_name: a.patients?.name || "Patient",
    user_email: a.patients?.users?.email || "",
    appointment_date: parseQueueDate(a.appointment_date),
    time_slot: a.time_slot,
    status: a.status,
    ticket_id: a.ticket_id || "",
    created_at: a.created_at ? a.created_at.toISOString() : null,
  }));
}

module.exports = {
  bookAppointment,
  checkInAppointment,
  getUserAppointments,
  getTenantAppointments,
};

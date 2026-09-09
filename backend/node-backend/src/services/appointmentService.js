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
  if (!cleanAptId) {
    const err = new Error("Appointment ID or code is required for check-in.");
    err.status = 400;
    throw err;
  }

  let apt = await prisma.appointments.findUnique({
    where: { appointment_id: cleanAptId },
    include: {
      hospitals: true,
      patients: {
        include: { users: true },
      },
      departments: true,
    },
  });

  // Support prefix-less codes (e.g. '032562D4' -> 'APT-032562D4')
  if (!apt && !cleanAptId.toUpperCase().startsWith("APT-")) {
    apt = await prisma.appointments.findUnique({
      where: { appointment_id: `APT-${cleanAptId.toUpperCase()}` },
      include: {
        hospitals: true,
        patients: {
          include: { users: true },
        },
        departments: true,
      },
    });
  }

  // Case-insensitive lookup fallback
  if (!apt) {
    apt = await prisma.appointments.findFirst({
      where: { appointment_id: { equals: cleanAptId, mode: "insensitive" } },
      include: {
        hospitals: true,
        patients: {
          include: { users: true },
        },
        departments: true,
      },
    });
  }

  if (!apt) {
    const err = new Error(`Appointment '${cleanAptId}' not found. Please verify your appointment code.`);
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

  // If already checked in and has an active ticket, return the existing ticket pass directly
  if (apt.status.toLowerCase() === "checked_in" && apt.ticket_id) {
    const existingTicket = await prisma.tickets.findUnique({
      where: { ticket_id: apt.ticket_id },
    });
    if (existingTicket && !["cancelled", "expired"].includes(existingTicket.status.toLowerCase())) {
      return {
        appointment: {
          ...apt,
          appointment_date: today,
          status: "checked_in",
          ticket_id: apt.ticket_id,
          tenant_id: apt.hospitals?.hospital_code || "city-hospital-01",
        },
        ticket: existingTicket,
      };
    }
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
    appointmentId: apt.appointment_id,
    status: "waiting",
  });

  await prisma.appointments.update({
    where: { appointment_id: apt.appointment_id },
    data: {
      status: "checked_in",
      ticket_id: ticket.ticket_id,
      appointment_date: queueDateToPrismaDate(today),
      updated_at: new Date(),
    },
  });

  const checkInNote = aptDate !== today
    ? `Checked in on ${today} (Original scheduled date: ${aptDate} at ${apt.time_slot || "Slot"}) as Token #${ticket.ticket_id}`
    : `Checked in as Token #${ticket.ticket_id}`;

  await prisma.appointment_status_history.create({
    data: {
      appointment_id: apt.appointment_id,
      old_status: apt.status,
      new_status: "checked_in",
      reason: checkInNote,
    },
  });

  return {
    appointment: {
      ...apt,
      appointment_date: today,
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
      tickets: {
        include: { queue_events: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return appointments.map((a) => {
    const linkedTkt = a.tickets[0];
    const transfers = [];
    if (linkedTkt) {
      if (linkedTkt.transferred_from_dept) {
        transfers.push({
          from_department: linkedTkt.transferred_from_dept,
          to_department: a.service_category,
          ticket_id: linkedTkt.ticket_id,
        });
      }
      if (Array.isArray(linkedTkt.queue_events)) {
        for (const ev of linkedTkt.queue_events) {
          if (ev.event_type === "TRANSFERRED" && ev.metadata) {
            transfers.push({
              from_department: a.service_category,
              to_department: ev.metadata.target_dept || "",
              ticket_id: ev.metadata.transferred_to_ticket || "",
            });
          }
        }
      }
    }

    return {
      appointment_id: a.appointment_id,
      tenant_id: a.hospitals?.hospital_code || "city-hospital-01",
      hospital_code: a.hospitals?.hospital_code || "city-hospital-01",
      hospital_name: a.hospitals?.name || "City General Hospital",
      consumer_type: a.consumer_type,
      service_category: a.service_category,
      patient_name: a.patients?.name || "Patient",
      user_email: a.patients?.users?.email || "",
      appointment_date: parseQueueDate(a.appointment_date),
      time_slot: a.time_slot,
      status: a.status,
      ticket_id: a.ticket_id || "",
      created_at: a.created_at ? a.created_at.toISOString() : null,
      prescription_notes: linkedTkt?.prescription_notes || "",
      transfer_count: transfers.length,
      transfers: transfers,
    };
  });
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

/**
 * queue.controller.js
 * -------------------
 * Real-Time Queue & Counter Lifecycle Controllers.
 */

const engine = require("../services/queueEngine");
const { joinQueue, serveNext, completeTicket, markNoShow } = require("../services/ticketService");
const { verifyFamilyMemberOwnership } = require("../services/familyService");
const { closeAndExpirePreviousDayQueues } = require("../services/dailyClosureService");
const { getIo, broadcastQueueUpdate } = require("../socket");
const { PRIORITY_EMERGENCY, PRIORITY_ROUTINE, PRIORITY_STANDARD } = require("../utils/clinicalComplexity");
const { getCurrentQueueDate, parseQueueDate } = require("../utils/timezone");

function urgencyToPriority(consumerType, urgency) {
  if (consumerType !== "hospital") return PRIORITY_STANDARD;
  if (urgency === "emergency") return PRIORITY_EMERGENCY;
  return PRIORITY_ROUTINE;
}

async function joinQueueEndpoint(req, res, next) {
  try {
    const {
      tenant_id = "city-hospital-01",
      consumer_type = "hospital",
      service_category = "consultation",
      name = "Patient",
      urgency,
      user_email = "",
      age = 30,
      gender = "other",
      medical_condition = "general_checkup",
      pre_existing_condition = "none",
      family_member_id = null,
    } = req.body;

    const priority = urgencyToPriority(consumer_type, urgency);

    let patientId = null;
    if (family_member_id && (user_email || req.user?.email)) {
      const emailToCheck = user_email || req.user?.email;
      const fm = await verifyFamilyMemberOwnership(emailToCheck, family_member_id);
      patientId = fm.patient_id;
    }

    const ticket = await joinQueue({
      tenantId: tenant_id,
      consumerType: consumer_type,
      serviceCategory: service_category,
      name,
      priorityLevel: priority,
      userEmail: user_email || req.user?.email || "",
      age,
      gender,
      medicalCondition: medical_condition,
      preExistingCondition: pre_existing_condition,
      patientId,
    });

    const io = getIo();
    if (io) {
      await broadcastQueueUpdate(io, tenant_id);
    }

    return res.status(200).json({
      status: "success",
      ticket,
    });
  } catch (error) {
    next(error);
  }
}

async function serveNextEndpoint(req, res, next) {
  try {
    const { tenant_id = "city-hospital-01", department, service_category } = req.body;
    const effectiveDept = department || service_category || null;

    const ticket = await serveNext(tenant_id, effectiveDept);
    if (!ticket) {
      return res.status(404).json({
        status: "error",
        message: "No waiting tickets in queue for this department.",
      });
    }

    const io = getIo();
    if (io) {
      io.to(tenant_id).emit("now_serving", { ticket });
      await broadcastQueueUpdate(io, tenant_id);
    }

    return res.status(200).json({
      success: true,
      now_serving: ticket,
    });
  } catch (error) {
    next(error);
  }
}

async function completeEndpoint(req, res, next) {
  try {
    const { tenant_id = "city-hospital-01", ticket_id, department } = req.body;

    const ticket = await completeTicket(tenant_id, ticket_id, department);
    const io = getIo();
    if (io) {
      if (ticket) io.to(tenant_id).emit("ticket_completed", { ticket });
      await broadcastQueueUpdate(io, tenant_id);
    }

    return res.status(200).json({
      success: true,
      ticket: ticket || null,
      completed_ticket: ticket || null,
    });
  } catch (error) {
    next(error);
  }
}

async function noShowEndpoint(req, res, next) {
  try {
    const { tenant_id = "city-hospital-01", ticket_id } = req.body;

    await markNoShow(tenant_id, ticket_id);
    const io = getIo();
    if (io) {
      await broadcastQueueUpdate(io, tenant_id);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function countersEndpoint(req, res, next) {
  try {
    const { tenant_id = "city-hospital-01", active_counters } = req.body;

    const newCount = await engine.setActiveCounters(tenant_id, active_counters);
    const io = getIo();
    if (io) {
      await broadcastQueueUpdate(io, tenant_id);
    }

    return res.status(200).json({
      success: true,
      active_counters: newCount,
    });
  } catch (error) {
    next(error);
  }
}

async function getQueueEndpoint(req, res, next) {
  try {
    const tenantId = req.params.tenant_id;
    const department = req.query.department || null;
    const dateQuery = req.query.date;

    const today = getCurrentQueueDate();
    const isHistorical = dateQuery && String(dateQuery).trim() !== today;

    const snapshot = await engine.getQueueSnapshot(tenantId, department, dateQuery);
    const serving = isHistorical ? [] : await engine.getServingTickets(tenantId, department, dateQuery);

    return res.status(200).json({
      snapshot,
      serving,
      is_historical: !!isHistorical,
      queue_date: String(dateQuery || today),
    });
  } catch (error) {
    next(error);
  }
}

async function getQueueHistoryEndpoint(req, res, next) {
  try {
    const tenantId = req.params.tenant_id;
    const dateQuery = req.query.date || getCurrentQueueDate();
    const department = req.query.department || null;

    const tickets = await engine.getHistoricalQueueTickets(tenantId, dateQuery, department);

    return res.status(200).json({
      status: "success",
      tenant_id: tenantId,
      date: dateQuery,
      department,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    next(error);
  }
}

async function getAnalyticsEndpoint(req, res, next) {
  try {
    const tenantId = req.params.tenant_id;
    const department = req.query.department || null;
    const dateQuery = req.query.date || null;

    const analytics = await engine.getTenantAnalytics(tenantId, department, dateQuery);
    return res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
}

async function triggerDailyClosureEndpoint(req, res, next) {
  try {
    const targetDate = req.body?.target_date || null;
    const hospitalCode = req.body?.hospital_code || req.body?.tenant_id || null;

    if (req.user && !["superadmin", "admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized: Only administrative accounts can trigger daily closure.",
      });
    }

    const result = await closeAndExpirePreviousDayQueues(targetDate, hospitalCode);
    return res.status(200).json({
      status: "success",
      result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  joinQueueEndpoint,
  serveNextEndpoint,
  completeEndpoint,
  noShowEndpoint,
  countersEndpoint,
  getQueueEndpoint,
  getQueueHistoryEndpoint,
  getAnalyticsEndpoint,
  triggerDailyClosureEndpoint,
};

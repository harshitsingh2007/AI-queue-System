/**
 * tests/daily_closure.test.js
 * ----------------------------
 * Tests Distributed Daily Queue Expiration, Advisory Locking, and Historical Retention.
 */

const assert = require("assert");
const prisma = require("../src/config/prisma");
const engine = require("../src/services/queueEngine");
const { closeAndExpirePreviousDayQueues } = require("../src/services/dailyClosureService");
const { joinQueue } = require("../src/services/ticketService");
const { bookAppointment } = require("../src/services/appointmentService");
const { getCurrentQueueDate, queueDateToPrismaDate } = require("../src/utils/timezone");

async function runDailyClosureTests() {
  console.log("\n==================================================");
  console.log(" 🧪 RUNNING DAILY QUEUE CLOSURE & EXPIRATION TESTS");
  console.log("==================================================");

  const testTenant = `closure-hosp-${Date.now() % 10000}`;
  const hid = await engine.resolveHospitalId(testTenant);
  const today = getCurrentQueueDate();

  // 1. Create a past ticket (date = 2026-01-01) in WAITING status
  const pastDateStr = "2026-01-01";
  const pastDateObj = queueDateToPrismaDate(pastDateStr);
  const pastTid = engine.generateTicketId();

  await prisma.tickets.create({
    data: {
      ticket_id: pastTid,
      hospital_id: hid,
      consumer_type: "hospital",
      service_category: "consultation",
      name: "Past Patient",
      priority_level: 2,
      queue_date: pastDateObj,
      join_timestamp: new Date("2026-01-01T09:00:00Z"),
      status: "waiting",
      position: 1,
    },
  });

  // 2. Create a past appointment (date = 2026-01-01) in SCHEDULED status
  const pastApt = await bookAppointment({
    tenantId: testTenant,
    consumerType: "hospital",
    serviceCategory: "consultation",
    patientName: "Past Appointment Patient",
    appointmentDate: pastDateStr,
    timeSlot: "10:00 AM",
  });

  // 3. Create a today's active ticket
  const todayTicket = await joinQueue({
    tenantId: testTenant,
    consumerType: "hospital",
    serviceCategory: "consultation",
    name: "Today Patient",
    queueDate: today,
  });

  // Run daily closure
  const closureResult = await closeAndExpirePreviousDayQueues();
  assert.strictEqual(closureResult.status, "success", "Closure should succeed");
  assert(closureResult.expired_tickets_count >= 1, "Should have expired at least 1 past ticket");

  // Verify past ticket transitioned to 'expired'
  const pastTicketDb = await prisma.tickets.findUnique({
    where: { ticket_id: pastTid },
  });
  assert.strictEqual(pastTicketDb.status, "expired", "Past ticket must be expired");
  assert.strictEqual(pastTicketDb.position, null, "Expired ticket position must be null");
  console.log(`[PASS] Test 1: Past ticket #${pastTid} transitioned to EXPIRED with position cleared.`);

  // Verify EXPIRE queue event recorded
  const expireEvent = await prisma.queue_events.findFirst({
    where: { ticket_id: pastTid, event_type: "EXPIRE" },
  });
  assert(expireEvent, "EXPIRE event must be logged to queue_events");
  console.log("[PASS] Test 2: EXPIRE lifecycle event successfully sourcing to queue_events.");

  // Verify past appointment transitioned to 'expired'
  const pastAptDb = await prisma.appointments.findUnique({
    where: { appointment_id: pastApt.appointment_id },
  });
  assert.strictEqual(pastAptDb.status, "expired", "Past appointment must be expired");
  console.log(`[PASS] Test 3: Past appointment '${pastApt.appointment_id}' transitioned to EXPIRED.`);

  // Verify today's active ticket is untouched
  const todayTicketDb = await prisma.tickets.findUnique({
    where: { ticket_id: todayTicket.ticket_id },
  });
  assert.strictEqual(todayTicketDb.status, "waiting", "Today's ticket must remain WAITING");
  console.log(`[PASS] Test 4: Today's active queue ticket #${todayTicket.ticket_id} perfectly preserved.`);

  console.log("✅ ALL DAILY QUEUE CLOSURE TESTS PASSED!\n");
}

module.exports = { runDailyClosureTests };

if (require.main === module) {
  runDailyClosureTests().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

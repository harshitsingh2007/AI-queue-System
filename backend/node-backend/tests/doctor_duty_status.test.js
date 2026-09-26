/**
 * tests/doctor_duty_status.test.js
 * --------------------------------
 * Verifies Doctor Duty Status toggle, break timer timestamps,
 * and automatic queue engine calling rejection during breaks.
 */

const assert = require("assert");
const prisma = require("../src/config/prisma");
const engine = require("../src/services/queueEngine");
const ticketService = require("../src/services/ticketService");
const bcrypt = require("bcrypt");

async function runDoctorDutyStatusTests() {
  console.log("\n==================================================");
  console.log(" 🧪 RUNNING DOCTOR DUTY STATUS & BREAK GUARD TESTS");
  console.log("==================================================");

  const testSuffix = Date.now();
  const hospCode = `hosp-duty-${testSuffix}`;

  // 1. Create Hospital, Department, and Active Doctor
  const hosp = await prisma.hospitals.create({
    data: {
      hospital_code: hospCode,
      name: `Hospital Duty ${testSuffix}`,
      status: "active",
    },
  });

  const dept = await prisma.departments.create({
    data: {
      hospital_id: hosp.id,
      dept_code: "GEN_OPD",
      name: "General OPD",
      status: "active",
    },
  });

  const userDoc = await prisma.users.create({
    data: {
      username: `docduty_${testSuffix}`,
      email: `duty.doc.${testSuffix}@hospital.com`,
      password_hash: await bcrypt.hash("pass123", 10),
      role: "doctor",
      status: "active",
      last_login_at: new Date(),
    },
  });

  const empDoc = await prisma.employees.create({
    data: {
      hospital_id: hosp.id,
      department_id: dept.id,
      user_id: userDoc.id,
      employee_code: `EMP-DUTY-${testSuffix}`,
      name: "Dr. Duty Specialist",
      email: userDoc.email,
      status: "active",
    },
  });

  // 2. Test initial status is null (unset on server to preserve doctor's preferred status across login/logout)
  const initDuty = ticketService.getDoctorDutyStatus(userDoc.id, userDoc.email);
  assert.strictEqual(initDuty, null, "Initial status should be null (unset on server to preserve client preference)");
  console.log("[PASS] Test 1: Initial doctor duty status is unset (null) to preserve login/logout preference.");

  // 3. Test changing status to ON_BREAK
  const breakStart = Date.now();
  const breakDuty = await ticketService.setDoctorDutyStatus(userDoc.id, {
    status: "ON_BREAK",
    break_type: "tea",
    doctor_name: empDoc.name,
    email: userDoc.email,
  });
  assert.strictEqual(breakDuty.status, "ON_BREAK", "Status must update to ON_BREAK");
  assert(breakDuty.status_changed_at >= breakStart, "Timestamp must be recorded for break timer");
  console.log("[PASS] Test 2: Status updated to ON_BREAK with valid timer timestamp.");

  // 4. Enqueue a patient
  const ticket = await ticketService.joinQueue({
    tenantId: hospCode,
    consumerType: "hospital",
    name: "Waiting Patient",
    phone: "9123456780",
    serviceCategory: "General OPD",
    priorityLevel: 2,
  });
  assert(ticket && ticket.ticket_id, "Ticket created successfully");
  console.log(`[PASS] Test 3: Enqueued patient ticket #${ticket.ticket_id}.`);

  // 5. serveNext MUST reject because doctor is ON_BREAK
  try {
    await ticketService.serveNext(hospCode, "General OPD", null, {
      id: userDoc.id,
      name: empDoc.name,
      email: userDoc.email,
    });
    assert.fail("serveNext should have thrown DOCTOR_ON_BREAK");
  } catch (err) {
    assert.strictEqual(err.code, "DOCTOR_ON_BREAK", `Expected DOCTOR_ON_BREAK, got: ${err.code} - ${err.message}`);
    assert(err.status_changed_at, "Error should carry status_changed_at for client display");
    console.log("[PASS] Test 4: serveNext rejected patient assignment with DOCTOR_ON_BREAK error.");
  }

  // 6. Test EMERGENCY_ROUND also blocks calling
  await ticketService.setDoctorDutyStatus(userDoc.id, {
    status: "EMERGENCY_ROUND",
    break_type: "emergency",
    email: userDoc.email,
  });
  try {
    await ticketService.serveNext(hospCode, "General OPD", null, {
      id: userDoc.id,
      name: empDoc.name,
      email: userDoc.email,
    });
    assert.fail("serveNext should have thrown DOCTOR_ON_BREAK for EMERGENCY_ROUND");
  } catch (err) {
    assert.strictEqual(err.code, "DOCTOR_ON_BREAK");
    console.log("[PASS] Test 5: serveNext rejected patient assignment during EMERGENCY_ROUND.");
  }

  // 7. Test switching back to ACTIVE permits serveNext to succeed!
  await ticketService.setDoctorDutyStatus(userDoc.id, {
    status: "ACTIVE",
    email: userDoc.email,
  });
  const activeDuty = ticketService.getDoctorDutyStatus(userDoc.id, userDoc.email);
  assert.strictEqual(activeDuty.status, "ACTIVE");

  const servedTicket = await ticketService.serveNext(hospCode, "General OPD", null, {
    id: userDoc.id,
    name: empDoc.name,
    email: userDoc.email,
  });
  assert(servedTicket, "Ticket should now be successfully served");
  assert.strictEqual(servedTicket.status, "serving");
  assert.strictEqual(servedTicket.ticket_id, ticket.ticket_id);
  console.log(`[PASS] Test 6: Switching back to ACTIVE allowed patient #${servedTicket.ticket_id} to be served!`);

  // Clean up test data
  await prisma.tickets.deleteMany({ where: { hospital_id: hosp.id } });
  await prisma.queue_events.deleteMany({ where: { hospital_id: hosp.id } });
  await prisma.employees.deleteMany({ where: { hospital_id: hosp.id } });
  await prisma.departments.deleteMany({ where: { hospital_id: hosp.id } });
  await prisma.users.deleteMany({ where: { id: userDoc.id } });
  await prisma.hospitals.deleteMany({ where: { id: hosp.id } });

  console.log("✅ ALL DOCTOR DUTY STATUS & BREAK GUARD TESTS PASSED!\n");
}

module.exports = { runDoctorDutyStatusTests };

if (require.main === module) {
  prisma.$connect().then(runDoctorDutyStatusTests).finally(() => prisma.$disconnect());
}

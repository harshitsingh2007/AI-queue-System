/**
 * tests/doctor_availability.test.js
 * ---------------------------------
 * Rigorous backend enforcement tests for:
 * 1. Inactive doctor assignment rejection (Super Admin Portal & Queue Engine)
 * 2. Hospital isolation enforcement (zero cross-tenant doctor or desk assignment)
 * 3. Successful assignment only when doctor is genuinely active and in the same hospital
 */

const assert = require("assert");
const prisma = require("../src/config/prisma");
const engine = require("../src/services/queueEngine");
const ticketService = require("../src/services/ticketService");
const hospitalService = require("../src/services/hospitalService");
const bcrypt = require("bcrypt");

async function runDoctorAvailabilityTests() {
  console.log("\n==================================================");
  console.log(" 🧪 RUNNING DOCTOR AVAILABILITY & ISOLATION TESTS");
  console.log("==================================================");

  const testSuffix = Date.now();
  const hospCodeA = `hosp-avail-a-${testSuffix}`;
  const hospCodeB = `hosp-avail-b-${testSuffix}`;

  // 1. Create Hospital A and Hospital B
  const hospA = await prisma.hospitals.create({
    data: {
      hospital_code: hospCodeA,
      name: `Hospital Alpha ${testSuffix}`,
      status: "active",
    },
  });

  const hospB = await prisma.hospitals.create({
    data: {
      hospital_code: hospCodeB,
      name: `Hospital Beta ${testSuffix}`,
      status: "active",
    },
  });

  // Create Departments
  const deptA = await prisma.departments.create({
    data: {
      hospital_id: hospA.id,
      dept_code: "GEN_MED",
      name: "General Medicine",
      status: "active",
    },
  });

  const deptB = await prisma.departments.create({
    data: {
      hospital_id: hospB.id,
      dept_code: "GEN_MED",
      name: "General Medicine",
      status: "active",
    },
  });

  // 2. Create Doctors
  // Doc 1 (Hosp A) - INACTIVE (logged out / stale session)
  const userDoc1 = await prisma.users.create({
    data: {
      username: `doc1_${testSuffix}`,
      email: `inactive.doc.${testSuffix}@hospa.com`,
      password_hash: await bcrypt.hash("pass123", 10),
      role: "doctor",
      status: "inactive", // user marked inactive
      last_login_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago (expired)
    },
  });
  const empDoc1 = await prisma.employees.create({
    data: {
      hospital_id: hospA.id,
      department_id: deptA.id,
      user_id: userDoc1.id,
      employee_code: `EMP-INACT-${testSuffix}`,
      name: "Dr. Inactive Alpha",
      email: userDoc1.email,
      status: "inactive",
    },
  });

  // Doc 2 (Hosp A) - ACTIVE (currently logged in)
  const userDoc2 = await prisma.users.create({
    data: {
      username: `doc2_${testSuffix}`,
      email: `active.doc.${testSuffix}@hospa.com`,
      password_hash: await bcrypt.hash("pass123", 10),
      role: "doctor",
      status: "active",
      last_login_at: new Date(), // Just logged in
    },
  });
  const empDoc2 = await prisma.employees.create({
    data: {
      hospital_id: hospA.id,
      department_id: deptA.id,
      user_id: userDoc2.id,
      employee_code: `EMP-ACT-${testSuffix}`,
      name: "Dr. Active Alpha",
      email: userDoc2.email,
      status: "active",
    },
  });

  // Doc 3 (Hosp B) - ACTIVE (belongs to Hospital B)
  const userDoc3 = await prisma.users.create({
    data: {
      username: `doc3_${testSuffix}`,
      email: `active.doc.${testSuffix}@hospb.com`,
      password_hash: await bcrypt.hash("pass123", 10),
      role: "doctor",
      status: "active",
      last_login_at: new Date(),
    },
  });
  const empDoc3 = await prisma.employees.create({
    data: {
      hospital_id: hospB.id,
      department_id: deptB.id,
      user_id: userDoc3.id,
      employee_code: `EMP-BETA-${testSuffix}`,
      name: "Dr. Active Beta",
      email: userDoc3.email,
      status: "active",
    },
  });

  // 3. Create Desks in Hospital A and Hospital B
  const deskA1 = await prisma.desks.create({
    data: {
      hospital_id: hospA.id,
      department_id: deptA.id,
      desk_number: 101,
      desk_name: "Desk 101 Alpha",
      status: "ACTIVE",
    },
  });

  const deskB1 = await prisma.desks.create({
    data: {
      hospital_id: hospB.id,
      department_id: deptB.id,
      desk_number: 201,
      desk_name: "Desk 201 Beta",
      status: "ACTIVE",
    },
  });

  // ---------------------------------------------------------------------------
  // TEST 1: Super Admin desk assignment rejects INACTIVE doctor
  // ---------------------------------------------------------------------------
  try {
    await hospitalService.assignHospitalDesk(hospCodeA, deskA1.id, empDoc1.id);
    assert.fail("Should have rejected assigning inactive doctor to desk");
  } catch (err) {
    assert.strictEqual(err.code, "EMPLOYEE_INACTIVE", `Expected EMPLOYEE_INACTIVE, got ${err.code}: ${err.message}`);
    console.log("[PASS] Test 1: Super Admin desk assignment rejects INACTIVE doctor (HTTP 409 EMPLOYEE_INACTIVE).");
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Super Admin desk assignment rejects CROSS-HOSPITAL doctor
  // ---------------------------------------------------------------------------
  try {
    await hospitalService.assignHospitalDesk(hospCodeA, deskA1.id, empDoc3.id);
    assert.fail("Should have rejected assigning Hospital B doctor to Hospital A desk");
  } catch (err) {
    assert.strictEqual(
      err.code,
      "HOSPITAL_ISOLATION_VIOLATION",
      `Expected HOSPITAL_ISOLATION_VIOLATION, got ${err.code}: ${err.message}`
    );
    console.log("[PASS] Test 2: Super Admin desk assignment rejects cross-hospital doctor (HTTP 403 HOSPITAL_ISOLATION_VIOLATION).");
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Enqueue patient in Hospital A
  // ---------------------------------------------------------------------------
  const ticket1 = await ticketService.joinQueue({
    tenantId: hospCodeA,
    consumerType: "hospital",
    name: "Patient One",
    phone: "9876543210",
    serviceCategory: "General Medicine",
    priorityLevel: 2,
  });
  assert(ticket1 && ticket1.ticket_id, "Ticket should be created");
  console.log(`[PASS] Test 3: Enqueued patient ticket #${ticket1.ticket_id} in Hospital A.`);

  // ---------------------------------------------------------------------------
  // TEST 4: serveNext rejects INACTIVE doctor assignment
  // ---------------------------------------------------------------------------
  try {
    await ticketService.serveNext(hospCodeA, {
      docId: userDoc1.id,
      docEmail: userDoc1.email,
    });
    assert.fail("Should have rejected serving patient with inactive doctor");
  } catch (err) {
    assert.strictEqual(err.code, "DOCTOR_INACTIVE", `Expected DOCTOR_INACTIVE, got ${err.code}: ${err.message}`);
    // Verify ticket was NOT assigned and is still in waiting status
    const tCheck = await ticketService.getTicketDetails(ticket1.ticket_id, hospCodeA);
    assert.strictEqual(tCheck.status, "waiting", "Ticket must remain waiting in queue!");
    console.log("[PASS] Test 4: serveNext rejects INACTIVE doctor assignment (HTTP 409 DOCTOR_INACTIVE), ticket remains in queue.");
  }

  // ---------------------------------------------------------------------------
  // TEST 5: serveNext rejects CROSS-HOSPITAL doctor
  // ---------------------------------------------------------------------------
  try {
    await ticketService.serveNext(hospCodeA, {
      docId: userDoc3.id,
      docEmail: userDoc3.email,
    });
    assert.fail("Should have rejected serving patient with Hospital B doctor in Hospital A");
  } catch (err) {
    assert.strictEqual(
      err.code,
      "HOSPITAL_ISOLATION_VIOLATION",
      `Expected HOSPITAL_ISOLATION_VIOLATION, got ${err.code}: ${err.message}`
    );
    console.log("[PASS] Test 5: serveNext rejects cross-hospital doctor (HTTP 403 HOSPITAL_ISOLATION_VIOLATION).");
  }

  // ---------------------------------------------------------------------------
  // TEST 6: serveNext rejects Desk without assigned doctor
  // ---------------------------------------------------------------------------
  try {
    await ticketService.serveNext(hospCodeA, {
      deskId: deskA1.id,
    });
    assert.fail("Should have rejected calling patient to unassigned desk");
  } catch (err) {
    assert.strictEqual(err.code, "DESK_UNASSIGNED", `Expected DESK_UNASSIGNED, got ${err.code}: ${err.message}`);
    console.log("[PASS] Test 6: serveNext rejects desk without doctor assigned (HTTP 409 DESK_UNASSIGNED).");
  }

  // ---------------------------------------------------------------------------
  // TEST 7: serveNext rejects Desk belonging to Hospital B in Hospital A
  // ---------------------------------------------------------------------------
  try {
    await ticketService.serveNext(hospCodeA, {
      deskId: deskB1.id,
    });
    assert.fail("Should have rejected desk from another hospital");
  } catch (err) {
    assert.strictEqual(
      err.code,
      "HOSPITAL_ISOLATION_VIOLATION",
      `Expected HOSPITAL_ISOLATION_VIOLATION, got ${err.code}: ${err.message}`
    );
    console.log("[PASS] Test 7: serveNext rejects cross-hospital desk (HTTP 403 HOSPITAL_ISOLATION_VIOLATION).");
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Assign ACTIVE doctor to desk & serveNext succeeds
  // ---------------------------------------------------------------------------
  const assignedDesk = await hospitalService.assignHospitalDesk(hospCodeA, deskA1.id, empDoc2.id);
  assert(assignedDesk && assignedDesk.assigned_employee_id === empDoc2.id, "Desk assigned to active doctor");
  console.log("[PASS] Test 8a: Super Admin successfully assigned ACTIVE doctor to desk.");

  const servedTicket = await ticketService.serveNext(hospCodeA, {
    deskId: deskA1.id,
  });
  assert(servedTicket, "Ticket should be served");
  assert.strictEqual(servedTicket.status, "serving");
  assert.strictEqual(servedTicket.ticket_id, ticket1.ticket_id);
  assert.strictEqual(String(servedTicket.served_by_doctor_id), String(userDoc2.id));
  console.log(`[PASS] Test 8b: serveNext successfully assigned patient #${servedTicket.ticket_id} to ACTIVE doctor Dr. Active Alpha.`);

  // Clean up test data
  await prisma.tickets.deleteMany({ where: { hospital_id: hospA.id } });
  await prisma.queue_events.deleteMany({ where: { hospital_id: hospA.id } });
  await prisma.desks.deleteMany({ where: { hospital_id: { in: [hospA.id, hospB.id] } } });
  await prisma.employees.deleteMany({ where: { hospital_id: { in: [hospA.id, hospB.id] } } });
  await prisma.departments.deleteMany({ where: { hospital_id: { in: [hospA.id, hospB.id] } } });
  await prisma.users.deleteMany({ where: { id: { in: [userDoc1.id, userDoc2.id, userDoc3.id] } } });
  await prisma.hospitals.deleteMany({ where: { id: { in: [hospA.id, hospB.id] } } });

  console.log("✅ ALL DOCTOR AVAILABILITY & ISOLATION TESTS PASSED!\n");
}

module.exports = { runDoctorAvailabilityTests };

if (require.main === module) {
  prisma.$connect().then(runDoctorAvailabilityTests).finally(() => prisma.$disconnect());
}

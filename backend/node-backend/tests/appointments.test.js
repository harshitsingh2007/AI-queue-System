/**
 * tests/appointments.test.js
 * --------------------------
 * Unit & Integration verification for Appointment Booking, Validation & Daily Check-in.
 */

const assert = require("assert");
const {
  bookAppointment,
  checkInAppointment,
  getUserAppointments,
  getTenantAppointments,
} = require("../src/services/appointmentService");
const { signupPatient } = require("../src/controllers/auth.controller");
const { getCurrentQueueDate, formatQueueDate } = require("../src/utils/timezone");
const prisma = require("../src/config/prisma");

async function runAppointmentTests() {
  console.log("\n==================================================");
  console.log(" 🧪 RUNNING APPOINTMENTS & CHECK-IN TESTS");
  console.log("==================================================");

  const testTenant = `apt-hosp-${Date.now() % 10000}`;
  const patientEmail = `apt_patient_${Date.now()}@example.com`;
  const todayStr = getCurrentQueueDate();

  // Register patient account first
  let signupRes = null;
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        signupRes = { statusCode: code, ...data };
      },
    }),
  };

  await signupPatient(
    {
      body: {
        email: patientEmail,
        username: "Test Appointment Patient",
        password: "Password123!",
        phone: "+1 555-999-0000",
      },
    },
    mockRes,
    () => {}
  );

  // 1. Book a Future Appointment (safe offset regardless of UTC midnight boundary)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 2);
  const tomorrowStr = futureDate.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

  const futureApt = await bookAppointment({
    tenantId: testTenant,
    consumerType: "hospital",
    serviceCategory: "consultation",
    patientName: "Future Patient",
    userEmail: patientEmail,
    appointmentDate: tomorrowStr,
    timeSlot: "10:30 AM",
  });

  assert.strictEqual(futureApt.status, "scheduled", "Future appointment should be scheduled");
  console.log(`[PASS] Test 1: Future appointment '${futureApt.appointment_id}' booked for ${tomorrowStr}.`);

  // 2. Attempt Early Check-In for Future Appointment (Must Reject)
  let earlyCheckInRejected = false;
  try {
    await checkInAppointment(futureApt.appointment_id);
  } catch (err) {
    earlyCheckInRejected = true;
    assert.ok(err.message.includes("not available yet"), "Should reject early check-in");
  }
  assert.strictEqual(earlyCheckInRejected, true, "Early check-in for future appointment must be rejected");
  console.log("[PASS] Test 2: Early check-in for future appointment strictly rejected.");

  // 3. Book a Today's Appointment
  const todayApt = await bookAppointment({
    tenantId: testTenant,
    consumerType: "hospital",
    serviceCategory: "consultation",
    patientName: "Today Patient",
    userEmail: patientEmail,
    appointmentDate: todayStr,
    timeSlot: "11:00 AM",
  });
  console.log(`[PASS] Test 3: Today's appointment '${todayApt.appointment_id}' booked for ${todayStr}.`);

  // 4. Valid Check-in for Today's Appointment (Generates Today's Active Queue Ticket)
  const checkInResult = await checkInAppointment(todayApt.appointment_id);
  assert.strictEqual(checkInResult.appointment.status, "checked_in", "Status must transition to checked_in");
  assert.ok(checkInResult.ticket.ticket_id, "Check-in must generate a valid ticket ID");
  assert.strictEqual(checkInResult.ticket.status, "waiting", "Generated ticket must be waiting");
  console.log(`[PASS] Test 4: Checked in appointment '${todayApt.appointment_id}' -> Ticket #${checkInResult.ticket.ticket_id}.`);

  // 5. Query User Appointments & Tenant Appointments
  const userApts = await getUserAppointments(patientEmail);
  assert.ok(userApts.length >= 2, "User should have at least 2 booked appointments");
  const tenantApts = await getTenantAppointments(testTenant);
  assert.ok(tenantApts.length >= 2, "Tenant should have at least 2 booked appointments");
  console.log(`[PASS] Test 5: Appointments retrieval verified for user '${patientEmail}' and tenant '${testTenant}'.`);

  console.log("✅ ALL APPOINTMENT TESTS PASSED!\n");
}

module.exports = { runAppointmentTests };

if (require.main === module) {
  runAppointmentTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Appointment Test Failed:", err);
      process.exit(1);
    });
}

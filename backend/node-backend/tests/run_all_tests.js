/**
 * tests/run_all_tests.js
 * ----------------------
 * Master Test Suite Runner for Node.js Backend Migration.
 */

const { runAuthIsolationTests } = require("./auth_isolation.test");
const { runFamilyProfileTests } = require("./family_profiles.test");
const { runQueueLifecycleTests } = require("./queue_lifecycle.test");
const { runCancellationAdjustmentTests } = require("./cancellation_adjustment.test");
const { runDailyClosureTests } = require("./daily_closure.test");
const { runAppointmentTests } = require("./appointments.test");
const { runSocketTests } = require("./socket.test");
const { runDoctorAvailabilityTests } = require("./doctor_availability.test");
const prisma = require("../src/config/prisma");
const engine = require("../src/services/queueEngine");

async function runMasterTestSuite() {
  console.log("================================================================================");
  console.log(" 🚀 STARTING FULL END-TO-END BACKEND TEST SUITE (NODE.JS + PRISMA + POSTGRESQL)");
  console.log("================================================================================");

  const startTime = Date.now();

  try {
    await prisma.$connect();
    await engine.hydrateFromDb();

    await runAuthIsolationTests();
    await runFamilyProfileTests();
    await runQueueLifecycleTests();
    await runCancellationAdjustmentTests();
    await runDailyClosureTests();
    await runAppointmentTests();
    await runDoctorAvailabilityTests();
    await runSocketTests();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("================================================================================");
    console.log(` 🎉 ALL 8 TEST SUITES COMPLETED SUCCESSFULLY IN ${elapsed}s!`);
    console.log(" 💯 100% OF MIGRATION CONTRACTS & BUSINESS LOGIC VERIFIED AGAINST POSTGRESQL.");
    console.log("================================================================================");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED WITH ERROR:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runMasterTestSuite();
}

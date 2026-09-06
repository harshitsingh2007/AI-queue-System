/**
 * tests/cancellation_adjustment.test.js
 * -------------------------------------
 * Tests Ticket Cancellation, Position Gaps Shifting, and Backward Queue Adjustment Rules.
 */

const assert = require("assert");
const prisma = require("../src/config/prisma");
const engine = require("../src/services/queueEngine");
const {
  joinQueue,
  cancelTicket,
  adjustQueuePosition,
  serveNext,
} = require("../src/services/ticketService");
const { PRIORITY_ROUTINE } = require("../src/utils/clinicalComplexity");

async function runCancellationAdjustmentTests() {
  console.log("\n==================================================");
  console.log(" 🧪 RUNNING CANCELLATION & ADJUSTMENT TESTS");
  console.log("==================================================");

  const testTenant = `adjust-hosp-${Date.now() % 10000}`;

  // 1. Create 3 waiting tickets
  const t1 = await joinQueue({
    tenantId: testTenant,
    consumerType: "hospital",
    serviceCategory: "consultation",
    name: "Patient One",
    priorityLevel: PRIORITY_ROUTINE,
  });

  const t2 = await joinQueue({
    tenantId: testTenant,
    consumerType: "hospital",
    serviceCategory: "consultation",
    name: "Patient Two",
    priorityLevel: PRIORITY_ROUTINE,
  });

  const t3 = await joinQueue({
    tenantId: testTenant,
    consumerType: "hospital",
    serviceCategory: "consultation",
    name: "Patient Three",
    priorityLevel: PRIORITY_ROUTINE,
  });

  assert.strictEqual(t1.position, 1, "T1 should be pos 1");
  assert.strictEqual(t2.position, 2, "T2 should be pos 2");
  assert.strictEqual(t3.position, 3, "T3 should be pos 3");

  // Test 1: Cancel Ticket #2 -> Ticket #3 should shift to position #2
  const cancRes = await cancelTicket(testTenant, t2.ticket_id, "Patient had an emergency elsewhere");
  assert.strictEqual(cancRes.status, "cancelled", "Cancelled ticket status mismatch");

  const snapshotAfterCanc = await engine.getQueueSnapshot(testTenant, "consultation");
  assert.strictEqual(snapshotAfterCanc.length, 2, "Queue should now have 2 waiting tickets");
  assert.strictEqual(snapshotAfterCanc[1].ticket_id, t3.ticket_id, "Ticket #3 should now be in position #2");
  assert.strictEqual(snapshotAfterCanc[1].position, 2, "Position gap was not closed");
  console.log("[PASS] Test 1: Ticket #2 cancelled; subsequent waiting ticket positions shifted correctly.");

  // Test 2: Cannot Cancel Serving Ticket
  const served = await serveNext(testTenant, "consultation");
  let serveCancelError = false;
  try {
    await cancelTicket(testTenant, served.ticket_id, "Try cancelling serving");
  } catch (err) {
    serveCancelError = true;
  }
  assert.strictEqual(serveCancelError, true, "Serving tickets MUST NOT be cancellable");
  console.log("[PASS] Test 2: Active serving tickets correctly protected from cancellation.");

  // Test 3: Backward Queue Adjustment on Waiting Ticket
  const adjRes1 = await adjustQueuePosition(testTenant, t3.ticket_id, 1, null, "Traffic delay");
  assert.strictEqual(adjRes1.success, true, "Adjustment failed");
  assert.strictEqual(adjRes1.adjustment_count, 1, "Adjustment count mismatch");
  assert.strictEqual(adjRes1.remaining_adjustment, 2, "Remaining adjustments mismatch");
  console.log("[PASS] Test 3: Ticket #3 postponed backward by 1 position (Remaining: 2).");

  // Test 4: Second adjustment of 2 positions -> Total 3 (limit reached)
  const adjRes2 = await adjustQueuePosition(testTenant, t3.ticket_id, 2, null, "Doctor consultation running late");
  assert.strictEqual(adjRes2.adjustment_count, 3, "Adjustment count should be 3");
  assert.strictEqual(adjRes2.remaining_adjustment, 0, "Remaining adjustments should be 0");
  console.log("[PASS] Test 4: Ticket #3 postponed backward by 2 positions (Total: 3/3).");

  // Test 5: 4th adjustment attempt -> Must be rejected with 400
  let limitExceeded = false;
  try {
    await adjustQueuePosition(testTenant, t3.ticket_id, 1, null, "Attempt 4th skip");
  } catch (err) {
    limitExceeded = true;
  }
  assert.strictEqual(limitExceeded, true, "MAX_PATIENT_QUEUE_ADJUSTMENT = 3 limit must be enforced");
  console.log("[PASS] Test 5: Maximum 3 adjustment limit strictly enforced.");

  // Test 6: Forward adjustment (skip <= 0) must be rejected
  let forwardError = false;
  try {
    await adjustQueuePosition(testTenant, t3.ticket_id, -1, null, "Try jumping forward");
  } catch (err) {
    forwardError = true;
  }
  assert.strictEqual(forwardError, true, "Negative/zero position adjustments must be rejected");
  console.log("[PASS] Test 6: Forward queue jumping strictly rejected.");

  console.log("✅ ALL CANCELLATION & ADJUSTMENT TESTS PASSED!\n");
}

module.exports = { runCancellationAdjustmentTests };

if (require.main === module) {
  runCancellationAdjustmentTests().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

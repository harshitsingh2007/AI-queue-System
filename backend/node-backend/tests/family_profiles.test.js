/**
 * tests/family_profiles.test.js
 * -----------------------------
 * Tests Family Profile Management, Patient Restrictions, and Ownership Validation.
 */

const assert = require("assert");
const prisma = require("../src/config/prisma");
const {
  addFamilyMember,
  listFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
  verifyFamilyMemberOwnership,
} = require("../src/services/familyService");
const { hashPassword } = require("../src/utils/password");

async function runFamilyProfileTests() {
  console.log("\n==================================================");
  console.log(" 🧪 RUNNING FAMILY PROFILES & DEPENDENTS TESTS");
  console.log("==================================================");

  const ts = Date.now();

  // Create Patient User A
  const pwd = await hashPassword("pass123");
  const userA = await prisma.users.create({
    data: {
      email: `patient_a_${ts}@test.com`,
      username: "Patient Alpha",
      password_hash: pwd,
      role: "user",
      status: "active",
    },
  });

  // Create Patient User B
  const userB = await prisma.users.create({
    data: {
      email: `patient_b_${ts}@test.com`,
      username: "Patient Beta",
      password_hash: pwd,
      role: "user",
      status: "active",
    },
  });

  // Test 1: Add Family Member for User A
  const mem1 = await addFamilyMember({
    userEmailOrId: userA.id,
    name: "Aarav Alpha",
    relation: "Son",
    age: 8,
    gender: "male",
    phone: "+1 555-001-1111",
  });
  assert.strictEqual(mem1.name, "Aarav Alpha", "Family member name mismatch");
  assert.strictEqual(mem1.relation, "Son", "Relation mismatch");
  console.log(`[PASS] Test 1: Patient A added dependent '${mem1.name}' (ID: ${mem1.id}).`);

  // Test 2: List Family Members for User A & User B
  const listA = await listFamilyMembers(userA.id);
  const listB = await listFamilyMembers(userB.id);
  assert.strictEqual(listA.length, 1, "User A should have 1 family member");
  assert.strictEqual(listB.length, 0, "User B should have 0 family members");
  console.log("[PASS] Test 2: Family member listing strictly isolated per patient account.");

  // Test 3: Update Family Member
  const updatedMem = await updateFamilyMember({
    userEmailOrId: userA.id,
    memberId: mem1.id,
    name: "Aarav Alpha Jr.",
    relation: "Son",
    age: 9,
    gender: "male",
  });
  assert.strictEqual(updatedMem.name, "Aarav Alpha Jr.", "Updated name mismatch");
  assert.strictEqual(updatedMem.age, 9, "Updated age mismatch");
  console.log("[PASS] Test 3: Patient A updated dependent profile successfully.");

  // Test 4: Cross-User Unauthorized Access Blockage
  let unauthorizedError = false;
  try {
    // User B attempting to update User A's dependent
    await updateFamilyMember({
      userEmailOrId: userB.id,
      memberId: mem1.id,
      name: "Malicious Update",
      relation: "None",
    });
  } catch (err) {
    unauthorizedError = true;
  }
  assert.strictEqual(unauthorizedError, true, "User B MUST NOT be able to modify User A's dependent");
  console.log("[PASS] Test 4: Cross-patient family profile tampering strictly rejected.");

  // Test 5: Delete Family Member
  await deleteFamilyMember(userA.id, mem1.id);
  const listAAfter = await listFamilyMembers(userA.id);
  assert.strictEqual(listAAfter.length, 0, "Family member was not deleted");
  console.log("[PASS] Test 5: Dependent deleted safely.");

  console.log("✅ ALL FAMILY PROFILE TESTS PASSED!\n");
}

module.exports = { runFamilyProfileTests };

if (require.main === module) {
  runFamilyProfileTests().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

/**
 * familyService.js
 * ----------------
 * Family Profile & Dependent Management Engine.
 * Enforces role=user/patient restrictions and strict patient ownership.
 */

const prisma = require("../config/prisma");
const engine = require("./queueEngine");

/**
 * Verifies that a family member belongs to the authenticated user.
 */
async function verifyFamilyMemberOwnership(userEmailOrId, memberId) {
  let uid = null;
  if (typeof userEmailOrId === "number") {
    uid = userEmailOrId;
  } else {
    const email = String(userEmailOrId || "").trim().toLowerCase();
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: { equals: email, mode: "insensitive" } }, { username: { equals: email, mode: "insensitive" } }],
      },
    });
    if (!user) {
      const err = new Error("Authenticated user not found.");
      err.status = 404;
      throw err;
    }
    uid = user.id;
  }

  const member = await prisma.family_members.findFirst({
    where: {
      id: memberId,
      user_id: uid,
    },
  });

  if (!member) {
    const err = new Error(`Family member '${memberId}' not found or does not belong to your account.`);
    err.status = 404;
    throw err;
  }

  return member;
}

/**
 * Lists family members for authenticated patient user.
 */
async function listFamilyMembers(userEmailOrId) {
  let uid = null;
  if (typeof userEmailOrId === "number") {
    uid = userEmailOrId;
  } else {
    const email = String(userEmailOrId || "").trim().toLowerCase();
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: { equals: email, mode: "insensitive" } }, { username: { equals: email, mode: "insensitive" } }],
      },
    });
    if (!user) return [];
    uid = user.id;
  }

  const rows = await prisma.family_members.findMany({
    where: { user_id: uid },
    orderBy: { created_at: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    relation: r.relation,
    age: r.age,
    gender: r.gender,
    phone: r.phone || "",
    patient_id: r.patient_id,
    created_at: r.created_at ? r.created_at.toISOString() : null,
  }));
}

/**
 * Adds a new family member / dependent profile.
 */
async function addFamilyMember({ userEmailOrId, name, relation, age = 25, gender = "male", phone = "", memberId = null }) {
  let user = null;
  if (typeof userEmailOrId === "number") {
    user = await prisma.users.findUnique({ where: { id: userEmailOrId } });
  } else {
    const email = String(userEmailOrId || "").trim().toLowerCase();
    user = await prisma.users.findFirst({
      where: {
        OR: [{ email: { equals: email, mode: "insensitive" } }, { username: { equals: email, mode: "insensitive" } }],
      },
    });
  }

  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const memId = memberId || `dep_${Date.now()}`;
  const pid = await engine.resolvePatientId(user.email, name, phone, gender, age);

  const newMember = await prisma.family_members.upsert({
    where: { id: memId },
    create: {
      id: memId,
      user_id: user.id,
      patient_id: pid,
      name,
      relation,
      age: parseInt(age, 10) || 25,
      gender: gender || "male",
      phone: phone || "",
    },
    update: {
      name,
      relation,
      age: parseInt(age, 10) || 25,
      gender: gender || "male",
      phone: phone || "",
      updated_at: new Date(),
    },
  });

  return {
    id: newMember.id,
    name: newMember.name,
    relation: newMember.relation,
    age: newMember.age,
    gender: newMember.gender,
    phone: newMember.phone || "",
    patient_id: pid,
  };
}

/**
 * Updates an existing family member after verifying ownership.
 */
async function updateFamilyMember({ userEmailOrId, memberId, name, relation, age = 25, gender = "male", phone = "" }) {
  const existing = await verifyFamilyMemberOwnership(userEmailOrId, memberId);

  const updated = await prisma.family_members.update({
    where: { id: memberId },
    data: {
      name,
      relation,
      age: parseInt(age, 10) || 25,
      gender: gender || "male",
      phone: phone || "",
      updated_at: new Date(),
    },
  });

  // Also update linked patient record if exists
  if (existing.patient_id) {
    await prisma.patients.update({
      where: { id: existing.patient_id },
      data: {
        name,
        phone: phone || "",
        gender: gender || "other",
        age: parseInt(age, 10) || 25,
        updated_at: new Date(),
      },
    }).catch(() => {});
  }

  return {
    id: updated.id,
    name: updated.name,
    relation: updated.relation,
    age: updated.age,
    gender: updated.gender,
    phone: updated.phone || "",
    patient_id: existing.patient_id,
  };
}

/**
 * Deletes a family member after verifying ownership.
 */
async function deleteFamilyMember(userEmailOrId, memberId) {
  await verifyFamilyMemberOwnership(userEmailOrId, memberId);
  await prisma.family_members.delete({
    where: { id: memberId },
  });
  return true;
}

module.exports = {
  verifyFamilyMemberOwnership,
  listFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
};

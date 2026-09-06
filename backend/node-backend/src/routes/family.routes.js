/**
 * family.routes.js
 * ----------------
 * Family Profile routes with patient-only authorization.
 */

const express = require("express");
const {
  listFamilyMembersEndpoint,
  createFamilyMemberEndpoint,
  updateFamilyMemberEndpoint,
  deleteFamilyMemberEndpoint,
} = require("../controllers/family.controller");
const { authenticate, optionalAuth } = require("../middleware/auth");
const { requirePatientRole } = require("../middleware/role");

const router = express.Router();

// Clean /api/v1/family-members routes (strictly enforced for patient/user role)
router.get("/family-members", authenticate, requirePatientRole, listFamilyMembersEndpoint);
router.post("/family-members", authenticate, requirePatientRole, createFamilyMemberEndpoint);
router.put("/family-members/:member_id", authenticate, requirePatientRole, updateFamilyMemberEndpoint);
router.delete("/family-members/:member_id", authenticate, requirePatientRole, deleteFamilyMemberEndpoint);

// Backward compatibility routes
router.get("/users/:email/family-members", optionalAuth, listFamilyMembersEndpoint);
router.post("/users/:email/family-members", optionalAuth, createFamilyMemberEndpoint);
router.delete("/users/:email/family-members/:member_id", optionalAuth, deleteFamilyMemberEndpoint);

module.exports = router;

/**
 * auth.routes.js
 * --------------
 * Authentication & User routes.
 */

const express = require("express");
const {
  signupSuperAdmin,
  signupAdmin,
  signupPatient,
  login,
  getMe,
  updateProfile,
  updateUserPrimaryHospital,
  getAllUsers,
  getUserHistory,
} = require("../controllers/auth.controller");
const { authenticate, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/signup/superadmin", signupSuperAdmin);
router.post("/signup/admin", signupAdmin);
router.post("/signup/patient", signupPatient);
router.post("/signup", signupPatient);
router.post("/login", login);
router.get("/me", optionalAuth, getMe);
router.put("/profile", optionalAuth, updateProfile);
router.put("/primary-hospital", optionalAuth, updateUserPrimaryHospital);
router.get("/users", optionalAuth, getAllUsers);
router.get("/user-history/:email", optionalAuth, getUserHistory);

module.exports = router;

/**
 * hospital.routes.js
 * ------------------
 * Hospital & SuperAdmin endpoints router.
 */

const express = require("express");
const {
  getHospitalInfoEndpoint,
  getSuperadminOverviewEndpoint,
  getSuperadminHospitalsEndpoint,
  createHospitalEndpoint,
  getHospitalDetailEndpoint,
  updateHospitalEndpoint,
  getHospitalBrandingEndpoint,
  updateHospitalBrandingEndpoint,
  deleteHospitalEndpoint,
  getHospitalEmployeesEndpoint,
  addHospitalEmployeeEndpoint,
  updateHospitalEmployeeEndpoint,
  updateEmployeePasswordEndpoint,
  deleteHospitalEmployeeEndpoint,
  getHospitalDepartmentsEndpoint,
  addHospitalDepartmentEndpoint,
  deleteHospitalDepartmentEndpoint,
  getHospitalDesksEndpoint,
  addHospitalDeskEndpoint,
  deleteHospitalDeskEndpoint,
  updateDeskStatusEndpoint,
  getDbOverviewEndpoint,
} = require("../controllers/hospital.controller");
const { optionalAuth, authenticate } = require("../middleware/auth");

const router = express.Router();

// Public / Hospital info & Branding
router.get("/hospital/info/:hospital_code", optionalAuth, getHospitalInfoEndpoint);
router.get("/hospital/branding/:hospital_code", optionalAuth, getHospitalBrandingEndpoint);

// SuperAdmin operations
router.get("/superadmin/overview", optionalAuth, getSuperadminOverviewEndpoint);
router.get("/superadmin/hospitals", optionalAuth, getSuperadminHospitalsEndpoint);
router.post("/superadmin/hospitals", optionalAuth, createHospitalEndpoint);
router.get("/superadmin/hospitals/:hospital_code", optionalAuth, getHospitalDetailEndpoint);
router.put("/superadmin/hospitals/:hospital_code", optionalAuth, updateHospitalEndpoint);
router.get("/superadmin/hospitals/:hospital_code/branding", optionalAuth, getHospitalBrandingEndpoint);
router.put("/superadmin/hospitals/:hospital_code/branding", optionalAuth, updateHospitalBrandingEndpoint);
router.delete("/superadmin/hospitals/:hospital_code", optionalAuth, deleteHospitalEndpoint);

// Employees
router.get("/superadmin/hospitals/:hospital_code/employees", optionalAuth, getHospitalEmployeesEndpoint);
router.post("/superadmin/hospitals/:hospital_code/employees", optionalAuth, addHospitalEmployeeEndpoint);
router.put("/superadmin/hospitals/:hospital_code/employees/:user_id", optionalAuth, updateHospitalEmployeeEndpoint);
router.put("/superadmin/hospitals/:hospital_code/employees/:user_id/password", optionalAuth, updateEmployeePasswordEndpoint);
router.post("/superadmin/hospitals/:hospital_code/employees/:user_id/password", optionalAuth, updateEmployeePasswordEndpoint);
router.delete("/superadmin/hospitals/:hospital_code/employees/:user_id", optionalAuth, deleteHospitalEmployeeEndpoint);

// Departments
router.get("/superadmin/hospitals/:hospital_code/departments", optionalAuth, getHospitalDepartmentsEndpoint);
router.post("/superadmin/hospitals/:hospital_code/departments", optionalAuth, addHospitalDepartmentEndpoint);
router.delete("/superadmin/hospitals/:hospital_code/departments/:dept_code", optionalAuth, deleteHospitalDepartmentEndpoint);

// Desks
router.get("/superadmin/hospitals/:hospital_code/desks", optionalAuth, getHospitalDesksEndpoint);
router.post("/superadmin/hospitals/:hospital_code/desks", optionalAuth, addHospitalDeskEndpoint);
router.delete("/superadmin/hospitals/:hospital_code/desks/:desk_id", optionalAuth, deleteHospitalDeskEndpoint);
router.put("/superadmin/hospitals/:hospital_code/desks/:desk_id/status", optionalAuth, updateDeskStatusEndpoint);

// Database Overview
router.get("/admin/db-overview", optionalAuth, getDbOverviewEndpoint);

module.exports = router;

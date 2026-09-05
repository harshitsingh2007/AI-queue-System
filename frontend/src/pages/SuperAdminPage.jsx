/**
 * SuperAdminPage.jsx
 * ------------------
 * Executive Super Admin / Hospital Owner Layer Portal.
 * Features:
 * - Real-time Live Telemetry Banner (Hospitals, Doctors, Employees, Desks, Patients Today)
 * - Full CRUD Management:
 *   * Add & Remove Staff and Doctors
 *   * Add & Remove Clinical Departments
 *   * Add, Remove & Toggle Active Desks
 *   * Add & Edit Hospital Network Facilities
 * - Identical UI/UX layout and styling matching User Portal (PatientPage)
 * - Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE } from "../config/hospitalConfig";
import { t, getCategoryLabel } from "../utils/i18n";
import Footer from "../components/Footer";

// Clean Professional Enterprise SVG Icon Components
const IconShield = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconHospital = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
    <path d="M9 10h6M12 7v6" />
  </svg>
);

const IconUsers = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconDesk = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconChart = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconBuilding = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="9" y1="6" x2="9.01" y2="6" />
    <line x1="15" y1="6" x2="15.01" y2="6" />
    <line x1="9" y1="10" x2="9.01" y2="10" />
    <line x1="15" y1="10" x2="15.01" y2="10" />
    <line x1="9" y1="14" x2="9.01" y2="14" />
    <line x1="15" y1="14" x2="15.01" y2="14" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);

const IconTrash = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const IconEdit = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconCopy = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconClock = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconTrendingUp = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconCpu = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const IconPlus = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconCheckCircle = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconStethoscope = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3M18 10h1.5A3.5 3.5 0 0 1 23 13.5v.5a3.5 3.5 0 0 1-3.5 3.5H18M9 12.5V17a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4v-3.5" />
  </svg>
);

const IconMapPin = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconPhone = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export default function SuperAdminPage({
  currentUser,
  language = "en",
  onSelectHospitalTenant,
  navigateTo,
}) {
  const isHi = language === "hi";

  // Global State (Live Telemetry)
  const [overview, setOverview] = useState({
    total_hospitals: 0,
    active_hospitals: 0,
    total_employees: 0,
    active_doctors: 0,
    total_desks: 0,
    active_desks: 0,
    patients_today: 0,
    active_queues: 0,
  });
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Navigation Tabs: "hospitals" | "employees" | "desks" | "depts"
  const [activeTab, setActiveTab] = useState("hospitals");

  // Deep-Dive Selected Hospital Mode
  const [selectedHospital, setSelectedHospital] = useState(null);
  const selectedHospitalRef = useRef(selectedHospital);

  // Selected Hospital Sub-Data
  const [hospitalEmployees, setHospitalEmployees] = useState([]);
  const [hospitalDesksData, setHospitalDesksData] = useState({ departments: [] });
  const [hospitalDepts, setHospitalDepts] = useState([]);

  // Modals
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [showEditHospitalModal, setShowEditHospitalModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddDeskModal, setShowAddDeskModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const getAuthHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(currentUser?.email ? { "X-User-Email": currentUser.email } : {})
  }), [currentUser?.email]);

  // Form States
  const [newHospitalForm, setNewHospitalForm] = useState({
    hospital_code: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    status: "active",
  });

  const [editHospitalForm, setEditHospitalForm] = useState({
    hospital_code: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    status: "active",
  });

  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: "",
    email: "",
    role: "doctor",
    department: "consultation",
    employee_id: "",
    phone: "",
    password: "pass" + Math.floor(1000 + Math.random() * 9000),
  });

  const [editEmployeeForm, setEditEmployeeForm] = useState({
    id: null,
    name: "",
    phone: "",
    role: "doctor",
    department: "consultation",
    employee_id: "",
    status: "active",
  });

  const [newDeptForm, setNewDeptForm] = useState({
    dept_code: "",
    name: "",
    description: "",
  });

  const [newDeskForm, setNewDeskForm] = useState({
    dept_code: "consultation",
    desk_name: "",
    status: "AVAILABLE",
  });

  const notify = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  useEffect(() => {
    selectedHospitalRef.current = selectedHospital;
  }, [selectedHospital]);

  // 1. Fetch Global Overview & Hospital Directory
  const fetchGlobalData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [overviewRes, hospitalsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/superadmin/overview`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/superadmin/hospitals`, { headers }).then((r) => r.json()),
      ]);

      if (overviewRes.status === "success") {
        setOverview(overviewRes.overview);
      }
      if (hospitalsRes.status === "success") {
        setHospitals(hospitalsRes.hospitals);
        if (!selectedHospitalRef.current && hospitalsRes.hospitals.length > 0) {
          setSelectedHospital(hospitalsRes.hospitals[0]);
        }
      }
      if (!silent) setLoading(false);
    } catch (e) {
      console.log("Superadmin fetch error:", e);
      if (!silent) setLoading(false);
    }
  }, [getAuthHeaders]);

  // 2. Fetch Selected Hospital Deep-Dive Data
  const fetchHospitalDeepDive = useCallback(async (hCode) => {
    if (!hCode) return;
    try {
      const headers = getAuthHeaders();
      const [detailRes, empRes, desksRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hCode}`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hCode}/employees`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hCode}/desks`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hCode}/departments`, { headers }).then((r) => r.json()),
      ]);

      if (detailRes.status === "success") {
        setSelectedHospital(detailRes.hospital);
        setEditHospitalForm({
          hospital_code: detailRes.hospital.hospital_code,
          name: detailRes.hospital.name,
          address: detailRes.hospital.address || "",
          phone: detailRes.hospital.phone || "",
          email: detailRes.hospital.email || "",
          description: detailRes.hospital.description || "",
          status: detailRes.hospital.status || "active",
        });
      }
      if (empRes.status === "success") {
        setHospitalEmployees(empRes.employees);
      }
      if (desksRes.status === "success") {
        setHospitalDesksData(desksRes.desks);
      }
      if (deptsRes.status === "success") {
        setHospitalDepts(deptsRes.departments);
      }
    } catch (e) {
      console.log("Deep dive fetch error:", e);
    }
  }, [getAuthHeaders]);

  // Initial Fetch & Live Data Polling (Banner reflects live real data every 4 seconds)
  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(() => {
      fetchGlobalData(true);
      if (selectedHospitalRef.current) {
        fetchHospitalDeepDive(selectedHospitalRef.current.hospital_code);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchGlobalData, fetchHospitalDeepDive]);

  useEffect(() => {
    if (selectedHospital && selectedHospital.hospital_code) {
      fetchHospitalDeepDive(selectedHospital.hospital_code);
    }
  }, [selectedHospital?.hospital_code, fetchHospitalDeepDive]);

  // 3. Create Hospital Handler
  const handleCreateHospitalSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHospitalForm),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowAddHospitalModal(false);
        setNewHospitalForm({
          hospital_code: "",
          name: "",
          address: "",
          phone: "",
          email: "",
          description: "",
          status: "active",
        });
        notify(isHi ? `🏥 अस्पताल '${data.hospital.name}' सफलतापूर्वक पंजीकृत!` : `🏥 Hospital '${data.hospital.name}' registered successfully!`);
        fetchGlobalData();
        setSelectedHospital(data.hospital);
      } else {
        alert(data.detail || "Failed to create hospital.");
      }
    } catch (err) {
      alert(`Error creating hospital: ${err.message}`);
    }
  };

  // 4. Update Hospital Handler
  const handleUpdateHospitalSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${editHospitalForm.hospital_code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editHospitalForm),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowEditHospitalModal(false);
        notify(isHi ? `✓ अस्पताल जानकारी अद्यतन की गई!` : `✓ Hospital details updated successfully!`);
        fetchGlobalData();
        fetchHospitalDeepDive(editHospitalForm.hospital_code);
      } else {
        alert(data.detail || "Failed to update hospital.");
      }
    } catch (err) {
      alert(`Error updating hospital: ${err.message}`);
    }
  };

  // Delete Hospital Handler
  const handleDeleteHospital = async (hosp) => {
    if (!window.confirm(isHi ? `क्या आप वाकई अस्पताल '${hosp.name}' (${hosp.hospital_code}) को हटाना चाहते हैं?` : `Are you sure you want to delete hospital '${hosp.name}' (${hosp.hospital_code}) and all its associated staff, departments, and desks?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hosp.hospital_code}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        notify(isHi ? `🗑️ अस्पताल '${hosp.name}' सफलतापूर्वक हटा दिया गया!` : `🗑️ Hospital '${hosp.name}' successfully deleted!`);
        fetchGlobalData();
        if (selectedHospital?.hospital_code === hosp.hospital_code) {
          setSelectedHospital(null);
        }
      } else {
        alert(data.detail || data.message || "Failed to delete hospital.");
      }
    } catch (err) {
      alert(`Error deleting hospital: ${err.message}`);
    }
  };

  // 5. Add Employee Handler (Doctor, Staff, Admin)
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/employees`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newEmployeeForm),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowAddEmployeeModal(false);
        setCreatedCredentials({
          name: data.employee.username,
          email: data.employee.email,
          employee_id: data.employee.employee_id || newEmployeeForm.employee_id,
          password: newEmployeeForm.password,
          role: data.employee.role,
          department: data.employee.department,
          hospital_name: selectedHospital.name,
        });
        setNewEmployeeForm({
          name: "",
          email: "",
          role: "doctor",
          department: "consultation",
          employee_id: "",
          phone: "",
          password: "pass" + Math.floor(1000 + Math.random() * 9000),
        });
        notify(isHi ? `👤 कर्मचारी '${data.employee.username}' सफलतापूर्वक जोड़ा गया!` : `👤 Employee '${data.employee.username}' provisioned successfully!`);
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData(true);
      } else {
        alert(data.detail || "Failed to add employee.");
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // 6. Update Employee Handler
  const handleUpdateEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHospital || !editEmployeeForm.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/employees/${editEmployeeForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editEmployeeForm),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowEditEmployeeModal(false);
        notify(isHi ? `✓ कर्मचारी रिकॉर्ड अपडेट हुआ!` : `✓ Employee record updated!`);
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData();
      } else {
        alert(data.detail || "Failed to update employee.");
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // 7. Delete Employee Handler
  const handleDeleteEmployee = async (emp) => {
    if (!selectedHospital) return;
    const confirmMsg = isHi
      ? `क्या आप वाकई कर्मचारी/डॉक्टर '${emp.username}' को हटाना चाहते हैं?`
      : `Are you sure you want to remove employee/doctor '${emp.username}'?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/employees/${emp.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        notify(isHi ? `🗑️ कर्मचारी '${emp.username}' हटा दिया गया!` : `🗑️ Employee '${emp.username}' removed!`);
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData();
      } else {
        alert(data.detail || "Failed to delete employee.");
      }
    } catch (err) {
      alert(`Error deleting employee: ${err.message}`);
    }
  };

  // 8. Add Department Handler
  const handleAddDeptSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeptForm),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowAddDeptModal(false);
        setNewDeptForm({ dept_code: "", name: "", description: "" });
        notify(isHi ? `🏢 विभाग '${data.department.name}' जोड़ा गया!` : `🏢 Department '${data.department.name}' added!`);
        fetchHospitalDeepDive(selectedHospital.hospital_code);
      } else {
        alert(data.detail || "Failed to add department.");
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // 9. Delete Department Handler
  const handleDeleteDepartment = async (dept) => {
    if (!selectedHospital) return;
    const confirmMsg = isHi
      ? `क्या आप वाकई विभाग '${dept.name}' और इसके सभी डेस्क हटाना चाहते हैं?`
      : `Are you sure you want to remove department '${dept.name}' and all its desks?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/departments/${dept.dept_code}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        notify(isHi ? `🗑️ विभाग '${dept.name}' हटा दिया गया!` : `🗑️ Department '${dept.name}' removed!`);
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData();
      } else {
        alert(data.detail || "Failed to delete department.");
      }
    } catch (err) {
      alert(`Error deleting department: ${err.message}`);
    }
  };

  // 10. Add Desk Handler
  const handleAddDeskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/desks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeskForm),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowAddDeskModal(false);
        setNewDeskForm({ dept_code: "consultation", desk_name: "", status: "AVAILABLE" });
        notify(isHi ? `🪑 नया डेस्क '${data.desk.desk_name}' जोड़ा गया!` : `🪑 New desk '${data.desk.desk_name}' added!`);
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData();
      } else {
        alert(data.detail || "Failed to add desk.");
      }
    } catch (err) {
      alert(`Error adding desk: ${err.message}`);
    }
  };

  // 11. Delete Desk Handler
  const handleDeleteDesk = async (desk) => {
    if (!selectedHospital) return;
    const confirmMsg = isHi
      ? `क्या आप वाकई डेस्क '${desk.desk_name}' को हटाना चाहते हैं?`
      : `Are you sure you want to remove desk '${desk.desk_name}'?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/desks/${desk.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        notify(isHi ? `🗑️ डेस्क '${desk.desk_name}' हटा दिया गया!` : `🗑️ Desk '${desk.desk_name}' removed!`);
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData();
      } else {
        alert(data.detail || "Failed to delete desk.");
      }
    } catch (err) {
      alert(`Error deleting desk: ${err.message}`);
    }
  };

  // 12. Toggle Desk Status Handler
  const handleToggleDeskStatus = async (desk) => {
    if (!selectedHospital) return;
    const nextStatus = desk.status === "ACTIVE" ? "AVAILABLE" : desk.status === "AVAILABLE" ? "BUSY" : desk.status === "BUSY" ? "OFFLINE" : "ACTIVE";
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/desks/${desk.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData();
      }
    } catch (e) {
      console.log("Desk update error:", e);
    }
  };

  // Filtered Hospital List
  const filteredHospitals = hospitals.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.hospital_code.toLowerCase().includes(q) ||
      (h.address && h.address.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", padding: "0 4px 40px 4px", boxSizing: "border-box" }}>
      {/* Dynamic CSS Styling matching PatientPage.jsx and HeroBanner.jsx */}
      <style>{`
        .superadmin-hero-container {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          border-radius: 28px;
          overflow: hidden;
          background: #0F172A;
          box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(2, 132, 199, 0.05);
          border: 1px solid rgba(2, 132, 199, 0.2);
          margin-bottom: 24px;
          position: relative;
          min-height: 280px;
          width: 100%;
        }

        .superadmin-hero-left-col {
          flex: 1.25;
          padding: 36px 38px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          z-index: 2;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 70%, #0C4A6E 100%);
          position: relative;
        }

        @media (min-width: 900px) {
          .superadmin-hero-left-col {
            padding-right: 40px;
            margin-right: 0;
            border-right: 1px solid rgba(2, 132, 199, 0.2);
          }
        }

        .superadmin-hero-right-col {
          flex: 0.95;
          background: linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%);
          display: flex;
          align-items: center;
          justifyContent: center;
          position: relative;
          overflow: hidden;
          min-height: 260px;
        }

        .superadmin-hero-title {
          font-size: 32px;
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.6px;
          color: #FFFFFF;
          margin: 0;
        }

        .superadmin-hero-title-highlight {
          color: #38BDF8;
        }

        .superadmin-hero-subtitle {
          color: rgba(224, 242, 254, 0.88);
          font-size: 13.5px;
          line-height: 1.5;
          margin-top: 10px;
          margin-bottom: 22px;
          max-width: 440px;
          font-weight: 500;
        }

        .superadmin-hero-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          width: 100%;
        }

        .superadmin-hero-stat-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          box-sizing: border-box;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .superadmin-hero-stat-card:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .superadmin-hero-stat-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justifyContent: center;
          flex-shrink: 0;
          color: #38BDF8;
        }

        .superadmin-hero-stat-value {
          font-size: 16px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.1;
          letter-spacing: -0.3px;
        }

        .superadmin-hero-stat-label {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.2;
          margin-top: 2px;
        }

        .superadmin-nav-section {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px -2px rgba(2, 132, 199, 0.04);
        }

        .superadmin-nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        .superadmin-nav-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.2px;
        }

        .superadmin-tabs-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .tab-button-modern {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
          user-select: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
          outline: none;
        }

        .tab-button-modern:hover {
          border-color: #BAE6FD;
          background: #F0F9FF;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(2, 132, 199, 0.1);
        }

        .tab-button-modern.active {
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          border-color: #0284C7;
          color: #FFFFFF;
          box-shadow: 0 8px 20px rgba(2, 132, 199, 0.28);
          transform: translateY(-2px);
        }

        .tab-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justifyContent: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .tab-button-modern.active .tab-icon-wrapper {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        }

        .tab-button-modern.inactive .tab-icon-wrapper {
          background: #F0F9FF;
          color: #0284C7;
        }

        .tab-title-text {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.2px;
          line-height: 1.2;
        }

        .tab-sub-text {
          font-size: 11px;
          font-weight: 600;
          display: block;
          margin-top: 2px;
        }

        .tab-count-badge {
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
        }

        .superadmin-portal-dashboard {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1240px) {
          .superadmin-hero-stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .superadmin-portal-dashboard {
            grid-template-columns: 1fr;
          }
          .superadmin-tabs-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .superadmin-hero-container {
            flex-direction: column;
          }
          .superadmin-hero-left-col {
            clip-path: none !important;
            padding: 28px 22px;
            margin-right: 0;
            border-right: none !important;
            border-bottom: 1px solid rgba(2, 132, 199, 0.2);
          }
          .superadmin-hero-right-col {
            min-height: 200px;
            width: 100%;
          }
          .superadmin-tabs-bar {
            grid-template-columns: 1fr;
          }
        }

        .telemetry-sidebar-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          padding: 20px;
          box-shadow: 0 4px 20px -2px rgba(2, 132, 199, 0.04);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .admin-action-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
          transition: all 0.2s ease;
          outline: none;
          width: 100%;
        }

        .admin-action-btn-primary:hover {
          background: #0369A1;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
        }
      `}</style>

      {/* 1. SUPER ADMIN HERO SECTION (Real-Time Live Telemetry) */}
      <section className="superadmin-hero-container">
        <div className="superadmin-hero-left-col">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "9999px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.35)", color: "#38BDF8", fontSize: "11px", fontWeight: 800, marginBottom: "10px" }}>
              <IconShield size={13} color="#38BDF8" />
              <span>{isHi ? "सुपर एडमिन कंसोल" : "SUPER ADMIN / HOSPITAL NETWORK HQ"}</span>
            </div>

            <h1 className="superadmin-hero-title">
              {isHi ? (
                <>
                  अस्पताल नेटवर्क प्रबंधन.
                  <br />
                  <span className="superadmin-hero-title-highlight">शाखाएं एवं</span> डॉक्टर नियंत्रण.
                </>
              ) : (
                <>
                  Hospital Network Control.
                  <br />
                  <span className="superadmin-hero-title-highlight">Multi-Tenant</span> Management.
                </>
              )}
            </h1>
            <p className="superadmin-hero-subtitle">
              {isHi
                ? "सभी अस्पताल शाखाओं, क्लिनिकल विभागों, डॉक्टर क्रेडेंशियल्स, और सक्रिय काउंटरों का केंद्रीकृत नियंत्रण।"
                : "Centralized control for medical centers, clinical departments, staff credentials, and active desk throughput."}
            </p>
          </div>

          {/* 4 Real-Data Stats Cards */}
          <div className="superadmin-hero-stats-row">
            <div className="superadmin-hero-stat-card">
              <div className="superadmin-hero-stat-icon-wrap" style={{ color: "#38BDF8" }}>
                <IconHospital size={18} />
              </div>
              <div>
                <div className="superadmin-hero-stat-value">{overview.total_hospitals}</div>
                <div className="superadmin-hero-stat-label">{overview.active_hospitals} {isHi ? "सक्रिय" : "Active"}</div>
              </div>
            </div>

            <div className="superadmin-hero-stat-card">
              <div className="superadmin-hero-stat-icon-wrap" style={{ color: "#38BDF8" }}>
                <IconUsers size={18} />
              </div>
              <div>
                <div className="superadmin-hero-stat-value">{overview.total_employees}</div>
                <div className="superadmin-hero-stat-label">{overview.active_doctors} {isHi ? "डॉक्टर" : "Doctors"}</div>
              </div>
            </div>

            <div className="superadmin-hero-stat-card">
              <div className="superadmin-hero-stat-icon-wrap" style={{ color: "#38BDF8" }}>
                <IconDesk size={18} />
              </div>
              <div>
                <div className="superadmin-hero-stat-value" style={{ color: "#38BDF8" }}>
                  {overview.active_desks} / {overview.total_desks}
                </div>
                <div className="superadmin-hero-stat-label">{isHi ? "सक्रिय डेस्क" : "Active Desks"}</div>
              </div>
            </div>

            <div className="superadmin-hero-stat-card">
              <div className="superadmin-hero-stat-icon-wrap" style={{ color: "#FDE047" }}>
                <IconChart size={18} />
              </div>
              <div>
                <div className="superadmin-hero-stat-value" style={{ color: "#FDE047" }}>
                  {overview.patients_today}
                </div>
                <div className="superadmin-hero-stat-label">{isHi ? "आज के मरीज़" : "Patients Today"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Network Telemetry & Hospital Vector */}
        <div className="superadmin-hero-right-col" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", zIndex: 3, flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(8px)", padding: "4px 12px", borderRadius: "9999px", border: "1px solid #BAE6FD", boxShadow: "0 2px 8px rgba(2, 132, 199, 0.08)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#0369A1", letterSpacing: "0.2px" }}>
                {isHi ? "लाइव नेटवर्क टेलीमेट्री" : "LIVE CLOUD TELEMETRY"}
              </span>
            </div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#0369A1", background: "rgba(255, 255, 255, 0.85)", padding: "4px 10px", borderRadius: "8px", border: "1px solid #BAE6FD", display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0284C7" }} />
              <span>4s Real-Time Sync</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%", margin: "14px 0", zIndex: 3 }}>
            <div style={{ background: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(10px)", border: "1px solid #BAE6FD", borderRadius: "14px", padding: "12px 14px", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>{isHi ? "सक्रिय कतारें" : "Active In Queue"}</span>
                <span style={{ color: "#0284C7" }}><IconClock size={16} /></span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0284C7", lineHeight: 1.1 }}>
                {overview.active_queues || 0}
              </div>
              <span style={{ fontSize: "10px", color: "#0369A1", fontWeight: 600, display: "block", marginTop: "2px" }}>
                {isHi ? "प्रतीक्षारत / सेवारत टोकन" : "Waiting & Serving Tokens"}
              </span>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(10px)", border: "1px solid #BAE6FD", borderRadius: "14px", padding: "12px 14px", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>{isHi ? "कुल विज़िट" : "Lifetime Visits"}</span>
                <span style={{ color: "#16A34A" }}><IconTrendingUp size={16} /></span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                {overview.total_tickets || 0}
              </div>
              <span style={{ fontSize: "10px", color: "#16A34A", fontWeight: 700, display: "block", marginTop: "2px" }}>
                ✓ {overview.total_users || 0} {isHi ? "पंजीकृत उपयोगकर्ता" : "Registered Accounts"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", zIndex: 3, background: "rgba(255, 255, 255, 0.8)", padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(186, 230, 253, 0.6)" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <IconCpu size={14} color="#0284C7" />
              <span>{isHi ? "AI कतार एल्गोरिदम" : "AI Routing Engine"}: <strong style={{ color: "#0284C7" }}>v2.4 Online</strong></span>
            </span>
            <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#059669" }}>
              ● 99.98% System Uptime
            </span>
          </div>

          {/* Background Vector Graphic Silhouette */}
          <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.12, pointerEvents: "none", zIndex: 1, width: "240px", maxHeight: "200px" }}>
            <SuperAdminHospitalIllustration />
          </div>
        </div>
      </section>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div style={feedbackToastStyle}>
          {feedbackMsg}
        </div>
      )}

      {/* 2. UNIFIED SUPER ADMIN NAVIGATION HUB (4 TABS) */}
      <section className="superadmin-nav-section">
        <div className="superadmin-nav-header">
          <div className="superadmin-nav-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M12 11h4" />
              <path d="M12 16h4" />
              <path d="M8 11h.01" />
              <path d="M8 16h.01" />
            </svg>
            <span>{isHi ? "सुपर एडमिन नियंत्रण हब" : "Super Admin Network Hub & Operations"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0EA5E9", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>
              {isHi ? "लाइव डेटा सिंक सक्रिय" : "Live Telemetry Active (Real-Time)"}
            </span>
          </div>
        </div>

        <div className="superadmin-tabs-bar">
          {/* Tab 1: Hospital Facilities */}
          <button
            type="button"
            onClick={() => setActiveTab("hospitals")}
            className={`tab-button-modern ${activeTab === "hospitals" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <IconHospital size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {isHi ? "अस्पताल शाखाएं" : "Hospitals"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "hospitals" ? "#FFFFFF" : "#0284C7",
                    color: activeTab === "hospitals" ? "#0284C7" : "#FFFFFF",
                  }}
                >
                  {hospitals.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "hospitals" ? "#E0F2FE" : "#64748B" }}>
                {isHi ? "शाखा एवं सेटिंग्स" : "Directory & Facilities"}
              </span>
            </div>
          </button>

          {/* Tab 2: Doctors & Staff Roster */}
          <button
            type="button"
            onClick={() => setActiveTab("employees")}
            className={`tab-button-modern ${activeTab === "employees" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <IconUsers size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {isHi ? "डॉक्टर एवं कर्मचारी" : "Staff & Doctors"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "employees" ? "#FFFFFF" : "#0284C7",
                    color: activeTab === "employees" ? "#0284C7" : "#FFFFFF",
                  }}
                >
                  {hospitalEmployees.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "employees" ? "#E0F2FE" : "#64748B" }}>
                {isHi ? "जोड़ें / हटाएं / भूमिका" : "Add, Remove & Roles"}
              </span>
            </div>
          </button>

          {/* Tab 3: Active Desks */}
          <button
            type="button"
            onClick={() => setActiveTab("desks")}
            className={`tab-button-modern ${activeTab === "desks" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <IconDesk size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {isHi ? "सक्रिय काउंटर/डेस्क" : "Active Desks"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "desks" ? "#FFFFFF" : "#0284C7",
                    color: activeTab === "desks" ? "#0284C7" : "#FFFFFF",
                  }}
                >
                  {hospitalDesksData.active_desks || 0}/{hospitalDesksData.total_desks || 0}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "desks" ? "#E0F2FE" : "#64748B" }}>
                {isHi ? "जोड़ें / हटाएं / स्थिति" : "Add, Remove & Status"}
              </span>
            </div>
          </button>

          {/* Tab 4: Clinical Departments */}
          <button
            type="button"
            onClick={() => setActiveTab("depts")}
            className={`tab-button-modern ${activeTab === "depts" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <IconBuilding size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {isHi ? "क्लिनिकल विभाग" : "Departments"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "depts" ? "#FFFFFF" : "#0284C7",
                    color: activeTab === "depts" ? "#0284C7" : "#FFFFFF",
                  }}
                >
                  {hospitalDepts.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "depts" ? "#E0F2FE" : "#64748B" }}>
                {isHi ? "जोड़ें / हटाएं / OPD, Lab" : "Add, Remove Categories"}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 3. 2-COLUMN RESPONSIVE DASHBOARD LAYOUT */}
      <div className="superadmin-portal-dashboard">
        {/* LEFT COLUMN: Main Tab Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* TAB 1: HOSPITALS DIRECTORY */}
          {activeTab === "hospitals" && (
            <div style={standaloneCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0F172A", fontWeight: 800, letterSpacing: "-0.4px" }}>
                    {isHi ? "अस्पताल नेटवर्क शाखाएं" : "Hospital Network Facilities"} ({filteredHospitals.length})
                  </h2>
                  <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                    {isHi ? "अस्पताल नाम, पता, संपर्क जानकारी संपादित करें या नया अस्पताल जोड़ें।" : "Configure hospital names, contact information, and active status."}
                  </p>
                </div>

                {/* Search Input */}
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <input
                    type="text"
                    placeholder={isHi ? "अस्पताल खोजें..." : "Search hospitals..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={searchInputStyle}
                  />
                </div>
              </div>

              {/* Hospital Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                {filteredHospitals.map((hosp) => (
                  <div
                    key={hosp.hospital_code}
                    style={{
                      ...hospitalCardStyle,
                      borderColor: selectedHospital?.hospital_code === hosp.hospital_code ? "#0284C7" : "#E2E8F0",
                      background: selectedHospital?.hospital_code === hosp.hospital_code ? "#F0F9FF" : "#FFFFFF",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "17px", color: "#0F172A", fontWeight: 800 }}>
                          {hosp.name}
                        </h3>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "4px" }}>
                          Code: {hosp.hospital_code.toUpperCase()}
                        </span>
                      </div>
                      <span style={hospitalStatusBadgeStyle(hosp.status)}>
                        ● {hosp.status.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ margin: "0 0 12px 0", fontSize: "12.5px", color: "#475569", lineHeight: 1.4, minHeight: "34px" }}>
                      {hosp.description || "Modern healthcare center with AI triage."}
                    </p>

                    {/* 4 Stat Badges */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", padding: "10px", background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "14px" }}>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: 700, display: "block" }}>Staff</span>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>{hosp.employee_count}</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: 700, display: "block" }}>Docs</span>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0284C7" }}>{hosp.doctor_count}</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: 700, display: "block" }}>Desks</span>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0284C7" }}>{hosp.active_desks}/{hosp.total_desks}</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: 700, display: "block" }}>Visits</span>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#D97706" }}>{hosp.patients_today}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHospital(hosp);
                          setActiveTab("employees");
                        }}
                        style={primarySmallBtnStyle}
                      >
                        <span>{isHi ? "प्रबंधन करें" : "Manage Staff"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditHospitalForm({
                            hospital_code: hosp.hospital_code,
                            name: hosp.name,
                            address: hosp.address || "",
                            phone: hosp.phone || "",
                            email: hosp.email || "",
                            description: hosp.description || "",
                            status: hosp.status || "active",
                          });
                          setShowEditHospitalModal(true);
                        }}
                        style={secondarySmallBtnStyle}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <IconEdit size={12} />
                          <span>{isHi ? "संपादित" : "Edit"}</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteHospital(hosp)}
                        style={deleteSmallBtnStyle}
                        title={isHi ? "अस्पताल हटाएं" : "Delete Hospital"}
                      >
                        <IconTrash size={14} color="#EF4444" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYEES & DOCTORS ROSTER (Add & Remove Staff/Doctors) */}
          {activeTab === "employees" && (
            <div style={standaloneCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0F172A", fontWeight: 800 }}>
                    {isHi ? "डॉक्टर एवं कर्मचारी रोस्टर" : "Doctor & Employee Roster"}
                  </h2>
                  <span style={{ fontSize: "12px", color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <IconHospital size={14} color="#0284C7" />
                    <span>{selectedHospital ? selectedHospital.name : "Select a Hospital"} ({hospitalEmployees.length} Staff Members)</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(true)}
                  style={actionBtnStyle}
                >
                  <IconPlus size={14} color="#FFFFFF" />
                  <span>{isHi ? "डॉक्टर / कर्मचारी जोड़ें" : "+ Add Doctor / Staff"}</span>
                </button>
              </div>

              {/* Roster Table with Edit and Delete Action */}
              <div style={{ overflowX: "auto", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <th style={tableThStyle}>{isHi ? "नाम" : "Name"}</th>
                      <th style={tableThStyle}>{isHi ? "आईडी" : "Emp ID"}</th>
                      <th style={tableThStyle}>{isHi ? "भूमिका" : "Role"}</th>
                      <th style={tableThStyle}>{isHi ? "विभाग" : "Department"}</th>
                      <th style={tableThStyle}>{isHi ? "ईमेल / फोन" : "Contact"}</th>
                      <th style={tableThStyle}>{isHi ? "स्थिति" : "Status"}</th>
                      <th style={tableThStyle}>{isHi ? "कार्रवाई" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitalEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748B" }}>
                          No staff or doctors found for this hospital. Click "+ Add Doctor / Staff" above.
                        </td>
                      </tr>
                    ) : (
                      hospitalEmployees.map((emp) => (
                        <tr key={emp.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={tableTdStyle}>
                            <div style={{ fontWeight: 800, color: "#0F172A" }}>{emp.username}</div>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>{emp.email}</span>
                          </td>
                          <td style={{ ...tableTdStyle, fontWeight: 700, color: "#0284C7" }}>
                            {emp.employee_id || `EMP-${emp.id}`}
                          </td>
                          <td style={tableTdStyle}>
                            <span style={roleBadgeStyle(emp.role)}>
                              {emp.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ ...tableTdStyle, fontWeight: 700, color: "#0284C7" }}>
                            {getCategoryLabel(emp.department, language)}
                          </td>
                          <td style={tableTdStyle}>
                            {emp.phone || "—"}
                          </td>
                          <td style={tableTdStyle}>
                            <span style={empStatusBadgeStyle(emp.status)}>
                              ● {(emp.status || "active").toUpperCase()}
                            </span>
                          </td>
                          <td style={tableTdStyle}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`Email ID: ${emp.email}\nRole: ${emp.role.toUpperCase()}\nDepartment: ${emp.department}`);
                                  notify(isHi ? `'${emp.username}' के लॉगिन क्रेडेंशियल कॉपी किए गए!` : `Login ID for '${emp.username}' copied to clipboard!`);
                                }}
                                style={copySmallBtnStyle}
                                title={isHi ? "लॉगिन आईडी कॉपी करें" : "Copy Login ID"}
                              >
                                <IconCopy size={13} color="#0284C7" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditEmployeeForm({
                                    id: emp.id,
                                    name: emp.username,
                                    phone: emp.phone || "",
                                    role: emp.role,
                                    department: emp.department || "consultation",
                                    employee_id: emp.employee_id || "",
                                    status: emp.status || "active",
                                  });
                                  setShowEditEmployeeModal(true);
                                }}
                                style={editSmallBtnStyle}
                              >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <IconEdit size={11} />
                                  <span>{isHi ? "संपादित" : "Edit"}</span>
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEmployee(emp)}
                                style={deleteSmallBtnStyle}
                                title={isHi ? "कर्मचारी हटाएं" : "Remove Employee"}
                              >
                                <IconTrash size={14} color="#EF4444" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE DESKS (Add & Remove Desks) */}
          {activeTab === "desks" && (
            <div style={standaloneCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0F172A", fontWeight: 800 }}>
                    {isHi ? "सक्रिय काउंटर एवं डेस्क प्रबंधन" : "Active Desk & Counter Management"}
                  </h2>
                  <span style={{ fontSize: "12px", color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <IconHospital size={14} color="#0284C7" />
                    <span>{selectedHospital ? selectedHospital.name : "Select a Hospital"} ({hospitalDesksData.active_desks || 0} / {hospitalDesksData.total_desks || 0} Active Desks)</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDeskModal(true)}
                  style={actionBtnStyle}
                >
                  <IconPlus size={14} color="#FFFFFF" />
                  <span>{isHi ? "नया डेस्क जोड़ें" : "+ Add New Desk"}</span>
                </button>
              </div>

              {/* Department Desks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {(hospitalDesksData.departments || []).map((deptGroup) => (
                  <div key={deptGroup.dept_code} style={deptDeskBoxStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <IconStethoscope size={16} color="#0284C7" />
                        <h4 style={{ margin: 0, fontSize: "15px", color: "#0F172A", fontWeight: 800 }}>
                          {getCategoryLabel(deptGroup.dept_code, language)}
                        </h4>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "2px 8px", borderRadius: "6px" }}>
                        {deptGroup.active_desks} / {deptGroup.total_desks} Active
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                      {deptGroup.desks.map((desk) => (
                        <div key={desk.id} style={deskCardItemStyle(desk.status)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>
                              {desk.desk_name}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={deskStatusPillStyle(desk.status)}>
                                {desk.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteDesk(desk)}
                                style={deleteDeskIconBtnStyle}
                                title={isHi ? "डेस्क हटाएं" : "Remove Desk"}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>
                            {desk.staff_name ? `Staff: ${desk.staff_name}` : "Auto-Assigned Bay"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleDeskStatus(desk)}
                            style={toggleDeskBtnStyle}
                          >
                            {isHi ? "स्थिति बदलें" : "Toggle Status"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL DEPARTMENTS (Add & Remove Departments) */}
          {activeTab === "depts" && (
            <div style={standaloneCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0F172A", fontWeight: 800 }}>
                    {isHi ? "क्लिनिकल विभाग सूची" : "Clinical Departments & Wings"}
                  </h2>
                  <span style={{ fontSize: "12px", color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <IconHospital size={14} color="#0284C7" />
                    <span>{selectedHospital ? selectedHospital.name : "Select a Hospital"} ({hospitalDepts.length} Departments)</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(true)}
                  style={actionBtnStyle}
                >
                  <IconPlus size={14} color="#FFFFFF" />
                  <span>{isHi ? "विभाग जोड़ें" : "+ Add Department"}</span>
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" }}>
                {hospitalDepts.map((d) => (
                  <div key={d.dept_code} style={deptCardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <IconBuilding size={16} color="#0284C7" />
                        <h4 style={{ margin: 0, fontSize: "14px", color: "#0F172A", fontWeight: 800 }}>
                          {d.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDepartment(d)}
                        style={deleteDeptIconBtnStyle}
                        title={isHi ? "विभाग हटाएं" : "Remove Department"}
                      >
                        <IconTrash size={14} color="#EF4444" />
                      </button>
                    </div>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#0284C7", background: "#E0F2FE", padding: "1px 6px", borderRadius: "4px", display: "inline-block" }}>
                      Code: {d.dept_code}
                    </span>
                    <p style={{ margin: "6px 0 0 0", fontSize: "11.5px", color: "#64748B", lineHeight: 1.4 }}>
                      {d.description || "Clinical patient care wing"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Telemetry & Live Network Status Sidebar Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Active Hospital Switcher Card */}
          <div className="telemetry-sidebar-card">
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
              <IconHospital size={16} color="#0284C7" />
              <span>{isHi ? "सक्रिय अस्पताल दृश्य" : "Focus Hospital"}</span>
            </h3>
            <span style={{ fontSize: "12px", color: "#64748B", marginBottom: "10px", display: "block" }}>
              Select which hospital's data to view and manage:
            </span>

            <select
              value={selectedHospital?.hospital_code || ""}
              onChange={(e) => {
                const found = hospitals.find((h) => h.hospital_code === e.target.value);
                if (found) {
                  setSelectedHospital(found);
                  if (onSelectHospitalTenant) onSelectHospitalTenant(found.hospital_code);
                }
              }}
              style={sidebarSelectStyle}
            >
              {hospitals.map((h) => (
                <option key={h.hospital_code} value={h.hospital_code}>
                  {h.name} ({h.hospital_code})
                </option>
              ))}
            </select>

            {selectedHospital && (
              <div style={{ marginTop: "12px", padding: "12px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}>
                <div style={{ fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>{selectedHospital.name}</div>
                <div style={{ color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconMapPin size={12} color="#64748B" />
                  <span>{selectedHospital.address || "Address not configured"}</span>
                </div>
                <div style={{ color: "#64748B", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconPhone size={12} color="#64748B" />
                  <span>{selectedHospital.phone || "—"}</span>
                </div>
                <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 6px", borderRadius: "4px", background: "#F0FDF4", color: "#166534", fontWeight: 800, fontSize: "10.5px", border: "1px solid #BBF7D0" }}>
                    {selectedHospital.doctor_count} Doctors
                  </span>
                  <span style={{ padding: "2px 6px", borderRadius: "4px", background: "#E0F2FE", color: "#0284C7", fontWeight: 800, fontSize: "10.5px" }}>
                    {selectedHospital.active_desks}/{selectedHospital.total_desks} Desks
                  </span>
                  <span style={{ padding: "2px 6px", borderRadius: "4px", background: "#FEF3C7", color: "#D97706", fontWeight: 800, fontSize: "10.5px" }}>
                    {selectedHospital.patients_today} Visits
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. MODALS */}

      {/* MODAL 1: ADD HOSPITAL */}
      {showAddHospitalModal && (
        <div style={modalOverlayStyle} onClick={() => setShowAddHospitalModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconHospital size={18} color="#0284C7" />
                <span>{isHi ? "नया अस्पताल जोड़ें" : "Add New Hospital"}</span>
              </h3>
              <button type="button" onClick={() => setShowAddHospitalModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <form onSubmit={handleCreateHospitalSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={fieldLabelStyle}>{isHi ? "अस्पताल का नाम" : "Hospital Name"} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Superspecialty Hospital"
                  value={newHospitalForm.name}
                  onChange={(e) => setNewHospitalForm({ ...newHospitalForm, name: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "अस्पताल कोड (Unique Code)" : "Hospital Code"} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. metro-hospital-01"
                  value={newHospitalForm.hospital_code}
                  onChange={(e) => setNewHospitalForm({ ...newHospitalForm, hospital_code: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "फोन" : "Phone"}</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newHospitalForm.phone}
                    onChange={(e) => setNewHospitalForm({ ...newHospitalForm, phone: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "ईमेल" : "Email"}</label>
                  <input
                    type="email"
                    placeholder="info@hospital.org"
                    value={newHospitalForm.email}
                    onChange={(e) => setNewHospitalForm({ ...newHospitalForm, email: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "पता" : "Address"}</label>
                <input
                  type="text"
                  placeholder="Street Address, City, State"
                  value={newHospitalForm.address}
                  onChange={(e) => setNewHospitalForm({ ...newHospitalForm, address: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "विवरण" : "Description"}</label>
                <textarea
                  rows="2"
                  placeholder="Specialization and facilities overview..."
                  value={newHospitalForm.description}
                  onChange={(e) => setNewHospitalForm({ ...newHospitalForm, description: e.target.value })}
                  style={{ ...fieldInputStyle, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddHospitalModal(false)} style={modalCancelBtnStyle}>
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button type="submit" style={modalSubmitBtnStyle}>
                  {isHi ? "अस्पताल सहेजें" : "Save Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT HOSPITAL */}
      {showEditHospitalModal && (
        <div style={modalOverlayStyle} onClick={() => setShowEditHospitalModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconEdit size={18} color="#0284C7" />
                <span>{isHi ? "अस्पताल जानकारी संपादित करें" : "Edit Hospital Details"}</span>
              </h3>
              <button type="button" onClick={() => setShowEditHospitalModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <form onSubmit={handleUpdateHospitalSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={fieldLabelStyle}>{isHi ? "अस्पताल का नाम" : "Hospital Name"} *</label>
                <input
                  type="text"
                  required
                  value={editHospitalForm.name}
                  onChange={(e) => setEditHospitalForm({ ...editHospitalForm, name: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "फोन" : "Phone"}</label>
                  <input
                    type="text"
                    value={editHospitalForm.phone}
                    onChange={(e) => setEditHospitalForm({ ...editHospitalForm, phone: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "ईमेल" : "Email"}</label>
                  <input
                    type="email"
                    value={editHospitalForm.email}
                    onChange={(e) => setEditHospitalForm({ ...editHospitalForm, email: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "पता" : "Address"}</label>
                <input
                  type="text"
                  value={editHospitalForm.address}
                  onChange={(e) => setEditHospitalForm({ ...editHospitalForm, address: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "विवरण" : "Description"}</label>
                <textarea
                  rows="2"
                  value={editHospitalForm.description}
                  onChange={(e) => setEditHospitalForm({ ...editHospitalForm, description: e.target.value })}
                  style={{ ...fieldInputStyle, resize: "none" }}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "स्थिति" : "Status"}</label>
                <select
                  value={editHospitalForm.status}
                  onChange={(e) => setEditHospitalForm({ ...editHospitalForm, status: e.target.value })}
                  style={fieldInputStyle}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowEditHospitalModal(false)} style={modalCancelBtnStyle}>
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button type="submit" style={modalSubmitBtnStyle}>
                  {isHi ? "अपडेट करें" : "Update Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EMPLOYEE */}
      {showAddEmployeeModal && selectedHospital && (
        <div style={modalOverlayStyle} onClick={() => setShowAddEmployeeModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconUsers size={18} color="#0284C7" />
                <span>{isHi ? "नया डॉक्टर / कर्मचारी जोड़ें" : "Add Doctor / Employee"}</span>
              </h3>
              <button type="button" onClick={() => setShowAddEmployeeModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: "12px", color: "#1E40AF" }}>
              <strong>Staff Desk Provisioning:</strong> Enter the Login Email ID and Password for this doctor or staff member. They will use these exact credentials to sign in to their clinical desk.
            </div>

            <form onSubmit={handleAddEmployeeSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={fieldLabelStyle}>{isHi ? "पूरा नाम" : "Doctor / Staff Full Name"} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Sharma / Rahul Verma"
                  value={newEmployeeForm.name}
                  onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, name: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "लॉगिन ईमेल आईडी" : "Login Email ID"} *</label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@hospital.com"
                    value={newEmployeeForm.email}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, email: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "कर्मचारी आईडी" : "Employee / Badge ID"}</label>
                  <input
                    type="text"
                    placeholder="e.g. DOC-101"
                    value={newEmployeeForm.employee_id}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, employee_id: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "भूमिका (Role)" : "Role"} *</label>
                  <select
                    value={newEmployeeForm.role}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, role: e.target.value })}
                    style={fieldInputStyle}
                  >
                    <option value="doctor">DOCTOR</option>
                    <option value="admin">HOSPITAL ADMIN</option>
                    <option value="staff">STAFF</option>
                    <option value="receptionist">RECEPTIONIST</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>{isHi ? "विभाग (Department)" : "Department"} *</label>
                  <select
                    value={newEmployeeForm.department}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, department: e.target.value })}
                    style={fieldInputStyle}
                  >
                    {hospitalDepts.map((d) => (
                      <option key={d.dept_code} value={d.dept_code}>
                        {d.name}
                      </option>
                    ))}
                    <option value="all">All Departments (Admin)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "फोन" : "Phone Number"}</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newEmployeeForm.phone}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, phone: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "लॉगिन पासवर्ड" : "Desk Login Password"} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pass123"
                    value={newEmployeeForm.password}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, password: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddEmployeeModal(false)} style={modalCancelBtnStyle}>
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button type="submit" style={modalSubmitBtnStyle}>
                  {isHi ? "कर्मचारी जोड़ें" : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3.5: EMPLOYEE CREDENTIALS DISPLAY (Post-Creation) */}
      {createdCredentials && (
        <div style={modalOverlayStyle} onClick={() => setCreatedCredentials(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconCheckCircle size={18} color="#16A34A" />
                <span>{isHi ? "कर्मचारी क्रेडेंशियल तैयार हैं" : "Employee Account Provisioned"}</span>
              </h3>
              <button type="button" onClick={() => setCreatedCredentials(null)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: "#F0F9FF", border: "1px solid #BAE6FD", fontSize: "12px", color: "#0369A1" }}>
              <strong>Account Created:</strong> Share the assigned Employee ID (or Login Email) and temporary password with this doctor or staff member so they can sign in.
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Name</span>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>{createdCredentials.name}</div>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Role</span>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#0284C7", textTransform: "uppercase" }}>{createdCredentials.role}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Assigned Employee ID</span>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#1E40AF" }}>{createdCredentials.employee_id || "N/A"}</div>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Login Email</span>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>{createdCredentials.email}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Temporary Password</span>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#DC2626", fontFamily: "monospace" }}>{createdCredentials.password}</div>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Hospital</span>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#475569" }}>{createdCredentials.hospital_name}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  const text = `Hospital: ${createdCredentials.hospital_name}\nRole: ${createdCredentials.role.toUpperCase()}\nName: ${createdCredentials.name}\nAssigned ID: ${createdCredentials.employee_id}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
                  navigator.clipboard.writeText(text);
                  notify(isHi ? "क्रेडेंशियल कॉपी हो गए!" : "Credentials copied to clipboard!");
                }}
                style={{ ...modalSubmitBtnStyle, background: "#0284C7", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <IconCopy size={14} />
                <span>{isHi ? "क्रेडेंशियल कॉपी करें" : "Copy Credentials"}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                style={modalCancelBtnStyle}
              >
                {isHi ? "बंद करें" : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT EMPLOYEE */}
      {showEditEmployeeModal && (
        <div style={modalOverlayStyle} onClick={() => setShowEditEmployeeModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconEdit size={18} color="#0284C7" />
                <span>{isHi ? "कर्मचारी रिकॉर्ड संपादित करें" : "Edit Employee Record"}</span>
              </h3>
              <button type="button" onClick={() => setShowEditEmployeeModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <form onSubmit={handleUpdateEmployeeSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={fieldLabelStyle}>{isHi ? "पूरा नाम" : "Full Name"} *</label>
                <input
                  type="text"
                  required
                  value={editEmployeeForm.name}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, name: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "भूमिका" : "Role"}</label>
                  <select
                    value={editEmployeeForm.role}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, role: e.target.value })}
                    style={fieldInputStyle}
                  >
                    <option value="doctor">DOCTOR</option>
                    <option value="admin">HOSPITAL ADMIN</option>
                    <option value="staff">STAFF</option>
                    <option value="receptionist">RECEPTIONIST</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>{isHi ? "विभाग" : "Department"}</label>
                  <select
                    value={editEmployeeForm.department}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, department: e.target.value })}
                    style={fieldInputStyle}
                  >
                    {hospitalDepts.map((d) => (
                      <option key={d.dept_code} value={d.dept_code}>
                        {d.name}
                      </option>
                    ))}
                    <option value="all">All Departments (Admin)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "कर्मचारी आईडी" : "Employee ID"}</label>
                  <input
                    type="text"
                    value={editEmployeeForm.employee_id}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, employee_id: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>{isHi ? "फोन" : "Phone"}</label>
                  <input
                    type="text"
                    value={editEmployeeForm.phone}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, phone: e.target.value })}
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "स्थिति" : "Status"}</label>
                <select
                  value={editEmployeeForm.status}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, status: e.target.value })}
                  style={fieldInputStyle}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Deactivated</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowEditEmployeeModal(false)} style={modalCancelBtnStyle}>
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button type="submit" style={modalSubmitBtnStyle}>
                  {isHi ? "सहेजें" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD DEPARTMENT */}
      {showAddDeptModal && (
        <div style={modalOverlayStyle} onClick={() => setShowAddDeptModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconBuilding size={18} color="#0284C7" />
                <span>{isHi ? "नया विभाग जोड़ें" : "Add Clinical Department"}</span>
              </h3>
              <button type="button" onClick={() => setShowAddDeptModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <form onSubmit={handleAddDeptSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={fieldLabelStyle}>{isHi ? "विभाग का नाम" : "Department Name"} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology & ECG"
                  value={newDeptForm.name}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "विभाग कोड" : "Dept Code"} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cardiology"
                  value={newDeptForm.dept_code}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, dept_code: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "विवरण" : "Description"}</label>
                <textarea
                  rows="2"
                  placeholder="Clinical procedures overview..."
                  value={newDeptForm.description}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, description: e.target.value })}
                  style={{ ...fieldInputStyle, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddDeptModal(false)} style={modalCancelBtnStyle}>
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button type="submit" style={modalSubmitBtnStyle}>
                  {isHi ? "विभाग सहेजें" : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD DESK */}
      {showAddDeskModal && selectedHospital && (
        <div style={modalOverlayStyle} onClick={() => setShowAddDeskModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconDesk size={18} color="#0284C7" />
                <span>{isHi ? "नया सेवा डेस्क जोड़ें" : "Add New Service Desk"}</span>
              </h3>
              <button type="button" onClick={() => setShowAddDeskModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <form onSubmit={handleAddDeskSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={fieldLabelStyle}>{isHi ? "विभाग चुनें" : "Assign to Department"} *</label>
                <select
                  value={newDeskForm.dept_code}
                  onChange={(e) => setNewDeskForm({ ...newDeskForm, dept_code: e.target.value })}
                  style={fieldInputStyle}
                  required
                >
                  {hospitalDepts.map((d) => (
                    <option key={d.dept_code} value={d.dept_code}>
                      {d.name} ({d.dept_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "डेस्क नाम / संख्या" : "Desk Name / Number"} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OPD Consultation Desk 3"
                  value={newDeskForm.desk_name}
                  onChange={(e) => setNewDeskForm({ ...newDeskForm, desk_name: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "प्रारंभिक स्थिति" : "Initial Status"}</label>
                <select
                  value={newDeskForm.status}
                  onChange={(e) => setNewDeskForm({ ...newDeskForm, status: e.target.value })}
                  style={fieldInputStyle}
                >
                  <option value="AVAILABLE">AVAILABLE (Open for queue)</option>
                  <option value="ACTIVE">ACTIVE (Currently serving)</option>
                  <option value="OFFLINE">OFFLINE (Closed)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddDeskModal(false)} style={modalCancelBtnStyle}>
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button type="submit" style={modalSubmitBtnStyle}>
                  {isHi ? "डेस्क जोड़ें" : "Add Desk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop: "40px" }}>
        <Footer language={language} />
      </div>
    </div>
  );
}

/**
 * SuperAdminHospitalIllustration: Vector Healthcare Visual matching Image 2
 */
function SuperAdminHospitalIllustration() {
  return (
    <svg
      viewBox="0 0 540 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", maxHeight: "320px", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="540" height="320" fill="url(#skyGrad)" />
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0F9FF" />
          <stop offset="60%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>

      {/* Clouds */}
      <ellipse cx="90" cy="50" rx="35" ry="14" fill="#FFFFFF" opacity="0.8" />
      <ellipse cx="440" cy="60" rx="42" ry="16" fill="#FFFFFF" opacity="0.85" />

      {/* Hospital Modern Building */}
      <rect x="140" y="70" width="260" height="210" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      <rect x="230" y="45" width="80" height="30" rx="6" fill="#0284C7" />
      <text x="270" y="65" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif">HQ</text>

      {/* Medical Cross Sign */}
      <circle cx="270" cy="110" r="18" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
      <path d="M270 100v20M260 110h20" stroke="#0369A1" strokeWidth="4" strokeLinecap="round" />

      {/* Windows Grid */}
      <rect x="160" y="145" width="34" height="24" rx="4" fill="#BAE6FD" />
      <rect x="204" y="145" width="34" height="24" rx="4" fill="#BAE6FD" />
      <rect x="302" y="145" width="34" height="24" rx="4" fill="#BAE6FD" />
      <rect x="346" y="145" width="34" height="24" rx="4" fill="#BAE6FD" />

      <rect x="160" y="185" width="34" height="24" rx="4" fill="#BAE6FD" />
      <rect x="204" y="185" width="34" height="24" rx="4" fill="#BAE6FD" />
      <rect x="302" y="185" width="34" height="24" rx="4" fill="#BAE6FD" />
      <rect x="346" y="185" width="34" height="24" rx="4" fill="#BAE6FD" />

      {/* Main Glass Door */}
      <rect x="245" y="215" width="50" height="65" rx="4" fill="#0F172A" />
      <rect x="250" y="220" width="18" height="55" rx="2" fill="#7DD3FC" opacity="0.8" />
      <rect x="272" y="220" width="18" height="55" rx="2" fill="#7DD3FC" opacity="0.8" />

      {/* Trees & Landscaping */}
      <circle cx="90" cy="255" r="28" fill="#0EA5E9" opacity="0.85" />
      <rect x="86" y="270" width="8" height="15" fill="#0F172A" />
      <circle cx="450" cy="255" r="32" fill="#0284C7" opacity="0.85" />
      <rect x="446" y="270" width="8" height="15" fill="#0F172A" />
    </svg>
  );
}

// ------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------
const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "24px",
  border: "1.5px solid #E2E8F0",
  padding: "26px",
  boxShadow: "0 4px 20px -2px rgba(2, 132, 199, 0.04)",
};

const feedbackToastStyle = {
  margin: "0 0 18px 0",
  padding: "12px 20px",
  borderRadius: "12px",
  background: "#F0F9FF",
  border: "1px solid #BAE6FD",
  color: "#0369A1",
  fontSize: "13.5px",
  fontWeight: 700,
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.12)",
};

const searchInputStyle = {
  width: "100%",
  padding: "9px 14px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  fontSize: "12.5px",
  outline: "none",
};

const hospitalCardStyle = {
  borderRadius: "18px",
  padding: "18px",
  border: "1.5px solid #E2E8F0",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  transition: "all 0.15s ease",
};

const hospitalStatusBadgeStyle = (status) => ({
  fontSize: "10px",
  fontWeight: 800,
  padding: "2px 7px",
  borderRadius: "6px",
  background: status === "active" ? "#F0FDF4" : "#FEF2F2",
  color: status === "active" ? "#166534" : "#DC2626",
  border: status === "active" ? "1px solid #BBF7D0" : "1px solid #FECACA",
});

const primarySmallBtnStyle = {
  flex: 1,
  padding: "9px 12px",
  borderRadius: "10px",
  background: "#0284C7",
  color: "#FFFFFF",
  border: "none",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const secondarySmallBtnStyle = {
  padding: "9px 12px",
  borderRadius: "10px",
  background: "#F8FAFC",
  color: "#334155",
  border: "1px solid #CBD5E1",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
};

const actionBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "9px 16px",
  borderRadius: "10px",
  background: "#0284C7",
  color: "#FFFFFF",
  border: "none",
  fontWeight: 800,
  fontSize: "12.5px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
};

const sidebarSecondaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "11px 16px",
  borderRadius: "12px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
  outline: "none",
};

const sidebarSelectStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#0F172A",
  fontSize: "13px",
  fontWeight: 700,
  outline: "none",
};

const tableThStyle = {
  padding: "12px 14px",
  fontWeight: 800,
  color: "#475569",
  fontSize: "11.5px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tableTdStyle = {
  padding: "12px 14px",
  color: "#334155",
};

const roleBadgeStyle = (role) => {
  if (role === "doctor") return { padding: "2px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#F0F9FF", color: "#0284C7", border: "1px solid #BAE6FD" };
  if (role === "admin") return { padding: "2px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" };
  if (role === "receptionist") return { padding: "2px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#F3E8FF", color: "#7E22CE", border: "1px solid #E9D5FF" };
  return { padding: "2px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" };
};

const empStatusBadgeStyle = (status) => ({
  fontSize: "10px",
  fontWeight: 800,
  padding: "2px 6px",
  borderRadius: "4px",
  background: status === "inactive" ? "#FEF2F2" : "#F0FDF4",
  color: status === "inactive" ? "#DC2626" : "#166534",
});

const copySmallBtnStyle = {
  padding: "4px 8px",
  borderRadius: "8px",
  border: "1px solid #BFDBFE",
  background: "#EFF6FF",
  color: "#1E40AF",
  fontSize: "11px",
  cursor: "pointer",
};

const editSmallBtnStyle = {
  padding: "4px 10px",
  borderRadius: "8px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#334155",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const deleteSmallBtnStyle = {
  padding: "4px 8px",
  borderRadius: "8px",
  border: "1px solid #FECACA",
  background: "#FEF2F2",
  color: "#DC2626",
  fontSize: "11px",
  cursor: "pointer",
};

const deptDeskBoxStyle = {
  background: "#F8FAFC",
  borderRadius: "14px",
  padding: "14px",
  border: "1px solid #E2E8F0",
};

const deskCardItemStyle = (status) => ({
  padding: "12px",
  borderRadius: "10px",
  background: status === "ACTIVE" ? "#F0F9FF" : status === "BUSY" ? "#FFFBEB" : status === "AVAILABLE" ? "#F8FAFC" : "#FFFFFF",
  border: status === "ACTIVE" ? "1.5px solid #0284C7" : status === "BUSY" ? "1.5px solid #F59E0B" : "1px solid #CBD5E1",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
});

const deskStatusPillStyle = (status) => {
  if (status === "ACTIVE") return { padding: "1px 5px", borderRadius: "4px", fontSize: "9px", fontWeight: 800, background: "#0284C7", color: "#FFFFFF" };
  if (status === "BUSY") return { padding: "1px 5px", borderRadius: "4px", fontSize: "9px", fontWeight: 800, background: "#D97706", color: "#FFFFFF" };
  if (status === "AVAILABLE") return { padding: "1px 5px", borderRadius: "4px", fontSize: "9px", fontWeight: 800, background: "#E0F2FE", color: "#0284C7" };
  return { padding: "1px 5px", borderRadius: "4px", fontSize: "9px", fontWeight: 800, background: "#94A3B8", color: "#FFFFFF" };
};

const deleteDeskIconBtnStyle = {
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  borderRadius: "4px",
  color: "#DC2626",
  fontSize: "10px",
  fontWeight: 800,
  cursor: "pointer",
  padding: "1px 5px",
};

const deleteDeptIconBtnStyle = {
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  borderRadius: "6px",
  color: "#DC2626",
  fontSize: "11px",
  cursor: "pointer",
  padding: "3px 6px",
};

const toggleDeskBtnStyle = {
  marginTop: "4px",
  padding: "4px 8px",
  borderRadius: "6px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#334155",
  fontSize: "10.5px",
  fontWeight: 700,
  cursor: "pointer",
};

const deptCardStyle = {
  background: "#FFFFFF",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid #E2E8F0",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "#334155",
  marginBottom: "4px",
};

const fieldInputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  fontSize: "13px",
  outline: "none",
  background: "#FFFFFF",
  boxSizing: "border-box",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.5)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: "20px",
};

const modalContentStyle = {
  background: "#FFFFFF",
  borderRadius: "22px",
  maxWidth: "500px",
  width: "100%",
  padding: "26px",
  boxShadow: "0 24px 48px -10px rgba(0, 0, 0, 0.25)",
  border: "1px solid #E2E8F0",
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalCloseIconBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "18px",
  color: "#94A3B8",
  cursor: "pointer",
};

const modalCancelBtnStyle = {
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#64748B",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};

const modalSubmitBtnStyle = {
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
};

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

const IconKey = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-1.5 1.5L14 9a5 5 0 1 0 3 3l3-3 2-2z" />
    <circle cx="7.5" cy="16.5" r="1.5" />
    <path d="M15.5 7.5L18 10" />
  </svg>
);

const IconEye = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconActivity = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default function SuperAdminPage({
  currentUser,
  language = "en",
  onSelectHospitalTenant,
  navigateTo,
  hospitalBranding = null,
  onUpdateHospitalBranding = null,
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

  // Navigation Tabs: "overview" | "hospitals" | "employees" | "desks" | "depts" | "branding"
  const [activeTab, setActiveTab] = useState("overview");

  // Deep-Dive Selected Hospital Mode
  const [selectedHospital, setSelectedHospital] = useState(null);
  const selectedHospitalRef = useRef(selectedHospital);

  // Selected Hospital Sub-Data & Live Operations Telemetry
  const [hospitalEmployees, setHospitalEmployees] = useState([]);
  const [hospitalDesksData, setHospitalDesksData] = useState({ departments: [] });
  const [hospitalDepts, setHospitalDepts] = useState([]);
  const [hospitalAnalytics, setHospitalAnalytics] = useState(null);
  const [hospitalQueueSnapshot, setHospitalQueueSnapshot] = useState([]);
  const [hospitalServingTickets, setHospitalServingTickets] = useState([]);
  const [hospitalVisitsData, setHospitalVisitsData] = useState({ summary: {}, visits: [] });
  const [visitHistorySearchQuery, setVisitHistorySearchQuery] = useState("");
  const [visitHistoryStatusFilter, setVisitHistoryStatusFilter] = useState("all");

  // Modals
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [showEditHospitalModal, setShowEditHospitalModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddDeskModal, setShowAddDeskModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Hospital Branding & White-Labeling States
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [brandingTargetHospital, setBrandingTargetHospital] = useState(null);
  const [brandingForm, setBrandingForm] = useState({
    logo_url: "",
    primary_color: "#0284C7",
    secondary_color: "#0369A1",
    accent_color: "#F0F9FF",
    tagline: "Care you can trust • NABH Accredited",
    emergency_helpline: "Emergency Helpline: 108 / +91 98765 43210",
    slip_footer_text: "Non-transferable official patient record. Please keep until consultation is complete.",
    opd_start_time: "08:00",
    opd_end_time: "20:00",
    registration_cutoff_time: "19:00",
    operating_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    closed_notice: "Registrations are closed for today. Please visit during OPD hours or book an appointment for tomorrow.",
  });
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [activeBrandingTab, setActiveBrandingTab] = useState("theme"); // "theme" | "slip" | "hours"

  const getAuthHeaders = useCallback(() => {
    const headers = { "Content-Type": "application/json" };
    if (currentUser?.email) {
      headers["X-User-Email"] = currentUser.email;
    }
    try {
      const token = localStorage.getItem("ai_queue_token") || localStorage.getItem("token") || currentUser?.token;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {}
    return headers;
  }, [currentUser?.email, currentUser?.token]);

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
    password: "",
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
    assigned_employee_id: "",
  });

  // Edit Department & Desk Modal States
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [editDeptForm, setEditDeptForm] = useState({
    dept_code: "",
    name: "",
    description: "",
  });

  const [showEditDeskModal, setShowEditDeskModal] = useState(false);
  const [editDeskForm, setEditDeskForm] = useState({
    id: null,
    desk_name: "",
    dept_code: "",
    status: "AVAILABLE",
    assigned_employee_id: "",
  });

  // Dedicated Assign Desk Modal States
  const [showAssignDeskModal, setShowAssignDeskModal] = useState(false);
  const [assignDeskTarget, setAssignDeskTarget] = useState({ desk: null, employee_id: "" });
  const [assignSearchQuery, setAssignSearchQuery] = useState("");

  // Normalize desks data ensuring department grouping and desk counters are always populated
  const normalizeDesksData = useCallback((rawDesks, deptsList = []) => {
    if (!rawDesks) return { total_desks: 0, active_desks: 0, departments: [] };
    if (!Array.isArray(rawDesks) && Array.isArray(rawDesks.departments)) {
      return rawDesks;
    }
    const deskList = Array.isArray(rawDesks) ? rawDesks : (rawDesks.list || rawDesks.raw || []);
    const deptMap = {};
    (deptsList || []).forEach((d) => {
      deptMap[d.dept_code] = {
        dept_code: d.dept_code,
        name: d.name,
        description: d.description || "",
        total_desks: 0,
        active_desks: 0,
        desks: [],
      };
    });
    let activeCount = 0;
    deskList.forEach((desk) => {
      const dCode = desk.dept_code || "consultation";
      if (!deptMap[dCode]) {
        deptMap[dCode] = {
          dept_code: dCode,
          name: desk.department_name || dCode,
          description: "",
          total_desks: 0,
          active_desks: 0,
          desks: [],
        };
      }
      deptMap[dCode].total_desks += 1;
      const st = (desk.status || "").toUpperCase();
      if (["ACTIVE", "AVAILABLE", "OCCUPIED", "BUSY"].includes(st)) {
        deptMap[dCode].active_desks += 1;
        activeCount += 1;
      }
      deptMap[dCode].desks.push({
        ...desk,
        assigned_employee_id: desk.assigned_employee_id || null,
        assigned_user_id: desk.assigned_user_id || null,
        assigned_employee_name: desk.assigned_employee_name || desk.staff_name || "",
        assigned_employee_role: desk.assigned_employee_role || "",
        assigned_employee_code: desk.assigned_employee_code || "",
        assigned_employee_status: desk.assigned_employee_status || "inactive",
        assigned_employee_last_login: desk.assigned_employee_last_login || null,
        staff_name: desk.assigned_employee_name || desk.staff_name || "",
      });
    });
    return {
      total_desks: deskList.length,
      active_desks: activeCount,
      departments: Object.values(deptMap),
    };
  }, []);

  const getEmployeeCurrentDesk = useCallback((empOrId) => {
    if (!empOrId) return null;
    let targetIds = [];

    if (typeof empOrId === "object") {
      targetIds = [empOrId.employee_id_num, empOrId.user_id, empOrId.id].filter(Boolean).map(Number);
    } else {
      targetIds = [Number(empOrId)];
    }

    const allDepts = hospitalDesksData.departments || [];
    // 1. Precise direct ID match (employees.id or users.id)
    for (const dept of allDepts) {
      for (const d of dept.desks || []) {
        if (d.assigned_employee_id && targetIds.includes(Number(d.assigned_employee_id))) {
          return d;
        }
        if (d.assigned_user_id && targetIds.includes(Number(d.assigned_user_id))) {
          return d;
        }
      }
    }

    // 2. Name match fallback
    if (typeof empOrId === "object") {
      const targetName = (empOrId.name || empOrId.username || "").trim().toLowerCase();
      if (targetName) {
        for (const dept of allDepts) {
          for (const d of dept.desks || []) {
            if (d.assigned_employee_name && d.assigned_employee_name.trim().toLowerCase() === targetName) {
              return d;
            }
          }
        }
      }
    }

    return null;
  }, [hospitalDesksData]);

  // Search & Pagination inside Drill-In View
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [isTogglingEmpStatus, setIsTogglingEmpStatus] = useState(null);
  const [deskSearchQuery, setDeskSearchQuery] = useState("");
  const [deskPage, setDeskPage] = useState(1);

  // Helper to format relative login / activity time
  const formatRelativeLogin = useCallback((isoString) => {
    if (!isoString) return isHi ? "लॉगिन नहीं किया" : "Not logged in";
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffSec = Math.max(0, Math.floor((now - d) / 1000));
      if (diffSec < 60) return isHi ? "अभी सक्रिय" : "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ${isHi ? "पहले" : "ago"}`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ${isHi ? "पहले" : "ago"}`;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  }, [isHi]);

  // Fast toggle active/inactive status for doctors & staff
  const handleToggleEmployeeStatus = async (emp) => {
    if (!selectedHospital || !emp) return;
    const currentIsActive = (emp.status || "").toLowerCase() === "active";
    const newStatus = currentIsActive ? "inactive" : "active";
    const empTargetId = emp.user_id || emp.id || emp.employee_id_num;
    setIsTogglingEmpStatus(empTargetId);
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/employees/${empTargetId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setHospitalEmployees((prev) =>
          prev.map((e) =>
            (e.user_id === empTargetId || e.id === empTargetId || e.employee_id_num === empTargetId)
              ? { ...e, status: newStatus }
              : e
          )
        );
        notify(
          isHi
            ? `'${emp.name || emp.username}' की स्थिति '${newStatus === "active" ? "सक्रिय (ऑनलाइन)" : "निष्क्रिय (ऑफलाइन)"}' में बदली गई!`
            : `Status for '${emp.name || emp.username}' changed to ${newStatus === "active" ? "Active (Online)" : "Inactive (Offline)"}!`
        );
        fetchHospitalDesks(selectedHospital.hospital_code);
      } else {
        notify(data.message || (isHi ? "स्थिति बदलने में विफल" : "Failed to toggle status"));
      }
    } catch (err) {
      console.error("Error toggling employee status:", err);
      notify(isHi ? "सर्वर से कनेक्ट करने में विफल" : "Network error toggling status");
    } finally {
      setIsTogglingEmpStatus(null);
    }
  };

  // Change Password Modal States for Doctors & Staff
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordTargetEmployee, setPasswordTargetEmployee] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(null);

  const notify = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  // Reset drill-in search & pagination whenever selected hospital changes
  useEffect(() => {
    setEmployeeSearchQuery("");
    setEmployeePage(1);
    setEmployeeStatusFilter("all");
    setDeskSearchQuery("");
    setDeskPage(1);
  }, [selectedHospital?.hospital_code]);

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
        const list = hospitalsRes.hospitals || [];
        setHospitals(list);
        if (list.length > 0) {
          const preferredCode = currentUser?.primary_hospital_code || currentUser?.hospital_code;
          const match = preferredCode ? list.find((h) => h.hospital_code === preferredCode) : null;
          if (!selectedHospitalRef.current || !list.some((h) => h.hospital_code === selectedHospitalRef.current.hospital_code)) {
            setSelectedHospital(match || list[0]);
          }
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
      const [detailRes, empRes, desksRes, deptsRes, analyticsRes, snapshotRes, visitsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hCode}`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hCode}/employees`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hCode}/desks`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hCode}/departments`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/v1/plugin/analytics/${hCode}`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/v1/plugin/queue/snapshot/${hCode}`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hCode}/visits`, { headers }).then((r) => r.json()).catch(() => null),
      ]);

      if (detailRes && detailRes.status === "success") {
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
      if (empRes && empRes.status === "success") {
        setHospitalEmployees(empRes.employees);
      }
      const depts = (deptsRes && deptsRes.status === "success") ? deptsRes.departments : [];
      if (deptsRes && deptsRes.status === "success") {
        setHospitalDepts(depts);
      }
      if (desksRes && desksRes.status === "success") {
        setHospitalDesksData(normalizeDesksData(desksRes.desks, depts));
      }
      if (analyticsRes) {
        setHospitalAnalytics(analyticsRes);
      }
      if (snapshotRes) {
        setHospitalQueueSnapshot(Array.isArray(snapshotRes.snapshot) ? snapshotRes.snapshot : []);
        setHospitalServingTickets(Array.isArray(snapshotRes.serving) ? snapshotRes.serving : []);
      }
      if (visitsRes && visitsRes.status === "success") {
        setHospitalVisitsData({
          summary: visitsRes.summary || {},
          visits: Array.isArray(visitsRes.visits) ? visitsRes.visits : [],
        });
      }
    } catch (e) {
      console.log("Deep dive fetch error:", e);
    }
  }, [getAuthHeaders, normalizeDesksData]);

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
        headers: getAuthHeaders(),
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
        alert(data.message || data.detail || "Failed to create hospital.");
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

  // 4.5. Hospital Branding & White-Labeling Handlers
  const handleOpenBrandingModal = async (hosp) => {
    setBrandingTargetHospital(hosp);
    setActiveBrandingTab("theme");
    // Preload current values or defaults
    setBrandingForm({
      logo_url: hosp.logo_url || "",
      primary_color: "#0284C7",
      secondary_color: "#0369A1",
      accent_color: "#F0F9FF",
      tagline: "Care you can trust • NABH Accredited",
      emergency_helpline: "Emergency Helpline: 108 / +91 98765 43210",
      slip_footer_text: "Non-transferable official patient record. Please keep until consultation is complete.",
      opd_start_time: "08:00",
      opd_end_time: "20:00",
      registration_cutoff_time: "19:00",
      operating_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      closed_notice: "Registrations are closed for today. Please visit during OPD hours or book an appointment for tomorrow.",
    });
    setShowBrandingModal(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${hosp.hospital_code}/branding`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.branding) {
        setBrandingForm({
          logo_url: data.branding.logo_url || hosp.logo_url || "",
          primary_color: data.branding.primary_color || "#0284C7",
          secondary_color: data.branding.secondary_color || "#0369A1",
          accent_color: data.branding.accent_color || "#F0F9FF",
          tagline: data.branding.tagline || "Care you can trust • NABH Accredited",
          emergency_helpline: data.branding.emergency_helpline || "Emergency Helpline: 108 / +91 98765 43210",
          slip_footer_text: data.branding.slip_footer_text || "Non-transferable official patient record. Please keep until consultation is complete.",
          opd_start_time: data.branding.opd_start_time || "08:00",
          opd_end_time: data.branding.opd_end_time || "20:00",
          registration_cutoff_time: data.branding.registration_cutoff_time || "19:00",
          operating_days: Array.isArray(data.branding.operating_days) ? data.branding.operating_days : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          closed_notice: data.branding.closed_notice || "Registrations are closed for today. Please visit during OPD hours or book an appointment for tomorrow.",
        });
      }
    } catch (e) {
      console.log("Error loading branding:", e);
    }
  };

  const handleSaveBrandingSubmit = async (e) => {
    e.preventDefault();
    if (!brandingTargetHospital) return;
    setIsSavingBranding(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${brandingTargetHospital.hospital_code}/branding`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(brandingForm),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowBrandingModal(false);
        notify(isHi ? `🎨 '${brandingTargetHospital.name}' का ब्रांडिंग व समय सेटिंग्स सहेजा गया!` : `🎨 Branding & operating hours updated for '${brandingTargetHospital.name}'!`);
        
        // Dispatch local event for other tabs/listeners
        window.dispatchEvent(new CustomEvent("hospital_branding_updated", {
          detail: {
            hospital_code: brandingTargetHospital.hospital_code,
            branding: data.branding,
          },
        }));

        // If current tenant matches or callback is provided, update global state immediately
        if (typeof onUpdateHospitalBranding === "function") {
          const activeHospCode = localStorage.getItem("ai_queue_current_hospital") || "city-hospital-01";
          if (String(activeHospCode).trim() === String(brandingTargetHospital.hospital_code).trim()) {
            onUpdateHospitalBranding(data.branding);
          }
        }

        fetchGlobalData();
        if (selectedHospital?.hospital_code === brandingTargetHospital.hospital_code) {
          fetchHospitalDeepDive(selectedHospital.hospital_code);
        }
      } else {
        alert(data.detail || data.message || "Failed to save branding settings.");
      }
    } catch (err) {
      alert(`Error saving branding: ${err.message}`);
    } finally {
      setIsSavingBranding(false);
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
      const payload = { ...editEmployeeForm };
      if (!payload.password || !payload.password.trim()) {
        delete payload.password;
      }
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/employees/${editEmployeeForm.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowEditEmployeeModal(false);
        setEditEmployeeForm({ ...editEmployeeForm, password: "" });
        notify(isHi ? `✓ कर्मचारी रिकॉर्ड एवं पासवर्ड अपडेट हुआ!` : `✓ Employee record and credentials updated!`);
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
    const empName = emp.name || emp.username || emp.email;
    const confirmMsg = isHi
      ? `क्या आप वाकई कर्मचारी/डॉक्टर '${empName}' को हटाना चाहते हैं?`
      : `Are you sure you want to remove employee/doctor '${empName}'?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const empId = emp.id || emp.employee_id_num;
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/employees/${empId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        notify(isHi ? `🗑️ कर्मचारी '${empName}' हटा दिया गया!` : `🗑️ Employee '${empName}' removed!`);
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
        window.dispatchEvent(new CustomEvent("hospital_departments_updated", { detail: { hospital_code: selectedHospital.hospital_code } }));
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
        window.dispatchEvent(new CustomEvent("hospital_departments_updated", { detail: { hospital_code: selectedHospital.hospital_code } }));
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
    if (!newDeskForm.dept_code) {
      alert(isHi ? "कृपया पहले एक विभाग चुनें।" : "Please select a department for this desk.");
      return;
    }
    try {
      const payload = {
        dept_code: newDeskForm.dept_code,
        desk_name: newDeskForm.desk_name,
        status: newDeskForm.status || "AVAILABLE",
        assigned_employee_id: newDeskForm.assigned_employee_id ? Number(newDeskForm.assigned_employee_id) : null,
      };
      const res = await fetch(`${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/desks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowAddDeskModal(false);
        setNewDeskForm({
          dept_code: hospitalDepts[0]?.dept_code || "consultation",
          desk_name: "",
          status: "AVAILABLE",
          assigned_employee_id: "",
        });
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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

  // 13. Update Department Handler
  const handleUpdateDepartmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/departments/${editDeptForm.dept_code}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: editDeptForm.name,
            description: editDeptForm.description,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowEditDeptModal(false);
        notify(isHi ? `✓ विभाग जानकारी अद्यतन की गई!` : `✓ Department '${data.department.name}' updated!`);
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        window.dispatchEvent(new CustomEvent("hospital_departments_updated", { detail: { hospital_code: selectedHospital.hospital_code } }));
      } else {
        alert(data.detail || "Failed to update department.");
      }
    } catch (err) {
      alert(`Error updating department: ${err.message}`);
    }
  };

  // 14. Update Desk Handler
  const handleUpdateDeskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHospital || !editDeskForm.id) return;
    try {
      const payload = {
        desk_name: editDeskForm.desk_name,
        dept_code: editDeskForm.dept_code,
        assigned_employee_id: editDeskForm.assigned_employee_id ? Number(editDeskForm.assigned_employee_id) : null,
      };
      const res = await fetch(
        `${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/desks/${editDeskForm.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowEditDeskModal(false);
        notify(isHi ? `✓ डेस्क अद्यतन किया गया!` : `✓ Desk '${data.desk.desk_name}' updated!`);
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData();
      } else {
        alert(data.detail || "Failed to update desk.");
      }
    } catch (err) {
      alert(`Error updating desk: ${err.message}`);
    }
  };

  // 14b. Assign Desk to Staff / Doctor Handler
  const handleAssignDesk = async (deskId, employeeId) => {
    if (!selectedHospital || !deskId) return;
    try {
      const empId = employeeId && Number(employeeId) > 0 ? Number(employeeId) : null;
      const res = await fetch(
        `${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/desks/${deskId}/assign`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ assigned_employee_id: empId }),
        }
      );
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setShowAssignDeskModal(false);
        setAssignDeskTarget({ desk: null, employee_id: "" });
        notify(
          empId
            ? (isHi ? `✓ डेस्क को '${data.desk?.assigned_employee_name || "कार्मिक"}' को सौंपा गया!` : `✓ Desk assigned to '${data.desk?.assigned_employee_name || "Staff"}'!`)
            : (isHi ? "✓ डेस्क को अनअसाइन (स्वचालित बे) किया गया!" : "✓ Desk unassigned (set to Auto-Assigned Bay)!")
        );
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData();
      } else {
        alert(data.detail || "Failed to update desk assignment.");
      }
    } catch (err) {
      alert(`Error assigning desk: ${err.message}`);
    }
  };

  // 15. Bulk Update Desk Status by Department
  const handleBulkDeskStatus = async (deptCode, targetStatus) => {
    if (!selectedHospital) return;
    const confirmMsg = isHi
      ? `क्या आप वाकई विभाग '${deptCode}' के सभी डेस्क को ${targetStatus === "AVAILABLE" ? "सक्रिय" : "निष्क्रिय"} करना चाहते हैं?`
      : `Are you sure you want to set all desks in department '${deptCode}' to ${targetStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/desks/bulk-status`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ dept_code: deptCode, status: targetStatus }),
        }
      );
      const data = await res.json();
      if (res.ok && data.status === "success") {
        notify(
          isHi
            ? `✓ ${data.result.updated_count} डेस्क अपडेट किए गए!`
            : `✓ Successfully set ${data.result.updated_count} desks to ${targetStatus}!`
        );
        fetchHospitalDeepDive(selectedHospital.hospital_code);
        fetchGlobalData();
      } else {
        alert(data.detail || "Failed to update desks in bulk.");
      }
    } catch (err) {
      alert(`Error updating desks in bulk: ${err.message}`);
    }
  };


  // 16. Update Employee / Doctor Password Handler
  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHospital || !passwordTargetEmployee) return;
    if (!newPasswordValue || newPasswordValue.trim().length < 4) {
      alert(isHi ? "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।" : "Password must be at least 4 characters.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const empId = passwordTargetEmployee.user_id || passwordTargetEmployee.id || passwordTargetEmployee.employee_id_num;
      const res = await fetch(
        `${API_BASE}/api/v1/superadmin/hospitals/${selectedHospital.hospital_code}/employees/${empId}/password`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            new_password: newPasswordValue.trim(),
            password: newPasswordValue.trim(),
          }),
        }
      );
      
      const contentType = res.headers.get("content-type") || "";
      let data = {};
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned HTTP ${res.status}: ${text.slice(0, 160)}`);
      }

      if (res.ok && data.status === "success") {
        setPasswordUpdateSuccess({
          name: passwordTargetEmployee.name || passwordTargetEmployee.username,
          email: passwordTargetEmployee.email,
          role: passwordTargetEmployee.role,
          password: newPasswordValue.trim(),
          hospital_name: selectedHospital.name,
        });
        notify(
          isHi
            ? `🔑 '${passwordTargetEmployee.name || passwordTargetEmployee.username}' का पासवर्ड सफलतापूर्वक अपडेट किया गया!`
            : `🔑 Password for '${passwordTargetEmployee.name || passwordTargetEmployee.username}' updated successfully!`
        );
      } else {
        alert(data.detail || data.message || "Failed to update password.");
      }
    } catch (err) {
      alert(`Error updating password: ${err.message}`);
    } finally {
      setIsUpdatingPassword(false);
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
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
        }

        @media (max-width: 1200px) {
          .superadmin-tabs-bar {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 980px) {
          .superadmin-tabs-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .tab-button-modern {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 14px;
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0EA5E9", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>
              {isHi ? "लाइव डेटा सिंक" : "Live Sync"}
            </span>
          </div>
        </div>

        <div className="superadmin-tabs-bar">
          {/* Tab 0: Visual Hospital Operations Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`tab-button-modern ${activeTab === "overview" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <IconChart size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {isHi ? "📊 अस्पताल 360°" : "📊 Hospital 360°"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "overview" ? "#FFFFFF" : "#0284C7",
                    color: activeTab === "overview" ? "#0284C7" : "#FFFFFF",
                  }}
                >
                  LIVE
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "overview" ? "#E0F2FE" : "#64748B" }}>
                {isHi ? "लाइव संचालन एवं फ्लो" : "Real-time Operations"}
              </span>
            </div>
          </button>

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

          {/* Tab 5: Hospital Branding & White-Labeling */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("branding");
              const target = selectedHospital || hospitals[0];
              if (target) {
                handleOpenBrandingModal(target);
              }
            }}
            className={`tab-button-modern ${activeTab === "branding" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <span style={{ fontSize: "18px" }}>🎨</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="tab-title-text">
                  {isHi ? "ब्रांडिंग सेटिंग्स" : "Branding"}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "branding" ? "#E0F2FE" : "#64748B" }}>
                {isHi ? "थीम, लोगो, समय, पर्ची" : "Theme, Logo, Schedule"}
              </span>
            </div>
          </button>

        </div>
      </section>

      {/* 3. 2-COLUMN RESPONSIVE DASHBOARD LAYOUT */}
      <div className="superadmin-portal-dashboard">
        {/* LEFT COLUMN: Main Tab Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* TAB 0: 360° VISUAL HOSPITAL OPERATIONS DASHBOARD */}
          {activeTab === "overview" && (() => {
            const currentHosp = selectedHospital || hospitals[0] || null;
            if (!currentHosp) {
              return (
                <div style={standaloneCardStyle}>
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <IconHospital size={44} color="#94A3B8" />
                    <h3 style={{ margin: "14px 0 6px", color: "#0F172A", fontSize: "18px", fontWeight: 800 }}>
                      {isHi ? "कोई अस्पताल उपलब्ध नहीं है" : "No Hospital Data Available"}
                    </h3>
                    <p style={{ margin: "0 0 20px", color: "#64748B", fontSize: "13.5px" }}>
                      {isHi ? "कृपया पहले अस्पताल जोड़ें या नेटवर्क से एक का चयन करें।" : "Please add a hospital first or select one from the directory."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddHospitalModal(true)}
                      style={{
                        ...actionBtnStyle,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                      }}
                    >
                      <IconPlus size={15} />
                      <span>{isHi ? "+ नया अस्पताल जोड़ें" : "+ Add Hospital"}</span>
                    </button>
                  </div>
                </div>
              );
            }

            const activeBranding = currentHosp.branding || hospitalBranding || {};
            const facilityPrimary = activeBranding.primary_color || "#0284C7";
            const facilitySecondary = activeBranding.secondary_color || "#0369A1";
            const facilityAccent = activeBranding.accent_color || "#F0F9FF";
            const facilityLogo = activeBranding.logo_url || null;
            const facilityTagline = activeBranding.tagline || (isHi ? "एनएबीएच मान्यता प्राप्त • 24x7 क्लिनिकल सेवा" : "Care you can trust • NABH Accredited Facility");
            const facilityHours = activeBranding.opd_start_time && activeBranding.opd_end_time
              ? `${activeBranding.opd_start_time} - ${activeBranding.opd_end_time}`
              : "08:00 - 20:00";
            const helpline = activeBranding.emergency_helpline || currentHosp.phone || "108 / Emergency";

            // Aggregate metrics & Footfall history
            const waitingCount = hospitalAnalytics?.waiting_count ?? hospitalQueueSnapshot.length;
            const servingCount = hospitalAnalytics?.serving_count ?? hospitalServingTickets.length;
            const completedToday = hospitalAnalytics?.completed_today ?? 0;
            const avgWait = hospitalAnalytics?.avg_wait_minutes ?? 12;
            const activeDesksCount = hospitalDesksData.active_desks || 0;
            const totalDesksCount = hospitalDesksData.total_desks || 0;
            const doctorsCount = hospitalEmployees.filter((e) => (e.role || "").toLowerCase() === "doctor").length;
            const staffCount = hospitalEmployees.filter((e) => (e.role || "").toLowerCase() !== "doctor").length;

            const footfallSummary = hospitalVisitsData?.summary || {};
            const allTimePatientsVisited = footfallSummary.total_patients_visited_all_time ?? (hospitalAnalytics?.total_patients_visited_all_time || 0);
            const allTimeCompleted = footfallSummary.all_time_completed ?? 0;
            const todayFootfall = footfallSummary.today_patients_visited ?? completedToday;
            const thisWeekFootfall = footfallSummary.this_week_visits ?? 0;
            const thisMonthFootfall = footfallSummary.this_month_visits ?? 0;
            const rawVisits = hospitalVisitsData?.visits || [];

            const filteredVisits = rawVisits.filter((v) => {
              if (visitHistoryStatusFilter !== "all") {
                const st = (v.status || "").toLowerCase();
                if (visitHistoryStatusFilter === "completed" && !["completed"].includes(st)) return false;
                if (visitHistoryStatusFilter === "active" && !["serving", "called", "waiting"].includes(st)) return false;
                if (visitHistoryStatusFilter === "cancelled" && !["cancelled", "expired", "no_show"].includes(st)) return false;
              }
              if (visitHistorySearchQuery.trim()) {
                const q = visitHistorySearchQuery.toLowerCase();
                const nameMatch = (v.patient_name || "").toLowerCase().includes(q);
                const tokenMatch = (v.ticket_id || "").toLowerCase().includes(q);
                const deptMatch = (v.department || "").toLowerCase().includes(q);
                const phoneMatch = (v.phone || "").toLowerCase().includes(q);
                return nameMatch || tokenMatch || deptMatch || phoneMatch;
              }
              return true;
            });

            // Flatten all desks for visual map
            const allDesks = [];
            (hospitalDesksData.departments || []).forEach((dept) => {
              (dept.desks || []).forEach((desk) => {
                allDesks.push({
                  ...desk,
                  dept_name: dept.name || desk.department_name || desk.dept_code,
                });
              });
            });

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                {/* 1. FACILITY EXECUTIVE HEADER BANNER */}
                <div
                  style={{
                    background: `linear-gradient(135deg, #FFFFFF 0%, ${facilityAccent} 100%)`,
                    borderRadius: "24px",
                    border: "1.5px solid #E2E8F0",
                    padding: "24px 28px",
                    boxShadow: "0 4px 20px -2px rgba(2, 132, 199, 0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "260px" }}>
                      {/* Logo or Medical Icon */}
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "18px",
                          background: "#FFFFFF",
                          border: `1.5px solid ${facilityPrimary}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                          flexShrink: 0,
                        }}
                      >
                        {facilityLogo ? (
                          <img
                            src={facilityLogo}
                            alt={currentHosp.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: `linear-gradient(135deg, ${facilityPrimary} 0%, ${facilitySecondary} 100%)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FFFFFF",
                            }}
                          >
                            <IconHospital size={30} />
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <h1
                            style={{
                              margin: 0,
                              fontSize: "22px",
                              color: "#0F172A",
                              fontWeight: 800,
                              letterSpacing: "-0.4px",
                            }}
                          >
                            {currentHosp.name}
                          </h1>
                          <span
                            style={{
                              fontSize: "11.5px",
                              fontWeight: 700,
                              padding: "3px 9px",
                              borderRadius: "20px",
                              background: currentHosp.status === "active" ? "#DCFCE7" : "#F1F5F9",
                              color: currentHosp.status === "active" ? "#15803D" : "#64748B",
                              border: currentHosp.status === "active" ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: currentHosp.status === "active" ? "#16A34A" : "#94A3B8",
                              }}
                            />
                            {currentHosp.status === "active" ? (isHi ? "सक्रिय शाखा" : "Active Facility") : (isHi ? "निष्क्रिय" : "Inactive")}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "13px", fontWeight: 500 }}>
                          {facilityTagline}
                        </p>
                      </div>
                    </div>

                    {/* Switch Hospital Dropdown Selector */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "#FFFFFF",
                          padding: "6px 12px",
                          borderRadius: "12px",
                          border: "1px solid #CBD5E1",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        }}
                      >
                        <IconHospital size={15} color={facilityPrimary} />
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                          {isHi ? "अस्पताल स्विच करें:" : "Facility:"}
                        </span>
                        <select
                          value={currentHosp.hospital_code}
                          onChange={(e) => {
                            const found = hospitals.find((h) => h.hospital_code === e.target.value);
                            if (found) {
                              setSelectedHospital(found);
                              if (onSelectHospitalTenant) onSelectHospitalTenant(found.hospital_code);
                            }
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#0F172A",
                            cursor: "pointer",
                            outline: "none",
                            paddingRight: "6px",
                          }}
                        >
                          {hospitals.map((h) => (
                            <option key={h.hospital_code} value={h.hospital_code}>
                              {h.name} ({h.hospital_code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenBrandingModal(currentHosp)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "12px",
                          border: `1px solid ${facilityPrimary}40`,
                          background: "#FFFFFF",
                          color: facilityPrimary,
                          fontSize: "12.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        }}
                      >
                        <span>🎨</span>
                        <span>{isHi ? "व्हाइट-लेबल ब्रांडिंग" : "Branding Settings"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Badges / Meta Pills Bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      flexWrap: "wrap",
                      paddingTop: "14px",
                      borderTop: "1px solid rgba(226, 232, 240, 0.8)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
                      <IconPhone size={14} color={facilityPrimary} />
                      <span style={{ fontWeight: 600 }}>{helpline}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
                      <IconClock size={14} color={facilityPrimary} />
                      <span style={{ fontWeight: 600 }}>{isHi ? `ओपीडी समय: ${facilityHours}` : `OPD Hours: ${facilityHours}`}</span>
                    </div>

                    {currentHosp.address && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
                        <IconMapPin size={14} color={facilityPrimary} />
                        <span style={{ fontWeight: 500 }}>{currentHosp.address}</span>
                      </div>
                    )}

                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>
                        {isHi ? "कोड:" : "Code:"}
                      </span>
                      <code
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          padding: "2px 7px",
                          background: "#E2E8F0",
                          borderRadius: "6px",
                          color: "#334155",
                        }}
                      >
                        {currentHosp.hospital_code}
                      </code>
                    </div>
                  </div>
                </div>

                {/* 1.5. REAL-TIME CLINICAL TRAFFIC & OPERATIONS MONITOR STRIP */}
                <div
                  style={{
                    background: "#0F172A",
                    borderRadius: "18px",
                    padding: "14px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.18)",
                    border: "1px solid #1E293B",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 10px #10B981", display: "inline-block" }} />
                    <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#F8FAFC", letterSpacing: "0.6px", textTransform: "uppercase" }}>
                      {isHi ? "लाइव ट्रैफिक मॉनिटर" : "Live Traffic Monitor"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#CBD5E1",
                    }}
                  >
                    {/* Waiting */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#94A3B8" }}>{isHi ? "प्रतीक्षा:" : "Waiting"}</span>
                      <span style={{ color: "#F59E0B", fontWeight: 800, background: "rgba(245, 158, 11, 0.2)", padding: "2px 8px", borderRadius: "6px" }}>
                        {waitingCount}
                      </span>
                    </div>

                    <span style={{ color: "#475569" }}>│</span>

                    {/* Serving */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#94A3B8" }}>{isHi ? "परामर्श:" : "Serving"}</span>
                      <span style={{ color: "#38BDF8", fontWeight: 800, background: "rgba(56, 189, 248, 0.2)", padding: "2px 8px", borderRadius: "6px" }}>
                        {servingCount}
                      </span>
                    </div>

                    <span style={{ color: "#475569" }}>│</span>

                    {/* Completed */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#94A3B8" }}>{isHi ? "पूर्ण:" : "Completed"}</span>
                      <span style={{ color: "#34D399", fontWeight: 800, background: "rgba(52, 211, 153, 0.2)", padding: "2px 8px", borderRadius: "6px" }}>
                        {completedToday} today
                      </span>
                    </div>

                    <span style={{ color: "#475569" }}>│</span>

                    {/* Avg Wait */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#94A3B8" }}>{isHi ? "औसत प्रतीक्षा:" : "Avg Wait"}</span>
                      <span style={{ color: "#A78BFA", fontWeight: 800, background: "rgba(167, 139, 250, 0.2)", padding: "2px 8px", borderRadius: "6px" }}>
                        ~{avgWait}m
                      </span>
                    </div>

                    <span style={{ color: "#475569" }}>│</span>

                    {/* Desks */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#94A3B8" }}>{isHi ? "डेस्क:" : "Desks"}</span>
                      <span style={{ color: "#F472B6", fontWeight: 800, background: "rgba(244, 114, 182, 0.2)", padding: "2px 8px", borderRadius: "6px" }}>
                        {activeDesksCount}/{totalDesksCount}
                      </span>
                    </div>

                    <span style={{ color: "#475569" }}>│</span>

                    {/* Docs */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#94A3B8" }}>{isHi ? "चिकित्सक:" : "Docs"}</span>
                      <span style={{ color: "#2DD4BF", fontWeight: 800, background: "rgba(45, 212, 191, 0.2)", padding: "2px 8px", borderRadius: "6px" }}>
                        {doctorsCount}
                      </span>
                    </div>

                    <span style={{ color: "#475569" }}>│</span>

                    {/* Visited Till Now */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#94A3B8" }}>{isHi ? "कुल मरीज अब तक:" : "Visited Till Now"}</span>
                      <span style={{ color: "#F8FAFC", fontWeight: 900, background: "rgba(248, 250, 252, 0.2)", padding: "2px 9px", borderRadius: "6px" }}>
                        {allTimePatientsVisited}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. REAL-TIME CLINICAL KPI TELEMETRY METRICS */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {/* KPI 1: Waiting In Queue */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "18px",
                      border: "1.5px solid #FEF3C7",
                      padding: "18px 20px",
                      boxShadow: "0 4px 14px rgba(217, 119, 6, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#92400E" }}>
                        {isHi ? "प्रतीक्षारत मरीज" : "Waiting in Queue"}
                      </span>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706" }}>
                        <IconClock size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 900, color: "#B45309", letterSpacing: "-0.5px" }}>
                      {waitingCount}
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#78350F", marginTop: "4px", fontWeight: 600 }}>
                      {isHi ? "ओपीडी कतार में सक्रिय" : "Live in waiting lounge"}
                    </span>
                  </div>

                  {/* KPI 2: Serving Currently */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "18px",
                      border: "1.5px solid #D1FAE5",
                      padding: "18px 20px",
                      boxShadow: "0 4px 14px rgba(5, 150, 105, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#065F46" }}>
                        {isHi ? "परामर्श जारी" : "In Consultation"}
                      </span>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                        <IconStethoscope size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 900, color: "#047857", letterSpacing: "-0.5px" }}>
                      {servingCount}
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#064E3B", marginTop: "4px", fontWeight: 600 }}>
                      {isHi ? "डॉक्टर के साथ सक्रिय" : "At active counters right now"}
                    </span>
                  </div>

                  {/* KPI 3: Completed Today */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "18px",
                      border: "1.5px solid #BAE6FD",
                      padding: "18px 20px",
                      boxShadow: "0 4px 14px rgba(2, 132, 199, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0369A1" }}>
                        {isHi ? "आज पूर्ण परामर्श" : "Treated Today"}
                      </span>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284C7" }}>
                        <IconCheckCircle size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 900, color: "#0284C7", letterSpacing: "-0.5px" }}>
                      {completedToday}
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#075985", marginTop: "4px", fontWeight: 600 }}>
                      {isHi ? "आज के सफल डिस्चार्ज" : "Completed patient visits"}
                    </span>
                  </div>

                  {/* KPI 4: Total Patients Visited Till Now */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "18px",
                      border: "1.5px solid #C7D2FE",
                      padding: "18px 20px",
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#3730A3" }}>
                        {isHi ? "अब तक कुल मरीज" : "Visited Till Now"}
                      </span>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5" }}>
                        <IconUsers size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 900, color: "#4338CA", letterSpacing: "-0.5px" }}>
                      {allTimePatientsVisited}
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#3730A3", marginTop: "4px", fontWeight: 600 }}>
                      {isHi ? `आज: ${todayFootfall} • इस माह: ${thisMonthFootfall}` : `Today: ${todayFootfall} • Month: ${thisMonthFootfall}`}
                    </span>
                  </div>

                  {/* KPI 5: Avg Consultation Wait */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "18px",
                      border: "1.5px solid #E0E7FF",
                      padding: "18px 20px",
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#4338CA" }}>
                        {isHi ? "औसत प्रतीक्षा समय" : "Avg. Wait Time"}
                      </span>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1" }}>
                        <IconActivity size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 900, color: "#4F46E5", letterSpacing: "-0.5px" }}>
                      ~{avgWait} <span style={{ fontSize: "14px", fontWeight: 700 }}>min</span>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#3730A3", marginTop: "4px", fontWeight: 600 }}>
                      {isHi ? "स्मार्ट एआई थ्रूपुट" : "AI estimated turnaround"}
                    </span>
                  </div>

                  {/* KPI 5: Active Counter Desks */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "18px",
                      border: "1.5px solid #F3E8FF",
                      padding: "18px 20px",
                      boxShadow: "0 4px 14px rgba(139, 92, 246, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#6B21A8" }}>
                        {isHi ? "काउंटर डेस्क स्थिति" : "Active Desks"}
                      </span>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6" }}>
                        <IconDesk size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 900, color: "#7C3AED", letterSpacing: "-0.5px" }}>
                      {activeDesksCount} <span style={{ fontSize: "16px", color: "#94A3B8", fontWeight: 600 }}>/ {totalDesksCount}</span>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#581C87", marginTop: "4px", fontWeight: 600 }}>
                      {totalDesksCount > 0 ? `${Math.round((activeDesksCount / totalDesksCount) * 100)}% ${isHi ? "संचालन में" : "Operational"}` : (isHi ? "कोई डेस्क नहीं" : "No desks setup")}
                    </span>
                  </div>

                  {/* KPI 6: Doctors & Staff */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "18px",
                      border: "1.5px solid #CCFBF1",
                      padding: "18px 20px",
                      boxShadow: "0 4px 14px rgba(13, 148, 136, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#115E59" }}>
                        {isHi ? "क्लिनिकल स्टाफ" : "Clinical Personnel"}
                      </span>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#F0FDFA", display: "flex", alignItems: "center", justifyContent: "center", color: "#0D9488" }}>
                        <IconUsers size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#0F766E", letterSpacing: "-0.5px" }}>
                      {doctorsCount} <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Docs</span> • {staffCount} <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Staff</span>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#134E4A", marginTop: "4px", fontWeight: 600 }}>
                      {hospitalEmployees.length} {isHi ? "कुल पंजीकृत कार्मिक" : "Total registered team"}
                    </span>
                  </div>
                </div>

                {/* 3. LIVE CALLING DESK STATIONS POD MAP */}
                <div style={standaloneCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🖥️</span>
                        <span>{isHi ? "लाइव कॉलिंग डेस्क एवं डॉक्टर आवंटन" : "Live Calling Desk Stations & Doctor Allocation"}</span>
                      </h3>
                      <p style={{ margin: 0, color: "#64748B", fontSize: "12.5px" }}>
                        {isHi ? "प्रत्येक काउंटर डेस्क की रीयल-टाइम स्थिति, ड्यूटी पर तैनात डॉक्टर और सेवा स्थिति।" : "Real-time presence, assigned physician, and service status across physical desks."}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setActiveTab("desks")}
                        style={{
                          background: "#F8FAFC",
                          border: "1px solid #CBD5E1",
                          borderRadius: "10px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#475569",
                          cursor: "pointer",
                        }}
                      >
                        {isHi ? "सभी डेस्क प्रबंधित करें →" : "Manage Desks →"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddDeskModal(true)}
                        style={{
                          background: facilityPrimary,
                          border: "none",
                          borderRadius: "10px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <IconPlus size={13} />
                        <span>{isHi ? "नया डेस्क" : "Add Desk"}</span>
                      </button>
                    </div>
                  </div>

                  {allDesks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 16px", background: "#F8FAFC", borderRadius: "16px", border: "1px dashed #CBD5E1" }}>
                      <IconDesk size={32} color="#94A3B8" />
                      <p style={{ margin: "10px 0 14px", color: "#64748B", fontSize: "13px" }}>
                        {isHi ? "इस अस्पताल के लिए अभी तक कोई डेस्क नहीं जोड़ा गया है।" : "No calling desks configured for this hospital yet."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddDeskModal(true)}
                        style={{
                          ...actionBtnStyle,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 16px",
                        }}
                      >
                        <IconPlus size={14} />
                        <span>{isHi ? "+ पहला डेस्क जोड़ें" : "+ Add First Calling Desk"}</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      {allDesks.map((desk, idx) => {
                        const rawStatus = (desk.status || "").toUpperCase();
                        const isAvailable = ["AVAILABLE", "ACTIVE"].includes(rawStatus);
                        const isServing = ["SERVING", "OCCUPIED", "BUSY"].includes(rawStatus);

                        const statusColor = isServing ? "#0284C7" : isAvailable ? "#16A34A" : "#64748B";
                        const statusBg = isServing ? "#E0F2FE" : isAvailable ? "#DCFCE7" : "#F1F5F9";
                        const statusBorder = isServing ? "#BAE6FD" : isAvailable ? "#BBF7D0" : "#E2E8F0";
                        const statusLabel = isServing
                          ? (isHi ? "परामर्श जारी" : "CONSULTING")
                          : isAvailable
                          ? (isHi ? "उपलब्ध / तैयार" : "READY")
                          : (isHi ? "ऑफ़लाइन" : "OFFLINE");

                        const staffName = desk.staff_name || desk.assigned_employee_name || (isHi ? "अनावंटित डेस्क" : "Unassigned Desk");

                        return (
                          <div
                            key={desk.id || desk.desk_name || idx}
                            style={{
                              background: isServing ? "#F0F9FF" : isAvailable ? "#F0FDF4" : "#F8FAFC",
                              borderRadius: "16px",
                              border: isServing ? "1.5px solid #BAE6FD" : isAvailable ? "1.5px solid #BBF7D0" : "1.5px solid #E2E8F0",
                              padding: "16px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: "12px",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: "15px", color: "#0F172A", fontWeight: 800 }}>
                                  {desk.desk_name || `Desk ${idx + 1}`}
                                </h4>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#64748B",
                                    fontWeight: 600,
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {getCategoryLabel ? getCategoryLabel(desk.dept_code || desk.dept_name, isHi) : (desk.dept_name || desk.dept_code)}
                                </span>
                              </div>

                              <span
                                style={{
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  background: statusBg,
                                  color: statusColor,
                                  border: `1px solid ${statusBorder}`,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  letterSpacing: "0.2px",
                                }}
                              >
                                <span
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    background: statusColor,
                                    display: "inline-block",
                                  }}
                                />
                                {statusLabel}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                background: "#FFFFFF",
                                padding: "8px 12px",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                              }}
                            >
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: isServing ? "#E0F2FE" : isAvailable ? "#DCFCE7" : "#F1F5F9",
                                  color: isServing ? "#0284C7" : isAvailable ? "#16A34A" : "#64748B",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <IconStethoscope size={14} />
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {staffName}
                                </div>
                                <div style={{ fontSize: "10.5px", color: "#94A3B8" }}>
                                  {isHi ? "कर्तव्यस्थ चिकित्सक / स्टाफ" : "Assigned Duty Clinician"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. DEPARTMENT CAPACITY & LOAD PROGRESS METERS */}
                <div style={standaloneCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🏢</span>
                        <span>{isHi ? "विभागवार मरीज भार एवं क्षमता स्थिति" : "Department Traffic, Capacity & Load Meters"}</span>
                      </h3>
                      <p style={{ margin: 0, color: "#64748B", fontSize: "12.5px" }}>
                        {isHi ? "विभिन्न विभागों (OPD, कार्डियो, आदि) में वेटिंग लोड और आवंटित डेस्क अनुपात।" : "Patient congestion levels and desk capacity distribution across clinical categories."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("depts")}
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #CBD5E1",
                        borderRadius: "10px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {isHi ? "विभाग सेटिंग्स →" : "Manage Departments →"}
                    </button>
                  </div>

                  {hospitalDepts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 16px", color: "#94A3B8", fontSize: "13px" }}>
                      {isHi ? "कोई विभाग पंजीकृत नहीं है।" : "No clinical departments registered."}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {hospitalDepts.map((dept) => {
                        const dCode = dept.dept_code;
                        // Count patients waiting for this department
                        const deptWaiting = hospitalQueueSnapshot.filter(
                          (t) => (t.dept_code === dCode || t.department === dCode || (t.token_number && t.token_number.startsWith(dCode.substring(0, 1).toUpperCase())))
                        ).length;

                        // Desks allocated for this department
                        const deptDesksObj = (hospitalDesksData.departments || []).find((d) => d.dept_code === dCode);
                        const deptDesksCount = deptDesksObj ? deptDesksObj.total_desks : 0;
                        const deptActiveDesks = deptDesksObj ? deptDesksObj.active_desks : 0;

                        // Congestion indicator
                        const loadLevel = deptWaiting > 10 ? "high" : deptWaiting > 3 ? "medium" : "normal";
                        const barColor = loadLevel === "high" ? "#EF4444" : loadLevel === "medium" ? "#F59E0B" : "#10B981";
                        const loadPercent = Math.min(100, Math.max(15, deptWaiting * 10));

                        return (
                          <div
                            key={dCode}
                            style={{
                              background: "#F8FAFC",
                              borderRadius: "14px",
                              border: "1px solid #E2E8F0",
                              padding: "14px 18px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A" }}>
                                  {dept.name}
                                </span>
                                <code style={{ fontSize: "11px", background: "#E2E8F0", color: "#475569", padding: "2px 6px", borderRadius: "5px", fontWeight: 700 }}>
                                  {dCode}
                                </code>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12px" }}>
                                <span style={{ color: "#64748B", fontWeight: 600 }}>
                                  {isHi ? "डेस्क:" : "Desks:"} <strong style={{ color: "#0F172A" }}>{deptActiveDesks}/{deptDesksCount} active</strong>
                                </span>
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    background: loadLevel === "high" ? "#FEE2E2" : loadLevel === "medium" ? "#FEF3C7" : "#DCFCE7",
                                    color: loadLevel === "high" ? "#B91C1C" : loadLevel === "medium" ? "#B45309" : "#15803D",
                                  }}
                                >
                                  {deptWaiting} {isHi ? "मरीज कतार में" : "waiting in queue"}
                                </span>
                              </div>
                            </div>

                            {/* Visual Capacity Bar */}
                            <div style={{ width: "100%", height: "8px", borderRadius: "6px", background: "#E2E8F0", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${loadPercent}%`,
                                  height: "100%",
                                  background: barColor,
                                  borderRadius: "6px",
                                  transition: "width 0.4s ease",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. PATIENT VISIT HISTORY & TREATMENT RECORDS */}
                <div style={standaloneCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📋</span>
                        <span>{isHi ? "मरीज विज़िट इतिहास एवं उपचार लॉग" : "Patient Visit History & Treatment Log"}</span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "#E0F2FE",
                            color: "#0284C7",
                          }}
                        >
                          {allTimePatientsVisited} {isHi ? "कुल मरीज" : "Total Visited Till Now"}
                        </span>
                      </h3>
                      <p style={{ margin: 0, color: "#64748B", fontSize: "12.5px" }}>
                        {isHi ? "अस्पताल में अब तक आए सभी मरीजों का इतिहास, परामर्श समय और सेवा स्थिति।" : "Chronological log of all patient visits, consultation durations, and service outcomes."}
                      </p>
                    </div>

                    {/* Search & Filter Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{ position: "relative", minWidth: "220px" }}>
                        <input
                          type="text"
                          placeholder={isHi ? "मरीज नाम, टोकन खोजें..." : "Search patient, token, dept..."}
                          value={visitHistorySearchQuery}
                          onChange={(e) => setVisitHistorySearchQuery(e.target.value)}
                          style={{
                            ...searchInputStyle,
                            padding: "7px 12px",
                            fontSize: "12.5px",
                          }}
                        />
                      </div>

                      {/* Status Filter Tabs */}
                      <div style={{ display: "flex", background: "#F1F5F9", padding: "3px", borderRadius: "10px", gap: "3px" }}>
                        {[
                          { id: "all", label: isHi ? "सभी" : "All" },
                          { id: "completed", label: isHi ? "पूर्ण" : "Completed" },
                          { id: "active", label: isHi ? "सक्रिय" : "Active" },
                          { id: "cancelled", label: isHi ? "अन्य" : "Other" },
                        ].map((flt) => (
                          <button
                            key={flt.id}
                            type="button"
                            onClick={() => setVisitHistoryStatusFilter(flt.id)}
                            style={{
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: "8px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                              background: visitHistoryStatusFilter === flt.id ? "#FFFFFF" : "transparent",
                              color: visitHistoryStatusFilter === flt.id ? "#0284C7" : "#64748B",
                              boxShadow: visitHistoryStatusFilter === flt.id ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                            }}
                          >
                            {flt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Visit Log Table */}
                  <div style={{ overflowX: "auto", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                          <th style={tableThStyle}>{isHi ? "टोकन / आईडी" : "Token / Ticket"}</th>
                          <th style={tableThStyle}>{isHi ? "मरीज का नाम" : "Patient Name"}</th>
                          <th style={tableThStyle}>{isHi ? "क्लिनिकल विभाग" : "Department"}</th>
                          <th style={tableThStyle}>{isHi ? "विज़िट तिथि एवं समय" : "Visit Date & Time"}</th>
                          <th style={tableThStyle}>{isHi ? "परामर्श अवधि" : "Consult Duration"}</th>
                          <th style={tableThStyle}>{isHi ? "स्थिति" : "Status"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVisits.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: "center", padding: "30px 16px", color: "#64748B" }}>
                              <IconClock size={28} color="#CBD5E1" />
                              <div style={{ marginTop: "8px", fontSize: "13px" }}>
                                {visitHistorySearchQuery
                                  ? (isHi ? "खोज से मेल खाता कोई विज़िट रिकॉर्ड नहीं मिला।" : "No patient visit records match your search filter.")
                                  : (isHi ? "इस अस्पताल के लिए अभी तक कोई विज़िट रिकॉर्ड दर्ज नहीं हुआ है।" : "No patient visit history recorded for this facility yet.")}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredVisits.slice(0, 30).map((visit, idx) => {
                            const st = (visit.status || "").toLowerCase();
                            const isDone = st === "completed";
                            const isCurrent = ["serving", "called", "waiting"].includes(st);
                            const statusBg = isDone ? "#DCFCE7" : isCurrent ? "#E0F2FE" : "#F1F5F9";
                            const statusColor = isDone ? "#15803D" : isCurrent ? "#0284C7" : "#64748B";
                            const statusBorder = isDone ? "#BBF7D0" : isCurrent ? "#BAE6FD" : "#E2E8F0";

                            const dateStr = visit.created_at
                              ? new Date(visit.created_at).toLocaleString(isHi ? "hi-IN" : "en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : visit.queue_date || "Today";

                            return (
                              <tr key={visit.id || visit.ticket_id || idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                <td style={tableTdStyle}>
                                  <span
                                    style={{
                                      fontSize: "12.5px",
                                      fontWeight: 800,
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      background: "#F8FAFC",
                                      border: "1px solid #E2E8F0",
                                      color: "#0F172A",
                                    }}
                                  >
                                    {visit.ticket_id || `#${visit.id}`}
                                  </span>
                                </td>
                                <td style={tableTdStyle}>
                                  <div style={{ fontWeight: 700, color: "#0F172A" }}>
                                    {visit.patient_name || "Patient"}
                                  </div>
                                  {(visit.age || visit.gender || visit.phone) && (
                                    <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: "2px" }}>
                                      {[visit.gender, visit.age ? `${visit.age}y` : "", visit.phone].filter(Boolean).join(" • ")}
                                    </span>
                                  )}
                                </td>
                                <td style={tableTdStyle}>
                                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                                    {visit.department}
                                  </span>
                                </td>
                                <td style={tableTdStyle}>
                                  <span style={{ fontSize: "12px", color: "#475569" }}>
                                    {dateStr}
                                  </span>
                                </td>
                                <td style={tableTdStyle}>
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                                    {visit.service_duration_minutes ? `~${visit.service_duration_minutes} min` : "—"}
                                  </span>
                                </td>
                                <td style={tableTdStyle}>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 800,
                                      padding: "3px 8px",
                                      borderRadius: "10px",
                                      background: statusBg,
                                      color: statusColor,
                                      border: `1px solid ${statusBorder}`,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {visit.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredVisits.length > 30 && (
                    <div style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                      Showing 30 most recent of {filteredVisits.length} recorded patient visits
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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

                  {/* Primary Add Hospital Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setNewHospitalForm({
                        hospital_code: "",
                        name: "",
                        address: "",
                        phone: "",
                        email: "",
                        description: "",
                        status: "active",
                      });
                      setShowAddHospitalModal(true);
                    }}
                    style={{
                      ...actionBtnStyle,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 800,
                    }}
                    title={isHi ? "नया अस्पताल जोड़ें" : "Add New Hospital"}
                  >
                    <IconPlus size={14} color="#FFFFFF" />
                    <span>{isHi ? "नया अस्पताल जोड़ें" : "+ Add Hospital"}</span>
                  </button>
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
                        onClick={() => handleOpenBrandingModal(hosp)}
                        style={{
                          ...secondarySmallBtnStyle,
                          background: "#F5F3FF",
                          color: "#7C3AED",
                          borderColor: "#DDD6FE",
                        }}
                        title={isHi ? "ब्रांडिंग और संचालन समय" : "Branding & Operating Hours"}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>🎨</span>
                          <span>{isHi ? "ब्रांडिंग" : "Branding"}</span>
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
          {activeTab === "employees" && (() => {
            const onlineCount = hospitalEmployees.filter((e) => (e.status || "").toLowerCase() === "active").length;
            const offlineCount = hospitalEmployees.length - onlineCount;

            const filteredEmployees = hospitalEmployees.filter((emp) => {
              if (employeeStatusFilter === "active" && (emp.status || "").toLowerCase() !== "active") return false;
              if (employeeStatusFilter === "inactive" && (emp.status || "").toLowerCase() === "active") return false;
              if (!employeeSearchQuery.trim()) return true;
              const q = employeeSearchQuery.trim().toLowerCase();
              return (
                (emp.name || "").toLowerCase().includes(q) ||
                (emp.username || "").toLowerCase().includes(q) ||
                (emp.email || "").toLowerCase().includes(q) ||
                (emp.employee_id || "").toLowerCase().includes(q) ||
                (emp.role || "").toLowerCase().includes(q)
              );
            });
            const EMP_PAGE_SIZE = 10;
            const totalEmpPages = Math.ceil(filteredEmployees.length / EMP_PAGE_SIZE) || 1;
            const paginatedEmployees = filteredEmployees.slice(
              (employeePage - 1) * EMP_PAGE_SIZE,
              employeePage * EMP_PAGE_SIZE
            );

            return (
              <div style={standaloneCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0F172A", fontWeight: 800 }}>
                      {isHi ? "डॉक्टर एवं कर्मचारी रोस्टर" : "Doctor & Employee Roster"}
                    </h2>
                    <span style={{ fontSize: "12px", color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <IconHospital size={14} color="#0284C7" />
                      <span>{selectedHospital ? selectedHospital.name : "Select a Hospital"} ({hospitalEmployees.length} Staff Members)</span>
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {selectedHospital && (
                      <button
                        type="button"
                        onClick={() => handleOpenBrandingModal(selectedHospital)}
                        style={{
                          ...secondarySmallBtnStyle,
                          background: "#F5F3FF",
                          color: "#7C3AED",
                          borderColor: "#DDD6FE",
                          padding: "8px 14px",
                          fontWeight: 800,
                        }}
                        title={isHi ? "ब्रांडिंग और समय सेटिंग्स" : "Branding & Operating Hours"}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>🎨</span>
                          <span>{isHi ? "ब्रांडिंग सेटिंग्स" : "Branding & Hours"}</span>
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddEmployeeModal(true)}
                      style={actionBtnStyle}
                    >
                      <IconPlus size={14} color="#FFFFFF" />
                      <span>{isHi ? "डॉक्टर / कर्मचारी जोड़ें" : "+ Add Doctor / Staff"}</span>
                    </button>
                  </div>
                </div>

                {/* Staff Presence Overview Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 700 }}>{isHi ? "कुल कार्मिक" : "Total Personnel"}</div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>{hospitalEmployees.length}</div>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16A34A" }} />
                      <span style={{ fontSize: "11.5px", color: "#166534", fontWeight: 700 }}>{isHi ? "सक्रिय / ऑनलाइन" : "Active / Logged In"}</span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#15803D", marginTop: "4px" }}>{onlineCount}</div>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#94A3B8" }} />
                      <span style={{ fontSize: "11.5px", color: "#475569", fontWeight: 700 }}>{isHi ? "निष्क्रिय / ऑफलाइन" : "Inactive / Offline"}</span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#475569", marginTop: "4px" }}>{offlineCount}</div>
                  </div>
                </div>

                {/* Filter Pills & Search Bar */}
                <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => { setEmployeeStatusFilter("all"); setEmployeePage(1); }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        border: employeeStatusFilter === "all" ? "1.5px solid #0284C7" : "1px solid #CBD5E1",
                        background: employeeStatusFilter === "all" ? "#F0F9FF" : "#FFFFFF",
                        color: employeeStatusFilter === "all" ? "#0284C7" : "#64748B",
                      }}
                    >
                      {isHi ? "सभी कार्मिक" : "All Staff"} ({hospitalEmployees.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEmployeeStatusFilter("active"); setEmployeePage(1); }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        border: employeeStatusFilter === "active" ? "1.5px solid #16A34A" : "1px solid #CBD5E1",
                        background: employeeStatusFilter === "active" ? "#F0FDF4" : "#FFFFFF",
                        color: employeeStatusFilter === "active" ? "#15803D" : "#64748B",
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16A34A" }} />
                      <span>{isHi ? "ऑनलाइन" : "Online"} ({onlineCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEmployeeStatusFilter("inactive"); setEmployeePage(1); }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        border: employeeStatusFilter === "inactive" ? "1.5px solid #64748B" : "1px solid #CBD5E1",
                        background: employeeStatusFilter === "inactive" ? "#F8FAFC" : "#FFFFFF",
                        color: employeeStatusFilter === "inactive" ? "#334155" : "#64748B",
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#94A3B8" }} />
                      <span>{isHi ? "ऑफलाइन" : "Offline"} ({offlineCount})</span>
                    </button>
                  </div>

                  <div style={{ position: "relative", minWidth: "260px", flex: "1 1 260px" }}>
                    <input
                      type="text"
                      placeholder={isHi ? "नाम, ईमेल या आईडी से खोजें..." : "Filter by name, email, or employee ID..."}
                      value={employeeSearchQuery}
                      onChange={(e) => { setEmployeeSearchQuery(e.target.value); setEmployeePage(1); }}
                      style={{ ...fieldInputStyle, paddingLeft: "32px", fontSize: "12.5px" }}
                    />
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                      🔍
                    </span>
                  </div>
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
                        <th style={tableThStyle}>{isHi ? "संबद्ध डेस्क" : "Assigned Desk"}</th>
                        <th style={tableThStyle}>{isHi ? "ईमेल / फोन" : "Contact"}</th>
                        <th style={tableThStyle}>{isHi ? "स्थिति / उपस्थिति" : "Status & Presence"}</th>
                        <th style={tableThStyle}>{isHi ? "कार्रवाई" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: "center", padding: "24px", color: "#64748B" }}>
                            {employeeSearchQuery ? "No staff members match the search query." : "No staff or doctors found for this filter."}
                          </td>
                        </tr>
                      ) : (
                        paginatedEmployees.map((emp) => {
                          const isActive = (emp.status || "").toLowerCase() === "active";
                          return (
                            <tr key={emp.id || emp.employee_id_num} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={tableTdStyle}>
                                <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13.5px" }}>
                                  {emp.name || emp.username || "Staff Member"}
                                </div>
                                <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: "2px" }}>
                                  {emp.email}
                                </span>
                              </td>
                              <td style={{ ...tableTdStyle, fontWeight: 700, color: "#0284C7" }}>
                                {emp.employee_id || `EMP-${emp.id || emp.employee_id_num}`}
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
                                {(() => {
                                  const currentDesk = getEmployeeCurrentDesk(emp);
                                  return currentDesk ? (
                                    <span
                                      style={{
                                        fontSize: "11.5px",
                                        fontWeight: 700,
                                        color: "#0369A1",
                                        background: "#F0F9FF",
                                        border: "1px solid #BAE6FD",
                                        padding: "3px 8px",
                                        borderRadius: "6px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                      title={currentDesk.desk_name}
                                    >
                                      <span>🪑</span>
                                      <span>{currentDesk.desk_name}</span>
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                                      {isHi ? "अनअसाइंड" : "Unassigned"}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td style={tableTdStyle}>
                                {emp.phone || "—"}
                              </td>
                              <td style={tableTdStyle}>
                                {isActive ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "2px 8px",
                                        borderRadius: "999px",
                                        fontSize: "10.5px",
                                        fontWeight: 800,
                                        background: "#ECFDF5",
                                        color: "#047857",
                                        border: "1px solid #A7F3D0",
                                        width: "fit-content",
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: "6px",
                                          height: "6px",
                                          borderRadius: "50%",
                                          background: "#10B981",
                                          boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.3)",
                                        }}
                                      />
                                      <span>{isHi ? "ऑनलाइन" : "ONLINE"}</span>
                                    </span>
                                    {emp.last_login_at ? (
                                      <span style={{ fontSize: "10px", color: "#64748B" }} title={new Date(emp.last_login_at).toLocaleString()}>
                                        {formatRelativeLogin(emp.last_login_at)}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: "10px", color: "#10B981" }}>
                                        {isHi ? "सक्रिय सत्र" : "Active session"}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "2px 8px",
                                        borderRadius: "999px",
                                        fontSize: "10.5px",
                                        fontWeight: 700,
                                        background: "#F1F5F9",
                                        color: "#64748B",
                                        border: "1px solid #E2E8F0",
                                        width: "fit-content",
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: "6px",
                                          height: "6px",
                                          borderRadius: "50%",
                                          background: "#94A3B8",
                                        }}
                                      />
                                      <span>{isHi ? "ऑफलाइन" : "OFFLINE"}</span>
                                    </span>
                                    <span style={{ fontSize: "10px", color: "#94A3B8" }} title={emp.last_login_at ? new Date(emp.last_login_at).toLocaleString() : ""}>
                                      {emp.last_login_at ? `${isHi ? "अंतिम:" : "Last:"} ${formatRelativeLogin(emp.last_login_at)}` : (isHi ? "लॉगिन नहीं किया" : "Not logged in")}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td style={tableTdStyle}>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <button
                                    type="button"
                                    disabled={isTogglingEmpStatus === (emp.user_id || emp.id || emp.employee_id_num)}
                                    onClick={() => handleToggleEmployeeStatus(emp)}
                                    style={{
                                      ...editSmallBtnStyle,
                                      background: isActive ? "#FFF1F2" : "#F0FDF4",
                                      color: isActive ? "#BE123C" : "#15803D",
                                      border: isActive ? "1px solid #FECDD3" : "1px solid #BBF7D0",
                                      fontWeight: 700,
                                      fontSize: "11px",
                                      opacity: isTogglingEmpStatus === (emp.user_id || emp.id || emp.employee_id_num) ? 0.6 : 1,
                                    }}
                                    title={isActive ? (isHi ? "ऑफलाइन सेट करें" : "Set to Offline (Inactive)") : (isHi ? "ऑनलाइन सेट करें" : "Set to Online (Active)")}
                                  >
                                    {isActive
                                      ? (isHi ? "ऑफलाइन करें" : "Set Offline")
                                      : (isHi ? "सक्रिय करें" : "Set Active")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`Name: ${emp.name || emp.username}\nEmail ID: ${emp.email}\nRole: ${emp.role.toUpperCase()}\nDepartment: ${emp.department}`);
                                      notify(isHi ? `'${emp.name || emp.username}' के लॉगिन क्रेडेंशियल कॉपी किए गए!` : `Login ID for '${emp.name || emp.username}' copied to clipboard!`);
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
                                        id: emp.id || emp.employee_id_num,
                                        name: emp.name || emp.username || "",
                                        phone: emp.phone || "",
                                        role: emp.role,
                                        department: emp.department || "consultation",
                                        employee_id: emp.employee_id || "",
                                        status: emp.status || "active",
                                        password: "",
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
                                    onClick={() => {
                                      setPasswordTargetEmployee(emp);
                                      setNewPasswordValue("pass" + Math.floor(1000 + Math.random() * 9000));
                                      setShowPasswordText(true);
                                      setPasswordUpdateSuccess(null);
                                      setShowChangePasswordModal(true);
                                    }}
                                    style={{
                                      ...editSmallBtnStyle,
                                      background: "#FEF3C7",
                                      color: "#B45309",
                                      border: "1px solid #FDE68A",
                                    }}
                                    title={isHi ? "पासवर्ड बदलें" : "Change Password"}
                                  >
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                      <IconKey size={12} color="#B45309" />
                                      <span>{isHi ? "पासवर्ड" : "Password"}</span>
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
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalEmpPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      Page {employeePage} of {totalEmpPages} ({filteredEmployees.length} staff members)
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        disabled={employeePage <= 1}
                        onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
                        style={{
                          ...secondarySmallBtnStyle,
                          opacity: employeePage <= 1 ? 0.5 : 1,
                          cursor: employeePage <= 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={employeePage >= totalEmpPages}
                        onClick={() => setEmployeePage((p) => Math.min(totalEmpPages, p + 1))}
                        style={{
                          ...secondarySmallBtnStyle,
                          opacity: employeePage >= totalEmpPages ? 0.5 : 1,
                          cursor: employeePage >= totalEmpPages ? "not-allowed" : "pointer",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 3: ACTIVE DESKS (Add & Remove Desks) */}
          {activeTab === "desks" && (() => {
            const q = deskSearchQuery.trim().toLowerCase();
            const rawGroups = hospitalDesksData.departments || [];
            const filteredDeptGroups = rawGroups.map((deptGroup) => {
              if (!q) return deptGroup;
              const matchesDept = (deptGroup.dept_code || "").toLowerCase().includes(q) ||
                (deptGroup.name || "").toLowerCase().includes(q) ||
                getCategoryLabel(deptGroup.dept_code, language).toLowerCase().includes(q);
              const matchingDesks = (deptGroup.desks || []).filter(
                (desk) => matchesDept || (desk.desk_name || "").toLowerCase().includes(q)
              );
              return {
                ...deptGroup,
                desks: matchingDesks,
              };
            }).filter((g) => (g.desks && g.desks.length > 0) || (!q && hospitalDepts.some((d) => d.dept_code === g.dept_code)));

            return (
              <div style={standaloneCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
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
                    onClick={() => {
                      if (hospitalDepts.length === 0) {
                        alert(isHi ? "डेस्क जोड़ने से पहले कृपया कम से कम एक विभाग बनाएं।" : "Please create at least one clinical department in the Departments tab before adding a desk.");
                        return;
                      }
                      setNewDeskForm({
                        dept_code: hospitalDepts[0]?.dept_code || "consultation",
                        desk_name: "",
                        status: "AVAILABLE",
                      });
                      setShowAddDeskModal(true);
                    }}
                    style={actionBtnStyle}
                  >
                    <IconPlus size={14} color="#FFFFFF" />
                    <span>{isHi ? "नया डेस्क जोड़ें" : "+ Add New Desk"}</span>
                  </button>
                </div>

                {/* Desk Search Input */}
                <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", minWidth: "260px", flex: "1 1 260px" }}>
                    <input
                      type="text"
                      placeholder={isHi ? "डेस्क या विभाग से खोजें..." : "Filter desks by name or department..."}
                      value={deskSearchQuery}
                      onChange={(e) => { setDeskSearchQuery(e.target.value); setDeskPage(1); }}
                      style={{ ...fieldInputStyle, paddingLeft: "32px", fontSize: "12.5px" }}
                    />
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                      🔍
                    </span>
                  </div>
                  {deskSearchQuery && (
                    <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                      Filtered across {filteredDeptGroups.length} departments
                    </span>
                  )}
                </div>

                {/* Department Desks */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {filteredDeptGroups.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px", color: "#64748B", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                      {deskSearchQuery ? "No desks match your filter." : "No desks found for this hospital. Click '+ Add New Desk' above."}
                    </div>
                  ) : (
                    filteredDeptGroups.map((deptGroup) => (
                      <div key={deptGroup.dept_code} style={deptDeskBoxStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <IconStethoscope size={16} color="#0284C7" />
                            <h4 style={{ margin: 0, fontSize: "15px", color: "#0F172A", fontWeight: 800 }}>
                              {getCategoryLabel(deptGroup.dept_code, language)}
                            </h4>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "2px 8px", borderRadius: "6px" }}>
                              {deptGroup.active_desks} / {deptGroup.total_desks} Active
                            </span>
                            {/* Bulk Deactivate / Activate per Department */}
                            <button
                              type="button"
                              onClick={() => handleBulkDeskStatus(deptGroup.dept_code, "UNAVAILABLE")}
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 8px",
                                background: "#FEE2E2",
                                color: "#DC2626",
                                border: "1px solid #FCA5A5",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                              title="Deactivate all desks in this department"
                            >
                              Deactivate All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBulkDeskStatus(deptGroup.dept_code, "AVAILABLE")}
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 8px",
                                background: "#DCFCE7",
                                color: "#16A34A",
                                border: "1px solid #86EFAC",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                              title="Activate all desks in this department"
                            >
                              Activate All
                            </button>
                          </div>
                        </div>

                        {(!deptGroup.desks || deptGroup.desks.length === 0) ? (
                          <div style={{ padding: "14px 16px", background: "#F8FAFC", borderRadius: "8px", border: "1px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                            <span style={{ fontSize: "12px", color: "#64748B" }}>
                              {isHi ? "इस विभाग में अभी कोई डेस्क नहीं है।" : "No desks created in this department yet."}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setNewDeskForm({
                                  dept_code: deptGroup.dept_code,
                                  desk_name: "",
                                  status: "AVAILABLE",
                                });
                                setShowAddDeskModal(true);
                              }}
                              style={{ ...actionBtnStyle, padding: "5px 12px", fontSize: "11.5px" }}
                            >
                              <IconPlus size={12} color="#FFFFFF" />
                              <span>{isHi ? "डेस्क जोड़ें" : "+ Add Desk"}</span>
                            </button>
                          </div>
                        ) : (
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
                                    {/* Edit Desk Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditDeskForm({
                                          id: desk.id,
                                          desk_name: desk.desk_name,
                                          dept_code: deptGroup.dept_code,
                                          status: desk.status || "AVAILABLE",
                                          assigned_employee_id: desk.assigned_employee_id ? String(desk.assigned_employee_id) : "",
                                        });
                                        setShowEditDeskModal(true);
                                      }}
                                      style={{ ...deleteDeskIconBtnStyle, color: "#0284C7" }}
                                      title={isHi ? "डेस्क संपादित करें" : "Edit Desk"}
                                    >
                                      <IconEdit size={12} color="#0284C7" />
                                    </button>
                                    {/* Delete Desk Button */}
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

                                {/* Assigned Doctor / Staff Card Section */}
                                {desk.assigned_employee_id ? (() => {
                                  const isDoc = (desk.assigned_employee_role || "").toLowerCase() === "doctor";
                                  const isOnline = (desk.assigned_employee_status || "").toLowerCase() === "active";
                                  const isDeskOpen = ["AVAILABLE", "ACTIVE", "BUSY", "OCCUPIED"].includes((desk.status || "").toUpperCase());

                                  return (
                                    <>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          background: isDoc ? (isOnline ? "#F0FDF4" : "#FEF2F2") : (isOnline ? "#F8FAFC" : "#F1F5F9"),
                                          border: isDoc ? (isOnline ? "1px solid #BBF7D0" : "1px solid #FECDD3") : (isOnline ? "1px solid #E2E8F0" : "1px solid #CBD5E1"),
                                          borderRadius: "8px",
                                          padding: "6px 8px",
                                          margin: "8px 0 6px 0",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                                          <span style={{ fontSize: "14px" }}>
                                            {isDoc ? "🩺" : "👤"}
                                          </span>
                                          <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {desk.assigned_employee_name || desk.staff_name}
                                              </span>
                                              <span
                                                style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                                  gap: "3px",
                                                  padding: "1px 5px",
                                                  borderRadius: "999px",
                                                  fontSize: "9px",
                                                  fontWeight: 800,
                                                  background: isOnline ? "#DCFCE7" : "#F1F5F9",
                                                  color: isOnline ? "#15803D" : "#64748B",
                                                  border: isOnline ? "1px solid #86EFAC" : "1px solid #CBD5E1",
                                                }}
                                              >
                                                <span
                                                  style={{
                                                    width: "5px",
                                                    height: "5px",
                                                    borderRadius: "50%",
                                                    background: isOnline ? "#16A34A" : "#94A3B8",
                                                  }}
                                                />
                                                <span>{isOnline ? (isHi ? "ऑनलाइन" : "Online") : (isHi ? "ऑफलाइन" : "Offline")}</span>
                                              </span>
                                            </div>
                                            <div style={{ fontSize: "10px", color: isDoc ? "#16A34A" : "#64748B", textTransform: "capitalize", fontWeight: 600 }}>
                                              {desk.assigned_employee_role || "Staff"} {desk.assigned_employee_last_login && isOnline ? `• ${formatRelativeLogin(desk.assigned_employee_last_login)}` : ""}
                                            </div>
                                          </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAssignDeskTarget({ desk, employee_id: String(desk.assigned_employee_id || "") });
                                              setShowAssignDeskModal(true);
                                            }}
                                            style={{
                                              background: "#FFFFFF",
                                              border: "1px solid #CBD5E1",
                                              borderRadius: "5px",
                                              padding: "3px 6px",
                                              fontSize: "10px",
                                              fontWeight: 700,
                                              color: "#0284C7",
                                              cursor: "pointer",
                                            }}
                                            title={isHi ? "कार्मिक बदलें" : "Reassign Doctor / Staff"}
                                          >
                                            {isHi ? "बदलें" : "Change"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleAssignDesk(desk.id, null)}
                                            style={{
                                              background: "#FEE2E2",
                                              border: "1px solid #FCA5A5",
                                              borderRadius: "5px",
                                              padding: "3px 6px",
                                              fontSize: "10px",
                                              fontWeight: 700,
                                              color: "#DC2626",
                                              cursor: "pointer",
                                            }}
                                            title={isHi ? "अनअसाइन करें" : "Unassign Desk"}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>

                                      {/* Warning banner if open desk has logged-out doctor */}
                                      {!isOnline && isDeskOpen && (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px",
                                            padding: "4px 8px",
                                            background: "#FFFBEB",
                                            border: "1px solid #FDE68A",
                                            borderRadius: "6px",
                                            marginBottom: "6px",
                                            fontSize: "10.5px",
                                            color: "#B45309",
                                            fontWeight: 600,
                                          }}
                                        >
                                          <span>⚠️</span>
                                          <span>{isHi ? "सावधानी: नियुक्त कार्मिक वर्तमान में ऑफलाइन हैं" : "Notice: Assigned doctor is currently offline"}</span>
                                        </div>
                                      )}
                                    </>
                                  );
                                })() : (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      background: "#F8FAFC",
                                      border: "1px dashed #CBD5E1",
                                      borderRadius: "8px",
                                      padding: "6px 8px",
                                      margin: "8px 0 6px 0",
                                    }}
                                  >
                                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                                      <span>⚡</span>
                                      <span>{isHi ? "स्वचालित बे" : "Auto Bay"}</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAssignDeskTarget({ desk, employee_id: "" });
                                        setShowAssignDeskModal(true);
                                      }}
                                      style={{
                                        background: "#0284C7",
                                        border: "none",
                                        borderRadius: "5px",
                                        padding: "3px 8px",
                                        fontSize: "10.5px",
                                        fontWeight: 700,
                                        color: "#FFFFFF",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "3px",
                                      }}
                                    >
                                      <span>+</span>
                                      <span>{isHi ? "सौंपें" : "Assign"}</span>
                                    </button>
                                  </div>
                                )}

                                <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleDeskStatus(desk)}
                                    style={{ ...toggleDeskBtnStyle, flex: 1, margin: 0 }}
                                  >
                                    {isHi ? "स्थिति बदलें" : "Toggle Status"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAssignDeskTarget({ desk, employee_id: String(desk.assigned_employee_id || "") });
                                      setShowAssignDeskModal(true);
                                    }}
                                    style={{
                                      padding: "6px 9px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      background: "#F0F9FF",
                                      border: "1px solid #BAE6FD",
                                      borderRadius: "6px",
                                      color: "#0369A1",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                    title={isHi ? "डॉक्टर या स्टाफ सौंपें" : "Assign Doctor or Staff"}
                                  >
                                    <span>👤</span>
                                    <span>{desk.assigned_employee_id ? (isHi ? "पुनः" : "Reassign") : (isHi ? "सौंपें" : "Assign")}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}

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
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditDeptForm({
                              dept_code: d.dept_code,
                              name: d.name,
                              description: d.description || "",
                            });
                            setShowEditDeptModal(true);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#0284C7",
                          }}
                          title={isHi ? "विभाग संपादित करें" : "Edit Department"}
                        >
                          <IconEdit size={14} color="#0284C7" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDepartment(d)}
                          style={deleteDeptIconBtnStyle}
                          title={isHi ? "विभाग हटाएं" : "Remove Department"}
                        >
                          <IconTrash size={14} color="#EF4444" />
                        </button>
                      </div>
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

          {/* TAB 5: HOSPITAL BRANDING & WHITE-LABELING */}
          {activeTab === "branding" && (
            <div style={standaloneCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🎨</span>
                    <span>{isHi ? "अस्पताल ब्रांडिंग एवं संचालन सेटिंग्स (White-Labeling)" : "Hospital Branding & White-Labeling"}</span>
                  </h2>
                  <span style={{ fontSize: "12px", color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <IconHospital size={14} color="#0284C7" />
                    <span>{brandingTargetHospital ? brandingTargetHospital.name : (selectedHospital ? selectedHospital.name : "Select a Hospital")}</span>
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                    {isHi ? "अस्पताल चुनें:" : "Select Hospital:"}
                  </label>
                  <select
                    value={brandingTargetHospital?.hospital_code || selectedHospital?.hospital_code || ""}
                    onChange={(e) => {
                      const found = hospitals.find((h) => h.hospital_code === e.target.value);
                      if (found) {
                        setSelectedHospital(found);
                        handleOpenBrandingModal(found);
                      }
                    }}
                    style={{ ...fieldInputStyle, width: "auto", minWidth: "180px", padding: "6px 12px", fontSize: "12.5px" }}
                  >
                    {hospitals.map((h) => (
                      <option key={h.hospital_code} value={h.hospital_code}>
                        {h.name} ({h.hospital_code})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const target = brandingTargetHospital || selectedHospital || hospitals[0];
                      if (target) handleOpenBrandingModal(target);
                    }}
                    style={{
                      ...actionBtnStyle,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                    }}
                  >
                    <span>🎨</span>
                    <span>{isHi ? "ब्रांडिंग कस्टमाइज़ करें" : "Open Customizer"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div style={{ padding: "16px", borderRadius: "14px", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🎨</span>
                    <span>{isHi ? "थीम रंग" : "Active Brand Theme"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: brandingForm.primary_color || "#0284C7", border: "1px solid #CBD5E1" }} />
                    <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: "#0F172A" }}>{brandingForm.primary_color || "#0284C7"}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748B" }}>
                    {brandingForm.tagline || "Care you can trust"}
                  </span>
                </div>

                <div style={{ padding: "16px", borderRadius: "14px", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>⏰</span>
                    <span>{isHi ? "संचालन समय" : "Operating Hours"}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>
                    {brandingForm.opd_start_time || "08:00"} - {brandingForm.opd_end_time || "20:00"}
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748B" }}>
                    Daily Cutoff: {brandingForm.registration_cutoff_time || "19:00"}
                  </span>
                </div>

                <div style={{ padding: "16px", borderRadius: "14px", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>📞</span>
                    <span>{isHi ? "आपातकालीन हेल्पलाइन" : "Emergency Helpline"}</span>
                  </div>
                  <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#DC2626", marginBottom: "4px" }}>
                    {brandingForm.emergency_helpline || "Emergency: 108"}
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748B" }}>
                    Printed on tokens & patient receipts
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <button
                  type="button"
                  onClick={() => {
                    const target = brandingTargetHospital || selectedHospital || hospitals[0];
                    if (target) handleOpenBrandingModal(target);
                  }}
                  style={{
                    ...actionBtnStyle,
                    padding: "12px 28px",
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  <span>🎨</span>
                  <span>{isHi ? "ब्रांडिंग, रंग एवं समय संपादित करें" : "Edit Branding, Colors & Operating Schedule"}</span>
                </button>
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

              <div>
                <label style={fieldLabelStyle}>
                  {isHi ? "नया पासवर्ड (अपरिवर्तित रखने हेतु खाली छोड़ें)" : "New Password (leave blank to keep unchanged)"}
                </label>
                <input
                  type="text"
                  placeholder={isHi ? "उदा. DocPass#2026" : "e.g. DocPass#2026"}
                  value={editEmployeeForm.password || ""}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, password: e.target.value })}
                  style={fieldInputStyle}
                />
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

      {/* MODAL 4.5: SUPER ADMIN CHANGE PASSWORD MODAL */}
      {showChangePasswordModal && passwordTargetEmployee && (
        <div style={modalOverlayStyle} onClick={() => { setShowChangePasswordModal(false); setPasswordUpdateSuccess(null); }}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconKey size={18} color="#D97706" />
                <span>{isHi ? "डॉक्टर / स्टाफ पासवर्ड अपडेट करें" : "Update Doctor / Staff Password"}</span>
              </h3>
              <button
                type="button"
                onClick={() => { setShowChangePasswordModal(false); setPasswordUpdateSuccess(null); }}
                style={modalCloseIconBtnStyle}
              >
                ✕
              </button>
            </div>

            {/* Target Employee Info Banner */}
            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#92400E" }}>
                  {passwordTargetEmployee.name || passwordTargetEmployee.username}
                </span>
                <span style={{ ...roleBadgeStyle(passwordTargetEmployee.role), fontSize: "10px" }}>
                  {passwordTargetEmployee.role?.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#B45309", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <span><strong>Email:</strong> {passwordTargetEmployee.email}</span>
                <span><strong>ID:</strong> {passwordTargetEmployee.employee_id || `EMP-${passwordTargetEmployee.id || passwordTargetEmployee.employee_id_num}`}</span>
                <span><strong>Hospital:</strong> {selectedHospital?.name || "Selected Facility"}</span>
              </div>
            </div>

            {passwordUpdateSuccess ? (
              <div>
                <div style={{ padding: "14px", borderRadius: "12px", background: "#F0FDF4", border: "1px solid #BBF7D0", marginBottom: "16px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#16A34A", fontWeight: 800, fontSize: "15px", marginBottom: "6px" }}>
                    <IconCheckCircle size={18} color="#16A34A" />
                    <span>{isHi ? "पासवर्ड सफलतापूर्वक बदला गया!" : "Password Updated Successfully!"}</span>
                  </div>
                  <p style={{ margin: "4px 0 10px 0", fontSize: "12.5px", color: "#15803D" }}>
                    {isHi ? "नए क्रेडेंशियल कर्मचारी को उपलब्ध कराएं:" : "Share these new login credentials with the user:"}
                  </p>
                  <div style={{ background: "#FFFFFF", border: "1px solid #86EFAC", borderRadius: "8px", padding: "10px", textAlign: "left", fontSize: "12px", fontFamily: "monospace", color: "#166534" }}>
                    <div><strong>User:</strong> {passwordUpdateSuccess.name}</div>
                    <div><strong>Email / ID:</strong> {passwordUpdateSuccess.email}</div>
                    <div><strong>New Password:</strong> {passwordUpdateSuccess.password}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Hospital: ${passwordUpdateSuccess.hospital_name}\nRole: ${passwordUpdateSuccess.role?.toUpperCase()}\nUser: ${passwordUpdateSuccess.name}\nEmail: ${passwordUpdateSuccess.email}\nNew Password: ${passwordUpdateSuccess.password}`;
                      navigator.clipboard.writeText(text);
                      notify(isHi ? "क्रेडेंशियल कॉपी हो गए!" : "New credentials copied to clipboard!");
                    }}
                    style={{ ...modalSubmitBtnStyle, background: "#16A34A", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <IconCopy size={14} />
                    <span>{isHi ? "नए क्रेडेंशियल कॉपी करें" : "Copy New Credentials"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setPasswordUpdateSuccess(null);
                    }}
                    style={modalCancelBtnStyle}
                  >
                    {isHi ? "बंद करें" : "Done"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdatePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={fieldLabelStyle}>{isHi ? "नया पासवर्ड सेट करें" : "Set New Password"} *</label>
                    <button
                      type="button"
                      onClick={() => setNewPasswordValue("pass" + Math.floor(1000 + Math.random() * 9000))}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0284C7",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      {isHi ? "🔄 रैंडम पासवर्ड बनाएं" : "🔄 Generate Random PIN"}
                    </button>
                  </div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showPasswordText ? "text" : "password"}
                      required
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                      placeholder={isHi ? "उदा. Pass@2026 या PIN" : "e.g. Pass@2026 or PIN"}
                      style={{
                        ...fieldInputStyle,
                        paddingRight: "70px",
                        fontWeight: 700,
                        fontFamily: showPasswordText ? "monospace" : "inherit",
                        letterSpacing: showPasswordText ? "0.05em" : "normal",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        background: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#475569",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <IconEye size={12} color="#475569" />
                      <span>{showPasswordText ? (isHi ? "छिपाएं" : "Hide") : (isHi ? "दिखाएं" : "Show")}</span>
                    </button>
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748B", marginTop: "4px", display: "block" }}>
                    {isHi ? "सुपर एडमिन सीधे डॉक्टर या स्टाफ सदस्य का पासवर्ड रीसेट कर सकता है।" : "Super Admin can directly overwrite the password without needing current password."}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setPasswordUpdateSuccess(null);
                    }}
                    style={modalCancelBtnStyle}
                  >
                    {isHi ? "रद्द करें" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    style={{
                      ...modalSubmitBtnStyle,
                      background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
                      opacity: isUpdatingPassword ? 0.7 : 1,
                      cursor: isUpdatingPassword ? "wait" : "pointer",
                    }}
                  >
                    {isUpdatingPassword
                      ? (isHi ? "अपडेट हो रहा है..." : "Updating...")
                      : (isHi ? "🔑 पासवर्ड अपडेट करें" : "🔑 Update Password")}
                  </button>
                </div>
              </form>
            )}
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
                {hospitalDepts.length === 0 ? (
                  <div style={{ padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", color: "#991B1B", fontSize: "12.5px" }}>
                    ⚠️ {isHi ? "इस अस्पताल में कोई विभाग नहीं मिला। कृपया डेस्क जोड़ने से पहले 'विभाग' टैब में एक नया विभाग बनाएं।" : "No departments found for this hospital. Please create at least one clinical department in the Departments tab before adding a desk."}
                  </div>
                ) : (
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
                )}
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

              <div>
                <label style={fieldLabelStyle}>
                  {isHi ? "डॉक्टर या स्टाफ सदस्य सौंपें (वैकल्पिक)" : "Assign Doctor or Staff (Optional)"}
                </label>
                <select
                  value={newDeskForm.assigned_employee_id}
                  onChange={(e) => setNewDeskForm({ ...newDeskForm, assigned_employee_id: e.target.value })}
                  style={fieldInputStyle}
                >
                  <option value="">{isHi ? "कोई नहीं (स्वचालित / ओपन बे)" : "None (Auto-Assigned / Open Bay)"}</option>
                  {hospitalEmployees.some(e => (e.role || "").toLowerCase() === "doctor") && (
                    <optgroup label={isHi ? "🩺 डॉक्टर" : "🩺 Doctors"}>
                      {hospitalEmployees.filter(e => (e.role || "").toLowerCase() === "doctor").map((doc) => {
                        const isOnline = (doc.status || "").toLowerCase() === "active";
                        const currentDesk = getEmployeeCurrentDesk(doc);
                        return (
                          <option key={doc.id || doc.employee_id_num} value={doc.id || doc.employee_id_num}>
                            {isOnline ? "🟢 [Online]" : "⚪ [Offline]"} {doc.name || doc.username} ({getCategoryLabel(doc.department, language)}) {currentDesk ? `[At ${currentDesk.desk_name}]` : ""}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {hospitalEmployees.some(e => (e.role || "").toLowerCase() !== "doctor") && (
                    <optgroup label={isHi ? "👤 अन्य स्टाफ एवं नर्स" : "👤 Staff & Nurses"}>
                      {hospitalEmployees.filter(e => (e.role || "").toLowerCase() !== "doctor").map((stf) => {
                        const isOnline = (stf.status || "").toLowerCase() === "active";
                        const currentDesk = getEmployeeCurrentDesk(stf);
                        return (
                          <option key={stf.id || stf.employee_id_num} value={stf.id || stf.employee_id_num}>
                            {isOnline ? "🟢 [Online]" : "⚪ [Offline]"} {stf.name || stf.username} - {(stf.role || "staff").toUpperCase()} ({getCategoryLabel(stf.department, language)}) {currentDesk ? `[At ${currentDesk.desk_name}]` : ""}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
                <span style={{ fontSize: "11px", color: "#64748B", marginTop: "3px", display: "block" }}>
                  {isHi ? "आप बाद में कभी भी इस डेस्क का कार्यभार बदल सकते हैं।" : "You can change or unassign the stationed personnel at any time."}
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddDeskModal(false)} style={modalCancelBtnStyle}>
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={hospitalDepts.length === 0}
                  style={{
                    ...modalSubmitBtnStyle,
                    opacity: hospitalDepts.length === 0 ? 0.6 : 1,
                    cursor: hospitalDepts.length === 0 ? "not-allowed" : "pointer"
                  }}
                >
                  {isHi ? "डेस्क जोड़ें" : "Add Desk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: EDIT DEPARTMENT */}
      {showEditDeptModal && selectedHospital && (
        <div style={modalOverlayStyle} onClick={() => setShowEditDeptModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconBuilding size={18} color="#0284C7" />
                <span>{isHi ? "क्लिनिकल विभाग संपादित करें" : "Edit Clinical Department"}</span>
              </h3>
              <button type="button" onClick={() => setShowEditDeptModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <form onSubmit={handleUpdateDepartmentSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={fieldLabelStyle}>{isHi ? "विभाग कोड (स्थिर)" : "Dept Code (Read-Only)"}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={editDeptForm.dept_code}
                  style={{ ...fieldInputStyle, background: "#F1F5F9", cursor: "not-allowed", color: "#64748B" }}
                />
                <span style={{ fontSize: "11px", color: "#64748B", marginTop: "3px", display: "block" }}>
                  {isHi
                    ? "विदेशी कुंजी के रूप में उपयोग होने के कारण विभाग कोड बदला नहीं जा सकता।"
                    : "Dept code cannot be modified directly as it links desks and employee profiles."}
                </span>
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "विभाग का नाम" : "Department Name"} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology & ECG"
                  value={editDeptForm.name}
                  onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "विवरण" : "Description"}</label>
                <textarea
                  rows="2"
                  placeholder="Clinical procedures overview..."
                  value={editDeptForm.description}
                  onChange={(e) => setEditDeptForm({ ...editDeptForm, description: e.target.value })}
                  style={{ ...fieldInputStyle, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowEditDeptModal(false)} style={modalCancelBtnStyle}>
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button type="submit" style={modalSubmitBtnStyle}>
                  {isHi ? "परिवर्तन सहेजें" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: EDIT DESK */}
      {showEditDeskModal && selectedHospital && (
        <div style={modalOverlayStyle} onClick={() => setShowEditDeskModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <IconDesk size={18} color="#0284C7" />
                <span>{isHi ? "सेवा डेस्क संपादित करें" : "Edit Service Desk"}</span>
              </h3>
              <button type="button" onClick={() => setShowEditDeskModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <form onSubmit={handleUpdateDeskSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={fieldLabelStyle}>{isHi ? "विभाग बदलें" : "Assign to Department"} *</label>
                <select
                  value={editDeskForm.dept_code}
                  onChange={(e) => setEditDeskForm({ ...editDeskForm, dept_code: e.target.value })}
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
                  value={editDeskForm.desk_name}
                  onChange={(e) => setEditDeskForm({ ...editDeskForm, desk_name: e.target.value })}
                  style={fieldInputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>{isHi ? "संबद्ध डॉक्टर / स्टाफ" : "Assigned Doctor / Staff"}</label>
                <select
                  value={editDeskForm.assigned_employee_id}
                  onChange={(e) => setEditDeskForm({ ...editDeskForm, assigned_employee_id: e.target.value })}
                  style={fieldInputStyle}
                >
                  <option value="">{isHi ? "कोई नहीं (स्वचालित/ओपन बे)" : "None (Auto-Assigned / Open Bay)"}</option>
                  {hospitalEmployees.some(e => (e.role || "").toLowerCase() === "doctor") && (
                    <optgroup label={isHi ? "🩺 डॉक्टर" : "🩺 Doctors"}>
                      {hospitalEmployees.filter(e => (e.role || "").toLowerCase() === "doctor").map((doc) => {
                        const currentDesk = getEmployeeCurrentDesk(doc);
                        const isThisDesk = currentDesk && currentDesk.id === editDeskForm.id;
                        return (
                          <option key={doc.id || doc.employee_id_num} value={doc.id || doc.employee_id_num}>
                            {doc.name || doc.username} ({getCategoryLabel(doc.department, language)}) {currentDesk ? (isThisDesk ? `[Currently Assigned Here]` : `[At ${currentDesk.desk_name}]`) : ""}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {hospitalEmployees.some(e => (e.role || "").toLowerCase() !== "doctor") && (
                    <optgroup label={isHi ? "👤 अन्य स्टाफ एवं नर्स" : "👤 Staff & Nurses"}>
                      {hospitalEmployees.filter(e => (e.role || "").toLowerCase() !== "doctor").map((stf) => {
                        const currentDesk = getEmployeeCurrentDesk(stf);
                        const isThisDesk = currentDesk && currentDesk.id === editDeskForm.id;
                        return (
                          <option key={stf.id || stf.employee_id_num} value={stf.id || stf.employee_id_num}>
                            {stf.name || stf.username} - {(stf.role || "staff").toUpperCase()} ({getCategoryLabel(stf.department, language)}) {currentDesk ? (isThisDesk ? `[Currently Assigned Here]` : `[At ${currentDesk.desk_name}]`) : ""}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
                <span style={{ fontSize: "11px", color: "#64748B", marginTop: "3px", display: "block" }}>
                  {isHi ? "यदि चयनित कर्मचारी किसी अन्य डेस्क पर है, तो वह स्वचालित रूप से इस डेस्क पर स्थानांतरित हो जाएगा।" : "Assigning an employee here will automatically reassign them from any previous desk."}
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowEditDeskModal(false)} style={modalCancelBtnStyle}>
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button type="submit" style={modalSubmitBtnStyle}>
                  {isHi ? "परिवर्तन सहेजें" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8B: ASSIGN DESK TO DOCTOR / STAFF */}
      {showAssignDeskModal && selectedHospital && assignDeskTarget.desk && (
        <div style={modalOverlayStyle} onClick={() => setShowAssignDeskModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                  <IconDesk size={18} color="#0284C7" />
                  <span>{isHi ? "डेस्क पर डॉक्टर / स्टाफ नियुक्त करें" : "Assign Desk to Doctor / Staff"}</span>
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B", marginTop: "2px", display: "block" }}>
                  {assignDeskTarget.desk.desk_name} &bull; {getCategoryLabel(assignDeskTarget.desk.dept_code, language)}
                </span>
              </div>
              <button type="button" onClick={() => setShowAssignDeskModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Current status banner */}
              <div style={{
                padding: "10px 14px",
                background: assignDeskTarget.desk.assigned_employee_id ? "#F0FDF4" : "#F8FAFC",
                border: assignDeskTarget.desk.assigned_employee_id ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, display: "block" }}>
                    {isHi ? "वर्तमान स्टेशन स्थिति:" : "Current Station Status:"}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: assignDeskTarget.desk.assigned_employee_id ? "#16A34A" : "#0F172A" }}>
                    {assignDeskTarget.desk.assigned_employee_id
                      ? `${assignDeskTarget.desk.assigned_employee_name} (${(assignDeskTarget.desk.assigned_employee_role || "Staff").toUpperCase()})`
                      : (isHi ? "स्वचालित / खाली बे" : "Auto-Assigned Bay (Unassigned)")}
                  </span>
                </div>
                {assignDeskTarget.desk.assigned_employee_id && (
                  <button
                    type="button"
                    onClick={() => handleAssignDesk(assignDeskTarget.desk.id, null)}
                    style={{
                      background: "#FEE2E2",
                      border: "1px solid #FCA5A5",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#DC2626",
                      cursor: "pointer",
                    }}
                  >
                    {isHi ? "अनअसाइन करें" : "Unassign Desk"}
                  </button>
                )}
              </div>

              {/* Search & Select input */}
              <div>
                <label style={fieldLabelStyle}>
                  {isHi ? "डॉक्टर या स्टाफ सदस्य चुनें" : "Select Doctor or Staff Member"}
                </label>
                <input
                  type="text"
                  placeholder={isHi ? "नाम, पद या विभाग से खोजें..." : "Quick filter staff by name, role, or department..."}
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  style={{ ...fieldInputStyle, marginBottom: "8px", fontSize: "12px" }}
                />

                <select
                  value={assignDeskTarget.employee_id}
                  onChange={(e) => setAssignDeskTarget({ ...assignDeskTarget, employee_id: e.target.value })}
                  style={{ ...fieldInputStyle, height: "42px" }}
                >
                  <option value="">{isHi ? "-- कोई नहीं (स्वचालित/ओपन बे रखें) --" : "-- None (Keep as Auto-Assigned Bay) --"}</option>
                  {hospitalEmployees
                    .filter(e => {
                      if (!assignSearchQuery) return true;
                      const sq = assignSearchQuery.toLowerCase();
                      return (e.name || "").toLowerCase().includes(sq) ||
                        (e.role || "").toLowerCase().includes(sq) ||
                        (e.department || "").toLowerCase().includes(sq) ||
                        (e.email || "").toLowerCase().includes(sq);
                    })
                    .sort((a, b) => {
                      if (a.role === "doctor" && b.role !== "doctor") return -1;
                      if (a.role !== "doctor" && b.role === "doctor") return 1;
                      return (a.name || "").localeCompare(b.name || "");
                    })
                    .map((emp) => {
                      const isDoc = (emp.role || "").toLowerCase() === "doctor";
                      const isOnline = (emp.status || "").toLowerCase() === "active";
                      const currentDesk = getEmployeeCurrentDesk(emp);
                      const isThisDesk = currentDesk && currentDesk.id === assignDeskTarget.desk?.id;
                      return (
                        <option key={emp.id || emp.employee_id_num} value={emp.id || emp.employee_id_num}>
                          {isOnline ? "🟢 [Online]" : "⚪ [Offline]"} {isDoc ? "🩺 [Doctor]" : "👤 [Staff]"} {emp.name || emp.username} &bull; {(emp.role || "staff").toUpperCase()} &bull; {getCategoryLabel(emp.department, language)} {currentDesk ? (isThisDesk ? "★ (Assigned Here)" : `⚠️ (Currently at ${currentDesk.desk_name})`) : "✓ (Available)"}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div style={{ padding: "10px 12px", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: "8px", fontSize: "11.5px", color: "#0369A1" }}>
                💡 {isHi
                  ? "डॉक्टर या स्टाफ को डेस्क सौंपने पर टोकन और कतार प्रबंधन उस डेस्क से उनके नाम से संचालित होगा।"
                  : "When a doctor or staff member is assigned to a desk, patient queues and active calls will reflect their designated consultation/service station."}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => { setShowAssignDeskModal(false); setAssignSearchQuery(""); }}
                  style={modalCancelBtnStyle}
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignDesk(assignDeskTarget.desk.id, assignDeskTarget.employee_id)}
                  style={modalSubmitBtnStyle}
                >
                  {isHi ? "नियुक्ति सहेजें" : "Save Assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: TENANT BRANDING & WHITE-LABELING */}
      {showBrandingModal && brandingTargetHospital && (
        <div style={modalOverlayStyle} onClick={() => setShowBrandingModal(false)}>
          <div
            style={{
              ...modalContentStyle,
              maxWidth: "820px",
              padding: "24px 28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "22px" }}>🎨</span>
                  <h3 style={{ margin: 0, fontSize: "19px", color: "#0F172A", fontWeight: 800 }}>
                    {isHi ? "अस्पताल ब्रांडिंग एवं संचालन समय (White-Labeling)" : "Hospital Branding & Operating Hours"}
                  </h3>
                </div>
                <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: brandingForm.primary_color || "#0284C7" }}>
                    {brandingTargetHospital.name}
                  </span>
                  <span style={{ fontSize: "11px", background: "#F1F5F9", color: "#475569", padding: "1px 7px", borderRadius: "5px", fontFamily: "monospace", fontWeight: 700 }}>
                    {brandingTargetHospital.hospital_code}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setShowBrandingModal(false)} style={modalCloseIconBtnStyle}>✕</button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "10px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setActiveBrandingTab("theme")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: activeBrandingTab === "theme" ? (brandingForm.primary_color || "#0284C7") : "#F1F5F9",
                  color: activeBrandingTab === "theme" ? "#FFFFFF" : "#475569",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>🎨</span>
                <span>{isHi ? "थीम और लोगो" : "Theme & Logo"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBrandingTab("slip")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: activeBrandingTab === "slip" ? (brandingForm.primary_color || "#0284C7") : "#F1F5F9",
                  color: activeBrandingTab === "slip" ? "#FFFFFF" : "#475569",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>🎫</span>
                <span>{isHi ? "टोकन पर्ची (Token Slip)" : "Token Slip & Helpline"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBrandingTab("hours")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: activeBrandingTab === "hours" ? (brandingForm.primary_color || "#0284C7") : "#F1F5F9",
                  color: activeBrandingTab === "hours" ? "#FFFFFF" : "#475569",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>⏰</span>
                <span>{isHi ? "संचालन समय व कटऑफ" : "Operating Hours & Cutoff"}</span>
              </button>
            </div>

            <form onSubmit={handleSaveBrandingSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* TAB 1: VISUAL THEME & LOGO */}
              {activeBrandingTab === "theme" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Curated Color Presets */}
                  <div>
                    <label style={{ ...fieldLabelStyle, marginBottom: "8px" }}>
                      {isHi ? "त्वरित रंग पट्टियाँ (One-Click Presets)" : "Quick Healthcare Color Palettes"}
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" }}>
                      {[
                        { name: "Ocean Blue", primary: "#0284C7", secondary: "#0369A1", accent: "#F0F9FF" },
                        { name: "Emerald Healing", primary: "#059669", secondary: "#047857", accent: "#ECFDF5" },
                        { name: "Royal Purple", primary: "#7C3AED", secondary: "#6D28D9", accent: "#F5F3FF" },
                        { name: "Crimson Care", primary: "#DC2626", secondary: "#B91C1C", accent: "#FEF2F2" },
                        { name: "Slate Teal", primary: "#0D9488", secondary: "#0F766E", accent: "#F0FDFA" },
                        { name: "Sunset Amber", primary: "#D97706", secondary: "#B45309", accent: "#FFFBEB" },
                      ].map((pal) => (
                        <button
                          key={pal.name}
                          type="button"
                          onClick={() => setBrandingForm({
                            ...brandingForm,
                            primary_color: pal.primary,
                            secondary_color: pal.secondary,
                            accent_color: pal.accent,
                          })}
                          style={{
                            padding: "8px",
                            borderRadius: "10px",
                            border: brandingForm.primary_color === pal.primary ? "2px solid #0F172A" : "1px solid #E2E8F0",
                            background: "#FFFFFF",
                            cursor: "pointer",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", width: "100%", height: "18px", borderRadius: "6px", overflow: "hidden" }}>
                            <div style={{ flex: 2, background: pal.primary }} />
                            <div style={{ flex: 1, background: pal.secondary }} />
                            <div style={{ flex: 1, background: pal.accent, border: "0.5px solid #CBD5E1" }} />
                          </div>
                          <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#334155" }}>{pal.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Hex Color Pickers */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", background: "#F8FAFC", padding: "14px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                    <div>
                      <label style={fieldLabelStyle}>{isHi ? "प्राथमिक रंग (Primary)" : "Primary Brand Color"}</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="color"
                          value={brandingForm.primary_color || "#0284C7"}
                          onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                          style={{ width: "36px", height: "36px", border: "none", borderRadius: "8px", cursor: "pointer", padding: 0 }}
                        />
                        <input
                          type="text"
                          value={brandingForm.primary_color || "#0284C7"}
                          onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                          style={{ ...fieldInputStyle, padding: "6px 8px", fontSize: "12px", fontFamily: "monospace" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>{isHi ? "द्वितीयक रंग (Secondary)" : "Secondary Color"}</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="color"
                          value={brandingForm.secondary_color || "#0369A1"}
                          onChange={(e) => setBrandingForm({ ...brandingForm, secondary_color: e.target.value })}
                          style={{ width: "36px", height: "36px", border: "none", borderRadius: "8px", cursor: "pointer", padding: 0 }}
                        />
                        <input
                          type="text"
                          value={brandingForm.secondary_color || "#0369A1"}
                          onChange={(e) => setBrandingForm({ ...brandingForm, secondary_color: e.target.value })}
                          style={{ ...fieldInputStyle, padding: "6px 8px", fontSize: "12px", fontFamily: "monospace" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>{isHi ? "बैकग्राउंड एक्सेंट (Accent)" : "Accent Tint"}</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="color"
                          value={brandingForm.accent_color || "#F0F9FF"}
                          onChange={(e) => setBrandingForm({ ...brandingForm, accent_color: e.target.value })}
                          style={{ width: "36px", height: "36px", border: "none", borderRadius: "8px", cursor: "pointer", padding: 0 }}
                        />
                        <input
                          type="text"
                          value={brandingForm.accent_color || "#F0F9FF"}
                          onChange={(e) => setBrandingForm({ ...brandingForm, accent_color: e.target.value })}
                          style={{ ...fieldInputStyle, padding: "6px 8px", fontSize: "12px", fontFamily: "monospace" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hospital Logo URL and Presets */}
                  <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                    <label style={fieldLabelStyle}>{isHi ? "अस्पताल का लोगो (Logo)" : "Hospital Brand Logo"}</label>
                    
                    {/* Quick Preset Logos */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                      {[
                        { label: "Shield Cross", url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=120&auto=format&fit=crop&q=80" },
                        { label: "Modern Cross", url: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png" },
                        { label: "Red Cross", url: "https://cdn-icons-png.flaticon.com/512/883/883407.png" },
                        { label: "Heartbeat", url: "https://cdn-icons-png.flaticon.com/512/2966/2966384.png" },
                        { label: "Clear (Default)", url: "" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setBrandingForm({ ...brandingForm, logo_url: item.url })}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            border: brandingForm.logo_url === item.url ? "1.5px solid #0284C7" : "1px solid #CBD5E1",
                            background: brandingForm.logo_url === item.url ? "#E0F2FE" : "#FFFFFF",
                            color: brandingForm.logo_url === item.url ? "#0369A1" : "#475569",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="url"
                          placeholder="https://example.com/hospital-logo.png"
                          value={brandingForm.logo_url || ""}
                          onChange={(e) => setBrandingForm({ ...brandingForm, logo_url: e.target.value })}
                          style={fieldInputStyle}
                        />
                      </div>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "10px",
                        border: "1.5px solid #CBD5E1",
                        background: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}>
                        {brandingForm.logo_url ? (
                          <img
                            src={brandingForm.logo_url}
                            alt="Logo"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <span style={{ fontSize: "22px" }}>🏥</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TOKEN SLIP & HELPLINE SETTINGS + LIVE PREVIEW */}
              {activeBrandingTab === "slip" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "18px" }}>
                  {/* Form Controls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={fieldLabelStyle}>{isHi ? "अस्पताल टैगलाइन (Tagline)" : "Hospital Tagline / Motto"}</label>
                      <input
                        type="text"
                        placeholder="e.g. Care You Can Trust • NABH Accredited"
                        value={brandingForm.tagline || ""}
                        onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                        style={fieldInputStyle}
                      />
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>{isHi ? "आपातकालीन हेल्पलाइन (Emergency Helpline)" : "24x7 Emergency Helpline Text"}</label>
                      <input
                        type="text"
                        placeholder="e.g. Emergency Helpline: 108 / +91 11 2658 8500"
                        value={brandingForm.emergency_helpline || ""}
                        onChange={(e) => setBrandingForm({ ...brandingForm, emergency_helpline: e.target.value })}
                        style={fieldInputStyle}
                      />
                      <span style={{ fontSize: "11px", color: "#64748B", marginTop: "3px", display: "block" }}>
                        {isHi ? "यह प्रत्येक मरीज के टोकन पास पर प्रमुखता से छपता है।" : "Printed boldly on every printed patient ticket pass."}
                      </span>
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>{isHi ? "पर्ची पाद लेख सूचना (Footer Notice)" : "Token Slip Footer Notice"}</label>
                      <textarea
                        rows="3"
                        placeholder="e.g. Non-transferable official patient record. Please keep until consultation is complete."
                        value={brandingForm.slip_footer_text || ""}
                        onChange={(e) => setBrandingForm({ ...brandingForm, slip_footer_text: e.target.value })}
                        style={{ ...fieldInputStyle, resize: "none" }}
                      />
                    </div>
                  </div>

                  {/* Live Thermal Pass Preview */}
                  <div>
                    <span style={{ ...fieldLabelStyle, marginBottom: "6px" }}>
                      👁️ {isHi ? "लाइव टोकन पर्ची पूर्वावलोकन" : "Live Printed Pass Preview"}
                    </span>
                    <div
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "14px",
                        border: `2px solid ${brandingForm.primary_color || "#0284C7"}`,
                        padding: "16px",
                        boxShadow: "0 8px 24px -4px rgba(0,0,0,0.12)",
                        fontSize: "11px",
                        fontFamily: "monospace, sans-serif",
                      }}
                    >
                      {/* Pass Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: `2px solid ${brandingForm.primary_color || "#0284C7"}`, paddingBottom: "8px", marginBottom: "8px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: brandingForm.accent_color || "#F0F9FF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                          {brandingForm.logo_url ? (
                            <img src={brandingForm.logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: "16px" }}>🏥</span>
                          )}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontWeight: 900, fontSize: "13px", color: brandingForm.primary_color || "#0284C7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {brandingTargetHospital.name}
                          </div>
                          <div style={{ fontSize: "9px", color: "#64748B" }}>
                            {brandingForm.tagline || "Care you can trust"}
                          </div>
                        </div>
                      </div>

                      {/* Helpline Banner */}
                      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "6px", padding: "4px 8px", marginBottom: "8px", color: "#DC2626", fontWeight: 800, fontSize: "10px", textAlign: "center" }}>
                        📞 {brandingForm.emergency_helpline || "Emergency: 108"}
                      </div>

                      {/* Token Box */}
                      <div style={{ textAlign: "center", border: `2px dashed ${brandingForm.primary_color || "#0284C7"}`, borderRadius: "10px", padding: "10px", margin: "8px 0", background: brandingForm.accent_color || "#F0F9FF" }}>
                        <div style={{ fontSize: "9px", color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>YOUR QUEUE TOKEN</div>
                        <div style={{ fontSize: "28px", fontWeight: 900, color: brandingForm.primary_color || "#0284C7", letterSpacing: "1px" }}>P-104</div>
                        <div style={{ fontSize: "10px", fontWeight: 800, color: "#166534" }}>PRIORITY: STANDARD</div>
                      </div>

                      {/* Ticket Details */}
                      <div style={{ fontSize: "10.5px", color: "#334155", lineHeight: 1.5, borderBottom: "1px dashed #CBD5E1", paddingBottom: "8px", marginBottom: "8px" }}>
                        <div><strong>Patient:</strong> Ramesh Sharma (38Y / M)</div>
                        <div><strong>Dept:</strong> General OPD • Desk 02</div>
                        <div><strong>Time:</strong> Today at 09:30 AM</div>
                      </div>

                      {/* Footer notice */}
                      <div style={{ fontSize: "8.5px", color: "#64748B", textAlign: "center", fontStyle: "italic" }}>
                        {brandingForm.slip_footer_text || "Non-transferable official patient record."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OPERATING HOURS & CUTOFF */}
              {activeBrandingTab === "hours" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Hours Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", background: "#F8FAFC", padding: "16px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                    <div>
                      <label style={fieldLabelStyle}>{isHi ? "ओपीडी खुलने का समय" : "OPD Opening Time"}</label>
                      <input
                        type="time"
                        value={brandingForm.opd_start_time || "08:00"}
                        onChange={(e) => setBrandingForm({ ...brandingForm, opd_start_time: e.target.value })}
                        style={fieldInputStyle}
                      />
                    </div>

                    <div>
                      <label style={fieldLabelStyle}>{isHi ? "ओपीडी बंद होने का समय" : "OPD Closing Time"}</label>
                      <input
                        type="time"
                        value={brandingForm.opd_end_time || "20:00"}
                        onChange={(e) => setBrandingForm({ ...brandingForm, opd_end_time: e.target.value })}
                        style={fieldInputStyle}
                      />
                    </div>

                    <div>
                      <label style={{ ...fieldLabelStyle, color: "#DC2626" }}>
                        {isHi ? "दैनिक पंजीकरण कटऑफ समय *" : "Registration Cutoff Time *"}
                      </label>
                      <input
                        type="time"
                        value={brandingForm.registration_cutoff_time || "19:00"}
                        onChange={(e) => setBrandingForm({ ...brandingForm, registration_cutoff_time: e.target.value })}
                        style={{ ...fieldInputStyle, borderColor: "#FECACA", background: "#FFF5F5" }}
                      />
                    </div>
                  </div>

                  {/* Cutoff Explanation Banner */}
                  <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>ℹ️</span>
                    <span style={{ fontSize: "12px", color: "#1E40AF", lineHeight: 1.4 }}>
                      {isHi
                        ? "कटऑफ समय के बाद गैर-आपातकालीन (Standard/Vulnerable) मरीज टोकन जनरेट नहीं कर सकते। आपातकालीन (Emergency) मरीज 24/7 कभी भी रजिस्टर कर सकते हैं।"
                        : "Non-emergency patients cannot register or join the queue after this cutoff time. Emergency triage registrations remain active 24/7."}
                    </span>
                  </div>

                  {/* Operating Days Selector */}
                  <div>
                    <label style={{ ...fieldLabelStyle, marginBottom: "8px" }}>
                      {isHi ? "सक्रिय ओपीडी संचालन दिवस (Operating Days)" : "Weekly OPD Operating Days"}
                    </label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                        const isChecked = (brandingForm.operating_days || []).includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const currentDays = brandingForm.operating_days || [];
                              const newDays = isChecked
                                ? currentDays.filter((d) => d !== day)
                                : [...currentDays, day];
                              setBrandingForm({ ...brandingForm, operating_days: newDays });
                            }}
                            style={{
                              padding: "7px 14px",
                              borderRadius: "8px",
                              border: isChecked ? `1.5px solid ${brandingForm.primary_color || "#0284C7"}` : "1px solid #CBD5E1",
                              background: isChecked ? (brandingForm.primary_color || "#0284C7") : "#FFFFFF",
                              color: isChecked ? "#FFFFFF" : "#475569",
                              fontWeight: 700,
                              fontSize: "12px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {isChecked ? "✓ " : ""}{day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Closed Notice */}
                  <div>
                    <label style={fieldLabelStyle}>{isHi ? "क्लिनिक बंद होने की सूचना (Closed Notice)" : "Off-Hours Closed Notice to Patients"}</label>
                    <textarea
                      rows="2"
                      placeholder="Registrations are closed for today..."
                      value={brandingForm.closed_notice || ""}
                      onChange={(e) => setBrandingForm({ ...brandingForm, closed_notice: e.target.value })}
                      style={{ ...fieldInputStyle, resize: "none" }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", borderTop: "1px solid #E2E8F0", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowBrandingModal(false)}
                  style={modalCancelBtnStyle}
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>

                <button
                  type="button"
                  onClick={() => setBrandingForm({
                    logo_url: "",
                    primary_color: "#0284C7",
                    secondary_color: "#0369A1",
                    accent_color: "#F0F9FF",
                    tagline: "Care you can trust • NABH Accredited",
                    emergency_helpline: "Emergency Helpline: 108 / +91 98765 43210",
                    slip_footer_text: "Non-transferable official patient record. Please keep until consultation is complete.",
                    opd_start_time: "08:00",
                    opd_end_time: "20:00",
                    registration_cutoff_time: "19:00",
                    operating_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    closed_notice: "Registrations are closed for today. Please visit during OPD hours or book an appointment for tomorrow.",
                  })}
                  style={{
                    ...modalCancelBtnStyle,
                    color: "#D97706",
                    borderColor: "#FDE68A",
                    background: "#FFFBEB",
                  }}
                >
                  {isHi ? "डिफ़ॉल्ट रीसेट" : "Reset Defaults"}
                </button>

                <button
                  type="submit"
                  disabled={isSavingBranding}
                  style={{
                    ...modalSubmitBtnStyle,
                    background: `linear-gradient(135deg, ${brandingForm.primary_color || "#0284C7"} 0%, ${brandingForm.secondary_color || "#0369A1"} 100%)`,
                    opacity: isSavingBranding ? 0.7 : 1,
                    cursor: isSavingBranding ? "not-allowed" : "pointer",
                  }}
                >
                  {isSavingBranding
                    ? (isHi ? "सहेज रहा है..." : "Saving Settings...")
                    : (isHi ? "ब्रांडिंग सेटिंग्स सहेजें" : "Save Branding Settings")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop: "40px" }}>
        <Footer
          language={language}
          hospitalName={selectedHospital?.name || currentUser?.hospital_name || "City General Hospital"}
          currentUser={currentUser}
        />
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

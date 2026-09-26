/**
 * PatientPage.jsx
 * ---------------
 * Patient Self-Checkin & Pre-scheduled Appointment Booking Kiosk.
 * Theme: Unified Medical Blue & Clean White (Clinical Healthcare System)
 * Professional Healthcare Vector Styling matching IMAGE 2.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE, HOSPITAL_CONFIG } from "../config/hospitalConfig";
import { t, getCategoryLabel, getStatusLabel, SYMPTOM_OPTIONS, RISK_OPTIONS, formatSymptomLabel, formatRiskLabel } from "../utils/i18n";
import { printTokenPass, printAppointmentRecord, printPrescriptionSlip } from "../utils/printPassHelper";
import QueueStepper from "../components/patient/QueueStepper";
import HeroBanner from "../components/patient/HeroBanner";
import Footer from "../components/common/Footer";
import FamilyMemberSwitcher, { AddFamilyMemberModal, EditFamilyMemberModal, getRelationLabel } from "../components/patient/FamilyMemberSwitcher";
import PatientHistoryTimeline from "../components/patient-history/PatientHistoryTimeline";
import { usePatientHistory } from "../hooks/usePatientHistory";

export default function PatientPage({
  tenantId,
  currentUser,
  activeTicket,
  setActiveTicket,
  ticketQrData,
  setTicketQrData,
  refreshData,
  language = "en",
  setLanguage,
  navigateTo,
  currentTab = "walkin",
  analytics,
  queueSnapshot = [],
  servingTickets = [],
  kioskQrData,
  socketConnected = true,
  socketRef = null,
  // App-level family profile state (passed from App.jsx)
  familyMembers: familyMembersProp = null,
  setFamilyMembers: setFamilyMembersProp = null,
  activeFamilyMember: activeFamilyMemberProp = null,
  setActiveFamilyMember: setActiveFamilyMemberProp = null,
  onSwitchProfile = null,
  onFamilyMembersChange = null,
  currentHospitalTenant = null,
  onSwitchHospital = null,
  hospitalBranding: hospitalBrandingProp = null,
  onUpdateHospitalBranding = null,
  theme = "light",
}) {
  // Family Members & Dependents Management
  // Use App-level state when provided, fall back to local state
  const getInitialFamilyMembers = () => {
    // If App provides family members, use them (not local storage)
    if (familyMembersProp !== null) {
      const selfObj = {
        id: "self",
        name: currentUser ? (currentUser.username || "Self") : "Self",
        relation: "self",
        age: currentUser && currentUser.age ? currentUser.age : 35,
        gender: currentUser && currentUser.gender ? currentUser.gender.toLowerCase() : "male",
      };
      return [selfObj, ...(familyMembersProp || [])];
    }
    try {
      const storageKey = `family_members_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [
      {
        id: "self",
        name: currentUser ? (currentUser.username || "Self") : "Self",
        relation: "self",
        age: currentUser && currentUser.age ? currentUser.age : 35,
        gender: currentUser && currentUser.gender ? currentUser.gender.toLowerCase() : "male",
      },
    ];
  };

  const [localFamilyMembers, setLocalFamilyMembers] = useState(getInitialFamilyMembers);

  // Base primary user object (Self)
  const selfObj = {
    id: "self",
    name: currentUser ? (currentUser.username || "Self") : "Self",
    relation: "self",
    age: currentUser && currentUser.age ? currentUser.age : 35,
    gender: currentUser && currentUser.gender ? currentUser.gender.toLowerCase() : "male",
  };

  // Keep localFamilyMembers in sync with App-level familyMembersProp when it updates
  useEffect(() => {
    if (Array.isArray(familyMembersProp) && familyMembersProp.length > 0) {
      const fullList = [selfObj, ...familyMembersProp.filter((m) => m && m.id !== "self")];
      setLocalFamilyMembers(fullList);
    }
  }, [familyMembersProp]);

  // familyMembers is always driven by localFamilyMembers so additions are instant
  const familyMembers = localFamilyMembers;

  const setFamilyMembers = (newMembers) => {
    const list = Array.isArray(newMembers) ? newMembers : [];
    const fullList = list.some((m) => m && m.id === "self") ? list : [selfObj, ...list];
    setLocalFamilyMembers(fullList);
    if (setFamilyMembersProp) {
      setFamilyMembersProp(fullList.filter((m) => m && m.id !== "self"));
    }
    try {
      const storageKey = `family_members_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
      localStorage.setItem(storageKey, JSON.stringify(fullList));
    } catch (e) {}
  };

  // Live Patient Medical History & Follow-up records
  const {
    historyData: myMedicalHistoryData,
    patient: myMedicalPatient,
    summary: myMedicalSummary,
    visits: myMedicalVisits,
    prescriptions: myMedicalPrescriptions,
    reports: myMedicalReports,
    isReturningPatient: isMyReturningPatient,
    totalVisits: myMedicalTotalVisits,
    loading: myMedicalHistoryLoading,
  } = usePatientHistory({
    patientId: currentUser?.id,
    phone: currentUser?.phone,
    ticketId: activeTicket?.ticket_id,
    hospitalId: tenantId,
    socketRef,
    autoFetch: true,
  });

  const [selectedMemberId, setSelectedMemberId] = useState("self");
  const [editingMember, setEditingMember] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Family Tickets dictionary: { [memberId]: ticketObj }
  const [familyTickets, setFamilyTickets] = useState(() => {
    try {
      const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
      const saved = localStorage.getItem(ticketStorageKey);
      const parsed = saved ? JSON.parse(saved) : {};
      const activeSaved = localStorage.getItem("ai_queue_active_ticket");
      if (activeSaved && !parsed["self"]) {
        try {
          const act = JSON.parse(activeSaved);
          if (act && act.ticket_id) {
            parsed["self"] = act;
          }
        } catch (e) {}
      }
      return parsed;
    } catch (e) {
      return {};
    }
  });

  // Re-sync familyTickets when currentUser changes
  useEffect(() => {
    try {
      const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
      const saved = localStorage.getItem(ticketStorageKey);
      if (saved) {
        setFamilyTickets(JSON.parse(saved));
      }
    } catch (e) {}
  }, [currentUser]);

  const isLiveTicketStatus = (ticket) => {
    if (!ticket || !ticket.status) return false;
    const s = String(ticket.status).toLowerCase();
    return ["waiting", "serving", "on_hold", "hold"].includes(s);
  };

  const isLiveTicket = activeTicket && isLiveTicketStatus(activeTicket);

  const removeTicketFromFamilyTickets = useCallback((ticketId) => {
    if (!ticketId) return;
    setFamilyTickets((prev) => {
      const updated = { ...prev };
      let changed = false;
      Object.keys(updated).forEach((k) => {
        if (updated[k]?.ticket_id === ticketId) {
          delete updated[k];
          changed = true;
        }
      });
      if (changed) {
        try {
          const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
          localStorage.setItem(ticketStorageKey, JSON.stringify(updated));
        } catch (e) {}
        window.dispatchEvent(new CustomEvent("family_tickets_updated", { detail: updated }));
      }
      return changed ? updated : prev;
    });
  }, [currentUser]);

  // If activeTicket becomes completed or departed, clear it immediately from instant check-in
  useEffect(() => {
    if (activeTicket && !isLiveTicketStatus(activeTicket)) {
      const tId = activeTicket.ticket_id;
      setActiveTicket(null);
      if (setTicketQrData) setTicketQrData(null);
      if (selectedMemberId === "self") {
        try {
          localStorage.removeItem("ai_queue_active_ticket");
        } catch (e) {}
      }
      if (tId) {
        removeTicketFromFamilyTickets(tId);
      }
    }
  }, [activeTicket, selectedMemberId, setActiveTicket, setTicketQrData, removeTicketFromFamilyTickets]);

  // Ensure activeTicket is restored from familyTickets or localStorage on mount/refresh ONLY IF LIVE ON SERVER
  // Strictly respects selectedMemberId: dependent profiles will NEVER incorrectly inherit "self"'s ticket!
  useEffect(() => {
    if (!activeTicket) {
      const candidate = selectedMemberId === "self"
        ? (familyTickets["self"] || (() => {
            try {
              const s = localStorage.getItem("ai_queue_active_ticket");
              return s ? JSON.parse(s) : null;
            } catch (e) { return null; }
          })())
        : (familyTickets[selectedMemberId] || null);

      if (candidate && candidate.ticket_id && isLiveTicketStatus(candidate)) {
        // Authoritatively check backend to ensure candidate hasn't been completed or cancelled
        fetch(`${API_BASE}/api/v1/plugin/ticket/${candidate.ticket_id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.status === "success" && d.ticket) {
              if (isLiveTicketStatus(d.ticket)) {
                setActiveTicket(d.ticket);
                fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${d.ticket.ticket_id}`)
                  .then((rqr) => rqr.json())
                  .then((qr) => {
                    if (setTicketQrData) setTicketQrData(qr);
                  })
                  .catch(() => {});
              } else {
                // Ticket was already completed or cancelled on the server! Clean up local storage
                removeTicketFromFamilyTickets(candidate.ticket_id);
                if (selectedMemberId === "self") {
                  try {
                    localStorage.removeItem("ai_queue_active_ticket");
                  } catch (e) {}
                }
              }
            }
          })
          .catch(() => {
            // Offline fallback
            setActiveTicket(candidate);
          });
      }
    }
  }, [activeTicket, familyTickets, selectedMemberId, setActiveTicket, setTicketQrData, removeTicketFromFamilyTickets]);

  // Sync tab with URL, including "family" and "history" tabs and aliases
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["walkin", "book", "my_apts", "history", "family"].includes(tabParam.toLowerCase())) {
      return tabParam.toLowerCase();
    }
    const pageParam = (params.get("page") || params.get("view") || "").toLowerCase();
    if (["history", "appointment_history", "past_appointments"].includes(pageParam)) return "history";
    if (["my_apts", "appointments", "my_appointments"].includes(pageParam)) return "my_apts";
    if (["book", "booking", "schedule"].includes(pageParam)) return "book";
    if (["family", "dependents"].includes(pageParam)) return "family";
    return (currentTab && ["walkin", "book", "my_apts", "history", "family"].includes(currentTab.toLowerCase()))
      ? currentTab.toLowerCase()
      : "walkin";
  });

  useEffect(() => {
    if (currentTab && ["walkin", "book", "my_apts", "history", "family"].includes(currentTab.toLowerCase())) {
      setActiveTab(currentTab.toLowerCase());
    }
  }, [currentTab]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const pageParam = (params.get("page") || params.get("view") || "").toLowerCase();
      if (tabParam && ["walkin", "book", "my_apts", "history", "family"].includes(tabParam.toLowerCase())) {
        setActiveTab(tabParam.toLowerCase());
      } else if (["history", "appointment_history", "past_appointments"].includes(pageParam)) {
        setActiveTab("history");
      } else if (["my_apts", "appointments", "my_appointments"].includes(pageParam)) {
        setActiveTab("my_apts");
      } else if (["book", "booking", "schedule"].includes(pageParam)) {
        setActiveTab("book");
      } else if (["family", "dependents"].includes(pageParam)) {
        setActiveTab("family");
      } else if (pageParam === "patient") {
        setActiveTab("walkin");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tabKey) => {
    const cleanKey = (tabKey || "").toLowerCase();
    setActiveTab(cleanKey);
    if (cleanKey === "history") {
      fetchUserAppointments();
      fetchUserTicketHistory();
    } else if (cleanKey === "my_apts") {
      fetchUserAppointments();
    }
    if (navigateTo) {
      navigateTo("patient", cleanKey);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "patient");
      url.searchParams.set("tab", cleanKey);
      window.history.pushState({}, "", url.toString());
    }
  };

  const [name, setName] = useState(currentUser ? currentUser.username : "");
  const [age, setAge] = useState(currentUser && currentUser.age ? currentUser.age : 35);
  const [gender, setGender] = useState(currentUser && currentUser.gender ? currentUser.gender.toLowerCase() : "male");
  const [medicalCondition, setMedicalCondition] = useState("general_checkup");
  const [customSymptom, setCustomSymptom] = useState("");
  const [preExistingCondition, setPreExistingCondition] = useState("none");
  const [category, setCategory] = useState("consultation");
  const [priority, setPriority] = useState(2);
  const [statusMsg, setStatusMsg] = useState(null);

  // Ticket Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Running late");
  const [otherCancelReason, setOtherCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Queue Adjustment (Skip Backward) Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedSkipCount, setSelectedSkipCount] = useState(1);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState("");
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState("");

  // Digital Prescription Slip Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [viewingPrescriptionData, setViewingPrescriptionData] = useState(null);

  const [activeHospitalCode, setActiveHospitalCode] = useState(
    tenantId || currentHospitalTenant || currentUser?.hospital_code || "city-hospital-01"
  );

  useEffect(() => {
    if (tenantId) setActiveHospitalCode(tenantId);
  }, [tenantId]);

  useEffect(() => {
    if (currentHospitalTenant) setActiveHospitalCode(currentHospitalTenant);
  }, [currentHospitalTenant]);

  // Multi-Hospital Facility Switcher State
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState("");
  const [hospitalsList, setHospitalsList] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/hospitals/public`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success" && Array.isArray(d.hospitals)) {
          setHospitalsList(d.hospitals);
        }
      })
      .catch((e) => console.log("Hospitals fetch error in PatientPage:", e));
  }, []);

  const [hospitalDepartments, setHospitalDepartments] = useState([]);

  useEffect(() => {
    const code = activeHospitalCode || tenantId;
    if (!code) return;
    fetch(`${API_BASE}/api/v1/hospital/departments/${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success" && Array.isArray(d.departments) && d.departments.length > 0) {
          setHospitalDepartments(d.departments);
        }
      })
      .catch((e) => console.log("Departments fetch error in PatientPage:", e));
  }, [activeHospitalCode, tenantId]);

  const availableDepartments = useMemo(() => {
    if (hospitalDepartments.length > 0) {
      return hospitalDepartments.map((d) => ({
        id: d.dept_code || d.code || String(d.id),
        label: d.name,
      }));
    }
    return HOSPITAL_CONFIG.categories;
  }, [hospitalDepartments]);

  const getDeptDisplayName = useCallback((recordOrCode) => {
    if (!recordOrCode) return language === "hi" ? "सामान्य परामर्श (OPD)" : "General Consultation (OPD)";
    if (typeof recordOrCode === "object") {
      if (recordOrCode.department_name) return recordOrCode.department_name;
      if (recordOrCode.department) return recordOrCode.department;
      if (recordOrCode.departments?.name) return recordOrCode.departments.name;
      if (recordOrCode.service_category) return getDeptDisplayName(recordOrCode.service_category);
    }
    const code = String(recordOrCode).toLowerCase().trim();
    const found = availableDepartments.find((d) => String(d.id).toLowerCase() === code || String(d.label).toLowerCase() === code);
    if (found) return found.label;
    return getCategoryLabel(code, language) || code;
  }, [availableDepartments, language]);

  const handleSelectHospital = (hospCode, hospName = null) => {
    if (!hospCode) return;
    const cleanCode = String(hospCode).trim();
    setActiveHospitalCode(cleanCode);
    if (onSwitchHospital) {
      onSwitchHospital(cleanCode, hospName);
    } else {
      try {
        localStorage.setItem("ai_queue_current_hospital", cleanCode);
        const url = new URL(window.location.href);
        url.searchParams.set("hospital", cleanCode);
        window.history.pushState({}, "", url.toString());
      } catch (e) {}
      window.dispatchEvent(new CustomEvent("hospital_changed", { detail: cleanCode }));
    }

    // Immediately fetch new hospital branding
    fetch(`${API_BASE}/api/v1/hospital/branding/${cleanCode}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success" && d.branding) {
          setHospitalBranding(d.branding);
        }
      })
      .catch((e) => console.log("Branding error:", e));

    setShowHospitalModal(false);
  };

  const safeISODate = (val) => {
    if (!val) return new Date().toISOString();
    try {
      if (typeof val === "number") {
        const ms = val < 1e11 ? val * 1000 : val;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (/^\d+$/.test(trimmed)) {
          const num = Number(trimmed);
          const ms = num < 1e11 ? num * 1000 : num;
          const d = new Date(ms);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch (e) {}
    return new Date().toISOString();
  };

  const formatDateSafe = (dateVal) => {
    if (!dateVal) return "";
    try {
      if (typeof dateVal === "number") {
        const ms = dateVal < 1e11 ? dateVal * 1000 : dateVal;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
      }
      if (typeof dateVal === "string" && /^\d+$/.test(dateVal.trim())) {
        const num = Number(dateVal.trim());
        const ms = num < 1e11 ? num * 1000 : num;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
      }
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) return d.toLocaleDateString();
    } catch (e) {}
    return String(dateVal);
  };

  const parsePrescription = (prescriptionNotes, fallbackTicket = null) => {
    if (!prescriptionNotes && !fallbackTicket) return null;
    let parsed = null;
    if (typeof prescriptionNotes === "object" && prescriptionNotes !== null) {
      parsed = prescriptionNotes;
    } else if (typeof prescriptionNotes === "string") {
      let trimmed = prescriptionNotes.trim();
      // Strip outer wrapping quotes if double-quoted / escaped string
      while (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        trimmed = trimmed.slice(1, -1).trim();
      }
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          parsed = JSON.parse(trimmed);
        } catch (e) {
          try {
            parsed = JSON.parse(JSON.parse(prescriptionNotes));
          } catch (e2) {}
        }
      } else {
        try {
          const direct = JSON.parse(prescriptionNotes);
          if (typeof direct === "object" && direct !== null) {
            parsed = direct;
          } else if (typeof direct === "string" && direct.trim().startsWith("{")) {
            parsed = JSON.parse(direct);
          }
        } catch (e) {}
      }
    }

    if (parsed && typeof parsed === "object") {
      const resolvedDoctor = (parsed.doctor_name && parsed.doctor_name !== "Dr. Staff Desk")
        ? parsed.doctor_name
        : (fallbackTicket?.doctor_name || fallbackTicket?.served_by_doctor_name || (parsed.doctor_name !== "Dr. Staff Desk" ? parsed.doctor_name : "") || "Consultant Physician");
      return {
        doctor_name: resolvedDoctor,
        doctor_department: parsed.doctor_department || fallbackTicket?.service_category || fallbackTicket?.department_name || "General OPD",
        doctor_employee_id: parsed.doctor_employee_id || "",
        diagnosis: parsed.diagnosis || fallbackTicket?.medical_condition || "Clinical Consultation",
        medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
        lab_tests: parsed.lab_tests || "",
        advice: parsed.advice || "",
        follow_up: parsed.follow_up || "",
        prescribed_at: safeISODate(parsed.prescribed_at || fallbackTicket?.serve_end_time || fallbackTicket?.created_at),
        patient_name: fallbackTicket?.name || fallbackTicket?.patient_name || parsed.patient_name || (currentUser ? (currentUser.username || currentUser.name) : "Patient"),
        ticket_id: fallbackTicket?.ticket_id || parsed.ticket_id || "",
        age: fallbackTicket?.age || 30,
        gender: fallbackTicket?.gender || "Patient",
        hospital_name: fallbackTicket?.hospital_name || (fallbackTicket?.hospital_code && Array.isArray(hospitalsList) && hospitalsList.find((h) => String(h.hospital_code) === String(fallbackTicket.hospital_code))?.name) || currentHospitalDisplayName,
      };
    }

    // Clean fallback for plain text advice or completed consultation
    let rawStr = typeof prescriptionNotes === "string" ? prescriptionNotes.trim() : "";
    if (rawStr.startsWith("{") || rawStr.startsWith('"{')) {
      rawStr = "Clinical prescription available upon request.";
    }

    const fallbackDoctor = fallbackTicket?.doctor_name || fallbackTicket?.served_by_doctor_name || "Consultant Physician";

    return {
      doctor_name: fallbackDoctor,
      doctor_department: fallbackTicket?.service_category || fallbackTicket?.department_name || "General OPD",
      diagnosis: fallbackTicket?.medical_condition || "Clinical Consultation",
      medicines: [],
      lab_tests: "",
      advice: rawStr || "Clinical consultation completed. Regular medical review as advised.",
      follow_up: "Review as advised",
      prescribed_at: safeISODate(fallbackTicket?.serve_end_time || fallbackTicket?.created_at),
      patient_name: fallbackTicket?.name || fallbackTicket?.patient_name || (currentUser ? (currentUser.username || currentUser.name) : "Patient"),
      ticket_id: fallbackTicket?.ticket_id || fallbackTicket?.appointment_id || "",
      age: fallbackTicket?.age || 30,
      gender: fallbackTicket?.gender || "Patient",
      hospital_name: fallbackTicket?.hospital_name || (fallbackTicket?.hospital_code && Array.isArray(hospitalsList) && hospitalsList.find((h) => String(h.hospital_code) === String(fallbackTicket.hospital_code))?.name) || currentHospitalDisplayName,
    };
  };

  const handleOpenPrescriptionSlip = (prescriptionNotes, fallbackTicket) => {
    const data = parsePrescription(prescriptionNotes, fallbackTicket);
    if (data) {
      setViewingPrescriptionData(data);
      setShowPrescriptionModal(true);
    }
  };

  // Appointment Booking Form State
  const [aptDate, setAptDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [aptTimeSlot, setAptTimeSlot] = useState("");
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);
  const [checkInCode, setCheckInCode] = useState("");
  const [aptSearchName, setAptSearchName] = useState("");
  const [aptSearchLoading, setAptSearchLoading] = useState(false);
  const [userTicketHistory, setUserTicketHistory] = useState([]);

  // ── Booking date window: today → today + 2 days (3 days max) ──────────────
  const bookingDateBounds = useMemo(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todayStr = fmt(now);
    const maxD = new Date(now);
    maxD.setDate(maxD.getDate() + 2);
    return { min: todayStr, max: fmt(maxD), todayStr };
  }, []);

  const timeSlotOptions = [
    "09:00 AM", "09:45 AM", "10:30 AM", "11:15 AM", "12:00 PM",
    "02:00 PM", "02:45 PM", "03:30 PM", "04:15 PM", "05:00 PM"
  ];

  // Parse a "hh:mm AM/PM" slot string into a comparable minute-of-day number
  const slotToMinutes = (slot) => {
    const [time, period] = slot.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  // Returns true if the slot has already passed (only relevant for today)
  const isSlotPast = useCallback((slot) => {
    if (aptDate !== bookingDateBounds.todayStr) return false;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotToMinutes(slot) <= nowMinutes;
  }, [aptDate, bookingDateBounds.todayStr]);

  // When the selected date changes, clamp to valid window.
  // Manual selection: do NOT auto-select slots. If a previously chosen slot passed on the new date, reset it.
  useEffect(() => {
    if (!aptDate) return;
    // Clamp if date goes out of range
    if (aptDate < bookingDateBounds.min || aptDate > bookingDateBounds.max) {
      setAptDate(bookingDateBounds.min);
      return;
    }
    if (aptTimeSlot && isSlotPast(aptTimeSlot)) {
      setAptTimeSlot("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aptDate, bookingDateBounds]);

  const fetchUserAppointments = useCallback((overrideName) => {
    const ident =
      overrideName ||
      (currentUser?.email) ||
      (currentUser?.username) ||
      localStorage.getItem("last_patient_name") ||
      "";
    if (!ident.trim()) return;
    const encodedIdent = encodeURIComponent(ident.trim());
    fetch(`${API_BASE}/api/v1/plugin/appointments/user/${encodedIdent}`)
      .then((r) => r.json())
      .then((d) => {
        const apts = Array.isArray(d?.appointments) ? d.appointments : [];
        if (overrideName) {
          setUserAppointments((prev) => {
            const map = new Map(prev.map((a) => [a.appointment_id, a]));
            apts.forEach((a) => map.set(a.appointment_id, a));
            return Array.from(map.values());
          });
        } else {
          setUserAppointments(apts);
        }
      })
      .catch((e) => console.log("Appointments fetch error:", e));
  }, [currentUser]);

  useEffect(() => {
    if (selectedMemberId === "self") {
      if (currentUser) {
        setName(currentUser.username || "");
        if (currentUser.age) setAge(currentUser.age);
        if (currentUser.gender) setGender(currentUser.gender.toLowerCase());
      } else {
        const savedName = localStorage.getItem("last_patient_name");
        if (savedName) {
          setName(savedName);
        }
      }
    }
    fetchUserAppointments();
  }, [currentUser, fetchUserAppointments]);

  // Automatically sync form demographics (Patient Full Name, Age, Gender) whenever the active member profile changes
  useEffect(() => {
    const mem = (familyMembers || []).find((m) => String(m.id) === String(selectedMemberId)) || (selectedMemberId === "self" ? selfObj : null);
    if (mem && mem.name) {
      setName(mem.name);
      if (mem.age) setAge(mem.age);
      if (mem.gender) setGender(mem.gender.toLowerCase());
    }
  }, [selectedMemberId, familyMembers]);

  // Tenant Customization & Branding (White-Labeling) State
  const [hospitalBranding, setHospitalBranding] = useState(hospitalBrandingProp);

  useEffect(() => {
    if (hospitalBrandingProp) {
      setHospitalBranding(hospitalBrandingProp);
    }
  }, [hospitalBrandingProp]);

  useEffect(() => {
    const hospCode = activeHospitalCode || tenantId || currentHospitalTenant || "city-hospital-01";
    if (!hospitalBrandingProp) {
      fetch(`${API_BASE}/api/v1/hospital/branding/${hospCode}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === "success" && d.branding) {
            setHospitalBranding(d.branding);
          }
        })
        .catch((e) => console.log("Branding fetch error:", e));
    }

    const handleHospEvent = (e) => {
      const newCode = (typeof e?.detail === "string" ? e.detail : e?.detail?.hospital_code) || tenantId || "city-hospital-01";
      setActiveHospitalCode(newCode);
      fetch(`${API_BASE}/api/v1/hospital/branding/${newCode}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === "success" && d.branding) {
            setHospitalBranding(d.branding);
          }
        })
        .catch((err) => console.log("Branding fetch error:", err));
    };
    window.addEventListener("hospital_changed", handleHospEvent);
    return () => window.removeEventListener("hospital_changed", handleHospEvent);
  }, [tenantId, currentHospitalTenant, activeHospitalCode]);

  // Dynamically resolved hospital display name across entire patient experience
  const currentHospitalDisplayName =
    hospitalBranding?.hospital_name ||
    hospitalBranding?.name ||
    hospitalsList.find((h) => String(h.hospital_code) === String(activeHospitalCode))?.name ||
    (String(currentUser?.hospital_code) === String(activeHospitalCode) ? currentUser?.hospital_name : null) ||
    HOSPITAL_CONFIG.name;

  // Resolve hospital name for any appointment or ticket history record
  const getHospitalNameForRecord = useCallback((record) => {
    if (!record) return currentHospitalDisplayName;
    if (record.hospital_name && record.hospital_name !== "City General Hospital") {
      return record.hospital_name;
    }
    const code = record.hospital_code || record.tenant_id;
    if (code && Array.isArray(hospitalsList)) {
      const match = hospitalsList.find((h) => String(h.hospital_code) === String(code));
      if (match?.name) return match.name;
    }
    if (record.hospital_name) return record.hospital_name;
    return currentHospitalDisplayName;
  }, [currentHospitalDisplayName, hospitalsList]);

  // Operational Schedule & Registration Cutoff Status
  const registrationStatus = (() => {
    const brand = hospitalBranding || {};
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[now.getDay()];

    if (Array.isArray(brand.operating_days) && brand.operating_days.length > 0) {
      if (!brand.operating_days.includes(todayName)) {
        return {
          isClosed: true,
          reason: language === "hi" ? `आज (${todayName}) ओपीडी बंद है।` : `OPD is closed today (${todayName}).`,
        };
      }
    }

    const opdStart = brand.opd_start_time || brand.registration_open_time || "08:00";
    const opdEnd = brand.opd_end_time || brand.registration_close_time || "20:00";
    const curTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (curTime < opdStart) {
      return {
        isClosed: true,
        reason: language === "hi"
          ? `ओपीडी पंजीकरण प्रातः ${opdStart} बजे से प्रारंभ होगा।`
          : `OPD registration opens at ${opdStart}.`,
      };
    }

    if (curTime > opdEnd) {
      return {
        isClosed: true,
        reason: language === "hi"
          ? `आज का ओपीडी समय (${opdEnd}) समाप्त हो चुका है।`
          : `Today's OPD hours (${opdStart} - ${opdEnd}) have ended.`,
      };
    }

    return { isClosed: false, reason: "" };
  })();

  const fetchUserTicketHistory = useCallback((overrideName) => {
    const ident =
      overrideName ||
      (currentUser?.email) ||
      (currentUser?.username) ||
      name ||
      localStorage.getItem("last_patient_name") ||
      "";
    if (!ident.trim()) return;
    const encodedIdent = encodeURIComponent(ident.trim());
    const extraName = (!overrideName && name && name.trim() && name.trim().toLowerCase() !== ident.trim().toLowerCase())
      ? `?name=${encodeURIComponent(name.trim())}`
      : "";
    fetch(`${API_BASE}/api/v1/plugin/tickets/history/${encodedIdent}${extraName}`)
      .then((r) => r.json())
      .then((d) => {
        const tickets = Array.isArray(d?.tickets) ? d.tickets : [];
        if (overrideName) {
          setUserTicketHistory((prev) => {
            const map = new Map(prev.map((t) => [t.ticket_id, t]));
            tickets.forEach((t) => map.set(t.ticket_id, t));
            return Array.from(map.values());
          });
        } else {
          setUserTicketHistory(tickets);
        }
        // If current activeTicket is present in history and completed/cancelled, clear it
        if (activeTicket?.ticket_id) {
          const matching = tickets.find((t) => t.ticket_id === activeTicket.ticket_id);
          if (matching && !isLiveTicketStatus(matching)) {
            setActiveTicket(null);
            if (setTicketQrData) setTicketQrData(null);
            try {
              localStorage.removeItem("ai_queue_active_ticket");
            } catch (e) {}
            removeTicketFromFamilyTickets(matching.ticket_id);
          }
        }
      })
      .catch((e) => console.log("Ticket history fetch error:", e));
  }, [currentUser, name, activeTicket?.ticket_id, removeTicketFromFamilyTickets, setActiveTicket, setTicketQrData]);

  // Auto-sync latest ticket data (status, position, wait time, prescription_notes) whenever activeTicket exists
  useEffect(() => {
    if (!activeTicket?.ticket_id) return;

    let isSubscribed = true;

    const syncTicketStatus = () => {
      fetch(`${API_BASE}/api/v1/plugin/ticket/${activeTicket.ticket_id}`)
        .then((r) => r.json())
        .then((d) => {
          if (!isSubscribed) return;
          if (d.status === "success" && d.ticket) {
            const live = isLiveTicketStatus(d.ticket);
            if (!live) {
              // Ticket was completed or cancelled on the server! Clear from active queue view
              setActiveTicket(null);
              if (setTicketQrData) setTicketQrData(null);
              try {
                localStorage.removeItem("ai_queue_active_ticket");
              } catch (e) {}
              removeTicketFromFamilyTickets(d.ticket.ticket_id);
              fetchUserTicketHistory();
              fetchUserAppointments();
            } else {
              setActiveTicket((prev) => ({ ...prev, ...d.ticket }));
            }
          }
        })
        .catch(() => {});
    };

    // Immediately sync on mount / activeTicket change
    syncTicketStatus();

    // Poll every 5 seconds to catch doctor completing or serving ticket in real time
    const interval = setInterval(syncTicketStatus, 5000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeTicket?.ticket_id, removeTicketFromFamilyTickets, fetchUserTicketHistory, fetchUserAppointments, setActiveTicket, setTicketQrData]);

  const selectedMember = (familyMembers || []).find((m) => String(m.id) === String(selectedMemberId)) || familyMembers[0] || selfObj;

  const activeAppointments = userAppointments.filter((apt) => {
    const s = (apt.status || "").toLowerCase();
    const isActive = s === "scheduled" || s === "checked_in" || s === "serving" || s === "waiting";
    if (!isActive) return false;
    const tId = apt.ticket_id;
    if (tId) {
      if (userTicketHistory.some((t) => t.ticket_id === tId && ["cancelled", "completed", "expired", "no_show"].includes((t.status || "").toLowerCase()))) {
        return false;
      }
    }
    return true;
  });

  const historyAppointments = userAppointments.filter((apt) => {
    const s = (apt.status || "").toLowerCase();
    const isHistoric = s === "completed" || s === "transferred" || s === "cancelled" || s === "no_show" || s === "expired";
    if (isHistoric) return true;
    const tId = apt.ticket_id;
    if (tId && userTicketHistory.some((t) => t.ticket_id === tId && ["cancelled", "completed", "expired", "no_show"].includes((t.status || "").toLowerCase()))) {
      return true;
    }
    return false;
  });

  // Walk-in tickets that are completed, cancelled, expired, or no_show — these are NOT in appointments table
  const historyTickets = userTicketHistory.filter((t) => {
    const s = (t.status || "").toLowerCase();
    return s === "completed" || s === "cancelled" || s === "transferred" || s === "no_show" || s === "expired";
  });

  const searchFilter = (aptSearchName || "").trim().toLowerCase();

  const filterRecordBySearch = (item, type = "ticket") => {
    if (!searchFilter) return true;
    if (type === "ticket") {
      const nameMatch = (item.name || "").toLowerCase().includes(searchFilter);
      const ticketIdMatch = (item.ticket_id || "").toLowerCase().includes(searchFilter);
      const aptIdMatch = (item.appointment_id || "").toLowerCase().includes(searchFilter);
      const hospMatch = (item.hospital_name || "").toLowerCase().includes(searchFilter);
      const deptMatch = (item.department_name || item.service_category || "").toLowerCase().includes(searchFilter);
      const reasonMatch = (item.cancellation_reason || "").toLowerCase().includes(searchFilter);
      return nameMatch || ticketIdMatch || aptIdMatch || hospMatch || deptMatch || reasonMatch;
    } else {
      const nameMatch = (item.patient_name || "").toLowerCase().includes(searchFilter);
      const aptIdMatch = (item.appointment_id || "").toLowerCase().includes(searchFilter);
      const ticketIdMatch = (item.ticket_id || "").toLowerCase().includes(searchFilter);
      const hospMatch = (item.hospital_name || "").toLowerCase().includes(searchFilter);
      const deptMatch = (item.service_category || "").toLowerCase().includes(searchFilter);
      const timeMatch = (item.time_slot || "").toLowerCase().includes(searchFilter);
      return nameMatch || aptIdMatch || ticketIdMatch || hospMatch || deptMatch || timeMatch;
    }
  };

  const displayedActiveAppointments = activeAppointments.filter((apt) => filterRecordBySearch(apt, "appointment"));
  const displayedHistoryAppointments = historyAppointments.filter((apt) => filterRecordBySearch(apt, "appointment"));
  const displayedHistoryTickets = historyTickets.filter((tk) => filterRecordBySearch(tk, "ticket"));

  const handleClearSearch = () => {
    setAptSearchName("");
    fetchUserAppointments();
    fetchUserTicketHistory();
  };

  // Initial fetch on mount / user change to populate badge counts and data immediately
  useEffect(() => {
    fetchUserAppointments();
    fetchUserTicketHistory();
  }, [fetchUserAppointments, fetchUserTicketHistory]);

  // Live polling for "My Appointments", "History", and "Book" tabs so cancellations/progress update live
  useEffect(() => {
    if (activeTab === "my_apts" || activeTab === "history" || activeTab === "book") {
      const currentQuery = (aptSearchName || "").trim();
      fetchUserAppointments(currentQuery || undefined);
      if (activeTab === "history") fetchUserTicketHistory(currentQuery || undefined);
      const interval = setInterval(() => {
        const liveQuery = (aptSearchName || "").trim();
        fetchUserAppointments(liveQuery || undefined);
        if (activeTab === "history") fetchUserTicketHistory(liveQuery || undefined);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchUserAppointments, fetchUserTicketHistory, aptSearchName]);

  // Keep bookedAppointment in sync with the live userAppointments list.
  // If the booked appointment gets cancelled or checked-in via another route,
  // this effect ensures the confirmation card reflects that without a page refresh.
  useEffect(() => {
    if (!bookedAppointment) return;
    const live = userAppointments.find(
      (a) => a.appointment_id === bookedAppointment.appointment_id
    );
    if (!live) return;
    if (live.status !== bookedAppointment.status) {
      setBookedAppointment((prev) => ({ ...prev, status: live.status }));
    }
  }, [userAppointments, bookedAppointment]);

  // Real-time Socket.IO synchronization for appointments and tickets
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleRealtimeSync = () => {
      fetchUserAppointments();
      fetchUserTicketHistory();
      if (refreshData) refreshData();
    };

    socket.on("appointment_updated", handleRealtimeSync);
    socket.on("ticket_cancelled", handleRealtimeSync);
    socket.on("ticket_completed", handleRealtimeSync);
    socket.on("ticket_updated", handleRealtimeSync);
    socket.on("queue_updated", handleRealtimeSync);
    socket.on("now_serving", handleRealtimeSync);

    return () => {
      socket.off("appointment_updated", handleRealtimeSync);
      socket.off("ticket_cancelled", handleRealtimeSync);
      socket.off("ticket_completed", handleRealtimeSync);
      socket.off("ticket_updated", handleRealtimeSync);
      socket.off("queue_updated", handleRealtimeSync);
      socket.off("now_serving", handleRealtimeSync);
    };
  }, [socketRef, fetchUserAppointments, fetchUserTicketHistory, refreshData]);

  const handleSelectMember = (member) => {
    if (!member) return;
    const memId = member.id || "self";
    setSelectedMemberId(memId);
    setName(member.name || "");
    if (member.age) setAge(member.age);
    if (member.gender) setGender(member.gender.toLowerCase());

    if (setActiveFamilyMemberProp) {
      setActiveFamilyMemberProp(memId === "self" ? null : member);
    }

    // If this family member already has a live active ticket in familyTickets, switch activeTicket to it
    const memTicket = familyTickets[memId] || familyTickets[String(memId)];
    if (memTicket && isLiveTicketStatus(memTicket)) {
      setActiveTicket(memTicket);
      fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${memTicket.ticket_id}`)
        .then((r) => r.json())
        .then((qr) => setTicketQrData(qr))
        .catch((e) => console.log("QR error:", e));
    } else {
      setActiveTicket(null);
      if (setTicketQrData) setTicketQrData(null);
    }
    setStatusMsg(`${t("profileSwitchedMsg", language)} ${member.name}`);
  };

  // Sync when activeFamilyMemberProp changes from Header or parent
  useEffect(() => {
    if (activeFamilyMemberProp !== undefined) {
      const targetId = activeFamilyMemberProp ? activeFamilyMemberProp.id : "self";
      if (String(targetId) !== String(selectedMemberId)) {
        const mem = (familyMembers || []).find((m) => String(m.id) === String(targetId)) || (targetId === "self" ? selfObj : activeFamilyMemberProp);
        if (mem) {
          handleSelectMember(mem);
        }
      }
    }
  }, [activeFamilyMemberProp]);

  // Fetch family members from backend when user is logged in
  useEffect(() => {
    if (!currentUser || !currentUser.email) return;
    // If App-level prop is controlling family members, don't fetch independently
    if (familyMembersProp !== null) return;
    fetch(`${API_BASE}/api/v1/family-members`, {
      headers: { "X-User-Email": currentUser.email }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success" && Array.isArray(data.members)) {
          const selfObj = {
            id: "self",
            name: currentUser.username || "Self",
            relation: "self",
            age: currentUser.age || 35,
            gender: currentUser.gender ? currentUser.gender.toLowerCase() : "male",
          };
          const fullList = [selfObj, ...data.members];
          setLocalFamilyMembers(fullList);
          const storageKey = `family_members_${currentUser.username || currentUser.email}`;
          try {
            localStorage.setItem(storageKey, JSON.stringify(fullList));
          } catch (e) {}
        }
      })
      .catch((err) => console.log("PatientPage family fetch error:", err));
  }, [currentUser]);

  // Sync when App-level family members prop changes
  useEffect(() => {
    if (familyMembersProp !== null) {
      // familyMembers computed above auto-updates since it reads familyMembersProp
      // If current selected member is no longer in the list, reset to self
      if (selectedMemberId !== "self") {
        const stillExists = (familyMembersProp || []).some(m => m.id === selectedMemberId);
        if (!stillExists) setSelectedMemberId("self");
      }
    }
  }, [familyMembersProp]);

  const handleAddMember = async (newMember) => {
    const tempId = newMember.id || `dep_${Date.now()}`;
    const initialMember = { ...newMember, id: tempId };

    // 1. Instantly update local state so the member shows up immediately with 0 delay
    const currentDependents = familyMembers.filter((m) => m && m.id !== "self" && m.id !== tempId);
    const updatedDependents = [...currentDependents, initialMember];
    setFamilyMembers([selfObj, ...updatedDependents]);
    handleSelectMember(initialMember);

    // 2. Persist to backend database
    if (currentUser && currentUser.email) {
      try {
        const token = currentUser.token || localStorage.getItem("ai_queue_token");
        const res = await fetch(`${API_BASE}/api/v1/family-members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": currentUser.email,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(newMember),
        });
        const data = await res.json();
        if (data.status === "success" && data.member) {
          const savedMember = data.member;
          const reconciled = updatedDependents.map((m) => (m.id === tempId ? savedMember : m));
          setFamilyMembers([selfObj, ...reconciled]);
          window.dispatchEvent(new CustomEvent("family_members_updated", { detail: reconciled }));
          if (onFamilyMembersChange) onFamilyMembersChange(reconciled);
          handleSelectMember(savedMember);
          return;
        }
      } catch (err) {
        console.log("Error saving family member:", err);
      }
    }

    window.dispatchEvent(new CustomEvent("family_members_updated", { detail: updatedDependents }));
    if (onFamilyMembersChange) onFamilyMembersChange(updatedDependents);
  };

  const handleEditMember = async (updatedMember) => {
    // 1. Immediately update UI state
    const currentDependents = familyMembers.filter((m) => m && m.id !== "self");
    const updatedDependents = currentDependents.map((m) => (m.id === updatedMember.id ? { ...m, ...updatedMember } : m));
    setFamilyMembers([selfObj, ...updatedDependents]);
    setEditingMember(null);

    // 2. Persist to backend database
    if (currentUser && currentUser.email) {
      try {
        const token = currentUser.token || localStorage.getItem("ai_queue_token");
        await fetch(`${API_BASE}/api/v1/family-members/${encodeURIComponent(updatedMember.id)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": currentUser.email,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(updatedMember),
        });
        window.dispatchEvent(new CustomEvent("family_members_updated", { detail: updatedDependents }));
        if (onFamilyMembersChange) onFamilyMembersChange(updatedDependents);
      } catch (err) {
        console.log("Error updating family member:", err);
      }
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (memberId === "self") return;

    // 1. Immediately update UI state
    const updatedDependents = familyMembers.filter((m) => m && m.id !== "self" && m.id !== memberId);
    setFamilyMembers([selfObj, ...updatedDependents]);

    if (familyTickets[memberId]) {
      const updatedTickets = { ...familyTickets };
      delete updatedTickets[memberId];
      setFamilyTickets(updatedTickets);
    }

    if (selectedMemberId === memberId) {
      setSelectedMemberId("self");
      setName(selfObj.name);
    }

    // 2. Persist delete to backend database
    if (currentUser && currentUser.email) {
      try {
        const token = currentUser.token || localStorage.getItem("ai_queue_token");
        await fetch(`${API_BASE}/api/v1/family-members/${encodeURIComponent(memberId)}`, {
          method: "DELETE",
          headers: {
            "X-User-Email": currentUser.email,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        window.dispatchEvent(new CustomEvent("family_members_updated", { detail: updatedDependents }));
        if (onFamilyMembersChange) onFamilyMembersChange(updatedDependents);
      } catch (err) {
        console.log("Error deleting family member:", err);
      }
    }
  };

  // Sync when patient profile is switched via Header dropdown
  useEffect(() => {
    const handleSwitchEvent = (e) => {
      if (e && e.detail) {
        handleSelectMember(e.detail);
      }
    };
    const handleFamilySync = (e) => {
      if (e && e.detail) {
        setFamilyMembers(e.detail);
      } else {
        setFamilyMembers(getInitialFamilyMembers());
      }
    };
    window.addEventListener("switch_patient_profile", handleSwitchEvent);
    window.addEventListener("family_members_updated", handleFamilySync);
    return () => {
      window.removeEventListener("switch_patient_profile", handleSwitchEvent);
      window.removeEventListener("family_members_updated", handleFamilySync);
    };
  }, [familyMembers, familyTickets]);

  // 1. Instant Walk-In Ticket Checkin
  const handleJoinQueue = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // OPD status gate: Walk-in registration only allowed when OPD is open (Emergency priority can bypass 24/7)
    const isEmergency = Number(priority) === 1;
    if (registrationStatus.isClosed && !isEmergency) {
      setStatusMsg(
        registrationStatus.reason ||
        (language === "hi"
          ? "ओपीडी वर्तमान में बंद है। कतार प्रणाली केवल ओपीडी खुलने के समय काम करती है।"
          : "OPD is currently closed. The walk-in queue system only operates when the OPD is open.")
      );
      return;
    }

    setStatusMsg("Calculating AI clinical complexity & predicting wait time...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          consumer_type: "hospital",
          service_category: category,
          name: name,
          urgency: Number(priority) === 1 ? "emergency" : "routine",
          priority_level: Number(priority),
          user_email: currentUser ? currentUser.email : "",
          age: Number(age) || 30,
          gender: gender,
          medical_condition: medicalCondition === "other_custom" ? (customSymptom.trim() || "Other Symptom") : medicalCondition,
          pre_existing_condition: preExistingCondition,
          // Include family_member_id when booking for a dependent
          ...(selectedMemberId && selectedMemberId !== "self" ? { family_member_id: selectedMemberId } : {}),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const t = data.ticket;
        const tkt = t;
        setActiveTicket(t);

        try {
          localStorage.setItem("last_patient_name", name);
          if (selectedMemberId === "self") {
            localStorage.setItem("ai_queue_active_ticket", JSON.stringify(t));
          }
        } catch (e) {}

        // Record ticket in family tickets map under active member
        setFamilyTickets((prev) => {
          const updated = { ...prev, [selectedMemberId]: t };
          try {
            const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
            localStorage.setItem(ticketStorageKey, JSON.stringify(updated));
          } catch (e) {}
          window.dispatchEvent(new CustomEvent("family_tickets_updated", { detail: updated }));
          return updated;
        });

        setStatusMsg(`Ticket #${t.ticket_id} Issued for ${name}. AI Service Estimate: ${t.predicted_service_minutes} min.`);

        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${tkt.ticket_id}`)
          .then((r) => r.json())
          .then((qr) => setTicketQrData(qr))
          .catch((e) => console.log("QR error:", e));

        refreshData();
      } else {
        const err = await res.json();
        const msg = typeof err.detail === "string" ? err.detail : Array.isArray(err.detail) ? err.detail.map((d) => d.msg || JSON.stringify(d)).join(", ") : (err.message || "Failed to issue ticket.");
        setStatusMsg(`Error: ${msg}`);
      }
    } catch (err) {
      setStatusMsg(`Join failed: ${err.message}`);
    }
  };

  // 2. Book Pre-scheduled Slot
  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!aptTimeSlot) {
      setStatusMsg(
        language === "hi"
          ? "कृपया पहले उपलब्ध समय स्लॉट में से एक स्लॉट चुनें।"
          : "Please manually choose an available time slot before booking."
      );
      return;
    }
    setStatusMsg("Reserving hospital appointment slot...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/appointments/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          consumer_type: "hospital",
          service_category: category,
          patient_name: name,
          user_email: currentUser ? currentUser.email : name,
          appointment_date: aptDate,
          time_slot: aptTimeSlot,
          // Include family_member_id when booking for a dependent
          ...(selectedMemberId && selectedMemberId !== "self" ? { family_member_id: selectedMemberId } : {}),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        const aptWithDept = {
          ...data.appointment,
          department_name: data.appointment?.department_name || getDeptDisplayName(category),
          department: data.appointment?.department || getDeptDisplayName(category),
        };
        setBookedAppointment(aptWithDept);
        setStatusMsg(`Appointment Reserved. Code: ${data.appointment.appointment_id}`);
        try {
          localStorage.setItem("last_patient_name", name);
        } catch (e) {}
        setUserAppointments((prev) => [
          aptWithDept,
          ...prev.filter((a) => a.appointment_id !== data.appointment.appointment_id),
        ]);
        fetchUserAppointments();
      } else {
        setStatusMsg(`Booking failed: ${data.detail}`);
      }
    } catch (err) {
      setStatusMsg(`Booking failed: ${err.message}`);
    }
  };

  // 3. Hybrid Merge Check-In (Converts Scheduled Appointment -> Live Priority Queue Ticket)
  const handleAppointmentCheckIn = async (aptId) => {
    const targetId = aptId || checkInCode;
    if (!targetId.trim()) return;

    // OPD status gate: Check-in only allowed when OPD is open
    if (registrationStatus.isClosed) {
      setStatusMsg(
        registrationStatus.reason ||
        (language === "hi"
          ? "ओपीडी पंजीकरण वर्तमान में बंद है। लाइव कतार में चेक-इन केवल ओपीडी खुले होने पर ही संभव है।"
          : "OPD is currently closed. Checking in and joining the live line is only available when the OPD is open.")
      );
      return;
    }

    setStatusMsg(`Checking in appointment ${targetId}...`);

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/appointments/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: targetId }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        const t = data.ticket;
        const tkt = t;
        setActiveTicket(t);

        // Clear the booking confirmation card — Digital Ticket Pass takes over
        setBookedAppointment(null);

        if (selectedMemberId === "self") {
          try {
            localStorage.setItem("ai_queue_active_ticket", JSON.stringify(t));
          } catch (e) {}
        }

        // Record ticket in family tickets map under active member
        setFamilyTickets((prev) => {
          const updated = { ...prev, [selectedMemberId]: t };
          try {
            const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
            localStorage.setItem(ticketStorageKey, JSON.stringify(updated));
          } catch (e) {}
          window.dispatchEvent(new CustomEvent("family_tickets_updated", { detail: updated }));
          return updated;
        });

        setStatusMsg(`Appointment Checked In. Merged into Priority Line as Token #${t.ticket_id}`);

        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${tkt.ticket_id}`)
          .then((r) => r.json())
          .then((qr) => setTicketQrData(qr))
          .catch((e) => console.log("QR error:", e));

        setUserAppointments((prev) =>
          prev.map((a) =>
            a.appointment_id === targetId
              ? { ...a, status: "checked_in", ticket_id: t.ticket_id }
              : a
          )
        );
        fetchUserAppointments();
        refreshData();
      } else {
        const errorMsg = data.detail || data.message || "Failed to check in.";
        setStatusMsg(`Check-in error: ${errorMsg}`);
      }
    } catch (err) {
      setStatusMsg(`Check-in error: ${err.message}`);
    }
  };

  // 4. Cancel Ticket with Reason Validation
  const handleCancelTicket = async () => {
    if (!activeTicket) return;
    setCancelLoading(true);
    setCancelError("");
    const reasonText = cancelReason === "Other" && otherCancelReason.trim() ? otherCancelReason.trim() : cancelReason;

    try {
      const res = await fetch(`${API_BASE}/api/v1/tickets/${activeTicket.ticket_id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUser?.email ? { "X-User-Email": currentUser.email } : {}),
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          ticket_id: activeTicket.ticket_id,
          reason: reasonText || "Patient requested cancellation",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to cancel ticket.");
      }

      setActiveTicket(null);
      if (setTicketQrData) setTicketQrData(null);
      if (selectedMemberId === "self") {
        try {
          localStorage.removeItem("ai_queue_active_ticket");
        } catch (e) {}
      }

      // Clean from familyTickets map
      setFamilyTickets((prev) => {
        const updated = { ...prev };
        delete updated[selectedMemberId];
        Object.keys(updated).forEach((k) => {
          if (updated[k]?.ticket_id === activeTicket.ticket_id) delete updated[k];
        });
        try {
          const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
          localStorage.setItem(ticketStorageKey, JSON.stringify(updated));
        } catch (e) {}
        window.dispatchEvent(new CustomEvent("family_tickets_updated", { detail: updated }));
        return updated;
      });

      setShowCancelModal(false);
      setStatusMsg(`Ticket #${activeTicket.ticket_id} has been cancelled.`);
      setUserAppointments((prev) =>
        prev.map((a) =>
          a.ticket_id === activeTicket.ticket_id || a.appointment_id === activeTicket.appointment_id
            ? { ...a, status: "cancelled" }
            : a
        )
      );
      fetchUserAppointments();
      fetchUserTicketHistory();
      if (refreshData) refreshData();
    } catch (err) {
      setCancelError(err.message || "Could not cancel ticket.");
    } finally {
      setCancelLoading(false);
    }
  };

  // 4b. Cancel an Appointment directly from My Appointments
  const handleCancelAppointment = async (appointmentId, ticketId = null) => {
    if (!window.confirm(language === "hi" ? "क्या आप वाकई यह अपॉइंटमेंट रद्द करना चाहते हैं?" : "Are you sure you want to cancel this appointment?")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUser?.email ? { "X-User-Email": currentUser.email } : {}),
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          reason: "Patient cancelled from My Appointments",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`Appointment ${appointmentId} cancelled.`);
        setUserAppointments((prev) =>
          prev.map((a) => (a.appointment_id === appointmentId ? {
            ...a,
            status: "cancelled",
            department_name: data.appointment?.department_name || a.department_name || getDeptDisplayName(a),
            department: data.appointment?.department || a.department || getDeptDisplayName(a),
          } : a))
        );
        if (ticketId) {
          removeTicketFromFamilyTickets(ticketId);
          if (activeTicket?.ticket_id === ticketId) {
            setActiveTicket(null);
            if (setTicketQrData) setTicketQrData(null);
            try {
              localStorage.removeItem("ai_queue_active_ticket");
            } catch (e) {}
          }
        }
        fetchUserAppointments();
        fetchUserTicketHistory();
        if (refreshData) refreshData();
      } else {
        alert(data.message || data.detail || "Failed to cancel appointment.");
      }
    } catch (e) {
      alert("Error cancelling appointment: " + e.message);
    }
  };

  // 5. Adjust Queue / Skip Positions Backward (Fairness: 1-3 positions back)
  const handleAdjustQueue = async (skipCount) => {
    if (!activeTicket) return;
    const positionsToSkip = Number(skipCount || selectedSkipCount || 1);
    setAdjustLoading(true);
    setAdjustError("");
    setAdjustSuccessMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/tickets/${activeTicket.ticket_id}/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUser?.email ? { "X-User-Email": currentUser.email } : {}),
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          ticket_id: activeTicket.ticket_id,
          positions: positionsToSkip,
          skip_positions: positionsToSkip,
          reason: "Running late",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to adjust queue.");
      }

      if (data.ticket) {
        setActiveTicket(data.ticket);
        setFamilyTickets((prev) => {
          const updated = { ...prev, [selectedMemberId]: data.ticket };
          try {
            const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
            localStorage.setItem(ticketStorageKey, JSON.stringify(updated));
          } catch (e) {}
          window.dispatchEvent(new CustomEvent("family_tickets_updated", { detail: updated }));
          return updated;
        });
      }
      const successText = data.message || `Postponed by ${positionsToSkip} position(s).`;
      setAdjustSuccessMsg(successText);
      setStatusMsg(successText);

      setTimeout(() => {
        setShowAdjustModal(false);
        setAdjustSuccessMsg("");
      }, 1200);

      fetchUserAppointments();
      if (refreshData) refreshData();
    } catch (err) {
      setAdjustError(err.message || "Could not adjust queue position.");
    } finally {
      setAdjustLoading(false);
    }
  };

  // Switch active ticket pass between family members in real-time
  const handleSwitchTicketPass = (memId, tick) => {
    if (!tick) return;
    setActiveTicket(tick);
    setSelectedMemberId(memId);
    setName(tick.name || "");
    if (tick.age) setAge(tick.age);
    if (tick.gender) setGender(tick.gender.toLowerCase());
    const mem = familyMembers.find((m) => m.id === memId);
    if (mem && setActiveFamilyMemberProp) {
      setActiveFamilyMemberProp(mem.id === "self" ? null : mem);
    }
    fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${tick.ticket_id}`)
      .then((r) => r.json())
      .then((qr) => setTicketQrData(qr))
      .catch((e) => console.log("QR error:", e));
    setStatusMsg(`${t("profileSwitchedMsg", language)} ${tick.name}`);
  };
  return (
    <div className="patient-portal-root" style={{ width: "100%", paddingBottom: "4px" }}>
      <style>{`
        .patient-portal-root {
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          color: var(--patient-text-main, #0F172A);
        }

        .patient-portal-root * {
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .patient-hero-accent {
          background: linear-gradient(135deg, #0284C7 0%, #06B6D4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }

        :root {
          --patient-card-bg: #FFFFFF;
          --patient-card-border: #E2E8F0;
          --patient-text-main: #0F172A;
          --patient-text-sub: #64748B;
          --patient-sub-card: #F8FAFC;
          --patient-tag-bg: #F0F9FF;
          --patient-tag-color: #0369A1;
          --patient-tag-border: #BAE6FD;
          --apt-active-bg: #F0F9FF;
          --apt-active-border: #BAE6FD;
          --emergency-card-bg: #FEF2F2;
          --emergency-card-border: #FECACA;
          --emergency-card-text: #DC2626;
        }

        body.theme-dark {
          --patient-card-bg: #0F172A;
          --patient-card-border: #1E293B;
          --patient-text-main: #F8FAFC;
          --patient-text-sub: #94A3B8;
          --patient-sub-card: #1E293B;
          --patient-tag-bg: rgba(2, 132, 199, 0.18);
          --patient-tag-color: #38BDF8;
          --patient-tag-border: rgba(56, 189, 248, 0.3);
          --apt-active-bg: rgba(2, 132, 199, 0.16);
          --apt-active-border: #0284C7;
          --emergency-card-bg: rgba(220, 38, 38, 0.14);
          --emergency-card-border: rgba(220, 38, 38, 0.35);
          --emergency-card-text: #F87171;
        }

        body.theme-dark .patient-tabs-bar {
          background: #0F172A;
          border-color: #1E293B;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        body.theme-dark .patient-nav-title {
          color: #F8FAFC;
        }

        body.theme-dark .tab-button-modern.inactive {
          background: #1E293B;
          color: #F1F5F9;
          border-color: #334155;
        }

        body.theme-dark .tab-button-modern.inactive:hover {
          background: #27354A;
          border-color: #475569;
        }

        body.theme-dark .tab-button-modern.inactive .tab-icon-wrapper {
          background: #0F172A;
          color: #38BDF8;
        }

        body.theme-dark .telemetry-sidebar-card {
          background: #0F172A;
          border-color: #1E293B;
          color: #F8FAFC;
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.4);
        }

        body.theme-dark .form-field-label {
          color: #CBD5E1;
        }

        body.theme-dark .modern-form-input {
          background: #1E293B;
          border-color: #334155;
          color: #F8FAFC;
        }

        body.theme-dark .modern-form-input:focus {
          border-color: #38BDF8;
          box-shadow: 0 0 0 3.5px rgba(56, 189, 248, 0.18);
          background: #1E293B;
        }

        body.theme-dark .modern-form-input::placeholder {
          color: #64748B;
        }

        body.theme-dark .modern-triage-card.inactive-triage {
          background: #1E293B;
          border-color: #334155;
        }

        body.theme-dark .modern-triage-card.inactive-triage .triage-title {
          color: #F1F5F9;
        }

        body.theme-dark .modern-triage-card.inactive-triage .triage-subtitle {
          color: #94A3B8;
        }

        body.theme-dark .modern-triage-card.inactive-triage:hover {
          background: #27354A;
          border-color: #475569;
        }

        body.theme-dark .modern-triage-card.active-routine {
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.28) 0%, rgba(14, 165, 233, 0.18) 100%);
          border-color: #38BDF8;
          box-shadow: 0 4px 16px rgba(56, 189, 248, 0.2);
        }

        body.theme-dark .modern-triage-card.active-routine .triage-title {
          color: #38BDF8;
        }

        body.theme-dark .modern-triage-card.active-routine .triage-subtitle {
          color: #BAE6FD;
        }

        body.theme-dark .modern-triage-card.active-emergency {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.28) 0%, rgba(220, 38, 38, 0.18) 100%);
          border-color: #F87171;
          box-shadow: 0 4px 16px rgba(248, 113, 113, 0.2);
        }

        body.theme-dark .modern-triage-card.active-emergency .triage-title {
          color: #FCA5A5;
        }

        body.theme-dark .modern-triage-card.active-emergency .triage-subtitle {
          color: #FECACA;
        }

        body.theme-dark .patient-modal-box {
          background: #0F172A !important;
          border-color: #1E293B !important;
          color: #F8FAFC !important;
          box-shadow: 0 24px 48px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.15) !important;
        }

        body.theme-dark .patient-secondary-btn {
          background: #1E293B !important;
          border-color: #334155 !important;
          color: #CBD5E1 !important;
        }

        body.theme-dark .patient-secondary-btn:hover {
          background: #27354A !important;
          border-color: #475569 !important;
          color: #F8FAFC !important;
        }

        .patient-nav-section {
          margin-bottom: 24px;
        }

        .patient-nav-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 8px 14px;
          background: var(--patient-card-bg, rgba(255, 255, 255, 0.98));
          border: 1px solid var(--patient-card-border, #E2E8F0);
          border-radius: 14px;
          box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
          backdrop-filter: blur(12px);
          gap: 12px;
        }

        .patient-nav-title {
          font-size: 13.5px;
          font-weight: 800;
          color: var(--patient-text-main, #0F172A);
          letter-spacing: -0.2px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .patient-nav-title-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
          color: #0284C7;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.15);
        }

        .patient-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hospital-switcher-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 10px;
          background: var(--patient-card-bg, #FFFFFF);
          border: 1px solid var(--patient-card-border, #CBD5E1);
          color: var(--patient-text-main, #0F172A);
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hospital-switcher-btn:hover {
          border-color: #0284C7;
          background: var(--patient-tag-bg, #F0F9FF);
          box-shadow: 0 3px 10px rgba(2, 132, 199, 0.12);
          transform: translateY(-1px);
        }

        .hospital-switcher-badge {
          font-size: 11px;
          color: #0284C7;
          background: var(--patient-tag-bg, #EFF6FF);
          padding: 2px 7px;
          border-radius: 6px;
          font-weight: 700;
          border: 1px solid var(--patient-tag-border, #DBEAFE);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .patient-nav-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          font-weight: 700;
          color: #047857;
          background: rgba(16, 185, 129, 0.08);
          padding: 6px 12px;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.25);
          box-shadow: 0 1px 3px rgba(16, 185, 129, 0.08);
        }

        .status-dot-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
          animation: pulseDot 2s infinite ease-in-out;
        }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.35); }
          50% { transform: scale(1.25); opacity: 0.85; box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.08); }
        }

        .patient-tabs-bar {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          background: var(--patient-card-bg, #FFFFFF);
          padding: 8px;
          border-radius: 18px;
          border: 1px solid var(--patient-card-border, #E2E8F0);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          box-sizing: border-box;
          width: 100%;
        }

        body.theme-dark .patient-nav-header {
          background: #0F172A;
          border-color: #1E293B;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        body.theme-dark .hospital-switcher-btn {
          background: #1E293B;
          border-color: #334155;
          color: #F1F5F9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        body.theme-dark .hospital-switcher-btn:hover {
          background: #27354A;
          border-color: #0284C7;
          color: #F8FAFC;
        }

        body.theme-dark .hospital-switcher-badge {
          background: rgba(2, 132, 199, 0.18);
          border-color: rgba(56, 189, 248, 0.3);
          color: #38BDF8;
        }

        @media (max-width: 1080px) {
          .patient-tabs-bar {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
        }

        @media (max-width: 680px) {
          .patient-tabs-bar {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            padding: 6px;
            border-radius: 14px;
          }
        }

        @media (max-width: 380px) {
          .patient-tabs-bar {
            grid-template-columns: 1fr;
            gap: 6px;
          }
        }

        .patient-portal-dashboard {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
          box-sizing: border-box;
          width: 100%;
        }

        @media (max-width: 1024px) {
          .patient-portal-dashboard {
            grid-template-columns: 1fr;
            gap: 18px;
          }
        }

        .telemetry-sidebar-card {
          background: #FFFFFF;
          border-radius: 18px;
          border: 1px solid #E2E8F0;
          padding: 18px 20px;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-sizing: border-box;
          width: 100%;
        }

        @media (max-width: 580px) {
          .telemetry-sidebar-card {
            padding: 14px 14px;
            border-radius: 14px;
          }
        }

        .tab-button-modern {
          padding: 11px 13px;
          border-radius: 13px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          outline: none;
          user-select: none;
          position: relative;
          box-sizing: border-box;
          min-width: 0;
        }

        @media (max-width: 680px) {
          .tab-button-modern {
            padding: 9px 10px;
            border-radius: 10px;
            gap: 8px;
          }
        }

        .tab-button-modern.active {
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border-color: #0284C7;
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.26);
        }

        .tab-button-modern.inactive {
          background: #F8FAFC;
          color: #0F172A;
          border-color: #E2E8F0;
        }

        .tab-button-modern.inactive:hover {
          background: #FFFFFF;
          border-color: #CBD5E1;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
        }

        .tab-icon-wrapper {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        @media (max-width: 680px) {
          .tab-icon-wrapper {
            width: 28px;
            height: 28px;
            border-radius: 7px;
          }
          .tab-icon-wrapper svg {
            width: 16px;
            height: 16px;
          }
        }

        .tab-button-modern.active .tab-icon-wrapper {
          background: rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
        }

        .tab-button-modern.inactive .tab-icon-wrapper {
          background: #F0F9FF;
          color: #0284C7;
        }

        .tab-title-text {
          font-size: 13.5px;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.2px;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 680px) {
          .tab-title-text {
            font-size: 12px;
          }
        }

        .tab-sub-text {
          font-size: 11px;
          line-height: 1.35;
          display: block;
          margin-top: 2px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 680px) {
          .tab-sub-text {
            font-size: 9.5px;
          }
        }

        .tab-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          flex-shrink: 0;
          margin-left: 4px;
          transition: all 0.2s ease;
        }

        .form-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        @media (max-width: 640px) {
          .form-grid-2col {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }

        .form-field-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #475569;
          margin-bottom: 7px;
        }

        .modern-form-input {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          color: #0F172A;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: all 0.18s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          font-family: inherit;
          box-sizing: border-box;
        }

        textarea.modern-form-input {
          height: auto;
          min-height: 80px;
          padding: 12px 14px;
        }

        .modern-form-input:focus {
          border-color: #0284C7;
          box-shadow: 0 0 0 3.5px rgba(2, 132, 199, 0.14);
          background: #FAFCFF;
        }

        .modern-form-input::placeholder {
          color: #94A3B8;
          font-weight: 400;
        }

        .modern-form-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 16px 16px;
          padding-right: 40px !important;
          cursor: pointer;
        }

        .modern-triage-card {
          padding: 13px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.2s ease;
          outline: none;
          user-select: none;
          box-sizing: border-box;
        }

        @media (max-width: 480px) {
          .modern-triage-card {
            padding: 10px 12px;
            gap: 8px;
          }
        }

        .modern-triage-card.active-routine {
          background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
          border: 2px solid #0284C7;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.15);
        }

        .modern-triage-card.active-routine .triage-title {
          color: #0369A1;
          font-weight: 800;
          font-size: 13.5px;
          letter-spacing: -0.2px;
        }

        .modern-triage-card.active-routine .triage-subtitle {
          color: #0284C7;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.4;
        }

        .modern-triage-card.active-emergency {
          background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
          border: 2px solid #EF4444;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.18);
        }

        .modern-triage-card.active-emergency .triage-title {
          color: #DC2626;
          font-weight: 800;
          font-size: 13.5px;
          letter-spacing: -0.2px;
        }

        .modern-triage-card.active-emergency .triage-subtitle {
          color: #B91C1C;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.4;
        }

        .modern-triage-card.inactive-triage {
          background: #FFFFFF;
          border: 1.5px solid #CBD5E1;
        }

        .modern-triage-card.inactive-triage .triage-title {
          color: #0F172A;
          font-weight: 700;
          font-size: 13.5px;
          letter-spacing: -0.2px;
        }

        .modern-triage-card.inactive-triage .triage-subtitle {
          color: #64748B;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.4;
        }

        .modern-triage-card.inactive-triage:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .modern-submit-btn {
          width: 100%;
          height: 48px;
          padding: 0 20px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 8px 20px -4px rgba(2, 132, 199, 0.4);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          box-sizing: border-box;
          font-size: 14.5px;
          font-weight: 700;
          letter-spacing: -0.1px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: inherit;
        }

        .modern-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #0369A1 0%, #0284C7 100%);
          box-shadow: 0 12px 28px -4px rgba(2, 132, 199, 0.5);
          transform: translateY(-1.5px);
        }

        .modern-submit-btn:active:not(:disabled) {
          transform: translateY(0px);
        }

        .patient-rx-header-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 580px) {
          .patient-rx-header-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* 1. HERO SECTION (100% Live Real-Time Telemetry) */}
      <HeroBanner
        language={language}
        hospitalName={currentHospitalDisplayName}
        branding={hospitalBranding}
        onOpenHospitalModal={() => setShowHospitalModal(true)}
        stats={{
          patientsServed: analytics ? `${(analytics.total_completed || 0) + (analytics.currently_serving || 0)}` : "0",
          avgWaitTime: language === "hi"
            ? `${analytics ? Math.round(analytics.avg_wait_minutes || 0) : 0} मिनट`
            : `${analytics ? Math.round(analytics.avg_wait_minutes || 0) : 0} min`,
          activeDesks: language === "hi"
            ? `${analytics ? analytics.active_counters || 0 : 0} डेस्क`
            : `${analytics ? analytics.active_counters || 0 : 0} Active Desks`,
          currentlyWaiting: language === "hi"
            ? `${analytics ? analytics.currently_waiting || 0 : queueSnapshot.length || 0} प्रतीक्षारत`
            : `${analytics ? analytics.currently_waiting || 0 : queueSnapshot.length || 0} Waiting`,
        }}
      />

      {/* 2. Unified Patient Service Navigation Hub */}
      <section className="patient-nav-section">
        <div className="patient-nav-header">
          <div className="patient-nav-title">
            <div className="patient-nav-title-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
              </svg>
            </div>
            <span>
              {language === "hi" ? "अस्पताल मरीज़ सेवाएँ एवं कतार डेस्क" : "Hospital Patient Services & Queue Desk"}
            </span>
          </div>

          <div className="patient-nav-actions">
            <button
              type="button"
              onClick={() => setShowHospitalModal(true)}
              className="hospital-switcher-btn"
              title={language === "hi" ? "अस्पताल बदलें" : "Switch Hospital Facility"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9h1" />
                <path d="M9 13h1" />
                <path d="M9 17h1" />
              </svg>
              <span style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentHospitalDisplayName}
              </span>
              <span className="hospital-switcher-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 3 4 4-4 4" />
                  <path d="M20 7H4" />
                  <path d="m8 21-4-4 4-4" />
                  <path d="M4 17h16" />
                </svg>
                {language === "hi" ? "बदलें" : "Change"}
              </span>
            </button>

            <div className="patient-nav-status-badge">
              <span className="status-dot-pulse" />
              <span>{language === "hi" ? "एआई स्मार्ट डिस्पैच सक्रिय" : "AI Orchestration Active"}</span>
            </div>
          </div>
        </div>

        <div className="patient-tabs-bar">
          {/* Tab 1: Instant Walk-In Ticket */}
          <button
            type="button"
            id="patient-tab-walkin"
            onClick={() => handleTabChange("walkin")}
            className={`tab-button-modern ${activeTab === "walkin" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                <polygon points="12 8 13.2 11.4 16.8 11.4 13.9 13.5 15 16.9 12 14.8 9 16.9 10.1 13.5 7.2 11.4 10.8 11.4 12 8" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="tab-title-text">
                {t("instantWalkin", language)}
              </span>
              <span className="tab-sub-text" style={{ color: activeTab === "walkin" ? "#BAE6FD" : "#64748B" }}>
                {t("getTokenNow", language)}
              </span>
            </div>
          </button>

          {/* Tab 2: Book Time Slot */}
          <button
            type="button"
            id="patient-tab-book"
            onClick={() => handleTabChange("book")}
            className={`tab-button-modern ${activeTab === "book" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2.5" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="tab-title-text">
                {t("bookSlot", language)}
              </span>
              <span className="tab-sub-text" style={{ color: activeTab === "book" ? "#BAE6FD" : "#64748B" }}>
                {t("scheduleVisit", language)}
              </span>
            </div>
          </button>

          {/* Tab 3: My Appointments */}
          <button
            type="button"
            id="patient-tab-my-apts"
            onClick={() => handleTabChange("my_apts")}
            className={`tab-button-modern ${activeTab === "my_apts" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {t("myAppointments", language)}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "my_apts" ? "#38BDF8" : "#0284C7",
                    color: activeTab === "my_apts" ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  {activeAppointments.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "my_apts" ? "#BAE6FD" : "#64748B" }}>
                {t("viewAndManage", language)}
              </span>
            </div>
          </button>

          {/* Tab 4: Appointment History */}
          <button
            type="button"
            id="patient-tab-history"
            onClick={() => handleTabChange("history")}
            className={`tab-button-modern ${activeTab === "history" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {t("appointmentHistory", language)}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "history" ? "#38BDF8" : "#0284C7",
                    color: activeTab === "history" ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  {historyAppointments.length + historyTickets.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "history" ? "#BAE6FD" : "#64748B" }}>
                {t("pastRecords", language)}
              </span>
            </div>
          </button>

          {/* Tab 5: Family Profiles */}
          <button
            type="button"
            id="patient-tab-family"
            onClick={() => handleTabChange("family")}
            className={`tab-button-modern ${activeTab === "family" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {language === "hi" ? "परिवार" : "Family"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "family" ? "#38BDF8" : "#0284C7",
                    color: activeTab === "family" ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  {familyMembers.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "family" ? "#BAE6FD" : "#64748B" }}>
                {language === "hi" ? "सदस्य प्रबंधित करें" : "Manage Profiles"}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Main Content Area: Responsive Full-Page Layout */}
      {activeTab === "walkin" || activeTab === "book" ? (
        /* 2-COLUMN DASHBOARD FOR FAST CHECK-IN & BOOKING */
        <div className="patient-portal-dashboard">
          {/* Left Column: Form & Active Pass */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Quick Profile & Family Dependent Selector */}
            <FamilyMemberSwitcher
              members={familyMembers}
              selectedMemberId={selectedMemberId}
              onSelectMember={handleSelectMember}
              onAddMember={handleAddMember}
              onDeleteMember={handleDeleteMember}
              language={language}
              familyTickets={familyTickets}
            />

            <div style={standaloneCardStyle}>
              {activeTab === "walkin" && (
                <div>
                  {/* Form Header with Walk-In Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                      <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "var(--patient-text-main, #0F172A)", fontWeight: 800, letterSpacing: "-0.4px" }}>
                        {t("instantWalkin", language)}
                      </h2>
                      <p style={{ margin: 0, color: "var(--patient-text-sub, #64748B)", fontSize: "13.5px", fontWeight: 500, lineHeight: 1.55 }}>
                        {hospitalBranding?.hospital_name || hospitalBranding?.name || HOSPITAL_CONFIG.name} — {language === "hi" ? "तत्काल टोकन एवं प्रतीक्षा ट्रैकर" : "Instant Token & Real-Time Wait Tracker"}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: "var(--patient-tag-bg, #F0F9FF)",
                        color: "var(--patient-tag-color, #0284C7)",
                        border: "1px solid var(--patient-tag-border, #BAE6FD)",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      Walk-In
                    </span>
                  </div>


                  {/* Dependent Booking Notice Banner */}
                  {selectedMember && selectedMember.relation !== "self" && (
                    <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "#1E40AF", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span>{t("bookingFor", language)} <strong>{selectedMember.name}</strong> ({t(`relation_${selectedMember.relation}`, language)}, {selectedMember.age} {t("unit_yrs", language)})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectMember(familyMembers[0])}
                        style={{ background: "none", border: "none", color: "#2563EB", fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                      >
                        {language === "hi" ? "स्वयं पर स्विच करें" : "Switch to Self"}
                      </button>
                    </div>
                  )}

                  {/* Operating Hours & Cutoff Status Banner */}
                  {registrationStatus.isClosed ? (
                    <div
                      style={{
                        marginBottom: "18px",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "#FFFBEB",
                        border: "1.5px solid #FDE68A",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706", flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: "#B45309", fontSize: "13.5px" }}>
                          {language === "hi" ? "दैनिक ओपीडी पंजीकरण बंद है" : "OPD Registration Currently Closed"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#92400E", marginTop: "2px", lineHeight: 1.4 }}>
                          {hospitalBranding?.closed_notice ||
                            (language === "hi"
                              ? "आज के लिए ओपीडी पंजीकरण बंद है। आपातकालीन (Emergency) मरीज 24/7 कभी भी रजिस्टर कर सकते हैं।"
                              : "Registrations are closed for today. Emergency triage registrations remain active 24/7.")}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#B45309", marginTop: "5px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          <span>{registrationStatus.reason}</span>
                        </div>
                      </div>
                    </div>
                  ) : hospitalBranding?.registration_cutoff_time ? (
                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "#F0F9FF",
                        border: "1px solid #BAE6FD",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#0369A1",
                        fontWeight: 700,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <span>
                        {language === "hi"
                          ? `ओपीडी पंजीकरण खुला है • दैनिक कटऑफ: ${hospitalBranding.registration_cutoff_time} तक`
                          : `OPD Registration Open • Daily Cutoff: ${hospitalBranding.registration_cutoff_time}`}
                      </span>
                    </div>
                  ) : null}

                  <form onSubmit={handleJoinQueue}>
                    {/* Row 1: Patient Full Name & Patient Age & Gender */}
                    <div className="form-grid-2col">
                      <div>
                        <label className="form-field-label">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {t("patientNameLabel", language)}
                        </label>
                        <input
                          type="text"
                          placeholder="user"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="modern-form-input"
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label className="form-field-label">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {t("ageLabel", language)}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="modern-form-input"
                          />
                        </div>
                        <div>
                          <label className="form-field-label">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                            {t("genderLabel", language)}
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="modern-form-input modern-form-select"
                          >
                            <option value="male">{t("male", language)}</option>
                            <option value="female">{t("female", language)}</option>
                            <option value="other">{t("other", language)}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Service Department & Primary Medical Concern */}
                    <div className="form-grid-2col">
                      <div>
                        <label className="form-field-label">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                            <path d="M9 22v-4h6v4" />
                          </svg>
                          {t("serviceDeptLabel", language)}
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="modern-form-input modern-form-select"
                        >
                          {availableDepartments.map((c) => (
                            <option key={c.id} value={c.id}>
                              {getDeptDisplayName(c.id)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-field-label">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                          </svg>
                          {t("symptomLabel", language)}
                        </label>
                        <select
                          value={medicalCondition}
                          onChange={(e) => {
                            setMedicalCondition(e.target.value);
                            if (e.target.value !== "other_custom") {
                              setCustomSymptom("");
                            }
                          }}
                          className="modern-form-input modern-form-select"
                        >
                          {SYMPTOM_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {language === "hi" ? opt.labelHi : opt.label}
                            </option>
                          ))}
                        </select>

                        {/* Custom Symptom Input if user selects Other */}
                        {medicalCondition === "other_custom" && (
                          <div style={{ marginTop: "10px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 700, color: "#0284C7", display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                              <span>{t("customSymptomLabel", language)}</span>
                            </label>
                            <input
                              type="text"
                              value={customSymptom}
                              onChange={(e) => setCustomSymptom(e.target.value)}
                              placeholder={t("customSymptomPlaceholder", language)}
                              required
                              className="modern-form-input"
                              style={{
                                borderColor: "#0284C7",
                                background: "var(--patient-tag-bg, #F0F9FF)",
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Pre-Existing Condition Risk */}
                    <div style={{ marginBottom: "16px" }}>
                      <label className="form-field-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        {t("preExistingLabel", language)}
                      </label>
                      <select
                        value={preExistingCondition}
                        onChange={(e) => setPreExistingCondition(e.target.value)}
                        className="modern-form-input modern-form-select"
                      >
                        {RISK_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {language === "hi" ? opt.labelHi : opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Row 4: Priority & Triage Level Selection */}
                    <div style={{ marginBottom: "24px" }}>
                      <label className="form-field-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {t("priorityTriageLabel", language)}
                      </label>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                        {/* Routine Case Option */}
                        <button
                          type="button"
                          onClick={() => setPriority(2)}
                          className={`modern-triage-card ${priority === 2 ? "active-routine" : "inactive-triage"}`}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: priority === 2 ? "#0284C7" : "var(--patient-sub-card, #F1F5F9)",
                              color: priority === 2 ? "#FFFFFF" : "var(--patient-text-sub, #64748B)",
                              border: priority === 2 ? "none" : "1px solid var(--patient-card-border, #CBD5E1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.18s ease",
                            }}
                          >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={priority === 2 ? "3" : "2"} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <div>
                            <div className="triage-title">
                              {t("routineCase", language)}
                            </div>
                            <div className="triage-subtitle" style={{ marginTop: "2px" }}>
                              {t("standardOrder", language)}
                            </div>
                          </div>
                        </button>

                        {/* Emergency Case Option */}
                        <button
                          type="button"
                          onClick={() => setPriority(1)}
                          className={`modern-triage-card ${priority === 1 ? "active-emergency" : "inactive-triage"}`}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: priority === 1 ? "#EF4444" : "var(--patient-sub-card, #F1F5F9)",
                              color: priority === 1 ? "#FFFFFF" : "var(--patient-text-sub, #64748B)",
                              border: priority === 1 ? "none" : "1px solid var(--patient-card-border, #CBD5E1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.18s ease",
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={priority === 1 ? "2.5" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          </div>
                          <div>
                            <div className="triage-title">
                              {t("emergencyCase", language)}
                            </div>
                            <div className="triage-subtitle" style={{ marginTop: "2px" }}>
                              {t("priorityJump", language)}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Submit Primary Button: Only active when OPD is open OR for Emergency triage cases */}
                    {registrationStatus.isClosed && Number(priority) !== 1 ? (
                      <div
                        style={{
                          width: "100%",
                          padding: "16px 20px",
                          borderRadius: "14px",
                          background: "#FEF2F2",
                          border: "1.5px solid #FCA5A5",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                          boxSizing: "border-box",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#DC2626", fontWeight: 800, fontSize: "14px" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>{language === "hi" ? "ओपीडी पंजीकरण वर्तमान में बंद है" : "OPD Queue Registration Closed"}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#991B1B", fontWeight: 500, lineHeight: 1.4 }}>
                          {registrationStatus.reason || (language === "hi"
                            ? "ओपीडी समय समाप्त हो चुका है। केवल आपातकालीन (Emergency) मरीज ही पंजीकरण कर सकते हैं।"
                            : "Queue registration only works when the OPD is open. For critical emergencies, switch to Emergency Case above.")}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="modern-submit-btn"
                        style={Number(priority) === 1 ? { background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)", boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)" } : {}}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                            <polygon points="12 8 13.2 11.4 16.8 11.4 13.9 13.5 15 16.9 12 14.8 9 16.9 10.1 13.5 7.2 11.4 10.8 11.4 12 8" fill="rgba(255,255,255,0.2)" />
                          </svg>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "14.5px", fontWeight: 800, letterSpacing: "-0.2px", color: "#FFFFFF", lineHeight: 1.2 }}>
                              {Number(priority) === 1
                                ? (language === "hi" ? "आपातकालीन टोकन प्राप्त करें" : "Get Emergency Token")
                                : t("getTicketBtn", language)}
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: 500, color: Number(priority) === 1 ? "#FECACA" : "#BAE6FD", marginTop: "2px" }}>
                              {Number(priority) === 1 ? "Immediate Triage & Critical Care" : "Generate Token & Join Queue"}
                            </div>
                          </div>
                        </div>
                      </button>
                    )}
                  </form>
                </div>
              )}

              {activeTab === "book" && (
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "var(--patient-text-main, #0F172A)", fontWeight: 800, letterSpacing: "-0.4px" }}>
                      {t("bookSlot", language)}
                    </h2>
                    <p style={{ margin: 0, color: "var(--patient-text-sub, #64748B)", fontSize: "13.5px", fontWeight: 500, lineHeight: 1.55 }}>
                      {hospitalBranding?.hospital_name || hospitalBranding?.name || HOSPITAL_CONFIG.name} — {language === "hi" ? "भविष्य का समय स्लॉट रिज़र्व करें" : "Reserve a future appointment slot. Scan code upon arrival to merge into priority queue line."}
                    </p>
                  </div>


                  {/* Dependent Booking Notice Banner */}
                  {selectedMember && selectedMember.relation !== "self" && (
                    <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "#1E40AF", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span>{t("bookingFor", language)} <strong>{selectedMember.name}</strong> ({t(`relation_${selectedMember.relation}`, language)}, {selectedMember.age} {t("unit_yrs", language)})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectMember(familyMembers[0])}
                        style={{ background: "none", border: "none", color: "#2563EB", fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                      >
                        {language === "hi" ? "स्वयं पर स्विच करें" : "Switch to Self"}
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleBookSlot}>
                    <div style={{ marginBottom: "16px" }}>
                      <label className="form-field-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Patient Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Verma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="modern-form-input"
                      />
                    </div>

                    <div className="form-grid-2col">
                      <div>
                        <label className="form-field-label">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                            <path d="M9 22v-4h6v4" />
                          </svg>
                          Department
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="modern-form-input modern-form-select"
                        >
                          {availableDepartments.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label || getDeptDisplayName(c.id)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-field-label">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Appointment Date
                        </label>
                        <input
                          type="date"
                          value={aptDate}
                          min={bookingDateBounds.min}
                          max={bookingDateBounds.max}
                          onChange={(e) => setAptDate(e.target.value)}
                          required
                          className="modern-form-input"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label className="form-field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          Select Available Time Slot <span style={{ color: "#EF4444", fontSize: "11px" }}>*</span>
                        </span>
                        {aptTimeSlot ? (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7", background: "#E0F2FE", padding: "2px 8px", borderRadius: "12px" }}>
                            Selected: {aptTimeSlot}
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#D97706", background: "#FEF3C7", padding: "2px 8px", borderRadius: "12px" }}>
                            {language === "hi" ? "स्लॉट चुनें (अनिवार्य)" : "Choose a slot manually"}
                          </span>
                        )}
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
                        {timeSlotOptions.map((slot) => {
                          const past = isSlotPast(slot);
                          const selected = aptTimeSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={past}
                              onClick={() => !past && setAptTimeSlot(slot)}
                              title={past ? "This time slot has already passed" : `Select ${slot}`}
                              style={{
                                padding: "10px 4px",
                                borderRadius: "8px",
                                border: selected ? "2px solid #0284C7" : past ? "1px dashed #CBD5E1" : "1px solid var(--patient-card-border, #CBD5E1)",
                                background: selected ? "var(--patient-tag-bg, #F0F9FF)" : past ? "#F1F5F9" : "var(--patient-sub-card, #F8FAFC)",
                                color: selected ? "#0284C7" : past ? "#CBD5E1" : "var(--patient-text-sub, #475569)",
                                fontWeight: 700,
                                fontSize: "11.5px",
                                cursor: past ? "not-allowed" : "pointer",
                                transition: "all 0.15s ease",
                                opacity: past ? 0.45 : 1,
                                textDecoration: past ? "line-through" : "none",
                                position: "relative",
                                boxShadow: selected ? "0 0 0 2px rgba(2,132,199,0.2)" : "none",
                              }}
                            >
                              {slot}
                              {past && (
                                <span style={{
                                  position: "absolute", top: "-6px", right: "-4px",
                                  fontSize: "8px", background: "#94A3B8", color: "#fff",
                                  borderRadius: "4px", padding: "1px 3px", fontWeight: 800,
                                  lineHeight: 1.2, letterSpacing: "0.3px",
                                }}>PAST</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {!aptTimeSlot && (
                        <p style={{ margin: "8px 0 0 0", fontSize: "11.5px", color: "#64748B", fontStyle: "italic" }}>
                          {language === "hi"
                            ? "कृपया ऊपर दिए गए उपलब्ध समय स्लॉट्स में से अपनी पसंद का स्लॉट चुनें।"
                            : "Click any available time slot above to select your preferred appointment slot."}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!aptTimeSlot}
                      className="modern-submit-btn"
                      style={!aptTimeSlot ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                      title={!aptTimeSlot ? (language === "hi" ? "कृपया पहले एक समय स्लॉट चुनें" : "Please select a time slot first") : ""}
                    >
                      {t("bookSlotBtn", language)}
                    </button>
                  </form>

                  {bookedAppointment && (() => {
                    const aptStatus = bookedAppointment.status || "scheduled";
                    const isCancelled = aptStatus === "cancelled";
                    const isCheckedIn = aptStatus === "checked_in" || aptStatus === "completed";
                    return (
                      <div style={{
                        ...aptConfirmationBoxStyle,
                        ...(isCancelled ? { borderColor: "#FECACA", background: "#FFF1F2" } : {}),
                        ...(isCheckedIn ? { borderColor: "#BBF7D0", background: "#F0FFF4" } : {}),
                      }}>
                        <span style={{ fontSize: "11px", color: isCancelled ? "#DC2626" : isCheckedIn ? "#16A34A" : "#0284C7", fontWeight: 700, textTransform: "uppercase" }}>
                          {isCancelled
                            ? (language === "hi" ? "❌ अपॉइंटमेंट रद्द" : "❌ Appointment Cancelled")
                            : isCheckedIn
                            ? (language === "hi" ? "✅ चेक-इन हो गया" : "✅ Checked In")
                            : t("appointmentConfirmed", language)}
                        </span>
                        <h3 style={{ margin: "4px 0", color: isCancelled ? "#B91C1C" : isCheckedIn ? "#15803D" : "#0369A1", fontSize: "22px", fontWeight: 900 }}>
                          {language === "hi" ? "कोड:" : "Code:"} {bookedAppointment.appointment_id}
                        </h3>
                        <p style={{ margin: 0, color: "#475569", fontSize: "13px" }}>
                          {bookedAppointment.patient_name} • <strong>{getDeptDisplayName(bookedAppointment)}</strong> • <strong>{bookedAppointment.appointment_date} @ {bookedAppointment.time_slot}</strong>
                        </p>

                        {!isCancelled && !isCheckedIn && (
                          <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                            {registrationStatus.isClosed ? (
                              <div
                                style={{
                                  padding: "9px 14px",
                                  borderRadius: "10px",
                                  background: "#FEF2F2",
                                  border: "1.5px solid #FCA5A5",
                                  color: "#DC2626",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                                title={registrationStatus.reason || "OPD is closed"}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                <span>
                                  {language === "hi"
                                    ? "ओपीडी बंद है — लाइव चेक-इन केवल ओपीडी समय में काम करता है"
                                    : "OPD Closed — Check In & Join Live Line only works when OPD is open"}
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAppointmentCheckIn(bookedAppointment.appointment_id)}
                                style={checkInNowBtnStyle}
                              >
                                {t("checkInJoinLiveNow", language)}
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelAppointment(bookedAppointment.appointment_id, bookedAppointment.ticket_id || null)}
                              style={{
                                padding: "10px 18px",
                                borderRadius: "10px",
                                border: "1.5px solid #FECACA",
                                background: "#FFF1F2",
                                color: "#DC2626",
                                fontWeight: 700,
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {language === "hi" ? "रद्द करें" : "Cancel Appointment"}
                            </button>
                          </div>
                        )}

                        {isCancelled && (
                          <p style={{ marginTop: "10px", fontSize: "12px", color: "#DC2626", fontWeight: 600 }}>
                            {language === "hi" ? "यह अपॉइंटमेंट रद्द कर दिया गया है।" : "This appointment has been cancelled."}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {statusMsg && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: statusMsg.toLowerCase().includes("error") || statusMsg.toLowerCase().includes("failed") ? "#FEF2F2" : "#F0F9FF",
                    border: statusMsg.toLowerCase().includes("error") || statusMsg.toLowerCase().includes("failed") ? "1px solid #FECACA" : "1px solid #BAE6FD",
                    color: statusMsg.toLowerCase().includes("error") || statusMsg.toLowerCase().includes("failed") ? "#DC2626" : "#0284C7",
                    fontSize: "13px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {statusMsg}
                </div>
              )}
            </div>

            {/* Digital Ticket Pass (only if live: waiting, serving, on_hold) */}
            {isLiveTicket && (
              <DigitalTicketPassCard
                activeTicket={activeTicket}
                setActiveTicket={setActiveTicket}
                familyTickets={familyTickets}
                onSwitchTicketPass={handleSwitchTicketPass}
                onTakeTicketForMember={(targetMember) => {
                  if (targetMember) {
                    handleSelectMember(targetMember);
                  } else {
                    setShowAddMemberModal(true);
                  }
                }}
                members={familyMembers}
                ticketQrData={ticketQrData}
                language={language}
                onOpenPrescriptionSlip={handleOpenPrescriptionSlip}
                parsePrescription={parsePrescription}
                onPrint={() =>
                  printTokenPass(
                    activeTicket,
                    ticketQrData?.qr_code_base64 || ticketQrData?.qr_base64,
                    language,
                    hospitalBranding
                  )
                }
                onOpenAdjustModal={() => {
                  setAdjustError("");
                  setAdjustSuccessMsg("");
                  setSelectedSkipCount(1);
                  setShowAdjustModal(true);
                }}
                onOpenCancelModal={() => {
                  setCancelError("");
                  setShowCancelModal(true);
                }}
              />
            )}
          </div>

          {/* Right Column: Live Telemetry Sidebar */}
          <QueueTelemetrySidebar
            analytics={analytics}
            servingTickets={servingTickets}
            queueSnapshot={queueSnapshot}
            kioskQrData={kioskQrData}
            handleTabChange={handleTabChange}
            activeTicket={activeTicket}
            language={language}
            branding={hospitalBranding}
          />
        </div>
      ) : activeTab === "my_apts" ? (
        /* MY APPOINTMENTS FULL VIEW */
        <div style={standaloneCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "var(--patient-text-main, #0F172A)", fontWeight: 800, letterSpacing: "-0.4px" }}>
                {t("myActiveAppointments", language)}
              </h3>
              <span style={{ fontSize: "13px", color: "var(--patient-text-sub, #64748B)", fontWeight: 500, lineHeight: 1.55 }}>
                {t("activeAptsSubtitle", language)}
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="text"
                placeholder={t("enterCodePlaceholder", language)}
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--patient-card-border, #CBD5E1)", background: "var(--patient-card-bg, #FFFFFF)", color: "var(--patient-text-main, #0F172A)", fontSize: "12px", width: "180px" }}
              />
              <button
                onClick={() => handleAppointmentCheckIn(checkInCode)}
                disabled={registrationStatus.isClosed}
                style={{
                  ...quickCheckInBtnStyle,
                  ...(registrationStatus.isClosed ? { opacity: 0.55, cursor: "not-allowed", background: "#94A3B8" } : {}),
                }}
                title={registrationStatus.isClosed ? (registrationStatus.reason || "Check-in only works when OPD is open") : ""}
              >
                {t("checkInBtn", language)}
              </button>
            </div>
          </div>

          {/* Name lookup for guests / unmatched users */}
          <div style={{ marginBottom: "18px", padding: "14px 16px", background: "var(--patient-tag-bg, #F0F9FF)", borderRadius: "12px", border: "1px solid var(--patient-tag-border, #BAE6FD)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0284C7", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span>Look up by name:</span>
            </span>
            <div style={{ flex: 1, minWidth: "180px", position: "relative", display: "flex", alignItems: "center" }}>
              <input
                id="apt-search-name"
                type="text"
                value={aptSearchName}
                onChange={(e) => setAptSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setAptSearchLoading(true);
                    fetchUserAppointments(aptSearchName.trim());
                    setTimeout(() => setAptSearchLoading(false), 800);
                  }
                }}
                placeholder="Enter patient name or appointment/ticket ID (e.g. Kartik)"
                style={{ width: "100%", padding: "8px 32px 8px 12px", borderRadius: "8px", border: "1px solid var(--patient-card-border, #BAE6FD)", background: "var(--patient-card-bg, #FFFFFF)", color: "var(--patient-text-main, #0F172A)", fontSize: "13px", outline: "none" }}
              />
              {aptSearchName && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{ position: "absolute", right: "8px", background: "none", border: "none", color: "var(--patient-text-sub, #94A3B8)", cursor: "pointer", fontSize: "14px", fontWeight: "bold", padding: "2px" }}
                  title="Clear search"
                >✕</button>
              )}
            </div>
            <button
              id="apt-search-btn"
              type="button"
              onClick={() => {
                setAptSearchLoading(true);
                fetchUserAppointments(aptSearchName.trim());
                setTimeout(() => setAptSearchLoading(false), 800);
              }}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#0284C7", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {aptSearchLoading ? "Searching..." : "Search"}
            </button>
            {aptSearchName.trim() && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--patient-card-border, #CBD5E1)", background: "var(--patient-card-bg, #FFFFFF)", color: "var(--patient-text-main, #64748B)", fontWeight: 600, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Active Search Result Pill */}
          {aptSearchName.trim() && (
            <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: "var(--patient-sub-card, #F0FDF4)", border: "1px solid #BBF7D0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", color: "#166534" }}>
              <span>
                Found <strong>{displayedActiveAppointments.length}</strong> active appointment{displayedActiveAppointments.length === 1 ? "" : "s"} for "<strong>{aptSearchName.trim()}</strong>"
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                style={{ background: "none", border: "none", color: "#166534", fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}
              >
                Clear filter
              </button>
            </div>
          )}

          {displayedActiveAppointments.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", background: "var(--patient-sub-card, #F8FAFC)", borderRadius: "16px", border: "1px solid var(--patient-card-border, #E2E8F0)", color: "var(--patient-text-sub, #94A3B8)" }}>
              <p style={{ margin: "0 0 6px 0", color: "var(--patient-text-main, #64748B)", fontWeight: 600, fontSize: "14px" }}>
                {aptSearchName.trim()
                  ? `No active appointments found matching "${aptSearchName.trim()}"`
                  : t("noActiveAptsMsg", language)}
              </p>
              <p style={{ margin: "0 0 14px 0", color: "var(--patient-text-sub, #94A3B8)", fontSize: "12px" }}>
                {aptSearchName.trim()
                  ? "Check spelling, try searching by appointment ID or person's first name."
                  : "Search by your name above or reserve a new slot below."}
              </p>
              {aptSearchName.trim() ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#0284C7", color: "#FFFFFF", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTabChange("book")}
                  style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "#0284C7", color: "#FFFFFF", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  Reserve Time Slot Now
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {displayedActiveAppointments.map((apt) => (
                <div key={apt.appointment_id} style={aptCardRowStyle(apt.status)}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "16px", fontWeight: 900, color: "#0284C7" }}>{apt.appointment_id}</span>
                      <span style={aptStatusBadgeStyle(apt.status)}>{apt.status.toUpperCase()}</span>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#0369A1",
                        background: "var(--patient-tag-bg, #F0F9FF)",
                        border: "1px solid var(--patient-tag-border, #BAE6FD)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="12" y1="7" x2="12" y2="11"/></svg>
                        <span>{getHospitalNameForRecord(apt)}</span>
                      </span>
                      {(apt.doctor_name || apt.served_by_doctor_name) && (
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#1E40AF",
                          background: "var(--patient-tag-bg, #EFF6FF)",
                          border: "1px solid var(--patient-tag-border, #BFDBFE)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                          <span>{apt.doctor_name || apt.served_by_doctor_name}</span>
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "6px 0 0 0", color: "var(--patient-text-main, #0F172A)", fontWeight: 700, fontSize: "15px" }}>
                      {apt.patient_name} — {getDeptDisplayName(apt)}
                    </p>
                    <span style={{ fontSize: "12.5px", color: "var(--patient-text-sub, #64748B)", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="12" y1="7" x2="12" y2="11"/></svg>
                        <strong>{getHospitalNameForRecord(apt)}</strong>
                      </span>
                      <span>•</span>
                      <span>Date: <strong>{apt.appointment_date}</strong></span>
                      <span>•</span>
                      <span>Slot: <strong>{apt.time_slot}</strong></span>
                      <span>•</span>
                      <span style={{ color: "#0284C7", fontWeight: 700 }}>
                        Dept: {getDeptDisplayName(apt)}
                      </span>
                      {(apt.doctor_name || apt.served_by_doctor_name) && (
                        <>
                          <span>•</span>
                          <span style={{ color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                            <span>{language === "hi" ? "चिकित्सक" : "Doctor"}: {apt.doctor_name || apt.served_by_doctor_name}</span>
                          </span>
                        </>
                      )}
                    </span>

                    {/* Digital Rx Slip preview if notes present or completed */}
                    {(() => {
                      const effectiveRxNotes = apt.prescription_notes || (apt.ticket_id && userTicketHistory.find((t) => t.ticket_id === apt.ticket_id)?.prescription_notes) || "";
                      if (!effectiveRxNotes && (apt.status || "").toLowerCase() !== "completed") return null;
                      const rx = parsePrescription(effectiveRxNotes, apt);
                      if (!rx) return null;
                      return (
                        <div style={{
                          marginTop: "10px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: "var(--patient-tag-bg, #F0F9FF)",
                          border: "1.5px solid var(--patient-tag-border, #BAE6FD)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0284C7" }}>
                              {language === "hi" ? "दवा पर्ची संलग्न" : "E-Prescription Available"}
                            </span>
                            {rx.doctor_name && (
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#0369A1" }}>
                                • {rx.doctor_name}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenPrescriptionSlip(effectiveRxNotes, apt)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "7px",
                              border: "1.5px solid #0284C7",
                              background: "var(--patient-card-bg, #FFFFFF)",
                              color: "#0284C7",
                              fontSize: "11.5px",
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            <span>{language === "hi" ? "दवा पर्ची देखें" : "View Rx Slip"}</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    {apt.status === "scheduled" ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {registrationStatus.isClosed ? (
                          <span
                            title={registrationStatus.reason || "Check-in only works when OPD is open"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: "#FEF2F2",
                              border: "1px solid #FECACA",
                              color: "#DC2626",
                              fontSize: "11px",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {language === "hi" ? "ओपीडी बंद है" : "OPD Closed"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAppointmentCheckIn(apt.appointment_id)}
                            style={checkInNowBtnStyle}
                          >
                            {t("checkInJoinLine", language)}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(apt.appointment_id, apt.ticket_id)}
                          style={{
                            padding: "7px 12px",
                            borderRadius: "8px",
                            border: "1px solid #FECACA",
                            background: "#FEF2F2",
                            color: "#DC2626",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {language === "hi" ? "रद्द करें" : "Cancel"}
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                        <div>
                          <span style={{ fontSize: "13px", color: "#0284C7", fontWeight: 800, display: "block" }}>
                            {t("mergedToken", language)} #{apt.ticket_id}
                          </span>
                          <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>
                            {t("activeInLiveQueue", language)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(apt.appointment_id, apt.ticket_id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid #FECACA",
                            background: "#FEF2F2",
                            color: "#DC2626",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {language === "hi" ? "टोकन रद्द करें" : "Cancel Token"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "history" ? (
        /* VISIT HISTORY FULL VIEW */
        <div style={standaloneCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "var(--patient-text-main, #0F172A)", fontWeight: 800, letterSpacing: "-0.4px" }}>
                {language === "hi" ? "मेरा मेडिकल इतिहास एवं पूर्व पर्चियां" : "My Medical History & Past Consultations"}
              </h3>
              <span style={{ fontSize: "13px", color: "var(--patient-text-sub, #64748B)", fontWeight: 500, lineHeight: 1.55 }}>
                {language === "hi" ? "आपकी सभी पुरानी ओपीडी विज़िट्स, डिजिटल दवा पर्चियां और नैदानिक जांच रिपोर्ट।" : "Chronological archive of all your past clinical visits, e-prescriptions, and laboratory reports."}
              </span>
            </div>
          </div>

          {/* Master Patient Medical History Timeline */}
          <div style={{ marginBottom: "20px" }}>
            <PatientHistoryTimeline
              patient={myMedicalPatient}
              summary={myMedicalSummary}
              visits={myMedicalVisits}
              prescriptions={myMedicalPrescriptions}
              reports={myMedicalReports}
              isReturningPatient={isMyReturningPatient}
              totalVisits={myMedicalTotalVisits}
              loading={myMedicalHistoryLoading}
              language={language}
              collapsible={false}
              defaultExpanded={true}
            />
          </div>

          {/* Name lookup for guests / unmatched users */}
          <div style={{ marginBottom: "18px", padding: "14px 16px", background: "var(--patient-tag-bg, #F0F9FF)", borderRadius: "12px", border: "1px solid var(--patient-tag-border, #BAE6FD)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0284C7", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span>Look up by name:</span>
            </span>
            <div style={{ flex: 1, minWidth: "180px", position: "relative", display: "flex", alignItems: "center" }}>
              <input
                id="history-search-name"
                type="text"
                value={aptSearchName}
                onChange={(e) => setAptSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setAptSearchLoading(true);
                    fetchUserAppointments(aptSearchName.trim());
                    fetchUserTicketHistory(aptSearchName.trim());
                    setTimeout(() => setAptSearchLoading(false), 800);
                  }
                }}
                placeholder="Enter patient name or ticket/apt ID (e.g. Kartik)"
                style={{ width: "100%", padding: "8px 32px 8px 12px", borderRadius: "8px", border: "1px solid var(--patient-card-border, #BAE6FD)", background: "var(--patient-card-bg, #FFFFFF)", color: "var(--patient-text-main, #0F172A)", fontSize: "13px", outline: "none" }}
              />
              {aptSearchName && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{ position: "absolute", right: "8px", background: "none", border: "none", color: "var(--patient-text-sub, #94A3B8)", cursor: "pointer", fontSize: "14px", fontWeight: "bold", padding: "2px" }}
                  title="Clear search"
                >✕</button>
              )}
            </div>
            <button
              id="history-search-btn"
              type="button"
              onClick={() => {
                setAptSearchLoading(true);
                fetchUserAppointments(aptSearchName.trim());
                fetchUserTicketHistory(aptSearchName.trim());
                setTimeout(() => setAptSearchLoading(false), 800);
              }}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#0284C7", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {aptSearchLoading ? "Searching..." : "Search"}
            </button>
            {aptSearchName.trim() && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--patient-card-border, #CBD5E1)", background: "var(--patient-card-bg, #FFFFFF)", color: "var(--patient-text-main, #64748B)", fontWeight: 600, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Active Search Result Pill */}
          {aptSearchName.trim() && (
            <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: "var(--patient-sub-card, #F0FDF4)", border: "1px solid #BBF7D0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", color: "#166534" }}>
              <span>
                Found <strong>{displayedHistoryAppointments.length + displayedHistoryTickets.length}</strong> record{displayedHistoryAppointments.length + displayedHistoryTickets.length === 1 ? "" : "s"} for "<strong>{aptSearchName.trim()}</strong>"
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                style={{ background: "none", border: "none", color: "#166534", fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}
              >
                Clear filter
              </button>
            </div>
          )}

          {displayedHistoryAppointments.length === 0 && displayedHistoryTickets.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", background: "var(--patient-sub-card, #F8FAFC)", borderRadius: "16px", border: "1px solid var(--patient-card-border, #E2E8F0)", color: "var(--patient-text-sub, #94A3B8)", fontSize: "13.5px" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 700, color: "var(--patient-text-main, #0F172A)" }}>
                {aptSearchName.trim()
                  ? `No visits found matching "${aptSearchName.trim()}"`
                  : t("noHistoryMsg", language)}
              </p>
              <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--patient-text-sub, #94A3B8)" }}>
                {aptSearchName.trim()
                  ? "Check spelling, try searching by ticket ID or person's first name."
                  : "Search by your name above to find past visits."}
              </p>
              {aptSearchName.trim() && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#0284C7", color: "#FFFFFF", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Walk-in Tickets Section */}
              {displayedHistoryTickets.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/></svg>
                      <span>Walk-in Queue Tickets ({displayedHistoryTickets.length})</span>
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "var(--patient-tag-border, #BAE6FD)" }} />
                  </div>
                  {displayedHistoryTickets.map((tk) => (
                    <div key={tk.ticket_id} style={aptCardRowStyle(tk.status)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: 900, color: "#0284C7" }}>#{tk.ticket_id}</span>
                          <span style={aptStatusBadgeStyle(tk.status)}>{getStatusLabel(tk.status || "completed", language)}</span>
                          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", fontWeight: 600, padding: "2px 7px", background: "var(--patient-sub-card, #F1F5F9)", borderRadius: "5px", border: "1px solid var(--patient-card-border, #E2E8F0)" }}>
                            Walk-in
                          </span>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#0369A1",
                            background: "var(--patient-tag-bg, #F0F9FF)",
                            border: "1px solid var(--patient-tag-border, #BAE6FD)",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="12" y1="7" x2="12" y2="11"/></svg>
                            <span>{getHospitalNameForRecord(tk)}</span>
                          </span>
                          {(tk.doctor_name || tk.served_by_doctor_name) && (
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#1E40AF",
                              background: "var(--patient-tag-bg, #EFF6FF)",
                              border: "1px solid var(--patient-tag-border, #BFDBFE)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                              <span>{tk.doctor_name || tk.served_by_doctor_name}</span>
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "4px 0 0 0", color: "var(--patient-text-main, #0F172A)", fontWeight: 700, fontSize: "14.5px" }}>
                          {tk.name} — {getCategoryLabel(tk.service_category || "consultation", language)}
                        </p>
                        <span style={{ fontSize: "12px", color: "var(--patient-text-sub, #64748B)", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="12" y1="7" x2="12" y2="11"/></svg>
                            <strong>{getHospitalNameForRecord(tk)}</strong>
                          </span>
                          <span>•</span>
                          <span>{tk.created_at ? new Date(tk.created_at).toLocaleDateString() : ""}</span>
                          {tk.department_name && (
                            <>
                              <span>•</span>
                              <span>Dept: {tk.department_name}</span>
                            </>
                          )}
                          {(tk.doctor_name || tk.served_by_doctor_name) && (
                            <>
                              <span>•</span>
                              <span style={{ color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                                <span>{language === "hi" ? "चिकित्सक" : "Doctor"}: {tk.doctor_name || tk.served_by_doctor_name}</span>
                              </span>
                            </>
                          )}
                        </span>
                        {tk.cancellation_reason && (
                          <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "#DC2626", fontStyle: "italic" }}>
                            Reason: {tk.cancellation_reason}
                          </p>
                        )}
                        {/* Digital Rx Slip section if notes present or visit completed */}
                        {(() => {
                          const canShowRx = tk.prescription_notes || (tk.status || "").toLowerCase() === "completed";
                          if (!canShowRx) return null;
                          const rx = parsePrescription(tk.prescription_notes, tk);
                          if (!rx) return null;
                          return (
                            <div style={{
                              marginTop: "12px",
                              padding: "14px 16px",
                              borderRadius: "14px",
                              background: "var(--patient-tag-bg, #F0F9FF)",
                              border: "1.5px solid var(--patient-tag-border, #BAE6FD)",
                              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.06)",
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", borderBottom: "1px solid var(--patient-card-border, #E0F2FE)", paddingBottom: "10px", marginBottom: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "12px", fontWeight: 900, color: "#0284C7", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                                    <span>{t("ePrescriptionLabel", language)}</span>
                                  </span>
                                  {rx.doctor_name && (
                                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "var(--patient-tag-bg, #E0F2FE)", color: "#0369A1", border: "1px solid var(--patient-tag-border, #BAE6FD)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                                      <span>{rx.doctor_name} {rx.doctor_department ? `(${getCategoryLabel(rx.doctor_department, language)})` : ""}</span>
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrescriptionSlip(tk.prescription_notes, tk)}
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: "8px",
                                    border: "1.5px solid #0284C7",
                                    background: "var(--patient-card-bg, #FFFFFF)",
                                    color: "#0284C7",
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    boxShadow: "0 1px 3px rgba(2, 132, 199, 0.12)",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                  <span>{language === "hi" ? "दवा पर्ची देखें (Rx)" : "View Rx Slip"}</span>
                                </button>
                              </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {rx.diagnosis && (
                                      <div style={{ fontSize: "13px", color: "#0369A1" }}>
                                        <strong style={{ color: "var(--patient-text-main, #0F172A)" }}>{language === "hi" ? "निदान" : "Diagnosis"}:</strong>{" "}
                                        <span style={{ fontWeight: 800, color: "#0284C7", background: "var(--patient-tag-bg, #E0F2FE)", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--patient-tag-border, #BAE6FD)" }}>
                                          {rx.diagnosis}
                                        </span>
                                      </div>
                                    )}

                                    {rx.medicines && rx.medicines.length > 0 && (
                                      <div style={{ marginTop: "4px" }}>
                                        <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#0369A1", textTransform: "uppercase" }}>
                                          {language === "hi" ? "निर्धारित दवाइयाँ" : "Prescribed Medicines"}:
                                        </span>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                                          {rx.medicines.map((m, mIdx) => (
                                            <span
                                              key={mIdx}
                                              style={{
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                color: "#0369A1",
                                                background: "var(--patient-card-bg, #FFFFFF)",
                                                border: "1px solid var(--patient-tag-border, #BAE6FD)",
                                                padding: "3px 9px",
                                                borderRadius: "6px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "5px",
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                                              }}
                                            >
                                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                                              <strong>{m.name}</strong>
                                              {m.dosage ? ` • ${m.dosage}` : ""}
                                              {m.frequency ? ` (${m.frequency})` : ""}
                                              {m.duration ? ` [${m.duration}]` : ""}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {rx.advice && (
                                      <div style={{ fontSize: "12px", color: "#0369A1", marginTop: "4px", fontStyle: "italic" }}>
                                        <strong>{language === "hi" ? "सलाह" : "Advice"}:</strong> "{rx.advice}"
                                      </div>
                                    )}

                                    {rx.lab_tests && rx.lab_tests !== "no" && (
                                      <div style={{ fontSize: "12px", color: "#0369A1", marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>
                                        <span><strong>{language === "hi" ? "जाँच" : "Tests"}:</strong> {rx.lab_tests}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                        </div>
                        <div style={{ textAlign: "right", marginLeft: "14px" }}>
                        <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>{t("finalVisitStatus", language)}</span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: tk.status === "completed" ? "#0284C7" : "#DC2626" }}>
                          {getStatusLabel(tk.status || "completed", language)}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Appointment History Section */}
              {displayedHistoryAppointments.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: displayedHistoryTickets.length > 0 ? "10px" : "0", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>Pre-Scheduled Appointments ({displayedHistoryAppointments.length})</span>
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "var(--patient-tag-border, #BAE6FD)" }} />
                  </div>
                  {displayedHistoryAppointments.map((apt) => (
                    <div key={apt.appointment_id} style={aptCardRowStyle(apt.status)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: 900, color: "#0284C7" }}>{apt.appointment_id}</span>
                          <span style={aptStatusBadgeStyle(apt.status)}>{getStatusLabel(apt.status || "COMPLETED", language)}</span>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "var(--patient-tag-color, #0369A1)",
                            background: "var(--patient-tag-bg, #F0F9FF)",
                            border: "1px solid var(--patient-tag-border, #BAE6FD)",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="12" y1="7" x2="12" y2="11"/></svg>
                            <span>{getHospitalNameForRecord(apt)}</span>
                          </span>
                          {apt.ticket_id && (
                            <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>
                              ({t("tokenLabel", language)} #{apt.ticket_id})
                            </span>
                          )}
                          {(apt.doctor_name || apt.served_by_doctor_name) && (
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#1E40AF",
                              background: "var(--patient-tag-bg, #EFF6FF)",
                              border: "1px solid var(--patient-tag-border, #BFDBFE)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                              <span>{apt.doctor_name || apt.served_by_doctor_name}</span>
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "4px 0 0 0", color: "var(--patient-text-main, #0F172A)", fontWeight: 700, fontSize: "14.5px" }}>
                          {apt.patient_name} — {getDeptDisplayName(apt)}
                        </p>
                        <span style={{ fontSize: "12px", color: "var(--patient-text-sub, #64748B)", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="12" y1="7" x2="12" y2="11"/></svg>
                            <strong>{getHospitalNameForRecord(apt)}</strong>
                          </span>
                          <span>•</span>
                          <span>{t("dateLabel", language)}: {apt.appointment_date}</span>
                          <span>•</span>
                          <span>{t("reservedSlotLabel", language)}: {apt.time_slot}</span>
                          <span>•</span>
                          <span style={{ color: "#0284C7", fontWeight: 700 }}>
                            Dept: {getDeptDisplayName(apt)}
                          </span>
                          {(apt.doctor_name || apt.served_by_doctor_name) && (
                            <>
                              <span>•</span>
                              <span style={{ color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                                <span>{language === "hi" ? "चिकित्सक" : "Doctor"}: {apt.doctor_name || apt.served_by_doctor_name}</span>
                              </span>
                            </>
                          )}
                        </span>

                        {/* Digital Rx Slip section if notes present or appointment completed */}
                        {(() => {
                          const effectiveRxNotes = apt.prescription_notes || (apt.ticket_id && Array.isArray(userTicketHistory) && userTicketHistory.find((t) => String(t.ticket_id) === String(apt.ticket_id))?.prescription_notes) || "";
                          const canShowRx = effectiveRxNotes || (apt.status || "").toLowerCase() === "completed";
                          if (!canShowRx) return null;
                          const rx = parsePrescription(effectiveRxNotes, apt);
                          if (!rx) return null;
                          return (
                            <div style={{
                              marginTop: "12px",
                              padding: "14px 16px",
                              borderRadius: "14px",
                              background: "var(--patient-tag-bg, #F0F9FF)",
                              border: "1.5px solid var(--patient-tag-border, #BAE6FD)",
                              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.06)",
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", borderBottom: "1px solid var(--patient-card-border, #E0F2FE)", paddingBottom: "10px", marginBottom: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "12px", fontWeight: 900, color: "#0284C7", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                                    <span>{t("ePrescriptionLabel", language)}</span>
                                  </span>
                                  {rx.doctor_name && (
                                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "var(--patient-tag-bg, #E0F2FE)", color: "var(--patient-tag-color, #0369A1)", border: "1px solid var(--patient-tag-border, #BAE6FD)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                                      <span>{rx.doctor_name} {rx.doctor_department ? `(${getCategoryLabel(rx.doctor_department, language)})` : ""}</span>
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrescriptionSlip(effectiveRxNotes, apt)}
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: "8px",
                                    border: "1.5px solid #0284C7",
                                    background: "var(--patient-card-bg, #FFFFFF)",
                                    color: "#0284C7",
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    boxShadow: "0 1px 3px rgba(2, 132, 199, 0.12)",
                                    transition: "all 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--patient-tag-bg, #E0F2FE)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--patient-card-bg, #FFFFFF)"; }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                  <span>{language === "hi" ? "दवा पर्ची देखें (Rx)" : "View Rx Slip"}</span>
                                </button>
                              </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {rx.diagnosis && (
                                      <div style={{ fontSize: "13px", color: "var(--patient-tag-color, #0369A1)" }}>
                                        <strong style={{ color: "var(--patient-text-main, #0F172A)" }}>{language === "hi" ? "निदान" : "Diagnosis"}:</strong>{" "}
                                        <span style={{ fontWeight: 800, color: "#0284C7", background: "var(--patient-tag-bg, #E0F2FE)", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--patient-tag-border, #BAE6FD)" }}>
                                          {rx.diagnosis}
                                        </span>
                                      </div>
                                    )}

                                    {rx.medicines && rx.medicines.length > 0 && (
                                      <div style={{ marginTop: "4px" }}>
                                        <span style={{ fontSize: "11.5px", fontWeight: 800, color: "var(--patient-tag-color, #0369A1)", textTransform: "uppercase" }}>
                                          {language === "hi" ? "निर्धारित दवाइयाँ" : "Prescribed Medicines"}:
                                        </span>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                                          {rx.medicines.map((m, mIdx) => (
                                            <span
                                              key={mIdx}
                                              style={{
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                color: "var(--patient-tag-color, #0369A1)",
                                                background: "var(--patient-card-bg, #FFFFFF)",
                                                border: "1px solid var(--patient-tag-border, #BAE6FD)",
                                                padding: "3px 9px",
                                                borderRadius: "6px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "5px",
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                                              }}
                                            >
                                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                                              <strong>{m.name}</strong>
                                              {m.dosage ? ` • ${m.dosage}` : ""}
                                              {m.frequency ? ` (${m.frequency})` : ""}
                                              {m.duration ? ` [${m.duration}]` : ""}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {rx.advice && (
                                      <div style={{ fontSize: "12px", color: "var(--patient-tag-color, #0369A1)", marginTop: "4px", fontStyle: "italic" }}>
                                        <strong>{language === "hi" ? "सलाह" : "Advice"}:</strong> "{rx.advice}"
                                      </div>
                                    )}

                                    {rx.lab_tests && rx.lab_tests !== "no" && (
                                      <div style={{ fontSize: "12px", color: "var(--patient-tag-color, #0369A1)", marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>
                                        <span><strong>{language === "hi" ? "जाँच" : "Tests"}:</strong> {rx.lab_tests}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                        </div>

                      <div style={{ textAlign: "right", marginLeft: "14px" }}>
                        <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>
                          {t("finalVisitStatus", language)}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#0284C7" }}>
                          {getStatusLabel(apt.status || "completed", language)}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

            </div>
          )}
        </div>
      ) : activeTab === "family" ? (
        /* FAMILY PROFILES MANAGEMENT FULL VIEW */
        <div style={standaloneCardStyle}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid var(--patient-card-border, #E2E8F0)", paddingBottom: "18px" }}>
            <div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "22px", color: "var(--patient-text-main, #0F172A)", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--patient-tag-bg, #E0F2FE)", color: "#0284C7", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <span>{language === "hi" ? "परिवार सदस्य एवं आश्रित प्रोफ़ाइल" : "Family Member & Dependent Profiles"}</span>
              </h3>
              <span style={{ fontSize: "13px", color: "var(--patient-text-sub, #64748B)" }}>
                {language === "hi"
                  ? "एक-क्लिक टोकन एवं क्लिनिक अपॉइंटमेंट के लिए अपने बच्चों, जीवनसाथी या बुजुर्ग माता-पिता को जोड़ें।"
                  : "Easily register children, spouse, or elderly parents for one-tap queue tickets and scheduled clinic visits."}
              </span>
            </div>
            <button
              type="button"
              id="add-family-member-btn"
              onClick={() => setShowAddMemberModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "13.5px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span>
              <span>{language === "hi" ? "नया सदस्य जोड़ें" : "Add Family Member"}</span>
            </button>
          </div>

          {/* Member Switcher Quick Selector */}
          <div style={{ marginBottom: "24px" }}>
            <FamilyMemberSwitcher
              members={familyMembers}
              selectedMemberId={selectedMemberId}
              onSelectMember={handleSelectMember}
              onAddMember={handleAddMember}
              onDeleteMember={handleDeleteMember}
              language={language}
            />
          </div>

          {/* Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" }}>
            {familyMembers.map((member) => {
              const isSelected = selectedMemberId === member.id;
              const isSelf = member.id === "self";
              const relationLabel = isSelf
                ? (language === "hi" ? "प्राथमिक (स्वयं)" : "Primary (Self)")
                : getRelationLabel(member.relation, language);
              const memberTicket = familyTickets[member.id];

              return (
                <div
                  key={member.id}
                  style={{
                    background: isSelected ? "var(--patient-tag-bg, #F0F9FF)" : "var(--patient-card-bg, #FFFFFF)",
                    borderRadius: "16px",
                    border: isSelected ? "2px solid #0284C7" : "1px solid var(--patient-card-border, #E2E8F0)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                    boxShadow: isSelected ? "0 4px 14px rgba(2, 132, 199, 0.12)" : "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div>
                    {/* Top Row: Icon + Name + Badge */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                            background: isSelected ? "#0284C7" : "var(--patient-sub-card, #F1F5F9)",
                            color: isSelected ? "#FFFFFF" : "var(--patient-tag-color, #0369A1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            fontWeight: 800,
                          }}
                        >
                          {isSelf ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          ) : member.relation === "child" ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><path d="M10 15c.5.5 1.2.8 2 .8s1.5-.3 2-.8"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/></svg>
                          ) : member.relation === "parent" ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M9 11h6"/></svg>
                          ) : member.relation === "spouse" ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                          ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--patient-text-main, #0F172A)" }}>
                            {member.name}
                          </div>
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "3px",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: isSelf ? "var(--patient-tag-bg, #E0F2FE)" : "var(--patient-tag-bg, #F0F9FF)",
                              color: isSelf ? "var(--patient-tag-color, #0369A1)" : "#0284C7",
                              border: "1px solid var(--patient-tag-border, #BAE6FD)",
                            }}
                          >
                            {relationLabel}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "#0284C7",
                            color: "#FFFFFF",
                            fontSize: "10.5px",
                            fontWeight: 800,
                            letterSpacing: "0.3px",
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Member Details */}
                    <div style={{ fontSize: "12.5px", color: "var(--patient-text-sub, #64748B)", display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                      <div>
                        <strong>{language === "hi" ? "उम्र" : "Age"}:</strong> {member.age || "—"} {language === "hi" ? "वर्ष" : "yrs"}
                        {" • "}
                        <strong>{language === "hi" ? "लिंग" : "Gender"}:</strong> {member.gender ? member.gender.toUpperCase() : "—"}
                      </div>
                      {member.phone && (
                        <div>
                          <strong>{language === "hi" ? "फ़ोन" : "Phone"}:</strong> {member.phone}
                        </div>
                      )}
                      {memberTicket && (
                        <div style={{ marginTop: "6px", padding: "6px 10px", borderRadius: "8px", background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", fontSize: "11.5px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/></svg>
                          <span>Active Token #{memberTicket.ticket_id} (Pos #{memberTicket.position})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid var(--patient-card-border, #E2E8F0)" }}>
                    {!isSelected ? (
                      <button
                        type="button"
                        onClick={() => handleSelectMember(member)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--patient-tag-border, #BAE6FD)",
                          background: "var(--patient-tag-bg, #E0F2FE)",
                          color: "#0284C7",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {language === "hi" ? "प्रोफ़ाइल चुनें" : "Select Profile"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTabChange("walkin")}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "none",
                          background: "#0284C7",
                          color: "#FFFFFF",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {language === "hi" ? "टोकन लें" : "Get Token"}
                      </button>
                    )}

                    {!isSelf && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingMember(member)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid var(--patient-card-border, #CBD5E1)",
                            background: "var(--patient-card-bg, #FFFFFF)",
                            color: "var(--patient-text-main, #475569)",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title={language === "hi" ? "संपादित करें" : "Edit Profile"}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t("deleteMemberConfirm", language))) {
                              handleDeleteMember(member.id);
                            }
                          }}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #FECACA",
                            background: "#FEF2F2",
                            color: "#DC2626",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title={language === "hi" ? "हटाएं" : "Delete Profile"}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Add Family Member Modal */}
      {showAddMemberModal && (
        <AddFamilyMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onAddMember={(newMem) => {
            handleAddMember(newMem);
            setShowAddMemberModal(false);
          }}
          language={language}
        />
      )}




      {/* Edit Family Member Modal */}
      {editingMember && (
        <EditFamilyMemberModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          onSaveMember={handleEditMember}
          member={editingMember}
          language={language}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && activeTicket && (
        <div style={modalBackdropStyle}>
          <div className="patient-modal-box" style={modalContentStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--emergency-card-bg, #FEF2F2)", color: "var(--emergency-card-text, #DC2626)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "var(--patient-text-main, #0F172A)", fontWeight: 800 }}>
                  Cancel Ticket?
                </h3>
                <span style={{ fontSize: "12px", color: "var(--patient-text-sub, #64748B)" }}>
                  Ticket #{activeTicket.ticket_id}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: "var(--patient-text-sub, #475569)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Are you sure you want to cancel ticket <strong>#{activeTicket.ticket_id}</strong>? This will remove you from the active queue.
            </p>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "var(--patient-text-main, #334155)", marginBottom: "6px" }}>
                Reason (optional):
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--patient-card-border, #CBD5E1)", background: "var(--patient-card-bg, #FFFFFF)", color: "var(--patient-text-main, #0F172A)", fontSize: "13px", marginBottom: cancelReason === "Other" ? "8px" : "0" }}
              >
                <option value="Running late">Running late</option>
                <option value="Feeling better / no longer needed">Feeling better / no longer needed</option>
                <option value="Emergency elsewhere">Emergency elsewhere</option>
                <option value="Wait time too long">Wait time too long</option>
                <option value="Other">Other reason...</option>
              </select>

              {cancelReason === "Other" && (
                <input
                  type="text"
                  placeholder="Please specify reason..."
                  value={otherCancelReason}
                  onChange={(e) => setOtherCancelReason(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--patient-card-border, #CBD5E1)", background: "var(--patient-card-bg, #FFFFFF)", color: "var(--patient-text-main, #0F172A)", fontSize: "13px", boxSizing: "border-box" }}
                />
              )}
            </div>

            {cancelError && (
              <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--emergency-card-bg, #FEF2F2)", border: "1px solid var(--emergency-card-border, #FECACA)", color: "var(--emergency-card-text, #DC2626)", fontSize: "12.5px", marginBottom: "16px", fontWeight: 600 }}>
                {cancelError}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                className="patient-secondary-btn"
                style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #CBD5E1)", background: "var(--patient-sub-card, #F8FAFC)", color: "var(--patient-text-main, #334155)", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                Keep Ticket
              </button>
              <button
                id="confirm-cancel-btn"
                type="button"
                onClick={handleCancelTicket}
                disabled={cancelLoading}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#DC2626", color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: cancelLoading ? "not-allowed" : "pointer" }}
              >
                {cancelLoading ? "Cancelling..." : "Cancel Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Queue Modal */}
      {showAdjustModal && activeTicket && (
        <div style={modalBackdropStyle}>
          <div className="patient-modal-box" style={modalContentStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--patient-tag-bg, #F0F9FF)", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                ⏱️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "var(--patient-text-main, #0F172A)", fontWeight: 800 }}>
                  Running late?
                </h3>
                <span style={{ fontSize: "12px", color: "var(--patient-text-sub, #64748B)" }}>
                  Move your position back in the queue.
                </span>
              </div>
            </div>

            <div style={{ background: "var(--patient-sub-card, #F8FAFC)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #E2E8F0)", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12.5px", color: "var(--patient-text-sub, #64748B)" }}>Ticket:</span>
                <strong style={{ fontSize: "13px", color: "var(--patient-text-main, #0F172A)" }}>#{activeTicket.ticket_id}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--patient-text-sub, #64748B)" }}>Current Position:</span>
                <strong style={{ fontSize: "15px", color: "#0284C7" }}>#{activeTicket.position}</strong>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "var(--patient-text-main, #334155)", marginBottom: "8px" }}>
                Move back:
              </label>
              {(() => {
                const rem = Math.max(0, 3 - (activeTicket.adjustment_count || 0));
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {[1, 2, 3].map((num) => {
                      const isDisabled = num > rem;
                      const isSelected = selectedSkipCount === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedSkipCount(num)}
                          style={{
                            padding: "12px 6px",
                            borderRadius: "10px",
                            border: isSelected ? "2px solid #0284C7" : "1px solid var(--patient-card-border, #CBD5E1)",
                            background: isSelected ? "var(--patient-tag-bg, #F0F9FF)" : isDisabled ? "var(--patient-sub-card, #F1F5F9)" : "var(--patient-card-bg, #FFFFFF)",
                            color: isSelected ? "#0284C7" : isDisabled ? "#94A3B8" : "var(--patient-text-main, #0F172A)",
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: "12.5px",
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {num} {num === 1 ? "person" : "people"}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", fontSize: "12px", color: "var(--patient-text-sub, #64748B)", background: "var(--patient-sub-card, #F8FAFC)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--patient-card-border, #E2E8F0)" }}>
              <span>Remaining adjustment:</span>
              <strong style={{ color: "#0369A1", fontSize: "13px" }}>
                {Math.max(0, 3 - (activeTicket.adjustment_count || 0))} of 3
              </strong>
            </div>

            {adjustError && (
              <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--emergency-card-bg, #FEF2F2)", border: "1px solid var(--emergency-card-border, #FECACA)", color: "var(--emergency-card-text, #DC2626)", fontSize: "12.5px", marginBottom: "16px", fontWeight: 600 }}>
                {adjustError}
              </div>
            )}

            {adjustSuccessMsg && (
              <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--patient-tag-bg, #F0F9FF)", border: "1px solid var(--patient-tag-border, #BAE6FD)", color: "#0284C7", fontSize: "12.5px", marginBottom: "16px", fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>{adjustSuccessMsg}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                disabled={adjustLoading}
                className="patient-secondary-btn"
                style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #CBD5E1)", background: "var(--patient-sub-card, #F8FAFC)", color: "var(--patient-text-main, #334155)", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                id="confirm-adjust-btn"
                type="button"
                onClick={() => handleAdjustQueue(selectedSkipCount)}
                disabled={adjustLoading || (activeTicket.adjustment_count || 0) >= 3}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)", color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: adjustLoading ? "not-allowed" : "pointer" }}
              >
                {adjustLoading ? "Adjusting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Hospital Facility Switcher Modal (Patient Portal) */}
      {showHospitalModal && (
        <div
          style={modalBackdropStyle}
          onClick={() => setShowHospitalModal(false)}
        >
          <div
            className="patient-modal-box"
            style={{
              ...modalContentStyle,
              maxWidth: "560px",
              padding: "26px",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 10px rgba(2, 132, 199, 0.2)",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="12" y1="7" x2="12" y2="11"/></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
                    {language === "hi" ? "अस्पताल या स्वास्थ्य केंद्र बदलें" : "Switch Hospital Facility"}
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--patient-text-sub, #64748B)", marginTop: "2px" }}>
                    {language === "hi"
                      ? "किसी भी पंजीकृत अस्पताल की लाइव कतार व सेवाओं तक पहुँचें।"
                      : "Connect to any registered hospital across our unified network."}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHospitalModal(false)}
                style={{
                  background: "var(--patient-sub-card, #F1F5F9)",
                  border: "none",
                  borderRadius: "8px",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  color: "var(--patient-text-sub, #64748B)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Search Filter Input */}
            <div style={{ position: "relative", marginBottom: "14px" }}>
              <input
                type="text"
                value={hospitalSearchQuery}
                onChange={(e) => setHospitalSearchQuery(e.target.value)}
                placeholder={language === "hi" ? "अस्पताल का नाम, शहर या कोड खोजें..." : "Search by hospital name, address, or code..."}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: "12px",
                  border: "1.5px solid var(--patient-card-border, #E2E8F0)",
                  fontSize: "13px",
                  outline: "none",
                  background: "var(--patient-sub-card, #F8FAFC)",
                  color: "var(--patient-text-main, #0F172A)",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0284C7";
                  e.target.style.background = "var(--patient-card-bg, #FFFFFF)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--patient-card-border, #E2E8F0)";
                  e.target.style.background = "var(--patient-sub-card, #F8FAFC)";
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              {hospitalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setHospitalSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>

            {/* Hospitals List */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxHeight: "340px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {(() => {
                const currentCode = activeHospitalCode;
                const filtered = hospitalsList.filter((h) => {
                  if (!hospitalSearchQuery) return true;
                  const q = hospitalSearchQuery.toLowerCase();
                  return (
                    (h.name && h.name.toLowerCase().includes(q)) ||
                    (h.hospital_code && h.hospital_code.toLowerCase().includes(q)) ||
                    (h.address && h.address.toLowerCase().includes(q))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "30px 12px", color: "var(--patient-text-sub, #64748B)", fontSize: "13px" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "var(--patient-tag-bg, #F0F9FF)", color: "#0284C7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="12" y1="7" x2="12" y2="11"/></svg>
                      </div>
                      <div style={{ fontWeight: 600 }}>{language === "hi" ? "कोई अस्पताल नहीं मिला" : "No hospitals matching search"}</div>
                    </div>
                  );
                }

                return filtered.map((hosp) => {
                  const isCurrent = String(hosp.hospital_code) === String(currentCode);
                  return (
                    <div
                      key={hosp.hospital_code}
                      onClick={() => handleSelectHospital(hosp.hospital_code, hosp.name)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: isCurrent ? "2px solid #0284C7" : "1.5px solid var(--patient-card-border, #E2E8F0)",
                        background: isCurrent ? "var(--patient-tag-bg, #F0F9FF)" : "var(--patient-card-bg, #FFFFFF)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        transition: "all 0.16s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.borderColor = "#BAE6FD";
                          e.currentTarget.style.background = "var(--patient-sub-card, #F8FAFC)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.borderColor = "var(--patient-card-border, #E2E8F0)";
                          e.currentTarget.style.background = "var(--patient-card-bg, #FFFFFF)";
                        }
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--patient-text-main, #0F172A)" }}>
                            {hosp.name}
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                background: "#0284C7",
                                color: "#FFFFFF",
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                textTransform: "uppercase",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              <span>{language === "hi" ? "सक्रिय" : "Active"}</span>
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              color: "var(--patient-text-sub, #64748B)",
                              background: "var(--patient-sub-card, #F1F5F9)",
                              padding: "2px 7px",
                              borderRadius: "4px",
                            }}
                          >
                            {hosp.hospital_code}
                          </span>
                        </div>
                        {hosp.address && (
                          <div style={{ fontSize: "11.5px", color: "var(--patient-text-sub, #475569)", marginTop: "3px", display: "flex", alignItems: "center", gap: "5px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span>{hosp.address}</span>
                          </div>
                        )}
                        {hosp.phone && (
                          <div style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", marginTop: "1px", display: "flex", alignItems: "center", gap: "5px" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            <span>{hosp.phone}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHospital(hosp.hospital_code, hosp.name);
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          border: isCurrent ? "1px solid #0284C7" : "1px solid var(--patient-card-border, #CBD5E1)",
                          background: isCurrent ? "#0284C7" : "var(--patient-sub-card, #F8FAFC)",
                          color: isCurrent ? "#FFFFFF" : "var(--patient-text-main, #334155)",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isCurrent ? (language === "hi" ? "सक्रिय" : "Active") : (language === "hi" ? "चुनें" : "Select")}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Official Digital Prescription (Rx) Slip Modal */}
      {showPrescriptionModal && viewingPrescriptionData && (
        <div style={modalBackdropStyle} onClick={() => setShowPrescriptionModal(false)}>
          <div
            id="printable-rx-slip"
            className="patient-modal-box"
            style={{
              ...modalContentStyle,
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "26px 30px",
              background: "var(--patient-card-bg, #FFFFFF)",
              borderRadius: "16px",
              border: "1.5px solid var(--patient-card-border, #CBD5E1)",
              boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Hospital Letterhead */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0284C7", paddingBottom: "14px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: 900 }}>
                  ℞
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", color: "var(--patient-text-main, #0F172A)", fontWeight: 900, letterSpacing: "-0.3px" }}>
                    {viewingPrescriptionData?.hospital_name || getHospitalNameForRecord(viewingPrescriptionData) || currentHospitalDisplayName || "City General Hospital"}
                  </h2>
                  <span style={{ fontSize: "11.5px", color: "#0284C7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Outpatient Department (OPD) • Clinical E-Prescription Slip
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>Date & Time</span>
                <strong style={{ fontSize: "12px", color: "var(--patient-text-main, #0F172A)" }}>
                  {viewingPrescriptionData.prescribed_at ? new Date(viewingPrescriptionData.prescribed_at).toLocaleDateString() : new Date().toLocaleDateString()}
                </strong>
                <span style={{ fontSize: "10px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>
                  {viewingPrescriptionData.prescribed_at ? new Date(viewingPrescriptionData.prescribed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </div>
            </div>

            {/* 2. Patient & Doctor Information Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--patient-sub-card, #F8FAFC)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #E2E8F0)", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "10.5px", color: "var(--patient-text-sub, #64748B)", fontWeight: 700, textTransform: "uppercase" }}>Patient Details</span>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)", marginTop: "2px" }}>
                  {viewingPrescriptionData.patient_name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--patient-text-sub, #475569)" }}>
                  {viewingPrescriptionData.age} yrs • {viewingPrescriptionData.gender} • Token #{viewingPrescriptionData.ticket_id}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "10.5px", color: "var(--patient-text-sub, #64748B)", fontWeight: 700, textTransform: "uppercase" }}>Attending Physician</span>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0284C7", marginTop: "2px" }}>
                  {viewingPrescriptionData.doctor_name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--patient-text-sub, #475569)" }}>
                  Department: {getCategoryLabel(viewingPrescriptionData.doctor_department, language)}
                  {viewingPrescriptionData.doctor_employee_id && ` (ID: ${viewingPrescriptionData.doctor_employee_id})`}
                </div>
              </div>
            </div>

            {/* 3. Provisional Diagnosis & Tests */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
                  Clinical Diagnosis:
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0284C7", background: "var(--patient-tag-bg, #F0F9FF)", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--patient-tag-border, #BAE6FD)" }}>
                  {viewingPrescriptionData.diagnosis || "General Consultation & Clinical Checkup"}
                </span>
              </div>
              {viewingPrescriptionData.lab_tests && viewingPrescriptionData.lab_tests !== "no" && (
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
                    Tests Ordered:
                  </span>
                  <span style={{ fontSize: "12.5px", color: "var(--patient-text-sub, #475569)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>
                    <span>{viewingPrescriptionData.lab_tests}</span>
                  </span>
                </div>
              )}
            </div>

            {/* 4. Prescribed Medications Table */}
            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "var(--patient-text-main, #0F172A)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#0284C7", fontSize: "16px" }}>℞</span> Prescribed Medications
              </div>

              {viewingPrescriptionData.medicines && viewingPrescriptionData.medicines.length > 0 ? (
                <div style={{ overflowX: "auto", border: "1px solid var(--patient-card-border, #E2E8F0)", borderRadius: "8px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "var(--patient-sub-card, #F1F5F9)", borderBottom: "1.5px solid var(--patient-card-border, #CBD5E1)", color: "var(--patient-text-sub, #475569)", fontWeight: 800 }}>
                        <th style={{ padding: "8px 10px" }}>#</th>
                        <th style={{ padding: "8px 10px" }}>Medicine Name</th>
                        <th style={{ padding: "8px 10px" }}>Dosage</th>
                        <th style={{ padding: "8px 10px" }}>Frequency / Timing</th>
                        <th style={{ padding: "8px 10px" }}>Duration</th>
                        <th style={{ padding: "8px 10px" }}>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingPrescriptionData.medicines.map((med, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--patient-card-border, #F1F5F9)", background: idx % 2 === 0 ? "var(--patient-card-bg, #FFFFFF)" : "var(--patient-sub-card, #F8FAFC)" }}>
                          <td style={{ padding: "8px 10px", fontWeight: 700, color: "var(--patient-text-sub, #64748B)" }}>{idx + 1}</td>
                          <td style={{ padding: "8px 10px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>{med.name}</td>
                          <td style={{ padding: "8px 10px", color: "#0284C7", fontWeight: 700 }}>{med.dosage || "-"}</td>
                          <td style={{ padding: "8px 10px", fontWeight: 700, color: "#0284C7" }}>{med.frequency || "-"}</td>
                          <td style={{ padding: "8px 10px", color: "var(--patient-text-sub, #334155)" }}>{med.duration || "-"}</td>
                          <td style={{ padding: "8px 10px", color: "var(--patient-text-sub, #64748B)", fontStyle: "italic" }}>{med.instructions || "After food"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: "12px 14px", background: "var(--patient-sub-card, #F8FAFC)", borderRadius: "8px", border: "1px solid var(--patient-card-border, #E2E8F0)", fontSize: "13px", color: "var(--patient-text-main, #334155)", fontStyle: "italic" }}>
                  "{viewingPrescriptionData.advice || "No specific medications listed. Consultation completed."}"
                </div>
              )}
            </div>

            {/* 5. Doctor's Advice & Lifestyle Instructions */}
            {viewingPrescriptionData.advice && (
              <div style={{ marginBottom: "14px", padding: "10px 14px", background: "var(--patient-tag-bg, #F0F9FF)", borderRadius: "10px", border: "1px solid var(--patient-tag-border, #BAE6FD)" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#0369A1", display: "inline-flex", alignItems: "center", gap: "5px", marginBottom: "3px", textTransform: "uppercase" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                  <span>Doctor's Advice & Guidelines:</span>
                </span>
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--patient-text-main, #0F172A)" }}>
                  {viewingPrescriptionData.advice}
                </p>
              </div>
            )}

            {/* 6. Follow-up consultation */}
            {viewingPrescriptionData.follow_up && (
              <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--patient-text-sub, #475569)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <strong>Follow-Up:</strong>
                <span>{viewingPrescriptionData.follow_up}</span>
              </div>
            )}

            {/* 7. Electronic Validation Stamp */}
            <div style={{ borderTop: "1px dashed var(--patient-card-border, #CBD5E1)", paddingTop: "12px", marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Digitally Authenticated & Recorded in Hospital OPD System</span>
              </div>
              <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>
                Valid across hospital pharmacy & lab desks
              </span>
            </div>

            {/* 8. Action Buttons (Print & Close) */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowPrescriptionModal(false)}
                className="patient-secondary-btn"
                style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #CBD5E1)", background: "var(--patient-sub-card, #F8FAFC)", color: "var(--patient-text-main, #334155)", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => printPrescriptionSlip(viewingPrescriptionData, language, hospitalBranding)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 10px rgba(2, 132, 199, 0.25)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                <span>{language === "hi" ? "पर्ची प्रिंट करें / PDF सेव करें" : "Print Rx Slip / Save PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Footer (Matching Image 2) */}
      <Footer
        language={language}
        hospitalName={hospitalBranding?.hospital_name || hospitalBranding?.name || (currentUser?.hospital_code === tenantId ? currentUser?.hospital_name : null) || HOSPITAL_CONFIG.name}
        currentUser={currentUser}
      />
    </div>
  );
}

// Styling definitions
const standaloneCardStyle = {
  background: "var(--patient-card-bg, #FFFFFF)",
  borderRadius: "18px",
  border: "1px solid var(--patient-card-border, #E2E8F0)",
  padding: "clamp(14px, 3vw, 28px)",
  boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
  color: "var(--patient-text-main, #0F172A)",
  boxSizing: "border-box",
  width: "100%",
};

const fieldLabelWithIconStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12.5px",
  color: "var(--patient-text-sub, #334155)",
  marginBottom: "8px",
  fontWeight: 600,
};

const fieldInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid var(--patient-card-border, #E2E8F0)",
  background: "var(--patient-card-bg, #FFFFFF)",
  color: "var(--patient-text-main, #0F172A)",
  fontSize: "13.5px",
  outline: "none",
  transition: "border 0.2s ease, box-shadow 0.2s ease",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
  boxSizing: "border-box",
};

const patientSubmitBtnStyle = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#ffffff",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
  transition: "all 0.2s ease",
  minHeight: "48px",
  boxSizing: "border-box",
};

const aptConfirmationBoxStyle = {
  marginTop: "20px",
  padding: "18px",
  borderRadius: "14px",
  background: "#F0F9FF",
  border: "2px solid #0284C7",
  textAlign: "center",
  boxSizing: "border-box",
};

const checkInNowBtnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
  whiteSpace: "nowrap",
};

const quickCheckInBtnStyle = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#0284C7",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const aptCardRowStyle = (status) => {
  const s = (status || "").toLowerCase();
  const base = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "clamp(12px, 2.5vw, 16px)",
    borderRadius: "12px",
    flexWrap: "wrap",
    gap: "12px",
    boxSizing: "border-box",
    width: "100%",
  };
  if (s === "checked_in" || s === "serving") {
    return {
      ...base,
      background: "var(--apt-active-bg, #F0F9FF)",
      border: "1px solid var(--apt-active-border, #BAE6FD)",
      color: "var(--patient-text-main, #0F172A)",
    };
  }
  if (s === "completed" || s === "transferred") {
    return {
      ...base,
      background: "var(--patient-card-bg, #FFFFFF)",
      border: "1px solid var(--patient-card-border, #E2E8F0)",
      color: "var(--patient-text-main, #0F172A)",
    };
  }
  return {
    ...base,
    background: "var(--patient-sub-card, #F8FAFC)",
    border: "1px solid var(--patient-card-border, #CBD5E1)",
    color: "var(--patient-text-main, #0F172A)",
  };
};

const aptStatusBadgeStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "var(--patient-sub-card, #F1F5F9)", color: "var(--patient-text-sub, #475569)", border: "1px solid var(--patient-card-border, #CBD5E1)" };
  if (s === "transferred") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "var(--patient-tag-bg, #E0F2FE)", color: "var(--patient-tag-color, #0284C7)", border: "1px solid var(--patient-tag-border, #BAE6FD)" };
  if (s === "serving") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" };
  if (s === "checked_in") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "var(--patient-tag-bg, #F0F9FF)", color: "var(--patient-tag-color, #0284C7)", border: "1px solid var(--patient-tag-border, #BAE6FD)" };
  if (s === "cancelled" || s === "no_show" || s === "expired") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "var(--emergency-card-bg, #FEF2F2)", color: "var(--emergency-card-text, #DC2626)", border: "1px solid var(--emergency-card-border, #FECACA)" };
  return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#F3E8FF", color: "#7E22CE", border: "1px solid #E9D5FF" };
};

const passStatusBadgeStyle = (status) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  background: status === "serving" ? "var(--patient-tag-bg, #F0F9FF)" : "#FEF3C7",
  color: status === "serving" ? "var(--patient-tag-color, #0284C7)" : "#D97706",
  border: status === "serving" ? "1px solid var(--patient-tag-border, #BAE6FD)" : "1px solid #FDE68A",
});

const dashboardFooterStyle = {
  marginTop: "36px",
  paddingTop: "20px",
  borderTop: "1px solid #E2E8F0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
};

const footerLogoIconStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  background: "#0284C7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/**
 * QueueTelemetrySidebar
 * ---------------------
 * Real-time queue status sidebar on wide desktop screens.
 */
function QueueTelemetrySidebar({
  analytics,
  servingTickets = [],
  queueSnapshot = [],
  kioskQrData,
  handleTabChange,
  activeTicket,
  language = "en",
  branding = null,
}) {
  const primaryServing = servingTickets.length > 0 ? servingTickets[0] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. Live Queue Counter Pulse Card */}
      <div className="telemetry-sidebar-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0EA5E9", boxShadow: "0 0 8px #0EA5E9" }} />
            <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
              {language === "hi" ? "लाइव कतार मॉनिटर" : "Live Queue Monitor"}
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7", background: "var(--patient-tag-bg, #F0F9FF)", padding: "2px 8px", borderRadius: "6px" }}>
            {analytics ? `${analytics.active_counters} ${language === "hi" ? "डेस्क सक्रिय" : "Desks Active"}` : (language === "hi" ? "2 डेस्क सक्रिय" : "2 Desks Active")}
          </span>
        </div>

        {/* Now Serving Highlight */}
        <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 70%, #0C4A6E 100%)", borderRadius: "14px", padding: "16px", color: "#FFFFFF" }}>
          <div style={{ fontSize: "11px", color: "#38BDF8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {t("nowServing", language)}
          </div>
          {primaryServing ? (
            <div style={{ marginTop: "4px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#38BDF8", lineHeight: 1.1 }}>
                #{primaryServing.ticket_id}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>
                {primaryServing.name}
              </div>
              <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", marginTop: "2px" }}>
                {language === "hi" ? "विभाग:" : "Dept:"} {getCategoryLabel(primaryServing.service_category || "consultation", language)}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "6px", fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              {language === "hi" ? "अगले मरीज़ हेतु सभी डेस्क तैयार हैं" : "All desks ready for next patient"}
            </div>
          )}
        </div>

        {/* Live Wait Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div style={{ background: "var(--patient-sub-card, #F8FAFC)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #E2E8F0)" }}>
            <span style={{ fontSize: "10.5px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>
              {language === "hi" ? "औसत प्रतीक्षा" : "Est. Avg Wait"}
            </span>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "#0284C7" }}>
              {analytics ? analytics.avg_wait_minutes : 12} {language === "hi" ? "मिनट" : "min"}
            </span>
          </div>
          <div style={{ background: "var(--patient-sub-card, #F8FAFC)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #E2E8F0)" }}>
            <span style={{ fontSize: "10.5px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>
              {language === "hi" ? "कतार में" : "In Line"}
            </span>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
              {queueSnapshot.length} {language === "hi" ? "मरीज़" : "patients"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Next in Line Preview */}
      {queueSnapshot.length > 0 && (
        <div className="telemetry-sidebar-card" style={{ padding: "18px" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
            <span>{language === "hi" ? "कतार में अगले टोकन" : "Next Up in Queue"}</span>
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
            {queueSnapshot.slice(0, 3).map((item) => (
              <div key={item.ticket_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: "8px", background: "var(--patient-sub-card, #F8FAFC)", border: "1px solid var(--patient-card-border, #E2E8F0)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--patient-text-sub, #64748B)" }}>#{item.position}</span>
                  <div>
                    <strong style={{ fontSize: "12.5px", color: "var(--patient-text-main, #0F172A)" }}>#{item.ticket_id}</strong>
                    <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>{item.name}</span>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>
                  ~{item.estimated_wait_minutes}{language === "hi" ? "मि" : "m"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DigitalTicketPassCard
 * ---------------------
 * Printable digital pass card with QR code, patient triage tags, and queue position.
 */
function DigitalTicketPassCard({
  activeTicket,
  setActiveTicket,
  familyTickets = {},
  onSwitchTicketPass,
  onTakeTicketForMember,
  members = [],
  ticketQrData,
  language = "en",
  onPrint,
  onOpenAdjustModal,
  onOpenCancelModal,
  onOpenPrescriptionSlip,
  parsePrescription,
}) {
  return (
    <div style={{ ...standaloneCardStyle, border: "2px solid #0284C7" }}>
      {/* Active Family Pass Switcher */}
      {Object.keys(familyTickets).length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", background: "var(--patient-sub-card, #F1F5F9)", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #E2E8F0)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--patient-text-sub, #475569)" }}>{t("switchTicket", language)}:</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {Object.entries(familyTickets).map(([memId, tick]) => {
              const isCurrent = activeTicket.ticket_id === tick.ticket_id;
              return (
                <button
                  key={memId}
                  type="button"
                  onClick={() => onSwitchTicketPass ? onSwitchTicketPass(memId, tick) : setActiveTicket(tick)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: isCurrent ? "1.5px solid #0284C7" : "1px solid var(--patient-card-border, #CBD5E1)",
                    background: isCurrent ? "#0284C7" : "var(--patient-card-bg, #FFFFFF)",
                    color: isCurrent ? "#FFFFFF" : "var(--patient-text-main, #0F172A)",
                    fontSize: "11.5px",
                    fontWeight: isCurrent ? 800 : 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>{tick.name}</span>
                  <span style={{ opacity: 0.85 }}>(#{tick.ticket_id})</span>
                  {isCurrent && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--patient-card-border, #E0F2FE)", paddingBottom: "14px", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", textTransform: "uppercase", fontWeight: 600 }}>{t("livePassTitle", language)}</span>
            {activeTicket.name && (
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px", background: "var(--patient-tag-bg, #E0F2FE)", color: "var(--patient-tag-color, #0369A1)", border: "1px solid var(--patient-tag-border, #BAE6FD)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>{activeTicket.name}</span>
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: "32px", color: "#0284C7", fontWeight: 800 }}>
            #{activeTicket.ticket_id}
          </h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>{t("currentStatus", language)}</span>
          <span style={passStatusBadgeStyle(activeTicket.status)}>{getStatusLabel(activeTicket.status, language)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)" }}>{t("patientDemographics", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "var(--patient-text-main, #0F172A)", fontWeight: 700, fontSize: "15px", wordBreak: "break-word" }}>
            {activeTicket.name} ({activeTicket.age || 30} {language === "hi" ? "वर्ष" : "yrs"}, {t(activeTicket.gender || "male", language)})
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)" }}>{t("deptCategory", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#0284C7", fontWeight: 700, fontSize: "15px", wordBreak: "break-word" }}>
            {getCategoryLabel(activeTicket.service_category || "consultation", language)}
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)" }}>{t("pos", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#D97706", fontWeight: 800, fontSize: "24px" }}>
            #{activeTicket.position}
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)" }}>{t("estWait", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#0284C7", fontWeight: 800, fontSize: "24px" }}>
            {activeTicket.estimated_wait_minutes} {language === "hi" ? "मिनट" : "min"}
          </p>
        </div>
      </div>

      {/* Digital E-Prescription (Rx Slip) Section if available or completed */}
      {(activeTicket.prescription_notes || (activeTicket.status || "").toLowerCase() === "completed") && (() => {
        const rx = parsePrescription ? parsePrescription(activeTicket.prescription_notes, activeTicket) : null;
        return (
          <div style={{
            marginTop: "16px",
            marginBottom: "16px",
            padding: "16px 18px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(16, 185, 129, 0.08) 50%, rgba(2, 132, 199, 0.12) 100%)",
            border: "2px solid #059669",
            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.12)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid rgba(5, 150, 105, 0.3)", paddingBottom: "10px", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#059669",
                  color: "#FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 900,
                }}>
                  ℞
                </span>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 900, color: "#10B981", letterSpacing: "-0.2px" }}>
                    {language === "hi" ? "डिजिटल दवा पर्ची (ई-प्रिस्क्रिप्शन)" : "Digital E-Prescription (Rx Slip)"}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#34D399", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                    <span>{rx?.doctor_name ? rx.doctor_name : "Consultant Physician"} {rx?.doctor_department ? `• ${rx.doctor_department}` : ""}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="view-active-rx-slip-btn"
                onClick={() => onOpenPrescriptionSlip && onOpenPrescriptionSlip(activeTicket.prescription_notes, activeTicket)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#FFFFFF",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span>{language === "hi" ? "दवा पर्ची देखें (Rx)" : "View / Print Rx Slip"}</span>
              </button>
            </div>

            {rx?.diagnosis && (
              <div style={{ fontSize: "12.5px", color: "#10B981", marginBottom: "6px" }}>
                <strong style={{ color: "var(--patient-text-main, #0F172A)" }}>{language === "hi" ? "निदान" : "Diagnosis"}:</strong>{" "}
                <span style={{ fontWeight: 700, color: "#059669", background: "var(--patient-tag-bg, #D1FAE5)", padding: "2px 8px", borderRadius: "5px", border: "1px solid rgba(5, 150, 105, 0.3)" }}>
                  {rx.diagnosis}
                </span>
              </div>
            )}

            {rx?.medicines && rx.medicines.length > 0 && (
              <div style={{ marginTop: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#10B981", textTransform: "uppercase" }}>
                  {language === "hi" ? "दवाइयाँ" : "Prescribed Medicines"}:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  {rx.medicines.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "var(--patient-card-bg, #FFFFFF)",
                        border: "1px solid var(--patient-tag-border, #A7F3D0)",
                        color: "#059669",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                      <span>{m.name} {m.dosage ? `(${m.dosage})` : ""}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {rx?.advice && (
              <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--patient-text-main, #334155)", background: "var(--patient-card-bg, #FFFFFF)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--patient-tag-border, #A7F3D0)" }}>
                <strong>{language === "hi" ? "सलाह" : "Advice"}:</strong> {rx.advice}
              </div>
            )}
          </div>
        );
      })()}

      {/* Completed Consultation Notice if prescription notes are not yet attached */}
      {activeTicket.status === "completed" && !activeTicket.prescription_notes && (
        <div style={{
          marginTop: "14px",
          marginBottom: "14px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "var(--patient-tag-bg, #F0FDF4)",
          border: "1px solid rgba(5, 150, 105, 0.3)",
          color: "#10B981",
          fontSize: "12.5px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>
            {language === "hi"
              ? "परामर्श पूर्ण हो चुका है। यदि डॉक्टर ने पर्ची दी है तो कृपया फ़ार्मेसी डेस्क पर दिखाएं।"
              : "Consultation completed. If your doctor issued a paper prescription, please show this token at the pharmacy desk."}
          </span>
        </div>
      )}

      {/* Active Ticket Actions (WAITING status only) */}
      {activeTicket && (activeTicket.status || "").toLowerCase() === "waiting" && (
        <div style={{ display: "flex", gap: "10px", marginTop: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <button
            id="adjust-queue-btn"
            type="button"
            onClick={onOpenAdjustModal}
            disabled={(activeTicket.adjustment_count || 0) >= 3}
            style={{
              flex: 1,
              minWidth: "130px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: (activeTicket.adjustment_count || 0) >= 3 ? "1px solid var(--patient-card-border, #E2E8F0)" : "1.5px solid #0284C7",
              background: (activeTicket.adjustment_count || 0) >= 3 ? "var(--patient-sub-card, #F1F5F9)" : "var(--patient-tag-bg, #F0F9FF)",
              color: (activeTicket.adjustment_count || 0) >= 3 ? "#94A3B8" : "#0284C7",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: (activeTicket.adjustment_count || 0) >= 3 ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>
              {(activeTicket.adjustment_count || 0) >= 3
                ? (language === "hi" ? "समायोजन सीमा समाप्त (3/3)" : "Adjust Limit Reached (3/3)")
                : (language === "hi" ? "कतार समायोजित करें" : "Adjust Queue")}
            </span>
          </button>

          <button
            id="cancel-ticket-btn"
            type="button"
            onClick={onOpenCancelModal}
            style={{
              flex: 1,
              minWidth: "130px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1.5px solid var(--emergency-card-border, #FECACA)",
              background: "var(--emergency-card-bg, #FEF2F2)",
              color: "var(--emergency-card-text, #DC2626)",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span>{language === "hi" ? "टोकन रद्द करें" : "Cancel Ticket"}</span>
          </button>
        </div>
      )}

      {ticketQrData && (
        <div style={{ textAlign: "center", borderTop: "1px solid var(--patient-card-border, #E0F2FE)", paddingTop: "18px" }}>
          <img
            src={ticketQrData.qr_code_base64}
            alt="Ticket QR Code"
            style={{ width: "130px", height: "130px", borderRadius: "12px", background: "#fff", padding: "6px", border: "1px solid var(--patient-card-border, #CBD5E1)" }}
          />
          <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--patient-text-sub, #64748B)" }}>
            {t("scanQrHint", language)}
          </p>
        </div>
      )}

      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <button
          type="button"
          onClick={onPrint}
          style={{
            padding: "9px 18px",
            borderRadius: "10px",
            border: "1px solid #0284C7",
            background: "var(--patient-tag-bg, #F0F9FF)",
            color: "#0284C7",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          <span>{t("printPassBtn", language)}</span>
        </button>
      </div>

      {/* Option to Take Ticket for Another Family Member */}
      {members && members.length > 0 && (
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--patient-card-border, #E2E8F0)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--patient-text-sub, #64748B)", fontWeight: 600 }}>
            {language === "hi" ? "अन्य सदस्य के लिए भी टोकन चाहिए?" : "Need a ticket for another family member too?"}
          </span>
          <button
            type="button"
            onClick={() => {
              if (onTakeTicketForMember) {
                const unbooked = members.find((m) => !familyTickets[m.id]);
                onTakeTicketForMember(unbooked || null);
              }
            }}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
              color: "#FFFFFF",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
            }}
          >
            <span>+</span>
            <span>{language === "hi" ? "अन्य सदस्य का टोकन लें" : "Take Ticket for Family Member"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

const modalBackdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.65)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: "16px",
};

const modalContentStyle = {
  background: "var(--patient-card-bg, #FFFFFF)",
  borderRadius: "20px",
  maxWidth: "440px",
  width: "100%",
  padding: "26px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
  border: "1px solid var(--patient-card-border, #E2E8F0)",
  color: "var(--patient-text-main, #0F172A)",
  boxSizing: "border-box",
};

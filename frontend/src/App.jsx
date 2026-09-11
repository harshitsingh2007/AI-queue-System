/**
 * App.jsx
 * -------
 * Clean Top-Level Router & Real-Time Socket.IO Provider.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { API_BASE, WS_URL, HOSPITAL_CONFIG } from "./config/hospitalConfig";

// Modular Components & Pages
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import AccessDeniedGuard from "./components/AccessDeniedGuard";
import MandatoryAuthScreen from "./components/MandatoryAuthScreen";
import ErrorBoundary from "./components/ErrorBoundary";

import PatientPage from "./pages/PatientPage";
import StaffPage from "./pages/StaffPage";
import MLAdminPage from "./pages/MLAdminPage";
import DatabaseInspectorPage from "./pages/DatabaseInspectorPage";
import KioskPage from "./pages/KioskPage";
import SuperAdminPage from "./pages/SuperAdminPage";

import { announceTicketVoice } from "./utils/voiceSynthesizer";

function getInitialPage(user) {
  let effectiveUser = user;
  if (!effectiveUser && typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("ai_queue_user");
      if (saved) effectiveUser = JSON.parse(saved);
    } catch (e) {}
  }
  const userRole = effectiveUser ? (effectiveUser.role || "").toLowerCase() : "";
  const isSuperAdminUser = userRole === "super_admin" || userRole === "superadmin";
  const isStaffUser = ["admin", "doctor", "staff", "receptionist"].includes(userRole);

  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get("page") || params.get("view");
  if (pageParam && pageParam.toLowerCase() !== "hub") {
    const p = pageParam.toLowerCase();
    // Tab aliases for the patient portal should route to patient page
    if (["patient", "history", "appointment_history", "past_appointments", "my_apts", "appointments", "my_appointments", "book", "family"].includes(p)) {
      if (isSuperAdminUser) return "superadmin";
      if (isStaffUser) return "staff";
      return "patient";
    }
    return p;
  }

  const path = window.location.pathname.toLowerCase();
  if (path.includes("superadmin") || path.includes("super_admin")) return "superadmin";
  if (path.includes("kiosk") || path.includes("tv")) return "kiosk";
  if (path.includes("staff") || path.includes("doctor")) return "staff";
  if (path.includes("admin") || path.includes("ml")) return "admin";
  if (path.includes("db") || path.includes("database")) return "db";
  if (path.includes("patient") || path.includes("history") || path.includes("appointment")) {
    if (isSuperAdminUser) return "superadmin";
    if (isStaffUser) return "staff";
    return "patient";
  }

  if (isSuperAdminUser) return "superadmin";
  if (isStaffUser) return "staff";

  return "patient";
}

export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("ai_queue_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Family Profile State (Patient/User role only)
  const [familyMembers, setFamilyMembers] = useState([]);
  const [activeFamilyMember, setActiveFamilyMember] = useState(null); // null = self

  const [currentHospitalTenant, setCurrentHospitalTenant] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const p = new URLSearchParams(window.location.search);
        const urlHosp = p.get("hospital") || p.get("tenant") || p.get("facility");
        if (urlHosp) return urlHosp;
      }
      const savedHosp = localStorage.getItem("ai_queue_current_hospital");
      if (savedHosp) return savedHosp;
      const saved = localStorage.getItem("ai_queue_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.hospital_code && u.hospital_code !== "all") return u.hospital_code;
      }
    } catch (e) {}
    return HOSPITAL_CONFIG.tenantId;
  });

  const [activePage, setActivePage] = useState(() => {
    try {
      const saved = localStorage.getItem("ai_queue_user");
      const u = saved ? JSON.parse(saved) : null;
      return getInitialPage(u);
    } catch (e) {
      return "patient";
    }
  });
  const [currentTab, setCurrentTab] = useState(() => {
    try {
      if (typeof window !== "undefined") {
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
        const path = window.location.pathname.toLowerCase();
        if (path.includes("history")) return "history";
        if (path.includes("appointment")) return "my_apts";
      }
    } catch (e) {}
    return "walkin";
  });
  const tenantId = currentHospitalTenant || HOSPITAL_CONFIG.tenantId;

  // Global White-Label Hospital Branding State
  const [hospitalBranding, setHospitalBranding] = useState(null);

  const fetchBranding = useCallback((hCode) => {
    if (!hCode) return;
    const cleanCode = String(hCode).trim();
    fetch(`${API_BASE}/api/v1/hospital/branding/${cleanCode}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success" && d.branding) {
          setHospitalBranding(d.branding);
        }
      })
      .catch((e) => console.log("Branding fetch error in App:", e));
  }, []);

  useEffect(() => {
    const activeCode =
      (currentUser && ["admin", "doctor", "staff", "receptionist"].includes(currentUser.role) && currentUser.hospital_code && currentUser.hospital_code !== "all")
        ? currentUser.hospital_code
        : (currentHospitalTenant || HOSPITAL_CONFIG.tenantId);
    fetchBranding(activeCode);
  }, [currentHospitalTenant, currentUser, fetchBranding]);

  useEffect(() => {
    if (hospitalBranding?.primary_color) {
      document.documentElement.style.setProperty("--brand-primary", hospitalBranding.primary_color);
    }
    if (hospitalBranding?.secondary_color) {
      document.documentElement.style.setProperty("--brand-secondary", hospitalBranding.secondary_color);
    }
    if (hospitalBranding?.accent_color) {
      document.documentElement.style.setProperty("--brand-accent", hospitalBranding.accent_color);
    }
  }, [hospitalBranding]);

  useEffect(() => {
    const handleBrandingEvent = (e) => {
      const b = e?.detail?.branding || e?.detail;
      if (b) setHospitalBranding((prev) => ({ ...prev, ...b }));
    };
    window.addEventListener("hospital_branding_updated", handleBrandingEvent);
    return () => window.removeEventListener("hospital_branding_updated", handleBrandingEvent);
  }, []);

  const navigateTo = useCallback((page, tab = null) => {
    let targetPage = page;
    let targetTab = tab;

    // Gracefully handle alias pages so they resolve directly to patient tab
    const lower = (page || "").toLowerCase();
    if (["history", "appointment_history", "past_appointments"].includes(lower)) {
      targetPage = "patient";
      targetTab = targetTab || "history";
    } else if (["my_apts", "appointments", "my_appointments"].includes(lower)) {
      targetPage = "patient";
      targetTab = targetTab || "my_apts";
    } else if (["book", "booking", "schedule"].includes(lower)) {
      targetPage = "patient";
      targetTab = targetTab || "book";
    } else if (["family", "dependents"].includes(lower)) {
      targetPage = "patient";
      targetTab = targetTab || "family";
    }

    setActivePage(targetPage);
    const effectiveTab = targetTab || (targetPage === "patient" ? (currentTab || "walkin") : null);
    if (effectiveTab) {
      setCurrentTab(effectiveTab);
    }
    const url = new URL(window.location.href);
    url.searchParams.set("page", targetPage);
    if (effectiveTab && targetPage === "patient") {
      url.searchParams.set("tab", effectiveTab);
    } else if (targetPage !== "patient") {
      url.searchParams.delete("tab");
    }
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new Event("popstate"));
  }, [currentTab]);

  // Sync state on browser back/forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const u = currentUser || (() => {
          try {
            const s = localStorage.getItem("ai_queue_user");
            return s ? JSON.parse(s) : null;
          } catch (e) { return null; }
        })();
        const p = getInitialPage(u);
        setActivePage(p);

        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab");
        const pageParam = (params.get("page") || params.get("view") || "").toLowerCase();
        if (tabParam && ["walkin", "book", "my_apts", "history", "family"].includes(tabParam.toLowerCase())) {
          setCurrentTab(tabParam.toLowerCase());
        } else if (["history", "appointment_history", "past_appointments"].includes(pageParam)) {
          setCurrentTab("history");
        } else if (["my_apts", "appointments", "my_appointments"].includes(pageParam)) {
          setCurrentTab("my_apts");
        } else if (["book", "booking", "schedule"].includes(pageParam)) {
          setCurrentTab("book");
        } else if (["family", "dependents"].includes(pageParam)) {
          setCurrentTab("family");
        } else if (p === "patient") {
          setCurrentTab("walkin");
        }
      } catch (e) {}
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentUser]);

  // Auto-redirect privileged roles away from patient self-service page
  useEffect(() => {
    if (currentUser) {
      const r = (currentUser.role || "").toLowerCase();
      if ((r === "super_admin" || r === "superadmin") && activePage === "patient") {
        navigateTo("superadmin");
      } else if (["admin", "doctor", "staff", "receptionist"].includes(r) && activePage === "patient") {
        navigateTo("staff");
      }
    }
  }, [currentUser, activePage, navigateTo]);

  // Sync latest user profile on initial mount only if not already initialized
  useEffect(() => {
    if (currentUser?.email && !currentUser.hospital_code) {
      fetch(`${API_BASE}/api/v1/auth/me?email=${encodeURIComponent(currentUser.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success" && data.user) {
            setCurrentUser((prev) => {
              const updated = { ...prev, ...data.user };
              try {
                localStorage.setItem("ai_queue_user", JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
            const savedHosp = localStorage.getItem("ai_queue_current_hospital");
            if (!savedHosp && data.user.hospital_code && data.user.hospital_code !== "all") {
              setCurrentHospitalTenant(data.user.hospital_code);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setShowAuthModal(false);
    try {
      localStorage.setItem("ai_queue_user", JSON.stringify(userData));
    } catch (e) {}

    if (userData.hospital_code && userData.hospital_code !== "all") {
      setCurrentHospitalTenant(userData.hospital_code);
    }

    // Reset family state on new login
    setActiveFamilyMember(null);
    setFamilyMembers([]);

    // Fetch family members if patient role
    if (userData.role === "user" || userData.role === "patient") {
      fetchFamilyMembers(userData);
    }

    // Role-based auto dashboard direct redirect (zero patient interference)
    if (userData.role === "super_admin" || userData.role === "superadmin") {
      navigateTo("superadmin");
    } else if (["admin", "doctor", "staff", "receptionist"].includes(userData.role)) {
      navigateTo("staff");
    } else {
      navigateTo("patient", "walkin");
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      try {
        fetch(`${API_BASE}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(currentUser.token ? { Authorization: `Bearer ${currentUser.token}` } : {}),
          },
          body: JSON.stringify({
            id: currentUser.id,
            email: currentUser.email,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch (e) {}
    }
    setCurrentUser(null);
    setActiveFamilyMember(null);
    setFamilyMembers([]);
    try {
      localStorage.removeItem("ai_queue_user");
    } catch (e) {}
    navigateTo("patient", "walkin");
  };

  // Fetch family members from backend (for role=user only)
  const fetchFamilyMembers = useCallback((user) => {
    const u = user || currentUser;
    if (!u || !u.email || !(["user", "patient"].includes(u.role))) return;
    fetch(`${API_BASE}/api/v1/family-members`, {
      headers: { "X-User-Email": u.email }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success" && Array.isArray(data.members)) {
          setFamilyMembers(data.members);
        }
      })
      .catch((e) => console.log("Family members fetch error:", e));
  }, [currentUser]);

  // Load family members when user is available
  useEffect(() => {
    if (currentUser && ["user", "patient"].includes(currentUser.role)) {
      fetchFamilyMembers(currentUser);
    } else {
      setFamilyMembers([]);
      setActiveFamilyMember(null);
    }
  }, [currentUser]);

  // Handle profile switch from header
  const handleSwitchProfile = useCallback((member) => {
    setActiveFamilyMember(member);
    // Dispatch event so PatientPage can sync
    window.dispatchEvent(new CustomEvent("switch_patient_profile", { detail: member }));
  }, []);

  // Handle add family member from header
  const handleAddFamilyMemberFromHeader = useCallback(async (newMember) => {
    if (!currentUser || !currentUser.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/family-members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": currentUser.email
        },
        body: JSON.stringify(newMember)
      });
      const data = await res.json();
      if (data.status === "success" && data.member) {
        setFamilyMembers((prev) => [...prev, data.member]);
        window.dispatchEvent(new CustomEvent("family_members_updated", { detail: [...familyMembers, data.member] }));
        return data.member;
      }
    } catch (err) {
      console.log("Add family member error:", err);
    }
  }, [currentUser, familyMembers]);

  // Handle manage family members - navigate to patient page
  const handleManageFamilyMembers = useCallback(() => {
    navigateTo("patient", "family");
  }, [navigateTo]);

  // Real-time Queue State
  const [analytics, setAnalytics] = useState(null);
  const [queueSnapshot, setQueueSnapshot] = useState([]);
  const [servingTickets, setServingTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketQrData, setTicketQrData] = useState(null);
  const [kioskQrData, setKioskQrData] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [language, setLanguage] = useState("en"); // 'en' | 'hi'
  const socketRef = useRef(null);
  const languageRef = useRef(language);
  const activeTicketRef = useRef(activeTicket);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    activeTicketRef.current = activeTicket;
  }, [activeTicket]);

  // Sync page & tab state when URL changes
  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getInitialPage());
      const params = new URLSearchParams(window.location.search);
      setCurrentTab(params.get("tab") || "walkin");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const isSuperAdmin = currentUser && (currentUser.role === "super_admin" || currentUser.role === "superadmin");
  const isStaffOrAdmin = currentUser && ["admin", "doctor", "staff", "receptionist"].includes(currentUser.role);
  const isAdmin = isStaffOrAdmin;
  const adminDepartment = currentUser && currentUser.department ? currentUser.department.toLowerCase() : "all";
  const adminDeptRef = useRef(adminDepartment);
  const activePageRef = useRef(activePage);
  const isAdminRef = useRef(isAdmin);

  useEffect(() => {
    adminDeptRef.current = adminDepartment;
    activePageRef.current = activePage;
    isAdminRef.current = isAdmin;
  }, [adminDepartment, activePage, isAdmin]);

  // Socket.IO Connection Setup
  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      auth: { tenant_id: tenantId }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_room", { tenant_id: tenantId });
    });

    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("queue_update", (data) => {
      const dept = adminDeptRef.current;
      if (data.snapshot) {
        setQueueSnapshot(dept && dept !== "all" ? data.snapshot.filter(t => (t.service_category || "").toLowerCase() === dept) : data.snapshot);
        const cur = activeTicketRef.current;
        if (cur && cur.status === "waiting") {
          const updatedCur = data.snapshot.find(t => t.ticket_id === cur.ticket_id);
          if (updatedCur) {
            setActiveTicket(updatedCur);
          }
        }
      }
      if (data.serving) {
        setServingTickets(dept && dept !== "all" ? data.serving.filter(t => (t.service_category || "").toLowerCase() === dept) : data.serving);
      }
    });

    socket.on("queue_updated", (data) => {
      const dept = adminDeptRef.current;
      if (data.analytics) setAnalytics(data.analytics);
      if (data.snapshot) {
        setQueueSnapshot(dept && dept !== "all" ? data.snapshot.filter(t => (t.service_category || "").toLowerCase() === dept) : data.snapshot);
        const cur = activeTicketRef.current;
        if (cur && cur.status === "waiting") {
          const updatedCur = data.snapshot.find(t => t.ticket_id === cur.ticket_id);
          if (updatedCur) {
            setActiveTicket(updatedCur);
          }
        }
      }
      if (data.serving) {
        setServingTickets(dept && dept !== "all" ? data.serving.filter(t => (t.service_category || "").toLowerCase() === dept) : data.serving);
      }
    });

    socket.on("ticket_cancelled", (data) => {
      if (data && data.ticket) {
        const cur = activeTicketRef.current;
        if (cur && cur.ticket_id === data.ticket.ticket_id) {
          setActiveTicket(data.ticket);
        }
      }
      refreshData();
    });

    socket.on("ticket_updated", (data) => {
      if (data && data.ticket) {
        const cur = activeTicketRef.current;
        if (cur && (cur.ticket_id === data.ticket.ticket_id || cur.ticket_id === data.ticket_id)) {
          setActiveTicket(data.ticket);
        }
      }
      refreshData();
    });

    socket.on("ticket_completed", (data) => {
      if (data && data.ticket) {
        const cur = activeTicketRef.current;
        if (cur && (cur.ticket_id === data.ticket.ticket_id || cur.ticket_id === data.ticket_id)) {
          setActiveTicket(data.ticket);
        }
      }
      refreshData();
    });

    socket.on("prescription_saved", (data) => {
      if (data && data.ticket) {
        const cur = activeTicketRef.current;
        if (cur && (cur.ticket_id === data.ticket.ticket_id || cur.ticket_id === data.ticket_id)) {
          setActiveTicket(data.ticket);
        }
      }
      refreshData();
    });

    socket.on("analytics_update", (data) => {
      if (data) setAnalytics(data);
    });

    socket.on("hospital_branding_updated", (data) => {
      if (data && data.branding) {
        setHospitalBranding((prev) => ({ ...prev, ...data.branding }));
      }
    });

    socket.on("ticket_transferred", (data) => {
      if (data && data.new_ticket) {
        const cur = activeTicketRef.current;
        if (cur && (cur.ticket_id === data.original_ticket?.ticket_id || cur.ticket_id === data.new_ticket?.ticket_id)) {
          setActiveTicket(data.new_ticket);
          fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${data.new_ticket.ticket_id}`)
            .then((r) => r.json())
            .then((qr) => setTicketQrData(qr))
            .catch((e) => console.log("QR fetch error:", e));
        }
      }
      refreshData();
    });

    socket.on("now_serving", (data) => {
      if (data && data.ticket) {
        const cur = activeTicketRef.current;
        if (cur && data.ticket.ticket_id === cur.ticket_id) {
          setActiveTicket(data.ticket);
        }

        // Only play audio chime & voice announcement on the Dedicated Waiting Room Kiosk TV (NOT on Patient/User Portal)
        if (activePageRef.current === "kiosk") {
          playChimeSound();
          announceTicketVoice(data.ticket, languageRef.current || "en");
        }
      }
    });

    socket.on("serve_error", (data) => {
      if (data && data.message) {
        window.dispatchEvent(new CustomEvent("queue_serve_error", { detail: data }));
      }
    });

    return () => socket.disconnect();
  }, [tenantId]);

  // Fetch Queue & Analytics with Department Security Boundary
  const refreshData = useCallback(() => {
    const deptQuery = adminDepartment && adminDepartment !== "all" ? `?department=${encodeURIComponent(adminDepartment)}` : "";

    fetch(`${API_BASE}/api/v1/plugin/analytics/${tenantId}${deptQuery}`)
      .then((r) => r.json())
      .then((d) => setAnalytics(d))
      .catch((e) => console.log("Analytics error:", e));

    fetch(`${API_BASE}/api/v1/plugin/queue/${tenantId}${deptQuery}`)
      .then((r) => r.json())
      .then((d) => {
        setQueueSnapshot(d.snapshot || []);
        setServingTickets(d.serving || []);
      })
      .catch((e) => console.log("Queue error:", e));

    fetch(`${API_BASE}/api/v1/plugin/qr/${tenantId}`)
      .then((r) => r.json())
      .then((d) => setKioskQrData(d))
      .catch((e) => console.log("QR error:", e));
  }, [tenantId, adminDepartment]);

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 4000);
    return () => clearInterval(timer);
  }, [refreshData]);

  // Handle hospital facility switch from Header or Patient portal
  const handleSwitchHospital = useCallback((hospitalCode, hospitalName = null) => {
    if (!hospitalCode) return;
    const cleanCode = String(hospitalCode).trim();
    setCurrentHospitalTenant(cleanCode);
    try {
      localStorage.setItem("ai_queue_current_hospital", cleanCode);
    } catch (e) {}

    // Update URL query parameter
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("hospital", cleanCode);
      window.history.pushState({}, "", url.toString());
    } catch (e) {}

    // Reset active ticket / QR pass for prior facility queue
    setActiveTicket(null);
    setTicketQrData(null);

    // Update user's facility preference in local state and localStorage
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        hospital_code: cleanCode,
        ...(hospitalName ? { hospital_name: hospitalName } : {})
      };
      try {
        localStorage.setItem("ai_queue_user", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Also persist primary hospital choice to backend if user is logged in
    if (currentUser?.email) {
      fetch(`${API_BASE}/api/v1/auth/primary-hospital`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, hospital_code: cleanCode }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.status === "success") {
            setCurrentUser((prev) => {
              if (!prev) return prev;
              const u = {
                ...prev,
                hospital_code: d.hospital_code,
                hospital_name: d.hospital_name || hospitalName || prev.hospital_name,
              };
              try {
                localStorage.setItem("ai_queue_user", JSON.stringify(u));
              } catch (e) {}
              return u;
            });
          }
        })
        .catch((e) => console.log("Primary hospital update error:", e));
    }

    // Notify listeners across components
    window.dispatchEvent(new CustomEvent("hospital_changed", { detail: cleanCode }));

    setTimeout(() => {
      refreshData();
    }, 100);
  }, [currentUser?.email, refreshData]);

  // Audio Chime
  const playChimeSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log("Audio play error:", e);
    }
  };

  // Staff Desk Actions
  const handleServeNext = async () => {
    if (socketRef.current) {
      const dept = adminDepartment && adminDepartment !== "all" ? adminDepartment : undefined;
      socketRef.current.emit("serve_next", {
        tenant_id: tenantId,
        department: dept,
        service_category: dept,
        doctor_id: currentUser?.id,
        doctor_name: currentUser?.name || currentUser?.username,
        doctor_email: currentUser?.email,
      });
    }
  };

  const handleCompleteTicket = async (ticketId, prescriptionNotes = null) => {
    if (socketRef.current) {
      const dept = adminDepartment && adminDepartment !== "all" ? adminDepartment : undefined;
      socketRef.current.emit("complete_ticket", {
        tenant_id: tenantId,
        ticket_id: ticketId,
        department: dept,
        prescription_notes: prescriptionNotes,
      });
    }
  };

  const handleCounterChange = async (delta) => {
    const current = analytics ? analytics.active_counters : 2;
    const next = Math.max(1, current + delta);
    if (socketRef.current) socketRef.current.emit("set_counters", { tenant_id: tenantId, active_counters: next });
  };

  // Dedicated full-viewport view for unauthenticated login screen (no outer wrapper padding / scrolling)
  if (!currentUser && activePage !== "kiosk") {
    return (
      <div style={{ minHeight: "100vh", width: "100vw", overflowX: "hidden", margin: 0, padding: 0 }}>
        <MandatoryAuthScreen
          onLoginSuccess={(user) => {
            handleLoginSuccess(user);
          }}
          language={language}
          setLanguage={setLanguage}
          navigateTo={navigateTo}
        />
        {showAuthModal && (
          <AuthModal
            authMode={authMode}
            setAuthMode={setAuthMode}
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div style={appBgStyle}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", width: "100%", padding: "0 8px", boxSizing: "border-box" }}>
        {/* Top Navigation Header Bar */}
        <Header
          currentUser={currentUser}
          activePage={activePage}
          navigateTo={navigateTo}
          handleLogout={handleLogout}
          setShowAuthModal={setShowAuthModal}
          socketConnected={socketConnected}
          language={language}
          setLanguage={setLanguage}
          currentTab={currentTab}
          familyMembers={familyMembers}
          activeFamilyMember={activeFamilyMember}
          onSwitchProfile={handleSwitchProfile}
          onAddFamilyMember={handleAddFamilyMemberFromHeader}
          onManageFamilyMembers={handleManageFamilyMembers}
          currentHospitalTenant={currentHospitalTenant}
          onSwitchHospital={handleSwitchHospital}
          hospitalBranding={hospitalBranding}
        />

        {/* Main Content Router */}
        <main style={mainContentStyle}>
          <>
            {activePage === "patient" && (
              (isAdmin || isSuperAdmin) ? (
                <AccessDeniedGuard
                  requiredRole="user"
                  pageName="Patient Check-in Portal (Consumer)"
                  currentUser={currentUser}
                  onLoginSuccess={handleLoginSuccess}
                  navigateTo={navigateTo}
                />
              ) : (
                <ErrorBoundary fallbackTitle="Patient Portal Error">
                  <PatientPage
                    tenantId={tenantId}
                    currentUser={currentUser}
                    activeTicket={activeTicket}
                    setActiveTicket={setActiveTicket}
                    ticketQrData={ticketQrData}
                    setTicketQrData={setTicketQrData}
                    refreshData={refreshData}
                    language={language}
                    setLanguage={setLanguage}
                    navigateTo={navigateTo}
                    currentTab={currentTab}
                    analytics={analytics}
                    queueSnapshot={queueSnapshot}
                    servingTickets={servingTickets}
                    kioskQrData={kioskQrData}
                    socketConnected={socketConnected}
                    familyMembers={familyMembers}
                    setFamilyMembers={setFamilyMembers}
                    activeFamilyMember={activeFamilyMember}
                    setActiveFamilyMember={setActiveFamilyMember}
                    onSwitchProfile={handleSwitchProfile}
                    onFamilyMembersChange={fetchFamilyMembers}
                    currentHospitalTenant={currentHospitalTenant}
                    onSwitchHospital={handleSwitchHospital}
                    hospitalBranding={hospitalBranding}
                    onUpdateHospitalBranding={setHospitalBranding}
                  />
                </ErrorBoundary>
              )
            )}

            {activePage === "superadmin" && (
              !isSuperAdmin ? (
                <AccessDeniedGuard
                  requiredRole="super_admin"
                  pageName="Super Admin / Hospital Owner Portal"
                  currentUser={currentUser}
                  onLoginSuccess={handleLoginSuccess}
                  navigateTo={navigateTo}
                />
              ) : (
                <SuperAdminPage
                  currentUser={currentUser}
                  language={language}
                  onSelectHospitalTenant={(hCode) => {
                    setCurrentHospitalTenant(hCode);
                  }}
                  navigateTo={navigateTo}
                  hospitalBranding={hospitalBranding}
                  onUpdateHospitalBranding={setHospitalBranding}
                />
              )
            )}

            {activePage === "staff" && (
              !isAdmin ? (
                <AccessDeniedGuard
                  requiredRole="admin"
                  pageName="Doctor & Staff Desk Dashboard"
                  currentUser={currentUser}
                  onLoginSuccess={handleLoginSuccess}
                  navigateTo={navigateTo}
                />
              ) : (
                <StaffPage
                  tenantId={tenantId}
                  currentUser={currentUser}
                  analytics={analytics}
                  queueSnapshot={queueSnapshot}
                  servingTickets={servingTickets}
                  handleServeNext={handleServeNext}
                  handleCompleteTicket={handleCompleteTicket}
                  handleCounterChange={handleCounterChange}
                  refreshData={refreshData}
                  language={language}
                  socketRef={socketRef}
                  navigateTo={navigateTo}
                  hospitalBranding={hospitalBranding}
                  onUpdateHospitalBranding={setHospitalBranding}
                />
              )
            )}

            {activePage === "admin" && (
              !isAdmin ? (
                <AccessDeniedGuard
                  requiredRole="admin"
                  pageName="Hospital ML Studio & Training"
                  currentUser={currentUser}
                  onLoginSuccess={handleLoginSuccess}
                  navigateTo={navigateTo}
                />
              ) : (
                <MLAdminPage tenantId={tenantId} />
              )
            )}

            {activePage === "db" && (
              !isAdmin ? (
                <AccessDeniedGuard
                  requiredRole="admin"
                  pageName="Database Inspector"
                  currentUser={currentUser}
                  onLoginSuccess={handleLoginSuccess}
                  navigateTo={navigateTo}
                />
              ) : (
                <DatabaseInspectorPage />
              )
            )}

            {activePage === "kiosk" && (
              <KioskPage
                tenantId={tenantId}
                analytics={analytics}
                servingTickets={servingTickets}
                queueSnapshot={queueSnapshot}
                kioskQrData={kioskQrData}
                language={language}
                setLanguage={setLanguage}
                currentUser={currentUser}
                navigateTo={navigateTo}
              />
            )}
          </>
        </main>

        {/* Auth Modal Overlay */}
        {showAuthModal && (
          <AuthModal
            authMode={authMode}
            setAuthMode={setAuthMode}
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    </div>
  );
}

// Global Soft Medical Blue & Cyan Clinical Theme Styles
const appBgStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #F8FAFC 0%, #F0F9FF 100%)",
  color: "#0F172A",
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  padding: "20px 28px",
};

const mainContentStyle = { minHeight: "75vh" };

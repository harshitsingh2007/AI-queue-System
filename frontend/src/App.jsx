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

import PatientPage from "./pages/PatientPage";
import StaffPage from "./pages/StaffPage";
import MLAdminPage from "./pages/MLAdminPage";
import DatabaseInspectorPage from "./pages/DatabaseInspectorPage";
import KioskPage from "./pages/KioskPage";

import { announceTicketVoice } from "./utils/voiceSynthesizer";

function getInitialPage(user) {
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get("page") || params.get("view");
  if (pageParam && pageParam.toLowerCase() !== "hub") return pageParam.toLowerCase();

  const path = window.location.pathname.toLowerCase();
  if (path.includes("patient")) return "patient";
  if (path.includes("staff") || path.includes("doctor")) return "staff";
  if (path.includes("admin") || path.includes("ml")) return "admin";
  if (path.includes("db") || path.includes("database")) return "db";
  if (path.includes("kiosk") || path.includes("tv")) return "kiosk";

  if (user && user.role === "admin") return "staff";
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

  const [activePage, setActivePage] = useState(() => getInitialPage(currentUser));
  const tenantId = HOSPITAL_CONFIG.tenantId;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setShowAuthModal(false);
    try {
      localStorage.setItem("ai_queue_user", JSON.stringify(userData));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("ai_queue_user");
    } catch (e) {}
  };

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

  // Sync page state when URL changes
  useEffect(() => {
    const handlePopState = () => setActivePage(getInitialPage());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (page) => {
    setActivePage(page);
    const url = new URL(window.location.href);
    url.searchParams.set("page", page);
    window.history.pushState({}, "", url.toString());
  };

  const isAdmin = currentUser && currentUser.role === "admin";
  const adminDepartment = isAdmin ? (currentUser.department ? currentUser.department.toLowerCase() : "all") : "all";
  const adminDeptRef = useRef(adminDepartment);

  useEffect(() => {
    adminDeptRef.current = adminDepartment;
  }, [adminDepartment]);

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
      }
      if (data.serving) {
        setServingTickets(dept && dept !== "all" ? data.serving.filter(t => (t.service_category || "").toLowerCase() === dept) : data.serving);
      }
    });

    socket.on("analytics_update", (data) => {
      if (data) setAnalytics(data);
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
        playChimeSound();
        announceTicketVoice(data.ticket, languageRef.current || "en");
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
      socketRef.current.emit("serve_next", { tenant_id: tenantId, department: dept, service_category: dept });
    }
  };

  const handleCompleteTicket = async (ticketId) => {
    if (socketRef.current) {
      const dept = adminDepartment && adminDepartment !== "all" ? adminDepartment : undefined;
      socketRef.current.emit("complete_ticket", { tenant_id: tenantId, ticket_id: ticketId, department: dept });
    }
  };

  const handleCounterChange = async (delta) => {
    const current = analytics ? analytics.active_counters : 2;
    const next = Math.max(1, current + delta);
    if (socketRef.current) socketRef.current.emit("set_counters", { tenant_id: tenantId, active_counters: next });
  };

  return (
    <div style={appBgStyle}>
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
      />

      {/* Main Content Router */}
      <main style={mainContentStyle}>
        {!currentUser && activePage !== "kiosk" ? (
          <MandatoryAuthScreen
            onLoginSuccess={(user) => {
              handleLoginSuccess(user);
              if (user.role === "admin") {
                navigateTo("staff");
              } else {
                navigateTo("patient");
              }
            }}
          />
        ) : (
          <>
            {activePage === "patient" && (
              isAdmin ? (
                <AccessDeniedGuard
                  requiredRole="user"
                  pageName="Patient Check-in Portal (Consumer)"
                  currentUser={currentUser}
                  onLoginSuccess={handleLoginSuccess}
                  navigateTo={navigateTo}
                />
              ) : (
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
                  pageName="SQLite Database Inspector"
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
                servingTickets={servingTickets}
                queueSnapshot={queueSnapshot}
                kioskQrData={kioskQrData}
                language={language}
                setLanguage={setLanguage}
              />
            )}
          </>
        )}
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
  );
}

// Global Soft Green Clinical Theme Styles
const appBgStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #F4F9F5 0%, #EBF4EE 100%)",
  color: "#0F172A",
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  padding: "20px 28px",
};

const mainContentStyle = { minHeight: "75vh" };

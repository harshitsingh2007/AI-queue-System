/**
 * App.jsx
 * --------
 * Decoupled Multi-Page Architecture for AI-Powered Hospital Queue System with Role-Based Auth.
 *
 * Role Access Control:
 * 1. 📱 Patient / Consumer View (`?page=patient`): Accessible by Consumers & Guests.
 * 2. 🛡️ Staff / Doctor Desk Dashboard (`?page=staff`): Strictly Protected — ADMIN ONLY.
 * 3. 📊 Hospital ML Studio & Training (`?page=admin`): Strictly Protected — ADMIN ONLY.
 * 4. 📺 Waiting Room Kiosk TV Banner (`?page=kiosk`): Public Kiosk View.
 * 5. 🏠 Hospital Launchpad Portal Hub (`?page=hub`): Navigation Hub with Role Badges.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import QueuePluginWidget from "./QueuePluginWidget";

const API_BASE = "http://127.0.0.1:8000";
const WS_URL = "http://127.0.0.1:8000";

const HOSPITAL_CONFIG = {
  tenantId: "city-hospital-01",
  name: "City General Hospital",
  consumerType: "hospital",
  categories: [
    { id: "consultation", label: "📋 General Consultation" },
    { id: "emergency", label: "🚨 Emergency Triage" },
    { id: "pharmacy", label: "💊 Pharmacy & Medicine" },
    { id: "radiology", label: "🩻 Radiology & X-Ray" },
    { id: "lab_test", label: "🧪 Pathology & Lab Test" },
  ],
};

function getInitialPage() {
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get("page") || params.get("view");
  if (pageParam) return pageParam.toLowerCase();

  const path = window.location.pathname.toLowerCase();
  if (path.includes("patient")) return "patient";
  if (path.includes("staff") || path.includes("doctor")) return "staff";
  if (path.includes("admin") || path.includes("ml")) return "admin";
  if (path.includes("kiosk") || path.includes("tv")) return "kiosk";

  return "hub";
}

export default function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
  const tenantId = HOSPITAL_CONFIG.tenantId;

  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("ai_queue_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"

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
  const socketRef = useRef(null);

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

  // Socket.IO Connection Setup
  useEffect(() => {
    const socket = io(WS_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_room", { tenant_id: tenantId });
    });

    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("queue_updated", (data) => {
      if (data.analytics) setAnalytics(data.analytics);
      if (data.snapshot) setQueueSnapshot(data.snapshot);
      if (data.serving) setServingTickets(data.serving);
    });

    socket.on("now_serving", (data) => {
      if (data.ticket && activeTicket && data.ticket.ticket_id === activeTicket.ticket_id) {
        setActiveTicket(data.ticket);
        playChimeSound();
      }
    });

    return () => socket.disconnect();
  }, [tenantId, activeTicket]);

  // Fetch Queue & Analytics — scoped to admin's department when the current user is an admin.
  // This ensures backend returns only the relevant dept's data, not global stats.
  const refreshData = useCallback(() => {
    const dept = currentUser && currentUser.role === "admin" && currentUser.department
      ? currentUser.department.toLowerCase()
      : null;
    const deptQuery = dept && dept !== "all" ? `?department=${encodeURIComponent(dept)}` : "";

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
  }, [tenantId, currentUser]);

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

  // Staff Desk Actions — include admin's department in all queue-mutation events
  // so the backend can enforce department ownership (see queue_engine.py).
  const adminDept = currentUser && currentUser.department
    ? currentUser.department.toLowerCase()
    : "all";

  const handleServeNext = async () => {
    if (socketRef.current) {
      socketRef.current.emit("serve_next", {
        tenant_id: tenantId,
        department: adminDept !== "all" ? adminDept : undefined,
      });
    }
  };

  const handleCompleteTicket = async (ticketId) => {
    if (socketRef.current) {
      socketRef.current.emit("complete_ticket", {
        tenant_id: tenantId,
        ticket_id: ticketId,
        department: adminDept !== "all" ? adminDept : undefined,
      });
    }
  };

  const handleCounterChange = async (delta) => {
    const current = analytics ? analytics.active_counters : 2;
    const next = Math.max(1, current + delta);
    if (socketRef.current) socketRef.current.emit("set_counters", { tenant_id: tenantId, active_counters: next });
  };

  const isAdmin = currentUser && currentUser.role === "admin";
  const isConsumer = currentUser && currentUser.role === "user";

  return (
    <div style={appBgStyle}>
      {/* Top Header Bar */}
      <header style={topHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={logoTagStyle}>🏥 Hospital Queue System</span>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{HOSPITAL_CONFIG.name}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* User Auth Badge / Login Button */}
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  background: isAdmin ? "rgba(192, 132, 252, 0.2)" : "rgba(56, 189, 248, 0.2)",
                  color: isAdmin ? "#c084fc" : "#38bdf8",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: isAdmin ? "1px solid #a855f7" : "1px solid #0284c7",
                }}
              >
                {isAdmin ? "🛡️ Admin:" : "📱 Patient:"} {currentUser.username}
              </span>
              <button onClick={handleLogout} style={logoutBtnStyle}>
                Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={authTriggerBtnStyle}>
              🔐 Login / Signup
            </button>
          )}

          {/* Role-Based Page Switcher Dropdown */}
          <select
            value={activePage}
            onChange={(e) => navigateTo(e.target.value)}
            style={pageSelectStyle}
            disabled={!currentUser && activePage !== "kiosk"}
          >
            <option value="hub">🏠 Portal Hub</option>
            
            {/* Strictly Hide Consumer Pages from Admins */}
            {(isConsumer || !currentUser) && (
              <option value="patient">📱 Patient Portal (Consumer)</option>
            )}

            {/* Strictly Hide Admin Pages from Consumers */}
            {isAdmin && (
              <>
                <option value="staff">🛡️ Doctor Desk (Admin Only)</option>
                <option value="admin">📊 ML Studio (Admin Only)</option>
                <option value="db">🗄️ Database Inspector (Admin Only)</option>
              </>
            )}

            <option value="kiosk">📺 Waiting Room Kiosk TV</option>
          </select>

          {/* Socket Connection Badge */}
          <span style={connBadgeStyle(socketConnected)}>
            <span style={dotStyle(socketConnected)} />
            {socketConnected ? "Live Socket.IO" : "Offline"}
          </span>
        </div>
      </header>

      {/* RENDER DECOUPLED STANDALONE PAGES WITH STRICT MANDATORY AUTH & ACCESS GUARDS */}
      <main style={mainContentStyle}>
        {!currentUser && activePage !== "kiosk" ? (
          <MandatoryAuthScreen onLoginSuccess={(user) => {
            handleLoginSuccess(user);
            if (user.role === "admin") {
              navigateTo("staff");
            } else {
              navigateTo("patient");
            }
          }} />
        ) : (
          <>
            {activePage === "hub" && <HospitalHubPage navigateTo={navigateTo} currentUser={currentUser} />}
            
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
                <StandalonePatientPage
                  tenantId={tenantId}
                  currentUser={currentUser}
                  activeTicket={activeTicket}
                  setActiveTicket={setActiveTicket}
                  ticketQrData={ticketQrData}
                  setTicketQrData={setTicketQrData}
                  refreshData={refreshData}
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
                <StandaloneStaffPage
                  tenantId={tenantId}
                  currentUser={currentUser}
                  analytics={analytics}
                  queueSnapshot={queueSnapshot}
                  servingTickets={servingTickets}
                  handleServeNext={handleServeNext}
                  handleCompleteTicket={handleCompleteTicket}
                  handleCounterChange={handleCounterChange}
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
                <StandaloneMLAdminPage tenantId={tenantId} />
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
                <StandaloneDatabaseInspectorPage />
              )
            )}

            {activePage === "kiosk" && (
              <StandaloneKioskPage
                tenantId={tenantId}
                servingTickets={servingTickets}
                queueSnapshot={queueSnapshot}
                kioskQrData={kioskQrData}
              />
            )}
          </>
        )}
      </main>

      {/* AUTH MODAL OVERLAY */}
      {showAuthModal && (
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(user) => {
            handleLoginSuccess(user);
            if (user.role === "admin") {
              navigateTo("staff");
            } else {
              navigateTo("patient");
            }
          }}
        />
      )}

      {/* Floating Glassmorphism Plugin Widget */}
      <QueuePluginWidget tenantId={tenantId} domainKey="hospital" />
    </div>
  );
}

// ===========================================================================
// AUTHENTICATION MODAL (Signup & Login)
// ===========================================================================
function AuthModal({ authMode, setAuthMode, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // "user" (consumer) | "admin"
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const endpoint = authMode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/signup";
    const payload =
      authMode === "login"
        ? { email, password }
        : { email, username, password, role };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === "success") {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.detail || "Authentication failed. Please check credentials.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(`Server connection error: ${err.message}`);
    }
  };

  const handleQuickLogin = (demoRole) => {
    if (demoRole === "admin") {
      setEmail("admin@hospital.com");
      setPassword("admin123");
    } else {
      setEmail("patient@hospital.com");
      setPassword("user123");
    }
  };

  return (
    <div style={modalBackdropStyle}>
      <div style={modalCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "22px", color: "#f8fafc" }}>
            {authMode === "login" ? "🔐 Login to Account" : "📝 Create Account"}
          </h2>
          <button onClick={onClose} style={modalCloseBtnStyle}>✕</button>
        </div>

        {/* Auth Mode Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "#0f172a", padding: "4px", borderRadius: "10px" }}>
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            style={modalTabBtnStyle(authMode === "login")}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("signup")}
            style={modalTabBtnStyle(authMode === "signup")}
          >
            Register Signup
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={fieldLabelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="user@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={fieldInputStyle}
            />
          </div>

          {authMode === "signup" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={fieldLabelStyle}>Full Name / Display Name</label>
              <input
                type="text"
                placeholder="Dr. Sarah / Patient John"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={fieldInputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={fieldLabelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={fieldInputStyle}
            />
          </div>

          {authMode === "signup" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={fieldLabelStyle}>Select Account Role</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  style={roleOptionBtnStyle(role === "user", "#38bdf8")}
                >
                  📱 Patient / Consumer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  style={roleOptionBtnStyle(role === "admin", "#c084fc")}
                >
                  🛡️ Staff / Doctor Admin
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={modalSubmitBtnStyle}>
            {loading ? "Authenticating..." : authMode === "login" ? "🚀 Login Now" : "🎉 Register Account"}
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: "14px", padding: "10px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#f87171", fontSize: "12px", textAlign: "center" }}>
            {errorMsg}
          </div>
        )}

        {/* Demo Quick Logins */}
        <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #334155", textAlign: "center" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "8px" }}>Quick Demo Credentials:</span>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button type="button" onClick={() => handleQuickLogin("admin")} style={quickBtnStyle}>
              🛡️ Quick Staff Admin Login
            </button>
            <button type="button" onClick={() => handleQuickLogin("user")} style={quickBtnStyle}>
              📱 Quick Consumer Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// MANDATORY AUTHENTICATION SCREEN (Rendered when no user is logged in)
// ===========================================================================
function MandatoryAuthScreen({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const endpoint = authMode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/signup";
    const payload =
      authMode === "login"
        ? { email, password }
        : { email, username, password, role };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === "success") {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.detail || "Authentication failed. Please check credentials.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(`Server connection error: ${err.message}`);
    }
  };

  const handleQuickLogin = (demoRole) => {
    if (demoRole === "admin") {
      setEmail("admin@hospital.com");
      setPassword("admin123");
    } else {
      setEmail("patient@hospital.com");
      setPassword("user123");
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "40px auto", textAlign: "center" }}>
      <div style={standaloneCardStyle}>
        <div style={{ fontSize: "44px", marginBottom: "12px" }}>🔐</div>
        <h2 style={{ margin: "0 0 8px 0", color: "#f8fafc", fontSize: "24px", fontWeight: 800 }}>
          Authentication Required
        </h2>
        <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
          Welcome to City General Hospital AI Queue System. Authentication is necessary to access portal features.
        </p>

        {/* Auth Mode Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "#0f172a", padding: "4px", borderRadius: "10px" }}>
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            style={modalTabBtnStyle(authMode === "login")}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("signup")}
            style={modalTabBtnStyle(authMode === "signup")}
          >
            Register Account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={fieldLabelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="user@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={fieldInputStyle}
            />
          </div>

          {authMode === "signup" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={fieldLabelStyle}>Full Name / Display Name</label>
              <input
                type="text"
                placeholder="Dr. Sarah / Patient John"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={fieldInputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={fieldLabelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={fieldInputStyle}
            />
          </div>

          {authMode === "signup" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={fieldLabelStyle}>Select Account Role</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  style={roleOptionBtnStyle(role === "user", "#38bdf8")}
                >
                  📱 Patient / Consumer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  style={roleOptionBtnStyle(role === "admin", "#c084fc")}
                >
                  🛡️ Staff / Doctor Admin
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={modalSubmitBtnStyle}>
            {loading ? "Authenticating..." : authMode === "login" ? "🚀 Sign In & Enter" : "🎉 Register Account"}
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: "14px", padding: "10px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#f87171", fontSize: "12px", textAlign: "center" }}>
            {errorMsg}
          </div>
        )}

        {/* Demo Quick Logins */}
        <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #334155", textAlign: "center" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "8px" }}>Quick Demo 1-Click Login:</span>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button type="button" onClick={() => handleQuickLogin("admin")} style={quickBtnStyle}>
              🛡️ Quick Staff Admin Login
            </button>
            <button type="button" onClick={() => handleQuickLogin("user")} style={quickBtnStyle}>
              📱 Quick Consumer Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STRICT ACCESS DENIED SHIELD (Protects Admin Pages & Consumer Pages)
// ===========================================================================
function AccessDeniedGuard({ requiredRole, pageName, currentUser, onLoginSuccess, navigateTo }) {
  const isTargetAdmin = requiredRole === "admin";
  const titleText = isTargetAdmin ? "Access Denied — Admin Required" : "Access Restricted — Consumer Portal Only";
  const bodyText = isTargetAdmin
    ? `The ${pageName} is strictly protected for Hospital Staff and Doctor Admins. As a Consumer/Patient user, you cannot view or access administrative desk controls.`
    : `The ${pageName} is designated for Consumer/Patient check-in. Staff Admin accounts cannot access or check in via the Patient Portal.`;

  return (
    <div style={{ maxWidth: "550px", margin: "40px auto", textAlign: "center" }}>
      <div style={standaloneCardStyle}>
        <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>⛔</span>
        <h2 style={{ margin: "0 0 10px 0", color: "#f87171", fontSize: "24px" }}>
          {titleText}
        </h2>
        <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
          {bodyText}
        </p>

        {currentUser ? (
          <div style={{ padding: "14px", borderRadius: "10px", background: "#0f172a", border: "1px solid #334155", marginBottom: "20px" }}>
            <p style={{ margin: "0 0 10px 0", color: "#94a3b8", fontSize: "13px" }}>
              Currently logged in as: <strong style={{ color: currentUser.role === "admin" ? "#c084fc" : "#38bdf8" }}>{currentUser.username} ({currentUser.email})</strong> — Role: <span style={{ color: currentUser.role === "admin" ? "#c084fc" : "#f87171", fontWeight: 700 }}>{currentUser.role === "admin" ? "Staff Admin" : "Consumer Patient"}</span>.
            </p>
            {navigateTo && (
              <button
                onClick={() => navigateTo(currentUser.role === "admin" ? "staff" : "patient")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: currentUser.role === "admin"
                    ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                    : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {currentUser.role === "admin" ? "🛡️ Switch to Doctor Desk Dashboard" : "📱 Switch to Patient Check-in Portal"}
              </button>
            )}
          </div>
        ) : null}

        {isTargetAdmin && <AuthModalInline onLoginSuccess={onLoginSuccess} defaultRole="admin" />}
      </div>
    </div>
  );
}

// Inline Admin Login Component for Access Denied Shield
function AuthModalInline({ onLoginSuccess, defaultRole }) {
  const [email, setEmail] = useState("admin@hospital.com");
  const [password, setPassword] = useState("admin123");
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && data.status === "success") {
        if (data.user.role !== "admin") {
          setErrorMsg("Login failed: Account is not a Staff Admin.");
          return;
        }
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.detail || "Invalid Staff Admin credentials.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(`Server error: ${err.message}`);
    }
  };

  return (
    <div style={{ textAlign: "left", background: "#0f172a", padding: "18px", borderRadius: "12px", border: "1px solid #334155" }}>
      <h4 style={{ margin: "0 0 12px 0", color: "#c084fc", fontSize: "14px" }}>
        🛡️ Sign In with Staff Admin Credentials:
      </h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <label style={fieldLabelStyle}>Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={fieldInputStyle}
          />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={fieldLabelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={fieldInputStyle}
          />
        </div>
        <button type="submit" disabled={loading} style={primaryBtnStyle}>
          {loading ? "Verifying..." : "🔑 Authenticate as Staff Admin"}
        </button>
      </form>
      {errorMsg && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "10px", margin: 0 }}>{errorMsg}</p>}
    </div>
  );
}

// ===========================================================================
// 0. LANDING LAUNCHPAD HUB (Switch to any standalone page)
// ===========================================================================
function HospitalHubPage({ navigateTo, currentUser }) {
  const isAdmin = currentUser && currentUser.role === "admin";
  const isConsumer = currentUser && currentUser.role === "user";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 0" }}>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#f8fafc", margin: "0 0 10px 0" }}>
          🏥 City Hospital — Portal Launchpad
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 12px 0" }}>
          {isAdmin
            ? "🛡️ Logged in as Staff Admin — Full access to Doctor Desk, ML Studio, and Waiting Room Kiosk."
            : "📱 Logged in as Consumer Patient — Full access to Patient Check-in and Waiting Room Kiosk."}
        </p>
        {isConsumer && (
          <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: "20px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid #0284c7", color: "#38bdf8", fontSize: "12px", fontWeight: 600 }}>
            ℹ️ Admin pages (Doctor Desk & ML Studio) are hidden from Consumer accounts.
          </div>
        )}
        {isAdmin && (
          <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: "20px", background: "rgba(192, 132, 252, 0.15)", border: "1px solid #a855f7", color: "#c084fc", fontSize: "12px", fontWeight: 600 }}>
            ℹ️ Consumer Check-in page is hidden from Staff Admin accounts.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Patient Portal Card (Only for Consumer) */}
        {isConsumer ? (
          <div style={hubCardStyle} onClick={() => navigateTo("patient")}>
            <div style={hubIconStyle}>📱</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#38bdf8", fontSize: "20px" }}>
              1. Patient Check-in Portal (Consumer)
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>
              Standalone mobile/kiosk check-in page for patients. Department selection, triage emergency toggle, position countdown, audio chimes, and digital QR ticket pass.
            </p>
          </div>
        ) : (
          <div style={{ ...hubCardStyle, opacity: 0.5, cursor: "not-allowed" }}>
            <div style={hubIconStyle}>🔒</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "20px" }}>
                1. Patient Check-in Portal (Consumer)
              </h3>
              <span style={{ padding: "4px 8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", fontSize: "10px", fontWeight: 700 }}>
                CONSUMER ONLY (RESTRICTED)
              </span>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
              Patient check-in portal is restricted to Consumer accounts and not accessible by Staff Admin accounts.
            </p>
          </div>
        )}

        {/* Doctor & Staff Desk Card (Only for Admin) */}
        {isAdmin ? (
          <div style={hubCardStyle} onClick={() => navigateTo("staff")}>
            <div style={hubIconStyle}>🛡️</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#4ade80", fontSize: "20px" }}>
                2. Doctor & Staff Desk Dashboard
              </h3>
              <span style={roleBadgeStyle(true)}>UNLOCKED</span>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>
              Standalone desk control panel for doctors & nurses. Active counter adjusters, <strong>Call Next Priority Ticket</strong>, now-serving monitor, and live queue line.
            </p>
          </div>
        ) : (
          <div style={{ ...hubCardStyle, opacity: 0.5, cursor: "not-allowed" }}>
            <div style={hubIconStyle}>🔒</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "20px" }}>
                2. Doctor & Staff Desk Dashboard
              </h3>
              <span style={{ padding: "4px 8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", fontSize: "10px", fontWeight: 700 }}>
                ADMIN ONLY (RESTRICTED)
              </span>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
              Staff desk control panel is restricted to Staff Admin accounts and not accessible by Consumer accounts.
            </p>
          </div>
        )}

        {/* ML Studio & Dataset Trainer Card (Only for Admin) */}
        {isAdmin ? (
          <div style={hubCardStyle} onClick={() => navigateTo("admin")}>
            <div style={hubIconStyle}>📊</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#c084fc", fontSize: "20px" }}>
                3. Hospital ML Studio & Training
              </h3>
              <span style={roleBadgeStyle(true)}>UNLOCKED</span>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>
              Standalone dataset ingestion & AI training studio. Upload historical hospital CSV/Excel files, column auto-mapping badges, and multi-model ensemble trainer.
            </p>
          </div>
        ) : (
          <div style={{ ...hubCardStyle, opacity: 0.5, cursor: "not-allowed" }}>
            <div style={hubIconStyle}>🔒</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "20px" }}>
                3. Hospital ML Studio & Training
              </h3>
              <span style={{ padding: "4px 8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", fontSize: "10px", fontWeight: 700 }}>
                ADMIN ONLY (RESTRICTED)
              </span>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
              AI training studio is restricted to Staff Admin accounts and not accessible by Consumer accounts.
            </p>
          </div>
        )}

        {/* Waiting Room Kiosk TV Card */}
        <div style={hubCardStyle} onClick={() => navigateTo("kiosk")}>
          <div style={hubIconStyle}>📺</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#f59e0b", fontSize: "20px" }}>
            4. Waiting Room Kiosk TV Display
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>
            Full-screen waiting room monitor display. Displays huge now-serving ticket numbers, assigned doctor desks, and big scannable QR code poster.
          </p>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 1. STANDALONE PATIENT CHECK-IN PORTAL (Consumer View)
// ===========================================================================
function StandalonePatientPage({
  tenantId,
  currentUser,
  activeTicket,
  setActiveTicket,
  ticketQrData,
  setTicketQrData,
  refreshData,
}) {
  const [name, setName] = useState(currentUser ? currentUser.username : "");
  const [category, setCategory] = useState("consultation");
  const [priority, setPriority] = useState(2);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (currentUser) setName(currentUser.username);
  }, [currentUser]);

  const handleJoinQueue = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStatusMsg("Issuing your AI priority ticket...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/queue/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          consumer_type: "hospital",
          service_category: category,
          name: name,
          priority_level: Number(priority),
          user_email: currentUser ? currentUser.email : "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const t = data.ticket;
        setActiveTicket(t);
        setStatusMsg(`✓ Ticket #${t.ticket_id} Issued Successfully!`);

        // Fetch Ticket QR Code
        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${t.ticket_id}`)
          .then((r) => r.json())
          .then((qr) => setTicketQrData(qr))
          .catch((e) => console.log("QR error:", e));

        refreshData();
      } else {
        const err = await res.json();
        setStatusMsg(`❌ Error: ${err.detail}`);
      }
    } catch (err) {
      setStatusMsg(`❌ Join failed: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      {currentUser && currentUser.role === "admin" && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(192, 132, 252, 0.15)", border: "1px solid #a855f7", color: "#c084fc", fontSize: "12px", marginBottom: "16px", textAlign: "center" }}>
          💡 <strong>Staff Admin Mode:</strong> You are logged in as Staff Admin (<em>{currentUser.username}</em>). Test patient check-ins created here will enter the live queue line.
        </div>
      )}

      <div style={standaloneCardStyle}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "42px", display: "block", marginBottom: "8px" }}>📱</span>
          <h2 style={{ margin: "0 0 6px 0", fontSize: "24px", color: "#f8fafc" }}>
            Patient Self-Checkin Kiosk
          </h2>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
            City General Hospital — Instant Queue Token & Live Wait Tracker
          </p>
        </div>

        <form onSubmit={handleJoinQueue}>
          <div style={{ marginBottom: "18px" }}>
            <label style={fieldLabelStyle}>Patient Full Name / Reg #</label>
            <input
              type="text"
              placeholder="e.g. Sarah Jenkins / Reg #809"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={fieldInputStyle}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={fieldLabelStyle}>Medical Department</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={fieldInputStyle}
            >
              {HOSPITAL_CONFIG.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={fieldLabelStyle}>Urgency / Triage Level</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setPriority(2)}
                style={triageBtnStyle(priority === 2, "#38bdf8")}
              >
                📋 Routine Consultation
                <span style={{ display: "block", fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>Standard Queue Order</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority(1)}
                style={triageBtnStyle(priority === 1, "#ef4444")}
              >
                🚨 Emergency Triage
                <span style={{ display: "block", fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>Priority Queue Jump</span>
              </button>
            </div>
          </div>

          <button type="submit" style={patientSubmitBtnStyle}>
            🎫 Get AI Ticket Token
          </button>
        </form>

        {statusMsg && (
          <div style={{ marginTop: "16px", padding: "12px", borderRadius: "10px", background: "#0f172a", border: "1px solid #334155", color: "#cbd5e1", fontSize: "13px", textAlign: "center" }}>
            {statusMsg}
          </div>
        )}
      </div>

      {/* Digital Ticket Pass */}
      {activeTicket && (
        <div style={{ ...standaloneCardStyle, marginTop: "24px", border: "2px solid #38bdf8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "14px", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>Your AI Token</span>
              <h2 style={{ margin: 0, fontSize: "32px", color: "#38bdf8", fontWeight: 800 }}>
                #{activeTicket.ticket_id}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Current Status</span>
              <span style={passStatusBadgeStyle(activeTicket.status)}>{activeTicket.status.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Patient Name</span>
              <p style={{ margin: "2px 0 0 0", color: "#f8fafc", fontWeight: 700, fontSize: "15px" }}>{activeTicket.name}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Department</span>
              <p style={{ margin: "2px 0 0 0", color: "#38bdf8", fontWeight: 700, fontSize: "15px" }}>{activeTicket.service_category.toUpperCase()}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Queue Position</span>
              <p style={{ margin: "2px 0 0 0", color: "#f59e0b", fontWeight: 800, fontSize: "24px" }}>
                #{activeTicket.position}
              </p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Estimated Wait</span>
              <p style={{ margin: "2px 0 0 0", color: "#4ade80", fontWeight: 800, fontSize: "24px" }}>
                {activeTicket.estimated_wait_minutes} min
              </p>
            </div>
          </div>

          {ticketQrData && (
            <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "18px" }}>
              <img
                src={ticketQrData.qr_code_base64}
                alt="Ticket QR Code"
                style={{ width: "150px", height: "150px", borderRadius: "12px", background: "#fff", padding: "8px" }}
              />
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Keep this screen open or scan code at desk scanner when called
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// 2. STANDALONE DOCTOR & STAFF DESK DASHBOARD (Admin Only)
// ===========================================================================
function StandaloneStaffPage({
  tenantId,
  currentUser,
  analytics,
  queueSnapshot,
  servingTickets,
  handleServeNext,
  handleCompleteTicket,
  handleCounterChange,
}) {
  const [reservedSlots, setReservedSlots] = React.useState([]);
  const [apptHistory, setApptHistory] = React.useState([]);

  const adminDept = currentUser && currentUser.department
    ? currentUser.department.toLowerCase()
    : "all";

  const fetchAppointments = React.useCallback(() => {
    const deptParam = adminDept && adminDept !== "all"
      ? `department=${encodeURIComponent(adminDept)}&`
      : "";

    // Reserved Slots: only active appointments (scheduled / checked_in)
    fetch(`${API_BASE}/api/v1/plugin/appointments/tenant/${tenantId}?${deptParam}active_only=true`)
      .then((r) => r.json())
      .then((d) => setReservedSlots(d.appointments || []))
      .catch((e) => console.log("Reserved slots error:", e));

    // History: all appointments so we can show completed/cancelled below
    fetch(`${API_BASE}/api/v1/plugin/appointments/tenant/${tenantId}?${deptParam}active_only=false`)
      .then((r) => r.json())
      .then((d) => {
        const hist = (d.appointments || []).filter(
          (a) => !["scheduled", "checked_in"].includes(a.status)
        );
        setApptHistory(hist);
      })
      .catch((e) => console.log("Appt history error:", e));
  }, [tenantId, adminDept]);

  React.useEffect(() => {
    fetchAppointments();
    const iv = setInterval(fetchAppointments, 5000);
    return () => clearInterval(iv);
  }, [fetchAppointments]);

  const deptLabel = adminDept === "all" ? "ALL DEPARTMENTS" : adminDept.toUpperCase();

  const apptBadgeStyle = (status) => {
    const map = {
      scheduled:   { bg: "rgba(56,189,248,0.15)",  color: "#38bdf8", border: "#0284c7" },
      checked_in:  { bg: "rgba(74,222,128,0.15)",  color: "#4ade80", border: "#16a34a" },
      serving:     { bg: "rgba(251,191,36,0.15)",   color: "#fbbf24", border: "#d97706" },
      completed:   { bg: "rgba(192,132,252,0.15)", color: "#c084fc", border: "#a855f7" },
      cancelled:   { bg: "rgba(239,68,68,0.15)",   color: "#f87171", border: "#ef4444" },
      no_show:     { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "#475569" },
      transferred: { bg: "rgba(251,146,60,0.15)",  color: "#fb923c", border: "#ea580c" },
    };
    const c = map[status] || map.no_show;
    return { display:"inline-block", padding:"2px 8px", borderRadius:"8px",
             background:c.bg, color:c.color, border:`1px solid ${c.border}`,
             fontSize:"11px", fontWeight:700, textTransform:"uppercase" };
  };

  return (
    <div>
      {/* Department isolation banner */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 16px",
                    borderRadius:"10px", marginBottom:"20px",
                    background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.25)" }}>
        <span style={{ fontSize:"18px" }}>🛡️</span>
        <div>
          <strong style={{ color:"#4ade80", fontSize:"13px" }}>
            Department Isolation: <span style={{ color:"#f8fafc" }}>{deptLabel}</span>
          </strong>
          <span style={{ display:"block", fontSize:"11px", color:"#94a3b8" }}>
            {adminDept === "all"
              ? "Super Admin — viewing all department data."
              : `Strict boundary — queue, stats & appointments scoped to ${deptLabel} only.`}
          </span>
        </div>
      </div>

      {/* Analytics Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"24px" }}>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize:"12px", color:"#94a3b8", fontWeight:600 }}>Patients Waiting</span>
          <h2 style={{ fontSize:"32px", fontWeight:800, color:"#38bdf8", margin:"4px 0" }}>
            {analytics ? analytics.currently_waiting : 0}
          </h2>
          <span style={{ fontSize:"11px", color:"#64748b" }}>In {deptLabel} Queue</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize:"12px", color:"#94a3b8", fontWeight:600 }}>Currently Serving</span>
          <h2 style={{ fontSize:"32px", fontWeight:800, color:"#4ade80", margin:"4px 0" }}>
            {analytics ? analytics.currently_serving : 0}
          </h2>
          <span style={{ fontSize:"11px", color:"#64748b" }}>At {deptLabel} Desks</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize:"12px", color:"#94a3b8", fontWeight:600 }}>Completed Today</span>
          <h2 style={{ fontSize:"32px", fontWeight:800, color:"#c084fc", margin:"4px 0" }}>
            {analytics ? analytics.total_completed : 0}
          </h2>
          <span style={{ fontSize:"11px", color:"#64748b" }}>{deptLabel} Patients</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize:"12px", color:"#94a3b8", fontWeight:600 }}>Active Desks</span>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginTop:"4px" }}>
            <h2 style={{ fontSize:"32px", fontWeight:800, color:"#f59e0b", margin:0 }}>
              {analytics ? analytics.active_counters : 2}
            </h2>
            <div style={{ display:"flex", gap:"6px" }}>
              <button onClick={() => handleCounterChange(-1)} style={plusMinusBtnStyle}>-</button>
              <button onClick={() => handleCounterChange(1)} style={plusMinusBtnStyle}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Serving + Waiting Queue */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px", marginBottom:"24px" }}>
        <div style={standaloneCardStyle}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px" }}>
            <div>
              <h3 style={{ margin:0, fontSize:"20px", color:"#f8fafc" }}>🛡️ {deptLabel} Desk</h3>
              <span style={{ fontSize:"12px", color:"#94a3b8" }}>Department Priority Call Control</span>
            </div>
            <button onClick={handleServeNext} style={callPriorityBtnStyle}>
              🚨 Call Next {deptLabel} Ticket
            </button>
          </div>
          <h4 style={{ margin:"0 0 12px 0", color:"#cbd5e1", fontSize:"13px" }}>Now Serving:</h4>
          {servingTickets.length === 0 ? (
            <div style={{ padding:"30px", textAlign:"center", background:"#0f172a", borderRadius:"12px",
                          border:"1px solid #334155", color:"#64748b", fontSize:"13px" }}>
              No patients currently at {deptLabel} desks.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {servingTickets.map((t) => (
                <div key={t.ticket_id} style={staffServingRowStyle}>
                  <div>
                    <span style={{ fontSize:"20px", fontWeight:800, color:"#4ade80" }}>#{t.ticket_id}</span>
                    <span style={{ marginLeft:"12px", color:"#f8fafc", fontWeight:700, fontSize:"15px" }}>{t.name}</span>
                    <span style={{ marginLeft:"10px", fontSize:"11px", color:"#38bdf8" }}>({t.service_category.toUpperCase()})</span>
                  </div>
                  <button onClick={() => handleCompleteTicket(t.ticket_id)} style={finishBtnStyle}>
                    ✓ Mark Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={standaloneCardStyle}>
          <h3 style={{ margin:"0 0 16px 0", fontSize:"20px", color:"#f8fafc" }}>
            📊 {deptLabel} Waiting Line ({queueSnapshot.length})
          </h3>
          <div style={{ overflowX:"auto" }}>
            <table style={staffTableStyle}>
              <thead>
                <tr>
                  <th style={staffThStyle}>Pos</th>
                  <th style={staffThStyle}>Token ID</th>
                  <th style={staffThStyle}>Patient Name</th>
                  <th style={staffThStyle}>Dept</th>
                  <th style={staffThStyle}>Triage</th>
                  <th style={staffThStyle}>Est Wait</th>
                </tr>
              </thead>
              <tbody>
                {queueSnapshot.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ ...staffTdStyle, textAlign:"center", color:"#64748b" }}>
                      {deptLabel} waiting queue is empty.
                    </td>
                  </tr>
                ) : (
                  queueSnapshot.map((t) => (
                    <tr key={t.ticket_id}>
                      <td style={staffTdStyle}>#{t.position}</td>
                      <td style={{ ...staffTdStyle, fontWeight:800, color:"#38bdf8" }}>#{t.ticket_id}</td>
                      <td style={{ ...staffTdStyle, fontWeight:600 }}>{t.name}</td>
                      <td style={staffTdStyle}>{t.service_category}</td>
                      <td style={staffTdStyle}>
                        {t.priority_level === 1
                          ? <span style={badgePrioStyle("#ef4444")}>🚨 Emergency</span>
                          : <span style={badgePrioStyle("#3b82f6")}>📋 Routine</span>}
                      </td>
                      <td style={{ ...staffTdStyle, fontWeight:800, color:"#4ade80" }}>{t.estimated_wait_minutes} min</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Reserved Slots (ACTIVE ONLY: scheduled + checked_in) ── */}
      <div style={{ ...standaloneCardStyle, marginBottom:"24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
          <div>
            <h3 style={{ margin:0, fontSize:"20px", color:"#f8fafc" }}>
              📅 Reserved Slots — {deptLabel} ({reservedSlots.length})
            </h3>
            <span style={{ fontSize:"12px", color:"#94a3b8" }}>
              Active upcoming appointments only. Completed &amp; cancelled are excluded here.
            </span>
          </div>
          <button onClick={fetchAppointments} style={finishBtnStyle}>↻ Refresh</button>
        </div>
        {reservedSlots.length === 0 ? (
          <div style={{ padding:"30px", textAlign:"center", background:"#0f172a", borderRadius:"12px",
                        border:"1px solid #334155", color:"#64748b", fontSize:"13px" }}>
            No active reserved slots for {deptLabel}. All appointments have been completed or cancelled.
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={staffTableStyle}>
              <thead>
                <tr>
                  <th style={staffThStyle}>Appt Code</th>
                  <th style={staffThStyle}>Patient</th>
                  <th style={staffThStyle}>Dept</th>
                  <th style={staffThStyle}>Reserved Slot</th>
                  <th style={staffThStyle}>Status</th>
                  <th style={staffThStyle}>Merged Token</th>
                </tr>
              </thead>
              <tbody>
                {reservedSlots.map((apt) => (
                  <tr key={apt.appointment_id}>
                    <td style={{ ...staffTdStyle, fontWeight:800, color:"#38bdf8" }}>{apt.appointment_id}</td>
                    <td style={{ ...staffTdStyle, fontWeight:700 }}>{apt.patient_name}</td>
                    <td style={{ ...staffTdStyle, color:"#94a3b8" }}>{apt.service_category.toUpperCase()}</td>
                    <td style={{ ...staffTdStyle, color:"#f59e0b" }}>{apt.appointment_date} @ {apt.time_slot}</td>
                    <td style={staffTdStyle}><span style={apptBadgeStyle(apt.status)}>{apt.status}</span></td>
                    <td style={{ ...staffTdStyle, color:"#4ade80", fontWeight:800 }}>
                      {apt.ticket_id ? `#${apt.ticket_id}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Appointment History (completed, cancelled, etc.) ── */}
      {apptHistory.length > 0 && (
        <div style={standaloneCardStyle}>
          <div style={{ marginBottom:"16px" }}>
            <h3 style={{ margin:0, fontSize:"20px", color:"#f8fafc" }}>
              📋 Appointment History — {deptLabel} ({apptHistory.length})
            </h3>
            <span style={{ fontSize:"12px", color:"#94a3b8" }}>
              Completed, cancelled, transferred, and no-show records.
            </span>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={staffTableStyle}>
              <thead>
                <tr>
                  <th style={staffThStyle}>Appt Code</th>
                  <th style={staffThStyle}>Patient</th>
                  <th style={staffThStyle}>Dept</th>
                  <th style={staffThStyle}>Slot</th>
                  <th style={staffThStyle}>Final Status</th>
                  <th style={staffThStyle}>Merged Token</th>
                </tr>
              </thead>
              <tbody>
                {apptHistory.map((apt) => (
                  <tr key={apt.appointment_id}>
                    <td style={{ ...staffTdStyle, fontWeight:800, color:"#64748b" }}>{apt.appointment_id}</td>
                    <td style={{ ...staffTdStyle, fontWeight:700 }}>{apt.patient_name}</td>
                    <td style={{ ...staffTdStyle, color:"#94a3b8" }}>{apt.service_category.toUpperCase()}</td>
                    <td style={{ ...staffTdStyle, color:"#64748b" }}>{apt.appointment_date} @ {apt.time_slot}</td>
                    <td style={staffTdStyle}><span style={apptBadgeStyle(apt.status)}>{apt.status}</span></td>
                    <td style={{ ...staffTdStyle, color:"#64748b" }}>{apt.ticket_id ? `#${apt.ticket_id}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// 3. STANDALONE HOSPITAL ML DATA STUDIO & TRAINING (Admin Only)
// ===========================================================================
function StandaloneMLAdminPage({ tenantId }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [statusMsg, setStatusMsg] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const fetchModelStatus = useCallback(() => {
    fetch(`${API_BASE}/api/v1/plugin/model-status/${tenantId}`)
      .then((r) => r.json())
      .then((d) => setModelStatus(d))
      .catch((e) => console.log("Model status error:", e));
  }, [tenantId]);

  useEffect(() => {
    fetchModelStatus();
  }, [fetchModelStatus]);

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);

    const formData = new FormData();
    formData.append("file", selected);
    formData.append("tenant_id", tenantId);

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/historical-data/preview`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setMapping(data.suggested_mapping || {});
      } else {
        const err = await res.json();
        alert(`File error: ${err.detail}`);
      }
    } catch (e) {
      console.log("Preview error:", e);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setIsUploading(true);
    setStatusMsg("Parsing and storing records into SQLite database...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tenant_id", tenantId);
    formData.append("mapping_json", JSON.stringify(mapping));

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/historical-data/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setIsUploading(false);
      if (res.ok) {
        setStatusMsg(`✓ ${data.message}`);
        fetchModelStatus();
      } else {
        setStatusMsg(`❌ ${data.message || data.detail}`);
      }
    } catch (e) {
      setIsUploading(false);
      setStatusMsg(`❌ Import failed: ${e.message}`);
    }
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    setStatusMsg("Evaluating multi-model ensemble (ExtraTrees, RandomForest, HistGradientBoosting)...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/historical-data/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const data = await res.json();
      setIsTraining(false);
      if (data.success === false) {
        setStatusMsg(`⚠️ ${data.message}`);
      } else {
        setStatusMsg(`🎉 Trained! Winner: ${data.model_type} (MAE: ${data.mae} min | R²: ${data.r2})`);
        fetchModelStatus();
      }
    } catch (e) {
      setIsTraining(false);
      setStatusMsg(`❌ Training failed: ${e.message}`);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      <div style={standaloneCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "20px", color: "#f8fafc" }}>
              📊 Hospital Historical Dataset Ingestion
            </h3>
            <span style={{ fontSize: "12px", color: "#c084fc" }}>Automatic Standardization Layer</span>
          </div>
        </div>

        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileSelect}
          style={fileDropStyle}
        />

        {previewData && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Auto-Detected Column Standardization Badges:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {previewData.detected_columns.map((col) => (
                  <span key={col} style={colBadgeStyle}>
                    ✓ {col}
                  </span>
                ))}
              </div>
            </div>

            <div style={valSummaryStyle}>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#f8fafc" }}>Validation Breakdown</h4>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>✓ {previewData.validation_summary.valid_rows} Valid Rows</span>
                <span style={{ color: "#f87171", fontWeight: 700 }}>❌ {previewData.validation_summary.rejected_rows} Rejected</span>
                <span style={{ color: "#94a3b8" }}>Total: {previewData.validation_summary.total_rows}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleConfirmImport} disabled={isUploading} style={importBtnStyle}>
                {isUploading ? "Storing..." : "📥 Confirm Import to SQLite"}
              </button>
              <button onClick={handleTrainModel} disabled={isTraining} style={trainBtnStyle}>
                {isTraining ? "Training..." : "🚀 Train AI Model Now"}
              </button>
            </div>
          </div>
        )}

        {statusMsg && <div style={mlStatusBoxStyle}>{statusMsg}</div>}
      </div>

      <div style={standaloneCardStyle}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#f8fafc" }}>
          🤖 Active Hospital AI Model Registry
        </h3>

        {!modelStatus ? (
          <p style={{ color: "#94a3b8" }}>Loading AI model status...</p>
        ) : (
          <div style={modelRegBoxStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>Active Model Scope</span>
                <h3 style={{ margin: 0, fontSize: "22px", color: modelStatus.is_tenant_specific ? "#c084fc" : "#38bdf8", fontWeight: 800 }}>
                  {modelStatus.active_model}
                </h3>
              </div>
              <span style={modelScopeTagStyle(modelStatus.is_tenant_specific)}>
                {modelStatus.is_tenant_specific ? "HOSPITAL CUSTOM MODEL" : "GLOBAL BASELINE"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div style={modelMetricBoxStyle}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Winning Algorithm</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#f8fafc", fontSize: "14px" }}>{modelStatus.model_type || "ExtraTrees"}</p>
              </div>
              <div style={modelMetricBoxStyle}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Mean Absolute Error</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#4ade80", fontSize: "14px" }}>{modelStatus.mae} minutes</p>
              </div>
              <div style={modelMetricBoxStyle}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>R² Accuracy Score</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#38bdf8", fontSize: "14px" }}>{modelStatus.r2}</p>
              </div>
              <div style={modelMetricBoxStyle}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Historical Training Rows</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#f59e0b", fontSize: "14px" }}>{modelStatus.training_rows} rows</p>
              </div>
            </div>

            {modelStatus.top_features && (
              <div>
                <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Top Model Feature Importance Weights:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {Object.entries(modelStatus.top_features).slice(0, 5).map(([feat, val]) => (
                    <div key={feat} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#cbd5e1" }}>
                      <span>{feat}</span>
                      <span style={{ fontWeight: 700, color: "#c084fc" }}>{(val * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// 4. STANDALONE WAITING ROOM KIOSK TV DISPLAY
// ===========================================================================
function StandaloneKioskPage({ tenantId, servingTickets, queueSnapshot, kioskQrData }) {
  return (
    <div style={{ minHeight: "80vh", padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#f8fafc", margin: "0 0 6px 0" }}>
          📺 Waiting Room Kiosk TV Banner
        </h1>
        <p style={{ color: "#38bdf8", fontSize: "16px", margin: 0, fontWeight: 600 }}>
          City General Hospital — Live Counter Display
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <div style={kioskServingBoxStyle}>
          <h2 style={{ margin: "0 0 20px 0", color: "#4ade80", fontSize: "28px" }}>
            🔔 NOW SERVING AT DOCTOR DESKS
          </h2>

          {servingTickets.length === 0 ? (
            <div style={{ padding: "60px 20px", color: "#64748b", fontSize: "20px", fontWeight: 700 }}>
              Please wait... Next token calling shortly.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {servingTickets.map((t) => (
                <div key={t.ticket_id} style={bigTokenBoxStyle}>
                  <span style={{ fontSize: "14px", color: "#94a3b8", textTransform: "uppercase" }}>Ticket Token</span>
                  <h1 style={{ margin: "4px 0", fontSize: "48px", color: "#4ade80", fontWeight: 900 }}>
                    #{t.ticket_id}
                  </h1>
                  <span style={{ fontSize: "16px", color: "#f8fafc", fontWeight: 700 }}>{t.name}</span>
                  <span style={{ fontSize: "13px", color: "#38bdf8", marginTop: "4px" }}>{t.service_category.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={kioskQrBoxStyle}>
          <h3 style={{ margin: "0 0 12px 0", color: "#f8fafc", fontSize: "20px" }}>
            📲 Scan for Mobile Token
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 16px 0" }}>
            Point your smartphone camera to join queue on mobile
          </p>

          {kioskQrData ? (
            <img
              src={kioskQrData.qr_code_base64}
              alt="Kiosk QR Poster"
              style={{ width: "220px", height: "220px", borderRadius: "14px", background: "#fff", padding: "12px" }}
            />
          ) : (
            <p style={{ color: "#64748b" }}>Generating QR...</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 5. STANDALONE SQLITE DATABASE INSPECTOR (Admin Only)
// ===========================================================================
function StandaloneDatabaseInspectorPage() {
  const [dbData, setDbData] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchDbOverview = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/v1/admin/db-overview`)
      .then((r) => r.json())
      .then((res) => {
        setLoading(false);
        if (res.status === "success") {
          setDbData(res.database);
          if (res.db_info) setDbInfo(res.db_info);
          if (res.database && !res.database[activeTable]) {
            const firstTable = Object.keys(res.database)[0];
            if (firstTable) setActiveTable(firstTable);
          }
        } else {
          setErrorMsg("Failed to load database overview.");
        }
      })
      .catch((e) => {
        setLoading(false);
        setErrorMsg(`Connection error: ${e.message}`);
      });
  }, [activeTable]);

  useEffect(() => {
    fetchDbOverview();
  }, [fetchDbOverview]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
        <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>🗄️</span>
        Connecting to SQL Database & Loading tables...
      </div>
    );
  }

  if (errorMsg || !dbData) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
        <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>❌</span>
        {errorMsg || "Database not accessible."}
      </div>
    );
  }

  const tableNames = Object.keys(dbData);
  const currentTableData = dbData[activeTable] || { count: 0, schema: [], rows: [] };
  const rows = currentTableData.rows || [];
  const schema = currentTableData.schema || [];

  // Filter rows based on search term
  const filteredRows = rows.filter((row) => {
    if (!searchTerm.trim()) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const columns = schema.length > 0 ? schema.map((s) => s.name) : rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#f8fafc" }}>
              🗄️ Database Inspector
            </h2>
            {dbInfo && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  background: dbInfo.is_cloud ? "rgba(74, 222, 128, 0.2)" : "rgba(56, 189, 248, 0.2)",
                  color: dbInfo.is_cloud ? "#4ade80" : "#38bdf8",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: dbInfo.is_cloud ? "1px solid #22c55e" : "1px solid #0284c7",
                }}
              >
                {dbInfo.is_cloud ? "☁️ " : "📁 "} {dbInfo.db_type}
              </span>
            )}
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            Target Connection: <code style={{ color: "#38bdf8" }}>{dbInfo ? dbInfo.connection_url : "queue_system.db"}</code>
          </span>
        </div>

        <button onClick={fetchDbOverview} style={callPriorityBtnStyle}>
          🔄 Refresh DB Tables
        </button>
      </div>

      {/* Table Selector Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", overflowX: "auto", paddingBottom: "6px" }}>
        {tableNames.map((tName) => {
          const tInfo = dbData[tName];
          const active = activeTable === tName;
          return (
            <button
              key={tName}
              onClick={() => {
                setActiveTable(tName);
                setSearchTerm("");
              }}
              style={{
                padding: "10px 16px",
                borderRadius: "12px",
                border: active ? "2px solid #38bdf8" : "1px solid #334155",
                background: active ? "rgba(56, 189, 248, 0.15)" : "#0f172a",
                color: active ? "#38bdf8" : "#94a3b8",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
              }}
            >
              <span>📋 {tName}</span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: active ? "#0284c7" : "#334155",
                  color: "#fff",
                  fontSize: "11px",
                }}
              >
                {tInfo.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table Inspector Card */}
      <div style={standaloneCardStyle}>
        {/* Table Meta Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#4ade80", fontSize: "18px" }}>
              Table: <span style={{ color: "#f8fafc" }}>{activeTable}</span>
            </h3>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Total Records: <strong>{currentTableData.count}</strong> | Displaying Recent: <strong>{filteredRows.length}</strong>
            </span>
          </div>

          <input
            type="text"
            placeholder="🔍 Search across fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#f8fafc",
              fontSize: "12px",
              width: "240px",
            }}
          />
        </div>

        {/* Schema Breakdown Badges */}
        <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "10px", background: "#0f172a", border: "1px solid #334155" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
            PRAGMA Column Schema:
          </span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {schema.map((col) => (
              <span key={col.name} style={{ padding: "3px 8px", borderRadius: "6px", background: "rgba(192, 132, 252, 0.15)", color: "#c084fc", fontSize: "11px", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
                <code>{col.name}</code> <span style={{ color: "#94a3b8" }}>({col.type})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Data Table */}
        {filteredRows.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
            No records found in table <strong>{activeTable}</strong>.
          </div>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: "550px", overflowY: "auto" }}>
            <table style={staffTableStyle}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col} style={{ ...staffThStyle, sticky: "top", background: "#1e293b", zIndex: 2 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? "rgba(15, 23, 42, 0.4)" : "transparent" }}>
                    {columns.map((col) => {
                      const val = row[col];
                      const isJson = typeof val === "string" && (val.startsWith("{") || val.startsWith("["));
                      return (
                        <td key={col} style={staffTdStyle}>
                          {isJson ? (
                            <code style={{ fontSize: "10px", color: "#38bdf8", background: "#0f172a", padding: "2px 6px", borderRadius: "4px" }}>
                              {val}
                            </code>
                          ) : typeof val === "number" && String(val).includes(".") ? (
                            val.toFixed(2)
                          ) : (
                            String(val ?? "")
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// STYLES
// ===========================================================================
const appBgStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  color: "#f8fafc",
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  padding: "20px 28px",
};

const topHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  paddingBottom: "16px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
};

const logoTagStyle = {
  padding: "8px 14px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: "14px",
  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
};

const authTriggerBtnStyle = {
  padding: "7px 14px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(168, 85, 247, 0.4)",
};

const logoutBtnStyle = {
  padding: "4px 10px",
  borderRadius: "8px",
  border: "1px solid #475569",
  background: "transparent",
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const pageSelectStyle = {
  padding: "8px 14px",
  borderRadius: "10px",
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid #334155",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const connBadgeStyle = (online) => ({
  padding: "6px 12px",
  borderRadius: "20px",
  background: online ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
  color: online ? "#4ade80" : "#f87171",
  fontSize: "11px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const dotStyle = (online) => ({
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: online ? "#4ade80" : "#f87171",
});

const mainContentStyle = { minHeight: "75vh" };

const hubCardStyle = {
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(16px)",
  borderRadius: "18px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "28px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
};

const hubIconStyle = { fontSize: "36px", marginBottom: "12px" };

const roleBadgeStyle = (unlocked) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "10px",
  fontWeight: 800,
  background: unlocked ? "rgba(74, 222, 128, 0.2)" : "rgba(239, 68, 68, 0.2)",
  color: unlocked ? "#4ade80" : "#f87171",
});

const standaloneCardStyle = {
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(16px)",
  borderRadius: "18px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
};

const fieldLabelStyle = { display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "6px", fontWeight: 600 };

const fieldInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f8fafc",
  fontSize: "13px",
};

const triageBtnStyle = (active, accent) => ({
  padding: "12px",
  borderRadius: "10px",
  border: active ? `2px solid ${accent}` : "1px solid #334155",
  background: active ? `${accent}22` : "#0f172a",
  color: active ? accent : "#94a3b8",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
});

const patientSubmitBtnStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
};

const passStatusBadgeStyle = (status) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  background: status === "serving" ? "rgba(74, 222, 128, 0.2)" : "rgba(245, 158, 11, 0.2)",
  color: status === "serving" ? "#4ade80" : "#f59e0b",
});

const staffStatCardStyle = {
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(12px)",
  borderRadius: "14px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  padding: "18px",
};

const plusMinusBtnStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "6px",
  border: "none",
  background: "#334155",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const callPriorityBtnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.4)",
};

const staffServingRowStyle = {
  display: "flex",
  justify: "space-between",
  alignItems: "center",
  padding: "14px",
  background: "#0f172a",
  borderRadius: "12px",
  border: "1px solid #334155",
};

const finishBtnStyle = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "rgba(34, 197, 94, 0.2)",
  color: "#4ade80",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
};

const staffTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "12px" };
const staffThStyle = { padding: "10px", textAlign: "left", color: "#94a3b8", borderBottom: "1px solid #334155" };
const staffTdStyle = { padding: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" };
const badgePrioStyle = (bg) => ({
  padding: "2px 6px",
  borderRadius: "4px",
  background: `${bg}22`,
  color: bg,
  fontWeight: 700,
  fontSize: "10px",
});

const fileDropStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px dashed rgba(255,255,255,0.2)",
  background: "#0f172a",
  color: "#94a3b8",
  fontSize: "13px",
  cursor: "pointer",
  marginBottom: "16px",
};

const colBadgeStyle = {
  padding: "4px 8px",
  borderRadius: "6px",
  background: "rgba(34, 197, 94, 0.15)",
  color: "#4ade80",
  fontSize: "11px",
  fontWeight: 600,
};

const valSummaryStyle = {
  padding: "14px",
  borderRadius: "10px",
  background: "rgba(15, 23, 42, 0.8)",
  border: "1px solid #334155",
  marginBottom: "16px",
};

const importBtnStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
};

const trainBtnStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
};

const mlStatusBoxStyle = {
  marginTop: "16px",
  padding: "12px",
  borderRadius: "8px",
  background: "rgba(15, 23, 42, 0.9)",
  border: "1px solid #334155",
  fontSize: "12px",
  color: "#cbd5e1",
};

const modelRegBoxStyle = {
  padding: "18px",
  borderRadius: "12px",
  background: "#0f172a",
  border: "1px solid #334155",
};

const modelScopeTagStyle = (tenantSpecific) => ({
  padding: "4px 10px",
  borderRadius: "12px",
  background: tenantSpecific ? "rgba(192, 132, 252, 0.2)" : "rgba(56, 189, 248, 0.2)",
  color: tenantSpecific ? "#c084fc" : "#38bdf8",
  fontSize: "11px",
  fontWeight: 700,
});

const modelMetricBoxStyle = { padding: "10px", background: "#1e293b", borderRadius: "8px" };

const kioskServingBoxStyle = {
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(16px)",
  borderRadius: "18px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "32px",
  textAlign: "center",
};

const bigTokenBoxStyle = {
  background: "#0f172a",
  padding: "24px",
  borderRadius: "14px",
  border: "2px solid #4ade80",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const kioskQrBoxStyle = {
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(16px)",
  borderRadius: "18px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "32px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const modalBackdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(15, 23, 42, 0.8)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalCardStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "#1e293b",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: "20px",
  padding: "28px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
};

const modalCloseBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#94a3b8",
  fontSize: "18px",
  cursor: "pointer",
};

const modalTabBtnStyle = (active) => ({
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  background: active ? "#0284c7" : "transparent",
  color: active ? "#fff" : "#94a3b8",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
});

const roleOptionBtnStyle = (active, accent) => ({
  padding: "10px",
  borderRadius: "8px",
  border: active ? `2px solid ${accent}` : "1px solid #334155",
  background: active ? `${accent}22` : "#0f172a",
  color: active ? accent : "#94a3b8",
  fontWeight: 700,
  fontSize: "11px",
  cursor: "pointer",
});

const modalSubmitBtnStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(168, 85, 247, 0.4)",
};

const quickBtnStyle = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#cbd5e1",
  fontSize: "10px",
  cursor: "pointer",
};

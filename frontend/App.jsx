/**
 * App.jsx
 * --------
 * Decoupled Multi-Page Architecture for AI-Powered Hospital Queue System.
 *
 * Dedicated Independent Pages (Not Inter-linked):
 * 1. 📱 Patient Check-in Portal (`?page=patient` or `/patient`)
 * 2. 🛡️ Doctor & Staff Desk Dashboard (`?page=staff` or `/staff`)
 * 3. 📊 Hospital ML Studio & Dataset Trainer (`?page=admin` or `/admin`)
 * 4. 📺 Waiting Room Kiosk TV Display (`?page=kiosk` or `/kiosk`)
 * 5. 🏠 Hospital Launchpad Portal Hub (`?page=hub` or `/`)
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

// Determine active page from URL query params or path
function getInitialPage() {
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get("page") || params.get("view");
  if (pageParam) return pageParam.toLowerCase();

  const path = window.location.pathname.toLowerCase();
  if (path.includes("patient")) return "patient";
  if (path.includes("staff") || path.includes("doctor")) return "staff";
  if (path.includes("admin") || path.includes("ml")) return "admin";
  if (path.includes("kiosk") || path.includes("tv")) return "kiosk";

  return "hub"; // Default to Launchpad Hub
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

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
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

  // Fetch Queue & Analytics
  const refreshData = useCallback(() => {
    fetch(`${API_BASE}/api/v1/plugin/analytics/${tenantId}`)
      .then((r) => r.json())
      .then((d) => setAnalytics(d))
      .catch((e) => console.log("Analytics error:", e));

    fetch(`${API_BASE}/api/v1/plugin/queue/${tenantId}`)
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
  }, [tenantId]);

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
    if (socketRef.current) socketRef.current.emit("serve_next", { tenant_id: tenantId });
  };

  const handleCompleteTicket = async (ticketId) => {
    if (socketRef.current) socketRef.current.emit("complete_ticket", { tenant_id: tenantId, ticket_id: ticketId });
  };

  const handleCounterChange = async (delta) => {
    const current = analytics ? analytics.active_counters : 2;
    const next = Math.max(1, current + delta);
    if (socketRef.current) socketRef.current.emit("set_counters", { tenant_id: tenantId, active_counters: next });
  };

  const isUserRole = currentUser?.role === "user";
  const isRestrictedPage = isUserRole && (activePage === "staff" || activePage === "admin");

  return (
    <div style={appBgStyle}>
      {/* Top Header Bar */}
      <header style={topHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={logoTagStyle}>🏥 Hospital Queue System</span>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{HOSPITAL_CONFIG.name}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {currentUser && (
            <>
              {/* Quick Page Switcher Dropdown (Role Specified) */}
              <select
                value={activePage}
                onChange={(e) => navigateTo(e.target.value)}
                style={pageSelectStyle}
              >
                <option value="hub">🏠 Portal Hub</option>
                <option value="patient">📱 Standalone Patient Portal</option>
                {currentUser.role === "admin" && (
                  <>
                    <option value="staff">🛡️ Standalone Doctor/Staff Desk</option>
                    <option value="admin">📊 Standalone ML Data Studio</option>
                  </>
                )}
                <option value="kiosk">📺 Standalone Waiting Room Kiosk</option>
              </select>

              {/* User Profile Pill */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(30, 41, 59, 0.8)", padding: "4px 12px", borderRadius: "20px", border: "1px solid #334155" }}>
                <span style={{ fontSize: "13px" }}>{currentUser.role === "admin" ? "🛡️" : "👤"}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}>{currentUser.username || currentUser.email}</span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: currentUser.role === "admin" ? "rgba(74, 222, 128, 0.25)" : "rgba(56, 189, 248, 0.25)",
                  color: currentUser.role === "admin" ? "#4ade80" : "#38bdf8",
                  textTransform: "uppercase"
                }}>
                  {currentUser.role === "admin" ? "ADMIN" : "USER"}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "10px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginLeft: "4px"
                  }}
                >
                  Sign Out
                </button>
              </div>
            </>
          )}

          {/* Connection Status Indicator */}
          <span style={connBadgeStyle(socketConnected)}>
            <span style={dotStyle(socketConnected)} />
            {socketConnected ? "Live Socket.IO" : "Offline"}
          </span>
        </div>
      </header>

      {/* RENDER DECOUPLED STANDALONE PAGE */}
      <main style={mainContentStyle}>
        {!currentUser ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : isRestrictedPage ? (
          <AccessRestrictedPage currentUser={currentUser} navigateTo={navigateTo} onLogout={handleLogout} />
        ) : (
          <>
            {activePage === "hub" && <HospitalHubPage navigateTo={navigateTo} currentUser={currentUser} onLogout={handleLogout} />}
            {activePage === "patient" && (
              <StandalonePatientPage
                tenantId={tenantId}
                currentUser={currentUser}
                activeTicket={activeTicket}
                setActiveTicket={setActiveTicket}
                ticketQrData={ticketQrData}
                setTicketQrData={setTicketQrData}
                refreshData={refreshData}
              />
            )}
            {activePage === "staff" && (
              <StandaloneStaffPage
                tenantId={tenantId}
                analytics={analytics}
                queueSnapshot={queueSnapshot}
                servingTickets={servingTickets}
                handleServeNext={handleServeNext}
                handleCompleteTicket={handleCompleteTicket}
                handleCounterChange={handleCounterChange}
              />
            )}
            {activePage === "admin" && <StandaloneMLAdminPage tenantId={tenantId} currentUser={currentUser} />}
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

      {/* Floating Glassmorphism Plugin Widget */}
      <QueuePluginWidget tenantId={tenantId} domainKey="hospital" />
    </div>
  );
}

// ===========================================================================
// 0. LANDING LAUNCHPAD HUB (Switch to any role-allowed standalone page)
// ===========================================================================
function HospitalHubPage({ navigateTo, currentUser, onLogout }) {
  const isAdmin = currentUser?.role === "admin";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 0" }}>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#f8fafc", margin: "0 0 10px 0" }}>
          🏥 City Hospital — Dedicated Application Hub
        </h1>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(30, 41, 59, 0.8)", padding: "6px 16px", borderRadius: "20px", border: "1px solid #334155" }}>
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>Identified Account:</span>
          <span style={{ color: "#f8fafc", fontSize: "13px", fontWeight: 700 }}>{currentUser?.username} ({currentUser?.email})</span>
          <span style={{
            fontSize: "11px",
            fontWeight: 800,
            padding: "2px 10px",
            borderRadius: "12px",
            background: isAdmin ? "rgba(74, 222, 128, 0.2)" : "rgba(56, 189, 248, 0.2)",
            color: isAdmin ? "#4ade80" : "#38bdf8",
            textTransform: "uppercase"
          }}>
            {isAdmin ? "🛡️ ADMIN ROLE" : "👤 USER ROLE"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Patient Portal Card (User & Admin) */}
        <div style={hubCardStyle} onClick={() => navigateTo("patient")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={hubIconStyle}>📱</div>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", fontWeight: 700 }}>
              USER PAGE
            </span>
          </div>
          <h3 style={{ margin: "12px 0 8px 0", color: "#38bdf8", fontSize: "20px" }}>
            1. Patient Check-in Portal
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>
            Mobile/kiosk check-in page for patients. Category selection, Emergency triage, live position countdown, audio chimes, and digital QR ticket pass.
          </p>
        </div>

        {/* Doctor & Staff Desk Card (Admin Only or Restricted) */}
        {isAdmin ? (
          <div style={hubCardStyle} onClick={() => navigateTo("staff")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={hubIconStyle}>🛡️</div>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "rgba(74, 222, 128, 0.2)", color: "#4ade80", fontWeight: 700 }}>
                ADMIN PAGE
              </span>
            </div>
            <h3 style={{ margin: "12px 0 8px 0", color: "#4ade80", fontSize: "20px" }}>
              2. Doctor & Staff Desk Dashboard
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>
              Desk control panel for doctors & nurses. Active counter adjusters, <strong>Call Next Priority Ticket</strong>, now-serving monitor, and live queue line.
            </p>
          </div>
        ) : (
          <div style={{ ...hubCardStyle, opacity: 0.65, border: "1px dashed #ef4444", cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={hubIconStyle}>🔒</div>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", fontWeight: 700 }}>
                ADMIN ONLY
              </span>
            </div>
            <h3 style={{ margin: "12px 0 8px 0", color: "#94a3b8", fontSize: "20px" }}>
              2. Doctor & Staff Desk Dashboard
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
              Restricted to Hospital Doctors & Staff. Sign in with an Admin account to manage queue counters and call tickets.
            </p>
            <button
              onClick={onLogout}
              style={{ marginTop: "10px", padding: "6px 12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #ef4444", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
            >
              Sign In as Admin
            </button>
          </div>
        )}

        {/* ML Studio & Dataset Trainer Card (Admin Only or Restricted) */}
        {isAdmin ? (
          <div style={hubCardStyle} onClick={() => navigateTo("admin")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={hubIconStyle}>📊</div>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "rgba(192, 132, 252, 0.2)", color: "#c084fc", fontWeight: 700 }}>
                ADMIN PAGE
              </span>
            </div>
            <h3 style={{ margin: "12px 0 8px 0", color: "#c084fc", fontSize: "20px" }}>
              3. Hospital ML Studio & Training
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>
              Dataset ingestion & AI training studio. Upload historical hospital CSV/Excel files, column auto-mapping badges, and multi-model ensemble trainer.
            </p>
          </div>
        ) : (
          <div style={{ ...hubCardStyle, opacity: 0.65, border: "1px dashed #ef4444", cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={hubIconStyle}>🔒</div>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", fontWeight: 700 }}>
                ADMIN ONLY
              </span>
            </div>
            <h3 style={{ margin: "12px 0 8px 0", color: "#64748b", fontSize: "20px" }}>
              3. Hospital ML Studio & Training
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
              Restricted to Data Admins. Sign in with an Admin account to upload training datasets and configure AI models.
            </p>
          </div>
        )}

        {/* Waiting Room Kiosk TV Card (User & Admin) */}
        <div style={hubCardStyle} onClick={() => navigateTo("kiosk")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={hubIconStyle}>📺</div>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", fontWeight: 700 }}>
              USER & ADMIN PAGE
            </span>
          </div>
          <h3 style={{ margin: "12px 0 8px 0", color: "#f59e0b", fontSize: "20px" }}>
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
// 1. STANDALONE PATIENT CHECK-IN PORTAL (No staff buttons, 100% Patient View)
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
  const [name, setName] = useState(currentUser?.username || "");
  const [category, setCategory] = useState("consultation");
  const [priority, setPriority] = useState(2);
  const [statusMsg, setStatusMsg] = useState(null);

  // Real Database Profile State
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [age, setAge] = useState("");
  const [medicalId, setMedicalId] = useState("");
  const [profileStatus, setProfileStatus] = useState(null);
  const [userDbTickets, setUserDbTickets] = useState([]);

  // Fetch real user profile & database history
  const fetchUserDbData = useCallback(() => {
    if (!currentUser?.email) return;
    
    // Fetch profile
    fetch(`${API_BASE}/api/v1/auth/me?email=${encodeURIComponent(currentUser.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success" && data.user) {
          if (data.user.phone) setPhone(data.user.phone);
          if (data.user.gender) setGender(data.user.gender);
          if (data.user.age) setAge(data.user.age);
          if (data.user.medical_id) setMedicalId(data.user.medical_id);
          if (data.user.username && !name) setName(data.user.username);
        }
      })
      .catch((e) => console.log("Profile fetch error:", e));

    // Fetch user ticket history from database
    fetch(`${API_BASE}/api/v1/auth/user-history/${encodeURIComponent(currentUser.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success" && data.tickets) {
          setUserDbTickets(data.tickets);
        }
      })
      .catch((e) => console.log("User history fetch error:", e));
  }, [currentUser, name]);

  useEffect(() => {
    fetchUserDbData();
  }, [fetchUserDbData]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.email) return;
    setProfileStatus("Saving profile to SQLite database...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          username: name || currentUser.username,
          phone: phone,
          gender: gender,
          age: Number(age) || 0,
          medical_id: medicalId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileStatus("✓ Profile successfully stored in SQLite database!");
        setTimeout(() => setProfileStatus(null), 3500);
      } else {
        setProfileStatus(`❌ ${data.detail}`);
      }
    } catch (err) {
      setProfileStatus(`❌ Profile save error: ${err.message}`);
    }
  };

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
          user_email: currentUser?.email || "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const t = data.ticket;
        setActiveTicket(t);
        setStatusMsg(`✓ Ticket #${t.ticket_id} Issued & Saved to Database!`);

        // Fetch Ticket QR Code
        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${t.ticket_id}`)
          .then((r) => r.json())
          .then((qr) => setTicketQrData(qr))
          .catch((e) => console.log("QR error:", e));

        refreshData();
        fetchUserDbData();
      } else {
        const err = await res.json();
        setStatusMsg(`❌ Error: ${err.detail}`);
      }
    } catch (err) {
      setStatusMsg(`❌ Join failed: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      {/* Patient Check-in Card */}
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

      {/* Real SQLite Database User Profile Card */}
      {currentUser && (
        <div style={{ ...standaloneCardStyle, marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>💾</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>Real Database User Profile</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                Persisted in SQLite Database (<code style={{ color: "#38bdf8" }}>queue_system.db</code>)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={fieldLabelStyle}>Account Email (Unique Key)</label>
              <input type="text" disabled value={currentUser.email} style={{ ...fieldInputStyle, opacity: 0.7 }} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={fieldInputStyle} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Phone Number</label>
              <input type="text" placeholder="+1 (555) 019-2834" value={phone} onChange={(e) => setPhone(e.target.value)} style={fieldInputStyle} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Medical Card / Health ID</label>
              <input type="text" placeholder="HC-94021" value={medicalId} onChange={(e) => setMedicalId(e.target.value)} style={fieldInputStyle} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={fieldInputStyle}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={fieldLabelStyle}>Age</label>
              <input type="number" placeholder="32" value={age} onChange={(e) => setAge(e.target.value)} style={fieldInputStyle} />
            </div>

            <div style={{ gridColumn: "span 2", marginTop: "6px" }}>
              <button type="submit" style={{ ...patientSubmitBtnStyle, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                💾 Save Profile to Database
              </button>
            </div>
          </form>

          {profileStatus && (
            <div style={{ marginTop: "12px", padding: "10px", borderRadius: "8px", background: "#0f172a", border: "1px solid #334155", color: "#38bdf8", fontSize: "12px", textAlign: "center" }}>
              {profileStatus}
            </div>
          )}
        </div>
      )}

      {/* User Real Database Queue Tickets History */}
      {currentUser && (
        <div style={{ ...standaloneCardStyle, marginTop: "24px" }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: "18px", color: "#f8fafc" }}>
            📜 Your Saved Database Tickets History ({userDbTickets.length})
          </h3>

          {userDbTickets.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>No past tickets recorded in database yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {userDbTickets.map((t) => (
                <div key={t.ticket_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#0f172a", borderRadius: "10px", border: "1px solid #334155" }}>
                  <div>
                    <span style={{ fontWeight: 800, color: "#38bdf8", fontSize: "16px" }}>#{t.ticket_id}</span>
                    <span style={{ marginLeft: "10px", color: "#cbd5e1", fontSize: "13px" }}>{t.service_category.toUpperCase()}</span>
                    <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      Joined: {new Date(t.join_timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                  <span style={passStatusBadgeStyle(t.status)}>{t.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// 2. STANDALONE DOCTOR & STAFF DESK DASHBOARD (No patient form, 100% Staff View)
// ===========================================================================
function StandaloneStaffPage({
  tenantId,
  analytics,
  queueSnapshot,
  servingTickets,
  handleServeNext,
  handleCompleteTicket,
  handleCounterChange,
}) {
  return (
    <div>
      {/* Top Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Patients Waiting</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#38bdf8", margin: "4px 0" }}>
            {analytics ? analytics.currently_waiting : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#64748b" }}>In Waiting Queue Line</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Currently Serving</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#4ade80", margin: "4px 0" }}>
            {analytics ? analytics.currently_serving : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#64748b" }}>At Doctor Desks</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Completed Today</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#c084fc", margin: "4px 0" }}>
            {analytics ? analytics.total_completed : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#64748b" }}>Total Patients Consulted</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Active Doctor Desks</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f59e0b", margin: 0 }}>
              {analytics ? analytics.active_counters : 2}
            </h2>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => handleCounterChange(-1)} style={plusMinusBtnStyle}>-</button>
              <button onClick={() => handleCounterChange(1)} style={plusMinusBtnStyle}>+</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Desk Call Control & Serving Monitor */}
        <div style={standaloneCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#f8fafc" }}>
                🛡️ Doctor Desk Operations
              </h3>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Priority Call Control</span>
            </div>

            <button onClick={handleServeNext} style={callPriorityBtnStyle}>
              🚨 Call Next Priority Ticket
            </button>
          </div>

          <h4 style={{ margin: "0 0 12px 0", color: "#cbd5e1", fontSize: "13px" }}>Now Serving at Doctor Desks:</h4>

          {servingTickets.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", background: "#0f172a", borderRadius: "12px", border: "1px solid #334155", color: "#64748b", fontSize: "13px" }}>
              No patients currently at doctor desks. Click "Call Next Priority Ticket" above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {servingTickets.map((t) => (
                <div key={t.ticket_id} style={staffServingRowStyle}>
                  <div>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#4ade80" }}>#{t.ticket_id}</span>
                    <span style={{ marginLeft: "12px", color: "#f8fafc", fontWeight: 700, fontSize: "15px" }}>{t.name}</span>
                    <span style={{ marginLeft: "10px", fontSize: "11px", color: "#38bdf8" }}>({t.service_category.toUpperCase()})</span>
                  </div>

                  <button onClick={() => handleCompleteTicket(t.ticket_id)} style={finishBtnStyle}>
                    ✓ Mark Consultation Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Patient Waiting Line Table */}
        <div style={standaloneCardStyle}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#f8fafc" }}>
            📊 Waiting Line Snapshot ({queueSnapshot.length})
          </h3>

          <div style={{ overflowX: "auto" }}>
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
                    <td colSpan="6" style={{ ...staffTdStyle, textAlign: "center", color: "#64748b" }}>
                      Waiting queue is currently empty.
                    </td>
                  </tr>
                ) : (
                  queueSnapshot.map((t) => (
                    <tr key={t.ticket_id}>
                      <td style={staffTdStyle}>#{t.position}</td>
                      <td style={{ ...staffTdStyle, fontWeight: 800, color: "#38bdf8" }}>#{t.ticket_id}</td>
                      <td style={{ ...staffTdStyle, fontWeight: 600 }}>{t.name}</td>
                      <td style={staffTdStyle}>{t.service_category}</td>
                      <td style={staffTdStyle}>
                        {t.priority_level === 1 ? (
                          <span style={badgePrioStyle("#ef4444")}>🚨 Emergency</span>
                        ) : (
                          <span style={badgePrioStyle("#3b82f6")}>📋 Routine</span>
                        )}
                      </td>
                      <td style={{ ...staffTdStyle, fontWeight: 800, color: "#4ade80" }}>{t.estimated_wait_minutes} min</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 3. STANDALONE HOSPITAL ML DATA STUDIO & TRAINING (100% ML Admin View)
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
      {/* Dataset Upload & Standardization Box */}
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

      {/* Active Model Health Card */}
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

      {/* Real SQLite Database Users Directory (Admin View) */}
      <AdminDbUsersDirectory />
    </div>
  );
}

function AdminDbUsersDirectory() {
  const [dbUsers, setDbUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/v1/auth/users`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success" && data.users) {
          setDbUsers(data.users);
        }
      })
      .catch((e) => console.log("Fetch DB users error:", e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ ...standaloneCardStyle, marginTop: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>👥</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>Registered Database Users Directory</h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              Real User Accounts Persisted in SQLite Database (<code style={{ color: "#38bdf8" }}>queue_system.db</code>)
            </p>
          </div>
        </div>

        <button onClick={fetchUsers} style={{ padding: "6px 14px", borderRadius: "8px", background: "#1e293b", border: "1px solid #334155", color: "#38bdf8", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          🔄 Refresh DB Table
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={staffTableStyle}>
          <thead>
            <tr>
              <th style={staffThStyle}>ID</th>
              <th style={staffThStyle}>Username</th>
              <th style={staffThStyle}>Email Address</th>
              <th style={staffThStyle}>Role</th>
              <th style={staffThStyle}>Phone</th>
              <th style={staffThStyle}>Medical ID</th>
              <th style={staffThStyle}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ ...staffTdStyle, textAlign: "center", color: "#94a3b8" }}>Loading user records from SQLite database...</td>
              </tr>
            ) : dbUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ ...staffTdStyle, textAlign: "center", color: "#64748b" }}>No users registered in database.</td>
              </tr>
            ) : (
              dbUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ ...staffTdStyle, fontWeight: 700 }}>#{u.id}</td>
                  <td style={{ ...staffTdStyle, color: "#f8fafc", fontWeight: 600 }}>{u.username}</td>
                  <td style={{ ...staffTdStyle, color: "#38bdf8" }}>{u.email}</td>
                  <td style={staffTdStyle}>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: u.role === "admin" ? "rgba(74, 222, 128, 0.25)" : "rgba(56, 189, 248, 0.25)",
                      color: u.role === "admin" ? "#4ade80" : "#38bdf8",
                      textTransform: "uppercase"
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={staffTdStyle}>{u.phone || "—"}</td>
                  <td style={staffTdStyle}>{u.medical_id || "—"}</td>
                  <td style={{ ...staffTdStyle, fontSize: "11px", color: "#64748b" }}>
                    {u.created_at ? new Date(u.created_at * 1000).toLocaleDateString() : "System Default"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
// 4. STANDALONE WAITING ROOM KIOSK TV DISPLAY (100% Kiosk View)
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
        {/* Big Now Serving Banner */}
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

        {/* QR Code Scan Poster Box */}
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

const mainContentStyle = {
  minHeight: "75vh",
};

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

const hubIconStyle = {
  fontSize: "36px",
  marginBottom: "12px",
};

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

const modelMetricBoxStyle = {
  padding: "10px",
  background: "#1e293b",
  borderRadius: "8px",
};

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

// ===========================================================================
// AUTHENTICATION & ACCESS CONTROL COMPONENTS
// ===========================================================================
function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? `${API_BASE}/api/v1/auth/login` : `${API_BASE}/api/v1/auth/signup`;
    const payload = isLogin
      ? { email, password }
      : { email, username, password, role };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.status !== "success") {
        throw new Error(data.detail || "Authentication failed. Please verify your details.");
      }
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail, demoPassword) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== "success") {
        throw new Error(data.detail || "Demo login failed.");
      }
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authContainerStyle}>
      <div style={authCardStyle}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "42px", marginBottom: "6px" }}>🏥</div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
            City General Hospital
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
            AI-Powered Smart Queue Management System
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={authTabContainerStyle}>
          <button
            type="button"
            style={authTabStyle(isLogin)}
            onClick={() => { setIsLogin(true); setError(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={authTabStyle(!isLogin)}
            onClick={() => { setIsLogin(false); setError(null); }}
          >
            Create Account
          </button>
        </div>

        {error && <div style={authErrorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {!isLogin && (
            <div>
              <label style={authLabelStyle}>Full Name / Username</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma or Dr. Robert"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={authInputStyle}
              />
            </div>
          )}

          <div>
            <label style={authLabelStyle}>Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. user@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={authInputStyle}
            />
          </div>

          <div>
            <label style={authLabelStyle}>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={authInputStyle}
            />
          </div>

          {!isLogin && (
            <div>
              <label style={authLabelStyle}>Account Role</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  style={roleOptionBtnStyle(role === "user")}
                >
                  <span style={{ fontSize: "18px" }}>👤</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>Patient / User</div>
                    <div style={{ fontSize: "10px", opacity: 0.8 }}>Patient Check-in & TV View</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  style={roleOptionBtnStyle(role === "admin")}
                >
                  <span style={{ fontSize: "18px" }}>🛡️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>Staff / Admin</div>
                    <div style={{ fontSize: "10px", opacity: 0.8 }}>Desk Control & ML Studio</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={authSubmitBtnStyle}>
            {loading ? "Authenticating..." : isLogin ? "Sign In to Hospital Portal" : "Register & Sign In"}
          </button>
        </form>

        {/* Quick Demo Login Section */}
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <p style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px 0", fontWeight: 700 }}>
            ⚡ Instant Demo Login
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              type="button"
              onClick={() => handleQuickDemo("patient@hospital.com", "user123")}
              style={demoUserBtnStyle}
            >
              <div style={{ fontWeight: 700, color: "#38bdf8", fontSize: "13px" }}>👤 Patient Demo</div>
              <div style={{ fontSize: "10px", color: "#94a3b8" }}>User Specified Pages</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("admin@hospital.com", "admin123")}
              style={demoAdminBtnStyle}
            >
              <div style={{ fontWeight: 700, color: "#4ade80", fontSize: "13px" }}>🛡️ Admin Demo</div>
              <div style={{ fontSize: "10px", color: "#94a3b8" }}>Admin Specified Pages</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccessRestrictedPage({ currentUser, navigateTo, onLogout }) {
  return (
    <div style={{ maxWidth: "600px", margin: "60px auto", padding: "36px", background: "rgba(30, 41, 59, 0.85)", borderRadius: "24px", border: "1px solid #ef4444", textAlign: "center", backdropFilter: "blur(16px)" }}>
      <div style={{ fontSize: "54px", marginBottom: "16px" }}>🔒</div>
      <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#f87171", margin: "0 0 10px 0" }}>
        Admin Access Restricted
      </h2>
      <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px 0" }}>
        You are currently signed in as <strong>{currentUser?.username || currentUser?.email}</strong> with the <strong>Patient (User)</strong> role.
        This page is reserved strictly for Hospital Doctors, Nurses, and Staff Admins.
      </p>

      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <button
          onClick={() => navigateTo("patient")}
          style={{ padding: "12px 20px", borderRadius: "12px", background: "#0284c7", color: "#fff", border: "none", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
        >
          📱 Return to Patient Portal
        </button>
        <button
          onClick={onLogout}
          style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #ef4444", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
        >
          🔑 Switch to Admin Account
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AUTHENTICATION STYLES
// ---------------------------------------------------------------------------
const authContainerStyle = {
  minHeight: "75vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px 0",
};

const authCardStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "rgba(15, 23, 42, 0.85)",
  backdropFilter: "blur(20px)",
  borderRadius: "24px",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  padding: "36px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
};

const authTabContainerStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  background: "#1e293b",
  padding: "4px",
  borderRadius: "12px",
  marginBottom: "20px",
};

const authTabStyle = (active) => ({
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  background: active ? "#0284c7" : "transparent",
  color: active ? "#ffffff" : "#94a3b8",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s ease",
});

const authLabelStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#cbd5e1",
  display: "block",
  marginBottom: "4px",
};

const authInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#1e293b",
  border: "1px solid #334155",
  color: "#f8fafc",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
};

const roleOptionBtnStyle = (selected) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "10px",
  border: selected ? "2px solid #38bdf8" : "1px solid #334155",
  background: selected ? "rgba(56, 189, 248, 0.15)" : "#1e293b",
  color: selected ? "#38bdf8" : "#94a3b8",
  cursor: "pointer",
  textAlign: "left",
});

const authSubmitBtnStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
  marginTop: "10px",
  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
};

const authErrorStyle = {
  padding: "12px",
  borderRadius: "10px",
  background: "rgba(239, 68, 68, 0.15)",
  border: "1px solid #ef4444",
  color: "#f87171",
  fontSize: "12px",
  marginBottom: "16px",
  textAlign: "center",
};

const demoUserBtnStyle = {
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(56, 189, 248, 0.1)",
  border: "1px solid rgba(56, 189, 248, 0.3)",
  cursor: "pointer",
  textAlign: "center",
};

const demoAdminBtnStyle = {
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(74, 222, 128, 0.1)",
  border: "1px solid rgba(74, 222, 128, 0.3)",
  cursor: "pointer",
  textAlign: "center",
};

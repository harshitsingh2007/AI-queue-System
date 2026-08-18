/**
 * App.jsx
 * --------
 * AI-Powered Smart Queue Management System — Multi-Page SaaS Architecture.
 *
 * Dedicated Separate Pages:
 * 1. 📱 User Queue Portal (Patient/Customer Join, Live Ticket Pass, Audio Chimes, Position Countdown)
 * 2. 🛡️ Staff Admin Dashboard (Counter Control, Call Next Priority Ticket, Serving Monitor, Queue Table, Real-Time Analytics)
 * 3. 📊 ML Data & Training Studio (CSV/Excel Upload, Standardization Engine, Multi-Model Ensemble Trainer, Model Health Card)
 * 4. 🔌 Plugin & Embed Portal (Copy-Paste JS Embed Code, Kiosk Mode, Floating Glassmorphism Preview)
 * 5. 🔲 QR Code Kiosk & Scanner (Tenant Kiosk QR Generator, Scanner Simulator, Mobile Ticket Boarding Pass)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import QueuePluginWidget from "./QueuePluginWidget";

const API_BASE = "http://127.0.0.1:8000";
const WS_URL = "http://127.0.0.1:8000";

const DOMAINS = {
  hospital: {
    tenantId: "city-hospital-01",
    name: "City Hospital — Patient Portal",
    consumerType: "hospital",
    categories: ["consultation", "pharmacy", "emergency", "radiology", "lab_test"],
  },
  bank: {
    tenantId: "acme-bank-01",
    name: "Acme National Bank — Branch Services",
    consumerType: "bank",
    categories: ["cash", "loan", "account_opening", "vip_desk"],
  },
  clinic: {
    tenantId: "campus-clinic-01",
    name: "University Health Center",
    consumerType: "clinic",
    categories: ["general_checkup", "dentist", "pediatrics"],
  },
  government: {
    tenantId: "govt-passport-01",
    name: "Regional Administrative Center",
    consumerType: "government",
    categories: ["document_verification", "license_renewal", "inquiry"],
  },
};

const CANONICAL_FIELDS = [
  { key: "timestamp", label: "Timestamp / Date-Time", req: false },
  { key: "queue_length", label: "Queue Length / Waiting Count", req: true },
  { key: "active_staff_counters", label: "Active Counters / Staff", req: false },
  { key: "service_category", label: "Service Category / Department", req: false },
  { key: "service_time", label: "Service Duration / Handling Time", req: true },
];

export default function App() {
  const [activePage, setActivePage] = useState("user"); // "user" | "admin" | "ml" | "embed" | "qr"
  const [domainKey, setDomainKey] = useState("hospital");
  const currentDomain = DOMAINS[domainKey];
  const tenantId = currentDomain.tenantId;

  // Real-time State
  const [analytics, setAnalytics] = useState(null);
  const [queueSnapshot, setQueueSnapshot] = useState([]);
  const [servingTickets, setServingTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketQrData, setTicketQrData] = useState(null);
  const [kioskQrData, setKioskQrData] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);

  // User Join State
  const [userName, setUserName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(currentDomain.categories[0]);
  const [priorityLevel, setPriorityLevel] = useState(domainKey === "hospital" ? 2 : 1);
  const [joinStatus, setJoinStatus] = useState(null);

  // Audio Ref
  const audioRef = useRef(null);

  // Synchronize category selection on domain change
  useEffect(() => {
    setSelectedCategory(currentDomain.categories[0]);
    setPriorityLevel(domainKey === "hospital" ? 2 : 1);
  }, [domainKey, currentDomain]);

  // Socket.IO Setup
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
        alert(`🔔 NOW SERVING: Ticket ${data.ticket.ticket_id}! Please proceed to Counter.`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tenantId, activeTicket]);

  // Fetch initial analytics & queue snapshot
  const refreshData = useCallback(() => {
    fetch(`${API_BASE}/api/v1/plugin/analytics/${tenantId}`)
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch((err) => console.log("Analytics fetch error:", err));

    fetch(`${API_BASE}/api/v1/plugin/queue/${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        setQueueSnapshot(data.snapshot || []);
        setServingTickets(data.serving || []);
      })
      .catch((err) => console.log("Queue fetch error:", err));

    fetch(`${API_BASE}/api/v1/plugin/qr/${tenantId}`)
      .then((res) => res.json())
      .then((data) => setKioskQrData(data))
      .catch((err) => console.log("QR fetch error:", err));
  }, [tenantId]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Audio Chime
  const playChimeSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
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

  // Join Queue Action
  const handleUserJoin = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;
    setJoinStatus("Joining queue...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/queue/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          consumer_type: currentDomain.consumerType,
          service_category: selectedCategory,
          name: userName,
          priority_level: Number(priorityLevel),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const t = data.ticket;
        setActiveTicket(t);
        setJoinStatus(`🎉 Success! Issued Ticket #${t.ticket_id}`);
        setUserName("");

        // Fetch Ticket QR code
        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${t.ticket_id}`)
          .then((r) => r.json())
          .then((qr) => setTicketQrData(qr))
          .catch((err) => console.log("Ticket QR error:", err));

        refreshData();
      } else {
        const err = await res.json();
        setJoinStatus(`❌ Error: ${err.detail}`);
      }
    } catch (err) {
      setJoinStatus(`❌ Join failed: ${err.message}`);
    }
  };

  // Staff Admin Actions
  const handleServeNext = async () => {
    if (socketRef.current) {
      socketRef.current.emit("serve_next", { tenant_id: tenantId });
    }
  };

  const handleCompleteTicket = async (ticketId) => {
    if (socketRef.current) {
      socketRef.current.emit("complete_ticket", { tenant_id: tenantId, ticket_id: ticketId });
    }
  };

  const handleCounterChange = async (delta) => {
    const current = analytics ? analytics.active_counters : 2;
    const next = Math.max(1, current + delta);
    if (socketRef.current) {
      socketRef.current.emit("set_counters", { tenant_id: tenantId, active_counters: next });
    }
  };

  return (
    <div style={containerStyle}>
      {/* GLOBAL TOP HEADER */}
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={logoBadgeStyle}>🤖 AI Queue</div>
          <div>
            <h1 style={titleStyle}>Smart Queue Management System</h1>
            <p style={subtitleStyle}>Multi-Tenant AI Queue Plugin & Analytics Platform</p>
          </div>
        </div>

        {/* Global Controls & Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Domain / Industry Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Industry Preset:</span>
            <select
              value={domainKey}
              onChange={(e) => setDomainKey(e.target.value)}
              style={selectStyle}
            >
              <option value="hospital">🏥 City Hospital</option>
              <option value="bank">🏦 Acme Bank</option>
              <option value="clinic">🩺 Campus Clinic</option>
              <option value="government">🏛️ Govt Office</option>
            </select>
          </div>

          {/* Connection Pill */}
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "20px",
              background: socketConnected ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: socketConnected ? "#4ade80" : "#f87171",
              fontSize: "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: socketConnected ? "#4ade80" : "#f87171",
              }}
            />
            {socketConnected ? "Live Socket.IO" : "Disconnected"}
          </span>
        </div>
      </header>

      {/* MULTI-PAGE NAVIGATION BAR */}
      <nav style={navBarStyle}>
        <button
          onClick={() => setActivePage("user")}
          style={navTabStyle(activePage === "user", "#0284c7")}
        >
          📱 Customer Queue Portal
        </button>
        <button
          onClick={() => setActivePage("admin")}
          style={navTabStyle(activePage === "admin", "#059669")}
        >
          🛡️ Staff Admin Dashboard
        </button>
        <button
          onClick={() => setActivePage("ml")}
          style={navTabStyle(activePage === "ml", "#7c3aed")}
        >
          📊 ML Studio & Training
        </button>
        <button
          onClick={() => setActivePage("embed")}
          style={navTabStyle(activePage === "embed", "#ea580c")}
        >
          🔌 Plugin & Embed Portal
        </button>
        <button
          onClick={() => setActivePage("qr")}
          style={navTabStyle(activePage === "qr", "#0d9488")}
        >
          🔲 QR Kiosk & Scanner
        </button>
      </nav>

      {/* PAGE 1: USER QUEUE PORTAL */}
      {activePage === "user" && (
        <UserQueuePortalPage
          currentDomain={currentDomain}
          domainKey={domainKey}
          userName={userName}
          setUserName={setUserName}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          priorityLevel={priorityLevel}
          setPriorityLevel={setPriorityLevel}
          handleUserJoin={handleUserJoin}
          joinStatus={joinStatus}
          activeTicket={activeTicket}
          ticketQrData={ticketQrData}
          analytics={analytics}
        />
      )}

      {/* PAGE 2: STAFF ADMIN DASHBOARD */}
      {activePage === "admin" && (
        <StaffAdminDashboardPage
          tenantId={tenantId}
          analytics={analytics}
          queueSnapshot={queueSnapshot}
          servingTickets={servingTickets}
          handleServeNext={handleServeNext}
          handleCompleteTicket={handleCompleteTicket}
          handleCounterChange={handleCounterChange}
        />
      )}

      {/* PAGE 3: ML STUDIO & TRAINING */}
      {activePage === "ml" && <MLStudioPage tenantId={tenantId} />}

      {/* PAGE 4: PLUGIN & EMBED PORTAL */}
      {activePage === "embed" && <PluginEmbedPage tenantId={tenantId} domainKey={domainKey} />}

      {/* PAGE 5: QR KIOSK & SCANNER */}
      {activePage === "qr" && (
        <QRKioskScannerPage
          tenantId={tenantId}
          kioskQrData={kioskQrData}
          activeTicket={activeTicket}
          ticketQrData={ticketQrData}
        />
      )}

      {/* ALWAYS ACCESSIBLE FLOATING GLASSMORPHISM WIDGET */}
      <QueuePluginWidget tenantId={tenantId} domainKey={domainKey} />
    </div>
  );
}

// ===========================================================================
// SUB-PAGE 1: CUSTOMER QUEUE PORTAL
// ===========================================================================
function UserQueuePortalPage({
  currentDomain,
  domainKey,
  userName,
  setUserName,
  selectedCategory,
  setSelectedCategory,
  priorityLevel,
  setPriorityLevel,
  handleUserJoin,
  joinStatus,
  activeTicket,
  ticketQrData,
  analytics,
}) {
  return (
    <div style={pageGridStyle}>
      {/* Join Form Panel */}
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>
            📋 Join {currentDomain.name}
          </h2>
          <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>Mobile Self-Checkin Kiosk</span>
        </div>

        <form onSubmit={handleUserJoin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Your Full Name / Patient ID</label>
            <input
              type="text"
              placeholder="e.g. John Doe / Patient #901"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Service Department / Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={inputStyle}
            >
              {currentDomain.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {domainKey === "hospital" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Triage / Priority Level</label>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setPriorityLevel(2)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: priorityLevel === 2 ? "2px solid #38bdf8" : "1px solid #334155",
                    background: priorityLevel === 2 ? "rgba(56, 189, 248, 0.15)" : "#0f172a",
                    color: priorityLevel === 2 ? "#38bdf8" : "#94a3b8",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  📋 Routine Consultation (Priority 2)
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityLevel(1)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: priorityLevel === 1 ? "2px solid #ef4444" : "1px solid #334155",
                    background: priorityLevel === 1 ? "rgba(239, 68, 68, 0.2)" : "#0f172a",
                    color: priorityLevel === 1 ? "#f87171" : "#94a3b8",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  🚨 Emergency Triage (Priority 1)
                </button>
              </div>
            </div>
          )}

          <button type="submit" style={primaryBtnStyle}>
            🎫 Issue AI Priority Ticket Now
          </button>
        </form>

        {joinStatus && (
          <div style={{ marginTop: "16px", padding: "12px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid #334155", fontSize: "13px", color: "#cbd5e1" }}>
            {joinStatus}
          </div>
        )}
      </div>

      {/* Active Ticket Boarding Pass Panel */}
      <div style={panelStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#f8fafc" }}>
          🎟️ Your Digital Queue Pass
        </h2>

        {!activeTicket ? (
          <div style={{ padding: "40px 20px", textAlign: "center", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: "12px" }}>
            <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>🎫</span>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
              Fill out the check-in form to receive your real-time AI ticket pass & countdown.
            </p>
          </div>
        ) : (
          <div style={ticketCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>Ticket ID</span>
                <h3 style={{ margin: 0, fontSize: "28px", color: "#38bdf8", fontWeight: 800 }}>
                  #{activeTicket.ticket_id}
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Status</span>
                <span style={statusBadgeStyle(activeTicket.status)}>{activeTicket.status.toUpperCase()}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Patient / Name</span>
                <p style={{ margin: "2px 0 0 0", color: "#f8fafc", fontWeight: 600 }}>{activeTicket.name}</p>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Department</span>
                <p style={{ margin: "2px 0 0 0", color: "#38bdf8", fontWeight: 600 }}>{activeTicket.service_category.toUpperCase()}</p>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Queue Position</span>
                <p style={{ margin: "2px 0 0 0", color: "#f59e0b", fontWeight: 800, fontSize: "20px" }}>
                  #{activeTicket.position}
                </p>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Estimated Wait</span>
                <p style={{ margin: "2px 0 0 0", color: "#4ade80", fontWeight: 800, fontSize: "20px" }}>
                  {activeTicket.estimated_wait_minutes} min
                </p>
              </div>
            </div>

            {ticketQrData && (
              <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px" }}>
                <img
                  src={ticketQrData.qr_code_base64}
                  alt="Ticket QR"
                  style={{ width: "130px", height: "130px", borderRadius: "10px", padding: "6px", background: "#fff" }}
                />
                <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
                  Scan code at counter scanner or save digital pass
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// SUB-PAGE 2: STAFF ADMIN DASHBOARD
// ===========================================================================
function StaffAdminDashboardPage({
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
      {/* Real-time Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Currently Waiting</span>
          <h3 style={{ ...statValStyle, color: "#38bdf8" }}>{analytics ? analytics.currently_waiting : 0}</h3>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Patients in Queue</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Now Serving</span>
          <h3 style={{ ...statValStyle, color: "#4ade80" }}>{analytics ? analytics.currently_serving : 0}</h3>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Active Desk Consultations</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Total Completed Today</span>
          <h3 style={{ ...statValStyle, color: "#c084fc" }}>{analytics ? analytics.total_completed : 0}</h3>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Served Tickets</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Active Staff Counters</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <h3 style={{ ...statValStyle, margin: 0, color: "#f59e0b" }}>{analytics ? analytics.active_counters : 2}</h3>
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={() => handleCounterChange(-1)} style={counterBtnStyle}>-</button>
              <button onClick={() => handleCounterChange(1)} style={counterBtnStyle}>+</button>
            </div>
          </div>
        </div>
      </div>

      <div style={pageGridStyle}>
        {/* Serving Monitor & Action Control */}
        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>
              ⚡ Desk Operations & Call Control
            </h2>
            <button onClick={handleServeNext} style={callNextBtnStyle}>
              🚨 Call Next Priority Ticket
            </button>
          </div>

          <h4 style={{ margin: "0 0 12px 0", color: "#94a3b8", fontSize: "13px" }}>Now Serving at Counters:</h4>
          {servingTickets.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", background: "#0f172a", borderRadius: "10px", color: "#64748b", fontSize: "13px" }}>
              No tickets currently being served. Click "Call Next Priority Ticket" above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {servingTickets.map((t) => (
                <div key={t.ticket_id} style={servingItemStyle}>
                  <div>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: "#4ade80" }}>#{t.ticket_id}</span>
                    <span style={{ marginLeft: "12px", color: "#f8fafc", fontWeight: 600 }}>{t.name}</span>
                    <span style={{ marginLeft: "10px", fontSize: "11px", color: "#94a3b8" }}>({t.service_category})</span>
                  </div>
                  <button onClick={() => handleCompleteTicket(t.ticket_id)} style={completeBtnStyle}>
                    ✓ Mark Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Queue Table */}
        <div style={panelStyle}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#f8fafc" }}>
            📊 Waiting Queue Line ({queueSnapshot.length})
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Pos</th>
                  <th style={thStyle}>Ticket ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Est Wait</th>
                </tr>
              </thead>
              <tbody>
                {queueSnapshot.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                      Queue is currently empty.
                    </td>
                  </tr>
                ) : (
                  queueSnapshot.map((t) => (
                    <tr key={t.ticket_id}>
                      <td style={tdStyle}>#{t.position}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "#38bdf8" }}>#{t.ticket_id}</td>
                      <td style={tdStyle}>{t.name}</td>
                      <td style={tdStyle}>{t.service_category}</td>
                      <td style={tdStyle}>
                        {t.priority_level === 1 ? (
                          <span style={prioBadgeStyle("#ef4444")}>🚨 Emergency</span>
                        ) : (
                          <span style={prioBadgeStyle("#3b82f6")}>📋 Routine</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "#4ade80" }}>{t.estimated_wait_minutes} min</td>
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
// SUB-PAGE 3: ML STUDIO & TRAINING
// ===========================================================================
function MLStudioPage({ tenantId }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [uploadStatus, setUploadStatus] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const fetchModelStatus = useCallback(() => {
    fetch(`${API_BASE}/api/v1/plugin/model-status/${tenantId}`)
      .then((res) => res.json())
      .then((data) => setModelStatus(data))
      .catch((err) => console.log("Model status fetch error:", err));
  }, [tenantId]);

  useEffect(() => {
    fetchModelStatus();
  }, [fetchModelStatus]);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
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
        alert(`Error previewing file: ${err.detail}`);
      }
    } catch (err) {
      console.log("Preview error:", err);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadStatus("Validating and storing historical records in SQLite...");

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
        setUploadStatus(`✓ ${data.message}`);
        fetchModelStatus();
      } else {
        setUploadStatus(`❌ ${data.message || data.detail}`);
      }
    } catch (err) {
      setIsUploading(false);
      setUploadStatus(`❌ Import failed: ${err.message}`);
    }
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    setUploadStatus("Training ML ensemble (ExtraTrees, RandomForest, HistGradientBoosting)...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/historical-data/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const data = await res.json();
      setIsTraining(false);
      if (data.success === false) {
        setUploadStatus(`⚠️ ${data.message}`);
      } else {
        setUploadStatus(`🎉 Trained! Winner: ${data.model_type} (MAE: ${data.mae} min | R²: ${data.r2})`);
        fetchModelStatus();
      }
    } catch (err) {
      setIsTraining(false);
      setUploadStatus(`❌ Training failed: ${err.message}`);
    }
  };

  return (
    <div style={pageGridStyle}>
      {/* Left Column: Data Upload & Standardization */}
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>
            📂 Upload Historical CSV / Excel Dataset
          </h2>
          <span style={{ fontSize: "12px", color: "#c084fc", fontWeight: 600 }}>Multi-Tenant Standardization Engine</span>
        </div>

        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileSelect}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px dashed rgba(255,255,255,0.2)",
            background: "#0f172a",
            color: "#94a3b8",
            fontSize: "13px",
            cursor: "pointer",
            marginBottom: "16px",
          }}
        />

        {previewData && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Auto-Detected Column Badges:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {previewData.detected_columns.map((col) => (
                  <span key={col} style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", fontSize: "11px", fontWeight: 600 }}>
                    ✓ {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Validation Breakdown Box */}
            <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid #334155", marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#f8fafc" }}>Validation Summary</h4>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>✓ {previewData.validation_summary.valid_rows} Valid Rows</span>
                <span style={{ color: "#f87171", fontWeight: 700 }}>❌ {previewData.validation_summary.rejected_rows} Rejected</span>
                <span style={{ color: "#94a3b8" }}>Total: {previewData.validation_summary.total_rows}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleConfirmImport} disabled={isUploading} style={{ ...primaryBtnStyle, flex: 1 }}>
                {isUploading ? "Storing..." : "📥 Confirm Import to SQLite"}
              </button>
              <button onClick={handleTrainModel} disabled={isTraining} style={{ ...secondaryBtnStyle, flex: 1 }}>
                {isTraining ? "Training..." : "🚀 Train AI Model Now"}
              </button>
            </div>
          </div>
        )}

        {uploadStatus && (
          <div style={{ marginTop: "16px", padding: "12px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.9)", border: "1px solid #334155", fontSize: "12px", color: "#cbd5e1" }}>
            {uploadStatus}
          </div>
        )}
      </div>

      {/* Right Column: Active Model Health Card */}
      <div style={panelStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#f8fafc" }}>
          🤖 Active AI Model Registry — {tenantId}
        </h2>

        {!modelStatus ? (
          <p style={{ color: "#94a3b8" }}>Loading model status...</p>
        ) : (
          <div style={modelHealthCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>Model Scope</span>
                <h4 style={{ margin: 0, fontSize: "18px", color: modelStatus.is_tenant_specific ? "#c084fc" : "#38bdf8", fontWeight: 800 }}>
                  {modelStatus.active_model}
                </h4>
              </div>
              <span style={{ padding: "4px 10px", borderRadius: "12px", background: modelStatus.is_tenant_specific ? "rgba(192, 132, 252, 0.2)" : "rgba(56, 189, 248, 0.2)", color: modelStatus.is_tenant_specific ? "#c084fc" : "#38bdf8", fontSize: "11px", fontWeight: 700 }}>
                {modelStatus.is_tenant_specific ? "TENANT SPECIFIC" : "GLOBAL BASELINE"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div style={smallStatStyle}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Winning Algorithm</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#f8fafc" }}>{modelStatus.model_type || "GradientBoosting"}</p>
              </div>
              <div style={smallStatStyle}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Mean Absolute Error</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#4ade80" }}>{modelStatus.mae} minutes</p>
              </div>
              <div style={smallStatStyle}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>R² Accuracy Score</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#38bdf8" }}>{modelStatus.r2}</p>
              </div>
              <div style={smallStatStyle}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Dataset Records</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#f59e0b" }}>{modelStatus.training_rows} rows</p>
              </div>
            </div>

            {modelStatus.top_features && (
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                  Top Feature Importance Weights:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {Object.entries(modelStatus.top_features).slice(0, 4).map(([feat, val]) => (
                    <div key={feat} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#cbd5e1" }}>
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
// SUB-PAGE 4: PLUGIN & EMBED PORTAL
// ===========================================================================
function PluginEmbedPage({ tenantId, domainKey }) {
  const embedCode = `<!-- AI Smart Queue Management Plugin -->
<script 
  src="${API_BASE}/queue-plugin.js" 
  data-tenant="${tenantId}"
  data-theme="dark"
  async>
</script>
<div id="ai-queue-plugin-widget"></div>`;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={pageGridStyle}>
      <div style={panelStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#f8fafc" }}>
          🔌 Embed Widget Code Snippet
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.6" }}>
          Copy and paste this lightweight 1-line HTML script tag into your application or website header.
        </p>

        <div style={{ position: "relative", marginBottom: "16px" }}>
          <pre style={codeBlockStyle}>{embedCode}</pre>
          <button onClick={handleCopy} style={copyBtnStyle}>
            {copied ? "✓ Copied!" : "📋 Copy Code"}
          </button>
        </div>

        <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.1)", border: "1px solid #0284c7", fontSize: "12px", color: "#38bdf8" }}>
          💡 <strong>Zero Setup Needed:</strong> Embeds instantly on HTML, React, Vue, Angular, WordPress, or hospital portal websites.
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#f8fafc" }}>
          📱 Floating Glassmorphism Widget Preview
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>
          Look at the bottom right corner of your screen! The floating AI Queue widget is active for <strong>{tenantId}</strong>.
        </p>
      </div>
    </div>
  );
}

// ===========================================================================
// SUB-PAGE 5: QR KIOSK & SCANNER
// ===========================================================================
function QRKioskScannerPage({ tenantId, kioskQrData, activeTicket, ticketQrData }) {
  return (
    <div style={pageGridStyle}>
      {/* Left Column: Tenant Kiosk QR Code */}
      <div style={panelStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#f8fafc" }}>
          🔲 Kiosk QR Poster Generator — {tenantId}
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>
          Print or display this QR code at hospital entry desks or kiosk screens for instant phone check-in.
        </p>

        {kioskQrData ? (
          <div style={{ textAlign: "center", padding: "24px", background: "#0f172a", borderRadius: "12px", border: "1px solid #334155" }}>
            <img
              src={kioskQrData.qr_code_base64}
              alt="Tenant Kiosk QR"
              style={{ width: "200px", height: "200px", borderRadius: "12px", background: "#fff", padding: "10px" }}
            />
            <p style={{ margin: "12px 0 0 0", color: "#cbd5e1", fontSize: "12px" }}>
              Target Link: <code style={{ color: "#38bdf8" }}>{kioskQrData.target_url}</code>
            </p>
          </div>
        ) : (
          <p style={{ color: "#94a3b8" }}>Generating QR code...</p>
        )}
      </div>

      {/* Right Column: Ticket Scanner Simulator */}
      <div style={panelStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#f8fafc" }}>
          📷 Staff QR Ticket Scanner & Mobile Pass
        </h2>

        {!activeTicket ? (
          <p style={{ color: "#94a3b8" }}>No active ticket issued yet. Issue a ticket on the Customer Queue Portal page first.</p>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", background: "#0f172a", borderRadius: "12px", border: "1px solid #334155" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#4ade80" }}>Ticket #{activeTicket.ticket_id} Active</h3>
            {ticketQrData && (
              <img
                src={ticketQrData.qr_code_base64}
                alt="Active Ticket QR"
                style={{ width: "160px", height: "160px", borderRadius: "10px", background: "#fff", padding: "8px" }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// STYLES
// ===========================================================================
const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  color: "#f8fafc",
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  padding: "24px 32px",
};

const headerStyle = {
  display: "flex",
  justify: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  paddingBottom: "16px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
};

const logoBadgeStyle = {
  padding: "8px 14px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: "14px",
  boxShadow: "0 4px 14px rgba(56, 189, 248, 0.4)",
};

const titleStyle = { margin: 0, fontSize: "20px", fontWeight: 800, color: "#f8fafc" };
const subtitleStyle = { margin: 0, fontSize: "12px", color: "#94a3b8" };

const navBarStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "24px",
  background: "rgba(15, 23, 42, 0.6)",
  padding: "6px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

const navTabStyle = (isActive, accentColor) => ({
  flex: 1,
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: isActive ? accentColor : "transparent",
  color: isActive ? "#fff" : "#94a3b8",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s ease",
});

const pageGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
};

const panelStyle = {
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(16px)",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
};

const selectStyle = {
  padding: "8px 12px",
  borderRadius: "8px",
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid #334155",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const labelStyle = { display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "6px", fontWeight: 600 };

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f8fafc",
  fontSize: "13px",
};

const primaryBtnStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
};

const secondaryBtnStyle = {
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};

const ticketCardStyle = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: "14px",
  border: "1px solid rgba(56, 189, 248, 0.3)",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
};

const statusBadgeStyle = (status) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  background: status === "serving" ? "rgba(74, 222, 128, 0.2)" : "rgba(245, 158, 11, 0.2)",
  color: status === "serving" ? "#4ade80" : "#f59e0b",
});

const statCardStyle = {
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(12px)",
  borderRadius: "14px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  padding: "16px",
};

const statLabelStyle = { fontSize: "12px", color: "#94a3b8", fontWeight: 600, display: "block" };
const statValStyle = { fontSize: "28px", fontWeight: 800, margin: "4px 0" };

const counterBtnStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "6px",
  border: "none",
  background: "#334155",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const callNextBtnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.4)",
};

const servingItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px",
  background: "#0f172a",
  borderRadius: "10px",
  border: "1px solid #334155",
};

const completeBtnStyle = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "none",
  background: "rgba(34, 197, 94, 0.2)",
  color: "#4ade80",
  fontWeight: 700,
  fontSize: "11px",
  cursor: "pointer",
};

const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "12px" };
const thStyle = { padding: "10px", textAlign: "left", color: "#94a3b8", borderBottom: "1px solid #334155" };
const tdStyle = { padding: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" };
const prioBadgeStyle = (bg) => ({
  padding: "2px 6px",
  borderRadius: "4px",
  background: `${bg}22`,
  color: bg,
  fontWeight: 700,
  fontSize: "10px",
});

const modelHealthCardStyle = {
  padding: "18px",
  borderRadius: "12px",
  background: "#0f172a",
  border: "1px solid #334155",
};

const smallStatStyle = {
  padding: "10px",
  background: "#1e293b",
  borderRadius: "8px",
};

const codeBlockStyle = {
  background: "#0f172a",
  padding: "16px",
  borderRadius: "10px",
  border: "1px solid #334155",
  fontSize: "12px",
  color: "#38bdf8",
  overflowX: "auto",
};

const copyBtnStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  padding: "6px 12px",
  borderRadius: "6px",
  border: "none",
  background: "#0284c7",
  color: "#fff",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

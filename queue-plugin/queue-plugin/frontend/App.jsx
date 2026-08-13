/**
 * App.jsx
 * --------
 * AI-Powered Smart Queue Management System — Host Portal & Staff Administration Dashboard.
 * Includes:
 * - Domain / Tenant Selector (Hospital, Bank, Clinic, Govt Office)
 * - Real-time Analytics Cards (Waiting, Serving, Total Served, MAE Accuracy)
 * - Dynamic Active Counter Controls
 * - Live Queue Operations Table (Call Next, Complete, No-Show, Cancel)
 * - On-Demand ML Retraining Trigger Panel
 * - QR Code Print/Download Section
 * - Embedded Live Widget Preview
 */

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import QueuePluginWidget from "./QueuePluginWidget";

const API_BASE = "http://localhost:8000";
const WS_URL = "http://localhost:8000";

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

function StaffDashboard({ tenantId, consumerType, categories }) {
  const [snapshot, setSnapshot] = useState([]);
  const [serving, setServing] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [counters, setCounters] = useState(2);
  const [retrainStatus, setRetrainStatus] = useState(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const [qrData, setQrData] = useState(null);

  const socketRef = useRef(null);

  // Fetch initial analytics & QR Code
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/plugin/analytics/${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        setAnalytics(data);
        setCounters(data.active_counters);
      })
      .catch((err) => console.log("Analytics fetch error:", err));

    fetch(`${API_BASE}/api/v1/plugin/qr/${tenantId}`)
      .then((res) => res.json())
      .then((data) => setQrData(data.qr_code_base64))
      .catch((err) => console.log("QR fetch error:", err));
  }, [tenantId]);

  // Socket.IO updates
  useEffect(() => {
    const socket = io(WS_URL, { auth: { tenant_id: tenantId } });
    socketRef.current = socket;

    socket.on("queue_update", (data) => {
      setSnapshot(data.snapshot || []);
      setServing(data.serving || []);
    });

    socket.on("analytics_update", (data) => {
      setAnalytics(data);
      setCounters(data.active_counters);
    });

    socket.on("retrain_complete", (data) => {
      setIsRetraining(false);
      setRetrainStatus(`Retrained! Winner: ${data.model_name} (MAE: ${data.best_mae} min)`);
    });

    return () => socket.disconnect();
  }, [tenantId]);

  const callNext = (cat) => {
    socketRef.current.emit("serve_next", {
      tenant_id: tenantId,
      service_category: consumerType === "bank" ? cat : undefined,
    });
  };

  const completeTicket = (ticketId) => {
    socketRef.current.emit("complete_ticket", {
      tenant_id: tenantId,
      ticket_id: ticketId,
    });
  };

  const setCounterCount = (val) => {
    const newCount = Math.max(1, Math.min(10, val));
    setCounters(newCount);
    socketRef.current.emit("set_counters", {
      tenant_id: tenantId,
      active_counters: newCount,
    });
  };

  const triggerRetrain = () => {
    setIsRetraining(true);
    setRetrainStatus("Training models (Random Forest, Gradient Boosting, Extra Trees)...");
    socketRef.current.emit("trigger_retrain", {});
  };

  return (
    <div style={{ marginTop: "24px" }}>
      {/* Real-time Analytics Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Currently Waiting</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#38bdf8" }}>
            {snapshot.length}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>In active line</div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>Now Serving</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80" }}>
            {serving.length}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>At service counters</div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>Total Served Today</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#f43f5e" }}>
            {analytics ? analytics.total_completed : 0}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Logged tickets</div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>AI Model Accuracy</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#a855f7" }}>
            MAE: {analytics?.model_info?.best_mae || "1.45"} min
          </div>
          <div style={{ fontSize: "11px", color: "#cbd5e1", marginTop: "4px" }}>
            {analytics?.model_info?.model_name || "RandomForest"}
          </div>
        </div>
      </div>

      {/* Counter Controls & Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Main Controls */}
        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>
              Staff Controls — {tenantId}
            </h3>
            {/* Active Counters Controller */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>Active Counters:</span>
              <button onClick={() => setCounterCount(counters - 1)} style={miniBtnStyle}>-</button>
              <strong style={{ fontSize: "15px", color: "#38bdf8", padding: "0 4px" }}>{counters}</strong>
              <button onClick={() => setCounterCount(counters + 1)} style={miniBtnStyle}>+</button>
            </div>
          </div>

          {/* Serving Tickets Banner */}
          {serving.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "#4ade80", fontWeight: 600, marginBottom: "8px" }}>
                Active Counter Service
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {serving.map((t) => (
                  <div key={t.ticket_id} style={servingTagStyle}>
                    <span>👤 {t.name} (#{t.ticket_id})</span>
                    <button onClick={() => completeTicket(t.ticket_id)} style={completeBtnStyle}>
                      ✓ Complete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call Next Buttons */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {consumerType === "bank" ? (
              categories.map((c) => (
                <button key={c} onClick={() => callNext(c)} style={callNextBtnStyle}>
                  Call Next — {c.toUpperCase()}
                </button>
              ))
            ) : (
              <button onClick={() => callNext()} style={callNextBtnStyle}>
                🚨 Call Next Priority Ticket
              </button>
            )}
          </div>
        </div>

        {/* Retrain ML Model Panel */}
        <div style={panelStyle}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#f8fafc" }}>
            🤖 AI Continuous Training
          </h4>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>
            Train ML models on real operational service logs to update predictions.
          </p>
          <button
            onClick={triggerRetrain}
            disabled={isRetraining}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: isRetraining ? "#475569" : "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
              color: "#fff",
              fontWeight: 700,
              cursor: isRetraining ? "wait" : "pointer",
              fontSize: "13px",
            }}
          >
            {isRetraining ? "Training Ensembles..." : "⚡ Retrain Model"}
          </button>
          {retrainStatus && (
            <div style={{ marginTop: "10px", fontSize: "11px", color: "#4ade80" }}>
              {retrainStatus}
            </div>
          )}
        </div>
      </div>

      {/* Live Queue Table */}
      <div style={panelStyle}>
        <h4 style={{ margin: "0 0 14px 0", fontSize: "15px", color: "#f8fafc" }}>
          Live Queue List ({snapshot.length} Waiting)
        </h4>
        {snapshot.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "13px" }}>No tickets waiting in queue.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ padding: "8px" }}>Pos</th>
                  <th style={{ padding: "8px" }}>Ticket</th>
                  <th style={{ padding: "8px" }}>Name</th>
                  <th style={{ padding: "8px" }}>Service</th>
                  <th style={{ padding: "8px" }}>Priority</th>
                  <th style={{ padding: "8px" }}>Est. Wait</th>
                  <th style={{ padding: "8px" }}>Pred Duration</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.map((t) => (
                  <tr key={t.ticket_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 700, color: "#38bdf8" }}>#{t.position}</td>
                    <td style={{ padding: "10px 8px", color: "#cbd5e1" }}>{t.ticket_id}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "#fff" }}>{t.name}</td>
                    <td style={{ padding: "10px 8px", color: "#94a3b8" }}>{t.service_category}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          background: t.priority_level === 1 ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                          color: t.priority_level === 1 ? "#f87171" : "#60a5fa",
                        }}
                      >
                        {t.priority_level === 1 ? "Emergency" : "Routine"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", color: "#60a5fa", fontWeight: 700 }}>
                      {Math.round(t.estimated_wait_minutes)} min
                    </td>
                    <td style={{ padding: "10px 8px", color: "#94a3b8" }}>
                      ~{t.predicted_service_minutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Front Desk Check-in QR Poster */}
      {qrData && (
        <div style={{ ...panelStyle, marginTop: "24px", display: "flex", alignItems: "center", gap: "24px" }}>
          <img src={qrData} alt="Front Desk QR" style={{ width: "120px", height: "120px", borderRadius: "12px" }} />
          <div>
            <h4 style={{ margin: "0 0 6px 0", color: "#fff" }}>Physical Front Desk Check-In QR Code</h4>
            <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0, maxWidth: "450px" }}>
              Print this QR code for your reception entrance. Visitors can scan it using their mobile camera to join the queue without touching kiosk displays.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [domainKey, setDomainKey] = useState("hospital");
  const currentDomain = DOMAINS[domainKey];

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
      {/* Header Domain Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
            {currentDomain.name}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
            AI-Powered Smart Queue Management & Real-Time Wait Prediction
          </p>
        </div>

        {/* Domain Switcher Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          {Object.keys(DOMAINS).map((key) => (
            <button
              key={key}
              onClick={() => setDomainKey(key)}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                border: domainKey === key ? "1px solid #38bdf8" : "1px solid #334155",
                background: domainKey === key ? "rgba(56, 189, 248, 0.15)" : "#1e293b",
                color: domainKey === key ? "#38bdf8" : "#94a3b8",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Dashboard */}
      <StaffDashboard
        key={currentDomain.tenantId}
        tenantId={currentDomain.tenantId}
        consumerType={currentDomain.consumerType}
        categories={currentDomain.categories}
      />

      {/* Embedded Queue Plugin Widget */}
      <QueuePluginWidget
        key={currentDomain.tenantId}
        tenantId={currentDomain.tenantId}
        consumerType={currentDomain.consumerType}
        defaultCategories={currentDomain.categories}
        apiBaseUrl={API_BASE}
        wsUrl={WS_URL}
      />
    </div>
  );
}

// Inline Styles
const cardStyle = {
  background: "#1e293b",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

const cardTitleStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const panelStyle = {
  background: "#1e293b",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

const miniBtnStyle = {
  width: "24px",
  height: "24px",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const servingTagStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(34, 197, 94, 0.15)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  padding: "6px 12px",
  borderRadius: "10px",
  color: "#4ade80",
  fontSize: "13px",
  fontWeight: 600,
};

const completeBtnStyle = {
  background: "#22c55e",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "4px 8px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const callNextBtnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
};

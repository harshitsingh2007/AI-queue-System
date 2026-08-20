/**
 * PatientPage.jsx
 * ---------------
 * 📱 Patient Self-Checkin Portal (Consumer view).
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect } from "react";
import { API_BASE, HOSPITAL_CONFIG } from "../config/hospitalConfig";

export default function PatientPage({
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
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: "12px", marginBottom: "16px", textAlign: "center", fontWeight: 600 }}>
          💡 <strong>Staff Admin Mode:</strong> You are logged in as Staff Admin (<em>{currentUser.username}</em>). Test patient check-ins created here will enter the live queue line.
        </div>
      )}

      <div style={standaloneCardStyle}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "42px", display: "block", marginBottom: "8px" }}>📱</span>
          <h2 style={{ margin: "0 0 6px 0", fontSize: "24px", color: "#064E3B", fontWeight: 800 }}>
            Patient Self-Checkin Kiosk
          </h2>
          <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
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
                style={triageBtnStyle(priority === 2, "#047857")}
              >
                📋 Routine Consultation
                <span style={{ display: "block", fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>Standard Queue Order</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority(1)}
                style={triageBtnStyle(priority === 1, "#DC2626")}
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
          <div style={{ marginTop: "16px", padding: "12px", borderRadius: "10px", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: "13px", textAlign: "center", fontWeight: 600 }}>
            {statusMsg}
          </div>
        )}
      </div>

      {/* Digital Ticket Pass */}
      {activeTicket && (
        <div style={{ ...standaloneCardStyle, marginTop: "24px", border: "2px solid #059669" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #D8E8DD", paddingBottom: "14px", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase" }}>Your AI Token</span>
              <h2 style={{ margin: 0, fontSize: "32px", color: "#047857", fontWeight: 800 }}>
                #{activeTicket.ticket_id}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Current Status</span>
              <span style={passStatusBadgeStyle(activeTicket.status)}>{activeTicket.status.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Patient Name</span>
              <p style={{ margin: "2px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "15px" }}>{activeTicket.name}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Department</span>
              <p style={{ margin: "2px 0 0 0", color: "#047857", fontWeight: 700, fontSize: "15px" }}>{activeTicket.service_category.toUpperCase()}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Queue Position</span>
              <p style={{ margin: "2px 0 0 0", color: "#D97706", fontWeight: 800, fontSize: "24px" }}>
                #{activeTicket.position}
              </p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Estimated Wait</span>
              <p style={{ margin: "2px 0 0 0", color: "#059669", fontWeight: 800, fontSize: "24px" }}>
                {activeTicket.estimated_wait_minutes} min
              </p>
            </div>
          </div>

          {ticketQrData && (
            <div style={{ textAlign: "center", borderTop: "1px solid #D8E8DD", paddingTop: "18px" }}>
              <img
                src={ticketQrData.qr_code_base64}
                alt="Ticket QR Code"
                style={{ width: "150px", height: "150px", borderRadius: "12px", background: "#fff", padding: "8px", border: "1px solid #CBD5E1" }}
              />
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#64748B" }}>
                Keep this screen open or scan code at desk scanner when called
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Soft Green Clinical Theme Styles
const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "24px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const fieldLabelStyle = { display: "block", fontSize: "12px", color: "#475569", marginBottom: "6px", fontWeight: 600 };

const fieldInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#0F172A",
  fontSize: "13px",
};

const triageBtnStyle = (active, accent) => ({
  padding: "12px",
  borderRadius: "10px",
  border: active ? `2px solid ${accent}` : "1px solid #CBD5E1",
  background: active ? (accent === "#047857" ? "#ECFDF5" : "#FEF2F2") : "#F8FAFC",
  color: active ? accent : "#64748B",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
});

const patientSubmitBtnStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
};

const passStatusBadgeStyle = (status) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  background: status === "serving" ? "#ECFDF5" : "#FEF3C7",
  color: status === "serving" ? "#047857" : "#D97706",
  border: status === "serving" ? "1px solid #A7F3D0" : "1px solid #FDE68A",
});

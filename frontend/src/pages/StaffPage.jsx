/**
 * StaffPage.jsx
 * -------------
 * 🛡️ Doctor & Staff Desk Dashboard (Admin view).
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React from "react";

export default function StaffPage({
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Patients Waiting</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#047857", margin: "4px 0" }}>
            {analytics ? analytics.currently_waiting : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>In Waiting Queue Line</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Currently Serving</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#10B981", margin: "4px 0" }}>
            {analytics ? analytics.currently_serving : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>At Doctor Desks</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Completed Today</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0284C7", margin: "4px 0" }}>
            {analytics ? analytics.total_completed : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>Total Patients Consulted</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Active Doctor Desks</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#D97706", margin: 0 }}>
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
        <div style={standaloneCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#064E3B", fontWeight: 800 }}>
                🛡️ Doctor Desk Operations
              </h3>
              <span style={{ fontSize: "12px", color: "#64748B" }}>Priority Call Control</span>
            </div>

            <button onClick={handleServeNext} style={callPriorityBtnStyle}>
              🚨 Call Next Priority Ticket
            </button>
          </div>

          <h4 style={{ margin: "0 0 12px 0", color: "#475569", fontSize: "13px" }}>Now Serving at Doctor Desks:</h4>

          {servingTickets.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #CBD5E1", color: "#94A3B8", fontSize: "13px" }}>
              No patients currently at doctor desks. Click "Call Next Priority Ticket" above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {servingTickets.map((t) => (
                <div key={t.ticket_id} style={staffServingRowStyle}>
                  <div>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#047857" }}>#{t.ticket_id}</span>
                    <span style={{ marginLeft: "12px", color: "#0F172A", fontWeight: 700, fontSize: "15px" }}>{t.name}</span>
                    <span style={{ marginLeft: "10px", fontSize: "11px", color: "#0284C7" }}>({t.service_category.toUpperCase()})</span>
                  </div>

                  <button onClick={() => handleCompleteTicket(t.ticket_id)} style={finishBtnStyle}>
                    ✓ Mark Consultation Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={standaloneCardStyle}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#064E3B", fontWeight: 800 }}>
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
                    <td colSpan="6" style={{ ...staffTdStyle, textAlign: "center", color: "#94A3B8" }}>
                      Waiting queue is currently empty.
                    </td>
                  </tr>
                ) : (
                  queueSnapshot.map((t) => (
                    <tr key={t.ticket_id}>
                      <td style={staffTdStyle}>#{t.position}</td>
                      <td style={{ ...staffTdStyle, fontWeight: 800, color: "#047857" }}>#{t.ticket_id}</td>
                      <td style={{ ...staffTdStyle, fontWeight: 600 }}>{t.name}</td>
                      <td style={staffTdStyle}>{t.service_category}</td>
                      <td style={staffTdStyle}>
                        {t.priority_level === 1 ? (
                          <span style={badgePrioStyle("#DC2626")}>🚨 Emergency</span>
                        ) : (
                          <span style={badgePrioStyle("#0284C7")}>📋 Routine</span>
                        )}
                      </td>
                      <td style={{ ...staffTdStyle, fontWeight: 800, color: "#059669" }}>{t.estimated_wait_minutes} min</td>
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

// Soft Green Clinical Theme Styles
const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "24px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const staffStatCardStyle = {
  background: "#FFFFFF",
  borderRadius: "14px",
  border: "1px solid #D8E8DD",
  padding: "18px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
};

const plusMinusBtnStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "6px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#0F172A",
  fontWeight: 700,
  cursor: "pointer",
};

const callPriorityBtnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
};

const staffServingRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px",
  background: "#ECFDF5",
  borderRadius: "12px",
  border: "1px solid #A7F3D0",
};

const finishBtnStyle = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid #A7F3D0",
  background: "#FFFFFF",
  color: "#047857",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
};

const staffTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "12px" };
const staffThStyle = { padding: "10px", textAlign: "left", color: "#64748B", borderBottom: "1px solid #D8E8DD" };
const staffTdStyle = { padding: "10px", borderBottom: "1px solid #F1F5F9" };
const badgePrioStyle = (bg) => ({
  padding: "2px 6px",
  borderRadius: "4px",
  background: bg === "#DC2626" ? "#FEF2F2" : "#E0F2FE",
  color: bg,
  fontWeight: 700,
  fontSize: "10px",
  border: bg === "#DC2626" ? "1px solid #FECACA" : "1px solid #BAE6FD",
});

/**
 * StaffPage.jsx
 * -------------
 * 🛡️ Doctor & Staff Desk Dashboard (Admin view).
 * Features Multi-Department Ticket Classification & Security Routing!
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config/hospitalConfig";

export default function StaffPage({
  tenantId,
  currentUser,
  analytics,
  queueSnapshot,
  servingTickets,
  handleServeNext,
  handleCompleteTicket,
  handleCounterChange,
}) {
  const [appointments, setAppointments] = useState([]);
  const adminDept = currentUser && currentUser.department ? currentUser.department.toLowerCase() : "all";

  const fetchTenantAppointments = useCallback(() => {
    const deptQuery = adminDept && adminDept !== "all" ? `?department=${encodeURIComponent(adminDept)}` : "";
    fetch(`${API_BASE}/api/v1/plugin/appointments/tenant/${tenantId}${deptQuery}`)
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments || []))
      .catch((e) => console.log("Fetch tenant appointments error:", e));
  }, [tenantId, adminDept]);

  useEffect(() => {
    fetchTenantAppointments();
    const interval = setInterval(fetchTenantAppointments, 5000);
    return () => clearInterval(interval);
  }, [fetchTenantAppointments]);

  return (
    <div>
      {/* Department Security Boundary Banner */}
      <div style={deptBannerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>🛡️</span>
          <div>
            <strong style={{ fontSize: "14px", color: "#064E3B" }}>
              Department Isolation: <span style={{ color: "#047857", textTransform: "uppercase" }}>{adminDept}</span>
            </strong>
            <span style={{ display: "block", fontSize: "11px", color: "#64748B" }}>
              {adminDept === "all"
                ? "Super Admin Mode — Managing tickets across ALL hospital departments."
                : `Strict Security Boundary Active — You are managing tickets & queue ONLY for the ${adminDept.toUpperCase()} department.`}
            </span>
          </div>
        </div>

        <span style={deptTagStyle}>
          {adminDept === "all" ? "SUPER ADMIN" : `${adminDept.toUpperCase()} ADMIN`}
        </span>
      </div>

      {/* Analytics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Patients Waiting</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#047857", margin: "4px 0" }}>
            {analytics ? analytics.currently_waiting : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>In {adminDept.toUpperCase()} Queue</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Currently Serving</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#10B981", margin: "4px 0" }}>
            {analytics ? analytics.currently_serving : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>At {adminDept.toUpperCase()} Desks</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Booked Slots Today</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0284C7", margin: "4px 0" }}>
            {appointments.length}
          </h2>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>{adminDept.toUpperCase()} Appointments</span>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Doctor Operations */}
        <div style={standaloneCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#064E3B", fontWeight: 800 }}>
                🛡️ {adminDept.toUpperCase()} Desk Operations
              </h3>
              <span style={{ fontSize: "12px", color: "#64748B" }}>Department Call Control</span>
            </div>

            <button onClick={handleServeNext} style={callPriorityBtnStyle}>
              🚨 Call Next {adminDept.toUpperCase()} Ticket
            </button>
          </div>

          <h4 style={{ margin: "0 0 12px 0", color: "#475569", fontSize: "13px" }}>Now Serving at {adminDept.toUpperCase()} Desks:</h4>

          {servingTickets.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #CBD5E1", color: "#94A3B8", fontSize: "13px" }}>
              No patients currently being served. Click "Call Next {adminDept.toUpperCase()} Ticket" above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {servingTickets.map((t) => (
                <div key={t.ticket_id} style={staffServingRowStyle}>
                  <div>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#047857" }}>#{t.ticket_id}</span>
                    <span style={{ marginLeft: "12px", color: "#0F172A", fontWeight: 700, fontSize: "15px" }}>{t.name}</span>
                    <span style={{ marginLeft: "10px", fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>({t.service_category.toUpperCase()})</span>
                  </div>

                  <button onClick={() => handleCompleteTicket(t.ticket_id)} style={finishBtnStyle}>
                    ✓ Mark Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Department Queue Snapshot */}
        <div style={standaloneCardStyle}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#064E3B", fontWeight: 800 }}>
            📊 {adminDept.toUpperCase()} Waiting Line ({queueSnapshot.length})
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
                      No waiting tickets in {adminDept.toUpperCase()} department.
                    </td>
                  </tr>
                ) : (
                  queueSnapshot.map((t) => (
                    <tr key={t.ticket_id}>
                      <td style={staffTdStyle}>#{t.position}</td>
                      <td style={{ ...staffTdStyle, fontWeight: 800, color: "#047857" }}>#{t.ticket_id}</td>
                      <td style={{ ...staffTdStyle, fontWeight: 600 }}>{t.name}</td>
                      <td style={{ ...staffTdStyle, fontWeight: 700, color: "#0284C7" }}>{t.service_category.toUpperCase()}</td>
                      <td style={staffTdStyle}>
                        {t.priority_level === 1 ? (
                          <span style={badgePrioStyle("#DC2626")}>🚨 Emergency / Appt</span>
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

      {/* Pre-Scheduled Appointments Roster Panel */}
      <div style={standaloneCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "20px", color: "#064E3B", fontWeight: 800 }}>
              🗓️ {adminDept.toUpperCase()} Appointments Roster ({appointments.length})
            </h3>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Strict Department Routing — Only displaying pre-scheduled appointments for {adminDept.toUpperCase()}
            </span>
          </div>

          <button onClick={fetchTenantAppointments} style={refreshBtnStyle}>
            🔄 Refresh Roster
          </button>
        </div>

        {appointments.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #CBD5E1", color: "#94A3B8", fontSize: "13px" }}>
            No booked appointments for {adminDept.toUpperCase()} department yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={staffTableStyle}>
              <thead>
                <tr>
                  <th style={staffThStyle}>Appt Code</th>
                  <th style={staffThStyle}>Patient Name</th>
                  <th style={staffThStyle}>Department</th>
                  <th style={staffThStyle}>Reserved Slot</th>
                  <th style={staffThStyle}>Status</th>
                  <th style={staffThStyle}>Merged Token ID</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.appointment_id}>
                    <td style={{ ...staffTdStyle, fontWeight: 800, color: "#047857" }}>{apt.appointment_id}</td>
                    <td style={{ ...staffTdStyle, fontWeight: 700 }}>{apt.patient_name}</td>
                    <td style={{ ...staffTdStyle, fontWeight: 700, color: "#0284C7" }}>{apt.service_category.toUpperCase()}</td>
                    <td style={{ ...staffTdStyle, fontWeight: 600, color: "#0284C7" }}>
                      {apt.appointment_date} @ {apt.time_slot}
                    </td>
                    <td style={staffTdStyle}>
                      <span style={aptStatusBadgeStyle(apt.status)}>
                        {apt.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...staffTdStyle, fontWeight: 800, color: "#D97706" }}>
                      {apt.ticket_id ? `#${apt.ticket_id}` : "—"}
                    </td>
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

// Soft Green Clinical Theme Styles
const deptBannerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 20px",
  borderRadius: "14px",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  marginBottom: "20px",
};

const deptTagStyle = {
  padding: "5px 12px",
  borderRadius: "10px",
  background: "#047857",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 800,
  boxShadow: "0 2px 8px rgba(4, 120, 87, 0.2)",
};

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

const refreshBtnStyle = {
  padding: "6px 12px",
  borderRadius: "8px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#475569",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
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

const aptStatusBadgeStyle = (status) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  background: status === "checked_in" ? "#ECFDF5" : "#FEF3C7",
  color: status === "checked_in" ? "#047857" : "#D97706",
  border: status === "checked_in" ? "1px solid #A7F3D0" : "1px solid #FDE68A",
});

/**
 * DatabaseInspectorPage.jsx
 * -------------------------
 * SQL Database Inspector & Schema Explorer.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/hospitalConfig";

export default function DatabaseInspectorPage() {
  const [tablesData, setTablesData] = useState({});
  const [activeTable, setActiveTable] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  const fetchDatabaseData = async () => {
    setLoading(true);
    try {
      const [usersRes, ticketsRes, logsRes, aptsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/auth/users`).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/plugin/queue/city-hospital-01`).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/plugin/analytics/city-hospital-01`).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/plugin/appointments/tenant/city-hospital-01`).then((r) => r.json()),
      ]);

      setTablesData({
        users: usersRes.users || [],
        tickets: [...(ticketsRes.serving || []), ...(ticketsRes.snapshot || [])],
        appointments: aptsRes.appointments || [],
      });
      setLoading(false);
    } catch (e) {
      console.log("DB fetch error:", e);
      setLoading(false);
    }
  };

  const currentRows = tablesData[activeTable] || [];
  const filteredRows = currentRows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColumns = (rows) => (rows.length > 0 ? Object.keys(rows[0]) : []);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Top Header Card */}
      <div style={{ ...dbCardStyle, marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#047857", fontWeight: 700, textTransform: "uppercase" }}>Database Inspector</span>
          <h2 style={{ margin: "4px 0 0 0", color: "#064E3B", fontSize: "24px", fontWeight: 800 }}>
            SQL Database & Schema Inspector
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "13px" }}>
            Inspect SQLite tables: <code>users</code>, <code>tickets</code>, <code>appointments</code>, and <code>service_logs</code>.
          </p>
        </div>

        <button onClick={fetchDatabaseData} style={refreshBtnStyle}>
          Refresh Tables
        </button>
      </div>

      {/* Table Selector Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTable("users")}
          style={tableTabStyle(activeTable === "users")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          users ({tablesData.users ? tablesData.users.length : 0})
        </button>
        <button
          onClick={() => setActiveTable("tickets")}
          style={tableTabStyle(activeTable === "tickets")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><line x1="13" y1="5" x2="13" y2="19"/></svg>
          tickets ({tablesData.tickets ? tablesData.tickets.length : 0})
        </button>
        <button
          onClick={() => setActiveTable("appointments")}
          style={tableTabStyle(activeTable === "appointments")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          appointments ({tablesData.appointments ? tablesData.appointments.length : 0})
        </button>
      </div>

      {/* Main Table Inspector Card */}
      <div style={dbCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#064E3B", fontWeight: 800 }}>
            Table: <code>{activeTable}</code> ({filteredRows.length} records)
          </h3>

          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={dbSearchInputStyle}
          />
        </div>

        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8" }}>Loading database tables...</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #CBD5E1", color: "#94A3B8", fontSize: "13px" }}>
            No matching records in table '{activeTable}'.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={dbTableStyle}>
              <thead>
                <tr>
                  {getColumns(filteredRows).map((col) => (
                    <th key={col} style={dbThStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={idx}>
                    {getColumns(filteredRows).map((col) => (
                      <td key={col} style={dbTdStyle}>
                        {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col])}
                      </td>
                    ))}
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
const dbCardStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "24px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const refreshBtnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#0F172A",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
};

const tableTabStyle = (active) => ({
  padding: "10px 16px",
  borderRadius: "10px",
  border: active ? "2px solid #059669" : "1px solid #CBD5E1",
  background: active ? "#ECFDF5" : "#FFFFFF",
  color: active ? "#047857" : "#64748B",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const dbSearchInputStyle = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  fontSize: "12px",
  width: "220px",
};

const dbTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "12px" };
const dbThStyle = { padding: "10px", textAlign: "left", color: "#64748B", borderBottom: "1px solid #D8E8DD" };
const dbTdStyle = { padding: "10px", borderBottom: "1px solid #F1F5F9" };

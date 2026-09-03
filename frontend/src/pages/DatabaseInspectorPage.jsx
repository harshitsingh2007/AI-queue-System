/**
 * DatabaseInspectorPage.jsx
 * -------------------------
 * Production PostgreSQL Database Inspector & Schema Explorer.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/hospitalConfig";

export default function DatabaseInspectorPage() {
  const [dbInfo, setDbInfo] = useState({
    db_type: "Local PostgreSQL",
    engine: "PostgreSQL",
    database: "ai_queue",
    host: "localhost",
    port: 5432,
    status: "Connected",
  });
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
      const res = await fetch(`${API_BASE}/api/v1/admin/db-overview`).then((r) => r.json());
      if (res.status === "success" && res.database) {
        if (res.db_info) setDbInfo(res.db_info);
        setTablesData(res.database);
        const availableTables = Object.keys(res.database);
        if (availableTables.length > 0 && !res.database[activeTable]) {
          setActiveTable(availableTables[0]);
        }
      }
      setLoading(false);
    } catch (e) {
      console.log("DB fetch error:", e);
      setLoading(false);
    }
  };

  const tableNames = Object.keys(tablesData);
  const activeTableObj = tablesData[activeTable] || { count: 0, schema: [], rows: [] };
  const currentRows = activeTableObj.rows || [];
  const filteredRows = currentRows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColumns = (rows) => {
    if (rows.length > 0) return Object.keys(rows[0]);
    if (activeTableObj.schema && activeTableObj.schema.length > 0) {
      return activeTableObj.schema.map((s) => s.name);
    }
    return [];
  };

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Top Header & Connection Card */}
      <div style={{ ...dbCardStyle, marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "#047857", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Database Inspector
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 9px", borderRadius: "999px", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", fontSize: "11px", fontWeight: 700 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                {dbInfo.status || "Connected"}
              </span>
            </div>
            <h2 style={{ margin: "4px 0 0 0", color: "#064E3B", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              PostgreSQL Schema & Record Explorer
            </h2>
            <p style={{ margin: "6px 0 0 0", color: "#64748B", fontSize: "13px" }}>
              Inspect live tables, real-time schema column definitions, and active database persistence.
            </p>
          </div>

          <button onClick={fetchDatabaseData} style={refreshBtnStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Refresh Tables
          </button>
        </div>

        {/* Connection Specs Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "20px", paddingTop: "18px", borderTop: "1px solid #E2E8F0" }}>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>Engine</span>
            <span style={statValueStyle}>{dbInfo.engine || "PostgreSQL"}</span>
          </div>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>Database</span>
            <span style={statValueStyle}>{dbInfo.database || "ai_queue"}</span>
          </div>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>Host</span>
            <span style={statValueStyle}>{dbInfo.host || "localhost"}</span>
          </div>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>Port</span>
            <span style={statValueStyle}>{dbInfo.port || 5432}</span>
          </div>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>Active Mode</span>
            <span style={statValueStyle}>{dbInfo.db_type || "Local PostgreSQL"}</span>
          </div>
        </div>
      </div>

      {/* Table Selector Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "6px" }}>
        {tableNames.map((tbl) => {
          const tInfo = tablesData[tbl] || {};
          const isAct = activeTable === tbl;
          return (
            <button
              key={tbl}
              onClick={() => {
                setActiveTable(tbl);
                setSearchQuery("");
              }}
              style={tableTabStyle(isAct)}
            >
              <span>{tbl}</span>
              <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "99px", background: isAct ? "#059669" : "#E2E8F0", color: isAct ? "#FFFFFF" : "#475569" }}>
                {tInfo.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table Inspector Card */}
      <div style={dbCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#064E3B", fontWeight: 800 }}>
              Table: <code style={{ color: "#047857" }}>{activeTable}</code>
            </h3>
            <p style={{ margin: "2px 0 0 0", color: "#64748B", fontSize: "12px" }}>
              Total Records: <strong>{activeTableObj.count ?? currentRows.length}</strong> (showing {filteredRows.length} loaded records)
            </p>
          </div>

          <input
            type="text"
            placeholder={`Search ${activeTable}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={dbSearchInputStyle}
          />
        </div>

        {/* Schema Columns Summary Pill Bar */}
        {activeTableObj.schema && activeTableObj.schema.length > 0 && (
          <div style={{ marginBottom: "18px", padding: "12px 14px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
              Schema Columns ({activeTableObj.schema.length}):
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {activeTableObj.schema.map((col, idx) => (
                <span key={idx} style={{ padding: "3px 8px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "11px", color: "#0F172A", display: "inline-flex", gap: "4px" }}>
                  <strong>{col.name}</strong>
                  <span style={{ color: "#64748B" }}>({col.type})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading PostgreSQL tables...</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: "36px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: "13px" }}>
            No records match "{searchQuery}" in table '{activeTable}'.
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: "12px" }}>
            <table style={dbTableStyle}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {getColumns(filteredRows).map((col) => (
                    <th key={col} style={dbThStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? "#FFFFFF" : "#FCFDFD" }}>
                    {getColumns(filteredRows).map((col) => (
                      <td key={col} style={dbTdStyle}>
                        {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col] ?? "")}
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
  padding: "9px 16px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#0F172A",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

const statBoxStyle = {
  padding: "10px 14px",
  background: "#F8FAFC",
  borderRadius: "10px",
  border: "1px solid #E2E8F0",
  display: "flex",
  flexDirection: "column",
  gap: "3px",
};

const statLabelStyle = {
  fontSize: "11px",
  color: "#64748B",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const statValueStyle = {
  fontSize: "13px",
  color: "#0F172A",
  fontWeight: 700,
};

const tableTabStyle = (active) => ({
  padding: "8px 14px",
  borderRadius: "10px",
  border: active ? "2px solid #059669" : "1px solid #CBD5E1",
  background: active ? "#ECFDF5" : "#FFFFFF",
  color: active ? "#047857" : "#64748B",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  whiteSpace: "nowrap",
});

const dbSearchInputStyle = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  fontSize: "12px",
  width: "240px",
};

const dbTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "12px" };
const dbThStyle = { padding: "10px 14px", textAlign: "left", color: "#475569", borderBottom: "1px solid #E2E8F0", fontWeight: 700, whiteSpace: "nowrap" };
const dbTdStyle = { padding: "9px 14px", borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis" };

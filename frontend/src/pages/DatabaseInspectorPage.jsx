/**
 * DatabaseInspectorPage.jsx
 * -------------------------
 * 🗄️ Interactive SQLite & Cloud SQL Database Inspector (Admin view).
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config/hospitalConfig";

export default function DatabaseInspectorPage() {
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
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748B" }}>
        <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>🗄️</span>
        Connecting to SQL Database & Loading tables...
      </div>
    );
  }

  if (errorMsg || !dbData) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#DC2626" }}>
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
            <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#064E3B", fontWeight: 800 }}>
              🗄️ Database Inspector
            </h2>
            {dbInfo && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  background: dbInfo.is_cloud ? "#ECFDF5" : "#E0F2FE",
                  color: dbInfo.is_cloud ? "#047857" : "#0284C7",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: dbInfo.is_cloud ? "1px solid #A7F3D0" : "1px solid #BAE6FD",
                }}
              >
                {dbInfo.is_cloud ? "☁️ " : "📁 "} {dbInfo.db_type}
              </span>
            )}
          </div>
          <span style={{ fontSize: "12px", color: "#64748B" }}>
            Target Connection: <code style={{ color: "#047857" }}>{dbInfo ? dbInfo.connection_url : "queue_system.db"}</code>
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
                border: active ? "2px solid #059669" : "1px solid #CBD5E1",
                background: active ? "#ECFDF5" : "#FFFFFF",
                color: active ? "#047857" : "#64748B",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
              }}
            >
              <span>📋 {tName}</span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: active ? "#047857" : "#CBD5E1",
                  color: "#ffffff",
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
            <h3 style={{ margin: 0, color: "#047857", fontSize: "18px", fontWeight: 800 }}>
              Table: <span style={{ color: "#0F172A" }}>{activeTable}</span>
            </h3>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
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
              border: "1px solid #CBD5E1",
              background: "#F8FAFC",
              color: "#0F172A",
              fontSize: "12px",
              width: "240px",
            }}
          />
        </div>

        {/* Schema Breakdown Badges */}
        <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "10px", background: "#F8FAFC", border: "1px solid #CBD5E1" }}>
          <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginBottom: "6px", fontWeight: 600 }}>
            PRAGMA Column Schema:
          </span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {schema.map((col) => (
              <span key={col.name} style={{ padding: "3px 8px", borderRadius: "6px", background: "#ECFDF5", color: "#047857", fontSize: "11px", border: "1px solid #A7F3D0" }}>
                <code>{col.name}</code> <span style={{ color: "#64748B" }}>({col.type})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Data Table */}
        {filteredRows.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>
            No records found in table <strong>{activeTable}</strong>.
          </div>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: "550px", overflowY: "auto" }}>
            <table style={staffTableStyle}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col} style={{ ...staffThStyle, sticky: "top", background: "#F8FAFC", zIndex: 2 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? "#F8FAFC" : "#FFFFFF" }}>
                    {columns.map((col) => {
                      const val = row[col];
                      const isJson = typeof val === "string" && (val.startsWith("{") || val.startsWith("["));
                      return (
                        <td key={col} style={staffTdStyle}>
                          {isJson ? (
                            <code style={{ fontSize: "10px", color: "#047857", background: "#ECFDF5", padding: "2px 6px", borderRadius: "4px" }}>
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

// Soft Green Clinical Theme Styles
const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "24px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
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

const staffTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "12px" };
const staffThStyle = { padding: "10px", textAlign: "left", color: "#64748B", borderBottom: "1px solid #D8E8DD" };
const staffTdStyle = { padding: "10px", borderBottom: "1px solid #F1F5F9" };

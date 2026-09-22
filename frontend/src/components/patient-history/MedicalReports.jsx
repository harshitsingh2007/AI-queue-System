/**
 * MedicalReports.jsx
 * ------------------
 * Displays diagnostic lab tests, pathology reports, and radiology imaging records.
 */

import React from "react";

export default function MedicalReports({ reports = [], language = "en" }) {
  const isHi = language === "hi";

  if (!reports || reports.length === 0) {
    return (
      <div style={emptyBoxStyle}>
        <span style={{ fontSize: "24px" }}>🧪</span>
        <div style={{ fontWeight: 700, fontSize: "13px", color: "#64748B", marginTop: "6px" }}>
          {isHi ? "कोई पैथोलॉजी या रेडियोलॉजी रिपोर्ट उपलब्ध नहीं है।" : "No diagnostic or laboratory reports found on file."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {reports.map((rep, idx) => (
        <div key={rep.id || idx} style={reportRowStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={reportIconBadge(rep.report_type)}>
              {rep.report_type?.includes("Radiology") ? "🩻" : "🧪"}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "13px", color: "#0F172A" }}>
                {rep.report_name}
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                <span>📅 {rep.report_date}</span>
                <span style={{ marginLeft: "8px" }}>• {rep.report_type}</span>
                {rep.doctor_name && <span style={{ marginLeft: "8px" }}>• {rep.doctor_name}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={statusBadgeStyle(rep.status)}>
              ✓ {rep.status || "Verified"}
            </span>
            <button
              type="button"
              onClick={() => alert(`Report Details: ${rep.report_name}\nDate: ${rep.report_date}\nStatus: ${rep.status}`)}
              style={viewBtnStyle}
            >
              {isHi ? "रिपोर्ट देखें" : "View Report"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const emptyBoxStyle = {
  background: "#F8FAFC",
  borderRadius: "12px",
  border: "1px dashed #CBD5E1",
  padding: "20px",
  textAlign: "center",
};

const reportRowStyle = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "12px",
  padding: "10px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "8px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
};

const reportIconBadge = (type) => ({
  width: "34px",
  height: "34px",
  borderRadius: "8px",
  background: type?.includes("Radiology") ? "#EFF6FF" : "#F0FDF4",
  color: type?.includes("Radiology") ? "#0284C7" : "#16A34A",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  flexShrink: 0,
});

const statusBadgeStyle = (status) => ({
  background: "#F0FDF4",
  color: "#16A34A",
  fontSize: "10.5px",
  fontWeight: 800,
  padding: "2px 7px",
  borderRadius: "5px",
  border: "1px solid #BBF7D0",
});

const viewBtnStyle = {
  background: "#F8FAFC",
  border: "1px solid #CBD5E1",
  color: "#334155",
  fontSize: "11px",
  fontWeight: 700,
  padding: "4px 9px",
  borderRadius: "6px",
  cursor: "pointer",
};

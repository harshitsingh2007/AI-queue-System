/**
 * HistorySummary.jsx
 * ------------------
 * Summary chip and metric card showing patient visit classification:
 * First-Time Patient vs Returning Patient, total visits, last visit date,
 * and historical diagnoses.
 */

import React from "react";

export default function HistorySummary({
  patient,
  summary,
  isReturningPatient,
  totalVisits,
  language = "en",
  onViewAllVisits,
}) {
  const isHi = language === "hi";

  if (!patient && (!summary || summary.total_visits === 0)) {
    return (
      <div style={newPatientBannerStyle}>
        <div style={badgeIconStyle("new")}>
          <span>🆕</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A" }}>
              {isHi ? "नया मरीज़ (प्रथम परामर्श)" : "First-Time Patient"}
            </span>
            <span style={pillBadgeStyle("#F1F5F9", "#475569")}>
              {isHi ? "प्रथम विज़िट" : "1st Visit"}
            </span>
          </div>
          <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
            {isHi
              ? "इस अस्पताल में कोई पिछला रिकॉर्ड नहीं मिला। आज की दवा पर्ची स्थायी रूप से सहेजी जाएगी।"
              : "No previous clinical consultation records on file for this facility."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={returningPatientCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={badgeIconStyle("returning")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A" }}>
                {isHi ? "🔄 पुनः परामर्श (फॉलो-अप मरीज़)" : "🔄 Returning Follow-Up Patient"}
              </span>
              <span style={pillBadgeStyle("#E0F2FE", "#0284C7")}>
                {totalVisits} {isHi ? "विज़िट्स रिकॉर्ड पर" : "Visits on File"}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#475569", marginTop: "3px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {summary?.last_visit && (
                <span>
                  <strong>{isHi ? "अंतिम विज़िट:" : "Last Visit:"}</strong> {summary.last_visit}
                </span>
              )}
              {summary?.last_department && (
                <span>
                  <strong>{isHi ? "विभाग:" : "Dept:"}</strong> {summary.last_department}
                </span>
              )}
              {summary?.last_doctor && (
                <span>
                  <strong>{isHi ? "डॉक्टर:" : "Doctor:"}</strong> {summary.last_doctor}
                </span>
              )}
            </div>
          </div>
        </div>

        {onViewAllVisits && (
          <button
            type="button"
            onClick={onViewAllVisits}
            style={viewHistoryBtnStyle}
          >
            {isHi ? "पूर्ण इतिहास देखें" : "View Full Timeline"} &rarr;
          </button>
        )}
      </div>

      {/* Chronic / Past Diagnoses tags */}
      {summary?.past_diagnoses && summary.past_diagnoses.length > 0 && (
        <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #E2E8F0", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>
            {isHi ? "पूर्व निदान (Past Diagnoses):" : "Past Diagnoses:"}
          </span>
          {summary.past_diagnoses.map((diag, i) => (
            <span key={i} style={diagPillStyle}>
              🩺 {diag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline Style Tokens
const newPatientBannerStyle = {
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: "14px",
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
};

const returningPatientCardStyle = {
  background: "linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)",
  border: "1.5px solid #BAE6FD",
  borderRadius: "14px",
  padding: "14px 16px",
  boxShadow: "0 4px 14px -2px rgba(2, 132, 199, 0.08)",
};

const badgeIconStyle = (type) => ({
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: type === "returning" ? "#E0F2FE" : "#F1F5F9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  flexShrink: 0,
});

const pillBadgeStyle = (bg, color) => ({
  background: bg,
  color: color,
  fontSize: "11px",
  fontWeight: 800,
  padding: "2px 8px",
  borderRadius: "9999px",
});

const diagPillStyle = {
  background: "#F1F5F9",
  color: "#334155",
  fontSize: "11px",
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: "6px",
  border: "1px solid #E2E8F0",
};

const viewHistoryBtnStyle = {
  background: "#FFFFFF",
  border: "1px solid #CBD5E1",
  color: "#0284C7",
  fontSize: "11.5px",
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

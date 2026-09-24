/**
 * PatientHistoryCard.jsx
 * ----------------------
 * Displays an individual chronological visit encounter record with diagnosis,
 * clinical notes, treating doctor, and expandable prescription preview.
 */

import React, { useState } from "react";

export default function PatientHistoryCard({
  visit,
  language = "en",
  onUsePreviousPrescription = null,
}) {
  const [expanded, setExpanded] = useState(false);
  const isHi = language === "hi";

  const meds = Array.isArray(visit.prescription?.medicines) ? visit.prescription.medicines : [];
  const hasMeds = meds.length > 0;

  const isCancelled = visit.status === "cancelled";

  return (
    <div style={{
      background: "var(--patient-card-bg, #FFFFFF)",
      border: "1px solid var(--patient-card-border, #E2E8F0)",
      borderRadius: "14px",
      padding: "12px 14px",
      boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.04)",
    }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "9px",
            background: "var(--patient-tag-bg, #F0F9FF)",
            border: "1px solid var(--patient-tag-border, #BAE6FD)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#0284C7" }}>
              {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString("en-US", { month: "short" }) : "VISIT"}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 900, color: "var(--patient-text-main, #0F172A)", lineHeight: 1 }}>
              {visit.visit_date ? new Date(visit.visit_date).getDate() : "#"}
            </span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: "13.5px", color: "var(--patient-text-main, #0F172A)" }}>
                {visit.department_name || visit.department || (visit.service_category && visit.service_category !== "consultation" ? visit.service_category : (isHi ? "सामान्य परामर्श (OPD)" : "General Consultation (OPD)"))}
              </span>
              <span style={{
                background: isCancelled ? "var(--emergency-card-bg, #FEF2F2)" : "#F0FDF4",
                color: isCancelled ? "var(--emergency-card-text, #DC2626)" : "#16A34A",
                fontSize: "10.5px",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "5px",
                border: isCancelled ? "1px solid var(--emergency-card-border, #FECACA)" : "1px solid #BBF7D0",
              }}>
                {isCancelled
                  ? (isHi ? "✗ रद्द" : "✗ Cancelled")
                  : visit.status === "completed"
                  ? (isHi ? "✓ पूर्ण" : "✓ Completed")
                  : visit.status}
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--patient-text-sub, #64748B)", marginTop: "2px" }}>
              <span>👨‍⚕️ {visit.doctor_name || "Dr. Staff Desk"}</span>
              {visit.ticket_id && <span style={{ marginLeft: "8px" }}>• Token #{visit.ticket_id}</span>}
            </div>
          </div>
        </div>

        {onUsePreviousPrescription && hasMeds && (
          <button
            type="button"
            onClick={() => onUsePreviousPrescription(visit.prescription)}
            style={{
              background: "#0284C7",
              border: "none",
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 1px 4px rgba(2, 132, 199, 0.2)",
            }}
            title={isHi ? "इस विज़िट की दवाइयां वर्तमान पर्ची में लोड करें" : "Copy previous medicines into active consultation form"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            <span>{isHi ? "दवाइयां कॉपी करें" : "Copy Rx"}</span>
          </button>
        )}
      </div>

      {/* Diagnosis & Clinical Notes */}
      <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {visit.diagnosis && (
          <div style={{ fontSize: "12.5px" }}>
            <span style={{ fontWeight: 700, color: "var(--patient-text-sub, #64748B)" }}>
              {isHi ? "निदान (Diagnosis):" : "Diagnosis:"}
            </span>{" "}
            <span style={{ fontWeight: 700, color: "#0284C7" }}>
              {visit.diagnosis}
            </span>
          </div>
        )}
        {visit.clinical_notes && typeof visit.clinical_notes === "string" && !visit.clinical_notes.startsWith("{") && (
          <div style={{ fontSize: "12px", color: "var(--patient-text-sub, #475569)", fontStyle: "italic" }}>
            &ldquo;{visit.clinical_notes}&rdquo;
          </div>
        )}
      </div>

      {/* Expandable Medicines Toggle */}
      {hasMeds && (
        <div style={{ marginTop: "10px" }}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "var(--patient-sub-card, #F1F5F9)",
              border: "none",
              color: "var(--patient-text-main, #334155)",
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: "6px",
              cursor: "pointer",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>💊 {meds.length} {isHi ? "निर्धारित दवाइयां" : "Prescribed Medicines"}</span>
            <span>{expanded ? "▲" : "▼"}</span>
          </button>

          {expanded && (
            <div style={{
              marginTop: "6px",
              background: "var(--patient-sub-card, #F8FAFC)",
              borderRadius: "8px",
              padding: "8px 12px",
              border: "1px solid var(--patient-card-border, #E2E8F0)",
            }}>
              {meds.map((m, mIdx) => (
                <div key={mIdx} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11.5px",
                  padding: "3px 0",
                  borderBottom: mIdx < meds.length - 1 ? "1px dashed var(--patient-card-border, #E2E8F0)" : "none",
                }}>
                  <span style={{ fontWeight: 700, color: "var(--patient-text-main, #0F172A)" }}>• {m.name}</span>
                  <span style={{ color: "var(--patient-text-sub, #64748B)" }}>{m.dosage} | {m.frequency} | {m.duration}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

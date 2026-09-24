/**
 * PrescriptionHistory.jsx
 * -----------------------
 * Displays chronological list of structured e-prescriptions with safe
 * pre-fill actions for doctor follow-up consultations.
 */

import React from "react";

export default function PrescriptionHistory({
  prescriptions = [],
  language = "en",
  onUsePreviousPrescription = null,
}) {
  const isHi = language === "hi";

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div style={{
        background: "var(--patient-sub-card, #F8FAFC)",
        borderRadius: "12px",
        border: "1px dashed var(--patient-card-border, #CBD5E1)",
        padding: "20px",
        textAlign: "center",
      }}>
        <span style={{ fontSize: "24px" }}>💊</span>
        <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--patient-text-sub, #64748B)", marginTop: "6px" }}>
          {isHi ? "कोई पूर्व प्रिस्क्रिप्शन उपलब्ध नहीं है।" : "No previous e-prescriptions on file."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {prescriptions.map((rx, idx) => {
        const meds = Array.isArray(rx.medicines) ? rx.medicines : [];
        const dateStr = rx.prescribed_at
          ? new Date(rx.prescribed_at).toLocaleDateString(isHi ? "hi-IN" : "en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Previous Visit";

        return (
          <div key={rx.id || rx.ticket_id || idx} style={{
            background: "var(--patient-card-bg, #FFFFFF)",
            border: "1px solid var(--patient-card-border, #E2E8F0)",
            borderRadius: "12px",
            padding: "12px 14px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}>
            {/* Card Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "8px",
              borderBottom: "1px solid var(--patient-card-border, #E2E8F0)",
              paddingBottom: "8px",
              marginBottom: "10px",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
                    📅 {dateStr}
                  </span>
                  <span style={{
                    background: "var(--patient-sub-card, #F1F5F9)",
                    color: "var(--patient-text-sub, #475569)",
                    fontSize: "10.5px",
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: "5px",
                  }}>
                    {rx.department || "OPD"}
                  </span>
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--patient-text-sub, #64748B)", marginTop: "2px" }}>
                  {rx.doctor_name && <span>👨‍⚕️ {rx.doctor_name}</span>}
                  {rx.ticket_id && <span style={{ marginLeft: "8px" }}>#{rx.ticket_id}</span>}
                </div>
              </div>

              {onUsePreviousPrescription && meds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onUsePreviousPrescription(rx)}
                  style={{
                    background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                    transition: "all 0.15s ease",
                  }}
                  title={isHi ? "इस पर्ची की दवाइयाँ वर्तमान फॉर्म में लोड करें" : "Pre-fill current consultation form with these medicines"}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span>{isHi ? "दवाइयाँ कॉपी करें" : "Use in Current Rx"}</span>
                </button>
              )}
            </div>

            {/* Diagnosis */}
            {rx.diagnosis && (
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--patient-text-sub, #64748B)", textTransform: "uppercase" }}>
                  {isHi ? "निदान (Diagnosis):" : "Diagnosis:"}
                </span>{" "}
                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0284C7" }}>
                  {rx.diagnosis}
                </span>
              </div>
            )}

            {/* Medicines List */}
            {meds.length > 0 ? (
              <div style={{
                background: "var(--patient-sub-card, #F8FAFC)",
                borderRadius: "10px",
                padding: "8px 12px",
                border: "1px solid var(--patient-card-border, #E2E8F0)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--patient-text-sub, #475569)", marginBottom: "6px" }}>
                  💊 {isHi ? "निर्धारित औषधियां (Prescribed Medicines):" : "Prescribed Medicines:"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {meds.map((m, mIdx) => (
                    <div key={mIdx} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px",
                      borderBottom: mIdx < meds.length - 1 ? "1px dashed var(--patient-card-border, #E2E8F0)" : "none",
                      paddingBottom: "4px",
                    }}>
                      <span style={{ fontWeight: 700, color: "var(--patient-text-main, #0F172A)" }}>
                        • {m.name || "Medicine"}
                      </span>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {m.dosage && <span style={{
                          background: "var(--patient-sub-card, #E2E8F0)",
                          color: "var(--patient-text-main, #1E293B)",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                        }}>{m.dosage}</span>}
                        {m.frequency && <span style={{
                          background: "var(--patient-sub-card, #E2E8F0)",
                          color: "var(--patient-text-main, #1E293B)",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                        }}>{m.frequency}</span>}
                        {m.duration && <span style={{
                          background: "var(--patient-sub-card, #E2E8F0)",
                          color: "var(--patient-text-main, #1E293B)",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                        }}>{m.duration}</span>}
                        {m.instructions && <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", fontStyle: "italic" }}>({m.instructions})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              rx.advice && (
                <div style={{
                  fontSize: "12px",
                  color: "var(--patient-text-sub, #475569)",
                  fontStyle: "italic",
                  background: "var(--patient-sub-card, #F8FAFC)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                }}>
                  &ldquo;{rx.advice}&rdquo;
                </div>
              )
            )}

            {/* Lab tests or advice if present */}
            {(rx.lab_tests || rx.advice) && meds.length > 0 && (
              <div style={{ marginTop: "8px", fontSize: "11.5px", color: "var(--patient-text-sub, #475569)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {rx.lab_tests && (
                  <span>
                    <strong>🧪 {isHi ? "जांच:" : "Tests:"}</strong> {rx.lab_tests}
                  </span>
                )}
                {rx.advice && (
                  <span>
                    <strong>📋 {isHi ? "सलाह:" : "Advice:"}</strong> {rx.advice}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

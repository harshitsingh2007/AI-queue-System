import React from "react";
import { t, getCategoryLabel, getStatusLabel } from "../../utils/i18n";
import { standaloneCardStyle, passStatusBadgeStyle } from "./patientStyles";

/**
 * DigitalTicketPassCard
 * ---------------------
 * Printable digital pass card with QR code, patient triage tags, and queue position.
 */
export default function DigitalTicketPassCard({
  activeTicket,
  setActiveTicket,
  familyTickets = {},
  onSwitchTicketPass,
  onTakeTicketForMember,
  members = [],
  ticketQrData,
  language = "en",
  onPrint,
  onOpenAdjustModal,
  onOpenCancelModal,
  onOpenPrescriptionSlip,
  parsePrescription,
}) {
  return (
    <div style={{ ...standaloneCardStyle, border: "2px solid #0284C7" }}>
      {/* Active Family Pass Switcher */}
      {Object.keys(familyTickets).length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", background: "var(--patient-sub-card, #F1F5F9)", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #E2E8F0)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--patient-text-sub, #475569)" }}>{t("switchTicket", language)}:</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {Object.entries(familyTickets).map(([memId, tick]) => {
              const isCurrent = activeTicket.ticket_id === tick.ticket_id;
              return (
                <button
                  key={memId}
                  type="button"
                  onClick={() => onSwitchTicketPass ? onSwitchTicketPass(memId, tick) : setActiveTicket(tick)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: isCurrent ? "1.5px solid #0284C7" : "1px solid var(--patient-card-border, #CBD5E1)",
                    background: isCurrent ? "#0284C7" : "var(--patient-card-bg, #FFFFFF)",
                    color: isCurrent ? "#FFFFFF" : "var(--patient-text-main, #0F172A)",
                    fontSize: "11.5px",
                    fontWeight: isCurrent ? 800 : 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>{tick.name}</span>
                  <span style={{ opacity: 0.85 }}>(#{tick.ticket_id})</span>
                  {isCurrent && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--patient-card-border, #E0F2FE)", paddingBottom: "14px", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", textTransform: "uppercase", fontWeight: 600 }}>{t("livePassTitle", language)}</span>
            {activeTicket.name && (
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px", background: "var(--patient-tag-bg, #E0F2FE)", color: "var(--patient-tag-color, #0369A1)", border: "1px solid var(--patient-tag-border, #BAE6FD)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>{activeTicket.name}</span>
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: "32px", color: "#0284C7", fontWeight: 800 }}>
            #{activeTicket.ticket_id}
          </h2>
          {activeTicket.transferred_from_dept && (
            <div style={{ marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(14, 165, 233, 0.1)", border: "1px solid #0EA5E9", borderRadius: "6px", padding: "2px 8px" }}>
              <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>
                🔄 {language === "hi" ? "स्थानांतरित:" : "Transferred from:"} {getCategoryLabel(activeTicket.transferred_from_dept, language)}
              </span>
              {activeTicket.parent_ticket_id && (
                <span style={{ fontSize: "10px", color: "var(--patient-text-sub, #64748B)" }}>(#{activeTicket.parent_ticket_id})</span>
              )}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>{t("currentStatus", language)}</span>
          <span style={passStatusBadgeStyle(activeTicket.status)}>{getStatusLabel(activeTicket.status, language)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)" }}>{t("patientDemographics", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "var(--patient-text-main, #0F172A)", fontWeight: 700, fontSize: "15px", wordBreak: "break-word" }}>
            {activeTicket.name} ({activeTicket.age || 30} {language === "hi" ? "वर्ष" : "yrs"}, {t(activeTicket.gender || "male", language)})
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)" }}>{t("deptCategory", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#0284C7", fontWeight: 700, fontSize: "15px", wordBreak: "break-word" }}>
            {getCategoryLabel(activeTicket.service_category || "consultation", language)}
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)" }}>{t("pos", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#D97706", fontWeight: 800, fontSize: "24px" }}>
            #{activeTicket.position}
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "var(--patient-text-sub, #64748B)" }}>{t("estWait", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#0284C7", fontWeight: 800, fontSize: "24px" }}>
            {activeTicket.estimated_wait_minutes} {language === "hi" ? "मिनट" : "min"}
          </p>
        </div>
      </div>

      {/* Digital E-Prescription (Rx Slip) Section if available or completed */}
      {(activeTicket.prescription_notes || (activeTicket.status || "").toLowerCase() === "completed") && (() => {
        const rx = parsePrescription ? parsePrescription(activeTicket.prescription_notes, activeTicket) : null;
        return (
          <div style={{
            marginTop: "16px",
            marginBottom: "16px",
            padding: "16px 18px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(16, 185, 129, 0.08) 50%, rgba(2, 132, 199, 0.12) 100%)",
            border: "2px solid #059669",
            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.12)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid rgba(5, 150, 105, 0.3)", paddingBottom: "10px", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#059669",
                  color: "#FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 900,
                }}>
                  ℞
                </span>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 900, color: "#10B981", letterSpacing: "-0.2px" }}>
                    {language === "hi" ? "डिजिटल दवा पर्ची (ई-प्रिस्क्रिप्शन)" : "Digital E-Prescription (Rx Slip)"}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#34D399", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                    <span>{rx?.doctor_name ? rx.doctor_name : "Consultant Physician"} {rx?.doctor_department ? `• ${rx.doctor_department}` : ""}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="view-active-rx-slip-btn"
                onClick={() => onOpenPrescriptionSlip && onOpenPrescriptionSlip(activeTicket.prescription_notes, activeTicket)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#FFFFFF",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span>{language === "hi" ? "दवा पर्ची देखें (Rx)" : "View / Print Rx Slip"}</span>
              </button>
            </div>

            {rx?.diagnosis && (
              <div style={{ fontSize: "12.5px", color: "#10B981", marginBottom: "6px" }}>
                <strong style={{ color: "var(--patient-text-main, #0F172A)" }}>{language === "hi" ? "निदान" : "Diagnosis"}:</strong>{" "}
                <span style={{ fontWeight: 700, color: "#059669", background: "var(--patient-tag-bg, #D1FAE5)", padding: "2px 8px", borderRadius: "5px", border: "1px solid rgba(5, 150, 105, 0.3)" }}>
                  {rx.diagnosis}
                </span>
              </div>
            )}

            {rx?.medicines && rx.medicines.length > 0 && (
              <div style={{ marginTop: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#10B981", textTransform: "uppercase" }}>
                  {language === "hi" ? "दवाइयाँ" : "Prescribed Medicines"}:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  {rx.medicines.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "var(--patient-card-bg, #FFFFFF)",
                        border: "1px solid var(--patient-tag-border, #A7F3D0)",
                        color: "#059669",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                      <span>{m.name} {m.dosage ? `(${m.dosage})` : ""}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {rx?.advice && (
              <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--patient-text-main, #334155)", background: "var(--patient-card-bg, #FFFFFF)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--patient-tag-border, #A7F3D0)" }}>
                <strong>{language === "hi" ? "सलाह" : "Advice"}:</strong> {rx.advice}
              </div>
            )}
          </div>
        );
      })()}

      {/* Completed Consultation Notice if prescription notes are not yet attached */}
      {activeTicket.status === "completed" && !activeTicket.prescription_notes && (
        <div style={{
          marginTop: "14px",
          marginBottom: "14px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "var(--patient-tag-bg, #F0FDF4)",
          border: "1px solid rgba(5, 150, 105, 0.3)",
          color: "#10B981",
          fontSize: "12.5px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>
            {language === "hi"
              ? "परामर्श पूर्ण हो चुका है। यदि डॉक्टर ने पर्ची दी है तो कृपया फ़ार्मेसी डेस्क पर दिखाएं।"
              : "Consultation completed. If your doctor issued a paper prescription, please show this token at the pharmacy desk."}
          </span>
        </div>
      )}

      {/* Active Ticket Actions (WAITING status only) */}
      {activeTicket && (activeTicket.status || "").toLowerCase() === "waiting" && (
        <div style={{ display: "flex", gap: "10px", marginTop: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <button
            id="adjust-queue-btn"
            type="button"
            onClick={onOpenAdjustModal}
            disabled={(activeTicket.adjustment_count || 0) >= 3}
            style={{
              flex: 1,
              minWidth: "130px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: (activeTicket.adjustment_count || 0) >= 3 ? "1px solid var(--patient-card-border, #E2E8F0)" : "1.5px solid #0284C7",
              background: (activeTicket.adjustment_count || 0) >= 3 ? "var(--patient-sub-card, #F1F5F9)" : "var(--patient-tag-bg, #F0F9FF)",
              color: (activeTicket.adjustment_count || 0) >= 3 ? "#94A3B8" : "#0284C7",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: (activeTicket.adjustment_count || 0) >= 3 ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>
              {(activeTicket.adjustment_count || 0) >= 3
                ? (language === "hi" ? "समायोजन सीमा समाप्त (3/3)" : "Adjust Limit Reached (3/3)")
                : (language === "hi" ? "कतार समायोजित करें" : "Adjust Queue")}
            </span>
          </button>

          <button
            id="cancel-ticket-btn"
            type="button"
            onClick={onOpenCancelModal}
            style={{
              flex: 1,
              minWidth: "130px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1.5px solid var(--emergency-card-border, #FECACA)",
              background: "var(--emergency-card-bg, #FEF2F2)",
              color: "var(--emergency-card-text, #DC2626)",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span>{language === "hi" ? "टोकन रद्द करें" : "Cancel Ticket"}</span>
          </button>
        </div>
      )}

      {ticketQrData && (
        <div style={{ textAlign: "center", borderTop: "1px solid var(--patient-card-border, #E0F2FE)", paddingTop: "18px" }}>
          <img
            src={ticketQrData.qr_code_base64}
            alt="Ticket QR Code"
            style={{ width: "130px", height: "130px", borderRadius: "12px", background: "#fff", padding: "6px", border: "1px solid var(--patient-card-border, #CBD5E1)" }}
          />
          <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--patient-text-sub, #64748B)" }}>
            {t("scanQrHint", language)}
          </p>
        </div>
      )}

      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <button
          type="button"
          onClick={onPrint}
          style={{
            padding: "9px 18px",
            borderRadius: "10px",
            border: "1px solid #0284C7",
            background: "var(--patient-tag-bg, #F0F9FF)",
            color: "#0284C7",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          <span>{t("printPassBtn", language)}</span>
        </button>
      </div>

      {/* Option to Take Ticket for Another Family Member */}
      {members && members.length > 0 && (
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--patient-card-border, #E2E8F0)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--patient-text-sub, #64748B)", fontWeight: 600 }}>
            {language === "hi" ? "अन्य सदस्य के लिए भी टोकन चाहिए?" : "Need a ticket for another family member too?"}
          </span>
          <button
            type="button"
            onClick={() => {
              if (onTakeTicketForMember) {
                const unbooked = members.find((m) => !familyTickets[m.id]);
                onTakeTicketForMember(unbooked || null);
              }
            }}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
              color: "#FFFFFF",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
            }}
          >
            <span>+</span>
            <span>{language === "hi" ? "अन्य सदस्य का टोकन लें" : "Take Ticket for Family Member"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

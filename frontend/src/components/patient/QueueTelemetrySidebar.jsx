import React, { useState } from "react";
import { t, getCategoryLabel } from "../../utils/i18n";
import { HOSPITAL_CONFIG } from "../../config/hospitalConfig";

/**
 * QueueTelemetrySidebar
 * ---------------------
 * Real-time queue status sidebar on wide desktop screens.
 */
export default function QueueTelemetrySidebar({
  analytics,
  servingTickets = [],
  queueSnapshot = [],
  kioskQrData,
  handleTabChange,
  activeTicket,
  language = "en",
  branding = null,
}) {
  const userDept = activeTicket?.service_category ? String(activeTicket.service_category).toLowerCase() : null;
  const isTransferred = Boolean(activeTicket?.transferred_from_dept || activeTicket?.parent_ticket_id);
  const transferredFrom = activeTicket?.transferred_from_dept ? String(activeTicket.transferred_from_dept).toLowerCase() : null;

  // View toggle: 'auto' (scoped to patient's active department) vs 'all' (all hospital departments)
  const [scopeMode, setScopeMode] = useState("auto");

  // Determine active department filter
  const activeDept = (scopeMode === "auto" && userDept) ? userDept : null;

  // Filter serving tickets by department if scoped
  const scopedServing = activeDept
    ? servingTickets.filter((t) => (t.service_category || "").toLowerCase() === activeDept)
    : servingTickets;
  const primaryServing = scopedServing.length > 0 ? scopedServing[0] : null;

  // Filter queue snapshot by department if scoped
  const scopedQueue = activeDept
    ? queueSnapshot.filter((t) => (t.service_category || "").toLowerCase() === activeDept)
    : queueSnapshot;
  const inLineCount = scopedQueue.length;

  // Estimated wait calculation
  let displayAvgWait = analytics ? analytics.avg_wait_minutes : 12;
  if (activeDept && activeTicket?.estimated_wait_minutes !== undefined && activeTicket.estimated_wait_minutes !== null) {
    displayAvgWait = activeTicket.estimated_wait_minutes;
  } else if (scopedQueue.length > 0 && scopedQueue[0].estimated_wait_minutes !== undefined) {
    displayAvgWait = scopedQueue[0].estimated_wait_minutes;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Transfer Care Journey Banner (shown when ticket is transferred to another dept) */}
      {isTransferred && (
        <div
          className="telemetry-sidebar-card"
          style={{
            background: "linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)",
            border: "1.5px solid #0EA5E9",
            borderRadius: "14px",
            padding: "14px 16px",
            boxShadow: "0 4px 14px rgba(14, 165, 233, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "16px" }}>🔄</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#0369A1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {language === "hi" ? "विभाग स्थानांतरण सक्रिय" : "Department Transfer Active"}
              </span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", background: "rgba(14,165,233,0.15)", padding: "2px 8px", borderRadius: "6px" }}>
              #{activeTicket.ticket_id}
            </span>
          </div>

          {/* 2-Step Care Stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, background: "rgba(16, 185, 129, 0.12)", border: "1px solid #10B981", padding: "6px 8px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#059669", display: "block" }}>
                ✓ {language === "hi" ? "परामर्श पूर्ण" : "CONSULTATION COMPLETED"}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
                {getCategoryLabel(transferredFrom || "consultation", language)}
              </span>
            </div>
            <span style={{ color: "#0EA5E9", fontWeight: 900, fontSize: "16px" }}>➔</span>
            <div style={{ flex: 1, background: "rgba(14, 165, 233, 0.15)", border: "1.5px solid #0EA5E9", padding: "6px 8px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#0284C7", display: "block" }}>
                ● {language === "hi" ? "कतार में प्रतीक्षारत" : "NOW IN QUEUE"}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
                {getCategoryLabel(userDept || "pharmacy", language)}
              </span>
            </div>
          </div>

          {/* Guidance Note */}
          <div style={{ fontSize: "11.5px", color: "var(--patient-text-main, #334155)", lineHeight: 1.45, background: "rgba(255, 255, 255, 0.75)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(14, 165, 233, 0.2)" }}>
            {language === "hi"
              ? `डॉक्टर द्वारा आपकी पर्ची ${getCategoryLabel(userDept || "pharmacy", language)} को भेज दी गई है। कृपया ${getCategoryLabel(userDept || "pharmacy", language)} काउंटर की ओर जाएं।`
              : `Doctor has forwarded your case to ${getCategoryLabel(userDept || "pharmacy", language)}. Please proceed to the ${getCategoryLabel(userDept || "pharmacy", language)} counter.`}
          </div>
        </div>
      )}

      {/* 1. Live Queue Counter Pulse Card */}
      <div className="telemetry-sidebar-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0EA5E9", boxShadow: "0 0 8px #0EA5E9" }} />
            <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
              {language === "hi" ? "लाइव कतार मॉनिटर" : "Live Queue Monitor"}
            </span>
          </div>
        </div>

        {/* Department Scope Selector (My Department vs All Hospital Desks) */}
        {userDept && (
          <div style={{ display: "flex", gap: "6px", background: "var(--patient-sub-card, #F1F5F9)", padding: "3px", borderRadius: "8px", border: "1px solid var(--patient-card-border, #E2E8F0)" }}>
            <button
              type="button"
              onClick={() => setScopeMode("auto")}
              style={{
                flex: 1,
                padding: "5px 8px",
                borderRadius: "6px",
                border: "none",
                background: scopeMode === "auto" ? "#0284C7" : "transparent",
                color: scopeMode === "auto" ? "#FFFFFF" : "var(--patient-text-sub, #64748B)",
                fontWeight: 700,
                fontSize: "11px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <span>📍</span>
              <span>{getCategoryLabel(userDept, language)}</span>
            </button>
            <button
              type="button"
              onClick={() => setScopeMode("all")}
              style={{
                flex: 1,
                padding: "5px 8px",
                borderRadius: "6px",
                border: "none",
                background: scopeMode === "all" ? "#0284C7" : "transparent",
                color: scopeMode === "all" ? "#FFFFFF" : "var(--patient-text-sub, #64748B)",
                fontWeight: 700,
                fontSize: "11px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {language === "hi" ? "सभी डेस्क (अस्पताल)" : "All Desks (Hospital)"}
            </button>
          </div>
        )}

        {/* Now Serving Highlight */}
        <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 70%, #0C4A6E 100%)", borderRadius: "14px", padding: "16px", color: "#FFFFFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "11px", color: "#38BDF8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {t("nowServing", language)}
            </div>
            {activeDept && (
              <span style={{ fontSize: "10px", color: "#BAE6FD", background: "rgba(56, 189, 248, 0.2)", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                {getCategoryLabel(activeDept, language)}
              </span>
            )}
          </div>
          {primaryServing ? (
            <div style={{ marginTop: "4px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#38BDF8", lineHeight: 1.1 }}>
                #{primaryServing.ticket_id}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span>{language === "hi" ? "विभाग:" : "Dept:"} <strong>{getCategoryLabel(primaryServing.service_category || "consultation", language)}</strong></span>
                {(primaryServing.assigned_counter || primaryServing.counter) && (
                  <span style={{ background: "rgba(255,255,255,0.18)", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>
                    {language === "hi" ? "काउंटर: " : "Counter: "} {primaryServing.assigned_counter || primaryServing.counter}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "6px", fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              {activeDept
                ? (language === "hi" ? `${getCategoryLabel(activeDept, language)} डेस्क अगले मरीज़ हेतु तैयार हैं` : `All ${getCategoryLabel(activeDept, language)} desks ready for next patient`)
                : (language === "hi" ? "अगले मरीज़ हेतु सभी डेस्क तैयार हैं" : "All desks ready for next patient")}
            </div>
          )}
        </div>

        {/* Live Wait Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div style={{ background: "var(--patient-sub-card, #F8FAFC)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #E2E8F0)" }}>
            <span style={{ fontSize: "10.5px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>
              {language === "hi" ? "औसत प्रतीक्षा" : "Est. Avg Wait"}
            </span>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "#0284C7" }}>
              {displayAvgWait} {language === "hi" ? "मिनट" : "min"}
            </span>
          </div>
          <div style={{ background: "var(--patient-sub-card, #F8FAFC)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--patient-card-border, #E2E8F0)" }}>
            <span style={{ fontSize: "10.5px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>
              {activeDept ? (language === "hi" ? `${getCategoryLabel(activeDept, language)} में` : `In ${getCategoryLabel(activeDept, language)}`) : (language === "hi" ? "कतार में" : "In Line")}
            </span>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)" }}>
              {inLineCount} {language === "hi" ? "मरीज़" : "patients"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Next in Line Preview */}
      {scopedQueue.length > 0 && (
        <div className="telemetry-sidebar-card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--patient-text-main, #0F172A)", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
              <span>{language === "hi" ? "कतार में अगले टोकन" : "Next Up in Queue"}</span>
            </span>
            {activeDept && (
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#0284C7" }}>
                {getCategoryLabel(activeDept, language)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
            {scopedQueue.slice(0, 4).map((item) => {
              const isSelf = activeTicket && String(item.ticket_id) === String(activeTicket.ticket_id);
              return (
                <div
                  key={item.ticket_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: isSelf ? "rgba(14, 165, 233, 0.1)" : "var(--patient-sub-card, #F8FAFC)",
                    border: isSelf ? "1.5px solid #0EA5E9" : "1px solid var(--patient-card-border, #E2E8F0)",
                    boxShadow: isSelf ? "0 2px 8px rgba(14, 165, 233, 0.15)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: isSelf ? "#0284C7" : "var(--patient-text-sub, #64748B)" }}>
                      #{item.position}
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong style={{ fontSize: "12.5px", color: isSelf ? "#0284C7" : "var(--patient-text-main, #0F172A)" }}>
                          #{item.ticket_id}
                        </strong>
                        {isSelf && (
                          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#FFFFFF", background: "#0284C7", padding: "1px 5px", borderRadius: "4px" }}>
                            {language === "hi" ? "आप" : "YOU"}
                          </span>
                        )}
                      </div>
                      {item.service_category && (
                        <span style={{ fontSize: "10.5px", color: "var(--patient-text-sub, #64748B)", display: "block" }}>
                          {getCategoryLabel(item.service_category, language)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>
                    ~{item.estimated_wait_minutes}{language === "hi" ? "मि" : "m"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

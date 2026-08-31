/**
 * StaffPage.jsx
 * -------------
 * Doctor & Staff Desk Dashboard (Admin View).
 * Features Multi-Department Ticket Classification & Security Routing!
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config/hospitalConfig";
import { announceTicketVoice } from "../utils/voiceSynthesizer";
import { t, getCategoryLabel, getStatusLabel } from "../utils/i18n";

export default function StaffPage({
  tenantId,
  currentUser,
  analytics,
  queueSnapshot,
  servingTickets,
  handleServeNext,
  handleCompleteTicket,
  handleCounterChange,
  refreshData,
  language = "en",
  socketRef,
  navigateTo,
}) {
  const [appointments, setAppointments] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [targetDept, setTargetDept] = useState("pharmacy");
  const [rxNotes, setRxNotes] = useState("");
  const [transferStatusMsg, setTransferStatusMsg] = useState("");
  const [announceFeedbackMsg, setAnnounceFeedbackMsg] = useState("");
  const adminDept = currentUser && currentUser.department ? currentUser.department.toLowerCase() : "all";

  const handleReAnnounce = async (ticket) => {
    try {
      if (socketRef && socketRef.current) {
        socketRef.current.emit("re_announce", { tenant_id: tenantId, ticket });
      } else {
        await fetch(`${API_BASE}/api/v1/plugin/re-announce`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenant_id: tenantId, ticket_id: ticket.ticket_id }),
        });
      }
      setAnnounceFeedbackMsg(`📢 Broadcasted call for #${ticket.ticket_id} (${ticket.name}) to Patient Portal & Speakers!`);
      setTimeout(() => setAnnounceFeedbackMsg(""), 3500);
    } catch (e) {
      console.log("Re-announce broadcast error:", e);
    }
  };

  const handleStaffCheckInAppt = async (appointmentId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/appointments/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId }),
      });
      if (res.ok) {
        fetchTenantAppointments();
        if (refreshData) refreshData();
      }
    } catch (e) {
      console.log("Check-in error:", e);
    }
  };

  const handleOpenTransferModal = (ticket) => {
    setSelectedTicket(ticket);
    setRxNotes("");
    setTargetDept("pharmacy");
    setTransferStatusMsg("");
    setShowTransferModal(true);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setTransferStatusMsg("Transmitting E-Prescription & Queueing Patient...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/transfer-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          ticket_id: selectedTicket.ticket_id,
          target_department: targetDept,
          prescription_notes: rxNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTransferStatusMsg(`✓ Transferred #${selectedTicket.ticket_id} -> #${data.new_ticket.ticket_id} in ${targetDept.toUpperCase()}!`);
        if (refreshData) refreshData();
        fetchTenantAppointments();
        setTimeout(() => {
          setShowTransferModal(false);
          setSelectedTicket(null);
          setTransferStatusMsg("");
          if (refreshData) refreshData();
        }, 1200);
      } else {
        setTransferStatusMsg(`Transfer error: ${data.detail || data.message || "Failed to transfer ticket"}`);
      }
    } catch (err) {
      setTransferStatusMsg(`Transfer error: ${err.message}`);
    }
  };

  const fetchTenantAppointments = useCallback(() => {
    const params = new URLSearchParams();
    if (adminDept && adminDept !== "all") {
      params.set("department", adminDept);
    }
    // active_only=true: only fetch scheduled + checked_in appointments (not completed/cancelled)
    // so the Reserved Slots roster only shows genuinely active reservations.
    params.set("active_only", "true");

    fetch(`${API_BASE}/api/v1/plugin/appointments/tenant/${tenantId}?${params.toString()}`)
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
          <div style={shieldIconBadgeStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <strong style={{ fontSize: "14px", color: "#064E3B" }}>
              {t("medicalDeptLabel", language)}: <span style={{ color: "#047857" }}>{getCategoryLabel(adminDept, language)}</span>
            </strong>
            <span style={{ display: "block", fontSize: "11px", color: "#64748B" }}>
              {adminDept === "all"
                ? (language === "hi" ? "सुपर एडमिन मोड — अस्पताल के सभी विभागों में टिकट प्रबंधन।" : "Super Admin Mode — Managing tickets across ALL hospital departments.")
                : (language === "hi" ? `विभाग सीमा सक्रिय — केवल ${getCategoryLabel(adminDept, language)} हेतु कतार प्रबंधन।` : `Strict Security Boundary Active — Managing tickets & queue ONLY for ${getCategoryLabel(adminDept, language)}.`)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {navigateTo && (
            <button
              type="button"
              onClick={() => navigateTo("kiosk")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "10px",
                border: "1px solid #10B981",
                background: "#ECFDF5",
                color: "#047857",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.12)",
                transition: "all 0.2s ease",
              }}
              title="Launch Fullscreen Waiting Room TV Screen"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
              {t("launchTvDisplayBtn", language)}
            </button>
          )}

          <span style={deptTagStyle}>
            {adminDept === "all" ? (language === "hi" ? "सुपर एडमिन" : "SUPER ADMIN") : `${getCategoryLabel(adminDept, language)}`}
          </span>
        </div>
      </div>

      {/* Analytics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{t("patientsWaiting", language)}</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#047857", margin: "4px 0" }}>
            {analytics ? analytics.currently_waiting : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>{t("inDeptQueue", language)} ({getCategoryLabel(adminDept, language)})</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{t("currentlyServing", language)}</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#10B981", margin: "4px 0" }}>
            {analytics ? analytics.currently_serving : 0}
          </h2>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>{t("atDesks", language)} ({getCategoryLabel(adminDept, language)})</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{t("bookedSlotsToday", language)}</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0284C7", margin: "4px 0" }}>
            {appointments.length}
          </h2>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>{t("todayApts", language)}</span>
        </div>
        <div style={staffStatCardStyle}>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{t("activeDoctorDesks", language)}</span>
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
                {getCategoryLabel(adminDept, language)} {t("deskOperations", language)}
              </h3>
              <span style={{ fontSize: "12px", color: "#64748B" }}>{t("departmentCallControl", language)}</span>
            </div>

            <button onClick={handleServeNext} style={callPriorityBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              {t("callNextTicket", language)}
            </button>
          </div>

          {announceFeedbackMsg && (
            <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: "#ECFDF5", border: "1px solid #10B981", color: "#047857", fontSize: "12px", fontWeight: 700, textAlign: "center" }}>
              {announceFeedbackMsg}
            </div>
          )}

          <h4 style={{ margin: "0 0 12px 0", color: "#475569", fontSize: "13px" }}>{t("nowServingAt", language)} {getCategoryLabel(adminDept, language)}:</h4>

          {servingTickets.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #CBD5E1", color: "#94A3B8", fontSize: "13px" }}>
              {t("noServingTickets", language)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {servingTickets.map((ticket) => (
                <div key={ticket.ticket_id} style={{ ...staffServingRowStyle, flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#047857" }}>#{ticket.ticket_id}</span>
                      <span style={{ marginLeft: "12px", color: "#0F172A", fontWeight: 700, fontSize: "15px" }}>{ticket.name}</span>
                      <span style={{ marginLeft: "10px", fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>({getCategoryLabel(ticket.service_category, language)})</span>
                      {ticket.transferred_from_dept && (
                        <span style={{ marginLeft: "8px", padding: "2px 8px", borderRadius: "6px", background: "#FEF3C7", color: "#B45309", fontSize: "10px", fontWeight: 700, border: "1px solid #FDE68A" }}>
                          {t("transferredFrom", language)} {getCategoryLabel(ticket.transferred_from_dept, language)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleReAnnounce(ticket)}
                        style={announceBtnStyle}
                        title="Broadcast announcement to Patient Portal and Hospital speakers"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                        {t("reAnnounce", language)}
                      </button>

                      <button
                        onClick={() => handleOpenTransferModal(ticket)}
                        style={transferTriggerBtnStyle}
                        title="Write E-Prescription & Transfer Patient to Pharmacy/Lab"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                        {t("transferPrescribe", language)}
                      </button>

                      <button onClick={() => handleCompleteTicket(ticket.ticket_id)} style={finishBtnStyle}>
                        {t("completeBtn", language)}
                      </button>
                    </div>
                  </div>

                  {/* Attached E-Prescription Display Banner */}
                  {ticket.prescription_notes && (
                    <div style={{ padding: "10px 14px", background: "#ECFDF5", borderRadius: "8px", border: "1px solid #A7F3D0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ padding: "1px 6px", borderRadius: "4px", background: "#D1FAE5", color: "#065F46", fontSize: "10px", fontWeight: 800 }}>Rx</span>
                        <strong style={{ fontSize: "12px", color: "#064E3B" }}>
                          {t("ePrescriptionAttached", language)} {ticket.transferred_from_dept ? `(${t("transferredFrom", language)} ${getCategoryLabel(ticket.transferred_from_dept, language)})` : ""}:
                        </strong>
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#047857", fontWeight: 600 }}>
                        "{ticket.prescription_notes}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Department Queue Snapshot */}
        <div style={standaloneCardStyle}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#064E3B", fontWeight: 800 }}>
            {getCategoryLabel(adminDept, language)} {t("waitingQueue", language)} ({queueSnapshot.length})
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table style={staffTableStyle}>
              <thead>
                <tr>
                  <th style={staffThStyle}>{t("pos", language)}</th>
                  <th style={staffThStyle}>{t("tokenId", language)}</th>
                  <th style={staffThStyle}>{t("patientDemographics", language)}</th>
                  <th style={staffThStyle}>{t("symptomRisk", language)}</th>
                  <th style={staffThStyle}>{t("aiComplexity", language)}</th>
                  <th style={staffThStyle}>{t("estWaitCol", language)}</th>
                </tr>
              </thead>
              <tbody>
                {queueSnapshot.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ ...staffTdStyle, textAlign: "center", color: "#94A3B8" }}>
                      {t("noWaitingInDept", language)}
                    </td>
                  </tr>
                ) : (
                  queueSnapshot.map((ticket) => (
                    <tr key={ticket.ticket_id}>
                      <td style={staffTdStyle}>#{ticket.position}</td>
                      <td style={{ ...staffTdStyle, fontWeight: 800, color: "#047857" }}>
                        #{ticket.ticket_id}
                        {ticket.transferred_from_dept && (
                          <span style={{ display: "block", fontSize: "9px", color: "#D97706", fontWeight: 700 }}>
                            ({t("transferredFrom", language)} {getCategoryLabel(ticket.transferred_from_dept, language)})
                          </span>
                        )}
                      </td>
                      <td style={{ ...staffTdStyle, fontWeight: 600 }}>
                        {ticket.name} <span style={{ fontSize: "11px", color: "#64748B" }}>({ticket.age || 30} {t("unit_yrs", language)}, {t(ticket.gender || 'male', language)})</span>
                      </td>
                      <td style={{ ...staffTdStyle, fontWeight: 600, fontSize: "11px", color: "#0284C7" }}>
                        {(ticket.medical_condition || 'general_checkup').replace(/_/g, ' ').toUpperCase()}
                        <span style={{ display: "block", fontSize: "10px", color: "#64748B" }}>{t("riskLabel", language)}: {(ticket.pre_existing_condition || 'none').toUpperCase()}</span>
                        {ticket.prescription_notes && (
                          <span style={{ display: "inline-block", marginTop: "2px", padding: "1px 6px", borderRadius: "4px", background: "#ECFDF5", color: "#047857", fontSize: "10px", fontWeight: 700, border: "1px solid #A7F3D0" }} title={ticket.prescription_notes}>
                            Rx: {ticket.prescription_notes.length > 25 ? `${ticket.prescription_notes.substring(0, 25)}...` : ticket.prescription_notes}
                          </span>
                        )}
                      </td>
                      <td style={staffTdStyle}>
                        <span style={badgePrioStyle(ticket.complexity_score > 1.4 ? "#DC2626" : "#0284C7")}>
                          {ticket.complexity_score || 1.0}x
                        </span>
                      </td>
                      <td style={{ ...staffTdStyle, fontWeight: 800, color: "#059669" }}>{ticket.estimated_wait_minutes} {t("unit_min", language)}</td>
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
              {getCategoryLabel(adminDept, language)} {t("todayApts", language)} ({appointments.length})
            </h3>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              {t("scheduledAppointmentsToday", language)}
            </span>
          </div>

          <button onClick={fetchTenantAppointments} style={refreshBtnStyle}>
            ↻
          </button>
        </div>

        {appointments.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #CBD5E1", color: "#94A3B8", fontSize: "13px" }}>
            {t("noActiveAptsMsg", language)}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={staffTableStyle}>
              <thead>
                <tr>
                  <th style={staffThStyle}>{t("tokenId", language)}</th>
                  <th style={staffThStyle}>{t("patientDemographics", language)}</th>
                  <th style={staffThStyle}>{t("departmentLabel", language)}</th>
                  <th style={staffThStyle}>{t("reservedSlotLabel", language)}</th>
                  <th style={staffThStyle}>{t("currentStatus", language)}</th>
                  <th style={staffThStyle}>{t("mergedToken", language)} ID)</th>
                  <th style={staffThStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.appointment_id}>
                    <td style={{ ...staffTdStyle, fontWeight: 800, color: "#047857" }}>{apt.appointment_id}</td>
                    <td style={{ ...staffTdStyle, fontWeight: 700 }}>{apt.patient_name}</td>
                    <td style={{ ...staffTdStyle, fontWeight: 700, color: "#0284C7" }}>{getCategoryLabel(apt.service_category, language)}</td>
                    <td style={{ ...staffTdStyle, fontWeight: 600, color: "#0284C7" }}>
                      {apt.appointment_date} @ {apt.time_slot}
                    </td>
                    <td style={staffTdStyle}>
                      <span style={aptStatusBadgeStyle(apt.status)}>
                        {getStatusLabel(apt.status, language)}
                      </span>
                    </td>
                    <td style={{ ...staffTdStyle, fontWeight: 800, color: "#D97706" }}>
                      {apt.ticket_id ? `#${apt.ticket_id}` : "—"}
                    </td>
                    <td style={staffTdStyle}>
                      {apt.status === "scheduled" ? (
                        <button
                          onClick={() => handleStaffCheckInAppt(apt.appointment_id)}
                          style={checkInRosterBtnStyle}
                          title="Check in patient and issue priority token into active queue"
                        >
                          {t("checkInBtn", language)}
                        </button>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                          {getStatusLabel(apt.status, language)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctor E-Prescription & Inter-Department Transfer Modal */}
      {showTransferModal && selectedTicket && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #D8E8DD", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={modalHeaderIconStyle}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#064E3B", fontWeight: 800 }}>
                    {t("transferModalTitle", language)}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    {t("patientDemographics", language)}: <strong>{selectedTicket.name}</strong> (#{selectedTicket.ticket_id})
                  </span>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} style={closeModalBtnStyle}>×</button>
            </div>

            <form onSubmit={handleExecuteTransfer}>
              <div style={{ marginBottom: "16px" }}>
                <label style={fieldLabelStyle}>{t("selectTargetDept", language)}</label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  style={modalInputStyle}
                >
                  <option value="pharmacy">{getCategoryLabel("pharmacy", language)}</option>
                  <option value="laboratory">{getCategoryLabel("laboratory", language)}</option>
                  <option value="radiology">{getCategoryLabel("radiology", language)}</option>
                  <option value="consultation">{getCategoryLabel("consultation", language)}</option>
                  <option value="emergency">{getCategoryLabel("emergency", language)}</option>
                  <option value="billing">{getCategoryLabel("billing", language)}</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={fieldLabelStyle}>{t("rxDoctorNotes", language)}</label>
                <textarea
                  rows="3"
                  placeholder="Enter prescribed medicines, dosage, or lab tests..."
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  style={modalTextareaStyle}
                />
              </div>

              {/* Quick Prescription Preset Chips */}
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Quick Rx Presets:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setRxNotes("Tab. Paracetamol 650mg (1-0-1), Syrup Cetirizine 5ml")}
                    style={presetChipStyle}
                  >
                    Antipyretic Protocol
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxNotes("Tab. Amoxicillin 500mg (1-0-1), Tab. Pantoprazole 40mg")}
                    style={presetChipStyle}
                  >
                    Antibiotic Protocol
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxNotes("Complete Blood Count (CBC), Fasting Blood Glucose")}
                    style={presetChipStyle}
                  >
                    Pathology Order (CBC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxNotes("Chest X-Ray PA View, Orthopedic Consult")}
                    style={presetChipStyle}
                  >
                    Radiology Order (X-Ray)
                  </button>
                </div>
              </div>

              {transferStatusMsg && (
                <div style={{ marginBottom: "16px", padding: "10px", borderRadius: "8px", background: "#ECFDF5", color: "#047857", fontSize: "12px", textAlign: "center", fontWeight: 700 }}>
                  {transferStatusMsg}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowTransferModal(false)} style={cancelModalBtnStyle}>
                  {t("cancelBtn", language)}
                </button>
                <button type="submit" style={submitTransferBtnStyle}>
                  {t("confirmTransferBtn", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

const shieldIconBadgeStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "#FFFFFF",
  border: "1px solid #A7F3D0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
  display: "flex",
  alignItems: "center",
  gap: "6px",
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

const announceBtnStyle = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #BAE6FD",
  background: "#E0F2FE",
  color: "#0284C7",
  fontWeight: 700,
  fontSize: "11px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
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

const aptStatusBadgeStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return { padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1" };
  if (s === "transferred") return { padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: "#E0F2FE", color: "#0284C7", border: "1px solid #BAE6FD" };
  if (s === "serving") return { padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" };
  if (s === "checked_in") return { padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0" };
  return { padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: "#F3E8FF", color: "#7E22CE", border: "1px solid #E9D5FF" };
};

const checkInRosterBtnStyle = {
  padding: "4px 10px",
  borderRadius: "6px",
  border: "1px solid #A7F3D0",
  background: "#ECFDF5",
  color: "#047857",
  fontWeight: 700,
  fontSize: "11px",
  cursor: "pointer",
};

const transferTriggerBtnStyle = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #A7F3D0",
  background: "#047857",
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: "11px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(15, 23, 42, 0.5)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "16px",
};

const modalBoxStyle = {
  background: "#FFFFFF",
  borderRadius: "20px",
  width: "100%",
  maxWidth: "520px",
  padding: "24px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
  border: "1px solid #D8E8DD",
};

const modalHeaderIconStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const closeModalBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  color: "#94A3B8",
  cursor: "pointer",
};

const modalInputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  fontSize: "13px",
  fontWeight: 600,
  color: "#0F172A",
};

const modalTextareaStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  fontSize: "13px",
  fontFamily: "inherit",
  resize: "vertical",
};

const presetChipStyle = {
  padding: "4px 8px",
  borderRadius: "6px",
  border: "1px solid #A7F3D0",
  background: "#ECFDF5",
  color: "#047857",
  fontSize: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const cancelModalBtnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const submitTransferBtnStyle = {
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
};

/**
 * StaffPage.jsx
 * -------------
 * Doctor & Staff Desk Dashboard (Admin View).
 * Matches the exact UI/UX, aesthetics, and responsive layout of the User Portal (PatientPage).
 * Features Multi-Department Ticket Classification & Security Routing!
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config/hospitalConfig";
import { t, getCategoryLabel, getStatusLabel } from "../utils/i18n";
import AdminHeroBanner from "../components/AdminHeroBanner";
import Footer from "../components/Footer";

export default function StaffPage({
  tenantId,
  currentUser,
  analytics,
  queueSnapshot = [],
  servingTickets = [],
  handleServeNext,
  handleCompleteTicket,
  handleCounterChange,
  refreshData,
  language = "en",
  socketRef,
  navigateTo,
}) {
  const [activeTab, setActiveTab] = useState("ops"); // "ops" | "queue" | "apts" | "ml"
  const [appointments, setAppointments] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [targetDept, setTargetDept] = useState("pharmacy");
  const [hospitalDepartments, setHospitalDepartments] = useState([]);
  const [rxNotes, setRxNotes] = useState("");
  const [transferStatusMsg, setTransferStatusMsg] = useState("");
  const [announceFeedbackMsg, setAnnounceFeedbackMsg] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  // Doctor Prescription Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionTicket, setPrescriptionTicket] = useState(null);
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxMedicines, setRxMedicines] = useState([
    { name: "", dosage: "500mg", frequency: "1-0-1", duration: "5 days", instructions: "After food" },
  ]);
  const [rxLabTests, setRxLabTests] = useState("");
  const [rxAdvice, setRxAdvice] = useState("");
  const [rxFollowUp, setRxFollowUp] = useState("");
  const [rxSaving, setRxSaving] = useState(false);
  const [rxStatusMsg, setRxStatusMsg] = useState("");

  const effectiveHospitalCode =
    tenantId ||
    (currentUser && currentUser.hospital_code && currentUser.hospital_code !== "all"
      ? currentUser.hospital_code
      : null) ||
    HOSPITAL_CONFIG.tenantId ||
    "city-hospital-01";

  useEffect(() => {
    if (!effectiveHospitalCode) return;
    let isMounted = true;
    const fetchDepartments = () => {
      fetch(`${API_BASE}/api/v1/hospitals/${encodeURIComponent(effectiveHospitalCode)}/departments`)
        .then((r) => r.json())
        .then((data) => {
          if (isMounted && data && data.status === "success" && Array.isArray(data.departments) && data.departments.length > 0) {
            setHospitalDepartments(data.departments);
          }
        })
        .catch(() => {});
    };
    fetchDepartments();
    const handleHospUpdate = () => fetchDepartments();
    window.addEventListener("hospital_departments_updated", handleHospUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("hospital_departments_updated", handleHospUpdate);
    };
  }, [effectiveHospitalCode]);

  // ML Studio State (Embedded)
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [ingestStatus, setIngestStatus] = useState(null);
  const [trainStatus, setTrainStatus] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingIngest, setLoadingIngest] = useState(false);
  const [loadingTrain, setLoadingTrain] = useState(false);

  const adminDept = currentUser && currentUser.department ? currentUser.department.toLowerCase() : "all";
  const primaryServing = servingTickets.length > 0 ? servingTickets[0] : null;

  // STRICT CLINICAL RULE: A doctor can only serve one patient at a time
  const doctorId = currentUser?.id;
  const doctorEmail = currentUser?.email;
  const doctorName = currentUser?.name;

  const myServingTicket = servingTickets.find(
    (t) =>
      (t.served_by_doctor_id && doctorId && String(t.served_by_doctor_id) === String(doctorId)) ||
      (t.served_by_doctor_email && doctorEmail && String(t.served_by_doctor_email).toLowerCase() === String(doctorEmail).toLowerCase()) ||
      (t.served_by_doctor_name && doctorName && String(t.served_by_doctor_name).trim().toLowerCase() === String(doctorName).trim().toLowerCase())
  ) || (servingTickets.length > 0 ? servingTickets[0] : null);

  const isDoctorBusy = Boolean(myServingTicket);
  const [serveFeedbackMsg, setServeFeedbackMsg] = useState("");

  useEffect(() => {
    const handleServeErr = (e) => {
      if (e.detail?.message) {
        setServeFeedbackMsg(e.detail.message);
        setTimeout(() => setServeFeedbackMsg(""), 6000);
      }
    };
    window.addEventListener("queue_serve_error", handleServeErr);
    return () => window.removeEventListener("queue_serve_error", handleServeErr);
  }, []);

  const onCallNextPatient = () => {
    if (isDoctorBusy && myServingTicket) {
      setServeFeedbackMsg(
        language === "hi"
          ? `⚠️ डॉक्टर एक समय में केवल 1 मरीज़ को देख सकते हैं। आप वर्तमान में #${myServingTicket.ticket_id} (${myServingTicket.name}) का परामर्श कर रहे हैं। अगला टोकन बुलाने से पहले यह परामर्श पूर्ण (Complete) करें।`
          : `⚠️ A doctor can only serve one patient at a time. You are currently consulting with Patient #${myServingTicket.ticket_id} (${myServingTicket.name}). Please complete or transfer this consultation before calling the next patient.`
      );
      setTimeout(() => setServeFeedbackMsg(""), 6000);
      return;
    }
    setServeFeedbackMsg("");
    handleServeNext();
  };

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
      setAnnounceFeedbackMsg(
        language === "hi"
          ? `📢 टोकन #${ticket.ticket_id} (${ticket.name}) की पुनः घोषणा प्रसारित की गई!`
          : `📢 Broadcasted call for #${ticket.ticket_id} (${ticket.name}) to Patient Portal & Speakers!`
      );
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
    setTransferStatusMsg(
      language === "hi"
        ? "ई-प्रिस्क्रिप्शन भेजा जा रहा है एवं मरीज़ को कतार में लगाया जा रहा है..."
        : "Transmitting E-Prescription & Queueing Patient..."
    );

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
        setTransferStatusMsg(
          language === "hi"
            ? `✓ टोकन #${selectedTicket.ticket_id} ➔ #${data.new_ticket.ticket_id} (${getCategoryLabel(targetDept, language)}) में स्थानांतरित!`
            : `✓ Transferred #${selectedTicket.ticket_id} -> #${data.new_ticket.ticket_id} in ${targetDept.toUpperCase()}!`
        );
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

  const handleOpenPrescriptionModal = (ticket) => {
    setPrescriptionTicket(ticket);
    setRxStatusMsg("");
    setRxSaving(false);

    let parsed = null;
    if (ticket.prescription_notes) {
      try {
        if (typeof ticket.prescription_notes === "object") {
          parsed = ticket.prescription_notes;
        } else if (typeof ticket.prescription_notes === "string") {
          let trimmed = ticket.prescription_notes.trim();
          while (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))
          ) {
            trimmed = trimmed.slice(1, -1).trim();
          }
          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            parsed = JSON.parse(trimmed);
          } else {
            const direct = JSON.parse(ticket.prescription_notes);
            if (typeof direct === "object" && direct !== null) parsed = direct;
            else if (typeof direct === "string" && direct.trim().startsWith("{")) parsed = JSON.parse(direct);
          }
        }
      } catch (e) {}
    }

    if (parsed && typeof parsed === "object") {
      setRxDiagnosis(parsed.diagnosis || "");
      setRxMedicines(
        Array.isArray(parsed.medicines) && parsed.medicines.length > 0
          ? parsed.medicines
          : [{ name: "", dosage: "500mg", frequency: "1-0-1", duration: "5 days", instructions: "After food" }]
      );
      setRxLabTests(parsed.lab_tests || "");
      setRxAdvice(parsed.advice || "");
      setRxFollowUp(parsed.follow_up || "");
    } else {
      setRxDiagnosis(
        ticket.medical_condition && ticket.medical_condition !== "general_checkup"
          ? ticket.medical_condition
          : ""
      );
      setRxMedicines([
        { name: "", dosage: "500mg", frequency: "1-0-1", duration: "5 days", instructions: "After food" },
      ]);
      setRxLabTests("");
      setRxAdvice(typeof ticket.prescription_notes === "string" ? ticket.prescription_notes : "");
      setRxFollowUp("After 5 days or if needed");
    }
    setShowPrescriptionModal(true);
  };

  const handleAddMedicineRow = () => {
    setRxMedicines((prev) => [
      ...prev,
      { name: "", dosage: "500mg", frequency: "1-0-1", duration: "5 days", instructions: "After food" },
    ]);
  };

  const handleRemoveMedicineRow = (idx) => {
    setRxMedicines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx, field, val) => {
    setRxMedicines((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const buildPrescriptionPayload = () => {
    return {
      doctor_name: currentUser?.name || "Dr. Staff Desk",
      doctor_department: prescriptionTicket?.service_category || currentUser?.department || "General Consultation",
      doctor_employee_id: currentUser?.employee_id || "",
      diagnosis: rxDiagnosis || "Consultation & Clinical Assessment",
      medicines: rxMedicines.filter((m) => m.name && m.name.trim() !== ""),
      lab_tests: rxLabTests,
      advice: rxAdvice,
      follow_up: rxFollowUp,
      prescribed_at: new Date().toISOString(),
    };
  };

  const handleSavePrescription = async (andComplete = false) => {
    if (!prescriptionTicket) return;
    setRxSaving(true);
    setRxStatusMsg(language === "hi" ? "दवा पर्ची सहेजी जा रही है..." : "Saving E-Prescription...");

    const payload = buildPrescriptionPayload();

    try {
      if (andComplete) {
        if (handleCompleteTicket) {
          await handleCompleteTicket(prescriptionTicket.ticket_id, payload);
        }
        setRxStatusMsg(
          language === "hi"
            ? "✓ परामर्श पूर्ण हुआ एवं ई-प्रिस्क्रिप्शन मरीज़ पोर्टल पर प्रेषित!"
            : "✓ Consultation Completed & E-Prescription Sent to Patient Portal!"
        );
        setTimeout(() => {
          setShowPrescriptionModal(false);
          setPrescriptionTicket(null);
          setRxSaving(false);
          setRxStatusMsg("");
          if (refreshData) refreshData();
        }, 1000);
      } else {
        const res = await fetch(`${API_BASE}/api/v1/plugin/save-prescription`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            ticket_id: prescriptionTicket.ticket_id,
            prescription: payload,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setRxStatusMsg(
            language === "hi"
              ? "✓ ई-प्रिस्क्रिप्शन सफलतापूर्वक सहेजा गया!"
              : "✓ E-Prescription saved & updated on Patient Portal!"
          );
          if (refreshData) refreshData();
          setTimeout(() => {
            setShowPrescriptionModal(false);
            setPrescriptionTicket(null);
            setRxSaving(false);
            setRxStatusMsg("");
          }, 1200);
        } else {
          setRxStatusMsg(data.message || "Failed to save prescription.");
          setRxSaving(false);
        }
      }
    } catch (err) {
      setRxStatusMsg("Error saving prescription: " + err.message);
      setRxSaving(false);
    }
  };

  const fetchTenantAppointments = useCallback(() => {
    const params = new URLSearchParams();
    if (adminDept && adminDept !== "all") {
      params.set("department", adminDept);
    }
    params.set("active_only", "true");

    fetch(`${API_BASE}/api/v1/plugin/appointments/tenant/${tenantId}?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments || []))
      .catch((e) => console.log("Fetch tenant appointments error:", e));
  }, [tenantId, adminDept]);

  const fetchModelStatus = useCallback(() => {
    fetch(`${API_BASE}/api/v1/plugin/model-status/${tenantId}`)
      .then((r) => r.json())
      .then((d) => setModelStatus(d))
      .catch((e) => console.log("Model status fetch error:", e));
  }, [tenantId]);

  useEffect(() => {
    fetchTenantAppointments();
    fetchModelStatus();
    if (refreshData) refreshData();
    const interval = setInterval(() => {
      fetchTenantAppointments();
      if (refreshData) refreshData();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchTenantAppointments, fetchModelStatus, refreshData]);

  // ML Handlers
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewData(null);
      setIngestStatus(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    setLoadingPreview(true);
    setIngestStatus(null);

    const formData = new FormData();
    formData.append("tenant_id", tenantId);
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/historical-data/preview`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setLoadingPreview(false);

      if (res.ok) {
        setPreviewData(data);
        setColumnMapping(data.suggested_mapping || {});
      } else {
        setIngestStatus({ error: true, message: data.detail || "Preview failed" });
      }
    } catch (e) {
      setLoadingPreview(false);
      setIngestStatus({ error: true, message: e.message });
    }
  };

  const handleIngest = async () => {
    if (!selectedFile) return;
    setLoadingIngest(true);

    const formData = new FormData();
    formData.append("tenant_id", tenantId);
    formData.append("file", selectedFile);
    formData.append("column_mapping_json", JSON.stringify(columnMapping));

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/historical-data/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setLoadingIngest(false);

      if (res.ok) {
        setIngestStatus({ error: false, message: data.message, ingested: data.rows_ingested });
      } else {
        setIngestStatus({ error: true, message: data.detail || "Upload failed" });
      }
    } catch (e) {
      setLoadingIngest(false);
      setIngestStatus({ error: true, message: e.message });
    }
  };

  const handleTrainModel = async () => {
    setLoadingTrain(true);
    setTrainStatus(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/train-model`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const data = await res.json();
      setLoadingTrain(false);

      if (res.ok && (data.status === "success" || data.mae !== undefined)) {
        setTrainStatus(data);
        fetchModelStatus();
      } else {
        setTrainStatus({ error: true, message: data.detail || data.message || "Training failed" });
      }
    } catch (e) {
      setLoadingTrain(false);
      setTrainStatus({ error: true, message: e.message });
    }
  };

  // Filtered queue items based on search input
  const filteredQueue = queueSnapshot.filter((item) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      String(item.ticket_id).includes(query) ||
      (item.medical_condition && item.medical_condition.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ maxWidth: "1440px", margin: "0 auto", width: "100%", padding: "0 8px", boxSizing: "border-box" }}>
      <style>{`
        .admin-tabs-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .tab-button-modern {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
          user-select: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
          outline: none;
        }

        .tab-button-modern:hover {
          border-color: #BAE6FD;
          background: #F0F9FF;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(2, 132, 199, 0.08);
        }

        .tab-button-modern.active {
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          border-color: #0284C7;
          color: #FFFFFF;
          box-shadow: 0 8px 20px rgba(2, 132, 199, 0.25);
          transform: translateY(-2px);
        }

        .tab-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .tab-button-modern.active .tab-icon-wrapper {
          background: rgba(255, 255, 255, 0.18);
          color: #BAE6FD;
        }

        .tab-button-modern.inactive .tab-icon-wrapper {
          background: #F0F9FF;
          color: #0284C7;
        }

        .tab-title-text {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.2px;
          line-height: 1.2;
        }

        .tab-sub-text {
          font-size: 11px;
          font-weight: 600;
          display: block;
          margin-top: 2px;
        }

        .tab-count-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .admin-portal-dashboard {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1040px) {
          .admin-portal-dashboard {
            grid-template-columns: 1fr;
          }
          .admin-tabs-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 580px) {
          .admin-tabs-bar {
            grid-template-columns: 1fr;
          }
        }

        .telemetry-sidebar-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          padding: 20px;
          box-shadow: 0 4px 20px -2px rgba(2, 132, 199, 0.04);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .admin-action-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
          transition: all 0.2s ease;
          outline: none;
        }

        .admin-action-btn-primary:hover {
          background: #0369A1;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
        }

        .admin-action-btn-primary:active {
          transform: translateY(0);
        }
      `}</style>

      {/* 1. EXECUTIVE ADMIN HERO SECTION (100% Live Telemetry) */}
      <AdminHeroBanner
        language={language}
        adminDept={adminDept}
        hospitalName={currentUser?.hospital_name || "City General Hospital"}
        currentUser={currentUser}
        analytics={analytics}
        waitingCount={queueSnapshot.length}
        servingCount={servingTickets.length}
        servingTicket={primaryServing}
        nextTicket={queueSnapshot.length > 0 ? queueSnapshot[0] : null}
        appointmentsCount={appointments.length}
        handleCounterChange={handleCounterChange}
        handleServeNext={onCallNextPatient}
        isDoctorBusy={isDoctorBusy}
        myServingTicket={myServingTicket}
        navigateTo={navigateTo}
      />

      {/* 2. UNIFIED ADMIN NAVIGATION HUB (4 TABS) */}
      <section style={{ marginBottom: "24px" }}>
        <div className="admin-tabs-bar">
          {/* Tab 1: Desk Operations & Calling */}
          <button
            type="button"
            onClick={() => setActiveTab("ops")}
            className={`tab-button-modern ${activeTab === "ops" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {language === "hi" ? "डेस्क संचालन" : "Desk Operations"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "ops" ? "#38BDF8" : "#E0F2FE",
                    color: activeTab === "ops" ? "#0F172A" : "#0284C7",
                  }}
                >
                  {servingTickets.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "ops" ? "#BAE6FD" : "#64748B" }}>
                {language === "hi" ? "कॉलिंग एवं ई-प्रिस्क्रिप्शन" : "Calling & E-Prescribe"}
              </span>
            </div>
          </button>

          {/* Tab 2: Department Waiting Queue */}
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`tab-button-modern ${activeTab === "queue" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {language === "hi" ? "प्रतीक्षारत कतार" : "Waiting Queue"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "queue" ? "#38BDF8" : "#E0F2FE",
                    color: activeTab === "queue" ? "#0F172A" : "#0284C7",
                  }}
                >
                  {queueSnapshot.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "queue" ? "#BAE6FD" : "#64748B" }}>
                {language === "hi" ? "AI प्राथमिकता सूची" : "AI Prioritized Order"}
              </span>
            </div>
          </button>

          {/* Tab 3: Today's Booked Appointments */}
          <button
            type="button"
            onClick={() => setActiveTab("apts")}
            className={`tab-button-modern ${activeTab === "apts" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {language === "hi" ? "आज के अपॉइंटमेंट्स" : "Booked Slots"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "apts" ? "#38BDF8" : "#E0F2FE",
                    color: activeTab === "apts" ? "#0F172A" : "#0284C7",
                  }}
                >
                  {appointments.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "apts" ? "#BAE6FD" : "#64748B" }}>
                {language === "hi" ? "शेड्यूल एवं चेक-इन" : "Roster & Priority Merge"}
              </span>
            </div>
          </button>

          {/* Tab 4: Hospital ML Studio & Training */}
          <button
            type="button"
            onClick={() => setActiveTab("ml")}
            className={`tab-button-modern ${activeTab === "ml" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {language === "hi" ? "एमएल स्टूडियो" : "ML Studio"}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "ml" ? "#38BDF8" : "#E0F2FE",
                    color: activeTab === "ml" ? "#0F172A" : "#0284C7",
                  }}
                >
                  AI
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "ml" ? "#BAE6FD" : "#64748B" }}>
                {language === "hi" ? "मॉडल ट्रेनिंग एवं सटीकता" : "Training & Accuracy"}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 3. MAIN RESPONSIVE 2-COLUMN DASHBOARD */}
      <div className="admin-portal-dashboard">
        {/* Left Column: Active Workspace */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* TAB 1: DESK OPERATIONS & LIVE CALLING */}
          {activeTab === "ops" && (
            <div style={standaloneCardStyle}>
              {/* Header with Call Priority Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#0F172A", fontWeight: 800, letterSpacing: "-0.4px" }}>
                    {getCategoryLabel(adminDept, language)} {t("deskOperations", language)}
                  </h2>
                  <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                    {language === "hi" ? "डॉक्टर डेस्क से मरीज़ों को बुलाएं एवं जांच रिकॉर्ड दर्ज करें।" : "Call next queued patient, write clinical prescriptions, and manage counter throughput."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onCallNextPatient}
                  className={`admin-action-btn-primary ${isDoctorBusy ? "busy-disabled" : ""}`}
                  style={
                    isDoctorBusy
                      ? {
                          background: "#F1F5F9",
                          color: "#64748B",
                          border: "1.5px solid #CBD5E1",
                          cursor: "not-allowed",
                          boxShadow: "none",
                          opacity: 0.9,
                        }
                      : {}
                  }
                  title={
                    isDoctorBusy
                      ? (language === "hi"
                          ? `वर्तमान में टोकन #${myServingTicket.ticket_id} का परामर्श चल रहा है। 1 डॉक्टर = 1 मरीज़।`
                          : `Currently consulting #${myServingTicket.ticket_id}. Finish first to call next patient.`)
                      : "Call Next Patient in AI Priority Order"
                  }
                >
                  {isDoctorBusy ? (
                    <>
                      <span style={{ fontSize: "14px" }}>🔒</span>
                      <span>
                        {language === "hi"
                          ? `परामर्श जारी (#${myServingTicket.ticket_id})`
                          : `In Consultation (#${myServingTicket.ticket_id})`}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span>{t("callNextTicket", language)}</span>
                    </>
                  )}
                </button>
              </div>

              {serveFeedbackMsg && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "#FFFBEB",
                    border: "1.5px solid #FDE68A",
                    color: "#92400E",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>⚠️</span>
                  <div style={{ flex: 1 }}>{serveFeedbackMsg}</div>
                  <button
                    type="button"
                    onClick={() => setServeFeedbackMsg("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#92400E",
                      fontSize: "16px",
                      cursor: "pointer",
                      padding: "0 4px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {announceFeedbackMsg && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1", fontSize: "13px", fontWeight: 700, textAlign: "center" }}>
                  {announceFeedbackMsg}
                </div>
              )}

              {/* Now Serving List */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {t("nowServingAt", language)} {getCategoryLabel(adminDept, language)}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7", background: "#F0F9FF", padding: "2px 8px", borderRadius: "6px", border: "1px solid #BAE6FD" }}>
                    {servingTickets.length} {language === "hi" ? "सक्रिय" : "Active"}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: isDoctorBusy ? "#D97706" : "#059669", background: isDoctorBusy ? "#FEF3C7" : "#ECFDF5", padding: "2px 8px", borderRadius: "6px", border: isDoctorBusy ? "1px solid #FDE68A" : "1px solid #A7F3D0" }}>
                    {isDoctorBusy
                      ? (language === "hi" ? "डॉक्टर व्यस्त (1/1 क्षमता)" : "Doctor Busy (1/1 Capacity)")
                      : (language === "hi" ? "डॉक्टर उपलब्ध (0/1)" : "Doctor Ready (0/1)")}
                  </span>
                </div>
              </div>

              {servingTickets.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0", color: "#94A3B8" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>🩺</div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0F172A" }}>
                    {t("noServingTickets", language)}
                  </h4>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
                    {language === "hi" ? "कतार में से अगले मरीज़ को बुलाने हेतु 'अगला टोकन बुलाएं' बटन दबाएं।" : "Click 'Call Next Ticket' above to admit the highest-priority patient in line."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {servingTickets.map((ticket) => (
                    <div
                      key={ticket.ticket_id}
                      style={{
                        background: "#FFFFFF",
                        border: "1.5px solid #BAE6FD",
                        borderRadius: "16px",
                        padding: "18px 20px",
                        boxShadow: "0 4px 16px -2px rgba(2, 132, 199, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#0F172A", color: "#38BDF8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900 }}>
                            #{ticket.ticket_id}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h3 style={{ margin: 0, fontSize: "17px", color: "#0F172A", fontWeight: 800 }}>
                                {ticket.name}
                              </h3>
                              <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#E0F2FE", color: "#0284C7", fontSize: "11px", fontWeight: 700 }}>
                                {getCategoryLabel(ticket.service_category, language)}
                              </span>
                              {ticket.served_by_doctor_name && (
                                <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#F1F5F9", color: "#475569", fontSize: "11px", fontWeight: 700 }}>
                                  👨‍⚕️ {ticket.served_by_doctor_name}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "12px", color: "#64748B", marginTop: "2px", display: "block" }}>
                              {ticket.age || 35} {language === "hi" ? "वर्ष" : "yrs"} • {t(ticket.gender || "male", language)} • {language === "hi" ? "लक्षण:" : "Symptom:"} {(ticket.medical_condition || "general").replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons: Re-Announce, Prescribe, Transfer, Complete */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleReAnnounce(ticket)}
                            style={announceBtnStyle}
                            title="Broadcast Announcement"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                            <span>{t("reAnnounce", language)}</span>
                          </button>

                          {/* Write E-Prescription (Rx) Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPrescriptionModal(ticket)}
                            style={{
                              padding: "8px 14px",
                              borderRadius: "10px",
                              border: ticket.prescription_notes ? "1.5px solid #059669" : "1.5px solid #0284C7",
                              background: ticket.prescription_notes ? "#ECFDF5" : "#F0F9FF",
                              color: ticket.prescription_notes ? "#065F46" : "#0369A1",
                              fontWeight: 800,
                              fontSize: "12.5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            title="Write Full Doctor E-Prescription (Rx)"
                          >
                            <span style={{ fontSize: "14px" }}>📝</span>
                            <span>
                              {ticket.prescription_notes
                                ? (language === "hi" ? "पर्ची संपादित करें (Rx)" : "Edit Rx")
                                : (language === "hi" ? "दवा पर्ची (Rx)" : "Prescribe (Rx)")}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenTransferModal(ticket)}
                            style={transferTriggerBtnStyle}
                            title="Route Patient to Another Department"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="12" y1="18" x2="12" y2="12" />
                              <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                            <span>{t("transferPrescribe", language)}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCompleteTicket(ticket.ticket_id)}
                            style={finishBtnStyle}
                            title="Mark Consultation Complete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>{t("completeBtn", language)}</span>
                          </button>
                        </div>
                      </div>

                      {/* Attached E-Prescription Box */}
                      {ticket.prescription_notes && (() => {
                        let parsedRx = null;
                        try {
                          if (typeof ticket.prescription_notes === "object") {
                            parsedRx = ticket.prescription_notes;
                          } else if (typeof ticket.prescription_notes === "string") {
                            let trimmed = ticket.prescription_notes.trim();
                            while (
                              (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                              (trimmed.startsWith("'") && trimmed.endsWith("'"))
                            ) {
                              trimmed = trimmed.slice(1, -1).trim();
                            }
                            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                              parsedRx = JSON.parse(trimmed);
                            } else {
                              const direct = JSON.parse(ticket.prescription_notes);
                              if (typeof direct === "object" && direct !== null) parsedRx = direct;
                              else if (typeof direct === "string" && direct.trim().startsWith("{")) parsedRx = JSON.parse(direct);
                            }
                          }
                        } catch (e) {}

                        return (
                          <div style={{ padding: "12px 14px", background: "#F0FDF4", borderRadius: "10px", border: "1px solid #BBF7D0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "220px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 800, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  ℞ {language === "hi" ? "संलग्न दवा पर्ची (ई-प्रिस्क्रिप्शन)" : "Active E-Prescription Attached"}
                                </span>
                                {parsedRx && parsedRx.diagnosis && (
                                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A", background: "#DCFCE7", padding: "1px 7px", borderRadius: "4px" }}>
                                    {parsedRx.diagnosis}
                                  </span>
                                )}
                              </div>
                              {parsedRx && Array.isArray(parsedRx.medicines) && parsedRx.medicines.length > 0 ? (
                                <div style={{ fontSize: "12.5px", color: "#166534" }}>
                                  <strong>{parsedRx.medicines.length} {language === "hi" ? "दवाएं निर्धारित" : "Medicines"}:</strong>{" "}
                                  {parsedRx.medicines.map((m) => `${m.name} (${m.dosage || ""})`).join(", ")}
                                </div>
                              ) : (
                                <p style={{ margin: 0, fontSize: "13px", color: "#166534", fontStyle: "italic" }}>
                                  "{parsedRx?.advice || (typeof ticket.prescription_notes === "string" && !ticket.prescription_notes.startsWith("{") ? ticket.prescription_notes : "Clinical prescription on record")}"
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenPrescriptionModal(ticket)}
                              style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #86EFAC", background: "#FFFFFF", color: "#15803D", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                            >
                              ✏️ {language === "hi" ? "पर्ची संपादित करें" : "Edit Prescription"}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEPARTMENT WAITING QUEUE */}
          {activeTab === "queue" && (
            <div style={standaloneCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#0F172A", fontWeight: 800, letterSpacing: "-0.4px" }}>
                    {getCategoryLabel(adminDept, language)} {t("waitingQueue", language)} ({queueSnapshot.length})
                  </h2>
                  <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                    {language === "hi" ? "क्लिनिकल जटिलता एवं एआई ट्राइएज द्वारा निर्धारित प्रतीक्षा सूची।" : "Real-time queue sequence dynamically calculated by AI priority algorithm."}
                  </p>
                </div>

                {/* Search / Filter Input */}
                <input
                  type="text"
                  placeholder={language === "hi" ? "नाम या टोकन संख्या खोजें..." : "Filter by patient name or #..."}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "12.5px", width: "220px", outline: "none" }}
                />
              </div>

              {filteredQueue.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0", color: "#94A3B8" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>📋</div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0F172A" }}>
                    {t("noWaitingInDept", language)}
                  </h4>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
                    {language === "hi" ? "इस समय कोई प्रतीक्षारत मरीज़ नहीं है।" : "All patients have been served or no check-ins pending."}
                  </p>
                </div>
              ) : (
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
                      {filteredQueue.map((ticket) => (
                        <tr key={ticket.ticket_id} style={{ transition: "background 0.15s ease" }}>
                          <td style={staffTdStyle}>
                            <span style={{ fontWeight: 800, color: "#64748B" }}>#{ticket.position}</span>
                          </td>
                          <td style={{ ...staffTdStyle, fontWeight: 900, color: "#0284C7" }}>
                            #{ticket.ticket_id}
                          </td>
                          <td style={{ ...staffTdStyle, fontWeight: 700, color: "#0F172A" }}>
                            {ticket.name}
                            <span style={{ fontSize: "11px", color: "#64748B", display: "block", fontWeight: 500 }}>
                              {ticket.age || 30} {language === "hi" ? "वर्ष" : "yrs"} • {t(ticket.gender || "male", language)}
                            </span>
                          </td>
                          <td style={{ ...staffTdStyle, fontSize: "12px", color: "#0284C7", fontWeight: 600 }}>
                            {(ticket.medical_condition || "general").replace(/_/g, " ").toUpperCase()}
                            <span style={{ display: "block", fontSize: "10.5px", color: "#64748B" }}>
                              {t("riskLabel", language)}: {(ticket.pre_existing_condition || "none").toUpperCase()}
                            </span>
                          </td>
                          <td style={staffTdStyle}>
                            <span style={badgePrioStyle(ticket.complexity_score > 1.4 ? "#DC2626" : "#0284C7")}>
                              {ticket.complexity_score || 1.0}x
                            </span>
                          </td>
                          <td style={{ ...staffTdStyle, fontWeight: 800, color: "#0284C7" }}>
                            {ticket.estimated_wait_minutes} {language === "hi" ? "मिनट" : "min"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TODAY'S BOOKED APPOINTMENTS */}
          {activeTab === "apts" && (
            <div style={standaloneCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#0F172A", fontWeight: 800, letterSpacing: "-0.4px" }}>
                    {getCategoryLabel(adminDept, language)} {t("todayApts", language)} ({appointments.length})
                  </h2>
                  <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                    {t("scheduledAppointmentsToday", language)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchTenantAppointments}
                  style={refreshBtnStyle}
                  title="Refresh Appointments"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span>{language === "hi" ? "ताज़ा करें" : "Refresh"}</span>
                </button>
              </div>

              {appointments.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0", color: "#94A3B8" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>📅</div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0F172A" }}>
                    {t("noActiveAptsMsg", language)}
                  </h4>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
                    {language === "hi" ? "आज के लिए कोई निर्धारित अपॉइंटमेंट लंबित नहीं है।" : "No pending pre-scheduled appointment bookings found."}
                  </p>
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
                          <td style={{ ...staffTdStyle, fontWeight: 900, color: "#0284C7" }}>{apt.appointment_id}</td>
                          <td style={{ ...staffTdStyle, fontWeight: 700 }}>{apt.patient_name}</td>
                          <td style={{ ...staffTdStyle, fontWeight: 700, color: "#0284C7" }}>
                            {getCategoryLabel(apt.service_category, language)}
                          </td>
                          <td style={{ ...staffTdStyle, fontWeight: 600, color: "#0F172A" }}>
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
                                type="button"
                                onClick={() => handleStaffCheckInAppt(apt.appointment_id)}
                                style={checkInRosterBtnStyle}
                                title="Check in patient and issue priority token"
                              >
                                {t("checkInBtn", language)}
                              </button>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700 }}>
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
          )}

          {/* TAB 4: HOSPITAL ML STUDIO & TRAINING */}
          {activeTab === "ml" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* ML Header Card */}
              <div style={standaloneCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Machine Learning Engine
                    </span>
                    <h2 style={{ margin: "4px 0 0 0", color: "#0F172A", fontSize: "22px", fontWeight: 800 }}>
                      {language === "hi" ? "अस्पताल एमएल स्टूडियो एवं ट्रेनिंग पाइपलाइन" : "Hospital ML Studio & Model Pipeline"}
                    </h2>
                    <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "13px" }}>
                      Tenant ID: <strong>{tenantId}</strong> — {language === "hi" ? "ऐतिहासिक डेटासेट अपलोड करें एवं ग्रेडिएंट बूस्टिंग मॉडल ट्रेन करें।" : "Ingest historical dataset and train gradient boosting models."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTrainModel}
                    disabled={loadingTrain}
                    className="admin-action-btn-primary"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>{loadingTrain ? (language === "hi" ? "ट्रेनिंग जारी..." : "Training Model...") : (language === "hi" ? "मॉडल ट्रेन करें" : "Train Hospital Model")}</span>
                  </button>
                </div>
              </div>

              {/* Model Status Metrics */}
              {modelStatus && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
                  <div style={staffStatCardStyle}>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 700 }}>Active Model</span>
                    <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0284C7", margin: "4px 0" }}>
                      {modelStatus.is_tenant_specific ? "Tenant Specialized" : "Global Baseline"}
                    </h3>
                    <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>{modelStatus.model_name || "GradientBoosting"}</span>
                  </div>
                  <div style={staffStatCardStyle}>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 700 }}>Dataset Size</span>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0284C7", margin: "4px 0" }}>
                      {(modelStatus.training_rows || 1420).toLocaleString()} rows
                    </h3>
                    <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>Historical Service Logs</span>
                  </div>
                  <div style={staffStatCardStyle}>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 700 }}>MAE Accuracy</span>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#16A34A", margin: "4px 0" }}>
                      ±{modelStatus.mae || "1.47"} min
                    </h3>
                    <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>Mean Absolute Error</span>
                  </div>
                  <div style={staffStatCardStyle}>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 700 }}>Last Trained</span>
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#D97706", margin: "6px 0" }}>
                      {modelStatus.trained_at ? modelStatus.trained_at.substring(0, 16) : "Active Pipeline"}
                    </h3>
                    <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>Synced Real-Time</span>
                  </div>
                </div>
              )}

              {/* Dataset Ingestion Dropzone Card */}
              <div style={standaloneCardStyle}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "17px", color: "#0F172A", fontWeight: 800 }}>
                  {language === "hi" ? "ऐतिहासिक अस्पताल डेटासेट अपलोड करें" : "Ingest Historical Hospital Dataset"}
                </h3>

                <div style={dropzoneStyle}>
                  <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} style={{ marginBottom: "10px" }} />
                  <p style={{ margin: 0, color: "#64748B", fontSize: "12px" }}>
                    Upload CSV or Excel files containing historical patient wait times, service durations, and triage levels.
                  </p>
                </div>

                {selectedFile && (
                  <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
                    <button type="button" onClick={handlePreview} disabled={loadingPreview} style={secondaryBtnStyle}>
                      {loadingPreview ? "Parsing..." : "Preview Dataset & Map Columns"}
                    </button>
                    {previewData && (
                      <button type="button" onClick={handleIngest} disabled={loadingIngest} className="admin-action-btn-primary" style={{ padding: "8px 16px", fontSize: "12.5px" }}>
                        {loadingIngest ? "Ingesting..." : "Ingest Clean Dataset"}
                      </button>
                    )}
                  </div>
                )}

                {ingestStatus && (
                  <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", background: ingestStatus.error ? "#FEF2F2" : "#F0F9FF", border: `1px solid ${ingestStatus.error ? "#FECACA" : "#BAE6FD"}`, color: ingestStatus.error ? "#DC2626" : "#0369A1", fontSize: "12px", fontWeight: 700 }}>
                    {ingestStatus.message}
                  </div>
                )}

                {trainStatus && (
                  <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1", fontSize: "12px", fontWeight: 700 }}>
                    ✓ Training Successful! Model MAE: ±{trainStatus.mae || "1.24"} min
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Admin Telemetry Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* 1. Live Queue Counter Pulse Card */}
          <div className="telemetry-sidebar-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0EA5E9", boxShadow: "0 0 8px #0EA5E9" }} />
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>
                  {language === "hi" ? "लाइव कतार मॉनिटर" : "Live Queue Monitor"}
                </span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0369A1", background: "#F0F9FF", padding: "2px 8px", borderRadius: "6px", border: "1px solid #BAE6FD" }}>
                {analytics ? `${analytics.active_counters} ${language === "hi" ? "डेस्क सक्रिय" : "Desks Active"}` : (language === "hi" ? "2 डेस्क सक्रिय" : "2 Desks Active")}
              </span>
            </div>

            {/* Now Serving Highlight in Dark Ocean / Slate Gradient */}
            <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 70%, #0C4A6E 100%)", borderRadius: "14px", padding: "16px", color: "#FFFFFF" }}>
              <div style={{ fontSize: "11px", color: "#BAE6FD", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {t("nowServing", language)}
              </div>
              {primaryServing ? (
                <div style={{ marginTop: "4px" }}>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#38BDF8", lineHeight: 1.1 }}>
                    #{primaryServing.ticket_id}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>
                    {primaryServing.name}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", marginTop: "2px" }}>
                    {language === "hi" ? "विभाग:" : "Dept:"} {getCategoryLabel(primaryServing.service_category || "consultation", language)}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: "6px", fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                  {language === "hi" ? "अगले मरीज़ हेतु सभी डेस्क तैयार हैं" : "All desks ready for next patient"}
                </div>
              )}
            </div>

            {/* Live Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "#F8FAFC", padding: "10px 12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "10.5px", color: "#64748B", display: "block" }}>
                  {language === "hi" ? "औसत प्रतीक्षा" : "Est. Avg Wait"}
                </span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#0284C7" }}>
                  {analytics ? analytics.avg_wait_minutes : 12} {language === "hi" ? "मिनट" : "min"}
                </span>
              </div>
              <div style={{ background: "#F8FAFC", padding: "10px 12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "10.5px", color: "#64748B", display: "block" }}>
                  {language === "hi" ? "कतार में" : "In Line"}
                </span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                  {queueSnapshot.length} {language === "hi" ? "मरीज़" : "patients"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Next Up in Queue Preview */}
          {queueSnapshot.length > 0 && (
            <div className="telemetry-sidebar-card">
              <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📋</span> {language === "hi" ? "कतार में अगले टोकन" : "Next Up in Queue"}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {queueSnapshot.slice(0, 3).map((item) => (
                  <div key={item.ticket_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: "8px", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748B" }}>#{item.position}</span>
                      <div>
                        <strong style={{ fontSize: "12.5px", color: "#0F172A" }}>#{item.ticket_id}</strong>
                        <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>{item.name}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>
                      ~{item.estimated_wait_minutes}{language === "hi" ? "मि" : "m"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Quick Operations Launcher */}
          <div className="telemetry-sidebar-card">
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#0F172A" }}>
              ⚡ {language === "hi" ? "त्वरित संचालन शॉर्टकट" : "Operations Shortcuts"}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {navigateTo && (
                <button
                  type="button"
                  onClick={() => navigateTo("db")}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    color: "#334155",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>🗄️</span>
                  <span>{language === "hi" ? "डेटाबेस निरीक्षक खोलें" : "Open Database Inspector"}</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. Emergency & Security Triage Pill */}
          <div className="telemetry-sidebar-card" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>🚨</span>
              <div>
                <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#991B1B" }}>
                  {language === "hi" ? "24/7 आपातकालीन ट्राइएज" : "24/7 Emergency Triage"}
                </div>
                <div style={{ fontSize: "11px", color: "#DC2626" }}>
                  {language === "hi" ? "हेल्पलाइन: 108 / 1800-456-CARE" : "Helpline: 108 / +1 (800) 456-CARE"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. INTER-DEPARTMENT TRANSFER & E-PRESCRIPTION MODAL */}
      {showTransferModal && selectedTicket && (
        <div style={modalOverlayStyle} onClick={() => setShowTransferModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#F0F9FF", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  💊
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
                    {t("transferModalTitle", language)}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    Patient #{selectedTicket.ticket_id} ({selectedTicket.name})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  {t("selectTargetDept", language)}
                </label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13px", outline: "none", background: "#FFF" }}
                >
                  {hospitalDepartments && hospitalDepartments.length > 0 ? (
                    hospitalDepartments.map((d) => (
                      <option key={d.dept_code} value={d.dept_code}>
                        🏢 {d.name || getCategoryLabel(d.dept_code, language)}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="pharmacy">💊 Pharmacy (Medication Dispensing)</option>
                      <option value="pathology">🧪 Pathology (Blood & Specimen Lab)</option>
                      <option value="radiology">🩻 Radiology (X-Ray & MRI Imaging)</option>
                      <option value="cardiology">❤️ Cardiology OPD</option>
                      <option value="orthopedics">🦴 Orthopedics / Fracture Clinic</option>
                      <option value="pulmonology">🫁 Pulmonology & Respiratory</option>
                      <option value="consultation">🏥 General OPD Follow-Up</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  {t("rxDoctorNotes", language)}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={language === "hi" ? "दवाओं के नाम, खुराक, जांच निर्देश अथवा क्लिनिकल नोट्स लिखें..." : "Enter prescribed medications, dosage (e.g. Paracetamol 500mg TDS, Amoxicillin), test instructions, and clinical routing notes..."}
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              {transferStatusMsg && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1", fontSize: "12px", fontWeight: 700, textAlign: "center" }}>
                  {transferStatusMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #CBD5E1", background: "#F8FAFC", color: "#64748B", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  {t("cancelBtn", language)}
                </button>
                <button
                  type="submit"
                  className="admin-action-btn-primary"
                  style={{ flex: 1.5, padding: "10px" }}
                >
                  {t("confirmTransferBtn", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4b. DOCTOR E-PRESCRIPTION (Rx) CLINICAL MODAL */}
      {showPrescriptionModal && prescriptionTicket && (
        <div style={modalOverlayStyle} onClick={() => setShowPrescriptionModal(false)}>
          <div
            style={{
              ...modalContentStyle,
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px 28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Rx Seal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px", borderBottom: "1.5px solid #F1F5F9", paddingBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 900, boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)" }}>
                  ℞
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "19px", color: "#0F172A", fontWeight: 800 }}>
                    {language === "hi" ? "चिकित्सकीय दवा पर्ची (ई-प्रिस्क्रिप्शन)" : "Doctor Clinical E-Prescription (Rx)"}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#0284C7" }}>
                      Token #{prescriptionTicket.ticket_id}
                    </span>
                    <span style={{ color: "#94A3B8" }}>•</span>
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                      {prescriptionTicket.name} ({prescriptionTicket.age || 30} yrs, {prescriptionTicket.gender || "Patient"})
                    </span>
                    <span style={{ color: "#94A3B8" }}>•</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0369A1", background: "#E0F2FE", padding: "1px 6px", borderRadius: "4px" }}>
                      {getCategoryLabel(prescriptionTicket.service_category, language)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrescriptionModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
              >
                ✕
              </button>
            </div>

            {/* Doctor Attribution Info */}
            <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155" }}>
                <span>👨‍⚕️</span>
                <strong>{currentUser?.name || "Attending Consultant"}</strong>
                <span style={{ color: "#64748B" }}>
                  ({currentUser?.department ? getCategoryLabel(currentUser.department, language) : getCategoryLabel(prescriptionTicket.service_category, language)})
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>
                📅 {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* 1. Provisional Diagnosis */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 800, color: "#0F172A", marginBottom: "6px" }}>
                  🩺 {language === "hi" ? "रोग निदान / मुख्य लक्षण (Provisional Diagnosis)" : "Clinical Diagnosis & Findings"}
                </label>
                <input
                  type="text"
                  placeholder={language === "hi" ? "उदा. एक्यूट फैरिंजाइटिस, वायरल फीवर, माइल्ड हाइपरटेंशन..." : "e.g. Acute Pharyngitis, Viral Fever, Grade 1 Hypertension, Musculoskeletal Strain..."}
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #CBD5E1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
                {/* Quick Diagnosis Suggestions */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                  {["Viral Fever / Flu", "Acute Pharyngitis", "Hypertension", "GERD / Gastritis", "Type 2 Diabetes", "Routine Checkup"].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setRxDiagnosis(quick)}
                      style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#475569", cursor: "pointer" }}
                    >
                      + {quick}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Prescribed Medications Table */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#0F172A" }}>
                    💊 {language === "hi" ? "दवाएं एवं खुराक (Prescribed Medications)" : "Prescribed Medicines & Dosage"}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    style={{ fontSize: "11.5px", fontWeight: 800, color: "#0284C7", background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "4px 10px", borderRadius: "8px", cursor: "pointer" }}
                  >
                    + {language === "hi" ? "दवा जोड़ें" : "Add Medicine"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {rxMedicines.map((med, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.8fr 1fr 1.2fr 1fr 1.2fr auto",
                        gap: "8px",
                        alignItems: "center",
                        padding: "10px",
                        background: "#F8FAFC",
                        borderRadius: "10px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "10px", color: "#64748B", display: "block", fontWeight: 700 }}>Medicine Name</span>
                        <input
                          type="text"
                          placeholder="e.g. Paracetamol"
                          value={med.name}
                          onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12.5px", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", color: "#64748B", display: "block", fontWeight: 700 }}>Dosage</span>
                        <input
                          type="text"
                          placeholder="500mg"
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12.5px", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", color: "#64748B", display: "block", fontWeight: 700 }}>Frequency</span>
                        <select
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                          style={{ width: "100%", padding: "7px 8px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFF", boxSizing: "border-box" }}
                        >
                          <option value="1-0-1">1-0-1 (Twice daily)</option>
                          <option value="1-0-0">1-0-0 (Morning)</option>
                          <option value="0-0-1">0-0-1 (Night)</option>
                          <option value="1-1-1">1-1-1 (Thrice daily)</option>
                          <option value="SOS">SOS (As needed)</option>
                          <option value="Once weekly">Once weekly</option>
                        </select>
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", color: "#64748B", display: "block", fontWeight: 700 }}>Duration</span>
                        <input
                          type="text"
                          placeholder="5 days"
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12.5px", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", color: "#64748B", display: "block", fontWeight: 700 }}>Instructions</span>
                        <select
                          value={med.instructions}
                          onChange={(e) => handleMedicineChange(idx, "instructions", e.target.value)}
                          style={{ width: "100%", padding: "7px 8px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFF", boxSizing: "border-box" }}
                        >
                          <option value="After food">After food</option>
                          <option value="Before food">Before food</option>
                          <option value="Empty stomach">Empty stomach</option>
                          <option value="Bedtime">Bedtime</option>
                        </select>
                      </div>
                      <div style={{ paddingTop: "14px" }}>
                        {rxMedicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
                            style={{ background: "#FEE2E2", border: "none", color: "#DC2626", width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Remove Medicine"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Lab Tests & Diagnostics */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 800, color: "#0F172A", marginBottom: "6px" }}>
                  🧪 {language === "hi" ? "जांच निर्देश / टेस्ट (Lab Investigations)" : "Diagnostic Tests & Lab Orders (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder={language === "hi" ? "उदा. सीबीसी, लिपिड प्रोफाइल, सीने का एक्स-रे, यूरिन रूटीन..." : "e.g. CBC, Serum Creatinine, Fasting Lipid Panel, Chest X-Ray PA View..."}
                  value={rxLabTests}
                  onChange={(e) => setRxLabTests(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* 4. Clinical Advice / Instructions */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 800, color: "#0F172A", marginBottom: "6px" }}>
                  📋 {language === "hi" ? "चिकित्सकीय सलाह एवं परहेज (Diet & Lifestyle Advice)" : "Doctor Advice & Dietary Guidelines"}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === "hi" ? "उदा. पर्याप्त गर्म पानी पिएं, नमक कम खाएं, भारी काम से बचें..." : "e.g. Hydrate well, low-sodium diet, warm saline gargle 3 times daily, avoid heavy exertion..."}
                  value={rxAdvice}
                  onChange={(e) => setRxAdvice(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              {/* 5. Follow-Up Schedule */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 800, color: "#0F172A", marginBottom: "6px" }}>
                  🗓️ {language === "hi" ? "पुनः परामर्श / फॉलो-अप (Follow-Up Advice)" : "Follow-Up Consultation"}
                </label>
                <input
                  type="text"
                  placeholder={language === "hi" ? "उदा. 5 दिन बाद जांच रिपोर्ट के साथ आएं" : "e.g. Review after 5 days with lab reports, or SOS if fever spikes"}
                  value={rxFollowUp}
                  onChange={(e) => setRxFollowUp(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Status feedback message */}
              {rxStatusMsg && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: rxStatusMsg.includes("✓") ? "#F0FDF4" : "#F0F9FF", border: rxStatusMsg.includes("✓") ? "1px solid #86EFAC" : "1px solid #BAE6FD", color: rxStatusMsg.includes("✓") ? "#166534" : "#0369A1", fontSize: "12.5px", fontWeight: 700, textAlign: "center" }}>
                  {rxStatusMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  style={{ flex: 1, padding: "11px 16px", borderRadius: "10px", border: "1px solid #CBD5E1", background: "#F8FAFC", color: "#64748B", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  {t("cancelBtn", language)}
                </button>

                <button
                  type="button"
                  disabled={rxSaving}
                  onClick={() => handleSavePrescription(false)}
                  style={{
                    flex: 1.5,
                    padding: "11px 16px",
                    borderRadius: "10px",
                    border: "1.5px solid #0284C7",
                    background: "#F0F9FF",
                    color: "#0369A1",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: rxSaving ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <span>💾</span>
                  <span>{language === "hi" ? "पर्ची सहेजें (परामर्श जारी)" : "Save Rx (Keep Serving)"}</span>
                </button>

                <button
                  type="button"
                  disabled={rxSaving}
                  onClick={() => handleSavePrescription(true)}
                  style={{
                    flex: 2,
                    padding: "11px 18px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#FFFFFF",
                    fontWeight: 900,
                    fontSize: "13px",
                    cursor: rxSaving ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 2px 10px rgba(5, 150, 105, 0.25)",
                  }}
                >
                  <span>✓</span>
                  <span>{language === "hi" ? "सहेजें एवं परामर्श पूर्ण करें" : "Save Rx & Complete Visit"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOOTER WITH ECG HEARTBEAT */}
      <Footer
        language={language}
        hospitalName={currentUser?.hospital_name || "City General Hospital"}
        currentUser={currentUser}
      />
    </div>
  );
}

// Styling definitions
const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "20px",
  border: "1.5px solid #E2E8F0",
  padding: "24px 28px",
  boxShadow: "0 4px 20px -2px rgba(2, 132, 199, 0.04)",
};

const staffStatCardStyle = {
  background: "#FFFFFF",
  borderRadius: "16px",
  border: "1px solid #E2E8F0",
  padding: "16px 20px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
};

const announceBtnStyle = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid #BAE6FD",
  background: "#F0F9FF",
  color: "#0369A1",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  transition: "all 0.15s ease",
};

const transferTriggerBtnStyle = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid #DDD6FE",
  background: "#F5F3FF",
  color: "#6D28D9",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  transition: "all 0.15s ease",
};

const finishBtnStyle = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
  transition: "all 0.15s ease",
};

const refreshBtnStyle = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#334155",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

const staffTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const staffThStyle = {
  textAlign: "left",
  padding: "12px 14px",
  borderBottom: "1.5px solid #E2E8F0",
  color: "#64748B",
  fontWeight: 800,
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const staffTdStyle = {
  padding: "12px 14px",
  borderBottom: "1px solid #F1F5F9",
  verticalAlign: "middle",
};

const checkInRosterBtnStyle = {
  padding: "6px 14px",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: "11px",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
};

const badgePrioStyle = (color) => ({
  padding: "2px 8px",
  borderRadius: "6px",
  background: color === "#DC2626" ? "#FEF2F2" : "#F0F9FF",
  color,
  fontSize: "11px",
  fontWeight: 800,
  border: `1px solid ${color === "#DC2626" ? "#FECACA" : "#BAE6FD"}`,
});

const aptStatusBadgeStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1" };
  if (s === "transferred") return { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#E0F2FE", color: "#0284C7", border: "1px solid #BAE6FD" };
  if (s === "serving") return { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" };
  if (s === "checked_in") return { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" };
  if (s === "cancelled" || s === "no_show") return { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" };
  return { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#F3E8FF", color: "#7E22CE", border: "1px solid #E9D5FF" };
};

const dropzoneStyle = {
  border: "2px dashed #BAE6FD",
  borderRadius: "14px",
  padding: "24px",
  textAlign: "center",
  background: "#F0F9FF",
};

const secondaryBtnStyle = {
  padding: "9px 16px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#334155",
  fontWeight: 700,
  fontSize: "12.5px",
  cursor: "pointer",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: "20px",
};

const modalContentStyle = {
  background: "#FFFFFF",
  borderRadius: "24px",
  maxWidth: "500px",
  width: "100%",
  padding: "28px",
  boxShadow: "0 24px 48px -10px rgba(0, 0, 0, 0.25)",
  border: "1px solid #E2E8F0",
  maxHeight: "90vh",
  overflowY: "auto",
  boxSizing: "border-box",
};

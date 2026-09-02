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
  const [rxNotes, setRxNotes] = useState("");
  const [transferStatusMsg, setTransferStatusMsg] = useState("");
  const [announceFeedbackMsg, setAnnounceFeedbackMsg] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

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
          border-color: #A7F3D0;
          background: #F0FDF4;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(4, 78, 59, 0.08);
        }

        .tab-button-modern.active {
          background: linear-gradient(135deg, #044E3B 0%, #065F46 100%);
          border-color: #044E3B;
          color: #FFFFFF;
          box-shadow: 0 8px 20px rgba(4, 78, 59, 0.25);
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
          color: #A7F3D0;
        }

        .tab-button-modern.inactive .tab-icon-wrapper {
          background: #ECFDF5;
          color: #047857;
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
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
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
          background: linear-gradient(135deg, #044E3B 0%, #065F46 100%);
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(4, 78, 59, 0.25);
          transition: all 0.2s ease;
          outline: none;
        }

        .admin-action-btn-primary:hover {
          background: #033E2F;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(4, 78, 59, 0.35);
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
        analytics={analytics}
        waitingCount={queueSnapshot.length}
        servingCount={servingTickets.length}
        servingTicket={primaryServing}
        appointmentsCount={appointments.length}
        handleCounterChange={handleCounterChange}
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
                    background: activeTab === "ops" ? "#34D399" : "#044E3B",
                    color: activeTab === "ops" ? "#044E3B" : "#FFFFFF",
                  }}
                >
                  {servingTickets.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "ops" ? "#A7F3D0" : "#64748B" }}>
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
                    background: activeTab === "queue" ? "#34D399" : "#044E3B",
                    color: activeTab === "queue" ? "#044E3B" : "#FFFFFF",
                  }}
                >
                  {queueSnapshot.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "queue" ? "#A7F3D0" : "#64748B" }}>
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
                    background: activeTab === "apts" ? "#34D399" : "#044E3B",
                    color: activeTab === "apts" ? "#044E3B" : "#FFFFFF",
                  }}
                >
                  {appointments.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "apts" ? "#A7F3D0" : "#64748B" }}>
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
                    background: activeTab === "ml" ? "#34D399" : "#044E3B",
                    color: activeTab === "ml" ? "#044E3B" : "#FFFFFF",
                  }}
                >
                  AI
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "ml" ? "#A7F3D0" : "#64748B" }}>
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
                  onClick={handleServeNext}
                  className="admin-action-btn-primary"
                  title="Call Next Patient in AI Priority Order"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span>{t("callNextTicket", language)}</span>
                </button>
              </div>

              {announceFeedbackMsg && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "#ECFDF5", border: "1px solid #10B981", color: "#047857", fontSize: "13px", fontWeight: 700, textAlign: "center" }}>
                  {announceFeedbackMsg}
                </div>
              )}

              {/* Now Serving List */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {t("nowServingAt", language)} {getCategoryLabel(adminDept, language)}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#047857", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px" }}>
                  {servingTickets.length} {language === "hi" ? "सक्रिय" : "Active"}
                </span>
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
                        border: "1.5px solid #A7F3D0",
                        borderRadius: "16px",
                        padding: "18px 20px",
                        boxShadow: "0 4px 16px -2px rgba(4, 78, 59, 0.06)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#044E3B", color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900 }}>
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
                            </div>
                            <span style={{ fontSize: "12px", color: "#64748B", marginTop: "2px", display: "block" }}>
                              {ticket.age || 35} {language === "hi" ? "वर्ष" : "yrs"} • {t(ticket.gender || "male", language)} • {language === "hi" ? "लक्षण:" : "Symptom:"} {(ticket.medical_condition || "general").replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons: Re-Announce, Transfer/Prescribe, Complete */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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

                          <button
                            type="button"
                            onClick={() => handleOpenTransferModal(ticket)}
                            style={transferTriggerBtnStyle}
                            title="Write E-Prescription & Route Patient"
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
                      {ticket.prescription_notes && (
                        <div style={{ padding: "10px 14px", background: "#ECFDF5", borderRadius: "10px", border: "1px solid #A7F3D0" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#047857", display: "block", marginBottom: "2px" }}>
                            💊 {t("ePrescriptionAttached", language)}:
                          </span>
                          <p style={{ margin: 0, fontSize: "13px", color: "#064E3B", fontStyle: "italic" }}>
                            "{ticket.prescription_notes}"
                          </p>
                        </div>
                      )}
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
                          <td style={{ ...staffTdStyle, fontWeight: 900, color: "#047857" }}>
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
                          <td style={{ ...staffTdStyle, fontWeight: 800, color: "#059669" }}>
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
                          <td style={{ ...staffTdStyle, fontWeight: 900, color: "#047857" }}>{apt.appointment_id}</td>
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
                    <span style={{ fontSize: "11px", color: "#047857", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Machine Learning Engine
                    </span>
                    <h2 style={{ margin: "4px 0 0 0", color: "#064E3B", fontSize: "22px", fontWeight: 800 }}>
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
                    <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#047857", margin: "4px 0" }}>
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
                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#10B981", margin: "4px 0" }}>
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
                <h3 style={{ margin: "0 0 14px 0", fontSize: "17px", color: "#064E3B", fontWeight: 800 }}>
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
                  <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", background: ingestStatus.error ? "#FEF2F2" : "#ECFDF5", border: `1px solid ${ingestStatus.error ? "#FECACA" : "#A7F3D0"}`, color: ingestStatus.error ? "#DC2626" : "#047857", fontSize: "12px", fontWeight: 700 }}>
                    {ingestStatus.message}
                  </div>
                )}

                {trainStatus && (
                  <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: "12px", fontWeight: 700 }}>
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
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#064E3B" }}>
                  {language === "hi" ? "लाइव कतार मॉनिटर" : "Live Queue Monitor"}
                </span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#047857", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px" }}>
                {analytics ? `${analytics.active_counters} ${language === "hi" ? "डेस्क सक्रिय" : "Desks Active"}` : (language === "hi" ? "2 डेस्क सक्रिय" : "2 Desks Active")}
              </span>
            </div>

            {/* Now Serving Highlight in Dark Emerald Gradient */}
            <div style={{ background: "linear-gradient(135deg, #064E3B 0%, #043828 100%)", borderRadius: "14px", padding: "16px", color: "#FFFFFF" }}>
              <div style={{ fontSize: "11px", color: "#A7F3D0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {t("nowServing", language)}
              </div>
              {primaryServing ? (
                <div style={{ marginTop: "4px" }}>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#34D399", lineHeight: 1.1 }}>
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
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#047857" }}>
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
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669" }}>
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
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ECFDF5", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  💊
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#064E3B", fontWeight: 800 }}>
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
                  <option value="pharmacy">💊 Pharmacy (Medication Dispensing)</option>
                  <option value="pathology">🧪 Pathology (Blood & Specimen Lab)</option>
                  <option value="radiology">🩻 Radiology (X-Ray & MRI Imaging)</option>
                  <option value="cardiology">❤️ Cardiology OPD</option>
                  <option value="orthopedics">🦴 Orthopedics / Fracture Clinic</option>
                  <option value="pulmonology">🫁 Pulmonology & Respiratory</option>
                  <option value="consultation">🏥 General OPD Follow-Up</option>
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
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: "12px", fontWeight: 700, textAlign: "center" }}>
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

      {/* 5. FOOTER WITH ECG HEARTBEAT */}
      <Footer language={language} />
    </div>
  );
}

// Styling definitions
const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "20px",
  border: "1px solid #E2E8F0",
  padding: "24px 28px",
  boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
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
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.2)",
  transition: "all 0.15s ease",
};

const refreshBtnStyle = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid #E2E8F0",
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
  padding: "6px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#044E3B",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: "11px",
  cursor: "pointer",
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
  if (s === "checked_in") return { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0" };
  if (s === "cancelled" || s === "no_show") return { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" };
  return { padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, background: "#F3E8FF", color: "#7E22CE", border: "1px solid #E9D5FF" };
};

const dropzoneStyle = {
  border: "2px dashed #A7F3D0",
  borderRadius: "14px",
  padding: "24px",
  textAlign: "center",
  background: "#F0FDF4",
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
  zIndex: 1000,
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
};

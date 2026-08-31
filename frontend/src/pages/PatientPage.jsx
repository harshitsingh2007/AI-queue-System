/**
 * PatientPage.jsx
 * ---------------
 * Patient Self-Checkin & Pre-scheduled Appointment Booking Kiosk.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 * Professional Healthcare Vector Styling matching IMAGE 2.
 */

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE, HOSPITAL_CONFIG } from "../config/hospitalConfig";
import { t, getCategoryLabel, getStatusLabel } from "../utils/i18n";
import { printTokenPass, printAppointmentRecord } from "../utils/printPassHelper";
import QueueStepper from "../components/QueueStepper";
import FamilyMemberSwitcher from "../components/FamilyMemberSwitcher";
import HeroBanner from "../components/HeroBanner";
import Footer from "../components/Footer";

export default function PatientPage({
  tenantId,
  currentUser,
  activeTicket,
  setActiveTicket,
  ticketQrData,
  setTicketQrData,
  refreshData,
  language = "en",
  setLanguage,
  navigateTo,
  currentTab = "walkin",
}) {
  // Family Members & Dependents Management
  const getInitialFamilyMembers = () => {
    try {
      const storageKey = `family_members_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [
      {
        id: "self",
        name: currentUser ? (currentUser.username || "Self") : "Self",
        relation: "self",
        age: currentUser && currentUser.age ? currentUser.age : 35,
        gender: currentUser && currentUser.gender ? currentUser.gender.toLowerCase() : "male",
      },
    ];
  };

  const [familyMembers, setFamilyMembers] = useState(getInitialFamilyMembers);
  const [selectedMemberId, setSelectedMemberId] = useState("self");

  // Family Tickets dictionary: { [memberId]: ticketObj }
  const [familyTickets, setFamilyTickets] = useState(() => {
    try {
      const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
      const saved = localStorage.getItem(ticketStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Sync activeTab with currentTab prop & URL parameters
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["walkin", "book", "my_apts", "history"].includes(tabParam.toLowerCase())) {
      return tabParam.toLowerCase();
    }
    return currentTab || "walkin";
  });

  useEffect(() => {
    if (currentTab && ["walkin", "book", "my_apts", "history"].includes(currentTab.toLowerCase())) {
      setActiveTab(currentTab.toLowerCase());
    }
  }, [currentTab]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["walkin", "book", "my_apts", "history"].includes(tabParam.toLowerCase())) {
        setActiveTab(tabParam.toLowerCase());
      } else {
        setActiveTab("walkin");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (navigateTo) {
      navigateTo("patient", tabKey);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "patient");
      url.searchParams.set("tab", tabKey);
      window.history.pushState({}, "", url.toString());
    }
  };
  const [name, setName] = useState(currentUser ? currentUser.username : "");
  const [age, setAge] = useState(currentUser && currentUser.age ? currentUser.age : 35);
  const [gender, setGender] = useState(currentUser && currentUser.gender ? currentUser.gender.toLowerCase() : "male");
  const [medicalCondition, setMedicalCondition] = useState("general_checkup");
  const [preExistingCondition, setPreExistingCondition] = useState("none");
  const [category, setCategory] = useState("consultation");
  const [priority, setPriority] = useState(2);
  const [statusMsg, setStatusMsg] = useState(null);

  // Appointment Booking Form State
  const [aptDate, setAptDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [aptTimeSlot, setAptTimeSlot] = useState("11:30 AM");
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);
  const [checkInCode, setCheckInCode] = useState("");

  const timeSlotOptions = [
    "09:00 AM", "09:45 AM", "10:30 AM", "11:15 AM", "12:00 PM",
    "02:00 PM", "02:45 PM", "03:30 PM", "04:15 PM", "05:00 PM"
  ];

  const fetchUserAppointments = useCallback(() => {
    if (!currentUser && !name) return;
    const email = currentUser ? currentUser.email : name;
    fetch(`${API_BASE}/api/v1/plugin/appointments/user/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => setUserAppointments(d.appointments || []))
      .catch((e) => console.log("Appointments fetch error:", e));
  }, [currentUser, name]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.username);
      if (currentUser.age) setAge(currentUser.age);
      if (currentUser.gender) setGender(currentUser.gender.toLowerCase());
    }
    fetchUserAppointments();
  }, [currentUser, fetchUserAppointments]);

  const activeAppointments = userAppointments.filter((apt) => {
    const s = (apt.status || "").toLowerCase();
    return s === "scheduled" || s === "checked_in" || s === "serving" || s === "waiting";
  });

  const historyAppointments = userAppointments.filter((apt) => {
    const s = (apt.status || "").toLowerCase();
    return s === "completed" || s === "transferred" || s === "cancelled" || s === "no_show";
  });

  const selectedMember = familyMembers.find((m) => m.id === selectedMemberId) || familyMembers[0];

  const handleSelectMember = (member) => {
    setSelectedMemberId(member.id);
    setName(member.name);
    if (member.age) setAge(member.age);
    if (member.gender) setGender(member.gender.toLowerCase());

    // If this family member already has an active ticket in familyTickets, switch activeTicket to it
    if (familyTickets[member.id]) {
      const memTicket = familyTickets[member.id];
      setActiveTicket(memTicket);
      fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${memTicket.ticket_id}`)
        .then((r) => r.json())
        .then((qr) => setTicketQrData(qr))
        .catch((e) => console.log("QR error:", e));
    }
    setStatusMsg(`${t("profileSwitchedMsg", language)} ${member.name}`);
  };

  const handleAddMember = (newMember) => {
    const updated = [...familyMembers, newMember];
    setFamilyMembers(updated);
    try {
      const storageKey = `family_members_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {}
    handleSelectMember(newMember);
  };

  const handleDeleteMember = (memberId) => {
    if (memberId === "self") return;
    const updated = familyMembers.filter((m) => m.id !== memberId);
    setFamilyMembers(updated);
    try {
      const storageKey = `family_members_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {}

    if (familyTickets[memberId]) {
      const updatedTickets = { ...familyTickets };
      delete updatedTickets[memberId];
      setFamilyTickets(updatedTickets);
      try {
        const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
        localStorage.setItem(ticketStorageKey, JSON.stringify(updatedTickets));
      } catch (e) {}
    }

    if (selectedMemberId === memberId) {
      handleSelectMember(familyMembers[0]);
    }
  };

  // 1. Instant Walk-In Ticket Checkin
  const handleJoinQueue = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStatusMsg("Calculating AI clinical complexity & predicting wait time...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          consumer_type: "hospital",
          service_category: category,
          name: name,
          urgency: Number(priority) === 1 ? "emergency" : "routine",
          priority_level: Number(priority),
          user_email: currentUser ? currentUser.email : "",
          age: Number(age) || 30,
          gender: gender,
          medical_condition: medicalCondition,
          pre_existing_condition: preExistingCondition,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const t = data.ticket;
        const tkt = t;
        setActiveTicket(t);

        // Record ticket in family tickets map under active member
        setFamilyTickets((prev) => {
          const updated = { ...prev, [selectedMemberId]: t };
          try {
            const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
            localStorage.setItem(ticketStorageKey, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        setStatusMsg(`Ticket #${t.ticket_id} Issued for ${name}. AI Service Estimate: ${t.predicted_service_minutes} min.`);

        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${tkt.ticket_id}`)
          .then((r) => r.json())
          .then((qr) => setTicketQrData(qr))
          .catch((e) => console.log("QR error:", e));

        refreshData();
      } else {
        const err = await res.json();
        setStatusMsg(`Error: ${err.detail}`);
      }
    } catch (err) {
      setStatusMsg(`Join failed: ${err.message}`);
    }
  };

  // 2. Book Pre-scheduled Slot
  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStatusMsg("Reserving hospital appointment slot...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/appointments/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          consumer_type: "hospital",
          service_category: category,
          patient_name: name,
          user_email: currentUser ? currentUser.email : name,
          appointment_date: aptDate,
          time_slot: aptTimeSlot,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setBookedAppointment(data.appointment);
        setStatusMsg(`Appointment Reserved. Code: ${data.appointment.appointment_id}`);
        fetchUserAppointments();
      } else {
        setStatusMsg(`Booking failed: ${data.detail}`);
      }
    } catch (err) {
      setStatusMsg(`Booking failed: ${err.message}`);
    }
  };

  // 3. Hybrid Merge Check-In (Converts Scheduled Appointment -> Live Priority Queue Ticket)
  const handleAppointmentCheckIn = async (aptId) => {
    const targetId = aptId || checkInCode;
    if (!targetId.trim()) return;

    setStatusMsg(`Checking in appointment ${targetId}...`);

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/appointments/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: targetId }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        const t = data.ticket;
        const tkt = t;
        setActiveTicket(t);

        // Record ticket in family tickets map under active member
        setFamilyTickets((prev) => {
          const updated = { ...prev, [selectedMemberId]: t };
          try {
            const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
            localStorage.setItem(ticketStorageKey, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        setStatusMsg(`Appointment Checked In. Merged into Priority Line as Token #${t.ticket_id}`);

        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${tkt.ticket_id}`)
          .then((r) => r.json())
          .then((qr) => setTicketQrData(qr))
          .catch((e) => console.log("QR error:", e));

        fetchUserAppointments();
        refreshData();
      } else {
        setStatusMsg(`Check-in error: ${data.detail}`);
      }
    } catch (err) {
      setStatusMsg(`Check-in error: ${err.message}`);
    }
  };

  // 4. Cancel Ticket with Reason Validation
  const handleCancelTicket = async () => {
    if (!activeTicket) return;
    setCancelLoading(true);
    setCancelError("");
    const reasonText = cancelReason === "Other" && otherCancelReason.trim() ? otherCancelReason.trim() : cancelReason;

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/tickets/${activeTicket.ticket_id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          ticket_id: activeTicket.ticket_id,
          reason: reasonText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to cancel ticket.");
      }

      const cancelledTicket = data.ticket || { ...activeTicket, status: "cancelled", cancellation_reason: reasonText };
      setActiveTicket(cancelledTicket);

      // Clean from familyTickets map
      setFamilyTickets((prev) => {
        const updated = { ...prev };
        delete updated[selectedMemberId];
        Object.keys(updated).forEach((k) => {
          if (updated[k]?.ticket_id === activeTicket.ticket_id) delete updated[k];
        });
        try {
          const ticketStorageKey = `family_tickets_${currentUser ? (currentUser.username || currentUser.email) : "guest"}`;
          localStorage.setItem(ticketStorageKey, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setShowCancelModal(false);
      setShowAdjustModal(false);
      setStatusMsg(`Ticket #${activeTicket.ticket_id} has been cancelled.`);
      fetchUserAppointments();
      if (refreshData) refreshData();
    } catch (err) {
      setCancelError(err.message || "Could not cancel ticket.");
    } finally {
      setCancelLoading(false);
    }
  };

  // 5. Adjust Queue / Skip Positions (Postpone Later in Queue)
  const handleAdjustQueue = async (skipCount) => {
    if (!activeTicket) return;
    setAdjustLoading(true);
    setAdjustError("");
    setAdjustSuccessMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/tickets/${activeTicket.ticket_id}/adjust-queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          ticket_id: activeTicket.ticket_id,
          skip_positions: skipCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to adjust queue.");
      }

      if (data.ticket) {
        setActiveTicket(data.ticket);
      }
      setAdjustSuccessMsg(data.message || `Postponed by ${skipCount} position(s).`);
      setStatusMsg(data.message || `Queue adjusted by +${skipCount} positions.`);

      setTimeout(() => {
        setShowAdjustModal(false);
        setAdjustSuccessMsg("");
      }, 1400);

      fetchUserAppointments();
      if (refreshData) refreshData();
    } catch (err) {
      setAdjustError(err.message || "Could not adjust queue position.");
    } finally {
      setAdjustLoading(false);
    }
  };
  return (
    <div style={{ width: "100%", paddingBottom: "40px" }}>
      <style>{`
        .patient-tabs-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 24px;
          background: #FFFFFF;
          padding: 8px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03);
        }

        .tab-button-modern {
          padding: 13px 14px;
          border-radius: 12px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
          width: 100%;
          outline: none;
          user-select: none;
        }

        .tab-button-modern.active {
          background: #044E3B;
          color: #FFFFFF;
          border-color: #044E3B;
          box-shadow: 0 4px 14px rgba(4, 78, 59, 0.28);
        }

        .tab-button-modern.inactive {
          background: #FFFFFF;
          color: #0F172A;
          border-color: transparent;
        }

        .tab-button-modern.inactive:hover {
          background: #F8FAFC;
          border-color: #E2E8F0;
          transform: translateY(-1px);
        }

        .tab-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: color 0.15s ease;
        }

        .tab-title-text {
          font-size: 13.5px;
          font-weight: 700;
          line-height: 1.2;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-sub-text {
          font-size: 11px;
          display: block;
          margin-top: 3px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9999px;
          font-size: 10.5px;
          font-weight: 800;
          line-height: 1;
          flex-shrink: 0;
          margin-left: 6px;
          transition: all 0.2s ease;
        }

        @media (max-width: 880px) {
          .patient-tabs-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .patient-tabs-bar {
            grid-template-columns: 1fr;
          }
        }

        .form-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        @media (max-width: 640px) {
          .form-grid-2col {
            grid-template-columns: 1fr;
          }
        }

        .form-field-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #334155;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .modern-form-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #0F172A;
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          font-family: inherit;
          box-sizing: border-box;
        }

        .modern-form-input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
        }

        .modern-form-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 16px 16px;
          padding-right: 40px !important;
          cursor: pointer;
        }

        .modern-triage-card {
          padding: 16px 18px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.15s ease;
          outline: none;
          user-select: none;
          box-sizing: border-box;
        }

        .modern-triage-card.active-routine {
          background: #ECFDF5;
          border: 1.5px solid #059669;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.08);
        }

        .modern-triage-card.active-emergency {
          background: #FEF2F2;
          border: 1.5px solid #DC2626;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.08);
        }

        .modern-triage-card.inactive-triage {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
        }

        .modern-triage-card.inactive-triage:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .modern-submit-btn {
          width: 100%;
          padding: 16px 20px;
          border-radius: 12px;
          border: none;
          background: #044E3B;
          color: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(4, 78, 59, 0.25);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          box-sizing: border-box;
        }

        .modern-submit-btn:hover {
          background: #033E2F;
          box-shadow: 0 6px 18px rgba(4, 78, 59, 0.35);
          transform: translateY(-1px);
        }

        .modern-submit-btn:active {
          transform: translateY(0);
        }
      `}</style>

      {/* 1. HERO SECTION (Matching Image 2 closely) */}
      <HeroBanner
        stats={{
          patientsServed: "250+",
          avgWaitTime: "15 min",
          satisfaction: "98%",
        }}
      />

      {/* 2. Top Header Navigation Mode Tabs / Quick Actions (Matching Image 2) */}
      <div className="patient-tabs-bar">
        {/* Tab 1: Instant Walk-In Ticket */}
        <button
          type="button"
          onClick={() => handleTabChange("walkin")}
          className={`tab-button-modern ${activeTab === "walkin" ? "active" : "inactive"}`}
        >
          <div className="tab-icon-wrapper" style={{ color: activeTab === "walkin" ? "#FFFFFF" : "#1E293B" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
              <polygon points="12 8 13.2 11.4 16.8 11.4 13.9 13.5 15 16.9 12 14.8 9 16.9 10.1 13.5 7.2 11.4 10.8 11.4 12 8" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="tab-title-text" style={{ color: activeTab === "walkin" ? "#FFFFFF" : "#0F172A" }}>
              {t("instantWalkin", language)}
            </span>
            <span className="tab-sub-text" style={{ color: activeTab === "walkin" ? "#A7F3D0" : "#64748B" }}>
              {t("getTokenNow", language)}
            </span>
          </div>
        </button>

        {/* Tab 2: Book Time Slot */}
        <button
          type="button"
          onClick={() => handleTabChange("book")}
          className={`tab-button-modern ${activeTab === "book" ? "active" : "inactive"}`}
        >
          <div className="tab-icon-wrapper" style={{ color: activeTab === "book" ? "#FFFFFF" : "#1E293B" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2.5" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="tab-title-text" style={{ color: activeTab === "book" ? "#FFFFFF" : "#0F172A" }}>
              {t("bookSlot", language)}
            </span>
            <span className="tab-sub-text" style={{ color: activeTab === "book" ? "#A7F3D0" : "#64748B" }}>
              {t("scheduleVisit", language)}
            </span>
          </div>
        </button>

        {/* Tab 3: My Appointments */}
        <button
          type="button"
          onClick={() => handleTabChange("my_apts")}
          className={`tab-button-modern ${activeTab === "my_apts" ? "active" : "inactive"}`}
        >
          <div className="tab-icon-wrapper" style={{ color: activeTab === "my_apts" ? "#FFFFFF" : "#1E293B" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="tab-title-text" style={{ color: activeTab === "my_apts" ? "#FFFFFF" : "#0F172A" }}>
                {t("myAppointments", language)}
              </span>
              <span
                className="tab-count-badge"
                style={{
                  background: activeTab === "my_apts" ? "#34D399" : "#044E3B",
                  color: activeTab === "my_apts" ? "#044E3B" : "#FFFFFF",
                }}
              >
                {activeAppointments.length}
              </span>
            </div>
            <span className="tab-sub-text" style={{ color: activeTab === "my_apts" ? "#A7F3D0" : "#64748B" }}>
              {t("viewAndManage", language)}
            </span>
          </div>
        </button>

        {/* Tab 4: Appointment History */}
        <button
          type="button"
          onClick={() => handleTabChange("history")}
          className={`tab-button-modern ${activeTab === "history" ? "active" : "inactive"}`}
        >
          <div className="tab-icon-wrapper" style={{ color: activeTab === "history" ? "#FFFFFF" : "#1E293B" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="tab-title-text" style={{ color: activeTab === "history" ? "#FFFFFF" : "#0F172A" }}>
                {t("appointmentHistory", language)}
              </span>
              <span
                className="tab-count-badge"
                style={{
                  background: activeTab === "history" ? "#34D399" : "#044E3B",
                  color: activeTab === "history" ? "#044E3B" : "#FFFFFF",
                }}
              >
                {historyAppointments.length}
              </span>
            </div>
            <span className="tab-sub-text" style={{ color: activeTab === "history" ? "#A7F3D0" : "#64748B" }}>
              {t("pastRecords", language)}
            </span>
          </div>
        </button>
      </div>

      {/* Family & Dependent Member Switcher Bar */}
      <FamilyMemberSwitcher
        members={familyMembers}
        selectedMemberId={selectedMemberId}
        onSelectMember={handleSelectMember}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
        language={language}
      />

      {/* Main Tab Content */}
      <div style={standaloneCardStyle}>
        {activeTab === "walkin" && (
          <div>
            {/* Form Header with Walk-In Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#0F172A", fontWeight: 800, letterSpacing: "-0.4px" }}>
                  {t("instantWalkin", language)}
                </h2>
                <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                  City General Hospital — Instant Token & Real-Time Wait Tracker
                </p>
              </div>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "#ECFDF5",
                  color: "#047857",
                  border: "1px solid #A7F3D0",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                Walk-In
              </span>
            </div>

            {/* Dependent Booking Notice Banner */}
            {selectedMember && selectedMember.relation !== "self" && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#1E40AF", fontWeight: 700 }}>
                  👤 {t("bookingFor", language)} <strong>{selectedMember.name}</strong> ({t(`relation_${selectedMember.relation}`, language)}, {selectedMember.age} {t("unit_yrs", language)})
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectMember(familyMembers[0])}
                  style={{ background: "none", border: "none", color: "#2563EB", fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                >
                  {language === "hi" ? "स्वयं पर स्विच करें" : "Switch to Self"}
                </button>
              </div>
            )}

            <form onSubmit={handleJoinQueue}>
              {/* Row 1: Patient Full Name & Patient Age & Gender */}
              <div className="form-grid-2col">
                <div>
                  <label className="form-field-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {t("patientNameLabel", language)}
                  </label>
                  <input
                    type="text"
                    placeholder="user"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="modern-form-input"
                  />
                </div>

                <div>
                  <label className="form-field-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    {t("patientAgeGenderLabel", language)}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <input
                      type="number"
                      placeholder="35"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      min="1"
                      max="120"
                      className="modern-form-input"
                    />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="modern-form-input modern-form-select"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Department / Location & Symptom / Medical Reason */}
              <div className="form-grid-2col">
                <div>
                  <label className="form-field-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <path d="M9 22v-4h6v4" />
                      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
                    </svg>
                    {t("medicalDeptLabel", language)} / Location
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="modern-form-input modern-form-select"
                  >
                    {HOSPITAL_CONFIG.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-field-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      <line x1="9" y1="12" x2="15" y2="12" />
                      <line x1="9" y1="16" x2="13" y2="16" />
                    </svg>
                    {t("primarySymptomLabel", language)}
                  </label>
                  <select
                    value={medicalCondition}
                    onChange={(e) => setMedicalCondition(e.target.value)}
                    className="modern-form-input modern-form-select"
                  >
                    <option value="general_checkup">{t("symptomGeneral", language)}</option>
                    <option value="cardiac_chest_pain">{t("symptomCardiac", language)}</option>
                    <option value="high_fever_infection">{t("symptomFever", language)}</option>
                    <option value="trauma_injury">{t("symptomTrauma", language)}</option>
                    <option value="respiratory_distress">{t("symptomAsthma", language)}</option>
                    <option value="routine_followup">{t("symptomFollowup", language)}</option>
                    <option value="lab_blood_test">{t("symptomLab", language)}</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Pre-Existing Chronic Conditions / Risk Factors */}
              <div style={{ marginBottom: "18px" }}>
                <label className="form-field-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {t("preExistingLabel", language)}
                </label>
                <select
                  value={preExistingCondition}
                  onChange={(e) => setPreExistingCondition(e.target.value)}
                  className="modern-form-input modern-form-select"
                >
                  <option value="none">{t("riskNone", language)}</option>
                  <option value="diabetes">{t("riskDiabetes", language)}</option>
                  <option value="hypertension">{t("riskBP", language)}</option>
                  <option value="cardiovascular">{t("riskHeart", language)}</option>
                  <option value="asthma">{t("riskLung", language)}</option>
                </select>
              </div>

              {/* Row 4: Urgency / Triage Level (2 Selectable Cards) */}
              <div style={{ marginBottom: "22px" }}>
                <label className="form-field-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {t("urgencyLabel", language)}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {/* Routine Checkup Option */}
                  <button
                    type="button"
                    onClick={() => setPriority(2)}
                    className={`modern-triage-card ${priority === 2 ? "active-routine" : "inactive-triage"}`}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: priority === 2 ? "#059669" : "transparent",
                        border: priority === 2 ? "none" : "1.5px solid #CBD5E1",
                        color: priority === 2 ? "#FFFFFF" : "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "13.5px", color: priority === 2 ? "#064E3B" : "#1E293B" }}>
                        {t("routineCheckup", language)}
                      </div>
                      <div style={{ fontSize: "11.5px", color: priority === 2 ? "#047857" : "#64748B", marginTop: "2px", fontWeight: 500 }}>
                        {t("standardOrder", language)}
                      </div>
                    </div>
                  </button>

                  {/* Emergency Case Option */}
                  <button
                    type="button"
                    onClick={() => setPriority(1)}
                    className={`modern-triage-card ${priority === 1 ? "active-emergency" : "inactive-triage"}`}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: priority === 1 ? "#DC2626" : "transparent",
                        color: priority === 1 ? "#FFFFFF" : "#64748B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={priority === 1 ? "2.5" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "13.5px", color: priority === 1 ? "#991B1B" : "#1E293B" }}>
                        {t("emergencyCase", language)}
                      </div>
                      <div style={{ fontSize: "11.5px", color: priority === 1 ? "#DC2626" : "#64748B", marginTop: "2px", fontWeight: 500 }}>
                        {t("priorityJump", language)}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Primary Button */}
              <button type="submit" className="modern-submit-btn">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                    <polygon points="12 8 13.2 11.4 16.8 11.4 13.9 13.5 15 16.9 12 14.8 9 16.9 10.1 13.5 7.2 11.4 10.8 11.4 12 8" fill="rgba(255,255,255,0.2)" />
                  </svg>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "14.5px", fontWeight: 800, letterSpacing: "-0.2px", color: "#FFFFFF", lineHeight: 1.2 }}>
                      {t("getTicketBtn", language)}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 500, color: "#A7F3D0", marginTop: "2px" }}>
                      Generate Token & Join Queue
                    </div>
                  </div>
                </div>
              </button>
            </form>
          </div>
        )}

        {activeTab === "book" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#0F172A", fontWeight: 800, letterSpacing: "-0.3px" }}>
                Book Pre-Scheduled Time Slot
              </h2>
              <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                Reserve a future appointment slot. Scan code upon arrival to merge into priority queue line.
              </p>
            </div>

            {/* Dependent Booking Notice Banner */}
            {selectedMember && selectedMember.relation !== "self" && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#1E40AF", fontWeight: 700 }}>
                  👤 {t("bookingFor", language)} <strong>{selectedMember.name}</strong> ({t(`relation_${selectedMember.relation}`, language)}, {selectedMember.age} {t("unit_yrs", language)})
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectMember(familyMembers[0])}
                  style={{ background: "none", border: "none", color: "#2563EB", fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                >
                  {language === "hi" ? "स्वयं पर स्विच करें" : "Switch to Self"}
                </button>
              </div>
            )}

            <form onSubmit={handleBookSlot}>
              <div style={{ marginBottom: "16px" }}>
                <label className="form-field-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Patient Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="modern-form-input"
                />
              </div>

              <div className="form-grid-2col">
                <div>
                  <label className="form-field-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <path d="M9 22v-4h6v4" />
                    </svg>
                    Department
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="modern-form-input modern-form-select"
                  >
                    {HOSPITAL_CONFIG.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-field-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    required
                    className="modern-form-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label className="form-field-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Select Available Time Slot
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                  {timeSlotOptions.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAptTimeSlot(slot)}
                      style={{
                        padding: "10px 4px",
                        borderRadius: "8px",
                        border: aptTimeSlot === slot ? "2px solid #059669" : "1px solid #CBD5E1",
                        background: aptTimeSlot === slot ? "#ECFDF5" : "#F8FAFC",
                        color: aptTimeSlot === slot ? "#047857" : "#475569",
                        fontWeight: 700,
                        fontSize: "11.5px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="modern-submit-btn">
                Reserve Appointment Slot
              </button>
            </form>

            {bookedAppointment && (
              <div style={aptConfirmationBoxStyle}>
                <span style={{ fontSize: "11px", color: "#047857", fontWeight: 700, textTransform: "uppercase" }}>
                  APPOINTMENT CONFIRMED
                </span>
                <h3 style={{ margin: "4px 0", color: "#064E3B", fontSize: "22px", fontWeight: 900 }}>
                  Code: {bookedAppointment.appointment_id}
                </h3>
                <p style={{ margin: 0, color: "#475569", fontSize: "13px" }}>
                  {bookedAppointment.patient_name} • {bookedAppointment.service_category.toUpperCase()} • <strong>{bookedAppointment.appointment_date} @ {bookedAppointment.time_slot}</strong>
                </p>

                <div style={{ marginTop: "14px" }}>
                  <button
                    onClick={() => handleAppointmentCheckIn(bookedAppointment.appointment_id)}
                    style={checkInNowBtnStyle}
                  >
                    Check In & Join Live Line Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "my_apts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#064E3B", fontWeight: 800 }}>
                  My Active Appointments
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Upcoming and in-progress hospital visits
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder="Enter Code (e.g. APT-9482)"
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px", width: "180px" }}
                />
                <button onClick={() => handleAppointmentCheckIn(checkInCode)} style={quickCheckInBtnStyle}>
                  Check In
                </button>
              </div>
            </div>

            {activeAppointments.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: "13px" }}>
                <p style={{ margin: "0 0 12px 0", color: "#64748B", fontWeight: 600 }}>No active or upcoming appointments found.</p>
                <button
                  type="button"
                  onClick={() => handleTabChange("book")}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#047857", color: "#FFFFFF", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                >
                  Reserve Time Slot Now
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {activeAppointments.map((apt) => (
                  <div key={apt.appointment_id} style={aptCardRowStyle(apt.status)}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 900, color: "#047857" }}>{apt.appointment_id}</span>
                        <span style={aptStatusBadgeStyle(apt.status)}>{apt.status.toUpperCase()}</span>
                      </div>
                      <p style={{ margin: "4px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "14px" }}>
                        {apt.patient_name} — {apt.service_category.toUpperCase()}
                      </p>
                      <span style={{ fontSize: "12px", color: "#64748B" }}>
                        Date: {apt.appointment_date} | Time: {apt.time_slot}
                      </span>
                    </div>

                    <div>
                      {apt.status === "scheduled" ? (
                        <button
                          onClick={() => handleAppointmentCheckIn(apt.appointment_id)}
                          style={checkInNowBtnStyle}
                        >
                          Check In & Join Line
                        </button>
                      ) : (
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "12px", color: "#047857", fontWeight: 800, display: "block" }}>
                            Merged (Token #{apt.ticket_id})
                          </span>
                          <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>
                            Active in Live Queue
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <div style={{ marginBottom: "18px" }}>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#064E3B", fontWeight: 800 }}>
                {t("appointmentHistory", language)}
              </h3>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                All previous, completed, transferred, or cancelled hospital visits
              </span>
            </div>

            {historyAppointments.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: "13px" }}>
                No past appointment history found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {historyAppointments.map((apt) => (
                  <div key={apt.appointment_id} style={aptCardRowStyle(apt.status)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 900, color: "#047857" }}>{apt.appointment_id}</span>
                        <span style={aptStatusBadgeStyle(apt.status)}>{(apt.status || "COMPLETED").toUpperCase()}</span>
                        {apt.ticket_id && (
                          <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>
                            (Token #{apt.ticket_id})
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "4px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "14px" }}>
                        {apt.patient_name} — {apt.service_category.toUpperCase()}
                      </p>
                      <span style={{ fontSize: "12px", color: "#64748B" }}>
                        Date: {apt.appointment_date} | Reserved Slot: {apt.time_slot}
                      </span>

                      {/* E-Prescription & Visit Notes */}
                      {apt.prescription_notes && (
                        <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "8px", background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#047857", display: "block" }}>
                            💊 E-Prescription / Doctor Notes:
                          </span>
                          <span style={{ fontSize: "12px", color: "#064E3B", fontWeight: 600, fontStyle: "italic" }}>
                            "{apt.prescription_notes}"
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right", marginLeft: "12px" }}>
                      <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>
                        Final Visit Status
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: apt.status === "completed" ? "#047857" : "#0284C7" }}>
                        {(apt.status || "completed").toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {statusMsg && (
          <div style={{ marginTop: "16px", padding: "12px", borderRadius: "10px", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: "13px", textAlign: "center", fontWeight: 600 }}>
            {statusMsg}
          </div>
        )}
      </div>

      {/* 4. Digital Ticket Pass Card */}
      {activeTicket && (
        <div style={{ ...standaloneCardStyle, marginTop: "24px", border: "2px solid #059669" }}>
          {/* Active Family Pass Switcher (if multiple family members have active tickets) */}
          {Object.keys(familyTickets).length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", background: "#F1F5F9", padding: "8px 12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>{t("switchTicket", language)}:</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {Object.entries(familyTickets).map(([memId, tick]) => {
                  const isCurrent = activeTicket.ticket_id === tick.ticket_id;
                  return (
                    <button
                      key={memId}
                      type="button"
                      onClick={() => {
                        setActiveTicket(tick);
                        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${tick.ticket_id}`)
                          .then((r) => r.json())
                          .then((qr) => setTicketQrData(qr))
                          .catch((e) => console.log("QR error:", e));
                      }}
                      style={{
                        padding: "3px 9px",
                        borderRadius: "6px",
                        border: isCurrent ? "1.5px solid #059669" : "1px solid #CBD5E1",
                        background: isCurrent ? "#059669" : "#FFFFFF",
                        color: isCurrent ? "#FFFFFF" : "#0F172A",
                        fontSize: "11px",
                        fontWeight: isCurrent ? 800 : 600,
                        cursor: "pointer",
                      }}
                    >
                      {tick.name} (#{tick.ticket_id})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #D8E8DD", paddingBottom: "14px", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>{t("livePassTitle", language)}</span>
                {activeTicket.name && (
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" }}>
                    👤 {activeTicket.name}
                  </span>
                )}
              </div>
              <h2 style={{ margin: 0, fontSize: "32px", color: "#047857", fontWeight: 800 }}>
                #{activeTicket.ticket_id}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Current Status</span>
              <span style={passStatusBadgeStyle(activeTicket.status)}>{activeTicket.status.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>{t("patientDemographics", language)}</span>
              <p style={{ margin: "2px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "15px" }}>
                {activeTicket.name} ({activeTicket.age || 30} yrs, {(activeTicket.gender || "male").toUpperCase()})
              </p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>{t("deptCategory", language)}</span>
              <p style={{ margin: "2px 0 0 0", color: "#047857", fontWeight: 700, fontSize: "15px" }}>{activeTicket.service_category.toUpperCase()}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>{t("symptomRisk", language)}</span>
              <p style={{ margin: "2px 0 0 0", color: "#0284C7", fontWeight: 700, fontSize: "13px" }}>
                {(activeTicket.medical_condition || "general_checkup").replace(/_/g, " ").toUpperCase()} • Risk: {(activeTicket.pre_existing_condition || "none").toUpperCase()}
              </p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>{t("aiComplexity", language)}</span>
              <p style={{ margin: "2px 0 0 0", color: "#D97706", fontWeight: 800, fontSize: "15px" }}>
                {activeTicket.complexity_score || 1.0}x Case Complexity Multiplier
              </p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>{t("pos", language)}</span>
              <p style={{ margin: "2px 0 0 0", color: "#D97706", fontWeight: 800, fontSize: "24px" }}>
                #{activeTicket.position}
              </p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>{t("estWait", language)}</span>
              <p style={{ margin: "2px 0 0 0", color: "#059669", fontWeight: 800, fontSize: "24px" }}>
                {activeTicket.estimated_wait_minutes} min
              </p>
            </div>
          </div>

          {activeTicket.prescription_notes && (
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "#ECFDF5", border: "1px solid #A7F3D0", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "14px" }}>💊</span>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#047857" }}>
                  E-Prescription Attached {activeTicket.transferred_from_dept ? `(Transferred from ${activeTicket.transferred_from_dept.toUpperCase()})` : ""}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#064E3B", fontWeight: 600, fontStyle: "italic" }}>
                "{activeTicket.prescription_notes}"
              </p>
            </div>
          )}

          {ticketQrData && (
            <div style={{ textAlign: "center", borderTop: "1px solid #D8E8DD", paddingTop: "18px" }}>
              <img
                src={ticketQrData.qr_code_base64}
                alt="Ticket QR Code"
                style={{ width: "150px", height: "150px", borderRadius: "12px", background: "#fff", padding: "8px", border: "1px solid #CBD5E1" }}
              />
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#64748B" }}>
                {t("scanQrHint", language)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. Footer (Matching Image 2) */}
      <Footer />
    </div>
  );
}

// Styling definitions
const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "20px",
  border: "1px solid #E2E8F0",
  padding: "28px 32px",
  boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
};

const fieldLabelWithIconStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12.5px",
  color: "#334155",
  marginBottom: "8px",
  fontWeight: 600,
};

const fieldInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #E2E8F0",
  background: "#FFFFFF",
  color: "#0F172A",
  fontSize: "13.5px",
  outline: "none",
  transition: "border 0.2s ease, box-shadow 0.2s ease",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
};

const patientSubmitBtnStyle = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: "12px",
  border: "none",
  background: "#044E3B",
  color: "#ffffff",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(4, 78, 59, 0.25)",
  transition: "all 0.2s ease",
};

const aptConfirmationBoxStyle = {
  marginTop: "20px",
  padding: "18px",
  borderRadius: "14px",
  background: "#ECFDF5",
  border: "2px solid #059669",
  textAlign: "center",
};

const checkInNowBtnStyle = {
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

const quickCheckInBtnStyle = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#047857",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
};

const aptCardRowStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "checked_in" || s === "serving") {
    return {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px",
      background: "#ECFDF5",
      borderRadius: "12px",
      border: "1px solid #A7F3D0",
    };
  }
  if (s === "completed" || s === "transferred") {
    return {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px",
      background: "#FFFFFF",
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
    };
  }
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px",
    background: "#F8FAFC",
    borderRadius: "12px",
    border: "1px solid #CBD5E1",
  };
};

const aptStatusBadgeStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1" };
  if (s === "transferred") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#E0F2FE", color: "#0284C7", border: "1px solid #BAE6FD" };
  if (s === "serving") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" };
  if (s === "checked_in") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0" };
  if (s === "cancelled" || s === "no_show") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" };
  return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#F3E8FF", color: "#7E22CE", border: "1px solid #E9D5FF" };
};

const passStatusBadgeStyle = (status) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  background: status === "serving" ? "#ECFDF5" : "#FEF3C7",
  color: status === "serving" ? "#047857" : "#D97706",
  border: status === "serving" ? "1px solid #A7F3D0" : "1px solid #FDE68A",
});

const dashboardFooterStyle = {
  marginTop: "36px",
  paddingTop: "20px",
  borderTop: "1px solid #D8E8DD",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
};

const footerLogoIconStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  background: "#044E3B",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

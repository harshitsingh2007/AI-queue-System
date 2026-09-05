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
import HeroBanner from "../components/HeroBanner";
import Footer from "../components/Footer";
import FamilyMemberSwitcher, { AddFamilyMemberModal, EditFamilyMemberModal, getRelationLabel } from "../components/FamilyMemberSwitcher";

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
  analytics,
  queueSnapshot = [],
  servingTickets = [],
  kioskQrData,
  socketConnected = true,
  // App-level family profile state (passed from App.jsx)
  familyMembers: familyMembersProp = null,
  setFamilyMembers: setFamilyMembersProp = null,
  activeFamilyMember: activeFamilyMemberProp = null,
  setActiveFamilyMember: setActiveFamilyMemberProp = null,
  onSwitchProfile = null,
  onFamilyMembersChange = null,
}) {
  // Family Members & Dependents Management
  // Use App-level state when provided, fall back to local state
  const getInitialFamilyMembers = () => {
    // If App provides family members, use them (not local storage)
    if (familyMembersProp !== null) {
      const selfObj = {
        id: "self",
        name: currentUser ? (currentUser.username || "Self") : "Self",
        relation: "self",
        age: currentUser && currentUser.age ? currentUser.age : 35,
        gender: currentUser && currentUser.gender ? currentUser.gender.toLowerCase() : "male",
      };
      return [selfObj, ...(familyMembersProp || [])];
    }
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

  const [localFamilyMembers, setLocalFamilyMembers] = useState(getInitialFamilyMembers);

  // Use app-level family members if provided, build combined list with self
  const selfObj = {
    id: "self",
    name: currentUser ? (currentUser.username || "Self") : "Self",
    relation: "self",
    age: currentUser && currentUser.age ? currentUser.age : 35,
    gender: currentUser && currentUser.gender ? currentUser.gender.toLowerCase() : "male",
  };

  const familyMembers = familyMembersProp !== null
    ? [selfObj, ...(familyMembersProp || [])]
    : localFamilyMembers;

  const setFamilyMembers = (newMembers) => {
    if (setFamilyMembersProp) {
      // Filter out self to pass only dependents to App
      const dependentsOnly = Array.isArray(newMembers)
        ? newMembers.filter(m => m.id !== "self")
        : [];
      setFamilyMembersProp(dependentsOnly);
    } else {
      setLocalFamilyMembers(newMembers);
    }
  };

  const [selectedMemberId, setSelectedMemberId] = useState("self");
  const [editingMember, setEditingMember] = useState(null);

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

  // Sync tab with URL, including "family" tab
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["walkin", "book", "my_apts", "history", "family"].includes(tabParam.toLowerCase())) {
      return tabParam.toLowerCase();
    }
    return currentTab || "walkin";
  });

  useEffect(() => {
    if (currentTab && ["walkin", "book", "my_apts", "history", "family"].includes(currentTab.toLowerCase())) {
      setActiveTab(currentTab.toLowerCase());
    }
  }, [currentTab]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["walkin", "book", "my_apts", "history", "family"].includes(tabParam.toLowerCase())) {
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

  // Ticket Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Running late");
  const [otherCancelReason, setOtherCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Queue Adjustment (Skip Backward) Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedSkipCount, setSelectedSkipCount] = useState(1);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState("");
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState("");

  // Appointment Booking Form State
  const [aptDate, setAptDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [aptTimeSlot, setAptTimeSlot] = useState("11:30 AM");
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);
  const [checkInCode, setCheckInCode] = useState("");
  const [aptSearchName, setAptSearchName] = useState("");
  const [aptSearchLoading, setAptSearchLoading] = useState(false);
  const [userTicketHistory, setUserTicketHistory] = useState([]);

  const timeSlotOptions = [
    "09:00 AM", "09:45 AM", "10:30 AM", "11:15 AM", "12:00 PM",
    "02:00 PM", "02:45 PM", "03:30 PM", "04:15 PM", "05:00 PM"
  ];

  const fetchUserAppointments = useCallback((overrideName) => {
    const ident =
      overrideName ||
      (currentUser?.email) ||
      (currentUser?.username) ||
      name ||
      localStorage.getItem("last_patient_name") ||
      "";
    if (!ident.trim()) return;
    const encodedIdent = encodeURIComponent(ident.trim());
    // Always include name as a secondary fallback parameter
    const extraName = (name && name.trim() && name.trim().toLowerCase() !== ident.trim().toLowerCase())
      ? `?name=${encodeURIComponent(name.trim())}`
      : "";
    fetch(`${API_BASE}/api/v1/plugin/appointments/user/${encodedIdent}${extraName}`)
      .then((r) => r.json())
      .then((d) => {
        const apts = d.appointments || [];
        setUserAppointments(apts);
      })
      .catch((e) => console.log("Appointments fetch error:", e));
  }, [currentUser, name]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.username);
      if (currentUser.age) setAge(currentUser.age);
      if (currentUser.gender) setGender(currentUser.gender.toLowerCase());
    } else {
      const savedName = localStorage.getItem("last_patient_name");
      if (savedName && !name) {
        setName(savedName);
      }
    }
    fetchUserAppointments();
  }, [currentUser, fetchUserAppointments]);

  const fetchUserTicketHistory = useCallback((overrideName) => {
    const ident =
      overrideName ||
      (currentUser?.email) ||
      (currentUser?.username) ||
      name ||
      localStorage.getItem("last_patient_name") ||
      "";
    if (!ident.trim()) return;
    const encodedIdent = encodeURIComponent(ident.trim());
    const extraName = (name && name.trim() && name.trim().toLowerCase() !== ident.trim().toLowerCase())
      ? `?name=${encodeURIComponent(name.trim())}`
      : "";
    fetch(`${API_BASE}/api/v1/plugin/tickets/history/${encodedIdent}${extraName}`)
      .then((r) => r.json())
      .then((d) => {
        setUserTicketHistory(d.tickets || []);
      })
      .catch((e) => console.log("Ticket history fetch error:", e));
  }, [currentUser, name]);

  const selectedMember = familyMembers.find((m) => m.id === selectedMemberId) || familyMembers[0];

  const activeAppointments = userAppointments.filter((apt) => {
    const s = (apt.status || "").toLowerCase();
    return s === "scheduled" || s === "checked_in" || s === "serving" || s === "waiting";
  });

  const historyAppointments = userAppointments.filter((apt) => {
    const s = (apt.status || "").toLowerCase();
    return s === "completed" || s === "transferred" || s === "cancelled" || s === "no_show" || s === "expired";
  });

  // Walk-in tickets that are completed, cancelled, expired, or no_show — these are NOT in appointments table
  const historyTickets = userTicketHistory.filter((t) => {
    const s = (t.status || "").toLowerCase();
    return s === "completed" || s === "cancelled" || s === "transferred" || s === "no_show" || s === "expired";
  });

  useEffect(() => {
    if (activeTab === "my_apts") {
      fetchUserAppointments();
    }
    if (activeTab === "history") {
      fetchUserAppointments();
      fetchUserTicketHistory();
    }
  }, [activeTab, fetchUserAppointments, fetchUserTicketHistory]);

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

  // Fetch family members from backend when user is logged in
  useEffect(() => {
    if (!currentUser || !currentUser.email) return;
    // If App-level prop is controlling family members, don't fetch independently
    if (familyMembersProp !== null) return;
    fetch(`${API_BASE}/api/v1/family-members`, {
      headers: { "X-User-Email": currentUser.email }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success" && Array.isArray(data.members)) {
          const selfObj = {
            id: "self",
            name: currentUser.username || "Self",
            relation: "self",
            age: currentUser.age || 35,
            gender: currentUser.gender ? currentUser.gender.toLowerCase() : "male",
          };
          const fullList = [selfObj, ...data.members];
          setLocalFamilyMembers(fullList);
          const storageKey = `family_members_${currentUser.username || currentUser.email}`;
          try {
            localStorage.setItem(storageKey, JSON.stringify(fullList));
          } catch (e) {}
        }
      })
      .catch((err) => console.log("PatientPage family fetch error:", err));
  }, [currentUser]);

  // Sync when App-level family members prop changes
  useEffect(() => {
    if (familyMembersProp !== null) {
      // familyMembers computed above auto-updates since it reads familyMembersProp
      // If current selected member is no longer in the list, reset to self
      if (selectedMemberId !== "self") {
        const stillExists = (familyMembersProp || []).some(m => m.id === selectedMemberId);
        if (!stillExists) setSelectedMemberId("self");
      }
    }
  }, [familyMembersProp]);

  const handleAddMember = async (newMember) => {
    if (currentUser && currentUser.email) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/family-members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": currentUser.email
          },
          body: JSON.stringify(newMember),
        });
        const data = await res.json();
        if (data.status === "success" && data.member) {
          const savedMember = data.member;
          const dependents = familyMembers.filter(m => m.id !== "self");
          const updatedDependents = [...dependents, savedMember];
          setFamilyMembers([selfObj, ...updatedDependents]);
          window.dispatchEvent(new CustomEvent("family_members_updated", { detail: updatedDependents }));
          if (onFamilyMembersChange) onFamilyMembersChange();
          handleSelectMember(savedMember);
          return;
        }
      } catch (err) {
        console.log("Error saving family member:", err);
      }
    }
    // Fallback: local-only add (guest mode)
    const updated = [...familyMembers, newMember];
    setFamilyMembers(updated);
    handleSelectMember(newMember);
  };

  const handleEditMember = async (updatedMember) => {
    if (!currentUser || !currentUser.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/family-members/${encodeURIComponent(updatedMember.id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": currentUser.email
        },
        body: JSON.stringify(updatedMember),
      });
      const data = await res.json();
      if (data.status === "success") {
        // Update local list
        const dependents = familyMembers
          .filter(m => m.id !== "self")
          .map(m => m.id === updatedMember.id ? { ...m, ...updatedMember } : m);
        setFamilyMembers([selfObj, ...dependents]);
        if (onFamilyMembersChange) onFamilyMembersChange();
        setEditingMember(null);
      }
    } catch (err) {
      console.log("Error updating family member:", err);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (memberId === "self") return;
    if (currentUser && currentUser.email) {
      try {
        await fetch(`${API_BASE}/api/v1/family-members/${encodeURIComponent(memberId)}`, {
          method: "DELETE",
          headers: { "X-User-Email": currentUser.email }
        });
      } catch (err) {
        console.log("Error deleting family member:", err);
      }
    }

    const dependents = familyMembers.filter(m => m.id !== "self" && m.id !== memberId);
    setFamilyMembers([selfObj, ...dependents]);
    window.dispatchEvent(new CustomEvent("family_members_updated", { detail: dependents }));
    if (onFamilyMembersChange) onFamilyMembersChange();

    if (familyTickets[memberId]) {
      const updatedTickets = { ...familyTickets };
      delete updatedTickets[memberId];
      setFamilyTickets(updatedTickets);
    }

    if (selectedMemberId === memberId) {
      setSelectedMemberId("self");
      setName(selfObj.name);
    }
  };

  // Sync when patient profile is switched via Header dropdown
  useEffect(() => {
    const handleSwitchEvent = (e) => {
      if (e && e.detail) {
        handleSelectMember(e.detail);
      }
    };
    const handleFamilySync = (e) => {
      if (e && e.detail) {
        setFamilyMembers(e.detail);
      } else {
        setFamilyMembers(getInitialFamilyMembers());
      }
    };
    window.addEventListener("switch_patient_profile", handleSwitchEvent);
    window.addEventListener("family_members_updated", handleFamilySync);
    return () => {
      window.removeEventListener("switch_patient_profile", handleSwitchEvent);
      window.removeEventListener("family_members_updated", handleFamilySync);
    };
  }, [familyMembers, familyTickets]);

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
          // Include family_member_id when booking for a dependent
          ...(selectedMemberId && selectedMemberId !== "self" ? { family_member_id: selectedMemberId } : {}),
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
        const msg = typeof err.detail === "string" ? err.detail : Array.isArray(err.detail) ? err.detail.map((d) => d.msg || JSON.stringify(d)).join(", ") : (err.message || "Failed to issue ticket.");
        setStatusMsg(`Error: ${msg}`);
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
          // Include family_member_id when booking for a dependent
          ...(selectedMemberId && selectedMemberId !== "self" ? { family_member_id: selectedMemberId } : {}),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setBookedAppointment(data.appointment);
        setStatusMsg(`Appointment Reserved. Code: ${data.appointment.appointment_id}`);
        try {
          localStorage.setItem("last_patient_name", name);
        } catch (e) {}
        setUserAppointments((prev) => [
          data.appointment,
          ...prev.filter((a) => a.appointment_id !== data.appointment.appointment_id),
        ]);
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

        setUserAppointments((prev) =>
          prev.map((a) =>
            a.appointment_id === targetId
              ? { ...a, status: "checked_in", ticket_id: t.ticket_id }
              : a
          )
        );
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
      const res = await fetch(`${API_BASE}/api/v1/tickets/${activeTicket.ticket_id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUser?.email ? { "X-User-Email": currentUser.email } : {}),
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          ticket_id: activeTicket.ticket_id,
          reason: reasonText || "Patient requested cancellation",
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
      setStatusMsg(`Ticket #${activeTicket.ticket_id} has been cancelled.`);
      fetchUserAppointments();
      if (refreshData) refreshData();
    } catch (err) {
      setCancelError(err.message || "Could not cancel ticket.");
    } finally {
      setCancelLoading(false);
    }
  };

  // 5. Adjust Queue / Skip Positions Backward (Fairness: 1-3 positions back)
  const handleAdjustQueue = async (skipCount) => {
    if (!activeTicket) return;
    const positionsToSkip = Number(skipCount || selectedSkipCount || 1);
    setAdjustLoading(true);
    setAdjustError("");
    setAdjustSuccessMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/tickets/${activeTicket.ticket_id}/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUser?.email ? { "X-User-Email": currentUser.email } : {}),
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          ticket_id: activeTicket.ticket_id,
          positions: positionsToSkip,
          skip_positions: positionsToSkip,
          reason: "Running late",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to adjust queue.");
      }

      if (data.ticket) {
        setActiveTicket(data.ticket);
      }
      const successText = data.message || `Postponed by ${positionsToSkip} position(s).`;
      setAdjustSuccessMsg(successText);
      setStatusMsg(successText);

      setTimeout(() => {
        setShowAdjustModal(false);
        setAdjustSuccessMsg("");
      }, 1200);

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
        .patient-nav-section {
          margin-bottom: 24px;
        }

        .patient-nav-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 0 4px;
        }

        .patient-nav-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.2px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .patient-nav-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #0284C7;
          background: #F0F9FF;
          padding: 3px 9px;
          border-radius: 9999px;
          border: 1px solid #BAE6FD;
        }

        .status-dot-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #0284C7;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.25);
          animation: pulseDot 2s infinite ease-in-out;
        }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }

        .patient-tabs-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          background: #FFFFFF;
          padding: 10px;
          border-radius: 18px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        @media (max-width: 960px) {
          .patient-tabs-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .patient-tabs-bar {
            grid-template-columns: 1fr;
          }
        }

        .patient-portal-dashboard {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .patient-portal-dashboard {
            grid-template-columns: 1fr;
          }
        }

        .telemetry-sidebar-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          padding: 22px;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-button-modern {
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          outline: none;
          user-select: none;
          position: relative;
        }

        .tab-button-modern.active {
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border-color: #0284C7;
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.26);
        }

        .tab-button-modern.inactive {
          background: #F8FAFC;
          color: #0F172A;
          border-color: #E2E8F0;
        }

        .tab-button-modern.inactive:hover {
          background: #FFFFFF;
          border-color: #CBD5E1;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
        }

        .tab-icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .tab-button-modern.active .tab-icon-wrapper {
          background: rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
        }

        .tab-button-modern.inactive .tab-icon-wrapper {
          background: #F0F9FF;
          color: #0284C7;
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
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          flex-shrink: 0;
          margin-left: 6px;
          transition: all 0.2s ease;
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
          border-color: #0284C7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
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
          background: #F0F9FF;
          border: 1.5px solid #0284C7;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);
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
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
          transition: all 0.18s ease;
          outline: none;
          box-sizing: border-box;
          font-weight: 700;
        }

        .modern-submit-btn:hover {
          background: linear-gradient(135deg, #0369A1 0%, #0284C7 100%);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
        }

        .modern-submit-btn:active {
          transform: translateY(0);
        }
      `}</style>

      {/* 1. HERO SECTION (100% Live Real-Time Telemetry) */}
      <HeroBanner
        language={language}
        hospitalName={currentUser?.hospital_name || "City General Hospital"}
        stats={{
          patientsServed: analytics ? `${(analytics.total_completed || 0) + (analytics.currently_serving || 0)}` : "0",
          avgWaitTime: language === "hi"
            ? `${analytics ? Math.round(analytics.avg_wait_minutes || 0) : 0} मिनट`
            : `${analytics ? Math.round(analytics.avg_wait_minutes || 0) : 0} min`,
          activeDesks: language === "hi"
            ? `${analytics ? analytics.active_counters || 0 : 0} डेस्क`
            : `${analytics ? analytics.active_counters || 0 : 0} Active Desks`,
          currentlyWaiting: language === "hi"
            ? `${analytics ? analytics.currently_waiting || 0 : queueSnapshot.length || 0} प्रतीक्षारत`
            : `${analytics ? analytics.currently_waiting || 0 : queueSnapshot.length || 0} Waiting`,
        }}
      />

      {/* 2. Unified Patient Service Navigation Hub */}
      <section className="patient-nav-section">
        <div className="patient-nav-header">
          <div className="patient-nav-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M12 11h4" />
              <path d="M12 16h4" />
              <path d="M8 11h.01" />
              <path d="M8 16h.01" />
            </svg>
            <span>Hospital Patient Services & Queue Desk</span>
          </div>
          <div className="patient-nav-status-badge">
            <span className="status-dot-pulse" />
            <span>AI Orchestration Active</span>
          </div>
        </div>

        <div className="patient-tabs-bar">
          {/* Tab 1: Instant Walk-In Ticket */}
          <button
            type="button"
            onClick={() => handleTabChange("walkin")}
            className={`tab-button-modern ${activeTab === "walkin" ? "active" : "inactive"}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                <polygon points="12 8 13.2 11.4 16.8 11.4 13.9 13.5 15 16.9 12 14.8 9 16.9 10.1 13.5 7.2 11.4 10.8 11.4 12 8" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="tab-title-text">
                {t("instantWalkin", language)}
              </span>
              <span className="tab-sub-text" style={{ color: activeTab === "walkin" ? "#BAE6FD" : "#64748B" }}>
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
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2.5" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="tab-title-text">
                {t("bookSlot", language)}
              </span>
              <span className="tab-sub-text" style={{ color: activeTab === "book" ? "#BAE6FD" : "#64748B" }}>
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
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {t("myAppointments", language)}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "my_apts" ? "#38BDF8" : "#0284C7",
                    color: activeTab === "my_apts" ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  {activeAppointments.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "my_apts" ? "#BAE6FD" : "#64748B" }}>
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
            <div className="tab-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="tab-title-text">
                  {t("appointmentHistory", language)}
                </span>
                <span
                  className="tab-count-badge"
                  style={{
                    background: activeTab === "history" ? "#38BDF8" : "#0284C7",
                    color: activeTab === "history" ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  {historyAppointments.length + historyTickets.length}
                </span>
              </div>
              <span className="tab-sub-text" style={{ color: activeTab === "history" ? "#BAE6FD" : "#64748B" }}>
                {t("pastRecords", language)}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Main Content Area: Responsive Full-Page Layout */}
      {activeTab === "walkin" || activeTab === "book" ? (
        /* 2-COLUMN DASHBOARD FOR FAST CHECK-IN & BOOKING */
        <div className="patient-portal-dashboard">
          {/* Left Column: Form & Active Pass */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                        background: "#F0F9FF",
                        color: "#0284C7",
                        border: "1px solid #BAE6FD",
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

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label className="form-field-label">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {t("ageLabel", language)}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="modern-form-input"
                          />
                        </div>
                        <div>
                          <label className="form-field-label">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                            {t("genderLabel", language)}
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="modern-form-input modern-form-select"
                          >
                            <option value="male">{t("male", language)}</option>
                            <option value="female">{t("female", language)}</option>
                            <option value="other">{t("other", language)}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Service Department & Primary Medical Concern */}
                    <div className="form-grid-2col">
                      <div>
                        <label className="form-field-label">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                            <path d="M9 22v-4h6v4" />
                          </svg>
                          {t("serviceDeptLabel", language)}
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="modern-form-input modern-form-select"
                        >
                          {HOSPITAL_CONFIG.categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {getCategoryLabel(c.id, language)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-field-label">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                          </svg>
                          {t("symptomLabel", language)}
                        </label>
                        <select
                          value={medicalCondition}
                          onChange={(e) => setMedicalCondition(e.target.value)}
                          className="modern-form-input modern-form-select"
                        >
                          <option value="general_checkup">{t("symptom_general_checkup", language)}</option>
                          <option value="fever_flu">{t("symptom_fever_flu", language)}</option>
                          <option value="chest_pain_severe">{t("symptom_chest_pain_severe", language)}</option>
                          <option value="breathing_difficulty">{t("symptom_breathing_difficulty", language)}</option>
                          <option value="fracture_trauma">{t("symptom_fracture_trauma", language)}</option>
                          <option value="skin_allergy">{t("symptom_skin_allergy", language)}</option>
                          <option value="pediatric_care">{t("symptom_pediatric_care", language)}</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Pre-Existing Condition Risk */}
                    <div style={{ marginBottom: "16px" }}>
                      <label className="form-field-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        {t("preExistingLabel", language)}
                      </label>
                      <select
                        value={preExistingCondition}
                        onChange={(e) => setPreExistingCondition(e.target.value)}
                        className="modern-form-input modern-form-select"
                      >
                        <option value="none">{t("risk_none", language)}</option>
                        <option value="diabetes">{t("risk_diabetes", language)}</option>
                        <option value="hypertension">{t("risk_hypertension", language)}</option>
                        <option value="cardiac_history">{t("risk_cardiac_history", language)}</option>
                        <option value="asthma_copd">{t("risk_asthma_copd", language)}</option>
                      </select>
                    </div>

                    {/* Row 4: Priority & Triage Level Selection */}
                    <div style={{ marginBottom: "24px" }}>
                      <label className="form-field-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {t("priorityTriageLabel", language)}
                      </label>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                        {/* Routine Case Option */}
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
                              background: priority === 2 ? "#0284C7" : "transparent",
                              color: priority === 2 ? "#FFFFFF" : "#64748B",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={priority === 2 ? "3" : "2"} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "13.5px", color: priority === 2 ? "#0369A1" : "#1E293B" }}>
                              {t("routineCase", language)}
                            </div>
                            <div style={{ fontSize: "11.5px", color: priority === 2 ? "#0284C7" : "#64748B", marginTop: "2px", fontWeight: 500 }}>
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
                          <div style={{ fontSize: "11px", fontWeight: 500, color: "#BAE6FD", marginTop: "2px" }}>
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
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
                        {timeSlotOptions.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setAptTimeSlot(slot)}
                            style={{
                              padding: "10px 4px",
                              borderRadius: "8px",
                              border: aptTimeSlot === slot ? "2px solid #0284C7" : "1px solid #CBD5E1",
                              background: aptTimeSlot === slot ? "#F0F9FF" : "#F8FAFC",
                              color: aptTimeSlot === slot ? "#0284C7" : "#475569",
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
                      {t("bookSlotBtn", language)}
                    </button>
                  </form>

                  {bookedAppointment && (
                    <div style={aptConfirmationBoxStyle}>
                      <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 700, textTransform: "uppercase" }}>
                        {t("appointmentConfirmed", language)}
                      </span>
                      <h3 style={{ margin: "4px 0", color: "#0369A1", fontSize: "22px", fontWeight: 900 }}>
                        {language === "hi" ? "कोड:" : "Code:"} {bookedAppointment.appointment_id}
                      </h3>
                      <p style={{ margin: 0, color: "#475569", fontSize: "13px" }}>
                        {bookedAppointment.patient_name} • {bookedAppointment.service_category.toUpperCase()} • <strong>{bookedAppointment.appointment_date} @ {bookedAppointment.time_slot}</strong>
                      </p>

                      <div style={{ marginTop: "14px" }}>
                        <button
                          onClick={() => handleAppointmentCheckIn(bookedAppointment.appointment_id)}
                          style={checkInNowBtnStyle}
                        >
                          {t("checkInJoinLiveNow", language)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {statusMsg && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: statusMsg.toLowerCase().includes("error") || statusMsg.toLowerCase().includes("failed") ? "#FEF2F2" : "#F0F9FF",
                    border: statusMsg.toLowerCase().includes("error") || statusMsg.toLowerCase().includes("failed") ? "1px solid #FECACA" : "1px solid #BAE6FD",
                    color: statusMsg.toLowerCase().includes("error") || statusMsg.toLowerCase().includes("failed") ? "#DC2626" : "#0284C7",
                    fontSize: "13px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {statusMsg}
                </div>
              )}
            </div>

            {/* Digital Ticket Pass (if active) */}
            {activeTicket && (
              <DigitalTicketPassCard
                activeTicket={activeTicket}
                setActiveTicket={setActiveTicket}
                familyTickets={familyTickets}
                ticketQrData={ticketQrData}
                language={language}
                onPrint={() => printTokenPass(activeTicket, tenantId)}
                onOpenAdjustModal={() => {
                  setAdjustError("");
                  setAdjustSuccessMsg("");
                  setSelectedSkipCount(1);
                  setShowAdjustModal(true);
                }}
                onOpenCancelModal={() => {
                  setCancelError("");
                  setShowCancelModal(true);
                }}
              />
            )}
          </div>

          {/* Right Column: Live Telemetry Sidebar */}
          <QueueTelemetrySidebar
            analytics={analytics}
            servingTickets={servingTickets}
            queueSnapshot={queueSnapshot}
            kioskQrData={kioskQrData}
            handleTabChange={handleTabChange}
            activeTicket={activeTicket}
            language={language}
          />
        </div>
      ) : activeTab === "my_apts" ? (
        /* MY APPOINTMENTS FULL VIEW */
        <div style={standaloneCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#0F172A", fontWeight: 800 }}>
                {t("myActiveAppointments", language)}
              </h3>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                {t("activeAptsSubtitle", language)}
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                placeholder={t("enterCodePlaceholder", language)}
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px", width: "180px" }}
              />
              <button onClick={() => handleAppointmentCheckIn(checkInCode)} style={quickCheckInBtnStyle}>
                {t("checkInBtn", language)}
              </button>
            </div>
          </div>

          {/* Name lookup for guests / unmatched users */}
          <div style={{ marginBottom: "18px", padding: "14px 16px", background: "#F0F9FF", borderRadius: "12px", border: "1px solid #BAE6FD", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0284C7" }}>🔍 Look up by name:</span>
            <input
              id="apt-search-name"
              type="text"
              value={aptSearchName}
              onChange={(e) => setAptSearchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && aptSearchName.trim()) {
                  setAptSearchLoading(true);
                  fetchUserAppointments(aptSearchName.trim());
                  setTimeout(() => setAptSearchLoading(false), 800);
                }
              }}
              placeholder="Enter your full name (e.g. Alice Wonderland)"
              style={{ flex: 1, minWidth: "180px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #BAE6FD", fontSize: "13px", outline: "none" }}
            />
            <button
              id="apt-search-btn"
              type="button"
              onClick={() => {
                if (!aptSearchName.trim()) return;
                setAptSearchLoading(true);
                fetchUserAppointments(aptSearchName.trim());
                setTimeout(() => setAptSearchLoading(false), 800);
              }}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#0284C7", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {aptSearchLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {activeAppointments.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0", color: "#94A3B8" }}>
              <p style={{ margin: "0 0 6px 0", color: "#64748B", fontWeight: 600, fontSize: "14px" }}>{t("noActiveAptsMsg", language)}</p>
              <p style={{ margin: "0 0 14px 0", color: "#94A3B8", fontSize: "12px" }}>Search by your name above or reserve a new slot below.</p>
              <button
                type="button"
                onClick={() => handleTabChange("book")}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "#0284C7", color: "#FFFFFF", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
              >
                Reserve Time Slot Now
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {activeAppointments.map((apt) => (
                <div key={apt.appointment_id} style={aptCardRowStyle(apt.status)}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 900, color: "#0284C7" }}>{apt.appointment_id}</span>
                      <span style={aptStatusBadgeStyle(apt.status)}>{apt.status.toUpperCase()}</span>
                    </div>
                    <p style={{ margin: "6px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "15px" }}>
                      {apt.patient_name} — {apt.service_category.toUpperCase()}
                    </p>
                    <span style={{ fontSize: "12.5px", color: "#64748B" }}>
                      Date: <strong>{apt.appointment_date}</strong> | Slot: <strong>{apt.time_slot}</strong>
                    </span>
                  </div>

                  <div>
                    {apt.status === "scheduled" ? (
                      <button
                        onClick={() => handleAppointmentCheckIn(apt.appointment_id)}
                        style={checkInNowBtnStyle}
                      >
                        {t("checkInJoinLine", language)}
                      </button>
                    ) : (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "13px", color: "#0284C7", fontWeight: 800, display: "block" }}>
                          {t("mergedToken", language)} #{apt.ticket_id}
                        </span>
                        <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>
                          {t("activeInLiveQueue", language)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VISIT HISTORY FULL VIEW */
        <div style={standaloneCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0F172A", fontWeight: 800 }}>
                {t("appointmentHistory", language)}
              </h3>
              <span style={{ fontSize: "12.5px", color: "#64748B" }}>
                {t("historySubtitle", language)}
              </span>
            </div>
          </div>

          {/* Name lookup for guests / unmatched users */}
          <div style={{ marginBottom: "18px", padding: "14px 16px", background: "#F0F9FF", borderRadius: "12px", border: "1px solid #BAE6FD", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0284C7" }}>🔍 Look up by name:</span>
            <input
              id="history-search-name"
              type="text"
              value={aptSearchName}
              onChange={(e) => setAptSearchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && aptSearchName.trim()) {
                  setAptSearchLoading(true);
                  fetchUserAppointments(aptSearchName.trim());
                  fetchUserTicketHistory(aptSearchName.trim());
                  setTimeout(() => setAptSearchLoading(false), 1000);
                }
              }}
              placeholder="Enter your full name (e.g. Harshit Singh)"
              style={{ flex: 1, minWidth: "180px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #BAE6FD", fontSize: "13px", outline: "none" }}
            />
            <button
              id="history-search-btn"
              type="button"
              onClick={() => {
                if (!aptSearchName.trim()) return;
                setAptSearchLoading(true);
                fetchUserAppointments(aptSearchName.trim());
                fetchUserTicketHistory(aptSearchName.trim());
                setTimeout(() => setAptSearchLoading(false), 1000);
              }}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#0284C7", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {aptSearchLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {historyAppointments.length === 0 && historyTickets.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: "13.5px" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: 600, color: "#64748B" }}>{t("noHistoryMsg", language)}</p>
              <p style={{ margin: 0, fontSize: "12px" }}>Search by your name above to find past visits.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Walk-in Tickets Section */}
              {historyTickets.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.5px" }}>🎫 Walk-in Queue Tickets</span>
                    <div style={{ flex: 1, height: "1px", background: "#BAE6FD" }} />
                  </div>
                  {historyTickets.map((tk) => (
                    <div key={tk.ticket_id} style={aptCardRowStyle(tk.status)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: 900, color: "#0284C7" }}>#{tk.ticket_id}</span>
                          <span style={aptStatusBadgeStyle(tk.status)}>{getStatusLabel(tk.status || "completed", language)}</span>
                          <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, padding: "2px 7px", background: "#F1F5F9", borderRadius: "5px", border: "1px solid #E2E8F0" }}>
                            Walk-in
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "14.5px" }}>
                          {tk.name} — {getCategoryLabel(tk.service_category || "consultation", language)}
                        </p>
                        <span style={{ fontSize: "12px", color: "#64748B" }}>
                          {tk.created_at ? new Date(tk.created_at).toLocaleDateString() : ""}{" "}
                          {tk.department_name && `| Dept: ${tk.department_name}`}
                        </span>
                        {tk.cancellation_reason && (
                          <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "#DC2626", fontStyle: "italic" }}>
                            Reason: {tk.cancellation_reason}
                          </p>
                        )}
                        {tk.prescription_notes && (
                          <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "10px", background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", display: "block" }}>
                              💊 {t("ePrescriptionLabel", language)}
                            </span>
                            <span style={{ fontSize: "12.5px", color: "#0369A1", fontWeight: 600, fontStyle: "italic" }}>
                              "{tk.prescription_notes}"
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", marginLeft: "14px" }}>
                        <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>{t("finalVisitStatus", language)}</span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: tk.status === "completed" ? "#0284C7" : "#DC2626" }}>
                          {getStatusLabel(tk.status || "completed", language)}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Appointment History Section */}
              {historyAppointments.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: historyTickets.length > 0 ? "10px" : "0", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.5px" }}>📅 Pre-Scheduled Appointments</span>
                    <div style={{ flex: 1, height: "1px", background: "#BAE6FD" }} />
                  </div>
                  {historyAppointments.map((apt) => (
                    <div key={apt.appointment_id} style={aptCardRowStyle(apt.status)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 900, color: "#0284C7" }}>{apt.appointment_id}</span>
                          <span style={aptStatusBadgeStyle(apt.status)}>{getStatusLabel(apt.status || "COMPLETED", language)}</span>
                          {apt.ticket_id && (
                            <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 700 }}>
                              ({t("tokenLabel", language)} #{apt.ticket_id})
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "4px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "14.5px" }}>
                          {apt.patient_name} — {getCategoryLabel(apt.service_category || "consultation", language)}
                        </p>
                        <span style={{ fontSize: "12px", color: "#64748B" }}>
                          {t("dateLabel", language)}: {apt.appointment_date} | {t("reservedSlotLabel", language)}: {apt.time_slot}
                        </span>

                        {apt.prescription_notes && (
                          <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "10px", background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", display: "block" }}>
                              💊 {t("ePrescriptionLabel", language)}
                            </span>
                            <span style={{ fontSize: "12.5px", color: "#0369A1", fontWeight: 600, fontStyle: "italic" }}>
                              "{apt.prescription_notes}"
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right", marginLeft: "14px" }}>
                        <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>
                          {t("finalVisitStatus", language)}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: apt.status === "completed" ? "#0284C7" : "#0284C7" }}>
                          {getStatusLabel(apt.status || "completed", language)}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

            </div>
          )}
        </div>
      )}




      {/* Edit Family Member Modal */}
      {editingMember && (
        <EditFamilyMemberModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          onSaveMember={handleEditMember}
          member={editingMember}
          language={language}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && activeTicket && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FEF2F2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
                  Cancel Ticket?
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Ticket #{activeTicket.ticket_id}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: "#475569", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Are you sure you want to cancel ticket <strong>#{activeTicket.ticket_id}</strong>? This will remove you from the active queue.
            </p>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Reason (optional):
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px", marginBottom: cancelReason === "Other" ? "8px" : "0" }}
              >
                <option value="Running late">Running late</option>
                <option value="Feeling better / no longer needed">Feeling better / no longer needed</option>
                <option value="Emergency elsewhere">Emergency elsewhere</option>
                <option value="Wait time too long">Wait time too long</option>
                <option value="Other">Other reason...</option>
              </select>

              {cancelReason === "Other" && (
                <input
                  type="text"
                  placeholder="Please specify reason..."
                  value={otherCancelReason}
                  onChange={(e) => setOtherCancelReason(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                />
              )}
            </div>

            {cancelError && (
              <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12.5px", marginBottom: "16px", fontWeight: 600 }}>
                {cancelError}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #CBD5E1", background: "#F8FAFC", color: "#334155", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                Keep Ticket
              </button>
              <button
                id="confirm-cancel-btn"
                type="button"
                onClick={handleCancelTicket}
                disabled={cancelLoading}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#DC2626", color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: cancelLoading ? "not-allowed" : "pointer" }}
              >
                {cancelLoading ? "Cancelling..." : "Cancel Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Queue Modal */}
      {showAdjustModal && activeTicket && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#F0F9FF", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                ⏱️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
                  Running late?
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Move your position back in the queue.
                </span>
              </div>
            </div>

            <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12.5px", color: "#64748B" }}>Ticket:</span>
                <strong style={{ fontSize: "13px", color: "#0F172A" }}>#{activeTicket.ticket_id}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "12.5px", color: "#64748B" }}>Current Position:</span>
                <strong style={{ fontSize: "15px", color: "#0284C7" }}>#{activeTicket.position}</strong>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                Move back:
              </label>
              {(() => {
                const rem = Math.max(0, 3 - (activeTicket.adjustment_count || 0));
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {[1, 2, 3].map((num) => {
                      const isDisabled = num > rem;
                      const isSelected = selectedSkipCount === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedSkipCount(num)}
                          style={{
                            padding: "12px 6px",
                            borderRadius: "10px",
                            border: isSelected ? "2px solid #0284C7" : "1px solid #CBD5E1",
                            background: isSelected ? "#F0F9FF" : isDisabled ? "#F1F5F9" : "#FFFFFF",
                            color: isSelected ? "#0284C7" : isDisabled ? "#94A3B8" : "#0F172A",
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: "12.5px",
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {num} {num === 1 ? "person" : "people"}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", fontSize: "12px", color: "#64748B", background: "#F8FAFC", padding: "8px 12px", borderRadius: "8px" }}>
              <span>Remaining adjustment:</span>
              <strong style={{ color: "#0369A1", fontSize: "13px" }}>
                {Math.max(0, 3 - (activeTicket.adjustment_count || 0))} of 3
              </strong>
            </div>

            {adjustError && (
              <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12.5px", marginBottom: "16px", fontWeight: 600 }}>
                {adjustError}
              </div>
            )}

            {adjustSuccessMsg && (
              <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0284C7", fontSize: "12.5px", marginBottom: "16px", fontWeight: 700, textAlign: "center" }}>
                ✓ {adjustSuccessMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                disabled={adjustLoading}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #CBD5E1", background: "#F8FAFC", color: "#334155", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                id="confirm-adjust-btn"
                type="button"
                onClick={() => handleAdjustQueue(selectedSkipCount)}
                disabled={adjustLoading || (activeTicket.adjustment_count || 0) >= 3}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)", color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: adjustLoading ? "not-allowed" : "pointer" }}
              >
                {adjustLoading ? "Adjusting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Footer (Matching Image 2) */}
      <Footer language={language} />
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
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#ffffff",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
  transition: "all 0.2s ease",
};

const aptConfirmationBoxStyle = {
  marginTop: "20px",
  padding: "18px",
  borderRadius: "14px",
  background: "#F0F9FF",
  border: "2px solid #0284C7",
  textAlign: "center",
};

const checkInNowBtnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
};

const quickCheckInBtnStyle = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#0284C7",
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
      background: "#F0F9FF",
      borderRadius: "12px",
      border: "1px solid #BAE6FD",
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
  if (s === "checked_in") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#F0F9FF", color: "#0284C7", border: "1px solid #BAE6FD" };
  if (s === "cancelled" || s === "no_show" || s === "expired") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" };
  return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#F3E8FF", color: "#7E22CE", border: "1px solid #E9D5FF" };
};

const passStatusBadgeStyle = (status) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  background: status === "serving" ? "#F0F9FF" : "#FEF3C7",
  color: status === "serving" ? "#0284C7" : "#D97706",
  border: status === "serving" ? "1px solid #BAE6FD" : "1px solid #FDE68A",
});

const dashboardFooterStyle = {
  marginTop: "36px",
  paddingTop: "20px",
  borderTop: "1px solid #E2E8F0",
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
  background: "#0284C7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/**
 * QueueTelemetrySidebar
 * ---------------------
 * Real-time queue status sidebar on wide desktop screens.
 */
function QueueTelemetrySidebar({
  analytics,
  servingTickets = [],
  queueSnapshot = [],
  kioskQrData,
  handleTabChange,
  activeTicket,
  language = "en",
}) {
  const primaryServing = servingTickets.length > 0 ? servingTickets[0] : null;

  return (
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
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7", background: "#F0F9FF", padding: "2px 8px", borderRadius: "6px" }}>
            {analytics ? `${analytics.active_counters} ${language === "hi" ? "डेस्क सक्रिय" : "Desks Active"}` : (language === "hi" ? "2 डेस्क सक्रिय" : "2 Desks Active")}
          </span>
        </div>

        {/* Now Serving Highlight */}
        <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 70%, #0C4A6E 100%)", borderRadius: "14px", padding: "16px", color: "#FFFFFF" }}>
          <div style={{ fontSize: "11px", color: "#38BDF8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
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

        {/* Live Wait Stats */}
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

      {/* 2. Next in Line Preview */}
      {queueSnapshot.length > 0 && (
        <div className="telemetry-sidebar-card" style={{ padding: "18px" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>📋</span> {language === "hi" ? "कतार में अगले टोकन" : "Next Up in Queue"}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
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

      {/* 3. Hospital Helpline Card */}
      <div className="telemetry-sidebar-card" style={{ background: "#FEF2F2", borderColor: "#FECACA", padding: "18px" }}>
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
  );
}

/**
 * DigitalTicketPassCard
 * ---------------------
 * Printable digital pass card with QR code, patient triage tags, and queue position.
 */
function DigitalTicketPassCard({
  activeTicket,
  setActiveTicket,
  familyTickets = {},
  ticketQrData,
  language = "en",
  onPrint,
  onOpenAdjustModal,
  onOpenCancelModal,
}) {
  return (
    <div style={{ ...standaloneCardStyle, border: "2px solid #0284C7" }}>
      {/* Active Family Pass Switcher */}
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
                  onClick={() => setActiveTicket(tick)}
                  style={{
                    padding: "3px 9px",
                    borderRadius: "6px",
                    border: isCurrent ? "1.5px solid #0284C7" : "1px solid #CBD5E1",
                    background: isCurrent ? "#0284C7" : "#FFFFFF",
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E0F2FE", paddingBottom: "14px", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>{t("livePassTitle", language)}</span>
            {activeTicket.name && (
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" }}>
                👤 {activeTicket.name}
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: "32px", color: "#0284C7", fontWeight: 800 }}>
            #{activeTicket.ticket_id}
          </h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>{t("currentStatus", language)}</span>
          <span style={passStatusBadgeStyle(activeTicket.status)}>{getStatusLabel(activeTicket.status, language)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "#64748B" }}>{t("patientDemographics", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "15px", wordBreak: "break-word" }}>
            {activeTicket.name} ({activeTicket.age || 30} {language === "hi" ? "वर्ष" : "yrs"}, {t(activeTicket.gender || "male", language)})
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "#64748B" }}>{t("deptCategory", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#0284C7", fontWeight: 700, fontSize: "15px", wordBreak: "break-word" }}>
            {getCategoryLabel(activeTicket.service_category || "consultation", language)}
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "#64748B" }}>{t("pos", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#D97706", fontWeight: 800, fontSize: "24px" }}>
            #{activeTicket.position}
          </p>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "11px", color: "#64748B" }}>{t("estWait", language)}</span>
          <p style={{ margin: "2px 0 0 0", color: "#0284C7", fontWeight: 800, fontSize: "24px" }}>
            {activeTicket.estimated_wait_minutes} {language === "hi" ? "मिनट" : "min"}
          </p>
        </div>
      </div>

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
              border: (activeTicket.adjustment_count || 0) >= 3 ? "1px solid #E2E8F0" : "1.5px solid #0284C7",
              background: (activeTicket.adjustment_count || 0) >= 3 ? "#F1F5F9" : "#F0F9FF",
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
            <span>⏱️</span>
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
              border: "1.5px solid #FECACA",
              background: "#FEF2F2",
              color: "#DC2626",
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
            <span>✕</span>
            <span>{language === "hi" ? "टोकन रद्द करें" : "Cancel Ticket"}</span>
          </button>
        </div>
      )}

      {ticketQrData && (
        <div style={{ textAlign: "center", borderTop: "1px solid #E0F2FE", paddingTop: "18px" }}>
          <img
            src={ticketQrData.qr_code_base64}
            alt="Ticket QR Code"
            style={{ width: "130px", height: "130px", borderRadius: "12px", background: "#fff", padding: "6px", border: "1px solid #CBD5E1" }}
          />
          <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#64748B" }}>
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
            background: "#F0F9FF",
            color: "#0284C7",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🖨️</span>
          <span>{t("printPassBtn", language)}</span>
        </button>
      </div>
    </div>
  );
}

const modalBackdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.65)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: "16px",
};

const modalContentStyle = {
  background: "#FFFFFF",
  borderRadius: "20px",
  maxWidth: "440px",
  width: "100%",
  padding: "26px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  border: "1px solid #E2E8F0",
  boxSizing: "border-box",
};

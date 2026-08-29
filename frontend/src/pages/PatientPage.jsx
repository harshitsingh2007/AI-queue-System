/**
 * PatientPage.jsx
 * ---------------
 * Patient Self-Checkin & Pre-scheduled Appointment Booking Kiosk.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 * Professional Healthcare Vector Styling.
 */

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE, HOSPITAL_CONFIG } from "../config/hospitalConfig";
import { t } from "../utils/i18n";

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
}) {
  const [activeTab, setActiveTab] = useState("walkin"); // 'walkin' | 'book' | 'my_apts'
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
        setActiveTicket(t);
        setStatusMsg(`Ticket #${t.ticket_id} Issued. AI Service Estimate: ${t.predicted_service_minutes} min.`);

        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${t.ticket_id}`)
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
        setActiveTicket(t);
        setStatusMsg(`Appointment Checked In. Merged into Priority Line as Token #${t.ticket_id}`);

        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${t.ticket_id}`)
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

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      {/* Top Header Mode Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", background: "#FFFFFF", padding: "6px", borderRadius: "14px", border: "1px solid #D8E8DD", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <button
          type="button"
          onClick={() => setActiveTab("walkin")}
          style={tabBtnStyle(activeTab === "walkin")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><line x1="13" y1="5" x2="13" y2="19"/></svg>
          {t("instantWalkin", language)}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("book")}
          style={tabBtnStyle(activeTab === "book")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {t("bookSlot", language)}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("my_apts")}
          style={tabBtnStyle(activeTab === "my_apts")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          {t("myAppointments", language)} ({activeAppointments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          style={tabBtnStyle(activeTab === "history")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {t("appointmentHistory", language)} ({historyAppointments.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <div style={standaloneCardStyle}>
        {activeTab === "walkin" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={headerIconContainerStyle}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
                  <line x1="13" y1="5" x2="13" y2="19"/>
                </svg>
              </div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#064E3B", fontWeight: 800 }}>
                {t("instantWalkin", language)}
              </h2>
              <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                City General Hospital — Instant Ticket Token & Real-Time Wait Tracker
              </p>
            </div>

            <form onSubmit={handleJoinQueue}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={fieldLabelStyle}>{t("patientNameLabel", language)}</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Verma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={fieldInputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>{t("patientAgeGenderLabel", language)}</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <input
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      min="1"
                      max="120"
                      style={fieldInputStyle}
                    />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      style={fieldInputStyle}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={fieldLabelStyle}>{t("medicalDeptLabel", language)}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={fieldInputStyle}
                  >
                    {HOSPITAL_CONFIG.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>{t("primarySymptomLabel", language)}</label>
                  <select
                    value={medicalCondition}
                    onChange={(e) => setMedicalCondition(e.target.value)}
                    style={fieldInputStyle}
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

              <div style={{ marginBottom: "16px" }}>
                <label style={fieldLabelStyle}>{t("preExistingLabel", language)}</label>
                <select
                  value={preExistingCondition}
                  onChange={(e) => setPreExistingCondition(e.target.value)}
                  style={fieldInputStyle}
                >
                  <option value="none">{t("riskNone", language)}</option>
                  <option value="diabetes">{t("riskDiabetes", language)}</option>
                  <option value="hypertension">{t("riskBP", language)}</option>
                  <option value="cardiovascular">{t("riskHeart", language)}</option>
                  <option value="asthma">{t("riskLung", language)}</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={fieldLabelStyle}>{t("urgencyLabel", language)}</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setPriority(2)}
                    style={triageBtnStyle(priority === 2, "#047857")}
                  >
                    {t("routineCheckup", language)}
                    <span style={{ display: "block", fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>{t("standardOrder", language)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority(1)}
                    style={triageBtnStyle(priority === 1, "#DC2626")}
                  >
                    {t("emergencyCase", language)}
                    <span style={{ display: "block", fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>{t("priorityJump", language)}</span>
                  </button>
                </div>
              </div>

              <button type="submit" style={patientSubmitBtnStyle}>
                {t("getTicketBtn", language)}
              </button>
            </form>
          </div>
        )}

        {activeTab === "book" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={headerIconContainerStyle}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#064E3B", fontWeight: 800 }}>
                Book Pre-Scheduled Time Slot
              </h2>
              <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                Reserve a future appointment slot. Scan code upon arrival to merge into priority queue line.
              </p>
            </div>

            <form onSubmit={handleBookSlot}>
              <div style={{ marginBottom: "16px" }}>
                <label style={fieldLabelStyle}>Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={fieldInputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={fieldLabelStyle}>Department</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={fieldInputStyle}
                  >
                    {HOSPITAL_CONFIG.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={fieldLabelStyle}>Appointment Date</label>
                  <input
                    type="date"
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    required
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={fieldLabelStyle}>Select Available Time Slot</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                  {timeSlotOptions.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAptTimeSlot(slot)}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "8px",
                        border: aptTimeSlot === slot ? "2px solid #059669" : "1px solid #CBD5E1",
                        background: aptTimeSlot === slot ? "#ECFDF5" : "#F8FAFC",
                        color: aptTimeSlot === slot ? "#047857" : "#475569",
                        fontWeight: 700,
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" style={patientSubmitBtnStyle}>
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
                  style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px", width: "160px" }}
                />
                <button onClick={() => handleAppointmentCheckIn(checkInCode)} style={quickCheckInBtnStyle}>
                  Check In
                </button>
              </div>
            </div>

            {activeAppointments.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #CBD5E1", color: "#94A3B8", fontSize: "13px" }}>
                <p style={{ margin: "0 0 10px 0" }}>No active or upcoming appointments found.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("book")}
                  style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#047857", color: "#FFFFFF", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
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
              <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #CBD5E1", color: "#94A3B8", fontSize: "13px" }}>
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

      {/* Digital Ticket Pass */}
      {activeTicket && (
        <div style={{ ...standaloneCardStyle, marginTop: "24px", border: "2px solid #059669" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #D8E8DD", paddingBottom: "14px", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>{t("livePassTitle", language)}</span>
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
    </div>
  );
}

// Soft Green Clinical Theme Styles
const headerIconContainerStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "12px",
};

const tabBtnStyle = (active) => ({
  flex: 1,
  padding: "10px 12px",
  borderRadius: "10px",
  border: "none",
  background: active ? "#059669" : "transparent",
  color: active ? "#ffffff" : "#64748B",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
});

const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "24px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const fieldLabelStyle = { display: "block", fontSize: "12px", color: "#475569", marginBottom: "6px", fontWeight: 600 };

const fieldInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#0F172A",
  fontSize: "13px",
};

const triageBtnStyle = (active, accent) => ({
  padding: "12px",
  borderRadius: "10px",
  border: active ? `2px solid ${accent}` : "1px solid #CBD5E1",
  background: active ? (accent === "#047857" ? "#ECFDF5" : "#FEF2F2") : "#F8FAFC",
  color: active ? accent : "#64748B",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
});

const patientSubmitBtnStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
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
  padding: "6px 12px",
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

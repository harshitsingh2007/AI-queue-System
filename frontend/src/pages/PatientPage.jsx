/**
 * PatientPage.jsx
 * ---------------
 * 📱 Patient Self-Checkin & Pre-scheduled Appointment Booking Kiosk.
 * Features Hybrid Queueing: Slot Booking + Instant Priority QR Check-in Merge!
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE, HOSPITAL_CONFIG } from "../config/hospitalConfig";

export default function PatientPage({
  tenantId,
  currentUser,
  activeTicket,
  setActiveTicket,
  ticketQrData,
  setTicketQrData,
  refreshData,
}) {
  const [activeTab, setActiveTab] = useState("walkin"); // 'walkin' | 'book' | 'my_apts'
  const [name, setName] = useState(currentUser ? currentUser.username : "");
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
    if (currentUser) setName(currentUser.username);
    fetchUserAppointments();
  }, [currentUser, fetchUserAppointments]);

  // 1. Instant Walk-In Ticket Checkin
  const handleJoinQueue = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStatusMsg("Issuing your AI priority ticket...");

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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const t = data.ticket;
        setActiveTicket(t);
        setStatusMsg(`✓ Ticket #${t.ticket_id} Issued Successfully!`);

        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${t.ticket_id}`)
          .then((r) => r.json())
          .then((qr) => setTicketQrData(qr))
          .catch((e) => console.log("QR error:", e));

        refreshData();
      } else {
        const err = await res.json();
        setStatusMsg(`❌ Error: ${err.detail}`);
      }
    } catch (err) {
      setStatusMsg(`❌ Join failed: ${err.message}`);
    }
  };

  // 2. Book Pre-scheduled Slot
  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStatusMsg("Reserving your hospital appointment slot...");

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
        setStatusMsg(`🎉 Appointment Reserved! Code: ${data.appointment.appointment_id}`);
        fetchUserAppointments();
      } else {
        setStatusMsg(`❌ Booking failed: ${data.detail}`);
      }
    } catch (err) {
      setStatusMsg(`❌ Booking failed: ${err.message}`);
    }
  };

  // 3. Hybrid Merge Check-In (Converts Scheduled Appointment -> Live Priority Queue Ticket)
  const handleAppointmentCheckIn = async (aptId) => {
    const targetId = aptId || checkInCode;
    if (!targetId.trim()) return;

    setStatusMsg(`Merging Appointment ${targetId} into Live Priority Queue...`);

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
        setStatusMsg(`✓ Appointment Checked In! Merged into Priority Line as Token #${t.ticket_id}`);

        fetch(`${API_BASE}/api/v1/plugin/ticket-qr/${t.ticket_id}`)
          .then((r) => r.json())
          .then((qr) => setTicketQrData(qr))
          .catch((e) => console.log("QR error:", e));

        fetchUserAppointments();
        refreshData();
      } else {
        setStatusMsg(`❌ Check-in error: ${data.detail}`);
      }
    } catch (err) {
      setStatusMsg(`❌ Check-in error: ${err.message}`);
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
          🎫 Instant Walk-In Ticket
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("book")}
          style={tabBtnStyle(activeTab === "book")}
        >
          🗓️ Book Time Slot
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("my_apts")}
          style={tabBtnStyle(activeTab === "my_apts")}
        >
          📋 My Appointments ({userAppointments.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <div style={standaloneCardStyle}>
        {activeTab === "walkin" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <span style={{ fontSize: "38px", display: "block", marginBottom: "6px" }}>🎫</span>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#064E3B", fontWeight: 800 }}>
                Instant Walk-In Patient Token
              </h2>
              <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                City General Hospital — Instant Ticket Token & Real-Time Wait Countdown
              </p>
            </div>

            <form onSubmit={handleJoinQueue}>
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

              <div style={{ marginBottom: "16px" }}>
                <label style={fieldLabelStyle}>Medical Department</label>
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

              <div style={{ marginBottom: "20px" }}>
                <label style={fieldLabelStyle}>Urgency / Triage Level</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setPriority(2)}
                    style={triageBtnStyle(priority === 2, "#047857")}
                  >
                    📋 Routine Checkup
                    <span style={{ display: "block", fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>Standard Queue Order</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority(1)}
                    style={triageBtnStyle(priority === 1, "#DC2626")}
                  >
                    🚨 Emergency Case
                    <span style={{ display: "block", fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>Priority Queue Jump</span>
                  </button>
                </div>
              </div>

              <button type="submit" style={patientSubmitBtnStyle}>
                🎫 Get Digital Walk-In Ticket
              </button>
            </form>
          </div>
        )}

        {activeTab === "book" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <span style={{ fontSize: "38px", display: "block", marginBottom: "6px" }}>🗓️</span>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#064E3B", fontWeight: 800 }}>
                Book Pre-Scheduled Time Slot
              </h2>
              <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                Reserve a future appointment slot. Scan code upon arrival to merge into priority queue line!
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
                📅 Reserve Appointment Slot
              </button>
            </form>

            {bookedAppointment && (
              <div style={aptConfirmationBoxStyle}>
                <span style={{ fontSize: "11px", color: "#047857", fontWeight: 700, textTransform: "uppercase" }}>
                  ✓ APPOINTMENT CONFIRMED
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
                    🚀 I'm at Hospital! Check In & Join Live Line Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "my_apts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#064E3B", fontWeight: 800 }}>
                📋 My Scheduled Appointments
              </h3>
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

            {userAppointments.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #CBD5E1", color: "#94A3B8", fontSize: "13px" }}>
                No scheduled appointments found. Click "Book Time Slot" above.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {userAppointments.map((apt) => (
                  <div key={apt.appointment_id} style={aptCardRowStyle(apt.status)}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 900, color: "#047857" }}>{apt.appointment_id}</span>
                        <span style={aptStatusBadgeStyle(apt.status)}>{apt.status.toUpperCase()}</span>
                      </div>
                      <p style={{ margin: "4px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "14px" }}>
                        {apt.patient_name} — {apt.service_category.toUpperCase()}
                      </p>
                      <span style={{ fontSize: "12px", color: "#64748B" }}>
                        📅 {apt.appointment_date} at ⏰ {apt.time_slot}
                      </span>
                    </div>

                    <div>
                      {apt.status === "scheduled" ? (
                        <button
                          onClick={() => handleAppointmentCheckIn(apt.appointment_id)}
                          style={checkInNowBtnStyle}
                        >
                          🟢 Check In & Join Line
                        </button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#047857", fontWeight: 700 }}>
                          ✓ Merged (Token #{apt.ticket_id})
                        </span>
                      )}
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
              <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase" }}>Your Live Queue Token</span>
              <h2 style={{ margin: 0, fontSize: "32px", color: "#047857", fontWeight: 800 }}>
                #{activeTicket.ticket_id}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Current Status</span>
              <span style={passStatusBadgeStyle(activeTicket.status)}>{activeTicket.status.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Patient Name</span>
              <p style={{ margin: "2px 0 0 0", color: "#0F172A", fontWeight: 700, fontSize: "15px" }}>{activeTicket.name}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Department</span>
              <p style={{ margin: "2px 0 0 0", color: "#047857", fontWeight: 700, fontSize: "15px" }}>{activeTicket.service_category.toUpperCase()}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Queue Position</span>
              <p style={{ margin: "2px 0 0 0", color: "#D97706", fontWeight: 800, fontSize: "24px" }}>
                #{activeTicket.position}
              </p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Estimated Wait</span>
              <p style={{ margin: "2px 0 0 0", color: "#059669", fontWeight: 800, fontSize: "24px" }}>
                {activeTicket.estimated_wait_minutes} min
              </p>
            </div>
          </div>

          {ticketQrData && (
            <div style={{ textAlign: "center", borderTop: "1px solid #D8E8DD", paddingTop: "18px" }}>
              <img
                src={ticketQrData.qr_code_base64}
                alt="Ticket QR Code"
                style={{ width: "150px", height: "150px", borderRadius: "12px", background: "#fff", padding: "8px", border: "1px solid #CBD5E1" }}
              />
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#64748B" }}>
                Scan code at doctor desk scanner when your ticket number is called
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Soft Green Clinical Theme Styles
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

const aptCardRowStyle = (status) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px",
  background: status === "checked_in" ? "#ECFDF5" : "#F8FAFC",
  borderRadius: "12px",
  border: status === "checked_in" ? "1px solid #A7F3D0" : "1px solid #CBD5E1",
});

const aptStatusBadgeStyle = (status) => ({
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: 800,
  background: status === "checked_in" ? "#ECFDF5" : "#FEF3C7",
  color: status === "checked_in" ? "#047857" : "#D97706",
  border: status === "checked_in" ? "1px solid #A7F3D0" : "1px solid #FDE68A",
});

const passStatusBadgeStyle = (status) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  background: status === "serving" ? "#ECFDF5" : "#FEF3C7",
  color: status === "serving" ? "#047857" : "#D97706",
  border: status === "serving" ? "1px solid #A7F3D0" : "1px solid #FDE68A",
});

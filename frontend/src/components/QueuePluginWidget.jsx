/**
 * QueuePluginWidget.jsx
 * ----------------------
 * Embeddable, self-contained AI Smart Queue React Widget.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

// Sound Generator using Web Audio API (no external asset needed)
function playTurnChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.log("Audio play blocked by browser policy:", e);
  }
}

export default function QueuePluginWidget({
  tenantId = "city-hospital-01",
  consumerType = "hospital",
  defaultCategories = ["consultation", "pharmacy", "emergency"],
  apiBaseUrl = "http://127.0.0.1:8000",
  wsUrl = "http://127.0.0.1:8000",
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategories[0] || "");
  const [urgency, setUrgency] = useState("routine");
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const socketRef = useRef(null);
  const lastPositionRef = useRef(null);

  // ---- Fetch QR Code for Tenant ----
  const fetchQrCode = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/plugin/qr/${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setQrCodeUrl(data.qr_code_base64);
      }
    } catch (err) {
      console.log("Failed to fetch QR code:", err);
    }
  }, [apiBaseUrl, tenantId]);

  useEffect(() => {
    fetchQrCode();
  }, [fetchQrCode]);

  // ---- Socket.IO Connection ----
  useEffect(() => {
    const socket = io(wsUrl, {
      auth: { tenant_id: tenantId },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("ticket_created", (data) => {
      setTicket(data.ticket);
      setSecondsLeft(Math.round(data.ticket.estimated_wait_minutes * 60));
    });

    socket.on("queue_update", ({ snapshot }) => {
      setTicket((current) => {
        if (!current) return null;
        const mine = snapshot.find((t) => t.ticket_id === current.ticket_id);
        if (mine) {
          if (
            audioEnabled &&
            mine.position <= 2 &&
            lastPositionRef.current !== null &&
            lastPositionRef.current > mine.position
          ) {
            playTurnChime();
          }
          lastPositionRef.current = mine.position;
          setSecondsLeft(Math.round(mine.estimated_wait_minutes * 60));
          return mine;
        }
        return { ...current, status: "completed" };
      });
    });

    socket.on("turn_alert", ({ tickets }) => {
      if (ticket && audioEnabled) {
        const isMine = tickets.some((t) => t.ticket_id === ticket.ticket_id);
        if (isMine) playTurnChime();
      }
    });

    socket.on("error", (data) => setError(data.message));

    return () => socket.disconnect();
  }, [tenantId, wsUrl, audioEnabled, ticket]);

  // Countdown timer effect
  useEffect(() => {
    if (!ticket || ticket.status !== "waiting" || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [ticket, secondsLeft]);

  const handleJoin = useCallback(
    (e) => {
      e.preventDefault();
      if (!name.trim() || !category) {
        setError("Please enter your name and select a service.");
        return;
      }
      setError(null);
      socketRef.current.emit("join_queue", {
        tenant_id: tenantId,
        consumer_type: consumerType,
        service_category: category,
        name: name.trim(),
        urgency: consumerType === "hospital" ? urgency : undefined,
      });
    },
    [name, category, urgency, tenantId, consumerType]
  );

  const handleCancel = useCallback(() => {
    if (!ticket) return;
    fetch(`${apiBaseUrl}/api/v1/plugin/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, ticket_id: ticket.ticket_id }),
    });
    setTicket(null);
  }, [apiBaseUrl, tenantId, ticket]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          padding: "12px 20px",
          borderRadius: "30px",
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          color: "#ffffff",
          fontWeight: 700,
          border: "none",
          boxShadow: "0 10px 25px rgba(5, 150, 105, 0.4)",
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
        }}
      >
        <span>👥 Join Queue</span>
        {ticket && <span style={{ background: "#10B981", padding: "2px 8px", borderRadius: "10px", fontSize: 11 }}>Live</span>}
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "350px",
        background: "#FFFFFF",
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px #D8E8DD",
        color: "#0F172A",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflow: "hidden",
        zIndex: 9999,
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          background: "#ECFDF5",
          borderBottom: "1px solid #A7F3D0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#059669",
              boxShadow: "0 0 10px #059669",
            }}
          />
          <strong style={{ fontSize: "15px", fontWeight: 700, color: "#047857" }}>AI Smart Queue</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {qrCodeUrl && (
            <button
              onClick={() => setShowQrModal(true)}
              title="Show Mobile QR Code"
              style={{ background: "none", border: "none", color: "#047857", cursor: "pointer", fontSize: "16px" }}
            >
              📱
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "18px" }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>
        {ticket ? (
          <div>
            {ticket.status === "serving" || ticket.status === "completed" ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 16px",
                  background: "#ECFDF5",
                  borderRadius: "14px",
                  border: "1px solid #A7F3D0",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>🎉</div>
                <h3 style={{ color: "#047857", fontSize: "18px", marginBottom: "6px", fontWeight: 800 }}>
                  {ticket.status === "serving" ? "You're Being Served Now!" : "Service Completed!"}
                </h3>
                <p style={{ color: "#64748B", fontSize: "13px" }}>
                  Ticket #{ticket.ticket_id} • {ticket.name}
                </p>
                <button
                  onClick={() => setTicket(null)}
                  style={{
                    marginTop: "16px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#047857",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Done / Close
                </button>
              </div>
            ) : (
              <div>
                {/* Status Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Ticket #{ticket.ticket_id}</span>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: ticket.priority_level === 1 ? "#FEF2F2" : "#ECFDF5",
                      color: ticket.priority_level === 1 ? "#DC2626" : "#047857",
                      border: ticket.priority_level === 1 ? "1px solid #FECACA" : "1px solid #A7F3D0",
                    }}
                  >
                    {ticket.priority_level === 1 ? "🚨 EMERGENCY" : "⚡ ROUTINE"}
                  </span>
                </div>

                {/* Main Position Card */}
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 10px",
                    background: "#F8FAFC",
                    borderRadius: "14px",
                    border: "1px solid #CBD5E1",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "44px", fontWeight: 800, color: "#047857", lineHeight: 1 }}>
                    #{ticket.position}
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                    people ahead in {ticket.service_category}
                  </div>
                </div>

                {/* Estimated Wait Countdown */}
                <div
                  style={{
                    padding: "14px 16px",
                    background: "#ECFDF5",
                    borderRadius: "12px",
                    border: "1px solid #A7F3D0",
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: "#047857", fontWeight: 600 }}>Estimated Wait Time</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#064E3B" }}>
                      {mins}m {secs < 10 ? `0${secs}` : secs}s
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>AI Model Predicted</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#047857" }}>
                      ~{ticket.predicted_service_minutes} min/ticket
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="checkbox"
                      checked={audioEnabled}
                      onChange={(e) => setAudioEnabled(e.target.checked)}
                    />
                    🔊 Audio Chime
                  </label>
                  <button
                    onClick={handleCancel}
                    style={{
                      background: "none",
                      border: "1px solid #FECACA",
                      color: "#DC2626",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Cancel Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Check-in Form */
          <form onSubmit={handleJoin}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#475569", marginBottom: "6px", fontWeight: 600 }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                  color: "#0F172A",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#475569", marginBottom: "6px", fontWeight: 600 }}>
                Service Line
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                  color: "#0F172A",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                {defaultCategories.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {consumerType === "hospital" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#475569", marginBottom: "6px", fontWeight: 600 }}>
                  Urgency Priority
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    background: "#F8FAFC",
                    color: "#0F172A",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="routine">Routine Check (Standard Queue)</option>
                  <option value="emergency">Emergency Case (Priority Jumping)</option>
                </select>
              </div>
            )}

            {error && <p style={{ color: "#DC2626", fontSize: "12px", marginBottom: "12px", fontWeight: 600 }}>{error}</p>}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(5, 150, 105, 0.3)",
              }}
            >
              Get Digital Ticket 🎟️
            </button>
          </form>
        )}
      </div>

      {/* QR Code Modal Popup */}
      {showQrModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              padding: "24px",
              borderRadius: "20px",
              textAlign: "center",
              maxWidth: "280px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              border: "1px solid #D8E8DD",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ color: "#064E3B", marginBottom: "8px", fontWeight: 800 }}>Scan Mobile Ticket</h4>
            <p style={{ color: "#64748B", fontSize: "12px", marginBottom: "16px" }}>
              Scan this QR code to track your queue status on your mobile phone.
            </p>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" style={{ width: "180px", height: "180px", borderRadius: "12px", border: "1px solid #CBD5E1" }} />
            ) : (
              <p style={{ color: "#64748B" }}>Loading QR...</p>
            )}
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                marginTop: "16px",
                padding: "8px 20px",
                borderRadius: "10px",
                border: "none",
                background: "#047857",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

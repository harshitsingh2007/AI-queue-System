/**
 * QueuePluginWidget.jsx
 * ----------------------
 * Embeddable, self-contained AI Smart Queue React Widget.
 * Features:
 * - Floating glassmorphism design with minimize/expand state
 * - Real-time Socket.IO live position and wait-time updates
 * - Web Audio API turn chime notification sound when position reaches #1 or #2
 * - Base64 Mobile QR Code modal scanner view
 * - Urgency priority badges & service category selectors
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
  apiBaseUrl = "http://localhost:8000",
  wsUrl = "http://localhost:8000",
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
          // Play chime if user moved to position #1 or #2
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
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          color: "#ffffff",
          fontWeight: 700,
          border: "none",
          boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
        }}
      >
        <span>⚡ Join Queue</span>
        {ticket && <span style={{ background: "#22c55e", padding: "2px 8px", borderRadius: "10px", fontSize: 11 }}>Live</span>}
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
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(16px)",
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        color: "#f8fafc",
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
          background: "rgba(30, 41, 59, 0.8)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
              background: "#22c55e",
              boxShadow: "0 0 10px #22c55e",
            }}
          />
          <strong style={{ fontSize: "15px", fontWeight: 700 }}>AI Smart Queue</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {qrCodeUrl && (
            <button
              onClick={() => setShowQrModal(true)}
              title="Show Mobile QR Code"
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}
            >
              📱
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
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
                  background: "rgba(34, 197, 94, 0.1)",
                  borderRadius: "14px",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>🎉</div>
                <h3 style={{ color: "#4ade80", fontSize: "18px", marginBottom: "6px" }}>
                  {ticket.status === "serving" ? "You're Being Served Now!" : "Service Completed!"}
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                  Ticket #{ticket.ticket_id} • {ticket.name}
                </p>
                <button
                  onClick={() => setTicket(null)}
                  style={{
                    marginTop: "16px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#334155",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Done / Close
                </button>
              </div>
            ) : (
              <div>
                {/* Status Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Ticket #{ticket.ticket_id}</span>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: ticket.priority_level === 1 ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                      color: ticket.priority_level === 1 ? "#f87171" : "#60a5fa",
                      border: ticket.priority_level === 1 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(59, 130, 246, 0.4)",
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
                    background: "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "44px", fontWeight: 800, color: "#38bdf8", lineHeight: 1 }}>
                    #{ticket.position}
                  </div>
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                    people ahead in {ticket.service_category}
                  </div>
                </div>

                {/* Estimated Wait Countdown */}
                <div
                  style={{
                    padding: "14px 16px",
                    background: "rgba(59, 130, 246, 0.1)",
                    borderRadius: "12px",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: "#93c5fd" }}>Estimated Wait Time</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#60a5fa" }}>
                      {mins}m {secs < 10 ? `0${secs}` : secs}s
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>AI Model Predicted</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1" }}>
                      ~{ticket.predicted_service_minutes} min/ticket
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
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
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      color: "#f87171",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
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
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
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
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(30, 41, 59, 0.6)",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                Service Line
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(30, 41, 59, 0.9)",
                  color: "#fff",
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
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                  Urgency Priority
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(30, 41, 59, 0.9)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="routine">Routine Check (Standard Queue)</option>
                  <option value="emergency">Emergency Case (Priority Jumping)</option>
                </select>
              </div>
            )}

            {error && <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)",
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
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              background: "#1e293b",
              padding: "24px",
              borderRadius: "20px",
              textAlign: "center",
              maxWidth: "280px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ color: "#f8fafc", marginBottom: "8px" }}>Scan Mobile Ticket</h4>
            <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "16px" }}>
              Scan this QR code to track your queue status on your mobile phone.
            </p>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" style={{ width: "180px", height: "180px", borderRadius: "12px" }} />
            ) : (
              <p>Loading QR...</p>
            )}
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                marginTop: "16px",
                padding: "8px 20px",
                borderRadius: "10px",
                border: "none",
                background: "#334155",
                color: "#fff",
                cursor: "pointer",
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

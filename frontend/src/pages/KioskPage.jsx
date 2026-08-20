/**
 * KioskPage.jsx
 * -------------
 * 📺 Waiting Room Kiosk TV Banner view.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React from "react";

export default function KioskPage({ tenantId, servingTickets, queueSnapshot, kioskQrData }) {
  return (
    <div style={{ minHeight: "80vh", padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#064E3B", margin: "0 0 6px 0" }}>
          📺 Waiting Room Kiosk TV Banner
        </h1>
        <p style={{ color: "#047857", fontSize: "16px", margin: 0, fontWeight: 700 }}>
          City General Hospital — Live Counter Display
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <div style={kioskServingBoxStyle}>
          <h2 style={{ margin: "0 0 20px 0", color: "#047857", fontSize: "28px", fontWeight: 800 }}>
            🔔 NOW SERVING AT DOCTOR DESKS
          </h2>

          {servingTickets.length === 0 ? (
            <div style={{ padding: "60px 20px", color: "#94A3B8", fontSize: "20px", fontWeight: 700 }}>
              Please wait... Next token calling shortly.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {servingTickets.map((t) => (
                <div key={t.ticket_id} style={bigTokenBoxStyle}>
                  <span style={{ fontSize: "14px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>Ticket Token</span>
                  <h1 style={{ margin: "4px 0", fontSize: "48px", color: "#047857", fontWeight: 900 }}>
                    #{t.ticket_id}
                  </h1>
                  <span style={{ fontSize: "16px", color: "#0F172A", fontWeight: 700 }}>{t.name}</span>
                  <span style={{ fontSize: "13px", color: "#0284C7", marginTop: "4px", fontWeight: 700 }}>{t.service_category.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={kioskQrBoxStyle}>
          <h3 style={{ margin: "0 0 12px 0", color: "#064E3B", fontSize: "20px", fontWeight: 800 }}>
            📲 Scan for Mobile Token
          </h3>
          <p style={{ color: "#64748B", fontSize: "12px", margin: "0 0 16px 0" }}>
            Point your smartphone camera to join queue on mobile
          </p>

          {kioskQrData ? (
            <img
              src={kioskQrData.qr_code_base64}
              alt="Kiosk QR Poster"
              style={{ width: "220px", height: "220px", borderRadius: "14px", background: "#fff", padding: "12px", border: "1px solid #CBD5E1" }}
            />
          ) : (
            <p style={{ color: "#94A3B8" }}>Generating QR...</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Soft Green Clinical Theme Styles
const kioskServingBoxStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "32px",
  textAlign: "center",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const bigTokenBoxStyle = {
  background: "#ECFDF5",
  padding: "24px",
  borderRadius: "14px",
  border: "2px solid #059669",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const kioskQrBoxStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "32px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

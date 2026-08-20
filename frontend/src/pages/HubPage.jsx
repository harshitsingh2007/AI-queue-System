/**
 * HubPage.jsx
 * -----------
 * 🏠 Hospital Launchpad Portal Hub view.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React from "react";

export default function HubPage({ navigateTo, currentUser }) {
  const isAdmin = currentUser && currentUser.role === "admin";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "10px 0 40px 0" }}>
      {/* Header Title Section */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "28px" }}>🏥</span>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#064E3B", margin: 0 }}>
            City Hospital — Portal Launchpad
          </h1>
        </div>
        <p style={{ color: "#475569", fontSize: "13px", margin: "0 0 14px 0", fontWeight: 600 }}>
          Logged in as <strong>{isAdmin ? "Staff Admin" : "Consumer Patient"}</strong> — {isAdmin ? "Full access to all Doctor Desks & ML Data Studio." : "Full access to Patient Check-in and Waiting Room Kiosk."}
        </p>

        {!isAdmin && (
          <div style={noticeBoxStyle}>
            ⓘ <strong>Admin pages (Doctor Desk & ML Studio)</strong> are protected from Consumer accounts.
          </div>
        )}
      </div>

      {/* Grid of 4 Modular Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* 1. Patient Portal Card */}
        <div style={hubCardStyle} onClick={() => navigateTo("patient")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div style={hubIconBoxStyle}>📱</div>
            <div style={arrowCircleBtnStyle}>→</div>
          </div>
          <h3 style={{ margin: "0 0 6px 0", color: "#064E3B", fontSize: "18px", fontWeight: 800 }}>
            1. Patient Check-in Portal (Consumer)
          </h3>
          <p style={{ color: "#64748B", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
            Standalone mobile/kiosk check-in page for patients. Department selection, triage emergency toggle, position countdown, audio chimes, and digital QR ticket pass.
          </p>
        </div>

        {/* 2. Doctor & Staff Desk Card */}
        <div
          style={{ ...hubCardStyle, opacity: isAdmin ? 1 : 0.85 }}
          onClick={() => navigateTo("staff")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div style={hubIconBoxStyle}>{isAdmin ? "🛡️" : "🔒"}</div>
            <span style={roleBadgeStyle(isAdmin)}>
              {isAdmin ? "UNLOCKED" : "ADMIN ONLY (RESTRICTED)"}
            </span>
          </div>
          <h3 style={{ margin: "0 0 6px 0", color: "#064E3B", fontSize: "18px", fontWeight: 800 }}>
            2. Doctor & Staff Desk Dashboard
          </h3>
          <p style={{ color: "#64748B", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
            Staff desk control panel is restricted to Staff Admin accounts and not accessible by Consumer accounts.
          </p>
        </div>

        {/* 3. ML Studio & Dataset Trainer Card */}
        <div
          style={{ ...hubCardStyle, opacity: isAdmin ? 1 : 0.85 }}
          onClick={() => navigateTo("admin")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div style={hubIconBoxStyle}>{isAdmin ? "📊" : "🔒"}</div>
            <span style={roleBadgeStyle(isAdmin)}>
              {isAdmin ? "UNLOCKED" : "ADMIN ONLY (RESTRICTED)"}
            </span>
          </div>
          <h3 style={{ margin: "0 0 6px 0", color: "#064E3B", fontSize: "18px", fontWeight: 800 }}>
            3. Hospital ML Studio & Training
          </h3>
          <p style={{ color: "#64748B", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
            AI training studio is restricted to Staff Admin accounts and not accessible by Consumer accounts.
          </p>
        </div>

        {/* 4. Waiting Room Kiosk TV Card */}
        <div style={hubCardStyle} onClick={() => navigateTo("kiosk")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div style={hubIconBoxStyle}>📺</div>
            <div style={arrowCircleBtnStyle}>→</div>
          </div>
          <h3 style={{ margin: "0 0 6px 0", color: "#064E3B", fontSize: "18px", fontWeight: 800 }}>
            4. Waiting Room Kiosk TV Display
          </h3>
          <p style={{ color: "#64748B", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
            Full-screen waiting room monitor display. Displays huge now-serving ticket numbers, assigned doctor desks, and big scannable QR code poster.
          </p>
        </div>
      </div>

      {/* Soft Green Palette Indicator Bar */}
      <div style={paletteBarCardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={paletteTagStyle}>PALETTE 4</span>
          <span style={{ fontSize: "12px", color: "#064E3B", fontWeight: 700 }}>Soft Green Clinical</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={colorSwatch("#059669")} title="Forest Green Primary" />
          <div style={colorSwatch("#10B981")} title="Mint Accent" />
          <div style={colorSwatch("#A7F3D0")} title="Light Mint Soft Fill" />
          <div style={colorSwatch("#064E3B")} title="Dark Forest Text" />
          <div style={colorSwatch("#F59E0B")} title="Amber Warning" />
          <div style={colorSwatch("#EF4444")} title="Coral Emergency" />
          <div style={colorSwatch("#CBD5E1")} title="Border Slate" />
        </div>
      </div>
    </div>
  );
}

// Soft Green Clinical Theme Styles
const noticeBoxStyle = {
  display: "inline-block",
  padding: "6px 16px",
  borderRadius: "20px",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  color: "#047857",
  fontSize: "12px",
  fontWeight: 600,
};

const hubCardStyle = {
  background: "#FFFFFF",
  borderRadius: "16px",
  border: "1px solid #D8E8DD",
  padding: "24px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const hubIconBoxStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "10px",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
};

const arrowCircleBtnStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  color: "#047857",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
};

const roleBadgeStyle = (unlocked) => ({
  padding: "4px 8px",
  borderRadius: "6px",
  fontSize: "10px",
  fontWeight: 800,
  background: unlocked ? "#ECFDF5" : "#F1F5F9",
  color: unlocked ? "#047857" : "#64748B",
  border: unlocked ? "1px solid #A7F3D0" : "1px solid #CBD5E1",
});

const paletteBarCardStyle = {
  marginTop: "32px",
  padding: "12px 20px",
  borderRadius: "14px",
  background: "#FFFFFF",
  border: "1px solid #D8E8DD",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
};

const paletteTagStyle = {
  padding: "4px 10px",
  borderRadius: "8px",
  background: "#ECFDF5",
  color: "#047857",
  fontSize: "11px",
  fontWeight: 800,
  border: "1px solid #A7F3D0",
};

const colorSwatch = (hex) => ({
  width: "24px",
  height: "16px",
  borderRadius: "4px",
  background: hex,
  border: "1px solid rgba(0,0,0,0.1)",
});

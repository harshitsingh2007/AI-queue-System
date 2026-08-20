/**
 * Header.jsx
 * ----------
 * Top Header Navigation Bar with Soft Green Clinical Theme.
 */

import React from "react";
import { HOSPITAL_CONFIG } from "../config/hospitalConfig";

export default function Header({
  currentUser,
  activePage,
  navigateTo,
  handleLogout,
  setShowAuthModal,
  socketConnected,
}) {
  const isAdmin = currentUser && currentUser.role === "admin";
  const isConsumer = currentUser && currentUser.role === "user";

  return (
    <header style={topHeaderStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={logoTagStyle}>🏥 Hospital Queue System</span>
        <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>{HOSPITAL_CONFIG.name}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* User Auth Badge / Login Button */}
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                padding: "5px 12px",
                borderRadius: "12px",
                background: isAdmin ? "#ECFDF5" : "#E0F2FE",
                color: isAdmin ? "#047857" : "#0284C7",
                fontSize: "12px",
                fontWeight: 700,
                border: isAdmin ? "1px solid #10B981" : "1px solid #38BDF8",
              }}
            >
              {isAdmin ? "🛡️ Admin:" : "📱 Patient:"} {currentUser.username}
            </span>
            <button onClick={handleLogout} style={logoutBtnStyle}>
              Logout
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAuthModal(true)} style={authTriggerBtnStyle}>
            🔐 Login / Signup
          </button>
        )}

        {/* Role-Based Page Switcher Dropdown */}
        <select
          value={activePage}
          onChange={(e) => navigateTo(e.target.value)}
          style={pageSelectStyle}
          disabled={!currentUser && activePage !== "kiosk"}
        >
          <option value="hub">🏠 Portal Hub</option>

          {/* Hide Consumer Pages from Admins */}
          {(isConsumer || !currentUser) && (
            <option value="patient">📱 Patient Portal (Consumer)</option>
          )}

          {/* Hide Admin Pages from Consumers */}
          {isAdmin && (
            <>
              <option value="staff">🛡️ Doctor Desk (Admin Only)</option>
              <option value="admin">📊 ML Studio (Admin Only)</option>
              <option value="db">🗄️ Database Inspector (Admin Only)</option>
            </>
          )}

          <option value="kiosk">📺 Waiting Room Kiosk TV</option>
        </select>

        {/* Socket Connection Badge */}
        <span style={connBadgeStyle(socketConnected)}>
          <span style={dotStyle(socketConnected)} />
          {socketConnected ? "Online" : "Offline"}
        </span>
      </div>
    </header>
  );
}

// Soft Green Clinical Theme Styles
const topHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  paddingBottom: "16px",
  borderBottom: "1px solid #D8E8DD",
};

const logoTagStyle = {
  padding: "8px 14px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "14px",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
};

const authTriggerBtnStyle = {
  padding: "7px 14px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
};

const logoutBtnStyle = {
  padding: "4px 10px",
  borderRadius: "8px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#475569",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const pageSelectStyle = {
  padding: "8px 14px",
  borderRadius: "10px",
  background: "#FFFFFF",
  color: "#0F172A",
  border: "1px solid #D8E8DD",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
};

const connBadgeStyle = (online) => ({
  padding: "6px 12px",
  borderRadius: "20px",
  background: online ? "#ECFDF5" : "#FEF2F2",
  color: online ? "#047857" : "#DC2626",
  border: online ? "1px solid #A7F3D0" : "1px solid #FECACA",
  fontSize: "11px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const dotStyle = (online) => ({
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: online ? "#059669" : "#DC2626",
});

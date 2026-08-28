/**
 * Header.jsx
 * ----------
 * Top Header Navigation Bar with Professional Healthcare Styling.
 */

import React from "react";
import { HOSPITAL_CONFIG } from "../config/hospitalConfig";
import { t } from "../utils/i18n";

export default function Header({
  currentUser,
  activePage,
  navigateTo,
  handleLogout,
  setShowAuthModal,
  socketConnected,
  language = "en",
  setLanguage,
}) {
  const isAdmin = currentUser && currentUser.role === "admin";
  const isConsumer = currentUser && currentUser.role === "user";

  return (
    <header style={topHeaderStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={logoBadgeContainerStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6v12M6 12h12"/>
            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.2px" }}>{t("systemTitle", language)}</span>
        </div>
        <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>{HOSPITAL_CONFIG.name}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Language Switcher Pill */}
        {setLanguage && (
          <div style={langSwitcherContainerStyle}>
            <button
              onClick={() => setLanguage("en")}
              style={langBtnStyle(language === "en")}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("hi")}
              style={langBtnStyle(language === "hi")}
            >
              हिंदी
            </button>
          </div>
        )}

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
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isAdmin ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )}
              {isAdmin ? "Admin:" : "Patient:"} {currentUser.username} {isAdmin && currentUser.department ? `[${currentUser.department.toUpperCase()}]` : ""}
            </span>
            <button onClick={handleLogout} style={logoutBtnStyle}>
              Logout
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAuthModal(true)} style={authTriggerBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            {t("accountLogin", language)}
          </button>
        )}

        {/* Role-Based Page Switcher Dropdown */}
        <select
          value={activePage}
          onChange={(e) => navigateTo(e.target.value)}
          style={pageSelectStyle}
          disabled={!currentUser && activePage !== "kiosk"}
        >
          {/* Hide Consumer Pages from Admins */}
          {(isConsumer || !currentUser) && (
            <option value="patient">{t("patientPortal", language)}</option>
          )}

          {/* Hide Admin Pages from Consumers */}
          {isAdmin && (
            <>
              <option value="staff">{t("staffDashboard", language)}</option>
              <option value="admin">{t("mlStudio", language)}</option>
              <option value="db">{t("dbInspector", language)}</option>
            </>
          )}

          <option value="kiosk">{t("kioskMonitor", language)}</option>
        </select>

        {/* Socket Connection Badge */}
        <span style={connBadgeStyle(socketConnected)}>
          <span style={dotStyle(socketConnected)} />
          {socketConnected ? t("statusOnline", language) : t("statusOffline", language)}
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

const langSwitcherContainerStyle = {
  display: "flex",
  background: "#F1F5F9",
  borderRadius: "10px",
  padding: "3px",
  border: "1px solid #CBD5E1",
};

const langBtnStyle = (active) => ({
  padding: "4px 10px",
  borderRadius: "7px",
  border: "none",
  background: active ? "#059669" : "transparent",
  color: active ? "#ffffff" : "#475569",
  fontSize: "11px",
  fontWeight: 800,
  cursor: "pointer",
});

const logoBadgeContainerStyle = {
  padding: "8px 14px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
};

const authTriggerBtnStyle = {
  padding: "8px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const logoutBtnStyle = {
  padding: "6px 12px",
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

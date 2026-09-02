/**
 * MandatoryAuthScreen.jsx
 * -----------------------
 * Dedicated Gatekeeper Auth Screen when user is not signed in.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 * Beautiful, distraction-free centered healthcare login experience.
 */

import React, { useState } from "react";
import AuthModal from "./AuthModal";

export default function MandatoryAuthScreen({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState("login");

  return (
    <div style={containerStyle}>
      {/* Hospital Branding Header (Centered above the login card) */}
      <div style={brandHeaderStyle}>
        <div style={brandLogoBadgeStyle}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 style={hospitalTitleStyle}>City General Hospital</h1>
          <div style={hospitalBadgeRowStyle}>
            <span style={nabhBadgeStyle}>NABH ACCREDITED</span>
            <span style={taglineStyle}>Care you can trust • AI Triage Active</span>
          </div>
        </div>
      </div>

      {/* Main Auth Card */}
      <div style={cardContainerStyle}>
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          onClose={() => {}}
          onLoginSuccess={onLoginSuccess}
          isInline={true}
        />
      </div>

      {/* Security & System Note */}
      <div style={footerMetaStyle}>
        <span>🔒 256-bit Encrypted Healthcare Session</span>
        <span>•</span>
        <span>AI Queue System v2.0</span>
      </div>
    </div>
  );
}

// Styling Constants
const containerStyle = {
  maxWidth: "480px",
  margin: "32px auto 48px auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxSizing: "border-box",
  padding: "0 12px",
};

const brandHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
  marginBottom: "20px",
};

const brandLogoBadgeStyle = {
  width: "54px",
  height: "54px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #059669 0%, #047857 60%, #064E3B 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 24px rgba(5, 150, 105, 0.3)",
};

const hospitalTitleStyle = {
  margin: "0 0 4px 0",
  fontSize: "23px",
  fontWeight: 900,
  color: "#064E3B",
  letterSpacing: "-0.4px",
};

const hospitalBadgeRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const nabhBadgeStyle = {
  fontSize: "10px",
  fontWeight: 800,
  padding: "2px 8px",
  borderRadius: "6px",
  background: "#ECFDF5",
  color: "#047857",
  border: "1px solid #A7F3D0",
  letterSpacing: "0.5px",
};

const taglineStyle = {
  fontSize: "12px",
  color: "#64748B",
  fontWeight: 500,
};

const cardContainerStyle = {
  width: "100%",
  background: "#FFFFFF",
  borderRadius: "20px",
  border: "1px solid #D8E8DD",
  padding: "26px 28px",
  boxShadow: "0 16px 40px rgba(6, 78, 59, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
  boxSizing: "border-box",
};

const footerMetaStyle = {
  marginTop: "20px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "11px",
  color: "#94A3B8",
  fontWeight: 600,
};

/**
 * MandatoryAuthScreen.jsx
 * -----------------------
 * Gatekeeper Auth Screen forcing user authentication before entering pages.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState } from "react";
import AuthModal from "./AuthModal";

export default function MandatoryAuthScreen({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState("login");

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", textAlign: "center" }}>
      <div style={cardStyle}>
        <div style={lockIconCircleStyle}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "22px", color: "#064E3B", fontWeight: 800 }}>
          Authentication Required
        </h2>
        <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.5", marginBottom: "24px" }}>
          Please sign in to your <strong>Staff Admin</strong> or <strong>Patient/Consumer</strong> account to continue.
        </p>

        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          onClose={() => {}}
          onLoginSuccess={onLoginSuccess}
          isInline={true}
        />
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "32px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const lockIconCircleStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

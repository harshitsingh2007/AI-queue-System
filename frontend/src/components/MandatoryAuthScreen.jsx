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
        <span style={{ fontSize: "54px", display: "block", marginBottom: "12px" }}>🔒</span>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", color: "#064E3B", fontWeight: 800 }}>
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

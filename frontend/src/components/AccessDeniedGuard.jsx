/**
 * AccessDeniedGuard.jsx
 * ---------------------
 * Access Protection Shield for Restricted Role Pages.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState } from "react";
import { API_BASE } from "../config/hospitalConfig";

export default function AccessDeniedGuard({ requiredRole, pageName, currentUser, onLoginSuccess, navigateTo }) {
  const isTargetingAdmin = requiredRole === "admin";

  return (
    <div style={{ maxWidth: "550px", margin: "40px auto", textAlign: "center" }}>
      <div style={standaloneCardStyle}>
        <div style={shieldIconCircleStyle}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 style={{ margin: "0 0 10px 0", color: "#DC2626", fontSize: "22px", fontWeight: 800 }}>
          Restricted Access — {isTargetingAdmin ? "Staff Admin Required" : "Consumer View"}
        </h2>
        <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
          {isTargetingAdmin ? (
            <>The <strong>{pageName}</strong> is strictly protected for Hospital Staff and Doctor Admins. Users registered as <strong>Consumers/Patients</strong> cannot open or access administrative desk controls.</>
          ) : (
            <>You are currently logged in as a <strong>Staff Admin</strong>. Patient check-in controls are dedicated for patient self-service screens.</>
          )}
        </p>

        {currentUser && (
          <div style={{ padding: "14px", borderRadius: "10px", background: "#F8FAFC", border: "1px solid #CBD5E1", marginBottom: "20px" }}>
            <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
              Currently logged in as: <strong style={{ color: "#047857" }}>{currentUser.username} ({currentUser.email})</strong> — Role: <span style={{ color: "#DC2626", fontWeight: 700 }}>{currentUser.role.toUpperCase()}</span>.
            </p>
          </div>
        )}

        {isTargetingAdmin ? (
          <AuthModalInline onLoginSuccess={onLoginSuccess} defaultRole="admin" />
        ) : (
          <button onClick={() => navigateTo("staff")} style={primaryBtnStyle}>
            Switch to Doctor Desk Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

function AuthModalInline({ onLoginSuccess, defaultRole }) {
  const [email, setEmail] = useState("admin@hospital.com");
  const [password, setPassword] = useState("admin123");
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && data.status === "success") {
        if (data.user.role !== "admin") {
          setErrorMsg("Login failed: Account is not a Staff Admin.");
          return;
        }
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.detail || "Invalid Staff Admin credentials.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(`Server error: ${err.message}`);
    }
  };

  return (
    <div style={{ textAlign: "left", background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #CBD5E1" }}>
      <h4 style={{ margin: "0 0 12px 0", color: "#047857", fontSize: "14px", fontWeight: 700 }}>
        Sign In with Staff Admin Credentials:
      </h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <label style={fieldLabelStyle}>Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={fieldInputStyle}
          />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={fieldLabelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={fieldInputStyle}
          />
        </div>
        <button type="submit" disabled={loading} style={primaryBtnStyle}>
          {loading ? "Verifying..." : "Authenticate as Staff Admin"}
        </button>
      </form>
      {errorMsg && <p style={{ color: "#DC2626", fontSize: "12px", marginTop: "10px", margin: 0, fontWeight: 600 }}>{errorMsg}</p>}
    </div>
  );
}

const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "28px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const shieldIconCircleStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

const fieldLabelStyle = { display: "block", fontSize: "12px", color: "#475569", marginBottom: "6px", fontWeight: 600 };

const fieldInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#0F172A",
  fontSize: "13px",
};

const primaryBtnStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
};

/**
 * AuthModal.jsx
 * -------------
 * Interactive Authentication Modal with Professional Healthcare Styling.
 */

import React, { useState } from "react";
import { API_BASE } from "../config/hospitalConfig";

export default function AuthModal({ authMode, setAuthMode, onClose, onLoginSuccess, isInline = false }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // "user" (consumer) | "admin"
  const [department, setDepartment] = useState("consultation");
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const endpoint = authMode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/signup";
    const payload =
      authMode === "login"
        ? { email, password }
        : { email, username, password, role, department: role === "admin" ? department : "all" };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === "success") {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.detail || "Authentication failed. Please check credentials.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(`Server connection error: ${err.message}`);
    }
  };

  const handleQuickLogin = (demoRole) => {
    if (demoRole === "admin") {
      setEmail("admin@hospital.com");
      setPassword("admin123");
    } else {
      setEmail("patient@hospital.com");
      setPassword("user123");
    }
  };

  const modalBody = (
    <div style={isInline ? { width: "100%", textAlign: "left" } : modalCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#064E3B", fontWeight: 800 }}>
            {authMode === "login" ? "Account Sign In" : "Register Account"}
          </h2>
        </div>
        {!isInline && onClose && (
          <button onClick={onClose} style={modalCloseBtnStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

        {/* Auth Mode Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "#F1F5F9", padding: "4px", borderRadius: "10px" }}>
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            style={modalTabBtnStyle(authMode === "login")}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("signup")}
            style={modalTabBtnStyle(authMode === "signup")}
          >
            Register Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={fieldLabelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="user@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={fieldInputStyle}
            />
          </div>

          {authMode === "signup" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={fieldLabelStyle}>Full Name / Display Name</label>
              <input
                type="text"
                placeholder="Dr. Sarah / Patient John"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={fieldInputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={fieldLabelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={fieldInputStyle}
            />
          </div>

          {authMode === "signup" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={fieldLabelStyle}>Select Account Role</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: role === "admin" ? "14px" : "0" }}>
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  style={roleOptionBtnStyle(role === "user", "#0284C7")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Patient / Consumer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  style={roleOptionBtnStyle(role === "admin", "#047857")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Staff / Doctor Admin
                </button>
              </div>

              {role === "admin" && (
                <div>
                  <label style={fieldLabelStyle}>Assign Staff Department (Required)</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={fieldInputStyle}
                    required
                  >
                    <option value="consultation">OPD / Doctor Consultation</option>
                    <option value="pharmacy">Pharmacy & Medication</option>
                    <option value="emergency">Emergency Triage</option>
                    <option value="laboratory">Pathology & Laboratory</option>
                    <option value="radiology">Radiology & Imaging</option>
                    <option value="billing">Billing & Accounts</option>
                    <option value="all">All Departments (Super Admin)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} style={modalSubmitBtnStyle}>
            {loading ? "Authenticating..." : authMode === "login" ? "Sign In Now" : "Register Account"}
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: "14px", padding: "10px", borderRadius: "8px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", textAlign: "center", fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        {/* Demo Quick Logins */}
        <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #E2E8F0", textAlign: "center" }}>
          <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginBottom: "8px", fontWeight: 600 }}>Quick Demo Credentials:</span>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button type="button" onClick={() => handleQuickLogin("admin")} style={quickBtnStyle}>
              Quick Staff Admin Login
            </button>
            <button type="button" onClick={() => handleQuickLogin("user")} style={quickBtnStyle}>
              Quick Patient Login
            </button>
          </div>
        </div>
      </div>
  );

  if (isInline) {
    return modalBody;
  }

  return (
    <div style={modalBackdropStyle}>
      {modalBody}
    </div>
  );
}

// Soft Green Clinical Theme Styles
const modalBackdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(15, 23, 42, 0.4)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalCardStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "#FFFFFF",
  border: "1px solid #D8E8DD",
  borderRadius: "20px",
  padding: "28px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
};

const modalCloseBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#64748B",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalTabBtnStyle = (active) => ({
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  background: active ? "#059669" : "transparent",
  color: active ? "#ffffff" : "#64748B",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
});

const fieldLabelStyle = { display: "block", fontSize: "12px", color: "#475569", marginBottom: "6px", fontWeight: 600 };

const fieldInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#0F172A",
  fontSize: "13px",
};

const roleOptionBtnStyle = (active, accent) => ({
  padding: "10px",
  borderRadius: "8px",
  border: active ? `2px solid ${accent}` : "1px solid #CBD5E1",
  background: active ? (accent === "#047857" ? "#ECFDF5" : "#E0F2FE") : "#F8FAFC",
  color: active ? accent : "#64748B",
  fontWeight: 700,
  fontSize: "11px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
});

const modalSubmitBtnStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
};

const quickBtnStyle = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#475569",
  fontSize: "10px",
  cursor: "pointer",
  fontWeight: 600,
};

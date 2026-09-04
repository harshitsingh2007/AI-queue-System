/**
 * MandatoryAuthScreen.jsx
 * -----------------------
 * Premium Healthcare SaaS Patient Portal Landing & Authentication Screen.
 * 
 * Design Language:
 * - Soft Medical Blue / Cyan Palette (#0F172A Navy, #0284C7 / #06B6D4 Cyan Accent, #F0F9FF Light Background)
 * - Subtle Low-Contrast Grid Texture & Ambient Glowing Gradients
 * - Two-Column Desktop Layout (Hero + Login Card Left, Healthcare Dashboard Preview Right)
 * - Interactive Floating Preview Cards (Appointments, Live Queue Status, AI Prediction, Progress Updates)
 * - Clean Header with Navigation (Help Center, Find a Provider, Support, Language Toggle)
 * - Seamless Support for Unified Login, Patient & Super Admin Signups, Forgot Password, and Demo Quick-Fill
 */

import React, { useState } from "react";
import { API_BASE, HOSPITAL_CONFIG } from "../config/hospitalConfig";

export default function MandatoryAuthScreen({
  onLoginSuccess,
  language = "en",
  setLanguage,
  navigateTo,
}) {
  // Views: "login" | "signup-patient" | "signup-superadmin"
  const [authMode, setAuthMode] = useState("login");

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form States
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [hospitalName, setHospitalName] = useState("");

  // Modal Dialog States
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const isHindi = language === "hi";

  // Fast Demo Fill Helper
  const fillDemoAccount = (role) => {
    setErrorMsg(null);
    if (role === "patient") {
      setLoginIdentifier("rahul.sharma@example.com");
      setLoginPassword("pass123");
    } else if (role === "doctor") {
      setLoginIdentifier("dr.gupta@cityhospital.com");
      setLoginPassword("pass123");
    } else if (role === "staff") {
      setLoginIdentifier("priya.staff@cityhospital.com");
      setLoginPassword("pass123");
    } else if (role === "superadmin") {
      setLoginIdentifier("superadmin@aiqueue.internal");
      setLoginPassword("pass123");
    }
  };

  // Submit Unified Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === "success") {
        if (onLoginSuccess) onLoginSuccess(data.user);
      } else {
        setErrorMsg(
          data.detail ||
            (isHindi
              ? "प्रमाणीकरण विफल रहा। कृपया अपने क्रेडेंशियल्स जांचें।"
              : "Unable to sign in. The email or password you entered is incorrect.")
        );
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(
        isHindi
          ? `सर्वर कनेक्शन त्रुटि: ${err.message}`
          : `Server connection error: ${err.message}`
      );
    }
  };

  // Submit Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg(
        isHindi
          ? "पासवर्ड मेल नहीं खाते। कृपया पुनः दर्ज करें।"
          : "Passwords do not match. Please re-enter."
      );
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg(
        isHindi
          ? "पासवर्ड कम से कम 6 वर्णों का होना चाहिए।"
          : "Password must be at least 6 characters long."
      );
      return;
    }

    setLoading(true);
    let endpoint = "/api/v1/auth/signup/patient";
    let payload = {
      username: fullName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim(),
    };

    if (authMode === "signup-superadmin") {
      endpoint = "/api/v1/auth/signup/superadmin";
      payload.hospital_name =
        hospitalName.trim() || `${fullName.trim()}'s Medical Center`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === "success") {
        if (onLoginSuccess) onLoginSuccess(data.user);
      } else {
        setErrorMsg(
          data.detail ||
            (isHindi
              ? "पंजीकरण विफल रहा। कृपया पुनः प्रयास करें।"
              : "Registration failed. Please try again.")
        );
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(
        isHindi
          ? `सर्वर कनेक्शन त्रुटि: ${err.message}`
          : `Server connection error: ${err.message}`
      );
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotSuccess(true);
  };

  return (
    <div className="patient-login-page">
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes ambientPulse {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          50% { transform: scale(1.1) translate(20px, -15px); opacity: 0.85; }
        }
        @keyframes pulseDotLive {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }

        .patient-login-page {
          min-height: 100vh;
          width: 100%;
          max-width: 100%;
          background: #F8FAFC;
          color: #0F172A;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        /* Subtle grid background texture */
        .patient-grid-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(2, 132, 199, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(2, 132, 199, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 70%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 70%, transparent 100%);
        }

        /* Ambient Glow Circles */
        .ambient-glow-1 {
          position: absolute;
          top: -10%;
          left: -5%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(186, 230, 253, 0.7) 0%, rgba(224, 242, 254, 0.2) 60%, transparent 80%);
          filter: blur(80px);
          animation: ambientPulse 12s infinite ease-in-out;
          pointer-events: none;
          z-index: 0;
        }
        .ambient-glow-2 {
          position: absolute;
          bottom: 5%;
          right: -5%;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(165, 243, 252, 0.6) 0%, rgba(207, 250, 254, 0.2) 60%, transparent 80%);
          filter: blur(90px);
          animation: ambientPulse 15s infinite ease-in-out reverse;
          pointer-events: none;
          z-index: 0;
        }
        .ambient-glow-3 {
          position: absolute;
          top: 40%;
          left: 45%;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(224, 231, 255, 0.5) 0%, transparent 75%);
          filter: blur(70px);
          pointer-events: none;
          z-index: 0;
        }

        /* Top Header */
        .pl-header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .pl-header-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
        }
        .pl-brand-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px -2px rgba(2, 132, 199, 0.35);
        }
        .pl-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .pl-nav-link {
          background: none;
          border: none;
          padding: 6px 12px;
          color: #475569;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.18s ease;
        }
        .pl-nav-link:hover {
          color: #0284C7;
          background: rgba(2, 132, 199, 0.06);
        }

        /* Hero & Content Layout */
        .pl-main-container {
          position: relative;
          z-index: 10;
          flex: 1;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 56px;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
          padding: 24px 48px 48px 48px;
          box-sizing: border-box;
          align-items: center;
        }

        /* Left Side: Hero & Login Form Card */
        .pl-left-column {
          display: flex;
          flex-direction: column;
          gap: 28px;
          max-width: 540px;
        }

        .pl-hero-headline {
          font-size: 44px;
          line-height: 1.14;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -1.2px;
          margin: 0;
        }
        .pl-hero-accent {
          background: linear-gradient(135deg, #0284C7 0%, #06B6D4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        .pl-hero-desc {
          font-size: 15px;
          line-height: 1.55;
          color: #64748B;
          margin: 10px 0 0 0;
          font-weight: 500;
        }

        /* Glass Login Card */
        .pl-login-card {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 24px;
          padding: 32px 34px;
          box-shadow: 
            0 24px 48px -12px rgba(15, 23, 42, 0.08),
            0 4px 16px -2px rgba(2, 132, 199, 0.04);
          position: relative;
        }

        .pl-card-title {
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.4px;
        }
        .pl-card-subtitle {
          font-size: 13.5px;
          color: #64748B;
          margin: 0 0 22px 0;
          font-weight: 500;
        }

        /* Input Controls */
        .pl-input-group {
          margin-bottom: 18px;
        }
        .pl-input-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 7px;
        }
        .pl-input-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #475569;
        }
        .pl-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .pl-input-icon {
          position: absolute;
          left: 14px;
          color: #94A3B8;
          display: flex;
          align-items: center;
          pointer-events: none;
        }
        .pl-text-input {
          width: 100%;
          height: 46px;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 0 16px 0 42px;
          font-size: 14px;
          color: #0F172A;
          font-weight: 500;
          outline: none;
          transition: all 0.18s ease;
          box-sizing: border-box;
          font-family: inherit;
        }
        .pl-text-input:focus {
          border-color: #0284C7;
          box-shadow: 0 0 0 3.5px rgba(2, 132, 199, 0.14);
          background: #FAFCFF;
        }
        .pl-text-input::placeholder {
          color: #94A3B8;
          font-weight: 400;
        }

        .pl-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: color 0.15s ease;
        }
        .pl-eye-btn:hover {
          color: #0284C7;
        }

        .pl-forgot-link {
          font-size: 12px;
          color: #0284C7;
          background: none;
          border: none;
          padding: 0;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }
        .pl-forgot-link:hover {
          text-decoration: underline;
        }

        /* Primary Action Button */
        .pl-primary-btn {
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 20px -4px rgba(2, 132, 199, 0.4);
          margin-top: 6px;
          font-family: inherit;
        }
        .pl-primary-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 12px 28px -4px rgba(2, 132, 199, 0.5);
          background: linear-gradient(135deg, #0369A1 0%, #0284C7 100%);
        }
        .pl-primary-btn:active:not(:disabled) {
          transform: translateY(0px);
        }
        .pl-primary-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Registration & Security Footer */
        .pl-register-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 18px;
          font-size: 13px;
          color: #64748B;
        }
        .pl-register-link {
          color: #0284C7;
          font-weight: 700;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }
        .pl-register-link:hover {
          text-decoration: underline;
        }

        .pl-security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 18px;
          font-size: 11.5px;
          color: #64748B;
          font-weight: 600;
        }
        .pl-security-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        /* Quick Demo Roles Bar */
        .pl-demo-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 16px;
          margin-top: 18px;
          border-top: 1px solid #F1F5F9;
          flex-wrap: wrap;
        }
        .pl-demo-pill {
          padding: 4px 10px;
          border-radius: 8px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pl-demo-pill:hover {
          background: #E0F2FE;
          border-color: #BAE6FD;
          color: #0369A1;
        }

        /* Right Side: Healthcare Dashboard Visual Showcase */
        .pl-right-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 520px;
        }
        .pl-dashboard-backing {
          position: relative;
          width: 100%;
          max-width: 520px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.85) 0%, rgba(240, 249, 255, 0.75) 100%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1.5px solid rgba(255, 255, 255, 0.95);
          border-radius: 32px;
          padding: 32px;
          box-shadow: 
            0 32px 64px -16px rgba(15, 23, 42, 0.1),
            0 8px 24px -4px rgba(2, 132, 199, 0.08);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Floating UI Preview Cards */
        .pl-preview-card {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 18px 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.05);
          transition: all 0.25s ease;
        }
        .pl-preview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px -4px rgba(2, 132, 199, 0.12);
          border-color: #BAE6FD;
        }

        .pl-card-floating-1 {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .pl-card-floating-2 {
          animation: floatMedium 7s ease-in-out infinite 1s;
        }

        /* Footer */
        .pl-footer {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 48px;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
          font-size: 12.5px;
          color: #94A3B8;
          border-top: 1px solid rgba(226, 232, 240, 0.7);
          box-sizing: border-box;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pl-footer-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .pl-footer-link {
          color: #64748B;
          text-decoration: none;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: 12.5px;
        }
        .pl-footer-link:hover {
          color: #0284C7;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1100px) {
          .pl-main-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 20px 28px 40px 28px;
          }
          .pl-left-column {
            max-width: 100%;
          }
          .pl-right-visual {
            min-height: auto;
          }
          .pl-header {
            padding: 16px 28px;
          }
          .pl-footer {
            padding: 20px 28px;
          }
        }
        @media (max-width: 640px) {
          .pl-header {
            padding: 16px 20px;
          }
          .pl-nav-links {
            display: none;
          }
          .pl-main-container {
            padding: 12px 20px 32px 20px;
          }
          .pl-hero-headline {
            font-size: 32px;
          }
          .pl-login-card {
            padding: 24px 20px;
          }
          .pl-footer {
            padding: 16px 20px;
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      {/* Grid Pattern & Ambient Lighting */}
      <div className="patient-grid-bg" />
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="ambient-glow-3" />

      {/* ================================================================= */}
      {/* 1. MINIMAL PROFESSIONAL HEADER                                    */}
      {/* ================================================================= */}
      <header className="pl-header">
        <div className="pl-header-brand">
          <div className="pl-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v8"/>
              <path d="M8 12h8"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "16px", color: "#0F172A", letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{HOSPITAL_CONFIG.name || "City General Hospital"}</span>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "6px", background: "#E0F2FE", color: "#0369A1", letterSpacing: "0.8px" }}>
                PATIENT PORTAL
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500 }}>
              {isHindi ? "स्मार्ट कतार एवं डिजिटल अपॉइंटमेंट" : "AI Queue Orchestration & Care Access"}
            </div>
          </div>
        </div>

        {/* Right Nav Links */}
        <div className="pl-nav-links">
          <button type="button" onClick={() => setShowHelpModal(true)} className="pl-nav-link">
            {isHindi ? "सहायता केंद्र" : "Help Center"}
          </button>
          <button type="button" onClick={() => setShowProviderModal(true)} className="pl-nav-link">
            {isHindi ? "चिकित्सक खोजें" : "Find a Provider"}
          </button>
          <button type="button" onClick={() => setShowSupportModal(true)} className="pl-nav-link">
            {isHindi ? "सहायता" : "Support"}
          </button>

          {/* Language Toggle */}
          {setLanguage && (
            <button
              type="button"
              onClick={() => setLanguage(isHindi ? "en" : "hi")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "10px",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                fontSize: "12px",
                fontWeight: 700,
                color: "#0F172A",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>{isHindi ? "हिंदी (HI)" : "English (EN)"}</span>
            </button>
          )}

          {/* Kiosk Mode Shortcut */}
          {navigateTo && (
            <button
              type="button"
              onClick={() => navigateTo("kiosk")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "10px",
                background: "#F0F9FF",
                border: "1px solid #BAE6FD",
                fontSize: "12px",
                fontWeight: 700,
                color: "#0369A1",
                cursor: "pointer",
              }}
              title="Open Public Waiting Room Kiosk TV"
            >
              <span>{isHindi ? "प्रतीक्षा कक्ष टीवी" : "Waiting Room TV"}</span>
              <span>→</span>
            </button>
          )}
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. MAIN TWO-COLUMN HERO + LOGIN INTERFACE                          */}
      {/* ================================================================= */}
      <main className="pl-main-container">
        
        {/* LEFT COLUMN: HERO HEADLINE + LOGIN CARD */}
        <div className="pl-left-column">
          <div>
            <h1 className="pl-hero-headline">
              {isHindi ? (
                <>
                  आपकी स्वास्थ्य सेवा, <br />
                  <span className="pl-hero-accent">एक सुरक्षित स्थान पर।</span>
                </>
              ) : (
                <>
                  Your healthcare, <br />
                  <span className="pl-hero-accent">in one secure place.</span>
                </>
              )}
            </h1>
            <p className="pl-hero-desc">
              {isHindi
                ? "अपॉइंटमेंट एक्सेस करें, अपनी कतार प्रबंधित करें, और अपनी देखभाल से जुड़े रहें — सब कुछ एक सुरक्षित रोगी पोर्टल में।"
                : "Access appointments, manage your queue, and stay connected with your care — all in one secure patient portal."}
            </p>
          </div>

          {/* LOGIN CARD */}
          <div className="pl-login-card">
            
            {/* Top Card Title & Mode Indicator */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 className="pl-card-title">
                  {authMode === "login"
                    ? (isHindi ? "पुनः स्वागत है" : "Welcome back")
                    : (authMode === "signup-patient" ? (isHindi ? "रोगी खाता बनाएं" : "Create Patient Account") : (isHindi ? "अस्पताल मालिक पंजीकरण" : "Hospital Owner Registration"))}
                </h2>
                <p className="pl-card-subtitle">
                  {authMode === "login"
                    ? (isHindi ? "अपने रोगी खाते में साइन इन करें।" : "Sign in to your patient account.")
                    : (isHindi ? "डिजिटल कतार और अपॉइंटमेंट के लिए निःशुल्क पंजीकरण करें।" : "Fill details below to access instant queues and bookings.")}
                </p>
              </div>

              {/* Mode Switcher Pill */}
              <div style={{ display: "inline-flex", background: "#F1F5F9", padding: "3px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode("login"); setErrorMsg(null); }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "7px",
                    border: "none",
                    background: authMode === "login" ? "#FFFFFF" : "transparent",
                    color: authMode === "login" ? "#0F172A" : "#64748B",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                    boxShadow: authMode === "login" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {isHindi ? "साइन इन" : "Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("signup-patient"); setErrorMsg(null); }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "7px",
                    border: "none",
                    background: authMode.startsWith("signup") ? "#FFFFFF" : "transparent",
                    color: authMode.startsWith("signup") ? "#0F172A" : "#64748B",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                    boxShadow: authMode.startsWith("signup") ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {isHindi ? "पंजीकरण" : "Register"}
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "12px",
                padding: "12px 14px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#991B1B",
                fontSize: "13px",
                fontWeight: 600
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ flex: 1 }}>{errorMsg}</span>
              </div>
            )}

            {/* ================= LOGIN FORM ================= */}
            {authMode === "login" && (
              <form onSubmit={handleLoginSubmit}>
                {/* Email or Patient ID */}
                <div className="pl-input-group">
                  <div className="pl-input-label-row">
                    <label className="pl-input-label">
                      {isHindi ? "ईमेल या रोगी आईडी" : "EMAIL OR PATIENT ID"}
                    </label>
                  </div>
                  <div className="pl-input-wrapper">
                    <span className="pl-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="pl-text-input"
                      placeholder={isHindi ? "अपना ईमेल या रोगी आईडी दर्ज करें" : "Enter your email or patient ID"}
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="pl-input-group">
                  <div className="pl-input-label-row">
                    <label className="pl-input-label">
                      {isHindi ? "पासवर्ड" : "PASSWORD"}
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowForgotModal(true); setForgotSuccess(false); setForgotEmail(loginIdentifier); }}
                      className="pl-forgot-link"
                    >
                      {isHindi ? "पासवर्ड भूल गए?" : "Forgot password?"}
                    </button>
                  </div>
                  <div className="pl-input-wrapper">
                    <span className="pl-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="pl-text-input"
                      placeholder={isHindi ? "अपना पासवर्ड दर्ज करें" : "Enter your password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      style={{ paddingRight: "42px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pl-eye-btn"
                      tabIndex={-1}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Primary Button */}
                <button type="submit" disabled={loading} className="pl-primary-btn">
                  {loading ? (
                    <span>{isHindi ? "साइन इन हो रहा है..." : "Signing in..."}</span>
                  ) : (
                    <>
                      <span>{isHindi ? "मेरे पोर्टल में साइन इन करें" : "Sign in to my portal"}</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                {/* Registration Link */}
                <div className="pl-register-row">
                  <span>{isHindi ? "रोगी पोर्टल पर नए हैं?" : "New to the patient portal?"}</span>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("signup-patient"); setErrorMsg(null); }}
                    className="pl-register-link"
                  >
                    {isHindi ? "खाता बनाएं" : "Create an account"}
                  </button>
                </div>
              </form>
            )}

            {/* ================= REGISTRATION FORM ================= */}
            {authMode.startsWith("signup") && (
              <form onSubmit={handleRegisterSubmit}>
                {/* Account Type Selection */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup-patient")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: authMode === "signup-patient" ? "2px solid #0284C7" : "1.5px solid #E2E8F0",
                      background: authMode === "signup-patient" ? "#F0F9FF" : "#FFFFFF",
                      color: authMode === "signup-patient" ? "#0369A1" : "#475569",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <div>{isHindi ? "👤 रोगी खाता" : "👤 Patient"}</div>
                    <div style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                      {isHindi ? "अपॉइंटमेंट और कतार" : "Queue & Appointments"}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup-superadmin")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: authMode === "signup-superadmin" ? "2px solid #0284C7" : "1.5px solid #E2E8F0",
                      background: authMode === "signup-superadmin" ? "#F0F9FF" : "#FFFFFF",
                      color: authMode === "signup-superadmin" ? "#0369A1" : "#475569",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <div>{isHindi ? "🏥 अस्पताल मालिक" : "🏥 Hospital Owner"}</div>
                    <div style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                      {isHindi ? "सुपर एडमिन टेनेंट" : "Super Admin Tenant"}
                    </div>
                  </button>
                </div>

                {/* Full Name */}
                <div className="pl-input-group">
                  <div className="pl-input-label-row">
                    <label className="pl-input-label">{isHindi ? "पूरा नाम *" : "FULL NAME *"}</label>
                  </div>
                  <div className="pl-input-wrapper">
                    <input
                      type="text"
                      className="pl-text-input"
                      placeholder={isHindi ? "उदा. राहुल शर्मा" : "e.g. John Doe"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{ paddingLeft: "16px" }}
                    />
                  </div>
                </div>

                {/* Hospital Name (if superadmin) */}
                {authMode === "signup-superadmin" && (
                  <div className="pl-input-group">
                    <div className="pl-input-label-row">
                      <label className="pl-input-label">{isHindi ? "अस्पताल का नाम *" : "HOSPITAL NAME *"}</label>
                    </div>
                    <div className="pl-input-wrapper">
                      <input
                        type="text"
                        className="pl-text-input"
                        placeholder="e.g. Apex Multi-Specialty Hospital"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        required
                        style={{ paddingLeft: "16px" }}
                      />
                    </div>
                  </div>
                )}

                {/* Email & Phone 2-Col */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="pl-input-group">
                    <div className="pl-input-label-row">
                      <label className="pl-input-label">{isHindi ? "ईमेल *" : "EMAIL *"}</label>
                    </div>
                    <div className="pl-input-wrapper">
                      <input
                        type="email"
                        className="pl-text-input"
                        placeholder="name@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        style={{ paddingLeft: "16px" }}
                      />
                    </div>
                  </div>
                  <div className="pl-input-group">
                    <div className="pl-input-label-row">
                      <label className="pl-input-label">{isHindi ? "फोन नंबर" : "PHONE"}</label>
                    </div>
                    <div className="pl-input-wrapper">
                      <input
                        type="tel"
                        className="pl-text-input"
                        placeholder="9876543210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        style={{ paddingLeft: "16px" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="pl-input-group">
                    <div className="pl-input-label-row">
                      <label className="pl-input-label">{isHindi ? "पासवर्ड *" : "PASSWORD *"}</label>
                    </div>
                    <div className="pl-input-wrapper">
                      <input
                        type="password"
                        className="pl-text-input"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        style={{ paddingLeft: "16px" }}
                      />
                    </div>
                  </div>
                  <div className="pl-input-group">
                    <div className="pl-input-label-row">
                      <label className="pl-input-label">{isHindi ? "पासवर्ड की पुष्टि *" : "CONFIRM *"}</label>
                    </div>
                    <div className="pl-input-wrapper">
                      <input
                        type="password"
                        className="pl-text-input"
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                        style={{ paddingLeft: "16px" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Register Submit Button */}
                <button type="submit" disabled={loading} className="pl-primary-btn">
                  {loading ? (
                    <span>{isHindi ? "पंजीकरण हो रहा है..." : "Creating Account..."}</span>
                  ) : (
                    <>
                      <span>{isHindi ? "खाता बनाएं और प्रवेश करें" : "Create Account & Enter"}</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <div className="pl-register-row">
                  <span>{isHindi ? "पहले से खाता है?" : "Already have an account?"}</span>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setErrorMsg(null); }}
                    className="pl-register-link"
                  >
                    {isHindi ? "साइन इन करें" : "Sign in"}
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Accounts Fast Fill */}
            <div className="pl-demo-bar">
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>
                {isHindi ? "त्वरित डेमो:" : "Quick Demo:"}
              </span>
              <button type="button" onClick={() => fillDemoAccount("patient")} className="pl-demo-pill">
                Patient
              </button>
              <button type="button" onClick={() => fillDemoAccount("doctor")} className="pl-demo-pill">
                Doctor
              </button>
              <button type="button" onClick={() => fillDemoAccount("staff")} className="pl-demo-pill">
                Staff
              </button>
              <button type="button" onClick={() => fillDemoAccount("superadmin")} className="pl-demo-pill">
                Super Admin
              </button>
            </div>

            {/* Subtle Security Indicator */}
            <div className="pl-security-badge">
              <span className="pl-security-dot" />
              <span>{isHindi ? "सुरक्षित प्रमाणीकरण से संरक्षित" : "Protected with secure authentication"}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HEALTHCARE DASHBOARD VISUAL SHOWCASE */}
        <div className="pl-right-visual">
          <div className="pl-dashboard-backing">
            
            {/* Top Backing Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#E0F2FE", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                  ⚕
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A" }}>Live Clinical Session</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>Real-time Patient Queue & AI Sync</div>
                </div>
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: 800, padding: "3px 8px", background: "#DCFCE7", color: "#166534", borderRadius: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", animation: "pulseDotLive 2s infinite" }} />
                <span>ONLINE</span>
              </span>
            </div>

            {/* 1. Next Appointment Card */}
            <div className="pl-preview-card pl-card-floating-1">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.8px", color: "#0284C7", background: "#E0F2FE", padding: "2px 8px", borderRadius: "6px" }}>
                  NEXT APPOINTMENT
                </span>
                <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#0F172A" }}>Tue · 9:40 AM</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#F0F9FF", border: "1.5px solid #BAE6FD", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284C7", fontWeight: 800, fontSize: "14px" }}>
                  SM
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A" }}>Dr. Sarah Mitchell</div>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>Cardiology Consultation • Room 204</div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "3px 8px", borderRadius: "6px" }}>
                  ✓ Confirmed
                </span>
              </div>
            </div>

            {/* 2-Column Floating Grid: Queue Status + AI Wait Estimate */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              
              {/* Queue Status Card */}
              <div className="pl-preview-card pl-card-floating-2">
                <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.8px", color: "#475569", display: "block", marginBottom: "6px" }}>
                  QUEUE STATUS
                </span>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>
                  Position #6
                </div>
                <div style={{ fontSize: "11.5px", color: "#0284C7", fontWeight: 700, marginTop: "4px" }}>
                  Estimated wait ~24 min
                </div>
                <div style={{ fontSize: "10.5px", color: "#94A3B8", marginTop: "2px" }}>
                  Counter 3B (OPD Wing)
                </div>
              </div>

              {/* AI Wait Estimate Card */}
              <div className="pl-preview-card pl-card-floating-1" style={{ background: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)", borderColor: "#BAE6FD" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.8px", color: "#0369A1", display: "block", marginBottom: "6px" }}>
                  AI WAIT ESTIMATE
                </span>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#0369A1", letterSpacing: "-0.5px" }}>
                  24–30 min
                </div>
                <div style={{ fontSize: "11.5px", color: "#0284C7", fontWeight: 700, marginTop: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0284C7" }} />
                  <span>Confidence: High</span>
                </div>
                <div style={{ fontSize: "10.5px", color: "#64748B", marginTop: "2px" }}>
                  Clinical ML model v2.5
                </div>
              </div>
            </div>

            {/* 3. Live Message / Status Update Card */}
            <div className="pl-preview-card pl-card-floating-2">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#ECFDF5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  🔔
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.6px", color: "#059669" }}>
                    QUEUE UPDATE
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    You're getting closer. 4 patients ahead
                  </div>
                </div>
                <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 600 }}>Just now</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ================================================================= */}
      {/* 3. MINIMAL PROFESSIONAL FOOTER                                    */}
      {/* ================================================================= */}
      <footer className="pl-footer">
        <div>
          © 2026 {HOSPITAL_CONFIG.name || "City General Hospital"}. {isHindi ? "सर्वाधिकार सुरक्षित।" : "All rights reserved."}
        </div>
        <div className="pl-footer-links">
          <button type="button" onClick={() => setShowHelpModal(true)} className="pl-footer-link">
            {isHindi ? "गोपनीयता नीति" : "Privacy Policy"}
          </button>
          <button type="button" onClick={() => setShowHelpModal(true)} className="pl-footer-link">
            {isHindi ? "सेवा की शर्तें" : "Terms of Service"}
          </button>
          <button type="button" onClick={() => setShowSupportModal(true)} className="pl-footer-link">
            {isHindi ? "पहुंच क्षमता" : "Accessibility"}
          </button>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* 4. INTERACTIVE MODALS (HELP, PROVIDERS, SUPPORT, FORGOT PASSWORD) */}
      {/* ================================================================= */}
      
      {/* Help Center Modal */}
      {showHelpModal && (
        <div style={modalOverlayStyle} onClick={() => setShowHelpModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
                {isHindi ? "सहायता केंद्र एवं अक्सर पूछे जाने वाले प्रश्न" : "Patient Portal Help Center"}
              </h3>
              <button type="button" onClick={() => setShowHelpModal(false)} style={modalCloseBtnStyle}>✕</button>
            </div>
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px", fontSize: "13.5px", color: "#475569" }}>
              <div style={{ padding: "12px 14px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>How do I join the live queue?</div>
                <div>Sign in to your patient account and select "Instant Walk-In Ticket" on the dashboard. Choose your department and submit symptoms.</div>
              </div>
              <div style={{ padding: "12px 14px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>Can I book for my family members?</div>
                <div>Yes. After logging in, switch or add family member profiles from the top-right profile avatar.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Find a Provider Modal */}
      {showProviderModal && (
        <div style={modalOverlayStyle} onClick={() => setShowProviderModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
                {isHindi ? "चिकित्सक एवं विशेषज्ञ खोजें" : "Find a Medical Provider"}
              </h3>
              <button type="button" onClick={() => setShowProviderModal(false)} style={modalCloseBtnStyle}>✕</button>
            </div>
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { name: "Dr. Sarah Mitchell", dept: "Cardiology", room: "Desk #2 (OPD Floor 2)", status: "Available" },
                { name: "Dr. Rajesh Gupta", dept: "General Medicine", room: "Desk #1 (Ground Floor)", status: "On Duty" },
                { name: "Dr. Elena Rostova", dept: "Pediatrics & Child Care", room: "Desk #4 (Wing B)", status: "Available" },
                { name: "Dr. Alok Verma", dept: "Orthopedics & Trauma", room: "Desk #3 (Emergency)", status: "Available" },
              ].map((doc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A" }}>{doc.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748B" }}>{doc.dept} • {doc.room}</div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", background: "#DCFCE7", color: "#166534", borderRadius: "6px" }}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div style={modalOverlayStyle} onClick={() => setShowSupportModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
                {isHindi ? "अस्पताल सहायता एवं आपातकालीन हेल्पलाइन" : "Hospital Help & Desk Support"}
              </h3>
              <button type="button" onClick={() => setShowSupportModal(false)} style={modalCloseBtnStyle}>✕</button>
            </div>
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px", color: "#475569" }}>
              <div style={{ padding: "14px", background: "#EFF6FF", borderRadius: "12px", border: "1px solid #BFDBFE" }}>
                <div style={{ fontWeight: 800, color: "#1E40AF", fontSize: "14px", marginBottom: "4px" }}>📞 24/7 Patient Care Helpline</div>
                <div style={{ fontSize: "13px", color: "#1E3A8A" }}>+91 (011) 2658-8500 / Toll Free: 1800-11-2345</div>
              </div>
              <div style={{ padding: "14px", background: "#FEF2F2", borderRadius: "12px", border: "1px solid #FECACA" }}>
                <div style={{ fontWeight: 800, color: "#991B1B", fontSize: "14px", marginBottom: "4px" }}>🚨 Emergency & Trauma Hotline</div>
                <div style={{ fontSize: "13px", color: "#7F1D1D" }}>Call 108 or direct line: +91 (011) 2659-6666</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={modalOverlayStyle} onClick={() => setShowForgotModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
                {isHindi ? "पासवर्ड रीसेट करें" : "Reset Portal Password"}
              </h3>
              <button type="button" onClick={() => setShowForgotModal(false)} style={modalCloseBtnStyle}>✕</button>
            </div>
            {forgotSuccess ? (
              <div style={{ marginTop: "16px", padding: "16px", background: "#ECFDF5", borderRadius: "12px", border: "1px solid #A7F3D0", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "6px" }}>✉️</div>
                <div style={{ fontWeight: 800, color: "#065F46", fontSize: "14px" }}>Password reset instructions sent!</div>
                <div style={{ fontSize: "12.5px", color: "#047857", marginTop: "4px" }}>
                  Please check your inbox at <b>{forgotEmail || "your email"}</b> to set a new password.
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="pl-primary-btn"
                  style={{ marginTop: "16px", height: "40px" }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 14px 0" }}>
                  Enter your registered email address and we'll send a secure password reset link.
                </p>
                <div className="pl-input-group">
                  <label className="pl-input-label">EMAIL ADDRESS</label>
                  <div className="pl-input-wrapper" style={{ marginTop: "6px" }}>
                    <input
                      type="email"
                      className="pl-text-input"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      style={{ paddingLeft: "14px" }}
                    />
                  </div>
                </div>
                <button type="submit" className="pl-primary-btn" style={{ marginTop: "12px" }}>
                  Send Reset Link →
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
  boxSizing: "border-box"
};

const modalBoxStyle = {
  background: "#FFFFFF",
  borderRadius: "20px",
  padding: "24px 28px",
  maxWidth: "480px",
  width: "100%",
  boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.25)",
  border: "1px solid #E2E8F0",
  boxSizing: "border-box"
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #F1F5F9",
  paddingBottom: "12px"
};

const modalCloseBtnStyle = {
  background: "#F1F5F9",
  border: "none",
  borderRadius: "8px",
  width: "28px",
  height: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#64748B",
  fontWeight: 700
};

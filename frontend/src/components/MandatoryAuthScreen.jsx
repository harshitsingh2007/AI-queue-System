/**
 * MandatoryAuthScreen.jsx
 * -----------------------
 * Ultra-Modern Split-Screen Healthcare Authentication Experience.
 * Theme: Deep Forest & Clinical Emerald (#064E3B, #043828) matching the Patient Dashboard.
 *
 * Professional UI/UX:
 * - 100% SVG Vector Iconography (Zero emojis).
 * - Deep rich clinical green palette matching the patient page.
 * - Unified single login gateway (Patients, Doctors, Staff, Admins).
 * - Distinct, dedicated options for signup (Patient vs Hospital Owner / Super Admin).
 * - Bilingual support (English / Hindi).
 * - 256-bit SSL encrypted security assurance.
 */

import React, { useState } from "react";
import { API_BASE } from "../config/hospitalConfig";

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

  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const isHindi = language === "hi";

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
              : "Authentication failed. Please check your credentials.")
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

  return (
    <div className="auth-page-wrapper" style={pageWrapperStyle}>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-page-wrapper {
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
          box-sizing: border-box;
        }
        .auth-split-card {
          animation: fadeInSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .auth-submit-btn {
          transition: all 0.2s ease;
        }
        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px -4px rgba(6, 78, 59, 0.45);
        }
        .auth-tab-btn {
          transition: all 0.15s ease;
        }
        .auth-kiosk-btn {
          transition: all 0.2s ease;
        }
        .auth-kiosk-btn:hover {
          background: rgba(255, 255, 255, 0.18) !important;
          border-color: rgba(52, 211, 153, 0.4) !important;
        }
        .auth-account-type-card {
          transition: all 0.2s ease;
        }
        .auth-account-type-card:hover {
          border-color: #064E3B !important;
        }
        .auth-form-row-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .auth-right-panel::-webkit-scrollbar {
          width: 5px;
        }
        .auth-right-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .auth-right-panel::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }
        @media (max-width: 960px) {
          .auth-page-wrapper {
            height: auto !important;
            min-height: 100vh !important;
            overflow-y: auto !important;
            padding: 16px 12px !important;
          }
          .auth-split-card {
            max-height: none !important;
          }
          .auth-grid-container {
            grid-template-columns: 1fr !important;
          }
          .auth-left-hero {
            padding: 24px 20px !important;
          }
          .auth-right-panel {
            padding: 24px 20px !important;
            overflow-y: visible !important;
          }
        }
        @media (max-width: 600px) {
          .auth-form-row-2col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Main Dual-Column Showcase Card */}
      <div className="auth-split-card auth-grid-container" style={splitCardStyle}>
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Deep Clinical Green Showcase (#064E3B)       */}
        {/* ========================================================= */}
        <div className="auth-left-hero" style={leftHeroStyle}>
          {/* Ambient Decorative Glows */}
          <div style={ambientOrbTopStyle} />
          <div style={ambientOrbBottomStyle} />

          {/* Top Brand Identity */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
              <div style={brandShieldStyle}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M12 8v8"/>
                  <path d="M8 12h8"/>
                </svg>
              </div>
              <div>
                <h1 style={brandTitleStyle}>
                  {isHindi ? "सिटी जनरल अस्पताल" : "City General Hospital"}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={nabhBadgeStyle}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span>{isHindi ? "एनएबीएच गोल्ड प्रमाणित" : "NABH GOLD ACCREDITED"}</span>
                  </span>
                  <span style={triageBadgeStyle}>
                    {isHindi ? "एआई ट्रायज v2.0" : "AI CLINICAL TRIAGE v2.0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Headline & Value Proposition */}
            <div style={{ marginTop: "10px", marginBottom: "12px" }}>
              <h2 style={heroHeadlineStyle}>
                {isHindi
                  ? "स्मार्ट डिजिटल स्वास्थ्य एवं लाइव कतार प्रबंधन"
                  : "Intelligent Patient Flow & Digital Care Coordination"}
              </h2>
              <p style={heroSubtextStyle}>
                {isHindi
                  ? "अस्पताल में प्रतीक्षा समय को 65% तक कम करने वाली अगली पीढ़ी की स्वास्थ्य सेवा प्रणाली। लाइव डिजिटल टोकन और विशेषज्ञ परामर्श तक त्वरित पहुँच।"
                  : "Next-generation clinical queue ecosystem reducing hospital wait times by 65% with real-time AI triage and integrated digital tokens."}
              </p>
            </div>

            {/* 4 Feature Highlights Grid (Clean SVG Icons) */}
            <div style={featureGridStyle}>
              {/* Feature 1: AI Wait Prediction */}
              <div style={featureCardStyle}>
                <div style={featureIconBoxStyle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div>
                  <h4 style={featureTitleStyle}>
                    {isHindi ? "एआई प्रतीक्षा अनुमान" : "AI Wait Prediction"}
                  </h4>
                  <p style={featureDescStyle}>
                    {isHindi ? "क्लिनिकल प्राथमिकता आधारित स्वचालित कतार" : "Dynamic priority scoring with slot estimation"}
                  </p>
                </div>
              </div>

              {/* Feature 2: Multi-Desk Sync */}
              <div style={featureCardStyle}>
                <div style={featureIconBoxStyle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    <line x1="9" y1="12" x2="15" y2="12"/>
                    <line x1="9" y1="16" x2="13" y2="16"/>
                  </svg>
                </div>
                <div>
                  <h4 style={featureTitleStyle}>
                    {isHindi ? "बहु-विभागीय समन्वय" : "Multi-Desk Sync"}
                  </h4>
                  <p style={featureDescStyle}>
                    {isHindi ? "ओपीडी, आपातकालीन, लैब और फार्मेसी का सीधा जुड़ाव" : "Unified OPD, Emergency, Labs & Pharmacy desk flow"}
                  </p>
                </div>
              </div>

              {/* Feature 3: Family Health Profiles */}
              <div style={featureCardStyle}>
                <div style={featureIconBoxStyle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <h4 style={featureTitleStyle}>
                    {isHindi ? "परिवार एवं आश्रित प्रोफ़ाइल" : "Family Health Profiles"}
                  </h4>
                  <p style={featureDescStyle}>
                    {isHindi ? "एक ही खाते से पूरे परिवार के लिए अपॉइंटमेंट" : "Manage bookings & digital passes for dependents"}
                  </p>
                </div>
              </div>

              {/* Feature 4: 256-Bit Security */}
              <div style={featureCardStyle}>
                <div style={featureIconBoxStyle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div>
                  <h4 style={featureTitleStyle}>
                    {isHindi ? "256-बिट सुरक्षित टोकन" : "HIPAA & 256-bit Security"}
                  </h4>
                  <p style={featureDescStyle}>
                    {isHindi ? "पूर्णतः एन्क्रिप्टेड और सुरक्षित डिजिटल पास" : "End-to-end encrypted medical sessions"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Hospital Live Pulse Bar & Public Kiosk Button */}
          <div style={{ position: "relative", zIndex: 2, marginTop: "12px" }}>
            <div style={livePulseCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={pulseDotStyle} />
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#ECFDF5" }}>
                  {isHindi ? "क्लिनिकल पल्स:" : "Clinical Pulse:"}
                </span>
                <span style={{ fontSize: "11px", color: "#A7F3D0", fontWeight: 600 }}>
                  12 {isHindi ? "सक्रिय डेस्क" : "Active Desks"} • 4.2m {isHindi ? "औसत प्रतीक्षा" : "Avg Wait"}
                </span>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#34D399", background: "rgba(3, 43, 31, 0.6)", padding: "2px 6px", borderRadius: "6px", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
                24/7 {isHindi ? "आपातकालीन सेवा सक्रिय" : "Emergency Ready"}
              </span>
            </div>

            {/* Public TV Kiosk Button */}
            {navigateTo && (
              <button
                type="button"
                onClick={() => navigateTo("kiosk")}
                className="auth-kiosk-btn"
                style={tvKioskShortcutStyle}
                title={isHindi ? "सार्वजनिक प्रतीक्षा कक्ष टीवी स्क्रीन देखें" : "View Public Waiting Room TV Kiosk"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                  <polyline points="17 2 12 7 7 2"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: "11.5px" }}>
                  {isHindi ? "सार्वजनिक प्रतीक्षा कक्ष टीवी कियोस्क देखें →" : "View Public Waiting Room TV Kiosk →"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Ultra-Clean Healthcare Auth Portal         */}
        {/* ========================================================= */}
        <div className="auth-right-panel" style={rightPanelStyle}>
          
          {/* Top Control Bar: Mode Toggle & Language Selector */}
          <div style={topControlBarStyle}>
            {/* Sign In vs Register Toggle */}
            <div style={modeToggleContainerStyle}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setErrorMsg(null);
                }}
                className="auth-tab-btn"
                style={modeToggleBtnStyle(authMode === "login")}
              >
                {isHindi ? "साइन इन" : "Sign In"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup-patient");
                  setErrorMsg(null);
                }}
                className="auth-tab-btn"
                style={modeToggleBtnStyle(authMode.startsWith("signup"))}
              >
                {isHindi ? "पंजीकरण" : "Register"}
              </button>
            </div>

            {/* Language Selector Pill */}
            {setLanguage && (
              <button
                type="button"
                onClick={() => setLanguage(isHindi ? "en" : "hi")}
                style={langToggleBtnStyle}
                title={isHindi ? "Switch to English" : "हिंदी में बदलें"}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#064E3B" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: "11px", color: "#064E3B" }}>
                  {isHindi ? "हिंदी (HI)" : "English (EN)"}
                </span>
              </button>
            )}
          </div>

          {/* ================= LOGIN VIEW (SINGLE UNIFIED) ================= */}
          {authMode === "login" && (
            <div style={{ marginTop: "12px" }}>
              {/* Header Title */}
              <div style={{ marginBottom: "12px" }}>
                <h3 style={authTitleStyle}>
                  {isHindi ? "पोर्टल में साइन इन करें" : "Sign In to Healthcare Portal"}
                </h3>
                <p style={authSubtitleStyle}>
                  {isHindi
                    ? "अपने ईमेल पते या आवंटित आईडी (उदा. DOC-101, ADM-001) से लॉगिन करें"
                    : "Enter your registered Email Address or assigned Employee/Doctor ID"}
                </p>
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div style={errorAlertStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontSize: "12.5px", fontWeight: 600 }}>{errorMsg}</span>
                </div>
              )}

              {/* Single Unified Login Form */}
              <form onSubmit={handleLoginSubmit} style={{ marginTop: "8px" }}>
                {/* Identifier Input */}
                <div style={{ marginBottom: "10px" }}>
                  <label style={inputLabelStyle}>
                    {isHindi ? "ईमेल पता या आवंटित आईडी *" : "Email Address or Assigned ID *"}
                  </label>
                  <div style={inputContainerStyle}>
                    <span style={inputIconStyle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder={isHindi ? "name@hospital.com या DOC-101" : "name@hospital.com or DOC-101"}
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      style={{ ...textInputStyle, paddingLeft: "38px" }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ ...inputLabelStyle, margin: 0 }}>
                      {isHindi ? "पासवर्ड *" : "Password *"}
                    </label>
                    <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 600 }}>
                      {isHindi ? "256-बिट सुरक्षित" : "256-Bit Encrypted"}
                    </span>
                  </div>
                  <div style={inputContainerStyle}>
                    <span style={inputIconStyle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      style={{ ...textInputStyle, paddingLeft: "38px", paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={passwordEyeBtnStyle}
                      tabIndex={-1}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="auth-submit-btn"
                  style={primarySubmitBtnStyle}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <span style={spinnerStyle} />
                      <span>{isHindi ? "प्रमाणीकरण हो रहा है..." : "Signing in securely..."}</span>
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <span>{isHindi ? "साइन इन करें" : "Sign In to Healthcare Portal"}</span>
                      <span>→</span>
                    </span>
                  )}
                </button>
              </form>

              {/* Registration Prompt */}
              <div style={regFooterPromptStyle}>
                <span>{isHindi ? "नया खाता बनाना चाहते हैं?" : "Don't have an account yet?"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup-patient");
                    setErrorMsg(null);
                  }}
                  style={textLinkBtnStyle}
                >
                  {isHindi ? "यहाँ पंजीकरण करें →" : "Register here →"}
                </button>
              </div>
            </div>
          )}

          {/* ================= REGISTRATION VIEW (SEPARATE OPTIONS) ================= */}
          {authMode.startsWith("signup") && (
            <div style={{ marginTop: "18px" }}>
              {/* Header Title */}
              <div style={{ marginBottom: "16px" }}>
                <h3 style={authTitleStyle}>
                  {authMode === "signup-superadmin"
                    ? isHindi ? "अस्पताल नेटवर्क पंजीकरण" : "Register Hospital Network"
                    : isHindi ? "मरीज़ खाता पंजीकरण" : "Create Patient Account"}
                </h3>
                <p style={authSubtitleStyle}>
                  {authMode === "signup-superadmin"
                    ? isHindi
                      ? "अपने पूरे अस्पताल नेटवर्क और डॉक्टरों को प्रबंधित करने हेतु खाता बनाएं"
                      : "Provision your dedicated hospital tenant with full administrative controls"
                    : isHindi
                      ? "त्वरित कतार टिकट और विशेषज्ञ डॉक्टरों के समय आरक्षण हेतु"
                      : "Instant digital passes, priority triage, and family health booking"}
                </p>
              </div>

              {/* Separate Options for Registration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup-patient")}
                  className="auth-account-type-card"
                  style={accountTypeCardStyle(authMode === "signup-patient")}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={authMode === "signup-patient" ? "#064E3B" : "#64748B"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 800, fontSize: "12px", color: authMode === "signup-patient" ? "#064E3B" : "#334155" }}>
                      {isHindi ? "मरीज़ खाता" : "Patient Account"}
                    </div>
                    <span style={{ fontSize: "10px", color: "#64748B" }}>
                      {isHindi ? "स्वयं व परिवार के लिए" : "Self & Family Care"}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode("signup-superadmin")}
                  className="auth-account-type-card"
                  style={accountTypeCardStyle(authMode === "signup-superadmin")}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={authMode === "signup-superadmin" ? "#064E3B" : "#64748B"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <circle cx="12" cy="11" r="3"/>
                  </svg>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 800, fontSize: "12px", color: authMode === "signup-superadmin" ? "#064E3B" : "#334155" }}>
                      {isHindi ? "अस्पताल नेटवर्क" : "Hospital Owner"}
                    </div>
                    <span style={{ fontSize: "10px", color: "#64748B" }}>
                      {isHindi ? "सुपर एडमिन स्वामित्व" : "Super Admin Tenant"}
                    </span>
                  </div>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div style={errorAlertStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontSize: "12.5px", fontWeight: 600 }}>{errorMsg}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleRegisterSubmit}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={inputLabelStyle}>{isHindi ? "पूरा कानूनी नाम *" : "Full Legal Name *"}</label>
                  <input
                    type="text"
                    placeholder={authMode === "signup-superadmin" ? "Dr. Alexander Wright" : "Rahul Sharma"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={textInputStyle}
                  />
                </div>

                <div className="auth-form-row-2col" style={{ marginBottom: "12px" }}>
                  <div>
                    <label style={inputLabelStyle}>{isHindi ? "ईमेल पता *" : "Email Address *"}</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      style={textInputStyle}
                    />
                  </div>
                  <div>
                    <label style={inputLabelStyle}>{isHindi ? "मोबाइल नंबर" : "Phone Number"}</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      style={textInputStyle}
                    />
                  </div>
                </div>

                {authMode === "signup-superadmin" && (
                  <div style={{ marginBottom: "12px" }}>
                    <label style={inputLabelStyle}>{isHindi ? "अस्पताल / क्लिनिक का नाम *" : "Hospital / Healthcare Facility Name *"}</label>
                    <input
                      type="text"
                      placeholder="City Healthcare Institute"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      required
                      style={textInputStyle}
                    />
                  </div>
                )}

                <div className="auth-form-row-2col" style={{ marginBottom: "18px" }}>
                  <div>
                    <label style={inputLabelStyle}>{isHindi ? "पासवर्ड *" : "Password *"}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      style={textInputStyle}
                    />
                  </div>
                  <div>
                    <label style={inputLabelStyle}>{isHindi ? "पासवर्ड की पुष्टि *" : "Confirm Password *"}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      style={textInputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-submit-btn"
                  style={primarySubmitBtnStyle}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <span style={spinnerStyle} />
                      <span>{isHindi ? "खाता बनाया जा रहा है..." : "Creating account..."}</span>
                    </span>
                  ) : (
                    <span>
                      {authMode === "signup-superadmin"
                        ? isHindi ? "सुपर एडमिन व अस्पताल बनाएं" : "Create Super Admin & Hospital"
                        : isHindi ? "मरीज़ खाता पंजीकृत करें" : "Create Patient Account"}
                    </span>
                  )}
                </button>

                <div style={{ textAlign: "center", marginTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setErrorMsg(null);
                    }}
                    style={textLinkBtnStyle}
                  >
                    ← {isHindi ? "वापस साइन इन पर जाएं" : "Already registered? Sign In"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security & Healthcare Compliance Footer */}
          <div style={securityFooterStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>256-Bit SSL Encrypted</span>
            </div>
            <span>•</span>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{isHindi ? "हेल्पलाइन: 108" : "Helpline: 108"}</span>
            </div>
            <span>•</span>
            <span>NABH Accredited</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// =========================================================
// STYLING DEFINITIONS (Deep Clinical Green Palette #064E3B)
// =========================================================

const pageWrapperStyle = {
  height: "100vh",
  maxHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 18px",
  boxSizing: "border-box",
  background: "linear-gradient(135deg, #F0FDF4 0%, #E6F4EA 50%, #DCEDE1 100%)",
  position: "relative",
  overflow: "hidden",
};

const splitCardStyle = {
  maxWidth: "1120px",
  width: "100%",
  maxHeight: "calc(100vh - 28px)",
  display: "grid",
  gridTemplateColumns: "1.08fr 1fr",
  background: "#FFFFFF",
  borderRadius: "22px",
  boxShadow: "0 20px 48px -12px rgba(6, 78, 59, 0.18), 0 4px 14px rgba(0, 0, 0, 0.04)",
  border: "1px solid rgba(6, 78, 59, 0.16)",
  overflow: "hidden",
  position: "relative",
  zIndex: 1,
};

// Left Column Styles (Deep Forest Green #064E3B matching Patient Portal)
const leftHeroStyle = {
  background: "linear-gradient(155deg, #064E3B 0%, #043828 65%, #02261b 100%)",
  color: "#FFFFFF",
  padding: "24px 28px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "relative",
  overflow: "hidden",
  borderRight: "1px solid rgba(16, 185, 129, 0.2)",
};

const ambientOrbTopStyle = {
  position: "absolute",
  top: "-70px",
  right: "-70px",
  width: "250px",
  height: "250px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)",
  pointerEvents: "none",
};

const ambientOrbBottomStyle = {
  position: "absolute",
  bottom: "-50px",
  left: "-50px",
  width: "220px",
  height: "220px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)",
  pointerEvents: "none",
};

const brandShieldStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #047857 0%, #064E3B 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 6px 18px rgba(4, 120, 87, 0.35)",
  border: "1.5px solid rgba(52, 211, 153, 0.4)",
  flexShrink: 0,
};

const brandTitleStyle = {
  margin: "0 0 2px 0",
  fontSize: "19px",
  fontWeight: 900,
  letterSpacing: "-0.4px",
  color: "#FFFFFF",
};

const nabhBadgeStyle = {
  fontSize: "10px",
  fontWeight: 800,
  padding: "2px 8px",
  borderRadius: "6px",
  background: "rgba(6, 78, 59, 0.6)",
  color: "#ECFDF5",
  border: "1px solid rgba(52, 211, 153, 0.3)",
  letterSpacing: "0.5px",
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
};

const triageBadgeStyle = {
  fontSize: "10px",
  fontWeight: 800,
  padding: "2px 8px",
  borderRadius: "6px",
  background: "rgba(52, 211, 153, 0.15)",
  color: "#6EE7B7",
  border: "1px solid rgba(52, 211, 153, 0.3)",
  letterSpacing: "0.4px",
};

const heroHeadlineStyle = {
  margin: "0 0 4px 0",
  fontSize: "16px",
  fontWeight: 800,
  lineHeight: 1.3,
  color: "#FFFFFF",
  letterSpacing: "-0.2px",
};

const heroSubtextStyle = {
  margin: 0,
  fontSize: "11.5px",
  lineHeight: 1.45,
  color: "rgba(220, 245, 235, 0.85)",
  fontWeight: 400,
};

const featureGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
};

const featureCardStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "7px 10px",
  borderRadius: "10px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(52, 211, 153, 0.15)",
  backdropFilter: "blur(6px)",
};

const featureIconBoxStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  background: "rgba(6, 78, 59, 0.6)",
  border: "1px solid rgba(52, 211, 153, 0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const featureTitleStyle = {
  margin: "0 0 2px 0",
  fontSize: "11px",
  fontWeight: 800,
  color: "#FFFFFF",
};

const featureDescStyle = {
  margin: 0,
  fontSize: "10px",
  color: "rgba(209, 250, 229, 0.85)",
  lineHeight: 1.25,
};

const livePulseCardStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 10px",
  borderRadius: "10px",
  background: "rgba(3, 43, 31, 0.85)",
  border: "1px solid rgba(16, 185, 129, 0.25)",
  marginBottom: "8px",
  flexWrap: "wrap",
  gap: "6px",
};

const pulseDotStyle = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: "#10B981",
  display: "inline-block",
  boxShadow: "0 0 8px #10B981",
  animation: "pulseGlow 2s infinite ease-in-out",
};

const tvKioskShortcutStyle = {
  width: "100%",
  padding: "7px 12px",
  borderRadius: "10px",
  background: "rgba(255, 255, 255, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  color: "#FFFFFF",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

// Right Panel Styles
const rightPanelStyle = {
  padding: "22px 28px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  background: "#FFFFFF",
  overflowY: "auto",
  maxHeight: "100%",
  boxSizing: "border-box",
};

const topControlBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  paddingBottom: "10px",
  borderBottom: "1px solid #F1F5F9",
};

const modeToggleContainerStyle = {
  display: "flex",
  background: "#F1F5F9",
  padding: "3px",
  borderRadius: "10px",
  border: "1px solid #E2E8F0",
};

const modeToggleBtnStyle = (isActive) => ({
  padding: "5px 14px",
  borderRadius: "7px",
  border: "none",
  background: isActive ? "#064E3B" : "transparent",
  color: isActive ? "#FFFFFF" : "#64748B",
  fontWeight: isActive ? 800 : 600,
  fontSize: "11.5px",
  cursor: "pointer",
  boxShadow: isActive ? "0 2px 6px rgba(6, 78, 59, 0.25)" : "none",
});

const langToggleBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  padding: "5px 10px",
  borderRadius: "8px",
  border: "1px solid #A7F3D0",
  background: "#ECFDF5",
  cursor: "pointer",
};

const authTitleStyle = {
  margin: "0 0 3px 0",
  fontSize: "19px",
  fontWeight: 800,
  color: "#064E3B",
  letterSpacing: "-0.3px",
};

const authSubtitleStyle = {
  margin: 0,
  fontSize: "11.5px",
  color: "#64748B",
  lineHeight: 1.35,
};

const errorAlertStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "9px",
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#B91C1C",
  marginBottom: "10px",
};

const inputLabelStyle = {
  display: "block",
  fontSize: "11.5px",
  fontWeight: 700,
  color: "#064E3B",
  marginBottom: "3px",
};

const inputContainerStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const inputIconStyle = {
  position: "absolute",
  left: "12px",
  display: "flex",
  alignItems: "center",
  pointerEvents: "none",
};

const textInputStyle = {
  width: "100%",
  padding: "8.5px 12px",
  borderRadius: "9px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  fontSize: "13px",
  color: "#0F172A",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const passwordEyeBtnStyle = {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px",
};

const primarySubmitBtnStyle = {
  width: "100%",
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #064E3B 0%, #043828 100%)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(6, 78, 59, 0.3)",
  letterSpacing: "0.2px",
};

const regFooterPromptStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  marginTop: "10px",
  fontSize: "11.5px",
  color: "#64748B",
};

const textLinkBtnStyle = {
  background: "none",
  border: "none",
  color: "#064E3B",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "12px",
  padding: 0,
};

const accountTypeCardStyle = (isSelected) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "12px",
  border: isSelected ? "1.5px solid #064E3B" : "1px solid #E2E8F0",
  background: isSelected ? "#F0FDF4" : "#F8FAFC",
  cursor: "pointer",
});

const securityFooterStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontSize: "10.5px",
  color: "#94A3B8",
  fontWeight: 600,
  marginTop: "10px",
  paddingTop: "8px",
  borderTop: "1px solid #F1F5F9",
  flexWrap: "wrap",
};

const spinnerStyle = {
  width: "14px",
  height: "14px",
  border: "2px solid rgba(255, 255, 255, 0.3)",
  borderTopColor: "#FFFFFF",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

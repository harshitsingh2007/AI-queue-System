/**
 * Header.jsx
 * ----------
 * User Dashboard Header matching IMAGE 2.
 * Features:
 * - Hospital shield/logo with white medical cross
 * - City General Hospital & "Care you can trust"
 * - Navigation links: Home, My Appointments, History, About Us, Contact
 * - Language selector pill dropdown (EN / हिंदी)
 * - Patient profile dropdown (Patient: user / rahul, role badge, navigation, logout)
 * - Interactive About Us and Contact modals
 */

import React, { useState, useRef, useEffect } from "react";
import { HOSPITAL_CONFIG } from "../config/hospitalConfig";
import { t } from "../utils/i18n";

export default function Header({
  currentUser,
  activePage,
  navigateTo,
  handleLogout,
  setShowAuthModal,
  socketConnected = true,
  language = "en",
  setLanguage,
  currentTab = "walkin",
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const profileRef = useRef(null);
  const langRef = useRef(null);

  const isAdmin = currentUser && currentUser.role === "admin";
  const username = currentUser ? currentUser.username : "user";

  // Derive tab from prop or URL query parameter
  const getEffectiveTab = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (urlTab) return urlTab.toLowerCase();
    }
    return currentTab || "walkin";
  };

  const effectiveTab = getEffectiveTab();
  const isHomeActive = activePage === "patient" && (effectiveTab === "walkin" || effectiveTab === "book" || !effectiveTab);
  const isMyAppointmentsActive = activePage === "patient" && effectiveTab === "my_apts";
  const isHistoryActive = activePage === "patient" && effectiveTab === "history";

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header style={headerContainerStyle} className="user-dashboard-header">
        <style>{`
          .user-dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            margin-bottom: 24px;
            background: transparent;
            position: relative;
            flex-wrap: wrap;
            gap: 16px;
          }

          .header-nav-btn {
            padding: 7px 14px;
            border-radius: 9999px;
            color: #334155;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            background: transparent;
            transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
            text-decoration: none;
            outline: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            user-select: none;
          }

          .header-nav-btn:hover {
            color: #044E3B;
            background: #F1F5F9;
          }

          .header-nav-btn.active {
            color: #044E3B;
            background: #E6F4EA;
            font-weight: 700;
          }

          .header-pill-btn {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px 13px;
            border-radius: 10px;
            background: #FFFFFF;
            border: 1px solid #CBD5E1;
            color: #0F172A;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.18s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
            outline: none;
            user-select: none;
          }

          .header-pill-btn:hover {
            border-color: #059669;
            background: #F8FAFC;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          }

          .header-dropdown-menu {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            background: #FFFFFF;
            border-radius: 14px;
            border: 1px solid #E2E8F0;
            box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04);
            min-width: 220px;
            z-index: 100;
            padding: 6px;
            animation: fadeInDown 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .header-dropdown-item {
            width: 100%;
            padding: 9px 12px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 12.5px;
            font-weight: 600;
            color: #334155;
            background: transparent;
            border: none;
            cursor: pointer;
            text-align: left;
            transition: all 0.15s ease;
          }

          .header-dropdown-item:hover {
            background: #F1F5F9;
            color: #044E3B;
          }

          .header-dropdown-item.active {
            background: #ECFDF5;
            color: #047857;
            font-weight: 700;
          }

          .header-dropdown-item.danger {
            color: #DC2626;
          }

          .header-dropdown-item.danger:hover {
            background: #FEF2F2;
            color: #B91C1C;
          }

          .header-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            animation: fadeIn 0.15s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .header-modal-content {
            background: #FFFFFF;
            border-radius: 20px;
            max-width: 480px;
            width: 100%;
            padding: 28px;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
            border: 1px solid #E2E8F0;
            position: relative;
            animation: modalScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes modalScaleUp {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>

        {/* 1. Left: Hospital Shield & Title (Image 2 style) */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
          onClick={() => navigateTo("patient", "walkin")}
          title="City General Hospital - Home"
        >
          <div style={shieldLogoContainerStyle}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.5L4.5 5.5v5.5c0 5.1 3.2 9.85 7.5 11 4.3-1.15 7.5-5.9 7.5-11V5.5L12 2.5z"
                fill="#044E3B"
              />
              <path
                d="M12 7.5v9M7.5 12h9"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "16.5px", color: "#064E3B", letterSpacing: "-0.3px", lineHeight: "1.2" }}>
              {HOSPITAL_CONFIG.name}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500, marginTop: "1px" }}>
              Care you can trust
            </div>
          </div>
        </div>

        {/* 2. Center: Navigation Links (Matching Image 2) */}
        <nav style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
          {/* Home */}
          <button
            type="button"
            onClick={() => navigateTo("patient", "walkin")}
            className={`header-nav-btn ${isHomeActive ? "active" : ""}`}
          >
            Home
          </button>

          {/* My Appointments */}
          <button
            type="button"
            onClick={() => navigateTo("patient", "my_apts")}
            className={`header-nav-btn ${isMyAppointmentsActive ? "active" : ""}`}
          >
            My Appointments
          </button>

          {/* History */}
          <button
            type="button"
            onClick={() => navigateTo("patient", "history")}
            className={`header-nav-btn ${isHistoryActive ? "active" : ""}`}
          >
            History
          </button>

          {/* About Us */}
          <button
            type="button"
            onClick={() => setShowAboutModal(true)}
            className="header-nav-btn"
          >
            About Us
          </button>

          {/* Contact */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="header-nav-btn"
          >
            Contact
          </button>
        </nav>

        {/* 3. Right: Language Selector & Patient Profile Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
          {/* Language Selector Pill Button */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="header-pill-btn"
              title="Change Language"
            >
              {/* Globe Icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{language === "hi" ? "हिंदी" : "EN"}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {langDropdownOpen && (
              <div className="header-dropdown-menu" style={{ minWidth: "140px" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (setLanguage) setLanguage("en");
                    setLangDropdownOpen(false);
                  }}
                  className={`header-dropdown-item ${language === "en" ? "active" : ""}`}
                >
                  <span style={{ fontSize: "14px" }}>🇺🇸</span>
                  <span>English (EN)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (setLanguage) setLanguage("hi");
                    setLangDropdownOpen(false);
                  }}
                  className={`header-dropdown-item ${language === "hi" ? "active" : ""}`}
                >
                  <span style={{ fontSize: "14px" }}>🇮🇳</span>
                  <span>हिंदी (HI)</span>
                </button>
              </div>
            )}
          </div>

          {/* Patient Profile Dropdown Button */}
          {currentUser ? (
            <div ref={profileRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="header-pill-btn"
                style={{
                  borderColor: profileDropdownOpen ? "#059669" : "#CBD5E1",
                }}
              >
                {/* User Avatar Icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{isAdmin ? `Staff: ${username}` : `Patient: ${username}`}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="header-dropdown-menu">
                  {/* User Profile Header */}
                  <div style={{ padding: "10px 12px 12px 12px", borderBottom: "1px solid #F1F5F9", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={dropdownAvatarStyle}>
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A", lineHeight: 1.2 }}>
                          {username}
                        </div>
                        <span style={userRoleTagStyle(isAdmin)}>
                          {isAdmin ? "Staff Admin" : "Verified Patient"}
                        </span>
                      </div>
                    </div>
                    {currentUser.email && (
                      <div style={{ fontSize: "11px", color: "#64748B", marginTop: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {currentUser.email}
                      </div>
                    )}
                  </div>

                  {/* Navigation Shortcuts */}
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo("patient", "walkin");
                      setProfileDropdownOpen(false);
                    }}
                    className="header-dropdown-item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    <span>Instant Check-In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigateTo("patient", "my_apts");
                      setProfileDropdownOpen(false);
                    }}
                    className="header-dropdown-item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                    <span>My Appointments</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigateTo("patient", "history");
                      setProfileDropdownOpen(false);
                    }}
                    className="header-dropdown-item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Appointment History</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigateTo("kiosk");
                      setProfileDropdownOpen(false);
                    }}
                    className="header-dropdown-item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                      <polyline points="17 2 12 7 7 2" />
                    </svg>
                    <span>Waiting Room TV</span>
                  </button>

                  {/* Admin Portals */}
                  {isAdmin && (
                    <>
                      <div style={{ height: "1px", background: "#F1F5F9", margin: "4px 0" }} />
                      <button
                        type="button"
                        onClick={() => {
                          navigateTo("staff");
                          setProfileDropdownOpen(false);
                        }}
                        className="header-dropdown-item"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span>Doctor & Staff Desk</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigateTo("admin");
                          setProfileDropdownOpen(false);
                        }}
                        className="header-dropdown-item"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span>ML Analytics Studio</span>
                      </button>
                    </>
                  )}

                  <div style={{ height: "1px", background: "#F1F5F9", margin: "4px 0" }} />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="header-dropdown-item danger"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Logout Account</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="header-pill-btn"
              style={{
                background: "#044E3B",
                color: "#FFFFFF",
                borderColor: "#044E3B",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{t("accountLogin", language)}</span>
            </button>
          )}
        </div>
      </header>

      {/* 4. ABOUT US MODAL */}
      {showAboutModal && (
        <div className="header-modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="header-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={modalLogoShieldStyle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2.5L4.5 5.5v5.5c0 5.1 3.2 9.85 7.5 11 4.3-1.15 7.5-5.9 7.5-11V5.5L12 2.5z"
                    fill="#044E3B"
                  />
                  <path
                    d="M12 7.5v9M7.5 12h9"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#064E3B", fontWeight: 800 }}>
                  About City General Hospital
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>Care you can trust</span>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.6", margin: "0 0 16px 0" }}>
              City General Hospital is a premier medical institution dedicated to patient-first care. Our AI-driven intelligent queue orchestration minimizes waiting times and prioritizes critical medical needs dynamically.
            </p>

            <div style={{ background: "#F8FAFC", borderRadius: "12px", padding: "14px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                <div>
                  <strong style={{ color: "#047857" }}>✓ 24/7 Emergency Triage</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>Priority ambulance & ICU care</div>
                </div>
                <div>
                  <strong style={{ color: "#047857" }}>✓ AI Wait Prediction</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>Live queue synchronization</div>
                </div>
                <div>
                  <strong style={{ color: "#047857" }}>✓ Multi-Specialty OPD</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>General, Cardiac, Neuro, Ortho</div>
                </div>
                <div>
                  <strong style={{ color: "#047857" }}>✓ Digital E-Prescriptions</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>Seamless pharmacy refills</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAboutModal(false)}
              style={modalCloseBtnStyle}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 5. CONTACT US MODAL */}
      {showContactModal && (
        <div className="header-modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="header-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={modalLogoShieldStyle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2.5L4.5 5.5v5.5c0 5.1 3.2 9.85 7.5 11 4.3-1.15 7.5-5.9 7.5-11V5.5L12 2.5z"
                    fill="#044E3B"
                  />
                  <path
                    d="M12 7.5v9M7.5 12h9"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#064E3B", fontWeight: 800 }}>
                  Contact & Support
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>City General Hospital Support Desk</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={contactInfoCardStyle}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#DC2626", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🚨</span> 24/7 Emergency Ambulance Helpline
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", marginTop: "3px" }}>
                  108 / +1 (800) 456-CARE
                </div>
              </div>

              <div style={contactInfoCardStyle}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#047857", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🏥</span> OPD Reception & Queue Help Desk
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginTop: "3px" }}>
                  +1 (800) 456-7890 (Ext: 101)
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                  Mon – Sat: 8:00 AM – 8:00 PM
                </div>
              </div>

              <div style={contactInfoCardStyle}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#0284C7", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📍</span> Hospital Campus Address
                </div>
                <div style={{ fontSize: "12.5px", color: "#334155", marginTop: "3px" }}>
                  742 Evergreen Healthcare Ave, Medical District, Suite 100
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                  Email: support@citygeneralhospital.org
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              style={modalCloseBtnStyle}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const headerContainerStyle = {
  maxWidth: "100%",
  width: "100%",
};

const shieldLogoContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "34px",
  height: "34px",
  flexShrink: 0,
};

const modalLogoShieldStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  flexShrink: 0,
};

const dropdownAvatarStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "#ECFDF5",
  color: "#047857",
  fontWeight: 800,
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #A7F3D0",
  flexShrink: 0,
};

const userRoleTagStyle = (isAdmin) => ({
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  background: isAdmin ? "#FEF3C7" : "#ECFDF5",
  color: isAdmin ? "#D97706" : "#047857",
  marginTop: "2px",
});

const contactInfoCardStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
};

const modalCloseBtnStyle = {
  width: "100%",
  padding: "11px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#044E3B",
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(4, 78, 59, 0.2)",
};

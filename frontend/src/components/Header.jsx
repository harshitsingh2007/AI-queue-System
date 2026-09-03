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
            padding: 12px 24px;
            margin-bottom: 24px;
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(226, 232, 240, 0.95);
            border-radius: 20px;
            box-shadow: 0 4px 24px -2px rgba(4, 78, 59, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02);
            position: relative;
            z-index: 100;
            flex-wrap: wrap;
            gap: 16px;
            transition: all 0.2s ease;
          }

          .header-nav-btn {
            padding: 8px 16px;
            border-radius: 12px;
            color: #334155;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid transparent;
            background: transparent;
            transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

            text-decoration: none;
            outline: none;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            user-select: none;
          }

          .header-nav-btn:hover {
            color: #044E3B;
            background: #F1F5F9;
            border-color: #E2E8F0;
          }

          .header-emergency-pill {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 6px 14px;
            border-radius: 9999px;
            background: #FEF2F2;
            border: 1px solid #FECACA;
            color: #DC2626;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s ease;
            outline: none;
          }

          .header-emergency-pill:hover {
            background: #FEE2E2;
            border-color: #FCA5A5;
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(220, 38, 38, 0.15);
          }

          .header-pill-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 14px;
            border-radius: 12px;
            background: #FFFFFF;
            border: 1px solid #CBD5E1;
            color: #0F172A;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.18s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
            outline: none;
            user-select: none;
          }

          .header-pill-btn:hover {
            border-color: #059669;
            background: #F8FAFC;
            box-shadow: 0 3px 10px rgba(5, 150, 105, 0.08);
          }

          .header-dropdown-menu {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            background: #FFFFFF;
            border-radius: 16px;
            border: 1px solid #E2E8F0;
            box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.06);
            min-width: 230px;
            z-index: 9999;
            padding: 8px;
            animation: fadeInDown 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .header-dropdown-item {
            width: 100%;
            padding: 10px 12px;
            border-radius: 10px;
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
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            animation: fadeIn 0.15s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .header-modal-content {
            background: #FFFFFF;
            border-radius: 24px;
            max-width: 480px;
            width: 100%;
            padding: 30px;
            box-shadow: 0 24px 48px -10px rgba(0, 0, 0, 0.22);
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

        <div
          style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", flexShrink: 0 }}
          onClick={() => {
            if (currentUser?.role === "super_admin") {
              navigateTo("superadmin");
            } else if (["admin", "doctor", "staff", "receptionist"].includes(currentUser?.role)) {
              navigateTo("staff");
            } else {
              navigateTo("patient", "walkin");
            }
          }}
          title="Hospital System HQ"
        >
          <div style={shieldLogoContainerStyle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.5L4.5 5.5v5.5c0 5.1 3.2 9.85 7.5 11 4.3-1.15 7.5-5.9 7.5-11V5.5L12 2.5z"
                fill="#FFFFFF"
              />
              <path
                d="M12 7.5v9M7.5 12h9"
                stroke="#044E3B"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 900, fontSize: "17.5px", color: "#064E3B", letterSpacing: "-0.4px", lineHeight: "1.2", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser?.hospital_name || HOSPITAL_CONFIG.name}
              </span>
              <span style={{ padding: "2px 7px", borderRadius: "20px", background: "#ECFDF5", color: "#047857", fontSize: "10px", fontWeight: 800, border: "1px solid #A7F3D0", whiteSpace: "nowrap" }}>
                NABH ACCREDITED
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 600, marginTop: "2px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span>{language === "hi" ? "भरोसेमंद स्वास्थ्य सेवा" : "Care you can trust"}</span>
              <span>•</span>
              <span style={{ color: socketConnected ? "#059669" : "#D97706", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: socketConnected ? "#10B981" : "#F59E0B", display: "inline-block" }} />
                {socketConnected
                  ? (language === "hi" ? "AI ट्राइएज सक्रिय" : "AI Triage Active")
                  : (language === "hi" ? "कनेक्ट हो रहा है..." : "Connecting...")}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Center: Quick Hospital Support & Emergency Hotline */}
        <nav style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Super Admin Navigation Button */}
          {currentUser?.role === "super_admin" && (
            <button
              type="button"
              onClick={() => navigateTo("superadmin")}
              className={`header-nav-btn ${activePage === "superadmin" ? "active" : ""}`}
              style={{
                background: activePage === "superadmin" ? "#044E3B" : "#ECFDF5",
                color: activePage === "superadmin" ? "#FFFFFF" : "#047857",
                fontWeight: 800,
                border: "1px solid #10B981",
              }}
              title="Super Admin / Hospital Owner Network Portal"
            >
              <span>👑</span>
              <span>{language === "hi" ? "सुपर एडमिन" : "Super Admin"}</span>
            </button>
          )}

          {/* Doctor / Staff Desk Navigation Button (Only for Staff / Doctors, NOT for Super Admin) */}
          {currentUser && ["admin", "doctor", "staff", "receptionist"].includes(currentUser.role) && (
            <button
              type="button"
              onClick={() => navigateTo("staff")}
              className={`header-nav-btn ${activePage === "staff" ? "active" : ""}`}
              style={{
                background: activePage === "staff" ? "#044E3B" : "#F0FDF4",
                color: activePage === "staff" ? "#FFFFFF" : "#064E3B",
                fontWeight: 800,
                border: "1px solid #A7F3D0",
              }}
              title="Doctor & Staff Desk"
            >
              <span>🩺</span>
              <span>{language === "hi" ? "स्टाफ डेस्क" : "Staff Desk"}</span>
            </button>
          )}

          {/* TV Kiosk Waiting Room Display */}
          <button
            type="button"
            onClick={() => navigateTo("kiosk")}
            className={`header-nav-btn ${activePage === "kiosk" ? "active" : ""}`}
            title="Public Waiting Room TV Kiosk"
          >
            <span>📺</span>
            <span>{language === "hi" ? "टीवी कियोस्क" : "TV Kiosk"}</span>
          </button>

          {/* Emergency 24/7 Hotline Button */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="header-emergency-pill"
            title="Emergency Care & Helpline"
          >
            <span>🚨</span>
            <span>{language === "hi" ? "24/7 हेल्पलाइन: 108" : "24/7 Helpline: 108"}</span>
          </button>

          {/* About Us */}
          <button
            type="button"
            onClick={() => setShowAboutModal(true)}
            className="header-nav-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{language === "hi" ? "हमारे बारे में" : "About Us"}</span>
          </button>

          {/* Contact */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="header-nav-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{language === "hi" ? "संपर्क एवं सहायता" : "Support & Desk"}</span>
          </button>
        </nav>

        {/* 3. Right: Language Selector & Patient Profile Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative", flexShrink: 0 }}>
          {/* Language Selector Pill Button */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                setLangDropdownOpen((prev) => !prev);
                setProfileDropdownOpen(false);
              }}
              className="header-pill-btn"
              title="Change Language"
            >
              <span style={{ fontSize: "14px" }}>{language === "hi" ? "🇮🇳" : "🇺🇸"}</span>
              <span>{language === "hi" ? "हिंदी" : "English"}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {langDropdownOpen && (
              <div className="header-dropdown-menu" style={{ minWidth: "150px" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (setLanguage) setLanguage("en");
                    setLangDropdownOpen(false);
                  }}
                  className={`header-dropdown-item ${language === "en" ? "active" : ""}`}
                >
                  <span style={{ fontSize: "15px" }}>🇺🇸</span>
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
                  <span style={{ fontSize: "15px" }}>🇮🇳</span>
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
                onClick={() => {
                  setProfileDropdownOpen((prev) => !prev);
                  setLangDropdownOpen(false);
                }}
                className="header-pill-btn"
                style={{
                  padding: "5px 14px 5px 6px",
                  borderColor: profileDropdownOpen ? "#059669" : "#CBD5E1",
                  background: profileDropdownOpen ? "#F0FDF4" : "#FFFFFF",
                }}
              >
                {/* User Avatar Circle */}
                <div style={dropdownAvatarStyle}>
                  {username.charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#0F172A", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {username}
                  </div>
                  <span style={{ fontSize: "10px", color: "#047857", fontWeight: 700 }}>
                    {currentUser.role === "super_admin"
                      ? "SUPER ADMIN"
                      : currentUser.role === "doctor"
                        ? "DOCTOR"
                        : currentUser.role === "staff"
                          ? "STAFF"
                          : currentUser.role === "admin"
                            ? "HOSPITAL ADMIN"
                            : (language === "hi" ? "मरीज़ खाता" : "Patient Account")}
                  </span>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="header-dropdown-menu" style={{ width: "260px", padding: "10px" }}>
                  {/* Account Header */}
                  <div style={{ padding: "10px 12px 12px 12px", marginBottom: "8px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ ...dropdownAvatarStyle, width: "36px", height: "36px", fontSize: "14px", background: "#044E3B", color: "#FFFFFF" }}>
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {username}
                        </div>
                        <span style={userRoleTagStyle(currentUser.role)}>
                          {(currentUser.role || "user").toUpperCase()}
                        </span>
                        {currentUser.hospital_name && (
                          <span style={{ fontSize: "10.5px", color: "#64748B", display: "block", marginTop: "2px" }}>
                            🏥 {currentUser.hospital_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ height: "1px", background: "#E2E8F0", margin: "6px 0" }} />

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="header-dropdown-item danger"
                    style={{ padding: "9px 12px" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>{language === "hi" ? "साइन आउट" : "Sign Out"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              style={{
                padding: "8px 16px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #044E3B 0%, #065F46 100%)",
                color: "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(4, 78, 59, 0.2)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  {language === "hi" ? "सिटी जनरल अस्पताल के बारे में" : "About City General Hospital"}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {language === "hi" ? "भरोसेमंद स्वास्थ्य सेवा" : "Care you can trust"}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.6", margin: "0 0 16px 0" }}>
              {language === "hi"
                ? "सिटी जनरल अस्पताल मरीज़-प्रथम सेवा हेतु समर्पित एक अग्रणी चिकित्सा संस्थान है। हमारा एआई-संचालित बुद्धिमान कतार प्रबंधन प्रतीक्षा समय को कम करता है और गंभीर मामलों को प्राथमिकता देता है।"
                : "City General Hospital is a premier medical institution dedicated to patient-first care. Our AI-driven intelligent queue orchestration minimizes waiting times and prioritizes critical medical needs dynamically."}
            </p>

            <div style={{ background: "#F8FAFC", borderRadius: "12px", padding: "14px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                <div>
                  <strong style={{ color: "#047857" }}>{language === "hi" ? "✓ 24/7 आपातकालीन ट्राइएज" : "✓ 24/7 Emergency Triage"}</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>{language === "hi" ? "प्राथमिकता एम्बुलेंस एवं आईसीयू" : "Priority ambulance & ICU care"}</div>
                </div>
                <div>
                  <strong style={{ color: "#047857" }}>{language === "hi" ? "✓ AI प्रतीक्षा भविष्यवाणी" : "✓ AI Wait Prediction"}</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>{language === "hi" ? "लाइव कतार सिंक्रोनाइज़ेशन" : "Live queue synchronization"}</div>
                </div>
                <div>
                  <strong style={{ color: "#047857" }}>{language === "hi" ? "✓ बहु-विशेषज्ञता ओपीडी" : "✓ Multi-Specialty OPD"}</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>{language === "hi" ? "सामान्य, हृदय, न्यूरो, ऑर्थो" : "General, Cardiac, Neuro, Ortho"}</div>
                </div>
                <div>
                  <strong style={{ color: "#047857" }}>{language === "hi" ? "✓ डिजिटल ई-प्रिस्क्रिप्शन" : "✓ Digital E-Prescriptions"}</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>{language === "hi" ? "सहज फार्मेसी रीफिल" : "Seamless pharmacy refills"}</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAboutModal(false)}
              style={modalCloseBtnStyle}
            >
              {language === "hi" ? "बंद करें" : "Close"}
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
                  {language === "hi" ? "संपर्क एवं सहायता डेस्क" : "Contact & Support"}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {language === "hi" ? "सिटी जनरल अस्पताल हेल्प डेस्क" : "City General Hospital Support Desk"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={contactInfoCardStyle}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#DC2626", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🚨</span> {language === "hi" ? "24/7 आपातकालीन एम्बुलेंस हेल्पलाइन" : "24/7 Emergency Ambulance Helpline"}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", marginTop: "3px" }}>
                  108 / +1 (800) 456-CARE
                </div>
              </div>

              <div style={contactInfoCardStyle}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#047857", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🏥</span> {language === "hi" ? "ओपीडी रिसेप्शन एवं कतार सहायता" : "OPD Reception & Queue Help Desk"}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginTop: "3px" }}>
                  +1 (800) 456-7890 (Ext: 101)
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                  {language === "hi" ? "सोम – शनि: सुबह 8:00 – रात 8:00" : "Mon – Sat: 8:00 AM – 8:00 PM"}
                </div>
              </div>

              <div style={contactInfoCardStyle}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#0284C7", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📍</span> {language === "hi" ? "अस्पताल पता" : "Hospital Campus Address"}
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
              {language === "hi" ? "बंद करें" : "Close"}
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
  position: "relative",
  zIndex: 100,
};

const shieldLogoContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #044E3B 0%, #065F46 100%)",
  boxShadow: "0 4px 12px rgba(4, 78, 59, 0.25)",
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

const userRoleTagStyle = (role) => {
  if (role === "super_admin") return { display: "inline-block", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A", marginTop: "2px" };
  if (role === "doctor") return { display: "inline-block", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0", marginTop: "2px" };
  if (role === "admin") return { display: "inline-block", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", marginTop: "2px" };
  return { display: "inline-block", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", marginTop: "2px" };
};

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

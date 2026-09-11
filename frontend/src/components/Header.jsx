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
import { API_BASE, HOSPITAL_CONFIG } from "../config/hospitalConfig";
import { t } from "../utils/i18n";
import { AddFamilyMemberModal, getRelationLabel } from "./FamilyMemberSwitcher";

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
  familyMembers = [],
  activeFamilyMember = null,
  onSwitchProfile,
  onAddFamilyMember,
  onManageFamilyMembers,
  currentHospitalTenant = "city-hospital-01",
  onSwitchHospital,
  hospitalBranding = null,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [familySwitcherExpanded, setFamilySwitcherExpanded] = useState(false);

  // Multi-Hospital Facility Active Display
  const [hospitalsList, setHospitalsList] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/hospitals/public`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success" && Array.isArray(d.hospitals)) {
          setHospitalsList(d.hospitals);
        }
      })
      .catch((e) => console.log("Header hospitals fetch error:", e));
  }, []);

  const [activeHospitalCode, setActiveHospitalCode] = useState(
    currentHospitalTenant || currentUser?.hospital_code || "city-hospital-01"
  );

  useEffect(() => {
    if (currentHospitalTenant) {
      setActiveHospitalCode(currentHospitalTenant);
    }
  }, [currentHospitalTenant]);

  useEffect(() => {
    const handleHospEvent = (e) => {
      const code = typeof e?.detail === "string" ? e.detail : e?.detail?.hospital_code;
      if (code) setActiveHospitalCode(code);
    };
    window.addEventListener("hospital_changed", handleHospEvent);
    return () => window.removeEventListener("hospital_changed", handleHospEvent);
  }, []);

  const currentHospitalObj = hospitalsList.find(
    (h) => String(h.hospital_code) === String(activeHospitalCode)
  ) || {
    name: (String(activeHospitalCode) === String(currentUser?.hospital_code) && currentUser?.hospital_name) || HOSPITAL_CONFIG.name,
    hospital_code: activeHospitalCode,
    address: "742 Evergreen Healthcare Ave",
  };

  // Derived white-label branding variables
  const displayHospitalName =
    hospitalBranding?.hospital_name ||
    hospitalBranding?.name ||
    currentHospitalObj?.name ||
    HOSPITAL_CONFIG.name;

  const displayTagline =
    hospitalBranding?.tagline ||
    (language === "hi" ? "भरोसेमंद स्वास्थ्य सेवा • एनएबीएच मान्यता प्राप्त" : "Care you can trust • NABH Accredited");

  const displayLogoUrl = hospitalBranding?.logo_url || "";

  const displayEmergencyText =
    hospitalBranding?.emergency_helpline ||
    (language === "hi" ? "24/7 हेल्पलाइन: 108" : "24/7 Helpline: 108");

  const brandPrimary = hospitalBranding?.primary_color || "#0284C7";

  const profileRef = useRef(null);
  const langRef = useRef(null);

  const isPatientUser = currentUser && currentUser.role === "user";
  const isAdmin = currentUser && currentUser.role === "admin";
  const username = currentUser ? currentUser.username : "user";

  const userRole = (currentUser?.role || "").toLowerCase();
  const isSuperAdmin = userRole === "super_admin" || userRole === "superadmin";
  const isStaffOrDoctor = ["admin", "doctor", "staff", "receptionist"].includes(userRole);
  const isPatientOrGuest = !currentUser || userRole === "user" || userRole === "patient";

  // Hospital switcher is enabled on the patient portal for all visitors and patients
  const canSwitchHospital = activePage === "patient" || isPatientOrGuest;

  // Determine active display name (family member or self)
  const activeDisplayName = activeFamilyMember ? activeFamilyMember.name : username;
  const activeDisplayRelation = activeFamilyMember
    ? getRelationLabel(activeFamilyMember.relation, language)
    : (language === "hi" ? "मेरी प्रोफ़ाइल" : "My Profile");

  // Derive tab from prop or URL query parameter
  const getEffectiveTab = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (urlTab) return urlTab.toLowerCase();
      const pageParam = (params.get("page") || params.get("view") || "").toLowerCase();
      if (["history", "appointment_history", "past_appointments"].includes(pageParam)) return "history";
      if (["my_apts", "appointments", "my_appointments"].includes(pageParam)) return "my_apts";
      if (["book", "booking", "schedule"].includes(pageParam)) return "book";
      if (["family", "dependents"].includes(pageParam)) return "family";
      const path = window.location.pathname.toLowerCase();
      if (path.includes("history")) return "history";
      if (path.includes("appointment")) return "my_apts";
    }
    return currentTab || "walkin";
  };



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
            padding: 8px 18px;
            margin-bottom: 20px;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(226, 232, 240, 0.95);
            border-radius: 18px;
            box-shadow: 0 4px 20px -2px rgba(2, 132, 199, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);
            position: relative;
            z-index: 100;
            flex-wrap: nowrap;
            gap: 10px;
            transition: all 0.2s ease;
            white-space: nowrap;
          }

          .header-nav-btn {
            padding: 6px 12px;
            border-radius: 10px;
            color: #334155;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid transparent;
            background: transparent;
            transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
            text-decoration: none;
            outline: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            user-select: none;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .header-nav-btn:hover {
            color: #0284C7;
            background: #F0F9FF;
            border-color: #BAE6FD;
          }

          .header-nav-btn.active {
            color: #0284C7;
            background: #E0F2FE;
            border-color: #BAE6FD;
            font-weight: 800;
          }

          .header-emergency-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            border-radius: 9999px;
            background: #FEF2F2;
            border: 1px solid #FECACA;
            color: #DC2626;
            font-size: 11.5px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s ease;
            outline: none;
            white-space: nowrap;
            flex-shrink: 0;
            max-width: 240px;
          }

          .header-emergency-pill:hover {
            background: #FEE2E2;
            border-color: #FCA5A5;
            box-shadow: 0 3px 10px rgba(220, 38, 38, 0.15);
          }

          .header-pill-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 10px;
            background: #FFFFFF;
            border: 1px solid #CBD5E1;
            color: #0F172A;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.18s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
            outline: none;
            user-select: none;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .header-pill-btn:hover {
            border-color: #0284C7;
            background: #F0F9FF;
            box-shadow: 0 3px 10px rgba(2, 132, 199, 0.08);
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
            background: #F0F9FF;
            color: #0284C7;
          }

          .header-dropdown-item.active {
            background: #F0F9FF;
            color: #0284C7;
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
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flexShrink: 0 }}
          onClick={() => {
            if (currentUser?.role === "super_admin" || currentUser?.role === "superadmin") {
              navigateTo("superadmin");
            } else if (["admin", "doctor", "staff", "receptionist"].includes(currentUser?.role)) {
              navigateTo("staff");
            } else {
              navigateTo("patient", "walkin");
            }
          }}
          title="Hospital System HQ"
        >
          <div style={{ ...shieldLogoContainerStyle, width: "36px", height: "36px", background: displayLogoUrl ? "#FFFFFF" : brandPrimary, border: displayLogoUrl ? `1.5px solid ${brandPrimary}` : "none", flexShrink: 0 }}>
            {displayLogoUrl ? (
              <img
                src={displayLogoUrl}
                alt="Hospital Logo"
                style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "5px" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.5L4.5 5.5v5.5c0 5.1 3.2 9.85 7.5 11 4.3-1.15 7.5-5.9 7.5-11V5.5L12 2.5z"
                  fill="#FFFFFF"
                />
                <path
                  d="M12 7.5v9M7.5 12h9"
                  stroke={brandPrimary}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
              <span style={{ fontWeight: 900, fontSize: "15.5px", color: "#0F172A", letterSpacing: "-0.3px", lineHeight: "1.2", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayHospitalName}
              </span>
              <span style={{ padding: "1.5px 6px", borderRadius: "12px", background: "#F0F9FF", color: brandPrimary, fontSize: "9px", fontWeight: 800, border: `1px solid ${brandPrimary}40`, whiteSpace: "nowrap" }}>
                NABH ACCREDITED
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, marginTop: "2px", display: "flex", alignItems: "center", gap: "5px", flexWrap: "nowrap" }}>
              <span style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayTagline}
              </span>
              <span>•</span>
              <span style={{ color: socketConnected ? brandPrimary : "#D97706", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700, whiteSpace: "nowrap" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: socketConnected ? "#0EA5E9" : "#F59E0B", display: "inline-block" }} />
                {socketConnected
                  ? (language === "hi" ? "AI सक्रिय" : "AI Active")
                  : (language === "hi" ? "कनेक्ट..." : "Connecting...")}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Center: Quick Hospital Support & Emergency Hotline */}
        <nav style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap", flexShrink: 1, minWidth: 0 }}>

          {/* Super Admin Navigation Button */}
          {(currentUser?.role === "super_admin" || currentUser?.role === "superadmin") && (
            <button
              type="button"
              onClick={() => navigateTo("superadmin")}
              className={`header-nav-btn ${activePage === "superadmin" ? "active" : ""}`}
              style={{
                background: activePage === "superadmin" ? "#0F172A" : "#F0F9FF",
                color: activePage === "superadmin" ? "#FFFFFF" : "#0284C7",
                fontWeight: 800,
                border: "1px solid #BAE6FD",
              }}
              title="Super Admin / Hospital Owner Network Portal"
            >
              <span>👑</span>
              <span>{language === "hi" ? "सुपर एडमिन" : "Super Admin"}</span>
            </button>
          )}

          {/* Doctor / Staff Desk Navigation Button (Only for Staff / Doctors, NOT for Super Admin) */}
          {currentUser && ["admin", "doctor", "staff", "receptionist"].includes(currentUser.role) && activePage !== "superadmin" && (
            <button
              type="button"
              onClick={() => navigateTo("staff")}
              className={`header-nav-btn ${activePage === "staff" ? "active" : ""}`}
              style={{
                background: activePage === "staff" ? "#0F172A" : "#F0F9FF",
                color: activePage === "staff" ? "#FFFFFF" : "#0284C7",
                fontWeight: 800,
                border: "1px solid #BAE6FD",
              }}
              title="Doctor & Staff Desk"
            >
              <span>🩺</span>
              <span>{language === "hi" ? "स्टाफ डेस्क" : "Staff Desk"}</span>
            </button>
          )}

          {/* TV Kiosk Waiting Room Display (Visible for Staff Desk, Hidden from Patient Portal & Super Admin) */}
          {activePage === "staff" && (!currentUser || currentUser.role !== "super_admin") && (
            <button
              type="button"
              onClick={() => navigateTo("kiosk")}
              className={`header-nav-btn ${activePage === "kiosk" ? "active" : ""}`}
              title="Public Waiting Room TV Kiosk"
            >
              <span>📺</span>
              <span>{language === "hi" ? "टीवी कियोस्क" : "TV Kiosk"}</span>
            </button>
          )}

          {/* Emergency 24/7 Hotline Button */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="header-emergency-pill"
            title="Emergency Care & Helpline"
          >
            <span>🚨</span>
            <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayEmergencyText}
            </span>
          </button>

          {/* About Us & Contact - displayed on patient portal to avoid crowding admin/staff header */}
          {activePage === "patient" && (
            <>
              <button
                type="button"
                onClick={() => setShowAboutModal(true)}
                className="header-nav-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>{language === "hi" ? "हमारे बारे में" : "About Us"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="header-nav-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{language === "hi" ? "संपर्क" : "Support"}</span>
              </button>
            </>
          )}
        </nav>

        {/* 3. Right: Language Selector & Patient Profile Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative", flexShrink: 0 }}>
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
                  padding: "5px 12px 5px 6px",
                  borderColor: profileDropdownOpen ? "#0284C7" : "#CBD5E1",
                  background: profileDropdownOpen ? "#F0F9FF" : "#FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {/* User Avatar Circle */}
                <div style={{ ...dropdownAvatarStyle, width: "28px", height: "28px", fontSize: "12px" }}>
                  {activeDisplayName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeDisplayName}
                </span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>


              {profileDropdownOpen && (
                <div className="header-dropdown-menu" style={{ width: "290px", padding: "10px" }}>
                  {/* Account Header */}
                  <div style={{ padding: "10px 12px 12px 12px", marginBottom: "8px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ ...dropdownAvatarStyle, width: "36px", height: "36px", fontSize: "14px", background: "#0284C7", color: "#FFFFFF" }}>
                        {activeDisplayName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {activeDisplayName}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                          <span style={userRoleTagStyle(currentUser.role)}>
                            {(currentUser.role || "user").toUpperCase()}
                          </span>
                          {activeFamilyMember && (
                            <span style={{ fontSize: "10px", color: "#0369A1", fontWeight: 700, background: "#E0F2FE", padding: "1px 5px", borderRadius: "4px", border: "1px solid #BAE6FD" }}>
                              {activeDisplayRelation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prominent Hospital Affiliation Box for Staff/Doctor */}
                    {["admin", "doctor", "staff", "receptionist", "super_admin", "superadmin"].includes(currentUser.role) && (
                      <div style={{ padding: "8px 10px", marginTop: "8px", background: "#F0F9FF", borderRadius: "8px", border: "1px solid #BAE6FD", fontSize: "11px", color: "#0369A1" }}>
                        <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>🏥</span>
                          <span>{currentUser.hospital_name || HOSPITAL_CONFIG.name}</span>
                        </div>
                        {currentUser.department && currentUser.department !== "all" && (
                          <div style={{ fontSize: "10px", color: "#0284C7", marginTop: "2px", fontWeight: 600 }}>
                            Department: {currentUser.department.toUpperCase()} {currentUser.employee_id ? `• ID: ${currentUser.employee_id}` : ""}
                          </div>
                        )}
                      </div>
                    )}
                  </div>


                  {/* Profile Switcher — Only for patient/user role */}
                  {isPatientUser && (
                    <>
                      <div style={{ padding: "4px 12px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {language === "hi" ? "प्रोफ़ाइल बदलें" : "Switch Profile"}
                        </span>
                        {familyMembers.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setFamilySwitcherExpanded(prev => !prev)}
                            style={{ fontSize: "10px", color: "#0369A1", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            {familySwitcherExpanded ? (language === "hi" ? "कम दिखाएं" : "Less") : (language === "hi" ? "सभी दिखाएं" : "All")}
                          </button>
                        )}
                      </div>

                      {/* Self */}
                      <button
                        type="button"
                        className={`header-dropdown-item ${!activeFamilyMember ? "active" : ""}`}
                        onClick={() => {
                          const selfObj = { id: "self", name: username, relation: "self" };
                          if (onSwitchProfile) onSwitchProfile(selfObj);
                          setProfileDropdownOpen(false);
                        }}
                        style={{ justifyContent: "space-between" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: !activeFamilyMember ? "#0284C7" : "#F0F9FF", color: !activeFamilyMember ? "#fff" : "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, border: !activeFamilyMember ? "2px solid #0284C7" : "1px solid #BAE6FD", flexShrink: 0 }}>
                            {username.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: "12.5px", fontWeight: 700, lineHeight: 1.2 }}>{username}</div>
                            <div style={{ fontSize: "10px", color: !activeFamilyMember ? "#0284C7" : "#64748B", fontWeight: 600 }}>{language === "hi" ? "मेरी प्रोफ़ाइल" : "My Profile"}</div>
                          </div>
                        </div>
                        {!activeFamilyMember && (
                          <span style={{ color: "#0284C7", fontSize: "14px", fontWeight: 900 }}>✓</span>
                        )}
                      </button>

                      {/* Family Members */}
                      {(familySwitcherExpanded ? familyMembers : familyMembers.slice(0, 3)).map((member) => {
                        const isActive = activeFamilyMember && activeFamilyMember.id === member.id;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            className={`header-dropdown-item ${isActive ? "active" : ""}`}
                            onClick={() => {
                              if (onSwitchProfile) onSwitchProfile(member);
                              setProfileDropdownOpen(false);
                            }}
                            style={{ justifyContent: "space-between" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isActive ? "#0369A1" : "#E0F2FE", color: isActive ? "#fff" : "#0369A1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, border: isActive ? "2px solid #0284C7" : "1px solid #BAE6FD", flexShrink: 0 }}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: "12.5px", fontWeight: 700, lineHeight: 1.2 }}>{member.name}</div>
                                <div style={{ fontSize: "10px", color: isActive ? "#0284C7" : "#64748B", fontWeight: 600 }}>{getRelationLabel(member.relation, language)}</div>
                              </div>
                            </div>
                            {isActive && (
                              <span style={{ color: "#0284C7", fontSize: "14px", fontWeight: 900 }}>✓</span>
                            )}
                          </button>
                        );
                      })}

                    </>
                  )}

                  {/* Super Admin Switch Shortcut (Strictly for Super Admin Only) */}
                  {(currentUser?.role === "super_admin" || currentUser?.role === "superadmin") && (
                    <>
                      <div style={{ height: "1px", background: "#E2E8F0", margin: "6px 0" }} />
                      <button
                        type="button"
                        className="header-dropdown-item"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigateTo("superadmin");
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                          <path d="M9 10h6M12 7v6" />
                        </svg>
                        <span>{language === "hi" ? "सुपर एडमिन पोर्टल" : "Super Admin Portal"}</span>
                      </button>
                    </>
                  )}

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
                background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                color: "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
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
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
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
                  <strong style={{ color: "#0284C7" }}>{language === "hi" ? "✓ 24/7 आपातकालीन ट्राइएज" : "✓ 24/7 Emergency Triage"}</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>{language === "hi" ? "प्राथमिकता एम्बुलेंस एवं आईसीयू" : "Priority ambulance & ICU care"}</div>
                </div>
                <div>
                  <strong style={{ color: "#0284C7" }}>{language === "hi" ? "✓ AI प्रतीक्षा भविष्यवाणी" : "✓ AI Wait Prediction"}</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>{language === "hi" ? "लाइव कतार सिंक्रोनाइज़ेशन" : "Live queue synchronization"}</div>
                </div>
                <div>
                  <strong style={{ color: "#0284C7" }}>{language === "hi" ? "✓ बहु-विशेषज्ञता ओपीडी" : "✓ Multi-Specialty OPD"}</strong>
                  <div style={{ color: "#64748B", marginTop: "2px" }}>{language === "hi" ? "सामान्य, हृदय, न्यूरो, ऑर्थो" : "General, Cardiac, Neuro, Ortho"}</div>
                </div>
                <div>
                  <strong style={{ color: "#0284C7" }}>{language === "hi" ? "✓ डिजिटल ई-प्रिस्क्रिप्शन" : "✓ Digital E-Prescriptions"}</strong>
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
              <div style={{ ...modalLogoShieldStyle, background: displayLogoUrl ? "#FFFFFF" : brandPrimary, border: displayLogoUrl ? `1.5px solid ${brandPrimary}` : "none" }}>
                {displayLogoUrl ? (
                  <img
                    src={displayLogoUrl}
                    alt="Logo"
                    style={{ width: "28px", height: "28px", objectFit: "contain", borderRadius: "6px" }}
                  />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2.5L4.5 5.5v5.5c0 5.1 3.2 9.85 7.5 11 4.3-1.15 7.5-5.9 7.5-11V5.5L12 2.5z"
                      fill={brandPrimary}
                    />
                    <path
                      d="M12 7.5v9M7.5 12h9"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
                  {language === "hi" ? "संपर्क एवं सहायता डेस्क" : "Contact & Support"}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {displayHospitalName} • {displayTagline}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={contactInfoCardStyle}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#DC2626", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🚨</span> {language === "hi" ? "24/7 आपातकालीन एम्बुलेंस हेल्पलाइन" : "24/7 Emergency Ambulance Helpline"}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", marginTop: "3px" }}>
                  {displayEmergencyText}
                </div>
              </div>

              <div style={contactInfoCardStyle}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#0284C7", display: "flex", alignItems: "center", gap: "6px" }}>
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

      {/* Add Family Member Modal (triggered from profile dropdown) */}
      {isPatientUser && (
        <AddFamilyMemberModal
          isOpen={showAddFamilyModal}
          onClose={() => setShowAddFamilyModal(false)}
          onAddMember={async (member) => {
            if (onAddFamilyMember) {
              await onAddFamilyMember(member);
            }
            setShowAddFamilyModal(false);
          }}
          language={language}
        />
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
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
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
  background: "#F0F9FF",
  color: "#0369A1",
  fontWeight: 800,
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #BAE6FD",
  flexShrink: 0,
};

const userRoleTagStyle = (role) => {
  if (role === "super_admin" || role === "superadmin") return { display: "inline-block", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A", marginTop: "2px" };
  if (role === "doctor") return { display: "inline-block", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", background: "#F0F9FF", color: "#0369A1", border: "1px solid #BAE6FD", marginTop: "2px" };
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
  background: "#0284C7",
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(2, 132, 199, 0.2)",
};

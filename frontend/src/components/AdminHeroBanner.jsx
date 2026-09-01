/**
 * AdminHeroBanner.jsx
 * -------------------
 * Executive Doctor & Hospital Operations Dashboard Hero Section.
 * Matches design and aesthetics of User Portal HeroBanner with:
 * - Desktop: 2-column layout (Left operational controls + stats, Right doctor clinical illustration)
 * - Tablet & Mobile: Responsive flex and stacked layout
 * - Integrated active counter adjusters (+ / -)
 */

import React from "react";
import { getCategoryLabel } from "../utils/i18n";

export default function AdminHeroBanner({
  language = "en",
  adminDept = "all",
  analytics,
  appointmentsCount = 0,
  handleCounterChange,
  navigateTo,
}) {
  const isHi = language === "hi";
  const deptLabel = getCategoryLabel(adminDept, language);

  return (
    <div style={heroContainerStyle} className="admin-hero-banner-container">
      <style>{`
        .admin-hero-banner-container {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          border-radius: 28px;
          overflow: hidden;
          background: #064E3B;
          box-shadow: 0 16px 36px -8px rgba(6, 78, 59, 0.22), 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.25);
          margin-bottom: 24px;
          position: relative;
          min-height: 280px;
          width: 100%;
        }

        .admin-hero-left-col {
          flex: 1.25;
          padding: 34px 36px;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          z-index: 2;
          background: linear-gradient(135deg, #064E3B 0%, #043828 75%, #032b1f 100%);
          position: relative;
        }

        @media (min-width: 900px) {
          .admin-hero-left-col {
            clip-path: polygon(0 0, 100% 0, 93% 100%, 0 100%);
            padding-right: 56px;
            margin-right: -24px;
          }
        }

        .admin-hero-right-col {
          flex: 0.95;
          background: linear-gradient(180deg, #EBF5FB 0%, #E2F0F7 100%);
          display: flex;
          align-items: center;
          justifyContent: center;
          position: relative;
          overflow: hidden;
          min-height: 260px;
        }

        .admin-hero-title {
          font-size: 30px;
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.5px;
          color: #FFFFFF;
          margin: 0;
        }

        .admin-hero-title-highlight {
          color: #34D399;
        }

        .admin-hero-subtitle {
          color: rgba(220, 245, 235, 0.85);
          font-size: 13px;
          line-height: 1.5;
          margin-top: 10px;
          margin-bottom: 20px;
          max-width: 440px;
          font-weight: 500;
        }

        .admin-hero-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .admin-hero-stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .admin-hero-stat-card:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .admin-hero-stat-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.16);
          display: flex;
          align-items: center;
          justifyContent: center;
          flex-shrink: 0;
          color: #A7F3D0;
        }

        .admin-hero-stat-value {
          font-size: 16px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.1;
          letter-spacing: -0.2px;
        }

        .admin-hero-stat-label {
          font-size: 9.5px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.2;
          margin-top: 2px;
        }

        .counter-adjust-btn {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          font-weight: 900;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          outline: none;
        }

        .counter-adjust-btn:hover {
          background: #34D399;
          color: #064E3B;
          border-color: #34D399;
        }

        @media (max-width: 960px) {
          .admin-hero-stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 860px) {
          .admin-hero-banner-container {
            flex-direction: column;
          }
          .admin-hero-left-col {
            clip-path: none !important;
            padding: 28px 22px;
            margin-right: 0;
          }
          .admin-hero-right-col {
            min-height: 200px;
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .admin-hero-title {
            font-size: 24px;
          }
          .admin-hero-stats-row {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
        }
      `}</style>

      {/* LEFT COLUMN: Operations Header & Live Badges */}
      <div className="admin-hero-left-col">
        <div>
          {/* Department Security Tag & Kiosk TV shortcut */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: "9999px", background: "rgba(52, 211, 153, 0.18)", border: "1px solid rgba(52, 211, 153, 0.4)", color: "#34D399", fontSize: "11px", fontWeight: 800, letterSpacing: "0.5px" }}>
              🛡️ {adminDept === "all" ? (isHi ? "सुपर एडमिन कंसोल" : "SUPER ADMIN CONSOLE") : `${deptLabel.toUpperCase()}`}
            </span>
            <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
              ● {isHi ? "AI ट्राइएज लाइव" : "AI Triage Active"}
            </span>
          </div>

          <h1 className="admin-hero-title">
            {isHi ? (
              <>
                चिकित्सीय संचालन.
                <br />
                <span className="admin-hero-title-highlight">डॉक्टर एवं ट्राइएज</span> डेस्क.
              </>
            ) : (
              <>
                Clinical Operations.
                <br />
                <span className="admin-hero-title-highlight">Doctor & Staff</span> Control.
              </>
            )}
          </h1>
          <p className="admin-hero-subtitle">
            {isHi
              ? "रीयल-टाइम बहु-विभागीय मरीज़ कॉलिंग, ट्राइएज वर्गीकरण एवं क्लिनिकल प्रबंधन।"
              : "Real-time multi-department patient calling, triage classification & clinical routing."}
          </p>
        </div>

        {/* 4 Operations Stat Badges */}
        <div className="admin-hero-stats-row">
          {/* 1. Patients Waiting */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="admin-hero-stat-value" style={{ color: "#FDE047" }}>
                {analytics ? analytics.currently_waiting : 0}
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "प्रतीक्षारत मरीज़" : "Waiting Patients"}
              </div>
            </div>
          </div>

          {/* 2. Currently Serving */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className="admin-hero-stat-value" style={{ color: "#34D399" }}>
                {analytics ? analytics.currently_serving : 0}
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "सेवारत टोकन" : "Now Serving"}
              </div>
            </div>
          </div>

          {/* 3. Today's Booked Appointments */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div className="admin-hero-stat-value" style={{ color: "#38BDF8" }}>
                {appointmentsCount}
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "आज के अपॉइंटमेंट्स" : "Booked Slots"}
              </div>
            </div>
          </div>

          {/* 4. Active Doctor Desks with +/- adjusters */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="admin-hero-stat-value" style={{ color: "#FB923C" }}>
                  {analytics ? analytics.active_counters : 2}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => handleCounterChange && handleCounterChange(-1)}
                    className="counter-adjust-btn"
                    title="Decrease Active Desks"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCounterChange && handleCounterChange(1)}
                    className="counter-adjust-btn"
                    title="Increase Active Desks"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "सक्रिय डॉक्टर डेस्क" : "Active Desks"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Doctor & Hospital Clinical Operations Illustration */}
      <div className="admin-hero-right-col">
        <DoctorClinicalIllustration />
      </div>
    </div>
  );
}

/**
 * DoctorClinicalIllustration
 * --------------------------
 * Vector clinical artwork featuring a doctor workstation, medical tablet,
 * stethoscope, ECG pulse screen, and clinical badge.
 */
function DoctorClinicalIllustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      {/* Background Soft Gradients */}
      <circle cx="230" cy="130" r="140" fill="#E0F2FE" fillOpacity="0.6" />
      <circle cx="340" cy="70" r="70" fill="#ECFDF5" fillOpacity="0.8" />
      <circle cx="100" cy="190" r="60" fill="#F0FDF4" fillOpacity="0.7" />

      {/* Modern Medical Desk / Glass Console Table */}
      <ellipse cx="230" cy="225" rx="190" ry="22" fill="#CBD5E1" fillOpacity="0.5" />
      <rect x="90" y="200" width="280" height="12" rx="6" fill="#044E3B" fillOpacity="0.8" />

      {/* Doctor Central Figure */}
      <g transform="translate(195, 75)">
        {/* Head */}
        <circle cx="35" cy="26" r="20" fill="#FBBF24" />
        {/* Hair */}
        <path d="M15 24 C15 10, 55 10, 55 24 C55 14, 45 6, 35 6 C25 6, 15 14, 15 24 Z" fill="#1E293B" />
        {/* Medical Mask */}
        <path d="M22 28 C22 28, 35 38, 48 28 C48 38, 22 38, 22 28 Z" fill="#E0F2FE" />
        {/* Doctor White Coat */}
        <path d="M8 52 C8 44, 22 42, 35 42 C48 42, 62 44, 62 52 L68 125 L2 125 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        {/* Medical Scrubs Inner */}
        <path d="M26 42 L35 62 L44 42 Z" fill="#059669" />
        {/* Stethoscope */}
        <path d="M22 46 C22 68, 48 68, 48 46" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="35" cy="72" r="5" fill="#0284C7" />
        {/* Doctor ID Badge */}
        <rect x="46" y="65" width="12" height="16" rx="2" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
        <line x1="48" y1="70" x2="56" y2="70" stroke="#064E3B" strokeWidth="1" />
        <line x1="48" y1="74" x2="54" y2="74" stroke="#064E3B" strokeWidth="1" />
      </g>

      {/* Left: ECG Patient Vitals Monitor */}
      <g transform="translate(60, 60)">
        <rect x="0" y="0" width="110" height="90" rx="12" fill="#0F172A" stroke="#334155" strokeWidth="2" />
        <rect x="6" y="6" width="98" height="78" rx="8" fill="#022C22" />
        {/* Live Heartbeat Line */}
        <path d="M12 45 L32 45 L38 25 L44 65 L50 35 L56 50 L98 50" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Monitor Stats */}
        <text x="14" y="22" fill="#38BDF8" fontSize="10" fontWeight="bold" fontFamily="sans-serif">HR: 74 BPM</text>
        <text x="64" y="22" fill="#34D399" fontSize="10" fontWeight="bold" fontFamily="sans-serif">SPO2: 99%</text>
        {/* Stand */}
        <rect x="48" y="90" width="14" height="45" fill="#64748B" />
        <ellipse cx="55" cy="135" rx="25" ry="5" fill="#475569" />
      </g>

      {/* Right: Electronic Prescription & Medical Tablet */}
      <g transform="translate(300, 70)">
        <rect x="0" y="0" width="95" height="115" rx="12" fill="#FFFFFF" stroke="#059669" strokeWidth="2" />
        {/* Header Bar */}
        <rect x="8" y="8" width="79" height="18" rx="4" fill="#ECFDF5" />
        <text x="14" y="21" fill="#065F46" fontSize="9" fontWeight="800" fontFamily="sans-serif">Rx PRESCRIPTION</text>
        {/* Lines */}
        <line x1="12" y1="36" x2="65" y2="36" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="46" x2="80" y2="46" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="56" x2="72" y2="56" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="66" x2="60" y2="66" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        {/* Signature Stamp */}
        <circle cx="68" cy="92" r="14" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1" strokeDasharray="2 2" />
        <text x="59" y="95" fill="#0284C7" fontSize="7" fontWeight="bold" fontFamily="sans-serif">VERIFIED</text>
      </g>
    </svg>
  );
}

const heroContainerStyle = {
  maxWidth: "100%",
  width: "100%",
  boxSizing: "border-box",
};

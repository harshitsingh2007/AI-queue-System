/**
 * AdminHeroBanner.jsx
 * -------------------
 * Executive Doctor & Hospital Operations Dashboard Hero Section.
 * Matches design and aesthetics of User Portal HeroBanner with:
 * - Desktop: 2-column layout (Left operational controls + stats, Right clinical AI telemetry console)
 * - Tablet & Mobile: Responsive flex and stacked layout
 * - Integrated active counter adjusters (+ / -)
 * - Theme: Medical Ocean Blue & Cyan Clinical Palette
 * - Zero overlapping elements: Uses high-precision responsive glassmorphism CSS cards.
 */

import React from "react";
import { getCategoryLabel } from "../utils/i18n";

export default function AdminHeroBanner({
  language = "en",
  adminDept = "all",
  hospitalName = "City General Hospital",
  analytics,
  waitingCount,
  servingCount,
  servingTicket,
  appointmentsCount = 0,
  handleCounterChange,
  navigateTo,
}) {
  const isHi = language === "hi";
  const deptLabel = getCategoryLabel(adminDept, language);

  const displayServing = servingTicket
    ? `#${servingTicket.ticket_id}`
    : typeof servingCount === "number" && servingCount > 0
    ? `${servingCount} Active`
    : analytics && typeof analytics.currently_serving === "number" && analytics.currently_serving > 0
    ? `${analytics.currently_serving} Active`
    : "0 Active";

  return (
    <div style={heroContainerStyle} className="admin-hero-banner-container">
      <style>{`
        .admin-hero-banner-container {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          border-radius: 28px;
          overflow: hidden;
          background: #0F172A;
          box-shadow: 0 16px 36px -8px rgba(2, 132, 199, 0.25), 0 4px 12px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.28);
          margin-bottom: 24px;
          position: relative;
          min-height: 290px;
          width: 100%;
        }

        .admin-hero-left-col {
          flex: 1.15;
          padding: 32px 34px;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          z-index: 2;
          background: linear-gradient(135deg, #0F172A 0%, #0F2744 75%, #0C4A6E 100%);
          position: relative;
        }

        @media (min-width: 900px) {
          .admin-hero-left-col {
            padding-right: 36px;
            margin-right: 0;
            border-right: 1px solid rgba(56, 189, 248, 0.25);
          }
        }

        .admin-hero-right-col {
          flex: 1;
          background: linear-gradient(135deg, #08172E 0%, #0F2C54 50%, #062238 100%);
          display: flex;
          align-items: center;
          justifyContent: center;
          position: relative;
          overflow: hidden;
          min-height: 280px;
          padding: 24px;
          box-sizing: border-box;
        }

        .admin-hero-title {
          font-size: 28px;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.5px;
          color: #FFFFFF;
          margin: 0;
        }

        .admin-hero-title-highlight {
          color: #38BDF8;
          text-shadow: 0 0 20px rgba(56, 189, 248, 0.35);
        }

        .admin-hero-subtitle {
          color: rgba(224, 242, 254, 0.85);
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
          width: 100%;
        }

        .admin-hero-stat-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          box-sizing: border-box;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .admin-hero-stat-card:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(56, 189, 248, 0.5);
          transform: translateY(-2px);
        }

        .admin-hero-stat-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justifyContent: center;
          flex-shrink: 0;
        }

        .admin-hero-stat-value {
          font-size: 15px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.15;
          letter-spacing: -0.2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-hero-stat-label {
          font-size: 9.5px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.2;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          justifyContent: center;
          transition: all 0.15s ease;
          outline: none;
          flex-shrink: 0;
        }

        .counter-adjust-btn:hover {
          background: #0284C7;
          color: #FFFFFF;
          border-color: #38BDF8;
        }

        /* RIGHT COLUMN: Modern Clinical Telemetry Hub (Zero Overlaps) */
        .telemetry-hub-container {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 2;
        }

        .telemetry-main-console {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 18px;
          padding: 14px 16px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35), 0 0 20px rgba(56, 189, 248, 0.12);
        }

        .console-header {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .console-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .live-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #38BDF8;
          box-shadow: 0 0 10px #38BDF8;
          display: inline-block;
          animation: telemetryPulse 2s infinite ease-in-out;
        }

        @keyframes telemetryPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }

        .console-title-text {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #FFFFFF;
          text-transform: uppercase;
        }

        .console-priority-badge {
          background: rgba(251, 146, 60, 0.2);
          border: 1px solid #FB923C;
          color: #FB923C;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          letter-spacing: 0.4px;
        }

        .console-patient-strip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(56, 189, 248, 0.15);
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          margin-bottom: 10px;
        }

        .patient-strip-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .patient-avatar-circle {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(56, 189, 248, 0.18);
          color: #38BDF8;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 13px;
        }

        .patient-strip-name {
          font-size: 12px;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.2;
        }

        .patient-strip-dept {
          font-size: 9.5px;
          color: #94A3B8;
          font-weight: 500;
        }

        .fast-track-pill {
          background: rgba(56, 189, 248, 0.15);
          color: #38BDF8;
          border: 1px solid rgba(56, 189, 248, 0.3);
          font-size: 9px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
          white-space: nowrap;
        }

        /* ECG Waveform Container */
        .console-ecg-box {
          background: #041424;
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 8px;
          height: 38px;
          display: flex;
          align-items: center;
          justifyContent: center;
          padding: 0 8px;
          margin-bottom: 10px;
          position: relative;
          overflow: hidden;
        }

        .ecg-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(12, 74, 110, 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(12, 74, 110, 0.3) 1px, transparent 1px);
          background-size: 16px 16px;
        }

        /* 3 Vitals Metrics Row */
        .console-vitals-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .vital-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 5px 8px;
          display: flex;
          align-items: baseline;
          justifyContent: space-between;
        }

        .vital-val {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .vital-unit {
          font-size: 8.5px;
          color: #94A3B8;
          font-weight: 600;
        }

        /* Bottom Dual Badges */
        .telemetry-bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .telemetry-sub-badge {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .sub-badge-icon {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .sub-badge-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .sub-badge-title {
          font-size: 10px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sub-badge-status {
          font-size: 8.5px;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 1px;
        }

        @media (max-width: 1240px) {
          .admin-hero-stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 860px) {
          .admin-hero-banner-container {
            flex-direction: column;
          }
          .admin-hero-left-col {
            padding: 28px 22px;
            border-right: none !important;
            border-bottom: 1px solid rgba(56, 189, 248, 0.25);
          }
          .admin-hero-right-col {
            min-height: auto;
            padding: 20px;
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
          .telemetry-bottom-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* LEFT COLUMN: Operations Header & Live Badges */}
      <div className="admin-hero-left-col">
        <div>
          {/* Department Security Tag & Hospital Tag */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
            <span style={{ padding: "4px 12px", borderRadius: "9999px", background: "rgba(2, 132, 199, 0.25)", border: "1px solid rgba(56, 189, 248, 0.4)", color: "#38BDF8", fontSize: "11px", fontWeight: 800, letterSpacing: "0.5px" }}>
              🏥 {hospitalName}
            </span>
            <span style={{ padding: "4px 12px", borderRadius: "9999px", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", color: "#BAE6FD", fontSize: "11px", fontWeight: 800, letterSpacing: "0.5px" }}>
              🛡️ {adminDept === "all" ? (isHi ? "सुपर एडमिन कंसोल" : "ALL DEPARTMENTS") : `${deptLabel.toUpperCase()}`}
            </span>
            <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#38BDF8", boxShadow: "0 0 8px #38BDF8" }} />
              {isHi ? "AI ट्राइएज लाइव" : "AI Triage Active"}
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
            <div className="admin-hero-stat-icon-wrap" style={{ color: "#FDE047", background: "rgba(253, 224, 71, 0.15)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="admin-hero-stat-value" style={{ color: "#FDE047" }}>
                {waitingCount !== undefined ? waitingCount : (analytics?.currently_waiting || 0)}
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "प्रतीक्षारत मरीज़" : "Waiting Patients"}
              </div>
            </div>
          </div>

          {/* 2. Currently Serving */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap" style={{ color: "#38BDF8", background: "rgba(56, 189, 248, 0.18)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className="admin-hero-stat-value" style={{ color: "#38BDF8" }}>
                {displayServing}
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "सेवारत टोकन" : "Now Serving"}
              </div>
            </div>
          </div>

          {/* 3. Today's Booked Appointments */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap" style={{ color: "#60A5FA", background: "rgba(96, 165, 250, 0.18)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div className="admin-hero-stat-value" style={{ color: "#60A5FA" }}>
                {appointmentsCount}
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "आज के अपॉइंटमेंट्स" : "Booked Slots"}
              </div>
            </div>
          </div>

          {/* 4. Active Doctor Desks with +/- adjusters */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap" style={{ color: "#FB923C", background: "rgba(251, 146, 60, 0.18)" }}>
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

      {/* RIGHT COLUMN: Clean, High-Tech Clinical Telemetry Hub (Zero Overlaps) */}
      <div className="admin-hero-right-col">
        <div className="telemetry-hub-container">
          {/* Main Clinical Console Card */}
          <div className="telemetry-main-console">
            {/* Header */}
            <div className="console-header">
              <div className="console-title-group">
                <span className="live-pulse-dot" />
                <span className="console-title-text">AI Clinical Telemetry</span>
              </div>
              <span className="console-priority-badge">PRIORITY 1</span>
            </div>

            {/* Patient Consultation Info */}
            <div className="console-patient-strip">
              <div className="patient-strip-left">
                <div className="patient-avatar-circle">
                  🩺
                </div>
                <div>
                  <div className="patient-strip-name">Patient #T-104 • OPD</div>
                  <div className="patient-strip-dept">Cardiology Desk • Token Verified</div>
                </div>
              </div>
              <div className="fast-track-pill">⚡ Fast-Track</div>
            </div>

            {/* ECG Waveform Display */}
            <div className="console-ecg-box">
              <div className="ecg-grid-overlay" />
              <svg viewBox="0 0 400 38" preserveAspectRatio="none" style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}>
                <path
                  d="M0 19 L40 19 L48 10 L56 30 L64 4 L72 34 L80 19 L150 19 L158 11 L166 27 L174 5 L182 33 L190 19 L260 19 L268 10 L276 29 L284 4 L292 34 L300 19 L370 19 L378 12 L386 28 L394 6 L400 19"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* 3 Vital Metrics */}
            <div className="console-vitals-row">
              <div className="vital-chip">
                <span className="vital-val" style={{ color: "#F87171" }}>♥ 74</span>
                <span className="vital-unit">BPM</span>
              </div>
              <div className="vital-chip">
                <span className="vital-val" style={{ color: "#38BDF8" }}>99%</span>
                <span className="vital-unit">SpO₂</span>
              </div>
              <div className="vital-chip">
                <span className="vital-val" style={{ color: "#4ADE80" }}>120/80</span>
                <span className="vital-unit">BP</span>
              </div>
            </div>
          </div>

          {/* Bottom Dual Badges Row: Doctor On Duty & E-Prescription */}
          <div className="telemetry-bottom-row">
            {/* Badge 1: Doctor Credential */}
            <div className="telemetry-sub-badge">
              <div className="sub-badge-icon" style={{ background: "rgba(56, 189, 248, 0.2)", color: "#38BDF8" }}>
                👨‍⚕️
              </div>
              <div className="sub-badge-info">
                <span className="sub-badge-title">DR. ON DUTY</span>
                <span className="sub-badge-status" style={{ color: "#22C55E" }}>● ACTIVE</span>
              </div>
            </div>

            {/* Badge 2: E-Prescription Status */}
            <div className="telemetry-sub-badge">
              <div className="sub-badge-icon" style={{ background: "rgba(2, 132, 199, 0.25)", color: "#BAE6FD" }}>
                Rx
              </div>
              <div className="sub-badge-info">
                <span className="sub-badge-title">E-PRESCRIPTION</span>
                <span className="sub-badge-status" style={{ color: "#38BDF8" }}>VERIFIED ✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const heroContainerStyle = {
  maxWidth: "100%",
  width: "100%",
  boxSizing: "border-box",
};

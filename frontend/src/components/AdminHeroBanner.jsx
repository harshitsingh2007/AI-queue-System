/**
 * AdminHeroBanner.jsx
 * -------------------
 * Executive Doctor & Clinical Operations Dashboard Command Center.
 * Premium Redesign:
 * - Deep luxury midnight obsidian & clinical sapphire palette
 * - Seamless dual-console layout with soft ambient light highlights
 * - High-impact KPI telemetry tiles with vibrant medical accents
 * - Tactile micro-stepper for active desk management
 * - Dynamic, live-connected AI Clinical Telemetry console (adapts to active serving ticket or queue standby)
 * - Animated ECG cardiac waveform with hospital monitor grid & glowing scanline
 * - 1-Click quick call action integrated into telemetry console
 * - 100% responsive across desktop, tablet, and mobile
 */

import React from "react";
import { getCategoryLabel } from "../utils/i18n";

export default function AdminHeroBanner({
  language = "en",
  adminDept = "all",
  hospitalName = "City General Hospital",
  currentUser,
  analytics,
  waitingCount = 0,
  servingCount = 0,
  servingTicket,
  nextTicket,
  appointmentsCount = 0,
  handleCounterChange,
  handleServeNext,
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
    : isHi
    ? "डेस्क खाली"
    : "0 Active";

  const activeCounters = analytics && typeof analytics.active_counters === "number" 
    ? analytics.active_counters 
    : 2;

  const doctorName = currentUser?.name || currentUser?.full_name || (isHi ? "डॉ. ऑन ड्यूटी" : "Dr. On Duty");

  return (
    <div className="admin-hero-banner-container">
      <style>{`
        .admin-hero-banner-container {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          border-radius: 26px;
          overflow: hidden;
          background: radial-gradient(1100px circle at 85% 15%, rgba(14, 165, 233, 0.16) 0%, transparent 55%),
                      radial-gradient(900px circle at 15% 85%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
                      linear-gradient(135deg, #090E1A 0%, #0F1D36 45%, #0B172E 100%);
          box-shadow: 0 24px 50px -12px rgba(2, 6, 23, 0.75), 
                      0 0 35px -5px rgba(14, 165, 233, 0.18),
                      inset 0 1px 0 rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.28);
          margin-bottom: 26px;
          position: relative;
          min-height: 290px;
          width: 100%;
          box-sizing: border-box;
        }

        /* Subtle Ambient Glow Orbs */
        .admin-hero-banner-container::before {
          content: "";
          position: absolute;
          top: -60px;
          right: 180px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
        }

        /* Left Column: Command & Operations */
        .admin-hero-left-col {
          flex: 1.15;
          padding: 32px 36px;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          z-index: 2;
          position: relative;
          min-width: 0;
        }

        @media (min-width: 960px) {
          .admin-hero-left-col {
            padding-right: 38px;
            border-right: 1px solid rgba(56, 189, 248, 0.18);
            background: linear-gradient(90deg, transparent 0%, rgba(15, 29, 54, 0.3) 100%);
          }
        }

        /* Top Tag Pills */
        .admin-hero-tags-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .hero-tag-hospital {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 13px;
          border-radius: 9999px;
          background: rgba(14, 165, 233, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #E0F2FE;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.3px;
          backdrop-filter: blur(8px);
        }

        .hero-tag-dept {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 13px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(52, 211, 153, 0.4);
          color: #A7F3D0;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .hero-tag-ai-live {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94A3B8;
          font-size: 11.5px;
          font-weight: 600;
        }

        .triage-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34D399;
          box-shadow: 0 0 10px #34D399;
          position: relative;
        }

        .triage-pulse-dot::after {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid #34D399;
          animation: pingPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes pingPulse {
          0% { transform: scale(1); opacity: 0.8; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }

        /* Hero Typography */
        .admin-hero-title {
          font-size: 30px;
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.6px;
          color: #FFFFFF;
          margin: 0 0 8px 0;
        }

        .admin-hero-title-gradient {
          background: linear-gradient(90deg, #38BDF8 0%, #34D399 50%, #818CF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.25));
        }

        .admin-hero-subtitle {
          color: #94A3B8;
          font-size: 13.5px;
          line-height: 1.55;
          margin: 0 0 24px 0;
          max-width: 480px;
          font-weight: 450;
        }

        /* 4 KPI Stat Tiles */
        .admin-hero-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          width: 100%;
        }

        .admin-hero-stat-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          box-sizing: border-box;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
        }

        .admin-hero-stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
        }

        .admin-hero-stat-card:hover {
          background: rgba(15, 23, 42, 0.85);
          border-color: rgba(56, 189, 248, 0.45);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 16px rgba(56, 189, 248, 0.12);
        }

        .admin-hero-stat-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justifyContent: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .admin-hero-stat-card:hover .admin-hero-stat-icon-wrap {
          transform: scale(1.06);
        }

        .admin-hero-stat-value {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-hero-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: #94A3B8;
          line-height: 1.2;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Tactile Stepper Buttons */
        .stepper-controls-wrapper {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 2px 3px;
        }

        .counter-adjust-btn {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: none;
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
          font-weight: 800;
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
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
          transform: scale(1.08);
        }

        .counter-adjust-btn:active {
          transform: scale(0.92);
        }

        .counter-adjust-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.05);
        }

        /* RIGHT COLUMN: Executive Clinical Telemetry Hub */
        .admin-hero-right-col {
          flex: 1;
          display: flex;
          align-items: center;
          justifyContent: center;
          position: relative;
          overflow: hidden;
          min-height: 280px;
          padding: 24px 28px;
          box-sizing: border-box;
          background: radial-gradient(circle at 50% 50%, rgba(15, 29, 54, 0.6) 0%, rgba(8, 15, 30, 0.8) 100%);
        }

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
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 20px;
          padding: 16px 18px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), 
                      0 0 24px rgba(56, 189, 248, 0.12),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: border-color 0.2s ease;
        }

        .console-header {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          margin-bottom: 12px;
          padding-bottom: 9px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .console-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .console-title-text {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #F8FAFC;
          text-transform: uppercase;
        }

        .console-status-pill {
          font-size: 9.5px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 9999px;
          letter-spacing: 0.4px;
        }

        .pill-urgent {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #EF4444;
          color: #FCA5A5;
        }

        .pill-active {
          background: rgba(56, 189, 248, 0.2);
          border: 1px solid #38BDF8;
          color: #BAE6FD;
        }

        .pill-standby {
          background: rgba(52, 211, 153, 0.18);
          border: 1px solid #34D399;
          color: #A7F3D0;
        }

        /* Patient Consultation Strip */
        .console-patient-strip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 12px;
          padding: 9px 12px;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          margin-bottom: 11px;
          transition: background 0.2s ease;
        }

        .console-patient-strip:hover {
          background: rgba(255, 255, 255, 0.07);
        }

        .patient-strip-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .patient-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%);
          color: #38BDF8;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 15px;
          flex-shrink: 0;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .patient-strip-name {
          font-size: 12.5px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .patient-strip-dept {
          font-size: 10px;
          color: #94A3B8;
          font-weight: 600;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fast-track-pill {
          background: rgba(56, 189, 248, 0.18);
          color: #38BDF8;
          border: 1px solid rgba(56, 189, 248, 0.35);
          font-size: 9.5px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
          letter-spacing: 0.3px;
        }

        .telemetry-call-quick-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 8px;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          border: 1px solid #38BDF8;
          color: #FFFFFF;
          font-size: 10.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
          white-space: nowrap;
        }

        .telemetry-call-quick-btn:hover {
          background: #0369A1;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
        }

        /* Hospital Grade ECG Waveform Monitor */
        .console-ecg-box {
          background: #030A14;
          border: 1px solid rgba(56, 189, 248, 0.22);
          border-radius: 10px;
          height: 42px;
          display: flex;
          align-items: center;
          justifyContent: center;
          padding: 0 6px;
          margin-bottom: 11px;
          position: relative;
          overflow: hidden;
        }

        .ecg-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(14, 165, 233, 0.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(14, 165, 233, 0.08) 1px, transparent 1px);
          background-size: 14px 14px;
        }

        /* Continuous Flowing Sweep Animation */
        .ecg-scanline {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 30px;
          background: linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.25) 80%, rgba(255, 255, 255, 0.6) 100%);
          animation: ecgSweep 2.4s linear infinite;
          pointer-events: none;
        }

        @keyframes ecgSweep {
          0% { left: -30px; }
          100% { left: 100%; }
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
          border-radius: 9px;
          padding: 6px 10px;
          display: flex;
          align-items: baseline;
          justifyContent: space-between;
          transition: background 0.15s ease;
        }

        .vital-chip:hover {
          background: rgba(255, 255, 255, 0.09);
        }

        .vital-val {
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .vital-unit {
          font-size: 9px;
          color: #94A3B8;
          font-weight: 700;
          text-transform: uppercase;
        }

        .heart-pulse {
          display: inline-block;
          animation: heartBeat 1.2s infinite ease-in-out;
        }

        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.25); }
          30% { transform: scale(1); }
          45% { transform: scale(1.18); }
        }

        /* Bottom Dual Badges */
        .telemetry-bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .telemetry-sub-badge {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(56, 189, 248, 0.22);
          border-radius: 13px;
          padding: 9px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
          transition: border-color 0.2s ease;
        }

        .telemetry-sub-badge:hover {
          border-color: rgba(56, 189, 248, 0.4);
        }

        .sub-badge-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .sub-badge-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .sub-badge-title {
          font-size: 10.5px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.3px;
        }

        .sub-badge-status {
          font-size: 9px;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1240px) {
          .admin-hero-stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 960px) {
          .admin-hero-banner-container {
            flex-direction: column;
          }
          .admin-hero-left-col {
            padding: 28px 24px;
            border-right: none !important;
            border-bottom: 1px solid rgba(56, 189, 248, 0.2);
          }
          .admin-hero-right-col {
            min-height: auto;
            padding: 24px;
            width: 100%;
          }
        }

        @media (max-width: 580px) {
          .admin-hero-title {
            font-size: 24px;
          }
          .admin-hero-stats-row {
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }
          .telemetry-bottom-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* LEFT COLUMN: Executive Operations Header & 4 KPI Metric Tiles */}
      <div className="admin-hero-left-col">
        <div>
          {/* Status Badges Row */}
          <div className="admin-hero-tags-row">
            <span className="hero-tag-hospital">
              🏥 {hospitalName}
            </span>
            <span className="hero-tag-dept">
              🛡️ {adminDept === "all" ? (isHi ? "सुपर एडमिन कंसोल" : "ALL DEPARTMENTS") : `${deptLabel.toUpperCase()}`}
            </span>
            <span className="hero-tag-ai-live">
              <span className="triage-pulse-dot" />
              {isHi ? "AI ट्राइएज लाइव" : "AI Triage Active"}
            </span>
            {currentUser?.name && (
              <span style={{ padding: "5px 12px", borderRadius: "9999px", background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(167, 139, 250, 0.35)", color: "#DDD6FE", fontSize: "11px", fontWeight: 700 }}>
                👨‍⚕️ Dr. {currentUser.name}
              </span>
            )}
          </div>

          {/* Dynamic Headline */}
          <h1 className="admin-hero-title">
            {isHi ? (
              <>
                चिकित्सीय संचालन.
                <br />
                <span className="admin-hero-title-gradient">डॉक्टर एवं स्टाफ कंसोल</span>
              </>
            ) : (
              <>
                Clinical Operations.
                <br />
                <span className="admin-hero-title-gradient">Doctor & Staff Control</span>
              </>
            )}
          </h1>

          <p className="admin-hero-subtitle">
            {isHi
              ? "रीयल-टाइम बहु-विभागीय मरीज़ कॉलिंग, ट्राइएज प्राथमिकता वर्गीकरण एवं क्लिनिकल थ्रूपुट प्रबंधन।"
              : "Real-time multi-department patient calling, triage classification & clinical routing."}
          </p>
        </div>

        {/* 4 Refined KPI Stat Tiles */}
        <div className="admin-hero-stats-row">
          {/* 1. Patients Waiting */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap" style={{ color: "#FBBF24", background: "rgba(245, 158, 11, 0.18)", boxShadow: "0 0 12px rgba(245, 158, 11, 0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="admin-hero-stat-value" style={{ color: "#FDE68A" }}>
                {waitingCount !== undefined ? waitingCount : (analytics?.currently_waiting || 0)}
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "प्रतीक्षारत मरीज़" : "Waiting Patients"}
              </div>
            </div>
          </div>

          {/* 2. Currently Serving */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap" style={{ color: "#34D399", background: "rgba(16, 185, 129, 0.18)", boxShadow: "0 0 12px rgba(16, 185, 129, 0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="admin-hero-stat-value" style={{ color: "#6EE7B7" }}>
                {displayServing}
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "सेवारत टोकन" : "Now Serving"}
              </div>
            </div>
          </div>

          {/* 3. Today's Booked Appointments */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap" style={{ color: "#38BDF8", background: "rgba(14, 165, 233, 0.18)", boxShadow: "0 0 12px rgba(14, 165, 233, 0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="admin-hero-stat-value" style={{ color: "#BAE6FD" }}>
                {appointmentsCount}
              </div>
              <div className="admin-hero-stat-label">
                {isHi ? "आज के अपॉइंटमेंट्स" : "Booked Slots"}
              </div>
            </div>
          </div>

          {/* 4. Active Doctor Desks & Tactile Stepper */}
          <div className="admin-hero-stat-card">
            <div className="admin-hero-stat-icon-wrap" style={{ color: "#A78BFA", background: "rgba(139, 92, 246, 0.18)", boxShadow: "0 0 12px rgba(139, 92, 246, 0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                <span className="admin-hero-stat-value" style={{ color: "#DDD6FE" }}>
                  {activeCounters}
                </span>
                <div className="stepper-controls-wrapper">
                  <button
                    type="button"
                    onClick={() => handleCounterChange && handleCounterChange(-1)}
                    disabled={activeCounters <= 1}
                    className="counter-adjust-btn"
                    title={isHi ? "सक्रिय काउंटर कम करें" : "Decrease Active Desks"}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCounterChange && handleCounterChange(1)}
                    className="counter-adjust-btn"
                    title={isHi ? "सक्रिय काउंटर बढ़ाएं" : "Increase Active Desks"}
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

      {/* RIGHT COLUMN: Executive AI Clinical Telemetry Hub */}
      <div className="admin-hero-right-col">
        <div className="telemetry-hub-container">
          {/* Main Glass Console Card */}
          <div className="telemetry-main-console">
            {/* Header */}
            <div className="console-header">
              <div className="console-title-group">
                <span className="triage-pulse-dot" />
                <span className="console-title-text">
                  {isHi ? "AI क्लिनिकल टेलीमेट्री" : "AI Clinical Telemetry"}
                </span>
              </div>
              {servingTicket ? (
                <span className={`console-status-pill ${servingTicket.priority === "emergency" || servingTicket.priority === "urgent" ? "pill-urgent" : "pill-active"}`}>
                  {servingTicket.priority === "emergency" ? "PRIORITY 1 • CRITICAL" : "PRIORITY 2 • ACTIVE"}
                </span>
              ) : waitingCount > 0 ? (
                <span className="console-status-pill pill-standby">
                  {waitingCount} {isHi ? "प्रतीक्षारत" : "IN LINE"}
                </span>
              ) : (
                <span className="console-status-pill pill-standby">
                  {isHi ? "डेस्क स्टैंडबाय" : "DESK READY"}
                </span>
              )}
            </div>

            {/* Dynamic Patient Consultation Strip */}
            <div className="console-patient-strip">
              {servingTicket ? (
                <>
                  <div className="patient-strip-left">
                    <div className="patient-avatar-circle">
                      🩺
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="patient-strip-name">
                        #{servingTicket.ticket_id} • {servingTicket.name || "Patient"}
                      </div>
                      <div className="patient-strip-dept">
                        {servingTicket.age ? `${servingTicket.age}y • ` : ""}
                        {getCategoryLabel(servingTicket.category || adminDept, language)} Desk
                      </div>
                    </div>
                  </div>
                  <div className="fast-track-pill">
                    {servingTicket.priority === "emergency" ? "🚨 Fast-Track" : "⚡ Active"}
                  </div>
                </>
              ) : waitingCount > 0 ? (
                <>
                  <div className="patient-strip-left">
                    <div className="patient-avatar-circle" style={{ background: "rgba(52, 211, 153, 0.2)", color: "#34D399", borderColor: "rgba(52, 211, 153, 0.35)" }}>
                      ⏳
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="patient-strip-name">
                        {nextTicket ? `#${nextTicket.ticket_id} • ${nextTicket.name}` : `${waitingCount} Patients in Queue`}
                      </div>
                      <div className="patient-strip-dept">
                        {nextTicket ? `${getCategoryLabel(nextTicket.category || adminDept, language)} • Next to call` : "AI Priority Order Sorted"}
                      </div>
                    </div>
                  </div>
                  {handleServeNext && (
                    <button
                      type="button"
                      onClick={handleServeNext}
                      className="telemetry-call-quick-btn"
                      title="Call Next Patient"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span>{isHi ? "बुलाएं" : "Call Next"}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="patient-strip-left">
                    <div className="patient-avatar-circle" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8" }}>
                      ✨
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="patient-strip-name">
                        {isHi ? "कतार खाली है" : "All Queues Clear"}
                      </div>
                      <div className="patient-strip-dept">
                        {isHi ? "नए मरीज़ पंजीकरण हेतु तैयार" : "Standby for new walk-ins & appointments"}
                      </div>
                    </div>
                  </div>
                  <div className="fast-track-pill" style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34D399", borderColor: "rgba(52, 211, 153, 0.3)" }}>
                    ✓ Ready
                  </div>
                </>
              )}
            </div>

            {/* Hospital Grade ECG Waveform Monitor with animated scanline */}
            <div className="console-ecg-box">
              <div className="ecg-grid-overlay" />
              <div className="ecg-scanline" />
              <svg viewBox="0 0 400 42" preserveAspectRatio="none" style={{ width: "100%", height: "100%", position: "relative", zIndex: 1, filter: "drop-shadow(0 0 4px #38BDF8)" }}>
                <path
                  d="M0 21 L35 21 L43 11 L51 32 L59 5 L67 36 L75 21 L140 21 L148 12 L156 30 L164 6 L172 35 L180 21 L245 21 L253 11 L261 31 L269 5 L277 36 L285 21 L350 21 L358 13 L366 30 L374 7 L382 34 L390 21 L400 21"
                  stroke="#38BDF8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* 3 Clinical Metrics */}
            <div className="console-vitals-row">
              <div className="vital-chip">
                <span className="vital-val" style={{ color: "#F87171" }}>
                  <span className="heart-pulse">♥</span> 74
                </span>
                <span className="vital-unit">BPM</span>
              </div>
              <div className="vital-chip">
                <span className="vital-val" style={{ color: "#38BDF8" }}>99%</span>
                <span className="vital-unit">SpO₂</span>
              </div>
              <div className="vital-chip">
                <span className="vital-val" style={{ color: "#34D399" }}>120/80</span>
                <span className="vital-unit">BP</span>
              </div>
            </div>
          </div>

          {/* Bottom Dual Badges: Doctor On Duty & E-Prescription */}
          <div className="telemetry-bottom-row">
            {/* Badge 1: Doctor Duty Status */}
            <div className="telemetry-sub-badge">
              <div className="sub-badge-icon" style={{ background: "rgba(56, 189, 248, 0.2)", color: "#38BDF8" }}>
                👨‍⚕️
              </div>
              <div className="sub-badge-info">
                <span className="sub-badge-title">
                  {currentUser?.name ? `DR. ${currentUser.name.toUpperCase()}` : "DR. ON DUTY"}
                </span>
                <span className="sub-badge-status" style={{ color: "#34D399" }}>
                  ● {isHi ? "सक्रिय कंसोल" : "ACTIVE ON DESK"}
                </span>
              </div>
            </div>

            {/* Badge 2: E-Prescription & AI Engine */}
            <div className="telemetry-sub-badge">
              <div className="sub-badge-icon" style={{ background: "rgba(2, 132, 199, 0.25)", color: "#BAE6FD" }}>
                Rx
              </div>
              <div className="sub-badge-info">
                <span className="sub-badge-title">E-PRESCRIPTION</span>
                <span className="sub-badge-status" style={{ color: "#38BDF8" }}>
                  VERIFIED & SYNCED ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

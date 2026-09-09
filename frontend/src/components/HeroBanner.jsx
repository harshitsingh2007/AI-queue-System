/**
 * HeroBanner.jsx
 * --------------
 * Hospital User/Patient Dashboard Hero Section.
 * Premium dark clinical banner matching AdminHeroBanner design language:
 * - Deep luxury midnight obsidian & clinical sapphire palette
 * - Dual-console layout with ambient light highlights
 * - 4 KPI telemetry stat tiles
 * - Right-side AI Health Monitor console with ECG waveform & vitals
 * - 100% responsive across desktop, tablet, and mobile
 */

import React from "react";

export default function HeroBanner({
  language = "en",
  hospitalName = "City General Hospital",
  stats = {
    patientsServed: "0",
    activeDesks: "0 Active Desks",
    avgWaitTime: "0 min",
    currentlyWaiting: "0 Waiting",
  },
  onOpenHospitalModal = null,
}) {
  const isHi = language === "hi";

  return (
    <div style={{ width: "100%" }} className="hero-banner-container">
      <style>{`
        .hero-banner-container {
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
          margin-bottom: 24px;
          position: relative;
          min-height: 290px;
          width: 100%;
          box-sizing: border-box;
        }

        /* Subtle Ambient Glow Orbs */
        .hero-banner-container::before {
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

        /* Left Column */
        .hero-left-col {
          flex: 1.15;
          padding: 32px 36px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          z-index: 2;
          position: relative;
          min-width: 0;
        }

        @media (min-width: 960px) {
          .hero-left-col {
            padding-right: 38px;
            border-right: 1px solid rgba(56, 189, 248, 0.18);
            background: linear-gradient(90deg, transparent 0%, rgba(15, 29, 54, 0.3) 100%);
          }
        }

        /* Top Tag Pills */
        .hero-tags-row {
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

        .hero-triage-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34D399;
          box-shadow: 0 0 10px #34D399;
          position: relative;
        }

        .hero-triage-pulse-dot::after {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid #34D399;
          animation: heroPingPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes heroPingPulse {
          0% { transform: scale(1); opacity: 0.8; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }

        /* Hero Typography */
        .hero-title {
          font-size: 30px;
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.6px;
          color: #FFFFFF;
          margin: 0 0 8px 0;
        }

        .hero-title-highlight {
          background: linear-gradient(90deg, #38BDF8 0%, #34D399 50%, #818CF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.25));
        }

        .hero-subtitle {
          color: #94A3B8;
          font-size: 13.5px;
          line-height: 1.55;
          margin: 0 0 24px 0;
          max-width: 480px;
          font-weight: 450;
        }

        /* 4 KPI Stat Tiles */
        .hero-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          width: 100%;
        }

        .hero-stat-card {
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

        .hero-stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
        }

        .hero-stat-card:hover {
          background: rgba(15, 23, 42, 0.85);
          border-color: rgba(56, 189, 248, 0.45);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 16px rgba(56, 189, 248, 0.12);
        }

        .hero-stat-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .hero-stat-card:hover .hero-stat-icon-wrap {
          transform: scale(1.06);
        }

        .hero-stat-value {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hero-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: #94A3B8;
          line-height: 1.2;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        /* RIGHT COLUMN: AI Health Monitor Console */
        .hero-right-col {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          min-height: 280px;
          padding: 24px 28px;
          box-sizing: border-box;
          background: radial-gradient(circle at 50% 50%, rgba(15, 29, 54, 0.6) 0%, rgba(8, 15, 30, 0.8) 100%);
        }

        .hero-telemetry-hub {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 2;
        }

        .hero-telemetry-console {
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

        .hero-console-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 9px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .hero-console-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hero-console-title-text {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #F8FAFC;
          text-transform: uppercase;
        }

        .hero-console-status-pill {
          font-size: 9.5px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 9999px;
          letter-spacing: 0.4px;
          background: rgba(52, 211, 153, 0.18);
          border: 1px solid #34D399;
          color: #A7F3D0;
        }

        /* Patient Info Strip */
        .hero-info-strip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 12px;
          padding: 9px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 11px;
          transition: background 0.2s ease;
        }

        .hero-info-strip:hover {
          background: rgba(255, 255, 255, 0.07);
        }

        .hero-info-strip-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .hero-info-avatar {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%);
          color: #38BDF8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .hero-info-name {
          font-size: 12.5px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hero-info-desc {
          font-size: 10px;
          color: #94A3B8;
          font-weight: 600;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hero-ready-pill {
          background: rgba(52, 211, 153, 0.15);
          color: #34D399;
          border: 1px solid rgba(52, 211, 153, 0.3);
          font-size: 9.5px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
          letter-spacing: 0.3px;
        }

        /* ECG Waveform Monitor */
        .hero-ecg-box {
          background: #030A14;
          border: 1px solid rgba(56, 189, 248, 0.22);
          border-radius: 10px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          margin-bottom: 11px;
          position: relative;
          overflow: hidden;
        }

        .hero-ecg-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(14, 165, 233, 0.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(14, 165, 233, 0.08) 1px, transparent 1px);
          background-size: 14px 14px;
        }

        .hero-ecg-scanline {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 30px;
          background: linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.25) 80%, rgba(255, 255, 255, 0.6) 100%);
          animation: heroEcgSweep 2.4s linear infinite;
          pointer-events: none;
        }

        @keyframes heroEcgSweep {
          0% { left: -30px; }
          100% { left: 100%; }
        }

        /* 3 Vitals Metrics Row */
        .hero-vitals-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .hero-vital-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9px;
          padding: 6px 10px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          transition: background 0.15s ease;
        }

        .hero-vital-chip:hover {
          background: rgba(255, 255, 255, 0.09);
        }

        .hero-vital-val {
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .hero-vital-unit {
          font-size: 9px;
          color: #94A3B8;
          font-weight: 700;
          text-transform: uppercase;
        }

        .hero-heart-pulse {
          display: inline-block;
          animation: heroHeartBeat 1.2s infinite ease-in-out;
        }

        @keyframes heroHeartBeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.25); }
          30% { transform: scale(1); }
          45% { transform: scale(1.18); }
        }

        /* Bottom Dual Badges */
        .hero-bottom-badges {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .hero-sub-badge {
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

        .hero-sub-badge:hover {
          border-color: rgba(56, 189, 248, 0.4);
        }

        .hero-sub-badge-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .hero-sub-badge-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .hero-sub-badge-title {
          font-size: 10.5px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.3px;
        }

        .hero-sub-badge-status {
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
          .hero-stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 960px) {
          .hero-banner-container {
            flex-direction: column;
          }
          .hero-left-col {
            padding: 28px 24px;
            border-right: none !important;
            border-bottom: 1px solid rgba(56, 189, 248, 0.2);
          }
          .hero-right-col {
            min-height: auto;
            padding: 24px;
            width: 100%;
          }
        }

        @media (max-width: 580px) {
          .hero-title {
            font-size: 24px;
          }
          .hero-stats-row {
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }
          .hero-bottom-badges {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* LEFT COLUMN: Patient Welcome & 4 KPI Metric Tiles */}
      <div className="hero-left-col">
        <div>
          {/* Status Badges Row */}
          <div className="hero-tags-row">
            <span className="hero-tag-hospital">
              🏥 {hospitalName}
            </span>
            {onOpenHospitalModal && (
              <button
                type="button"
                onClick={onOpenHospitalModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 13px",
                  borderRadius: "9999px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  color: "#A7F3D0",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  letterSpacing: "0.3px",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.3)";
                  e.currentTarget.style.borderColor = "#34D399";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(52, 211, 153, 0.4)";
                }}
                title={isHi ? "अस्पताल बदलें" : "Switch Healthcare Facility"}
              >
                🔄 {isHi ? "अस्पताल बदलें" : "Change Hospital"}
              </button>
            )}
            <span className="hero-tag-ai-live">
              <span className="hero-triage-pulse-dot" />
              {isHi ? "AI ट्राइएज लाइव" : "AI Triage Active"}
            </span>
          </div>

          {/* Operations Overview Label */}
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>
            {isHi ? "मरीज़ पोर्टल" : "PATIENT PORTAL"}
          </div>

          {/* Headline */}
          <h1 className="hero-title">
            {isHi ? (
              <>
                सीधे आएं. परामर्श पाएं.
                <br />
                <span className="hero-title-highlight">हम आपके लिए सदैव तत्पर हैं.</span>
              </>
            ) : (
              <>
                Walk-In. Get Seen.
                <br />
                <span className="hero-title-highlight">We're Here for You.</span>
              </>
            )}
          </h1>

          <p className="hero-subtitle">
            {isHi
              ? "सहज अस्पताल विज़िट हेतु रीयल-टाइम कतार ट्रैकिंग एवं तत्काल टोकन सुविधा।"
              : "Real-time queue tracking & instant token for a smooth hospital visit."}
          </p>
        </div>

        {/* 4 Refined KPI Stat Tiles */}
        <div className="hero-stats-row">
          {/* 1. Active Desks */}
          <div className="hero-stat-card">
            <div className="hero-stat-icon-wrap" style={{ color: "#A78BFA", background: "rgba(139, 92, 246, 0.18)", boxShadow: "0 0 12px rgba(139, 92, 246, 0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="hero-stat-value" style={{ color: "#DDD6FE" }}>
                {stats.activeDesks || "0"}
              </div>
              <div className="hero-stat-label">
                {isHi ? "सक्रिय डेस्क" : "ACTIVE DESKS"}
              </div>
            </div>
          </div>

          {/* 2. Avg Wait Time */}
          <div className="hero-stat-card">
            <div className="hero-stat-icon-wrap" style={{ color: "#34D399", background: "rgba(16, 185, 129, 0.18)", boxShadow: "0 0 12px rgba(16, 185, 129, 0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="hero-stat-value" style={{ color: "#6EE7B7" }}>
                {stats.avgWaitTime || "0 min"}
              </div>
              <div className="hero-stat-label">
                {isHi ? "औसत प्रतीक्षा" : "AVG WAIT TIME"}
              </div>
            </div>
          </div>

          {/* 3. Currently Waiting */}
          <div className="hero-stat-card">
            <div className="hero-stat-icon-wrap" style={{ color: "#FBBF24", background: "rgba(245, 158, 11, 0.18)", boxShadow: "0 0 12px rgba(245, 158, 11, 0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="hero-stat-value" style={{ color: "#FDE68A" }}>
                {stats.currentlyWaiting || "0"}
              </div>
              <div className="hero-stat-label">
                {isHi ? "प्रतीक्षारत मरीज़" : "IN QUEUE"}
              </div>
            </div>
          </div>

          {/* 4. Patients Served Today */}
          <div className="hero-stat-card">
            <div className="hero-stat-icon-wrap" style={{ color: "#38BDF8", background: "rgba(14, 165, 233, 0.18)", boxShadow: "0 0 12px rgba(14, 165, 233, 0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="hero-stat-value" style={{ color: "#BAE6FD" }}>
                {stats.patientsServed || "0"}
              </div>
              <div className="hero-stat-label">
                {isHi ? "आज सेवित" : "PATIENTS SERVED"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Health Monitor Console */}
      <div className="hero-right-col">
        <div className="hero-telemetry-hub">
          {/* Main Glass Console Card */}
          <div className="hero-telemetry-console">
            {/* Header */}
            <div className="hero-console-header">
              <div className="hero-console-title-group">
                <span className="hero-triage-pulse-dot" />
                <span className="hero-console-title-text">
                  {isHi ? "AI हेल्थ मॉनिटर" : "AI HEALTH MONITOR"}
                </span>
                <span style={{ fontSize: "9px", color: "#94A3B8", fontWeight: 500, marginLeft: "4px" }}>
                  {isHi ? "लाइव स्थिति" : "Live status"}
                </span>
              </div>
              <span className="hero-console-status-pill">
                {isHi ? "ऑनलाइन" : "ONLINE"}
              </span>
            </div>

            {/* Queue Status Strip */}
            <div className="hero-info-strip">
              <div className="hero-info-strip-left">
                <div className="hero-info-avatar" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8" }}>
                  ✨
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="hero-info-name">
                    {isHi ? "स्मार्ट कतार प्रणाली" : "Smart Queue System"}
                  </div>
                  <div className="hero-info-desc">
                    {isHi ? "AI-संचालित प्राथमिकता एवं ट्राइएज" : "AI-powered priority & triage sorting"}
                  </div>
                </div>
              </div>
              <div className="hero-ready-pill">
                ✓ {isHi ? "सक्रिय" : "Ready"}
              </div>
            </div>

            {/* Hospital Grade ECG Waveform Monitor */}
            <div className="hero-ecg-box">
              <div className="hero-ecg-grid-overlay" />
              <div className="hero-ecg-scanline" />
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
            <div className="hero-vitals-row">
              <div className="hero-vital-chip">
                <span className="hero-vital-val" style={{ color: "#F87171" }}>
                  <span className="hero-heart-pulse">♥</span> 74
                </span>
                <span className="hero-vital-unit">BPM</span>
              </div>
              <div className="hero-vital-chip">
                <span className="hero-vital-val" style={{ color: "#38BDF8" }}>99%</span>
                <span className="hero-vital-unit">SpO₂</span>
              </div>
              <div className="hero-vital-chip">
                <span className="hero-vital-val" style={{ color: "#34D399" }}>120/80</span>
                <span className="hero-vital-unit">BP</span>
              </div>
            </div>
          </div>

          {/* Bottom Dual Badges */}
          <div className="hero-bottom-badges">
            {/* Badge 1: Smart Queue */}
            <div className="hero-sub-badge">
              <div className="hero-sub-badge-icon" style={{ background: "rgba(56, 189, 248, 0.2)", color: "#38BDF8" }}>
                🏥
              </div>
              <div className="hero-sub-badge-info">
                <span className="hero-sub-badge-title">
                  {isHi ? "स्मार्ट कतार" : "SMART QUEUE"}
                </span>
                <span className="hero-sub-badge-status" style={{ color: "#34D399" }}>
                  ● {isHi ? "AI ट्राइएज सक्रिय" : "AI TRIAGE ACTIVE"}
                </span>
              </div>
            </div>

            {/* Badge 2: E-Prescription */}
            <div className="hero-sub-badge">
              <div className="hero-sub-badge-icon" style={{ background: "rgba(2, 132, 199, 0.25)", color: "#BAE6FD" }}>
                Rx
              </div>
              <div className="hero-sub-badge-info">
                <span className="hero-sub-badge-title">E-PRESCRIPTION</span>
                <span className="hero-sub-badge-status" style={{ color: "#38BDF8" }}>
                  {isHi ? "डिजिटल नुस्खा सुविधा" : "DIGITAL RX ENABLED"} ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

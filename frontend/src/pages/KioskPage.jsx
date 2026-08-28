/**
 * KioskPage.jsx
 * -------------
 * Waiting Room Public Kiosk TV Display.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React from "react";
import { HOSPITAL_CONFIG } from "../config/hospitalConfig";
import { announceTicketVoice } from "../utils/voiceSynthesizer";
import { t } from "../utils/i18n";

export default function KioskPage({
  tenantId,
  analytics,
  queueSnapshot,
  servingTickets,
  kioskQrData,
  language = "en",
  setLanguage,
}) {
  const handleTestAudio = () => {
    announceTicketVoice(
      {
        ticket_id: "T-105",
        name: "Rahul Verma",
        service_category: "Consultation",
      },
      language
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top TV Header Bar */}
      <div style={kioskHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={kioskLogoBadgeStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6v12M6 12h12"/>
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", color: "#064E3B", fontWeight: 900 }}>
              {HOSPITAL_CONFIG.name} — Patient Queue Monitor
            </h1>
            <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
              Real-Time AI Priority Queue & Live Counter Display
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {setLanguage && (
            <div style={kioskLangContainerStyle}>
              <button
                onClick={() => setLanguage("en")}
                style={kioskLangBtnStyle(language === "en")}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("hi")}
                style={kioskLangBtnStyle(language === "hi")}
              >
                हिंदी
              </button>
            </div>
          )}

          <button
            onClick={handleTestAudio}
            style={kioskVoiceBtnStyle}
            title="Test Automated Text-to-Speech Voice Announcement"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            {t("testAudioBtn", language)} ({language === "hi" ? "हिंदी Voice" : "EN Voice"})
          </button>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>{t("estWait", language)}</span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#047857" }}>
              {analytics ? analytics.avg_wait_minutes : 12} min
            </span>
          </div>

          {kioskQrData && (
            <div style={{ textAlign: "center" }}>
              <img
                src={kioskQrData.qr_code_base64}
                alt="Scan to Join Queue"
                style={{ width: "70px", height: "70px", borderRadius: "8px", border: "1px solid #CBD5E1" }}
              />
              <span style={{ fontSize: "9px", color: "#64748B", display: "block", marginTop: "2px", fontWeight: 700 }}>
                {t("scanToJoin", language)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main TV Layout Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>
        {/* Now Serving Big Display */}
        <div style={kioskCardStyle}>
          <div style={{ borderBottom: "2px solid #047857", paddingBottom: "12px", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "22px", color: "#064E3B", fontWeight: 900 }}>
              {t("nowServing", language)}
            </h2>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Please proceed to your assigned doctor desk when your number is displayed below.
            </span>
          </div>

          {servingTickets.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #CBD5E1", color: "#94A3B8" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#64748B" }}>All Desks Available</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>Calling next ticket shortly...</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {servingTickets.map((tItem) => (
                <div key={tItem.ticket_id} style={kioskServingBigCardStyle}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#047857", fontWeight: 800, textTransform: "uppercase" }}>
                      DESK COUNTER ASSIGNED
                    </span>
                    <h2 style={{ margin: "2px 0", fontSize: "42px", fontWeight: 900, color: "#047857" }}>
                      #{tItem.ticket_id}
                    </h2>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>{tItem.name}</span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={kioskDeptBadgeStyle}>{tItem.service_category.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiting Line Snapshot */}
        <div style={kioskCardStyle}>
          <div style={{ borderBottom: "2px solid #0284C7", paddingBottom: "12px", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "22px", color: "#0369A1", fontWeight: 900 }}>
              {t("waitingQueue", language)} ({queueSnapshot.length})
            </h2>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Real-time sequence order calculated by AI priority algorithm.
            </span>
          </div>

          {queueSnapshot.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #CBD5E1", color: "#94A3B8" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#64748B" }}>No Waiting Patients</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>Queue is clear at present.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={kioskTableStyle}>
                <thead>
                  <tr>
                    <th style={kioskThStyle}>Pos</th>
                    <th style={kioskThStyle}>Token ID</th>
                    <th style={kioskThStyle}>Patient Name</th>
                    <th style={kioskThStyle}>Dept</th>
                    <th style={kioskThStyle}>Est Wait</th>
                  </tr>
                </thead>
                <tbody>
                  {queueSnapshot.slice(0, 8).map((t) => (
                    <tr key={t.ticket_id}>
                      <td style={{ ...kioskTdStyle, fontWeight: 800, color: "#475569" }}>#{t.position}</td>
                      <td style={{ ...kioskTdStyle, fontWeight: 900, color: "#047857", fontSize: "16px" }}>#{t.ticket_id}</td>
                      <td style={{ ...kioskTdStyle, fontWeight: 700, fontSize: "14px" }}>{t.name}</td>
                      <td style={{ ...kioskTdStyle, fontWeight: 700, color: "#0284C7" }}>{t.service_category.toUpperCase()}</td>
                      <td style={{ ...kioskTdStyle, fontWeight: 900, color: "#059669", fontSize: "16px" }}>
                        {t.estimated_wait_minutes} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Soft Green Clinical Theme Styles
const kioskLangContainerStyle = {
  display: "flex",
  background: "#F1F5F9",
  borderRadius: "10px",
  padding: "3px",
  border: "1px solid #CBD5E1",
};

const kioskLangBtnStyle = (active) => ({
  padding: "5px 12px",
  borderRadius: "7px",
  border: "none",
  background: active ? "#059669" : "transparent",
  color: active ? "#ffffff" : "#475569",
  fontSize: "12px",
  fontWeight: 800,
  cursor: "pointer",
});

const kioskHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#FFFFFF",
  borderRadius: "20px",
  border: "1px solid #D8E8DD",
  padding: "20px 28px",
  marginBottom: "24px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const kioskVoiceBtnStyle = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid #BAE6FD",
  background: "#E0F2FE",
  color: "#0284C7",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const kioskLogoBadgeStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
};

const kioskCardStyle = {
  background: "#FFFFFF",
  borderRadius: "20px",
  border: "1px solid #D8E8DD",
  padding: "28px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const kioskServingBigCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#ECFDF5",
  borderRadius: "16px",
  border: "2px solid #059669",
  padding: "20px 24px",
};

const kioskDeptBadgeStyle = {
  padding: "6px 14px",
  borderRadius: "10px",
  background: "#047857",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 800,
};

const kioskTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "13px" };
const kioskThStyle = { padding: "12px", textAlign: "left", color: "#64748B", borderBottom: "2px solid #D8E8DD" };
const kioskTdStyle = { padding: "14px 12px", borderBottom: "1px solid #F1F5F9" };

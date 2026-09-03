/**
 * KioskPage.jsx
 * -------------
 * Waiting Room Public Kiosk TV Display.
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect } from "react";
import { HOSPITAL_CONFIG } from "../config/hospitalConfig";
import { announceTicketVoice } from "../utils/voiceSynthesizer";
import { t, getCategoryLabel } from "../utils/i18n";

export default function KioskPage({
  tenantId,
  analytics,
  queueSnapshot,
  servingTickets,
  kioskQrData,
  language = "en",
  setLanguage,
  currentUser,
  navigateTo,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isAdmin = currentUser && currentUser.role === "admin";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => console.log(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch((err) => console.log(err));
      }
    }
  };

  const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ maxWidth: isFullscreen ? "100%" : "1280px", margin: "0 auto", padding: isFullscreen ? "20px 40px" : "0" }}>
      <style>{`
        @media (max-width: 960px) {
          .kiosk-main-grid {
            grid-template-columns: 1fr !important;
          }
          .kiosk-header-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .kiosk-header-right {
            justify-content: space-between !important;
            width: 100% !important;
          }
        }
      `}</style>
      {/* Top TV Header Bar */}
      <div style={kioskHeaderStyle} className="kiosk-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <div style={kioskLogoBadgeStyle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6v12M6 12h12"/>
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "24px", color: "#064E3B", fontWeight: 900 }}>
                {t("hospitalName", language)}
              </h1>
              <span style={{ padding: "3px 10px", borderRadius: "20px", background: "#ECFDF5", color: "#047857", fontSize: "11px", fontWeight: 800, border: "1px solid #A7F3D0", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 8px #10B981" }} />
                {t("liveTvDisplay", language)}
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
              {t("kioskSubtitle", language)}
            </span>
          </div>
        </div>

        {/* Center Digital Clock */}
        <div style={{ textAlign: "center", padding: "8px 18px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", alignSelf: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 900, color: "#0F172A", letterSpacing: "1px" }}>
            {formattedTime}
          </div>
          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>
            {formattedDate}
          </div>
        </div>

        <div className="kiosk-header-right" style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          {/* Language Switcher */}
          {setLanguage && (
            <div style={kioskLangContainerStyle}>
              <button
                onClick={() => setLanguage("en")}
                style={kioskLangBtnStyle(language === "en")}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("hi")}
                style={kioskLangBtnStyle(language === "hi")}
              >
                हिंदी
              </button>
            </div>
          )}

          {/* Fullscreen TV Mode Toggle */}
          <button
            onClick={toggleFullscreen}
            style={kioskFullscreenBtnStyle}
            title="Toggle Fullscreen for Hospital Wall TV"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <>
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </>
              ) : (
                <>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </>
              )}
            </svg>
            {isFullscreen ? t("exitTv", language) : t("fullscreenTv", language)}
          </button>

          {/* Return to Hospital Portal Button */}
          {navigateTo && (
            <button
              onClick={() => navigateTo("patient", "walkin")}
              style={kioskAdminReturnBtnStyle}
              title="Return to Hospital Portal"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              {language === "hi" ? "मुख्य पोर्टल" : "Hospital Home"}
            </button>
          )}

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>{t("estWait", language)}</span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#047857" }}>
              {analytics ? analytics.avg_wait_minutes : 12} {t("unit_min", language)}
            </span>
          </div>

          {kioskQrData && (
            <div style={{ textAlign: "center" }}>
              <img
                src={kioskQrData.qr_code_base64}
                alt="Scan to Join Queue"
                style={{ width: "64px", height: "64px", borderRadius: "8px", border: "1px solid #CBD5E1" }}
              />
              <span style={{ fontSize: "9px", color: "#64748B", display: "block", marginTop: "2px", fontWeight: 700 }}>
                {t("scanToJoin", language)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main TV Layout Grid */}
      <div className="kiosk-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>
        {/* Now Serving Big Display */}
        <div style={kioskCardStyle}>
          <div style={{ borderBottom: "2px solid #047857", paddingBottom: "12px", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "22px", color: "#064E3B", fontWeight: 900 }}>
              {t("nowServing", language)}
            </h2>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              {t("servingNote", language)}
            </span>
          </div>

          {servingTickets.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #CBD5E1", color: "#94A3B8" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#64748B" }}>{t("allDesksAvailable", language)}</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{t("callingNextShortly", language)}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {servingTickets.map((tItem) => (
                <div key={tItem.ticket_id} style={kioskServingBigCardStyle}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#047857", fontWeight: 800, textTransform: "uppercase" }}>
                      {t("deskCounterAssigned", language)}
                    </span>
                    <h2 style={{ margin: "2px 0", fontSize: "42px", fontWeight: 900, color: "#047857" }}>
                      #{tItem.ticket_id}
                    </h2>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>{tItem.name}</span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={kioskDeptBadgeStyle}>{getCategoryLabel(tItem.service_category, language)}</span>
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
              {t("waitingQueueNote", language)}
            </span>
          </div>

          {queueSnapshot.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #CBD5E1", color: "#94A3B8" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#64748B" }}>{t("noWaitingPatients", language)}</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{t("queueClearMsg", language)}</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={kioskTableStyle}>
                <thead>
                  <tr>
                    <th style={kioskThStyle}>{t("pos", language)}</th>
                    <th style={kioskThStyle}>{t("tokenId", language)}</th>
                    <th style={kioskThStyle}>{t("patientNameCol", language)}</th>
                    <th style={kioskThStyle}>{t("deptCol", language)}</th>
                    <th style={kioskThStyle}>{t("estWaitCol", language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {queueSnapshot.slice(0, 8).map((item) => (
                    <tr key={item.ticket_id}>
                      <td style={{ ...kioskTdStyle, fontWeight: 800, color: "#475569" }}>#{item.position}</td>
                      <td style={{ ...kioskTdStyle, fontWeight: 900, color: "#047857", fontSize: "16px" }}>#{item.ticket_id}</td>
                      <td style={{ ...kioskTdStyle, fontWeight: 700, fontSize: "14px" }}>{item.name}</td>
                      <td style={{ ...kioskTdStyle, fontWeight: 700, color: "#0284C7" }}>{getCategoryLabel(item.service_category, language)}</td>
                      <td style={{ ...kioskTdStyle, fontWeight: 900, color: "#059669", fontSize: "16px" }}>
                        {item.estimated_wait_minutes} {t("unit_min", language)}
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
  flexWrap: "wrap",
  gap: "16px",
  background: "#FFFFFF",
  borderRadius: "20px",
  border: "1px solid #D8E8DD",
  padding: "18px 24px",
  marginBottom: "24px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const kioskFullscreenBtnStyle = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid #10B981",
  background: "#ECFDF5",
  color: "#047857",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  transition: "all 0.2s ease",
};

const kioskAdminReturnBtnStyle = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#334155",
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

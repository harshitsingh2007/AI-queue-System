/**
 * QueueSummary.jsx
 * ----------------
 * Real-time Telemetry & QR Code Footer Banner for Hospital Public Kiosk.
 * Displays total waiting count, active counters, average wait time, and mobile join QR code.
 */

import React from "react";
import { t } from "../../utils/i18n";

export default function QueueSummary({
  analytics = null,
  waitingCount = 0,
  servingCount = 0,
  department = null,
  kioskQrData = null,
  language = "en",
  branding = {},
}) {
  const isHi = language === "hi";
  const brandPrimary = branding.primary_color || "#0284C7";

  const avgWait = analytics ? analytics.avg_wait_minutes : 12;
  const activeCounters = analytics ? analytics.active_counters : 2;

  return (
    <div style={containerStyle}>
      <style>{`
        @media (max-width: 800px) {
          .kiosk-summary-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .kiosk-summary-qr {
            border-left: none !important;
            border-top: 1px solid #E2E8F0 !important;
            padding-left: 0 !important;
            padding-top: 14px !important;
            justify-content: flex-start !important;
          }
        }
      `}</style>

      <div className="kiosk-summary-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
        {/* Left: 4 Metric Cards */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", flex: 1 }}>
          {/* Waiting Patients */}
          <div style={metricBoxStyle}>
            <span style={metricLabelStyle}>
              {isHi ? "प्रतीक्षारत मरीज़" : "PEOPLE WAITING"}
            </span>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>
              {waitingCount} <span style={{ fontSize: "14px", fontWeight: 700, color: "#64748B" }}>{isHi ? "मरीज़" : "Patients"}</span>
            </div>
          </div>

          {/* Currently Serving */}
          <div style={metricBoxStyle}>
            <span style={metricLabelStyle}>
              {isHi ? "वर्तमान में सेवारत" : "NOW SERVING"}
            </span>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#0284C7", marginTop: "2px" }}>
              {servingCount} <span style={{ fontSize: "14px", fontWeight: 700, color: "#64748B" }}>{isHi ? "काउंटर" : "Desks"}</span>
            </div>
          </div>

          {/* Average Wait Time */}
          <div style={metricBoxStyle}>
            <span style={metricLabelStyle}>
              {isHi ? "औसत प्रतीक्षा समय" : "ESTIMATED WAIT"}
            </span>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#047857", marginTop: "2px" }}>
              ~{avgWait} <span style={{ fontSize: "14px", fontWeight: 700, color: "#64748B" }}>{t("unit_min", language)}</span>
            </div>
          </div>

          {/* Active Counters */}
          <div style={metricBoxStyle}>
            <span style={metricLabelStyle}>
              {isHi ? "सक्रिय काउंटर" : "ACTIVE CLINICAL DESKS"}
            </span>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#334155", marginTop: "2px" }}>
              {activeCounters} <span style={{ fontSize: "14px", fontWeight: 700, color: "#64748B" }}>{isHi ? "उपलब्ध" : "Open"}</span>
            </div>
          </div>
        </div>

        {/* Right: Scan QR Code to Hold Spot On Phone */}
        {kioskQrData && kioskQrData.qr_code_base64 && (
          <div className="kiosk-summary-qr" style={qrContainerStyle}>
            <img
              src={kioskQrData.qr_code_base64}
              alt="Scan QR to Join Queue"
              style={{ width: "68px", height: "68px", borderRadius: "10px", border: "1px solid #CBD5E1", flexShrink: 0 }}
            />
            <div>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A", display: "block" }}>
                {isHi ? "मोबाइल से कतार में जुड़ें" : "Join Queue on Phone"}
              </span>
              <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: "2px", maxWidth: "160px" }}>
                {isHi ? "क्यूआर कोड स्कैन करें और लाइव स्थिति देखें" : "Scan QR code to track token live on your smartphone"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styling Tokens
const containerStyle = {
  background: "#FFFFFF",
  borderRadius: "20px",
  padding: "16px 24px",
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
  marginTop: "20px",
};

const metricBoxStyle = {
  background: "#F8FAFC",
  borderRadius: "14px",
  padding: "10px 18px",
  border: "1px solid #E2E8F0",
  minWidth: "140px",
  flex: "1 1 auto",
};

const metricLabelStyle = {
  fontSize: "10.5px",
  fontWeight: 800,
  color: "#64748B",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

const qrContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  paddingLeft: "24px",
  borderLeft: "1px solid #E2E8F0",
};

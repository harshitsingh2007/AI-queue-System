/**
 * NextQueue.jsx
 * -------------
 * Public Waiting Line Snapshot for Hospital Waiting Room Kiosk TV.
 * Displays the upcoming tickets in line with position, token ID, department,
 * and AI-estimated wait times. Strictly queue-safe (zero patient PII).
 */

import React from "react";
import { t, getCategoryLabel } from "../../utils/i18n";

export default function NextQueue({
  queueSnapshot = [],
  language = "en",
  branding = {},
}) {
  const isHi = language === "hi";
  const brandPrimary = branding.primary_color || "#0284C7";

  return (
    <section style={containerStyle}>
      {/* Header */}
      <div style={headerBarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={queueIconBadgeStyle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>
              {isHi ? "कतार में अगले मरीज़ (NEXT IN QUEUE)" : "NEXT IN QUEUE"}
            </h2>
            <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
              {isHi ? "प्रतीक्षारत मरीज़ों का क्रम एवं अनुमानित समय" : "Upcoming tokens in order of priority & estimated wait"}
            </span>
          </div>
        </div>

        <span style={countPillStyle}>
          {queueSnapshot.length} {isHi ? "प्रतीक्षारत" : "Waiting"}
        </span>
      </div>

      {/* Queue Content */}
      {queueSnapshot.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconCircleStyle}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 style={{ margin: "14px 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#334155" }}>
            {isHi ? "कतार पूरी तरह खाली है" : "Queue is Currently Clear"}
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>
            {isHi ? "वर्तमान में कोई मरीज़ प्रतीक्षारत नहीं है。" : "No patients waiting in queue at this time."}
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
          {/* Next 3 Highlight Cards (Large Banner Format) */}
          <div style={topNextGridStyle}>
            {queueSnapshot.slice(0, 3).map((item, idx) => {
              const isUrgent = item.priority_level === 1;
              return (
                <div
                  key={item.ticket_id || idx}
                  style={{
                    ...topCardStyle,
                    border: isUrgent ? "2px solid #EF4444" : "1.5px solid #BAE6FD",
                    background: isUrgent ? "#FEF2F2" : "linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={posBadgeStyle}>
                      #{idx + 1} {isHi ? "स्थान" : "NEXT"}
                    </span>
                    {isUrgent && (
                      <span style={urgentBadgeStyle}>
                        {isHi ? "आपातकालीन" : "PRIORITY"}
                      </span>
                    )}
                  </div>

                  <div style={topCardNumberStyle}>
                    #{item.ticket_id}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0369A1" }}>
                      {getCategoryLabel(item.service_category, language)}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748B" }}>
                      ~{Math.round(item.estimated_wait_minutes || 10)} {t("unit_min", language)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subsequent Queue Table (Position 4 onwards) */}
          {queueSnapshot.length > 3 && (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>{isHi ? "क्रम" : "POS"}</th>
                    <th style={thStyle}>{isHi ? "टोकन नंबर" : "TOKEN ID"}</th>
                    <th style={thStyle}>{isHi ? "विभाग" : "DEPARTMENT"}</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>{isHi ? "अनुमानित प्रतीक्षा" : "EST. WAIT"}</th>
                  </tr>
                </thead>
                <tbody>
                  {queueSnapshot.slice(3, 11).map((item, index) => {
                    const actualPos = index + 4;
                    const isUrgent = item.priority_level === 1;
                    return (
                      <tr key={item.ticket_id || index} style={trStyle(index % 2 === 0)}>
                        <td style={{ ...tdStyle, fontWeight: 800, color: "#64748B" }}>
                          #{actualPos}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 900, color: "#0284C7", fontSize: "16px" }}>
                          #{item.ticket_id}
                          {isUrgent && (
                            <span style={{ marginLeft: "6px", fontSize: "10px", padding: "1px 5px", borderRadius: "4px", background: "#FEE2E2", color: "#DC2626", fontWeight: 800 }}>
                              EMERGENCY
                            </span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#334155" }}>
                          {getCategoryLabel(item.service_category, language)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>
                          {Math.round(item.estimated_wait_minutes || 10)} {t("unit_min", language)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// Styling Tokens
const containerStyle = {
  background: "#FFFFFF",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid #E2E8F0",
  boxShadow: "0 8px 30px -4px rgba(15, 23, 42, 0.06)",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  boxSizing: "border-box",
};

const headerBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: "18px",
  borderBottom: "1.5px solid #F1F5F9",
  marginBottom: "16px",
  flexWrap: "wrap",
  gap: "12px",
};

const queueIconBadgeStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
  flexShrink: 0,
};

const countPillStyle = {
  padding: "5px 12px",
  borderRadius: "9999px",
  background: "#F1F5F9",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 800,
  border: "1px solid #CBD5E1",
};

const emptyStateStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "60px 24px",
  background: "#F8FAFC",
  borderRadius: "20px",
  border: "1.5px dashed #CBD5E1",
  textAlign: "center",
};

const emptyIconCircleStyle = {
  width: "68px",
  height: "68px",
  borderRadius: "50%",
  background: "#ECFDF5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const topNextGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
  marginBottom: "14px",
};

const topCardStyle = {
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const posBadgeStyle = {
  fontSize: "11px",
  fontWeight: 800,
  color: "#0369A1",
  textTransform: "uppercase",
};

const urgentBadgeStyle = {
  fontSize: "10px",
  fontWeight: 800,
  color: "#DC2626",
  padding: "1px 6px",
  borderRadius: "4px",
  background: "#FEE2E2",
};

const topCardNumberStyle = {
  fontSize: "clamp(26px, 3.5vw, 36px)",
  fontWeight: 900,
  color: "#0F172A",
  margin: "6px 0",
  lineHeight: "1.1",
};

const tableWrapperStyle = {
  borderRadius: "14px",
  overflow: "hidden",
  border: "1px solid #E2E8F0",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13.5px",
};

const thStyle = {
  padding: "10px 14px",
  background: "#F8FAFC",
  color: "#475569",
  fontWeight: 800,
  fontSize: "11px",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  textAlign: "left",
  borderBottom: "1px solid #E2E8F0",
};

const tdStyle = {
  padding: "12px 14px",
  borderBottom: "1px solid #F1F5F9",
};

const trStyle = (even) => ({
  background: even ? "#FFFFFF" : "#F8FAFC",
  transition: "background 0.15s ease",
});

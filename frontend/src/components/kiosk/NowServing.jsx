/**
 * NowServing.jsx
 * --------------
 * High-Visibility, distance-readable "NOW SERVING" display for Hospital Kiosks and Public TVs.
 * Features:
 * - Huge ticket numbers (48px - 72px)
 * - Clear Counter / Desk Callout
 * - Assigned Doctor/Staff Name
 * - Department Badge
 * - Calling audio wave animations
 */

import React from "react";
import { getCategoryLabel } from "../../utils/i18n";

export default function NowServing({
  servingTickets = [],
  language = "en",
  branding = {},
}) {
  const isHi = language === "hi";
  const brandPrimary = branding.primary_color || "#0284C7";

  return (
    <section style={containerStyle}>
      <style>{`
        @keyframes callingGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.4), 0 8px 24px -4px rgba(2, 132, 199, 0.15);
            border-color: #0284C7;
          }
          50% {
            box-shadow: 0 0 0 10px rgba(2, 132, 199, 0), 0 12px 32px -4px rgba(2, 132, 199, 0.28);
            border-color: #38BDF8;
          }
        }
        .calling-card-active {
          animation: callingGlow 2.4s infinite ease-in-out;
        }
      `}</style>

      {/* Header Banner */}
      <div style={headerBarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={speakerIconBadgeStyle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>
              {isHi ? "वर्तमान में सेवारत (NOW SERVING)" : "NOW SERVING"}
            </h2>
            <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
              {isHi ? "कृपया अपना टोकन नंबर देखें और निर्दिष्ट काउंटर पर जाएं" : "Please watch your token number and proceed to the designated counter"}
            </span>
          </div>
        </div>

        {servingTickets.length > 0 && (
          <span style={activeBadgeStyle}>
            {servingTickets.length} {isHi ? "सक्रिय काउंटर" : "Active Counters"}
          </span>
        )}
      </div>

      {/* Main Serving Area */}
      {servingTickets.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconCircleStyle}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h3 style={{ margin: "14px 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#334155" }}>
            {isHi ? "सभी काउंटर वर्तमान में उपलब्ध हैं" : "All Counters Currently Ready"}
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>
            {isHi ? "अगले मरीज़ को शीघ्र ही बुलाया जाएगा..." : "Next ticket in queue will be called shortly..."}
          </p>
        </div>
      ) : (
        <div style={cardsGridStyle(servingTickets.length)}>
          {servingTickets.map((item, idx) => {
            const isFirst = idx === 0;
            const deskLabel = item.desk_name || (item.counter_number ? `Counter ${item.counter_number}` : `Desk #${item.desk_id || 1}`);
            const doctorLabel = item.doctor_name || item.served_by_doctor_name || null;
            const deptLabel = getCategoryLabel(item.service_category, language);

            return (
              <div
                key={item.ticket_id || idx}
                className={isFirst ? "calling-card-active" : ""}
                style={{
                  ...servingCardStyle,
                  background: isFirst ? "linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)" : "#FFFFFF",
                  border: isFirst ? "2px solid #0284C7" : "1.5px solid #E2E8F0",
                }}
              >
                {/* Top Status & Department */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={callingPillStyle}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0284C7", display: "inline-block" }} />
                    {isHi ? "बुलाया गया • परामर्श" : "NOW CALLING"}
                  </span>
                  <span style={deptPillStyle}>{deptLabel}</span>
                </div>

                {/* Massive Ticket Number */}
                <div style={ticketDisplayNumberStyle}>
                  #{item.ticket_id}
                </div>

                {/* Counter & Doctor Destination Box */}
                <div style={destinationBoxStyle}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#0369A1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {isHi ? "काउंटर / कक्ष" : "PROCEED TO COUNTER"}
                    </span>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>
                      {deskLabel}
                    </div>
                  </div>

                  {doctorLabel && (
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                        {isHi ? "चिकित्सक" : "ATTENDING CLINICIAN"}
                      </span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#334155", marginTop: "2px" }}>
                        {doctorLabel}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
  marginBottom: "20px",
  flexWrap: "wrap",
  gap: "12px",
};

const speakerIconBadgeStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
  flexShrink: 0,
};

const activeBadgeStyle = {
  padding: "5px 12px",
  borderRadius: "9999px",
  background: "#F0FDF4",
  border: "1px solid #BBF7D0",
  color: "#16A34A",
  fontSize: "12px",
  fontWeight: 800,
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
  width: "72px",
  height: "72px",
  borderRadius: "50%",
  background: "#EDF2F7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardsGridStyle = (count) => ({
  display: "grid",
  gridTemplateColumns: count > 1 ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
  gap: "18px",
  alignItems: "stretch",
});

const servingCardStyle = {
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  transition: "all 0.2s ease",
};

const callingPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px 10px",
  borderRadius: "9999px",
  background: "#E0F2FE",
  color: "#0284C7",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "0.5px",
};

const deptPillStyle = {
  padding: "4px 10px",
  borderRadius: "8px",
  background: "#F1F5F9",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 700,
};

const ticketDisplayNumberStyle = {
  fontSize: "clamp(48px, 6vw, 76px)",
  fontWeight: 900,
  color: "#0284C7",
  letterSpacing: "-1.5px",
  margin: "12px 0 18px 0",
  lineHeight: "1",
  textShadow: "0 2px 10px rgba(2, 132, 199, 0.15)",
};

const destinationBoxStyle = {
  background: "#FFFFFF",
  borderRadius: "14px",
  padding: "14px 18px",
  border: "1px solid #BAE6FD",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 2px 8px rgba(2, 132, 199, 0.08)",
  flexWrap: "wrap",
  gap: "10px",
};

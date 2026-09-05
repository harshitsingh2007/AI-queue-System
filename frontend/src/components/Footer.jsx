/**
 * Footer.jsx
 * ----------
 * User Dashboard Footer matching IMAGE 2.
 * Features:
 * - Hospital shield / logo with white medical cross
 * - City General Hospital & "Care you can trust"
 * - Copyright: "© 2024 City General Hospital. All rights reserved."
 * - Healthcare heartbeat graphic (ECG pulse waveform)
 */

import React from "react";
import { HOSPITAL_CONFIG } from "../config/hospitalConfig";

export default function Footer({ language = "en" }) {
  return (
    <footer style={footerWrapperStyle} className="user-dashboard-footer">
      <style>{`
        .user-dashboard-footer {
          margin-top: 40px;
          padding-top: 24px;
          padding-bottom: 20px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-heartbeat-svg {
          filter: drop-shadow(0 2px 4px rgba(2, 132, 199, 0.25));
          transition: transform 0.3s ease;
        }

        .footer-heartbeat-svg:hover {
          transform: scale(1.05);
        }

        @media (max-width: 720px) {
          .user-dashboard-footer {
            flex-direction: column;
            text-align: center;
            justify-content: center;
            gap: 14px;
          }
        }
      `}</style>

      {/* 1. Left: Hospital Logo & Tagline */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={footerLogoShieldStyle}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2.5L4.5 5.5v5.5c0 5.1 3.2 9.85 7.5 11 4.3-1.15 7.5-5.9 7.5-11V5.5L12 2.5z"
              fill="#0284C7"
            />
            <path
              d="M12 7.5v9M7.5 12h9"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A", letterSpacing: "-0.2px", lineHeight: "1.2" }}>
            {HOSPITAL_CONFIG.name || "City General Hospital"}
          </div>
          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500, marginTop: "1px" }}>
            {language === "hi" ? "भरोसेमंद स्वास्थ्य सेवा" : "Care you can trust"}
          </div>
        </div>
      </div>

      {/* 2. Center: Copyright */}
      <div style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 500 }}>
        {language === "hi"
          ? "© 2024 सिटी जनरल अस्पताल. सर्वाधिकार सुरक्षित."
          : "© 2024 City General Hospital. All rights reserved."}
      </div>

      {/* 3. Right: Healthcare Heartbeat Graphic (ECG Pulse Waveform) */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg
          className="footer-heartbeat-svg"
          width="115"
          height="26"
          viewBox="0 0 115 26"
          fill="none"
          stroke="#0284C7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="0,13 28,13 36,13 42,3 48,23 54,8 60,18 66,13 115,13" />
        </svg>
      </div>
    </footer>
  );
}

const footerWrapperStyle = {
  maxWidth: "100%",
  width: "100%",
};

const footerLogoShieldStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  flexShrink: 0,
};

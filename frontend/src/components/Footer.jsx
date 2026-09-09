import React from "react";
import { HOSPITAL_CONFIG } from "../config/hospitalConfig";

export default function Footer({ language = "en", hospitalName, currentUser }) {

  // Derive the active hospital name from props, currentUser, localStorage, or fallback
  const getDynamicHospitalName = () => {
    if (hospitalName && typeof hospitalName === "string" && hospitalName.trim()) {
      return hospitalName.trim();
    }
    if (currentUser?.hospital_name && typeof currentUser.hospital_name === "string" && currentUser.hospital_name.trim()) {
      return currentUser.hospital_name.trim();
    }
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("ai_queue_user");
        if (saved) {
          const u = JSON.parse(saved);
          if (u && u.hospital_name && typeof u.hospital_name === "string" && u.hospital_name.trim()) {
            return u.hospital_name.trim();
          }
        }
      }
    } catch (e) { }
    return HOSPITAL_CONFIG.name || "City General Hospital";
  };

  const effectiveHospitalName = getDynamicHospitalName();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full max-w-full mt-10 pt-6 pb-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 max-[720px]:flex-col max-[720px]:justify-center max-[720px]:text-center max-[720px]:gap-3.5">

      {/* 1. Left: Hospital Logo & Dynamic Name & Tagline */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2.5L4.5 5.5v5.5c0 5.1 3.2 9.85 7.5 11 4.3-1.15 7.5-5.9 7.5-11V5.5L12 2.5z"
              className="fill-sky-600"
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
        <div className="text-left">
          <div className="font-extrabold text-sm text-slate-900 tracking-[-0.2px] leading-tight">
            {effectiveHospitalName}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {language === "hi" ? "भरोसेमंद स्वास्थ्य सेवा" : "Care you can trust"}
          </div>
        </div>
      </div>

      {/* 2. Center: Dynamic Copyright with Hospital Name */}
      <div className="text-[12.5px] text-slate-500 font-medium">
        {language === "hi"
          ? `© ${currentYear} ${effectiveHospitalName}. सर्वाधिकार सुरक्षित.`
          : `© ${currentYear} ${effectiveHospitalName}. All rights reserved.`}
      </div>

      {/* 3. Right: Healthcare Heartbeat Graphic (ECG Pulse Waveform) */}
      <div className="flex items-center">
        <svg
          width="115"
          height="26"
          viewBox="0 0 115 26"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-sky-600 drop-shadow-[0_2px_4px_rgba(2,132,199,0.25)] transition-transform duration-300 ease-in-out hover:scale-105"
        >
          <polyline points="0,13 28,13 36,13 42,3 48,23 54,8 60,18 66,13 115,13" />
        </svg>
      </div>
    </footer>
  );
}
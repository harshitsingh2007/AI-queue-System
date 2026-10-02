import React from "react";

/**
 * SuperAdminHospitalIllustration: Vector Healthcare Visual matching Image 2
 */
export default function SuperAdminHospitalIllustration() {
    return (
        <svg
            viewBox="0 0 540 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%", maxHeight: "320px", display: "block" }}
            preserveAspectRatio="xMidYMid meet"
        >
            <rect width="540" height="320" fill="url(#skyGrad)" />
            <defs>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F0F9FF" />
                    <stop offset="60%" stopColor="#E0F2FE" />
                    <stop offset="100%" stopColor="#BAE6FD" />
                </linearGradient>
            </defs>

            {/* Clouds */}
            <ellipse cx="90" cy="50" rx="35" ry="14" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="440" cy="60" rx="42" ry="16" fill="#FFFFFF" opacity="0.85" />

            {/* Hospital Modern Building */}
            <rect x="140" y="70" width="260" height="210" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
            <rect x="230" y="45" width="80" height="30" rx="6" fill="#0284C7" />
            <text x="270" y="65" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif">HQ</text>

            {/* Medical Cross Sign */}
            <circle cx="270" cy="110" r="18" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
            <path d="M270 100v20M260 110h20" stroke="#0369A1" strokeWidth="4" strokeLinecap="round" />

            {/* Windows Grid */}
            <rect x="160" y="145" width="34" height="24" rx="4" fill="#BAE6FD" />
            <rect x="204" y="145" width="34" height="24" rx="4" fill="#BAE6FD" />
            <rect x="302" y="145" width="34" height="24" rx="4" fill="#BAE6FD" />
            <rect x="346" y="145" width="34" height="24" rx="4" fill="#BAE6FD" />

            <rect x="160" y="185" width="34" height="24" rx="4" fill="#BAE6FD" />
            <rect x="204" y="185" width="34" height="24" rx="4" fill="#BAE6FD" />
            <rect x="302" y="185" width="34" height="24" rx="4" fill="#BAE6FD" />
            <rect x="346" y="185" width="34" height="24" rx="4" fill="#BAE6FD" />

            {/* Main Glass Door */}
            <rect x="245" y="215" width="50" height="65" rx="4" fill="#0F172A" />
            <rect x="250" y="220" width="18" height="55" rx="2" fill="#7DD3FC" opacity="0.8" />
            <rect x="272" y="220" width="18" height="55" rx="2" fill="#7DD3FC" opacity="0.8" />

            {/* Trees & Landscaping */}
            <circle cx="90" cy="255" r="28" fill="#0EA5E9" opacity="0.85" />
            <rect x="86" y="270" width="8" height="15" fill="#0F172A" />
            <circle cx="450" cy="255" r="32" fill="#0284C7" opacity="0.85" />
            <rect x="446" y="270" width="8" height="15" fill="#0F172A" />
        </svg>
    );
}

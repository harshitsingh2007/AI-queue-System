import React from "react";
import {
    IconHospital,
    IconPlus,
    IconClock,
    IconStethoscope,
    IconCheckCircle,
    IconUsers,
    IconActivity,
    IconDesk,
    IconTrendingUp,
    IconAlertTriangle,
    IconFileText,
    IconZap,
    IconFlame,
    IconLightbulb,
    IconBuilding,
    IconShield,
    IconPhone,
    IconMapPin,
    IconEdit,
    IconChart,
} from "../SuperAdminIcons";
import {
    standaloneCardStyle,
    actionBtnStyle,
} from "../superAdminStyles";
import { getCategoryLabel } from "../../../utils/i18n";
import "../SuperAdmin.css";

export default function Hospital360Overview({
    selectedHospital,
    hospitals = [],
    setSelectedHospital,
    onSelectHospitalTenant,
    hospitalBranding,
    hospitalAnalytics,
    hospitalQueueSnapshot = [],
    hospitalServingTickets = [],
    hospitalDesksData = { departments: [], active_desks: 0, total_desks: 0 },
    hospitalEmployees = [],
    hospitalDepts = [],
    hospitalVisitsData = {},
    visitHistorySearchQuery = "",
    setVisitHistorySearchQuery,
    visitHistoryStatusFilter = "all",
    setVisitHistoryStatusFilter,
    showVisitHistoryTable = false,
    setShowVisitHistoryTable,
    analyticsViewTab = "all",
    setAnalyticsViewTab,
    hoveredChartHour = null,
    setHoveredChartHour,
    lastSyncedAt,
    theme = "dark",
    brandingForm = {},
    loadHospitalBrandingData,
    setActiveTab,
    setActiveBrandingTab,
    setShowAddHospitalModal,
    setShowAddDeskModal,
    setShowNABHReportModal,
    handleDownloadVisitHistory,
    computeHourlyAnalytics,
    computeDepartmentBottlenecks,
    isHi = false,
}) {
    const currentHosp = selectedHospital || hospitals[0] || null;

    if (!currentHosp) {
        return (
            <div style={standaloneCardStyle}>
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <IconHospital size={44} color="#94A3B8" />
                    <h3 style={{ margin: "14px 0 6px", color: "var(--superadmin-text-main, #0F172A)", fontSize: "18px", fontWeight: 800 }}>
                        {isHi ? "कोई अस्पताल उपलब्ध नहीं है" : "No Hospital Data Available"}
                    </h3>
                    <p style={{ margin: "0 0 20px", color: "var(--superadmin-text-muted, #64748B)", fontSize: "13.5px" }}>
                        {isHi ? "कृपया पहले अस्पताल जोड़ें या नेटवर्क से एक का चयन करें।" : "Please add a hospital first or select one from the directory."}
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowAddHospitalModal(true)}
                        style={{
                            ...actionBtnStyle,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                        }}
                    >
                        <IconPlus size={15} />
                        <span>{isHi ? "+ नया अस्पताल जोड़ें" : "+ Add Hospital"}</span>
                    </button>
                </div>
            </div>
        );
    }

    const activeBranding = currentHosp.branding || hospitalBranding || {};
    const facilityPrimary = activeBranding.primary_color || "#0284C7";
    const facilitySecondary = activeBranding.secondary_color || "#0369A1";
    const facilityAccent = activeBranding.accent_color || "#F0F9FF";
    const facilityLogo = activeBranding.logo_url || null;
    const facilityTagline = activeBranding.tagline || (isHi ? "एनएबीएच मान्यता प्राप्त • 24x7 क्लिनिकल सेवा" : "Care you can trust • NABH Accredited Facility");
    const facilityHours = activeBranding.opd_start_time && activeBranding.opd_end_time
        ? `${activeBranding.opd_start_time} - ${activeBranding.opd_end_time}`
        : "08:00 - 20:00";
    const helpline = activeBranding.emergency_helpline || currentHosp.phone || "108 / Emergency";

    // Aggregate metrics & Footfall history
    const waitingCount = hospitalAnalytics?.waiting_count ?? hospitalQueueSnapshot.length;
    const servingCount = hospitalAnalytics?.serving_count ?? hospitalServingTickets.length;
    const completedToday = hospitalAnalytics?.completed_today ?? 0;
    const avgWait = hospitalAnalytics?.avg_wait_minutes ?? 12;
    const activeDesksCount = hospitalDesksData.active_desks || 0;
    const totalDesksCount = hospitalDesksData.total_desks || 0;
    const doctorsCount = hospitalEmployees.filter((e) => (e.role || "").toLowerCase() === "doctor").length;
    const staffCount = hospitalEmployees.filter((e) => (e.role || "").toLowerCase() !== "doctor").length;

    const footfallSummary = hospitalVisitsData?.summary || {};
    const allTimePatientsVisited = footfallSummary.total_patients_visited_all_time ?? (hospitalAnalytics?.total_patients_visited_all_time || 0);
    const allTimeCompleted = footfallSummary.all_time_completed ?? 0;
    const todayFootfall = footfallSummary.today_patients_visited ?? completedToday;
    const thisMonthFootfall = footfallSummary.this_month_visits ?? 0;
    const rawVisits = hospitalVisitsData?.visits || [];


    // Flatten all desks for visual map
    const allDesks = [];
    (hospitalDesksData.departments || []).forEach((dept) => {
        (dept.desks || []).forEach((desk) => {
            allDesks.push({
                ...desk,
                dept_name: dept.name || desk.department_name || desk.dept_code,
            });
        });
    });

    const isDark360 = theme === "dark";
    const textMuted = isDark360 ? "#94A3B8" : "#64748B";

    // Check OPD Open status:
    const nowTime = new Date();
    const currH = nowTime.getHours();
    const currM = nowTime.getMinutes();
    const [opdStartH = 8, opdStartM = 0] = (activeBranding.opd_start_time || "08:00").split(":").map(Number);
    const [opdEndH = 20, opdEndM = 0] = (activeBranding.opd_end_time || "20:00").split(":").map(Number);
    const isOpdOpen = (currH > opdStartH || (currH === opdStartH && currM >= opdStartM)) &&
        (currH < opdEndH || (currH === opdEndH && currM <= opdEndM));

    // Personnel statistics
    const allPersonnel = hospitalEmployees || [];
    const docsList = allPersonnel.filter(e => {
        const role = (e.role || "").toLowerCase();
        return role === "doctor" || role === "physician" || (e.name || "").toLowerCase().startsWith("dr.");
    });
    const effectiveDocs = docsList.length > 0 ? docsList : allPersonnel;

    let docsAvailable = 0;
    let docsBusy = 0;
    let docsUnavailable = 0;

    effectiveDocs.forEach(d => {
        const isOnline = (d.status || "").toLowerCase() === "active";
        const isServingNow = (hospitalServingTickets || []).some(t =>
            t.served_by_doctor_id === d.id ||
            t.served_by_doctor_id === d.user_id ||
            t.doctor_id === d.id ||
            (t.served_by_doctor_email && d.email && t.served_by_doctor_email.toLowerCase() === d.email.toLowerCase()) ||
            (t.served_by_doctor_name && d.name && t.served_by_doctor_name.trim().toLowerCase() === d.name.trim().toLowerCase())
        );

        if (!isOnline) {
            docsUnavailable += 1;
        } else if (isServingNow) {
            docsBusy += 1;
        } else {
            docsAvailable += 1;
        }
    });

    // Queue Pressure Counts
    const countEmergency = (hospitalQueueSnapshot || []).filter(t => t.priority_level === 1 || (t.priority || "").toLowerCase() === "emergency").length;
    const countHigh = (hospitalQueueSnapshot || []).filter(t => t.priority_level === 2 || (t.priority || "").toLowerCase() === "high").length;
    const countNormal = (hospitalQueueSnapshot || []).filter(t => t.priority_level === 3 || (t.priority || "").toLowerCase() === "normal" || (!t.priority_level && (t.priority || "").toLowerCase() !== "emergency" && (t.priority || "").toLowerCase() !== "high")).length;

    // Block Bar Render Helper
    const renderTelemetryBlocks = (count, max, color, totalChars = 14) => {
        if (count <= 0) {
            return (
                <span style={{ color: textMuted, fontSize: "12px", fontFamily: "ui-monospace, monospace" }}>
                    —
                </span>
            );
        }
        const filled = max > 0 ? Math.max(1, Math.min(totalChars, Math.round((count / max) * totalChars))) : 1;
        return (
            <span style={{
                color,
                letterSpacing: "1.5px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "13px",
                fontWeight: 800,
            }}>
                {"█".repeat(filled)}
            </span>
        );
    };

    const secondsSinceSync = Math.max(0, Math.floor((Date.now() - (lastSyncedAt ? new Date(lastSyncedAt).getTime() : Date.now())) / 1000));
    const syncLabel = secondsSinceSync <= 2 ? "just now" : `${secondsSinceSync}s ago`;

    // Analytics calculations
    const hourlyAnalytics = computeHourlyAnalytics ? computeHourlyAnalytics(rawVisits, hospitalQueueSnapshot) : { hourlyData: [], maxVolume: 6, peakHourLabel: "10 AM - 12 PM", peakAvgWait: 14 };
    const bottleneckAnalytics = computeDepartmentBottlenecks ? computeDepartmentBottlenecks(hospitalDepts, hospitalQueueSnapshot, rawVisits) : [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            {/* 1. EXECUTIVE FACILITY IDENTITY & CONTROL BANNER */}
            <div
                className="overview-facility-banner"
                style={{
                    background: `linear-gradient(135deg, var(--superadmin-card-bg, #FFFFFF) 0%, ${facilityAccent} 100%)`,
                    borderRadius: "24px",
                    border: "1.5px solid var(--superadmin-card-border, #E2E8F0)",
                    padding: "24px 28px",
                    boxShadow: "var(--superadmin-card-shadow, 0 4px 20px -2px rgba(2, 132, 199, 0.06))",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "260px" }}>
                        {/* Logo or Medical Icon */}
                        <div
                            style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "18px",
                                background: "var(--superadmin-card-bg, #FFFFFF)",
                                border: `1.5px solid ${facilityPrimary}30`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                                flexShrink: 0,
                            }}
                        >
                            {facilityLogo ? (
                                <img
                                    src={facilityLogo}
                                    alt={currentHosp.name}
                                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = "none";
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        background: `linear-gradient(135deg, ${facilityPrimary} 0%, ${facilitySecondary} 100%)`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#FFFFFF",
                                    }}
                                >
                                    <IconHospital size={30} />
                                </div>
                            )}
                        </div>

                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                <h1
                                    style={{
                                        margin: 0,
                                        fontSize: "22px",
                                        color: "var(--superadmin-text-main, #0F172A)",
                                        fontWeight: 800,
                                        letterSpacing: "-0.4px",
                                    }}
                                >
                                    {currentHosp.name}
                                </h1>
                                <span
                                    style={{
                                        fontSize: "11.5px",
                                        fontWeight: 700,
                                        padding: "3px 9px",
                                        borderRadius: "20px",
                                        background: currentHosp.status === "active" ? "#DCFCE7" : "var(--superadmin-sub-card, #F1F5F9)",
                                        color: currentHosp.status === "active" ? "#15803D" : "var(--superadmin-text-muted, #64748B)",
                                        border: currentHosp.status === "active" ? "1px solid #BBF7D0" : "1px solid var(--superadmin-card-border, #E2E8F0)",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: "6px",
                                            height: "6px",
                                            borderRadius: "50%",
                                            background: currentHosp.status === "active" ? "#16A34A" : "#94A3B8",
                                        }}
                                    />
                                    {currentHosp.status === "active" ? (isHi ? "सक्रिय शाखा" : "Active Facility") : (isHi ? "निष्क्रिय" : "Inactive")}
                                </span>

                                <span
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        padding: "2px 8px",
                                        borderRadius: "6px",
                                        background: isOpdOpen ? "#DCFCE7" : "#FEF3C7",
                                        color: isOpdOpen ? "#15803D" : "#B45309",
                                        border: isOpdOpen ? "1px solid #BBF7D0" : "1px solid #FDE68A",
                                    }}
                                >
                                    {isOpdOpen ? (isHi ? "ओपीडी खुला है" : "OPD Open") : (isHi ? "ओपीडी बंद है" : "OPD Closed")}
                                </span>
                            </div>
                            <p style={{ margin: "4px 0 0", color: "var(--superadmin-text-sub, #475569)", fontSize: "13px", fontWeight: 500 }}>
                                {facilityTagline}
                            </p>
                        </div>
                    </div>

                    {/* Facility Controls: Switcher, Branding, Edit Hospital */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "var(--superadmin-card-bg, #FFFFFF)",
                                padding: "6px 12px",
                                borderRadius: "12px",
                                border: "1px solid var(--superadmin-card-border, #CBD5E1)",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                            }}
                        >
                            <IconHospital size={15} color={facilityPrimary} />
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--superadmin-text-sub, #475569)" }}>
                                {isHi ? "अस्पताल:" : "Facility:"}
                            </span>
                            <select
                                value={currentHosp.hospital_code}
                                onChange={(e) => {
                                    const found = hospitals.find((h) => h.hospital_code === e.target.value);
                                    if (found) {
                                        if (setSelectedHospital) setSelectedHospital(found);
                                        if (onSelectHospitalTenant) onSelectHospitalTenant(found.hospital_code);
                                    }
                                }}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    color: "var(--superadmin-text-main, #0F172A)",
                                    cursor: "pointer",
                                    outline: "none",
                                    paddingRight: "6px",
                                }}
                            >
                                {hospitals.map((h) => (
                                    <option key={h.hospital_code} value={h.hospital_code}>
                                        {h.name} ({h.hospital_code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (currentHosp) {
                                    if (setSelectedHospital) setSelectedHospital(currentHosp);
                                    if (loadHospitalBrandingData) loadHospitalBrandingData(currentHosp);
                                }
                                if (setActiveBrandingTab) setActiveBrandingTab("profile");
                                if (setActiveTab) setActiveTab("branding");
                                window.scrollTo({ top: 380, behavior: "smooth" });
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                                color: "#FFFFFF",
                                border: "none",
                                fontSize: "12.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
                            }}
                            title={isHi ? "अस्पताल कस्टमाइज़ेशन स्टूडियो पर जाएं" : "Go to Hospital Customization Studio"}
                        >
                            <IconEdit size={14} color="#FFFFFF" />
                            <span>{isHi ? "कस्टमाइज़ेशन स्टूडियो" : "Customization Studio"}</span>
                        </button>
                    </div>
                </div>

                {/* Badges / Meta Pills Bar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        flexWrap: "wrap",
                        paddingTop: "14px",
                        borderTop: "1px solid var(--superadmin-card-border, rgba(226, 232, 240, 0.8))",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--superadmin-text-sub, #475569)" }}>
                        <IconPhone size={14} color={facilityPrimary} />
                        <span style={{ fontWeight: 600 }}>{helpline}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--superadmin-text-sub, #475569)" }}>
                        <IconClock size={14} color={facilityPrimary} />
                        <span style={{ fontWeight: 600 }}>{isHi ? `ओपीडी समय: ${facilityHours}` : `OPD Hours: ${facilityHours}`}</span>
                    </div>

                    {currentHosp.address && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--superadmin-text-sub, #475569)" }}>
                            <IconMapPin size={14} color={facilityPrimary} />
                            <span style={{ fontWeight: 500 }}>{currentHosp.address}</span>
                        </div>
                    )}

                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--superadmin-text-muted, #64748B)" }}>
                            {isHi ? "अस्पताल कोड:" : "Hospital Code:"}
                        </span>
                        <code
                            style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                padding: "2px 7px",
                                background: "var(--superadmin-sub-card, #E2E8F0)",
                                borderRadius: "6px",
                                color: "var(--superadmin-text-main, #334155)",
                            }}
                        >
                            {currentHosp.hospital_code}
                        </code>
                    </div>
                </div>
            </div>

            {/* 2. REAL-TIME CLINICAL KPI TELEMETRY METRICS STRIP (6 HIGH-IMPACT CARDS) */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: "14px",
                }}
            >
                {/* KPI 1: Waiting In Queue */}
                <div className="overview-kpi-card" style={{ border: "1.5px solid #FEF3C7" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#D97706" }}>
                            {isHi ? "प्रतीक्षारत मरीज" : "Waiting in Queue"}
                        </span>
                        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B" }}>
                            <IconClock size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: "30px", fontWeight: 900, color: "#F59E0B", letterSpacing: "-0.5px" }}>
                        {waitingCount}
                    </div>
                    <span style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #78350F)", marginTop: "4px", fontWeight: 600 }}>
                        {isHi ? "ओपीडी कतार में सक्रिय" : "Live in waiting lounge"}
                    </span>
                </div>

                {/* KPI 2: Serving Currently */}
                <div className="overview-kpi-card" style={{ border: "1.5px solid #BAE6FD" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0284C7" }}>
                            {isHi ? "परामर्श जारी" : "In Consultation"}
                        </span>
                        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(2, 132, 199, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284C7" }}>
                            <IconStethoscope size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: "30px", fontWeight: 900, color: "#0284C7", letterSpacing: "-0.5px" }}>
                        {servingCount}
                    </div>
                    <span style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #075985)", marginTop: "4px", fontWeight: 600 }}>
                        {isHi ? "डॉक्टर के साथ सक्रिय" : "At active counters right now"}
                    </span>
                </div>

                {/* KPI 3: Completed Today */}
                <div className="overview-kpi-card" style={{ border: "1.5px solid #D1FAE5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#059669" }}>
                            {isHi ? "आज पूर्ण परामर्श" : "Treated Today"}
                        </span>
                        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                            <IconCheckCircle size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: "30px", fontWeight: 900, color: "#10B981", letterSpacing: "-0.5px" }}>
                        {completedToday}
                    </div>
                    <span style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #064E3B)", marginTop: "4px", fontWeight: 600 }}>
                        {isHi ? "आज के सफल डिस्चार्ज" : "Completed patient visits"}
                    </span>
                </div>

                {/* KPI 4: Total Patients Visited Till Now */}
                <div className="overview-kpi-card" style={{ border: "1.5px solid #C7D2FE" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#6366F1" }}>
                            {isHi ? "अब तक कुल मरीज" : "Visited Till Now"}
                        </span>
                        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1" }}>
                            <IconUsers size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: "30px", fontWeight: 900, color: "#818CF8", letterSpacing: "-0.5px" }}>
                        {allTimePatientsVisited}
                    </div>
                    <span style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #3730A3)", marginTop: "4px", fontWeight: 600 }}>
                        {isHi ? `आज: ${todayFootfall} • माह: ${thisMonthFootfall}` : `Today: ${todayFootfall} • Month: ${thisMonthFootfall}`}
                    </span>
                </div>

                {/* KPI 5: Avg Consultation Wait */}
                <div className="overview-kpi-card" style={{ border: "1.5px solid #E0E7FF" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#4F46E5" }}>
                            {isHi ? "औसत प्रतीक्षा समय" : "Avg. Wait Time"}
                        </span>
                        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(79, 70, 229, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1" }}>
                            <IconActivity size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: "30px", fontWeight: 900, color: "#6366F1", letterSpacing: "-0.5px" }}>
                        ~{avgWait} <span style={{ fontSize: "14px", fontWeight: 700 }}>min</span>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #3730A3)", marginTop: "4px", fontWeight: 600 }}>
                        {isHi ? "स्मार्ट एआई थ्रूपुट" : "AI estimated turnaround"}
                    </span>
                </div>

            </div>

            {/* 3. CONSOLIDATED REAL-TIME ANALYTICS, HOURLY HEATMAP & BOTTLENECK ANALYZER */}
            <div style={standaloneCardStyle}>
                {/* Section Header with Quick Actions & NABH Report Trigger */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--superadmin-card-border, #E2E8F0)", paddingBottom: "14px" }}>
                    <div>
                        <h2 style={{ margin: "0 0 4px 0", fontSize: "19px", color: "var(--superadmin-text-main, #0F172A)", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                            <IconChart size={18} color="#0284C7" />
                            <span>{isHi ? "रीयल-टाइम क्लिनिकल एनालिटिक्स एवं बॉटलनेक इंटेलिजेंस" : "Unified Visual Analytics & Department Bottleneck Radar"}</span>
                        </h2>
                        <p style={{ margin: 0, color: "var(--superadmin-text-muted, #64748B)", fontSize: "12.5px" }}>
                            {isHi ? "प्रति घंटा मरीज आवक, औसत प्रतीक्षा समय, विभागवार बॉटलनेक विश्लेषण और एनएबीएच रिपोर्टिंग।" : "Hourly footfall velocity, wait-time vs. consultation timeline, department bottlenecks, and NABH audit reporting."}
                        </p>
                    </div>

                    {/* Top Controls: View Switcher + 1-Click NABH Executive Report Button */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        {/* Sub-view switcher pills */}
                        <div style={{ display: "inline-flex", background: "var(--superadmin-sub-card, #1E293B)", padding: "3px", borderRadius: "10px", border: "1px solid var(--superadmin-card-border, #334155)" }}>
                            {[
                                { id: "all", label: isHi ? "सभी दृश्य" : "360° All", icon: IconZap },
                                { id: "hourly", label: isHi ? "प्रति घंटा हीटमैप" : "Hourly Heatmap", icon: IconTrendingUp },
                                { id: "bottleneck", label: isHi ? "बॉटलनेक विश्लेषक" : "Bottleneck Radar", icon: IconAlertTriangle },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setAnalyticsViewTab && setAnalyticsViewTab(tab.id)}
                                    style={{
                                        padding: "5px 12px",
                                        borderRadius: "7px",
                                        border: "none",
                                        fontSize: "11.5px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        background: analyticsViewTab === tab.id ? "#0284C7" : "transparent",
                                        color: analyticsViewTab === tab.id ? "#FFFFFF" : "var(--superadmin-text-muted, #94A3B8)",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* 1-Click Executive NABH Daily Report Modal Button */}
                        <button
                            type="button"
                            onClick={() => setShowNABHReportModal && setShowNABHReportModal(true)}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "7px",
                                background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                                color: "#FFFFFF",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                padding: "7px 14px",
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: 800,
                                cursor: "pointer",
                                boxShadow: "0 2px 10px rgba(2, 132, 199, 0.35)",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <IconFileText size={15} />
                            <span>{isHi ? "एनएबीएच दैनिक रिपोर्ट (PDF/Excel)" : "NABH Executive Report (PDF/Excel)"}</span>
                        </button>
                    </div>
                </div>

                {/* FEATURE 1: HOURLY FOOTFALL & WAIT TIME HEATMAP (INTERACTIVE SVG CHART) */}
                {(analyticsViewTab === "all" || analyticsViewTab === "hourly") && (
                    <div
                        className="overview-sub-panel"
                        style={{
                            marginBottom: "20px",
                            padding: "20px",
                            borderRadius: "18px",
                            border: "1.5px solid var(--superadmin-card-border, #E2E8F0)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--superadmin-text-main, #0F172A)" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IconTrendingUp size={16} color="#0284C7" /><span>{isHi ? "प्रति घंटा मरीज आवागमन एवं प्रतीक्षा समय हीटमैप" : "Hourly Footfall & Wait Time Timeline"}</span></span>
                                    </span>
                                </div>
                                <span style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #64748B)" }}>
                                    {isHi ? "प्रति घंटा मरीज संख्या (बार), औसत प्रतीक्षा (गोल्ड लाइन) एवं परामर्श अवधि (हरा लाइन)" : "Hourly patient volume (Bars) vs Avg Wait Time (Gold) vs Consult Duration (Emerald)"}
                                </span>
                            </div>

                            {/* Peak Rush Window Badge */}
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "rgba(245, 158, 11, 0.15)",
                                    border: "1px solid rgba(245, 158, 11, 0.35)",
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    color: "#F59E0B",
                                    fontSize: "11.5px",
                                    fontWeight: 800,
                                }}
                            >
                                <IconFlame size={14} color="#F59E0B" />
                                <span>{isHi ? `शिखर समय: ${hourlyAnalytics.peakHourLabel} (~${hourlyAnalytics.peakAvgWait} मिनट प्रतीक्षा)` : `Peak Rush: ${hourlyAnalytics.peakHourLabel} (~${hourlyAnalytics.peakAvgWait}m avg wait)`}</span>
                            </div>
                        </div>

                        {/* SVG Interactive Chart Component */}
                        <div style={{ position: "relative", width: "100%", height: "200px", background: "var(--superadmin-sub-card, #131D31)", borderRadius: "14px", padding: "14px 10px 8px 10px", border: "1px solid var(--superadmin-card-border, #1E293B)", boxSizing: "border-box" }}>
                            <svg viewBox="0 0 620 160" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
                                        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.4" />
                                    </linearGradient>
                                    <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#67E8F9" stopOpacity="1" />
                                        <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.7" />
                                    </linearGradient>
                                </defs>

                                {/* Horizontal Grid lines */}
                                <line x1="0" y1="20" x2="620" y2="20" stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 3" />
                                <line x1="0" y1="60" x2="620" y2="60" stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 3" />
                                <line x1="0" y1="100" x2="620" y2="100" stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 3" />
                                <line x1="0" y1="135" x2="620" y2="135" stroke="rgba(148, 163, 184, 0.25)" />

                                {/* Bars & Trendline Calculations */}
                                {(() => {
                                    const chartW = 620;
                                    const barSlotW = chartW / (hourlyAnalytics.hourlyData.length || 1);
                                    const barW = Math.max(14, barSlotW * 0.45);
                                    const maxVol = Math.max(hourlyAnalytics.maxVolume, 6);

                                    const waitPoints = hourlyAnalytics.hourlyData.map((d, i) => {
                                        const cx = i * barSlotW + barSlotW / 2;
                                        const cy = 135 - (Math.min(d.avgWait, 30) / 30) * 115;
                                        return `${cx},${cy}`;
                                    }).join(" ");

                                    const consultPoints = hourlyAnalytics.hourlyData.map((d, i) => {
                                        const cx = i * barSlotW + barSlotW / 2;
                                        const cy = 135 - (Math.min(d.avgConsult, 25) / 25) * 115;
                                        return `${cx},${cy}`;
                                    }).join(" ");

                                    return (
                                        <React.Fragment>
                                            {/* Patient Volume Bars */}
                                            {hourlyAnalytics.hourlyData.map((d, i) => {
                                                const x = i * barSlotW + (barSlotW - barW) / 2;
                                                const barHeight = Math.max(4, (d.count / maxVol) * 110);
                                                const y = 135 - barHeight;
                                                const isHovered = hoveredChartHour === i;

                                                return (
                                                    <g key={i} onMouseEnter={() => setHoveredChartHour && setHoveredChartHour(i)} onMouseLeave={() => setHoveredChartHour && setHoveredChartHour(null)} style={{ cursor: "pointer" }}>
                                                        <rect
                                                            x={x}
                                                            y={y}
                                                            width={barW}
                                                            height={barHeight}
                                                            rx="4"
                                                            fill={isHovered ? "url(#barHoverGradient)" : "url(#barGradient)"}
                                                        />
                                                        {d.count > 0 && (
                                                            <text x={x + barW / 2} y={y - 4} fill={isHovered ? "#38BDF8" : "#94A3B8"} fontSize="9.5" fontWeight="700" textAnchor="middle">
                                                                {d.count}
                                                            </text>
                                                        )}
                                                        <text x={i * barSlotW + barSlotW / 2} y="152" fill="var(--superadmin-text-muted, #94A3B8)" fontSize="9" fontWeight="600" textAnchor="middle">
                                                            {d.label}
                                                        </text>
                                                    </g>
                                                );
                                            })}

                                            <polyline fill="none" stroke="#10B981" strokeWidth="2" points={consultPoints} strokeDasharray="4 2" />
                                            <polyline fill="none" stroke="#F59E0B" strokeWidth="2.5" points={waitPoints} />

                                            {hourlyAnalytics.hourlyData.map((d, i) => {
                                                const cx = i * barSlotW + barSlotW / 2;
                                                const cy = 135 - (Math.min(d.avgWait, 30) / 30) * 115;
                                                return (
                                                    <circle
                                                        key={`pt-${i}`}
                                                        cx={cx}
                                                        cy={cy}
                                                        r={hoveredChartHour === i ? "5" : "3"}
                                                        fill="#F59E0B"
                                                        stroke="#131D31"
                                                        strokeWidth="1.5"
                                                    />
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })()}
                            </svg>
                        </div>

                        {/* Chart Legend & Live Tooltip Bar */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "11.5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--superadmin-text-sub, #CBD5E1)" }}>
                                    <span style={{ width: "12px", height: "10px", background: "#38BDF8", borderRadius: "2px" }} />
                                    <span>Patient Footfall</span>
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--superadmin-text-sub, #CBD5E1)" }}>
                                    <span style={{ width: "12px", height: "3px", background: "#F59E0B", borderRadius: "2px" }} />
                                    <span>Avg Wait Time (~mins)</span>
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--superadmin-text-sub, #CBD5E1)" }}>
                                    <span style={{ width: "12px", height: "2px", background: "#10B981", borderRadius: "2px" }} />
                                    <span>Avg Consult Duration</span>
                                </span>
                            </div>

                            {hoveredChartHour !== null && hourlyAnalytics.hourlyData[hoveredChartHour] && (
                                <div style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "6px", padding: "3px 10px", color: "#38BDF8", fontWeight: 700 }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><IconClock size={12} color="#38BDF8" /> {hourlyAnalytics.hourlyData[hoveredChartHour].hour} — Footfall: {hourlyAnalytics.hourlyData[hoveredChartHour].count} | Wait: ~{hourlyAnalytics.hourlyData[hoveredChartHour].avgWait}m | Consult: ~{hourlyAnalytics.hourlyData[hoveredChartHour].avgConsult}m</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FEATURE 2: DEPARTMENT BOTTLENECK ANALYZER & LOAD GAUGES */}
                {(analyticsViewTab === "all" || analyticsViewTab === "bottleneck") && (
                    <div
                        className="overview-sub-panel"
                        style={{
                            marginBottom: "20px",
                            padding: "20px",
                            borderRadius: "18px",
                            border: "1.5px solid var(--superadmin-card-border, #E2E8F0)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--superadmin-text-main, #0F172A)" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IconAlertTriangle size={16} color="#EF4444" /><span>{isHi ? "विभागवार बॉटलनेक विश्लेषक एवं थ्रूपुट रडार" : "Department Bottleneck Analyzer & Traffic Shares"}</span></span>
                                    </span>
                                </div>
                                <span style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #64748B)" }}>
                                    {isHi ? "विभागवार मरीज भार, टर्नअराउंड समय (TAT), एवं स्मार्ट एआई लोड संतुलन सिफारिशें" : "Cross-departmental patient volume distribution, turnaround times, and smart AI load balancing"}
                                </span>
                            </div>

                            <span style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #64748B)", fontWeight: 700 }}>
                                {bottleneckAnalytics.length} {isHi ? "सक्रिय विभाग" : "Active Departments Monitored"}
                            </span>
                        </div>

                        {/* 2-Column: Left Donut Distribution & Right Bottleneck Detail Cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                            {/* Department Breakdown Cards */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {bottleneckAnalytics.map((dept) => (
                                    <div
                                        key={dept.code}
                                        className="overview-inner-card"
                                        style={{
                                            borderRadius: "12px",
                                            border: `1.5px solid ${dept.severityBorder}`,
                                            background: dept.severityBg,
                                            padding: "12px 14px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--superadmin-text-main, #0F172A)" }}>{dept.name}</span>
                                                <span style={{ fontSize: "10px", background: "var(--superadmin-sub-card, #1E293B)", color: "#38BDF8", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>{dept.code}</span>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "10.5px",
                                                    fontWeight: 800,
                                                    padding: "2px 8px",
                                                    borderRadius: "6px",
                                                    background: dept.severity === "SEVERE" ? "rgba(239, 68, 68, 0.2)" : dept.severity === "MODERATE" ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                                                    color: dept.severityColor,
                                                    border: `1px solid ${dept.severityBorder}`,
                                                }}
                                            >
                                                {dept.severity === "SEVERE" ? "HIGH CONGESTION" : dept.severity === "MODERATE" ? "MODERATE LOAD" : "OPTIMAL FLOW"}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "var(--superadmin-text-sub, #CBD5E1)" }}>
                                            <span>Traffic: <strong>{dept.totalVolume}</strong> patients ({dept.sharePercent}%)</span>
                                            <span>In Queue: <strong style={{ color: dept.waitingCount > 3 ? "#EF4444" : "#10B981" }}>{dept.waitingCount}</strong> waiting</span>
                                            <span>Avg TAT: <strong>~{dept.avgTAT}m</strong></span>
                                        </div>

                                        {/* AI Recommendation Pill */}
                                        <div style={{ fontSize: "10.5px", color: dept.severityColor, fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                                            <IconLightbulb size={14} color="#F59E0B" />
                                            <span>{dept.recommendation}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Donut Traffic Distribution Visual Ring */}
                            <div
                                className="overview-inner-card"
                                style={{
                                    borderRadius: "14px",
                                    border: "1px solid var(--superadmin-card-border, #E2E8F0)",
                                    padding: "16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "12px",
                                }}
                            >
                                <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--superadmin-text-sub, #CBD5E1)", textTransform: "uppercase" }}>
                                    {isHi ? "विभागवार मरीज हिस्सा (%)" : "Department Traffic Share Distribution"}
                                </span>

                                {/* Donut SVG */}
                                <svg width="150" height="150" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="16" />
                                    {(() => {
                                        const colors = ["#0284C7", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4"];
                                        const circumference = 2 * Math.PI * 38;
                                        let accumulatedPercent = 0;

                                        return bottleneckAnalytics.map((dept, i) => {
                                            const strokeDasharray = `${(dept.sharePercent / 100) * circumference} ${circumference}`;
                                            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                                            accumulatedPercent += dept.sharePercent;

                                            return (
                                                <circle
                                                    key={dept.code}
                                                    cx="50"
                                                    cy="50"
                                                    r="38"
                                                    fill="none"
                                                    stroke={colors[i % colors.length]}
                                                    strokeWidth="16"
                                                    strokeDasharray={strokeDasharray}
                                                    strokeDashoffset={strokeDashoffset}
                                                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                                                />
                                            );
                                        });
                                    })()}
                                    <text x="50" y="48" textAnchor="middle" fill="var(--superadmin-text-main, #F8FAFC)" fontSize="12" fontWeight="900">
                                        {allTimePatientsVisited}
                                    </text>
                                    <text x="50" y="60" textAnchor="middle" fill="var(--superadmin-text-muted, #94A3B8)" fontSize="7" fontWeight="700">
                                        PATIENTS
                                    </text>
                                </svg>

                                {/* Department Legend */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", fontSize: "11px" }}>
                                    {bottleneckAnalytics.map((dept, i) => {
                                        const colors = ["#0284C7", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4"];
                                        return (
                                            <span key={dept.code} style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--superadmin-text-sub, #CBD5E1)" }}>
                                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[i % colors.length] }} />
                                                <span>{dept.name} ({dept.sharePercent}%)</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Visual Analytics 2-Column Grid (Triage, Doctor Duty & Live Serving Stream) */}
                {(analyticsViewTab === "all" || analyticsViewTab === "hourly") && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "18px" }}>
                        {/* GRAPH 1: Department Traffic & Capacity Saturation Meters */}
                        <div
                            className="overview-sub-panel"
                            style={{
                                borderRadius: "18px",
                                border: "1.5px solid var(--superadmin-card-border, #E2E8F0)",
                                padding: "18px 20px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "14px",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--superadmin-text-main, #0F172A)" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IconBuilding size={16} color="#0284C7" /><span>{isHi ? "विभागवार क्षमता एवं लोड मीटर" : "Department Traffic & Capacity Meters"}</span></span>
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab && setActiveTab("depts")}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#0284C7",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    {isHi ? "प्रबंधित करें →" : "Manage →"}
                                </button>
                            </div>

                            {hospitalDepts.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "24px 16px", color: "var(--superadmin-text-muted, #94A3B8)", fontSize: "12.5px" }}>
                                    {isHi ? "कोई विभाग पंजीकृत नहीं है।" : "No clinical departments registered."}
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {hospitalDepts.map((dept) => {
                                        const dCode = dept.dept_code;
                                        const deptWaiting = hospitalQueueSnapshot.filter(
                                            (t) => (t.dept_code === dCode || t.department === dCode || (t.token_number && t.token_number.startsWith(dCode.substring(0, 1).toUpperCase())))
                                        ).length;
                                        const deptDesksObj = (hospitalDesksData.departments || []).find((d) => d.dept_code === dCode);
                                        const deptDesksCount = deptDesksObj ? deptDesksObj.total_desks : 0;
                                        const deptActiveDesks = deptDesksObj ? deptDesksObj.active_desks : 0;

                                        const loadLevel = deptWaiting > 10 ? "high" : deptWaiting > 3 ? "medium" : "normal";
                                        const barColor = loadLevel === "high" ? "#EF4444" : loadLevel === "medium" ? "#F59E0B" : "#10B981";
                                        const loadPercent = Math.min(100, Math.max(12, deptWaiting * 12));

                                        return (
                                            <div
                                                key={dCode}
                                                className="overview-inner-card"
                                                style={{
                                                    borderRadius: "12px",
                                                    border: "1px solid var(--superadmin-card-border, #E2E8F0)",
                                                    padding: "10px 14px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "6px",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ fontWeight: 800, color: "var(--superadmin-text-main, #0F172A)" }}>{dept.name}</span>
                                                        <code style={{ fontSize: "10px", background: "var(--superadmin-sub-card, #F1F5F9)", color: "var(--superadmin-text-muted, #64748B)", padding: "1px 5px", borderRadius: "4px" }}>
                                                            {dCode}
                                                        </code>
                                                    </div>

                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11.5px" }}>
                                                        <span style={{ color: "var(--superadmin-text-muted, #64748B)" }}>
                                                            {deptActiveDesks}/{deptDesksCount} desks
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontWeight: 800,
                                                                padding: "1px 7px",
                                                                borderRadius: "8px",
                                                                background: loadLevel === "high" ? "#FEE2E2" : loadLevel === "medium" ? "#FEF3C7" : "#DCFCE7",
                                                                color: loadLevel === "high" ? "#B91C1C" : loadLevel === "medium" ? "#B45309" : "#15803D",
                                                            }}
                                                        >
                                                            {deptWaiting} {isHi ? "वेटिंग" : "waiting"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Visual Progress Bar */}
                                                <div style={{ width: "100%", height: "7px", borderRadius: "6px", background: "var(--superadmin-card-border, #E2E8F0)", overflow: "hidden" }}>
                                                    <div
                                                        style={{
                                                            width: `${loadPercent}%`,
                                                            height: "100%",
                                                            background: barColor,
                                                            borderRadius: "6px",
                                                            transition: "width 0.4s ease",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* GRAPH 2: Urgency & Triage Pressure Breakdown */}
                        <div
                            className="overview-sub-panel"
                            style={{
                                borderRadius: "18px",
                                border: "1.5px solid var(--superadmin-card-border, #E2E8F0)",
                                padding: "18px 20px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "14px",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--superadmin-text-main, #0F172A)" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IconShield size={16} color="#0284C7" /><span>{isHi ? "कतार प्राथमिकता एवं ट्राइएज दबाव" : "Queue Urgency & Triage Pressure"}</span></span>
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        padding: "2px 8px",
                                        borderRadius: "6px",
                                        background: countEmergency > 0 ? "#FEE2E2" : "#DCFCE7",
                                        color: countEmergency > 0 ? "#B91C1C" : "#15803D",
                                        border: countEmergency > 0 ? "1px solid #FECACA" : "1px solid #BBF7D0",
                                    }}
                                >
                                    {countEmergency > 0 ? "PRIORITY SURGE" : "NOMINAL PRESSURE"}
                                </span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }} />
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#EF4444" }}>Level 1: Emergency ({countEmergency})</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        {renderTelemetryBlocks(countEmergency, Math.max(waitingCount, 1), "#EF4444", 12)}
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#F59E0B" }}>Level 2: Urgent / High ({countHigh})</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        {renderTelemetryBlocks(countHigh, Math.max(waitingCount, 1), "#F59E0B", 12)}
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }} />
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#10B981" }}>Level 3: Normal / Standard ({countNormal})</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        {renderTelemetryBlocks(countNormal, Math.max(waitingCount, 1), "#10B981", 12)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

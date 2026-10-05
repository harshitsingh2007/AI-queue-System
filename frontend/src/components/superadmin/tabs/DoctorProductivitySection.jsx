import React, { useState, useMemo } from "react";
import {
    IconStethoscope,
    IconUsers,
    IconClock,
    IconCheckCircle,
    IconActivity,
    IconSearch,
    IconBuilding,
    IconShield,
    IconDesk,
    IconX,
} from "../SuperAdminIcons";

export default function DoctorProductivitySection({
    selectedHospital,
    hospitalEmployees = [],
    hospitalDesksData = { departments: [] },
    hospitalVisitsData = {},
    hospitalQueueSnapshot = [],
    hospitalServingTickets = [],
    isHi = false,
    theme = "dark",
    setActiveTab,
}) {
    const isDark = theme === "dark";
    const [searchQuery, setSearchQuery] = useState("");
    const [deptFilter, setDeptFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Extract visits list safely
    const rawVisits = useMemo(() => {
        if (!hospitalVisitsData) return [];
        if (Array.isArray(hospitalVisitsData.visits)) return hospitalVisitsData.visits;
        if (Array.isArray(hospitalVisitsData)) return hospitalVisitsData;
        return [];
    }, [hospitalVisitsData]);

    // Flatten all desks across departments
    const allDesks = useMemo(() => {
        const desks = [];
        (hospitalDesksData.departments || []).forEach((dept) => {
            (dept.desks || []).forEach((desk) => {
                desks.push({ ...desk, dept_name: dept.dept_name, dept_code: dept.dept_code });
            });
        });
        return desks;
    }, [hospitalDesksData]);

    // Filter employees to doctors/physicians/clinicians
    const doctorsList = useMemo(() => {
        return (hospitalEmployees || []).filter((e) => {
            const role = (e.role || "").toLowerCase();
            return role === "doctor" || role === "physician" || role === "specialist" || role === "surgeon";
        });
    }, [hospitalEmployees]);

    // Compute comprehensive doctor metrics
    const doctorMetrics = useMemo(() => {
        return doctorsList.map((doc) => {
            const docId = doc.id;
            const docName = doc.name || "Doctor";
            const docDept = doc.department || "General OPD";

            // Find assigned desk if any
            const assignedDesk = allDesks.find(
                (d) =>
                    (d.assigned_employee_id && Number(d.assigned_employee_id) === Number(docId)) ||
                    (d.assigned_user_id && Number(d.assigned_user_id) === Number(docId)) ||
                    (d.assigned_employee_name && d.assigned_employee_name.trim().toLowerCase() === docName.trim().toLowerCase()) ||
                    (d.staff_name && d.staff_name.trim().toLowerCase() === docName.trim().toLowerCase())
            );

            // Check if currently serving a live ticket
            const liveTicket = assignedDesk
                ? (hospitalServingTickets || []).find(
                    (t) =>
                        t.counter === assignedDesk.desk_name ||
                        t.assigned_counter === assignedDesk.desk_name ||
                        (t.assigned_desk_id && Number(t.assigned_desk_id) === Number(assignedDesk.id))
                ) ||
                (hospitalQueueSnapshot || []).find(
                    (q) =>
                        (q.status === "serving" || q.status === "SERVING") &&
                        (q.counter === assignedDesk.desk_name || q.desk_name === assignedDesk.desk_name)
                )
                : null;

            // Compute completed visits for this doctor's department or doctor name
            const docVisits = rawVisits.filter(
                (v) =>
                    (v.doctor_id && Number(v.doctor_id) === Number(docId)) ||
                    (v.doctor_name && v.doctor_name.trim().toLowerCase() === docName.trim().toLowerCase()) ||
                    (v.served_by && v.served_by.trim().toLowerCase() === docName.trim().toLowerCase()) ||
                    (v.department && v.department.toLowerCase() === docDept.toLowerCase())
            );

            // Compute average consultation duration (TAT)
            let totalConsultMins = 0;
            let validConsultCount = 0;
            docVisits.forEach((v) => {
                const dur = Number(v.service_duration_minutes || v.consult_duration || 0);
                if (dur > 0) {
                    totalConsultMins += dur;
                    validConsultCount++;
                }
            });

            const avgConsultMins =
                validConsultCount > 0
                    ? Math.round((totalConsultMins / validConsultCount) * 10) / 10
                    : 11.5;

            // Compliance with NABH standard of <= 15 mins
            const isNABHCompliant = avgConsultMins <= 15.0;
            const complianceScore = Math.max(70, Math.min(100, Math.round(100 - Math.max(0, avgConsultMins - 15) * 4)));

            // Velocity (patients per hour)
            const velocityPerHour = avgConsultMins > 0 ? (60 / avgConsultMins).toFixed(1) : "5.0";

            // Status determination
            const isOnline = (doc.status || "active").toLowerCase() === "active";
            let dutyStatus = "offline";
            let dutyStatusLabel = isHi ? "ऑफ़लाइन" : "Offline";
            let dutyStatusColor = "#94A3B8";
            let dutyStatusBg = "rgba(148, 163, 184, 0.12)";

            if (isOnline) {
                if (liveTicket) {
                    dutyStatus = "serving";
                    dutyStatusLabel = isHi ? `परामर्श जारी (#${liveTicket.ticket_id || liveTicket.token_number || ""})` : `Serving (#${liveTicket.ticket_id || liveTicket.token_number || ""})`;
                    dutyStatusColor = "#0284C7";
                    dutyStatusBg = "rgba(2, 132, 199, 0.15)";
                } else if (assignedDesk && (assignedDesk.status || "").toUpperCase() === "AVAILABLE") {
                    dutyStatus = "available";
                    dutyStatusLabel = isHi ? "उपलब्ध (डेस्क सक्रिय)" : "Active on Desk";
                    dutyStatusColor = "#10B981";
                    dutyStatusBg = "rgba(16, 185, 129, 0.15)";
                } else if (assignedDesk && (assignedDesk.status || "").toUpperCase() === "PAUSED") {
                    dutyStatus = "paused";
                    dutyStatusLabel = isHi ? "अल्पविराम पर" : "On Break";
                    dutyStatusColor = "#F59E0B";
                    dutyStatusBg = "rgba(245, 158, 11, 0.15)";
                } else {
                    dutyStatus = "on_duty";
                    dutyStatusLabel = isHi ? "ऑन ड्यूटी (बिना काउंटर)" : "Standby / Unassigned";
                    dutyStatusColor = "#64748B";
                    dutyStatusBg = "rgba(100, 116, 139, 0.12)";
                }
            }

            return {
                id: docId,
                name: docName,
                employee_id: doc.employee_id || `DOC-${docId}`,
                department: docDept,
                phone: doc.phone || "—",
                assignedDesk: assignedDesk ? assignedDesk.desk_name : null,
                patientsConsulted: docVisits.length,
                avgConsultMins,
                isNABHCompliant,
                complianceScore,
                velocityPerHour,
                dutyStatus,
                dutyStatusLabel,
                dutyStatusColor,
                dutyStatusBg,
                liveTicket,
            };
        });
    }, [doctorsList, allDesks, hospitalServingTickets, hospitalQueueSnapshot, rawVisits, isHi]);

    // Unique departments for filter
    const departments = useMemo(() => {
        const set = new Set();
        doctorMetrics.forEach((d) => d.department && set.add(d.department));
        return Array.from(set);
    }, [doctorMetrics]);

    // Filtered doctor list
    const filteredDoctors = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return doctorMetrics.filter((d) => {
            if (query) {
                const matchName = d.name.toLowerCase().includes(query);
                const matchDept = d.department.toLowerCase().includes(query);
                const matchId = d.employee_id.toLowerCase().includes(query);
                if (!matchName && !matchDept && !matchId) return false;
            }
            if (deptFilter !== "all" && d.department !== deptFilter) return false;
            if (statusFilter !== "all") {
                if (statusFilter === "active" && d.dutyStatus === "offline") return false;
                if (statusFilter === "serving" && d.dutyStatus !== "serving") return false;
                if (statusFilter === "available" && d.dutyStatus !== "available") return false;
                if (statusFilter === "offline" && d.dutyStatus !== "offline") return false;
            }
            return true;
        });
    }, [doctorMetrics, searchQuery, deptFilter, statusFilter]);

    // Hospital-wide clinical aggregate stats
    const totalDoctorsOnDuty = doctorMetrics.filter((d) => d.dutyStatus !== "offline").length;
    const totalConsultations = doctorMetrics.reduce((acc, d) => acc + d.patientsConsulted, 0);
    const overallAvgDuration =
        doctorMetrics.length > 0
            ? (doctorMetrics.reduce((acc, d) => acc + d.avgConsultMins, 0) / doctorMetrics.length).toFixed(1)
            : "12.0";
    const nabhComplianceRate =
        doctorMetrics.length > 0
            ? Math.round((doctorMetrics.filter((d) => d.isNABHCompliant).length / doctorMetrics.length) * 100)
            : 100;

    return (
        <div
            className="overview-sub-panel"
            style={{
                marginTop: "20px",
                marginBottom: "20px",
                padding: "22px 24px",
                borderRadius: "20px",
                border: "1.5px solid var(--superadmin-card-border, #E2E8F0)",
                background: "var(--superadmin-card-bg, #FFFFFF)",
                boxShadow: "0 4px 20px -2px rgba(2, 132, 199, 0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "14px",
                    borderBottom: "1px solid var(--superadmin-card-border, #E2E8F0)",
                    paddingBottom: "14px",
                }}
            >
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span
                            style={{
                                fontSize: "17px",
                                fontWeight: 900,
                                color: "var(--superadmin-text-main, #0F172A)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 7,
                            }}
                        >
                            <IconStethoscope size={19} color="#0284C7" />
                            <span>
                                {isHi
                                    ? "डॉक्टर प्रदर्शन एवं क्लिनिकल कार्यभार विश्लेषण"
                                    : "Clinician Performance & Productivity Telemetry"}
                            </span>
                        </span>
                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                padding: "2px 9px",
                                borderRadius: "20px",
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "#10B981",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                            }}
                        >
                            {totalDoctorsOnDuty} / {doctorMetrics.length} {isHi ? "ड्यूटी पर सक्रिय" : "Clinicians On Duty"}
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: "12px",
                            color: "var(--superadmin-text-muted, #64748B)",
                            marginTop: "3px",
                            display: "block",
                        }}
                    >
                        {isHi
                            ? "प्रत्येक चिकित्सक का लाइव परामर्श समय, मरीज थ्रूपुट गति एवं एनएबीएच 15-मिनट मानक अनुपालन"
                            : "Per-doctor consultation speed, patient throughput velocity, and NABH 15-min benchmark turnaround compliance"}
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab && setActiveTab("desks")}
                        style={{
                            border: "1px solid var(--superadmin-card-border, #CBD5E1)",
                            background: "var(--superadmin-sub-card, #F1F5F9)",
                            color: "var(--superadmin-text-main, #0F172A)",
                            padding: "7px 12px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <IconDesk size={13} color="#0284C7" />
                        <span>{isHi ? "डेस्क प्रबंधन →" : "Manage Desks →"}</span>
                    </button>
                </div>
            </div>

            {/* 4 Clinical KPI Metrics Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                }}
            >
                <div
                    style={{
                        background: "var(--superadmin-sub-card, #F8FAFC)",
                        border: "1px solid var(--superadmin-card-border, #E2E8F0)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "rgba(2, 132, 199, 0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#0284C7",
                            flexShrink: 0,
                        }}
                    >
                        <IconStethoscope size={18} color="#0284C7" />
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", color: "var(--superadmin-text-muted, #64748B)", fontWeight: 700 }}>
                            {isHi ? "सक्रिय डॉक्टर" : "Active Doctors"}
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--superadmin-text-main, #0F172A)" }}>
                            {totalDoctorsOnDuty} <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748B" }}>/ {doctorMetrics.length}</span>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background: "var(--superadmin-sub-card, #F8FAFC)",
                        border: "1px solid var(--superadmin-card-border, #E2E8F0)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "rgba(16, 185, 129, 0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#10B981",
                            flexShrink: 0,
                        }}
                    >
                        <IconUsers size={18} color="#10B981" />
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", color: "var(--superadmin-text-muted, #64748B)", fontWeight: 700 }}>
                            {isHi ? "कुल परामर्श मरीज" : "Patients Consulted"}
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "#10B981" }}>
                            {totalConsultations.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background: "var(--superadmin-sub-card, #F8FAFC)",
                        border: "1px solid var(--superadmin-card-border, #E2E8F0)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "rgba(245, 158, 11, 0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#F59E0B",
                            flexShrink: 0,
                        }}
                    >
                        <IconClock size={18} color="#F59E0B" />
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", color: "var(--superadmin-text-muted, #64748B)", fontWeight: 700 }}>
                            {isHi ? "औसत परामर्श समय" : "Avg Consult Duration"}
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--superadmin-text-main, #0F172A)" }}>
                            {overallAvgDuration} <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748B" }}>mins</span>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background: "var(--superadmin-sub-card, #F8FAFC)",
                        border: "1px solid var(--superadmin-card-border, #E2E8F0)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "rgba(16, 185, 129, 0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#10B981",
                            flexShrink: 0,
                        }}
                    >
                        <IconShield size={18} color="#10B981" />
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", color: "var(--superadmin-text-muted, #64748B)", fontWeight: 700 }}>
                            {isHi ? "एनएबीएच मानक अनुपालन" : "NABH Compliance"}
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "#10B981" }}>
                            {nabhComplianceRate}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    background: "var(--superadmin-sub-card, #F8FAFC)",
                    border: "1px solid var(--superadmin-card-border, #E2E8F0)",
                    borderRadius: "12px",
                    padding: "8px 12px",
                }}
            >
                <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px" }}>
                    <div
                        style={{
                            position: "absolute",
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "var(--superadmin-text-muted, #94A3B8)",
                        }}
                    >
                        <IconSearch size={13} color="currentColor" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isHi ? "डॉक्टर का नाम, आईडी या विभाग खोजें..." : "Search clinician name, ID or department..."}
                        style={{
                            width: "100%",
                            padding: "7px 28px 7px 30px",
                            borderRadius: "8px",
                            border: "1px solid var(--superadmin-card-border, #CBD5E1)",
                            background: "var(--superadmin-card-bg, #FFFFFF)",
                            color: "var(--superadmin-text-main, #0F172A)",
                            fontSize: "12px",
                            outline: "none",
                        }}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            style={{
                                position: "absolute",
                                right: "8px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#94A3B8",
                                padding: 2,
                            }}
                        >
                            <IconX size={11} color="currentColor" />
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid var(--superadmin-card-border, #CBD5E1)",
                            background: "var(--superadmin-card-bg, #FFFFFF)",
                            color: "var(--superadmin-text-main, #0F172A)",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            outline: "none",
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">{isHi ? "सभी विभाग" : "All Departments"}</option>
                        {departments.map((dept) => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid var(--superadmin-card-border, #CBD5E1)",
                            background: "var(--superadmin-card-bg, #FFFFFF)",
                            color: "var(--superadmin-text-main, #0F172A)",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            outline: "none",
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">{isHi ? "सभी स्थिति" : "All Statuses"}</option>
                        <option value="active">{isHi ? "सक्रिय ऑन ड्यूटी" : "On Duty"}</option>
                        <option value="serving">{isHi ? "परामर्श जारी" : "Serving Ticket"}</option>
                        <option value="available">{isHi ? "उपलब्ध (Available)" : "Available"}</option>
                        <option value="offline">{isHi ? "ऑफ़लाइन" : "Offline"}</option>
                    </select>
                </div>
            </div>

            {/* Clinician Cards Grid */}
            {filteredDoctors.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--superadmin-text-muted, #94A3B8)", fontSize: "13px" }}>
                    <IconStethoscope size={36} color="#94A3B8" />
                    <div style={{ marginTop: "10px", fontWeight: 700 }}>
                        {isHi ? "कोई डॉक्टर रिकॉर्ड नहीं मिला" : "No clinicians found matching criteria"}
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "14px",
                    }}
                >
                    {filteredDoctors.map((doc) => {
                        const tatColor = doc.avgConsultMins <= 12 ? "#10B981" : doc.avgConsultMins <= 15 ? "#0284C7" : doc.avgConsultMins <= 20 ? "#F59E0B" : "#EF4444";

                        return (
                            <div
                                key={doc.id}
                                className="overview-inner-card"
                                style={{
                                    borderRadius: "14px",
                                    border: "1px solid var(--superadmin-card-border, #E2E8F0)",
                                    background: "var(--superadmin-card-bg, #FFFFFF)",
                                    padding: "14px 16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                {/* Doctor Name & Duty Badge */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--superadmin-text-main, #0F172A)" }}>
                                            Dr. {doc.name}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "var(--superadmin-text-muted, #64748B)", marginTop: "1px" }}>
                                            {doc.department} • <code style={{ fontSize: "10px" }}>{doc.employee_id}</code>
                                        </div>
                                    </div>

                                    <span
                                        style={{
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            padding: "2px 7px",
                                            borderRadius: "6px",
                                            background: doc.dutyStatusBg,
                                            color: doc.dutyStatusColor,
                                            border: `1px solid ${doc.dutyStatusColor}40`,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {doc.dutyStatusLabel}
                                    </span>
                                </div>

                                {/* Desk Assignment */}
                                <div
                                    style={{
                                        fontSize: "11px",
                                        padding: "5px 8px",
                                        borderRadius: "6px",
                                        background: "var(--superadmin-sub-card, #F8FAFC)",
                                        border: "1px solid var(--superadmin-card-border, #E2E8F0)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        color: "var(--superadmin-text-main, #0F172A)",
                                    }}
                                >
                                    <span>
                                        <strong>Counter:</strong> {doc.assignedDesk || (isHi ? "असाइन नहीं" : "Not Assigned")}
                                    </span>
                                    <span>
                                        <strong>Speed:</strong> {doc.velocityPerHour}/hr
                                    </span>
                                </div>

                                {/* Clinical TAT Progress Meter */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", marginBottom: "4px" }}>
                                        <span style={{ color: "var(--superadmin-text-muted, #64748B)" }}>
                                            {isHi ? "औसत परामर्श अवधि" : "Avg Consult TAT"}
                                        </span>
                                        <span style={{ fontWeight: 800, color: tatColor }}>
                                            {doc.avgConsultMins} mins {doc.isNABHCompliant ? "✓" : "⚠"}
                                        </span>
                                    </div>
                                    <div style={{ width: "100%", height: "6px", borderRadius: "4px", background: "var(--superadmin-card-border, #E2E8F0)", overflow: "hidden" }}>
                                        <div
                                            style={{
                                                width: `${Math.min(100, (doc.avgConsultMins / 24) * 100)}%`,
                                                height: "100%",
                                                background: tatColor,
                                                borderRadius: "4px",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Footer Stats: Consulted Count & NABH Score */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        borderTop: "1px solid var(--superadmin-card-border, #F1F5F9)",
                                        paddingTop: "8px",
                                        fontSize: "11px",
                                    }}
                                >
                                    <span style={{ color: "var(--superadmin-text-muted, #64748B)" }}>
                                        {isHi ? "परामर्श किए गए मरीज:" : "Served:"}{" "}
                                        <strong style={{ color: "var(--superadmin-text-main, #0F172A)" }}>{doc.patientsConsulted}</strong>
                                    </span>
                                    <span style={{ color: "#10B981", fontWeight: 700 }}>
                                        NABH QA: {doc.complianceScore}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

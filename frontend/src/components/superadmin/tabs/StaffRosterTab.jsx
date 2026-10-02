import React from "react";
import {
    IconHospital,
    IconPlus,
    IconPalette,
    IconSearch,
    IconEdit,
    IconTrash,
    IconCopy,
    IconKey,
} from "../SuperAdminIcons";
import {
    standaloneCardStyle,
    actionBtnStyle,
    secondarySmallBtnStyle,
    fieldInputStyle,
    tableThStyle,
    tableTdStyle,
    editSmallBtnStyle,
    deleteSmallBtnStyle,
    copySmallBtnStyle,
    roleBadgeStyle,
} from "../superAdminStyles";
import { getCategoryLabel } from "../../../utils/i18n";
import "../SuperAdmin.css";

export default function StaffRosterTab({
    selectedHospital,
    hospitals = [],
    onSelectHospital,
    hospitalEmployees = [],
    employeeStatusFilter,
    setEmployeeStatusFilter,
    employeeSearchQuery,
    setEmployeeSearchQuery,
    employeePage,
    setEmployeePage,
    isTogglingEmpStatus,
    onToggleStatus,
    onEditEmployee,
    onChangePassword,
    onDeleteEmployee,
    onAddEmployee,
    onGoToBranding,
    getEmployeeCurrentDesk,
    formatRelativeLogin,
    notify,
    language = "en",
    isHi = false,
}) {
    const onlineCount = hospitalEmployees.filter((e) => (e.status || "").toLowerCase() === "active").length;
    const offlineCount = hospitalEmployees.length - onlineCount;

    const filteredEmployees = hospitalEmployees.filter((emp) => {
        if (employeeStatusFilter === "active" && (emp.status || "").toLowerCase() !== "active") return false;
        if (employeeStatusFilter === "inactive" && (emp.status || "").toLowerCase() === "active") return false;
        if (!employeeSearchQuery.trim()) return true;
        const q = employeeSearchQuery.trim().toLowerCase();
        return (
            (emp.name || "").toLowerCase().includes(q) ||
            (emp.username || "").toLowerCase().includes(q) ||
            (emp.email || "").toLowerCase().includes(q) ||
            (emp.employee_id || "").toLowerCase().includes(q) ||
            (emp.role || "").toLowerCase().includes(q)
        );
    });

    const EMP_PAGE_SIZE = 10;
    const totalEmpPages = Math.ceil(filteredEmployees.length / EMP_PAGE_SIZE) || 1;
    const paginatedEmployees = filteredEmployees.slice(
        (employeePage - 1) * EMP_PAGE_SIZE,
        employeePage * EMP_PAGE_SIZE
    );

    return (
        <div style={standaloneCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "var(--superadmin-text-main, #0F172A)", fontWeight: 800 }}>
                        {isHi ? "डॉक्टर एवं कर्मचारी रोस्टर" : "Doctor & Employee Roster"}
                    </h2>
                    {hospitals && hospitals.length > 1 ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--superadmin-sub-card, #F1F5F9)", padding: "4px 10px", borderRadius: "10px", border: "1px solid var(--superadmin-card-border, #CBD5E1)", marginTop: "2px" }}>
                            <IconHospital size={14} color="#0284C7" />
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--superadmin-text-muted, #64748B)" }}>
                                {isHi ? "शाखा:" : "Facility:"}
                            </span>
                            <select
                                value={selectedHospital?.hospital_code || ""}
                                onChange={(e) => {
                                    const found = hospitals.find((h) => h.hospital_code === e.target.value);
                                    if (found && onSelectHospital) onSelectHospital(found);
                                }}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "12.5px",
                                    fontWeight: 800,
                                    color: "var(--superadmin-text-main, #0F172A)",
                                    outline: "none",
                                    cursor: "pointer",
                                }}
                            >
                                {hospitals.map((h) => (
                                    <option key={h.hospital_code} value={h.hospital_code}>
                                        {h.name} ({h.hospital_code})
                                    </option>
                                ))}
                            </select>
                            <span style={{ fontSize: "11px", color: "#0284C7", fontWeight: 700, marginLeft: "4px" }}>
                                • {hospitalEmployees.length} {isHi ? "कार्मिक" : "Staff"}
                            </span>
                        </div>
                    ) : (
                        <span style={{ fontSize: "12px", color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <IconHospital size={14} color="#0284C7" />
                            <span>{selectedHospital ? selectedHospital.name : "Select a Hospital"} ({hospitalEmployees.length} Staff Members)</span>
                        </span>
                    )}
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {selectedHospital && onGoToBranding && (
                        <button
                            type="button"
                            onClick={onGoToBranding}
                            style={{
                                ...secondarySmallBtnStyle,
                                background: "#F5F3FF",
                                color: "#7C3AED",
                                borderColor: "#DDD6FE",
                                padding: "8px 14px",
                                fontWeight: 800,
                            }}
                            title={isHi ? "ब्रांडिंग पेज पर जाएं" : "Go to Branding Page"}
                        >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <IconPalette size={16} color="#7C3AED" />
                                <span>{isHi ? "ब्रांडिंग" : "Branding"}</span>
                            </span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onAddEmployee}
                        style={actionBtnStyle}
                    >
                        <IconPlus size={14} color="#FFFFFF" />
                        <span>{isHi ? "डॉक्टर / कर्मचारी जोड़ें" : "+ Add Doctor / Staff"}</span>
                    </button>
                </div>
            </div>

            {/* Staff Presence Overview Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--superadmin-sub-card, #1E293B)", border: "1px solid var(--superadmin-card-border, #334155)" }}>
                    <div style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #94A3B8)", fontWeight: 700 }}>{isHi ? "कुल कार्मिक" : "Total Personnel"}</div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--superadmin-text-main, #F8FAFC)", marginTop: "4px" }}>{hospitalEmployees.length}</div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16A34A" }} />
                        <span style={{ fontSize: "11.5px", color: "#10B981", fontWeight: 700 }}>{isHi ? "सक्रिय / ऑनलाइन" : "Active / Logged In"}</span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#10B981", marginTop: "4px" }}>{onlineCount}</div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--superadmin-sub-card, #1E293B)", border: "1px solid var(--superadmin-card-border, #334155)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#94A3B8" }} />
                        <span style={{ fontSize: "11.5px", color: "var(--superadmin-text-muted, #94A3B8)", fontWeight: 700 }}>{isHi ? "निष्क्रिय / ऑफलाइन" : "Inactive / Offline"}</span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--superadmin-text-muted, #94A3B8)", marginTop: "4px" }}>{offlineCount}</div>
                </div>
            </div>

            {/* Filter Pills & Search Bar */}
            <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                        type="button"
                        onClick={() => { setEmployeeStatusFilter("all"); setEmployeePage(1); }}
                        style={{
                            padding: "5px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            border: employeeStatusFilter === "all" ? "1.5px solid #0284C7" : "1px solid var(--superadmin-card-border, #334155)",
                            background: employeeStatusFilter === "all" ? "rgba(2, 132, 199, 0.15)" : "var(--superadmin-sub-card, #1E293B)",
                            color: employeeStatusFilter === "all" ? "#38BDF8" : "var(--superadmin-text-muted, #94A3B8)",
                        }}
                    >
                        {isHi ? "सभी कार्मिक" : "All Staff"} ({hospitalEmployees.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => { setEmployeeStatusFilter("active"); setEmployeePage(1); }}
                        style={{
                            padding: "5px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            border: employeeStatusFilter === "active" ? "1.5px solid #16A34A" : "1px solid var(--superadmin-card-border, #334155)",
                            background: employeeStatusFilter === "active" ? "rgba(16, 185, 129, 0.15)" : "var(--superadmin-sub-card, #1E293B)",
                            color: employeeStatusFilter === "active" ? "#10B981" : "var(--superadmin-text-muted, #94A3B8)",
                        }}
                    >
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16A34A" }} />
                        <span>{isHi ? "ऑनलाइन" : "Online"} ({onlineCount})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setEmployeeStatusFilter("inactive"); setEmployeePage(1); }}
                        style={{
                            padding: "5px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            border: employeeStatusFilter === "inactive" ? "1.5px solid #64748B" : "1px solid var(--superadmin-card-border, #334155)",
                            background: employeeStatusFilter === "inactive" ? "rgba(100, 116, 139, 0.15)" : "var(--superadmin-sub-card, #1E293B)",
                            color: employeeStatusFilter === "inactive" ? "#CBD5E1" : "var(--superadmin-text-muted, #94A3B8)",
                        }}
                    >
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#94A3B8" }} />
                        <span>{isHi ? "ऑफलाइन" : "Offline"} ({offlineCount})</span>
                    </button>
                </div>

                <div style={{ position: "relative", minWidth: "260px", flex: "1 1 260px" }}>
                    <input
                        type="text"
                        placeholder={isHi ? "नाम, ईमेल या आईडी से खोजें..." : "Filter by name, email, or employee ID..."}
                        value={employeeSearchQuery}
                        onChange={(e) => { setEmployeeSearchQuery(e.target.value); setEmployeePage(1); }}
                        style={{ ...fieldInputStyle, paddingLeft: "32px", fontSize: "12.5px" }}
                    />
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", display: "flex", alignItems: "center" }}>
                        <IconSearch size={14} color="#94A3B8" />
                    </span>
                </div>
            </div>

            {/* Roster Table with Edit and Delete Action */}
            <div style={{ overflowX: "auto", borderRadius: "14px", border: "1px solid var(--superadmin-card-border, #334155)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ background: "var(--superadmin-sub-card, #1E293B)", borderBottom: "1px solid var(--superadmin-card-border, #334155)" }}>
                            <th style={tableThStyle}>{isHi ? "नाम" : "Name"}</th>
                            <th style={tableThStyle}>{isHi ? "आईडी" : "Emp ID"}</th>
                            <th style={tableThStyle}>{isHi ? "भूमिका" : "Role"}</th>
                            <th style={tableThStyle}>{isHi ? "विभाग" : "Department"}</th>
                            <th style={tableThStyle}>{isHi ? "संबद्ध डेस्क" : "Assigned Desk"}</th>
                            <th style={tableThStyle}>{isHi ? "ईमेल / फोन" : "Contact"}</th>
                            <th style={tableThStyle}>{isHi ? "स्थिति / उपस्थिति" : "Status & Presence"}</th>
                            <th style={tableThStyle}>{isHi ? "कार्रवाई" : "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEmployees.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "24px", color: "var(--superadmin-text-muted, #94A3B8)" }}>
                                    {employeeSearchQuery ? "No staff members match the search query." : "No staff or doctors found for this filter."}
                                </td>
                            </tr>
                        ) : (
                            paginatedEmployees.map((emp) => {
                                const isActive = (emp.status || "").toLowerCase() === "active";
                                return (
                                    <tr key={emp.id || emp.employee_id_num} style={{ borderBottom: "1px solid var(--superadmin-card-border, #1E293B)" }}>
                                        <td style={tableTdStyle}>
                                            <div style={{ fontWeight: 800, color: "var(--superadmin-text-main, #F8FAFC)", fontSize: "13.5px" }}>
                                                {emp.name || emp.username || "Staff Member"}
                                            </div>
                                            <span style={{ fontSize: "11px", color: "var(--superadmin-text-muted, #94A3B8)", display: "block", marginTop: "2px" }}>
                                                {emp.email}
                                            </span>
                                        </td>
                                        <td style={{ ...tableTdStyle, fontWeight: 700, color: "#38BDF8" }}>
                                            {emp.employee_id || `EMP-${emp.id || emp.employee_id_num}`}
                                        </td>
                                        <td style={tableTdStyle}>
                                            <span style={roleBadgeStyle(emp.role)}>
                                                {(emp.role || "").toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ ...tableTdStyle, fontWeight: 700, color: "#38BDF8" }}>
                                            {getCategoryLabel(emp.department, language)}
                                        </td>
                                        <td style={tableTdStyle}>
                                            {(() => {
                                                const currentDesk = getEmployeeCurrentDesk ? getEmployeeCurrentDesk(emp) : null;
                                                return currentDesk ? (
                                                    <span
                                                        style={{
                                                            fontSize: "11.5px",
                                                            fontWeight: 700,
                                                            color: "#38BDF8",
                                                            background: "rgba(2, 132, 199, 0.15)",
                                                            border: "1px solid rgba(2, 132, 199, 0.3)",
                                                            padding: "3px 8px",
                                                            borderRadius: "6px",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                        }}
                                                        title={currentDesk.desk_name}
                                                    >
                                                        <span>🪑</span>
                                                        <span>{currentDesk.desk_name}</span>
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: "11px", color: "var(--superadmin-text-muted, #94A3B8)" }}>
                                                        {isHi ? "अनअसाइंड" : "Unassigned"}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={tableTdStyle}>
                                            {emp.phone || "—"}
                                        </td>
                                        <td style={tableTdStyle}>
                                            {(() => {
                                                const duty = emp.duty_status || (isActive ? "ACTIVE" : "OFF_DUTY");
                                                if (duty === "ON_BREAK" || emp.status === "on_break") {
                                                    return (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                            <span
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "5px",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "999px",
                                                                    fontSize: "10.5px",
                                                                    fontWeight: 800,
                                                                    background: "rgba(245, 158, 11, 0.15)",
                                                                    color: "#F59E0B",
                                                                    border: "1px solid rgba(245, 158, 11, 0.3)",
                                                                    width: "fit-content",
                                                                }}
                                                            >
                                                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B" }} />
                                                                <span>{isHi ? "अवकाश (ब्रेक)" : "ON BREAK"}</span>
                                                            </span>
                                                            <span style={{ fontSize: "10px", color: "#F59E0B" }}>
                                                                {isHi ? "अल्पाहार / अवकाश पर" : "Temporary break"}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                                if (duty === "EMERGENCY_ROUND" || emp.status === "emergency_round") {
                                                    return (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                            <span
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "5px",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "999px",
                                                                    fontSize: "10.5px",
                                                                    fontWeight: 800,
                                                                    background: "rgba(225, 29, 72, 0.15)",
                                                                    color: "#E11D48",
                                                                    border: "1px solid rgba(225, 29, 72, 0.3)",
                                                                    width: "fit-content",
                                                                }}
                                                            >
                                                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#E11D48" }} />
                                                                <span>{isHi ? "इमरजेंसी राउंड" : "ICU ROUND"}</span>
                                                            </span>
                                                            <span style={{ fontSize: "10px", color: "#E11D48" }}>
                                                                {isHi ? "आपातकालीन वार्ड में" : "Emergency ICU"}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                                if (isActive && duty !== "OFF_DUTY") {
                                                    return (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                            <span
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "5px",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "999px",
                                                                    fontSize: "10.5px",
                                                                    fontWeight: 800,
                                                                    background: "rgba(16, 185, 129, 0.15)",
                                                                    color: "#10B981",
                                                                    border: "1px solid rgba(16, 185, 129, 0.3)",
                                                                    width: "fit-content",
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        width: "6px",
                                                                        height: "6px",
                                                                        borderRadius: "50%",
                                                                        background: "#10B981",
                                                                        boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.3)",
                                                                    }}
                                                                />
                                                                <span>{isHi ? "ऑनलाइन (सक्रिय)" : "ONLINE (ACTIVE)"}</span>
                                                            </span>
                                                            {emp.last_login_at ? (
                                                                <span style={{ fontSize: "10px", color: "var(--superadmin-text-muted, #94A3B8)" }} title={new Date(emp.last_login_at).toLocaleString()}>
                                                                    {formatRelativeLogin ? formatRelativeLogin(emp.last_login_at) : emp.last_login_at}
                                                                </span>
                                                            ) : (
                                                                <span style={{ fontSize: "10px", color: "#10B981" }}>
                                                                    {isHi ? "सक्रिय सत्र" : "Active session"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                        <span
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "5px",
                                                                padding: "2px 8px",
                                                                borderRadius: "999px",
                                                                fontSize: "10.5px",
                                                                fontWeight: 700,
                                                                background: "rgba(100, 116, 139, 0.15)",
                                                                color: "#94A3B8",
                                                                border: "1px solid rgba(100, 116, 139, 0.3)",
                                                                width: "fit-content",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: "6px",
                                                                    height: "6px",
                                                                    borderRadius: "50%",
                                                                    background: "#94A3B8",
                                                                }}
                                                            />
                                                            <span>{duty === "OFF_DUTY" ? (isHi ? "ड्यूटी समाप्त" : "OFF DUTY") : (isHi ? "ऑफलाइन" : "OFFLINE")}</span>
                                                        </span>
                                                        <span style={{ fontSize: "10px", color: "#94A3B8" }} title={emp.last_login_at ? new Date(emp.last_login_at).toLocaleString() : ""}>
                                                            {duty === "OFF_DUTY"
                                                                ? (isHi ? "शिफ्ट समाप्त" : "Shift ended")
                                                                : (emp.last_login_at ? `${isHi ? "अंतिम:" : "Last:"} ${formatRelativeLogin ? formatRelativeLogin(emp.last_login_at) : emp.last_login_at}` : (isHi ? "लॉगिन नहीं किया" : "Not logged in"))}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td style={tableTdStyle}>
                                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                <button
                                                    type="button"
                                                    disabled={isTogglingEmpStatus === (emp.user_id || emp.id || emp.employee_id_num)}
                                                    onClick={() => onToggleStatus && onToggleStatus(emp)}
                                                    style={{
                                                        ...editSmallBtnStyle,
                                                        background: isActive ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                                                        color: isActive ? "#EF4444" : "#10B981",
                                                        border: isActive ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                                        fontWeight: 700,
                                                        fontSize: "11px",
                                                        opacity: isTogglingEmpStatus === (emp.user_id || emp.id || emp.employee_id_num) ? 0.6 : 1,
                                                    }}
                                                    title={isActive ? (isHi ? "ऑफलाइन सेट करें" : "Set to Offline (Inactive)") : (isHi ? "ऑनलाइन सेट करें" : "Set to Online (Active)")}
                                                >
                                                    {isActive
                                                        ? (isHi ? "ऑफलाइन करें" : "Set Offline")
                                                        : (isHi ? "सक्रिय करें" : "Set Active")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`Name: ${emp.name || emp.username}\nEmail ID: ${emp.email}\nRole: ${(emp.role || "").toUpperCase()}\nDepartment: ${emp.department}`);
                                                        if (notify) {
                                                            notify(isHi ? `'${emp.name || emp.username}' के लॉगिन क्रेडेंशियल कॉपी किए गए!` : `Login ID for '${emp.name || emp.username}' copied to clipboard!`);
                                                        }
                                                    }}
                                                    style={copySmallBtnStyle}
                                                    title={isHi ? "लॉगिन आईडी कॉपी करें" : "Copy Login ID"}
                                                >
                                                    <IconCopy size={13} color="#38BDF8" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onEditEmployee && onEditEmployee(emp)}
                                                    style={editSmallBtnStyle}
                                                >
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <IconEdit size={11} />
                                                        <span>{isHi ? "संपादित" : "Edit"}</span>
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onChangePassword && onChangePassword(emp)}
                                                    style={{
                                                        ...editSmallBtnStyle,
                                                        background: "rgba(245, 158, 11, 0.15)",
                                                        color: "#FBBF24",
                                                        border: "1px solid rgba(245, 158, 11, 0.3)",
                                                    }}
                                                    title={isHi ? "पासवर्ड बदलें" : "Change Password"}
                                                >
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <IconKey size={12} color="#FBBF24" />
                                                        <span>{isHi ? "पासवर्ड" : "Password"}</span>
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteEmployee && onDeleteEmployee(emp)}
                                                    style={deleteSmallBtnStyle}
                                                    title={isHi ? "कर्मचारी हटाएं" : "Remove Employee"}
                                                >
                                                    <IconTrash size={14} color="#EF4444" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalEmpPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                        Page {employeePage} of {totalEmpPages} ({filteredEmployees.length} staff members)
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            type="button"
                            disabled={employeePage <= 1}
                            onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
                            style={{
                                ...secondarySmallBtnStyle,
                                opacity: employeePage <= 1 ? 0.5 : 1,
                                cursor: employeePage <= 1 ? "not-allowed" : "pointer",
                            }}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={employeePage >= totalEmpPages}
                            onClick={() => setEmployeePage((p) => Math.min(totalEmpPages, p + 1))}
                            style={{
                                ...secondarySmallBtnStyle,
                                opacity: employeePage >= totalEmpPages ? 0.5 : 1,
                                cursor: employeePage >= totalEmpPages ? "not-allowed" : "pointer",
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

import React from "react";
import { IconPlus, IconPalette, IconTrash } from "../SuperAdminIcons";
import {
    standaloneCardStyle,
    searchInputStyle,
    actionBtnStyle,
    hospitalCardStyle,
    hospitalStatusBadgeStyle,
    primarySmallBtnStyle,
    secondarySmallBtnStyle,
    deleteSmallBtnStyle
} from "../superAdminStyles";
import "../SuperAdmin.css";

export default function HospitalsDirectoryTab({
    hospitals = [],
    selectedHospital,
    setSelectedHospital,
    searchQuery,
    setSearchQuery,
    onOpenAddModal,
    onDeleteHospital,
    onManageStaff,
    onCustomizeBranding,
    isHi = false
}) {
    const filteredHospitals = hospitals.filter((h) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (h.name || "").toLowerCase().includes(q) ||
            (h.hospital_code || "").toLowerCase().includes(q) ||
            (h.city || "").toLowerCase().includes(q)
        );
    });

    const [autoTranslated, setAutoTranslated] = React.useState({});

    React.useEffect(() => {
        if (!isHi) return;
        hospitals.forEach(async (h) => {
            const existingHindi =
                h.about_us_hi ||
                h.description_hi ||
                h.branding?.about_us_hi ||
                (h.branding_json && (typeof h.branding_json === "string" ? (() => { try { return JSON.parse(h.branding_json)?.about_us_hi; } catch (e) { return null; } })() : h.branding_json?.about_us_hi));

            if (!existingHindi && h.description && /[a-zA-Z]/.test(h.description) && !autoTranslated[h.hospital_code]) {
                try {
                    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(h.description)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data[0]) {
                            const translated = data[0].map((s) => s[0]).join("");
                            setAutoTranslated((prev) => ({ ...prev, [h.hospital_code]: translated }));
                        }
                    }
                } catch (e) {
                    console.warn("Failed to auto-translate hospital card description:", e);
                }
            }
        });
    }, [isHi, hospitals]);

    const getHospitalDescription = (h) => {
        if (!isHi) {
            return h.description || "Modern healthcare center with AI triage.";
        }
        if (h.about_us_hi) return h.about_us_hi;
        if (h.description_hi) return h.description_hi;
        if (h.branding && h.branding.about_us_hi) return h.branding.about_us_hi;
        if (h.branding_json) {
            try {
                const parsed = typeof h.branding_json === "string" ? JSON.parse(h.branding_json) : h.branding_json;
                if (parsed?.about_us_hi) return parsed.about_us_hi;
            } catch (e) {}
        }
        if (autoTranslated[h.hospital_code]) {
            return autoTranslated[h.hospital_code];
        }
        return h.description || "आधुनिक स्वास्थ्य केंद्र • एआई कतार प्रबंधन सुविधा";
    };

    return (
        <div style={standaloneCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0F172A", fontWeight: 800, letterSpacing: "-0.4px" }}>
                        {isHi ? "अस्पताल नेटवर्क शाखाएं" : "Hospital Network Facilities"} ({filteredHospitals.length})
                    </h2>
                    <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                        {isHi ? "अस्पताल नाम, पता, संपर्क जानकारी संपादित करें या नया अस्पताल जोड़ें।" : "Configure hospital names, contact information, and active status."}
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* Search Input */}
                    <div style={{ position: "relative", minWidth: "220px" }}>
                        <input
                            type="text"
                            placeholder={isHi ? "अस्पताल खोजें..." : "Search hospitals..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={searchInputStyle}
                        />
                    </div>

                    {/* Primary Add Hospital Button */}
                    <button
                        type="button"
                        onClick={onOpenAddModal}
                        style={{
                            ...actionBtnStyle,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            fontSize: "13px",
                            fontWeight: 800,
                        }}
                        title={isHi ? "नया अस्पताल जोड़ें" : "Add New Hospital"}
                    >
                        <IconPlus size={14} color="#FFFFFF" />
                        <span>{isHi ? "नया अस्पताल जोड़ें" : "+ Add Hospital"}</span>
                    </button>
                </div>
            </div>

            {/* Hospital Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                {filteredHospitals.map((hosp) => (
                    <div
                        key={hosp.hospital_code}
                        style={{
                            ...hospitalCardStyle,
                            borderColor: selectedHospital?.hospital_code === hosp.hospital_code ? "#0284C7" : "var(--superadmin-card-border, #E2E8F0)",
                            background: selectedHospital?.hospital_code === hosp.hospital_code ? "rgba(2, 132, 199, 0.12)" : "var(--superadmin-card-bg, #FFFFFF)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "17px", color: "var(--superadmin-text-main, #0F172A)", fontWeight: 800 }}>
                                    {hosp.name}
                                </h3>
                                <span style={{ fontSize: "11px", fontWeight: 800, color: "#38BDF8", background: "rgba(2, 132, 199, 0.15)", border: "1px solid rgba(2, 132, 199, 0.3)", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "4px" }}>
                                    {isHi ? "अस्पताल कोड: " : "Hospital Code: "}{hosp.hospital_code.toUpperCase()}
                                </span>
                            </div>
                            <span style={hospitalStatusBadgeStyle(hosp.status)}>
                                ● {isHi ? (hosp.status === "active" ? "सक्रिय" : (hosp.status === "maintenance" ? "रखरखाव" : "निष्क्रिय")) : hosp.status.toUpperCase()}
                            </span>
                        </div>

                        <p style={{ margin: "0 0 12px 0", fontSize: "12.5px", color: "var(--superadmin-text-sub, #475569)", lineHeight: 1.4, minHeight: "34px" }}>
                            {getHospitalDescription(hosp)}
                        </p>

                        {/* 4 Stat Badges */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", padding: "10px", background: "var(--superadmin-sub-card, #1E293B)", borderRadius: "10px", border: "1px solid var(--superadmin-card-border, #334155)", marginBottom: "14px" }}>
                            <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: "9.5px", color: "var(--superadmin-text-muted, #94A3B8)", fontWeight: 700, display: "block" }}>{isHi ? "स्टाफ" : "Staff"}</span>
                                <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--superadmin-text-main, #F8FAFC)" }}>{hosp.employee_count ?? 0}</span>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: "9.5px", color: "var(--superadmin-text-muted, #94A3B8)", fontWeight: 700, display: "block" }}>{isHi ? "डॉक्टर" : "Docs"}</span>
                                <span style={{ fontSize: "13px", fontWeight: 800, color: "#38BDF8" }}>{hosp.doctor_count ?? 0}</span>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: "9.5px", color: "var(--superadmin-text-muted, #94A3B8)", fontWeight: 700, display: "block" }}>{isHi ? "डेस्क" : "Desks"}</span>
                                <span style={{ fontSize: "13px", fontWeight: 800, color: "#38BDF8" }}>{hosp.active_desks ?? 0}/{hosp.total_desks ?? 0}</span>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: "9.5px", color: "var(--superadmin-text-muted, #94A3B8)", fontWeight: 700, display: "block" }}>{isHi ? "विज़िट" : "Visits"}</span>
                                <span style={{ fontSize: "13px", fontWeight: 800, color: "#FBBF24" }}>{hosp.patients_today ?? hosp.total_visits ?? 0}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                type="button"
                                onClick={() => onManageStaff(hosp)}
                                style={primarySmallBtnStyle}
                            >
                                <span>{isHi ? "प्रबंधन करें" : "Manage Staff"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onCustomizeBranding(hosp)}
                                style={{
                                    ...secondarySmallBtnStyle,
                                    background: "rgba(2, 132, 199, 0.12)",
                                    color: "#0284C7",
                                    borderColor: "rgba(2, 132, 199, 0.3)",
                                    fontWeight: 800,
                                }}
                                title={isHi ? "कस्टमाइज़ेशन व ब्रांडिंग पेज पर जाएं" : "Go to Customization & Branding Studio"}
                            >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <IconPalette size={13} color="#0284C7" />
                                    <span>{isHi ? "कस्टमाइज़ करें" : "Customize & Brand"}</span>
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onDeleteHospital(hosp)}
                                style={deleteSmallBtnStyle}
                                title={isHi ? "अस्पताल हटाएं" : "Delete Hospital"}
                            >
                                <IconTrash size={14} color="#EF4444" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

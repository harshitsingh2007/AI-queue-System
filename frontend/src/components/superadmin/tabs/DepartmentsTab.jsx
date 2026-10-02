import React from "react";
import {
    IconHospital,
    IconPlus,
    IconBuilding,
    IconEdit,
    IconTrash,
} from "../SuperAdminIcons";
import {
    standaloneCardStyle,
    actionBtnStyle,
    deptCardStyle,
    deleteDeptIconBtnStyle,
} from "../superAdminStyles";
import "../SuperAdmin.css";

export default function DepartmentsTab({
    selectedHospital,
    hospitals = [],
    onSelectHospital,
    hospitalDepts = [],
    onOpenAddDept,
    onOpenEditDept,
    onDeleteDepartment,
    isHi = false,
}) {
    return (
        <div style={standaloneCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "var(--superadmin-text-main, #0F172A)", fontWeight: 800 }}>
                        {isHi ? "क्लिनिकल विभाग सूची" : "Clinical Departments & Wings"}
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
                                • {hospitalDepts.length} {isHi ? "विभाग" : "Departments"}
                            </span>
                        </div>
                    ) : (
                        <span style={{ fontSize: "12px", color: "#0284C7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <IconHospital size={14} color="#0284C7" />
                            <span>{selectedHospital ? selectedHospital.name : "Select a Hospital"} ({hospitalDepts.length} Departments)</span>
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onOpenAddDept}
                    style={actionBtnStyle}
                >
                    <IconPlus size={14} color="#FFFFFF" />
                    <span>{isHi ? "विभाग जोड़ें" : "+ Add Department"}</span>
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" }}>
                {hospitalDepts.map((d) => (
                    <div key={d.dept_code} style={deptCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <IconBuilding size={16} color="#0284C7" />
                                <h4 style={{ margin: 0, fontSize: "14px", color: "var(--superadmin-text-main, #0F172A)", fontWeight: 800 }}>
                                    {d.name}
                                </h4>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <button
                                    type="button"
                                    onClick={() => onOpenEditDept && onOpenEditDept(d)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "4px",
                                        borderRadius: "4px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#0284C7",
                                    }}
                                    title={isHi ? "विभाग संपादित करें" : "Edit Department"}
                                >
                                    <IconEdit size={14} color="#0284C7" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDeleteDepartment && onDeleteDepartment(d)}
                                    style={deleteDeptIconBtnStyle}
                                    title={isHi ? "विभाग हटाएं" : "Remove Department"}
                                >
                                    <IconTrash size={14} color="#EF4444" />
                                </button>
                            </div>
                        </div>
                        <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#0284C7", background: "rgba(2, 132, 199, 0.15)", padding: "1px 6px", borderRadius: "4px", display: "inline-block" }}>
                            Code: {d.dept_code}
                        </span>
                        <p style={{ margin: "6px 0 0 0", fontSize: "11.5px", color: "var(--superadmin-text-muted, #64748B)", lineHeight: 1.4 }}>
                            {d.description || "Clinical patient care wing"}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

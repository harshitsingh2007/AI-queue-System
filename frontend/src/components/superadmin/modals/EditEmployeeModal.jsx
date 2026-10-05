import React from "react";
import { IconEdit, IconX } from "../SuperAdminIcons";
import {
    modalOverlayStyle,
    modalContentStyle,
    modalCloseIconBtnStyle,
    modalCancelBtnStyle,
    modalSubmitBtnStyle,
    fieldLabelStyle,
    fieldInputStyle
} from "../superAdminStyles";

export default function EditEmployeeModal({
    isOpen,
    onClose,
    editEmployeeForm,
    setEditEmployeeForm,
    onSubmit,
    hospitalDepts = [],
    isHi = false
}) {
    if (!isOpen) return null;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                        <IconEdit size={18} color="#0284C7" />
                        <span>{isHi ? "कर्मचारी रिकॉर्ड संपादित करें" : "Edit Employee Record"}</span>
                    </h3>
                    <button type="button" onClick={onClose} style={modalCloseIconBtnStyle}>
                        <IconX size={15} />
                    </button>
                </div>

                <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "पूरा नाम" : "Full Name"} *</label>
                        <input
                            type="text"
                            required
                            value={editEmployeeForm.name}
                            onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, name: e.target.value })}
                            style={fieldInputStyle}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                            <label style={fieldLabelStyle}>{isHi ? "भूमिका" : "Role"}</label>
                            <select
                                value={editEmployeeForm.role}
                                onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, role: e.target.value })}
                                style={fieldInputStyle}
                            >
                                <option value="doctor">DOCTOR</option>
                                <option value="admin">HOSPITAL ADMIN</option>
                                <option value="staff">STAFF</option>
                                <option value="receptionist">RECEPTIONIST</option>
                            </select>
                        </div>

                        <div>
                            <label style={fieldLabelStyle}>{isHi ? "विभाग" : "Department"}</label>
                            <select
                                value={editEmployeeForm.department}
                                onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, department: e.target.value })}
                                style={fieldInputStyle}
                            >
                                {hospitalDepts.map((d) => (
                                    <option key={d.dept_code} value={d.dept_code}>
                                        {d.name}
                                    </option>
                                ))}
                                <option value="all">All Departments (Admin)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                            <label style={fieldLabelStyle}>{isHi ? "कर्मचारी आईडी" : "Employee ID"}</label>
                            <input
                                type="text"
                                value={editEmployeeForm.employee_id}
                                onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, employee_id: e.target.value })}
                                style={fieldInputStyle}
                            />
                        </div>
                        <div>
                            <label style={fieldLabelStyle}>{isHi ? "फोन" : "Phone"}</label>
                            <input
                                type="text"
                                value={editEmployeeForm.phone}
                                onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, phone: e.target.value })}
                                style={fieldInputStyle}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button type="button" onClick={onClose} style={modalCancelBtnStyle}>
                            {isHi ? "रद्द करें" : "Cancel"}
                        </button>
                        <button type="submit" style={modalSubmitBtnStyle}>
                            {isHi ? "सहेजें" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

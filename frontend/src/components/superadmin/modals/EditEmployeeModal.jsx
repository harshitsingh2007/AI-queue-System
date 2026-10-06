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

                <div style={{ maxHeight: "80vh", overflowY: "auto", paddingRight: "4px" }}>
                    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={fieldLabelStyle}>{isHi ? "पूरा नाम" : "Full Name"} *</label>
                            <input
                                type="text"
                                required
                                value={editEmployeeForm.name || ""}
                                onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, name: e.target.value })}
                                style={fieldInputStyle}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div>
                                <label style={fieldLabelStyle}>{isHi ? "भूमिका" : "Role"}</label>
                                <select
                                    value={editEmployeeForm.role || "doctor"}
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
                                    value={editEmployeeForm.department || "consultation"}
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
                                    value={editEmployeeForm.employee_id || ""}
                                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, employee_id: e.target.value })}
                                    style={fieldInputStyle}
                                />
                            </div>
                            <div>
                                <label style={fieldLabelStyle}>{isHi ? "फोन" : "Phone"}</label>
                                <input
                                    type="text"
                                    value={editEmployeeForm.phone || ""}
                                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, phone: e.target.value })}
                                    style={fieldInputStyle}
                                />
                            </div>
                        </div>

                        {/* Professional & Clinical Details Section */}
                        <div style={{
                            margin: "4px 0",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background: "rgba(2, 132, 199, 0.06)",
                            border: "1px dashed rgba(2, 132, 199, 0.3)",
                        }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {isHi ? "चिकित्सा एवं व्यावसायिक जानकारी" : "Clinical & Professional Details"}
                            </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div>
                                <label style={fieldLabelStyle}>{isHi ? "योग्यता / डिग्री" : "Medical Qualification"}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. MBBS, MD, MS"
                                    value={editEmployeeForm.qualification || ""}
                                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, qualification: e.target.value })}
                                    style={fieldInputStyle}
                                />
                            </div>
                            <div>
                                <label style={fieldLabelStyle}>{isHi ? "विशेषज्ञता / पद" : "Specialization / Designation"}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Senior Cardiologist"
                                    value={editEmployeeForm.specialization || ""}
                                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, specialization: e.target.value })}
                                    style={fieldInputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div>
                                <label style={fieldLabelStyle}>{isHi ? "चिकित्सा लाइसेंस संख्या" : "Medical License / Reg No."}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. MCI/NMC-49210"
                                    value={editEmployeeForm.license_number || ""}
                                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, license_number: e.target.value })}
                                    style={fieldInputStyle}
                                />
                            </div>
                            <div>
                                <label style={fieldLabelStyle}>{isHi ? "अनुभव (वर्ष)" : "Experience (Years)"}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    placeholder="e.g. 8"
                                    value={editEmployeeForm.experience_years !== undefined ? editEmployeeForm.experience_years : ""}
                                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, experience_years: e.target.value })}
                                    style={fieldInputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div>
                                <label style={fieldLabelStyle}>{isHi ? "ओपीडी केबिन / कमरा संख्या" : "OPD Cabin / Room No."}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Cabin 104"
                                    value={editEmployeeForm.room_number || ""}
                                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, room_number: e.target.value })}
                                    style={fieldInputStyle}
                                />
                            </div>
                            <div>
                                <label style={fieldLabelStyle}>{isHi ? "लिंग" : "Gender"}</label>
                                <select
                                    value={editEmployeeForm.gender || "other"}
                                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, gender: e.target.value })}
                                    style={fieldInputStyle}
                                >
                                    <option value="male">{isHi ? "पुरुष (Male)" : "Male"}</option>
                                    <option value="female">{isHi ? "महिला (Female)" : "Female"}</option>
                                    <option value="other">{isHi ? "अन्य (Other / Unspecified)" : "Other / Unspecified"}</option>
                                </select>
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
        </div>
    );
}

import React from "react";
import { IconHospital, IconX } from "../SuperAdminIcons";
import {
    modalOverlayStyle,
    modalContentStyle,
    modalCloseIconBtnStyle,
    modalCancelBtnStyle,
    modalSubmitBtnStyle,
    fieldLabelStyle,
    fieldInputStyle
} from "../superAdminStyles";

export default function AddHospitalModal({
    isOpen,
    onClose,
    newHospitalForm,
    setNewHospitalForm,
    onSubmit,
    isHi = false
}) {
    if (!isOpen) return null;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                        <IconHospital size={18} color="#0284C7" />
                        <span>{isHi ? "नया अस्पताल जोड़ें" : "Add New Hospital"}</span>
                    </h3>
                    <button type="button" onClick={onClose} style={modalCloseIconBtnStyle}>
                        <IconX size={15} />
                    </button>
                </div>

                <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "अस्पताल का नाम" : "Hospital Name"} *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Metro Superspecialty Hospital"
                            value={newHospitalForm.name}
                            onChange={(e) => setNewHospitalForm({ ...newHospitalForm, name: e.target.value })}
                            style={fieldInputStyle}
                        />
                    </div>

                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "अस्पताल कोड (Unique Code)" : "Hospital Code"} *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. metro-hospital-01"
                            value={newHospitalForm.hospital_code}
                            onChange={(e) => setNewHospitalForm({ ...newHospitalForm, hospital_code: e.target.value })}
                            style={fieldInputStyle}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                            <label style={fieldLabelStyle}>{isHi ? "फोन" : "Phone"}</label>
                            <input
                                type="text"
                                placeholder="+1 (555) 000-0000"
                                value={newHospitalForm.phone}
                                onChange={(e) => setNewHospitalForm({ ...newHospitalForm, phone: e.target.value })}
                                style={fieldInputStyle}
                            />
                        </div>
                        <div>
                            <label style={fieldLabelStyle}>{isHi ? "ईमेल" : "Email"}</label>
                            <input
                                type="email"
                                placeholder="info@hospital.org"
                                value={newHospitalForm.email}
                                onChange={(e) => setNewHospitalForm({ ...newHospitalForm, email: e.target.value })}
                                style={fieldInputStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "पता" : "Address"}</label>
                        <input
                            type="text"
                            placeholder="Street Address, City, State"
                            value={newHospitalForm.address}
                            onChange={(e) => setNewHospitalForm({ ...newHospitalForm, address: e.target.value })}
                            style={fieldInputStyle}
                        />
                    </div>

                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "विवरण" : "Description"}</label>
                        <textarea
                            rows="2"
                            placeholder="Specialization and facilities overview..."
                            value={newHospitalForm.description}
                            onChange={(e) => setNewHospitalForm({ ...newHospitalForm, description: e.target.value })}
                            style={{ ...fieldInputStyle, resize: "none" }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button type="button" onClick={onClose} style={modalCancelBtnStyle}>
                            {isHi ? "रद्द करें" : "Cancel"}
                        </button>
                        <button type="submit" style={modalSubmitBtnStyle}>
                            {isHi ? "अस्पताल सहेजें" : "Save Hospital"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import React from "react";
import { IconBuilding, IconX } from "../SuperAdminIcons";
import {
    modalOverlayStyle,
    modalContentStyle,
    modalCloseIconBtnStyle,
    modalCancelBtnStyle,
    modalSubmitBtnStyle,
    fieldLabelStyle,
    fieldInputStyle
} from "../superAdminStyles";

export function AddDeptModal({
    isOpen,
    onClose,
    newDeptForm,
    setNewDeptForm,
    onSubmit,
    isHi = false
}) {
    if (!isOpen) return null;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                        <IconBuilding size={18} color="#0284C7" />
                        <span>{isHi ? "नया विभाग जोड़ें" : "Add Clinical Department"}</span>
                    </h3>
                    <button type="button" onClick={onClose} style={modalCloseIconBtnStyle}>
                        <IconX size={15} />
                    </button>
                </div>

                <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "विभाग का नाम" : "Department Name"} *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Cardiology & ECG"
                            value={newDeptForm.name}
                            onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                            style={fieldInputStyle}
                        />
                    </div>

                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "विभाग कोड" : "Dept Code"} *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. cardiology"
                            value={newDeptForm.dept_code}
                            onChange={(e) => setNewDeptForm({ ...newDeptForm, dept_code: e.target.value })}
                            style={fieldInputStyle}
                        />
                    </div>

                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "विवरण" : "Description"}</label>
                        <textarea
                            rows="2"
                            placeholder="Clinical procedures overview..."
                            value={newDeptForm.description}
                            onChange={(e) => setNewDeptForm({ ...newDeptForm, description: e.target.value })}
                            style={{ ...fieldInputStyle, resize: "none" }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button type="button" onClick={onClose} style={modalCancelBtnStyle}>
                            {isHi ? "रद्द करें" : "Cancel"}
                        </button>
                        <button type="submit" style={modalSubmitBtnStyle}>
                            {isHi ? "विभाग सहेजें" : "Save Department"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function EditDeptModal({
    isOpen,
    onClose,
    editDeptForm,
    setEditDeptForm,
    onSubmit,
    isHi = false
}) {
    if (!isOpen) return null;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                        <IconBuilding size={18} color="#0284C7" />
                        <span>{isHi ? "क्लिनिकल विभाग संपादित करें" : "Edit Clinical Department"}</span>
                    </h3>
                    <button type="button" onClick={onClose} style={modalCloseIconBtnStyle}>
                        <IconX size={15} />
                    </button>
                </div>

                <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "विभाग कोड (स्थिर)" : "Dept Code (Read-Only)"}</label>
                        <input
                            type="text"
                            readOnly
                            disabled
                            value={editDeptForm.dept_code}
                            style={{ ...fieldInputStyle, background: "#F1F5F9", cursor: "not-allowed", color: "#64748B" }}
                        />
                        <span style={{ fontSize: "11px", color: "#64748B", marginTop: "3px", display: "block" }}>
                            {isHi
                                ? "विदेशी कुंजी के रूप में उपयोग होने के कारण विभाग कोड बदला नहीं जा सकता।"
                                : "Dept code cannot be modified directly as it links desks and employee profiles."}
                        </span>
                    </div>

                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "विभाग का नाम" : "Department Name"} *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Cardiology & ECG"
                            value={editDeptForm.name}
                            onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })}
                            style={fieldInputStyle}
                        />
                    </div>

                    <div>
                        <label style={fieldLabelStyle}>{isHi ? "विवरण" : "Description"}</label>
                        <textarea
                            rows="2"
                            placeholder="Clinical procedures overview..."
                            value={editDeptForm.description}
                            onChange={(e) => setEditDeptForm({ ...editDeptForm, description: e.target.value })}
                            style={{ ...fieldInputStyle, resize: "none" }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button type="button" onClick={onClose} style={modalCancelBtnStyle}>
                            {isHi ? "रद्द करें" : "Cancel"}
                        </button>
                        <button type="submit" style={modalSubmitBtnStyle}>
                            {isHi ? "परिवर्तन सहेजें" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddDeptModal;

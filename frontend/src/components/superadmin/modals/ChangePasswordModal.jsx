import React, { useState } from "react";
import { IconKey, IconCheckCircle, IconCopy, IconEye, IconX } from "../SuperAdminIcons";
import {
    modalOverlayStyle,
    modalContentStyle,
    modalCloseIconBtnStyle,
    modalCancelBtnStyle,
    modalSubmitBtnStyle,
    fieldLabelStyle,
    fieldInputStyle,
    roleBadgeStyle
} from "../superAdminStyles";

export default function ChangePasswordModal({
    isOpen,
    onClose,
    targetEmployee,
    selectedHospital,
    passwordUpdateSuccess,
    setPasswordUpdateSuccess,
    newPasswordValue,
    setNewPasswordValue,
    onSubmit,
    isUpdatingPassword,
    onNotify,
    isHi = false
}) {
    const [showPasswordText, setShowPasswordText] = useState(false);

    if (!isOpen || !targetEmployee) return null;

    return (
        <div style={modalOverlayStyle} onClick={() => { onClose(); if (setPasswordUpdateSuccess) setPasswordUpdateSuccess(null); }}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                        <IconKey size={18} color="#D97706" />
                        <span>{isHi ? "डॉक्टर / स्टाफ पासवर्ड अपडेट करें" : "Update Doctor / Staff Password"}</span>
                    </h3>
                    <button
                        type="button"
                        onClick={() => { onClose(); if (setPasswordUpdateSuccess) setPasswordUpdateSuccess(null); }}
                        style={modalCloseIconBtnStyle}
                    >
                        <IconX size={15} />
                    </button>
                </div>

                {/* Target Employee Info Banner */}
                <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#92400E" }}>
                            {targetEmployee.name || targetEmployee.username}
                        </span>
                        <span style={{ ...roleBadgeStyle(targetEmployee.role), fontSize: "10px" }}>
                            {targetEmployee.role?.toUpperCase()}
                        </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#B45309", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                        <span><strong>Email:</strong> {targetEmployee.email}</span>
                        <span><strong>ID:</strong> {targetEmployee.employee_id || `EMP-${targetEmployee.id || targetEmployee.employee_id_num}`}</span>
                        <span><strong>Hospital:</strong> {selectedHospital?.name || "Selected Facility"}</span>
                    </div>
                </div>

                {passwordUpdateSuccess ? (
                    <div>
                        <div style={{ padding: "14px", borderRadius: "12px", background: "#F0FDF4", border: "1px solid #BBF7D0", marginBottom: "16px", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#16A34A", fontWeight: 800, fontSize: "15px", marginBottom: "6px" }}>
                                <IconCheckCircle size={18} color="#16A34A" />
                                <span>{isHi ? "पासवर्ड सफलतापूर्वक बदला गया!" : "Password Updated Successfully!"}</span>
                            </div>
                            <p style={{ margin: "4px 0 10px 0", fontSize: "12.5px", color: "#15803D" }}>
                                {isHi ? "नए क्रेडेंशियल कर्मचारी को उपलब्ध कराएं:" : "Share these new login credentials with the user:"}
                            </p>
                            <div style={{ background: "#FFFFFF", border: "1px solid #86EFAC", borderRadius: "8px", padding: "10px", textAlign: "left", fontSize: "12px", fontFamily: "monospace", color: "#166534" }}>
                                <div><strong>User:</strong> {passwordUpdateSuccess.name}</div>
                                <div><strong>Email / ID:</strong> {passwordUpdateSuccess.email}</div>
                                <div><strong>New Password:</strong> {passwordUpdateSuccess.password}</div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const text = `Hospital: ${passwordUpdateSuccess.hospital_name}\nRole: ${passwordUpdateSuccess.role?.toUpperCase()}\nUser: ${passwordUpdateSuccess.name}\nEmail: ${passwordUpdateSuccess.email}\nNew Password: ${passwordUpdateSuccess.password}`;
                                    navigator.clipboard.writeText(text);
                                    if (onNotify) onNotify(isHi ? "क्रेडेंशियल कॉपी हो गए!" : "New credentials copied to clipboard!");
                                }}
                                style={{ ...modalSubmitBtnStyle, background: "#16A34A", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                            >
                                <IconCopy size={14} />
                                <span>{isHi ? "नए क्रेडेंशियल कॉपी करें" : "Copy New Credentials"}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    if (setPasswordUpdateSuccess) setPasswordUpdateSuccess(null);
                                }}
                                style={modalCancelBtnStyle}
                            >
                                {isHi ? "बंद करें" : "Done"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                            <label style={{ ...fieldLabelStyle, display: "block", marginBottom: "6px" }}>
                                {isHi ? "नया पासवर्ड सेट करें" : "Set New Password"} *
                            </label>
                            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                <input
                                    type={showPasswordText ? "text" : "password"}
                                    required
                                    value={newPasswordValue}
                                    onChange={(e) => setNewPasswordValue(e.target.value)}
                                    placeholder={isHi ? "उदा. Pass@2026 या PIN" : "e.g. Pass@2026 or PIN"}
                                    style={{
                                        ...fieldInputStyle,
                                        paddingRight: "70px",
                                        fontWeight: 700,
                                        fontFamily: showPasswordText ? "monospace" : "inherit",
                                        letterSpacing: showPasswordText ? "0.05em" : "normal",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordText(!showPasswordText)}
                                    style={{
                                        position: "absolute",
                                        right: "8px",
                                        background: "#F1F5F9",
                                        border: "1px solid #CBD5E1",
                                        borderRadius: "6px",
                                        padding: "3px 8px",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: "#475569",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                    }}
                                >
                                    <IconEye size={12} color="#475569" />
                                    <span>{showPasswordText ? (isHi ? "छिपाएं" : "Hide") : (isHi ? "दिखाएं" : "Show")}</span>
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    if (setPasswordUpdateSuccess) setPasswordUpdateSuccess(null);
                                }}
                                style={modalCancelBtnStyle}
                            >
                                {isHi ? "रद्द करें" : "Cancel"}
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdatingPassword}
                                style={{
                                    ...modalSubmitBtnStyle,
                                    background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
                                    opacity: isUpdatingPassword ? 0.7 : 1,
                                    cursor: isUpdatingPassword ? "wait" : "pointer",
                                }}
                            >
                                {isUpdatingPassword
                                    ? (isHi ? "अपडेट हो रहा है..." : "Updating...")
                                    : (isHi ? "पासवर्ड अपडेट करें" : "Update Password")}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

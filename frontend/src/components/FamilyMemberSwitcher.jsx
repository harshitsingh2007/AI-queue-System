/**
 * FamilyMemberSwitcher.jsx
 * ------------------------
 * Horizontal profile selector & modal manager for family dependents:
 * Allows managing queue passes, walk-ins, and bookings for Self, Children, Spouse, Parents, etc.
 * Theme: Soft Green Clinical (Clean Healthcare SaaS)
 */

import React, { useState } from "react";
import { t } from "../utils/i18n";

export default function FamilyMemberSwitcher({
  members,
  selectedMemberId,
  onSelectMember,
  onAddMember,
  onDeleteMember,
  language = "en",
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("child");
  const [newMemberAge, setNewMemberAge] = useState("8");
  const [newMemberGender, setNewMemberGender] = useState("male");
  const [formError, setFormError] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setFormError(language === "hi" ? "कृपया सदस्य का नाम दर्ज करें।" : "Please enter the member's full name.");
      return;
    }

    const member = {
      id: `dep_${Date.now()}`,
      name: newMemberName.trim(),
      relation: newMemberRelation,
      age: Number(newMemberAge) || 25,
      gender: newMemberGender,
    };

    onAddMember(member);
    setShowAddModal(false);
    setNewMemberName("");
    setNewMemberRelation("child");
    setNewMemberAge("8");
    setNewMemberGender("male");
    setFormError("");
  };

  const getRelationLabel = (relation) => {
    const key = `relation_${relation.toLowerCase()}`;
    return t(key, language);
  };

  return (
    <div style={containerStyle}>
      <div style={headerRowStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#065F46", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            {t("bookingFor", language)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={addTriggerBtnStyle}
          title={t("addMemberTitle", language)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("addMember", language)}
        </button>
      </div>

      {/* Horizontal Pill Bar */}
      <div style={pillsScrollContainerStyle}>
        {members.map((member) => {
          const isSelected = member.id === selectedMemberId;
          const isSelf = member.relation === "self";

          return (
            <div
              key={member.id}
              onClick={() => onSelectMember(member)}
              style={getPillStyle(isSelected)}
              role="button"
              tabIndex={0}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {isSelf ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#FFFFFF" : "#047857"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#FFFFFF" : "#0284C7"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                <span style={{ fontWeight: isSelected ? 800 : 700, fontSize: "13px" }}>
                  {member.name}
                </span>
                <span style={getTagStyle(isSelected, isSelf)}>
                  {getRelationLabel(member.relation)}
                </span>
              </div>

              {/* Optional Delete Button for dependents */}
              {!isSelf && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`${language === "hi" ? "हटाएं" : "Remove"} ${member.name}?`)) {
                      onDeleteMember(member.id);
                    }
                  }}
                  style={deleteMemberBtnStyle(isSelected)}
                  title={t("removeMemberBtn", language)}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Family Member Modal */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#064E3B", fontWeight: 800 }}>
                  {t("addMemberTitle", language)}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {t("addMemberDesc", language)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={closeBtnStyle}
              >
                ×
              </button>
            </div>

            {formError && (
              <div style={{ marginBottom: "14px", padding: "8px 12px", borderRadius: "8px", background: "#FEF2F2", color: "#DC2626", fontSize: "12px", fontWeight: 600 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: "14px" }}>
                <label style={fieldLabelStyle}>{t("memberNameLabel", language)}</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Verma"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={fieldLabelStyle}>{t("relationshipLabel", language)}</label>
                  <select
                    value={newMemberRelation}
                    onChange={(e) => setNewMemberRelation(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="child">{getRelationLabel("child")}</option>
                    <option value="spouse">{getRelationLabel("spouse")}</option>
                    <option value="parent">{getRelationLabel("parent")}</option>
                    <option value="sibling">{getRelationLabel("sibling")}</option>
                    <option value="other">{getRelationLabel("other")}</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>{t("memberAgeLabel", language)}</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newMemberAge}
                    onChange={(e) => setNewMemberAge(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={fieldLabelStyle}>{t("memberGenderLabel", language)}</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {["male", "female", "other"].map((g) => (
                    <label
                      key={g}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: newMemberGender === g ? "2px solid #059669" : "1px solid #CBD5E1",
                        background: newMemberGender === g ? "#ECFDF5" : "#FFFFFF",
                        color: newMemberGender === g ? "#065F46" : "#475569",
                        fontSize: "12px",
                        fontWeight: 700,
                        textAlign: "center",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      <input
                        type="radio"
                        name="memberGender"
                        value={g}
                        checked={newMemberGender === g}
                        onChange={() => setNewMemberGender(g)}
                        style={{ display: "none" }}
                      />
                      {t(g, language)}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={cancelBtnStyle}
                >
                  {t("cancelBtn", language)}
                </button>
                <button
                  type="submit"
                  style={submitBtnStyle}
                >
                  {t("saveMemberBtn", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling definitions
const containerStyle = {
  background: "#FFFFFF",
  borderRadius: "14px",
  border: "1px solid #E2E8F0",
  padding: "14px 16px",
  marginBottom: "20px",
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};

const addTriggerBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 10px",
  borderRadius: "6px",
  border: "1px solid #A7F3D0",
  background: "#ECFDF5",
  color: "#047857",
  fontWeight: 700,
  fontSize: "11px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const pillsScrollContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  overflowX: "auto",
  paddingBottom: "4px",
};

const getPillStyle = (isSelected) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "8px 14px",
  borderRadius: "10px",
  border: isSelected ? "1.5px solid #059669" : "1px solid #CBD5E1",
  background: isSelected ? "#059669" : "#F8FAFC",
  color: isSelected ? "#FFFFFF" : "#0F172A",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "all 0.2s ease",
  boxShadow: isSelected ? "0 2px 8px rgba(5, 150, 105, 0.2)" : "none",
});

const getTagStyle = (isSelected, isSelf) => ({
  padding: "1px 6px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: 700,
  background: isSelected
    ? "rgba(255, 255, 255, 0.22)"
    : isSelf
    ? "#ECFDF5"
    : "#E0F2FE",
  color: isSelected
    ? "#FFFFFF"
    : isSelf
    ? "#047857"
    : "#0284C7",
  border: isSelected ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
});

const deleteMemberBtnStyle = (isSelected) => ({
  background: "transparent",
  border: "none",
  color: isSelected ? "rgba(255, 255, 255, 0.8)" : "#94A3B8",
  fontSize: "14px",
  fontWeight: 800,
  cursor: "pointer",
  padding: "0 0 0 4px",
  lineHeight: 1,
});

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(15, 23, 42, 0.5)",
  backdropFilter: "blur(2px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "16px",
};

const modalContentStyle = {
  background: "#FFFFFF",
  borderRadius: "16px",
  border: "1px solid #E2E8F0",
  width: "100%",
  maxWidth: "420px",
  padding: "22px",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "18px",
  paddingBottom: "12px",
  borderBottom: "1px solid #E2E8F0",
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  fontSize: "20px",
  color: "#64748B",
  cursor: "pointer",
  lineHeight: 1,
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "#334155",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid #CBD5E1",
  background: "#F8FAFC",
  color: "#0F172A",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const cancelBtnStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const submitBtnStyle = {
  padding: "8px 18px",
  borderRadius: "8px",
  border: "none",
  background: "#059669",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
};

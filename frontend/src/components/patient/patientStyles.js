/**
 * patientStyles.js
 * ----------------
 * Shared design system style objects and tokens for the Patient Portal.
 */

export const standaloneCardStyle = {
  background: "var(--patient-card-bg, #FFFFFF)",
  borderRadius: "18px",
  border: "1px solid var(--patient-card-border, #E2E8F0)",
  padding: "clamp(14px, 3vw, 28px)",
  boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
  color: "var(--patient-text-main, #0F172A)",
  boxSizing: "border-box",
  width: "100%",
};

export const fieldLabelWithIconStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12.5px",
  color: "var(--patient-text-sub, #334155)",
  marginBottom: "8px",
  fontWeight: 600,
};

export const fieldInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid var(--patient-card-border, #E2E8F0)",
  background: "var(--patient-card-bg, #FFFFFF)",
  color: "var(--patient-text-main, #0F172A)",
  fontSize: "13.5px",
  outline: "none",
  transition: "border 0.2s ease, box-shadow 0.2s ease",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
  boxSizing: "border-box",
};

export const patientSubmitBtnStyle = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#ffffff",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
  transition: "all 0.2s ease",
  minHeight: "48px",
  boxSizing: "border-box",
};

export const aptConfirmationBoxStyle = {
  marginTop: "20px",
  padding: "18px",
  borderRadius: "14px",
  background: "#F0F9FF",
  border: "2px solid #0284C7",
  textAlign: "center",
  boxSizing: "border-box",
};

export const checkInNowBtnStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
  whiteSpace: "nowrap",
};

export const quickCheckInBtnStyle = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#0284C7",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const aptCardRowStyle = (status) => {
  const s = (status || "").toLowerCase();
  const base = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "clamp(12px, 2.5vw, 16px)",
    borderRadius: "12px",
    flexWrap: "wrap",
    gap: "12px",
    boxSizing: "border-box",
    width: "100%",
  };
  if (s === "checked_in" || s === "serving") {
    return {
      ...base,
      background: "var(--apt-active-bg, #F0F9FF)",
      border: "1px solid var(--apt-active-border, #BAE6FD)",
      color: "var(--patient-text-main, #0F172A)",
    };
  }
  if (s === "completed" || s === "transferred") {
    return {
      ...base,
      background: "var(--patient-card-bg, #FFFFFF)",
      border: "1px solid var(--patient-card-border, #E2E8F0)",
      color: "var(--patient-text-main, #0F172A)",
    };
  }
  return {
    ...base,
    background: "var(--patient-sub-card, #F8FAFC)",
    border: "1px solid var(--patient-card-border, #CBD5E1)",
    color: "var(--patient-text-main, #0F172A)",
  };
};

export const aptStatusBadgeStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "var(--patient-sub-card, #F1F5F9)", color: "var(--patient-text-sub, #475569)", border: "1px solid var(--patient-card-border, #CBD5E1)" };
  if (s === "transferred") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "var(--patient-tag-bg, #E0F2FE)", color: "var(--patient-tag-color, #0284C7)", border: "1px solid var(--patient-tag-border, #BAE6FD)" };
  if (s === "serving") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" };
  if (s === "checked_in") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "var(--patient-tag-bg, #F0F9FF)", color: "var(--patient-tag-color, #0284C7)", border: "1px solid var(--patient-tag-border, #BAE6FD)" };
  if (s === "check_in_available") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" };
  if (s === "booked" || s === "scheduled") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" };
  if (s === "cancelled" || s === "no_show" || s === "expired") return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "var(--emergency-card-bg, #FEF2F2)", color: "var(--emergency-card-text, #DC2626)", border: "1px solid var(--emergency-card-border, #FECACA)" };
  return { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#F3E8FF", color: "#7E22CE", border: "1px solid #E9D5FF" };
};

export const passStatusBadgeStyle = (status) => ({
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  background: status === "serving" ? "var(--patient-tag-bg, #F0F9FF)" : "#FEF3C7",
  color: status === "serving" ? "var(--patient-tag-color, #0284C7)" : "#D97706",
  border: status === "serving" ? "1px solid var(--patient-tag-border, #BAE6FD)" : "1px solid #FDE68A",
});

export const dashboardFooterStyle = {
  marginTop: "36px",
  paddingTop: "20px",
  borderTop: "1px solid #E2E8F0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
};

export const footerLogoIconStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  background: "#0284C7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const modalBackdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.65)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: "16px",
};

export const modalContentStyle = {
  background: "var(--patient-card-bg, #FFFFFF)",
  borderRadius: "20px",
  maxWidth: "440px",
  width: "100%",
  padding: "26px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
  border: "1px solid var(--patient-card-border, #E2E8F0)",
  color: "var(--patient-text-main, #0F172A)",
  boxSizing: "border-box",
};

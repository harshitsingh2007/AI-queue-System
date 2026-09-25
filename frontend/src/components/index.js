/**
 * Centralized Component Barrel Exports
 * Categorized by Domain: common, patient, staff, kiosk
 */

// Common / Shared
export { default as Header } from "./common/Header";
export { default as Footer } from "./common/Footer";
export { default as AuthModal } from "./common/AuthModal";
export { default as MandatoryAuthScreen } from "./common/MandatoryAuthScreen";
export { default as AccessDeniedGuard } from "./common/AccessDeniedGuard";
export { default as ErrorBoundary } from "./common/ErrorBoundary";

// Patient
export { default as HeroBanner } from "./patient/HeroBanner";
export { default as QueueStepper } from "./patient/QueueStepper";
export { default as FamilyMemberSwitcher, AddFamilyMemberModal, EditFamilyMemberModal, getRelationLabel } from "./patient/FamilyMemberSwitcher";
export { default as FeatureCards } from "./patient/FeatureCards";
export { default as QueuePluginWidget } from "./patient/QueuePluginWidget";

// Staff / Doctor
export { default as AdminHeroBanner } from "./staff/AdminHeroBanner";
export { default as DoctorShiftSummaryModal } from "./staff/DoctorShiftSummaryModal";

// Kiosk
export { default as KioskHeader } from "./kiosk/KioskHeader";
export { default as NowServing } from "./kiosk/NowServing";
export { default as NextQueue } from "./kiosk/NextQueue";
export { default as QueueSummary } from "./kiosk/QueueSummary";

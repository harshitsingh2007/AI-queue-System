/**
 * hospitalConfig.js
 * -----------------
 * Global configuration constants for Hospital Queue System.
 */

export const API_BASE = "http://127.0.0.1:8000";
export const WS_URL = "http://127.0.0.1:8000";

export const HOSPITAL_CONFIG = {
  tenantId: "city-hospital-01",
  name: "City General Hospital",
  consumerType: "hospital",
  categories: [
    { id: "consultation", label: "📋 General Consultation" },
    { id: "emergency", label: "🚨 Emergency Triage" },
    { id: "pharmacy", label: "💊 Pharmacy & Medicine" },
    { id: "radiology", label: "🩻 Radiology & X-Ray" },
    { id: "lab_test", label: "🧪 Pathology & Lab Test" },
  ],
};

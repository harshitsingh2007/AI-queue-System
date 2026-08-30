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
    { id: "consultation", label: "General Consultation" },
    { id: "pharmacy", label: "Pharmacy & Medicine" },
    { id: "laboratory", label: "Pathology & Lab Tests" },
    { id: "radiology", label: "Radiology & Imaging" },
    { id: "emergency", label: "Emergency Triage" },
    { id: "billing", label: "Billing & Cashier" },
  ],
};

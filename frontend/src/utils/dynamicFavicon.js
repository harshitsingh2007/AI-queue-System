/**
 * dynamicFavicon.js
 * -----------------
 * Manages the browser tab icon (favicon) and title dynamically based on
 * the active hospital's white-label branding uploaded by Super Admin.
 *
 * Scoping Rule:
 * The uploaded hospital logo is strictly visible in the browser tab ONLY for
 * patients and staff affiliated with that specific hospital. It is NOT applied globally
 * (e.g., in the Super Admin dashboard or across unrelated hospital tenants).
 */

export const DEFAULT_FAVICON_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230284C7'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z'/%3E%3C/svg%3E";

/**
 * Updates the browser tab favicon and document title.
 *
 * @param {Object} options
 * @param {string|null} options.logoUrl - The hospital logo URL or base64 data URI uploaded by Super Admin.
 * @param {string|null} options.hospitalName - The hospital name.
 * @param {boolean} options.isAffiliate - True if the visitor is an affiliate patient or staff member of this hospital.
 * @param {boolean} options.isSuperAdmin - True if current user is Super Admin in the global admin portal.
 * @param {string} [options.role] - Current user role (e.g., "doctor", "nurse", "staff", "patient").
 */
export function updateBrowserTabBrand({
  logoUrl = null,
  hospitalName = null,
  isAffiliate = false,
  isSuperAdmin = false,
  role = "",
} = {}) {
  if (typeof document === "undefined") return;

  // 1. Determine target icon URL
  const hasCustomLogo = Boolean(logoUrl && typeof logoUrl === "string" && logoUrl.trim().length > 0);
  const targetIcon = (isAffiliate && !isSuperAdmin && hasCustomLogo)
    ? logoUrl.trim()
    : DEFAULT_FAVICON_SVG;

  // 2. Update favicon in browser head (robust replace pattern for Chromium & Firefox)
  try {
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach((el) => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });

    const link = document.createElement("link");
    link.id = "app-dynamic-favicon";
    link.rel = "shortcut icon";

    if (targetIcon.startsWith("data:image/svg") || targetIcon.includes(".svg")) {
      link.type = "image/svg+xml";
    } else if (targetIcon.startsWith("data:image/png") || targetIcon.includes(".png")) {
      link.type = "image/png";
    } else if (targetIcon.startsWith("data:image/jpeg") || targetIcon.includes(".jpg") || targetIcon.includes(".jpeg")) {
      link.type = "image/jpeg";
    } else if (targetIcon.startsWith("data:image/webp") || targetIcon.includes(".webp")) {
      link.type = "image/webp";
    } else if (targetIcon.includes(".ico")) {
      link.type = "image/x-icon";
    }

    link.href = targetIcon;
    document.head.appendChild(link);
  } catch (err) {
    console.log("Favicon update error:", err);
  }

  // 3. Update document title
  try {
    if (isSuperAdmin) {
      document.title = "AI-Queue | Super Admin Portal";
    } else if (isAffiliate && hospitalName && hospitalName.trim().length > 0) {
      const cleanName = hospitalName.trim();
      const roleStr = String(role || "").toLowerCase();
      let portalSuffix = "Patient Portal";

      if (["doctor", "staff", "receptionist", "admin"].includes(roleStr)) {
        portalSuffix = roleStr === "doctor"
          ? "Doctor Portal"
          : (roleStr === "receptionist" ? "Reception Portal" : "Staff Portal");
      }

      document.title = `${cleanName} | ${portalSuffix}`;
    } else {
      document.title = "AI-Powered Smart Queue Management System";
    }
  } catch (err) {
    console.log("Document title update error:", err);
  }
}

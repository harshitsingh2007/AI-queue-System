/**
 * printPassHelper.js
 * -------------------
 * Generates an official hospital-branded print slip / PDF receipt.
 * Opens the native browser print / "Save as PDF" dialog with zero external dependencies.
 */

import { t, getCategoryLabel, getStatusLabel } from "./i18n";

/**
 * Triggers the browser print/PDF dialog using a dedicated hidden iframe.
 */
function triggerIframePrint(htmlContent) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.error("Print error:", e);
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 400);
}

/**
 * Safely parse and format prescription notes into clean HTML for print slips
 */
function formatRxHtml(rxNotes, lang = "en") {
  if (!rxNotes) return "";
  let parsed = null;
  if (typeof rxNotes === "object" && rxNotes !== null) {
    parsed = rxNotes;
  } else if (typeof rxNotes === "string") {
    let trimmed = rxNotes.trim();
    while ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      trimmed = trimmed.slice(1, -1).trim();
    }
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (e) {
        try { parsed = JSON.parse(JSON.parse(rxNotes)); } catch (e2) {}
      }
    } else {
      try {
        const d = JSON.parse(rxNotes);
        if (typeof d === "object" && d !== null) parsed = d;
      } catch (e) {}
    }
  }

  if (parsed && typeof parsed === "object") {
    let html = `<div style="text-align: left; margin-top: 4px;">`;
    if (parsed.diagnosis) {
      html += `<div style="font-size: 11.5px; font-weight: 800; color: #166534; margin-bottom: 3px;"><strong>Diagnosis:</strong> ${parsed.diagnosis}</div>`;
    }
    if (Array.isArray(parsed.medicines) && parsed.medicines.length > 0) {
      html += `<div style="font-size: 11px; font-weight: 800; color: #15803D; margin-top: 4px;">Rx Medicines:</div>`;
      html += `<ul style="margin: 3px 0 4px 16px; padding: 0; font-size: 11px; color: #1e293b;">`;
      parsed.medicines.forEach((m) => {
        if (m.name) {
          html += `<li><strong>${m.name}</strong> ${m.dosage || ""} ${m.frequency ? `(${m.frequency})` : ""} ${m.duration ? `[${m.duration}]` : ""}</li>`;
        }
      });
      html += `</ul>`;
    }
    if (parsed.advice) {
      html += `<div style="font-size: 11px; color: #15803D; margin-top: 3px; font-style: italic;"><strong>Advice:</strong> ${parsed.advice}</div>`;
    }
    html += `</div>`;
    return html;
  }

  return `<p class="rx-text">"${typeof rxNotes === "string" ? rxNotes : JSON.stringify(rxNotes)}"</p>`;
}

/**
 * Print live queue token pass with QR code and optional clinical prescription.
 */
export function printTokenPass(ticket, qrBase64, lang = "en", branding = null) {
  if (!ticket) return;

  const hospitalName = (branding && (branding.hospital_name || branding.name)) || ticket.hospital_name || t("hospitalName", lang);
  const brandPrimary = (branding && branding.primary_color) || "#047857";
  const brandTagline = (branding && branding.tagline) || (lang === "hi" ? "भरोसेमंद स्वास्थ्य सेवा • एनएबीएच मान्यता प्राप्त" : "Care you can trust • Official Clinical Pass");
  const emergencyHelpline = (branding && branding.emergency_helpline) || "";
  const customFooter = (branding && branding.slip_footer_text) || (lang === "hi" ? "अहस्तांतरणीय आधिकारिक मरीज़ रिकॉर्ड • कृपया परामर्श समाप्ति तक संभाल कर रखें" : "Non-transferable official patient record • Retain until consultation is complete");
  const logoUrl = (branding && branding.logo_url) || "";

  const now = new Date();
  const formattedDateTime = now.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const deptName = getCategoryLabel(ticket.service_category, lang);
  const statusName = getStatusLabel(ticket.status, lang);
  const genderStr = t(ticket.gender || "male", lang);
  const yrsStr = t("unit_yrs", lang);
  const minStr = t("unit_min", lang);
  const passTitle = t("officialQueuePass", lang);
  const noticeStr = t("presentedAtDesk", lang);
  const footerStr = `${hospitalName} • ${customFooter}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${hospitalName} - Token #${ticket.ticket_id}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 6mm;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0 auto;
      max-width: 360px;
      color: #0f172a;
      background: #ffffff;
      padding: 16px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid ${brandPrimary};
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .logo-img {
      max-height: 48px;
      max-width: 140px;
      object-fit: contain;
      margin-bottom: 6px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    .hospital-title {
      font-size: 17px;
      font-weight: 900;
      color: ${brandPrimary};
      letter-spacing: -0.2px;
      margin: 0;
      text-transform: uppercase;
    }
    .slip-subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      margin-top: 3px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }
    .issue-time {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .helpline-box {
      margin: 8px 0;
      padding: 5px 8px;
      border-radius: 6px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #DC2626;
      font-size: 10.5px;
      font-weight: 800;
      text-align: center;
    }
    .token-banner {
      text-align: center;
      background: #F8FAFC;
      border: 2px solid ${brandPrimary};
      border-radius: 8px;
      padding: 14px 10px;
      margin: 12px 0;
    }
    .token-label {
      font-size: 10px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .token-num {
      font-size: 42px;
      font-weight: 900;
      color: ${brandPrimary};
      line-height: 1;
      margin: 4px 0 6px 0;
    }
    .token-dept {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 12px;
    }
    .info-table tr {
      border-bottom: 1px dotted #cbd5e1;
    }
    .info-table td {
      padding: 5px 0;
    }
    .info-table td.label {
      color: #64748b;
      font-weight: 600;
      width: 44%;
    }
    .info-table td.val {
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }
    .rx-card {
      margin: 12px 0;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #94a3b8;
      border-radius: 6px;
    }
    .rx-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      background: #047857;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      margin-right: 6px;
    }
    .rx-header {
      font-size: 11px;
      font-weight: 800;
      color: #064e3b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .rx-text {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
      font-style: italic;
      margin: 0;
      line-height: 1.35;
    }
    .qr-box {
      text-align: center;
      margin: 14px 0 8px 0;
    }
    .qr-img {
      width: 120px;
      height: 120px;
      border: 1px solid #cbd5e1;
      padding: 4px;
      border-radius: 6px;
      background: #ffffff;
    }
    .notice {
      font-size: 10px;
      color: #475569;
      text-align: center;
      margin: 8px 0 0 0;
      line-height: 1.35;
    }
    .footer {
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      margin-top: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="Logo" />` : ""}
    <h1 class="hospital-title">${hospitalName}</h1>
    <div class="slip-subtitle">${brandTagline}</div>
    <div class="issue-time">${formattedDateTime}</div>
    ${emergencyHelpline ? `<div class="helpline-box">📞 ${emergencyHelpline}</div>` : ""}
  </div>

  <div class="token-banner">
    <div class="token-label">${t("tokenId", lang)}</div>
    <div class="token-num">#${ticket.ticket_id}</div>
    <div class="token-dept">${deptName}</div>
  </div>

  <table class="info-table">
    <tr>
      <td class="label">${t("patientDemographics", lang)}</td>
      <td class="val">${ticket.name} (${ticket.age || 30} ${yrsStr}, ${genderStr})</td>
    </tr>
    <tr>
      <td class="label">${t("currentStatus", lang)}</td>
      <td class="val">${statusName}</td>
    </tr>
    <tr>
      <td class="label">${t("pos", lang)}</td>
      <td class="val">#${ticket.position || 1}</td>
    </tr>
    <tr>
      <td class="label">${t("estWait", lang)}</td>
      <td class="val">${ticket.estimated_wait_minutes || 5} ${minStr}</td>
    </tr>
    <tr>
      <td class="label">${t("symptomRisk", lang)}</td>
      <td class="val">${(ticket.medical_condition || "general_checkup").replace(/_/g, " ").toUpperCase()}</td>
    </tr>
    ${ticket.pre_existing_condition ? `
    <tr>
      <td class="label">${t("riskLabel", lang)}</td>
      <td class="val">${ticket.pre_existing_condition.toUpperCase()}</td>
    </tr>` : ""}
  </table>

  ${ticket.prescription_notes ? `
  <div class="rx-card" style="background: #F0FDF4; border: 1px solid #86EFAC;">
    <div class="rx-header" style="color: #15803D;">
      <span class="rx-badge" style="background: #15803D;">Rx</span>
      ${t("ePrescriptionAttached", lang)} ${ticket.transferred_from_dept ? `(${t("transferredFrom", lang)} ${getCategoryLabel(ticket.transferred_from_dept, lang)})` : ""}
    </div>
    ${formatRxHtml(ticket.prescription_notes, lang)}
  </div>` : ""}

  ${qrBase64 ? `
  <div class="qr-box">
    <img src="${qrBase64}" class="qr-img" alt="Pass QR Code" />
    <p class="notice">${noticeStr}</p>
  </div>` : `
  <p class="notice">${noticeStr}</p>`}

  <div class="footer">
    ${footerStr}
  </div>
</body>
</html>`;

  triggerIframePrint(html);
}

/**
 * Print past appointment receipt / prescription record.
 */
export function printAppointmentRecord(apt, lang = "en") {
  if (!apt) return;

  const hospitalName = t("hospitalName", lang);
  const deptName = getCategoryLabel(apt.service_category, lang);
  const statusName = getStatusLabel(apt.status, lang);
  const slipTitle = t("officialRxSlip", lang);
  const footerStr = `${hospitalName} • ${lang === "hi" ? "अहस्तांतरणीय आधिकारिक मरीज़ रिकॉर्ड" : "Non-transferable official patient record"}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${hospitalName} - Appt #${apt.appointment_id}</title>
  <style>
    @page { size: 80mm auto; margin: 6mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0 auto;
      max-width: 360px;
      color: #0f172a;
      background: #ffffff;
      padding: 16px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .hospital-title {
      font-size: 17px;
      font-weight: 900;
      color: #064e3b;
      letter-spacing: -0.2px;
      margin: 0;
      text-transform: uppercase;
    }
    .slip-subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      margin-top: 3px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .banner {
      text-align: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      margin: 12px 0;
    }
    .banner-code {
      font-size: 22px;
      font-weight: 900;
      color: #047857;
      margin: 2px 0;
    }
    .banner-dept {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 12px;
    }
    .info-table tr { border-bottom: 1px dotted #cbd5e1; }
    .info-table td { padding: 5px 0; }
    .info-table td.label { color: #64748b; font-weight: 600; width: 44%; }
    .info-table td.val { font-weight: 700; color: #0f172a; text-align: right; }
    .rx-card {
      margin: 12px 0;
      padding: 10px 12px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 6px;
    }
    .rx-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      background: #047857;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      margin-right: 6px;
    }
    .rx-header {
      font-size: 11px;
      font-weight: 800;
      color: #064e3b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .rx-text {
      font-size: 12px;
      font-weight: 600;
      color: #047857;
      font-style: italic;
      margin: 0;
      line-height: 1.35;
    }
    .footer {
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      margin-top: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="hospital-title">${hospitalName}</h1>
    <div class="slip-subtitle">${slipTitle}</div>
  </div>

  <div class="banner">
    <div style="font-size: 10px; font-weight: 700; color: #64748b;">${t("tokenId", lang)}</div>
    <div class="banner-code">${apt.appointment_id}</div>
    <div class="banner-dept">${deptName}</div>
  </div>

  <table class="info-table">
    <tr>
      <td class="label">${t("patientDemographics", lang)}</td>
      <td class="val">${apt.patient_name}</td>
    </tr>
    <tr>
      <td class="label">${t("dateLabel", lang)} & ${t("timeLabel", lang)}</td>
      <td class="val">${apt.appointment_date} @ ${apt.time_slot}</td>
    </tr>
    <tr>
      <td class="label">${t("currentStatus", lang)}</td>
      <td class="val">${statusName}</td>
    </tr>
    ${apt.ticket_id ? `
    <tr>
      <td class="label">${t("mergedToken", lang)} ID)</td>
      <td class="val">#${apt.ticket_id}</td>
    </tr>` : ""}
  </table>

  ${apt.prescription_notes ? `
  <div class="rx-card" style="background: #F0FDF4; border: 1px solid #86EFAC;">
    <div class="rx-header" style="color: #15803D;">
      <span class="rx-badge" style="background: #15803D;">Rx</span>
      ${t("ePrescriptionLabel", lang)}
    </div>
    ${formatRxHtml(apt.prescription_notes, lang)}
  </div>` : ""}

  <div class="footer">
    ${footerStr}
  </div>
</body>
</html>`;

  triggerIframePrint(html);
}

/**
 * Print official A4 / slip clinical prescription with doctor letterhead and medications table.
 */
export function printPrescriptionSlip(rxData, lang = "en", branding = null) {
  if (!rxData) return;
  const hospitalName = (branding && (branding.hospital_name || branding.name)) || t("hospitalName", lang);
  const brandPrimary = (branding && branding.primary_color) || "#0284C7";
  const brandTagline = (branding && branding.tagline) || (lang === "hi" ? "आउटपेशेंट क्लिनिकल ई-प्रिस्क्रिप्शन पर्ची" : "Outpatient Clinical E-Prescription Slip");
  const footerStr = `${hospitalName} • ${(branding && branding.slip_footer_text) || "NABH Accredited Healthcare • Digitally Validated Clinical Prescription"}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${hospitalName} - Prescription #${rxData.ticket_id || ""}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0 auto;
      max-width: 720px;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid ${brandPrimary};
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .rx-symbol {
      font-size: 36px;
      font-weight: 900;
      color: ${brandPrimary};
      line-height: 1;
      margin-right: 12px;
    }
    .hosp-name {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      text-transform: uppercase;
    }
    .hosp-sub {
      font-size: 11px;
      font-weight: 700;
      color: ${brandPrimary};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f8fafc;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .info-label {
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .info-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .diag-box {
      margin-bottom: 16px;
      padding: 10px 14px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
    }
    .diag-title {
      font-size: 11px;
      font-weight: 800;
      color: #15803d;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .diag-val {
      font-size: 14px;
      font-weight: 800;
      color: #166534;
    }
    .meds-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .meds-table th {
      background: #f1f5f9;
      padding: 8px 10px;
      text-align: left;
      font-weight: 800;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    .meds-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .meds-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .stamp-box {
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #15803d;
      font-weight: 700;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 14px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; align-items: center;">
      <span class="rx-symbol">℞</span>
      <div>
        <h1 class="hosp-name">${hospitalName}</h1>
        <div class="hosp-sub">${brandTagline}</div>
      </div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      <div><strong>Date:</strong> ${rxData.prescribed_at ? new Date(rxData.prescribed_at).toLocaleDateString() : new Date().toLocaleDateString()}</div>
      <div><strong>Time:</strong> ${rxData.prescribed_at ? new Date(rxData.prescribed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-label">${t("patientDemographics", lang)}</div>
      <div class="info-val">${rxData.patient_name || "Patient"}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 2px;">
        ${rxData.age || 30} yrs • ${t(rxData.gender || "male", lang)} ${rxData.ticket_id ? `• Token #${rxData.ticket_id}` : ""}
      </div>
    </div>
    <div>
      <div class="info-label">Attending Doctor</div>
      <div class="info-val" style="color: ${brandPrimary};">${rxData.doctor_name || "Consultant Physician"}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 2px;">
        ${getCategoryLabel(rxData.doctor_department, lang)} ${rxData.doctor_employee_id ? `(ID: ${rxData.doctor_employee_id})` : ""}
      </div>
    </div>
  </div>

  <div class="diag-box">
    <div class="diag-title">Clinical Diagnosis / Provisional Assessment:</div>
    <div class="diag-val">${rxData.diagnosis || "General Clinical Consultation"}</div>
    ${rxData.lab_tests ? `<div style="font-size: 12px; color: #0284c7; margin-top: 4px;"><strong>🧪 Lab Tests:</strong> ${rxData.lab_tests}</div>` : ""}
  </div>

  <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 8px;">
    ℞ Prescribed Medications
  </div>

  ${rxData.medicines && rxData.medicines.length > 0 ? `
  <table class="meds-table">
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Medicine Name</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
        <th>Instructions</th>
      </tr>
    </thead>
    <tbody>
      ${rxData.medicines.map((m, idx) => `
        <tr>
          <td style="font-weight: 700; color: #64748b;">${idx + 1}</td>
          <td style="font-weight: 800; color: #0f172a;">${m.name || "-"}</td>
          <td style="color: #0284c7; font-weight: 700;">${m.dosage || "-"}</td>
          <td style="color: #15803d; font-weight: 700;">${m.frequency || "-"}</td>
          <td>${m.duration || "-"}</td>
          <td style="color: #64748b; font-style: italic;">${m.instructions || "After food"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>` : `
  <div style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #475569; font-style: italic; margin-bottom: 16px;">
    ${rxData.advice || "No specific medications prescribed. Follow general precautions."}
  </div>`}

  ${rxData.advice ? `
  <div style="margin-bottom: 14px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
    <div style="font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; margin-bottom: 2px;">Doctor's Advice & Care Plan:</div>
    <div style="font-size: 12.5px; color: #166534;">${rxData.advice}</div>
  </div>` : ""}

  ${rxData.follow_up ? `
  <div style="font-size: 12px; color: #475569; margin-bottom: 14px;">
    <strong>🗓️ Follow-Up Review:</strong> ${rxData.follow_up}
  </div>` : ""}

  <div class="stamp-box">
    <div>✓ Digitally Authenticated by Hospital OPD Clinical Desk</div>
    <div style="font-size: 10px; color: #94a3b8;">Valid across all hospital pharmacy counters</div>
  </div>

  <div class="footer">${footerStr}</div>
</body>
</html>`;

  triggerIframePrint(html);
}

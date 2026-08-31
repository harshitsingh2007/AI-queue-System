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
 * Print live queue token pass with QR code and optional clinical prescription.
 */
export function printTokenPass(ticket, qrBase64, lang = "en") {
  if (!ticket) return;

  const hospitalName = t("hospitalName", lang);
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
  const footerStr = t("hospitalFooterNote", lang);

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
    .issue-time {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .token-banner {
      text-align: center;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 14px 10px;
      margin: 12px 0;
    }
    .token-label {
      font-size: 10px;
      font-weight: 800;
      color: #065f46;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .token-num {
      font-size: 42px;
      font-weight: 900;
      color: #047857;
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
    <h1 class="hospital-title">${hospitalName}</h1>
    <div class="slip-subtitle">${passTitle}</div>
    <div class="issue-time">${formattedDateTime}</div>
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
  <div class="rx-card">
    <div class="rx-header">
      <span class="rx-badge">Rx</span>
      ${t("ePrescriptionAttached", lang)} ${ticket.transferred_from_dept ? `(${t("transferredFrom", lang)} ${getCategoryLabel(ticket.transferred_from_dept, lang)})` : ""}
    </div>
    <p class="rx-text">"${ticket.prescription_notes}"</p>
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
  const footerStr = t("hospitalFooterNote", lang);

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
  <div class="rx-card">
    <div class="rx-header">
      <span class="rx-badge">Rx</span>
      ${t("ePrescriptionLabel", lang)}
    </div>
    <p class="rx-text">"${apt.prescription_notes}"</p>
  </div>` : ""}

  <div class="footer">
    ${footerStr}
  </div>
</body>
</html>`;

  triggerIframePrint(html);
}

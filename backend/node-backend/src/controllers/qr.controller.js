/**
 * qr.controller.js
 * ----------------
 * Base64 QR Code Generator for Hospital Kiosks & Patient Tickets.
 */

const QRCode = require("qrcode");

async function generateHospitalQr(req, res, next) {
  try {
    const tenantId = req.params.tenant_id;
    const host = req.query.host || "http://localhost:5173";
    const targetUrl = `${host}?tenant=${tenantId}`;

    const qrBase64 = await QRCode.toDataURL(targetUrl, {
      margin: 2,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
    });

    return res.status(200).json({
      tenant_id: tenantId,
      target_url: targetUrl,
      qr_code_base64: qrBase64,
    });
  } catch (error) {
    next(error);
  }
}

async function generateTicketQr(req, res, next) {
  try {
    const ticketId = req.params.ticket_id;
    const host = req.query.host || "http://localhost:5173";
    const targetUrl = `${host}?ticket=${ticketId}`;

    const qrBase64 = await QRCode.toDataURL(targetUrl, {
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    return res.status(200).json({
      ticket_id: ticketId,
      target_url: targetUrl,
      qr_code_base64: qrBase64,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateHospitalQr,
  generateTicketQr,
};

/**
 * emailService.js
 * ---------------
 * Enterprise Email Dispatch Engine for Hex Visionaries AI Queue System.
 * Supports SMTP (Gmail, Brevo, SendGrid, custom SMTP) and graceful development fallback.
 */

const path = require("path");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const env = require("../config/env");

// Transporter instance with caching
let transporter = null;

function getTransporter() {
  // Reload latest .env from backend root so any updates are live immediately
  dotenv.config({ path: path.join(__dirname, "../../../.env"), override: true });

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim();

  if (host && user && pass) {
    if (!transporter || transporter._cachedUser !== user || transporter._cachedPass !== pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === "production",
        },
      });
      transporter._cachedUser = user;
      transporter._cachedPass = pass;
      console.log(`[Email Service] SMTP transporter active with host: ${host}:${port} (${user})`);
    }
    return transporter;
  }

  // Development Fallback: null transporter triggers clean terminal simulation
  transporter = null;
  return null;
}

/**
 * Base email layout wrapper with hospital branding aesthetic.
 */
function createEmailTemplate({ title, preheader, bodyHtml, otpCode, footerText, hospitalName }) {
  const brandName = (hospitalName && hospitalName.trim()) ? hospitalName.trim() : "City General Hospital";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Preheader preview text -->
        <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>

        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 20px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #E2E8F0; overflow: hidden;">
          <!-- Top Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); text-align: center;">
              <div style="display: inline-block; width: 44px; height: 44px; background: rgba(255, 255, 255, 0.18); border-radius: 12px; margin-bottom: 12px; text-align: center; line-height: 44px; color: #FFFFFF; font-size: 22px;">
                🏥
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${brandName}</h1>
              <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 500;">Patient Care & Smart Queue Portal</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0F172A; font-size: 18px; font-weight: 700;">${title}</h2>
              <div style="color: #475569; font-size: 14.5px; line-height: 1.6; margin-bottom: 24px;">
                ${bodyHtml}
              </div>

              <!-- OTP Code Display Card -->
              ${otpCode ? `
              <div style="background: #F0F9FF; border: 1.5px dashed #0284C7; border-radius: 14px; padding: 20px; text-align: center; margin: 28px 0;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0284C7; margin-bottom: 8px;">Your One-Time Security Code</div>
                <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0369A1; font-family: monospace;">${otpCode}</div>
                <div style="font-size: 12px; color: #64748B; margin-top: 8px;">This code will expire in <strong>15 minutes</strong>. Do not share it with anyone.</div>
              </div>
              ` : ""}

              <div style="border-top: 1px solid #F1F5F9; margin-top: 24px; padding-top: 20px; font-size: 12.5px; color: #94A3B8; line-height: 1.5;">
                ${footerText || `If you did not request this email, please disregard it or contact ${brandName} patient desk immediately.`}
              </div>
            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 32px; text-align: center; font-size: 12px; color: #64748B;">
              © 2026 ${brandName}. All rights reserved.<br>
              <span style="font-size: 11px; color: #94A3B8;">Clinical Identity & Patient Verification Service</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends a 6-digit email verification code for new account sign-up.
 */
async function sendVerificationEmail({ email, otp, username = "Patient", hospitalName }) {
  const brandName = (hospitalName && hospitalName.trim()) ? hospitalName.trim() : "City General Hospital";
  const cleanEmail = String(email || "").trim().toLowerCase();
  const title = "Verify Your Email Address";
  const preheader = `Your ${brandName} verification code is ${otp}`;
  const bodyHtml = `
    Hello <strong>${username}</strong>,<br><br>
    Thank you for registering with <strong>${brandName}</strong>. To complete your account verification and access instant smart queues, digital appointments, and prescription history, please enter the one-time security code below:
  `;

  const html = createEmailTemplate({
    title,
    preheader,
    bodyHtml,
    otpCode: otp,
    hospitalName: brandName,
    footerText: `If you did not attempt to register with ${brandName}, someone may have entered your email by mistake.`,
  });

  return dispatchEmail({
    to: cleanEmail,
    subject: `[${brandName}] ${otp} is your Email Verification Code`,
    html,
    text: `Your ${brandName} email verification code is: ${otp}. Valid for 15 minutes.`,
    otp,
    type: "email_verification",
    hospitalName: brandName,
  });
}

/**
 * Sends a 6-digit password reset code to recover account access.
 */
async function sendPasswordResetEmail({ email, otp, username = "User", hospitalName }) {
  const brandName = (hospitalName && hospitalName.trim()) ? hospitalName.trim() : "City General Hospital";
  const cleanEmail = String(email || "").trim().toLowerCase();
  const title = "Reset Your Account Password";
  const preheader = `Your ${brandName} password reset code is ${otp}`;
  const bodyHtml = `
    Hello <strong>${username}</strong>,<br><br>
    We received a request to reset the password for your <strong>${brandName}</strong> account associated with <code>${cleanEmail}</code>.<br><br>
    Please enter the 6-digit security code below to choose a new password:
  `;

  const html = createEmailTemplate({
    title,
    preheader,
    bodyHtml,
    otpCode: otp,
    hospitalName: brandName,
    footerText: `If you did not request a password reset for ${brandName}, your account is safe and no changes were made.`,
  });

  return dispatchEmail({
    to: cleanEmail,
    subject: `[${brandName}] ${otp} is your Password Reset Code`,
    html,
    text: `Your ${brandName} password reset code is: ${otp}. Valid for 15 minutes.`,
    otp,
    type: "password_reset",
    hospitalName: brandName,
  });
}

/**
 * Dispatches the email via SMTP if configured, or outputs simulation to terminal in dev.
 */
async function dispatchEmail({ to, subject, html, text, otp, type, hospitalName }) {
  const brandName = (hospitalName && hospitalName.trim()) ? hospitalName.trim() : "Hospital Portal";
  const t = getTransporter();
  const smtpUser = (process.env.SMTP_USER || "").trim();
  let from = process.env.SMTP_FROM || `"${brandName}" <${smtpUser || "noreply@hospitalportal.com"}>`;
  if (smtpUser && smtpUser.includes("@gmail.com")) {
    from = `"${brandName}" <${smtpUser}>`;
  }

  if (t) {
    try {
      const info = await t.sendMail({ from, to, subject, html, text });
      console.log(`[Email Sent] [${brandName}] To: ${to} | Subject: ${subject} | MessageID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err) {
      console.error(`[Email Error] Failed sending to ${to}:`, err.message);
      // Fall through to logging the code so developer / user is never locked out
    }
  }

  // Terminal Simulation Logger (Formatted block for instant dev testing)
  console.log("\n=======================================================");
  console.log(`📩 [${brandName.toUpperCase()} EMAIL DISPATCH - SIMULATION MODE]`);
  console.log(`To:       ${to}`);
  console.log(`Type:     ${type}`);
  console.log(`Hospital: ${brandName}`);
  console.log(`Subject:  ${subject}`);
  console.log(`🔑 OTP CODE: >>> ${otp} <<<`);
  console.log(`Valid:    15 minutes`);
  console.log("=======================================================\n");

  return { success: true, simulated: true, otp };
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};

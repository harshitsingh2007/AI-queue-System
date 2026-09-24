/**
 * tokenService.js
 * ----------------
 * Manages secure OTP codes and verification tokens for Email Verification and Password Reset.
 */

const crypto = require("crypto");
const prisma = require("../config/prisma");

/**
 * Generates a cryptographically strong 6-digit numeric OTP.
 */
function generateNumericOtp() {
  const buf = crypto.randomBytes(4);
  const num = buf.readUInt32BE(0) % 900000 + 100000;
  return String(num);
}

/**
 * Creates and stores a new OTP token for an email.
 * Invalidates any existing unused tokens of the same type for this email.
 *
 * @param {string} email
 * @param {"email_verification" | "password_reset"} type
 * @param {number} expiresInMinutes
 */
async function createVerificationOtp(email, type, expiresInMinutes = 15) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const otp = generateNumericOtp();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  try {
    // 1. Invalidate previous unused tokens for this email and type
    await prisma.$executeRawUnsafe(
      `UPDATE "verification_tokens" SET "used" = true WHERE "email" = $1 AND "type" = $2 AND "used" = false`,
      cleanEmail,
      type
    ).catch(() => {});

    // 2. Insert new token
    await prisma.$executeRawUnsafe(
      `INSERT INTO "verification_tokens" ("email", "token", "type", "expires_at", "used", "created_at") VALUES ($1, $2, $3, $4, false, NOW())`,
      cleanEmail,
      otp,
      type,
      expiresAt
    );

    return { otp, expiresAt };
  } catch (err) {
    console.error("[TokenService] Error saving verification token:", err);
    throw err;
  }
}

/**
 * Verifies an OTP code for an email and type.
 * If valid, marks the token as used.
 *
 * @param {string} email
 * @param {string} token
 * @param {"email_verification" | "password_reset"} type
 * @returns {Promise<boolean>}
 */
async function verifyOtp(email, token, type, markUsed = true) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanToken = String(token || "").trim();

  if (!cleanEmail || !cleanToken) return false;

  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "verification_tokens" 
       WHERE "email" = $1 
         AND "token" = $2 
         AND "type" = $3 
         AND "used" = false 
         AND "expires_at" > NOW() 
       ORDER BY "created_at" DESC 
       LIMIT 1`,
      cleanEmail,
      cleanToken,
      type
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return false;
    }

    const matchedRecord = rows[0];

    if (markUsed) {
      await prisma.$executeRawUnsafe(
        `UPDATE "verification_tokens" SET "used" = true WHERE "id" = $1`,
        matchedRecord.id
      ).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error("[TokenService] Error verifying token:", err);
    return false;
  }
}

module.exports = {
  createVerificationOtp,
  verifyOtp,
  generateNumericOtp,
};

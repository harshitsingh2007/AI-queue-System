/**
 * password.js
 * -----------
 * Enterprise Dual Password Hashing & Verification.
 * Supports legacy SHA-256 password hashes from PostgreSQL and bcrypt for new/updated accounts.
 */

const crypto = require("crypto");
const bcrypt = require("bcrypt");

/**
 * Generates a standard bcrypt hash for new passwords.
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Synchronous legacy SHA-256 hash generator matching Python's hashlib.sha256(password.encode()).hexdigest()
 */
function hashSha256(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Checks if the stored hash is a legacy 64-character SHA-256 hexadecimal string.
 */
function isLegacySha256(hash) {
  return typeof hash === "string" && /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Dual verification: seamlessly validates both bcrypt and legacy SHA-256 hashes.
 */
async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }

  // 1. Check if stored hash is legacy SHA-256
  if (isLegacySha256(storedHash)) {
    const sha = hashSha256(password);
    return crypto.timingSafeEqual(Buffer.from(sha), Buffer.from(storedHash));
  }

  // 2. Standard bcrypt hash check ($2a$, $2b$, $2y$)
  try {
    return await bcrypt.compare(password, storedHash);
  } catch (err) {
    // If bcrypt throws invalid hash format, test SHA-256 fallback
    return hashSha256(password) === storedHash;
  }
}

module.exports = {
  hashPassword,
  hashSha256,
  isLegacySha256,
  verifyPassword,
};

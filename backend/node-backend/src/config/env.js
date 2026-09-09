/**
 * env.js
 * ------
 * Centralized environment configuration loader.
 */

const path = require("path");
const dotenv = require("dotenv");

// Load .env from node-backend root or backend root
dotenv.config({ path: path.join(__dirname, "../../.env") });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(__dirname, "../../../.env") });
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:12345678@localhost:5432/ai_queue",
  JWT_SECRET: process.env.JWT_SECRET || "ai_queue_jwt_super_secret_key_2026_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  HOSPITAL_TIMEZONE: process.env.HOSPITAL_TIMEZONE || "Asia/Kolkata",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:8001",
  ALLOW_LEGACY_EMAIL_AUTH: process.env.ALLOW_LEGACY_EMAIL_AUTH !== "false",
};

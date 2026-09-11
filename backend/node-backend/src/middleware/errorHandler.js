/**
 * errorHandler.js
 * ---------------
 * Centralized Express Error Handling Middleware.
 */

const env = require("../config/env");

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  // Prisma known errors
  if (err.code === "P2002") {
    // Unique constraint violation
    const fields = err.meta?.target ? err.meta.target.join(", ") : "field";
    const msg = `Conflict: A record with this ${fields} already exists.`;
    return res.status(409).json({
      status: "error",
      success: false,
      code: "P2002",
      message: msg,
      detail: msg,
    });
  }

  if (err.code === "P2025") {
    // Record not found
    const msg = "Not Found: The requested record does not exist.";
    return res.status(404).json({
      status: "error",
      success: false,
      code: "P2025",
      message: msg,
      detail: msg,
    });
  }

  // Permission errors
  if (err.name === "PermissionError" || message.toLowerCase().includes("forbidden") || statusCode === 403) {
    return res.status(403).json({
      status: "error",
      success: false,
      code: err.code || "FORBIDDEN",
      message: message,
      detail: message,
    });
  }

  // Value / validation errors
  if (err.name === "ValueError" || statusCode === 400) {
    return res.status(400).json({
      status: "error",
      success: false,
      code: err.code || "VALIDATION_ERROR",
      message: message,
      detail: message,
    });
  }

  // Conflict errors (e.g. Doctor Inactive, Already Serving)
  if (statusCode === 409) {
    return res.status(409).json({
      status: "error",
      success: false,
      code: err.code || "CONFLICT",
      message: message,
      detail: message,
      current_ticket: err.current_ticket || null,
    });
  }

  // Log non-4xx errors in server console
  if (statusCode >= 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  const finalMsg = statusCode >= 500 && env.NODE_ENV === "production" ? "Internal server error." : message;
  res.status(statusCode).json({
    status: "error",
    success: false,
    code: err.code || (statusCode >= 500 ? "INTERNAL_ERROR" : "ERROR"),
    message: finalMsg,
    detail: finalMsg,
  });
}

module.exports = errorHandler;

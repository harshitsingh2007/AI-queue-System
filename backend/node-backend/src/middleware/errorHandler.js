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
    return res.status(409).json({
      status: "error",
      success: false,
      message: `Conflict: A record with this ${fields} already exists.`,
    });
  }

  if (err.code === "P2025") {
    // Record not found
    return res.status(404).json({
      status: "error",
      success: false,
      message: "Not Found: The requested record does not exist.",
    });
  }

  // Permission errors
  if (err.name === "PermissionError" || message.toLowerCase().includes("forbidden")) {
    return res.status(403).json({
      status: "error",
      success: false,
      message: message,
    });
  }

  // Value / validation errors
  if (err.name === "ValueError" || statusCode === 400) {
    return res.status(400).json({
      status: "error",
      success: false,
      message: message,
    });
  }

  // Log non-4xx errors in server console
  if (statusCode >= 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    status: "error",
    success: false,
    message: statusCode >= 500 && env.NODE_ENV === "production" ? "Internal server error." : message,
  });
}

module.exports = errorHandler;

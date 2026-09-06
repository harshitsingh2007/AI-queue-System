/**
 * timezone.js
 * -----------
 * Unified Timezone & Queue-Date normalization utilities for Hospital Queue System.
 * Timezone target: Asia/Kolkata (+05:30)
 */

const env = require("../config/env");

const TIMEZONE = env.HOSPITAL_TIMEZONE || "Asia/Kolkata";

/**
 * Returns today's queue date as "YYYY-MM-DD" string in the configured hospital timezone.
 */
function getCurrentQueueDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Normalizes input date/string/null to "YYYY-MM-DD" in hospital timezone.
 */
function parseQueueDate(d) {
  if (!d) {
    return getCurrentQueueDate();
  }
  if (typeof d === "string") {
    const trimmed = d.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return formatter.format(parsed);
    }
  }
  if (d instanceof Date && !isNaN(d.getTime())) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  }
  return getCurrentQueueDate();
}

/**
 * Converts "YYYY-MM-DD" string to a Date object at UTC midnight for Prisma Date fields.
 */
function queueDateToPrismaDate(dateStr) {
  const normalized = parseQueueDate(dateStr);
  return new Date(`${normalized}T00:00:00.000Z`);
}

/**
 * Converts Date / timestamp / string to UNIX epoch float in seconds.
 */
function dtToEpoch(val) {
  if (val === null || val === undefined) {
    return Date.now() / 1000.0;
  }
  if (typeof val === "number") {
    return val > 1e11 ? val / 1000.0 : val;
  }
  if (val instanceof Date) {
    return val.getTime() / 1000.0;
  }
  if (typeof val === "string") {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      return parsed.getTime() / 1000.0;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return num > 1e11 ? num / 1000.0 : num;
    }
  }
  return Date.now() / 1000.0;
}

module.exports = {
  TIMEZONE,
  getCurrentQueueDate,
  parseQueueDate,
  queueDateToPrismaDate,
  dtToEpoch,
};

/**
 * dailyClosureJob.js
 * -------------------
 * Background Job for Automated Daily Queue Closure and Expiration.
 * Periodically executes every 60 seconds using distributed PostgreSQL advisory locks.
 */

const { closeAndExpirePreviousDayQueues } = require("../services/dailyClosureService");

let intervalHandle = null;

function startDailyClosureJob(intervalMs = 60000) {
  if (intervalHandle) return;

  // Immediate first run on boot
  closeAndExpirePreviousDayQueues().catch((err) => {
    console.warn(`[Daily Closure Job] Startup error: ${err.message}`);
  });

  intervalHandle = setInterval(async () => {
    try {
      await closeAndExpirePreviousDayQueues();
    } catch (err) {
      console.warn(`[Daily Closure Job] Interval error: ${err.message}`);
    }
  }, intervalMs);

  console.log(`[Daily Closure Job] Initialized background worker (Interval: ${intervalMs / 1000}s).`);
}

function stopDailyClosureJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  startDailyClosureJob,
  stopDailyClosureJob,
};

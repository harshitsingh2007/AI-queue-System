/**
 * appointmentTiming.js
 * --------------------
 * Client-side Appointment Slot Timing, Check-In Window, and Ticket Expiration utilities.
 * 
 * Rules:
 * 1. Appointment Time: Exact slot time (e.g. 3:30 PM today).
 * 2. Check-In Window: Opens exactly 30 minutes before appointment (e.g. 3:00 PM).
 * 3. Window Duration: Check-in allowed until ticket reaches expiration time (e.g. 4:30 PM).
 * 4. Ticket Expiration: Automatically expires 1 hour after scheduled appointment (e.g. 4:30 PM).
 * 5. Statuses:
 *    - BOOKED: Slot reserved, before check-in opens.
 *    - CHECK_IN_AVAILABLE: Within [appointment - 30m, appointment + 60m].
 *    - CHECKED_IN: User has checked in and ticket is in active queue.
 *    - EXPIRED: Past appointment + 60m without checking in.
 */

export function parseTimeSlot(timeSlot) {
  if (!timeSlot || typeof timeSlot !== "string") {
    return { hour: 9, minute: 0, formatted: "09:00 AM" };
  }
  const match = timeSlot.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([APap][Mm]))?$/);
  if (!match) {
    return { hour: 9, minute: 0, formatted: timeSlot.trim() };
  }
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridian = match[3] ? match[3].toUpperCase() : null;
  if (meridian === "PM" && hour < 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;

  const displayH = hour % 12 === 0 ? 12 : hour % 12;
  const displayM = String(minute).padStart(2, "0");
  const displayMeridian = hour >= 12 ? "PM" : "AM";
  const formatted = `${String(displayH).padStart(2, "0")}:${displayM} ${displayMeridian}`;

  return { hour, minute, formatted };
}

/**
 * Format a Date object to "h:mm A" string
 */
export function formatTime12(date) {
  if (!date || isNaN(new Date(date).getTime())) return "";
  const d = new Date(date);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const meridian = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${m} ${meridian}`;
}

/**
 * Calculates all window, expiration, and status details for an appointment.
 */
export function getAppointmentTiming(apt, now = new Date()) {
  if (!apt) return null;

  const rawDateStr = String(apt.appointment_date || "").slice(0, 10);
  const timeSlot = apt.time_slot || "";
  const currentMs = now instanceof Date ? now.getTime() : new Date(now).getTime();

  let aptTime = null;
  if (apt.appointment_time) {
    aptTime = new Date(apt.appointment_time);
  }

  if (!aptTime || isNaN(aptTime.getTime())) {
    const { hour, minute } = parseTimeSlot(timeSlot);
    if (rawDateStr) {
      const [year, month, day] = rawDateStr.split("-").map(Number);
      aptTime = new Date(year, month - 1, day, hour, minute, 0);
    } else {
      aptTime = new Date();
      aptTime.setHours(hour, minute, 0, 0);
    }
  }

  const aptTimestamp = aptTime.getTime();

  // Check-in opens 30 minutes before appointment
  const checkInOpensTimestamp = apt.check_in_opens_at
    ? new Date(apt.check_in_opens_at).getTime()
    : aptTimestamp - 30 * 60 * 1000;
  const checkInOpensAt = new Date(checkInOpensTimestamp);

  // Ticket expires 1 hour after appointment
  const expiresTimestamp = apt.expires_at
    ? new Date(apt.expires_at).getTime()
    : aptTimestamp + 60 * 60 * 1000;
  const expiresAt = new Date(expiresTimestamp);

  const rawStatus = String(apt.status || "").toLowerCase();
  let status = "BOOKED";

  if (["completed", "cancelled", "no_show"].includes(rawStatus)) {
    status = rawStatus.toUpperCase();
  } else if (rawStatus === "checked_in" || Boolean(apt.ticket_id)) {
    status = "CHECKED_IN";
  } else if (rawStatus === "expired" || currentMs > expiresTimestamp) {
    status = "EXPIRED";
  } else if (currentMs >= checkInOpensTimestamp && currentMs <= expiresTimestamp) {
    status = "CHECK_IN_AVAILABLE";
  } else {
    status = "BOOKED";
  }

  const canCheckIn = status === "CHECK_IN_AVAILABLE";
  const isExpired = status === "EXPIRED";
  const isBooked = status === "BOOKED";
  const isCheckedIn = status === "CHECKED_IN";

  const diffOpens = checkInOpensTimestamp - currentMs;
  const diffExpires = expiresTimestamp - currentMs;

  const minutesUntilCheckIn = Math.max(0, Math.ceil(diffOpens / 60000));
  const minutesUntilExpiration = Math.max(0, Math.ceil(diffExpires / 60000));

  let timeUntilCheckInText = "";
  if (minutesUntilCheckIn > 60) {
    const hrs = Math.floor(minutesUntilCheckIn / 60);
    const mins = minutesUntilCheckIn % 60;
    timeUntilCheckInText = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  } else if (minutesUntilCheckIn > 0) {
    timeUntilCheckInText = `${minutesUntilCheckIn}m`;
  }

  let timeUntilExpirationText = "";
  if (minutesUntilExpiration > 60) {
    const hrs = Math.floor(minutesUntilExpiration / 60);
    const mins = minutesUntilExpiration % 60;
    timeUntilExpirationText = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  } else if (minutesUntilExpiration > 0) {
    timeUntilExpirationText = `${minutesUntilExpiration}m`;
  }

  const formattedAppointmentTime = apt.formatted_appointment_time || formatTime12(aptTime) || timeSlot;
  const formattedCheckInOpensAt = apt.formatted_check_in_opens_at || formatTime12(checkInOpensAt);
  const formattedExpiresAt = apt.formatted_expires_at || formatTime12(expiresAt);

  return {
    appointmentTime: aptTime,
    checkInOpensAt,
    expiresAt,
    formattedAppointmentTime,
    formattedCheckInOpensAt,
    formattedExpiresAt,
    status,
    canCheckIn,
    isExpired,
    isBooked,
    isCheckedIn,
    minutesUntilCheckIn,
    minutesUntilExpiration,
    timeUntilCheckInText,
    timeUntilExpirationText,
  };
}

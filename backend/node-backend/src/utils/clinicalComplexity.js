/**
 * clinicalComplexity.js
 * ---------------------
 * Patient-specific clinical complexity multiplier calculation.
 */

const PRIORITY_EMERGENCY = 1;
const PRIORITY_ROUTINE = 2;
const PRIORITY_STANDARD = 1;
const MAX_PATIENT_QUEUE_ADJUSTMENT = 3;

function computeClinicalComplexity(age, gender, medicalCondition, preExistingCondition, priorityLevel) {
  let score = 1.0;
  const numAge = parseInt(age, 10) || 30;

  // 1. Age Factor
  if (numAge > 65) {
    score *= 1.35;
  } else if (numAge < 10) {
    score *= 1.25;
  } else if (numAge > 50) {
    score *= 1.15;
  }

  // 2. Symptom / Condition Factor
  const cond = (medicalCondition || "").trim().toLowerCase();
  if (cond === "cardiac_chest_pain" || cond === "trauma_injury") {
    score *= 1.65;
  } else if (cond === "high_fever_infection" || cond === "respiratory_distress") {
    score *= 1.40;
  } else if (cond === "lab_blood_test" || cond === "routine_followup") {
    score *= 0.75;
  }

  // 3. Pre-existing Conditions
  const risk = (preExistingCondition || "").trim().toLowerCase();
  if (risk === "cardiac_history" || risk === "diabetes_hypertension") {
    score *= 1.30;
  } else if (risk === "asthma_copd" || risk === "kidney_disease") {
    score *= 1.20;
  }

  // 4. Emergency Priority
  if (priorityLevel === PRIORITY_EMERGENCY) {
    score *= 1.50;
  }

  return Math.max(0.5, Math.min(3.0, Math.round(score * 100) / 100));
}

module.exports = {
  PRIORITY_EMERGENCY,
  PRIORITY_ROUTINE,
  PRIORITY_STANDARD,
  MAX_PATIENT_QUEUE_ADJUSTMENT,
  computeClinicalComplexity,
};

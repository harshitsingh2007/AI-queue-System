/**
 * QueueStepper.jsx
 * ----------------
 * 4-Step Horizontal Queue Progress Stepper:
 * 1. Checked In -> 2. In Line (#Pos) -> 3. Consultation Ready -> 4. Visit Complete
 * Provides patients with real-time visual clarity on their hospital journey.
 * Theme: Soft Green Clinical (Clean Healthcare SaaS)
 */

import React from "react";
import { t } from "../../utils/i18n";

export default function QueueStepper({ ticket, language = "en" }) {
  if (!ticket) return null;

  const status = (ticket.status || "").toLowerCase();
  const position = Number(ticket.position) || 1;

  // Determine current active step (1 to 4)
  let currentStep = 1;
  if (status === "completed") {
    currentStep = 4;
  } else if (status === "serving") {
    currentStep = 3;
  } else if (status === "waiting" || status === "checked_in") {
    currentStep = 2;
  } else {
    currentStep = 1;
  }

  // Calculate dynamic progress bar fill percentage:
  // Step 1: 0%, Step 2: 33.3%, Step 3: 66.6%, Step 4: 100%
  const progressPercent = ((currentStep - 1) / 3) * 100;

  // Dynamic step descriptors
  const steps = [
    {
      id: 1,
      title: t("stepCheckedIn", language),
      subtext: t("stepTokenIssued", language),
    },
    {
      id: 2,
      title: currentStep === 2 ? `${t("stepInLine", language)} (#${position})` : t("stepInLine", language),
      subtext:
        currentStep === 2
          ? position === 1
            ? t("stepNextInLine", language)
            : `${position - 1} ${t("stepAhead", language)}`
          : currentStep > 2
          ? "✓"
          : "—",
    },
    {
      id: 3,
      title: t("stepConsultation", language),
      subtext:
        currentStep === 3
          ? t("stepProceedToDesk", language)
          : currentStep > 3
          ? "✓"
          : `${ticket.estimated_wait_minutes || 5} ${t("unit_min", language)} ${t("stepEstimatedWait", language)}`,
    },
    {
      id: 4,
      title: t("stepCompleted", language),
      subtext: currentStep === 4 ? t("stepFinished", language) : "—",
    },
  ];

  return (
    <div style={stepperContainerStyle} className="queue-stepper-container">
      <style>{`
        .queue-stepper-container {
          background: var(--patient-sub-card, #F8FAFC);
          border-radius: 14px;
          border: 1px solid var(--patient-card-border, #E2E8F0);
          padding: 16px 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
          width: 100%;
        }

        .stepper-header-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .step-node-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 25%;
          text-align: center;
          padding: 0 4px;
          box-sizing: border-box;
          min-width: 0;
        }

        .step-title-text {
          font-size: 12px;
          margin-bottom: 2px;
          line-height: 1.2;
          word-break: break-word;
          max-width: 100%;
        }

        .step-subtext-span {
          font-size: 11px;
          word-break: break-word;
          max-width: 100%;
        }

        @media (max-width: 600px) {
          .queue-stepper-container {
            padding: 12px 10px;
            margin-bottom: 16px;
          }
          .step-node-item {
            padding: 0 2px;
          }
          .step-circle-badge {
            width: 26px !important;
            height: 26px !important;
            margin-bottom: 4px !important;
          }
          .step-title-text {
            font-size: 10.5px !important;
          }
          .step-subtext-span {
            font-size: 9.5px !important;
          }
        }

        @media (max-width: 420px) {
          .step-subtext-span {
            display: none !important;
          }
          .step-title-text {
            font-size: 9.5px !important;
          }
        }
      `}</style>

      {/* Stepper Header Bar */}
      <div className="stepper-header-box">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={journeyDotStyle} />
          <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--patient-tag-color, #0369A1)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            {t("stepQueueTracker", language)}
          </span>
        </div>
        <span style={stepBadgeStyle}>
          {t("stepOf", language)} {currentStep}/4:{" "}
          <strong style={{ color: "#0284C7" }}>{steps[currentStep - 1].title}</strong>
        </span>
      </div>

      {/* Progress Track & Nodes */}
      <div style={{ position: "relative", margin: "14px 4px 8px 4px" }}>
        {/* Background track line */}
        <div style={trackBgStyle} />

        {/* Dynamic filled track line */}
        <div
          style={{
            ...trackFillStyle,
            width: `${(progressPercent / 100) * 75}%`,
          }}
        />

        {/* 4 Step Nodes */}
        <div style={nodesRowStyle}>
          {steps.map((step) => {
            const isCompleted = step.id < currentStep || currentStep === 4;
            const isCurrent = step.id === currentStep && currentStep < 4;

            return (
              <div key={step.id} className="step-node-item">
                {/* Circle Badge */}
                <div className="step-circle-badge" style={getCircleStyle(isCompleted, isCurrent)}>
                  {isCompleted ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isCurrent ? (
                    <span style={pulseInnerDotStyle} />
                  ) : (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8" }}>{step.id}</span>
                  )}
                </div>

                {/* Step Title */}
                <span className="step-title-text" style={getStepTitleStyle(isCompleted, isCurrent)}>
                  {step.title}
                </span>

                {/* Dynamic Subtext */}
                <span className="step-subtext-span" style={getStepSubtextStyle(isCurrent)}>
                  {step.subtext}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Styling definitions
const stepperContainerStyle = {
  background: "#F8FAFC",
  borderRadius: "14px",
  border: "1px solid #E2E8F0",
  padding: "16px 20px",
  marginBottom: "20px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
};

const stepperHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
};

const journeyDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#0284C7",
  boxShadow: "0 0 6px rgba(2, 132, 199, 0.6)",
};

const stepBadgeStyle = {
  fontSize: "11px",
  color: "#64748B",
  background: "#FFFFFF",
  padding: "3px 10px",
  borderRadius: "12px",
  border: "1px solid #E2E8F0",
};

const trackBgStyle = {
  position: "absolute",
  top: "16px",
  left: "12.5%",
  right: "12.5%",
  height: "3px",
  background: "#E2E8F0",
  borderRadius: "2px",
  zIndex: 1,
};

const trackFillStyle = {
  position: "absolute",
  top: "16px",
  left: "12.5%",
  height: "3px",
  background: "linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)",
  borderRadius: "2px",
  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  zIndex: 2,
};

const nodesRowStyle = {
  position: "relative",
  zIndex: 3,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const stepNodeStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "25%",
  textAlign: "center",
  padding: "0 4px",
  boxSizing: "border-box",
  minWidth: 0,
};

const getCircleStyle = (isCompleted, isCurrent) => ({
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "8px",
  background: isCompleted ? "#0284C7" : isCurrent ? "#F0F9FF" : "#FFFFFF",
  border: isCompleted
    ? "2px solid #0284C7"
    : isCurrent
    ? "2px solid #0EA5E9"
    : "2px solid #CBD5E1",
  boxShadow: isCurrent ? "0 0 0 4px rgba(2, 132, 199, 0.16)" : "none",
  transition: "all 0.3s ease",
});

const pulseInnerDotStyle = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#0284C7",
};

const getStepTitleStyle = (isCompleted, isCurrent) => ({
  fontSize: "12px",
  fontWeight: isCurrent || isCompleted ? 800 : 600,
  color: isCurrent ? "#0369A1" : isCompleted ? "#0F172A" : "#64748B",
  marginBottom: "2px",
  lineHeight: 1.2,
  wordBreak: "break-word",
  maxWidth: "100%",
});

const getStepSubtextStyle = (isCurrent) => ({
  fontSize: "11px",
  fontWeight: isCurrent ? 700 : 500,
  color: isCurrent ? "#0284C7" : "#94A3B8",
  wordBreak: "break-word",
  maxWidth: "100%",
});

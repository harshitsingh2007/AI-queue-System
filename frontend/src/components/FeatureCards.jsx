import React from "react";
import { Activity, BellRing, Scale, ShieldCheck } from "lucide-react";
import { t } from "../utils/i18n";

export default function FeatureCards({ language = "en" }) {
  const cards = [
    {
      id: 1,
      title: t("feature1Title", language),
      description: t("feature1Desc", language),
      icon: Activity,
      bg: "#F0FDF4",
      border: "#BBF7D0",
      iconBg: "#DCFCE7",
      iconColor: "#059669",
    },
    {
      id: 2,
      title: t("feature2Title", language),
      description: t("feature2Desc", language),
      icon: BellRing,
      bg: "#F0FDFA",
      border: "#99F6E4",
      iconBg: "#CCFBF1",
      iconColor: "#0D9488",
    },
    {
      id: 3,
      title: t("feature3Title", language),
      description: t("feature3Desc", language),
      icon: Scale,
      bg: "#F7FBF8",
      border: "#C6E7D2",
      iconBg: "#D1FAE5",
      iconColor: "#047857",
    },
    {
      id: 4,
      title: t("feature4Title", language),
      description: t("feature4Desc", language),
      icon: ShieldCheck,
      bg: "#F4F9F6",
      border: "#CBD5E1",
      iconBg: "#E6F4EA",
      iconColor: "#046A38",
    },
  ];

  return (
    <section aria-label="Feature Highlights" style={{ marginTop: "28px" }}>
      <style>{`
        .feature-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .feature-card-item {
          padding: 22px 20px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
          box-sizing: border-box;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        .feature-card-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px -5px rgba(4, 78, 59, 0.08), 0 8px 10px -6px rgba(4, 78, 59, 0.04);
        }

        .feature-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .feature-card-item:hover .feature-icon-box {
          transform: scale(1.05);
        }

        .feature-card-title {
          font-size: 15px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 6px 0;
          letter-spacing: -0.2px;
          line-height: 1.25;
        }

        .feature-card-desc {
          font-size: 12.5px;
          font-weight: 500;
          color: #64748B;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 900px) {
          .feature-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
        }

        @media (max-width: 520px) {
          .feature-cards-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .feature-card-item {
            padding: 18px 16px;
          }
        }
      `}</style>

      <div className="feature-cards-grid">
        {cards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              className="feature-card-item"
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
              }}
            >
              <div
                className="feature-icon-box"
                style={{
                  background: card.iconBg,
                  color: card.iconColor,
                }}
              >
                <IconComponent size={22} strokeWidth={2.2} />
              </div>
              <h3 className="feature-card-title">{card.title}</h3>
              <p className="feature-card-desc">{card.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * MLAdminPage.jsx
 * ---------------
 * 📊 Hospital ML Studio & Training (Admin view).
 * Theme: Soft Green Clinical (Clean Healthcare Palette 4)
 */

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config/hospitalConfig";

export default function MLAdminPage({ tenantId }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [statusMsg, setStatusMsg] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const fetchModelStatus = useCallback(() => {
    fetch(`${API_BASE}/api/v1/plugin/model-status/${tenantId}`)
      .then((r) => r.json())
      .then((d) => setModelStatus(d))
      .catch((e) => console.log("Model status error:", e));
  }, [tenantId]);

  useEffect(() => {
    fetchModelStatus();
  }, [fetchModelStatus]);

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);

    const formData = new FormData();
    formData.append("file", selected);
    formData.append("tenant_id", tenantId);

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/historical-data/preview`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setMapping(data.suggested_mapping || {});
      } else {
        const err = await res.json();
        alert(`File error: ${err.detail}`);
      }
    } catch (e) {
      console.log("Preview error:", e);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setIsUploading(true);
    setStatusMsg("Parsing and storing records into database...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tenant_id", tenantId);
    formData.append("mapping_json", JSON.stringify(mapping));

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/historical-data/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setIsUploading(false);
      if (res.ok) {
        setStatusMsg(`✓ ${data.message}`);
        fetchModelStatus();
      } else {
        setStatusMsg(`❌ ${data.message || data.detail}`);
      }
    } catch (e) {
      setIsUploading(false);
      setStatusMsg(`❌ Import failed: ${e.message}`);
    }
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    setStatusMsg("Evaluating multi-model ensemble (ExtraTrees, RandomForest, HistGradientBoosting)...");

    try {
      const res = await fetch(`${API_BASE}/api/v1/plugin/historical-data/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const data = await res.json();
      setIsTraining(false);
      if (data.success === false) {
        setStatusMsg(`⚠️ ${data.message}`);
      } else {
        setStatusMsg(`🎉 Trained! Winner: ${data.model_type} (MAE: ${data.mae} min | R²: ${data.r2})`);
        fetchModelStatus();
      }
    } catch (e) {
      setIsTraining(false);
      setStatusMsg(`❌ Training failed: ${e.message}`);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      <div style={standaloneCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "20px", color: "#064E3B", fontWeight: 800 }}>
              📊 Hospital Historical Dataset Ingestion
            </h3>
            <span style={{ fontSize: "12px", color: "#047857", fontWeight: 600 }}>Automatic Standardization Layer</span>
          </div>
        </div>

        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileSelect}
          style={fileDropStyle}
        />

        {previewData && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", color: "#64748B", display: "block", marginBottom: "6px" }}>
                Auto-Detected Column Standardization Badges:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {previewData.detected_columns.map((col) => (
                  <span key={col} style={colBadgeStyle}>
                    ✓ {col}
                  </span>
                ))}
              </div>
            </div>

            <div style={valSummaryStyle}>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#0F172A" }}>Validation Breakdown</h4>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
                <span style={{ color: "#047857", fontWeight: 700 }}>✓ {previewData.validation_summary.valid_rows} Valid Rows</span>
                <span style={{ color: "#DC2626", fontWeight: 700 }}>❌ {previewData.validation_summary.rejected_rows} Rejected</span>
                <span style={{ color: "#64748B" }}>Total: {previewData.validation_summary.total_rows}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleConfirmImport} disabled={isUploading} style={importBtnStyle}>
                {isUploading ? "Storing..." : "📥 Confirm Import to SQL DB"}
              </button>
              <button onClick={handleTrainModel} disabled={isTraining} style={trainBtnStyle}>
                {isTraining ? "Training..." : "🚀 Train AI Model Now"}
              </button>
            </div>
          </div>
        )}

        {statusMsg && <div style={mlStatusBoxStyle}>{statusMsg}</div>}
      </div>

      <div style={standaloneCardStyle}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#064E3B", fontWeight: 800 }}>
          🤖 Active Hospital AI Model Registry
        </h3>

        {!modelStatus ? (
          <p style={{ color: "#64748B" }}>Loading AI model status...</p>
        ) : (
          <div style={modelRegBoxStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase" }}>Active Model Scope</span>
                <h3 style={{ margin: 0, fontSize: "22px", color: modelStatus.is_tenant_specific ? "#047857" : "#0284C7", fontWeight: 800 }}>
                  {modelStatus.active_model}
                </h3>
              </div>
              <span style={modelScopeTagStyle(modelStatus.is_tenant_specific)}>
                {modelStatus.is_tenant_specific ? "HOSPITAL CUSTOM MODEL" : "GLOBAL BASELINE"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div style={modelMetricBoxStyle}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>Winning Algorithm</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>{modelStatus.model_type || "ExtraTrees"}</p>
              </div>
              <div style={modelMetricBoxStyle}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>Mean Absolute Error</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#047857", fontSize: "14px" }}>{modelStatus.mae} minutes</p>
              </div>
              <div style={modelMetricBoxStyle}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>R² Accuracy Score</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#0284C7", fontSize: "14px" }}>{modelStatus.r2}</p>
              </div>
              <div style={modelMetricBoxStyle}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>Historical Training Rows</span>
                <p style={{ margin: 0, fontWeight: 700, color: "#D97706", fontSize: "14px" }}>{modelStatus.training_rows} rows</p>
              </div>
            </div>

            {modelStatus.top_features && (
              <div>
                <span style={{ fontSize: "12px", color: "#64748B", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Top Model Feature Importance Weights:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {Object.entries(modelStatus.top_features).slice(0, 5).map(([feat, val]) => (
                    <div key={feat} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#334155" }}>
                      <span>{feat}</span>
                      <span style={{ fontWeight: 700, color: "#047857" }}>{(val * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Soft Green Clinical Theme Styles
const standaloneCardStyle = {
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid #D8E8DD",
  padding: "24px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
};

const fileDropStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px dashed #A7F3D0",
  background: "#ECFDF5",
  color: "#047857",
  fontSize: "13px",
  cursor: "pointer",
  marginBottom: "16px",
};

const colBadgeStyle = {
  padding: "4px 8px",
  borderRadius: "6px",
  background: "#ECFDF5",
  color: "#047857",
  border: "1px solid #A7F3D0",
  fontSize: "11px",
  fontWeight: 600,
};

const valSummaryStyle = {
  padding: "14px",
  borderRadius: "10px",
  background: "#F8FAFC",
  border: "1px solid #CBD5E1",
  marginBottom: "16px",
};

const importBtnStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
};

const trainBtnStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
};

const mlStatusBoxStyle = {
  marginTop: "16px",
  padding: "12px",
  borderRadius: "8px",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  fontSize: "12px",
  color: "#047857",
  fontWeight: 600,
};

const modelRegBoxStyle = {
  padding: "18px",
  borderRadius: "12px",
  background: "#F8FAFC",
  border: "1px solid #CBD5E1",
};

const modelScopeTagStyle = (tenantSpecific) => ({
  padding: "4px 10px",
  borderRadius: "12px",
  background: tenantSpecific ? "#ECFDF5" : "#E0F2FE",
  color: tenantSpecific ? "#047857" : "#0284C7",
  border: tenantSpecific ? "1px solid #A7F3D0" : "1px solid #BAE6FD",
  fontSize: "11px",
  fontWeight: 700,
});

const modelMetricBoxStyle = { padding: "10px", background: "#FFFFFF", borderRadius: "8px", border: "1px solid #CBD5E1" };

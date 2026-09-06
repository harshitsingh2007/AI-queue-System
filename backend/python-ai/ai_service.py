"""
ai_service.py
-------------
Dedicated Python AI/ML Microservice for AI Queue System.
Runs on Port 8001.

Responsibilities:
- Tabular Feature Engineering & Duration Predictions
- Scikit-Learn Ensemble Regressors (Random Forest, HistGradientBoosting, ExtraTrees)
- Tenant-Specific & Global Model Training
- Historical Dataset Validation, Mapping & Quality Control
"""

import os
import sys
import io
import json
from typing import Optional, Dict, Any, List
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure root backend directory is accessible for ML pipelines
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from schema_validator import detect_column_mappings, validate_and_transform_dataframe
from train_model import (
    train_model_for_tenant,
    get_tenant_model_info,
    engineer_features,
    MODELS_DIR,
    MIN_TRAINING_ROWS,
    CATEGORY_CONFIG
)

app = FastAPI(title="AI Queue ML Microservice", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory model cache
_models_cache: Dict[str, dict] = {}

def load_model_bundle(tenant_id: str) -> dict:
    tid = (tenant_id or "global").strip()
    if tid in _models_cache:
        return _models_cache[tid]

    model_path = os.path.join(MODELS_DIR, tid, "queue_predictor.pkl")
    meta_path = os.path.join(MODELS_DIR, tid, "metadata.json")

    if not os.path.exists(model_path):
        model_path = os.path.join(MODELS_DIR, "global", "queue_predictor.pkl")
        meta_path = os.path.join(MODELS_DIR, "global", "metadata.json")

    bundle = None
    if os.path.exists(model_path):
        try:
            bundle = joblib.load(model_path)
        except Exception as e:
            print(f"[ML Service] Error loading model bundle from {model_path}: {e}")

    meta = {}
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
        except Exception:
            meta = {}

    result = {"bundle": bundle, "metadata": meta}
    _models_cache[tid] = result
    return result

class PredictRequest(BaseModel):
    tenant_id: Optional[str] = "global"
    consumer_type: Optional[str] = "hospital"
    service_category: str = "consultation"
    queue_length: int = Field(default=1, ge=0)
    active_staff_counters: int = Field(default=2, ge=1)
    complexity_score: float = Field(default=1.0, ge=0.5, le=3.0)
    hour_of_day: Optional[int] = Field(default=12, ge=0, le=23)
    day_of_week: Optional[int] = Field(default=1, ge=0, le=6)

class TrainRequest(BaseModel):
    tenant_id: str = "global"
    records: Optional[List[Dict[str, Any]]] = None
    data_source: Optional[str] = "historical_upload"

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ai-queue-python-ml",
        "port": 8001,
        "models_cached": list(_models_cache.keys())
    }

@app.post("/predict")
async def predict_duration(req: PredictRequest):
    tenant_id = req.tenant_id or "global"
    bundle_info = load_model_bundle(tenant_id)
    bundle = bundle_info.get("bundle")

    if bundle and isinstance(bundle, dict) and "model" in bundle:
        try:
            model = bundle["model"]
            feature_names = bundle.get("feature_names", bundle.get("feature_columns", []))

            hour = req.hour_of_day if req.hour_of_day is not None else 12
            day = req.day_of_week if req.day_of_week is not None else 1
            queue_len = req.queue_length
            active_counters = max(1, req.active_staff_counters)
            complexity = req.complexity_score
            cat = req.service_category

            row = {
                "queue_length": queue_len,
                "active_staff_counters": active_counters,
                "complexity_score": complexity,
                "hour_of_day": hour,
                "day_of_week": day,
                "is_peak_hour": 1 if hour in (9, 10, 11, 14, 15, 16) and day < 5 else 0,
                "sin_hour": np.sin(2 * np.pi * hour / 24.0),
                "cos_hour": np.cos(2 * np.pi * hour / 24.0),
                "sin_day": np.sin(2 * np.pi * day / 7.0),
                "cos_day": np.cos(2 * np.pi * day / 7.0),
                "staff_load_ratio": queue_len / active_counters,
                "effective_workload": (queue_len * complexity) / active_counters,
                "counter_capacity_index": active_counters / (queue_len + 1.0),
            }

            # One-hot encode category if required
            for col in feature_names:
                if col.startswith("service_category_"):
                    target_cat = col.replace("service_category_", "")
                    row[col] = 1 if cat == target_cat else 0
                elif col.startswith("cat_"):
                    target_cat = col.replace("cat_", "")
                    row[col] = 1 if cat == target_cat else 0
                elif col.startswith("consumer_type_"):
                    target_consumer = col.replace("consumer_type_", "")
                    row[col] = 1 if req.consumer_type == target_consumer else 0

            df_feat = pd.DataFrame([row])
            for col in feature_names:
                if col not in df_feat.columns:
                    df_feat[col] = 0

            df_feat = df_feat[feature_names]
            pred = float(model.predict(df_feat)[0])
            pred_clamped = max(3.0, min(90.0, round(pred, 1)))

            return {
                "status": "success",
                "predicted_service_minutes": pred_clamped,
                "model_used": bundle.get("model_name", "Trained ML Regressor"),
                "source": "ml_model"
            }
        except Exception as e:
            print(f"[ML Service] Prediction calculation failed, using heuristic fallback: {e}")

    # Clinical heuristic fallback
    base_durations = {
        "emergency": 25.0,
        "consultation": 15.0,
        "radiology": 20.0,
        "laboratory": 10.0,
        "pharmacy": 6.0,
        "billing": 5.0,
    }
    base = base_durations.get(req.service_category.lower(), 15.0)
    heuristic_pred = max(3.0, min(90.0, round(base * req.complexity_score, 1)))

    return {
        "status": "success",
        "predicted_service_minutes": heuristic_pred,
        "model_used": "Clinical Heuristic Engine",
        "source": "heuristic"
    }

@app.post("/train")
async def train_model_endpoint(req: TrainRequest):
    tenant_id = req.tenant_id or "global"
    df = pd.DataFrame(req.records) if req.records and len(req.records) > 0 else None

    meta = train_model_for_tenant(
        tenant_id=tenant_id,
        custom_df=df,
        min_rows=MIN_TRAINING_ROWS,
        data_source=req.data_source or ("historical_upload" if df is not None else "synthetic")
    )

    # Invalidate cache
    if tenant_id in _models_cache:
        del _models_cache[tenant_id]

    return {
        "status": "success",
        "message": f"Successfully trained model for tenant '{tenant_id}'",
        "metrics": meta,
        **meta
    }

@app.get("/model-status/{tenant_id}")
async def model_status(tenant_id: str):
    return get_tenant_model_info(tenant_id)

@app.post("/preview-historical")
async def preview_historical_data(
    tenant_id: str = Form(...),
    file: UploadFile = File(...)
):
    filename = file.filename.lower()
    contents = await file.read()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

    detected_columns = list(df.columns)
    suggested_mapping, unmapped, missing_required = detect_column_mappings(detected_columns)
    val_result = validate_and_transform_dataframe(df, suggested_mapping, default_tenant_id=tenant_id)

    sample_df = df.head(5).fillna("")
    sample_rows = sample_df.to_dict(orient="records")

    return {
        "tenant_id": tenant_id,
        "detected_columns": detected_columns,
        "suggested_mapping": suggested_mapping,
        "unmapped_columns": unmapped,
        "missing_required": missing_required,
        "validation_summary": {
            "total_rows": val_result["total_rows"],
            "valid_rows": val_result["valid_rows"],
            "rejected_rows": val_result["rejected_rows"],
            "warnings": val_result["warnings"],
            "errors": val_result["errors"],
        },
        "sample_rows": sample_rows
    }

@app.post("/validate-historical")
async def validate_historical_data(
    tenant_id: str = Form(...),
    mapping_json: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    filename = file.filename.lower()
    contents = await file.read()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

    mapping = {}
    if mapping_json:
        try:
            mapping = json.loads(mapping_json)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid mapping JSON: {str(e)}")
    else:
        mapping, _, _ = detect_column_mappings(list(df.columns))

    val_result = validate_and_transform_dataframe(df, mapping, default_tenant_id=tenant_id)
    clean_df = val_result["clean_df"]

    if clean_df is None or len(clean_df) == 0:
        return {
            "success": False,
            "tenant_id": tenant_id,
            "message": "Data validation failed. No valid historical records could be parsed.",
            "errors": val_result["errors"],
            "warnings": val_result["warnings"],
            "records": []
        }

    records = clean_df.to_dict(orient="records")
    return {
        "success": True,
        "tenant_id": tenant_id,
        "valid_rows": val_result["valid_rows"],
        "rejected_rows": val_result["rejected_rows"],
        "warnings": val_result["warnings"],
        "records": records
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

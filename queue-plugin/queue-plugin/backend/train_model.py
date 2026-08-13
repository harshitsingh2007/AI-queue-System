"""
train_model.py
----------------
Advanced Machine Learning Training Pipeline for AI-Powered Smart Queue Management System.

Features & Enhancements:
- Rich Synthetic Dataset Generator mimicking realistic operational dynamics across
  multiple domains (Hospitals, Banks, Clinics, Government Offices).
- Multi-Model Evaluation: Random Forest, Gradient Boosting, Extra Trees.
- Evaluation Metrics: MAE (Mean Absolute Error), RMSE (Root Mean Squared Error), R² Score.
- Feature Importance Analysis.
- Model Bundle Export (`queue_predictor.pkl`): contains best model, feature column layout,
  evaluation metrics, category configurations, and training metadata.
- Continuous Online/Incremental Retraining: `retrain_model_from_logs()` combines real logged
  ticket durations with baseline synthetic patterns to refine predictions dynamically.
"""

import os
import random
import time
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, ExtraTreesRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

CATEGORY_CONFIG = {
    "hospital": {
        "emergency": 25,
        "consultation": 15,
        "pharmacy": 6,
        "radiology": 20,
        "lab_test": 10,
    },
    "bank": {
        "cash": 4,
        "loan": 22,
        "account_opening": 18,
        "vip_desk": 12,
    },
    "clinic": {
        "general_checkup": 12,
        "dentist": 30,
        "pediatrics": 18,
    },
    "government": {
        "document_verification": 15,
        "license_renewal": 25,
        "inquiry": 5,
    },
}

def generate_synthetic_dataset(n_rows: int = 15000) -> pd.DataFrame:
    """Builds a rich, realistic dataset representing queue service logs.
    Features:
    - hour_of_day: 0-23
    - day_of_week: 0-6 (0=Monday, 6=Sunday)
    - queue_length: people waiting ahead
    - active_staff_counters: active service points
    - is_peak_hour: rush period flag (9-12 AM, 2-5 PM)
    - complexity_score: inherent service complexity factor
    - historical_avg_speed: operational efficiency variance factor
    - consumer_type: hospital | bank | clinic | government
    - service_category: domain-specific service line
    """
    rows = []
    consumer_types = list(CATEGORY_CONFIG.keys())

    for _ in range(n_rows):
        consumer_type = random.choice(consumer_types)
        service_category = random.choice(list(CATEGORY_CONFIG[consumer_type].keys()))
        base_minutes = CATEGORY_CONFIG[consumer_type][service_category]

        hour_of_day = random.randint(7, 19)  # standard operational hours
        day_of_week = random.randint(0, 6)
        queue_length = random.randint(0, 35)
        active_staff_counters = random.randint(1, 8)

        is_peak = 1 if hour_of_day in (9, 10, 11, 14, 15, 16) and day_of_week < 5 else 0
        peak_bonus = 3.5 if is_peak else 0.0
        weekend_factor = 1.2 if day_of_week >= 5 else 1.0

        counter_relief = active_staff_counters * 0.45
        rush_effect = queue_length * 0.06

        complexity_score = round(random.uniform(0.8, 1.4), 2)
        historical_avg_speed = round(random.uniform(0.85, 1.15), 2)

        noise = np.random.normal(loc=0, scale=1.8)

        service_duration = (
            (base_minutes * complexity_score * weekend_factor)
            + peak_bonus
            - counter_relief
            - rush_effect
            + (historical_avg_speed * 0.5)
            + noise
        )
        service_duration = max(1.0, service_duration)  # floor at 1 minute

        rows.append({
            "hour_of_day": hour_of_day,
            "day_of_week": day_of_week,
            "queue_length": queue_length,
            "active_staff_counters": active_staff_counters,
            "is_peak_hour": is_peak,
            "complexity_score": complexity_score,
            "historical_avg_speed": historical_avg_speed,
            "consumer_type": consumer_type,
            "service_category": service_category,
            "service_duration_minutes": round(service_duration, 2),
        })

    return pd.DataFrame(rows)

def train_and_save_model(output_path: str = "queue_predictor.pkl", custom_df: pd.DataFrame = None):
    """Trains multiple ML regressors, evaluates metrics (MAE, RMSE, R²),
    selects the top performing model, and exports the bundle.
    """
    df = custom_df if custom_df is not None else generate_synthetic_dataset()

    # One-hot encoding
    df_encoded = pd.get_dummies(df, columns=["consumer_type", "service_category"])

    feature_columns = [c for c in df_encoded.columns if c != "service_duration_minutes"]
    X = df_encoded[feature_columns]
    y = df_encoded["service_duration_minutes"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED
    )

    models = {
        "GradientBoosting": GradientBoostingRegressor(
            n_estimators=150, learning_rate=0.08, max_depth=6, random_state=RANDOM_SEED
        ),
        "RandomForest": RandomForestRegressor(
            n_estimators=150, max_depth=12, random_state=RANDOM_SEED, n_jobs=-1
        ),
        "ExtraTrees": ExtraTreesRegressor(
            n_estimators=150, max_depth=12, random_state=RANDOM_SEED, n_jobs=-1
        ),
    }

    best_name = None
    best_model = None
    best_mae = float("inf")
    metrics_summary = {}

    print("\n================ ML MODEL EVALUATION ================")
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)

        metrics_summary[name] = {"MAE": round(mae, 3), "RMSE": round(rmse, 3), "R2": round(r2, 4)}
        print(f"[{name}] MAE: {mae:.2f} min | RMSE: {rmse:.2f} min | R² Score: {r2:.4f}")

        if mae < best_mae:
            best_mae = mae
            best_name = name
            best_model = model

    print(f"\n=> WINNING MODEL: {best_name} (MAE: {best_mae:.2f} min)")

    # Feature Importance
    importances = best_model.feature_importances_
    feat_imp = sorted(zip(feature_columns, importances), key=lambda x: x[1], reverse=True)
    top_features = dict(feat_imp[:8])
    print("Top Feature Importances:", top_features)

    bundle = {
        "model": best_model,
        "model_name": best_name,
        "feature_columns": feature_columns,
        "category_config": CATEGORY_CONFIG,
        "metrics": metrics_summary,
        "best_mae": round(best_mae, 2),
        "top_features": top_features,
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    joblib.dump(bundle, output_path)
    print(f"Saved trained model bundle -> {output_path}")
    return bundle

def retrain_model_from_logs(logged_data: list, output_path: str = "queue_predictor.pkl"):
    """Incremental/Continuous retraining pipeline.
    Combines real ticket logs with synthetic baseline data to continuously adapt.
    """
    baseline_df = generate_synthetic_dataset(n_rows=5000)

    if logged_data:
        logged_df = pd.DataFrame(logged_data)
        # Ensure necessary default columns exist
        for col in ["hour_of_day", "day_of_week", "queue_length", "active_staff_counters",
                    "is_peak_hour", "complexity_score", "historical_avg_speed",
                    "consumer_type", "service_category", "service_duration_minutes"]:
            if col not in logged_df.columns:
                if col == "is_peak_hour":
                    logged_df["is_peak_hour"] = 0
                elif col == "day_of_week":
                    logged_df["day_of_week"] = int(time.strftime("%w"))
                elif col in ("complexity_score", "historical_avg_speed"):
                    logged_df[col] = 1.0
                else:
                    logged_df[col] = 0

        # Give real operational data 3x weight by oversampling
        combined_df = pd.concat([baseline_df, logged_df, logged_df, logged_df], ignore_index=True)
    else:
        combined_df = baseline_df

    print(f"\n[Retraining Pipeline] Retraining on {len(combined_df)} records ({len(logged_data)} real logs)...")
    return train_and_save_model(output_path=output_path, custom_df=combined_df)

if __name__ == "__main__":
    train_and_save_model()

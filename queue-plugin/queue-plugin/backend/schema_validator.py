"""
schema_validator.py
-------------------
Standard Internal Schema, Column Normalization, Auto-Detection & Data Validation Engine.

Features:
- Canonical Internal Schema enforcement:
  `timestamp`, `queue_length`, `active_staff_counters`, `service_category`, `service_time`, `complexity_score`.
- Normalized Fuzzy Column Alias Auto-Detection (case-insensitive, removes hyphens/spaces/special chars).
- Validation Rules: Rejects negative values, invalid timestamps, missing required fields.
- Feature Derivation: Automatically derives `hour_of_day`, `day_of_week`, `is_peak_hour`, and category `complexity_score`.
- Useful Error/Warning Feedback for administrative API endpoints.
"""

import re
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any

CANONICAL_ALIASES = {
    "queue_length": [
        "queue_length", "patients_waiting", "queue_size", "waiting_customers",
        "people_ahead", "line_length", "line_count", "waiting_patients", "waiting_count",
        "num_waiting", "customer_count", "patient_count", "queue_length_waiting_count"
    ],
    "active_staff_counters": [
        "active_staff_counters", "doctors_available", "employees", "active_counters",
        "counters_open", "staff_count", "counter_num", "open_desks", "num_counters",
        "servers_active", "staff_num", "doctors", "counter_count", "active_counters_staff", "staff"
    ],
    "timestamp": [
        "timestamp", "created_at", "date_time", "time", "checkin_time", "arrival_time",
        "join_time", "check_in_timestamp", "datetime", "date", "entry_time", "timestamp_date_time"
    ],
    "service_time": [
        "service_time", "duration_minutes", "avg_service_time", "service_duration",
        "handling_time", "wait_seconds", "wait_time", "duration_sec", "process_time",
        "handle_time_sec", "service_duration_minutes", "duration", "service_duration_handling_time"
    ],
    "service_category": [
        "service_category", "service_type", "department", "category", "dept",
        "ticket_type", "line_type", "queue_name", "type", "service_category_department"
    ],
    "consumer_type": [
        "consumer_type", "domain", "tenant_type", "institution_type", "facility_type"
    ]
}

REQUIRED_CANONICAL_FIELDS = ["queue_length", "service_time"]

def normalize_col_name(col_name: str) -> str:
    """Normalizes column names by converting to lowercase and stripping special characters."""
    if not isinstance(col_name, str):
        return ""
    # convert slashes, hyphens, and spaces to single underscores
    s = col_name.strip().lower()
    s = re.sub(r'[\s\/\-\\]+', '_', s)
    s = re.sub(r'[^a-z0-9_]', '', s)
    s = re.sub(r'_+', '_', s).strip('_')
    return s

def detect_column_mappings(df_columns: List[str]) -> Tuple[Dict[str, str], List[str], List[str]]:
    """Auto-detects canonical mapping for input DataFrame columns.
    Supports compound headers like 'Queue Length / Waiting Count'.
    Returns: (canonical_to_csv_col_mapping, unmapped_columns, missing_required_fields)
    """
    suggested_mapping: Dict[str, str] = {}
    normalized_input_map = {normalize_col_name(col): col for col in df_columns}

    # Pass 1: Exact match on normalized column names
    for canonical_name, aliases in CANONICAL_ALIASES.items():
        if canonical_name in suggested_mapping:
            continue
        for alias in aliases:
            norm_alias = normalize_col_name(alias)
            if norm_alias in normalized_input_map:
                suggested_mapping[canonical_name] = normalized_input_map[norm_alias]
                break

    # Pass 2: Token / Sub-part matching for slashed/compound headers (e.g. "Timestamp / Date-Time")
    for raw_col in df_columns:
        # Split by slash, hyphen, or 'or'
        parts = re.split(r'[\/\-\\]|\bor\b', raw_col, flags=re.IGNORECASE)
        for part in parts:
            norm_part = normalize_col_name(part)
            if not norm_part:
                continue
            for canonical_name, aliases in CANONICAL_ALIASES.items():
                if canonical_name in suggested_mapping:
                    continue
                for alias in aliases:
                    norm_alias = normalize_col_name(alias)
                    if norm_alias == norm_part or norm_alias in norm_part or norm_part in norm_alias:
                        suggested_mapping[canonical_name] = raw_col
                        break

    mapped_input_cols = set(suggested_mapping.values())
    unmapped_columns = [col for col in df_columns if col not in mapped_input_cols]

    missing_required = []
    for req in REQUIRED_CANONICAL_FIELDS:
        if req not in suggested_mapping:
            missing_required.append(req)

    return suggested_mapping, unmapped_columns, missing_required

def derive_complexity_score(category_str: str) -> float:
    """Derives domain complexity score (0.5 to 5.0) from service category keywords."""
    if not isinstance(category_str, str):
        return 1.0
    cat = category_str.lower()

    if any(k in cat for k in ["emergency", "vip", "surgery", "license_renewal", "loan"]):
        return 4.5
    elif any(k in cat for k in ["consultation", "account_opening", "dentist", "verification"]):
        return 3.0
    elif any(k in cat for k in ["pharmacy", "radiology", "lab", "pediatrics"]):
        return 2.0
    elif any(k in cat for k in ["routine", "cash", "inquiry", "checkup"]):
        return 1.0
    return 1.0

def validate_and_transform_dataframe(
    raw_df: pd.DataFrame,
    canonical_mapping: Dict[str, str],
    default_tenant_id: str = "custom_domain"
) -> Dict[str, Any]:
    """Validates, cleans, transforms, and derives features for training.
    canonical_mapping format: { "canonical_field_name": "csv_column_name" }
    """
    warnings = []
    errors = []

    # Verify required mappings exist
    for req_field in REQUIRED_CANONICAL_FIELDS:
        if req_field not in canonical_mapping or not canonical_mapping[req_field]:
            aliases_sample = ", ".join(CANONICAL_ALIASES[req_field][:3])
            errors.append(
                f"Missing required field: '{req_field}'. Please map one of: {aliases_sample}"
            )

    if errors:
        return {
            "clean_df": None,
            "total_rows": len(raw_df),
            "valid_rows": 0,
            "rejected_rows": len(raw_df),
            "warnings": warnings,
            "errors": errors,
        }

    # Invert mapping for renaming: CSV Column -> Canonical Column
    rename_dict = {csv_col: canonical for canonical, csv_col in canonical_mapping.items() if csv_col in raw_df.columns}
    df = raw_df.copy().rename(columns=rename_dict)

    total_rows = len(df)
    valid_mask = pd.Series(True, index=df.index)

    # 1. Validate & Transform Timestamp
    if "timestamp" in df.columns:
        parsed_ts = pd.to_datetime(df["timestamp"], errors="coerce")
        invalid_ts_count = parsed_ts.isna().sum()
        if invalid_ts_count > 0:
            warnings.append(f"Found {invalid_ts_count} rows with invalid/unparseable timestamps. Imputed using current date/time.")
            parsed_ts = parsed_ts.fillna(pd.Timestamp.now())
        df["timestamp_clean"] = parsed_ts
        df["hour_of_day"] = df["timestamp_clean"].dt.hour.astype(int)
        df["day_of_week"] = df["timestamp_clean"].dt.dayofweek.astype(int)
    else:
        warnings.append("No 'timestamp' column mapped. Defaulted hour_of_day to 12 PM and day_of_week to Monday.")
        df["hour_of_day"] = 12
        df["day_of_week"] = 1

    # 2. Validate Queue Length
    df["queue_length"] = pd.to_numeric(df["queue_length"], errors="coerce")
    neg_queue = (df["queue_length"] < 0) | (df["queue_length"].isna())
    if neg_queue.sum() > 0:
        warnings.append(f"Rejected {neg_queue.sum()} rows with negative or invalid queue_length.")
        valid_mask &= ~neg_queue

    # 3. Validate Staff Counters
    if "active_staff_counters" in df.columns:
        df["active_staff_counters"] = pd.to_numeric(df["active_staff_counters"], errors="coerce")
        invalid_counters = (df["active_staff_counters"] < 1) | (df["active_staff_counters"].isna())
        if invalid_counters.sum() > 0:
            warnings.append(f"Imputed {invalid_counters.sum()} rows with invalid active_staff_counters to baseline default (2 counters).")
            df["active_staff_counters"] = df["active_staff_counters"].fillna(2).clip(lower=1)
    else:
        warnings.append("No 'active_staff_counters' column mapped. Defaulted to 2 counters.")
        df["active_staff_counters"] = 2

    # 4. Validate & Unit-Convert Service Time
    df["service_time"] = pd.to_numeric(df["service_time"], errors="coerce")
    invalid_time = (df["service_time"] <= 0) | (df["service_time"].isna())
    if invalid_time.sum() > 0:
        warnings.append(f"Rejected {invalid_time.sum()} rows with negative or zero service_time.")
        valid_mask &= ~invalid_time

    # Auto-detect seconds vs minutes
    mean_duration = df.loc[valid_mask, "service_time"].mean() if valid_mask.any() else 0
    if mean_duration > 60:
        warnings.append(f"Detected service_time values in seconds (avg: {mean_duration:.1f}s). Converted to minutes.")
        df["service_time"] = df["service_time"] / 60.0

    df["service_duration_minutes"] = df["service_time"].clip(lower=0.5, upper=300.0)

    # 5. Service Category & Consumer Type
    if "service_category" in df.columns:
        df["service_category"] = df["service_category"].fillna("general").astype(str)
    else:
        df["service_category"] = "general"
        warnings.append("No 'service_category' mapped. Defaulted to 'general'.")

    if "consumer_type" in df.columns:
        df["consumer_type"] = df["consumer_type"].fillna(default_tenant_id).astype(str)
    else:
        df["consumer_type"] = default_tenant_id

    # 6. Feature Derivation
    df["is_peak_hour"] = df["hour_of_day"].apply(lambda h: 1 if h in (9, 10, 11, 14, 15, 16) else 0)
    df["complexity_score"] = df["service_category"].apply(derive_complexity_score)
    df["historical_avg_speed"] = 1.0

    clean_df = df[valid_mask].copy().reset_index(drop=True)
    rejected_rows = total_rows - len(clean_df)

    canonical_final_cols = [
        "hour_of_day", "day_of_week", "queue_length", "active_staff_counters",
        "is_peak_hour", "complexity_score", "historical_avg_speed",
        "consumer_type", "service_category", "service_duration_minutes"
    ]

    return {
        "clean_df": clean_df[canonical_final_cols],
        "total_rows": total_rows,
        "valid_rows": len(clean_df),
        "rejected_rows": rejected_rows,
        "warnings": warnings,
        "errors": [],
    }

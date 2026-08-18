"""
data_importer.py
----------------
Flexible CSV Historical Data Importer for AI Queue System.

Allows consumers/tenants to train the ML model on their own historical log files
even if their CSV file has completely different column names (e.g. `check_in_timestamp`,
`department`, `wait_seconds`, `counter_num`, `line_count`).

Features:
- Custom Column Mapping dictionary support
- Fuzzy Auto-Detection of common dataset column names & aliases
- Automatic Datetime Parsing (extracts `hour_of_day` & `day_of_week` from timestamps)
- Automatic Unit Conversion (converts duration in seconds to minutes if detected)
- Missing Feature Imputation with Domain Baselines
"""

import pandas as pd
import numpy as np
import json
import re

COLUMN_ALIASES = {
    "service_duration_minutes": [
        "service_duration_minutes", "service_duration", "duration", "duration_minutes",
        "service_time", "handling_time", "turnaround_time", "wait_time", "time_taken",
        "duration_sec", "service_time_seconds", "handle_time_sec", "duration_s",
        "wait_seconds", "wait_sec", "service_sec", "process_time"
    ],
    "service_category": [
        "service_category", "category", "dept", "department", "service", "service_type",
        "ticket_type", "line_type", "queue_name"
    ],
    "consumer_type": [
        "consumer_type", "domain", "tenant_type", "institution_type", "facility_type"
    ],
    "queue_length": [
        "queue_length", "people_ahead", "waiting_count", "queue_size", "tickets_ahead",
        "line_length", "customers_in_line", "line_count"
    ],
    "active_staff_counters": [
        "active_staff_counters", "active_counters", "counters_open", "staff_count",
        "counter_count", "open_desks", "num_counters", "servers_active", "counter_num"
    ],
    "timestamp": [
        "timestamp", "created_at", "checkin_time", "join_time", "arrival_time",
        "start_time", "date_time", "datetime", "date", "check_in_timestamp"
    ]
}

def auto_detect_mapping(df_columns: list) -> dict:
    """Fuzzy matches input CSV columns against known feature aliases."""
    mapping = {}
    lower_cols = {col.lower().strip(): col for col in df_columns}

    for standard_name, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in lower_cols:
                mapping[lower_cols[alias]] = standard_name
                break

    return mapping

def import_custom_csv(
    csv_filepath: str,
    custom_mapping: dict = None,
    default_consumer_type: str = "custom_domain"
) -> pd.DataFrame:
    """Loads a custom consumer CSV file, applies column mapping/auto-detection,
    extracts time features, converts units, and formats the DataFrame for training.
    """
    if csv_filepath.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(csv_filepath)
    else:
        df = pd.read_csv(csv_filepath)
    print(f"\n[Data Importer] Loaded '{csv_filepath}' with {len(df)} rows and columns: {list(df.columns)}")

    # 1. Determine Column Mapping
    if custom_mapping:
        mapping = custom_mapping
    else:
        mapping = auto_detect_mapping(df.columns)
        print(f"[Data Importer] Auto-detected column mapping: {mapping}")

    # Rename mapped columns
    df = df.rename(columns=mapping)

    # 2. Extract hour_of_day & day_of_week from Timestamp if present
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        df["hour_of_day"] = df["timestamp"].dt.hour.fillna(12).astype(int)
        df["day_of_week"] = df["timestamp"].dt.dayofweek.fillna(1).astype(int)

    # 3. Detect & Convert Service Duration Units (seconds vs minutes)
    if "service_duration_minutes" in df.columns:
        mean_val = df["service_duration_minutes"].dropna().mean()
        # If mean duration is > 60, it's likely measured in seconds
        if mean_val > 60:
            print(f"[Data Importer] Detected duration in seconds (avg: {mean_val:.1f}s). Converting to minutes...")
            df["service_duration_minutes"] = df["service_duration_minutes"] / 60.0
        df["service_duration_minutes"] = df["service_duration_minutes"].clip(lower=0.5)
    else:
        raise ValueError(
            "Could not identify the service duration (target column). "
            "Please provide a mapping dictionary e.g. {'your_duration_col': 'service_duration_minutes'}"
        )

    # 4. Impute & Fill Missing Standard Features
    if "consumer_type" not in df.columns:
        df["consumer_type"] = default_consumer_type

    if "service_category" not in df.columns:
        df["service_category"] = "general"

    if "hour_of_day" not in df.columns:
        df["hour_of_day"] = 12

    if "day_of_week" not in df.columns:
        df["day_of_week"] = 1

    if "queue_length" not in df.columns:
        df["queue_length"] = 5

    if "active_staff_counters" not in df.columns:
        df["active_staff_counters"] = 2

    df["is_peak_hour"] = df["hour_of_day"].apply(lambda h: 1 if h in (9, 10, 11, 14, 15, 16) else 0)
    df["complexity_score"] = 1.0
    df["historical_avg_speed"] = 1.0

    required_cols = [
        "hour_of_day", "day_of_week", "queue_length", "active_staff_counters",
        "is_peak_hour", "complexity_score", "historical_avg_speed",
        "consumer_type", "service_category", "service_duration_minutes"
    ]

    clean_df = df[required_cols].dropna().reset_index(drop=True)
    print(f"[Data Importer] Successfully processed {len(clean_df)} training records.")
    return clean_df

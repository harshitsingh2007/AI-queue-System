"""
queue_engine.py
----------------
Core Engine for AI-Powered Smart Queue Management System.

Features:
- Multi-Tenant Isolation & Hierarchical ML Model Loading:
  Loads `models/{tenant_id}/queue_predictor.pkl` if present; falls back to `models/global/queue_predictor.pkl`.
- Persistent Column Mapping (`tenant_mapping` table).
- Standardized Historical Service Log Storage (`tenant_historical_data` table).
- Priority & Category-Partitioned Min-Heap Queue Mechanics.
- Analytics & Model Metadata Registry.
"""

import heapq
import itertools
import time
import os
import json
import sqlite3
import hashlib
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
import joblib
import pandas as pd
import numpy as np
import math

DB_PATH = os.path.join(os.path.dirname(__file__), "queue_system.db")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

PRIORITY_EMERGENCY = 1
PRIORITY_ROUTINE = 2
PRIORITY_STANDARD = 1

def compute_clinical_complexity(age: int, gender: str, medical_condition: str, pre_existing_condition: str, priority_level: int) -> float:
    score = 1.0

    # 1. Age Factor (Pediatric < 10 or Geriatric > 65 require longer consultation)
    if age > 65:
        score *= 1.35
    elif age < 10:
        score *= 1.25
    elif age > 50:
        score *= 1.15

    # 2. Symptom / Medical Condition Complexity
    cond = (medical_condition or "").strip().lower()
    if cond in ("cardiac_chest_pain", "trauma_injury"):
        score *= 1.65
    elif cond in ("high_fever_infection", "respiratory_distress"):
        score *= 1.40
    elif cond in ("lab_blood_test", "routine_followup"):
        score *= 0.75

    # 3. Pre-existing Condition Risk
    risk = (pre_existing_condition or "").strip().lower()
    if risk not in ("none", "", "healthy"):
        score *= 1.25

    # 4. Emergency Priority Multiplier
    if priority_level == PRIORITY_EMERGENCY:
        score *= 1.30

    return round(score, 2)

@dataclass
class Ticket:
    ticket_id: str
    tenant_id: str
    consumer_type: str
    service_category: str
    name: str
    priority_level: int
    join_timestamp: float
    effective_timestamp: Optional[float] = None
    user_email: str = ""
    age: int = 30
    gender: str = "other"
    medical_condition: str = "general_checkup"
    pre_existing_condition: str = "none"
    complexity_score: float = 1.0
    prescription_notes: str = ""
    parent_ticket_id: str = ""
    transferred_from_dept: str = ""
    status: str = "waiting"
    predicted_service_minutes: float = 0.0
    estimated_wait_minutes: float = 0.0
    position: int = 0
    serve_start_time: Optional[float] = None
    serve_end_time: Optional[float] = None
    actual_service_minutes: Optional[float] = None
    adjustment_count: int = 0
    last_adjusted_at: Optional[float] = None
    cancellation_reason: str = ""
    cancelled_at: Optional[float] = None

    def __post_init__(self):
        if self.effective_timestamp is None:
            self.effective_timestamp = self.join_timestamp

    def to_dict(self):
        return {
            "ticket_id": self.ticket_id,
            "tenant_id": self.tenant_id,
            "consumer_type": self.consumer_type,
            "service_category": self.service_category,
            "name": self.name,
            "priority_level": self.priority_level,
            "user_email": self.user_email,
            "age": self.age,
            "gender": self.gender,
            "medical_condition": self.medical_condition,
            "pre_existing_condition": self.pre_existing_condition,
            "complexity_score": round(self.complexity_score, 2),
            "prescription_notes": getattr(self, "prescription_notes", ""),
            "parent_ticket_id": getattr(self, "parent_ticket_id", ""),
            "transferred_from_dept": getattr(self, "transferred_from_dept", ""),
            "status": self.status,
            "predicted_service_minutes": round(self.predicted_service_minutes, 1),
            "estimated_wait_minutes": round(self.estimated_wait_minutes, 1),
            "position": self.position,
            "join_timestamp": self.join_timestamp,
            "effective_timestamp": getattr(self, "effective_timestamp", self.join_timestamp),
            "adjustment_count": getattr(self, "adjustment_count", 0),
            "last_adjusted_at": getattr(self, "last_adjusted_at", None),
            "cancellation_reason": getattr(self, "cancellation_reason", ""),
            "cancelled_at": getattr(self, "cancelled_at", None),
            "serve_start_time": self.serve_start_time,
            "serve_end_time": self.serve_end_time,
            "actual_service_minutes": round(self.actual_service_minutes, 1) if self.actual_service_minutes else None,
        }

class PluginQueueEngine:
    def __init__(self):
        self._tenants: Dict[str, dict] = {}
        self._models_cache: Dict[str, dict] = {}
        self._id_counter = itertools.count(int(time.time() % 1000000))
        self._init_db()
        self._hydrate_from_db()

    # ------------------------------------------------------------------
    # SQLite Database Initialization
    # ------------------------------------------------------------------
    def _get_db(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_db() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS tickets (
                    ticket_id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    consumer_type TEXT NOT NULL,
                    service_category TEXT NOT NULL,
                    name TEXT NOT NULL,
                    priority_level INTEGER NOT NULL,
                    join_timestamp REAL NOT NULL,
                    status TEXT NOT NULL,
                    predicted_service_minutes REAL,
                    estimated_wait_minutes REAL,
                    position INTEGER,
                    serve_start_time REAL,
                    serve_end_time REAL,
                    actual_service_minutes REAL
                );

                CREATE TABLE IF NOT EXISTS service_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id TEXT NOT NULL,
                    tenant_id TEXT NOT NULL,
                    consumer_type TEXT NOT NULL,
                    service_category TEXT NOT NULL,
                    hour_of_day INTEGER NOT NULL,
                    day_of_week INTEGER NOT NULL,
                    queue_length INTEGER NOT NULL,
                    active_staff_counters INTEGER NOT NULL,
                    is_peak_hour INTEGER NOT NULL,
                    complexity_score REAL NOT NULL,
                    historical_avg_speed REAL NOT NULL,
                    service_duration_minutes REAL NOT NULL,
                    completed_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS tenant_config (
                    tenant_id TEXT PRIMARY KEY,
                    active_counters INTEGER DEFAULT 2,
                    updated_at REAL
                );

                CREATE TABLE IF NOT EXISTS tenant_mapping (
                    tenant_id TEXT PRIMARY KEY,
                    mapping_json TEXT NOT NULL,
                    updated_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS tenant_historical_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tenant_id TEXT NOT NULL,
                    consumer_type TEXT NOT NULL,
                    timestamp REAL,
                    queue_length INTEGER NOT NULL,
                    active_staff_counters INTEGER NOT NULL,
                    service_category TEXT NOT NULL,
                    service_duration_minutes REAL NOT NULL,
                    complexity_score REAL NOT NULL,
                    hour_of_day INTEGER NOT NULL,
                    day_of_week INTEGER NOT NULL,
                    is_peak_hour INTEGER NOT NULL,
                    imported_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    phone TEXT DEFAULT '',
                    gender TEXT DEFAULT '',
                    age INTEGER DEFAULT 0,
                    medical_id TEXT DEFAULT '',
                    created_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS appointments (
                    appointment_id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    consumer_type TEXT NOT NULL,
                    service_category TEXT NOT NULL,
                    patient_name TEXT NOT NULL,
                    user_email TEXT NOT NULL,
                    appointment_date TEXT NOT NULL,
                    time_slot TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    ticket_id TEXT
                );
            """)

            # Run safe column migration check for existing sqlite database
            user_cols = [row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()]
            if "phone" not in user_cols:
                conn.execute("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''")
            if "gender" not in user_cols:
                conn.execute("ALTER TABLE users ADD COLUMN gender TEXT DEFAULT ''")
            if "age" not in user_cols:
                conn.execute("ALTER TABLE users ADD COLUMN age INTEGER DEFAULT 0")
            if "medical_id" not in user_cols:
                conn.execute("ALTER TABLE users ADD COLUMN medical_id TEXT DEFAULT ''")
            if "department" not in user_cols:
                conn.execute("ALTER TABLE users ADD COLUMN department TEXT DEFAULT 'all'")

            ticket_cols = [row[1] for row in conn.execute("PRAGMA table_info(tickets)").fetchall()]
            if "user_email" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN user_email TEXT DEFAULT ''")
            if "age" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN age INTEGER DEFAULT 30")
            if "gender" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN gender TEXT DEFAULT 'other'")
            if "medical_condition" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN medical_condition TEXT DEFAULT 'general_checkup'")
            if "pre_existing_condition" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN pre_existing_condition TEXT DEFAULT 'none'")
            if "complexity_score" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN complexity_score REAL DEFAULT 1.0")
            if "prescription_notes" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN prescription_notes TEXT DEFAULT ''")
            if "parent_ticket_id" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN parent_ticket_id TEXT DEFAULT ''")
            if "transferred_from_dept" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN transferred_from_dept TEXT DEFAULT ''")
            if "effective_timestamp" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN effective_timestamp REAL")
            if "adjustment_count" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN adjustment_count INTEGER DEFAULT 0")
            if "last_adjusted_at" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN last_adjusted_at REAL")
            if "cancellation_reason" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN cancellation_reason TEXT DEFAULT ''")
            if "cancelled_at" not in ticket_cols:
                conn.execute("ALTER TABLE tickets ADD COLUMN cancelled_at REAL")

        self._seed_default_users()

    def _save_ticket_db(self, ticket: Ticket):
        eff_ts = getattr(ticket, 'effective_timestamp', ticket.join_timestamp)
        adj_cnt = getattr(ticket, 'adjustment_count', 0)
        last_adj = getattr(ticket, 'last_adjusted_at', None)
        canc_rsn = getattr(ticket, 'cancellation_reason', '')
        canc_at = getattr(ticket, 'cancelled_at', None)

        with self._get_db() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO tickets (
                    ticket_id, tenant_id, consumer_type, service_category, name,
                    priority_level, join_timestamp, user_email, age, gender,
                    medical_condition, pre_existing_condition, complexity_score,
                    prescription_notes, parent_ticket_id, transferred_from_dept,
                    status, predicted_service_minutes, estimated_wait_minutes,
                    position, serve_start_time, serve_end_time, actual_service_minutes,
                    effective_timestamp, adjustment_count, last_adjusted_at,
                    cancellation_reason, cancelled_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ticket.ticket_id, ticket.tenant_id, ticket.consumer_type, ticket.service_category,
                ticket.name, ticket.priority_level, ticket.join_timestamp, getattr(ticket, 'user_email', ''),
                getattr(ticket, 'age', 30), getattr(ticket, 'gender', 'other'),
                getattr(ticket, 'medical_condition', 'general_checkup'), getattr(ticket, 'pre_existing_condition', 'none'),
                getattr(ticket, 'complexity_score', 1.0),
                getattr(ticket, 'prescription_notes', ''), getattr(ticket, 'parent_ticket_id', ''),
                getattr(ticket, 'transferred_from_dept', ''),
                ticket.status, ticket.predicted_service_minutes, ticket.estimated_wait_minutes,
                ticket.position, ticket.serve_start_time, ticket.serve_end_time, ticket.actual_service_minutes,
                eff_ts, adj_cnt, last_adj, canc_rsn, canc_at
            ))
            if ticket.status in ("serving", "completed", "transferred", "no_show", "cancelled"):
                conn.execute("""
                    UPDATE appointments
                    SET status = ?
                    WHERE ticket_id = ? OR (ticket_id != '' AND ticket_id = ?)
                """, (ticket.status, ticket.ticket_id, getattr(ticket, 'parent_ticket_id', '')))

    def _log_completed_service_db(self, ticket: Ticket, queue_length: int, active_counters: int):
        hour_of_day = int(time.strftime("%H", time.localtime(ticket.join_timestamp)))
        day_of_week = int(time.strftime("%w", time.localtime(ticket.join_timestamp)))
        is_peak = 1 if hour_of_day in (9, 10, 11, 14, 15, 16) and day_of_week < 5 else 0

        with self._get_db() as conn:
            conn.execute("""
                INSERT INTO service_logs (
                    ticket_id, tenant_id, consumer_type, service_category, hour_of_day,
                    day_of_week, queue_length, active_staff_counters, is_peak_hour,
                    complexity_score, historical_avg_speed, service_duration_minutes, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ticket.ticket_id, ticket.tenant_id, ticket.consumer_type, ticket.service_category,
                hour_of_day, day_of_week, queue_length, active_counters, is_peak,
                getattr(ticket, 'complexity_score', 1.0), 1.0, ticket.actual_service_minutes, time.time()
            ))

    def save_tenant_mapping(self, tenant_id: str, mapping_dict: dict):
        with self._get_db() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO tenant_mapping (tenant_id, mapping_json, updated_at)
                VALUES (?, ?, ?)
            """, (tenant_id, json.dumps(mapping_dict), time.time()))

    def get_tenant_mapping(self, tenant_id: str) -> Optional[dict]:
        with self._get_db() as conn:
            row = conn.execute("SELECT mapping_json FROM tenant_mapping WHERE tenant_id = ?", (tenant_id,)).fetchone()
            if row:
                return json.loads(row["mapping_json"])
        return None

    def save_historical_records(self, tenant_id: str, df: pd.DataFrame) -> int:
        now = time.time()
        records = []
        for idx, row in df.iterrows():
            records.append((
                tenant_id,
                str(row.get("consumer_type", tenant_id)),
                float(row.get("timestamp", now)) if pd.notna(row.get("timestamp")) else now,
                int(row.get("queue_length", 5)),
                int(row.get("active_staff_counters", 2)),
                str(row.get("service_category", "general")),
                float(row.get("service_duration_minutes", 10.0)),
                float(row.get("complexity_score", 1.0)),
                int(row.get("hour_of_day", 12)),
                int(row.get("day_of_week", 1)),
                int(row.get("is_peak_hour", 0)),
                now
            ))

        with self._get_db() as conn:
            conn.executemany("""
                INSERT INTO tenant_historical_data (
                    tenant_id, consumer_type, timestamp, queue_length, active_staff_counters,
                    service_category, service_duration_minutes, complexity_score,
                    hour_of_day, day_of_week, is_peak_hour, imported_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, records)

        return len(records)

    def get_historical_records(self, tenant_id: str) -> List[dict]:
        with self._get_db() as conn:
            rows = conn.execute("SELECT * FROM tenant_historical_data WHERE tenant_id = ?", (tenant_id,)).fetchall()
            return [dict(r) for r in rows]

    def _hydrate_from_db(self):
        with self._get_db() as conn:
            rows = conn.execute("SELECT * FROM tickets WHERE status IN ('waiting', 'serving')").fetchall()
            for r in rows:
                ticket = Ticket(
                    ticket_id=r["ticket_id"],
                    tenant_id=r["tenant_id"],
                    consumer_type=r["consumer_type"],
                    service_category=r["service_category"],
                    name=r["name"],
                    priority_level=r["priority_level"],
                    join_timestamp=r["join_timestamp"],
                    effective_timestamp=r["effective_timestamp"] if "effective_timestamp" in r.keys() and r["effective_timestamp"] else r["join_timestamp"],
                    user_email=r["user_email"] if "user_email" in r.keys() and r["user_email"] else "",
                    age=r["age"] if "age" in r.keys() and r["age"] else 30,
                    gender=r["gender"] if "gender" in r.keys() and r["gender"] else "other",
                    medical_condition=r["medical_condition"] if "medical_condition" in r.keys() and r["medical_condition"] else "general_checkup",
                    pre_existing_condition=r["pre_existing_condition"] if "pre_existing_condition" in r.keys() and r["pre_existing_condition"] else "none",
                    complexity_score=r["complexity_score"] if "complexity_score" in r.keys() and r["complexity_score"] else 1.0,
                    prescription_notes=r["prescription_notes"] if "prescription_notes" in r.keys() and r["prescription_notes"] else "",
                    parent_ticket_id=r["parent_ticket_id"] if "parent_ticket_id" in r.keys() and r["parent_ticket_id"] else "",
                    transferred_from_dept=r["transferred_from_dept"] if "transferred_from_dept" in r.keys() and r["transferred_from_dept"] else "",
                    status=r["status"],
                    predicted_service_minutes=r["predicted_service_minutes"] or 10.0,
                    estimated_wait_minutes=r["estimated_wait_minutes"] or 0.0,
                    position=r["position"] or 0,
                    serve_start_time=r["serve_start_time"],
                    adjustment_count=r["adjustment_count"] if "adjustment_count" in r.keys() and r["adjustment_count"] else 0,
                    last_adjusted_at=r["last_adjusted_at"] if "last_adjusted_at" in r.keys() and r["last_adjusted_at"] else None,
                    cancellation_reason=r["cancellation_reason"] if "cancellation_reason" in r.keys() and r["cancellation_reason"] else "",
                    cancelled_at=r["cancelled_at"] if "cancelled_at" in r.keys() and r["cancelled_at"] else None,
                )
                tenant = self._get_tenant(r["tenant_id"])
                tenant["tickets"][ticket.ticket_id] = ticket
                if ticket.status == "waiting":
                    seq = next(self._id_counter)
                    eff_ts = getattr(ticket, 'effective_timestamp', ticket.join_timestamp)
                    heapq.heappush(tenant["heap"], (ticket.priority_level, eff_ts, seq, ticket.ticket_id))
            print(f"[Engine Persistence] Hydrated {len(rows)} active tickets from database.")

    # ------------------------------------------------------------------
    # Tenant & Model Isolation Helper
    # ------------------------------------------------------------------
    def _get_tenant(self, tenant_id: str) -> dict:
        if tenant_id not in self._tenants:
            active_counters = 2
            with self._get_db() as conn:
                row = conn.execute("SELECT active_counters FROM tenant_config WHERE tenant_id = ?", (tenant_id,)).fetchone()
                if row:
                    active_counters = row["active_counters"]

            self._tenants[tenant_id] = {
                "heap": [],
                "tickets": {},
                "active_counters": active_counters,
            }
        return self._tenants[tenant_id]

    def _load_model_bundle(self, tenant_id: str) -> dict:
        """Loads tenant-specific model if present; falls back to global baseline model."""
        if tenant_id in self._models_cache:
            return self._models_cache[tenant_id]

        tenant_pkl = os.path.join(MODELS_DIR, tenant_id, "queue_predictor.pkl")
        global_pkl = os.path.join(MODELS_DIR, "global", "queue_predictor.pkl")
        root_pkl = os.path.join(BASE_DIR, "queue_predictor.pkl")

        target_path = None
        if os.path.exists(tenant_pkl):
            target_path = tenant_pkl
            print(f"[ML Engine] Using Tenant-Specific Model for '{tenant_id}'")
        elif os.path.exists(global_pkl):
            target_path = global_pkl
            print(f"[ML Engine] Using Global Baseline Model for '{tenant_id}'")
        elif os.path.exists(root_pkl):
            target_path = root_pkl
            print(f"[ML Engine] Using Root Baseline Model for '{tenant_id}'")

        if target_path:
            try:
                bundle = joblib.load(target_path)
                self._models_cache[tenant_id] = bundle
                return bundle
            except Exception as e:
                print(f"[ML Engine Error] Failed to load bundle at '{target_path}': {e}")

        return {"model": None, "feature_columns": []}

    def set_active_counters(self, tenant_id: str, count: int) -> int:
        count = max(1, min(20, count))
        tenant = self._get_tenant(tenant_id)
        tenant["active_counters"] = count

        with self._get_db() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO tenant_config (tenant_id, active_counters, updated_at)
                VALUES (?, ?, ?)
            """, (tenant_id, count, time.time()))

        self.recalculate_wait_times(tenant_id)
        return count

    # ------------------------------------------------------------------
    # ML Inference Engine
    # ------------------------------------------------------------------
    def _predict_service_minutes(
        self, tenant_id: str, consumer_type: str, service_category: str,
        hour_of_day: int, day_of_week: int, queue_length: int, active_counters: int,
        complexity_score: float = 1.0, age: int = 30
    ) -> float:
        bundle = self._load_model_bundle(tenant_id)
        model = bundle.get("model")
        feature_columns = bundle.get("feature_columns", [])

        if model is None or not feature_columns:
            baselines = {"emergency": 25, "consultation": 15, "pharmacy": 6, "cash": 4, "loan": 20}
            base_mins = float(baselines.get(service_category, 10))
            return round(base_mins * complexity_score, 1)

        row = {col: 0 for col in feature_columns}
        if "hour_of_day" in row: row["hour_of_day"] = hour_of_day
        if "day_of_week" in row: row["day_of_week"] = day_of_week
        if "queue_length" in row: row["queue_length"] = queue_length
        if "active_staff_counters" in row: row["active_staff_counters"] = active_counters
        if "is_peak_hour" in row: row["is_peak_hour"] = 1 if hour_of_day in (9,10,11,14,15,16) and day_of_week < 5 else 0
        if "is_weekend" in row: row["is_weekend"] = 1 if day_of_week >= 5 else 0
        if "complexity_score" in row: row["complexity_score"] = complexity_score
        if "historical_avg_speed" in row: row["historical_avg_speed"] = 1.0

        # Cyclical Features
        if "sin_hour" in row: row["sin_hour"] = float(np.sin(2 * np.pi * hour_of_day / 24.0))
        if "cos_hour" in row: row["cos_hour"] = float(np.cos(2 * np.pi * hour_of_day / 24.0))
        if "sin_day" in row: row["sin_day"] = float(np.sin(2 * np.pi * day_of_week / 7.0))
        if "cos_day" in row: row["cos_day"] = float(np.sin(2 * np.pi * day_of_week / 7.0))

        # Interaction Ratios
        ac = max(1, active_counters)
        ql = max(0, queue_length)
        if "staff_load_ratio" in row: row["staff_load_ratio"] = ql / ac
        if "effective_workload" in row: row["effective_workload"] = (ql * complexity_score) / ac
        if "counter_capacity_index" in row: row["counter_capacity_index"] = ac / (ql + 1.0)

        ct_col = f"consumer_type_{consumer_type}"
        sc_col = f"service_category_{service_category}"
        if ct_col in row: row[ct_col] = 1
        if sc_col in row: row[sc_col] = 1

        X = pd.DataFrame([row])[feature_columns]
        try:
            pred = float(model.predict(X)[0])
            return max(1.0, round(pred * (complexity_score ** 0.5), 1))
        except Exception as e:
            return 10.0

    # ------------------------------------------------------------------
    # Queue Core Operations
    # ------------------------------------------------------------------
    def join_queue(
        self,
        tenant_id: str,
        consumer_type: str,
        service_category: str,
        name: str,
        priority_level: Optional[int] = None,
        user_email: str = "",
        age: int = 30,
        gender: str = "other",
        medical_condition: str = "general_checkup",
        pre_existing_condition: str = "none",
        prescription_notes: str = "",
        parent_ticket_id: str = "",
        transferred_from_dept: str = "",
    ) -> Ticket:
        tenant = self._get_tenant(tenant_id)
        if priority_level is None:
            priority_level = PRIORITY_STANDARD

        ticket_id = f"T{next(self._id_counter):06d}"
        join_ts = time.time()
        tm = time.localtime(join_ts)
        hour_of_day = int(time.strftime("%H", tm))
        day_of_week = int(time.strftime("%w", tm))

        queue_ahead = self._count_waiting(tenant_id, service_category, consumer_type)

        complexity_score = compute_clinical_complexity(age, gender, medical_condition, pre_existing_condition, priority_level)

        predicted_mins = self._predict_service_minutes(
            tenant_id, consumer_type, service_category, hour_of_day, day_of_week,
            queue_ahead, tenant["active_counters"], complexity_score=complexity_score, age=age
        )

        ticket = Ticket(
            ticket_id=ticket_id,
            tenant_id=tenant_id,
            consumer_type=consumer_type,
            service_category=service_category,
            name=name,
            priority_level=priority_level,
            user_email=user_email,
            age=age,
            gender=gender,
            medical_condition=medical_condition,
            pre_existing_condition=pre_existing_condition,
            complexity_score=complexity_score,
            prescription_notes=prescription_notes,
            parent_ticket_id=parent_ticket_id,
            transferred_from_dept=transferred_from_dept,
            join_timestamp=join_ts,
            predicted_service_minutes=predicted_mins,
        )

        tenant["tickets"][ticket_id] = ticket

        seq = next(self._id_counter)
        heapq.heappush(tenant["heap"], (priority_level, join_ts, seq, ticket_id))

        self._save_ticket_db(ticket)
        return ticket

    def transfer_ticket(
        self,
        tenant_id: str,
        ticket_id: str,
        target_department: str,
        prescription_notes: str = "",
    ) -> Tuple[Ticket, Ticket]:
        tenant = self._get_tenant(tenant_id)
        orig_ticket = tenant["tickets"].get(ticket_id)

        if not orig_ticket:
            with self._get_db() as conn:
                r = conn.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)).fetchone()
                if r:
                    orig_ticket = Ticket(
                        ticket_id=r["ticket_id"],
                        tenant_id=r["tenant_id"],
                        consumer_type=r["consumer_type"],
                        service_category=r["service_category"],
                        name=r["name"],
                        priority_level=r["priority_level"],
                        join_timestamp=r["join_timestamp"],
                        user_email=r["user_email"] if "user_email" in r.keys() and r["user_email"] else "",
                        age=r["age"] if "age" in r.keys() and r["age"] else 30,
                        gender=r["gender"] if "gender" in r.keys() and r["gender"] else "other",
                        medical_condition=r["medical_condition"] if "medical_condition" in r.keys() and r["medical_condition"] else "general_checkup",
                        pre_existing_condition=r["pre_existing_condition"] if "pre_existing_condition" in r.keys() and r["pre_existing_condition"] else "none",
                        complexity_score=r["complexity_score"] if "complexity_score" in r.keys() and r["complexity_score"] else 1.0,
                        prescription_notes=r["prescription_notes"] if "prescription_notes" in r.keys() and r["prescription_notes"] else "",
                        parent_ticket_id=r["parent_ticket_id"] if "parent_ticket_id" in r.keys() and r["parent_ticket_id"] else "",
                        transferred_from_dept=r["transferred_from_dept"] if "transferred_from_dept" in r.keys() and r["transferred_from_dept"] else "",
                        status=r["status"],
                        predicted_service_minutes=r["predicted_service_minutes"] or 10.0,
                        estimated_wait_minutes=r["estimated_wait_minutes"] or 0.0,
                        position=r["position"] or 0,
                    )

        if not orig_ticket:
            raise ValueError(f"Ticket #{ticket_id} not found.")

        now = time.time()
        orig_ticket.status = "transferred"
        orig_ticket.serve_end_time = now
        if orig_ticket.serve_start_time:
            orig_ticket.actual_service_minutes = round((now - orig_ticket.serve_start_time) / 60.0, 1)
        else:
            orig_ticket.actual_service_minutes = 5.0

        orig_ticket.prescription_notes = prescription_notes
        self._save_ticket_db(orig_ticket)
        self._log_completed_service_db(orig_ticket, queue_length=orig_ticket.position, active_counters=tenant["active_counters"])

        if ticket_id in tenant["tickets"]:
            del tenant["tickets"][ticket_id]

        new_ticket = self.join_queue(
            tenant_id=tenant_id,
            consumer_type=orig_ticket.consumer_type,
            service_category=target_department.strip().lower(),
            name=orig_ticket.name,
            priority_level=1,  # Expedited priority for in-hospital transferred patient with active Rx
            user_email=orig_ticket.user_email,
            age=orig_ticket.age,
            gender=orig_ticket.gender,
            medical_condition=orig_ticket.medical_condition,
            pre_existing_condition=orig_ticket.pre_existing_condition,
            prescription_notes=prescription_notes,
            parent_ticket_id=orig_ticket.ticket_id,
            transferred_from_dept=orig_ticket.service_category,
        )

        return orig_ticket, new_ticket

    def _count_waiting(self, tenant_id: str, service_category: str, consumer_type: str) -> int:
        tenant = self._get_tenant(tenant_id)
        count = 0
        for t in tenant["tickets"].values():
            if t.status != "waiting":
                continue
            if consumer_type == "bank" and t.service_category != service_category:
                continue
            count += 1
        return count

    def serve_next(self, tenant_id: str, service_category: Optional[str] = None, department: Optional[str] = None) -> Optional[Ticket]:
        """Serve the next waiting ticket. If department is given, only serve tickets from that department."""
        tenant = self._get_tenant(tenant_id)
        heap = tenant["heap"]
        skipped = []
        next_ticket = None

        # Resolve effective department filter: explicit department arg takes priority,
        # then fall back to service_category for backwards-compat.
        dept_filter = None
        if department and department.strip().lower() not in ("", "all"):
            dept_filter = department.strip().lower()
        elif service_category and service_category.strip().lower() not in ("", "all"):
            dept_filter = service_category.strip().lower()

        while heap:
            priority_level, join_ts, seq, ticket_id = heapq.heappop(heap)
            ticket = tenant["tickets"].get(ticket_id)

            if ticket is None or ticket.status != "waiting":
                continue

            if dept_filter and ticket.service_category.strip().lower() != dept_filter:
                skipped.append((priority_level, join_ts, seq, ticket_id))
                continue

            next_ticket = ticket
            break

        for entry in skipped:
            heapq.heappush(heap, entry)

        if next_ticket:
            next_ticket.status = "serving"
            next_ticket.serve_start_time = time.time()
            self._save_ticket_db(next_ticket)

        return next_ticket

    def complete_ticket(self, tenant_id: str, ticket_id: str, department: Optional[str] = None) -> Optional[Ticket]:
        """Complete a ticket. If department is provided, verify the ticket belongs to that department."""
        tenant = self._get_tenant(tenant_id)
        ticket = tenant["tickets"].get(ticket_id)

        if not ticket:
            with self._get_db() as conn:
                r = conn.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)).fetchone()
                if r:
                    ticket = Ticket(
                        ticket_id=r["ticket_id"], tenant_id=r["tenant_id"],
                        consumer_type=r["consumer_type"], service_category=r["service_category"],
                        name=r["name"], priority_level=r["priority_level"], join_timestamp=r["join_timestamp"],
                        status=r["status"]
                    )

        if ticket:
            # Department ownership check — reject if ticket belongs to a different dept
            if department and department.strip().lower() not in ("", "all"):
                ticket_dept = ticket.service_category.strip().lower()
                req_dept = department.strip().lower()
                if ticket_dept != req_dept:
                    raise PermissionError(
                        f"Department mismatch: ticket #{ticket_id} belongs to '{ticket_dept}', "
                        f"but the requesting admin is from '{req_dept}'."
                    )

            ticket.status = "completed"
            ticket.serve_end_time = time.time()

            start_time = ticket.serve_start_time or (ticket.join_timestamp + 60.0)
            duration_mins = max(0.5, round((ticket.serve_end_time - start_time) / 60.0, 2))
            ticket.actual_service_minutes = duration_mins

            self._save_ticket_db(ticket)
            self._log_completed_service_db(ticket, queue_length=ticket.position, active_counters=tenant["active_counters"])

            if ticket_id in tenant["tickets"]:
                del tenant["tickets"][ticket_id]

        return ticket

    def mark_no_show(self, tenant_id: str, ticket_id: str):
        tenant = self._get_tenant(tenant_id)
        ticket = tenant["tickets"].get(ticket_id)
        if ticket:
            ticket.status = "no_show"
            self._save_ticket_db(ticket)
            del tenant["tickets"][ticket_id]

    def _rebuild_heap(self, tenant_id: str):
        tenant = self._get_tenant(tenant_id)
        waiting = [t for t in tenant["tickets"].values() if t.status == "waiting"]
        waiting.sort(key=lambda t: (t.priority_level, getattr(t, 'effective_timestamp', t.join_timestamp)))
        tenant["heap"] = []
        for t in waiting:
            seq = next(self._id_counter)
            eff_ts = getattr(t, 'effective_timestamp', t.join_timestamp)
            heapq.heappush(tenant["heap"], (t.priority_level, eff_ts, seq, t.ticket_id))

    def cancel_ticket(self, tenant_id: str, ticket_id: str, reason: str = "") -> Optional[Ticket]:
        """Cancels a ticket, stores cancellation metadata, updates database, and recalculates queue."""
        tenant = self._get_tenant(tenant_id)
        ticket = tenant["tickets"].get(ticket_id)
        if not ticket:
            with self._get_db() as conn:
                r = conn.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)).fetchone()
                if r:
                    ticket = Ticket(
                        ticket_id=r["ticket_id"], tenant_id=r["tenant_id"],
                        consumer_type=r["consumer_type"], service_category=r["service_category"],
                        name=r["name"], priority_level=r["priority_level"], join_timestamp=r["join_timestamp"],
                        status=r["status"]
                    )
        if not ticket:
            raise ValueError(f"Ticket #{ticket_id} not found.")

        if ticket.status in ("completed", "serving"):
            raise ValueError(f"Cannot cancel ticket in '{ticket.status.upper()}' status.")

        now = time.time()
        ticket.status = "cancelled"
        ticket.cancellation_reason = reason or "User requested cancellation"
        ticket.cancelled_at = now

        self._save_ticket_db(ticket)

        if ticket_id in tenant["tickets"]:
            del tenant["tickets"][ticket_id]

        self._rebuild_heap(tenant_id)
        self.recalculate_wait_times(tenant_id)
        return ticket

    def adjust_queue_position(self, tenant_id: str, ticket_id: str, skip_positions: int = 1) -> dict:
        """
        Adjusts a patient's position in the queue later by skipping 1 or 2 positions.
        Does NOT allow jumping ahead of other patients.
        """
        if skip_positions not in (1, 2):
            raise ValueError("Skip adjustment must be either 1 or 2 positions.")

        tenant = self._get_tenant(tenant_id)
        ticket = tenant["tickets"].get(ticket_id)
        if not ticket:
            with self._get_db() as conn:
                r = conn.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)).fetchone()
                if not r:
                    raise ValueError(f"Ticket #{ticket_id} not found.")
                ticket = Ticket(
                    ticket_id=r["ticket_id"],
                    tenant_id=r["tenant_id"],
                    consumer_type=r["consumer_type"],
                    service_category=r["service_category"],
                    name=r["name"],
                    priority_level=r["priority_level"],
                    join_timestamp=r["join_timestamp"],
                    effective_timestamp=r["effective_timestamp"] if "effective_timestamp" in r.keys() and r["effective_timestamp"] else r["join_timestamp"],
                    user_email=r["user_email"] if "user_email" in r.keys() and r["user_email"] else "",
                    age=r["age"] if "age" in r.keys() and r["age"] else 30,
                    gender=r["gender"] if "gender" in r.keys() and r["gender"] else "other",
                    medical_condition=r["medical_condition"] if "medical_condition" in r.keys() and r["medical_condition"] else "general_checkup",
                    pre_existing_condition=r["pre_existing_condition"] if "pre_existing_condition" in r.keys() and r["pre_existing_condition"] else "none",
                    complexity_score=r["complexity_score"] if "complexity_score" in r.keys() and r["complexity_score"] else 1.0,
                    prescription_notes=r["prescription_notes"] if "prescription_notes" in r.keys() and r["prescription_notes"] else "",
                    parent_ticket_id=r["parent_ticket_id"] if "parent_ticket_id" in r.keys() and r["parent_ticket_id"] else "",
                    transferred_from_dept=r["transferred_from_dept"] if "transferred_from_dept" in r.keys() and r["transferred_from_dept"] else "",
                    status=r["status"],
                    predicted_service_minutes=r["predicted_service_minutes"] or 10.0,
                    estimated_wait_minutes=r["estimated_wait_minutes"] or 0.0,
                    position=r["position"] or 0,
                    serve_start_time=r["serve_start_time"],
                    adjustment_count=r["adjustment_count"] if "adjustment_count" in r.keys() and r["adjustment_count"] else 0,
                    last_adjusted_at=r["last_adjusted_at"] if "last_adjusted_at" in r.keys() and r["last_adjusted_at"] else None,
                    cancellation_reason=r["cancellation_reason"] if "cancellation_reason" in r.keys() and r["cancellation_reason"] else "",
                    cancelled_at=r["cancelled_at"] if "cancelled_at" in r.keys() and r["cancelled_at"] else None,
                )
                tenant["tickets"][ticket_id] = ticket

        if ticket.status != "waiting":
            raise ValueError(f"Cannot adjust queue: Ticket is in '{ticket.status.upper()}' status. Only WAITING tickets can be adjusted.")

        # Limit to 1 adjustment per ticket to prevent infinite delay abuses
        if getattr(ticket, 'adjustment_count', 0) >= 1:
            raise ValueError("This ticket has already been adjusted once. Maximum 1 queue adjustment allowed per ticket.")

        # Get all waiting tickets in the same queue / service category
        dept_clean = ticket.service_category.strip().lower()
        same_dept_waiting = [
            t for t in tenant["tickets"].values()
            if t.status == "waiting" and t.service_category.strip().lower() == dept_clean
        ]
        # Sort by priority and effective_timestamp
        same_dept_waiting.sort(key=lambda t: (t.priority_level, getattr(t, 'effective_timestamp', t.join_timestamp)))

        try:
            curr_idx = next(i for i, t in enumerate(same_dept_waiting) if t.ticket_id == ticket_id)
        except StopIteration:
            raise ValueError("Ticket is not in the active waiting queue.")

        previous_position = curr_idx + 1
        available_behind = len(same_dept_waiting) - 1 - curr_idx
        if available_behind <= 0:
            raise ValueError("You are already at the end of the department queue. No positions behind to swap with.")

        actual_skip = min(skip_positions, available_behind)
        target_idx = curr_idx + actual_skip
        target_ticket = same_dept_waiting[target_idx]

        # Calculate new effective_timestamp to position immediately AFTER target_ticket
        target_eff = getattr(target_ticket, 'effective_timestamp', target_ticket.join_timestamp)
        if target_idx + 1 < len(same_dept_waiting):
            next_eff = getattr(same_dept_waiting[target_idx + 1], 'effective_timestamp', same_dept_waiting[target_idx + 1].join_timestamp)
            new_eff = (target_eff + next_eff) / 2.0
        else:
            new_eff = target_eff + 1.0

        ticket.effective_timestamp = new_eff
        ticket.adjustment_count = getattr(ticket, 'adjustment_count', 0) + 1
        ticket.last_adjusted_at = time.time()

        self._save_ticket_db(ticket)
        self._rebuild_heap(tenant_id)
        self.recalculate_wait_times(tenant_id)

        new_position = ticket.position
        print(f"[Queue Event] Ticket: {ticket.ticket_id} | Action: QUEUE_ADJUSTED | Prev Pos: {previous_position} | Skip: +{actual_skip} | New Pos: {new_position}")

        return {
            "ticket": ticket.to_dict(),
            "previous_position": previous_position,
            "new_position": new_position,
            "requested_skip": skip_positions,
            "actual_skip": actual_skip,
            "message": f"Successfully postponed queue position by {actual_skip} position(s). New position is #{new_position}."
        }

    # ------------------------------------------------------------------
    # Dynamic Recalculation
    # ------------------------------------------------------------------
    def recalculate_wait_times(self, tenant_id: str) -> List[Ticket]:
        tenant = self._get_tenant(tenant_id)
        active_counters = tenant["active_counters"]

        waiting = [t for t in tenant["tickets"].values() if t.status == "waiting"]
        waiting.sort(key=lambda t: (t.priority_level, getattr(t, 'effective_timestamp', t.join_timestamp)))

        cumulative_by_group: Dict[str, float] = {}
        updated = []

        for position, ticket in enumerate(waiting, start=1):
            group_key = ticket.service_category if ticket.consumer_type == "bank" else "global"
            ahead_time = cumulative_by_group.get(group_key, 0.0)

            ticket.estimated_wait_minutes = ahead_time / active_counters
            ticket.position = position

            cumulative_by_group[group_key] = ahead_time + ticket.predicted_service_minutes
            self._save_ticket_db(ticket)
            updated.append(ticket)

        return updated

    # ------------------------------------------------------------------
    # Snapshots & Turn Alerts
    # ------------------------------------------------------------------
    def get_queue_snapshot(self, tenant_id: str, department: Optional[str] = None) -> List[dict]:
        self._sync_all_appointment_statuses(tenant_id)
        tenant = self._get_tenant(tenant_id)
        waiting = [t for t in tenant["tickets"].values() if t.status == "waiting"]
        if department and department.strip().lower() != "all":
            dept_clean = department.strip().lower()
            waiting = [t for t in waiting if t.service_category.strip().lower() == dept_clean]
        waiting.sort(key=lambda t: (t.priority_level, getattr(t, 'effective_timestamp', t.join_timestamp)))
        return [t.to_dict() for t in waiting]

    def get_serving_tickets(self, tenant_id: str, department: Optional[str] = None) -> List[dict]:
        tenant = self._get_tenant(tenant_id)
        serving = [t for t in tenant["tickets"].values() if t.status == "serving"]
        if department and department.strip().lower() != "all":
            dept_clean = department.strip().lower()
            serving = [t for t in serving if t.service_category.strip().lower() == dept_clean]
        return [t.to_dict() for t in serving]

    def get_tickets_needing_turn_alert(self, tenant_id: str) -> List[dict]:
        snapshot = self.get_queue_snapshot(tenant_id)
        return [t for t in snapshot if t["position"] <= 2 or t["estimated_wait_minutes"] <= 3.0]

    # ------------------------------------------------------------------
    # Analytics Engine
    # ------------------------------------------------------------------
    def get_tenant_analytics(self, tenant_id: str, department: Optional[str] = None) -> dict:
        tenant = self._get_tenant(tenant_id)
        snapshot = self.get_queue_snapshot(tenant_id, department=department)
        serving = self.get_serving_tickets(tenant_id, department=department)
        dept_clean = department.strip().lower() if department and department.strip().lower() != "all" else None

        with self._get_db() as conn:
            if dept_clean:
                completed_row = conn.execute(
                    "SELECT COUNT(*) as count, AVG(service_duration_minutes) as avg_duration FROM service_logs WHERE tenant_id = ? AND LOWER(service_category) = ?",
                    (tenant_id, dept_clean)
                ).fetchone()

                total_tickets_today = conn.execute(
                    "SELECT COUNT(*) as count FROM tickets WHERE tenant_id = ? AND LOWER(service_category) = ?",
                    (tenant_id, dept_clean)
                ).fetchone()["count"]

                hourly_rows = conn.execute(
                    "SELECT hour_of_day, COUNT(*) as cnt FROM service_logs WHERE tenant_id = ? AND LOWER(service_category) = ? GROUP BY hour_of_day ORDER BY hour_of_day",
                    (tenant_id, dept_clean)
                ).fetchall()
            else:
                completed_row = conn.execute(
                    "SELECT COUNT(*) as count, AVG(service_duration_minutes) as avg_duration FROM service_logs WHERE tenant_id = ?",
                    (tenant_id,)
                ).fetchone()

                total_tickets_today = conn.execute(
                    "SELECT COUNT(*) as count FROM tickets WHERE tenant_id = ?",
                    (tenant_id,)
                ).fetchone()["count"]

                hourly_rows = conn.execute(
                    "SELECT hour_of_day, COUNT(*) as cnt FROM service_logs WHERE tenant_id = ? GROUP BY hour_of_day ORDER BY hour_of_day",
                    (tenant_id,)
                ).fetchall()

        completed_count = completed_row["count"] if completed_row else 0
        avg_service = round(completed_row["avg_duration"], 1) if (completed_row and completed_row["avg_duration"]) else 12.4

        avg_wait = (
            round(sum(t["estimated_wait_minutes"] for t in snapshot) / len(snapshot), 1)
            if snapshot else 0.0
        )

        hourly_dist = [{"hour": f"{r['hour_of_day']:02d}:00", "count": r["cnt"]} for r in hourly_rows]
        if not hourly_dist:
            hourly_dist = [{"hour": "09:00", "count": 12}, {"hour": "11:00", "count": 28}, {"hour": "14:00", "count": 22}, {"hour": "16:00", "count": 15}]

        from train_model import get_tenant_model_info
        model_info = get_tenant_model_info(tenant_id)

        return {
            "tenant_id": tenant_id,
            "active_counters": tenant["active_counters"],
            "currently_waiting": len(snapshot),
            "currently_serving": len(serving),
            "total_completed": completed_count,
            "total_tickets_today": total_tickets_today,
            "avg_wait_minutes": avg_wait,
            "avg_service_minutes": avg_service,
            "hourly_distribution": hourly_dist,
            "model_info": model_info,
        }

    def fetch_all_service_logs(self, tenant_id: Optional[str] = None) -> List[dict]:
        with self._get_db() as conn:
            if tenant_id:
                rows = conn.execute("SELECT * FROM service_logs WHERE tenant_id = ?", (tenant_id,)).fetchall()
            else:
                rows = conn.execute("SELECT * FROM service_logs").fetchall()
            return [dict(r) for r in rows]

    def reload_model_cache(self, tenant_id: Optional[str] = None):
        if tenant_id and tenant_id in self._models_cache:
            del self._models_cache[tenant_id]
        else:
            self._models_cache.clear()

    # ------------------------------------------------------------------
    # User Authentication & Role Management
    # ------------------------------------------------------------------
    def _hash_password(self, password: str) -> str:
        return hashlib.sha256((password + "ai_queue_secret_salt_2026").encode('utf-8')).hexdigest()

    def _seed_default_users(self):
        with self._get_db() as conn:
            count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            if count == 0:
                admin_pwd = self._hash_password("admin123")
                user_pwd = self._hash_password("user123")
                now = time.time()
                conn.execute(
                    "INSERT INTO users (email, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
                    ("admin@hospital.com", "Dr. Admin", admin_pwd, "admin", now)
                )
                conn.execute(
                    "INSERT INTO users (email, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
                    ("patient@hospital.com", "Patient Priya", user_pwd, "user", now)
                )

    def register_user(self, email: str, username: str, password: str, role: str = "user", department: str = "all") -> dict:
        email_clean = email.strip().lower()
        role_clean = role.strip().lower()
        dept_clean = department.strip().lower() if department else "all"
        if role_clean not in ("user", "admin"):
            role_clean = "user"
        
        with self._get_db() as conn:
            existing = conn.execute("SELECT id FROM users WHERE email = ?", (email_clean,)).fetchone()
            if existing:
                raise ValueError("User with this email address already exists.")
            
            pwd_hash = self._hash_password(password)
            now = time.time()
            cursor = conn.execute(
                "INSERT INTO users (email, username, password_hash, role, department, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (email_clean, username.strip(), pwd_hash, role_clean, dept_clean, now)
            )
            user_id = cursor.lastrowid
            
        token = f"token-{user_id}-{int(now)}"
        return {
            "id": user_id,
            "email": email_clean,
            "username": username.strip(),
            "role": role_clean,
            "department": dept_clean,
            "token": token
        }

    def authenticate_user(self, email: str, password: str) -> dict:
        email_clean = email.strip().lower()
        pwd_hash = self._hash_password(password)
        
        with self._get_db() as conn:
            user = conn.execute(
                "SELECT id, email, username, password_hash, role, department FROM users WHERE email = ?", 
                (email_clean,)
            ).fetchone()
            
            if not user or user["password_hash"] != pwd_hash:
                raise ValueError("Invalid email or password.")
            
            token = f"token-{user['id']}-{int(time.time())}"
            dept = user["department"] if "department" in user.keys() and user["department"] else "all"
            return {
                "id": user["id"],
                "email": user["email"],
                "username": user["username"],
                "role": user["role"],
                "department": dept,
                "token": token
            }

    def get_user_by_email(self, email: str) -> Optional[dict]:
        with self._get_db() as conn:
            user = conn.execute(
                "SELECT id, email, username, role, department, phone, gender, age, medical_id, created_at FROM users WHERE email = ?",
                (email.lower(),)
            ).fetchone()
            return dict(user) if user else None

    def update_user_profile(
        self, email: str, username: str, phone: str = "", gender: str = "", age: int = 0, medical_id: str = "", department: str = ""
    ) -> dict:
        email_clean = email.strip().lower()
        with self._get_db() as conn:
            existing = conn.execute("SELECT id FROM users WHERE email = ?", (email_clean,)).fetchone()
            if not existing:
                raise ValueError("User account not found in database.")

            if department:
                conn.execute("""
                    UPDATE users
                    SET username = ?, phone = ?, gender = ?, age = ?, medical_id = ?, department = ?
                    WHERE email = ?
                """, (username.strip(), phone.strip(), gender.strip(), age, medical_id.strip(), department.strip().lower(), email_clean))
            else:
                conn.execute("""
                    UPDATE users
                    SET username = ?, phone = ?, gender = ?, age = ?, medical_id = ?
                    WHERE email = ?
                """, (username.strip(), phone.strip(), gender.strip(), age, medical_id.strip(), email_clean))

        return self.get_user_by_email(email_clean)

    def get_all_users(self) -> List[dict]:
        with self._get_db() as conn:
            rows = conn.execute("""
                SELECT id, email, username, role, department, phone, gender, age, medical_id, created_at
                FROM users ORDER BY id DESC
            """).fetchall()
            return [dict(r) for r in rows]

    def get_user_tickets(self, user_email: str) -> List[dict]:
        email_clean = user_email.strip().lower()
        with self._get_db() as conn:
            rows = conn.execute("""
                SELECT * FROM tickets
                WHERE user_email = ? OR LOWER(name) = (SELECT LOWER(username) FROM users WHERE email = ?)
                ORDER BY join_timestamp DESC
            """, (email_clean, email_clean)).fetchall()
            return [dict(r) for r in rows]

    def get_database_overview(self) -> dict:
        with self._get_db() as conn:
            tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
            result = {}
            for table in tables:
                schema = [dict(col) for col in conn.execute(f"PRAGMA table_info('{table}');").fetchall()]
                count = conn.execute(f"SELECT COUNT(*) FROM '{table}';").fetchone()[0]
                rows = [dict(r) for r in conn.execute(f"SELECT * FROM '{table}' ORDER BY 1 DESC LIMIT 100;").fetchall()]
                result[table] = {
                    "count": count,
                    "schema": schema,
                    "rows": rows
                }
            return result

    # ------------------------------------------------------------------
    # Hybrid Queueing: Slot Booking & Pre-scheduled Check-in
    # ------------------------------------------------------------------
    def book_appointment(
        self,
        tenant_id: str,
        consumer_type: str,
        service_category: str,
        patient_name: str,
        user_email: str,
        appointment_date: str,
        time_slot: str
    ) -> dict:
        apt_id = f"APT-{int(time.time()*1000) % 1000000:06d}"
        now = time.time()
        email_clean = user_email.strip().lower()

        with self._get_db() as conn:
            conn.execute("""
                INSERT INTO appointments (
                    appointment_id, tenant_id, consumer_type, service_category,
                    patient_name, user_email, appointment_date, time_slot, status, created_at, ticket_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, '')
            """, (apt_id, tenant_id, consumer_type, service_category, patient_name.strip(), email_clean, appointment_date, time_slot, now))

        return {
            "appointment_id": apt_id,
            "tenant_id": tenant_id,
            "consumer_type": consumerType if 'consumerType' in locals() else consumer_type,
            "service_category": service_category,
            "patient_name": patient_name.strip(),
            "user_email": email_clean,
            "appointment_date": appointment_date,
            "time_slot": time_slot,
            "status": "scheduled",
            "created_at": now
        }

    def check_in_appointment(self, appointment_id: str) -> dict:
        apt_clean = appointment_id.strip().upper()
        with self._get_db() as conn:
            apt = conn.execute("SELECT * FROM appointments WHERE UPPER(appointment_id) = ?", (apt_clean,)).fetchone()
            if not apt:
                raise ValueError("Appointment code not found.")
            
            apt_dict = dict(apt)
            if apt_dict["status"] == "checked_in" and apt_dict["ticket_id"]:
                # Already checked in, return existing ticket
                tenant = self._get_tenant(apt_dict["tenant_id"])
                existing_t = tenant["tickets"].get(apt_dict["ticket_id"])
                if existing_t:
                    return {"appointment": apt_dict, "ticket": existing_t.to_dict()}

        # Join the live priority queue line with Priority 1.5 (Pre-scheduled Appointment priority merge ahead of walk-in routine tickets)
        ticket = self.join_queue(
            tenant_id=apt_dict["tenant_id"],
            consumer_type=apt_dict["consumer_type"],
            service_category=apt_dict["service_category"],
            name=f"{apt_dict['patient_name']} (Appt: {apt_dict['time_slot']})",
            priority_level=1, # Priority appointment jump
            user_email=apt_dict["user_email"]
        )

        with self._get_db() as conn:
            conn.execute("""
                UPDATE appointments
                SET status = 'checked_in', ticket_id = ?
                WHERE UPPER(appointment_id) = ?
            """, (ticket.ticket_id, apt_clean))

        apt_dict["status"] = "checked_in"
        apt_dict["ticket_id"] = ticket.ticket_id

        return {"appointment": apt_dict, "ticket": ticket.to_dict()}

    def _sync_all_appointment_statuses(self, tenant_id: str):
        with self._get_db() as conn:
            conn.execute("""
                UPDATE appointments
                SET status = (
                    SELECT status FROM tickets
                    WHERE tickets.ticket_id = appointments.ticket_id
                )
                WHERE tenant_id = ?
                  AND ticket_id IS NOT NULL AND ticket_id != ''
                  AND EXISTS (
                      SELECT 1 FROM tickets
                      WHERE tickets.ticket_id = appointments.ticket_id
                  )
            """, (tenant_id,))

    def auto_check_in_due_appointments(self, tenant_id: str):
        self._sync_all_appointment_statuses(tenant_id)
        with self._get_db() as conn:
            rows = conn.execute("""
                SELECT appointment_id FROM appointments
                WHERE tenant_id = ? AND status = 'scheduled'
            """, (tenant_id,)).fetchall()
            apt_ids = [r["appointment_id"] for r in rows]

        for apt_id in apt_ids:
            try:
                self.check_in_appointment(apt_id)
            except Exception as e:
                print(f"[Auto-Checkin] {apt_id}: {e}")

    def get_user_appointments(self, user_email: str) -> List[dict]:
        email_clean = user_email.strip().lower()
        with self._get_db() as conn:
            # Sync status from tickets table into appointments table
            conn.execute("""
                UPDATE appointments
                SET status = (
                    SELECT status FROM tickets
                    WHERE tickets.ticket_id = appointments.ticket_id
                )
                WHERE ticket_id IS NOT NULL AND ticket_id != ''
                  AND EXISTS (
                      SELECT 1 FROM tickets
                      WHERE tickets.ticket_id = appointments.ticket_id
                  )
            """)

            # Fetch user username if registered
            u_row = conn.execute("SELECT username, email FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?", (email_clean, email_clean)).fetchone()
            matched_username = u_row["username"].lower() if u_row else email_clean
            matched_email = u_row["email"].lower() if u_row else email_clean

            # Fetch pre-scheduled appointments
            rows = conn.execute("""
                SELECT * FROM appointments
                WHERE LOWER(user_email) = ? 
                   OR LOWER(user_email) = ?
                   OR LOWER(patient_name) = ?
                   OR LOWER(patient_name) = ?
                   OR LOWER(patient_name) LIKE ?
                ORDER BY created_at DESC
            """, (email_clean, matched_email, email_clean, matched_username, f"{matched_username}%")).fetchall()

            result = []
            seen_ticket_ids = set()

            for r in rows:
                item = dict(r)
                if item.get("ticket_id"):
                    seen_ticket_ids.add(item["ticket_id"])
                    t_row = conn.execute("""
                        SELECT prescription_notes, transferred_from_dept, actual_service_minutes, status
                        FROM tickets WHERE ticket_id = ?
                    """, (item["ticket_id"],)).fetchone()
                    if t_row:
                        item["prescription_notes"] = t_row["prescription_notes"] or ""
                        item["transferred_from_dept"] = t_row["transferred_from_dept"] or ""
                        item["actual_service_minutes"] = t_row["actual_service_minutes"]
                        if t_row["status"]:
                            item["status"] = t_row["status"]
                result.append(item)

            # Also fetch walk-in / standalone consultation tickets for this user
            ticket_rows = conn.execute("""
                SELECT * FROM tickets
                WHERE (LOWER(user_email) = ? 
                   OR LOWER(user_email) = ?
                   OR LOWER(name) = ?
                   OR LOWER(name) = ?
                   OR LOWER(name) LIKE ?)
                ORDER BY join_timestamp DESC
            """, (email_clean, matched_email, email_clean, matched_username, f"{matched_username}%")).fetchall()

            for t_r in ticket_rows:
                t_dict = dict(t_r)
                tid = t_dict["ticket_id"]
                if tid not in seen_ticket_ids:
                    seen_ticket_ids.add(tid)
                    join_ts = t_dict.get("join_timestamp") or time.time()
                    walkin_item = {
                        "appointment_id": f"TKN-{tid}",
                        "tenant_id": t_dict.get("tenant_id", "city-hospital-01"),
                        "consumer_type": t_dict.get("consumer_type", "hospital"),
                        "service_category": t_dict.get("service_category", "consultation"),
                        "patient_name": t_dict.get("name", matched_username),
                        "user_email": t_dict.get("user_email") or matched_email,
                        "appointment_date": time.strftime("%Y-%m-%d", time.localtime(join_ts)),
                        "time_slot": time.strftime("%I:%M %p", time.localtime(join_ts)),
                        "status": t_dict.get("status", "completed"),
                        "created_at": join_ts,
                        "ticket_id": tid,
                        "prescription_notes": t_dict.get("prescription_notes") or "",
                        "transferred_from_dept": t_dict.get("transferred_from_dept") or "",
                        "actual_service_minutes": t_dict.get("actual_service_minutes")
                    }
                    result.append(walkin_item)

            # Sort unified records by created_at DESC
            result.sort(key=lambda x: x.get("created_at", 0), reverse=True)
            return result

    def get_tenant_appointments(
        self,
        tenant_id: str,
        department: Optional[str] = None,
        active_only: bool = False,
    ) -> List[dict]:
        """Return appointments for a tenant.

        Parameters
        ----------
        department : str, optional
            When set (and not "all"), only return appointments whose
            service_category matches this department.
        active_only : bool, default False
            When True, only return appointments that are still active
            (status IN 'scheduled', 'checked_in'). Completed, cancelled,
            transferred, no_show, etc. are excluded from the result.
            Use this for the Reserved Slots view. Set to False for the
            full appointment history view.
        """
        self.auto_check_in_due_appointments(tenant_id)
        # First sync appointment statuses so stale "scheduled" rows that
        # already have a completed/cancelled ticket get updated.
        self._sync_all_appointment_statuses(tenant_id)

        active_statuses = ("scheduled", "checked_in")

        with self._get_db() as conn:
            dept_filter = department and department.strip().lower() not in ("", "all")
            dept_clean = department.strip().lower() if dept_filter else None

            if dept_filter and active_only:
                rows = conn.execute("""
                    SELECT * FROM appointments
                    WHERE tenant_id = ?
                      AND LOWER(service_category) = ?
                      AND status IN ('scheduled', 'checked_in')
                    ORDER BY created_at DESC
                """, (tenant_id, dept_clean)).fetchall()
            elif dept_filter:
                rows = conn.execute("""
                    SELECT * FROM appointments
                    WHERE tenant_id = ? AND LOWER(service_category) = ?
                    ORDER BY created_at DESC
                """, (tenant_id, dept_clean)).fetchall()
            elif active_only:
                rows = conn.execute("""
                    SELECT * FROM appointments
                    WHERE tenant_id = ?
                      AND status IN ('scheduled', 'checked_in')
                    ORDER BY created_at DESC
                """, (tenant_id,)).fetchall()
            else:
                rows = conn.execute("""
                    SELECT * FROM appointments
                    WHERE tenant_id = ?
                    ORDER BY created_at DESC
                """, (tenant_id,)).fetchall()

            return [dict(r) for r in rows]

engine = PluginQueueEngine()

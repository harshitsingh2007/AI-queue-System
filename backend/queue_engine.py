"""
queue_engine.py
----------------
Core Engine for AI-Powered Smart Queue Management System.
Enterprise Relational Multi-Hospital Architecture on PostgreSQL.

Features:
- Pure PostgreSQL Relational Architecture (zero sqlite3 imports in execution path)
- Multi-Hospital Isolation & Dynamic Access Verification
- Event Sourcing: Real-time event tracking via `queue_events` and `appointment_status_history`
- Administrative Auditing via `audit_logs`
- Priority Min-Heap & Clinical Complexity Multiplier
- Dynamic Wait-Time Recalculation & AI Service Duration Prediction
- Full Backward API Contract Compatibility (supports existing frontend and Socket.IO payloads)
"""

import os
import json
import time
import uuid
import math
import heapq
import random
import hashlib
import itertools
from dataclasses import dataclass, field
from datetime import datetime, timezone, date, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    from zoneinfo import ZoneInfo
    TIMEZONE_NAME = os.getenv("HOSPITAL_TIMEZONE", "Asia/Kolkata")
    HOSPITAL_TZ = ZoneInfo(TIMEZONE_NAME)
except Exception:
    HOSPITAL_TZ = timezone(timedelta(hours=5, minutes=30))

def get_current_queue_date() -> date:
    """Returns today's date in configured hospital local timezone."""
    return datetime.now(HOSPITAL_TZ).date()

def parse_queue_date(d: Union[str, date, datetime, None]) -> date:
    """Safely normalizes various date/datetime inputs into local date."""
    if d is None:
        return get_current_queue_date()
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.astimezone(HOSPITAL_TZ).date() if d.tzinfo else d.date()
    if isinstance(d, str):
        try:
            return datetime.strptime(d.strip()[:10], "%Y-%m-%d").date()
        except Exception:
            return get_current_queue_date()
    return get_current_queue_date()

import joblib
import numpy as np
import pandas as pd

from database import get_db_connection, IS_POSTGRES, get_db_info, init_postgres_schema

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

PRIORITY_EMERGENCY = 1
PRIORITY_ROUTINE = 2
PRIORITY_STANDARD = 1
MAX_PATIENT_QUEUE_ADJUSTMENT = 3


def compute_clinical_complexity(age: int, gender: str, medical_condition: str, pre_existing_condition: str, priority_level: int) -> float:
    """Calculates patient-specific clinical complexity multiplier."""
    score = 1.0

    # 1. Age Factor
    if age > 65:
        score *= 1.35
    elif age < 10:
        score *= 1.25
    elif age > 50:
        score *= 1.15

    # 2. Symptom / Condition Factor
    cond = (medical_condition or "").strip().lower()
    if cond in ("cardiac_chest_pain", "trauma_injury"):
        score *= 1.65
    elif cond in ("high_fever_infection", "respiratory_distress"):
        score *= 1.40
    elif cond in ("lab_blood_test", "routine_followup"):
        score *= 0.75

    # 3. Pre-existing Conditions
    risk = (pre_existing_condition or "").strip().lower()
    if risk in ("cardiac_history", "diabetes_hypertension"):
        score *= 1.30
    elif risk in ("asthma_copd", "kidney_disease"):
        score *= 1.20

    # 4. Emergency Priority
    if priority_level == PRIORITY_EMERGENCY:
        score *= 1.50

    return max(0.5, min(3.0, round(score, 2)))


def dt_to_epoch(val: Any) -> float:
    """Converts a datetime or ISO string to unix timestamp float."""
    if val is None:
        return time.time()
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, datetime):
        return val.timestamp()
    if isinstance(val, str):
        try:
            return float(val)
        except Exception:
            try:
                dt = datetime.fromisoformat(val)
                return dt.timestamp()
            except Exception:
                return time.time()
    return time.time()


@dataclass
class Ticket:
    ticket_id: str
    tenant_id: str
    consumer_type: str
    service_category: str
    name: str
    priority_level: int
    join_timestamp: float
    queue_date: Optional[str] = None  # ISO format "YYYY-MM-DD"
    appointment_id: Optional[str] = None
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
    position: Optional[int] = 0
    serve_start_time: Optional[float] = None
    serve_end_time: Optional[float] = None
    actual_service_minutes: Optional[float] = None
    adjustment_count: int = 0
    last_adjusted_at: Optional[float] = None
    cancellation_reason: str = ""
    cancelled_at: Optional[float] = None
    # Explicit patient_id override (used when booking for a family member)
    explicit_patient_id: Optional[int] = None

    def __post_init__(self):
        if self.effective_timestamp is None:
            self.effective_timestamp = self.join_timestamp
        if self.queue_date is None:
            self.queue_date = str(get_current_queue_date())

    def to_dict(self):
        return {
            "ticket_id": self.ticket_id,
            "tenant_id": self.tenant_id,
            "consumer_type": self.consumer_type,
            "service_category": self.service_category,
            "name": self.name,
            "priority_level": self.priority_level,
            "queue_date": self.queue_date or str(get_current_queue_date()),
            "appointment_id": self.appointment_id or "",
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
    def get_current_queue_date(self) -> date:
        return get_current_queue_date()

    def parse_queue_date(self, d: Any) -> date:
        return parse_queue_date(d)

    def __init__(self):
        self._tenants: Dict[str, dict] = {}
        self._models_cache: Dict[str, dict] = {}
        self._id_counter = itertools.count(int(time.time() % 1000000))
        self._init_db()
        self._hydrate_from_db()

    # ------------------------------------------------------------------
    # Database Connection
    # ------------------------------------------------------------------
    def _get_db(self):
        return get_db_connection()

    def _init_db(self):
        init_postgres_schema()

    # ------------------------------------------------------------------
    # Relational Entity Resolution Helpers
    # ------------------------------------------------------------------
    def _resolve_hospital_id(self, conn, hospital_code: str) -> Optional[int]:
        """Looks up integer hospital_id from hospital_code/tenant_id."""
        clean_code = (hospital_code or "city-hospital-01").strip()
        r = conn.execute("SELECT id FROM hospitals WHERE hospital_code = %s", (clean_code,)).fetchone()
        if r:
            return r[0]
        # Fallback query default hospital
        def_r = conn.execute("SELECT id FROM hospitals WHERE hospital_code = 'city-hospital-01'").fetchone()
        return def_r[0] if def_r else 1

    def _resolve_department_id(self, conn, hospital_id: int, dept_code: str) -> Optional[int]:
        """Looks up integer department_id from hospital_id and dept_code."""
        clean_code = (dept_code or "consultation").strip().lower()
        r = conn.execute(
            "SELECT id FROM departments WHERE hospital_id = %s AND dept_code = %s",
            (hospital_id, clean_code)
        ).fetchone()
        return r[0] if r else None

    def _resolve_patient_id(self, conn, user_email: str, name: str, phone: str = "", gender: str = "other", age: int = 30) -> Optional[int]:
        """Finds or creates a patient record linked to user_email or patient name."""
        email = (user_email or "").strip().lower()
        clean_name = (name or "").strip()
        uid = None
        if email:
            ur = conn.execute("SELECT id FROM users WHERE LOWER(email) = %s OR LOWER(username) = %s", (email, email)).fetchone()
            if ur:
                uid = ur[0]

        if not uid and clean_name:
            ur = conn.execute("SELECT id FROM users WHERE LOWER(username) = %s OR LOWER(email) = %s", (clean_name.lower(), clean_name.lower())).fetchone()
            if ur:
                uid = ur[0]

        if uid:
            pr = conn.execute("SELECT id FROM patients WHERE user_id = %s", (uid,)).fetchone()
            if pr:
                return pr[0]

        # Check existing unlinked patient by name
        if clean_name:
            unlinked = conn.execute("SELECT id FROM patients WHERE LOWER(name) = %s AND user_id IS NULL ORDER BY id DESC LIMIT 1", (clean_name.lower(),)).fetchone()
            if unlinked:
                if uid:
                    conn.execute("UPDATE patients SET user_id = %s, updated_at = NOW() WHERE id = %s", (uid, unlinked[0]))
                return unlinked[0]

        # Create new patient entry
        new_p = conn.execute("""
            INSERT INTO patients (user_id, medical_id, name, phone, gender, age, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id;
        """, (uid, "", clean_name or "Patient", phone, gender, age)).fetchone()
        return new_p[0] if new_p else None

    def _verify_ticket_ownership(self, conn, ticket_id: str, user_email: str, hospital_id: int) -> int:
        """Verifies that the authenticated user owns the ticket or has authorized staff privileges."""
        clean_email = (user_email or "").strip().lower()
        if not clean_email:
            raise PermissionError("Forbidden: Authentication required.")

        u = conn.execute("SELECT id, role, username, email FROM users WHERE LOWER(email) = %s", (clean_email,)).fetchone()
        if not u:
            # Check if identifier is an employee_code
            emp_u = conn.execute("""
                SELECT u.id, u.role, u.username, u.email FROM users u
                JOIN employees e ON e.user_id = u.id
                WHERE LOWER(e.employee_code) = %s
            """, (clean_email,)).fetchone()
            if emp_u:
                u = emp_u

        if not u:
            raise PermissionError("Forbidden: Authenticated user account not found.")

        uid, role = u[0], u[1]

        # 1. Super Admin: full access if owning/managing hospital
        if role in ("superadmin", "super_admin"):
            return uid

        # 2. Hospital Staff / Doctor / Admin: verify they belong to this hospital
        if role in ("admin", "doctor", "staff", "receptionist"):
            emp = conn.execute("SELECT id FROM employees WHERE user_id = %s AND hospital_id = %s", (uid, hospital_id)).fetchone()
            if emp:
                return uid
            raise PermissionError("Forbidden: Staff member does not belong to this hospital.")

        # 3. Patient / Consumer: verify ownership
        owns = conn.execute("""
            SELECT 1 FROM tickets t
            JOIN patients p ON p.id = t.patient_id
            WHERE t.ticket_id = %s AND p.user_id = %s
            UNION
            SELECT 1 FROM tickets t
            JOIN patients p ON p.id = t.patient_id
            JOIN family_members fm ON fm.patient_id = p.id
            WHERE t.ticket_id = %s AND fm.user_id = %s
            UNION
            SELECT 1 FROM tickets t
            JOIN appointments a ON a.appointment_id = t.appointment_id
            JOIN patients p ON p.id = a.patient_id
            WHERE t.ticket_id = %s AND p.user_id = %s
        """, (ticket_id, uid, ticket_id, uid, ticket_id, uid)).fetchone()

        if owns:
            return uid

        # Fallback: only if patient record has no linked user_id, check name match
        pat_match = conn.execute("""
            SELECT 1 FROM tickets t
            JOIN patients p ON p.id = t.patient_id
            JOIN users u ON u.id = %s
            WHERE t.ticket_id = %s AND p.user_id IS NULL AND LOWER(p.name) = LOWER(u.username)
        """, (uid, ticket_id)).fetchone()

        if pat_match:
            return uid

        raise PermissionError("Forbidden: You do not own this ticket.")

    # ------------------------------------------------------------------
    # Event & Audit Sourcing Helpers
    # ------------------------------------------------------------------
    def _log_queue_event(
        self,
        conn,
        hospital_id: int,
        ticket_id: str,
        event_type: str,
        old_status: Optional[str],
        new_status: str,
        old_position: Optional[int] = None,
        new_position: Optional[int] = None,
        performed_by_user_id: Optional[int] = None,
        metadata: Optional[dict] = None
    ):
        """Records an immutable queue lifecycle event."""
        try:
            conn.execute("""
                INSERT INTO queue_events (
                    hospital_id, ticket_id, event_type, old_status, new_status,
                    old_position, new_position, performed_by_user_id, metadata, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW());
            """, (
                hospital_id,
                ticket_id,
                event_type,
                old_status,
                new_status,
                old_position,
                new_position,
                performed_by_user_id,
                json.dumps(metadata or {})
            ))
        except Exception as e:
            print(f"[WARN] Failed to write queue_event: {e}")

    def _log_appointment_history(
        self,
        conn,
        appointment_id: str,
        old_status: Optional[str],
        new_status: str,
        changed_by_user_id: Optional[int] = None,
        reason: str = ""
    ):
        """Records an appointment state transition."""
        try:
            conn.execute("""
                INSERT INTO appointment_status_history (
                    appointment_id, old_status, new_status, changed_by_user_id, reason, created_at
                ) VALUES (%s, %s, %s, %s, %s, NOW());
            """, (
                appointment_id,
                old_status,
                new_status,
                changed_by_user_id,
                reason
            ))
        except Exception as e:
            print(f"[WARN] Failed to write appointment_status_history: {e}")

    def _log_audit(
        self,
        conn,
        hospital_id: Optional[int],
        user_id: Optional[int],
        action: str,
        entity_type: str,
        entity_id: str,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None
    ):
        """Records administrative actions in audit_logs."""
        try:
            conn.execute("""
                INSERT INTO audit_logs (
                    hospital_id, user_id, action, entity_type, entity_id, old_values, new_values, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW());
            """, (
                hospital_id,
                user_id,
                action,
                entity_type,
                str(entity_id),
                json.dumps(old_values or {}),
                json.dumps(new_values or {})
            ))
        except Exception as e:
            print(f"[WARN] Failed to write audit_log: {e}")

    # ------------------------------------------------------------------
    # Persistent Ticket Storage & Encounter Logging
    # ------------------------------------------------------------------
    def _save_ticket_db(self, ticket: Ticket):
        """Persists ticket record into PostgreSQL using relational keys and explicit queue_date."""
        join_dt = datetime.fromtimestamp(ticket.join_timestamp, tz=timezone.utc)
        eff_dt = datetime.fromtimestamp(getattr(ticket, "effective_timestamp", ticket.join_timestamp), tz=timezone.utc)
        start_dt = datetime.fromtimestamp(ticket.serve_start_time, tz=timezone.utc) if ticket.serve_start_time else None
        end_dt = datetime.fromtimestamp(ticket.serve_end_time, tz=timezone.utc) if ticket.serve_end_time else None
        last_adj = datetime.fromtimestamp(ticket.last_adjusted_at, tz=timezone.utc) if getattr(ticket, "last_adjusted_at", None) else None
        canc_at = datetime.fromtimestamp(ticket.cancelled_at, tz=timezone.utc) if getattr(ticket, "cancelled_at", None) else None
        q_date = parse_queue_date(getattr(ticket, "queue_date", None))
        apt_id = getattr(ticket, "appointment_id", None) or None

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, ticket.tenant_id)
            dept_id = self._resolve_department_id(conn, hid, ticket.service_category)
            # Use explicit_patient_id if provided (family member booking), otherwise resolve
            if getattr(ticket, "explicit_patient_id", None):
                pid = ticket.explicit_patient_id
            else:
                pid = self._resolve_patient_id(
                    conn,
                    getattr(ticket, "user_email", ""),
                    ticket.name,
                    gender=getattr(ticket, "gender", "other"),
                    age=int(getattr(ticket, "age", 30))
                )

            conn.execute("""
                INSERT INTO tickets (
                    ticket_id, hospital_id, department_id, patient_id, appointment_id, consumer_type, service_category,
                    name, priority_level, queue_date, join_timestamp, status, predicted_service_minutes,
                    estimated_wait_minutes, position, serve_start_time, serve_end_time, actual_service_minutes,
                    medical_condition, pre_existing_condition, complexity_score, prescription_notes,
                    parent_ticket_id, transferred_from_dept, source, effective_timestamp,
                    adjustment_count, last_adjusted_at, cancellation_reason, cancelled_at, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, NOW()
                )
                ON CONFLICT (ticket_id) DO UPDATE SET
                    hospital_id = EXCLUDED.hospital_id,
                    department_id = EXCLUDED.department_id,
                    patient_id = EXCLUDED.patient_id,
                    appointment_id = EXCLUDED.appointment_id,
                    consumer_type = EXCLUDED.consumer_type,
                    service_category = EXCLUDED.service_category,
                    name = EXCLUDED.name,
                    priority_level = EXCLUDED.priority_level,
                    queue_date = EXCLUDED.queue_date,
                    status = EXCLUDED.status,
                    predicted_service_minutes = EXCLUDED.predicted_service_minutes,
                    estimated_wait_minutes = EXCLUDED.estimated_wait_minutes,
                    position = EXCLUDED.position,
                    serve_start_time = EXCLUDED.serve_start_time,
                    serve_end_time = EXCLUDED.serve_end_time,
                    actual_service_minutes = EXCLUDED.actual_service_minutes,
                    prescription_notes = EXCLUDED.prescription_notes,
                    transferred_from_dept = EXCLUDED.transferred_from_dept,
                    effective_timestamp = EXCLUDED.effective_timestamp,
                    adjustment_count = EXCLUDED.adjustment_count,
                    last_adjusted_at = EXCLUDED.last_adjusted_at,
                    cancellation_reason = EXCLUDED.cancellation_reason,
                    cancelled_at = EXCLUDED.cancelled_at,
                    updated_at = NOW();
            """, (
                ticket.ticket_id,
                hid,
                dept_id,
                pid,
                apt_id,
                ticket.consumer_type,
                ticket.service_category,
                ticket.name,
                ticket.priority_level,
                q_date,
                join_dt,
                ticket.status,
                ticket.predicted_service_minutes,
                ticket.estimated_wait_minutes,
                ticket.position or 0,
                start_dt,
                end_dt,
                ticket.actual_service_minutes,
                getattr(ticket, "medical_condition", "general_checkup"),
                getattr(ticket, "pre_existing_condition", "none"),
                getattr(ticket, "complexity_score", 1.0),
                getattr(ticket, "prescription_notes", ""),
                getattr(ticket, "parent_ticket_id", ""),
                getattr(ticket, "transferred_from_dept", ""),
                "patient_portal",
                eff_dt,
                getattr(ticket, "adjustment_count", 0),
                last_adj,
                getattr(ticket, "cancellation_reason", ""),
                canc_at,
                join_dt
            ))

            # Sync linked appointments status if any
            if ticket.status in ("serving", "completed", "transferred", "no_show", "cancelled", "expired"):
                conn.execute("""
                    UPDATE appointments
                    SET status = %s, updated_at = NOW()
                    WHERE ticket_id = %s OR (ticket_id != '' AND ticket_id = %s);
                """, (ticket.status, ticket.ticket_id, getattr(ticket, "parent_ticket_id", "")))

    def _log_completed_service_db(self, ticket: Ticket, queue_length: int, active_counters: int):
        """Records completed clinical encounter into service_logs for analytics and ML training."""
        join_dt = datetime.fromtimestamp(ticket.join_timestamp, tz=timezone.utc)
        hour_of_day = join_dt.hour
        day_of_week = join_dt.weekday()
        is_peak = 1 if hour_of_day in (9, 10, 11, 14, 15, 16) and day_of_week < 5 else 0
        q_date = parse_queue_date(getattr(ticket, "queue_date", None))

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, ticket.tenant_id)
            dept_id = self._resolve_department_id(conn, hid, ticket.service_category)

            conn.execute("""
                INSERT INTO service_logs (
                    hospital_id, ticket_id, department_id, consumer_type, service_category, queue_date,
                    hour_of_day, day_of_week, queue_length, active_staff_counters, is_peak_hour,
                    complexity_score, historical_avg_speed, service_duration_minutes, completed_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW());
            """, (
                hid,
                ticket.ticket_id,
                dept_id,
                ticket.consumer_type,
                ticket.service_category,
                q_date,
                hour_of_day,
                day_of_week,
                queue_length,
                active_counters,
                is_peak,
                getattr(ticket, "complexity_score", 1.0),
                15.0,
                ticket.actual_service_minutes or ticket.predicted_service_minutes or 10.0
            ))

    # ------------------------------------------------------------------
    # Ingestion & In-Memory Hydration
    # ------------------------------------------------------------------
    def save_tenant_mapping(self, tenant_id: str, mapping: dict):
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            conn.execute("""
                INSERT INTO tenant_mapping (hospital_id, legacy_tenant_id, mapping_json, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (hospital_id) DO UPDATE SET
                    mapping_json = EXCLUDED.mapping_json,
                    updated_at = NOW();
            """, (hid, tenant_id, json.dumps(mapping)))

    def get_tenant_mapping(self, tenant_id: str) -> dict:
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            row = conn.execute("SELECT mapping_json FROM tenant_mapping WHERE hospital_id = %s", (hid,)).fetchone()
            if row and row[0]:
                try:
                    return json.loads(row[0]) if isinstance(row[0], str) else row[0]
                except Exception:
                    return {}
        return {}

    def save_historical_records(self, tenant_id: str, df: pd.DataFrame) -> int:
        if df is None or len(df) == 0:
            return 0

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            records = []
            for _, r in df.iterrows():
                ts_val = ts_to_dt(r.get("timestamp")) if "ts_to_dt" in globals() else None
                q_date = parse_queue_date(r.get("queue_date") or ts_val)
                records.append((
                    hid,
                    tenant_id,
                    r.get("consumer_type", "hospital"),
                    q_date,
                    ts_val,
                    int(r.get("queue_length", 1)),
                    int(r.get("active_staff_counters", 2)),
                    str(r.get("service_category", "consultation")),
                    float(r.get("service_duration_minutes", 12.0)),
                    float(r.get("complexity_score", 1.0)),
                    int(r.get("hour_of_day", 12)),
                    int(r.get("day_of_week", 1)),
                    int(r.get("is_peak_hour", 0)),
                ))

            conn.executemany("""
                INSERT INTO tenant_historical_data (
                    hospital_id, legacy_tenant_id, consumer_type, queue_date, timestamp, queue_length,
                    active_staff_counters, service_category, service_duration_minutes,
                    complexity_score, hour_of_day, day_of_week, is_peak_hour, imported_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW());
            """, records)

        return len(df)

    def get_historical_records(self, tenant_id: str) -> List[dict]:
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            rows1 = conn.execute("""
                SELECT consumer_type, service_category, queue_length, active_staff_counters,
                       service_duration_minutes, complexity_score, hour_of_day, day_of_week, is_peak_hour
                FROM tenant_historical_data
                WHERE hospital_id = %s OR legacy_tenant_id = %s
            """, (hid, tenant_id)).fetchall()

            rows2 = conn.execute("""
                SELECT consumer_type, service_category, queue_length, active_staff_counters,
                       service_duration_minutes, complexity_score, hour_of_day, day_of_week, is_peak_hour
                FROM service_logs
                WHERE hospital_id = %s
            """, (hid,)).fetchall()

            combined = [dict(r) for r in rows1] + [dict(r) for r in rows2]
            return combined

    def _hydrate_from_db(self):
        """Loads only today's active waiting and serving tickets into in-memory heaps on startup."""
        try:
            # 1. Close and expire unvisited previous day queues first
            self.close_and_expire_previous_day_queues()

            today = get_current_queue_date()
            with self._get_db() as conn:
                # Load configs
                cfgs = conn.execute("""
                    SELECT h.hospital_code, tc.active_counters
                    FROM tenant_config tc
                    JOIN hospitals h ON h.id = tc.hospital_id
                """).fetchall()
                for r in cfgs:
                    self._get_tenant(r["hospital_code"])["active_counters"] = int(r["active_counters"])

                # Reset all tenant in-memory queues for today
                for tid in list(self._tenants.keys()):
                    self._tenants[tid]["queue"] = []
                    self._tenants[tid]["tickets"] = {}

                # Load active tickets strictly for CURRENT_DATE
                tickets = conn.execute("""
                    SELECT t.*, h.hospital_code
                    FROM tickets t
                    JOIN hospitals h ON h.id = t.hospital_id
                    WHERE t.queue_date = %s AND t.status IN ('waiting', 'serving', 'called')
                    ORDER BY t.priority_level ASC, t.join_timestamp ASC
                """, (today,)).fetchall()

                for r in tickets:
                    t_dict = dict(r)
                    hcode = t_dict.get("hospital_code") or "city-hospital-01"
                    join_ts = dt_to_epoch(t_dict.get("join_timestamp"))
                    eff_ts = dt_to_epoch(t_dict.get("effective_timestamp")) or join_ts
                    start_ts = dt_to_epoch(t_dict.get("serve_start_time")) if t_dict.get("serve_start_time") else None
                    end_ts = dt_to_epoch(t_dict.get("serve_end_time")) if t_dict.get("serve_end_time") else None
                    q_date_str = str(t_dict.get("queue_date") or today)

                    t = Ticket(
                        ticket_id=str(t_dict["ticket_id"]),
                        tenant_id=hcode,
                        consumer_type=t_dict.get("consumer_type", "hospital"),
                        service_category=t_dict.get("service_category", "consultation"),
                        name=t_dict.get("name", "Patient"),
                        priority_level=int(t_dict.get("priority_level") or 2),
                        join_timestamp=join_ts,
                        queue_date=q_date_str,
                        appointment_id=t_dict.get("appointment_id"),
                        effective_timestamp=eff_ts,
                        user_email="",
                        age=int(t_dict.get("age") or 30),
                        gender=t_dict.get("gender", "other"),
                        medical_condition=t_dict.get("medical_condition", "general_checkup"),
                        pre_existing_condition=t_dict.get("pre_existing_condition", "none"),
                        complexity_score=float(t_dict.get("complexity_score") or 1.0),
                        prescription_notes=t_dict.get("prescription_notes", ""),
                        parent_ticket_id=t_dict.get("parent_ticket_id", ""),
                        transferred_from_dept=t_dict.get("transferred_from_dept", ""),
                        status=t_dict.get("status", "waiting"),
                        predicted_service_minutes=float(t_dict.get("predicted_service_minutes") or 10.0),
                        estimated_wait_minutes=float(t_dict.get("estimated_wait_minutes") or 0.0),
                        position=int(t_dict.get("position") or 0),
                        serve_start_time=start_ts,
                        serve_end_time=end_ts,
                        actual_service_minutes=float(t_dict["actual_service_minutes"]) if t_dict.get("actual_service_minutes") is not None else None,
                        adjustment_count=int(t_dict.get("adjustment_count") or 0),
                        cancellation_reason=t_dict.get("cancellation_reason", ""),
                    )

                    tenant = self._get_tenant(hcode)
                    tenant["tickets"][t.ticket_id] = t
                    if t.status in ("waiting", "called"):
                        heapq.heappush(tenant["queue"], (t.priority_level, eff_ts, t.ticket_id))

            # Recalculate wait times and restart positions from #1 for all initialized tenants
            for tid in list(self._tenants.keys()):
                self.recalculate_wait_times(tid)

            print(f"[Daily Queue Hydration] Loaded today ({today}) active queues for {len(self._tenants)} hospital tenants.")
        except Exception as e:
            print(f"[Hydration] Note during startup: {e}")
            print(f"[Hydration] Note during startup: {e}")

    def _get_tenant(self, tenant_id: str) -> dict:
        tid = (tenant_id or "city-hospital-01").strip()
        if tid not in self._tenants:
            self._tenants[tid] = {
                "queue": [],
                "tickets": {},
                "active_counters": 2,
            }
        return self._tenants[tid]

    # ------------------------------------------------------------------
    # AI/ML Model Loading & Service Duration Prediction
    # ------------------------------------------------------------------
    def _load_model_bundle(self, tenant_id: str) -> dict:
        if tenant_id in self._models_cache:
            return self._models_cache[tenant_id]

        model_path = os.path.join(MODELS_DIR, tenant_id, "queue_predictor.pkl")
        meta_path = os.path.join(MODELS_DIR, tenant_id, "metadata.json")

        if not os.path.exists(model_path):
            model_path = os.path.join(MODELS_DIR, "global", "queue_predictor.pkl")
            meta_path = os.path.join(MODELS_DIR, "global", "metadata.json")

        bundle = None
        if os.path.exists(model_path):
            try:
                bundle = joblib.load(model_path)
            except Exception as e:
                print(f"[ML Engine] Failed loading model from {model_path}: {e}")

        meta = {}
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
            except Exception:
                meta = {}

        result = {"bundle": bundle, "metadata": meta}
        self._models_cache[tenant_id] = result
        return result

    def _predict_service_minutes(self, tenant_id: str, features: dict) -> float:
        bundle_info = self._load_model_bundle(tenant_id)
        bundle = bundle_info.get("bundle")

        if bundle and isinstance(bundle, dict) and "model" in bundle:
            try:
                model = bundle["model"]
                feature_names = bundle.get("feature_names", [])

                cat = features.get("service_category", "consultation")
                queue_len = features.get("queue_length", 1)
                active_counters = features.get("active_staff_counters", 2)
                complexity = features.get("complexity_score", 1.0)
                hour = features.get("hour_of_day", 12)
                day = features.get("day_of_week", 1)

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
                    "staff_load_ratio": queue_len / max(1, active_counters),
                    "effective_workload": (queue_len * complexity) / max(1, active_counters),
                    "counter_capacity_index": active_counters / (queue_len + 1.0),
                }

                # One-hot encode category if required
                for col in feature_names:
                    if col.startswith("cat_"):
                        target_cat = col.replace("cat_", "")
                        row[col] = 1 if cat == target_cat else 0

                df_feat = pd.DataFrame([row])
                for col in feature_names:
                    if col not in df_feat.columns:
                        df_feat[col] = 0

                df_feat = df_feat[feature_names]
                pred = float(model.predict(df_feat)[0])
                return max(3.0, min(90.0, round(pred, 1)))
            except Exception as e:
                pass

        # Clinical heuristic fallback
        base_durations = {
            "emergency": 25.0,
            "consultation": 15.0,
            "radiology": 20.0,
            "laboratory": 10.0,
            "pharmacy": 6.0,
            "billing": 5.0,
        }
        base = base_durations.get(features.get("service_category", "consultation"), 15.0)
        complexity = features.get("complexity_score", 1.0)
        return round(base * complexity, 1)

    # ------------------------------------------------------------------
    # Core Queue Lifecycle Operations
    # ------------------------------------------------------------------
    def set_active_counters(self, tenant_id: str, count: int) -> int:
        count = max(1, count)
        tenant = self._get_tenant(tenant_id)
        tenant["active_counters"] = count

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            conn.execute("""
                INSERT INTO tenant_config (hospital_id, legacy_tenant_id, active_counters, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (hospital_id) DO UPDATE SET
                    active_counters = EXCLUDED.active_counters,
                    updated_at = NOW();
            """, (hid, tenant_id, count))

        self.recalculate_wait_times(tenant_id)
        return count

    def join_queue(
        self,
        tenant_id: str,
        consumer_type: str,
        service_category: str,
        name: str,
        priority_level: int = PRIORITY_ROUTINE,
        user_email: str = "",
        age: int = 30,
        gender: str = "other",
        medical_condition: str = "general_checkup",
        pre_existing_condition: str = "none",
        patient_id: Optional[int] = None,
        queue_date: Optional[Union[str, date]] = None,
        appointment_id: Optional[str] = None,
        status: str = "waiting",
    ) -> Ticket:
        tenant = self._get_tenant(tenant_id)
        now = time.time()
        ticket_id = f"T{next(self._id_counter):04d}"
        q_date = parse_queue_date(queue_date)
        today = get_current_queue_date()
        is_today_active = (q_date == today and status == "waiting")

        complexity = compute_clinical_complexity(
            age=age,
            gender=gender,
            medical_condition=medical_condition,
            pre_existing_condition=pre_existing_condition,
            priority_level=priority_level,
        )

        dt_now = datetime.fromtimestamp(now, tz=timezone.utc)
        predicted_service = self._predict_service_minutes(tenant_id, {
            "service_category": service_category,
            "queue_length": len(tenant["queue"]) + 1 if is_today_active else 1,
            "active_staff_counters": tenant["active_counters"],
            "complexity_score": complexity,
            "hour_of_day": dt_now.hour,
            "day_of_week": dt_now.weekday(),
        })

        initial_pos = (len(tenant["queue"]) + 1) if is_today_active else 0

        ticket = Ticket(
            ticket_id=ticket_id,
            tenant_id=tenant_id,
            consumer_type=consumer_type,
            service_category=service_category,
            name=name,
            priority_level=priority_level,
            join_timestamp=now,
            queue_date=str(q_date),
            appointment_id=appointment_id,
            effective_timestamp=now,
            user_email=user_email,
            age=age,
            gender=gender,
            medical_condition=medical_condition,
            pre_existing_condition=pre_existing_condition,
            complexity_score=complexity,
            predicted_service_minutes=predicted_service,
            status=status,
            position=initial_pos if is_today_active else None,
            explicit_patient_id=patient_id,
        )

        if is_today_active:
            tenant["tickets"][ticket_id] = ticket
            heapq.heappush(tenant["queue"], (priority_level, now, ticket_id))

        # Persist and emit event
        self._save_ticket_db(ticket)
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            event_name = "QUEUE_JOINED" if is_today_active else "SCHEDULED"
            self._log_queue_event(
                conn, hid, ticket_id, event_name, None, status,
                old_position=None, new_position=ticket.position,
                metadata={"complexity": complexity, "predicted_service": predicted_service, "queue_date": str(q_date)}
            )

        if is_today_active:
            self.recalculate_wait_times(tenant_id)
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
                r = conn.execute("SELECT * FROM tickets WHERE ticket_id = %s", (ticket_id,)).fetchone()
                if r:
                    d = dict(r)
                    orig_ticket = Ticket(
                        ticket_id=d["ticket_id"],
                        tenant_id=tenant_id,
                        consumer_type=d.get("consumer_type", "hospital"),
                        service_category=d.get("service_category", "consultation"),
                        name=d.get("name", "Patient"),
                        priority_level=int(d.get("priority_level") or 2),
                        join_timestamp=dt_to_epoch(d.get("join_timestamp")),
                        queue_date=str(d.get("queue_date") or get_current_queue_date()),
                        appointment_id=d.get("appointment_id"),
                        status=d.get("status", "serving"),
                    )

        if not orig_ticket:
            raise ValueError(f"Ticket #{ticket_id} not found.")

        # 1. Complete original ticket
        orig_ticket.status = "transferred"
        orig_ticket.serve_end_time = time.time()
        orig_ticket.actual_service_minutes = round((orig_ticket.serve_end_time - (orig_ticket.serve_start_time or orig_ticket.join_timestamp)) / 60.0, 1)
        orig_ticket.prescription_notes = prescription_notes
        self._save_ticket_db(orig_ticket)

        # 2. Create target ticket
        now = time.time()
        new_tid = f"T{next(self._id_counter):04d}"
        today = get_current_queue_date()
        target_q_date = orig_ticket.queue_date or str(today)

        new_ticket = Ticket(
            ticket_id=new_tid,
            tenant_id=tenant_id,
            consumer_type=orig_ticket.consumer_type,
            service_category=target_department,
            name=orig_ticket.name,
            priority_level=orig_ticket.priority_level,
            join_timestamp=now,
            queue_date=target_q_date,
            appointment_id=orig_ticket.appointment_id,
            effective_timestamp=now,
            user_email=orig_ticket.user_email,
            age=orig_ticket.age,
            gender=orig_ticket.gender,
            medical_condition=orig_ticket.medical_condition,
            pre_existing_condition=orig_ticket.pre_existing_condition,
            complexity_score=orig_ticket.complexity_score,
            prescription_notes=prescription_notes,
            parent_ticket_id=orig_ticket.ticket_id,
            transferred_from_dept=orig_ticket.service_category,
            predicted_service_minutes=10.0,
            status="waiting",
            position=len(tenant["queue"]) + 1,
        )

        tenant["tickets"][new_tid] = new_ticket
        heapq.heappush(tenant["queue"], (new_ticket.priority_level, now, new_tid))
        self._save_ticket_db(new_ticket)

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            self._log_queue_event(
                conn, hid, orig_ticket.ticket_id, "TRANSFERRED", "serving", "transferred",
                metadata={"transferred_to_ticket": new_tid, "target_dept": target_department, "queue_date": target_q_date}
            )
            self._log_queue_event(
                conn, hid, new_tid, "QUEUE_JOINED", None, "waiting",
                metadata={"transferred_from": orig_ticket.ticket_id, "from_dept": orig_ticket.service_category, "queue_date": target_q_date}
            )

        self._rebuild_heap(tenant_id)
        self.recalculate_wait_times(tenant_id)
        return orig_ticket, new_ticket

    def serve_next(
        self,
        tenant_id: str,
        service_category: Optional[str] = None,
        department: Optional[str] = None,
        desk_id: Optional[int] = None
    ) -> Optional[Ticket]:
        tenant = self._get_tenant(tenant_id)
        now = time.time()
        filter_dept = (department or service_category or "").strip().lower()
        today = get_current_queue_date()

        # Department-scoped queue serving strictly for today's date
        temp_popped = []
        found_ticket = None

        while tenant["queue"]:
            prio, eff_ts, tid = heapq.heappop(tenant["queue"])
            t = tenant["tickets"].get(tid)

            if not t or t.status != "waiting":
                continue

            # Verify queue date is today
            if parse_queue_date(getattr(t, "queue_date", None)) != today:
                continue

            if filter_dept and t.service_category.strip().lower() != filter_dept:
                temp_popped.append((prio, eff_ts, tid))
                continue

            found_ticket = t
            break

        for item in temp_popped:
            heapq.heappush(tenant["queue"], item)

        if not found_ticket:
            return None

        found_ticket.status = "serving"
        found_ticket.serve_start_time = now
        found_ticket.position = 0

        self._save_ticket_db(found_ticket)

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            self._log_queue_event(
                conn, hid, found_ticket.ticket_id, "CALLED", "waiting", "serving",
                old_position=1, new_position=0, metadata={"desk_id": desk_id, "queue_date": str(today)}
            )

        self.recalculate_wait_times(tenant_id)
        return found_ticket

    def complete_ticket(self, tenant_id: str, ticket_id: str, department: Optional[str] = None) -> Optional[Ticket]:
        tenant = self._get_tenant(tenant_id)
        ticket = tenant["tickets"].get(ticket_id)

        if not ticket:
            with self._get_db() as conn:
                r = conn.execute("SELECT * FROM tickets WHERE ticket_id = %s", (ticket_id,)).fetchone()
                if r:
                    d = dict(r)
                    ticket = Ticket(
                        ticket_id=d["ticket_id"],
                        tenant_id=tenant_id,
                        consumer_type=d.get("consumer_type", "hospital"),
                        service_category=d.get("service_category", "consultation"),
                        name=d.get("name", "Patient"),
                        priority_level=int(d.get("priority_level") or 2),
                        join_timestamp=dt_to_epoch(d.get("join_timestamp")),
                        queue_date=str(d.get("queue_date") or get_current_queue_date()),
                        appointment_id=d.get("appointment_id"),
                        status=d.get("status", "serving"),
                    )

        if not ticket:
            return None

        ticket.status = "completed"
        ticket.serve_end_time = time.time()
        start = ticket.serve_start_time or ticket.join_timestamp
        ticket.actual_service_minutes = round((ticket.serve_end_time - start) / 60.0, 1)

        self._save_ticket_db(ticket)
        self._log_completed_service_db(ticket, len(tenant["queue"]), tenant["active_counters"])

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            self._log_queue_event(
                conn, hid, ticket.ticket_id, "COMPLETED", "serving", "completed",
                metadata={"service_minutes": ticket.actual_service_minutes, "queue_date": getattr(ticket, "queue_date", str(get_current_queue_date()))}
            )

        self.recalculate_wait_times(tenant_id)
        return ticket

    def mark_no_show(self, tenant_id: str, ticket_id: str):
        tenant = self._get_tenant(tenant_id)
        ticket = tenant["tickets"].get(ticket_id)
        if ticket:
            ticket.status = "no_show"
            ticket.serve_end_time = time.time()
            self._save_ticket_db(ticket)
            with self._get_db() as conn:
                hid = self._resolve_hospital_id(conn, tenant_id)
                self._log_queue_event(conn, hid, ticket.ticket_id, "NO_SHOW", "serving", "no_show", metadata={"queue_date": getattr(ticket, "queue_date", str(get_current_queue_date()))})

        self._rebuild_heap(tenant_id)
        self.recalculate_wait_times(tenant_id)

    def cancel_ticket(
        self,
        tenant_id: str,
        ticket_id: str,
        reason: str = "No longer available",
        user_email: Optional[str] = None
    ) -> Ticket:
        clean_tenant = (tenant_id or "city-hospital-01").strip()
        tenant = self._get_tenant(clean_tenant)

        performed_by_uid = None
        canc_time = time.time()
        canc_dt = datetime.fromtimestamp(canc_time, tz=timezone.utc)

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, clean_tenant)

            # Transactional row lock on target ticket
            row = conn.execute("""
                SELECT t.id, t.ticket_id, t.hospital_id, t.patient_id, t.department_id,
                       t.service_category, t.status, t.position, t.priority_level, t.queue_date,
                       h.hospital_code
                FROM tickets t
                JOIN hospitals h ON h.id = t.hospital_id
                WHERE t.ticket_id = %s
                FOR UPDATE;
            """, (ticket_id,)).fetchone()

            if not row:
                raise ValueError(f"Ticket #{ticket_id} not found.")

            t_dict = dict(row)

            # 1. Hospital Tenant Isolation Check
            if t_dict["hospital_id"] != hid:
                raise PermissionError("Forbidden: Ticket does not belong to this hospital.")

            # 2. Patient Ownership Check
            if user_email:
                performed_by_uid = self._verify_ticket_ownership(conn, ticket_id, user_email, hid)

            # 3. Status Validation: WAITING or SCHEDULED tickets can be cancelled
            curr_status = (t_dict.get("status") or "").lower()
            if curr_status not in ("waiting", "scheduled"):
                raise ValueError(f"Cannot cancel ticket: Ticket status is '{curr_status.upper()}'. Only WAITING or SCHEDULED tickets can be cancelled.")

            old_pos = t_dict.get("position") or 0
            dept_id = t_dict.get("department_id")
            service_cat = t_dict.get("service_category")
            q_date = t_dict.get("queue_date")

            # 4. Update Ticket status in PostgreSQL
            conn.execute("""
                UPDATE tickets
                SET status = 'cancelled',
                    position = 0,
                    cancelled_at = %s,
                    cancellation_reason = %s,
                    updated_at = NOW()
                WHERE ticket_id = %s;
            """, (canc_dt, reason, ticket_id))

            # 5. Shift remaining waiting tickets in database to prevent gaps for that date and department
            if old_pos > 0 and curr_status == "waiting":
                if dept_id:
                    conn.execute("""
                        UPDATE tickets
                        SET position = position - 1, updated_at = NOW()
                        WHERE hospital_id = %s AND department_id = %s AND queue_date = %s AND status = 'waiting' AND position > %s;
                    """, (hid, dept_id, q_date, old_pos))
                else:
                    conn.execute("""
                        UPDATE tickets
                        SET position = position - 1, updated_at = NOW()
                        WHERE hospital_id = %s AND service_category = %s AND queue_date = %s AND status = 'waiting' AND position > %s;
                    """, (hid, service_cat, q_date, old_pos))

            # 6. Record Queue Lifecycle Event
            self._log_queue_event(
                conn, hid, ticket_id, "CANCEL", curr_status, "cancelled",
                old_position=old_pos, new_position=None,
                performed_by_user_id=performed_by_uid,
                metadata={"reason": reason, "queue_date": str(q_date)}
            )

        # Synchronize In-Memory State
        if ticket_id in tenant["tickets"]:
            tenant["tickets"][ticket_id].status = "cancelled"
            tenant["tickets"][ticket_id].cancelled_at = canc_time
            tenant["tickets"][ticket_id].cancellation_reason = reason
            tenant["tickets"][ticket_id].position = 0
            self._rebuild_heap(clean_tenant)
            self.recalculate_wait_times(clean_tenant)
            return tenant["tickets"][ticket_id]

        t_res = Ticket(
            ticket_id=ticket_id,
            tenant_id=clean_tenant,
            consumer_type=t_dict.get("consumer_type", "hospital"),
            service_category=service_cat or "consultation",
            name="Patient",
            priority_level=int(t_dict.get("priority_level") or 2),
            join_timestamp=canc_time,
            queue_date=str(q_date),
            status="cancelled",
            position=0,
            cancelled_at=canc_time,
            cancellation_reason=reason,
        )
        return t_res

    def adjust_queue_position(
        self,
        tenant_id: str,
        ticket_id: str,
        skip_positions: int = 1,
        user_email: Optional[str] = None,
        reason: str = "Late arrival"
    ) -> dict:
        clean_tenant = (tenant_id or "city-hospital-01").strip()
        tenant = self._get_tenant(clean_tenant)
        skip_positions = int(skip_positions)

        if skip_positions <= 0:
            raise ValueError("Adjustment must be a positive integer (cannot move forward or 0).")

        performed_by_uid = None
        now = time.time()
        adj_dt = datetime.fromtimestamp(now, tz=timezone.utc)
        today = get_current_queue_date()

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, clean_tenant)

            row = conn.execute("""
                SELECT t.id, t.ticket_id, t.hospital_id, t.patient_id, t.department_id,
                       t.service_category, t.status, t.position, t.priority_level,
                       t.join_timestamp, t.effective_timestamp, t.adjustment_count, t.queue_date,
                       h.hospital_code
                FROM tickets t
                JOIN hospitals h ON h.id = t.hospital_id
                WHERE t.ticket_id = %s
                FOR UPDATE;
            """, (ticket_id,)).fetchone()

            if not row:
                raise ValueError(f"Ticket #{ticket_id} not found.")

            t_dict = dict(row)

            # 1. Isolation check
            if t_dict["hospital_id"] != hid:
                raise PermissionError("Forbidden: Ticket does not belong to this hospital.")

            # 2. Ownership check
            if user_email:
                performed_by_uid = self._verify_ticket_ownership(conn, ticket_id, user_email, hid)

            # 3. Status Validation
            if (t_dict.get("status") or "").lower() != "waiting":
                raise ValueError(f"Cannot adjust queue position: Ticket status is '{t_dict.get('status')}'. Only WAITING tickets can be adjusted.")

            # 4. Adjustment limit check
            current_adj_count = int(t_dict.get("adjustment_count") or 0)
            if current_adj_count + skip_positions > MAX_PATIENT_QUEUE_ADJUSTMENT:
                remaining = max(0, MAX_PATIENT_QUEUE_ADJUSTMENT - current_adj_count)
                raise ValueError(f"Queue adjustment limit exceeded. You requested to skip {skip_positions} position(s), but only {remaining} position adjustment(s) remain (maximum allowed: {MAX_PATIENT_QUEUE_ADJUSTMENT}).")

            previous_position = int(t_dict.get("position") or 1)
            dept_id = t_dict.get("department_id")
            service_cat = t_dict.get("service_category")
            q_date = t_dict.get("queue_date") or today

            # 5. Calculate new effective timestamp to move precisely skip_positions behind
            dept_waiting = [
                t for t in tenant["tickets"].values()
                if (t.service_category == service_cat) and t.status == "waiting" and parse_queue_date(getattr(t, "queue_date", None)) == today
            ]
            dept_waiting.sort(key=lambda x: (x.priority_level, getattr(x, "effective_timestamp", x.join_timestamp)))

            curr_idx = None
            for idx, item in enumerate(dept_waiting):
                if item.ticket_id == ticket_id:
                    curr_idx = idx
                    break

            if curr_idx is not None and (curr_idx + skip_positions) < len(dept_waiting):
                target_t = dept_waiting[curr_idx + skip_positions]
                target_eff = getattr(target_t, "effective_timestamp", target_t.join_timestamp)
                new_eff = target_eff + 0.001
            else:
                if dept_waiting:
                    last_eff = max(getattr(t, "effective_timestamp", t.join_timestamp) for t in dept_waiting)
                    new_eff = last_eff + (skip_positions * 1.0)
                else:
                    curr_eff = dt_to_epoch(t_dict.get("effective_timestamp")) or dt_to_epoch(t_dict.get("join_timestamp"))
                    new_eff = max(time.time(), curr_eff) + (skip_positions * 1800)

            eff_dt = datetime.fromtimestamp(new_eff, tz=timezone.utc)
            new_adj_count = current_adj_count + skip_positions

            new_position = previous_position + skip_positions

            # 6. Update database
            conn.execute("""
                UPDATE tickets
                SET effective_timestamp = %s,
                    adjustment_count = %s,
                    last_adjusted_at = %s,
                    updated_at = NOW()
                WHERE ticket_id = %s;
            """, (eff_dt, new_adj_count, adj_dt, ticket_id))

            # 7. Record Queue Lifecycle Event
            self._log_queue_event(
                conn, hid, ticket_id, "ADJUST", "waiting", "waiting",
                old_position=previous_position, new_position=new_position,
                performed_by_user_id=performed_by_uid,
                metadata={
                    "adjusted_by": "patient",
                    "positions_moved": skip_positions,
                    "reason": reason,
                    "queue_date": str(q_date)
                }
            )

        # Synchronize In-Memory Queue State
        ticket = tenant["tickets"].get(ticket_id)
        if not ticket:
            ticket = Ticket(
                ticket_id=ticket_id,
                tenant_id=clean_tenant,
                consumer_type=t_dict.get("consumer_type", "hospital"),
                service_category=t_dict.get("service_category", "consultation"),
                name=t_dict.get("name", "Patient"),
                priority_level=int(t_dict.get("priority_level") or 2),
                join_timestamp=dt_to_epoch(t_dict.get("join_timestamp")),
                queue_date=str(q_date),
                effective_timestamp=new_eff,
                status="waiting",
                adjustment_count=new_adj_count,
            )
            tenant["tickets"][ticket_id] = ticket
        else:
            ticket.effective_timestamp = new_eff
            ticket.adjustment_count = new_adj_count
            ticket.last_adjusted_at = time.time()

        self._rebuild_heap(clean_tenant)
        self.recalculate_wait_times(clean_tenant)

        final_pos = ticket.position
        remaining_adj = MAX_PATIENT_QUEUE_ADJUSTMENT - new_adj_count

        return {
            "success": True,
            "status": "success",
            "ticket_id": ticket_id,
            "old_position": previous_position,
            "new_position": final_pos,
            "requested_skip": skip_positions,
            "actual_skip": skip_positions,
            "positions": skip_positions,
            "adjustment_count": new_adj_count,
            "remaining_adjustment": remaining_adj,
            "ticket": ticket.to_dict(),
            "message": f"Successfully postponed queue position by {skip_positions} position(s). New position is #{final_pos}."
        }

    def _rebuild_heap(self, tenant_id: str):
        tenant = self._get_tenant(tenant_id)
        today = get_current_queue_date()
        new_queue = [
            (t.priority_level, getattr(t, "effective_timestamp", t.join_timestamp), t.ticket_id)
            for t in tenant["tickets"].values()
            if t.status == "waiting" and parse_queue_date(getattr(t, "queue_date", None)) == today
        ]
        heapq.heapify(new_queue)
        tenant["queue"] = new_queue

    def recalculate_wait_times(self, tenant_id: str) -> List[Ticket]:
        """Calculates independent queue positions starting from #1 for today's active tickets."""
        tenant = self._get_tenant(tenant_id)
        active_counters = tenant["active_counters"]
        today = get_current_queue_date()

        waiting = [
            t for t in tenant["tickets"].values()
            if t.status == "waiting" and parse_queue_date(getattr(t, "queue_date", None)) == today
        ]
        waiting.sort(key=lambda t: (t.priority_level, getattr(t, "effective_timestamp", t.join_timestamp)))

        cumulative_by_group: Dict[str, float] = {}
        dept_positions: Dict[str, int] = {}
        updated = []

        for t in waiting:
            group_key = t.service_category.strip().lower()
            dept_positions[group_key] = dept_positions.get(group_key, 0) + 1
            t.position = dept_positions[group_key]

            prev_wait = cumulative_by_group.get(group_key, 0.0)
            est = prev_wait + (t.predicted_service_minutes / max(1, active_counters))
            t.estimated_wait_minutes = round(est, 1)
            cumulative_by_group[group_key] = est
            updated.append(t)

        # Sync positions and wait times to PostgreSQL
        try:
            with self._get_db() as conn:
                hid = self._resolve_hospital_id(conn, tenant_id)
                for t in updated:
                    conn.execute("""
                        UPDATE tickets
                        SET position = %s, estimated_wait_minutes = %s, updated_at = NOW()
                        WHERE ticket_id = %s AND hospital_id = %s;
                    """, (t.position, t.estimated_wait_minutes, t.ticket_id, hid))
        except Exception as e:
            print(f"[WARN] Failed to sync wait times/positions to PostgreSQL: {e}")

        return updated

    def close_and_expire_previous_day_queues(
        self,
        target_date: Optional[Union[str, date]] = None,
        hospital_code: Optional[str] = None
    ) -> dict:
        """Closes daily queues for past dates, transitioning unserved tickets and appointments to EXPIRED.
        Idempotent, transaction-safe, and hospital-isolated.
        Uses PostgreSQL advisory lock to prevent race conditions across multiple worker instances."""
        current_today = parse_queue_date(target_date) if target_date else get_current_queue_date()

        expired_tickets_count = 0
        expired_appointments_count = 0

        with self._get_db() as conn:
            # 1. Multi-instance distributed lock via PostgreSQL transaction advisory lock
            try:
                locked = conn.execute("SELECT pg_try_advisory_xact_lock(88472910)").fetchone()[0]
                if not locked:
                    return {
                        "status": "skipped",
                        "reason": "concurrent_lock_active",
                        "current_queue_date": str(current_today),
                        "expired_tickets_count": 0,
                        "expired_appointments_count": 0
                    }
            except Exception:
                pass  # In case advisory lock is not supported

            hid_filter = None
            if hospital_code:
                hid_filter = self._resolve_hospital_id(conn, hospital_code)

            # 2. Find all previous-day tickets that are still in WAITING or SCHEDULED or CALLED status
            t_query = """
                SELECT t.id, t.ticket_id, t.hospital_id, t.department_id, t.status, t.position, t.queue_date, t.appointment_id, h.hospital_code
                FROM tickets t
                JOIN hospitals h ON h.id = t.hospital_id
                WHERE t.queue_date < %s AND t.status IN ('waiting', 'scheduled', 'called')
            """
            params: list = [current_today]
            if hid_filter:
                t_query += " AND t.hospital_id = %s"
                params.append(hid_filter)
            t_query += " FOR UPDATE OF t"

            past_tickets = conn.execute(t_query, tuple(params)).fetchall()

            for pt in past_tickets:
                pt_dict = dict(pt)
                old_status = pt_dict.get("status")
                old_pos = pt_dict.get("position")
                t_id = pt_dict.get("ticket_id")
                h_id = pt_dict.get("hospital_id")
                q_date_val = str(pt_dict.get("queue_date"))

                # Transition to 'expired'
                conn.execute("""
                    UPDATE tickets
                    SET status = 'expired',
                        position = NULL,
                        updated_at = NOW()
                    WHERE id = %s;
                """, (pt_dict["id"],))

                # Write EXPIRE queue event
                self._log_queue_event(
                    conn,
                    h_id,
                    t_id,
                    "EXPIRE",
                    old_status=old_status,
                    new_status="expired",
                    old_position=old_pos,
                    new_position=None,
                    metadata={"reason": "daily_queue_closure", "queue_date": q_date_val}
                )
                expired_tickets_count += 1

            # 3. Find and expire previous-day appointments that were not visited/served
            a_query = """
                SELECT a.id, a.appointment_id, a.hospital_id, a.status, a.appointment_date
                FROM appointments a
                WHERE a.appointment_date < %s AND a.status IN ('scheduled', 'checked_in', 'waiting')
            """
            a_params: list = [current_today]
            if hid_filter:
                a_query += " AND a.hospital_id = %s"
                a_params.append(hid_filter)
            a_query += " FOR UPDATE OF a"

            past_apts = conn.execute(a_query, tuple(a_params)).fetchall()

            for pa in past_apts:
                pa_dict = dict(pa)
                conn.execute("""
                    UPDATE appointments
                    SET status = 'expired',
                        updated_at = NOW()
                    WHERE id = %s;
                """, (pa_dict["id"],))

                self._log_appointment_history(
                    conn,
                    pa_dict["appointment_id"],
                    pa_dict["status"],
                    "expired",
                    reason="daily_queue_closure"
                )
                expired_appointments_count += 1

        # 4. In-Memory state cleanup: purge expired tickets from memory heaps
        for tid, tenant_data in list(self._tenants.items()):
            to_remove = []
            for t_id, t_obj in tenant_data["tickets"].items():
                if parse_queue_date(getattr(t_obj, "queue_date", None)) < current_today or t_obj.status in ("expired", "completed", "cancelled", "no_show"):
                    to_remove.append(t_id)
            for t_id in to_remove:
                tenant_data["tickets"].pop(t_id, None)
            self._rebuild_heap(tid)
            self.recalculate_wait_times(tid)

        return {
            "status": "success",
            "current_queue_date": str(current_today),
            "expired_tickets_count": expired_tickets_count,
            "expired_appointments_count": expired_appointments_count,
        }

    def get_queue_snapshot(
        self,
        tenant_id: str,
        department: Optional[str] = None,
        queue_date: Optional[Union[str, date]] = None
    ) -> List[dict]:
        target_date = parse_queue_date(queue_date) if queue_date else get_current_queue_date()
        today = get_current_queue_date()
        dept_filter = (department or "").strip().lower()

        if target_date == today:
            tenant = self._get_tenant(tenant_id)
            waiting = [
                t for t in tenant["tickets"].values()
                if t.status in ("waiting", "called") and parse_queue_date(getattr(t, "queue_date", None)) == today
            ]
            waiting.sort(key=lambda t: (t.priority_level, getattr(t, "effective_timestamp", t.join_timestamp)))
            if dept_filter:
                waiting = [t for t in waiting if t.service_category.strip().lower() == dept_filter]
            return [t.to_dict() for t in waiting]

        # Query database for non-today date
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            query = """
                SELECT t.*, h.hospital_code
                FROM tickets t
                JOIN hospitals h ON h.id = t.hospital_id
                WHERE t.hospital_id = %s AND t.queue_date = %s AND t.status IN ('waiting', 'called')
            """
            params: list = [hid, target_date]
            if dept_filter:
                dept_id = self._resolve_department_id(conn, hid, dept_filter)
                query += " AND t.department_id = %s"
                params.append(dept_id)
            query += " ORDER BY t.priority_level ASC, t.join_timestamp ASC;"
            rows = conn.execute(query, tuple(params)).fetchall()
            return [dict(r) for r in rows]

    def get_serving_tickets(
        self,
        tenant_id: str,
        department: Optional[str] = None,
        queue_date: Optional[Union[str, date]] = None
    ) -> List[dict]:
        target_date = parse_queue_date(queue_date) if queue_date else get_current_queue_date()
        today = get_current_queue_date()
        dept_filter = (department or "").strip().lower()

        if target_date == today:
            tenant = self._get_tenant(tenant_id)
            serving = [
                t for t in tenant["tickets"].values()
                if t.status == "serving" and parse_queue_date(getattr(t, "queue_date", None)) == today
            ]
            if dept_filter:
                serving = [t for t in serving if t.service_category.strip().lower() == dept_filter]
            return [t.to_dict() for t in serving]

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            query = """
                SELECT t.*, h.hospital_code
                FROM tickets t
                JOIN hospitals h ON h.id = t.hospital_id
                WHERE t.hospital_id = %s AND t.queue_date = %s AND t.status = 'serving'
            """
            params: list = [hid, target_date]
            if dept_filter:
                dept_id = self._resolve_department_id(conn, hid, dept_filter)
                query += " AND t.department_id = %s"
                params.append(dept_id)
            rows = conn.execute(query, tuple(params)).fetchall()
            return [dict(r) for r in rows]

    def get_historical_queue_tickets(
        self,
        tenant_id: str,
        queue_date: Union[str, date],
        department: Optional[str] = None
    ) -> List[dict]:
        """Retrieves historical tickets for a given hospital, department, and queue_date."""
        target_date = parse_queue_date(queue_date)
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            query = """
                SELECT t.*, h.hospital_code, d.name as department_name
                FROM tickets t
                JOIN hospitals h ON h.id = t.hospital_id
                LEFT JOIN departments d ON d.id = t.department_id
                WHERE t.hospital_id = %s AND t.queue_date = %s
            """
            params: list = [hid, target_date]
            if department:
                dept_id = self._resolve_department_id(conn, hid, department)
                query += " AND t.department_id = %s"
                params.append(dept_id)

            query += " ORDER BY t.priority_level ASC, t.join_timestamp ASC;"
            rows = conn.execute(query, tuple(params)).fetchall()

            res = []
            for r in rows:
                d = dict(r)
                if hasattr(d.get("queue_date"), "isoformat"):
                    d["queue_date"] = d["queue_date"].isoformat()
                elif d.get("queue_date"):
                    d["queue_date"] = str(d["queue_date"])
                for ts_col in ("created_at", "updated_at", "join_timestamp", "serve_start_time", "serve_end_time", "cancelled_at"):
                    if d.get(ts_col) and hasattr(d[ts_col], "isoformat"):
                        d[ts_col] = d[ts_col].isoformat()
                res.append(d)
            return res

    def get_tickets_needing_turn_alert(self, tenant_id: str) -> List[dict]:
        snapshot = self.get_queue_snapshot(tenant_id)
        return [t for t in snapshot if t.get("position") in (1, 2)]

    def get_tenant_analytics(
        self,
        tenant_id: str,
        department: Optional[str] = None,
        queue_date: Optional[Union[str, date]] = None
    ) -> dict:
        target_date = parse_queue_date(queue_date) if queue_date else get_current_queue_date()
        today = get_current_queue_date()
        tenant = self._get_tenant(tenant_id)
        dept_filter = (department or "").strip().lower()

        if target_date == today:
            waiting = [
                t for t in tenant["tickets"].values()
                if t.status in ("waiting", "called") and parse_queue_date(getattr(t, "queue_date", None)) == today
            ]
            serving = [
                t for t in tenant["tickets"].values()
                if t.status == "serving" and parse_queue_date(getattr(t, "queue_date", None)) == today
            ]
            if dept_filter:
                waiting = [t for t in waiting if t.service_category.strip().lower() == dept_filter]
                serving = [t for t in serving if t.service_category.strip().lower() == dept_filter]
            avg_wait = sum(t.estimated_wait_minutes for t in waiting) / len(waiting) if waiting else 0.0
        else:
            waiting = []
            serving = []
            avg_wait = 0.0

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            log_query = "SELECT count(*), avg(service_duration_minutes) FROM service_logs WHERE hospital_id = %s AND queue_date = %s"
            params: list = [hid, target_date]
            if dept_filter:
                dept_id = self._resolve_department_id(conn, hid, dept_filter)
                log_query += " AND department_id = %s"
                params.append(dept_id)

            row = conn.execute(log_query, tuple(params)).fetchone()
            total_served = row[0] if row else 0
            avg_service = float(row[1] or 12.0) if row and row[1] else 12.0

        return {
            "tenant_id": tenant_id,
            "department": department or "all",
            "queue_date": str(target_date),
            "active_counters": tenant["active_counters"],
            "waiting_count": len(waiting),
            "serving_count": len(serving),
            "completed_today": total_served,
            "avg_wait_minutes": round(avg_wait, 1),
            "avg_service_minutes": round(avg_service, 1),
        }

    def fetch_all_service_logs(self, tenant_id: Optional[str] = None) -> List[dict]:
        with self._get_db() as conn:
            if tenant_id:
                hid = self._resolve_hospital_id(conn, tenant_id)
                rows = conn.execute("SELECT * FROM service_logs WHERE hospital_id = %s ORDER BY completed_at DESC LIMIT 500", (hid,)).fetchall()
            else:
                rows = conn.execute("SELECT * FROM service_logs ORDER BY completed_at DESC LIMIT 500").fetchall()
            return [dict(r) for r in rows]

    def reload_model_cache(self, tenant_id: str):
        if tenant_id in self._models_cache:
            del self._models_cache[tenant_id]
        self._load_model_bundle(tenant_id)

    # ------------------------------------------------------------------
    # Authentication & User Management (Role as Source of Truth)
    # ------------------------------------------------------------------
    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def register_user(
        self,
        email: str,
        username: str,
        password: str,
        role: str = "user",
        department: str = "all",
        phone: str = ""
    ) -> dict:
        email = email.strip().lower()
        pwd_hash = self._hash_password(password)

        with self._get_db() as conn:
            existing = conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()
            if existing:
                raise ValueError("An account with this email address already exists.")

            res = conn.execute("""
                INSERT INTO users (email, username, password_hash, role, status, phone, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, email, username, role, phone;
            """, (email, username, pwd_hash, role, "active", phone)).fetchone()

            uid = res[0]

            # If registered as patient, create patient profile
            if role in ("user", "patient"):
                conn.execute("""
                    INSERT INTO patients (user_id, medical_id, name, phone, gender, age, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW());
                """, (uid, "", username, phone, "other", 30))

            return {
                "id": uid,
                "email": res[1],
                "username": res[2],
                "role": res[3],
                "phone": res[4],
                "status": "active"
            }

    def register_superadmin(
        self,
        email: str,
        username: str,
        password: str,
        phone: str = "",
        hospital_name: str = "",
        hospital_code: str = ""
    ) -> dict:
        email = email.strip().lower()
        pwd_hash = self._hash_password(password)

        with self._get_db() as conn:
            existing = conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()
            if existing:
                raise ValueError("An account with this email address already exists.")

            user_res = conn.execute("""
                INSERT INTO users (email, username, password_hash, role, status, phone, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id;
            """, (email, username, pwd_hash, "superadmin", "active", phone)).fetchone()

            uid = user_res[0]

            # Provision Hospital if provided
            h_code = (hospital_code or f"hosp-{int(time.time())}").strip().lower()
            h_name = (hospital_name or f"{username}'s Hospital").strip()

            h_res = conn.execute("""
                INSERT INTO hospitals (hospital_code, name, phone, email, owner_user_id, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (hospital_code) DO UPDATE SET owner_user_id = EXCLUDED.owner_user_id
                RETURNING id, hospital_code, name;
            """, (h_code, h_name, phone, email, uid, "active")).fetchone()

            hid = h_res[0]

            # Seed standard clinical departments
            standard_depts = [
                ("consultation", "General Consultation (OPD)", "General outpatient doctor examinations"),
                ("pharmacy", "Pharmacy & Medicine", "Prescription dispensing and clinical pharmacy"),
                ("laboratory", "Pathology & Lab Test", "Diagnostic blood, urine and pathology assays"),
                ("radiology", "Radiology & X-Ray", "X-Ray, CT Scan, MRI and ultrasound imaging"),
                ("emergency", "Emergency Triage", "Critical emergency resuscitation and trauma"),
                ("billing", "Central Billing & Cashier", "Hospital services billing, insurance and receipts"),
            ]
            for d_code, d_name, d_desc in standard_depts:
                conn.execute("""
                    INSERT INTO departments (hospital_id, dept_code, name, description, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (hospital_id, dept_code) DO NOTHING;
                """, (hid, d_code, d_name, d_desc, "active"))

            self._log_audit(conn, hid, uid, "SUPERADMIN_REGISTERED", "hospital", str(hid), None, {"hospital_code": h_code, "name": h_name})

            return {
                "id": uid,
                "email": email,
                "username": username,
                "role": "superadmin",
                "hospital_code": h_code,
                "hospital_name": h_name,
                "hospital_id": hid,
            }

    def register_admin(
        self,
        email: str,
        username: str,
        password: str,
        phone: str = "",
        hospital_code: str = "city-hospital-01"
    ) -> dict:
        email = email.strip().lower()
        pwd_hash = self._hash_password(password)

        with self._get_db() as conn:
            existing = conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()
            if existing:
                raise ValueError("An account with this email address already exists.")

            hid = self._resolve_hospital_id(conn, hospital_code)

            user_res = conn.execute("""
                INSERT INTO users (email, username, password_hash, role, status, phone, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id;
            """, (email, username, pwd_hash, "admin", "active", phone)).fetchone()

            uid = user_res[0]

            # Create employee record
            conn.execute("""
                INSERT INTO employees (user_id, hospital_id, employee_code, name, phone, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (hospital_id, user_id) DO NOTHING;
            """, (uid, hid, f"EMP-{uid}", username, phone, "active"))

            return {
                "id": uid,
                "email": email,
                "username": username,
                "role": "admin",
                "hospital_code": hospital_code,
                "hospital_id": hid,
            }

    def authenticate_user(self, email: str, password: str) -> dict:
        identifier = email.strip().lower()
        pwd_hash = self._hash_password(password)

        with self._get_db() as conn:
            r = conn.execute("SELECT * FROM users WHERE LOWER(email) = %s", (identifier,)).fetchone()
            if not r:
                # Check if this identifier is an employee_code
                emp_user = conn.execute("""
                    SELECT u.* FROM users u
                    JOIN employees e ON e.user_id = u.id
                    WHERE LOWER(e.employee_code) = %s
                """, (identifier,)).fetchone()
                if emp_user:
                    r = emp_user

            if not r:
                raise ValueError("Invalid email or password.")

            u = dict(r)
            if u["password_hash"] != pwd_hash:
                raise ValueError("Invalid email or password.")

            if u.get("status") == "inactive":
                raise ValueError("Account is deactivated. Please contact your hospital administrator.")

            # Update last login timestamp
            conn.execute("UPDATE users SET last_login_at = NOW() WHERE id = %s", (u["id"],))

            # Fetch patient/employee context if available
            pat = conn.execute("SELECT * FROM patients WHERE user_id = %s", (u["id"],)).fetchone()
            emp = conn.execute("""
                SELECT e.*, h.hospital_code, h.name AS hospital_name, d.dept_code
                FROM employees e
                JOIN hospitals h ON h.id = e.hospital_id
                LEFT JOIN departments d ON d.id = e.department_id
                WHERE e.user_id = %s
            """, (u["id"],)).fetchone()

            # Check if user owns any hospital as superadmin
            owned_h = conn.execute("SELECT id, hospital_code, name FROM hospitals WHERE owner_user_id = %s", (u["id"],)).fetchone()

            res = {
                "id": u["id"],
                "email": u["email"],
                "username": u["username"],
                "role": u["role"],
                "status": u.get("status", "active"),
                "phone": u.get("phone", ""),
            }

            if pat:
                p_dict = dict(pat)
                res["medical_id"] = p_dict.get("medical_id", "")
                res["age"] = p_dict.get("age", 0)
                res["gender"] = p_dict.get("gender", "")

            if emp:
                e_dict = dict(emp)
                res["hospital_code"] = e_dict.get("hospital_code", "city-hospital-01")
                res["hospital_name"] = e_dict.get("hospital_name", "City General Hospital")
                res["department"] = e_dict.get("dept_code", "all")
                res["employee_id"] = e_dict.get("employee_code", "")
            elif owned_h:
                res["hospital_code"] = owned_h[1]
                res["hospital_name"] = owned_h[2]
            elif u.get("role") in ["doctor", "staff", "admin", "receptionist"]:
                # Default fallback if employee row isn't linked
                res["hospital_code"] = "city-hospital-01"
                res["hospital_name"] = "City General Hospital"

            return res

    def get_user_by_email(self, email: str) -> Optional[dict]:
        with self._get_db() as conn:
            r = conn.execute("SELECT id, email, username, role, status, phone, created_at, last_login_at FROM users WHERE LOWER(email) = %s", (email.strip().lower(),)).fetchone()
            if not r:
                return None
            u = dict(r)
            pat = conn.execute("SELECT * FROM patients WHERE user_id = %s", (u["id"],)).fetchone()
            if pat:
                p = dict(pat)
                u["medical_id"] = p.get("medical_id", "")
                u["age"] = p.get("age", 0)
                u["gender"] = p.get("gender", "")
            emp = conn.execute("""
                SELECT e.*, h.hospital_code, h.name AS hospital_name, d.dept_code
                FROM employees e
                JOIN hospitals h ON h.id = e.hospital_id
                LEFT JOIN departments d ON d.id = e.department_id
                WHERE e.user_id = %s
            """, (u["id"],)).fetchone()
            if emp:
                e_dict = dict(emp)
                u["hospital_code"] = e_dict.get("hospital_code", "city-hospital-01")
                u["hospital_name"] = e_dict.get("hospital_name", "City General Hospital")
                u["department"] = e_dict.get("dept_code", "all")
                u["employee_id"] = e_dict.get("employee_code", "")
            else:
                owned_h = conn.execute("SELECT id, hospital_code, name FROM hospitals WHERE owner_user_id = %s", (u["id"],)).fetchone()
                if owned_h:
                    u["hospital_code"] = owned_h[1]
                    u["hospital_name"] = owned_h[2]
                elif u.get("role") in ["doctor", "staff", "admin", "receptionist"]:
                    u["hospital_code"] = "city-hospital-01"
                    u["hospital_name"] = "City General Hospital"
            return u

    def update_user_profile(
        self,
        email: str,
        username: str,
        phone: str = "",
        gender: str = "",
        age: int = 0,
        medical_id: str = ""
    ) -> dict:
        email = email.strip().lower()
        with self._get_db() as conn:
            u_row = conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()
            if not u_row:
                raise ValueError("User not found.")

            uid = u_row[0]
            conn.execute("""
                UPDATE users
                SET username = %s, phone = %s, updated_at = NOW()
                WHERE id = %s;
            """, (username, phone, uid))

            conn.execute("""
                INSERT INTO patients (user_id, medical_id, name, phone, gender, age, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    phone = EXCLUDED.phone,
                    gender = EXCLUDED.gender,
                    age = EXCLUDED.age,
                    medical_id = EXCLUDED.medical_id,
                    updated_at = NOW();
            """, (uid, medical_id, username, phone, gender or "other", age or 30))

            return self.get_user_by_email(email)

    def get_all_users(self) -> List[dict]:
        with self._get_db() as conn:
            rows = conn.execute("SELECT id, email, username, role, status, phone, created_at FROM users ORDER BY id ASC").fetchall()
            return [dict(r) for r in rows]

    def get_user_tickets(self, identifier: str) -> List[dict]:
        """Fetch ticket history for a user by email, username, or patient name."""
        clean_id = (identifier or "").strip().lower()
        if not clean_id:
            return []

        with self._get_db() as conn:
            # Resolve user if they exist
            u_row = conn.execute(
                "SELECT id, username, email FROM users WHERE LOWER(email) = %s OR LOWER(username) = %s",
                (clean_id, clean_id)
            ).fetchone()
            uid = u_row[0] if u_row else None
            u_email = (u_row[2] or "").strip().lower() if u_row else None
            u_name = (u_row[1] or "").strip().lower() if u_row else None

            rows = conn.execute("""
                SELECT DISTINCT
                    t.ticket_id, t.name, t.status, t.service_category,
                    t.priority_level, t.position, t.estimated_wait_minutes,
                    t.join_timestamp as created_at,
                    t.serve_start_time, t.serve_end_time,
                    t.actual_service_minutes, t.prescription_notes,
                    t.cancellation_reason, t.cancelled_at,
                    t.medical_condition, t.pre_existing_condition,
                    t.source, t.appointment_id,
                    h.hospital_code, d.name as department_name
                FROM tickets t
                JOIN hospitals h ON h.id = t.hospital_id
                LEFT JOIN departments d ON d.id = t.department_id
                LEFT JOIN patients p ON p.id = t.patient_id
                LEFT JOIN users u ON u.id = p.user_id
                LEFT JOIN family_members fm ON (fm.patient_id = p.id OR LOWER(fm.name) = LOWER(p.name))
                WHERE (
                    (%(uid)s IS NOT NULL AND (p.user_id = %(uid)s OR fm.user_id = %(uid)s))
                    OR (%(u_email)s IS NOT NULL AND LOWER(u.email) = %(u_email)s)
                    OR (%(u_name)s IS NOT NULL AND (LOWER(u.username) = %(u_name)s OR LOWER(t.name) = %(u_name)s OR LOWER(p.name) = %(u_name)s))
                    OR LOWER(t.name) = %(clean_id)s
                    OR LOWER(p.name) = %(clean_id)s
                    OR (u.email IS NOT NULL AND LOWER(u.email) = %(clean_id)s)
                    OR (u.username IS NOT NULL AND LOWER(u.username) = %(clean_id)s)
                )
                ORDER BY t.join_timestamp DESC
                LIMIT 100;
            """, {
                "uid": uid,
                "u_email": u_email,
                "u_name": u_name,
                "clean_id": clean_id,
            }).fetchall()

            res = []
            for r in rows:
                d = dict(r)
                for ts_col in ("created_at", "serve_start_time", "serve_end_time", "cancelled_at"):
                    if d.get(ts_col) and hasattr(d[ts_col], "isoformat"):
                        d[ts_col] = d[ts_col].isoformat()
                res.append(d)
            return res

    # ------------------------------------------------------------------
    # Multi-Hospital Isolation & Security Authorization
    # ------------------------------------------------------------------
    def verify_hospital_access(self, hospital_code: str, requester_email: str) -> bool:
        """Enforces that Super Admin or Staff only access their authorized hospital."""
        if not requester_email:
            return True  # Public / unauthenticated fallback if route is open

        req_email = requester_email.strip().lower()
        h_code = hospital_code.strip()

        with self._get_db() as conn:
            u = conn.execute("SELECT id, role FROM users WHERE email = %s", (req_email,)).fetchone()
            if not u:
                return False

            uid, role = u[0], (u[1] or "").lower()

            # 1. Super Admin strictly owns the hospital
            if role in ("superadmin", "super_admin", "hospital_owner"):
                h = conn.execute("SELECT id FROM hospitals WHERE hospital_code = %s AND owner_user_id = %s", (h_code, uid)).fetchone()
                return bool(h)

            # 2. Hospital Admin / Doctor / Staff belongs to this hospital
            emp = conn.execute("""
                SELECT e.id
                FROM employees e
                JOIN hospitals h ON h.id = e.hospital_id
                WHERE e.user_id = %s AND h.hospital_code = %s
            """, (uid, h_code)).fetchone()

            return bool(emp)

    # ------------------------------------------------------------------
    # Super Admin & Hospital Operations
    # ------------------------------------------------------------------
    def get_superadmin_overview(self, requester_email: str = "") -> dict:
        with self._get_db() as conn:
            owner_uid = None
            if requester_email:
                u = conn.execute("SELECT id, role FROM users WHERE email = %s", (requester_email.strip().lower(),)).fetchone()
                if u and (u[1] or "").lower() in ("superadmin", "super_admin", "hospital_owner"):
                    owner_uid = u[0]

            if owner_uid:
                # Scoped to hospitals owned by this Super Admin
                total_h = conn.execute("SELECT count(*) FROM hospitals WHERE owner_user_id = %s", (owner_uid,)).fetchone()[0]
                h_count = conn.execute("SELECT count(*) FROM hospitals WHERE owner_user_id = %s AND status = 'active'", (owner_uid,)).fetchone()[0]
                
                h_rows = conn.execute("SELECT id, hospital_code FROM hospitals WHERE owner_user_id = %s", (owner_uid,)).fetchall()
                h_ids = [r[0] for r in h_rows]
                h_codes = [r[1] for r in h_rows]

                if h_ids:
                    total_emp = conn.execute("SELECT count(*) FROM employees WHERE hospital_id = ANY(%s) AND status = 'active'", (h_ids,)).fetchone()[0]
                    active_docs = conn.execute("""
                        SELECT count(DISTINCT e.id) 
                        FROM employees e 
                        JOIN users u ON u.id = e.user_id 
                        WHERE e.hospital_id = ANY(%s) AND (u.role = 'doctor' OR u.role = 'admin') AND e.status = 'active'
                    """, (h_ids,)).fetchone()[0]
                    total_desks = conn.execute("SELECT count(*) FROM desks WHERE hospital_id = ANY(%s)", (h_ids,)).fetchone()[0]
                    active_desks = conn.execute("SELECT count(*) FROM desks WHERE hospital_id = ANY(%s) AND status IN ('AVAILABLE', 'OCCUPIED', 'BUSY')", (h_ids,)).fetchone()[0]
                    today_tickets = conn.execute("""
                        SELECT count(*) FROM tickets 
                        WHERE hospital_id = ANY(%s) AND (queue_date = CURRENT_DATE OR DATE(created_at) = CURRENT_DATE)
                    """, (h_ids,)).fetchone()[0]
                    active_queues = conn.execute("""
                        SELECT count(*) FROM tickets 
                        WHERE hospital_id = ANY(%s) AND status IN ('WAITING', 'CALLED', 'SERVING')
                    """, (h_ids,)).fetchone()[0]
                    total_tickets = conn.execute("SELECT count(*) FROM tickets WHERE hospital_id = ANY(%s)", (h_ids,)).fetchone()[0]
                    total_users = conn.execute("""
                        SELECT count(DISTINCT u.id) FROM users u
                        LEFT JOIN employees e ON e.user_id = u.id AND e.hospital_id = ANY(%s)
                        WHERE e.id IS NOT NULL OR u.id = %s
                    """, (h_ids, owner_uid)).fetchone()[0]
                else:
                    total_emp = 0
                    active_docs = 0
                    total_desks = 0
                    active_desks = 0
                    today_tickets = 0
                    active_queues = 0
                    total_tickets = 0
                    total_users = 1
            else:
                total_h = conn.execute("SELECT count(*) FROM hospitals").fetchone()[0]
                h_count = conn.execute("SELECT count(*) FROM hospitals WHERE status = 'active'").fetchone()[0]
                total_emp = conn.execute("SELECT count(*) FROM employees WHERE status = 'active'").fetchone()[0]
                active_docs = conn.execute("""
                    SELECT count(DISTINCT e.id) 
                    FROM employees e 
                    JOIN users u ON u.id = e.user_id 
                    WHERE (u.role = 'doctor' OR u.role = 'admin') AND e.status = 'active'
                """).fetchone()[0]
                total_desks = conn.execute("SELECT count(*) FROM desks").fetchone()[0]
                active_desks = conn.execute("SELECT count(*) FROM desks WHERE status IN ('AVAILABLE', 'OCCUPIED', 'BUSY')").fetchone()[0]
                today_tickets = conn.execute("SELECT count(*) FROM tickets WHERE queue_date = CURRENT_DATE OR DATE(created_at) = CURRENT_DATE").fetchone()[0]
                active_queues = conn.execute("SELECT count(*) FROM tickets WHERE status IN ('WAITING', 'CALLED', 'SERVING')").fetchone()[0]
                total_tickets = conn.execute("SELECT count(*) FROM tickets").fetchone()[0]
                total_users = conn.execute("SELECT count(*) FROM users").fetchone()[0]

            return {
                "total_hospitals": total_h,
                "active_hospitals": h_count,
                "total_employees": total_emp,
                "active_doctors": active_docs,
                "total_desks": total_desks,
                "active_desks": active_desks,
                "patients_today": today_tickets,
                "active_queues": active_queues,
                "total_users": total_users,
                "total_tickets": total_tickets,
            }

    def get_all_hospitals(self, requester_email: str = "") -> List[dict]:
        with self._get_db() as conn:
            if requester_email:
                u = conn.execute("SELECT id, role FROM users WHERE email = %s", (requester_email.strip().lower(),)).fetchone()
                if u:
                    uid, role = u[0], (u[1] or "").lower()
                    if role in ("superadmin", "super_admin", "hospital_owner"):
                        rows = conn.execute("SELECT * FROM hospitals WHERE owner_user_id = %s ORDER BY id ASC", (uid,)).fetchall()
                        return [dict(r) for r in rows]
                    else:
                        rows = conn.execute("""
                            SELECT h.* FROM hospitals h
                            JOIN employees e ON e.hospital_id = h.id
                            WHERE e.user_id = %s
                            ORDER BY h.id ASC
                        """, (uid,)).fetchall()
                        return [dict(r) for r in rows]

            rows = conn.execute("SELECT * FROM hospitals ORDER BY id ASC").fetchall()
            return [dict(r) for r in rows]

    def get_hospital_by_code(self, hospital_code: str) -> Optional[dict]:
        with self._get_db() as conn:
            r = conn.execute("SELECT * FROM hospitals WHERE hospital_code = %s", (hospital_code.strip(),)).fetchone()
            return dict(r) if r else None

    def create_hospital(
        self,
        hospital_code: str,
        name: str,
        address: str = "",
        phone: str = "",
        email: str = "",
        description: str = "",
        logo_url: str = "",
        status: str = "active",
        owner_email: str = ""
    ) -> dict:
        h_code = hospital_code.strip()
        with self._get_db() as conn:
            owner_uid = None
            if owner_email:
                u = conn.execute("SELECT id FROM users WHERE email = %s", (owner_email.strip().lower(),)).fetchone()
                if u:
                    owner_uid = u[0]

            res = conn.execute("""
                INSERT INTO hospitals (hospital_code, name, address, phone, email, description, logo_url, status, owner_user_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, hospital_code, name, address, phone, email, status;
            """, (h_code, name, address, phone, email, description, logo_url, status, owner_uid)).fetchone()

            hid = res[0]

            # Seed standard departments
            depts = [
                ("consultation", "General Consultation (OPD)", "General outpatient doctor examinations"),
                ("pharmacy", "Pharmacy & Medicine", "Prescription dispensing and clinical pharmacy"),
                ("laboratory", "Pathology & Lab Test", "Diagnostic blood, urine and pathology assays"),
                ("radiology", "Radiology & X-Ray", "X-Ray, CT Scan, MRI and ultrasound imaging"),
                ("emergency", "Emergency Triage", "Critical emergency resuscitation and trauma"),
                ("billing", "Central Billing & Cashier", "Hospital services billing, insurance and receipts"),
            ]
            for d_code, d_name, d_desc in depts:
                conn.execute("""
                    INSERT INTO departments (hospital_id, dept_code, name, description, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (hospital_id, dept_code) DO NOTHING;
                """, (hid, d_code, d_name, d_desc, "active"))

            self._log_audit(conn, hid, owner_uid, "CREATE_HOSPITAL", "hospital", str(hid), None, {"code": h_code, "name": name})

            return dict(res)

    def update_hospital(
        self,
        hospital_code: str,
        name: str,
        address: str = "",
        phone: str = "",
        email: str = "",
        description: str = "",
        logo_url: str = "",
        status: str = "active"
    ) -> dict:
        h_code = hospital_code.strip()
        with self._get_db() as conn:
            res = conn.execute("""
                UPDATE hospitals
                SET name = %s, address = %s, phone = %s, email = %s,
                    description = %s, logo_url = %s, status = %s, updated_at = NOW()
                WHERE hospital_code = %s
                RETURNING id, hospital_code, name, address, phone, email, status;
            """, (name, address, phone, email, description, logo_url, status, h_code)).fetchone()

            if not res:
                raise ValueError(f"Hospital with code '{hospital_code}' not found.")

            return dict(res)

    def delete_hospital(self, hospital_code: str) -> dict:
        clean_code = hospital_code.strip()
        with self._get_db() as conn:
            h = conn.execute("SELECT id, name FROM hospitals WHERE hospital_code = %s", (clean_code,)).fetchone()
            if not h:
                return {"status": "error", "message": f"Hospital '{clean_code}' not found."}
            h_id = h["id"]

            # Safe cleanup of child entities
            conn.execute("DELETE FROM service_logs WHERE hospital_id = %s", (h_id,))
            conn.execute("DELETE FROM tickets WHERE hospital_id = %s", (h_id,))
            conn.execute("DELETE FROM appointments WHERE hospital_id = %s", (h_id,))
            conn.execute("DELETE FROM desks WHERE hospital_id = %s", (h_id,))
            conn.execute("DELETE FROM employees WHERE hospital_id = %s", (h_id,))
            conn.execute("DELETE FROM departments WHERE hospital_id = %s", (h_id,))
            conn.execute("DELETE FROM kiosks WHERE hospital_id = %s", (h_id,))
            conn.execute("DELETE FROM tenant_mapping WHERE hospital_id = %s", (h_id,))
            conn.execute("DELETE FROM tenant_config WHERE hospital_id = %s", (h_id,))
            conn.execute("DELETE FROM hospitals WHERE id = %s", (h_id,))

            return {"status": "success", "message": f"Hospital '{h['name']}' ({clean_code}) successfully deleted."}

    # ------------------------------------------------------------------
    # Employee Provisioning (Super Admin / Admin Only)
    # ------------------------------------------------------------------
    def get_hospital_employees(self, hospital_code: str) -> List[dict]:
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, hospital_code)
            rows = conn.execute("""
                SELECT e.id as employee_id_num, e.employee_code as employee_id, e.name, u.email,
                       e.phone, u.role, d.dept_code as department, d.name as department_name, e.status
                FROM employees e
                JOIN users u ON u.id = e.user_id
                LEFT JOIN departments d ON d.id = e.department_id
                WHERE e.hospital_id = %s
                ORDER BY e.id ASC;
            """, (hid,)).fetchall()
            return [dict(r) for r in rows]

    def add_hospital_employee(
        self,
        hospital_code: str,
        name: str,
        email: str,
        role: str,
        department: str,
        employee_id: str = "",
        phone: str = "",
        password: str = "pass123"
    ) -> dict:
        email = email.strip().lower()
        pwd_hash = self._hash_password(password)

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, hospital_code)
            dept_id = self._resolve_department_id(conn, hid, department)

            # 1. Create or resolve user
            u_row = conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()
            if u_row:
                uid = u_row[0]
                conn.execute("UPDATE users SET role = %s, phone = %s, updated_at = NOW() WHERE id = %s", (role, phone, uid))
            else:
                new_u = conn.execute("""
                    INSERT INTO users (email, username, password_hash, role, status, phone, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id;
                """, (email, name, pwd_hash, role, "active", phone)).fetchone()
                uid = new_u[0]

            # 2. Provision Employee Record
            emp_res = conn.execute("""
                INSERT INTO employees (user_id, hospital_id, department_id, employee_code, name, phone, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (hospital_id, user_id) DO UPDATE SET
                    department_id = EXCLUDED.department_id,
                    name = EXCLUDED.name,
                    phone = EXCLUDED.phone,
                    employee_code = EXCLUDED.employee_code,
                    status = EXCLUDED.status,
                    updated_at = NOW()
                RETURNING id;
            """, (uid, hid, dept_id, employee_id or f"EMP-{uid}", name, phone, "active")).fetchone()

            self._log_audit(conn, hid, None, "PROVISION_EMPLOYEE", "employee", str(emp_res[0]), None, {"email": email, "role": role})

            return {
                "user_id": uid,
                "name": name,
                "email": email,
                "role": role,
                "department": department,
                "employee_id": employee_id or f"EMP-{uid}",
                "status": "active"
            }

    def update_hospital_employee(
        self,
        user_id: int,
        name: str,
        phone: str = "",
        role: str = "staff",
        department: str = "consultation",
        employee_id: str = "",
        status: str = "active"
    ) -> dict:
        with self._get_db() as conn:
            conn.execute("UPDATE users SET username = %s, role = %s, phone = %s, status = %s, updated_at = NOW() WHERE id = %s", (name, role, phone, status, user_id))

            emp = conn.execute("SELECT hospital_id FROM employees WHERE user_id = %s", (user_id,)).fetchone()
            if emp:
                hid = emp[0]
                dept_id = self._resolve_department_id(conn, hid, department)
                conn.execute("""
                    UPDATE employees
                    SET name = %s, phone = %s, department_id = %s, employee_code = %s, status = %s, updated_at = NOW()
                    WHERE user_id = %s AND hospital_id = %s;
                """, (name, phone, dept_id, employee_id, status, user_id, hid))

            return {"user_id": user_id, "name": name, "role": role, "status": status}

    def delete_hospital_employee(self, user_id: int) -> dict:
        with self._get_db() as conn:
            conn.execute("DELETE FROM employees WHERE user_id = %s", (user_id,))
            conn.execute("UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = %s", (user_id,))
            return {"success": True, "deleted_user_id": user_id}

    # ------------------------------------------------------------------
    # Departments & Desks Management
    # ------------------------------------------------------------------
    def get_hospital_departments(self, hospital_code: str) -> List[dict]:
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, hospital_code)
            rows = conn.execute("SELECT * FROM departments WHERE hospital_id = %s ORDER BY id ASC", (hid,)).fetchall()
            return [dict(r) for r in rows]

    def add_hospital_department(self, hospital_code: str, dept_code: str, name: str, description: str = "") -> dict:
        d_code = dept_code.strip().lower()
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, hospital_code)
            res = conn.execute("""
                INSERT INTO departments (hospital_id, dept_code, name, description, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (hospital_id, dept_code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description
                RETURNING id, dept_code, name, description, status;
            """, (hid, d_code, name, description, "active")).fetchone()
            return dict(res)

    def delete_hospital_department(self, hospital_code: str, dept_code: str) -> dict:
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, hospital_code)
            conn.execute("DELETE FROM departments WHERE hospital_id = %s AND dept_code = %s", (hid, dept_code.strip().lower()))
            return {"success": True, "deleted_dept": dept_code}

    def get_hospital_desks(self, hospital_code: str) -> List[dict]:
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, hospital_code)
            rows = conn.execute("""
                SELECT d.id, d.desk_number, d.desk_name, d.status, d.current_ticket_id, d.last_active_at,
                       dept.dept_code, dept.name as department_name, emp.name as assigned_employee_name
                FROM desks d
                JOIN departments dept ON dept.id = d.department_id
                LEFT JOIN employees emp ON emp.id = d.assigned_employee_id
                WHERE d.hospital_id = %s
                ORDER BY d.desk_number ASC;
            """, (hid,)).fetchall()
            return [dict(r) for r in rows]

    def add_hospital_desk(self, hospital_code: str, dept_code: str, desk_name: str, status: str = "AVAILABLE") -> dict:
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, hospital_code)
            dept_id = self._resolve_department_id(conn, hid, dept_code)

            # Auto-increment desk number for this department
            max_num = conn.execute("SELECT COALESCE(MAX(desk_number), 0) FROM desks WHERE hospital_id = %s AND department_id = %s", (hid, dept_id)).fetchone()[0]
            desk_num = max_num + 1

            res = conn.execute("""
                INSERT INTO desks (hospital_id, department_id, desk_number, desk_name, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, desk_number, desk_name, status;
            """, (hid, dept_id, desk_num, desk_name, status)).fetchone()

            return dict(res)

    def delete_hospital_desk(self, desk_id: int) -> dict:
        with self._get_db() as conn:
            conn.execute("DELETE FROM desks WHERE id = %s", (desk_id,))
            return {"success": True, "deleted_desk_id": desk_id}

    def update_desk_status(self, desk_id: int, status: str) -> dict:
        with self._get_db() as conn:
            res = conn.execute("UPDATE desks SET status = %s, last_active_at = NOW(), updated_at = NOW() WHERE id = %s RETURNING id, desk_number, desk_name, status", (status, desk_id)).fetchone()
            if not res:
                raise ValueError(f"Desk #{desk_id} not found.")
            return dict(res)

    def get_hospital_info(self, hospital_code: str) -> dict:
        with self._get_db() as conn:
            h = conn.execute("SELECT * FROM hospitals WHERE hospital_code = %s", (hospital_code.strip(),)).fetchone()
            if not h:
                return {"hospital_code": hospital_code, "name": "Hospital"}
            return dict(h)

    # ------------------------------------------------------------------
    # Database Inspector (Secure Dynamic Exploration)
    # ------------------------------------------------------------------
    def get_database_overview(self) -> dict:
        """Inspects all 17 normalized PostgreSQL tables dynamically hiding sensitive credentials."""
        tables = [
            "users", "hospitals", "departments", "patients", "family_members",
            "employees", "desks", "kiosks", "appointments", "appointment_status_history",
            "tickets", "queue_events", "service_logs", "tenant_historical_data",
            "tenant_config", "tenant_mapping", "audit_logs"
        ]
        result = {}

        with self._get_db() as conn:
            for tbl in tables:
                try:
                    count_row = conn.execute(f"SELECT count(*) FROM {tbl}").fetchone()
                    cnt = count_row[0] if count_row else 0

                    schema_rows = conn.execute(f"""
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns
                        WHERE table_name = '{tbl}'
                        ORDER BY ordinal_position ASC;
                    """).fetchall()

                    schema_info = [
                        {"name": r["column_name"], "type": r["data_type"], "nullable": r["is_nullable"]}
                        for r in schema_rows
                    ]

                    # Hide password_hash from live table preview
                    preview_query = f"SELECT * FROM {tbl} ORDER BY id DESC LIMIT 5" if tbl != "tenant_config" and tbl != "tenant_mapping" and tbl != "family_members" else f"SELECT * FROM {tbl} LIMIT 5"
                    rows = conn.execute(preview_query).fetchall()

                    sanitized_rows = []
                    for row in rows:
                        row_dict = dict(row)
                        if "password_hash" in row_dict:
                            row_dict["password_hash"] = "•••••••••••• [ENCRYPTED]"
                        sanitized_rows.append(row_dict)

                    result[tbl] = {
                        "count": cnt,
                        "schema": schema_info,
                        "rows": sanitized_rows
                    }
                except Exception as e:
                    result[tbl] = {"count": 0, "schema": [], "rows": [], "error": str(e)}

        return result

    # ------------------------------------------------------------------
    # Appointment Booking & Check-in
    # ------------------------------------------------------------------
    def book_appointment(
        self,
        tenant_id: str,
        consumer_type: str,
        service_category: str,
        patient_name: str,
        user_email: str,
        appointment_date: str,
        time_slot: str,
        patient_id: Optional[int] = None
    ) -> dict:
        apt_id = f"APT-{uuid.uuid4().hex[:8].upper()}"
        dept_code = service_category.strip().lower()

        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            dept_id = self._resolve_department_id(conn, hid, dept_code)
            # Use explicit patient_id (family member) if provided; otherwise resolve
            if patient_id:
                pid = patient_id
            else:
                pid = self._resolve_patient_id(conn, user_email, patient_name)

            conn.execute("""
                INSERT INTO appointments (
                    appointment_id, hospital_id, patient_id, department_id, consumer_type,
                    service_category, appointment_date, time_slot, status, ticket_id, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW());
            """, (
                apt_id,
                hid,
                pid,
                dept_id,
                consumer_type,
                dept_code,
                appointment_date,
                time_slot,
                "scheduled",
                ""
            ))

            self._log_appointment_history(conn, apt_id, None, "scheduled", None, "Initial Booking")

        return {
            "appointment_id": apt_id,
            "tenant_id": tenant_id,
            "patient_name": patient_name,
            "user_email": user_email,
            "service_category": dept_code,
            "appointment_date": appointment_date,
            "time_slot": time_slot,
            "status": "scheduled"
        }

    def check_in_appointment(self, appointment_id: str) -> dict:
        with self._get_db() as conn:
            apt_row = conn.execute("""
                SELECT a.*, h.hospital_code, p.name as patient_name_db, u.email as user_email_db
                FROM appointments a
                JOIN hospitals h ON h.id = a.hospital_id
                LEFT JOIN patients p ON p.id = a.patient_id
                LEFT JOIN users u ON u.id = p.user_id
                WHERE a.appointment_id = %s;
            """, (appointment_id.strip(),)).fetchone()

            if not apt_row:
                raise ValueError(f"Appointment '{appointment_id}' not found.")

            apt = dict(apt_row)
            if apt["status"] in ("completed", "cancelled"):
                raise ValueError(f"Cannot check in: Appointment status is {apt['status'].upper()}.")
            if apt["status"] == "expired":
                raise ValueError("Cannot check in: Appointment has expired.")

            apt_date = parse_queue_date(apt["appointment_date"])
            today = get_current_queue_date()

            if apt_date > today:
                raise ValueError(f"Check-in not available yet: Your appointment is scheduled for {apt_date.isoformat()} at {apt.get('time_slot', '')}.")
            if apt_date < today:
                raise ValueError(f"Cannot check in: Your appointment date ({apt_date.isoformat()}) has expired.")

            # Generate priority queue ticket for today's active queue
            t = self.join_queue(
                tenant_id=apt.get("hospital_code", "city-hospital-01"),
                consumer_type=apt.get("consumer_type", "hospital"),
                service_category=apt.get("service_category", "consultation"),
                name=apt.get("patient_name_db") or "Patient",
                priority_level=PRIORITY_ROUTINE,
                user_email=apt.get("user_email_db", ""),
                patient_id=apt.get("patient_id"),
                queue_date=today,
                appointment_id=appointment_id,
                status="waiting"
            )

            conn.execute("""
                UPDATE appointments
                SET status = 'checked_in', ticket_id = %s, updated_at = NOW()
                WHERE appointment_id = %s;
            """, (t.ticket_id, appointment_id))

            self._log_appointment_history(conn, appointment_id, apt["status"], "checked_in", None, f"Checked in as Token #{t.ticket_id}")

            apt["status"] = "checked_in"
            apt["ticket_id"] = t.ticket_id
            apt["tenant_id"] = apt.get("hospital_code", "city-hospital-01")

            return {"appointment": apt, "ticket": t.to_dict()}

    def get_user_appointments(self, email: str) -> List[dict]:
        clean_id = (email or "").strip().lower()
        if not clean_id:
            return []

        with self._get_db() as conn:
            # 1. Resolve user ID if email or username belongs to a user
            u_row = conn.execute(
                "SELECT id, username, email FROM users WHERE LOWER(email) = %s OR LOWER(username) = %s",
                (clean_id, clean_id)
            ).fetchone()
            uid = u_row[0] if u_row else None
            u_name = (u_row[1] or "").strip().lower() if u_row else None
            u_email = (u_row[2] or "").strip().lower() if u_row else None

            query = """
                SELECT DISTINCT
                    a.appointment_id,
                    h.hospital_code as tenant_id,
                    a.consumer_type,
                    a.service_category,
                    COALESCE(p.name, 'Patient') as patient_name,
                    COALESCE(u.email, '') as user_email,
                    a.appointment_date,
                    a.time_slot,
                    a.status,
                    COALESCE(a.ticket_id, '') as ticket_id,
                    a.created_at,
                    COALESCE(t.prescription_notes, '') as prescription_notes
                FROM appointments a
                JOIN hospitals h ON h.id = a.hospital_id
                LEFT JOIN patients p ON p.id = a.patient_id
                LEFT JOIN users u ON u.id = p.user_id
                LEFT JOIN tickets t ON t.ticket_id = a.ticket_id
                LEFT JOIN family_members fm ON (fm.patient_id = p.id OR LOWER(fm.name) = LOWER(p.name))
                WHERE (
                    (%(uid)s IS NOT NULL AND (p.user_id = %(uid)s OR fm.user_id = %(uid)s))
                    OR (%(u_email)s IS NOT NULL AND LOWER(u.email) = %(u_email)s)
                    OR (%(u_name)s IS NOT NULL AND (LOWER(u.username) = %(u_name)s OR LOWER(p.name) = %(u_name)s))
                    OR (u.email IS NOT NULL AND LOWER(u.email) = %(clean_id)s)
                    OR (u.username IS NOT NULL AND LOWER(u.username) = %(clean_id)s)
                    OR (p.name IS NOT NULL AND LOWER(p.name) = %(clean_id)s)
                )
                ORDER BY a.created_at DESC;
            """
            rows = conn.execute(query, {
                "uid": uid,
                "u_email": u_email,
                "u_name": u_name,
                "clean_id": clean_id,
            }).fetchall()

            res = []
            for r in rows:
                d = dict(r)
                if hasattr(d.get("appointment_date"), "isoformat"):
                    d["appointment_date"] = d["appointment_date"].isoformat()
                elif d.get("appointment_date"):
                    d["appointment_date"] = str(d["appointment_date"])
                res.append(d)
            return res

    def get_tenant_appointments(self, tenant_id: str, department: Optional[str] = None, active_only: bool = False) -> List[dict]:
        with self._get_db() as conn:
            hid = self._resolve_hospital_id(conn, tenant_id)
            query = """
                SELECT a.appointment_id, h.hospital_code as tenant_id, a.consumer_type,
                       a.service_category, p.name as patient_name, u.email as user_email,
                       a.appointment_date, a.time_slot, a.status, a.ticket_id, a.created_at
                FROM appointments a
                JOIN hospitals h ON h.id = a.hospital_id
                LEFT JOIN patients p ON p.id = a.patient_id
                LEFT JOIN users u ON u.id = p.user_id
                WHERE a.hospital_id = %s
            """
            params = [hid]

            if department:
                dept_id = self._resolve_department_id(conn, hid, department)
                query += " AND a.department_id = %s"
                params.append(dept_id)

            if active_only:
                query += " AND a.status IN ('scheduled', 'checked_in', 'waiting', 'serving')"

            query += " ORDER BY a.appointment_date ASC, a.time_slot ASC"
            rows = conn.execute(query, tuple(params)).fetchall()
            return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Family Member Ownership Verification
    # ------------------------------------------------------------------
    def verify_family_member_ownership(self, user_email: str, member_id: str) -> dict:
        """Verifies that a family member belongs to the authenticated user.
        Returns the family member dict if valid, raises ValueError if not."""
        email = (user_email or "").strip().lower()
        with self._get_db() as conn:
            u = conn.execute(
                "SELECT id, role FROM users WHERE LOWER(email) = %s",
                (email,)
            ).fetchone()
            if not u:
                raise ValueError("Authenticated user not found.")
            uid, role = u[0], u[1]
            # Role restriction: only 'user' accounts can have family members
            if role not in ("user", "patient"):
                raise PermissionError("Family profiles are only available for patient accounts.")

            fm = conn.execute(
                "SELECT id, user_id, patient_id, name, relation, age, gender, phone FROM family_members WHERE id = %s AND user_id = %s",
                (member_id, uid)
            ).fetchone()
            if not fm:
                raise ValueError(f"Family member '{member_id}' not found or does not belong to your account.")
            return dict(fm)

    # ------------------------------------------------------------------
    # Family Members / Dependents Management
    # ------------------------------------------------------------------
    def get_family_members(self, email: str, role_check: bool = True) -> List[dict]:
        email = email.strip().lower()
        with self._get_db() as conn:
            u = conn.execute("SELECT id, role FROM users WHERE email = %s", (email,)).fetchone()
            if not u:
                return []
            uid, role = u[0], u[1]
            # Role restriction: only patient/user accounts can have family members
            if role_check and role not in ("user", "patient"):
                raise PermissionError("Family profiles are only available for patient accounts.")
            rows = conn.execute(
                "SELECT id, name, relation, age, gender, COALESCE(phone, '') as phone, patient_id, created_at FROM family_members WHERE user_id = %s ORDER BY created_at ASC",
                (uid,)
            ).fetchall()
            return [dict(r) for r in rows]

    def add_family_member(
        self,
        user_email: str,
        name: str,
        relation: str,
        age: int = 25,
        gender: str = "male",
        phone: str = "",
        member_id: Optional[str] = None
    ) -> dict:
        email = user_email.strip().lower()
        mem_id = member_id or f"dep_{int(time.time() * 1000)}"

        with self._get_db() as conn:
            u = conn.execute("SELECT id, role FROM users WHERE email = %s", (email,)).fetchone()
            if not u:
                raise ValueError("User not found.")
            uid, role = u[0], u[1]
            # Role restriction: only patient/user accounts can add family members
            if role not in ("user", "patient"):
                raise PermissionError("Family profiles are only available for patient accounts.")

            pid = self._resolve_patient_id(conn, email, name, phone=phone, gender=gender, age=age)

            conn.execute("""
                INSERT INTO family_members (id, user_id, patient_id, name, relation, age, gender, phone, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    relation = EXCLUDED.relation,
                    age = EXCLUDED.age,
                    gender = EXCLUDED.gender,
                    phone = EXCLUDED.phone,
                    updated_at = NOW();
            """, (mem_id, uid, pid, name, relation, age, gender, phone or ""))

        return {
            "id": mem_id,
            "name": name,
            "relation": relation,
            "age": age,
            "gender": gender,
            "phone": phone or "",
            "patient_id": pid
        }

    def update_family_member(
        self,
        user_email: str,
        member_id: str,
        name: str,
        relation: str,
        age: int = 25,
        gender: str = "male",
        phone: str = ""
    ) -> dict:
        """Update a family member. Verifies ownership before updating."""
        email = user_email.strip().lower()
        with self._get_db() as conn:
            u = conn.execute("SELECT id, role FROM users WHERE email = %s", (email,)).fetchone()
            if not u:
                raise ValueError("User not found.")
            uid, role = u[0], u[1]
            if role not in ("user", "patient"):
                raise PermissionError("Family profiles are only available for patient accounts.")

            # Verify ownership
            existing = conn.execute(
                "SELECT id, patient_id FROM family_members WHERE id = %s AND user_id = %s",
                (member_id, uid)
            ).fetchone()
            if not existing:
                raise ValueError(f"Family member '{member_id}' not found or does not belong to your account.")

            conn.execute("""
                UPDATE family_members
                SET name = %s, relation = %s, age = %s, gender = %s, phone = %s, updated_at = NOW()
                WHERE id = %s AND user_id = %s;
            """, (name, relation, age, gender, phone or "", member_id, uid))

            # Also update the linked patient record if one exists
            if existing[1]:  # patient_id
                conn.execute("""
                    UPDATE patients SET name = %s, phone = %s, gender = %s, age = %s, updated_at = NOW()
                    WHERE id = %s;
                """, (name, phone or "", gender, age, existing[1]))

        return {
            "id": member_id,
            "name": name,
            "relation": relation,
            "age": age,
            "gender": gender,
            "phone": phone or ""
        }

    def delete_family_member(self, user_email: str, member_id: str) -> bool:
        email = user_email.strip().lower()
        with self._get_db() as conn:
            u = conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()
            if not u:
                return False
            res = conn.execute("DELETE FROM family_members WHERE id = %s AND user_id = %s RETURNING id", (member_id, u[0])).fetchone()
            return bool(res)


# Singleton Engine Instance
engine = PluginQueueEngine()

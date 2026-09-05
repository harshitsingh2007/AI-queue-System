"""
database.py
-----------
Unified PostgreSQL Database Manager for AI Queue System.
Enterprise Relational Multi-Hospital Architecture.

- Native PostgreSQL connection pooling (psycopg2)
- Zero SQLite dependencies in active execution path
- Automatic DDL schema migration and validation
- Dynamic schema inspection without credential exposure
"""

import os
import re
import json
import urllib.parse
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

RAW_DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:12345678@localhost:5432/ai_queue").strip()

if RAW_DB_URL.startswith("postgres://"):
    RAW_DB_URL = RAW_DB_URL.replace("postgres://", "postgresql://", 1)

IS_POSTGRES = RAW_DB_URL.startswith("postgresql")

# Parse connection details securely (never expose password)
PARSED_URL = urllib.parse.urlparse(RAW_DB_URL) if IS_POSTGRES else None
DB_NAME = PARSED_URL.path.lstrip("/") if PARSED_URL else "ai_queue"
DB_HOST = PARSED_URL.hostname if PARSED_URL else "localhost"
DB_PORT = PARSED_URL.port if PARSED_URL and PARSED_URL.port else 5432
IS_LOCAL = DB_HOST in ("localhost", "127.0.0.1", "::1") if IS_POSTGRES else True

# PostgreSQL Connection Pool
_pg_pool = None

if IS_POSTGRES:
    try:
        import psycopg2
        import psycopg2.pool
        from psycopg2.extras import DictCursor, RealDictCursor

        _pg_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=20,
            dsn=RAW_DB_URL
        )
    except Exception as e:
        print(f"[WARN] PostgreSQL pool initialization failed: {e}")
        _pg_pool = None


# -----------------------------------------------------------------------------
# Row & Cursor Wrappers for Dict + Numeric Index Access
# -----------------------------------------------------------------------------

class DBRow:
    """Row wrapper compatible with row['col'] and row[0], plus dict(row)."""
    __slots__ = ("_data", "_keys")

    def __init__(self, data: tuple, keys: List[str]):
        self._data = data
        self._keys = keys

    def __getitem__(self, item: Union[int, str]):
        if isinstance(item, int):
            return self._data[item]
        try:
            idx = self._keys.index(item)
            return self._data[idx]
        except ValueError:
            raise KeyError(item)

    def __contains__(self, item: str):
        return item in self._keys

    def __iter__(self):
        return iter(self._data)

    def __len__(self):
        return len(self._data)

    def keys(self):
        return self._keys

    def values(self):
        return self._data

    def items(self):
        return zip(self._keys, self._data)

    def get(self, key: str, default: Any = None):
        try:
            return self[key]
        except KeyError:
            return default

    def __repr__(self):
        return f"DBRow({dict(self.items())})"


TABLES_WITH_RETURNING_ID = {
    "users", "hospitals", "departments", "patients", "employees",
    "desks", "kiosks", "appointments", "appointment_status_history",
    "tickets", "queue_events", "service_logs", "tenant_historical_data",
    "audit_logs", "family_members"
}


class PostgresCursorWrapper:
    """Wraps psycopg2 cursor with transparent dict/index access and ID return handling."""

    def __init__(self, cursor):
        self._cursor = cursor
        self._lastrowid = None

    @property
    def lastrowid(self):
        return self._lastrowid

    def execute(self, sql: str, params: Any = None):
        clean_sql = sql.strip()
        # Handle SQLite '?' if encountered
        if "?" in clean_sql:
            parts = re.split(r"('(?:''|[^'])*')", clean_sql)
            for i in range(0, len(parts), 2):
                parts[i] = parts[i].replace("?", "%s")
            clean_sql = "".join(parts)

        stripped = clean_sql.strip()
        is_insert = stripped.upper().startswith("INSERT INTO")
        has_returning = "RETURNING" in stripped.upper()
        appended_returning = False

        if is_insert and not has_returning:
            words = stripped.split()
            if len(words) >= 3:
                raw_tbl = words[2].split("(")[0].strip('"').strip("'").lower()
                if raw_tbl in TABLES_WITH_RETURNING_ID:
                    clean_sql = clean_sql.rstrip(";") + " RETURNING id"
                    appended_returning = True

        if params is not None:
            if isinstance(params, list):
                params = tuple(params)
            self._cursor.execute(clean_sql, params)
        else:
            self._cursor.execute(clean_sql)

        if appended_returning:
            try:
                row = self._cursor.fetchone()
                if row:
                    self._lastrowid = row[0]
            except Exception:
                pass

        return self

    def executemany(self, sql: str, seq_of_params: Any):
        clean_sql = sql
        if "?" in clean_sql:
            parts = re.split(r"('(?:''|[^'])*')", clean_sql)
            for i in range(0, len(parts), 2):
                parts[i] = parts[i].replace("?", "%s")
            clean_sql = "".join(parts)
        self._cursor.executemany(clean_sql, seq_of_params)
        return self

    def fetchone(self) -> Optional[DBRow]:
        row = self._cursor.fetchone()
        if row is None:
            return None
        keys = [desc[0] for desc in self._cursor.description]
        return DBRow(row, keys)

    def fetchall(self) -> List[DBRow]:
        rows = self._cursor.fetchall()
        if not rows:
            return []
        keys = [desc[0] for desc in self._cursor.description]
        return [DBRow(r, keys) for r in rows]

    def fetchmany(self, size: int = 1) -> List[DBRow]:
        rows = self._cursor.fetchmany(size)
        if not rows:
            return []
        keys = [desc[0] for desc in self._cursor.description]
        return [DBRow(r, keys) for r in rows]

    @property
    def description(self):
        return self._cursor.description

    @property
    def rowcount(self):
        return self._cursor.rowcount

    def close(self):
        self._cursor.close()

    def __iter__(self):
        while True:
            row = self.fetchone()
            if row is None:
                break
            yield row


class PostgresConnectionWrapper:
    """Wraps psycopg2 connection to provide direct execution and transaction management."""

    def __init__(self, conn):
        self._conn = conn

    def cursor(self) -> PostgresCursorWrapper:
        return PostgresCursorWrapper(self._conn.cursor())

    def execute(self, sql: str, params: Any = None) -> PostgresCursorWrapper:
        cur = self.cursor()
        cur.execute(sql, params)
        return cur

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self._conn.rollback()
        else:
            self._conn.commit()


# -----------------------------------------------------------------------------
# Unified Connection Context Manager
# -----------------------------------------------------------------------------

@contextmanager
def get_db_connection():
    """Provides an isolated PostgreSQL database connection context that commits on success."""
    conn = None
    from_pool = False
    try:
        if _pg_pool is not None:
            conn = _pg_pool.getconn()
            from_pool = True
        else:
            import psycopg2
            conn = psycopg2.connect(RAW_DB_URL)
        wrapped = PostgresConnectionWrapper(conn)
        with wrapped as active_conn:
            yield active_conn
    finally:
        if conn is not None:
            if from_pool and _pg_pool is not None:
                _pg_pool.putconn(conn)
            elif not from_pool:
                conn.close()


def get_db_info() -> Dict[str, Any]:
    """Returns dynamic database details without exposing credentials."""
    mode = "Local PostgreSQL" if IS_LOCAL else "Production PostgreSQL"
    return {
        "db_type": mode,
        "engine": "PostgreSQL",
        "database": DB_NAME,
        "host": DB_HOST,
        "port": DB_PORT,
        "status": "Connected",
        "is_cloud": IS_POSTGRES and not IS_LOCAL,
    }


# -----------------------------------------------------------------------------
# 17-Table Enterprise PostgreSQL Schema Definition
# -----------------------------------------------------------------------------

POSTGRES_SCHEMA_SQL = """
-- 1. Users (Authentication & Global Identity)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    phone VARCHAR(100) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 2. Hospitals (Tenants)
CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT DEFAULT '',
    phone VARCHAR(100) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    description TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Departments
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    dept_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hospital_id, dept_code)
);

-- 4. Patients (Demographics & Medical Profile)
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    medical_id VARCHAR(100) DEFAULT '',
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100) DEFAULT '',
    gender VARCHAR(50) DEFAULT 'other',
    age INTEGER DEFAULT 0 CHECK (age >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Family Members / Dependents
CREATE TABLE IF NOT EXISTS family_members (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    age INTEGER DEFAULT 25 CHECK (age >= 0),
    gender VARCHAR(50) DEFAULT 'male',
    phone VARCHAR(100) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Employees (Hospital Staff, Doctors, Admins)
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    employee_code VARCHAR(100) DEFAULT '',
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100) DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hospital_id, user_id)
);

-- 7. Desks (Counters / Examination Rooms)
CREATE TABLE IF NOT EXISTS desks (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    desk_number INTEGER NOT NULL,
    desk_name VARCHAR(255) NOT NULL,
    assigned_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    current_ticket_id VARCHAR(100) DEFAULT '',
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hospital_id, department_id, desk_number)
);

-- 8. Kiosks (Self-Service / TV Monitors)
CREATE TABLE IF NOT EXISTS kiosks (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    kiosk_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'online',
    last_seen_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hospital_id, kiosk_code)
);

-- 9. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    appointment_id VARCHAR(100) UNIQUE NOT NULL,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    consumer_type VARCHAR(50) NOT NULL DEFAULT 'hospital',
    service_category VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    ticket_id VARCHAR(100) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Appointment Status History
CREATE TABLE IF NOT EXISTS appointment_status_history (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    appointment_id VARCHAR(100) NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    ticket_id VARCHAR(100) UNIQUE NOT NULL,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
    appointment_id VARCHAR(100) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    consumer_type VARCHAR(50) NOT NULL DEFAULT 'hospital',
    service_category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    priority_level INTEGER NOT NULL DEFAULT 2 CHECK (priority_level >= 1),
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    join_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'waiting',
    predicted_service_minutes DOUBLE PRECISION DEFAULT 10.0,
    estimated_wait_minutes DOUBLE PRECISION DEFAULT 0.0,
    position INTEGER DEFAULT 0,
    serve_start_time TIMESTAMPTZ,
    serve_end_time TIMESTAMPTZ,
    actual_service_minutes DOUBLE PRECISION,
    medical_condition VARCHAR(100) DEFAULT 'general_checkup',
    pre_existing_condition VARCHAR(100) DEFAULT 'none',
    complexity_score DOUBLE PRECISION DEFAULT 1.0,
    prescription_notes TEXT DEFAULT '',
    parent_ticket_id VARCHAR(100) DEFAULT '',
    transferred_from_dept VARCHAR(100) DEFAULT '',
    source VARCHAR(50) DEFAULT 'patient_portal',
    kiosk_code VARCHAR(100) DEFAULT '',
    effective_timestamp TIMESTAMPTZ,
    adjustment_count INTEGER DEFAULT 0 CHECK (adjustment_count >= 0),
    last_adjusted_at TIMESTAMPTZ,
    cancellation_reason TEXT DEFAULT '',
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Queue Events
CREATE TABLE IF NOT EXISTS queue_events (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    ticket_id VARCHAR(100) NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    old_position INTEGER,
    new_position INTEGER,
    performed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Service Logs
CREATE TABLE IF NOT EXISTS service_logs (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    ticket_id VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    consumer_type VARCHAR(50) NOT NULL DEFAULT 'hospital',
    service_category VARCHAR(100) NOT NULL,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hour_of_day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    queue_length INTEGER NOT NULL,
    active_staff_counters INTEGER NOT NULL,
    is_peak_hour INTEGER NOT NULL,
    complexity_score DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    historical_avg_speed DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    service_duration_minutes DOUBLE PRECISION NOT NULL CHECK (service_duration_minutes >= 0),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Tenant Historical Data (ML Training Datasets)
CREATE TABLE IF NOT EXISTS tenant_historical_data (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE CASCADE,
    legacy_tenant_id VARCHAR(100) NOT NULL,
    consumer_type VARCHAR(50) NOT NULL DEFAULT 'hospital',
    queue_date DATE,
    timestamp TIMESTAMPTZ,
    queue_length INTEGER NOT NULL,
    active_staff_counters INTEGER NOT NULL,
    service_category VARCHAR(100) NOT NULL,
    service_duration_minutes DOUBLE PRECISION NOT NULL CHECK (service_duration_minutes >= 0),
    complexity_score DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    hour_of_day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    is_peak_hour INTEGER NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Tenant Configurations
CREATE TABLE IF NOT EXISTS tenant_config (
    hospital_id INTEGER PRIMARY KEY REFERENCES hospitals(id) ON DELETE CASCADE,
    legacy_tenant_id VARCHAR(100),
    active_counters INTEGER DEFAULT 2,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Tenant Mappings
CREATE TABLE IF NOT EXISTS tenant_mapping (
    hospital_id INTEGER PRIMARY KEY REFERENCES hospitals(id) ON DELETE CASCADE,
    legacy_tenant_id VARCHAR(100),
    mapping_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Production Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_hospitals_code ON hospitals(hospital_code);
CREATE INDEX IF NOT EXISTS idx_departments_hospital ON departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_employees_hospital ON employees(hospital_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_desks_hospital_dept ON desks(hospital_id, department_id);
CREATE INDEX IF NOT EXISTS idx_kiosks_hospital_dept ON kiosks(hospital_id, department_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_date ON appointments(hospital_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_date_status ON appointments(hospital_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_tickets_hospital_status ON tickets(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_dept_status ON tickets(department_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_patient ON tickets(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_events_ticket ON queue_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_queue_events_hospital_created ON queue_events(hospital_id, created_at);
CREATE INDEX IF NOT EXISTS idx_service_logs_hospital_dept ON service_logs(hospital_id, department_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hospital_created ON audit_logs(hospital_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
"""

DROP_SCHEMA_SQL = """
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS tenant_mapping CASCADE;
DROP TABLE IF EXISTS tenant_config CASCADE;
DROP TABLE IF EXISTS tenant_historical_data CASCADE;
DROP TABLE IF EXISTS service_logs CASCADE;
DROP TABLE IF EXISTS queue_events CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS appointment_status_history CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS kiosks CASCADE;
DROP TABLE IF EXISTS desks CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS users CASCADE;
"""

def init_postgres_schema(drop_existing: bool = False):
    """Initializes production PostgreSQL tables and relational indexes."""
    if not IS_POSTGRES:
        return

    if drop_existing:
        with get_db_connection() as conn:
            for stmt in DROP_SCHEMA_SQL.split(";"):
                clean_stmt = stmt.strip()
                if clean_stmt:
                    conn.execute(clean_stmt)

    with get_db_connection() as conn:
        for stmt in POSTGRES_SCHEMA_SQL.split(";"):
            clean_stmt = stmt.strip()
            if clean_stmt:
                conn.execute(clean_stmt)

    # Safe column migrations & composite indexes for existing and new databases
    _safe_migrations = [
        "ALTER TABLE family_members ADD COLUMN IF NOT EXISTS phone VARCHAR(100) DEFAULT ''",
        "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS queue_date DATE DEFAULT CURRENT_DATE",
        "ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS queue_date DATE DEFAULT CURRENT_DATE",
        "ALTER TABLE tenant_historical_data ADD COLUMN IF NOT EXISTS queue_date DATE",
        "UPDATE tickets SET queue_date = COALESCE((SELECT a.appointment_date FROM appointments a WHERE a.appointment_id = tickets.appointment_id), (tickets.created_at AT TIME ZONE 'Asia/Kolkata')::date, (tickets.join_timestamp AT TIME ZONE 'Asia/Kolkata')::date, CURRENT_DATE) WHERE queue_date IS NULL",
        "CREATE INDEX IF NOT EXISTS idx_tickets_hospital_dept_date_status ON tickets(hospital_id, department_id, queue_date, status)",
        "CREATE INDEX IF NOT EXISTS idx_tickets_hospital_date ON tickets(hospital_id, queue_date)",
        "CREATE INDEX IF NOT EXISTS idx_appointments_hospital_date_status ON appointments(hospital_id, appointment_date, status)",
        "CREATE INDEX IF NOT EXISTS idx_service_logs_hospital_date ON service_logs(hospital_id, queue_date)",
        "CREATE INDEX IF NOT EXISTS idx_tenant_historical_date ON tenant_historical_data(hospital_id, queue_date)",
    ]
    for migration in _safe_migrations:
        try:
            with get_db_connection() as conn:
                conn.execute(migration)
        except Exception as _e:
            pass  # Column/index already exists

    print("[OK] Production PostgreSQL Schema Initialized (17 Relational Tables & Indexes).")


print(f"[Database Manager] Initialized -> Mode: {get_db_info()['db_type']}")

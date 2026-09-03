"""
database.py
-----------
Unified Database Manager for AI Queue System.
Serves as the single source of truth for database connectivity.

Supports:
- PostgreSQL (Localhost & Cloud: Supabase, Neon, AWS RDS, Render, Heroku)
- SQLite Fallback (queue_system.db)
"""

import os
import re
import urllib.parse
from contextlib import contextmanager
from typing import Any, Dict, List, Optional, Tuple, Union

from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

RAW_DB_URL = os.getenv("DATABASE_URL", "sqlite:///queue_system.db").strip()

if RAW_DB_URL.startswith("postgres://"):
    RAW_DB_URL = RAW_DB_URL.replace("postgres://", "postgresql://", 1)

IS_POSTGRES = RAW_DB_URL.startswith("postgresql")
IS_SQLITE = RAW_DB_URL.startswith("sqlite")

# Parse connection details securely (never expose password)
PARSED_URL = urllib.parse.urlparse(RAW_DB_URL) if IS_POSTGRES else None
DB_NAME = PARSED_URL.path.lstrip("/") if PARSED_URL else "queue_system.db"
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
        print(f"⚠️ Warning: PostgreSQL pool initialization failed: {e}")
        _pg_pool = None

# SQLAlchemy Engine & SessionLocal for ORM compatibility
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

if IS_SQLITE:
    db_file = RAW_DB_URL.replace("sqlite:///", "")
    if not os.path.isabs(db_file):
        db_file = os.path.join(os.path.dirname(__file__), db_file)
    engine = create_engine(f"sqlite:///{db_file}", connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        RAW_DB_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# -----------------------------------------------------------------------------
# Row & Cursor Wrappers for Transparent Dual Access (Dict + Numeric Index)
# -----------------------------------------------------------------------------

class DBRow:
    """Row wrapper compatible with both row['col'] and row[0], plus dict(row)."""
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


def _convert_placeholders(sql: str) -> str:
    """Converts SQLite '?' parameter placeholders to PostgreSQL '%s' placeholders."""
    # Matches ? outside of single quotes
    parts = re.split(r"('(?:''|[^'])*')", sql)
    for i in range(0, len(parts), 2):
        parts[i] = parts[i].replace("?", "%s")
    return "".join(parts)


TABLES_WITH_ID = {"users", "kiosks", "departments", "desks", "service_logs", "tenant_historical_data"}


class PostgresCursorWrapper:
    """Wraps psycopg2 cursor to provide transparent row access and placeholder conversion."""

    def __init__(self, cursor):
        self._cursor = cursor
        self._lastrowid = None

    @property
    def lastrowid(self):
        return self._lastrowid

    def execute(self, sql: str, params: Any = None):
        clean_sql = _convert_placeholders(sql)
        stripped = clean_sql.strip()
        is_insert = stripped.upper().startswith("INSERT INTO")
        has_returning = "RETURNING" in stripped.upper()
        appended_returning = False

        if is_insert and not has_returning:
            words = stripped.split()
            if len(words) >= 3:
                raw_tbl = words[2].split("(")[0].strip('"').strip("'").lower()
                if raw_tbl in TABLES_WITH_ID:
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
        clean_sql = _convert_placeholders(sql)
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
    """Wraps psycopg2 connection to provide direct execution and cursor management."""

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
    """Provides an isolated database connection context that commits on success."""
    if IS_POSTGRES:
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
    else:
        import sqlite3
        db_file = RAW_DB_URL.replace("sqlite:///", "")
        if not os.path.isabs(db_file):
            db_file = os.path.join(os.path.dirname(__file__), db_file)
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        try:
            with conn:
                yield conn
        finally:
            conn.close()


def get_db_info() -> Dict[str, Any]:
    """Returns dynamic database details without exposing credentials."""
    if IS_POSTGRES:
        mode = "Local PostgreSQL" if IS_LOCAL else "Production PostgreSQL"
        engine_name = "PostgreSQL"
    else:
        mode = "SQLite (Local File)"
        engine_name = "SQLite"

    return {
        "db_type": mode,
        "engine": engine_name,
        "database": DB_NAME,
        "host": DB_HOST if IS_POSTGRES else "local_disk",
        "port": DB_PORT if IS_POSTGRES else None,
        "status": "Connected",
        "is_cloud": IS_POSTGRES and not IS_LOCAL,
    }


# -----------------------------------------------------------------------------
# PostgreSQL Production Schema Initializer
# -----------------------------------------------------------------------------

POSTGRES_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS hospitals (
    hospital_code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    description TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    owner_email TEXT DEFAULT '',
    owner_user_id INTEGER DEFAULT 0,
    created_at DOUBLE PRECISION NOT NULL,
    updated_at DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_code TEXT NOT NULL,
    dept_code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at DOUBLE PRECISION NOT NULL,
    UNIQUE (hospital_code, dept_code)
);

CREATE TABLE IF NOT EXISTS desks (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    hospital_code TEXT NOT NULL,
    dept_code TEXT NOT NULL,
    desk_number INTEGER NOT NULL,
    desk_name TEXT NOT NULL,
    staff_user_id INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    current_ticket_id TEXT DEFAULT '',
    last_active_at DOUBLE PRECISION,
    UNIQUE (hospital_code, dept_code, desk_number)
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DOUBLE PRECISION NOT NULL,
    phone TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    age INTEGER DEFAULT 0,
    medical_id TEXT DEFAULT '',
    department TEXT DEFAULT 'all',
    hospital_code TEXT DEFAULT 'city-hospital-01',
    employee_id TEXT DEFAULT '',
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    age INTEGER DEFAULT 25,
    gender TEXT DEFAULT 'male',
    created_at DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS kiosks (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    kiosk_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'online',
    last_seen_at DOUBLE PRECISION,
    is_active INTEGER DEFAULT 1,
    created_at DOUBLE PRECISION NOT NULL,
    updated_at DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_config (
    tenant_id TEXT PRIMARY KEY,
    active_counters INTEGER DEFAULT 2,
    updated_at DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS tenant_mapping (
    tenant_id TEXT PRIMARY KEY,
    mapping_json TEXT NOT NULL,
    updated_at DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
    ticket_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    consumer_type TEXT NOT NULL,
    service_category TEXT NOT NULL,
    name TEXT NOT NULL,
    priority_level INTEGER NOT NULL,
    join_timestamp DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL,
    predicted_service_minutes DOUBLE PRECISION,
    estimated_wait_minutes DOUBLE PRECISION,
    position INTEGER,
    serve_start_time DOUBLE PRECISION,
    serve_end_time DOUBLE PRECISION,
    actual_service_minutes DOUBLE PRECISION,
    user_email TEXT DEFAULT '',
    age INTEGER DEFAULT 30,
    gender TEXT DEFAULT 'other',
    medical_condition TEXT DEFAULT 'general_checkup',
    pre_existing_condition TEXT DEFAULT 'none',
    complexity_score DOUBLE PRECISION DEFAULT 1.0,
    prescription_notes TEXT DEFAULT '',
    parent_ticket_id TEXT DEFAULT '',
    transferred_from_dept TEXT DEFAULT '',
    source TEXT DEFAULT 'patient_portal',
    kiosk_code TEXT DEFAULT '',
    effective_timestamp DOUBLE PRECISION,
    adjustment_count INTEGER DEFAULT 0,
    last_adjusted_at DOUBLE PRECISION,
    cancellation_reason TEXT DEFAULT '',
    cancelled_at DOUBLE PRECISION
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
    created_at DOUBLE PRECISION NOT NULL,
    ticket_id TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS service_logs (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    consumer_type TEXT NOT NULL,
    service_category TEXT NOT NULL,
    hour_of_day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    queue_length INTEGER NOT NULL,
    active_staff_counters INTEGER NOT NULL,
    is_peak_hour INTEGER NOT NULL,
    complexity_score DOUBLE PRECISION NOT NULL,
    historical_avg_speed DOUBLE PRECISION NOT NULL,
    service_duration_minutes DOUBLE PRECISION NOT NULL,
    completed_at DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_historical_data (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    consumer_type TEXT NOT NULL,
    timestamp DOUBLE PRECISION,
    queue_length INTEGER NOT NULL,
    active_staff_counters INTEGER NOT NULL,
    service_category TEXT NOT NULL,
    service_duration_minutes DOUBLE PRECISION NOT NULL,
    complexity_score DOUBLE PRECISION NOT NULL,
    hour_of_day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    is_peak_hour INTEGER NOT NULL,
    imported_at DOUBLE PRECISION NOT NULL
);

-- Production Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status ON tickets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_email ON tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_users_hospital ON users(hospital_code);
CREATE INDEX IF NOT EXISTS idx_departments_hospital ON departments(hospital_code);
CREATE INDEX IF NOT EXISTS idx_desks_hospital_dept ON desks(hospital_code, dept_code);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date ON appointments(tenant_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_service_logs_tenant ON service_logs(tenant_id);
"""

def init_postgres_schema():
    """Initializes production PostgreSQL tables and indexes."""
    if not IS_POSTGRES:
        return
    with get_db_connection() as conn:
        for stmt in POSTGRES_SCHEMA_SQL.split(";"):
            clean_stmt = stmt.strip()
            if clean_stmt:
                conn.execute(clean_stmt)
    print("[OK] Production PostgreSQL Schema Initialized (12 Tables & Relational Indexes).")


print(f"[Database Manager] Initialized -> Mode: {get_db_info()['db_type']}")

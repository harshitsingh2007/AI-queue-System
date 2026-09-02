"""
database.py
-----------
Unified Cloud SQL & SQLite Database Manager for AI Queue System.

Supports:
- Cloud PostgreSQL (Supabase, Neon, AWS RDS, Render, Heroku)
- Cloud MySQL (PlanetScale, AWS RDS)
- Local SQLite Fallback (queue_system.db)
"""

import os
import sqlite3
from typing import Any
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

RAW_DB_URL = os.getenv("DATABASE_URL", "sqlite:///queue_system.db").strip()

# Standardize Heroku/Render postgres:// to postgresql://
if RAW_DB_URL.startswith("postgres://"):
    RAW_DB_URL = RAW_DB_URL.replace("postgres://", "postgresql://", 1)

IS_POSTGRES = RAW_DB_URL.startswith("postgresql")
IS_MYSQL = RAW_DB_URL.startswith("mysql")
IS_SQLITE = RAW_DB_URL.startswith("sqlite")

# Configure SQLAlchemy Engine
if IS_SQLITE:
    # Use SQLite file path
    db_file = RAW_DB_URL.replace("sqlite:///", "")
    if not os.path.isabs(db_file):
        db_file = os.path.join(os.path.dirname(__file__), db_file)
    engine = create_engine(f"sqlite:///{db_file}", connect_args={"check_same_thread": False})
else:
    # Cloud PostgreSQL or MySQL
    engine = create_engine(
        RAW_DB_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_info() -> dict:
    """Returns database type and active connection string target."""
    if IS_POSTGRES:
        db_type = "Cloud PostgreSQL"
    elif IS_MYSQL:
        db_type = "Cloud MySQL"
    else:
        db_type = "SQLite (Local File)"
    
    return {
        "db_type": db_type,
        "is_cloud": not IS_SQLITE,
        "connection_url": RAW_DB_URL.split("@")[-1] if "@" in RAW_DB_URL else RAW_DB_URL
    }

print(f"🗄️ Database Manager Initialized -> Mode: {get_db_info()['db_type']}")

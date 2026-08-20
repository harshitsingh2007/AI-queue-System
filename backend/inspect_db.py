import sqlite3
import json

db_path = "queue_system.db"
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row

cursor = conn.cursor()
tables = [row[0] for row in cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]

print("=== SQLITE DATABASE OVERVIEW ===")
print("Database File: queue_system.db")
print("Tables Found:", tables)

for table in tables:
    print(f"\n==================================================")
    print(f" TABLE: {table}")
    print(f"==================================================")
    schema = cursor.execute(f"PRAGMA table_info('{table}');").fetchall()
    print("Schema Columns:")
    for col in schema:
        print(f"  - {col['name']} ({col['type']})")
    
    count = cursor.execute(f"SELECT COUNT(*) FROM '{table}';").fetchone()[0]
    print(f"\nTotal Records: {count}")
    
    rows = cursor.execute(f"SELECT * FROM '{table}' LIMIT 5;").fetchall()
    if rows:
        print("Sample Rows (First 5):")
        for idx, r in enumerate(rows, 1):
            print(f"  [{idx}] {dict(r)}")
    else:
        print("  (Table is currently empty)")

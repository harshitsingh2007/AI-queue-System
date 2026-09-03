import sqlite3

conn = sqlite3.connect("queue_system.db")
cursor = conn.cursor()

tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").fetchall()]
print(f"Total tables found: {len(tables)}")

for t in sorted(tables):
    count = cursor.execute(f"SELECT COUNT(*) FROM \"{t}\";").fetchone()[0]
    cols = cursor.execute(f"PRAGMA table_info(\"{t}\");").fetchall()
    col_summary = [f"{c[1]} ({c[2]})" + (" [PK]" if c[5] else "") + (" [NOT NULL]" if c[3] else "") for c in cols]
    
    indexes = cursor.execute(f"PRAGMA index_list(\"{t}\");").fetchall()
    idx_summary = []
    for idx in indexes:
        idx_info = cursor.execute(f"PRAGMA index_info(\"{idx[1]}\");").fetchall()
        idx_cols = [c[2] for c in idx_info]
        idx_summary.append(f"{idx[1]} (unique={bool(idx[2])}, cols={idx_cols})")
    
    print(f"\n==================================================")
    print(f"TABLE: {t} | Total Rows: {count}")
    print(f"==================================================")
    print("Columns:")
    for col in col_summary:
        print(f"  - {col}")
    if idx_summary:
        print("Indexes / Unique Constraints:")
        for idx in idx_summary:
            print(f"  * {idx}")

conn.close()

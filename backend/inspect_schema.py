"""
inspect_schema.py
-----------------
PostgreSQL Schema and Constraints Inspector for AI Queue System.
"""

from database import get_db_connection, get_db_info

def inspect_postgres_schema():
    info = get_db_info()
    print("=" * 65)
    print("POSTGRESQL PRODUCTION SCHEMA & CONSTRAINTS INSPECTOR")
    print(f"Engine:   {info['engine']}")
    print(f"Database: {info['database']}")
    print(f"Host:     {info['host']}:{info['port']}")
    print(f"Status:   {info['status']}")
    print("=" * 65)

    with get_db_connection() as conn:
        tables_res = conn.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """).fetchall()

        table_names = [t[0] for t in tables_res]
        print(f"Total Tables Found in PostgreSQL ({len(table_names)}):\n")

        for table in table_names:
            count = conn.execute(f'SELECT COUNT(*) FROM "{table}";').fetchone()[0]
            cols = conn.execute("""
                SELECT ordinal_position, column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position;
            """, (table,)).fetchall()

            col_summary = [f"{c[1]} ({c[2]})" + (" [NOT NULL]" if c[3] == "NO" else "") for c in cols]

            # Primary and foreign keys
            constraints = conn.execute("""
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints
                WHERE table_schema = 'public' AND table_name = %s;
            """, (table,)).fetchall()

            print(f"TABLE: {table:28} | Records: {count:4d}")
            print(f"  Columns ({len(cols)}): {', '.join(col_summary[:6])}{'...' if len(col_summary) > 6 else ''}")
            if constraints:
                c_str = ", ".join(f"{c[0]} ({c[1]})" for c in constraints)
                print(f"  Constraints: {c_str}")
            print("-" * 65)

if __name__ == "__main__":
    inspect_postgres_schema()

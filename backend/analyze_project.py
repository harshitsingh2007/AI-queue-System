import os
import re
import glob

def analyze():
    print("=== PROJECT DATABASE ARCHITECTURE ANALYSIS ===")
    
    # 1. Inspect Python files for SQL
    py_files = glob.glob("*.py")
    for fn in sorted(py_files):
        with open(fn, "r", encoding="utf-8") as f:
            content = f.read()
            
        sql_lines = []
        for line in content.splitlines():
            upper = line.upper()
            if any(kw in upper for kw in ["SELECT ", "INSERT INTO", "UPDATE ", "DELETE FROM", "CREATE TABLE", "PRAGMA", "SQLITE_"]):
                sql_lines.append(line.strip())
                
        print(f"\n[{fn}] -> {len(sql_lines)} SQL-related lines found")
        for s in sql_lines[:5]:
            print("   ", s[:100])

    # 2. Inspect Node backend
    node_files = glob.glob("node-backend/src/**/*.js", recursive=True) + glob.glob("node-backend/src/*.js")
    print(f"\n[Node Backend] -> {len(node_files)} files found")
    for nf in node_files:
        print("  -", nf)

if __name__ == "__main__":
    analyze()

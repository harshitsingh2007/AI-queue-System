import pandas as pd
import io
from schema_validator import detect_column_mappings, validate_and_transform_dataframe, normalize_col_name

csv_text = """Timestamp / Date-Time,Queue Length / Waiting Count,Active Counters / Staff,Service Category / Department,Service Duration / Handling Time
2026-01-01 08:06:00,7,5,Government Services,31
2026-01-01 08:49:00,3,10,Admissions,30
2026-01-01 09:14:00,9,6,Admissions,24
2026-01-01 09:40:00,7,10,Banking,11
2026-01-01 10:07:00,10,4,Documentation,22
2026-01-01 10:36:00,5,5,Returns & Refunds,15
2026-01-01 11:18:00,5,10,Healthcare,32
2026-01-01 11:40:00,8,7,Admissions,21
2026-01-01 12:10:00,9,3,Government Services,34
2026-01-01 12:33:00,1,8,Customer Support,19
2026-01-01 13:07:00,10,3,Admissions,23
2026-01-01 13:32:00,12,3,Customer Support,6
2026-01-01 14:01:00,15,2,Technical Support,32
2026-01-01 14:41:00,6,4,Technical Support,38
2026-01-01 15:05:00,8,7,Documentation,11
2026-01-01 15:31:00,3,9,Billing,17
2026-01-01 16:00:00,4,10,Healthcare,23
"""

df = pd.read_csv(io.StringIO(csv_text))
print("=== RAW COLUMNS ===")
print(list(df.columns))

print("\n=== NORMALIZED COLUMNS ===")
for col in df.columns:
    print(f'"{col}" -> "{normalize_col_name(col)}"')

suggested, unmapped, missing = detect_column_mappings(list(df.columns))
print("\n=== DETECTED MAPPING ===")
print("Suggested:", suggested)
print("Unmapped:", unmapped)
print("Missing:", missing)

print("\n=== VALIDATION RESULT ===")
val_res = validate_and_transform_dataframe(df, suggested, default_tenant_id='city-hospital-01')
print("Total Rows:", val_res["total_rows"])
print("Valid Rows:", val_res["valid_rows"])
print("Rejected Rows:", val_res["rejected_rows"])
print("Warnings:", val_res["warnings"])
print("Errors:", val_res["errors"])

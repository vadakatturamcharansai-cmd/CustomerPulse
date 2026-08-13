from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = PROJECT_ROOT / "data" / "prepared_customers.csv"

print("Reading prepared customer data...")

df = pd.read_csv(DATA_FILE)

print("\n--- DATASET ---")
print(f"Customers: {len(df):,}")
print(f"Columns: {len(df.columns)}")

print("\n--- CHURN ---")
churned = int(df["churn"].sum())
stayed = len(df) - churned

print(f"Stayed: {stayed:,}")
print(f"Churned: {churned:,}")
print(f"Churn percentage: {(churned / len(df)) * 100:.2f}%")

print("\n--- MISSING DATA ---")
missing = df.isnull().mean().sort_values(ascending=False) * 100

print("Top 15 columns with most missing information:")
print(missing.head(15).round(2))

print("\n--- COLUMN TYPES ---")
print(df.dtypes.value_counts())

print("\n--- IMPORTANT BEHAVIOUR COLUMNS CHECK ---")

important_columns = [
    "arpu_6", "arpu_7", "arpu_8",
    "total_rech_amt_6", "total_rech_amt_7", "total_rech_amt_8",
    "total_ic_mou_6", "total_ic_mou_7", "total_ic_mou_8",
    "total_og_mou_6", "total_og_mou_7", "total_og_mou_8",
    "vol_2g_mb_6", "vol_2g_mb_7", "vol_2g_mb_8",
    "vol_3g_mb_6", "vol_3g_mb_7", "vol_3g_mb_8",
]

for column in important_columns:
    if column in df.columns:
        print(f"FOUND   {column}")
    else:
        print(f"MISSING {column}")

print("\nANALYSIS COMPLETE")
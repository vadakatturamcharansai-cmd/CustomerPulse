from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = PROJECT_ROOT / "data" / "prepared_customers.csv"
OUTPUT_FILE = PROJECT_ROOT / "data" / "clean_customers.csv"

print("Loading prepared data...")
df = pd.read_csv(INPUT_FILE)

print(f"Starting customers: {len(df):,}")
print(f"Starting columns: {len(df.columns)}")


# --------------------------------------------------
# 1. REMOVE COLUMNS WITH TOO MUCH MISSING DATA
# --------------------------------------------------

# If more than 60% of a column is empty, we remove it.
# There is too little information in that column to trust it.

missing_percentage = df.isnull().mean()

bad_columns = missing_percentage[
    missing_percentage > 0.60
].index.tolist()

# Never accidentally remove our answer column.
if "churn" in bad_columns:
    bad_columns.remove("churn")

df.drop(columns=bad_columns, inplace=True)

print(f"Columns removed for >60% missing data: {len(bad_columns)}")


# --------------------------------------------------
# 2. HANDLE DATE COLUMNS
# --------------------------------------------------

# Dates are text right now.
# Instead of giving raw dates to the model, we convert them
# into useful numbers such as day/month/year.

date_columns = [
    column for column in df.columns
    if "date" in column.lower()
]

for column in date_columns:

    converted = pd.to_datetime(
        df[column],
        errors="coerce",
        dayfirst=False
    )

    df[f"{column}_day"] = converted.dt.day
    df[f"{column}_month"] = converted.dt.month
    df[f"{column}_year"] = converted.dt.year

df.drop(columns=date_columns, inplace=True)

print(f"Date columns converted: {len(date_columns)}")


# --------------------------------------------------
# 3. HANDLE REMAINING NUMBER COLUMNS
# --------------------------------------------------

numeric_columns = df.select_dtypes(
    include=["number"]
).columns

for column in numeric_columns:

    if column == "churn":
        continue

    # Fill missing numbers using the middle value
    # of that column instead of deleting customers.

    median_value = df[column].median()

    df[column] = df[column].fillna(median_value)


# --------------------------------------------------
# 4. HANDLE REMAINING TEXT COLUMNS
# --------------------------------------------------

text_columns = df.select_dtypes(
    include=["object", "string"]
).columns

for column in text_columns:

    # Missing text becomes "Unknown".
    df[column] = df[column].fillna("Unknown")


# --------------------------------------------------
# 5. REMOVE INFINITE/BROKEN VALUES
# --------------------------------------------------

df.replace([np.inf, -np.inf], np.nan, inplace=True)

numeric_columns = df.select_dtypes(
    include=["number"]
).columns

for column in numeric_columns:

    if column == "churn":
        continue

    df[column] = df[column].fillna(df[column].median())


# --------------------------------------------------
# 6. FINAL SAFETY CHECK
# --------------------------------------------------

remaining_missing = int(df.isnull().sum().sum())

print(f"Remaining missing values: {remaining_missing}")

if remaining_missing != 0:
    raise ValueError(
        "Cleaning failed: missing values still exist."
    )

if "churn" not in df.columns:
    raise ValueError(
        "Cleaning failed: churn column disappeared."
    )


# --------------------------------------------------
# 7. SAVE CLEAN DATA
# --------------------------------------------------

df.to_csv(OUTPUT_FILE, index=False)

print()
print("CLEANING COMPLETE")
print(f"Final customers: {len(df):,}")
print(f"Final columns: {len(df.columns)}")
print(f"Churned customers: {int(df['churn'].sum()):,}")
print(f"Saved to: {OUTPUT_FILE}")
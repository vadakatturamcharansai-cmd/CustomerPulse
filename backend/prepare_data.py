from pathlib import Path
import pandas as pd

# --------------------------------------------------
# 1. FIND PROJECT FILES
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_FILE = PROJECT_ROOT / "data" / "telecom_churn_data.csv"
OUTPUT_FILE = PROJECT_ROOT / "data" / "prepared_customers.csv"


# --------------------------------------------------
# 2. LOAD ORIGINAL DATA
# --------------------------------------------------

print("Loading customer data...")

df = pd.read_csv(RAW_DATA_FILE)

print(f"Customers loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")


# --------------------------------------------------
# 3. FIND HIGH-VALUE CUSTOMERS
# --------------------------------------------------
# June and July represent the customer's normal period.
# We calculate their average recharge during these months.

df["avg_recharge_good_phase"] = (
    df["total_rech_amt_6"] + df["total_rech_amt_7"]
) / 2

# The dataset defines high-value customers as customers
# at or above the 70th percentile of this value.

high_value_limit = df["avg_recharge_good_phase"].quantile(0.70)

df = df[
    df["avg_recharge_good_phase"] >= high_value_limit
].copy()

print(f"High-value threshold: {high_value_limit:.2f}")
print(f"High-value customers: {len(df):,}")


# --------------------------------------------------
# 4. CREATE THE CHURN ANSWER
# --------------------------------------------------
# September is NOT used to predict churn.
# We only use September here to discover what really happened.
#
# If the customer had:
#   0 incoming call minutes
#   0 outgoing call minutes
#   0 2G internet usage
#   0 3G internet usage
#
# we mark that customer as churned.

df["churn"] = (
    (df["total_ic_mou_9"] == 0) &
    (df["total_og_mou_9"] == 0) &
    (df["vol_2g_mb_9"] == 0) &
    (df["vol_3g_mb_9"] == 0)
).astype(int)

print(f"Customers who churned: {df['churn'].sum():,}")
print(f"Customers who stayed: {(df['churn'] == 0).sum():,}")


# --------------------------------------------------
# 5. REMOVE SEPTEMBER INFORMATION
# --------------------------------------------------
# September contains information from AFTER the period
# from which we want to make our prediction.
#
# Keeping it would let the model see the answer.

september_columns = [
    column for column in df.columns
    if column.endswith("_9")
]

df.drop(columns=september_columns, inplace=True)

print(f"September columns removed: {len(september_columns)}")


# --------------------------------------------------
# 6. REMOVE CUSTOMER IDENTIFIER
# --------------------------------------------------
# mobile_number identifies the customer.
# The machine-learning model does not need the phone/customer number.

if "mobile_number" in df.columns:
    df.drop(columns=["mobile_number"], inplace=True)

print("Customer identifier removed.")


# --------------------------------------------------
# 7. SAVE PREPARED DATA
# --------------------------------------------------

df.to_csv(OUTPUT_FILE, index=False)

print()
print("DATA PREPARATION COMPLETE")
print(f"Final customers: {len(df):,}")
print(f"Final columns: {len(df.columns)}")
print(f"Saved to: {OUTPUT_FILE}")
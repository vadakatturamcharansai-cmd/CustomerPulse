from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "data" / "clean_customers.csv"
OUTPUT_FILE = PROJECT_ROOT / "data" / "customerpulse_features.csv"

print("Loading clean customer data...")
df = pd.read_csv(INPUT_FILE)

print(f"Customers: {len(df):,}")
print(f"Starting columns: {len(df.columns)}")


# --------------------------------------------------
# CREATE BEHAVIOUR-CHANGE FEATURES
# --------------------------------------------------
# June + July = customer's normal behaviour
# August      = warning/action month
#
# We compare August against the customer's own
# normal behaviour instead of only looking at August.

behaviours = {
    "revenue": "arpu",
    "recharge": "total_rech_amt",
    "incoming_calls": "total_ic_mou",
    "outgoing_calls": "total_og_mou",
    "internet_2g": "vol_2g_mb",
    "internet_3g": "vol_3g_mb",
}


created_features = []


for behaviour_name, column_base in behaviours.items():

    june = f"{column_base}_6"
    july = f"{column_base}_7"
    august = f"{column_base}_8"

    if not all(column in df.columns for column in [june, july, august]):
        print(f"SKIPPED: {behaviour_name}")
        continue

    # Customer's normal behaviour = average of June and July
    normal_column = f"{behaviour_name}_normal"

    df[normal_column] = (
        df[june] + df[july]
    ) / 2


    # Absolute change in August
    change_column = f"{behaviour_name}_change"

    df[change_column] = (
        df[august] - df[normal_column]
    )


    # Percentage change in August
    percentage_column = f"{behaviour_name}_change_percent"

    df[percentage_column] = (
        df[change_column]
        / df[normal_column].replace(0, 1)
    ) * 100


    # Simple warning flag:
    # 1 means behaviour dropped by at least 30%
    # 0 means it did not
    drop_column = f"{behaviour_name}_major_drop"

    df[drop_column] = (
        df[percentage_column] <= -30
    ).astype(int)


    created_features.extend([
        normal_column,
        change_column,
        percentage_column,
        drop_column
    ])

    print(f"CREATED: {behaviour_name}")


# --------------------------------------------------
# OVERALL BEHAVIOUR WARNING SCORE
# --------------------------------------------------
# Count how many important behaviours dropped heavily.

drop_columns = [
    column
    for column in created_features
    if column.endswith("_major_drop")
]

df["behaviour_warning_count"] = df[drop_columns].sum(axis=1)


# --------------------------------------------------
# SAVE
# --------------------------------------------------

df.to_csv(OUTPUT_FILE, index=False)

print()
print("BEHAVIOUR FEATURES COMPLETE")
print(f"New behaviour features: {len(created_features) + 1}")
print(f"Final customers: {len(df):,}")
print(f"Final columns: {len(df.columns)}")

print()
print("Customers by warning count:")
print(
    df["behaviour_warning_count"]
    .value_counts()
    .sort_index()
)

print()
print(f"Saved to: {OUTPUT_FILE}")
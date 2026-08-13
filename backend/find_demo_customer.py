from pathlib import Path
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent.parent

ACTIONS_FILE = (
    PROJECT_ROOT
    / "data"
    / "customerpulse_actions.csv"
)

FEATURES_FILE = (
    PROJECT_ROOT
    / "data"
    / "customerpulse_features.csv"
)


print("Loading CustomerPulse data...")

customers = pd.read_csv(ACTIONS_FILE)
features = pd.read_csv(FEATURES_FILE)


# --------------------------------------------------
# 1. RESTORE ORIGINAL CUSTOMER ID
# --------------------------------------------------
#
# customerpulse_features.csv is still in the original
# customer order.
#
# Original row 0 = Customer 1
# Original row 1 = Customer 2
# ...
# Original row 17811 = Customer 17812
#
# customerpulse_actions.csv has been sorted by business
# priority, so we MUST merge using customer_id.
# --------------------------------------------------

features = features.copy()

if "customer_id" not in features.columns:
    features["customer_id"] = features.index + 1


# --------------------------------------------------
# 2. KEEP ONLY THE BEHAVIOURAL COLUMNS WE NEED
# --------------------------------------------------

behaviour_columns = [
    "customer_id",

    "arpu_6",
    "arpu_7",
    "arpu_8",

    "total_rech_amt_6",
    "total_rech_amt_7",
    "total_rech_amt_8",

    "total_ic_mou_6",
    "total_ic_mou_7",
    "total_ic_mou_8",

    "total_og_mou_6",
    "total_og_mou_7",
    "total_og_mou_8",
]


# --------------------------------------------------
# 3. VERIFY REQUIRED COLUMNS
# --------------------------------------------------

missing_columns = [
    column
    for column in behaviour_columns
    if column not in features.columns
]

if missing_columns:
    raise ValueError(
        "Missing behaviour columns: "
        + ", ".join(missing_columns)
    )


# --------------------------------------------------
# 4. CORRECT CUSTOMER-TO-CUSTOMER MERGE
# --------------------------------------------------

# Remove duplicate behavioural columns that may already
# exist inside the actions file.
columns_to_remove = [
    column
    for column in behaviour_columns
    if column != "customer_id"
    and column in customers.columns
]

customers_clean = customers.drop(
    columns=columns_to_remove
).copy()

# Now attach the authoritative behavioural history
# using the real customer ID.
data = customers_clean.merge(
    features[behaviour_columns],
    on="customer_id",
    how="left",
    validate="one_to_one",
)

# --------------------------------------------------
# 5. SAFETY CHECK
# --------------------------------------------------

if len(data) != len(customers):
    raise ValueError(
        "Customer count changed during merge."
    )

missing_history = data["arpu_6"].isna().sum()

print(
    f"Customers matched correctly: "
    f"{len(data):,}"
)

print(
    f"Customers missing behavioural history: "
    f"{missing_history:,}"
)


# --------------------------------------------------
# 6. SAFE PERCENTAGE DECLINE
# --------------------------------------------------

def decline_percent(start, end):

    start = pd.to_numeric(
        start,
        errors="coerce"
    ).fillna(0)

    end = pd.to_numeric(
        end,
        errors="coerce"
    ).fillna(0)

    decline = (
        (start - end)
        / start.abs().clip(lower=1)
    ) * 100

    return decline.clip(
        lower=-200,
        upper=100,
    )


# --------------------------------------------------
# 7. CALCULATE JUNE -> AUGUST DECLINES
# --------------------------------------------------

data["revenue_decline"] = decline_percent(
    data["arpu_6"],
    data["arpu_8"],
)

data["recharge_decline"] = decline_percent(
    data["total_rech_amt_6"],
    data["total_rech_amt_8"],
)

data["incoming_decline"] = decline_percent(
    data["total_ic_mou_6"],
    data["total_ic_mou_8"],
)

data["outgoing_decline"] = decline_percent(
    data["total_og_mou_6"],
    data["total_og_mou_8"],
)


# --------------------------------------------------
# 8. COUNT STRONG BEHAVIOURAL DECLINES
# --------------------------------------------------

decline_columns = [
    "revenue_decline",
    "recharge_decline",
    "incoming_decline",
    "outgoing_decline",
]

data["strong_declines"] = (
    data[decline_columns] >= 40
).sum(axis=1)


# --------------------------------------------------
# 9. FIND DEMO-WORTHY CUSTOMERS
# --------------------------------------------------
#
# Requirements:
#
# - At least 80% churn risk
# - At least two major behavioural declines
# - Some actual revenue at risk
#
# --------------------------------------------------

candidates = data[
    (data["risk_percentage"] >= 80)
    & (data["strong_declines"] >= 2)
    & (data["revenue_at_risk"] > 0)
].copy()


# --------------------------------------------------
# 10. CREATE DEMO SCORE
# --------------------------------------------------

candidates["demo_score"] = (
    candidates["risk_percentage"]
    + (candidates["strong_declines"] * 15)
    + (
        candidates["revenue_at_risk"]
        .clip(upper=3000)
        / 100
    )
)


candidates = candidates.sort_values(
    [
        "demo_score",
        "revenue_at_risk",
    ],
    ascending=False,
)


# --------------------------------------------------
# 11. DISPLAY BEST OPTIONS
# --------------------------------------------------

columns_to_show = [
    "customer_id",
    "business_priority_rank",
    "risk_percentage",
    "monthly_customer_value",
    "revenue_at_risk",

    "arpu_6",
    "arpu_7",
    "arpu_8",

    "total_rech_amt_6",
    "total_rech_amt_7",
    "total_rech_amt_8",

    "total_ic_mou_6",
    "total_ic_mou_7",
    "total_ic_mou_8",

    "total_og_mou_6",
    "total_og_mou_7",
    "total_og_mou_8",

    "revenue_decline",
    "recharge_decline",
    "incoming_decline",
    "outgoing_decline",

    "strong_declines",
    "demo_score",
]


print()
print("BEST CUSTOMERPULSE DEMO CUSTOMERS")
print("=" * 120)

if candidates.empty:

    print("No matching customers found.")

else:

    print(
        candidates[
            columns_to_show
        ]
        .head(10)
        .to_string(index=False)
    )


print()
print(
    f"Total suitable demo customers: "
    f"{len(candidates):,}"
)
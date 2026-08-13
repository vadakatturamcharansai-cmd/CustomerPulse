from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

RESULTS_FILE = BASE_DIR / "data" / "customerpulse_final.csv"
FEATURES_FILE = BASE_DIR / "data" / "customerpulse_features.csv"
OUTPUT_FILE = BASE_DIR / "data" / "customer_business_impact.csv"

print("Loading CustomerPulse results...")

results = pd.read_csv(RESULTS_FILE)
features = pd.read_csv(FEATURES_FILE)

print(f"Customers loaded: {len(results):,}")

# customer_id was created earlier as row number + 1.
# Recreate the same ID in the original feature data.
features = features.reset_index(drop=True)
features["customer_id"] = features.index + 1

if "arpu_8" not in features.columns:
    raise ValueError(
        "arpu_8 was not found in customerpulse_features.csv"
    )

# Bring August customer revenue into our final results.
df = results.merge(
    features[["customer_id", "arpu_8"]],
    on="customer_id",
    how="left"
)

# ARPU means Average Revenue Per User.
# We use August ARPU as the customer's latest monthly value.
df["monthly_customer_value"] = (
    pd.to_numeric(df["arpu_8"], errors="coerce")
    .fillna(0)
    .clip(lower=0)
)

# Expected monthly revenue at risk:
#
# ₹1000 customer with 80% churn probability
# = ₹800 expected revenue at risk.
df["revenue_at_risk"] = (
    df["monthly_customer_value"]
    * df["churn_probability"]
).round(2)

# Business priority should consider BOTH:
# - probability of leaving
# - money potentially lost
#
# Revenue at risk already combines both.
df = df.sort_values(
    "revenue_at_risk",
    ascending=False
).reset_index(drop=True)

df["business_priority_rank"] = df.index + 1

total_revenue = df["monthly_customer_value"].sum()
total_at_risk = df["revenue_at_risk"].sum()

print()
print("CUSTOMERPULSE BUSINESS IMPACT")
print("----------------------------------------")

print(
    f"Total monthly customer value: "
    f"₹{total_revenue:,.2f}"
)

print(
    f"Estimated monthly revenue at risk: "
    f"₹{total_at_risk:,.2f}"
)

for number in [100, 500, 1000]:

    priority_group = df.head(number)

    amount = priority_group[
        "revenue_at_risk"
    ].sum()

    print(
        f"Revenue at risk among top {number}: "
        f"₹{amount:,.2f}"
    )

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("BUSINESS IMPACT CALCULATION COMPLETE")
print(f"Saved to: {OUTPUT_FILE}")

print()
print("Top 5 customers by business priority:")

print(
    df[
        [
            "customer_id",
            "risk_percentage",
            "monthly_customer_value",
            "revenue_at_risk",
            "business_priority_rank",
        ]
    ]
    .head(5)
    .to_string(index=False)
)
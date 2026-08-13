from pathlib import Path
import pandas as pd
import joblib

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_FILE = PROJECT_ROOT / "data" / "customerpulse_features.csv"
MODEL_FILE = PROJECT_ROOT / "models" / "xgboost_model.joblib"
OUTPUT_FILE = PROJECT_ROOT / "data" / "customer_explanations.csv"

print("Loading customers and XGBoost model...")

df = pd.read_csv(DATA_FILE)
model = joblib.load(MODEL_FILE)

X = df.drop(columns=["churn"])

# --------------------------------------------------
# 1. GET CHURN RISK FOR EVERY CUSTOMER
# --------------------------------------------------

probabilities = model.predict_proba(X)[:, 1]

results = pd.DataFrame()

results["customer_id"] = range(1, len(df) + 1)
results["churn_probability"] = probabilities
results["risk_percentage"] = (probabilities * 100).round(2)


# --------------------------------------------------
# 2. RISK LEVEL
# --------------------------------------------------

def get_risk_level(probability):

    if probability >= 0.70:
        return "Critical"

    if probability >= 0.40:
        return "High"

    if probability >= 0.20:
        return "Medium"

    return "Low"


results["risk_level"] = results[
    "churn_probability"
].apply(get_risk_level)


# --------------------------------------------------
# 3. EXPLAIN BEHAVIOUR CHANGES
# --------------------------------------------------

behaviour_names = [
    "revenue",
    "recharge",
    "incoming_calls",
    "outgoing_calls",
    "internet_2g",
    "internet_3g",
]


def explain_customer(row):

    changes = []

    for behaviour in behaviour_names:

        column = f"{behaviour}_change_percent"

        if column not in row.index:
            continue

        change = row[column]

        if change <= -50:
            changes.append(
                (
                    abs(change),
                    f"{behaviour.replace('_', ' ').title()} "
                    f"dropped {abs(change):.0f}%"
                )
            )

        elif change <= -30:
            changes.append(
                (
                    abs(change),
                    f"{behaviour.replace('_', ' ').title()} "
                    f"decreased {abs(change):.0f}%"
                )
            )

    # Biggest behavioural changes first
    changes.sort(
        key=lambda item: item[0],
        reverse=True
    )

    explanations = [
        text for _, text in changes[:3]
    ]

    if not explanations:
        explanations.append(
            "No major behavioural drop detected"
        )

    return " | ".join(explanations)


results["behaviour_signals"] = df.apply(
    explain_customer,
    axis=1
)


# --------------------------------------------------
# 4. RETENTION RECOMMENDATION
# --------------------------------------------------

def recommend_action(row):

    recharge_drop = row.get(
        "recharge_change_percent",
        0
    )

    incoming_drop = row.get(
        "incoming_calls_change_percent",
        0
    )

    outgoing_drop = row.get(
        "outgoing_calls_change_percent",
        0
    )

    internet_2g_drop = row.get(
        "internet_2g_change_percent",
        0
    )

    internet_3g_drop = row.get(
        "internet_3g_change_percent",
        0
    )

    revenue_drop = row.get(
        "revenue_change_percent",
        0
    )

    # Recharge / payment behaviour
    if recharge_drop <= -30:
        return (
            "Offer recharge assistance or "
            "a personalized renewal incentive"
        )

    # Strong internet disengagement
    if (
        internet_2g_drop <= -30
        or internet_3g_drop <= -30
    ):
        return (
            "Send a personalized data-plan "
            "re-engagement offer"
        )

    # Call activity disengagement
    if (
        incoming_drop <= -30
        or outgoing_drop <= -30
    ):
        return (
            "Trigger proactive customer "
            "support outreach"
        )

    # Revenue decline
    if revenue_drop <= -30:
        return (
            "Review plan value and offer "
            "a suitable retention package"
        )

    return (
        "Monitor customer and schedule "
        "a personalized engagement check"
    )


results["recommended_action"] = df.apply(
    recommend_action,
    axis=1
)


# --------------------------------------------------
# 5. HUMAN-IN-THE-LOOP STATUS
# --------------------------------------------------

results["human_decision"] = "Pending"

results["final_action"] = results[
    "recommended_action"
]


# --------------------------------------------------
# 6. PRIORITIZE CUSTOMERS
# --------------------------------------------------

results = results.sort_values(
    "churn_probability",
    ascending=False
).reset_index(drop=True)

results["priority_rank"] = (
    results.index + 1
)


# --------------------------------------------------
# 7. SAVE
# --------------------------------------------------

results.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("CUSTOMER EXPLANATIONS CREATED")
print(f"Customers analyzed: {len(results):,}")

print()
print("Risk distribution:")
print(results["risk_level"].value_counts())

print()
print("Top 5 highest-risk customers:")

print(
    results[
        [
            "customer_id",
            "risk_percentage",
            "risk_level",
            "behaviour_signals",
            "recommended_action",
        ]
    ].head(5).to_string(index=False)
)

print()
print(f"Saved to: {OUTPUT_FILE}")
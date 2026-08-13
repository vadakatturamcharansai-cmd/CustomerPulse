from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = BASE_DIR / "data" / "customer_business_impact.csv"
OUTPUT_FILE = BASE_DIR / "data" / "customerpulse_actions.csv"

print("Loading CustomerPulse business intelligence...")

df = pd.read_csv(INPUT_FILE)

print(f"Customers loaded: {len(df):,}")


# --------------------------------------------------
# HELPER
# --------------------------------------------------

def contains(text, words):
    text = str(text).lower()
    return any(word.lower() in text for word in words)


# --------------------------------------------------
# RETENTION ENGINE
# --------------------------------------------------

def create_retention_plan(row):

    signals = str(row.get("behaviour_signals", ""))
    explanation = str(row.get("model_explanation", ""))

    combined_reason = signals + " " + explanation

    risk = float(row["risk_percentage"])
    value = float(row["monthly_customer_value"])
    revenue_at_risk = float(row["revenue_at_risk"])

    # ----------------------------------------------
    # 1. UNDERSTAND MAIN CUSTOMER PROBLEM
    # ----------------------------------------------

    if contains(
        combined_reason,
        ["recharge", "rech", "revenue"]
    ):
        reason_category = "Payment / Recharge Disengagement"

        action = (
            "Offer a personalized recharge or "
            "renewal incentive"
        )

        channel = "SMS + App Notification"

    elif contains(
        combined_reason,
        ["internet", "2g", "3g", "data"]
    ):
        reason_category = "Internet Usage Disengagement"

        action = (
            "Offer a personalized data-plan "
            "recommendation or usage incentive"
        )

        channel = "App Notification"

    elif contains(
        combined_reason,
        ["incoming", "outgoing", "call"]
    ):
        reason_category = "Communication Usage Decline"

        action = (
            "Trigger proactive customer outreach "
            "and review current plan suitability"
        )

        channel = "Customer Support Call"

    else:
        reason_category = "General Behavioural Disengagement"

        action = (
            "Send a personalized re-engagement "
            "message and monitor response"
        )

        channel = "SMS / Email"


    # ----------------------------------------------
    # 2. DECIDE URGENCY
    # ----------------------------------------------

    if risk >= 90:
        urgency = "Immediate"

    elif risk >= 70:
        urgency = "Within 24 Hours"

    elif risk >= 40:
        urgency = "Within 3 Days"

    else:
        urgency = "Monitor"


    # ----------------------------------------------
    # 3. BUSINESS VALUE CHANGES THE RESPONSE
    # ----------------------------------------------

    if revenue_at_risk >= 2000:

        action = (
            "Assign priority retention specialist. "
            + action
        )

        channel = "Human Retention Call"

    elif revenue_at_risk >= 1000:

        action = (
            "Prioritize customer for targeted outreach. "
            + action
        )


    # ----------------------------------------------
    # 4. OFFER LEVEL
    # ----------------------------------------------

    if risk >= 90 and value >= 1000:
        offer_level = "Premium Retention Offer"

    elif risk >= 70:
        offer_level = "Targeted Retention Offer"

    elif risk >= 40:
        offer_level = "Light Incentive"

    else:
        offer_level = "No Financial Incentive"


    # ----------------------------------------------
    # 5. HUMAN APPROVAL
    # ----------------------------------------------

    if risk >= 70 or revenue_at_risk >= 1000:
        approval_required = "Yes"
    else:
        approval_required = "No"


    return pd.Series({
        "retention_reason": reason_category,
        "retention_action": action,
        "contact_channel": channel,
        "action_urgency": urgency,
        "offer_level": offer_level,
        "human_approval_required": approval_required,
    })


print("Generating personalized retention plans...")

plans = df.apply(
    create_retention_plan,
    axis=1
)

df = pd.concat(
    [df, plans],
    axis=1
)


# --------------------------------------------------
# SAVE
# --------------------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("RETENTION ENGINE COMPLETE")
print("----------------------------------------")

print(
    "Immediate actions:",
    (df["action_urgency"] == "Immediate").sum()
)

print(
    "24-hour actions:",
    (df["action_urgency"] == "Within 24 Hours").sum()
)

print(
    "Human approvals required:",
    (df["human_approval_required"] == "Yes").sum()
)

print()
print("Retention reason distribution:")

print(
    df["retention_reason"]
    .value_counts()
)

print()
print("Top 5 retention plans:")

print(
    df[
        [
            "customer_id",
            "risk_percentage",
            "revenue_at_risk",
            "retention_reason",
            "retention_action",
            "contact_channel",
            "action_urgency",
            "offer_level",
        ]
    ]
    .head(5)
    .to_string(index=False)
)

print()
print(f"Saved to: {OUTPUT_FILE}")
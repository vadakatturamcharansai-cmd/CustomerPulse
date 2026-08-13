from pathlib import Path
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split


PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_FILE = PROJECT_ROOT / "data" / "customerpulse_features.csv"
MODEL_FILE = PROJECT_ROOT / "models" / "xgboost_model.joblib"
OUTPUT_FILE = PROJECT_ROOT / "data" / "customer_priorities.csv"


print("Loading data and trained model...")

df = pd.read_csv(DATA_FILE)
model = joblib.load(MODEL_FILE)

X = df.drop(columns=["churn"])
y = df["churn"]


# --------------------------------------------------
# RECREATE THE SAME TEST CUSTOMERS
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# --------------------------------------------------
# PREDICT RISK FOR EVERY TEST CUSTOMER
# --------------------------------------------------

churn_probability = model.predict_proba(X_test)[:, 1]

results = X_test.copy()

results["actual_churn"] = y_test.values
results["churn_probability"] = churn_probability

# Highest-risk customers first
results = results.sort_values(
    "churn_probability",
    ascending=False
).reset_index(drop=True)


# --------------------------------------------------
# BUSINESS METRICS
# --------------------------------------------------

total_actual_churners = int(y_test.sum())
normal_churn_rate = y_test.mean()

print()
print("BUSINESS PRIORITIZATION RESULTS")
print(f"Test customers: {len(results):,}")
print(f"Actual churners: {total_actual_churners:,}")
print(f"Normal churn rate: {normal_churn_rate * 100:.2f}%")

print()


def evaluate_top_k(k):

    top_customers = results.head(k)

    caught_churners = int(
        top_customers["actual_churn"].sum()
    )

    # Of the customers we contacted,
    # how many were really going to leave?
    precision_at_k = caught_churners / k

    # Of all customers who really left,
    # how many did we manage to catch?
    recall_at_k = (
        caught_churners / total_actual_churners
    )

    # How much better are we than randomly
    # selecting customers?
    lift_at_k = (
        precision_at_k / normal_churn_rate
    )

    print(f"TOP {k} CUSTOMERS")
    print(f"Actual churners caught: {caught_churners}")
    print(f"Precision@{k}: {precision_at_k * 100:.2f}%")
    print(f"Recall@{k}: {recall_at_k * 100:.2f}%")
    print(f"Lift@{k}: {lift_at_k:.2f}x")
    print("-" * 40)


for k in [100, 250, 500, 1000]:
    evaluate_top_k(k)


# --------------------------------------------------
# CREATE PRIORITY RANK
# --------------------------------------------------

results["priority_rank"] = (
    results.index + 1
)

results["risk_percentage"] = (
    results["churn_probability"] * 100
).round(2)


# Simple readable risk level for dashboard

def risk_level(probability):

    if probability >= 0.70:
        return "Critical"

    if probability >= 0.40:
        return "High"

    if probability >= 0.20:
        return "Medium"

    return "Low"


results["risk_level"] = results[
    "churn_probability"
].apply(risk_level)


# --------------------------------------------------
# SAVE PRIORITIZED CUSTOMERS
# --------------------------------------------------

results.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("PRIORITIZED CUSTOMER LIST SAVED")
print(f"Location: {OUTPUT_FILE}")
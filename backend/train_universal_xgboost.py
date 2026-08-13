from pathlib import Path

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    roc_auc_score,
    average_precision_score,
)

from xgboost import XGBClassifier


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

MATRIX_FILE = (
    PROJECT_ROOT
    / "data"
    / "customer_100d_matrix.csv"
)

SOURCE_FILE = (
    PROJECT_ROOT
    / "data"
    / "clean_customers.csv"
)

MODEL_FILE = (
    PROJECT_ROOT
    / "models"
    / "universal_xgboost_model.joblib"
)


# ============================================================
# LOAD UNIVERSAL REPRESENTATION
# ============================================================

print("=" * 68)
print("CUSTOMERPULSE — UNIVERSAL 100D XGBOOST")
print("=" * 68)

print("\nLoading 100D behaviour matrix...")

matrix_df = pd.read_csv(MATRIX_FILE)

print(f"Customers in matrix: {len(matrix_df):,}")
print(
    f"Behaviour dimensions: "
    f"{len([c for c in matrix_df.columns if c.startswith('D')])}"
)


# ============================================================
# LOAD LABELS
# ============================================================

print("\nLoading churn labels...")

source_df = pd.read_csv(
    SOURCE_FILE,
    usecols=["churn"],
)

if len(source_df) != len(matrix_df):
    raise ValueError(
        "Row count mismatch between 100D matrix "
        "and source customer data."
    )

if source_df["churn"].isna().any():
    raise ValueError(
        "Missing churn labels detected."
    )

print(
    f"Churners: "
    f"{int(source_df['churn'].sum()):,}"
)

print(
    f"Non-churners: "
    f"{int((source_df['churn'] == 0).sum()):,}"
)


# ============================================================
# FEATURES + TARGET
# ============================================================

feature_columns = [
    column
    for column in matrix_df.columns
    if column.startswith("D")
]

if len(feature_columns) != 100:
    raise ValueError(
        f"Expected 100 behaviour dimensions, "
        f"found {len(feature_columns)}."
    )

X = matrix_df[feature_columns].copy()
y = source_df["churn"].astype(int).copy()


# ============================================================
# SANITY CHECKS
# ============================================================

if X.isna().any().any():
    raise ValueError(
        "100D matrix contains missing values."
    )

if not set(y.unique()).issubset({0, 1}):
    raise ValueError(
        "Churn target must contain only 0 and 1."
    )

active_dimensions = int(
    (X.abs().sum(axis=0) > 0).sum()
)

print(
    f"\nActive dimensions: "
    f"{active_dimensions}/100"
)

print(
    f"Reserved dimensions: "
    f"{100 - active_dimensions}/100"
)


# ============================================================
# SAME TRAIN / TEST SPLIT AS EXISTING MODEL
# ============================================================

X_train, X_test, y_train, y_test = (
    train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )
)

print(
    f"\nTraining customers: "
    f"{len(X_train):,}"
)

print(
    f"Testing customers: "
    f"{len(X_test):,}"
)


# ============================================================
# HANDLE CLASS IMBALANCE
# ============================================================

customers_who_stayed = int(
    (y_train == 0).sum()
)

customers_who_churned = int(
    (y_train == 1).sum()
)

imbalance_ratio = (
    customers_who_stayed
    / customers_who_churned
)

print(
    f"Stayed in training: "
    f"{customers_who_stayed:,}"
)

print(
    f"Churned in training: "
    f"{customers_who_churned:,}"
)

print(
    f"Imbalance ratio: "
    f"{imbalance_ratio:.2f}"
)


# ============================================================
# SAME XGBOOST CONFIGURATION
# ============================================================

model = XGBClassifier(
    n_estimators=500,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.85,
    colsample_bytree=0.85,
    objective="binary:logistic",
    eval_metric="logloss",
    scale_pos_weight=imbalance_ratio,
    random_state=42,
    n_jobs=-1,
)


print(
    "\nTraining XGBoost on universal "
    "100D representation..."
)

model.fit(
    X_train,
    y_train,
)

print("Training complete.")


# ============================================================
# TEST MODEL
# ============================================================

predictions = model.predict(
    X_test
)

probabilities = model.predict_proba(
    X_test
)[:, 1]


print(
    "\n--- UNIVERSAL 100D XGBOOST RESULTS ---"
)

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        predictions,
    )
)

print("\nDetailed Report:")

print(
    classification_report(
        y_test,
        predictions,
        digits=3,
    )
)


roc_score = roc_auc_score(
    y_test,
    probabilities,
)

pr_score = average_precision_score(
    y_test,
    probabilities,
)

print(
    f"ROC-AUC: {roc_score:.4f}"
)

print(
    f"PR-AUC:  {pr_score:.4f}"
)


# ============================================================
# BUSINESS TEST — TOP 500
# ============================================================

business_results = pd.DataFrame({
    "actual_churn": y_test.values,
    "probability": probabilities,
})

business_results = (
    business_results
    .sort_values(
        "probability",
        ascending=False,
    )
)

top_500 = business_results.head(500)

caught = int(
    top_500[
        "actual_churn"
    ].sum()
)

total_test_churners = int(
    y_test.sum()
)

precision_500 = (
    caught / 500
)

recall_500 = (
    caught
    / total_test_churners
)

normal_rate = (
    y_test.mean()
)

lift_500 = (
    precision_500
    / normal_rate
)


print(
    "\n--- TOP 500 BUSINESS RESULT ---"
)

print(
    f"Actual test churners: "
    f"{total_test_churners}"
)

print(
    f"Actual churners caught: "
    f"{caught}"
)

print(
    f"Precision@500: "
    f"{precision_500 * 100:.2f}%"
)

print(
    f"Recall@500: "
    f"{recall_500 * 100:.2f}%"
)

print(
    f"Lift@500: "
    f"{lift_500:.2f}x"
)


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(
    model,
    MODEL_FILE,
)

print(
    "\nUNIVERSAL XGBOOST MODEL SAVED"
)

print(
    f"Location: {MODEL_FILE}"
)


# ============================================================
# COMPARISON REMINDER
# ============================================================

print()
print("=" * 68)
print("COMPARE AGAINST CURRENT CUSTOMERPULSE MODEL")
print("=" * 68)

print(
    """
Existing telecom-specific model:
Recall@500     = 65.90%
Lift@500       = 7.91x

Compare those values with the universal
100D model results printed above.
"""
)
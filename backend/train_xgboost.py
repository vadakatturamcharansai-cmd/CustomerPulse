from pathlib import Path
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score,
)

from xgboost import XGBClassifier


PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_FILE = PROJECT_ROOT / "data" / "customerpulse_features.csv"
MODEL_FILE = PROJECT_ROOT / "models" / "xgboost_model.joblib"


print("Loading CustomerPulse data...")

df = pd.read_csv(DATA_FILE)

X = df.drop(columns=["churn"])
y = df["churn"]


# --------------------------------------------------
# SAFETY CHECK
# --------------------------------------------------

# XGBoost needs numbers.
# Our current CustomerPulse feature file should already
# contain only numeric model inputs.

text_columns = X.select_dtypes(
    exclude=["number"]
).columns.tolist()

if text_columns:
    raise ValueError(
        f"Text columns still exist: {text_columns}"
    )


# --------------------------------------------------
# TRAIN / TEST SPLIT
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print(f"Training customers: {len(X_train):,}")
print(f"Testing customers: {len(X_test):,}")


# --------------------------------------------------
# HANDLE CHURN IMBALANCE
# --------------------------------------------------

customers_who_stayed = int((y_train == 0).sum())
customers_who_churned = int((y_train == 1).sum())

imbalance_ratio = (
    customers_who_stayed / customers_who_churned
)

print(f"Stayed in training: {customers_who_stayed:,}")
print(f"Churned in training: {customers_who_churned:,}")
print(f"Imbalance ratio: {imbalance_ratio:.2f}")


# --------------------------------------------------
# XGBOOST MODEL
# --------------------------------------------------

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


print("\nTraining XGBoost model...")

model.fit(X_train, y_train)

print("Training complete.")


# --------------------------------------------------
# TEST MODEL
# --------------------------------------------------

predictions = model.predict(X_test)

probabilities = model.predict_proba(X_test)[:, 1]

print("\n--- XGBOOST RESULTS ---")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, predictions))

print("\nDetailed Report:")
print(
    classification_report(
        y_test,
        predictions,
        digits=3
    )
)

roc_score = roc_auc_score(
    y_test,
    probabilities
)

pr_score = average_precision_score(
    y_test,
    probabilities
)

print(f"ROC-AUC: {roc_score:.4f}")
print(f"PR-AUC:  {pr_score:.4f}")


# --------------------------------------------------
# BUSINESS TEST — TOP 500
# --------------------------------------------------

business_results = pd.DataFrame({
    "actual_churn": y_test.values,
    "probability": probabilities,
})

business_results = business_results.sort_values(
    "probability",
    ascending=False
)

top_500 = business_results.head(500)

caught = int(top_500["actual_churn"].sum())

precision_500 = caught / 500
recall_500 = caught / int(y_test.sum())
normal_rate = y_test.mean()
lift_500 = precision_500 / normal_rate

print("\n--- TOP 500 BUSINESS RESULT ---")

print(f"Actual churners caught: {caught}")
print(f"Precision@500: {precision_500 * 100:.2f}%")
print(f"Recall@500: {recall_500 * 100:.2f}%")
print(f"Lift@500: {lift_500:.2f}x")


# --------------------------------------------------
# SAVE MODEL
# --------------------------------------------------

joblib.dump(model, MODEL_FILE)

print("\nXGBOOST MODEL SAVED")
print(f"Location: {MODEL_FILE}")
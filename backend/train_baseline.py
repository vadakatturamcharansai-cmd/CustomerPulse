from pathlib import Path
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    average_precision_score,
    confusion_matrix
)
import joblib


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = PROJECT_ROOT / "data" / "customerpulse_features.csv"
MODEL_FILE = PROJECT_ROOT / "models" / "baseline_model.joblib"


print("Loading CustomerPulse data...")

df = pd.read_csv(DATA_FILE)

# --------------------------------------------------
# 1. SEPARATE INPUT FROM ANSWER
# --------------------------------------------------

X = df.drop(columns=["churn"])
y = df["churn"]


# --------------------------------------------------
# 2. IDENTIFY NUMBER AND TEXT COLUMNS
# --------------------------------------------------

number_columns = X.select_dtypes(include=["number"]).columns.tolist()
text_columns = X.select_dtypes(exclude=["number"]).columns.tolist()

print(f"Number columns: {len(number_columns)}")
print(f"Text columns: {len(text_columns)}")


# --------------------------------------------------
# 3. PREPARE DIFFERENT COLUMN TYPES
# --------------------------------------------------

number_preparation = Pipeline([
    ("fill_missing", SimpleImputer(strategy="median"))
])

text_preparation = Pipeline([
    ("fill_missing", SimpleImputer(strategy="most_frequent")),
    (
        "convert_text",
        OneHotEncoder(
            handle_unknown="ignore"
        )
    )
])

preparation = ColumnTransformer([
    ("numbers", number_preparation, number_columns),
    ("text", text_preparation, text_columns)
])


# --------------------------------------------------
# 4. CREATE TRAINING AND TEST GROUPS
# --------------------------------------------------
# 80% teaches the model.
# 20% is kept hidden to test it fairly.

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
# 5. CREATE FIRST MODEL
# --------------------------------------------------
# class_weight helps because churn customers are much
# less common than customers who stay.

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)


customerpulse_model = Pipeline([
    ("prepare", preparation),
    ("model", model)
])


# --------------------------------------------------
# 6. TEACH THE MODEL
# --------------------------------------------------

print("\nTraining first CustomerPulse model...")

customerpulse_model.fit(X_train, y_train)

print("Training complete.")


# --------------------------------------------------
# 7. TEST THE MODEL
# --------------------------------------------------

predictions = customerpulse_model.predict(X_test)

churn_probability = customerpulse_model.predict_proba(X_test)[:, 1]

print("\n--- RESULTS ---")

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
    churn_probability
)

pr_score = average_precision_score(
    y_test,
    churn_probability
)

print(f"ROC-AUC: {roc_score:.4f}")
print(f"PR-AUC:  {pr_score:.4f}")


# --------------------------------------------------
# 8. SAVE MODEL
# --------------------------------------------------

joblib.dump(
    customerpulse_model,
    MODEL_FILE
)

print()
print("MODEL SAVED")
print(f"Location: {MODEL_FILE}")
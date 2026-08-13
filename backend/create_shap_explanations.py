from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import shap

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_FILE = PROJECT_ROOT / "data" / "customerpulse_features.csv"
MODEL_FILE = PROJECT_ROOT / "models" / "xgboost_model.joblib"
EXPLANATIONS_FILE = PROJECT_ROOT / "data" / "customer_explanations.csv"
OUTPUT_FILE = PROJECT_ROOT / "data" / "customerpulse_final.csv"

print("Loading data and model...")

df = pd.read_csv(DATA_FILE)
model = joblib.load(MODEL_FILE)
customer_results = pd.read_csv(EXPLANATIONS_FILE)

X = df.drop(columns=["churn"])

# --------------------------------------------------
# 1. CREATE SHAP EXPLAINER
# --------------------------------------------------
# SHAP tells us which inputs pushed the model
# toward predicting churn for each customer.

print("Creating SHAP explainer...")

explainer = shap.TreeExplainer(model)

print("Calculating model explanations...")

shap_values = explainer.shap_values(X)

# Safety for different SHAP versions
if isinstance(shap_values, list):
    shap_values = shap_values[-1]

shap_values = np.asarray(shap_values)

if shap_values.ndim == 3:
    shap_values = shap_values[:, :, -1]


# --------------------------------------------------
# 2. TRANSLATE TECHNICAL COLUMN NAMES
# --------------------------------------------------

def readable_feature_name(feature):

    replacements = {
        "arpu": "Revenue",
        "total_rech_amt": "Recharge amount",
        "total_ic_mou": "Incoming call usage",
        "total_og_mou": "Outgoing call usage",
        "vol_2g_mb": "2G internet usage",
        "vol_3g_mb": "3G internet usage",
        "_6": " in June",
        "_7": " in July",
        "_8": " in August",
        "_normal": " normal level",
        "_change_percent": " percentage change",
        "_change": " change",
        "_major_drop": " major drop",
    }

    name = feature

    # Longer phrases first
    for old, new in sorted(
        replacements.items(),
        key=lambda item: len(item[0]),
        reverse=True
    ):
        name = name.replace(old, new)

    name = name.replace("_", " ")

    return name.strip().capitalize()


# --------------------------------------------------
# 3. FIND TOP MODEL REASONS FOR EACH CUSTOMER
# --------------------------------------------------

print("Finding strongest churn drivers...")

feature_names = X.columns.tolist()

shap_explanations = {}

for position in range(len(X)):

    customer_shap = shap_values[position]

    # Positive SHAP values push prediction toward churn.
    positive_indices = np.where(customer_shap > 0)[0]

    if len(positive_indices) > 0:

        ranked = positive_indices[
            np.argsort(
                customer_shap[positive_indices]
            )[::-1]
        ]

        top_indices = ranked[:3]

    else:
        # Fallback if no feature pushes toward churn.
        top_indices = np.argsort(
            np.abs(customer_shap)
        )[::-1][:3]

    reasons = []

    for feature_index in top_indices:

        feature = feature_names[feature_index]

        reasons.append(
            readable_feature_name(feature)
        )

    original_customer_id = position + 1

    shap_explanations[original_customer_id] = (
        " | ".join(reasons)
    )


# --------------------------------------------------
# 4. ADD SHAP REASONS TO OUR CUSTOMER LIST
# --------------------------------------------------

customer_results["model_explanation"] = (
    customer_results["customer_id"]
    .map(shap_explanations)
)


# --------------------------------------------------
# 5. FINAL SAFETY CHECK
# --------------------------------------------------

missing_explanations = (
    customer_results["model_explanation"]
    .isna()
    .sum()
)

print(
    f"Missing explanations: "
    f"{missing_explanations}"
)

if missing_explanations > 0:
    raise ValueError(
        "Some customers did not receive SHAP explanations."
    )


# --------------------------------------------------
# 6. SAVE FINAL CUSTOMER INTELLIGENCE FILE
# --------------------------------------------------

customer_results.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("SHAP EXPLANATIONS COMPLETE")
print(f"Customers explained: {len(customer_results):,}")

print()
print("Top 5 highest-risk customers:")

print(
    customer_results[
        [
            "customer_id",
            "risk_percentage",
            "model_explanation",
            "recommended_action",
        ]
    ]
    .head(5)
    .to_string(index=False)
)

print()
print(f"Saved to: {OUTPUT_FILE}")
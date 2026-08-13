from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
)

import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader


# --------------------------------------------------
# PATHS
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_FILE = PROJECT_ROOT / "data" / "customerpulse_features.csv"

MODEL_FILE = PROJECT_ROOT / "models" / "sequence_model.pth"
SCALER_FILE = PROJECT_ROOT / "models" / "sequence_scaler.joblib"


# --------------------------------------------------
# SETTINGS
# --------------------------------------------------

RANDOM_SEED = 42
BATCH_SIZE = 256
EPOCHS = 25
LEARNING_RATE = 0.001

np.random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)


# --------------------------------------------------
# 1. LOAD DATA
# --------------------------------------------------

print("Loading CustomerPulse data...")

df = pd.read_csv(DATA_FILE)


# --------------------------------------------------
# 2. CHOOSE BEHAVIOURS THAT EXIST FOR ALL 3 MONTHS
# --------------------------------------------------

behaviour_bases = [
    "arpu",
    "total_rech_amt",
    "total_ic_mou",
    "total_og_mou",
    "vol_2g_mb",
    "vol_3g_mb",
]

months = [6, 7, 8]

usable_behaviours = []

for base in behaviour_bases:

    required = [
        f"{base}_{month}"
        for month in months
    ]

    if all(column in df.columns for column in required):
        usable_behaviours.append(base)


print(f"Behaviours used: {len(usable_behaviours)}")

for behaviour in usable_behaviours:
    print(f"  {behaviour}")


# --------------------------------------------------
# 3. BUILD CUSTOMER SEQUENCES
# --------------------------------------------------
#
# Every customer becomes:
#
# [
#   [June behaviour],
#   [July behaviour],
#   [August behaviour]
# ]
#
# Shape:
# customers × 3 months × behaviours
# --------------------------------------------------

sequences = []

for _, customer in df.iterrows():

    customer_sequence = []

    for month in months:

        month_values = []

        for behaviour in usable_behaviours:

            value = customer[
                f"{behaviour}_{month}"
            ]

            month_values.append(value)

        customer_sequence.append(month_values)

    sequences.append(customer_sequence)


X = np.array(
    sequences,
    dtype=np.float32
)

y = df["churn"].to_numpy(
    dtype=np.float32
)


print(f"\nSequence shape: {X.shape}")
print(f"Customers: {X.shape[0]:,}")
print(f"Months per customer: {X.shape[1]}")
print(f"Behaviours per month: {X.shape[2]}")


# --------------------------------------------------
# 4. SAME FAIR TRAIN / TEST SPLIT
# --------------------------------------------------

indices = np.arange(len(df))

train_indices, test_indices = train_test_split(
    indices,
    test_size=0.20,
    random_state=RANDOM_SEED,
    stratify=y
)

X_train = X[train_indices]
X_test = X[test_indices]

y_train = y[train_indices]
y_test = y[test_indices]

print(f"\nTraining customers: {len(X_train):,}")
print(f"Testing customers: {len(X_test):,}")


# --------------------------------------------------
# 5. SCALE NUMBERS
# --------------------------------------------------
#
# Revenue may be hundreds while some other values
# may be tiny. We put them on comparable scales.
# --------------------------------------------------

scaler = StandardScaler()

feature_count = X_train.shape[2]

X_train_flat = X_train.reshape(
    -1,
    feature_count
)

X_test_flat = X_test.reshape(
    -1,
    feature_count
)

X_train_scaled = scaler.fit_transform(
    X_train_flat
).reshape(X_train.shape)

X_test_scaled = scaler.transform(
    X_test_flat
).reshape(X_test.shape)

joblib.dump(
    scaler,
    SCALER_FILE
)


# --------------------------------------------------
# 6. CONVERT TO PYTORCH DATA
# --------------------------------------------------

X_train_tensor = torch.tensor(
    X_train_scaled,
    dtype=torch.float32
)

X_test_tensor = torch.tensor(
    X_test_scaled,
    dtype=torch.float32
)

y_train_tensor = torch.tensor(
    y_train,
    dtype=torch.float32
)

y_test_tensor = torch.tensor(
    y_test,
    dtype=torch.float32
)


training_dataset = TensorDataset(
    X_train_tensor,
    y_train_tensor
)

training_loader = DataLoader(
    training_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True
)


# --------------------------------------------------
# 7. DEFINE SEQUENCE MODEL
# --------------------------------------------------

class CustomerBehaviourModel(nn.Module):

    def __init__(self, number_of_behaviours):

        super().__init__()

        self.lstm = nn.LSTM(
            input_size=number_of_behaviours,
            hidden_size=64,
            num_layers=2,
            batch_first=True,
            dropout=0.20,
        )

        self.dropout = nn.Dropout(0.25)

        self.output = nn.Linear(
            64,
            1
        )

    def forward(self, x):

        sequence_output, _ = self.lstm(x)

        # Take the understanding after August
        final_month_understanding = (
            sequence_output[:, -1, :]
        )

        final_month_understanding = (
            self.dropout(
                final_month_understanding
            )
        )

        prediction = self.output(
            final_month_understanding
        )

        return prediction.squeeze(1)


model = CustomerBehaviourModel(
    number_of_behaviours=feature_count
)


# --------------------------------------------------
# 8. HANDLE CHURN IMBALANCE
# --------------------------------------------------

stayed = np.sum(y_train == 0)
churned = np.sum(y_train == 1)

positive_weight = stayed / churned

print(
    f"\nChurn imbalance weight: "
    f"{positive_weight:.2f}"
)

loss_function = nn.BCEWithLogitsLoss(
    pos_weight=torch.tensor(
        positive_weight,
        dtype=torch.float32
    )
)

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=LEARNING_RATE
)


# --------------------------------------------------
# 9. TRAIN
# --------------------------------------------------

print("\nTraining sequence model...")

for epoch in range(EPOCHS):

    model.train()

    total_loss = 0

    for batch_X, batch_y in training_loader:

        optimizer.zero_grad()

        outputs = model(batch_X)

        loss = loss_function(
            outputs,
            batch_y
        )

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

    average_loss = (
        total_loss / len(training_loader)
    )

    print(
        f"Epoch {epoch + 1:02d}/{EPOCHS} "
        f"- Loss: {average_loss:.4f}"
    )


print("\nTraining complete.")


# --------------------------------------------------
# 10. TEST
# --------------------------------------------------

model.eval()

with torch.no_grad():

    raw_predictions = model(
        X_test_tensor
    )

    probabilities = torch.sigmoid(
        raw_predictions
    ).numpy()


predictions = (
    probabilities >= 0.50
).astype(int)


print("\n--- SEQUENCE MODEL RESULTS ---")

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        predictions
    )
)

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
# 11. BUSINESS TEST — TOP 500
# --------------------------------------------------

business_results = pd.DataFrame({
    "actual_churn": y_test,
    "probability": probabilities
})

business_results = (
    business_results
    .sort_values(
        "probability",
        ascending=False
    )
)

top_500 = business_results.head(500)

caught = int(
    top_500["actual_churn"].sum()
)

precision_500 = caught / 500

recall_500 = (
    caught / int(y_test.sum())
)

normal_churn_rate = y_test.mean()

lift_500 = (
    precision_500
    / normal_churn_rate
)


print("\n--- TOP 500 BUSINESS RESULT ---")

print(
    f"Actual churners caught: {caught}"
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


# --------------------------------------------------
# 12. SAVE MODEL
# --------------------------------------------------

torch.save(
    {
        "model_state": model.state_dict(),
        "behaviours": usable_behaviours,
        "months": months,
        "feature_count": feature_count,
    },
    MODEL_FILE
)


print("\nSEQUENCE MODEL SAVED")
print(f"Location: {MODEL_FILE}")
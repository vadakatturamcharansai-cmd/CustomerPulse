from pathlib import Path
from datetime import datetime
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

ACTIONS_FILE = BASE_DIR / "data" / "customerpulse_actions.csv"
FEEDBACK_FILE = BASE_DIR / "data" / "customer_feedback.csv"

print("Loading CustomerPulse actions...")

customers = pd.read_csv(ACTIONS_FILE)


# --------------------------------------------------
# CREATE FEEDBACK FILE IF IT DOES NOT EXIST
# --------------------------------------------------

if FEEDBACK_FILE.exists():
    feedback = pd.read_csv(FEEDBACK_FILE)
else:
    feedback = pd.DataFrame(
        columns=[
            "customer_id",
            "human_decision",
            "final_action",
            "customer_outcome",
            "feedback_time",
        ]
    )


# --------------------------------------------------
# FUNCTION TO RECORD CUSTOMER OUTCOME
# --------------------------------------------------

def record_feedback(customer_id, customer_outcome):

    match = customers[
        customers["customer_id"] == customer_id
    ]

    if match.empty:
        print("Customer not found.")
        return

    customer = match.iloc[0]

    new_feedback = {
        "customer_id": int(customer["customer_id"]),
        "human_decision": customer["human_decision"],
        "final_action": customer["final_action"],
        "customer_outcome": customer_outcome,
        "feedback_time": datetime.now().isoformat(),
    }

    global feedback

    feedback = pd.concat(
        [
            feedback,
            pd.DataFrame([new_feedback])
        ],
        ignore_index=True
    )

    feedback.to_csv(
        FEEDBACK_FILE,
        index=False
    )

    print()
    print("FEEDBACK SAVED")
    print("----------------------------")
    print(f"Customer: {customer_id}")
    print(f"Decision: {customer['human_decision']}")
    print(f"Outcome: {customer_outcome}")
    print()
    print(f"Saved to: {FEEDBACK_FILE}")


# --------------------------------------------------
# SIMPLE TEST
# --------------------------------------------------

if __name__ == "__main__":

    print()
    print("CustomerPulse Feedback Engine")
    print("----------------------------")

    customer_id = int(
        input("Enter customer ID: ")
    )

    print()
    print("Customer outcome:")
    print("1. Retained")
    print("2. Churned")
    print("3. Still Monitoring")

    choice = input(
        "Choose 1, 2 or 3: "
    )

    outcome_map = {
        "1": "Retained",
        "2": "Churned",
        "3": "Still Monitoring",
    }

    if choice not in outcome_map:
        print("Invalid choice.")
    else:
        record_feedback(
            customer_id,
            outcome_map[choice]
        )
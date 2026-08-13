from datetime import datetime
from pathlib import Path
from typing import Literal

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# --------------------------------------------------
# PATHS
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "customerpulse_actions.csv"
)

FEATURES_FILE = (
    PROJECT_ROOT
    / "data"
    / "customerpulse_features.csv"
)

FEEDBACK_FILE = (
    PROJECT_ROOT
    / "data"
    / "customer_feedback.csv"
)


# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------

print("Loading CustomerPulse intelligence...")

customers = pd.read_csv(DATA_FILE)

print(f"Customers loaded: {len(customers):,}")

print("Loading behavioural history...")

behaviour_features = pd.read_csv(FEATURES_FILE)

# The feature-engineering dataset originally did not
# contain customer_id, so recreate the same ID mapping
# used throughout CustomerPulse if necessary.
if "customer_id" not in behaviour_features.columns:
    behaviour_features["customer_id"] = (
        behaviour_features.index + 1
    )

print(
    "Behavioural histories loaded: "
    f"{len(behaviour_features):,}"
)


# --------------------------------------------------
# FASTAPI
# --------------------------------------------------

app = FastAPI(
    title="CustomerPulse API",
    description=(
        "Behaviour-first customer churn and "
        "retention intelligence API"
    ),
    version="3.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class DecisionRequest(BaseModel):
    decision: Literal[
        "Approved",
        "Modified",
        "Rejected",
    ]

    modified_action: str | None = None


class FeedbackRequest(BaseModel):
    outcome: Literal[
        "Retained",
        "Churned",
        "Still Monitoring",
    ]


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "CustomerPulse API is running",
        "version": "3.0.0",
        "customers": len(customers),
        "behaviour_history": True,
        "feedback_loop": True,
    }


# --------------------------------------------------
# SUMMARY
# --------------------------------------------------

@app.get("/summary")
def summary():

    return {
        "total_customers": len(customers),

        "critical_risk": int(
            (
                customers["risk_level"]
                == "Critical"
            ).sum()
        ),

        "high_risk": int(
            (
                customers["risk_level"]
                == "High"
            ).sum()
        ),

        "medium_risk": int(
            (
                customers["risk_level"]
                == "Medium"
            ).sum()
        ),

        "low_risk": int(
            (
                customers["risk_level"]
                == "Low"
            ).sum()
        ),

        "average_risk_percentage": round(
            float(
                customers[
                    "risk_percentage"
                ].mean()
            ),
            2,
        ),

        "total_monthly_customer_value": round(
            float(
                customers[
                    "monthly_customer_value"
                ].sum()
            ),
            2,
        ),

        "total_revenue_at_risk": round(
            float(
                customers[
                    "revenue_at_risk"
                ].sum()
            ),
            2,
        ),

        "immediate_actions": int(
            (
                customers["action_urgency"]
                == "Immediate"
            ).sum()
        ),

        "human_approvals_required": int(
            (
                customers[
                    "human_approval_required"
                ]
                == "Yes"
            ).sum()
        ),
    }


# --------------------------------------------------
# CUSTOMER LIST
# --------------------------------------------------

@app.get("/customers")
def get_customers(
    limit: int = 100,
    risk_level: str | None = None,
):

    data = customers

    if risk_level:

        data = data[
            data["risk_level"].str.lower()
            == risk_level.lower()
        ]

    data = (
        data
        .sort_values("business_priority_rank")
        .head(limit)
    )

    columns = [
        "customer_id",
        "business_priority_rank",
        "risk_percentage",
        "risk_level",
        "monthly_customer_value",
        "revenue_at_risk",
        "behaviour_signals",
        "model_explanation",
        "retention_reason",
        "retention_action",
        "contact_channel",
        "action_urgency",
        "offer_level",
        "human_approval_required",
        "human_decision",
        "final_action",
    ]

    return data[columns].to_dict(
        orient="records"
    )


# --------------------------------------------------
# SINGLE CUSTOMER
# --------------------------------------------------

@app.get("/customers/{customer_id}")
def get_customer(customer_id: int):

    match = customers[
        customers["customer_id"]
        == customer_id
    ]

    if match.empty:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    customer = match.iloc[0]

    return {
        "customer_id": int(
            customer["customer_id"]
        ),

        "business_priority_rank": int(
            customer[
                "business_priority_rank"
            ]
        ),

        "risk_percentage": float(
            customer["risk_percentage"]
        ),

        "risk_level": customer[
            "risk_level"
        ],

        "monthly_customer_value": float(
            customer[
                "monthly_customer_value"
            ]
        ),

        "revenue_at_risk": float(
            customer["revenue_at_risk"]
        ),

        "behaviour_signals": customer[
            "behaviour_signals"
        ],

        "model_explanation": customer[
            "model_explanation"
        ],

        "retention_reason": customer[
            "retention_reason"
        ],

        "retention_action": customer[
            "retention_action"
        ],

        "contact_channel": customer[
            "contact_channel"
        ],

        "action_urgency": customer[
            "action_urgency"
        ],

        "offer_level": customer[
            "offer_level"
        ],

        "human_approval_required": customer[
            "human_approval_required"
        ],

        "human_decision": customer[
            "human_decision"
        ],

        "final_action": customer[
            "final_action"
        ],
    }


# --------------------------------------------------
# BEHAVIOURAL HISTORY
# --------------------------------------------------

def safe_number(value):

    if pd.isna(value):
        return 0.0

    return round(float(value), 2)


@app.get(
    "/customers/{customer_id}/behaviour"
)
def get_customer_behaviour(
    customer_id: int,
):

    customer_exists = customers[
        customers["customer_id"]
        == customer_id
    ]

    if customer_exists.empty:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    match = behaviour_features[
        behaviour_features["customer_id"]
        == customer_id
    ]

    if match.empty:

        raise HTTPException(
            status_code=404,
            detail=(
                "Behavioural history "
                "not found"
            ),
        )

    customer = match.iloc[0]

    required_columns = [
        "arpu_6",
        "arpu_7",
        "arpu_8",
        "total_rech_amt_6",
        "total_rech_amt_7",
        "total_rech_amt_8",
        "total_ic_mou_6",
        "total_ic_mou_7",
        "total_ic_mou_8",
        "total_og_mou_6",
        "total_og_mou_7",
        "total_og_mou_8",
        "vol_2g_mb_6",
        "vol_2g_mb_7",
        "vol_2g_mb_8",
        "vol_3g_mb_6",
        "vol_3g_mb_7",
        "vol_3g_mb_8",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column
        not in behaviour_features.columns
    ]

    if missing_columns:

        raise HTTPException(
            status_code=500,
            detail={
                "message": (
                    "Required behaviour "
                    "columns are missing"
                ),
                "missing_columns":
                    missing_columns,
            },
        )

    timeline = [
        {
            "month": "June",

            "revenue": safe_number(
                customer["arpu_6"]
            ),

            "recharge": safe_number(
                customer[
                    "total_rech_amt_6"
                ]
            ),

            "incoming_calls": safe_number(
                customer[
                    "total_ic_mou_6"
                ]
            ),

            "outgoing_calls": safe_number(
                customer[
                    "total_og_mou_6"
                ]
            ),

            "internet_2g": safe_number(
                customer["vol_2g_mb_6"]
            ),

            "internet_3g": safe_number(
                customer["vol_3g_mb_6"]
            ),
        },

        {
            "month": "July",

            "revenue": safe_number(
                customer["arpu_7"]
            ),

            "recharge": safe_number(
                customer[
                    "total_rech_amt_7"
                ]
            ),

            "incoming_calls": safe_number(
                customer[
                    "total_ic_mou_7"
                ]
            ),

            "outgoing_calls": safe_number(
                customer[
                    "total_og_mou_7"
                ]
            ),

            "internet_2g": safe_number(
                customer["vol_2g_mb_7"]
            ),

            "internet_3g": safe_number(
                customer["vol_3g_mb_7"]
            ),
        },

        {
            "month": "August",

            "revenue": safe_number(
                customer["arpu_8"]
            ),

            "recharge": safe_number(
                customer[
                    "total_rech_amt_8"
                ]
            ),

            "incoming_calls": safe_number(
                customer[
                    "total_ic_mou_8"
                ]
            ),

            "outgoing_calls": safe_number(
                customer[
                    "total_og_mou_8"
                ]
            ),

            "internet_2g": safe_number(
                customer["vol_2g_mb_8"]
            ),

            "internet_3g": safe_number(
                customer["vol_3g_mb_8"]
            ),
        },
    ]

    return {
        "customer_id": customer_id,
        "months": 3,
        "timeline": timeline,
    }


# --------------------------------------------------
# HUMAN DECISION
# --------------------------------------------------

@app.post(
    "/customers/{customer_id}/decision"
)
def save_decision(
    customer_id: int,
    request: DecisionRequest,
):

    matching_indices = customers.index[
        customers["customer_id"]
        == customer_id
    ].tolist()

    if not matching_indices:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    index = matching_indices[0]

    if (
        request.decision == "Modified"
        and not request.modified_action
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "modified_action is "
                "required when decision "
                "is Modified"
            ),
        )

    customers.at[
        index,
        "human_decision",
    ] = request.decision

    if request.decision == "Approved":

        customers.at[
            index,
            "final_action",
        ] = customers.at[
            index,
            "retention_action",
        ]

    elif request.decision == "Modified":

        customers.at[
            index,
            "final_action",
        ] = request.modified_action

    else:

        customers.at[
            index,
            "final_action",
        ] = "No retention action"

    customers.to_csv(
        DATA_FILE,
        index=False,
    )

    return {
        "message": "Human decision saved",
        "customer_id": customer_id,
        "decision": request.decision,
        "final_action": customers.at[
            index,
            "final_action",
        ],
    }


# --------------------------------------------------
# FEEDBACK LOOP
# --------------------------------------------------

@app.post(
    "/customers/{customer_id}/feedback"
)
def save_customer_feedback(
    customer_id: int,
    request: FeedbackRequest,
):

    match = customers[
        customers["customer_id"]
        == customer_id
    ]

    if match.empty:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    customer = match.iloc[0]

    new_feedback = pd.DataFrame(
        [
            {
                "customer_id": int(
                    customer["customer_id"]
                ),

                "human_decision":
                    customer[
                        "human_decision"
                    ],

                "final_action":
                    customer[
                        "final_action"
                    ],

                "customer_outcome":
                    request.outcome,

                "feedback_time":
                    datetime.now().isoformat(),
            }
        ]
    )

    if FEEDBACK_FILE.exists():

        feedback = pd.read_csv(
            FEEDBACK_FILE
        )

        existing = feedback[
            feedback["customer_id"]
            == customer_id
        ]

        if not existing.empty:

            index = existing.index[0]

            feedback.at[
                index,
                "human_decision",
            ] = customer[
                "human_decision"
            ]

            feedback.at[
                index,
                "final_action",
            ] = customer[
                "final_action"
            ]

            feedback.at[
                index,
                "customer_outcome",
            ] = request.outcome

            feedback.at[
                index,
                "feedback_time",
            ] = (
                datetime.now()
                .isoformat()
            )

        else:

            feedback = pd.concat(
                [
                    feedback,
                    new_feedback,
                ],
                ignore_index=True,
            )

    else:

        feedback = new_feedback

    feedback.to_csv(
        FEEDBACK_FILE,
        index=False,
    )

    return {
        "message": (
            "Customer outcome saved "
            "to feedback loop"
        ),

        "customer_id":
            customer_id,

        "human_decision":
            customer[
                "human_decision"
            ],

        "final_action":
            customer[
                "final_action"
            ],

        "customer_outcome":
            request.outcome,
    }


# --------------------------------------------------
# FEEDBACK SUMMARY
# --------------------------------------------------

@app.get("/feedback")
def get_feedback():

    if not FEEDBACK_FILE.exists():

        return {
            "total_feedback_records": 0,
            "retained": 0,
            "churned": 0,
            "still_monitoring": 0,
        }

    feedback = pd.read_csv(
        FEEDBACK_FILE
    )

    return {
        "total_feedback_records":
            len(feedback),

        "retained": int(
            (
                feedback[
                    "customer_outcome"
                ]
                == "Retained"
            ).sum()
        ),

        "churned": int(
            (
                feedback[
                    "customer_outcome"
                ]
                == "Churned"
            ).sum()
        ),

        "still_monitoring": int(
            (
                feedback[
                    "customer_outcome"
                ]
                == "Still Monitoring"
            ).sum()
        ),
    }
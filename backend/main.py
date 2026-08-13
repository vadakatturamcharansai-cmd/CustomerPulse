from datetime import datetime
from pathlib import Path
from typing import Literal
import json

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# PATHS
# ============================================================

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

BEHAVIOUR_MATRIX_FILE = (
    PROJECT_ROOT
    / "data"
    / "customer_100d_matrix.csv"
)

BEHAVIOUR_MAPPING_FILE = (
    PROJECT_ROOT
    / "data"
    / "behaviour_mapping.json"
)


# ============================================================
# 100D BEHAVIOUR INTERFACE
# ============================================================

BEHAVIOUR_FAMILIES = [
    {
        "name": "Engagement",
        "key": "engagement",
        "start": 1,
        "end": 15,
        "capacity": 15,
    },
    {
        "name": "Activity",
        "key": "activity",
        "start": 16,
        "end": 30,
        "capacity": 15,
    },
    {
        "name": "Monetary",
        "key": "monetary",
        "start": 31,
        "end": 45,
        "capacity": 15,
    },
    {
        "name": "Frequency",
        "key": "frequency",
        "start": 46,
        "end": 55,
        "capacity": 10,
    },
    {
        "name": "Recency",
        "key": "recency",
        "start": 56,
        "end": 65,
        "capacity": 10,
    },
    {
        "name": "Trend",
        "key": "trend",
        "start": 66,
        "end": 80,
        "capacity": 15,
    },
    {
        "name": "Stability",
        "key": "stability",
        "start": 81,
        "end": 90,
        "capacity": 10,
    },
    {
        "name": "Friction",
        "key": "friction",
        "start": 91,
        "end": 100,
        "capacity": 10,
    },
]


# ============================================================
# LOAD DATA
# ============================================================

print("Loading CustomerPulse intelligence...")

customers = pd.read_csv(DATA_FILE)

print(
    f"Customers loaded: "
    f"{len(customers):,}"
)


print("Loading behavioural history...")

behaviour_features = pd.read_csv(
    FEATURES_FILE
)

if "customer_id" not in behaviour_features.columns:
    behaviour_features["customer_id"] = (
        behaviour_features.index + 1
    )

print(
    "Behavioural histories loaded: "
    f"{len(behaviour_features):,}"
)


# ============================================================
# LOAD 100D MATRIX
# ============================================================

print("Loading 100D Behaviour Interface...")

if not BEHAVIOUR_MATRIX_FILE.exists():
    raise RuntimeError(
        "customer_100d_matrix.csv not found. "
        "Run universal_behaviour_encoder.py first."
    )

behaviour_matrix = pd.read_csv(
    BEHAVIOUR_MATRIX_FILE
)

dimension_columns = [
    f"D{index:03d}"
    for index in range(1, 101)
]

missing_dimensions = [
    column
    for column in dimension_columns
    if column not in behaviour_matrix.columns
]

if missing_dimensions:
    raise RuntimeError(
        "100D matrix is incomplete. Missing: "
        + ", ".join(missing_dimensions)
    )

if "customer_id" not in behaviour_matrix.columns:
    behaviour_matrix.insert(
        0,
        "customer_id",
        range(
            1,
            len(behaviour_matrix) + 1,
        ),
    )


# ============================================================
# LOAD 100D METADATA
# ============================================================

if not BEHAVIOUR_MAPPING_FILE.exists():
    raise RuntimeError(
        "behaviour_mapping.json not found. "
        "Run universal_behaviour_encoder.py first."
    )

with open(
    BEHAVIOUR_MAPPING_FILE,
    "r",
    encoding="utf-8",
) as file:
    behaviour_mapping = json.load(file)


# A dimension is "active" when the dataset contains a real
# populated signal for that dimension.
active_dimension_names = {
    column
    for column in dimension_columns
    if behaviour_matrix[column].abs().sum() > 0
}

print(
    "100D Interface loaded: "
    f"{len(behaviour_matrix):,} customers | "
    f"{len(active_dimension_names)}/100 "
    "active dimensions"
)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="CustomerPulse API",
    description=(
        "Behaviour-first customer retention "
        "intelligence API"
    ),
    version="4.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

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


# ============================================================
# HELPERS
# ============================================================

def safe_number(value):

    if pd.isna(value):
        return 0.0

    return round(
        float(value),
        4,
    )


def family_for_dimension(
    dimension_number: int,
):

    for family in BEHAVIOUR_FAMILIES:

        if (
            family["start"]
            <= dimension_number
            <= family["end"]
        ):
            return family

    return None


def family_metadata():

    mapped_signals = (
        behaviour_mapping
        .get(
            "mapped_signals",
            {}
        )
    )

    output = []

    for family in BEHAVIOUR_FAMILIES:

        key = family["key"]

        mapped = mapped_signals.get(
            key,
            [],
        )

        active_count = 0

        for dimension_number in range(
            family["start"],
            family["end"] + 1,
        ):
            column = (
                f"D{dimension_number:03d}"
            )

            if (
                column
                in active_dimension_names
            ):
                active_count += 1

        output.append({
            **family,
            "mapped_dimensions":
                active_count,
            "reserved_dimensions":
                (
                    family["capacity"]
                    - active_count
                ),
            "mapped_signals":
                mapped,
        })

    return output


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message":
            "CustomerPulse API is running",

        "version":
            "4.0.0",

        "customers":
            len(customers),

        "behaviour_history":
            True,

        "behaviour_interface_100d":
            True,

        "intervention_outcome_loop":
            True,
    }


# ============================================================
# SUMMARY
# ============================================================

@app.get("/summary")
def summary():

    return {
        "total_customers":
            len(customers),

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

        "average_risk_percentage":
            round(
                float(
                    customers[
                        "risk_percentage"
                    ].mean()
                ),
                2,
            ),

        "total_monthly_customer_value":
            round(
                float(
                    customers[
                        "monthly_customer_value"
                    ].sum()
                ),
                2,
            ),

        "total_revenue_at_risk":
            round(
                float(
                    customers[
                        "revenue_at_risk"
                    ].sum()
                ),
                2,
            ),

        "immediate_actions": int(
            (
                customers[
                    "action_urgency"
                ]
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


# ============================================================
# 100D BEHAVIOUR INTERFACE SUMMARY
# ============================================================

@app.get("/behaviour-interface")
def get_behaviour_interface():

    return {
        "interface_name":
            "Behaviour Interface // 100D",

        "encoder_version":
            behaviour_mapping.get(
                "encoder_version",
                "2.0",
            ),

        "customers":
            int(
                behaviour_mapping.get(
                    "customers",
                    len(behaviour_matrix),
                )
            ),

        "source_signals":
            int(
                behaviour_mapping.get(
                    "source_columns",
                    155,
                )
            ),

        "temporal_groups":
            int(
                behaviour_mapping.get(
                    "temporal_groups_detected",
                    42,
                )
            ),

        "total_dimensions":
            100,

        "active_dimensions":
            len(
                active_dimension_names
            ),

        "reserved_dimensions":
            (
                100
                - len(
                    active_dimension_names
                )
            ),

        "families":
            family_metadata(),

        "design_note":
            behaviour_mapping.get(
                "design_note",
                (
                    "Dimensions unsupported "
                    "by the incoming schema "
                    "remain reserved."
                ),
            ),

        "benchmark": {
            "domain_specific": {
                "top_500_caught":
                    342,

                "total_test_churners":
                    519,

                "recall_at_500":
                    65.90,

                "lift_at_500":
                    7.91,
            },

            "standardized_100d": {
                "top_500_caught":
                    344,

                "total_test_churners":
                    519,

                "precision_at_500":
                    68.80,

                "recall_at_500":
                    66.28,

                "lift_at_500":
                    7.96,

                "roc_auc":
                    0.9455,

                "pr_auc":
                    0.6982,
            },

            "interpretation": (
                "The standardized 100D "
                "representation preserved "
                "comparable ranking performance "
                "on the telecom benchmark. "
                "The small numerical difference "
                "is not claimed as a meaningful "
                "performance improvement."
            ),
        },
    }


# ============================================================
# CUSTOMER LIST
# ============================================================

@app.get("/customers")
def get_customers(
    limit: int = 100,
    risk_level: str | None = None,
):

    data = customers

    if risk_level:

        data = data[
            data[
                "risk_level"
            ].str.lower()
            == risk_level.lower()
        ]

    data = (
        data
        .sort_values(
            "business_priority_rank"
        )
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

    return data[
        columns
    ].to_dict(
        orient="records"
    )


# ============================================================
# SINGLE CUSTOMER
# ============================================================

@app.get("/customers/{customer_id}")
def get_customer(
    customer_id: int,
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

    return {
        "customer_id":
            int(
                customer[
                    "customer_id"
                ]
            ),

        "business_priority_rank":
            int(
                customer[
                    "business_priority_rank"
                ]
            ),

        "risk_percentage":
            float(
                customer[
                    "risk_percentage"
                ]
            ),

        "risk_level":
            customer[
                "risk_level"
            ],

        "monthly_customer_value":
            float(
                customer[
                    "monthly_customer_value"
                ]
            ),

        "revenue_at_risk":
            float(
                customer[
                    "revenue_at_risk"
                ]
            ),

        "behaviour_signals":
            customer[
                "behaviour_signals"
            ],

        "model_explanation":
            customer[
                "model_explanation"
            ],

        "retention_reason":
            customer[
                "retention_reason"
            ],

        "retention_action":
            customer[
                "retention_action"
            ],

        "contact_channel":
            customer[
                "contact_channel"
            ],

        "action_urgency":
            customer[
                "action_urgency"
            ],

        "offer_level":
            customer[
                "offer_level"
            ],

        "human_approval_required":
            customer[
                "human_approval_required"
            ],

        "human_decision":
            customer[
                "human_decision"
            ],

        "final_action":
            customer[
                "final_action"
            ],
    }


# ============================================================
# CUSTOMER 100D VECTOR
# ============================================================

@app.get(
    "/customers/{customer_id}/behaviour-vector"
)
def get_customer_behaviour_vector(
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

    match = behaviour_matrix[
        behaviour_matrix["customer_id"]
        == customer_id
    ]

    if match.empty:

        raise HTTPException(
            status_code=404,
            detail=(
                "100D behaviour vector "
                "not found"
            ),
        )

    row = match.iloc[0]

    dimensions = []

    for index in range(
        1,
        101,
    ):

        dimension = (
            f"D{index:03d}"
        )

        family = (
            family_for_dimension(
                index
            )
        )

        value = safe_number(
            row[dimension]
        )

        dimensions.append({
            "dimension":
                dimension,

            "index":
                index,

            "family":
                (
                    family["name"]
                    if family
                    else "Unknown"
                ),

            "family_key":
                (
                    family["key"]
                    if family
                    else "unknown"
                ),

            "value":
                value,

            "magnitude":
                round(
                    min(
                        abs(value),
                        1.0,
                    ),
                    4,
                ),

            "state":
                (
                    "active"
                    if dimension
                    in active_dimension_names
                    else "reserved"
                ),
        })

    return {
        "customer_id":
            customer_id,

        "interface":
            "Behaviour Interface // 100D",

        "total_dimensions":
            100,

        "active_dimensions":
            len(
                active_dimension_names
            ),

        "reserved_dimensions":
            (
                100
                - len(
                    active_dimension_names
                )
            ),

        "dimensions":
            dimensions,
    }


# ============================================================
# BEHAVIOURAL HISTORY
# ============================================================

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
                "message":
                    (
                        "Required behaviour "
                        "columns are missing"
                    ),

                "missing_columns":
                    missing_columns,
            },
        )

    timeline = [
        {
            "month":
                "June",

            "revenue":
                safe_number(
                    customer[
                        "arpu_6"
                    ]
                ),

            "recharge":
                safe_number(
                    customer[
                        "total_rech_amt_6"
                    ]
                ),

            "incoming_calls":
                safe_number(
                    customer[
                        "total_ic_mou_6"
                    ]
                ),

            "outgoing_calls":
                safe_number(
                    customer[
                        "total_og_mou_6"
                    ]
                ),

            "internet_2g":
                safe_number(
                    customer[
                        "vol_2g_mb_6"
                    ]
                ),

            "internet_3g":
                safe_number(
                    customer[
                        "vol_3g_mb_6"
                    ]
                ),
        },

        {
            "month":
                "July",

            "revenue":
                safe_number(
                    customer[
                        "arpu_7"
                    ]
                ),

            "recharge":
                safe_number(
                    customer[
                        "total_rech_amt_7"
                    ]
                ),

            "incoming_calls":
                safe_number(
                    customer[
                        "total_ic_mou_7"
                    ]
                ),

            "outgoing_calls":
                safe_number(
                    customer[
                        "total_og_mou_7"
                    ]
                ),

            "internet_2g":
                safe_number(
                    customer[
                        "vol_2g_mb_7"
                    ]
                ),

            "internet_3g":
                safe_number(
                    customer[
                        "vol_3g_mb_7"
                    ]
                ),
        },

        {
            "month":
                "August",

            "revenue":
                safe_number(
                    customer[
                        "arpu_8"
                    ]
                ),

            "recharge":
                safe_number(
                    customer[
                        "total_rech_amt_8"
                    ]
                ),

            "incoming_calls":
                safe_number(
                    customer[
                        "total_ic_mou_8"
                    ]
                ),

            "outgoing_calls":
                safe_number(
                    customer[
                        "total_og_mou_8"
                    ]
                ),

            "internet_2g":
                safe_number(
                    customer[
                        "vol_2g_mb_8"
                    ]
                ),

            "internet_3g":
                safe_number(
                    customer[
                        "vol_3g_mb_8"
                    ]
                ),
        },
    ]

    return {
        "customer_id":
            customer_id,

        "months":
            3,

        "timeline":
            timeline,
    }


# ============================================================
# HUMAN DECISION
# ============================================================

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
        request.decision
        == "Modified"
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

    if (
        request.decision
        == "Approved"
    ):

        customers.at[
            index,
            "final_action",
        ] = customers.at[
            index,
            "retention_action",
        ]

    elif (
        request.decision
        == "Modified"
    ):

        customers.at[
            index,
            "final_action",
        ] = (
            request.modified_action
        )

    else:

        customers.at[
            index,
            "final_action",
        ] = (
            "No retention action"
        )

    customers.to_csv(
        DATA_FILE,
        index=False,
    )

    return {
        "message":
            "Human decision saved",

        "customer_id":
            customer_id,

        "decision":
            request.decision,

        "final_action":
            customers.at[
                index,
                "final_action",
            ],
    }


# ============================================================
# INTERVENTION OUTCOME LOOP
# ============================================================

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
                "customer_id":
                    int(
                        customer[
                            "customer_id"
                        ]
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
                    datetime
                    .now()
                    .isoformat(),
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
                datetime
                .now()
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
        "message":
            (
                "Customer outcome saved "
                "to intervention telemetry"
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


# ============================================================
# FEEDBACK SUMMARY
# ============================================================

@app.get("/feedback")
def get_feedback():

    if not FEEDBACK_FILE.exists():

        return {
            "total_feedback_records":
                0,

            "retained":
                0,

            "churned":
                0,

            "still_monitoring":
                0,
        }

    feedback = pd.read_csv(
        FEEDBACK_FILE
    )

    return {
        "total_feedback_records":
            len(feedback),

        "retained":
            int(
                (
                    feedback[
                        "customer_outcome"
                    ]
                    == "Retained"
                ).sum()
            ),

        "churned":
            int(
                (
                    feedback[
                        "customer_outcome"
                    ]
                    == "Churned"
                ).sum()
            ),

        "still_monitoring":
            int(
                (
                    feedback[
                        "customer_outcome"
                    ]
                    == "Still Monitoring"
                ).sum()
            ),
    }
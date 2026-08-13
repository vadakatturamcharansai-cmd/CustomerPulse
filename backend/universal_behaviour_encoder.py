from pathlib import Path
import json
import re

import numpy as np
import pandas as pd


# ============================================================
# CUSTOMERPULSE — UNIVERSAL 100D BEHAVIOUR ENCODER V2
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = PROJECT_ROOT / "data" / "clean_customers.csv"
OUTPUT_FILE = PROJECT_ROOT / "data" / "customer_100d_matrix.csv"
MAPPING_FILE = PROJECT_ROOT / "data" / "behaviour_mapping.json"


# ------------------------------------------------------------
# FIXED 100-DIMENSION BEHAVIOURAL SPACE
# ------------------------------------------------------------

FAMILY_SIZES = {
    "engagement": 15,   # D01-D15
    "activity": 15,     # D16-D30
    "monetary": 15,     # D31-D45
    "frequency": 10,    # D46-D55
    "recency": 10,      # D56-D65
    "trend": 15,        # D66-D80
    "stability": 10,    # D81-D90
    "friction": 10,     # D91-D100
}

assert sum(FAMILY_SIZES.values()) == 100


# ------------------------------------------------------------
# GENERIC SEMANTIC SIGNAL CATALOG
# ------------------------------------------------------------
#
# These are concepts, not exact telecom columns.
# The same matching logic can recognise analogous fields from
# another domain when names contain these behavioural concepts.
# ------------------------------------------------------------

SIGNAL_PATTERNS = {
    "engagement": [
        "total_ic_mou",
        "total_og_mou",
        "vol_2g",
        "vol_3g",
        "session",
        "login",
        "visit",
        "engagement",
        "interaction",
        "active",
        "usage",
    ],

    "activity": [
        "onnet_mou",
        "offnet_mou",
        "loc_ic_mou",
        "loc_og_mou",
        "std_ic_mou",
        "std_og_mou",
        "roam_ic_mou",
        "roam_og_mou",
        "transaction",
        "call",
        "message",
        "activity",
    ],

    "monetary": [
        "arpu",
        "total_rech_amt",
        "max_rech_amt",
        "last_day_rch_amt",
        "avg_recharge",
        "revenue",
        "spend",
        "amount",
        "order_value",
        "purchase_value",
        "payment_value",
    ],

    "frequency": [
        "total_rech_num",
        "monthly_2g",
        "monthly_3g",
        "sachet_2g",
        "sachet_3g",
        "order_count",
        "purchase_count",
        "transaction_count",
        "session_count",
        "login_count",
        "frequency",
    ],

    "friction": [
        "complaint",
        "support",
        "ticket",
        "refund",
        "cancel",
        "failure",
        "failed",
        "issue",
        "problem",
        "dispute",
    ],
}


# ------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------

def normalize_name(name):
    name = str(name).lower()
    name = re.sub(r"[^a-z0-9]+", "_", name)
    return name.strip("_")


def robust_scale(series):
    """
    Convert a numeric signal into a robust bounded scale.

    Output is approximately between -1 and +1.
    """

    series = pd.to_numeric(series, errors="coerce")
    series = series.replace([np.inf, -np.inf], np.nan)

    median = series.median()

    if pd.isna(median):
        return pd.Series(
            np.zeros(len(series)),
            index=series.index,
        )

    series = series.fillna(median)

    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)

    iqr = q3 - q1

    if pd.isna(iqr) or abs(iqr) < 1e-9:

        std = series.std()

        if pd.isna(std) or abs(std) < 1e-9:
            return pd.Series(
                np.zeros(len(series)),
                index=series.index,
            )

        scaled = (series - median) / std

    else:
        scaled = (series - median) / iqr

    return scaled.clip(-5, 5) / 5


def usable_numeric_columns(df):

    excluded = [
        "churn",
        "target",
        "label",
        "circle_id",
        "last_date_of_month",
    ]

    columns = []

    for column in df.columns:

        normalized = normalize_name(column)

        if any(word in normalized for word in excluded):
            continue

        if pd.api.types.is_numeric_dtype(df[column]):
            columns.append(column)

    return columns


# ------------------------------------------------------------
# TEMPORAL GROUP DETECTION
# ------------------------------------------------------------

def temporal_groups(df):
    """
    Detect groups such as:

        arpu_6
        arpu_7
        arpu_8

    and return:

        arpu -> [(6, arpu_6), (7, arpu_7), (8, arpu_8)]
    """

    groups = {}

    pattern = re.compile(r"(.+)_([678])$")

    for column in usable_numeric_columns(df):

        normalized = normalize_name(column)

        match = pattern.fullmatch(normalized)

        if not match:
            continue

        base = match.group(1)
        period = int(match.group(2))

        groups.setdefault(base, []).append(
            (period, column)
        )

    valid = {}

    for base, values in groups.items():

        values = sorted(values)

        periods = {
            period
            for period, _ in values
        }

        if {6, 7, 8}.issubset(periods):
            valid[base] = values

    return valid


def matches_family(base, family):

    normalized = normalize_name(base)

    patterns = SIGNAL_PATTERNS.get(
        family,
        [],
    )

    return any(
        pattern in normalized
        for pattern in patterns
    )


# ------------------------------------------------------------
# BEHAVIOURAL STATISTICS
# ------------------------------------------------------------

def get_three_period_values(df, columns):

    lookup = {
        period: column
        for period, column in columns
    }

    values = df[
        [
            lookup[6],
            lookup[7],
            lookup[8],
        ]
    ].apply(
        pd.to_numeric,
        errors="coerce",
    )

    values = values.fillna(0)

    return values


def current_level(values):
    return values.iloc[:, 2]


def historical_mean(values):
    return values.iloc[:, :2].mean(axis=1)


def relative_change(values):

    normal = historical_mean(values)

    current = current_level(values)

    denominator = normal.abs().replace(
        0,
        1,
    )

    return (current - normal) / denominator


def slope(values):

    june = values.iloc[:, 0]
    august = values.iloc[:, 2]

    denominator = june.abs().replace(
        0,
        1,
    )

    return (august - june) / denominator


def volatility(values):

    mean = values.mean(axis=1).abs().replace(
        0,
        1,
    )

    return values.std(axis=1) / mean


# ------------------------------------------------------------
# FAMILY SIGNAL SELECTION
# ------------------------------------------------------------

def family_groups(groups, family):

    result = []

    for base, columns in groups.items():

        if matches_family(base, family):
            result.append(
                (base, columns)
            )

    return sorted(
        result,
        key=lambda item: item[0],
    )


# ------------------------------------------------------------
# DIRECT FAMILY ENCODER
# ------------------------------------------------------------

def encode_family(df, groups, family, size):
    """
    Build dimensions from behavioural concepts.

    For each matched temporal signal we derive:
      - current level
      - relative change

    until the family capacity is filled.
    """

    matrix = np.zeros(
        (len(df), size),
        dtype=np.float32,
    )

    metadata = []

    matched = family_groups(
        groups,
        family,
    )

    dimension = 0

    # First pass: current behavioural level
    for base, columns in matched:

        if dimension >= size:
            break

        values = get_three_period_values(
            df,
            columns,
        )

        matrix[:, dimension] = robust_scale(
            current_level(values)
        ).to_numpy(dtype=np.float32)

        metadata.append({
            "dimension": dimension + 1,
            "signal": base,
            "statistic": "current_level",
        })

        dimension += 1

    # Second pass: recent behavioural change
    for base, columns in matched:

        if dimension >= size:
            break

        values = get_three_period_values(
            df,
            columns,
        )

        matrix[:, dimension] = robust_scale(
            relative_change(values)
        ).to_numpy(dtype=np.float32)

        metadata.append({
            "dimension": dimension + 1,
            "signal": base,
            "statistic": "relative_change",
        })

        dimension += 1

    return matrix, metadata


# ------------------------------------------------------------
# RECENCY FAMILY
# ------------------------------------------------------------

def encode_recency(df, size):

    matrix = np.zeros(
        (len(df), size),
        dtype=np.float32,
    )

    metadata = []

    dimension = 0

    # Telecom example:
    # date_of_last_rech_8_day represents how late in the
    # month the latest recharge occurred.
    #
    # Other domains can later map "days_since_purchase",
    # "days_since_login", etc. into this same family.

    candidates = [
        column
        for column in usable_numeric_columns(df)
        if (
            "date_of_last" in normalize_name(column)
            or "days_since" in normalize_name(column)
            or "recency" in normalize_name(column)
        )
    ]

    # Prefer most recent period first.
    candidates = sorted(
        candidates,
        key=lambda name: (
            "_8_" not in normalize_name(name),
            normalize_name(name),
        ),
    )

    for column in candidates:

        if dimension >= size:
            break

        normalized = normalize_name(column)

        # Year/month components are calendar metadata and
        # provide little behavioural value here.
        if normalized.endswith("_year"):
            continue

        if normalized.endswith("_month"):
            continue

        matrix[:, dimension] = robust_scale(
            df[column]
        ).to_numpy(dtype=np.float32)

        metadata.append({
            "dimension": dimension + 1,
            "signal": column,
            "statistic": "recency_proxy",
        })

        dimension += 1

    return matrix, metadata


# ------------------------------------------------------------
# TREND FAMILY
# ------------------------------------------------------------

TREND_PRIORITY = [
    "arpu",
    "total_rech_amt",
    "total_rech_num",
    "total_ic_mou",
    "total_og_mou",
    "vol_2g_mb",
    "vol_3g_mb",
    "onnet_mou",
    "offnet_mou",
    "loc_ic_mou",
    "loc_og_mou",
    "std_ic_mou",
    "std_og_mou",
    "monthly_2g",
    "monthly_3g",
]


def encode_trend(df, groups, size):

    matrix = np.zeros(
        (len(df), size),
        dtype=np.float32,
    )

    metadata = []

    dimension = 0

    ordered_bases = []

    # High-value concepts first
    for preferred in TREND_PRIORITY:
        if preferred in groups:
            ordered_bases.append(preferred)

    # Generic fallback
    for base in sorted(groups):
        if base not in ordered_bases:
            ordered_bases.append(base)

    for base in ordered_bases:

        if dimension >= size:
            break

        values = get_three_period_values(
            df,
            groups[base],
        )

        matrix[:, dimension] = robust_scale(
            slope(values)
        ).to_numpy(dtype=np.float32)

        metadata.append({
            "dimension": dimension + 1,
            "signal": base,
            "statistic": "june_to_august_trend",
        })

        dimension += 1

    return matrix, metadata


# ------------------------------------------------------------
# STABILITY FAMILY
# ------------------------------------------------------------

STABILITY_PRIORITY = [
    "arpu",
    "total_rech_amt",
    "total_rech_num",
    "total_ic_mou",
    "total_og_mou",
    "vol_2g_mb",
    "vol_3g_mb",
    "onnet_mou",
    "offnet_mou",
    "loc_ic_mou",
]


def encode_stability(df, groups, size):

    matrix = np.zeros(
        (len(df), size),
        dtype=np.float32,
    )

    metadata = []

    dimension = 0

    ordered_bases = []

    for preferred in STABILITY_PRIORITY:
        if preferred in groups:
            ordered_bases.append(preferred)

    for base in sorted(groups):
        if base not in ordered_bases:
            ordered_bases.append(base)

    for base in ordered_bases:

        if dimension >= size:
            break

        values = get_three_period_values(
            df,
            groups[base],
        )

        matrix[:, dimension] = robust_scale(
            volatility(values)
        ).to_numpy(dtype=np.float32)

        metadata.append({
            "dimension": dimension + 1,
            "signal": base,
            "statistic": "temporal_volatility",
        })

        dimension += 1

    return matrix, metadata


# ------------------------------------------------------------
# DIMENSION NAMES
# ------------------------------------------------------------

def dimension_names():

    names = []

    global_dimension = 1

    for family, size in FAMILY_SIZES.items():

        for _ in range(size):

            names.append(
                f"D{global_dimension:03d}"
            )

            global_dimension += 1

    assert len(names) == 100

    return names


# ------------------------------------------------------------
# BUILD UNIVERSAL MATRIX
# ------------------------------------------------------------

def build_matrix(df):

    groups = temporal_groups(df)

    print()
    print(
        f"Detected temporal behavioural groups: "
        f"{len(groups)}"
    )

    matrices = []
    metadata = {}

    for family in [
        "engagement",
        "activity",
        "monetary",
        "frequency",
    ]:

        matrix, info = encode_family(
            df,
            groups,
            family,
            FAMILY_SIZES[family],
        )

        matrices.append(matrix)
        metadata[family] = info

        print(
            f"{family.upper():12}"
            f"{len(info):2}/"
            f"{FAMILY_SIZES[family]} dimensions mapped"
        )

    recency_matrix, recency_info = (
        encode_recency(
            df,
            FAMILY_SIZES["recency"],
        )
    )

    matrices.append(recency_matrix)
    metadata["recency"] = recency_info

    print(
        f"{'RECENCY':12}"
        f"{len(recency_info):2}/"
        f"{FAMILY_SIZES['recency']} dimensions mapped"
    )

    trend_matrix, trend_info = (
        encode_trend(
            df,
            groups,
            FAMILY_SIZES["trend"],
        )
    )

    matrices.append(trend_matrix)
    metadata["trend"] = trend_info

    print(
        f"{'TREND':12}"
        f"{len(trend_info):2}/"
        f"{FAMILY_SIZES['trend']} dimensions mapped"
    )

    stability_matrix, stability_info = (
        encode_stability(
            df,
            groups,
            FAMILY_SIZES["stability"],
        )
    )

    matrices.append(stability_matrix)
    metadata["stability"] = stability_info

    print(
        f"{'STABILITY':12}"
        f"{len(stability_info):2}/"
        f"{FAMILY_SIZES['stability']} dimensions mapped"
    )

    friction_matrix, friction_info = (
        encode_family(
            df,
            groups,
            "friction",
            FAMILY_SIZES["friction"],
        )
    )

    matrices.append(friction_matrix)
    metadata["friction"] = friction_info

    print(
        f"{'FRICTION':12}"
        f"{len(friction_info):2}/"
        f"{FAMILY_SIZES['friction']} dimensions mapped"
    )

    final_matrix = np.concatenate(
        matrices,
        axis=1,
    )

    assert final_matrix.shape[1] == 100

    return final_matrix, metadata, groups


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    print("=" * 68)
    print(
        "CUSTOMERPULSE — UNIVERSAL 100D BEHAVIOUR ENCODER V2"
    )
    print("=" * 68)

    print()
    print(f"Loading: {INPUT_FILE}")

    df = pd.read_csv(INPUT_FILE)

    print(f"Customers: {len(df):,}")
    print(f"Raw columns: {len(df.columns):,}")

    matrix, metadata, groups = build_matrix(df)

    vector_columns = dimension_names()

    matrix_df = pd.DataFrame(
        matrix,
        columns=vector_columns,
    )

    # Stable row-level identifier for the MVP.
    if "customer_id" in df.columns:

        ids = df["customer_id"].values

    else:

        ids = np.arange(
            1,
            len(df) + 1,
        )

    matrix_df.insert(
        0,
        "customer_id",
        ids,
    )

    matrix_df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    populated = []

    for index, column in enumerate(
        vector_columns,
        start=1,
    ):

        if matrix_df[column].abs().sum() > 0:
            populated.append(index)

    mapping_output = {
        "encoder_version": "2.0",
        "architecture": FAMILY_SIZES,
        "total_dimensions": 100,
        "customers": int(len(df)),
        "source_columns": int(len(df.columns)),
        "temporal_groups_detected": int(
            len(groups)
        ),
        "populated_dimensions": int(
            len(populated)
        ),
        "reserved_dimensions": int(
            100 - len(populated)
        ),
        "mapped_signals": metadata,
        "design_note": (
            "The 100-dimensional space is a fixed-capacity "
            "behavioural interface. Dimensions unsupported by "
            "the incoming schema remain reserved rather than "
            "being populated with fabricated signals."
        ),
    }

    with open(
        MAPPING_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            mapping_output,
            file,
            indent=2,
        )

    print()
    print("=" * 68)
    print("ENCODING COMPLETE")
    print("=" * 68)

    print(
        f"Matrix: {len(df):,} customers × 100 dimensions"
    )

    print(
        f"Populated dimensions: {len(populated)}/100"
    )

    print(
        f"Reserved dimensions: "
        f"{100 - len(populated)}/100"
    )

    print()
    print(f"Saved matrix:")
    print(OUTPUT_FILE)

    print()
    print(f"Saved mapping:")
    print(MAPPING_FILE)

    print()
    print("First customer — first 15 dimensions:")

    print(
        matrix_df
        .iloc[0, 1:16]
        .round(3)
        .to_string()
    )


if __name__ == "__main__":
    main()
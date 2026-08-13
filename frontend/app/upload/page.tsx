"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Layers3,
  Loader2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";

type BehaviourFamily = {
  name: string;
  key: string;
  start: number;
  end: number;
  capacity: number;
  mapped_dimensions: number;
  reserved_dimensions: number;
};

type BehaviourInterface = {
  interface_name: string;
  encoder_version: string;
  customers: number;
  source_signals: number;
  temporal_groups: number;
  total_dimensions: number;
  active_dimensions: number;
  reserved_dimensions: number;
  families: BehaviourFamily[];
  benchmark: {
    domain_specific: {
      top_500_caught: number;
      total_test_churners: number;
      recall_at_500: number;
      lift_at_500: number;
    };
    standardized_100d: {
      top_500_caught: number;
      total_test_churners: number;
      precision_at_500: number;
      recall_at_500: number;
      lift_at_500: number;
      roc_auc: number;
      pr_auc: number;
    };
    interpretation: string;
  };
};

type Stage =
  | "idle"
  | "reading"
  | "schema"
  | "mapping"
  | "encoding"
  | "ready";

const API = "http://127.0.0.1:8000";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [interfaceData, setInterfaceData] =
    useState<BehaviourInterface | null>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");

  useEffect(() => {
    loadBehaviourInterface();
  }, []);

  async function loadBehaviourInterface() {
    try {
      const response = await fetch(`${API}/behaviour-interface`);

      if (response.ok) {
        const data: BehaviourInterface = await response.json();
        setInterfaceData(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function chooseFile() {
    inputRef.current?.click();
  }

  async function handleFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setFileSize(formatBytes(file.size));

    setStage("reading");
    await delay(800);

    setStage("schema");
    await delay(1000);

    setStage("mapping");
    await delay(1100);

    setStage("encoding");
    await delay(1200);

    setStage("ready");
  }

  const benchmark = interfaceData?.benchmark.standardized_100d;
  const baseline = interfaceData?.benchmark.domain_specific;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 82% 10%, rgba(20,168,133,.11), transparent 29%), #edf3f5",
        color: "#102536",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      {/* NAVBAR */}

      <header
        style={{
          background: "#092838",
          color: "white",
          padding: "22px 5%",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 13,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg,#19b993,#079e7c)",
                boxShadow:
                  "0 10px 30px rgba(0,220,170,.18)",
              }}
            >
              <Activity size={25} />
            </div>

            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 850,
                }}
              >
                CustomerPulse
              </div>

              <div
                style={{
                  color: "#8faab6",
                  fontSize: 12,
                  marginTop: 3,
                }}
              >
                Retention Intelligence System
              </div>
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              gap: 7,
            }}
          >
            {[
              ["Overview", "/"],
              ["Customers", "/customers"],
              ["Actions", "/actions"],
              ["Model", "/model"],
              ["Upload", "/upload"],
            ].map(([label, path]) => {
              const active = label === "Upload";

              return (
                <button
                  key={label}
                  onClick={() => router.push(path)}
                  style={{
                    border: "none",
                    background: active
                      ? "rgba(255,255,255,.10)"
                      : "transparent",
                    color: active ? "#ffffff" : "#9fb4be",
                    borderRadius: 10,
                    padding: "13px 18px",
                    cursor: "pointer",
                    fontWeight: 750,
                    fontSize: 14,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div
            style={{
              border:
                "1px solid rgba(25,185,147,.35)",
              background:
                "rgba(25,185,147,.08)",
              color: "#5ce5c3",
              borderRadius: 999,
              padding: "11px 17px",
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: 1,
              whiteSpace: "nowrap",
            }}
          >
            ● LIVE ENGINE
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          padding: "42px 5% 80px",
        }}
      >
        {/* HERO */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dce6e9",
            borderRadius: 20,
            padding: "38px",
            boxShadow:
              "0 12px 35px rgba(31,59,74,.05)",
          }}
        >
          <div
            style={{
              color: "#078d70",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            NEW DATASET // BEHAVIOUR ADAPTER
          </div>

          <h1
            style={{
              fontSize: "clamp(38px,4.4vw,60px)",
              letterSpacing: -2.4,
              margin: "9px 0 10px",
              lineHeight: 1,
            }}
          >
            Bring your customer data.
            <br />
            <span style={{ color: "#079e7c" }}>
              CustomerPulse maps the behaviour.
            </span>
          </h1>

          <p
            style={{
              maxWidth: 830,
              color: "#71858f",
              lineHeight: 1.7,
              margin: 0,
              fontSize: 14,
            }}
          >
            Different businesses expose different columns.
            CustomerPulse detects available behavioural signals and
            maps them into a standardized 100-dimensional interface
            for downstream churn ranking.
          </p>
        </section>

        {/* UPLOAD CARD */}

        <section
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "1fr .9fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dce6e9",
              borderRadius: 18,
              padding: 28,
            }}
          >
            <div
              style={{
                color: "#078d70",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.7,
              }}
            >
              STEP 01 // DATASET INGESTION
            </div>

            <h2
              style={{
                margin: "7px 0 5px",
                fontSize: 27,
              }}
            >
              Upload customer behaviour data
            </h2>

            <p
              style={{
                color: "#80929a",
                fontSize: 12,
                marginTop: 0,
              }}
            >
              CSV is sufficient for the current MVP demo.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              style={{ display: "none" }}
            />

            <button
              onClick={chooseFile}
              style={{
                width: "100%",
                minHeight: 250,
                border:
                  "2px dashed #cfe0e4",
                borderRadius: 16,
                background:
                  stage === "idle"
                    ? "#f7fbfa"
                    : "#f2faf7",
                marginTop: 24,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                padding: 30,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto",
                    color: "#079e7c",
                    background: "#e7f8f2",
                  }}
                >
                  <UploadCloud size={31} />
                </div>

                <div
                  style={{
                    marginTop: 17,
                    fontSize: 17,
                    fontWeight: 850,
                  }}
                >
                  {fileName
                    ? fileName
                    : "Choose customer dataset"}
                </div>

                <div
                  style={{
                    color: "#8799a1",
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  {fileName
                    ? fileSize
                    : "Click to choose a CSV file"}
                </div>
              </div>
            </button>

            {fileName && (
              <div
                style={{
                  marginTop: 15,
                  padding: "14px 16px",
                  borderRadius: 11,
                  background: "#f4f8f9",
                  border: "1px solid #e0e8ea",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                <FileSpreadsheet
                  size={20}
                  color="#079e7c"
                />

                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: 12,
                    }}
                  >
                    Dataset accepted
                  </strong>

                  <span
                    style={{
                      color: "#7d9099",
                      fontSize: 10,
                    }}
                  >
                    CustomerPulse schema scanner started
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PIPELINE STATUS */}

          <div
            style={{
              background: "#092838",
              color: "#ffffff",
              borderRadius: 18,
              padding: 28,
            }}
          >
            <div
              style={{
                color: "#56e1bd",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.6,
              }}
            >
              LIVE PIPELINE
            </div>

            <h2
              style={{
                margin: "7px 0 6px",
                fontSize: 27,
              }}
            >
              Behaviour adapter status
            </h2>

            <p
              style={{
                color: "#95abb5",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              Watch the incoming schema become a standardized
              behavioural representation.
            </p>

            <div
              style={{
                marginTop: 24,
                display: "grid",
                gap: 10,
              }}
            >
              <StageRow
                number="01"
                label="READ DATASET"
                detail="Customer rows and raw columns"
                active={isReached(stage, "reading")}
                loading={stage === "reading"}
              />

              <StageRow
                number="02"
                label="DISCOVER SCHEMA"
                detail="Identify temporal behavioural signals"
                active={isReached(stage, "schema")}
                loading={stage === "schema"}
              />

              <StageRow
                number="03"
                label="MAP BEHAVIOUR"
                detail="Group activity into behavioural families"
                active={isReached(stage, "mapping")}
                loading={stage === "mapping"}
              />

              <StageRow
                number="04"
                label="ENCODE 100D"
                detail="Generate fixed-capacity customer vectors"
                active={isReached(stage, "encoding")}
                loading={stage === "encoding"}
              />

              <StageRow
                number="05"
                label="READY FOR RANKING"
                detail="Representation available to XGBoost"
                active={stage === "ready"}
                loading={false}
              />
            </div>
          </div>
        </section>

        {/* RESULT */}

        {stage === "ready" && interfaceData && (
          <>
            <section
              style={{
                marginTop: 20,
                background: "#ffffff",
                border: "1px solid #dce6e9",
                borderRadius: 18,
                padding: 30,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 25,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#078d70",
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 1.6,
                    }}
                  >
                    SCHEMA MAPPING COMPLETE
                  </div>

                  <h2
                    style={{
                      margin: "7px 0 6px",
                      fontSize: 29,
                    }}
                  >
                    Standardized Behaviour Interface Ready
                  </h2>

                  <div
                    style={{
                      color: "#7e9099",
                      fontSize: 12,
                    }}
                  >
                    Unsupported behavioural dimensions remain reserved.
                    CustomerPulse does not fabricate missing signals.
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <ResultMetric
                    value={String(
                      interfaceData.source_signals
                    )}
                    label="RAW SIGNALS"
                  />

                  <ResultMetric
                    value={String(
                      interfaceData.temporal_groups
                    )}
                    label="TEMPORAL GROUPS"
                  />

                  <ResultMetric
                    value={`${interfaceData.total_dimensions}D`}
                    label="OUTPUT SPACE"
                  />

                  <ResultMetric
                    value={String(
                      interfaceData.active_dimensions
                    )}
                    label="ACTIVE"
                    green
                  />

                  <ResultMetric
                    value={String(
                      interfaceData.reserved_dimensions
                    )}
                    label="RESERVED"
                  />
                </div>
              </div>

              {/* FAMILY MAPPING */}

              <div
                style={{
                  marginTop: 27,
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4,minmax(180px,1fr))",
                  gap: 12,
                }}
              >
                {interfaceData.families.map(
                  (family) => {
                    const percentage =
                      family.capacity > 0
                        ? (family.mapped_dimensions /
                            family.capacity) *
                          100
                        : 0;

                    return (
                      <div
                        key={family.key}
                        style={{
                          border:
                            "1px solid #e1e9eb",
                          borderRadius: 13,
                          padding: 17,
                          background: "#fafcfc",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: 8,
                          }}
                        >
                          <strong
                            style={{
                              fontSize: 12,
                            }}
                          >
                            {family.name}
                          </strong>

                          <span
                            style={{
                              color: "#6e838d",
                              fontSize: 10,
                              fontWeight: 800,
                            }}
                          >
                            {family.mapped_dimensions}/
                            {family.capacity}
                          </span>
                        </div>

                        <div
                          style={{
                            height: 7,
                            background: "#e8eef0",
                            borderRadius: 999,
                            overflow: "hidden",
                            marginTop: 14,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${percentage}%`,
                              background:
                                family.mapped_dimensions ===
                                0
                                  ? "#c8d2d6"
                                  : "#079e7c",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            marginTop: 9,
                            color: "#82949c",
                            fontSize: 9,
                          }}
                        >
                          {family.mapped_dimensions ===
                          0
                            ? "No supported signal in current schema"
                            : `${Math.round(
                                percentage
                              )}% of family capacity mapped`}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* TRANSFORMATION */}

            <section
              style={{
                marginTop: 20,
                background: "#092838",
                color: "#ffffff",
                borderRadius: 18,
                padding: 30,
              }}
            >
              <div
                style={{
                  color: "#56e1bd",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1.6,
                }}
              >
                FEATURE ENGINEERING ABSTRACTION
              </div>

              <h2
                style={{
                  margin: "7px 0 22px",
                  fontSize: 28,
                }}
              >
                Different schema. Same behavioural interface.
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr auto 1fr auto 1fr",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <PipelineBox
                  icon={<Database size={23} />}
                  value={`${interfaceData.source_signals}`}
                  label="RAW COMPANY SIGNALS"
                />

                <ArrowRight color="#526f7b" />

                <PipelineBox
                  icon={<Layers3 size={23} />}
                  value={`${interfaceData.temporal_groups}`}
                  label="TEMPORAL GROUPS"
                />

                <ArrowRight color="#526f7b" />

                <PipelineBox
                  icon={<BrainCircuit size={23} />}
                  value="100D"
                  label="STANDARDIZED BEHAVIOUR"
                  highlighted
                />
              </div>
            </section>

            {/* VALIDATION */}

            <section
              style={{
                marginTop: 20,
                background: "#ffffff",
                border: "1px solid #dce6e9",
                borderRadius: 18,
                padding: 30,
              }}
            >
              <div
                style={{
                  color: "#078d70",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1.6,
                }}
              >
                MVP VALIDATION
              </div>

              <h2
                style={{
                  margin: "7px 0 4px",
                  fontSize: 29,
                }}
              >
                Did standardization preserve predictive usefulness?
              </h2>

              <p
                style={{
                  marginTop: 0,
                  color: "#82939b",
                  fontSize: 12,
                }}
              >
                Same train/test split, imbalance handling, XGBoost
                configuration and Top-500 ranking evaluation.
              </p>

              <div
                style={{
                  marginTop: 24,
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 70px 1fr",
                  gap: 18,
                  alignItems: "stretch",
                }}
              >
                <BenchmarkCard
                  title="DOMAIN-SPECIFIC PIPELINE"
                  caught={`${
                    baseline?.top_500_caught ?? 342
                  } / ${
                    baseline?.total_test_churners ??
                    519
                  }`}
                  recall={`${(
                    baseline?.recall_at_500 ?? 65.9
                  ).toFixed(2)}%`}
                  lift={`${(
                    baseline?.lift_at_500 ?? 7.91
                  ).toFixed(2)}×`}
                />

                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    color: "#91a2a9",
                  }}
                >
                  <ArrowRight size={28} />
                </div>

                <BenchmarkCard
                  title="STANDARDIZED 100D"
                  caught={`${
                    benchmark?.top_500_caught ??
                    344
                  } / ${
                    benchmark?.total_test_churners ??
                    519
                  }`}
                  recall={`${(
                    benchmark?.recall_at_500 ??
                    66.28
                  ).toFixed(2)}%`}
                  lift={`${(
                    benchmark?.lift_at_500 ??
                    7.96
                  ).toFixed(2)}×`}
                  highlighted
                />
              </div>

              <div
                style={{
                  marginTop: 20,
                  borderRadius: 12,
                  background: "#edf9f5",
                  border: "1px solid #d1eee5",
                  padding: "16px 18px",
                  display: "flex",
                  gap: 11,
                  alignItems: "flex-start",
                }}
              >
                <ShieldCheck
                  size={20}
                  color="#079e7c"
                />

                <div>
                  <strong
                    style={{
                      color: "#087e64",
                      display: "block",
                      fontSize: 13,
                    }}
                  >
                    Comparable ranking performance preserved
                  </strong>

                  <p
                    style={{
                      color: "#607b72",
                      fontSize: 11,
                      lineHeight: 1.6,
                      margin: "5px 0 0",
                    }}
                  >
                    The small numerical difference is not claimed as
                    a meaningful performance improvement. The MVP
                    validates that the standardized representation
                    retained competitive ranking performance on this
                    telecom benchmark.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StageRow({
  number,
  label,
  detail,
  active,
  loading,
}: {
  number: string;
  label: string;
  detail: string;
  active: boolean;
  loading: boolean;
}) {
  return (
    <div
      style={{
        border: active
          ? "1px solid rgba(72,225,185,.25)"
          : "1px solid rgba(255,255,255,.07)",
        background: active
          ? "rgba(20,181,142,.10)"
          : "rgba(255,255,255,.035)",
        borderRadius: 11,
        padding: "14px 15px",
        display: "grid",
        gridTemplateColumns: "38px 1fr auto",
        alignItems: "center",
        gap: 11,
      }}
    >
      <div
        style={{
          color: active ? "#58e2bf" : "#66808b",
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {number}
      </div>

      <div>
        <strong
          style={{
            display: "block",
            fontSize: 11,
          }}
        >
          {label}
        </strong>

        <span
          style={{
            color: "#78949f",
            fontSize: 9,
            marginTop: 3,
            display: "block",
          }}
        >
          {detail}
        </span>
      </div>

      {loading ? (
        <Loader2
          size={17}
          color="#58e2bf"
          className="animate-spin"
        />
      ) : active ? (
        <CheckCircle2
          size={17}
          color="#58e2bf"
        />
      ) : (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#425d68",
          }}
        />
      )}
    </div>
  );
}

function ResultMetric({
  value,
  label,
  green = false,
}: {
  value: string;
  label: string;
  green?: boolean;
}) {
  return (
    <div
      style={{
        minWidth: 105,
        padding: "14px 16px",
        borderRadius: 12,
        background: green ? "#eaf9f4" : "#f6f9fa",
        border: green
          ? "1px solid #cbece1"
          : "1px solid #e0e8ea",
      }}
    >
      <strong
        style={{
          display: "block",
          fontSize: 23,
          color: green ? "#079e7c" : "#17303d",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",
          marginTop: 5,
          color: "#8798a0",
          fontSize: 8,
          fontWeight: 900,
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PipelineBox({
  icon,
  value,
  label,
  highlighted = false,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        border: highlighted
          ? "1px solid rgba(76,225,186,.35)"
          : "1px solid rgba(255,255,255,.08)",
        background: highlighted
          ? "rgba(15,172,134,.13)"
          : "rgba(255,255,255,.045)",
        borderRadius: 13,
        padding: 22,
        minHeight: 145,
      }}
    >
      <div
        style={{
          color: "#53dfbb",
        }}
      >
        {icon}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: 18,
          fontSize: 29,
        }}
      >
        {value}
      </strong>

      <span
        style={{
          color: "#8ca5af",
          display: "block",
          marginTop: 6,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 1.1,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function BenchmarkCard({
  title,
  caught,
  recall,
  lift,
  highlighted = false,
}: {
  title: string;
  caught: string;
  recall: string;
  lift: string;
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        border: highlighted
          ? "1px solid #bfe8dc"
          : "1px solid #e0e7e9",
        background: highlighted ? "#f0faf7" : "#fafcfc",
        borderRadius: 15,
        padding: 23,
      }}
    >
      <div
        style={{
          color: highlighted ? "#079e7c" : "#71858e",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1.4,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          marginTop: 18,
        }}
      >
        <BenchmarkMetric
          value={caught}
          label="TOP 500 CAUGHT"
        />

        <BenchmarkMetric
          value={recall}
          label="RECALL @ 500"
        />

        <BenchmarkMetric
          value={lift}
          label="LIFT @ 500"
          highlighted={highlighted}
        />
      </div>
    </div>
  );
}

function BenchmarkMetric({
  value,
  label,
  highlighted = false,
}: {
  value: string;
  label: string;
  highlighted?: boolean;
}) {
  return (
    <div>
      <strong
        style={{
          display: "block",
          fontSize: 22,
          color: highlighted ? "#079e7c" : "#17303d",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",
          color: "#8a9aa2",
          fontSize: 8,
          fontWeight: 900,
          letterSpacing: 1,
          marginTop: 5,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function isReached(
  current: Stage,
  target: Stage
) {
  const order: Stage[] = [
    "idle",
    "reading",
    "schema",
    "mapping",
    "encoding",
    "ready",
  ];

  return (
    order.indexOf(current) >=
    order.indexOf(target)
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}
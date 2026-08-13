"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Database,
  Gauge,
  Info,
  Layers3,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

type MappedSignal = {
  dimension: number;
  signal: string;
  statistic: string;
};

type BehaviourFamily = {
  name: string;
  key: string;
  start: number;
  end: number;
  capacity: number;
  mapped_dimensions: number;
  reserved_dimensions: number;
  mapped_signals: MappedSignal[];
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
  design_note: string;

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

type MatrixDimension = {
  index: number;
  code: string;
  family: string;
  familyKey: string;
  state: "active" | "reserved";
  signal?: string;
  statistic?: string;
};

const API = "http://127.0.0.1:8000";

const FAMILY_COLORS: Record<string, string> = {
  engagement: "#0aa884",
  activity: "#1687c9",
  monetary: "#d0a321",
  frequency: "#8067d8",
  recency: "#e78433",
  trend: "#1cae68",
  stability: "#5485d4",
  friction: "#d65757",
};

export default function ModelPage() {
  const router = useRouter();

  const [data, setData] = useState<BehaviourInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<MatrixDimension | null>(null);

  useEffect(() => {
    loadModelData();
  }, []);

  async function loadModelData() {
    try {
      const response = await fetch(`${API}/behaviour-interface`);

      if (response.ok) {
        setData(await response.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const benchmark = data?.benchmark.standardized_100d;

  const dimensions = useMemo(() => {
    if (!data) return [];

    const result: MatrixDimension[] = [];

    for (const family of data.families) {
      for (let index = family.start; index <= family.end; index++) {
        const familyRelativeIndex = index - family.start + 1;

        const mappedSignal = family.mapped_signals.find(
          (signal) => signal.dimension === familyRelativeIndex
        );

        result.push({
          index,
          code: `D${String(index).padStart(3, "0")}`,
          family: family.name,
          familyKey: family.key,
          state: mappedSignal ? "active" : "reserved",
          signal: mappedSignal?.signal,
          statistic: mappedSignal?.statistic,
        });
      }
    }

    return result.sort((a, b) => a.index - b.index);
  }, [data]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#092838",
          color: "white",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <BrainCircuit
            size={48}
            color="#45dfb7"
            style={{
              margin: "0 auto",
              animation: "pulse 1.2s infinite alternate",
            }}
          />

          <h2 style={{ marginBottom: 5 }}>
            Loading CustomerPulse Model Lab
          </h2>

          <div style={{ color: "#8fa8b3" }}>
            Reading behaviour interface...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 82% 10%, rgba(20,168,133,.10), transparent 28%), #edf3f5",
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
              const active = label === "Model";

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
              border: "1px solid rgba(25,185,147,.35)",
              background: "rgba(25,185,147,.08)",
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
            padding: 38,
            boxShadow: "0 12px 35px rgba(31,59,74,.05)",
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
            MODEL LAB // TECHNICAL PROOF
          </div>

          <h1
            style={{
              margin: "9px 0 10px",
              fontSize: "clamp(38px,4.2vw,58px)",
              letterSpacing: -2.2,
              lineHeight: 1,
            }}
          >
            What happens inside
            <br />

            <span style={{ color: "#079e7c" }}>
              CustomerPulse?
            </span>
          </h1>

          <p
            style={{
              maxWidth: 850,
              margin: 0,
              color: "#71858f",
              lineHeight: 1.7,
              fontSize: 14,
            }}
          >
            Raw company-specific data is converted into a standardized
            behavioural representation, ranked by XGBoost, explained
            using model attribution and transformed into an actionable
            retention decision.
          </p>
        </section>

        {/* PIPELINE */}

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
            END-TO-END INTELLIGENCE PIPELINE
          </div>

          <h2
            style={{
              margin: "7px 0 24px",
              fontSize: 29,
            }}
          >
            Prediction is only one step.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr",
              alignItems: "center",
              gap: 10,
              overflowX: "auto",
            }}
          >
            <PipelineNode
              icon={<Database size={23} />}
              value={String(data?.source_signals ?? 155)}
              label="RAW SIGNALS"
            />

            <ArrowRight color="#55717d" />

            <PipelineNode
              icon={<Layers3 size={23} />}
              value={String(data?.temporal_groups ?? 42)}
              label="BEHAVIOUR GROUPS"
            />

            <ArrowRight color="#55717d" />

            <PipelineNode
              icon={<BrainCircuit size={23} />}
              value={`${data?.total_dimensions ?? 100}D`}
              label="BEHAVIOUR INTERFACE"
              highlighted
            />

            <ArrowRight color="#55717d" />

            <PipelineNode
              icon={<Target size={23} />}
              value="XGB"
              label="RISK RANKING"
            />

            <ArrowRight color="#55717d" />

            <PipelineNode
              icon={<Sparkles size={23} />}
              value="SHAP"
              label="WHY RISK?"
            />

            <ArrowRight color="#55717d" />

            <PipelineNode
              icon={<ShieldCheck size={23} />}
              value="HITL"
              label="HUMAN ACTION"
            />
          </div>
        </section>

        {/* 100D MATRIX */}

        <section
          style={{
            marginTop: 20,
            background: "#ffffff",
            border: "1px solid #dce6e9",
            borderRadius: 18,
            padding: 30,
            boxShadow: "0 10px 30px rgba(31,59,74,.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 30,
              flexWrap: "wrap",
              alignItems: "center",
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
                STANDARDIZED BEHAVIOUR INTERFACE
              </div>

              <h2
                style={{
                  margin: "7px 0 5px",
                  fontSize: 31,
                }}
              >
                100D Behaviour Matrix
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#80919a",
                  maxWidth: 750,
                  lineHeight: 1.6,
                  fontSize: 12,
                }}
              >
                One fixed behavioural interface. Different schemas
                populate the dimensions they support. Unsupported
                behaviour remains reserved.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 11,
              }}
            >
              <Counter
                value={String(data?.active_dimensions ?? 69)}
                label="ACTIVE"
                green
              />

              <Counter
                value={String(data?.reserved_dimensions ?? 31)}
                label="RESERVED"
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              display: "grid",
              gridTemplateColumns: "minmax(0,1.4fr) minmax(260px,.6fr)",
              gap: 22,
              alignItems: "start",
            }}
          >
            {/* MATRIX */}

            <div
              style={{
                background: "#092838",
                borderRadius: 17,
                padding: 24,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#55dfbb",
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: 1.5,
                    }}
                  >
                    DIMENSION MAP
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    D001 → D100
                  </div>
                </div>

                <div
                  style={{
                    color: "#8ba4ae",
                    fontSize: 10,
                  }}
                >
                  Hover any dimension
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(10,1fr)",
                  gap: 7,
                }}
              >
                {dimensions.map((dimension) => {
                  const active = dimension.state === "active";

                  const color =
                    FAMILY_COLORS[dimension.familyKey] ?? "#079e7c";

                  return (
                    <button
                      key={dimension.code}
                      onMouseEnter={() => setHovered(dimension)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        aspectRatio: "1 / .78",
                        minHeight: 46,
                        borderRadius: 8,
                        cursor: "pointer",
                        border: active
                          ? `1px solid ${color}`
                          : "1px solid rgba(255,255,255,.08)",
                        background: active
                          ? `${color}22`
                          : "repeating-linear-gradient(135deg,rgba(255,255,255,.035),rgba(255,255,255,.035) 4px,rgba(255,255,255,.012) 4px,rgba(255,255,255,.012) 8px)",
                        color: active ? "#ffffff" : "#6c848e",
                        fontSize: 9,
                        fontWeight: 850,
                        position: "relative",
                        transition: ".18s ease",
                        boxShadow: active
                          ? `inset 0 0 16px ${color}15`
                          : "none",
                      }}
                    >
                      {String(dimension.index).padStart(2, "0")}

                      {active && (
                        <span
                          style={{
                            position: "absolute",
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            right: 5,
                            top: 5,
                            background: color,
                            boxShadow: `0 0 7px ${color}`,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 15,
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#6e8994",
                  fontSize: 9,
                  fontWeight: 800,
                }}
              >
                <span>D001</span>
                <span>100 BEHAVIOURAL DIMENSIONS</span>
                <span>D100</span>
              </div>
            </div>

            {/* MATRIX EXPLANATION */}

            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <div
                style={{
                  background: hovered ? "#ffffff" : "#f8fbfb",
                  border: hovered
                    ? "1px solid #c9e8df"
                    : "1px solid #e0e8ea",
                  borderRadius: 15,
                  padding: 20,
                  minHeight: 180,
                }}
              >
                {hovered ? (
                  <>
                    <div
                      style={{
                        color:
                          FAMILY_COLORS[hovered.familyKey] ??
                          "#079e7c",
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: 1.4,
                      }}
                    >
                      {hovered.code}
                    </div>

                    <h3
                      style={{
                        margin: "7px 0",
                        fontSize: 21,
                      }}
                    >
                      {hovered.family}
                    </h3>

                    <div
                      style={{
                        marginTop: 15,
                        display: "grid",
                        gap: 9,
                      }}
                    >
                      <InfoRow
                        label="STATE"
                        value={hovered.state.toUpperCase()}
                      />

                      <InfoRow
                        label="SIGNAL"
                        value={
                          hovered.signal ??
                          "Not supported in current schema"
                        }
                      />

                      <InfoRow
                        label="STATISTIC"
                        value={
                          hovered.statistic ??
                          "Reserved dimension"
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Info
                      size={22}
                      color="#079e7c"
                    />

                    <h3
                      style={{
                        margin: "10px 0 6px",
                      }}
                    >
                      Inspect the interface
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#7f929a",
                        fontSize: 11,
                        lineHeight: 1.6,
                      }}
                    >
                      Hover a matrix cell to see the behavioural family,
                      mapped signal and statistic represented by that
                      dimension.
                    </p>
                  </>
                )}
              </div>

              <div
                style={{
                  background: "#f8fbfb",
                  border: "1px solid #e0e8ea",
                  borderRadius: 15,
                  padding: 19,
                }}
              >
                <div
                  style={{
                    color: "#748891",
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: 1.4,
                    marginBottom: 13,
                  }}
                >
                  FAMILY LEGEND
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {(data?.families ?? []).map((family) => (
                    <div
                      key={family.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background:
                            FAMILY_COLORS[family.key] ??
                            "#079e7c",
                        }}
                      />

                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          {family.name}
                        </div>

                        <div
                          style={{
                            color: "#8b9ba2",
                            fontSize: 8,
                          }}
                        >
                          {family.mapped_dimensions}/
                          {family.capacity} active
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS */}

        <section
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 13,
          }}
        >
          <MetricCard
            icon={<Gauge size={20} />}
            label="ROC-AUC"
            value={(benchmark?.roc_auc ?? 0.9455).toFixed(4)}
            note="Overall ranking quality"
          />

          <MetricCard
            icon={<LineChart size={20} />}
            label="PR-AUC"
            value={(benchmark?.pr_auc ?? 0.6982).toFixed(4)}
            note="Positive-class performance"
          />

          <MetricCard
            icon={<Target size={20} />}
            label="RECALL @ 500"
            value={`${(
              benchmark?.recall_at_500 ?? 66.28
            ).toFixed(2)}%`}
            note="Actual churners captured"
          />

          <MetricCard
            icon={<CheckCircle2 size={20} />}
            label="PRECISION @ 500"
            value={`${(
              benchmark?.precision_at_500 ?? 68.8
            ).toFixed(2)}%`}
            note="Priority list purity"
          />

          <MetricCard
            icon={<TrendingUp size={20} />}
            label="LIFT @ 500"
            value={`${(
              benchmark?.lift_at_500 ?? 7.96
            ).toFixed(2)}×`}
            note="Versus random targeting"
            highlighted
          />
        </section>

        {/* COMPARISON */}

        <section
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
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
                letterSpacing: 1.6,
              }}
            >
              STANDARDIZATION VALIDATION
            </div>

            <h2
              style={{
                margin: "7px 0 20px",
                fontSize: 26,
              }}
            >
              Did we preserve predictive usefulness?
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.35fr 1fr 1fr",
                paddingBottom: 10,
                color: "#82949c",
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: 1,
              }}
            >
              <span>METRIC</span>
              <span>DOMAIN-SPECIFIC</span>
              <span>100D</span>
            </div>

            <ComparisonRow
              label="Churners caught"
              baseline={`${
                data?.benchmark.domain_specific.top_500_caught ??
                342
              } / ${
                data?.benchmark.domain_specific
                  .total_test_churners ?? 519
              }`}
              standardized={`${
                benchmark?.top_500_caught ?? 344
              } / ${
                benchmark?.total_test_churners ?? 519
              }`}
            />

            <ComparisonRow
              label="Recall @ 500"
              baseline={`${(
                data?.benchmark.domain_specific.recall_at_500 ??
                65.9
              ).toFixed(2)}%`}
              standardized={`${(
                benchmark?.recall_at_500 ?? 66.28
              ).toFixed(2)}%`}
            />

            <ComparisonRow
              label="Lift @ 500"
              baseline={`${(
                data?.benchmark.domain_specific.lift_at_500 ??
                7.91
              ).toFixed(2)}×`}
              standardized={`${(
                benchmark?.lift_at_500 ?? 7.96
              ).toFixed(2)}×`}
            />

            <div
              style={{
                marginTop: 18,
                padding: "15px 17px",
                borderRadius: 11,
                background: "#edf9f5",
                border: "1px solid #d0eee5",
                color: "#087e64",
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.5,
              }}
            >
              Comparable ranking performance was preserved after
              standardization.
            </div>
          </div>

          {/* CLAIM CARD */}

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
              DESIGN CLAIM
            </div>

            <h2
              style={{
                margin: "7px 0 20px",
                fontSize: 26,
              }}
            >
              Why 100 dimensions?
            </h2>

            <ClaimItem
              title="Fixed-capacity MVP interface"
              text="100 dimensions provide a consistent behavioural contract between schema mapping and downstream prediction."
            />

            <ClaimItem
              title="Unsupported behaviour stays reserved"
              text="Missing friction, recency or other behavioural signals are not fabricated."
            />

            <ClaimItem
              title="Not mathematically optimal"
              text="100D is an MVP architecture choice, not a claim that exactly 100 dimensions are theoretically best."
            />
          </div>
        </section>

        {/* END CTA */}

        <section
          style={{
            marginTop: 20,
            background:
              "linear-gradient(120deg,#079e7c,#07755e)",
            color: "#ffffff",
            borderRadius: 18,
            padding: "28px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 25,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.6,
                color: "#c9fff0",
              }}
            >
              CUSTOMERPULSE MODEL PHILOSOPHY
            </div>

            <div
              style={{
                marginTop: 7,
                fontSize: 24,
                fontWeight: 850,
              }}
            >
              Predict risk. Explain it. Prioritize money. Act.
            </div>
          </div>

          <button
            onClick={() => router.push("/customers")}
            style={{
              border: "1px solid rgba(255,255,255,.35)",
              background: "rgba(255,255,255,.13)",
              color: "#ffffff",
              borderRadius: 11,
              padding: "13px 18px",
              cursor: "pointer",
              fontWeight: 850,
              fontSize: 12,
            }}
          >
            Open Priority Queue →
          </button>
        </section>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          from {
            opacity: 0.35;
            transform: scale(0.95);
          }

          to {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @media (max-width: 1000px) {
          nav {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function PipelineNode({
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
        minWidth: 145,
        minHeight: 135,
        borderRadius: 13,
        padding: 18,
        background: highlighted
          ? "rgba(16,180,139,.14)"
          : "rgba(255,255,255,.045)",
        border: highlighted
          ? "1px solid rgba(74,225,187,.35)"
          : "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div style={{ color: "#55dfbb" }}>{icon}</div>

      <strong
        style={{
          display: "block",
          fontSize: 26,
          marginTop: 17,
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",
          color: "#8fa7b2",
          marginTop: 5,
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

function Counter({
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
        minWidth: 110,
        padding: "15px 18px",
        borderRadius: 12,
        background: green ? "#eaf9f4" : "#f5f8f9",
        border: green
          ? "1px solid #caece1"
          : "1px solid #e0e8ea",
      }}
    >
      <strong
        style={{
          display: "block",
          color: green ? "#079e7c" : "#17303d",
          fontSize: 25,
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",
          marginTop: 5,
          color: "#83959d",
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid #e8edef",
        paddingTop: 9,
      }}
    >
      <span
        style={{
          color: "#8b9aa1",
          fontSize: 8,
          fontWeight: 900,
          letterSpacing: 1,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: 3,
          fontSize: 11,
          wordBreak: "break-word",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
  highlighted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        background: highlighted ? "#edf9f5" : "#ffffff",
        border: highlighted
          ? "1px solid #caece1"
          : "1px solid #dce6e9",
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div
        style={{
          color: highlighted ? "#079e7c" : "#70858f",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#7f929a",
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 1.2,
          marginTop: 15,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: 6,
          fontSize: 27,
          color: highlighted ? "#079e7c" : "#17303d",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",
          color: "#87979f",
          fontSize: 10,
          marginTop: 5,
        }}
      >
        {note}
      </span>
    </div>
  );
}

function ComparisonRow({
  label,
  baseline,
  standardized,
}: {
  label: string;
  baseline: string;
  standardized: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.35fr 1fr 1fr",
        gap: 10,
        padding: "14px 0",
        borderBottom: "1px solid #e8edef",
        alignItems: "center",
      }}
    >
      <strong style={{ fontSize: 11 }}>{label}</strong>

      <span
        style={{
          color: "#71868f",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {baseline}
      </span>

      <span
        style={{
          color: "#079e7c",
          fontSize: 13,
          fontWeight: 900,
        }}
      >
        {standardized}
      </span>
    </div>
  );
}

function ClaimItem({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        padding: "15px 0",
        borderBottom: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <strong
        style={{
          display: "block",
          color: "#ffffff",
          fontSize: 13,
        }}
      >
        {title}
      </strong>

      <p
        style={{
          color: "#91abb5",
          fontSize: 11,
          lineHeight: 1.6,
          margin: "6px 0 0",
        }}
      >
        {text}
      </p>
    </div>
  );
}
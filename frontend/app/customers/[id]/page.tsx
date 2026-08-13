"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Decision = "APPROVED" | "MODIFIED" | "REJECTED" | null;
type Outcome = "RETAINED" | "CHURNED" | "MONITORING" | null;

const behaviour = [
  {
    label: "Revenue / ARPU",
    june: "₹4,365",
    july: "₹1,613",
    august: "₹1,390",
    drop: "68% decline",
  },
  {
    label: "Recharge",
    june: "₹3,100",
    july: "₹2,750",
    august: "₹0",
    drop: "100% decline",
  },
  {
    label: "Incoming Calls",
    june: "304.1",
    july: "250.3",
    august: "0",
    drop: "100% decline",
  },
  {
    label: "Outgoing Calls",
    june: "1,438.4",
    july: "515.3",
    august: "0",
    drop: "100% decline",
  },
];

const shapSignals = [
  {
    signal: "Incoming call usage in August",
    impact: "HIGH",
    explanation: "August incoming usage collapsed to zero.",
  },
  {
    signal: "Incoming calls percentage change",
    impact: "HIGH",
    explanation: "Sharp negative change from the customer's prior behaviour.",
  },
  {
    signal: "Last day recharge amount in August",
    impact: "HIGH",
    explanation: "Recharge activity disappeared during the warning month.",
  },
];

export default function CustomerIntelligencePage() {
  const router = useRouter();

  const [decision, setDecision] = useState<Decision>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 85% 10%, rgba(21,171,136,.10), transparent 28%), #edf3f5",
        color: "#102536",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      {/* NAVBAR */}

      <header
        style={{
          background: "#092838",
          color: "#ffffff",
          padding: "22px 5%",
        }}
      >
        <div
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 25,
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
                background: "linear-gradient(135deg,#19b993,#079e7c)",
                display: "grid",
                placeItems: "center",
                fontSize: 25,
              }}
            >
              〽
            </div>

            <div>
              <div style={{ fontWeight: 850, fontSize: 20 }}>
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
              alignItems: "center",
            }}
          >
            {[
              ["Overview", "/"],
              ["Customers", "/customers"],
              ["Actions", "/actions"],
              ["Model", "/model"],
              ["Upload", "/upload"],
            ].map(([label, path]) => (
              <button
                key={label}
                onClick={() => router.push(path)}
                style={{
                  border: "none",
                  background:
                    label === "Customers"
                      ? "rgba(255,255,255,.10)"
                      : "transparent",
                  color:
                    label === "Customers" ? "#ffffff" : "#9fb4be",
                  borderRadius: 10,
                  padding: "13px 18px",
                  cursor: "pointer",
                  fontWeight: 750,
                  fontSize: 14,
                }}
              >
                {label}
              </button>
            ))}
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
          padding: "36px 5% 80px",
        }}
      >
        {/* BACK */}

        <button
          onClick={() => router.push("/customers")}
          style={{
            border: "none",
            background: "transparent",
            color: "#58717d",
            cursor: "pointer",
            fontWeight: 750,
            marginBottom: 18,
            padding: 0,
          }}
        >
          ← Back to Priority Queue
        </button>

        {/* CUSTOMER HERO */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid #dce6e9",
            padding: "32px 35px",
            boxShadow: "0 12px 35px rgba(31,59,74,.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 35,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: "#078d70",
                  fontSize: 11,
                  letterSpacing: 2,
                  fontWeight: 900,
                }}
              >
                CUSTOMER INTELLIGENCE // LIVE INVESTIGATION
              </div>

              <h1
                style={{
                  margin: "10px 0 7px",
                  fontSize: 44,
                  letterSpacing: -1.8,
                }}
              >
                Customer 19035
              </h1>

              <div
                style={{
                  color: "#748791",
                  fontSize: 14,
                }}
              >
                Business Priority #41 · Behavioural deterioration detected
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 15,
                flexWrap: "wrap",
              }}
            >
              <Metric
                label="CHURN RISK"
                value="94.99%"
                valueColor="#df4d50"
              />

              <Metric label="MONTHLY VALUE" value="₹1,390" />

              <Metric
                label="REVENUE AT RISK"
                value="₹1,320"
                valueColor="#df4d50"
              />

              <div
                style={{
                  minWidth: 150,
                  padding: "17px 20px",
                  borderRadius: 13,
                  background: "#fff0f0",
                  border: "1px solid #ffd8d8",
                }}
              >
                <div
                  style={{
                    color: "#a47575",
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: 1.4,
                  }}
                >
                  STATUS
                </div>

                <div
                  style={{
                    color: "#dc474b",
                    fontSize: 20,
                    fontWeight: 900,
                    marginTop: 7,
                  }}
                >
                  CRITICAL
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ALERT */}

        <section
          style={{
            marginTop: 20,
            background: "#092838",
            borderRadius: 17,
            padding: "22px 27px",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            gap: 30,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#56e1bd",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.7,
              }}
            >
              BEHAVIOURAL ALERT
            </div>

            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                marginTop: 5,
              }}
            >
              Multiple customer behaviours collapsed simultaneously.
            </div>
          </div>

          <div
            style={{
              color: "#b1c4cb",
              maxWidth: 570,
              lineHeight: 1.6,
              fontSize: 13,
            }}
          >
            Recharge, incoming calls and outgoing calls all reached zero in
            August after substantial activity in June and July.
          </div>
        </section>

        {/* BEHAVIOUR */}

        <section
          style={{
            marginTop: 20,
            background: "#ffffff",
            border: "1px solid #dce6e9",
            borderRadius: 18,
            padding: 28,
          }}
        >
          <SectionHeader
            eyebrow="VERIFIED 3-MONTH BEHAVIOUR"
            title="The deterioration happened before churn."
            subtitle="Raw customer activity is shown separately from model explanations."
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,minmax(210px,1fr))",
              gap: 13,
              marginTop: 25,
              overflowX: "auto",
            }}
          >
            {behaviour.map((item) => (
              <div
                key={item.label}
                style={{
                  border: "1px solid #e0e8ea",
                  borderRadius: 14,
                  padding: 20,
                  minWidth: 210,
                }}
              >
                <div
                  style={{
                    color: "#536d78",
                    fontSize: 12,
                    fontWeight: 850,
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 18,
                    fontWeight: 850,
                    fontSize: 15,
                  }}
                >
                  <span>{item.june}</span>
                  <span style={{ color: "#aebbc0" }}>→</span>
                  <span>{item.july}</span>
                  <span style={{ color: "#aebbc0" }}>→</span>
                  <span style={{ color: "#df4d50" }}>
                    {item.august}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#98a6ac",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 1,
                    marginTop: 10,
                  }}
                >
                  <span>JUN</span>
                  <span>JUL</span>
                  <span>AUG</span>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    background: "#fff1f1",
                    color: "#d7474b",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 11,
                    fontWeight: 850,
                  }}
                >
                  ↓ {item.drop}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 18,
              background: "#fff7f7",
              border: "1px solid #ffe0e0",
              borderRadius: 12,
              padding: "15px 18px",
              color: "#b94044",
              fontWeight: 750,
              fontSize: 13,
            }}
          >
            Observed behaviour: Recharge dropped 100% · Incoming Calls dropped
            100% · Outgoing Calls dropped 100%
          </div>
        </section>

        {/* WHY MODEL FLAGGED */}

        <section
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "1.05fr .95fr",
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
            <SectionHeader
              eyebrow="MODEL SIGNALS // SHAP"
              title="Why did the model raise risk?"
              subtitle="The strongest model signals contributing to this prediction."
            />

            <div
              style={{
                marginTop: 22,
                display: "grid",
                gap: 11,
              }}
            >
              {shapSignals.map((signal, index) => (
                <div
                  key={signal.signal}
                  style={{
                    border: "1px solid #e2e9eb",
                    borderRadius: 12,
                    padding: 16,
                    display: "grid",
                    gridTemplateColumns: "42px 1fr auto",
                    alignItems: "center",
                    gap: 13,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: "#edf9f5",
                      color: "#079e7c",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 900,
                    }}
                  >
                    0{index + 1}
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: 850,
                        fontSize: 13,
                      }}
                    >
                      {signal.signal}
                    </div>

                    <div
                      style={{
                        color: "#80929a",
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      {signal.explanation}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#fff0f0",
                      color: "#d84a4e",
                      borderRadius: 999,
                      padding: "6px 9px",
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    {signal.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DECISION ENGINE */}

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
                color: "#55dfba",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.7,
              }}
            >
              RETENTION DECISION ENGINE
            </div>

            <h2
              style={{
                fontSize: 27,
                margin: "8px 0 6px",
              }}
            >
              Recommended intervention
            </h2>

            <p
              style={{
                color: "#9db4bd",
                fontSize: 12,
                marginTop: 0,
              }}
            >
              Converts prediction evidence into an actionable retention plan.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 22,
              }}
            >
              <DarkMetric
                label="MAIN REASON"
                value="Payment / Recharge Disengagement"
              />

              <DarkMetric label="URGENCY" value="Immediate" />

              <DarkMetric
                label="CHANNEL"
                value="SMS + App Notification"
              />

              <DarkMetric
                label="OFFER LEVEL"
                value="Premium Retention Offer"
              />
            </div>

            <div
              style={{
                marginTop: 11,
                background: "rgba(255,255,255,.07)",
                border: "1px solid rgba(255,255,255,.09)",
                borderRadius: 12,
                padding: 17,
              }}
            >
              <div
                style={{
                  color: "#7f9ca7",
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: 1.3,
                }}
              >
                RECOMMENDED ACTION
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontWeight: 750,
                  lineHeight: 1.55,
                  fontSize: 13,
                }}
              >
                Prioritize customer for targeted outreach. Offer a personalized
                recharge or renewal incentive.
              </div>
            </div>
          </div>
        </section>

        {/* HUMAN CONTROL */}

        <section
          style={{
            marginTop: 20,
            background: "#ffffff",
            border: "1px solid #dce6e9",
            borderRadius: 18,
            padding: 28,
          }}
        >
          <div
            style={{
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
                  color: "#078d70",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1.6,
                }}
              >
                HUMAN-IN-THE-LOOP CONTROL
              </div>

              <h2
                style={{
                  margin: "7px 0 5px",
                  fontSize: 26,
                }}
              >
                Final intervention authority
              </h2>

              <div
                style={{
                  color: "#778b94",
                  fontSize: 12,
                }}
              >
                CustomerPulse recommends. A human makes the final decision.
              </div>
            </div>

            {!decision ? (
              <div
                style={{
                  display: "flex",
                  gap: 9,
                }}
              >
                <ActionButton
                  text="APPROVE"
                  background="#079e7c"
                  color="#ffffff"
                  onClick={() => setDecision("APPROVED")}
                />

                <ActionButton
                  text="MODIFY"
                  background="#ffffff"
                  color="#17303d"
                  onClick={() => setDecision("MODIFIED")}
                />

                <ActionButton
                  text="REJECT"
                  background="#ffffff"
                  color="#d7484c"
                  onClick={() => setDecision("REJECTED")}
                />
              </div>
            ) : (
              <div
                style={{
                  background:
                    decision === "REJECTED" ? "#fff0f0" : "#eaf9f4",
                  border:
                    decision === "REJECTED"
                      ? "1px solid #ffd6d6"
                      : "1px solid #c9ecdf",
                  borderRadius: 12,
                  padding: "14px 20px",
                  color:
                    decision === "REJECTED" ? "#d7484c" : "#087e64",
                  fontWeight: 900,
                }}
              >
                ✓ INTERVENTION {decision}
              </div>
            )}
          </div>

          {decision && (
            <div
              style={{
                marginTop: 25,
                paddingTop: 24,
                borderTop: "1px solid #e5ebed",
              }}
            >
              <div
                style={{
                  fontWeight: 850,
                  fontSize: 16,
                }}
              >
                Record customer outcome
              </div>

              <div
                style={{
                  color: "#83949b",
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                Connect the intervention to the customer's real outcome.
              </div>

              {!outcome ? (
                <div
                  style={{
                    display: "flex",
                    gap: 9,
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <ActionButton
                    text="CUSTOMER RETAINED"
                    background="#079e7c"
                    color="#ffffff"
                    onClick={() => setOutcome("RETAINED")}
                  />

                  <ActionButton
                    text="CUSTOMER CHURNED"
                    background="#ffffff"
                    color="#d7484c"
                    onClick={() => setOutcome("CHURNED")}
                  />

                  <ActionButton
                    text="STILL MONITORING"
                    background="#ffffff"
                    color="#17303d"
                    onClick={() => setOutcome("MONITORING")}
                  />
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 16,
                    borderRadius: 13,
                    padding: "17px 20px",
                    background:
                      outcome === "RETAINED"
                        ? "#eaf9f4"
                        : outcome === "CHURNED"
                        ? "#fff0f0"
                        : "#f2f6f7",
                    color:
                      outcome === "RETAINED"
                        ? "#087e64"
                        : outcome === "CHURNED"
                        ? "#d7484c"
                        : "#435f6b",
                    fontWeight: 850,
                  }}
                >
                  ✓ Outcome recorded: {outcome}
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 11,
                      marginTop: 5,
                    }}
                  >
                    Stored as evidence for future model evaluation and
                    retraining.
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* PIPELINE */}

        <section
          style={{
            marginTop: 20,
            borderRadius: 18,
            padding: "25px 28px",
            background: "#092838",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              color: "#58e2bf",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 1.6,
            }}
          >
            CONTINUOUS LEARNING LOOP
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5,1fr)",
              marginTop: 20,
              gap: 8,
            }}
          >
            {[
              ["01", "PREDICTION"],
              ["02", "RECOMMENDATION"],
              ["03", "HUMAN DECISION"],
              ["04", "CUSTOMER OUTCOME"],
              ["05", "FUTURE RETRAINING DATA"],
            ].map(([number, text], index) => (
              <div
                key={number}
                style={{
                  position: "relative",
                  padding: "16px",
                  borderRadius: 11,
                  background:
                    index <= (outcome ? 4 : decision ? 2 : 1)
                      ? "rgba(24,185,147,.12)"
                      : "rgba(255,255,255,.04)",
                  border:
                    index <= (outcome ? 4 : decision ? 2 : 1)
                      ? "1px solid rgba(62,225,184,.25)"
                      : "1px solid rgba(255,255,255,.07)",
                }}
              >
                <div
                  style={{
                    color: "#58e2bf",
                    fontWeight: 900,
                    fontSize: 11,
                  }}
                >
                  {number}
                </div>

                <div
                  style={{
                    color: "#c2d2d8",
                    fontWeight: 800,
                    fontSize: 10,
                    marginTop: 8,
                    letterSpacing: 0.6,
                  }}
                >
                  {text}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  valueColor = "#102536",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        minWidth: 150,
        padding: "17px 20px",
        borderRadius: 13,
        background: "#f7fafb",
        border: "1px solid #e2eaec",
      }}
    >
      <div
        style={{
          color: "#84969e",
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 1.3,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: valueColor,
          fontSize: 21,
          fontWeight: 900,
          marginTop: 7,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <div
        style={{
          color: "#078d70",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1.7,
        }}
      >
        {eyebrow}
      </div>

      <h2
        style={{
          fontSize: 27,
          margin: "7px 0 5px",
          letterSpacing: -0.6,
        }}
      >
        {title}
      </h2>

      <div
        style={{
          color: "#80919a",
          fontSize: 12,
        }}
      >
        {subtitle}
      </div>
    </>
  );
}

function DarkMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.055)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 11,
        padding: 14,
      }}
    >
      <div
        style={{
          color: "#7897a2",
          fontSize: 8,
          fontWeight: 900,
          letterSpacing: 1.2,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 800,
          fontSize: 12,
          marginTop: 7,
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ActionButton({
  text,
  background,
  color,
  onClick,
}: {
  text: string;
  background: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background,
        color,
        border:
          background === "#ffffff"
            ? "1px solid #d6e1e5"
            : "1px solid transparent",
        borderRadius: 10,
        padding: "12px 17px",
        cursor: "pointer",
        fontWeight: 900,
        fontSize: 11,
        letterSpacing: 0.5,
      }}
    >
      {text}
    </button>
  );
}
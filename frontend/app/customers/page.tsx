"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RiskLevel = "Critical" | "High" | "Medium" | "Low";

type Customer = {
  rank: number;
  id: number;
  reason: string;
  risk: number;
  monthlyValue: number;
  revenueRisk: number;
  status: RiskLevel;
  urgency: string;
};

const customers: Customer[] = [
  { rank: 1, id: 3223, reason: "Communication Usage Decline", risk: 98.3, monthlyValue: 8993, revenueRisk: 8840, status: "Critical", urgency: "Immediate" },
  { rank: 2, id: 23684, reason: "Payment / Recharge Disengagement", risk: 95.9, monthlyValue: 5228, revenueRisk: 5014, status: "Critical", urgency: "Immediate" },
  { rank: 3, id: 22495, reason: "Communication Usage Decline", risk: 95.1, monthlyValue: 3912, revenueRisk: 3720, status: "Critical", urgency: "Immediate" },
  { rank: 4, id: 6247, reason: "Payment / Recharge Disengagement", risk: 97.4, monthlyValue: 3353, revenueRisk: 3266, status: "Critical", urgency: "Immediate" },
  { rank: 5, id: 17812, reason: "Payment / Recharge Disengagement", risk: 98.8, monthlyValue: 3259, revenueRisk: 3220, status: "Critical", urgency: "Immediate" },
  { rank: 6, id: 18795, reason: "Payment / Recharge Disengagement", risk: 96.0, monthlyValue: 3341, revenueRisk: 3207, status: "Critical", urgency: "Immediate" },
  { rank: 7, id: 1, reason: "Payment / Recharge Disengagement", risk: 95.5, monthlyValue: 3172, revenueRisk: 3029, status: "Critical", urgency: "Immediate" },
  { rank: 8, id: 21272, reason: "Payment / Recharge Disengagement", risk: 92.2, monthlyValue: 3182, revenueRisk: 2934, status: "Critical", urgency: "Immediate" },
  { rank: 9, id: 18289, reason: "Payment / Recharge Disengagement", risk: 94.2, monthlyValue: 2986, revenueRisk: 2813, status: "Critical", urgency: "Immediate" },
  { rank: 10, id: 27525, reason: "Communication Usage Decline", risk: 95.9, monthlyValue: 2580, revenueRisk: 2474, status: "Critical", urgency: "Immediate" },

  // Main live demo customer
  { rank: 41, id: 19035, reason: "Payment / Recharge Disengagement", risk: 94.99, monthlyValue: 1390, revenueRisk: 1320, status: "Critical", urgency: "Immediate" },

  { rank: 11, id: 9937, reason: "Payment / Recharge Disengagement", risk: 18.3, monthlyValue: 13508, revenueRisk: 2472, status: "Low", urgency: "Monitor" },
  { rank: 12, id: 19463, reason: "General Behavioural Disengagement", risk: 98.5, monthlyValue: 2160, revenueRisk: 2128, status: "Critical", urgency: "Immediate" },
  { rank: 13, id: 6348, reason: "Internet Usage Disengagement", risk: 97.5, monthlyValue: 2162, revenueRisk: 2108, status: "Critical", urgency: "Immediate" },
  { rank: 14, id: 7879, reason: "Payment / Recharge Disengagement", risk: 97.3, monthlyValue: 2163, revenueRisk: 2105, status: "Critical", urgency: "Immediate" },
  { rank: 15, id: 18544, reason: "Payment / Recharge Disengagement", risk: 97.7, monthlyValue: 2026, revenueRisk: 1979, status: "Critical", urgency: "Immediate" },
  { rank: 16, id: 24594, reason: "Payment / Recharge Disengagement", risk: 97.8, monthlyValue: 2014, revenueRisk: 1970, status: "Critical", urgency: "Immediate" },
  { rank: 17, id: 28467, reason: "Communication Usage Decline", risk: 98.2, monthlyValue: 1989, revenueRisk: 1953, status: "Critical", urgency: "Immediate" },
  { rank: 18, id: 29962, reason: "Communication Usage Decline", risk: 95.7, monthlyValue: 2030, revenueRisk: 1943, status: "Critical", urgency: "Immediate" },
  { rank: 19, id: 3192, reason: "Payment / Recharge Disengagement", risk: 97.0, monthlyValue: 1889, revenueRisk: 1832, status: "Critical", urgency: "Immediate" },
  { rank: 20, id: 20400, reason: "Payment / Recharge Disengagement", risk: 26.4, monthlyValue: 6845, revenueRisk: 1807, status: "Medium", urgency: "Review" },
];

const filters = ["All", "Critical", "High", "Medium", "Low"];

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function riskStyle(status: RiskLevel) {
  switch (status) {
    case "Critical":
      return {
        background: "#fff0f0",
        color: "#d94747",
        border: "#ffd4d4",
      };
    case "High":
      return {
        background: "#fff6e8",
        color: "#d67b16",
        border: "#ffe0b5",
      };
    case "Medium":
      return {
        background: "#fffbe8",
        color: "#9b7a00",
        border: "#f5e8a9",
      };
    default:
      return {
        background: "#edf9f5",
        color: "#15936f",
        border: "#caeee2",
      };
  }
}

export default function CustomersPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const visibleCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        if (filter === "All") return true;
        return customer.status === filter;
      })
      .filter((customer) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return (
          customer.id.toString().includes(query) ||
          customer.reason.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.rank - b.rank);
  }, [search, filter]);

  const investigate = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 82% 12%, rgba(24,164,132,.10), transparent 27%), #edf3f5",
        color: "#102536",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      {/* NAVIGATION */}

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
              minWidth: 250,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 13,
                display: "grid",
                placeItems: "center",
                fontSize: 25,
                background: "linear-gradient(135deg,#19b993,#079e7c)",
                boxShadow: "0 10px 30px rgba(0,220,170,.18)",
              }}
            >
              〽
            </div>

            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
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
              alignItems: "center",
              gap: 8,
            }}
          >
            {[
              ["Overview", "/"],
              ["Customers", "/customers"],
              ["Actions", "/actions"],
              ["Model", "/model"],
              ["Upload", "/upload"],
            ].map(([label, path]) => {
              const active = label === "Customers";

              return (
                <button
                  key={label}
                  onClick={() => router.push(path)}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 10,
                    padding: "13px 18px",
                    fontSize: 14,
                    fontWeight: 700,
                    background: active
                      ? "rgba(255,255,255,.10)"
                      : "transparent",
                    color: active ? "#ffffff" : "#9fb4be",
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
              fontSize: 12,
              fontWeight: 800,
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
          padding: "44px 5% 80px",
        }}
      >
        {/* TITLE */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "34px 36px",
            border: "1px solid #dde7ea",
            boxShadow: "0 12px 35px rgba(31,59,74,.05)",
          }}
        >
          <div
            style={{
              color: "#078d70",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            AI PRIORITIZED RETENTION QUEUE
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              gap: 30,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(34px,4vw,52px)",
                  letterSpacing: -2,
                  lineHeight: 1,
                  fontWeight: 500,
                }}
              >
                Who should we{" "}
                <span style={{ color: "#079e7c" }}>save first?</span>
              </h1>

              <p
                style={{
                  margin: "17px 0 0",
                  color: "#71838c",
                  fontSize: 15,
                  maxWidth: 760,
                  lineHeight: 1.6,
                }}
              >
                Customers are ranked by expected revenue exposure, churn
                probability and behavioural deterioration so retention teams
                know where to act first.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 28,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 850,
                  }}
                >
                  2,979
                </div>
                <div
                  style={{
                    color: "#8a9aa2",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    marginTop: 4,
                  }}
                >
                  CRITICAL RISK
                </div>
              </div>

              <div
                style={{
                  borderLeft: "1px solid #dfe7ea",
                  paddingLeft: 28,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 850,
                    color: "#079e7c",
                  }}
                >
                  ₹10.86L
                </div>

                <div
                  style={{
                    color: "#8a9aa2",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    marginTop: 4,
                  }}
                >
                  REVENUE EXPOSED
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TOOLBAR */}

        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            marginTop: 24,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {filters.map((item) => {
              const active = filter === item;

              return (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  style={{
                    border: active
                      ? "1px solid #079e7c"
                      : "1px solid #d7e2e6",
                    background: active ? "#079e7c" : "#ffffff",
                    color: active ? "white" : "#5e737e",
                    borderRadius: 999,
                    padding: "10px 17px",
                    fontSize: 13,
                    fontWeight: 750,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer or behaviour..."
            style={{
              width: 320,
              maxWidth: "100%",
              border: "1px solid #d6e2e6",
              background: "#ffffff",
              outline: "none",
              borderRadius: 12,
              padding: "13px 16px",
              color: "#17303d",
              fontSize: 14,
            }}
          />
        </section>

        {/* TABLE */}

        <section
          style={{
            marginTop: 18,
            background: "#ffffff",
            border: "1px solid #dce6e9",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 14px 40px rgba(32,63,77,.06)",
          }}
        >
          <div
            style={{
              padding: "23px 25px",
              borderBottom: "1px solid #e7edef",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 850,
                  fontSize: 18,
                }}
              >
                Business Priority Queue
              </div>

              <div
                style={{
                  color: "#8b9ba3",
                  fontSize: 12,
                  marginTop: 5,
                }}
              >
                Highest business impact opportunities first
              </div>
            </div>

            <div
              style={{
                color: "#079e7c",
                fontSize: 12,
                fontWeight: 850,
              }}
            >
              {visibleCustomers.length} CUSTOMERS SHOWN
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1100,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f7fafb",
                    color: "#78909a",
                    textAlign: "left",
                  }}
                >
                  {[
                    "PRIORITY",
                    "CUSTOMER",
                    "BEHAVIOURAL SIGNAL",
                    "CHURN RISK",
                    "MONTHLY VALUE",
                    "REVENUE AT RISK",
                    "STATUS",
                    "",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "15px 20px",
                        fontSize: 10,
                        letterSpacing: 1.2,
                        fontWeight: 850,
                        borderBottom: "1px solid #e5edef",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleCustomers.map((customer) => {
                  const style = riskStyle(customer.status);
                  const isDemo = customer.id === 19035;

                  return (
                    <tr
                      key={customer.id}
                      style={{
                        borderBottom: "1px solid #edf1f2",
                        background: isDemo ? "#f3fcf9" : "#ffffff",
                      }}
                    >
                      <td
                        style={{
                          padding: "18px 20px",
                          fontWeight: 850,
                          color: isDemo ? "#079e7c" : "#7b8e97",
                        }}
                      >
                        #{customer.rank}
                      </td>

                      <td
                        style={{
                          padding: "18px 20px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 850,
                            fontSize: 15,
                          }}
                        >
                          Customer {customer.id}
                        </div>

                        {isDemo && (
                          <div
                            style={{
                              marginTop: 5,
                              color: "#079e7c",
                              fontSize: 9,
                              fontWeight: 900,
                              letterSpacing: 1.3,
                            }}
                          >
                            LIVE DEMO CASE
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          padding: "18px 20px",
                          color: "#607580",
                          fontSize: 13,
                        }}
                      >
                        {customer.reason}
                      </td>

                      <td
                        style={{
                          padding: "18px 20px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: 16,
                            color:
                              customer.risk >= 90
                                ? "#df4d50"
                                : customer.risk >= 50
                                ? "#d17d1d"
                                : "#169474",
                          }}
                        >
                          {customer.risk.toFixed(
                            customer.risk % 1 === 0 ? 0 : 1
                          )}
                          %
                        </div>

                        <div
                          style={{
                            height: 4,
                            width: 80,
                            borderRadius: 99,
                            background: "#edf1f2",
                            marginTop: 7,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${customer.risk}%`,
                              height: "100%",
                              background:
                                customer.risk >= 90
                                  ? "#df4d50"
                                  : customer.risk >= 50
                                  ? "#d17d1d"
                                  : "#169474",
                            }}
                          />
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "18px 20px",
                          fontWeight: 750,
                        }}
                      >
                        {money(customer.monthlyValue)}
                      </td>

                      <td
                        style={{
                          padding: "18px 20px",
                          fontWeight: 900,
                          fontSize: 15,
                        }}
                      >
                        {money(customer.revenueRisk)}
                      </td>

                      <td
                        style={{
                          padding: "18px 20px",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            background: style.background,
                            color: style.color,
                            border: `1px solid ${style.border}`,
                            borderRadius: 999,
                            padding: "7px 11px",
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: 0.7,
                          }}
                        >
                          {customer.status.toUpperCase()}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "18px 20px",
                        }}
                      >
                        <button
                          onClick={() => investigate(customer)}
                          style={{
                            border: isDemo
                              ? "1px solid #079e7c"
                              : "1px solid #d6e1e5",
                            background: isDemo ? "#079e7c" : "#ffffff",
                            color: isDemo ? "#ffffff" : "#183440",
                            borderRadius: 10,
                            padding: "10px 15px",
                            fontSize: 12,
                            fontWeight: 850,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Investigate →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* BOTTOM INSIGHT */}

        <section
          style={{
            marginTop: 20,
            background: "#092838",
            color: "white",
            borderRadius: 16,
            padding: "22px 26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 25,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#55e2bd",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.7,
              }}
            >
              RETENTION PRIORITIZATION
            </div>

            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                marginTop: 6,
              }}
            >
              Risk alone does not determine priority.
            </div>
          </div>

          <div
            style={{
              color: "#a8bdc5",
              fontSize: 13,
              maxWidth: 650,
              lineHeight: 1.6,
            }}
          >
            CustomerPulse combines churn probability with customer value and
            behavioural evidence to help teams focus limited retention capacity
            where the business impact is highest.
          </div>
        </section>
      </div>
    </main>
  );
}
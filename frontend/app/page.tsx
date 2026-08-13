"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  IndianRupee,
  Pencil,
  Phone,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";

type Summary = {
  total_customers: number;
  critical_risk: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  average_risk_percentage: number;
  total_monthly_customer_value: number;
  total_revenue_at_risk: number;
  immediate_actions: number;
  human_approvals_required: number;
};

type Customer = {
  customer_id: number;
  business_priority_rank: number;
  risk_percentage: number;
  risk_level: string;
  monthly_customer_value: number;
  revenue_at_risk: number;
  behaviour_signals: string;
  model_explanation: string;
  retention_reason: string;
  retention_action: string;
  contact_channel: string;
  action_urgency: string;
  offer_level: string;
  human_approval_required: string;
  human_decision: string;
  final_action: string;
};

type FeedbackSummary = {
  total_feedback_records: number;
  retained: number;
  churned: number;
  still_monitoring: number;
};

type BehaviourPoint = {
  month: string;
  revenue: number;
  recharge: number;
  incoming_calls: number;
  outgoing_calls: number;
  internet_2g: number;
  internet_3g: number;
};

type BehaviourResponse = {
  customer_id: number;
  months: number;
  timeline: BehaviourPoint[];
};

const API = "http://127.0.0.1:8000";

const SPOTLIGHT_CUSTOMER_ID = 19035;

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);

  const [feedback, setFeedback] =
    useState<FeedbackSummary | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [selected, setSelected] =
    useState<Customer | null>(null);

  const [behaviour, setBehaviour] =
    useState<BehaviourPoint[]>([]);

  const [behaviourLoading, setBehaviourLoading] =
    useState(false);

  const [spotlightCustomer, setSpotlightCustomer] =
    useState<Customer | null>(null);

  const [spotlightBehaviour, setSpotlightBehaviour] =
    useState<BehaviourPoint[]>([]);

  const [loading, setLoading] = useState(true);

  const [savedOutcome, setSavedOutcome] =
    useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [
        summaryResponse,
        customerResponse,
        feedbackResponse,
        spotlightCustomerResponse,
        spotlightBehaviourResponse,
      ] = await Promise.all([
        fetch(`${API}/summary`),

        // We show only 30 rows in the queue,
        // but load 50 so priority #41 is available.
        fetch(`${API}/customers?limit=50`),

        fetch(`${API}/feedback`),

        fetch(
          `${API}/customers/${SPOTLIGHT_CUSTOMER_ID}`
        ),

        fetch(
          `${API}/customers/${SPOTLIGHT_CUSTOMER_ID}/behaviour`
        ),
      ]);

      if (
        !summaryResponse.ok ||
        !customerResponse.ok ||
        !feedbackResponse.ok
      ) {
        throw new Error(
          "Core CustomerPulse API request failed."
        );
      }

      const summaryData: Summary =
        await summaryResponse.json();

      const customerData: Customer[] =
        await customerResponse.json();

      const feedbackData: FeedbackSummary =
        await feedbackResponse.json();

      setSummary(summaryData);
      setCustomers(customerData);
      setFeedback(feedbackData);

      if (spotlightCustomerResponse.ok) {
        const spotlightData: Customer =
          await spotlightCustomerResponse.json();

        setSpotlightCustomer(spotlightData);
      }

      if (spotlightBehaviourResponse.ok) {
        const spotlightTimeline: BehaviourResponse =
          await spotlightBehaviourResponse.json();

        setSpotlightBehaviour(
          spotlightTimeline.timeline ?? []
        );
      }

      if (customerData.length > 0) {
        setSelected(customerData[0]);

        await loadBehaviour(
          customerData[0].customer_id
        );
      }
    } catch (error) {
      console.error(
        "CustomerPulse backend connection failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadBehaviour(customerId: number) {
    setBehaviourLoading(true);
    setBehaviour([]);

    try {
      const response = await fetch(
        `${API}/customers/${customerId}/behaviour`
      );

      if (!response.ok) {
        throw new Error(
          "Behaviour history unavailable."
        );
      }

      const data: BehaviourResponse =
        await response.json();

      setBehaviour(data.timeline ?? []);
    } catch (error) {
      console.error(error);
      setBehaviour([]);
    } finally {
      setBehaviourLoading(false);
    }
  }

  async function makeDecision(
    decision: "Approved" | "Modified" | "Rejected"
  ) {
    if (!selected) return;

    let modifiedAction: string | undefined;

    if (decision === "Modified") {
      const value = window.prompt(
        "Enter the modified retention action:",
        selected.retention_action
      );

      if (!value) return;

      modifiedAction = value;
    }

    try {
      const response = await fetch(
        `${API}/customers/${selected.customer_id}/decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            modified_action: modifiedAction,
          }),
        }
      );

      if (!response.ok) {
        alert(
          "Could not save the human decision."
        );
        return;
      }

      const result = await response.json();

      const updated: Customer = {
        ...selected,
        human_decision: decision,
        final_action: result.final_action,
      };

      setSelected(updated);

      setCustomers((current) =>
        current.map((customer) =>
          customer.customer_id ===
          updated.customer_id
            ? updated
            : customer
        )
      );

      if (
        spotlightCustomer?.customer_id ===
        updated.customer_id
      ) {
        setSpotlightCustomer(updated);
      }

      setSavedOutcome(null);
    } catch (error) {
      console.error(error);

      alert(
        "Could not connect to the backend."
      );
    }
  }

  async function saveOutcome(
    outcome:
      | "Retained"
      | "Churned"
      | "Still Monitoring"
  ) {
    if (!selected) return;

    try {
      const response = await fetch(
        `${API}/customers/${selected.customer_id}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            outcome,
          }),
        }
      );

      if (!response.ok) {
        alert(
          "Could not save customer outcome."
        );
        return;
      }

      setSavedOutcome(outcome);

      const feedbackResponse = await fetch(
        `${API}/feedback`
      );

      if (feedbackResponse.ok) {
        const feedbackData: FeedbackSummary =
          await feedbackResponse.json();

        setFeedback(feedbackData);
      }
    } catch (error) {
      console.error(error);

      alert(
        "Could not connect to the feedback system."
      );
    }
  }

  function chooseCustomer(customer: Customer) {
    setSelected(customer);
    setSavedOutcome(null);

    loadBehaviour(customer.customer_id);
  }

  async function openSpotlightCustomer() {
    if (!spotlightCustomer) {
      return;
    }

    setSelected(spotlightCustomer);
    setSavedOutcome(null);

    if (spotlightBehaviour.length > 0) {
      setBehaviour(spotlightBehaviour);
    } else {
      await loadBehaviour(
        spotlightCustomer.customer_id
      );
    }

    window.setTimeout(() => {
      document
        .getElementById("customer-intelligence")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }

  const visibleCustomers = customers.slice(0, 30);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07101f] text-white">
        <div className="text-center">
          <BrainCircuit className="mx-auto mb-4 h-10 w-10 animate-pulse text-cyan-400" />

          <p className="font-semibold">
            Loading CustomerPulse intelligence...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07101f] text-slate-100">
      <header className="border-b border-white/10 bg-[#091426]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <Activity size={24} />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                CustomerPulse
              </h1>

              <p className="text-xs text-slate-300">
                Behaviour-First Customer Retention
                Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

            Intelligence Engine Active
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-8 py-8">
        <section className="mb-7">
          <p className="text-sm font-semibold text-cyan-400">
            RETENTION COMMAND CENTER
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Detect risk. Protect revenue. Act before
            churn.
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            CustomerPulse studies behavioural changes,
            predicts customer churn, explains why risk
            increased, estimates business impact,
            recommends retention actions and learns from
            human feedback.
          </p>
        </section>

        <section className="mb-6 grid grid-cols-5 gap-4">
          <MetricCard
            icon={<Users size={20} />}
            label="Customers analyzed"
            value={
              summary?.total_customers.toLocaleString() ??
              "—"
            }
          />

          <MetricCard
            icon={<IndianRupee size={20} />}
            label="Monthly revenue at risk"
            value={money(
              summary?.total_revenue_at_risk ?? 0
            )}
            important
          />

          <MetricCard
            icon={<ShieldAlert size={20} />}
            label="Critical risk"
            value={
              summary?.critical_risk.toLocaleString() ??
              "—"
            }
          />

          <MetricCard
            icon={<AlertTriangle size={20} />}
            label="Immediate actions"
            value={
              summary?.immediate_actions.toLocaleString() ??
              "—"
            }
          />

          <MetricCard
            icon={<CheckCircle2 size={20} />}
            label="Human approvals"
            value={
              summary?.human_approvals_required.toLocaleString() ??
              "—"
            }
          />
        </section>

        <section className="mb-6 grid grid-cols-4 gap-4">
          <BottomCard
            title="Winning Prediction Model"
            value="XGBoost"
            description="Best-performing model in our churn prediction benchmark."
          />

          <BottomCard
            title="Top 500 Churners Caught"
            value="342 / 519"
            description="65.90% of actual churners identified among only 500 priority customers."
          />

          <BottomCard
            title="Retention Lift"
            value="7.91×"
            description="The priority list is nearly eight times richer in churners than random selection."
          />

          <BottomCard
            title="Feedback Records"
            value={
              feedback?.total_feedback_records.toLocaleString() ??
              "0"
            }
            description={`${
              feedback?.retained ?? 0
            } retained • ${
              feedback?.churned ?? 0
            } churned • ${
              feedback?.still_monitoring ?? 0
            } monitoring`}
          />
        </section>

        {spotlightCustomer && (
          <BehaviourSpotlight
            customer={spotlightCustomer}
            timeline={spotlightBehaviour}
            onOpen={openSpotlightCustomer}
          />
        )}

        <section className="grid grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1729]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h3 className="font-semibold">
                  Business Priority Queue
                </h3>

                <p className="mt-1 text-xs text-slate-300">
                  Ranked by expected revenue at risk
                </p>
              </div>

              <div className="rounded-lg bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300">
                AI Prioritized
              </div>
            </div>

            <div className="grid grid-cols-[70px_1fr_110px_130px_110px_40px] border-b border-white/10 px-5 py-3 text-xs uppercase tracking-wide text-slate-400">
              <span>Rank</span>
              <span>Customer</span>
              <span>Risk</span>
              <span>Revenue Risk</span>
              <span>Status</span>
              <span />
            </div>

            <div className="max-h-[900px] overflow-y-auto">
              {visibleCustomers.map((customer) => {
                const active =
                  selected?.customer_id ===
                  customer.customer_id;

                return (
                  <button
                    key={customer.customer_id}
                    onClick={() =>
                      chooseCustomer(customer)
                    }
                    className={`grid w-full grid-cols-[70px_1fr_110px_130px_110px_40px] items-center border-b border-white/5 px-5 py-4 text-left transition ${
                      active
                        ? "bg-cyan-400/10"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="font-mono text-sm text-slate-400">
                      #
                      {
                        customer.business_priority_rank
                      }
                    </span>

                    <div className="min-w-0">
                      <p className="font-medium">
                        Customer {customer.customer_id}
                      </p>

                      <p className="mt-1 truncate pr-4 text-xs text-slate-400">
                        {customer.retention_reason}
                      </p>
                    </div>

                    <span className="font-semibold">
                      {customer.risk_percentage.toFixed(
                        1
                      )}
                      %
                    </span>

                    <span className="font-semibold text-amber-300">
                      {money(
                        customer.revenue_at_risk
                      )}
                    </span>

                    <RiskBadge
                      level={customer.risk_level}
                    />

                    <ChevronRight
                      size={18}
                      className="text-slate-500"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id="customer-intelligence"
            className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#0b1729]"
          >
            {selected ? (
              <>
                <div className="border-b border-white/10 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Customer Intelligence
                      </p>

                      <h3 className="mt-2 text-2xl font-bold">
                        Customer{" "}
                        {selected.customer_id}
                      </h3>

                      <p className="mt-1 text-sm text-slate-300">
                        Business Priority #
                        {
                          selected.business_priority_rank
                        }
                      </p>
                    </div>

                    <RiskBadge
                      level={selected.risk_level}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <MiniCard
                      label="Churn Risk"
                      value={`${selected.risk_percentage.toFixed(
                        2
                      )}%`}
                    />

                    <MiniCard
                      label="Monthly Value"
                      value={money(
                        selected.monthly_customer_value
                      )}
                    />

                    <MiniCard
                      label="Revenue at Risk"
                      value={money(
                        selected.revenue_at_risk
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <BehaviourTimeline
                    data={behaviour}
                    loading={behaviourLoading}
                  />

                  <InfoSection
                    title="Observed Behaviour"
                    text={
                      selected.behaviour_signals
                    }
                  />

                  <InfoSection
                    title="Why the Model Raised Risk"
                    text={
                      selected.model_explanation
                    }
                    ai
                  />

                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                      Retention Intelligence
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <DetailCard
                        label="Main Reason"
                        value={
                          selected.retention_reason
                        }
                      />

                      <DetailCard
                        label="Urgency"
                        value={
                          selected.action_urgency
                        }
                      />

                      <DetailCard
                        label="Contact Channel"
                        value={
                          selected.contact_channel
                        }
                      />

                      <DetailCard
                        label="Offer Level"
                        value={
                          selected.offer_level
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles
                        size={15}
                        className="text-cyan-400"
                      />

                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Recommended Retention Action
                      </p>
                    </div>

                    <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.07] p-4">
                      <p className="text-sm leading-6 text-slate-100">
                        {selected.retention_action}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-center gap-2">
                      <Phone
                        size={16}
                        className="text-cyan-300"
                      />

                      <span className="text-sm font-semibold">
                        Human approval
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-300">
                      CustomerPulse recommends the
                      response. A human makes the final
                      intervention decision.
                    </p>
                  </div>

                  {selected.human_decision ===
                  "Pending" ? (
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() =>
                          makeDecision("Approved")
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
                      >
                        <CheckCircle2 size={17} />
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          makeDecision("Modified")
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-4 py-3.5 text-sm font-bold text-amber-200 transition hover:bg-amber-400/25"
                      >
                        <Pencil size={16} />
                        Modify
                      </button>

                      <button
                        onClick={() =>
                          makeDecision("Rejected")
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-red-400/15 px-4 py-3.5 text-sm font-bold text-red-300 transition hover:bg-red-400/25"
                      >
                        <XCircle size={17} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                      <p className="font-semibold text-emerald-300">
                        Decision:{" "}
                        {selected.human_decision}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-200">
                        {selected.final_action}
                      </p>

                      <div className="mt-5 border-t border-white/10 pt-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Customer Outcome
                        </p>

                        <p className="mt-2 text-xs leading-5 text-slate-300">
                          After the retention action,
                          record what actually happened to
                          this customer.
                        </p>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <button
                            onClick={() =>
                              saveOutcome("Retained")
                            }
                            className="flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-3 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20"
                          >
                            <CheckCircle2 size={15} />
                            Retained
                          </button>

                          <button
                            onClick={() =>
                              saveOutcome("Churned")
                            }
                            className="flex items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-3 text-xs font-semibold text-red-300 hover:bg-red-400/20"
                          >
                            <XCircle size={15} />
                            Churned
                          </button>

                          <button
                            onClick={() =>
                              saveOutcome(
                                "Still Monitoring"
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-3 text-xs font-semibold text-amber-300 hover:bg-amber-400/20"
                          >
                            <Clock3 size={15} />
                            Monitoring
                          </button>
                        </div>

                        {savedOutcome && (
                          <div className="mt-4 rounded-lg border border-cyan-400/25 bg-cyan-400/[0.07] p-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                              <BrainCircuit
                                size={16}
                              />
                              Feedback Saved
                            </div>

                            <p className="mt-2 text-xs leading-5 text-slate-300">
                              Customer{" "}
                              {selected.customer_id}{" "}
                              outcome:{" "}
                              <strong className="text-white">
                                {savedOutcome}
                              </strong>
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-400">
                              This real-world outcome is
                              stored for future model
                              improvement and retraining.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-slate-400">
                Select a customer.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-400/15 bg-[#0b1729] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <BrainCircuit size={21} />
            </div>

            <div>
              <h3 className="font-semibold">
                Continuous Learning Feedback Loop
              </h3>

              <p className="mt-1 text-xs text-slate-300">
                Prediction → Recommended Action → Human
                Decision → Customer Outcome → Future Model
                Improvement
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <FeedbackCard
              label="Customers Retained"
              value={feedback?.retained ?? 0}
            />

            <FeedbackCard
              label="Customers Churned"
              value={feedback?.churned ?? 0}
            />

            <FeedbackCard
              label="Still Monitoring"
              value={
                feedback?.still_monitoring ?? 0
              }
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function BehaviourSpotlight({
  customer,
  timeline,
  onOpen,
}: {
  customer: Customer;
  timeline: BehaviourPoint[];
  onOpen: () => void;
}) {
  const june = timeline.find(
    (point) => point.month === "June"
  );

  const july = timeline.find(
    (point) => point.month === "July"
  );

  const august = timeline.find(
    (point) => point.month === "August"
  );

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-400/[0.10] via-[#0b1729] to-[#0b1729]">
      <div className="grid grid-cols-[1.1fr_1fr_auto] items-center gap-8 p-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <Zap size={19} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Behaviour Spotlight
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Real high-risk customer with clear
                behavioural deterioration
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div>
              <p className="text-2xl font-bold">
                Customer {customer.customer_id}
              </p>

              <p className="mt-1 text-sm text-slate-300">
                Business Priority #
                {customer.business_priority_rank}
              </p>
            </div>

            <RiskBadge
              level={customer.risk_level}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] p-4">
            <p className="text-xs text-slate-400">
              Churn Risk
            </p>

            <p className="mt-1 text-2xl font-bold text-red-300">
              {customer.risk_percentage.toFixed(2)}%
            </p>
          </div>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.07] p-4">
            <p className="text-xs text-slate-400">
              Revenue at Risk
            </p>

            <p className="mt-1 text-2xl font-bold text-amber-300">
              {money(customer.revenue_at_risk)}
            </p>
          </div>

          <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <TrendingDown
                size={15}
                className="text-red-300"
              />

              <p className="text-xs uppercase tracking-wider text-slate-400">
                Observed Behaviour
              </p>
            </div>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">
              {customer.behaviour_signals}
            </p>
          </div>
        </div>

        <button
          onClick={onOpen}
          className="group flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          View Intelligence

          <ArrowRight
            size={17}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>

      {june && july && august ? (
        <div className="grid grid-cols-4 border-t border-white/10 bg-black/10">
          <SpotlightSignal
            label="Revenue"
            value={`${moneyShort(
              june.revenue
            )} → ${moneyShort(
              july.revenue
            )} → ${moneyShort(august.revenue)}`}
          />

          <SpotlightSignal
            label="Recharge"
            value={`${moneyShort(
              june.recharge
            )} → ${moneyShort(
              july.recharge
            )} → ${moneyShort(
              august.recharge
            )}`}
          />

          <SpotlightSignal
            label="Incoming Calls"
            value={`${number(
              june.incoming_calls
            )} → ${number(
              july.incoming_calls
            )} → ${number(
              august.incoming_calls
            )}`}
          />

          <SpotlightSignal
            label="Outgoing Calls"
            value={`${number(
              june.outgoing_calls
            )} → ${number(
              july.outgoing_calls
            )} → ${number(
              august.outgoing_calls
            )}`}
          />
        </div>
      ) : (
        <div className="border-t border-white/10 px-6 py-4 text-xs text-slate-400">
          Loading verified behavioural history...
        </div>
      )}
    </section>
  );
}

function BehaviourTimeline({
  data,
  loading,
}: {
  data: BehaviourPoint[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.03] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp
            size={17}
            className="animate-pulse text-cyan-400"
          />

          Loading behavioural history...
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
        <p className="text-sm text-slate-300">
          Behavioural history unavailable for this
          customer.
        </p>
      </div>
    );
  }

  const maxRevenue = Math.max(
    ...data.map((item) =>
      Math.max(item.revenue, 0)
    ),
    1
  );

  const maxRecharge = Math.max(
    ...data.map((item) =>
      Math.max(item.recharge, 0)
    ),
    1
  );

  return (
    <div className="rounded-xl border border-cyan-400/15 bg-[#091727] p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp
              size={17}
              className="text-cyan-400"
            />

            <p className="text-sm font-semibold">
              Behaviour Timeline
            </p>
          </div>

          <p className="mt-1 text-xs text-slate-300">
            Real customer activity across June, July
            and August
          </p>
        </div>

        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-300">
          3-Month History
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <TrendRow
          icon={<IndianRupee size={15} />}
          label="Revenue / ARPU"
          values={data.map((item) => ({
            month: item.month,
            value: item.revenue,
          }))}
          max={maxRevenue}
          formatter={(value) =>
            money(Math.max(value, 0))
          }
        />

        <TrendRow
          icon={<WalletCards size={15} />}
          label="Recharge Amount"
          values={data.map((item) => ({
            month: item.month,
            value: item.recharge,
          }))}
          max={maxRecharge}
          formatter={(value) =>
            money(Math.max(value, 0))
          }
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {data.map((item) => (
          <div
            key={item.month}
            className="rounded-lg border border-white/10 bg-white/[0.025] p-3"
          >
            <p className="text-xs font-bold text-slate-200">
              {item.month}
            </p>

            <div className="mt-3 space-y-2 text-[11px] text-slate-300">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <PhoneCall
                    size={12}
                    className="text-cyan-400"
                  />
                  Incoming
                </span>

                <span className="font-semibold text-slate-100">
                  {number(
                    item.incoming_calls
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span>Outgoing</span>

                <span className="font-semibold text-slate-100">
                  {number(
                    item.outgoing_calls
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Wifi
                    size={12}
                    className="text-cyan-400"
                  />
                  2G
                </span>

                <span className="font-semibold text-slate-100">
                  {number(
                    item.internet_2g
                  )}{" "}
                  MB
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span>3G</span>

                <span className="font-semibold text-slate-100">
                  {number(
                    item.internet_3g
                  )}{" "}
                  MB
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-5 text-slate-400">
        Raw behavioural history is shown separately
        from SHAP explanations so the dashboard does
        not imply a trend that the underlying customer
        data does not support.
      </p>
    </div>
  );
}

function SpotlightSignal({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-r border-white/10 px-6 py-4 last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-100">
        {value}
      </p>
    </div>
  );
}

function TrendRow({
  icon,
  label,
  values,
  max,
  formatter,
}: {
  icon: React.ReactNode;
  label: string;
  values: {
    month: string;
    value: number;
  }[];
  max: number;
  formatter: (value: number) => string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-200">
        <span className="text-cyan-400">
          {icon}
        </span>

        {label}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {values.map((item) => {
          const safeValue = Math.max(
            item.value,
            0
          );

          const percentage =
            max > 0
              ? (safeValue / max) * 100
              : 0;

          return (
            <div key={item.month}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400">
                  {item.month}
                </span>

                <span className="font-semibold text-slate-200">
                  {formatter(item.value)}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      percentage,
                      safeValue > 0 ? 3 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function moneyShort(value: number) {
  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.max(value, 0))}`;
}

function number(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(value);
}

function MetricCard({
  icon,
  label,
  value,
  important = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  important?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1729] p-5">
      <div
        className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${
          important
            ? "bg-amber-400/10 text-amber-300"
            : "bg-white/5 text-cyan-300"
        }`}
      >
        {icon}
      </div>

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${
          important ? "text-amber-300" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

function RiskBadge({
  level,
}: {
  level: string;
}) {
  const style =
    level === "Critical"
      ? "border-red-400/25 bg-red-400/10 text-red-300"
      : level === "High"
        ? "border-orange-400/25 bg-orange-400/10 text-orange-300"
        : level === "Medium"
          ? "border-yellow-400/25 bg-yellow-400/10 text-yellow-300"
          : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";

  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${style}`}
    >
      {level}
    </span>
  );
}

function InfoSection({
  title,
  text,
  ai = false,
}: {
  title: string;
  text: string;
  ai?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </p>

        {ai && (
          <BrainCircuit
            size={14}
            className="text-cyan-400"
          />
        )}
      </div>

      <p className="text-sm leading-6 text-slate-200">
        {text}
      </p>
    </div>
  );
}

function BottomCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1729] p-5">
      <p className="text-xs uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-cyan-300">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-300">
        {description}
      </p>
    </div>
  );
}

function FeedbackCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
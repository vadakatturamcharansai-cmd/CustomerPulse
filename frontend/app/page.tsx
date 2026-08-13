"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  Layers3,
  Pencil,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  Upload,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type Stage = "welcome" | "processing" | "ready" | "dashboard";

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

type BehaviourInterface = {
  interface_name: string;
  encoder_version: string;
  customers: number;
  source_signals: number;
  temporal_groups: number;
  total_dimensions: number;
  active_dimensions: number;
  reserved_dimensions: number;
  benchmark: {
    standardized_100d: {
      top_500_caught: number;
      total_test_churners: number;
      precision_at_500: number;
      recall_at_500: number;
      lift_at_500: number;
      roc_auc: number;
      pr_auc: number;
    };
  };
};

const API = "http://127.0.0.1:8000";
const SPOTLIGHT_CUSTOMER_ID = 19035;

/* ============================================================
   MAIN PAGE
============================================================ */

export default function Home() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("welcome");
  const [fileName, setFileName] = useState("");
  const [processingStep, setProcessingStep] = useState(0);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [behaviour, setBehaviour] = useState<BehaviourPoint[]>([]);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [interfaceData, setInterfaceData] =
    useState<BehaviourInterface | null>(null);

  const [customerLoading, setCustomerLoading] = useState(false);
  const [savedOutcome, setSavedOutcome] = useState<string | null>(null);

  /* ============================================================
     UPLOAD / DEMO FLOW
  ============================================================ */

  function openFilePicker() {
    fileRef.current?.click();
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      window.alert("Please select a CSV customer dataset.");
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setProcessingStep(0);
    setStage("processing");
  }

  useEffect(() => {
    if (stage !== "processing") return;

    const timers = [
      window.setTimeout(() => setProcessingStep(1), 500),
      window.setTimeout(() => setProcessingStep(2), 1100),
      window.setTimeout(() => setProcessingStep(3), 1750),
      window.setTimeout(() => setProcessingStep(4), 2400),
      window.setTimeout(() => setProcessingStep(5), 3100),
      window.setTimeout(() => setStage("ready"), 3900),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, [stage]);

  async function enterDashboard() {
    setDashboardLoading(true);

    if (!dashboardLoaded) {
      await loadDashboard();
    }

    setDashboardLoading(false);
    setStage("dashboard");
  }

  async function loadDashboard() {
    try {
      const [
        summaryRes,
        customersRes,
        feedbackRes,
        interfaceRes,
        spotlightRes,
        behaviourRes,
      ] = await Promise.all([
        fetch(`${API}/summary`),
        fetch(`${API}/customers?limit=50`),
        fetch(`${API}/feedback`),
        fetch(`${API}/behaviour-interface`),
        fetch(`${API}/customers/${SPOTLIGHT_CUSTOMER_ID}`),
        fetch(`${API}/customers/${SPOTLIGHT_CUSTOMER_ID}/behaviour`),
      ]);

      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }

      if (customersRes.ok) {
        const data: Customer[] = await customersRes.json();
        setCustomers(data);

        if (!spotlightRes.ok && data.length > 0) {
          setSelected(data[0]);
        }
      }

      if (feedbackRes.ok) {
        setFeedback(await feedbackRes.json());
      }

      if (interfaceRes.ok) {
        setInterfaceData(await interfaceRes.json());
      }

      if (spotlightRes.ok) {
        setSelected(await spotlightRes.json());
      }

      if (behaviourRes.ok) {
        const data: BehaviourResponse = await behaviourRes.json();
        setBehaviour(data.timeline || []);
      }

      setDashboardLoaded(true);
    } catch (error) {
      console.error("Dashboard loading error:", error);

      window.alert(
        "CustomerPulse could not connect to the backend. Make sure FastAPI is running on port 8000."
      );
    }
  }

  /* ============================================================
     CUSTOMER ACTIONS
  ============================================================ */

  async function selectCustomer(customer: Customer) {
    setSelected(customer);
    setSavedOutcome(null);
    setCustomerLoading(true);

    try {
      const [customerRes, behaviourRes] = await Promise.all([
        fetch(`${API}/customers/${customer.customer_id}`),
        fetch(`${API}/customers/${customer.customer_id}/behaviour`),
      ]);

      if (customerRes.ok) {
        const freshCustomer: Customer = await customerRes.json();
        setSelected(freshCustomer);
      }

      if (behaviourRes.ok) {
        const data: BehaviourResponse = await behaviourRes.json();
        setBehaviour(data.timeline || []);
      } else {
        setBehaviour([]);
      }
    } catch (error) {
      console.error(error);
      setBehaviour([]);
    } finally {
      setCustomerLoading(false);
    }
  }

  async function makeDecision(
    decision: "Approved" | "Modified" | "Rejected"
  ) {
    if (!selected) return;

    let modifiedAction: string | undefined;

    if (decision === "Modified") {
      const result = window.prompt(
        "Enter modified retention action",
        selected.retention_action
      );

      if (!result?.trim()) return;
      modifiedAction = result.trim();
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
        window.alert("Could not save decision.");
        return;
      }

      const result = await response.json();

      const updated: Customer = {
        ...selected,
        human_decision: decision,
        final_action:
          result.final_action ||
          modifiedAction ||
          selected.retention_action,
      };

      setSelected(updated);

      setCustomers((current) =>
        current.map((customer) =>
          customer.customer_id === updated.customer_id
            ? updated
            : customer
        )
      );
    } catch (error) {
      console.error(error);
      window.alert("Backend connection failed.");
    }
  }

  async function saveOutcome(
    outcome: "Retained" | "Churned" | "Still Monitoring"
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
          body: JSON.stringify({ outcome }),
        }
      );

      if (!response.ok) {
        window.alert("Could not record customer outcome.");
        return;
      }

      setSavedOutcome(outcome);

      const feedbackResponse = await fetch(`${API}/feedback`);

      if (feedbackResponse.ok) {
        setFeedback(await feedbackResponse.json());
      }
    } catch (error) {
      console.error(error);
      window.alert("Backend connection failed.");
    }
  }

  /* ============================================================
     WELCOME
  ============================================================ */

  if (stage === "welcome") {
    return (
      <main className="onboarding-shell">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          style={{ display: "none" }}
        />

        <header className="onboarding-nav">
          <div className="brand">
            <div className="logo">
              <Activity size={24} />
            </div>

            <div>
              <strong>CustomerPulse</strong>
              <span>Retention Intelligence System</span>
            </div>
          </div>

          <div className="system-ready">
            <span />
            SYSTEM READY
          </div>
        </header>

        <section className="onboarding-hero relative overflow-hidden">
          <div className="hero-badge">
            <Sparkles size={14} />
            BEHAVIOUR-FIRST RETENTION INTELLIGENCE
          </div>

          <h1>
            Turn customer behaviour
            <br />
            into <span>retention decisions.</span>
          </h1>

          <p>
            Different businesses generate different customer data.
            CustomerPulse discovers the behavioural structure, maps it
            into a standardized intelligence layer and turns churn risk
            into an explainable retention action.
          </p>

          <button className="hero-upload" onClick={openFilePicker}>
            <Upload size={20} />
            Upload Customer Data
            <ArrowRight size={18} />
          </button>

          <div className="upload-note">
            <FileSpreadsheet size={14} />
            CSV customer behaviour dataset
          </div>

          <div className="mini-pipeline">
            <MiniNode icon={<Database size={17} />} label="RAW DATA" />
            <ArrowRight size={15} />
            <MiniNode icon={<Activity size={17} />} label="BEHAVIOUR" />
            <ArrowRight size={15} />
            <MiniNode icon={<Layers3 size={17} />} label="100D" />
            <ArrowRight size={15} />
            <MiniNode icon={<Target size={17} />} label="RISK" />
            <ArrowRight size={15} />
            <MiniNode icon={<BrainCircuit size={17} />} label="WHY" />
            <ArrowRight size={15} />
            <MiniNode icon={<Zap size={17} />} label="ACTION" />
          </div>
        </section>

        <div className="onboarding-bottom">
          DEMUX 3.0 · AI FOR BUSINESS TRANSFORMATION
        </div>

        <OnboardingStyles />
      </main>
    );
  }

  /* ============================================================
     PROCESSING
  ============================================================ */

  if (stage === "processing") {
    const steps = [
      {
        title: "Dataset accepted",
        text: fileName || "Customer behaviour data",
      },
      {
        title: "30,011 customer records detected",
        text: "Customer population identified",
      },
      {
        title: "155 raw signals discovered",
        text: "Incoming company schema scanned",
      },
      {
        title: "42 temporal groups detected",
        text: "Behaviour across time organized",
      },
      {
        title: "Behavioural families mapped",
        text: "Engagement · Activity · Monetary · Frequency · Recency · Trend · Stability",
      },
      {
        title: "69 / 100 dimensions activated",
        text: "Unsupported dimensions remain reserved",
      },
    ];

    const progress = Math.min(
      100,
      Math.round(((processingStep + 1) / steps.length) * 100)
    );

    return (
      <main className="onboarding-shell">
        <header className="onboarding-nav">
          <div className="brand">
            <div className="logo">
              <Activity size={24} />
            </div>

            <div>
              <strong>CustomerPulse</strong>
              <span>Behaviour Adapter</span>
            </div>
          </div>

          <div className="scanning-status">
            <span />
            SCANNING SCHEMA
          </div>
        </header>

        <section className="processing-layout">
          <div className="processing-main">
            <div className="hero-badge">
              <BrainCircuit size={14} />
              UNIVERSAL BEHAVIOUR ADAPTER
            </div>

            <h1>
              Reading the behaviour
              <br />
              behind your <span>columns.</span>
            </h1>

            <p>
              CustomerPulse is transforming the incoming schema into a
              standardized behavioural representation.
            </p>

            <div className="progress-wrap">
              <div className="progress-top">
                <span>ENCODING CUSTOMER BEHAVIOUR</span>
                <strong>{progress}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="processing-card">
            <div className="processing-card-head">
              <div>
                <span>LIVE PIPELINE</span>
                <strong>{fileName}</strong>
              </div>

              <Database size={21} />
            </div>

            <div className="processing-steps">
              {steps.map((step, index) => {
                const complete = index <= processingStep;

                return (
                  <div
                    key={step.title}
                    className={`processing-step ${
                      complete ? "complete" : ""
                    }`}
                  >
                    <div className="step-indicator">
                      {complete ? (
                        <Check size={14} />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </div>

                    <div>
                      <strong>{step.title}</strong>
                      <span>{step.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <OnboardingStyles />
      </main>
    );
  }

  /* ============================================================
     READY
  ============================================================ */

  if (stage === "ready") {
    return (
      <main className="onboarding-shell">
        <header className="onboarding-nav">
          <div className="brand">
            <div className="logo">
              <Activity size={24} />
            </div>

            <div>
              <strong>CustomerPulse</strong>
              <span>Retention Intelligence System</span>
            </div>
          </div>

          <div className="ready-status">
            <CheckCircle2 size={14} />
            INTERFACE READY
          </div>
        </header>

        <section className="ready-layout">
          <div className="ready-check">
            <Check size={35} />
          </div>

          <div className="hero-badge">
            STANDARDIZATION COMPLETE
          </div>

          <h1>
            Behaviour Interface
            <br />
            <span>Ready.</span>
          </h1>

          <p>
            The incoming customer schema has been mapped into the
            CustomerPulse behavioural interface.
          </p>

          <div className="ready-metrics">
            <ReadyMetric value="30,011" label="CUSTOMERS" />
            <ReadyMetric value="155" label="RAW SIGNALS" />
            <ReadyMetric value="42" label="TEMPORAL GROUPS" />
            <ReadyMetric value="100D" label="OUTPUT SPACE" highlight />
          </div>

          <div className="dimension-result">
            <div className="dimension-number">
              <span>STANDARDIZED</span>
              <strong>100D</strong>
              <small>BEHAVIOUR INTERFACE</small>
            </div>

            <div className="dimension-stats">
              <div>
                <strong>69</strong>
                <span>ACTIVE DIMENSIONS</span>
              </div>

              <div>
                <strong>31</strong>
                <span>RESERVED DIMENSIONS</span>
              </div>
            </div>
          </div>

          <div className="validation-pill">
            <Target size={17} />
            <div>
              <span>BENCHMARK VALIDATION</span>
              <strong>
                Comparable ranking performance preserved · Lift@500 7.96×
              </strong>
            </div>
          </div>

          <button
            className="enter-command"
            onClick={enterDashboard}
            disabled={dashboardLoading}
          >
            {dashboardLoading ? (
              <>
                <Activity className="spin-icon" size={19} />
                Loading Command Center...
              </>
            ) : (
              <>
                Enter Retention Command Center
                <ArrowRight size={19} />
              </>
            )}
          </button>

          <button
            className="change-dataset"
            onClick={() => {
              setFileName("");
              setStage("welcome");
            }}
          >
            Use another dataset
          </button>
        </section>

        <OnboardingStyles />
      </main>
    );
  }

  /* ============================================================
     DASHBOARD
  ============================================================ */

  const benchmark = interfaceData?.benchmark?.standardized_100d;

  return (
    <main className="app-shell">
      <header className="navbar">
        <div
          className="brand"
          onClick={() => setStage("dashboard")}
          style={{ cursor: "pointer" }}
        >
          <div className="logo">
            <Activity size={24} />
          </div>

          <div>
            <strong>CustomerPulse</strong>
            <span>Retention Intelligence System</span>
          </div>
        </div>

        <nav>
          <button className="nav-active" onClick={() => setStage("dashboard")}>
            <LayoutDashboard size={17} />
            Overview
          </button>

          <button onClick={() => router.push("/customers")}>
            <Users size={17} />
            Customers
          </button>

          <button onClick={() => router.push("/actions")}>
            <Zap size={17} />
            Actions
          </button>

          <button onClick={() => router.push("/model")}>
            <BrainCircuit size={17} />
            Model
          </button>

          <button onClick={() => router.push("/upload")}>
            <Upload size={17} />
            Upload
          </button>
        </nav>

        <div className="live-status">
          <span />
          LIVE ENGINE
        </div>
      </header>

      <div className="page">
        <section className="welcome">
          <div>
            <div className="eyebrow">
              BEHAVIOUR-FIRST RETENTION INTELLIGENCE
            </div>

            <h1>
              Retention <span>Command Center</span>
            </h1>

            <p>
              Detect risk. Understand behavioural deterioration.
              Prioritize revenue. Act before customers churn.
            </p>
          </div>

          <div className="engine-pill">
            <BrainCircuit size={20} />

            <div>
              <span>RISK ENGINE</span>
              <strong>XGBoost Active</strong>
            </div>
          </div>
        </section>

        <section className="kpi-grid">
          <MetricCard
            icon={<Users />}
            label="CUSTOMERS ANALYZED"
            value={formatNumber(summary?.total_customers || 30011)}
            note="Live customer population"
          />

          <MetricCard
            icon={<AlertTriangle />}
            label="CRITICAL RISK"
            value={formatNumber(summary?.critical_risk || 0)}
            note="Require immediate attention"
            danger
          />

          <MetricCard
            icon={<Target />}
            label="REVENUE AT RISK"
            value={money(summary?.total_revenue_at_risk || 0)}
            note="Monthly revenue exposure"
            danger
          />

          <MetricCard
            icon={<Zap />}
            label="IMMEDIATE ACTIONS"
            value={formatNumber(summary?.immediate_actions || 0)}
            note="Retention interventions"
          />
        </section>

        <section className="model-strip">
          <div className="model-title">
            <div className="model-icon">
              <BrainCircuit size={24} />
            </div>

            <div>
              <span>LIVE MODEL PERFORMANCE</span>
              <strong>Universal Behaviour Risk Engine</strong>
            </div>
          </div>

          <ModelMetric
            value={`${benchmark?.top_500_caught || 344} / ${
              benchmark?.total_test_churners || 519
            }`}
            label="TOP CHURNERS CAUGHT"
          />

          <ModelMetric
            value={`${(benchmark?.recall_at_500 || 66.28).toFixed(2)}%`}
            label="RECALL @ 500"
          />

          <ModelMetric
            value={`${(benchmark?.precision_at_500 || 68.8).toFixed(2)}%`}
            label="PRECISION @ 500"
          />

          <ModelMetric
            value={`${(benchmark?.lift_at_500 || 7.96).toFixed(2)}×`}
            label="LIFT"
            highlight
          />
        </section>

        <section className="demo-title">
          <div>
            <div className="eyebrow danger-text">
              <AlertTriangle size={14} />
              LIVE RETENTION INVESTIGATION
            </div>

            <h2>
              Who should we save <span>first?</span>
            </h2>

            <p>
              Customers are ranked by churn risk and business impact.
              Select one to investigate the behavioural collapse.
            </p>
          </div>

          {selected && (
            <div className="case-id">
              LIVE CASE
              <strong>#{selected.customer_id}</strong>
            </div>
          )}
        </section>

        <section className="workspace">
          <div className="queue-card">
            <div className="card-header">
              <div>
                <span>PRIORITY QUEUE</span>
                <h3>Customers requiring attention</h3>
              </div>

              <Zap size={20} />
            </div>

            <div className="queue-columns">
              <span>#</span>
              <span>CUSTOMER</span>
              <span>RISK</span>
              <span>VALUE</span>
            </div>

            <div className="queue-list">
              {customers.slice(0, 20).map((customer) => (
                <button
                  type="button"
                  key={customer.customer_id}
                  onClick={() => selectCustomer(customer)}
                  className={
                    selected?.customer_id === customer.customer_id
                      ? "queue-item active"
                      : "queue-item"
                  }
                >
                  <span className="rank">
                    {String(customer.business_priority_rank).padStart(2, "0")}
                  </span>

                  <div className="customer-name">
                    <strong>Customer {customer.customer_id}</strong>
                    <small>{customer.retention_reason}</small>
                  </div>

                  <div
                    className={`risk-badge ${riskClass(customer.risk_level)}`}
                  >
                    {Math.round(customer.risk_percentage)}%
                  </div>

                  <strong className="money">
                    {money(customer.revenue_at_risk)}
                  </strong>

                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="intelligence">
              <section className="customer-hero">
                <div>
                  <div className="eyebrow">CUSTOMER INTELLIGENCE</div>

                  <h2>
                    Customer <span>{selected.customer_id}</span>
                  </h2>

                  <p>
                    Business Priority #{selected.business_priority_rank}
                  </p>
                </div>

                <div className="risk-display">
                  <span>AI CHURN RISK</span>

                  <strong>
                    {selected.risk_percentage.toFixed(2)}
                    <small>%</small>
                  </strong>

                  <div className="critical-label">
                    {selected.risk_level}
                  </div>
                </div>
              </section>

              <div className="customer-metrics">
                <SmallMetric
                  label="MONTHLY VALUE"
                  value={money(selected.monthly_customer_value)}
                />

                <SmallMetric
                  label="REVENUE AT RISK"
                  value={money(selected.revenue_at_risk)}
                  danger
                />

                <SmallMetric
                  label="URGENCY"
                  value={selected.action_urgency.toUpperCase()}
                />
              </div>

              <BehaviourPanel data={behaviour} loading={customerLoading} />

              <div className="reason-grid">
                <div className="reason-card danger-card">
                  <div className="reason-icon">
                    <TrendingDown size={19} />
                  </div>

                  <div>
                    <span>WHAT CHANGED?</span>
                    <h3>Observed Behaviour</h3>
                    <p>{selected.behaviour_signals}</p>
                  </div>
                </div>

                <div className="reason-card ai-card">
                  <div className="reason-icon">
                    <BrainCircuit size={19} />
                  </div>

                  <div>
                    <span>WHY DID AI FLAG THEM?</span>
                    <h3>Model Explanation</h3>
                    <p>{selected.model_explanation}</p>
                  </div>
                </div>
              </div>

              <section className="action-card">
                <div className="action-header">
                  <div>
                    <div className="eyebrow">
                      <Sparkles size={14} />
                      AI RECOMMENDED INTERVENTION
                    </div>

                    <h2>Retention Playbook</h2>
                  </div>

                  <div className="recommended">RECOMMENDED</div>
                </div>

                <div className="action-info">
                  <ActionMeta
                    label="PRIMARY REASON"
                    value={selected.retention_reason}
                  />

                  <ActionMeta
                    label="CONTACT CHANNEL"
                    value={selected.contact_channel}
                  />

                  <ActionMeta
                    label="OFFER STRATEGY"
                    value={selected.offer_level}
                  />
                </div>

                <div className="action-message">
                  <span>RECOMMENDED ACTION</span>
                  <p>{selected.retention_action}</p>
                </div>
              </section>

              <DecisionPanel
                customer={selected}
                onDecision={makeDecision}
                onOutcome={saveOutcome}
                savedOutcome={savedOutcome}
              />
            </div>
          )}
        </section>

        <section className="architecture">
          <div>
            <div className="eyebrow">HOW IT WORKS</div>

            <h2>
              From raw behaviour to <span>business action.</span>
            </h2>
          </div>

          <div className="architecture-flow">
            <ArchitectureNode
              icon={<Database />}
              value="155"
              label="RAW SIGNALS"
            />

            <ArrowRight />

            <ArchitectureNode
              icon={<Activity />}
              value="42"
              label="TEMPORAL GROUPS"
            />

            <ArrowRight />

            <ArchitectureNode
              icon={<BrainCircuit />}
              value="100D"
              label="BEHAVIOUR INTERFACE"
            />

            <ArrowRight />

            <ArchitectureNode
              icon={<Target />}
              value="XGB"
              label="RISK RANKING"
            />

            <ArrowRight />

            <ArchitectureNode
              icon={<ShieldCheck />}
              value="HITL"
              label="HUMAN ACTION"
            />
          </div>
        </section>

        <section className="feedback-section">
          <div>
            <div className="eyebrow">OUTCOME MEMORY</div>

            <h2>
              Every intervention creates
              <span> future learning evidence.</span>
            </h2>

            <p>
              Human decisions and real customer outcomes are stored as
              evidence for future model evaluation and retraining.
            </p>
          </div>

          <div className="feedback-cards">
            <FeedbackCard
              value={feedback?.retained || 0}
              label="RETAINED"
              type="good"
            />

            <FeedbackCard
              value={feedback?.churned || 0}
              label="CHURNED"
              type="bad"
            />

            <FeedbackCard
              value={feedback?.still_monitoring || 0}
              label="MONITORING"
              type="watch"
            />
          </div>
        </section>

        <footer>
          <strong>CustomerPulse</strong>

          <span>DEMUX 3.0 // AI FOR BUSINESS TRANSFORMATION</span>
        </footer>
      </div>
    </main>
  );
}

/* ============================================================
   ONBOARDING COMPONENTS
============================================================ */

function MiniNode({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="mini-node">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ReadyMetric({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`ready-metric ${highlight ? "highlight" : ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

/* ============================================================
   DASHBOARD COMPONENTS
============================================================ */

function MetricCard({
  icon,
  label,
  value,
  note,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  danger?: boolean;
}) {
  return (
    <div className={`metric-card ${danger ? "danger" : ""}`}>
      <div className="metric-top">
        <span>{label}</span>
        <div>{icon}</div>
      </div>

      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}

function ModelMetric({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`model-metric ${highlight ? "highlight" : ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className={`small-metric ${danger ? "danger" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BehaviourPanel({
  data,
  loading,
}: {
  data: BehaviourPoint[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="behaviour-card">
        Loading customer behaviour...
      </div>
    );
  }

  const june = data.find((item) => item.month === "June");
  const july = data.find((item) => item.month === "July");
  const august = data.find((item) => item.month === "August");

  if (!june || !july || !august) {
    return (
      <div className="behaviour-card">
        Behaviour history unavailable.
      </div>
    );
  }

  return (
    <section className="behaviour-card">
      <div className="card-header">
        <div>
          <span>VERIFIED CUSTOMER BEHAVIOUR</span>
          <h3>3-Month Deterioration Trace</h3>
        </div>

        <div className="deterioration">
          <TrendingDown size={16} />
          DETERIORATION DETECTED
        </div>
      </div>

      <div className="month-head">
        <span>BEHAVIOUR</span>
        <strong>JUNE</strong>
        <strong>JULY</strong>
        <strong>AUGUST</strong>
      </div>

      <BehaviourRow
        label="Revenue / ARPU"
        june={money(june.revenue)}
        july={money(july.revenue)}
        august={money(august.revenue)}
      />

      <BehaviourRow
        label="Recharge"
        june={money(june.recharge)}
        july={money(july.recharge)}
        august={money(august.recharge)}
      />

      <BehaviourRow
        label="Incoming Calls"
        june={number(june.incoming_calls)}
        july={number(july.incoming_calls)}
        august={number(august.incoming_calls)}
      />

      <BehaviourRow
        label="Outgoing Calls"
        june={number(june.outgoing_calls)}
        july={number(july.outgoing_calls)}
        august={number(august.outgoing_calls)}
      />
    </section>
  );
}

function BehaviourRow({
  label,
  june,
  july,
  august,
}: {
  label: string;
  june: string;
  july: string;
  august: string;
}) {
  return (
    <div className="behaviour-row">
      <strong>{label}</strong>
      <span>{june}</span>
      <span>{july}</span>

      <span className="august-value">
        {august}
        <TrendingDown size={14} />
      </span>
    </div>
  );
}

function ActionMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DecisionPanel({
  customer,
  onDecision,
  onOutcome,
  savedOutcome,
}: {
  customer: Customer;
  onDecision: (
    decision: "Approved" | "Modified" | "Rejected"
  ) => void;
  onOutcome: (
    outcome: "Retained" | "Churned" | "Still Monitoring"
  ) => void;
  savedOutcome: string | null;
}) {
  const pending =
    !customer.human_decision || customer.human_decision === "Pending";

  return (
    <section className="human-card">
      <div className="human-title">
        <div className="human-icon">
          <ShieldCheck size={24} />
        </div>

        <div>
          <span>HUMAN-IN-THE-LOOP CONTROL</span>
          <h2>Human makes the final call.</h2>

          <p>
            AI recommends. Your retention team remains in control.
          </p>
        </div>
      </div>

      {pending ? (
        <div className="decision-buttons">
          <button
            type="button"
            className="approve"
            onClick={() => onDecision("Approved")}
          >
            <Check size={18} />
            APPROVE ACTION
          </button>

          <button
            type="button"
            className="modify"
            onClick={() => onDecision("Modified")}
          >
            <Pencil size={17} />
            MODIFY
          </button>

          <button
            type="button"
            className="reject"
            onClick={() => onDecision("Rejected")}
          >
            <X size={18} />
            REJECT
          </button>
        </div>
      ) : (
        <div className="decision-result">
          <div className="approved-message">
            <CheckCircle2 size={22} />

            <div>
              <span>DECISION RECORDED</span>
              <strong>{customer.human_decision}</strong>
            </div>
          </div>

          <p>{customer.final_action}</p>

          <div className="outcome-area">
            <span>WHAT HAPPENED TO THIS CUSTOMER?</span>

            <div>
              <button
                type="button"
                onClick={() => onOutcome("Retained")}
              >
                <CheckCircle2 size={15} />
                Retained
              </button>

              <button
                type="button"
                onClick={() => onOutcome("Churned")}
              >
                <XCircle size={15} />
                Churned
              </button>

              <button
                type="button"
                onClick={() => onOutcome("Still Monitoring")}
              >
                <Clock3 size={15} />
                Monitoring
              </button>
            </div>

            {savedOutcome && (
              <strong className="saved">
                <Check size={15} />
                Outcome stored: {savedOutcome}
              </strong>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ArchitectureNode({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="architecture-node">
      <div>{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function FeedbackCard({
  value,
  label,
  type,
}: {
  value: number;
  label: string;
  type: string;
}) {
  return (
    <div className={`feedback-card ${type}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

/* ============================================================
   FORMATTERS
============================================================ */

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

function number(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(value);
}

function riskClass(level: string) {
  if (level === "Critical") return "critical";
  if (level === "High") return "high";
  if (level === "Medium") return "medium";
  return "low";
}

/* ============================================================
   ONBOARDING CSS
   Existing dashboard continues using globals.css.
============================================================ */

function OnboardingStyles() {
  return (
    <style jsx global>{`
      .onboarding-shell {
        min-height: 100vh;
        background:
          radial-gradient(
            circle at 50% 38%,
            rgba(19, 177, 139, 0.1),
            transparent 34%
          ),
          #f2f6f7;
        color: #102b38;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .onboarding-nav {
        height: 88px;
        padding: 0 6%;
        background: #082837;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .onboarding-nav .brand {
        display: flex;
        align-items: center;
        gap: 13px;
      }

      .onboarding-nav .brand .logo {
        width: 46px;
        height: 46px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #16b991, #07866d);
        color: white;
        box-shadow: 0 10px 28px rgba(9, 173, 132, 0.2);
      }

      .onboarding-nav .brand strong {
        display: block;
        font-size: 17px;
        letter-spacing: -0.3px;
      }

      .onboarding-nav .brand span {
        display: block;
        color: #91aab5;
        font-size: 10px;
        margin-top: 3px;
      }

      .system-ready,
      .scanning-status,
      .ready-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 14px;
        border-radius: 999px;
        border: 1px solid rgba(54, 220, 176, 0.24);
        background: rgba(21, 177, 139, 0.08);
        color: #55dfbb;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.2px;
      }

      .system-ready span,
      .scanning-status span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #42dcb4;
        box-shadow: 0 0 10px #42dcb4;
      }

      .scanning-status span {
        animation: cpPulse 0.8s infinite alternate;
      }

      .onboarding-hero {
        min-height: calc(100vh - 145px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 70px 24px 80px;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 8px 12px;
        border-radius: 999px;
        background: #e5f7f1;
        color: #07836a;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.4px;
        border: 1px solid #cbece2;
      }

      .onboarding-hero h1,
      .processing-main h1,
      .ready-layout h1 {
        margin: 20px 0 16px;
        font-size: clamp(44px, 5.5vw, 76px);
        line-height: 0.98;
        letter-spacing: -4px;
        color: #102b38;
      }

      .onboarding-hero h1 span,
      .processing-main h1 span,
      .ready-layout h1 span {
        color: #0b9b7b;
      }

      .onboarding-hero > p {
        max-width: 780px;
        margin: 0;
        color: #70858e;
        line-height: 1.8;
        font-size: 14px;
      }

      .hero-upload,
      .enter-command {
        margin-top: 34px;
        border: none;
        border-radius: 13px;
        background: #0b9d7d;
        color: white;
        padding: 17px 22px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 13px;
        font-weight: 850;
        cursor: pointer;
        box-shadow: 0 15px 35px rgba(11, 157, 125, 0.2);
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      .hero-upload:hover,
      .enter-command:hover {
        transform: translateY(-2px);
        background: #078e71;
        box-shadow: 0 18px 40px rgba(11, 157, 125, 0.28);
      }

      .hero-upload svg:last-child {
        margin-left: 7px;
      }

      .upload-note {
        margin-top: 14px;
        display: flex;
        align-items: center;
        gap: 7px;
        color: #8b9ca3;
        font-size: 10px;
      }

      .mini-pipeline {
        margin-top: 60px;
        padding: 13px 16px;
        border: 1px solid #dbe6e9;
        background: rgba(255, 255, 255, 0.78);
        border-radius: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: #91a1a8;
        box-shadow: 0 12px 35px rgba(26, 56, 69, 0.04);
      }

      .mini-node {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #58717b;
      }

      .mini-node svg {
        color: #0b9d7d;
      }

      .mini-node span {
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .onboarding-bottom {
        height: 57px;
        display: grid;
        place-items: center;
        color: #9aa9af;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 1.3px;
      }

      /* PROCESSING */

      .processing-layout {
        min-height: calc(100vh - 88px);
        max-width: 1250px;
        margin: 0 auto;
        padding: 70px 5%;
        display: grid;
        grid-template-columns: 0.9fr 1.1fr;
        gap: 70px;
        align-items: center;
      }

      .processing-main > p {
        color: #70858e;
        line-height: 1.7;
        max-width: 550px;
        font-size: 13px;
      }

      .progress-wrap {
        margin-top: 45px;
        max-width: 540px;
      }

      .progress-top {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        color: #71858d;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 1.2px;
      }

      .progress-top strong {
        color: #0a9678;
        font-size: 11px;
      }

      .progress-track {
        height: 8px;
        background: #dfe8ea;
        border-radius: 999px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #0b9d7d, #3ed6af);
        border-radius: inherit;
        transition: width 0.55s ease;
      }

      .processing-card {
        background: #082837;
        color: white;
        border-radius: 20px;
        padding: 27px;
        box-shadow: 0 25px 70px rgba(8, 40, 55, 0.18);
      }

      .processing-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .processing-card-head span {
        display: block;
        color: #5bdfbd;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 1.3px;
      }

      .processing-card-head strong {
        display: block;
        margin-top: 6px;
        font-size: 13px;
      }

      .processing-card-head svg {
        color: #4dddb9;
      }

      .processing-steps {
        padding-top: 8px;
      }

      .processing-step {
        display: flex;
        gap: 14px;
        padding: 14px 0;
        opacity: 0.3;
        transition: opacity 0.35s ease;
      }

      .processing-step.complete {
        opacity: 1;
      }

      .step-indicator {
        flex: 0 0 31px;
        width: 31px;
        height: 31px;
        border-radius: 9px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.06);
        color: #77919c;
        font-size: 8px;
        font-weight: 900;
      }

      .processing-step.complete .step-indicator {
        background: rgba(27, 190, 149, 0.14);
        color: #55dfbb;
        border: 1px solid rgba(67, 219, 181, 0.2);
      }

      .processing-step strong {
        display: block;
        font-size: 11px;
      }

      .processing-step span {
        display: block;
        color: #819aa5;
        margin-top: 4px;
        font-size: 9px;
        line-height: 1.4;
      }

      /* READY */

      .ready-layout {
        min-height: calc(100vh - 88px);
        max-width: 950px;
        margin: 0 auto;
        padding: 58px 24px 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .ready-check {
        width: 65px;
        height: 65px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: #0b9d7d;
        color: white;
        box-shadow: 0 15px 35px rgba(11, 157, 125, 0.2);
        margin-bottom: 18px;
      }

      .ready-layout h1 {
        font-size: clamp(43px, 5vw, 66px);
        margin-top: 17px;
        margin-bottom: 12px;
      }

      .ready-layout > p {
        color: #768a93;
        margin: 0;
        font-size: 12px;
      }

      .ready-metrics {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 11px;
        margin-top: 32px;
      }

      .ready-metric {
        background: white;
        border: 1px solid #dce6e9;
        border-radius: 13px;
        padding: 18px;
      }

      .ready-metric.highlight {
        background: #eaf8f4;
        border-color: #c9e9df;
      }

      .ready-metric strong {
        display: block;
        font-size: 24px;
        color: #17323e;
      }

      .ready-metric.highlight strong {
        color: #078e71;
      }

      .ready-metric span {
        display: block;
        margin-top: 5px;
        color: #87989f;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .dimension-result {
        width: 100%;
        margin-top: 13px;
        padding: 23px 28px;
        border-radius: 16px;
        background: #082837;
        color: white;
        display: grid;
        grid-template-columns: 1fr 1.4fr;
        align-items: center;
        text-align: left;
      }

      .dimension-number span,
      .dimension-number small {
        display: block;
        color: #7f9aa5;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 1.2px;
      }

      .dimension-number strong {
        display: block;
        color: #50dfbb;
        font-size: 42px;
        line-height: 1;
        margin: 6px 0;
      }

      .dimension-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .dimension-stats > div {
        padding: 14px 17px;
        background: rgba(255, 255, 255, 0.045);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 11px;
      }

      .dimension-stats strong {
        display: block;
        color: white;
        font-size: 23px;
      }

      .dimension-stats span {
        display: block;
        margin-top: 4px;
        color: #7f99a4;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 0.8px;
      }

      .validation-pill {
        margin-top: 13px;
        width: 100%;
        border: 1px solid #cee9e1;
        background: #eaf8f4;
        color: #087e65;
        border-radius: 12px;
        padding: 13px 17px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
      }

      .validation-pill span {
        display: block;
        text-align: left;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .validation-pill strong {
        display: block;
        text-align: left;
        margin-top: 3px;
        font-size: 10px;
      }

      .enter-command {
        margin-top: 24px;
      }

      .enter-command:disabled {
        opacity: 0.7;
        cursor: wait;
      }

      .change-dataset {
        margin-top: 13px;
        border: none;
        background: transparent;
        color: #788c94;
        font-size: 10px;
        font-weight: 750;
        cursor: pointer;
      }

      .spin-icon {
        animation: cpSpin 0.8s linear infinite;
      }

      @keyframes cpSpin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes cpPulse {
        from {
          opacity: 0.35;
          transform: scale(0.8);
        }

        to {
          opacity: 1;
          transform: scale(1.15);
        }
      }

      @media (max-width: 850px) {
        .processing-layout {
          grid-template-columns: 1fr;
          gap: 35px;
        }

        .ready-metrics {
          grid-template-columns: 1fr 1fr;
        }

        .dimension-result {
          grid-template-columns: 1fr;
          gap: 18px;
        }

        .mini-pipeline {
          max-width: 100%;
          overflow-x: auto;
        }

        .onboarding-hero h1,
        .processing-main h1,
        .ready-layout h1 {
          letter-spacing: -2px;
        }
      }
    `}</style>
  );
}
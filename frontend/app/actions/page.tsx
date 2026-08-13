"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Lightbulb,
  Pencil,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  X,
  XCircle,
  Zap,
} from "lucide-react";

const strategies = [
  {
    name: "Friction Rescue",
    score: 92,
    description:
      "Remove recharge friction and restore service continuity before offering a discount.",
    selected: true,
  },
  {
    name: "Usage Recovery",
    score: 71,
    description:
      "Re-engage the customer around previously active calling behaviour.",
  },
  {
    name: "Premium Incentive",
    score: 54,
    description:
      "Offer a high-value recharge incentive to encourage renewal.",
  },
];

export default function ActionsPage() {
  const router = useRouter();

  const [decision, setDecision] = useState<
    "approved" | "modified" | "rejected" | null
  >(null);

  const [outcome, setOutcome] = useState<
    "retained" | "churned" | "monitor" | null
  >(null);

  return (
    <main className="min-h-screen bg-[#eef4f5] text-[#102a3a]">
      {/* NAVBAR */}
      <header className="bg-[#082d3d] text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-8 py-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-4 text-left"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <Activity size={25} />
            </div>

            <div>
              <div className="text-xl font-bold">CustomerPulse</div>
              <div className="text-sm text-slate-300">
                Retention Intelligence System
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-3 lg:flex">
            <NavButton label="Overview" onClick={() => router.push("/")} />
            <NavButton
              label="Customers"
              onClick={() => router.push("/customers")}
            />
            <NavButton label="Actions" active />
            <NavButton label="Model" onClick={() => router.push("/model")} />
            <NavButton label="Upload" onClick={() => router.push("/upload")} />
          </nav>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-xs font-bold tracking-[0.15em] text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            LIVE ENGINE
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-8 py-10">
        {/* BACK */}
        <button
          onClick={() => router.push("/customers/19035")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#102a3a]"
        >
          <ArrowLeft size={17} />
          Back to customer investigation
        </button>

        {/* HERO */}
        <section className="overflow-hidden rounded-[24px] bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-8 p-9 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 text-xs font-bold tracking-[0.18em] text-emerald-600">
                RETENTION DECISION LAB
              </div>

              <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
                Customer 19035
              </h1>

              <p className="mt-3 text-slate-500">
                Convert churn evidence into the best intervention.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <HeroMetric
                label="CHURN RISK"
                value="94.99%"
                danger
              />
              <HeroMetric label="₹ AT RISK" value="₹1,320" />
              <HeroMetric label="URGENCY" value="NOW" />
            </div>
          </div>
        </section>

        {/* WHY LEAVING */}
        <section className="mt-6 rounded-[22px] bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <SectionLabel>01 // BEHAVIOURAL TRIGGER</SectionLabel>

              <h2 className="mt-2 text-2xl font-semibold">
                Why is this customer leaving?
              </h2>
            </div>

            <div className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-500">
              DETERIORATION DETECTED
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <SignalCard
              title="Recharge"
              from="₹2,750"
              to="₹0"
              decline="100%"
            />

            <SignalCard
              title="Incoming Calls"
              from="250.3"
              to="0"
              decline="100%"
            />

            <SignalCard
              title="Outgoing Calls"
              from="515.3"
              to="0"
              decline="100%"
            />
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">
            <TrendingDown size={19} />

            <span>
              Multiple behaviours collapsed simultaneously in August.
            </span>
          </div>
        </section>

        {/* STRATEGY */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-[22px] bg-white p-8 shadow-sm">
            <SectionLabel>02 // NEXT BEST STRATEGY</SectionLabel>

            <div className="mt-3 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <BrainCircuit size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-semibold">
                  Friction Rescue
                </h2>

                <p className="mt-2 max-w-2xl text-slate-500">
                  Restore the customer's recharge path first. Do not immediately
                  spend money on a generic discount.
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-[#082d3d] p-6 text-white">
              <div className="text-xs font-bold tracking-[0.16em] text-emerald-300">
                RECOMMENDED INTERVENTION
              </div>

              <div className="mt-3 text-xl font-semibold">
                Trigger a recharge recovery journey.
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Send a direct recharge recovery link, verify payment friction,
                and escalate to an incentive only if the customer does not
                recover.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Tag text="App + SMS" />
                <Tag text="Immediate" />
                <Tag text="Low initial cost" />
              </div>
            </div>
          </div>

          {/* WHY */}
          <div className="rounded-[22px] bg-[#e8f7f2] p-8 shadow-sm">
            <SectionLabel>WHY THIS STRATEGY?</SectionLabel>

            <h2 className="mt-3 text-2xl font-semibold">
              Treat the cause, not just the churn score.
            </h2>

            <div className="mt-6 space-y-5">
              <Reason
                number="01"
                text="Recharge reached zero."
              />

              <Reason
                number="02"
                text="Calling behaviour collapsed at the same time."
              />

              <Reason
                number="03"
                text="A blanket discount spends money before testing friction."
              />
            </div>
          </div>
        </section>

        {/* COUNTERFACTUAL */}
        <section className="mt-6 rounded-[22px] bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <SectionLabel>03 // COUNTERFACTUAL STRATEGY CHECK</SectionLabel>

              <h2 className="mt-2 text-2xl font-semibold">
                Why not choose another intervention?
              </h2>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Sparkles size={17} className="text-emerald-600" />
              Strategies ranked against observed behaviour
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {strategies.map((strategy) => (
              <StrategyCard key={strategy.name} {...strategy} />
            ))}
          </div>
        </section>

        {/* ECONOMICS */}
        <section className="mt-6 rounded-[22px] bg-[#082d3d] p-8 text-white shadow-sm">
          <SectionLabel light>04 // RETENTION ECONOMICS</SectionLabel>

          <div className="mt-2 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-2xl font-semibold">
                Is this customer worth saving?
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                Translate prediction into an economic decision.
              </p>
            </div>

            <div className="rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
              POSITIVE EXPECTED VALUE
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <EconomicMetric
              icon={<CircleDollarSign size={19} />}
              label="REVENUE AT RISK"
              value="₹1,320"
            />

            <EconomicMetric
              icon={<Target size={19} />}
              label="EST. SAVE PROBABILITY"
              value="61%"
            />

            <EconomicMetric
              icon={<Zap size={19} />}
              label="EXPECTED VALUE SAVED"
              value="₹805"
            />

            <EconomicMetric
              icon={<CheckCircle2 size={19} />}
              label="NET EXPECTED VALUE"
              value="₹685"
              highlight
            />
          </div>

          <div className="mt-5 text-xs text-slate-400">
            Demo estimate: ₹805 expected saved − ₹120 intervention cost = ₹685
            net expected value.
          </div>
        </section>

        {/* HUMAN DECISION */}
        <section className="mt-6 rounded-[22px] bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <SectionLabel>05 // HUMAN-IN-THE-LOOP</SectionLabel>

              <h2 className="mt-2 text-2xl font-semibold">
                Final intervention authority
              </h2>

              <p className="mt-2 text-slate-500">
                CustomerPulse recommends. A human makes the final decision.
              </p>
            </div>

            {!decision && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setDecision("approved")}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Check size={18} />
                  Approve
                </button>

                <button
                  onClick={() => setDecision("modified")}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-4 font-semibold transition hover:bg-slate-50"
                >
                  <Pencil size={18} />
                  Modify
                </button>

                <button
                  onClick={() => setDecision("rejected")}
                  className="flex items-center gap-2 rounded-xl border border-red-200 px-6 py-4 font-semibold text-red-500 transition hover:bg-red-50"
                >
                  <X size={18} />
                  Reject
                </button>
              </div>
            )}
          </div>

          {decision && (
            <div
              className={`mt-7 rounded-2xl p-6 ${
                decision === "approved"
                  ? "bg-emerald-50"
                  : decision === "rejected"
                  ? "bg-red-50"
                  : "bg-amber-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {decision === "approved" && (
                  <CheckCircle2 className="text-emerald-600" />
                )}

                {decision === "modified" && (
                  <Pencil className="text-amber-600" />
                )}

                {decision === "rejected" && (
                  <XCircle className="text-red-500" />
                )}

                <div>
                  <div className="font-bold uppercase">
                    Intervention {decision}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    Human decision recorded for this customer.
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* OUTCOME — ONLY AFTER DECISION */}
        {decision && (
          <section className="mt-6 rounded-[22px] bg-white p-8 shadow-sm">
            <SectionLabel>06 // OUTCOME MEMORY</SectionLabel>

            <div className="mt-2 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold">
                  What happened after intervention?
                </h2>

                <p className="mt-2 text-slate-500">
                  Close the loop with real customer outcomes.
                </p>
              </div>

              {!outcome && (
                <div className="flex flex-wrap gap-3">
                  <OutcomeButton
                    label="Retained"
                    onClick={() => setOutcome("retained")}
                  />

                  <OutcomeButton
                    label="Churned"
                    onClick={() => setOutcome("churned")}
                  />

                  <OutcomeButton
                    label="Monitor"
                    onClick={() => setOutcome("monitor")}
                  />
                </div>
              )}
            </div>

            {outcome && (
              <div className="mt-7 rounded-2xl bg-[#e8f7f2] p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <ShieldCheck size={22} />
                  </div>

                  <div>
                    <div className="text-xs font-bold tracking-[0.16em] text-emerald-700">
                      OUTCOME RECORDED
                    </div>

                    <div className="mt-1 text-xl font-semibold uppercase">
                      {outcome}
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Stored as evidence for future intervention evaluation and
                      model retraining.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 md:grid-cols-5">
                  <LoopStep number="01" label="Prediction" done />
                  <LoopStep number="02" label="Strategy" done />
                  <LoopStep number="03" label="Human Decision" done />
                  <LoopStep number="04" label="Outcome" done />
                  <LoopStep number="05" label="Retraining Data" active />
                </div>
              </div>
            )}
          </section>
        )}

        <div className="py-10 text-center text-xs font-semibold tracking-[0.15em] text-slate-400">
          CUSTOMERPULSE // BEHAVIOUR-FIRST RETENTION INTELLIGENCE
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

function NavButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
        active
          ? "bg-white/10 text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function HeroMetric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-[130px] rounded-2xl bg-slate-50 p-5">
      <div className="text-[10px] font-bold tracking-[0.14em] text-slate-400">
        {label}
      </div>

      <div
        className={`mt-2 text-xl font-bold ${
          danger ? "text-red-500" : "text-[#102a3a]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className={`text-xs font-bold tracking-[0.18em] ${
        light ? "text-emerald-300" : "text-emerald-600"
      }`}
    >
      {children}
    </div>
  );
}

function SignalCard({
  title,
  from,
  to,
  decline,
}: {
  title: string;
  from: string;
  to: string;
  decline: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <div className="text-sm font-semibold">{title}</div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <span className="text-lg font-bold">{from}</span>
          <span className="mx-2 text-slate-300">→</span>
          <span className="text-lg font-bold text-red-500">{to}</span>
        </div>

        <div className="text-sm font-bold text-red-500">↓ {decline}</div>
      </div>

      <div className="mt-2 text-xs text-slate-400">July → August</div>
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
      {text}
    </span>
  );
}

function Reason({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        {number}
      </div>

      <p className="pt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function StrategyCard({
  name,
  score,
  description,
  selected = false,
}: {
  name: string;
  score: number;
  description: string;
  selected?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        selected
          ? "border-emerald-400 bg-emerald-50"
          : "border-slate-100 bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {selected && <CheckCircle2 size={17} className="text-emerald-600" />}

            <h3 className="font-bold">{name}</h3>
          </div>

          {selected && (
            <div className="mt-2 text-[10px] font-bold tracking-[0.14em] text-emerald-600">
              SELECTED
            </div>
          )}
        </div>

        <div className="text-2xl font-bold">{score}</div>
      </div>

      <p className="mt-5 min-h-[48px] text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${
            selected ? "bg-emerald-600" : "bg-slate-400"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="mt-2 text-[10px] font-bold tracking-[0.12em] text-slate-400">
        STRATEGY FIT {score}/100
      </div>
    </div>
  );
}

function EconomicMetric({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-emerald-400/30 bg-emerald-400/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center gap-2 text-slate-300">
        {icon}

        <span className="text-[10px] font-bold tracking-[0.13em]">
          {label}
        </span>
      </div>

      <div
        className={`mt-4 text-2xl font-bold ${
          highlight ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function OutcomeButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:border-emerald-300 hover:bg-emerald-50"
    >
      {label}
      <ChevronRight size={16} />
    </button>
  );
}

function LoopStep({
  number,
  label,
  done = false,
  active = false,
}: {
  number: string;
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-emerald-300 bg-white"
          : "border-emerald-100 bg-white/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-600">{number}</span>

        {done && <Check size={15} className="text-emerald-600" />}

        {active && <Clock3 size={15} className="text-emerald-600" />}
      </div>

      <div className="mt-3 text-xs font-bold uppercase tracking-[0.08em]">
        {label}
      </div>
    </div>
  );
}
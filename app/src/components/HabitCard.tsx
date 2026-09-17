import { useState } from "react";
import { HABIT_LABELS, habitExplanation, habitGuardrail, habitRule, type HabitResult, type RoundTripTrade } from "../analysis";
import { formatRupees } from "../analysis/copy";
import { TradeTable } from "./TradeTable";

interface HabitCardProps {
  rank: number;
  habit: HabitResult;
  trades: RoundTripTrade[];
}

export function HabitCard({ rank, habit, trades }: HabitCardProps) {
  const [guardrailOn, setGuardrailOn] = useState(false);
  const related = trades.filter((t) => habit.relatedTradeIds.includes(t.id));
  const guardrail = habitGuardrail(habit.type);

  return (
    <section className="habit-card">
      <div className="habit-header">
        <span className="habit-rank">{rank}</span>
        <div>
          <h2 className="habit-title">{HABIT_LABELS[habit.type]}</h2>
          <p className="habit-cost">{formatRupees(habit.costRupees)} this month</p>
        </div>
      </div>

      <p className="habit-explanation">{habitExplanation(habit)}</p>

      <TradeTable trades={related} />

      <div className="rule-box">
        <p className="rule-label">One rule to try next month</p>
        <p className="rule-text">{habitRule(habit)}</p>
      </div>

      <div className="guardrail-box">
        <button
          type="button"
          role="switch"
          aria-checked={guardrailOn}
          className={`toggle ${guardrailOn ? "toggle-on" : ""}`}
          onClick={() => setGuardrailOn((v) => !v)}
        >
          <span className="toggle-knob" />
        </button>
        <div>
          <p className="guardrail-title">Nubra guardrail — {guardrail.title}</p>
          <p className="guardrail-desc">{guardrail.description}</p>
          {guardrailOn && <p className="guardrail-note">This is a preview — turning it on here doesn't change your account.</p>}
        </div>
      </div>
    </section>
  );
}

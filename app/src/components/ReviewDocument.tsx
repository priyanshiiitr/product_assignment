import type { MonthlyReview } from "../analysis";
import { formatMonthRange, formatSignedRupees } from "../format";
import { HabitCard } from "./HabitCard";
import { MIN_CLOSED_TRADES_FOR_REVIEW } from "../analysis/summary";

interface ReviewDocumentProps {
  review: MonthlyReview;
  sourceLabel: string;
  onReset: () => void;
}

export function ReviewDocument({ review, sourceLabel, onReset }: ReviewDocumentProps) {
  const period = formatMonthRange(review.trades.map((t) => t.entryTime));
  const pnlWord = review.totalRealizedPnl < 0 ? "down" : "up";

  return (
    <div className="review">
      <div className="review-topbar">
        <button type="button" className="link-btn" onClick={onReset}>
          ← Try another
        </button>
        <span className="source-label">{sourceLabel}</span>
      </div>

      <h1 className="review-title">Your trading review</h1>
      <p className="review-period">{period}</p>

      <p className="review-lede">
        This looks at {review.closedTradeCount} closed trade{review.closedTradeCount === 1 ? "" : "s"} you made
        during this period{review.openTradeCount > 0 ? ` (${review.openTradeCount} more were still open at the end)` : ""}.
        Overall, you were {pnlWord} {formatSignedRupees(review.totalRealizedPnl).replace("-", "")} this month.
      </p>

      {review.insufficientOverallData ? (
        <div className="not-enough">
          <p>
            There isn't enough trading history here to responsibly call anything a habit — we look for patterns that
            repeat at least a few times before naming them. Come back after a fuller month of trading.
          </p>
        </div>
      ) : review.topHabits.length === 0 ? (
        <div className="clean">
          <p>
            Nothing stood out enough this month to call it a costly habit. That's a genuinely good sign — it means
            your losses, when they happened, look more like normal trading variance than a repeatable pattern.
          </p>
        </div>
      ) : (
        <div className="habit-list">
          {review.topHabits.map((h, i) => (
            <HabitCard key={h.type} rank={i + 1} habit={h} trades={review.trades} />
          ))}
        </div>
      )}

      {review.wentWell.length > 0 && (
        <section className="went-well">
          <h2 className="went-well-title">What went well</h2>
          {review.wentWell.map((w) => (
            <p key={w.key} className="went-well-text">
              {w.text}
            </p>
          ))}
        </section>
      )}

      <details className="method-details">
        <summary>How we decide something is a "habit"</summary>
        <p>
          We only call something a habit if it happened at least a few times this month, and if those trades
          performed meaningfully worse than your own other trades in the same period. We compare you to yourself —
          not to the market, not to other traders — and we need at least {MIN_CLOSED_TRADES_FOR_REVIEW} closed trades
          before we say anything at all.
        </p>
      </details>

      <p className="disclaimer">
        This reviews your own past trading behaviour. It is not investment advice, and nothing here suggests buying
        or selling any security.
      </p>
    </div>
  );
}

import { describe, expect, it } from "vitest";
import { SAMPLE_TRADERS } from "../sampleData";
import { pairOrdersIntoTrades } from "../pairTrades";
import { detectAllHabits } from "../habits";
import { buildMonthlyReview } from "../summary";
import type { RoundTripTrade } from "../types";

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

function mean(nums: number[]): number {
  return nums.length === 0 ? 0 : sum(nums) / nums.length;
}

/**
 * Independent check: for a trade that is fully closed, the realized P&L must equal
 * the trade's net cash flow (sell proceeds minus buy cost), which holds regardless
 * of how lots were matched internally. This does not reuse the FIFO matching code.
 */
function independentCashFlowPnl(trade: RoundTripTrade): number {
  const entryCash = sum(trade.entryFills.map((f) => f.qty * f.price));
  const exitCash = sum(trade.exitFills.map((f) => f.qty * f.price));
  return trade.direction === "LONG" ? exitCash - entryCash : entryCash - exitCash;
}

describe("accuracy: P&L matches an independent calculation", () => {
  for (const trader of SAMPLE_TRADERS) {
    it(`${trader.label}: every fully-closed trade's realizedPnl matches independent cash-flow accounting`, () => {
      const orders = trader.generate(trader.defaultSeed);
      const trades = pairOrdersIntoTrades(orders);
      const fullyClosed = trades.filter((t) => !t.isOpen);
      expect(fullyClosed.length).toBeGreaterThan(0);
      for (const t of fullyClosed) {
        expect(t.realizedPnl).toBeCloseTo(independentCashFlowPnl(t), 6);
      }
    });

    it(`${trader.label}: total realized P&L equals the sum of individual trade P&Ls`, () => {
      const orders = trader.generate(trader.defaultSeed);
      const trades = pairOrdersIntoTrades(orders);
      const review = buildMonthlyReview(trades);
      const closed = trades.filter((t) => t.exitTime !== null);
      expect(review.totalRealizedPnl).toBeCloseTo(sum(closed.map((t) => t.realizedPnl)), 6);
    });
  }
});

describe("accuracy: every rupee figure and count in a habit matches the trades behind it", () => {
  for (const trader of SAMPLE_TRADERS) {
    it(`${trader.label}: habit detail numbers are independently reproducible from the trade list`, () => {
      const orders = trader.generate(trader.defaultSeed);
      const trades = pairOrdersIntoTrades(orders);
      const habits = detectAllHabits(trades);

      for (const habit of habits) {
        if (habit.insufficientData) continue;

        if (habit.type === "revenge_trading") {
          const related = trades.filter((t) => habit.relatedTradeIds.includes(t.id));
          const recomputedCost = -sum(related.map((t) => t.realizedPnl));
          expect(habit.costRupees).toBeCloseTo(Math.max(0, recomputedCost), 2);
        }

        if (habit.type === "averaging_down") {
          // Cost here is specifically the P&L attributable to the averaging-down lots
          // within a trade, not the trade's total realized P&L (see habits.ts).
          const related = trades.filter((t) => habit.relatedTradeIds.includes(t.id));
          const recomputedCost = -sum(related.map((t) => t.averagingDownPnl));
          expect(habit.costRupees).toBeCloseTo(Math.max(0, recomputedCost), 2);
        }

        if (habit.type === "cutting_winners_short") {
          const closed = trades.filter((t) => t.exitTime !== null);
          const winners = closed.filter((t) => t.realizedPnl > 0);
          const losers = closed.filter((t) => t.realizedPnl < 0);
          expect(habit.occurrences).toBe(losers.length);
          expect(habit.detail.avgWin).toBeCloseTo(mean(winners.map((t) => t.realizedPnl)), 2);
          expect(habit.detail.avgLossAbs).toBeCloseTo(mean(losers.map((t) => Math.abs(t.realizedPnl))), 2);
        }

        if (habit.type === "opening_minutes") {
          const openingIds = new Set(habit.relatedTradeIds);
          const openingTrades = trades.filter((t) => openingIds.has(t.id));
          expect(habit.detail.avgOpening).toBeCloseTo(mean(openingTrades.map((t) => t.realizedPnl)), 2);
        }
      }
    });
  }
});

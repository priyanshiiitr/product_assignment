import { describe, expect, it } from "vitest";
import { pairOrdersIntoTrades } from "../pairTrades";
import { buildMonthlyReview } from "../summary";
import type { Order } from "../types";

let rowIndex = 0;
function o(timestamp: string, symbol: string, side: "BUY" | "SELL", qty: number, price: number): Order {
  rowIndex += 1;
  return { timestamp: new Date(timestamp), symbol, side, qty, price, rowIndex };
}

describe("buildMonthlyReview edge cases", () => {
  it("says there is not enough data when there are very few closed trades", () => {
    const orders = [
      o("2026-08-03 10:00", "TCS", "BUY", 10, 100),
      o("2026-08-03 10:30", "TCS", "SELL", 10, 110),
      o("2026-08-04 10:00", "INFY", "BUY", 10, 200),
      o("2026-08-04 10:30", "INFY", "SELL", 10, 190),
    ];
    const review = buildMonthlyReview(pairOrdersIntoTrades(orders));
    expect(review.closedTradeCount).toBe(2);
    expect(review.insufficientOverallData).toBe(true);
    expect(review.topHabits).toHaveLength(0);
  });

  it("handles a completely empty trade list without throwing", () => {
    const review = buildMonthlyReview([]);
    expect(review.closedTradeCount).toBe(0);
    expect(review.insufficientOverallData).toBe(true);
    expect(review.topHabits).toHaveLength(0);
    expect(review.totalRealizedPnl).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { pairOrdersIntoTrades } from "../pairTrades";
import type { Order } from "../types";

let rowIndex = 0;
function o(timestamp: string, symbol: string, side: "BUY" | "SELL", qty: number, price: number): Order {
  rowIndex += 1;
  return { timestamp: new Date(timestamp), symbol, side, qty, price, rowIndex };
}

describe("pairOrdersIntoTrades", () => {
  it("pairs a simple long round trip", () => {
    const trades = pairOrdersIntoTrades([
      o("2026-08-03 10:00", "TCS", "BUY", 10, 100),
      o("2026-08-03 10:30", "TCS", "SELL", 10, 110),
    ]);
    expect(trades).toHaveLength(1);
    expect(trades[0].direction).toBe("LONG");
    expect(trades[0].isOpen).toBe(false);
    expect(trades[0].realizedPnl).toBeCloseTo(100);
  });

  it("pairs a short trade correctly", () => {
    const trades = pairOrdersIntoTrades([
      o("2026-08-03 10:00", "TCS", "SELL", 10, 100),
      o("2026-08-03 10:30", "TCS", "BUY", 10, 90),
    ]);
    expect(trades).toHaveLength(1);
    expect(trades[0].direction).toBe("SHORT");
    expect(trades[0].realizedPnl).toBeCloseTo(100);
  });

  it("handles a partial exit as one continuous lifecycle", () => {
    const trades = pairOrdersIntoTrades([
      o("2026-08-03 10:00", "TCS", "BUY", 20, 100),
      o("2026-08-03 10:30", "TCS", "SELL", 10, 110),
      o("2026-08-03 11:00", "TCS", "SELL", 10, 120),
    ]);
    expect(trades).toHaveLength(1);
    expect(trades[0].isOpen).toBe(false);
    expect(trades[0].qtyEntered).toBe(20);
    expect(trades[0].qtyExited).toBe(20);
    expect(trades[0].realizedPnl).toBeCloseTo(100 + 200);
  });

  it("leaves a position open at the end of the data", () => {
    const trades = pairOrdersIntoTrades([o("2026-08-03 10:00", "TCS", "BUY", 15, 50)]);
    expect(trades).toHaveLength(1);
    expect(trades[0].isOpen).toBe(true);
    expect(trades[0].qtyExited).toBe(0);
    expect(trades[0].exitTime).toBeNull();
    expect(trades[0].realizedPnl).toBe(0);
  });

  it("tags an add-on as averaging down only when price moves against the position", () => {
    const trades = pairOrdersIntoTrades([
      o("2026-08-03 10:00", "TCS", "BUY", 10, 100),
      o("2026-08-03 10:15", "TCS", "BUY", 10, 90),
      o("2026-08-03 11:00", "TCS", "SELL", 20, 95),
    ]);
    expect(trades).toHaveLength(1);
    expect(trades[0].hasAveragingDown).toBe(true);
    // FIFO: lot1 (10@100) matched at 95 -> -50; lot2 (10@90, averaging-down) matched at 95 -> +50
    expect(trades[0].realizedPnl).toBeCloseTo(0);
    expect(trades[0].averagingDownPnl).toBeCloseTo(50);
  });

  it("does not tag an add-on as averaging down when price moves favorably", () => {
    const trades = pairOrdersIntoTrades([
      o("2026-08-03 10:00", "TCS", "BUY", 10, 100),
      o("2026-08-03 10:15", "TCS", "BUY", 10, 105),
      o("2026-08-03 11:00", "TCS", "SELL", 20, 110),
    ]);
    expect(trades[0].hasAveragingDown).toBe(false);
    expect(trades[0].averagingDownPnl).toBe(0);
  });

  it("splits an overshoot close into a closed trade and a new flipped position", () => {
    const trades = pairOrdersIntoTrades([
      o("2026-08-03 10:00", "TCS", "BUY", 10, 100),
      o("2026-08-03 10:30", "TCS", "SELL", 15, 110),
    ]);
    expect(trades).toHaveLength(2);
    const [first, second] = trades;
    expect(first.direction).toBe("LONG");
    expect(first.isOpen).toBe(false);
    expect(first.qtyEntered).toBe(10);
    expect(first.realizedPnl).toBeCloseTo(100);
    expect(second.direction).toBe("SHORT");
    expect(second.isOpen).toBe(true);
    expect(second.qtyEntered).toBe(5);
  });

  it("handles a very small dataset (a single trade) without error", () => {
    const trades = pairOrdersIntoTrades([
      o("2026-08-03 10:00", "TCS", "BUY", 5, 100),
      o("2026-08-03 10:05", "TCS", "SELL", 5, 101),
    ]);
    expect(trades).toHaveLength(1);
  });

  it("handles an empty order list", () => {
    const trades = pairOrdersIntoTrades([]);
    expect(trades).toHaveLength(0);
  });
});

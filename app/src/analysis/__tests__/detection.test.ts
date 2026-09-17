import { describe, expect, it } from "vitest";
import { pairOrdersIntoTrades } from "../pairTrades";
import { detectAllHabits } from "../habits";
import { SAMPLE_TRADERS } from "../sampleData";
import type { HabitType } from "../types";

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1000);

export const DETECTION_PASS_BAR = 0.9;
export const FALSE_ALARM_PASS_BAR = 0.1;

const PLANTED: { traderId: string; habit: HabitType }[] = [
  { traderId: "rahul-revenge", habit: "revenge_trading" },
  { traderId: "ananya-averager", habit: "averaging_down" },
  { traderId: "vikram-overtrader", habit: "overtrading" },
  { traderId: "priya-cuts-winners", habit: "cutting_winners_short" },
];

describe("detection hit rate (planted habits, many seeds)", () => {
  for (const { traderId, habit } of PLANTED) {
    it(`${traderId}: detects ${habit} at least ${DETECTION_PASS_BAR * 100}% of the time across ${SEEDS.length} seeds`, () => {
      const trader = SAMPLE_TRADERS.find((t) => t.id === traderId)!;
      let hits = 0;
      for (const seed of SEEDS) {
        const orders = trader.generate(seed);
        const trades = pairOrdersIntoTrades(orders);
        const result = detectAllHabits(trades).find((h) => h.type === habit);
        if (result?.detected) hits += 1;
      }
      const rate = hits / SEEDS.length;
      console.log(`[detection] ${traderId} -> ${habit}: ${hits}/${SEEDS.length} = ${(rate * 100).toFixed(1)}%`);
      expect(rate).toBeGreaterThanOrEqual(DETECTION_PASS_BAR);
    });
  }
});

describe("false-alarm rate (clean trader, many seeds)", () => {
  it(`meera-clean: flags no habit at all in at least ${(1 - FALSE_ALARM_PASS_BAR) * 100}% of ${SEEDS.length} seeds`, () => {
    const trader = SAMPLE_TRADERS.find((t) => t.id === "meera-clean")!;
    let falseAlarms = 0;
    const perHabitCounts: Record<string, number> = {};

    for (const seed of SEEDS) {
      const orders = trader.generate(seed);
      const trades = pairOrdersIntoTrades(orders);
      const habits = detectAllHabits(trades);
      const anyDetected = habits.some((h) => h.detected);
      if (anyDetected) falseAlarms += 1;
      for (const h of habits) {
        if (h.detected) perHabitCounts[h.type] = (perHabitCounts[h.type] ?? 0) + 1;
      }
    }

    const rate = falseAlarms / SEEDS.length;
    console.log(`[false-alarm] meera-clean: ${falseAlarms}/${SEEDS.length} = ${(rate * 100).toFixed(1)}%`, perHabitCounts);
    expect(rate).toBeLessThanOrEqual(FALSE_ALARM_PASS_BAR);
  });
});

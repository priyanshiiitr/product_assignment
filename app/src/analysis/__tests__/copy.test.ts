import { describe, expect, it } from "vitest";
import { habitGuardrail, habitRule } from "../copy";
import { detectAllHabits } from "../habits";
import { pairOrdersIntoTrades } from "../pairTrades";
import { SAMPLE_TRADERS } from "../sampleData";
import type { HabitResult } from "../types";

const FORBIDDEN_PATTERN = /\b(buy|sell|purchase|invest in|short\s+the|long\s+the)\b/i;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

function habitsForTrader(traderId: string): HabitResult[] {
  const trader = SAMPLE_TRADERS.find((t) => t.id === traderId)!;
  const orders = trader.generate(trader.defaultSeed);
  const trades = pairOrdersIntoTrades(orders);
  return detectAllHabits(trades).filter((h) => !h.insufficientData);
}

const allDetectedHabits = SAMPLE_TRADERS.flatMap((t) => habitsForTrader(t.id));

describe("copy checks", () => {
  it("found at least one detected habit of each type to check copy against", () => {
    const types = new Set(allDetectedHabits.map((h) => h.type));
    expect(types.size).toBeGreaterThanOrEqual(4);
  });

  for (const habit of allDetectedHabits) {
    it(`${habit.type}: rule is under 20 words, has a concrete number, and makes no buy/sell recommendation`, () => {
      const rule = habitRule(habit);
      expect(wordCount(rule)).toBeLessThanOrEqual(20);
      expect(rule).toMatch(/\d/);
      expect(rule).not.toMatch(FORBIDDEN_PATTERN);
    });

    it(`${habit.type}: guardrail copy makes no buy/sell recommendation`, () => {
      const guardrail = habitGuardrail(habit.type);
      expect(guardrail.title).not.toMatch(FORBIDDEN_PATTERN);
      expect(guardrail.description).not.toMatch(FORBIDDEN_PATTERN);
    });
  }
});

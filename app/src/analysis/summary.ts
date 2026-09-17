import { detectAllHabits } from "./habits";
import type { MonthlyReview, RoundTripTrade, WhatWentWell } from "./types";

export const MIN_CLOSED_TRADES_FOR_REVIEW = 10;
export const MAX_TOP_HABITS = 3;

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeWhatWentWell(trades: RoundTripTrade[], habits: ReturnType<typeof detectAllHabits>): WhatWentWell[] {
  const closed = trades.filter((t) => t.exitTime !== null);
  const winners = closed.filter((t) => t.realizedPnl > 0);
  const losers = closed.filter((t) => t.realizedPnl < 0);
  const items: WhatWentWell[] = [];

  const cuttingHabit = habits.find((h) => h.type === "cutting_winners_short");
  if (cuttingHabit && !cuttingHabit.insufficientData && !cuttingHabit.detected && winners.length > 0 && losers.length > 0) {
    const avgWin = mean(winners.map((t) => t.realizedPnl));
    const avgLossAbs = mean(losers.map((t) => Math.abs(t.realizedPnl)));
    if (avgWin >= avgLossAbs) {
      items.push({
        key: "win_loss_ratio",
        text: `Your average win (₹${Math.round(avgWin).toLocaleString("en-IN")}) was bigger than your average loss (₹${Math.round(avgLossAbs).toLocaleString("en-IN")}) this month.`,
      });
    }
  }

  const overtradingHabit = habits.find((h) => h.type === "overtrading");
  if (overtradingHabit && !overtradingHabit.detected) {
    items.push({
      key: "steady_pace",
      text: "You kept a fairly steady trading pace — no run of days where you traded far more than usual.",
    });
  }

  const revengeHabit = habits.find((h) => h.type === "revenge_trading");
  if (revengeHabit && !revengeHabit.detected) {
    items.push({
      key: "no_revenge",
      text: "You didn't chase losses with an immediate re-entry this month.",
    });
  }

  if (items.length === 0) {
    items.push({
      key: "fallback_summary",
      text: `You closed ${closed.length} trade${closed.length === 1 ? "" : "s"} this month, ${winners.length} of them profitable.`,
    });
  }

  return items.slice(0, 2);
}

export function buildMonthlyReview(trades: RoundTripTrade[]): MonthlyReview {
  const closed = trades.filter((t) => t.exitTime !== null);
  const open = trades.filter((t) => t.exitTime === null);
  const winners = closed.filter((t) => t.realizedPnl > 0);
  const losers = closed.filter((t) => t.realizedPnl < 0);
  const totalRealizedPnl = closed.reduce((s, t) => s + t.realizedPnl, 0);

  const insufficientOverallData = closed.length < MIN_CLOSED_TRADES_FOR_REVIEW;

  const habits = detectAllHabits(trades);
  const topHabits = insufficientOverallData
    ? []
    : habits
        .filter((h) => h.detected)
        .sort((a, b) => b.costRupees - a.costRupees)
        .slice(0, MAX_TOP_HABITS);

  const wentWell = insufficientOverallData ? [] : computeWhatWentWell(trades, habits);

  return {
    trades,
    totalRealizedPnl,
    closedTradeCount: closed.length,
    openTradeCount: open.length,
    winCount: winners.length,
    lossCount: losers.length,
    habits,
    topHabits,
    wentWell,
    insufficientOverallData,
  };
}

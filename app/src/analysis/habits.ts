import type { HabitResult, HabitType, RoundTripTrade } from "./types";

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const closedOf = (trades: RoundTripTrade[]) => trades.filter((t) => t.exitTime !== null);

export const REVENGE_WINDOW_MINUTES = 15;
export const REVENGE_MIN_OCCURRENCES = 3;

export function detectRevengeTrading(trades: RoundTripTrade[]): HabitResult {
  const closed = closedOf(trades).sort((a, b) => (a.exitTime as Date).getTime() - (b.exitTime as Date).getTime());
  const losingClosed = closed.filter((t) => t.realizedPnl < 0);

  const revengeIds = new Set<string>();
  for (const loss of losingClosed) {
    const windowEnd = (loss.exitTime as Date).getTime() + REVENGE_WINDOW_MINUTES * 60000;
    for (const candidate of trades) {
      if (candidate.id === loss.id) continue;
      const entryMs = candidate.entryTime.getTime();
      if (entryMs > (loss.exitTime as Date).getTime() && entryMs <= windowEnd) {
        revengeIds.add(candidate.id);
      }
    }
  }

  const revengeTrades = trades.filter((t) => revengeIds.has(t.id));
  const revengeLosses = revengeTrades.filter((t) => t.exitTime !== null && t.realizedPnl < 0);
  const cost = -1 * revengeLosses.reduce((s, t) => s + t.realizedPnl, 0);
  const occurrences = revengeTrades.length;
  const insufficientData = occurrences < REVENGE_MIN_OCCURRENCES;

  return {
    type: "revenge_trading",
    detected: !insufficientData && cost > 0,
    insufficientData,
    occurrences,
    costRupees: Math.max(0, cost),
    relatedTradeIds: revengeLosses.map((t) => t.id),
    detail: {
      windowMinutes: REVENGE_WINDOW_MINUTES,
      revengeLossCount: revengeLosses.length,
    },
  };
}

export const CUTTING_WINNERS_RATIO_THRESHOLD = 1.5;
export const CUTTING_WINNERS_MIN_LOSERS = 5;

export function detectCuttingWinnersShort(trades: RoundTripTrade[]): HabitResult {
  const closed = closedOf(trades);
  const winners = closed.filter((t) => t.realizedPnl > 0);
  const losers = closed.filter((t) => t.realizedPnl < 0);

  const insufficientData = losers.length < CUTTING_WINNERS_MIN_LOSERS || winners.length === 0;
  if (insufficientData) {
    return {
      type: "cutting_winners_short",
      detected: false,
      insufficientData: true,
      occurrences: losers.length,
      costRupees: 0,
      relatedTradeIds: [],
      detail: { avgWin: 0, avgLossAbs: 0, ratio: 0 },
    };
  }

  const avgWin = mean(winners.map((t) => t.realizedPnl));
  const avgLossAbs = mean(losers.map((t) => Math.abs(t.realizedPnl)));
  const ratio = avgWin > 0 ? avgLossAbs / avgWin : 0;
  const detected = ratio >= CUTTING_WINNERS_RATIO_THRESHOLD;
  const cost = detected ? (avgLossAbs - avgWin) * losers.length : 0;

  return {
    type: "cutting_winners_short",
    detected,
    insufficientData: false,
    occurrences: losers.length,
    costRupees: Math.max(0, cost),
    relatedTradeIds: losers.map((t) => t.id),
    detail: { avgWin, avgLossAbs, ratio },
  };
}

export const AVERAGING_DOWN_MIN_OCCURRENCES = 3;

export function detectAveragingDown(trades: RoundTripTrade[]): HabitResult {
  const withAveraging = trades.filter((t) => t.hasAveragingDown);
  const occurrences = trades.reduce(
    (s, t) => s + t.entryFills.filter((f) => f.isAveragingDown).length,
    0,
  );
  const costlyTrades = withAveraging.filter((t) => t.averagingDownPnl < 0);
  const cost = -1 * costlyTrades.reduce((s, t) => s + t.averagingDownPnl, 0);
  const insufficientData = occurrences < AVERAGING_DOWN_MIN_OCCURRENCES;

  return {
    type: "averaging_down",
    detected: !insufficientData && cost > 0,
    insufficientData,
    occurrences,
    costRupees: Math.max(0, cost),
    relatedTradeIds: costlyTrades.map((t) => t.id),
    detail: { tradesWithAveraging: withAveraging.length },
  };
}

export const OVERTRADING_DAY_MULTIPLIER = 1.5;
export const OVERTRADING_MIN_DAYS = 3;
export const OVERTRADING_MIN_ACTIVE_DAYS = 5;

export function detectOvertrading(trades: RoundTripTrade[]): HabitResult {
  const byDay = new Map<string, RoundTripTrade[]>();
  for (const t of trades) {
    const key = dateKey(t.entryTime);
    const list = byDay.get(key) ?? [];
    list.push(t);
    byDay.set(key, list);
  }

  const activeDays = byDay.size;
  if (activeDays < OVERTRADING_MIN_ACTIVE_DAYS) {
    return {
      type: "overtrading",
      detected: false,
      insufficientData: true,
      occurrences: 0,
      costRupees: 0,
      relatedTradeIds: [],
      detail: { activeDays, medianDailyCount: 0 },
    };
  }

  const counts = [...byDay.values()].map((list) => list.length);
  const med = median(counts);
  const threshold = med * OVERTRADING_DAY_MULTIPLIER;
  const MIN_ABSOLUTE_GAP = 2;

  const overtradingDayKeys = [...byDay.entries()].filter(
    ([, list]) => list.length >= threshold && list.length - med >= MIN_ABSOLUTE_GAP,
  );
  const insufficientData = overtradingDayKeys.length < OVERTRADING_MIN_DAYS;

  const overtradingTrades = overtradingDayKeys.flatMap(([, list]) => list).filter((t) => t.exitTime !== null);
  const normalTrades = trades.filter((t) => {
    const key = dateKey(t.entryTime);
    return t.exitTime !== null && !overtradingDayKeys.some(([k]) => k === key);
  });

  const avgOver = mean(overtradingTrades.map((t) => t.realizedPnl));
  const avgNormal = mean(normalTrades.map((t) => t.realizedPnl));
  const detected = !insufficientData && avgOver < avgNormal && normalTrades.length > 0;
  const cost = detected ? (avgNormal - avgOver) * overtradingTrades.length : 0;

  return {
    type: "overtrading",
    detected,
    insufficientData,
    occurrences: overtradingDayKeys.length,
    costRupees: Math.max(0, cost),
    relatedTradeIds: overtradingTrades.map((t) => t.id),
    detail: { activeDays, medianDailyCount: med, avgOver, avgNormal },
  };
}

export const OPENING_WINDOW_END_MINUTES_FROM_915 = 15;
export const OPENING_MIN_OCCURRENCES = 5;

function minutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

const SESSION_OPEN_MINUTES = 9 * 60 + 15;

export function detectOpeningMinutes(trades: RoundTripTrade[]): HabitResult {
  const windowEnd = SESSION_OPEN_MINUTES + OPENING_WINDOW_END_MINUTES_FROM_915;
  const isOpeningTrade = (t: RoundTripTrade) => {
    const m = minutesFromMidnight(t.entryTime);
    return m >= SESSION_OPEN_MINUTES && m < windowEnd;
  };

  const openingTrades = trades.filter(isOpeningTrade);
  const occurrences = openingTrades.length;
  const insufficientData = occurrences < OPENING_MIN_OCCURRENCES;

  if (insufficientData) {
    return {
      type: "opening_minutes",
      detected: false,
      insufficientData: true,
      occurrences,
      costRupees: 0,
      relatedTradeIds: [],
      detail: { avgOpening: 0, avgOther: 0 },
    };
  }

  const openingClosed = openingTrades.filter((t) => t.exitTime !== null);
  const otherClosed = trades.filter((t) => t.exitTime !== null && !isOpeningTrade(t));

  const avgOpening = mean(openingClosed.map((t) => t.realizedPnl));
  const avgOther = mean(otherClosed.map((t) => t.realizedPnl));
  const detected = avgOpening < avgOther && otherClosed.length > 0;
  const cost = detected ? (avgOther - avgOpening) * openingClosed.length : 0;

  return {
    type: "opening_minutes",
    detected,
    insufficientData: false,
    occurrences,
    costRupees: Math.max(0, cost),
    relatedTradeIds: openingClosed.map((t) => t.id),
    detail: { avgOpening, avgOther },
  };
}

export function detectAllHabits(trades: RoundTripTrade[]): HabitResult[] {
  return [
    detectRevengeTrading(trades),
    detectCuttingWinnersShort(trades),
    detectAveragingDown(trades),
    detectOvertrading(trades),
    detectOpeningMinutes(trades),
  ];
}

export const HABIT_LABELS: Record<HabitType, string> = {
  revenge_trading: "Re-entering right after a loss",
  cutting_winners_short: "Taking small wins, letting losses grow",
  averaging_down: "Adding to a losing position",
  overtrading: "Trading far more than usual on some days",
  opening_minutes: "Trading in the first 15 minutes",
};

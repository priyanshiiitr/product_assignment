import type { HabitResult, HabitType } from "./types";

export function formatRupees(n: number): string {
  return `₹${Math.round(Math.abs(n)).toLocaleString("en-IN")}`;
}

function describeAvgPerTrade(n: number): string {
  return n >= 0 ? `made an average of ${formatRupees(n)}` : `lost an average of ${formatRupees(n)}`;
}

export function habitExplanation(habit: HabitResult): string {
  const d = habit.detail;
  switch (habit.type) {
    case "revenge_trading":
      return `You opened a new trade within ${d.windowMinutes} minutes of a loss ${habit.occurrences} time${habit.occurrences === 1 ? "" : "s"} this month. ${d.revengeLossCount} of those re-entries also lost money, costing ${formatRupees(habit.costRupees)} in total.`;
    case "cutting_winners_short":
      return `Across ${habit.occurrences} losing trades, your average loss (${formatRupees(d.avgLossAbs)}) was about ${d.ratio.toFixed(1)}x your average win (${formatRupees(d.avgWin)}). Matching that ratio would have kept roughly ${formatRupees(habit.costRupees)} more in your account.`;
    case "averaging_down":
      return `You added to a position that had already moved against you ${habit.occurrences} time${habit.occurrences === 1 ? "" : "s"} this month, across ${d.tradesWithAveraging} trade${d.tradesWithAveraging === 1 ? "" : "s"}. Those add-ons cost about ${formatRupees(habit.costRupees)} once the trades closed.`;
    case "overtrading":
      return `On ${habit.occurrences} day${habit.occurrences === 1 ? "" : "s"} you traded well past your usual pace of ${Math.round(d.medianDailyCount)} trades a day. On those days you ${describeAvgPerTrade(d.avgOver)} per trade, versus ${describeAvgPerTrade(d.avgNormal)} on your normal days — costing about ${formatRupees(habit.costRupees)}.`;
    case "opening_minutes":
      return `You placed ${habit.occurrences} trades in the first 15 minutes after the market opened. Those trades ${describeAvgPerTrade(d.avgOpening)}, versus ${describeAvgPerTrade(d.avgOther)} for your other trades — about ${formatRupees(habit.costRupees)} in total.`;
    default:
      return "";
  }
}

export function habitRule(habit: HabitResult): string {
  switch (habit.type) {
    case "revenge_trading":
      return "Wait 15 minutes after closing a loss before opening any new trade.";
    case "cutting_winners_short":
      return "Aim for a 1:1 ratio — risk and target the same distance from your entry.";
    case "averaging_down":
      return "Limit yourself to 1 add-on per losing position, even if it looks cheaper.";
    case "overtrading":
      return `You typically make ${Math.round(habit.detail.medianDailyCount)} trades a day — treat that as today's limit.`;
    case "opening_minutes":
      return "Wait until 9:30 before placing your first trade of the day.";
    default:
      return "";
  }
}

export function habitGuardrail(type: HabitType): { title: string; description: string } {
  switch (type) {
    case "revenge_trading":
      return {
        title: "30-minute pause after a loss",
        description: "Nubra briefly holds off new orders for 30 minutes after a losing trade closes.",
      };
    case "cutting_winners_short":
      return {
        title: "Prompt for a stop-loss at entry",
        description: "Nubra asks you to set a stop-loss distance when you open a position.",
      };
    case "averaging_down":
      return {
        title: "Warn before adding to a loss",
        description: "Nubra shows a warning before you add to a position that is already at a loss.",
      };
    case "overtrading":
      return {
        title: "Daily trade count nudge",
        description: "Nubra notifies you when you cross your own usual number of trades for the day.",
      };
    case "opening_minutes":
      return {
        title: "Opening-minutes notice",
        description: "Nubra shows a brief notice that prices are more volatile in the first 15 minutes.",
      };
    default:
      return { title: "", description: "" };
  }
}

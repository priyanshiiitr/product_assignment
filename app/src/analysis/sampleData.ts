import { mulberry32, randFloat, randInt, type Rng } from "./rng";
import type { Direction, Order, Side } from "./types";

const SYMBOLS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "SBIN", "ICICIBANK"];
const BASE_PRICE: Record<string, number> = {
  RELIANCE: 2900,
  TCS: 3800,
  INFY: 1650,
  HDFCBANK: 1600,
  SBIN: 820,
  ICICIBANK: 1150,
};
const LOT_SIZES = [5, 10, 15, 20, 25, 30, 50];

const SESSION_OPEN = 9 * 60 + 15;
const SESSION_CLOSE = 15 * 60 + 30;

function tradingDays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date(2026, 7, 3);
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function atMinute(day: Date, minutesFromMidnight: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutesFromMidnight / 60), minutesFromMidnight % 60, 0);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pickSymbol(rng: Rng): string {
  return SYMBOLS[Math.floor(rng() * SYMBOLS.length) % SYMBOLS.length];
}

function pickQty(rng: Rng): number {
  return LOT_SIZES[Math.floor(rng() * LOT_SIZES.length) % LOT_SIZES.length];
}

function priceForOutcome(entryPrice: number, direction: Direction, pctMove: number, isWin: boolean): number {
  const signedPct = isWin ? pctMove : -pctMove;
  return direction === "LONG" ? entryPrice * (1 + signedPct) : entryPrice * (1 - signedPct);
}

interface RowRef {
  i: number;
}

function pushRoundTrip(
  orders: Order[],
  rowRef: RowRef,
  params: {
    symbol: string;
    day: Date;
    entryMinute: number;
    direction: Direction;
    qty: number;
    entryPrice: number;
    holdMinutes: number;
    exitPrice: number;
  },
): number {
  const clampedHold = Math.max(3, Math.min(params.holdMinutes, SESSION_CLOSE - params.entryMinute));
  const entryTime = atMinute(params.day, params.entryMinute);
  const exitMinute = params.entryMinute + clampedHold;
  const exitTime = atMinute(params.day, exitMinute);
  const entrySide: Side = params.direction === "LONG" ? "BUY" : "SELL";
  const exitSide: Side = params.direction === "LONG" ? "SELL" : "BUY";

  orders.push({
    timestamp: entryTime,
    symbol: params.symbol,
    side: entrySide,
    qty: params.qty,
    price: round2(params.entryPrice),
    rowIndex: rowRef.i++,
  });
  orders.push({
    timestamp: exitTime,
    symbol: params.symbol,
    side: exitSide,
    qty: params.qty,
    price: round2(params.exitPrice),
    rowIndex: rowRef.i++,
  });
  return exitMinute;
}

function pushAveragingDownTrip(
  orders: Order[],
  rowRef: RowRef,
  params: {
    symbol: string;
    day: Date;
    entryMinute: number;
    direction: Direction;
    qty1: number;
    entryPrice1: number;
    addAfterMinutes: number;
    qty2: number;
    addPrice: number;
    holdAfterAddMinutes: number;
    exitPrice: number;
  },
): number {
  const entryTime = atMinute(params.day, params.entryMinute);
  const addMinute = params.entryMinute + params.addAfterMinutes;
  const addTime = atMinute(params.day, addMinute);
  const exitMinute = Math.min(addMinute + params.holdAfterAddMinutes, SESSION_CLOSE);
  const exitTime = atMinute(params.day, exitMinute);
  const totalQty = params.qty1 + params.qty2;
  const entrySide: Side = params.direction === "LONG" ? "BUY" : "SELL";
  const exitSide: Side = params.direction === "LONG" ? "SELL" : "BUY";

  orders.push({ timestamp: entryTime, symbol: params.symbol, side: entrySide, qty: params.qty1, price: round2(params.entryPrice1), rowIndex: rowRef.i++ });
  orders.push({ timestamp: addTime, symbol: params.symbol, side: entrySide, qty: params.qty2, price: round2(params.addPrice), rowIndex: rowRef.i++ });
  orders.push({ timestamp: exitTime, symbol: params.symbol, side: exitSide, qty: totalQty, price: round2(params.exitPrice), rowIndex: rowRef.i++ });
  return exitMinute;
}

function normalDirection(rng: Rng): Direction {
  return rng() < 0.7 ? "LONG" : "SHORT";
}

function generateRevengeTrader(seed: number): Order[] {
  const rng = mulberry32(seed);
  const orders: Order[] = [];
  const rowRef: RowRef = { i: 1 };
  const days = tradingDays(20);

  for (const day of days) {
    if (rng() < 0.05) continue;
    let minute = SESSION_OPEN + randInt(rng, 20, 90);
    const dailyBudget = randInt(rng, 2, 4);
    let tradesToday = 0;

    while (tradesToday < dailyBudget && minute < SESSION_CLOSE - 10) {
      const symbol = pickSymbol(rng);
      const direction = normalDirection(rng);
      const qty = pickQty(rng);
      const entryPrice = BASE_PRICE[symbol] * randFloat(rng, 0.98, 1.02);
      const isWin = rng() < 0.48;
      const pctMove = isWin ? randFloat(rng, 0.005, 0.02) : randFloat(rng, 0.005, 0.025);
      const holdMinutes = randInt(rng, 8, 45);
      const exitPrice = priceForOutcome(entryPrice, direction, pctMove, isWin);

      const exitMinute = pushRoundTrip(orders, rowRef, { symbol, day, entryMinute: minute, direction, qty, entryPrice, holdMinutes, exitPrice });
      minute = exitMinute + randInt(rng, 10, 40);
      tradesToday += 1;

      let chainLoss = !isWin;
      let chainDepth = 0;
      while (chainLoss && chainDepth < 3 && rng() < (chainDepth === 0 ? 0.75 : 0.55) && minute < SESSION_CLOSE - 10) {
        const revengeGap = randInt(rng, 3, 12);
        const revengeMinute = minute + revengeGap;
        if (revengeMinute >= SESSION_CLOSE - 5) break;
        const rSymbol = rng() < 0.6 ? symbol : pickSymbol(rng);
        const rDirection = normalDirection(rng);
        const rQty = pickQty(rng);
        const rEntryPrice = BASE_PRICE[rSymbol] * randFloat(rng, 0.98, 1.02);
        const rIsWin = rng() < 0.32;
        const rPctMove = rIsWin ? randFloat(rng, 0.004, 0.015) : randFloat(rng, 0.01, 0.03);
        const rHold = randInt(rng, 5, 30);
        const rExitPrice = priceForOutcome(rEntryPrice, rDirection, rPctMove, rIsWin);
        minute = pushRoundTrip(orders, rowRef, {
          symbol: rSymbol,
          day,
          entryMinute: revengeMinute,
          direction: rDirection,
          qty: rQty,
          entryPrice: rEntryPrice,
          holdMinutes: rHold,
          exitPrice: rExitPrice,
        });
        chainLoss = !rIsWin;
        chainDepth += 1;
      }
    }
  }

  return orders;
}

function generateAverager(seed: number): Order[] {
  const rng = mulberry32(seed);
  const orders: Order[] = [];
  const rowRef: RowRef = { i: 1 };
  const days = tradingDays(20);

  for (const day of days) {
    const dailyBudget = randInt(rng, 0, 2);
    let minute = SESSION_OPEN + randInt(rng, 15, 60);

    for (let t = 0; t < dailyBudget; t += 1) {
      if (minute > SESSION_CLOSE - 30) break;
      const symbol = pickSymbol(rng);
      const direction = normalDirection(rng);
      const willAverage = rng() < 0.55;

      if (willAverage) {
        const qty1 = pickQty(rng);
        const qty2 = pickQty(rng);
        const entryPrice1 = BASE_PRICE[symbol] * randFloat(rng, 0.98, 1.02);
        const addPct = randFloat(rng, 0.01, 0.03);
        const addPrice = direction === "LONG" ? entryPrice1 * (1 - addPct) : entryPrice1 * (1 + addPct);
        const isWin = rng() < 0.35;
        const finalPctMove = isWin ? randFloat(rng, 0.005, 0.015) : randFloat(rng, 0.01, 0.035);
        const blendedEntry = (qty1 * entryPrice1 + qty2 * addPrice) / (qty1 + qty2);
        const exitPrice = priceForOutcome(blendedEntry, direction, finalPctMove, isWin);

        minute = pushAveragingDownTrip(orders, rowRef, {
          symbol,
          day,
          entryMinute: minute,
          direction,
          qty1,
          entryPrice1,
          addAfterMinutes: randInt(rng, 15, 90),
          qty2,
          addPrice,
          holdAfterAddMinutes: randInt(rng, 20, 90),
          exitPrice,
        });
        minute += randInt(rng, 15, 40);
      } else {
        const qty = pickQty(rng);
        const entryPrice = BASE_PRICE[symbol] * randFloat(rng, 0.98, 1.02);
        const isWin = rng() < 0.52;
        const pctMove = randFloat(rng, 0.005, 0.02);
        const holdMinutes = randInt(rng, 15, 90);
        const exitPrice = priceForOutcome(entryPrice, direction, pctMove, isWin);
        minute = pushRoundTrip(orders, rowRef, { symbol, day, entryMinute: minute, direction, qty, entryPrice, holdMinutes, exitPrice });
        minute += randInt(rng, 15, 40);
      }
    }
  }

  return orders;
}

function generateOvertrader(seed: number): Order[] {
  const rng = mulberry32(seed);
  const orders: Order[] = [];
  const rowRef: RowRef = { i: 1 };
  const days = tradingDays(20);

  days.forEach((day, idx) => {
    const isBurstDay = idx % 4 === 3;
    const dailyBudget = isBurstDay ? randInt(rng, 8, 12) : randInt(rng, 2, 3);
    let minute = SESSION_OPEN + randInt(rng, 10, 60);

    for (let t = 0; t < dailyBudget && minute < SESSION_CLOSE - 8; t += 1) {
      const symbol = pickSymbol(rng);
      const direction = normalDirection(rng);
      const qty = pickQty(rng);
      const entryPrice = BASE_PRICE[symbol] * randFloat(rng, 0.98, 1.02);
      const isWin = isBurstDay ? rng() < 0.25 : rng() < 0.55;
      const pctMove = isBurstDay ? randFloat(rng, 0.006, 0.024) : randFloat(rng, 0.004, 0.014);
      const holdMinutes = isBurstDay ? randInt(rng, 4, 15) : randInt(rng, 10, 40);
      const exitPrice = priceForOutcome(entryPrice, direction, pctMove, isWin);
      const exitMinute = pushRoundTrip(orders, rowRef, { symbol, day, entryMinute: minute, direction, qty, entryPrice, holdMinutes, exitPrice });
      minute = exitMinute + randInt(rng, 3, isBurstDay ? 12 : 30);
    }
  });

  return orders;
}

function generateCutsWinnersShort(seed: number): Order[] {
  const rng = mulberry32(seed);
  const orders: Order[] = [];
  const rowRef: RowRef = { i: 1 };
  const days = tradingDays(20);

  for (const day of days) {
    if (rng() < 0.15) continue;
    const dailyBudget = randInt(rng, 1, 3);
    let minute = SESSION_OPEN + randInt(rng, 20, 80);

    for (let t = 0; t < dailyBudget && minute < SESSION_CLOSE - 15; t += 1) {
      const symbol = pickSymbol(rng);
      const direction = normalDirection(rng);
      const qty = pickQty(rng);
      const entryPrice = BASE_PRICE[symbol] * randFloat(rng, 0.98, 1.02);
      const isWin = rng() < 0.5;
      const pctMove = isWin ? randFloat(rng, 0.003, 0.008) : randFloat(rng, 0.015, 0.04);
      const holdMinutes = isWin ? randInt(rng, 5, 20) : randInt(rng, 30, 120);
      const exitPrice = priceForOutcome(entryPrice, direction, pctMove, isWin);
      const exitMinute = pushRoundTrip(orders, rowRef, { symbol, day, entryMinute: minute, direction, qty, entryPrice, holdMinutes, exitPrice });
      minute = exitMinute + randInt(rng, 15, 40);
    }
  }

  return orders;
}

function generateCleanTrader(seed: number): Order[] {
  const rng = mulberry32(seed);
  const orders: Order[] = [];
  const rowRef: RowRef = { i: 1 };
  const days = tradingDays(20);

  for (const day of days) {
    if (rng() < 0.1) continue;
    const dailyBudget = randInt(rng, 2, 3);
    let minute = SESSION_OPEN + randInt(rng, 30, 120);

    for (let t = 0; t < dailyBudget && minute < SESSION_CLOSE - 20; t += 1) {
      const symbol = pickSymbol(rng);
      const direction = normalDirection(rng);
      const qty = pickQty(rng);
      const entryPrice = BASE_PRICE[symbol] * randFloat(rng, 0.98, 1.02);
      const isWin = rng() < 0.52;
      const pctMove = randFloat(rng, 0.006, 0.016);
      const holdMinutes = randInt(rng, 20, 100);
      const exitPrice = priceForOutcome(entryPrice, direction, pctMove, isWin);
      const exitMinute = pushRoundTrip(orders, rowRef, { symbol, day, entryMinute: minute, direction, qty, entryPrice, holdMinutes, exitPrice });
      minute = exitMinute + randInt(rng, 40, 90);
    }
  }

  return orders;
}

export interface SampleTrader {
  id: string;
  label: string;
  description: string;
  defaultSeed: number;
  generate: (seed: number) => Order[];
}

export const SAMPLE_TRADERS: SampleTrader[] = [
  {
    id: "rahul-revenge",
    label: "Rahul",
    description: "Sample data — tends to jump back into a new trade minutes after a loss.",
    defaultSeed: 42,
    generate: generateRevengeTrader,
  },
  {
    id: "ananya-averager",
    label: "Ananya",
    description: "Sample data — tends to add to a position after it moves against her.",
    defaultSeed: 7,
    generate: generateAverager,
  },
  {
    id: "vikram-overtrader",
    label: "Vikram",
    description: "Sample data — has a handful of days where he trades far more than usual.",
    defaultSeed: 19,
    generate: generateOvertrader,
  },
  {
    id: "priya-cuts-winners",
    label: "Priya",
    description: "Sample data — takes small profits quickly but lets losing trades run.",
    defaultSeed: 11,
    generate: generateCutsWinnersShort,
  },
  {
    id: "meera-clean",
    label: "Meera",
    description: "Sample data — a steady, controlled trader used as a control case.",
    defaultSeed: 3,
    generate: generateCleanTrader,
  },
];

export function ordersToCsv(orders: Order[]): string {
  const header = "timestamp,symbol,side,qty,price";
  const rows = orders
    .slice()
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((o) => {
      const ts = `${o.timestamp.getFullYear()}-${String(o.timestamp.getMonth() + 1).padStart(2, "0")}-${String(o.timestamp.getDate()).padStart(2, "0")} ${String(o.timestamp.getHours()).padStart(2, "0")}:${String(o.timestamp.getMinutes()).padStart(2, "0")}:00`;
      return `${ts},${o.symbol},${o.side},${o.qty},${o.price}`;
    });
  return [header, ...rows].join("\n");
}

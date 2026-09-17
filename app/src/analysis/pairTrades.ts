import type { Direction, Fill, Order, RoundTripTrade } from "./types";

interface Lot {
  qty: number;
  price: number;
  timestamp: Date;
  isAveragingDown: boolean;
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

function weightedAvgPrice(fills: Fill[]): number {
  const totalQty = sum(fills.map((f) => f.qty));
  if (totalQty === 0) return 0;
  return sum(fills.map((f) => f.qty * f.price)) / totalQty;
}

export function pairOrdersIntoTrades(orders: Order[]): RoundTripTrade[] {
  let idCounter = 0;
  const nextId = () => {
    idCounter += 1;
    return `trade-${idCounter}`;
  };

  const bySymbol = new Map<string, Order[]>();
  for (const o of orders) {
    const list = bySymbol.get(o.symbol) ?? [];
    list.push(o);
    bySymbol.set(o.symbol, list);
  }

  const results: RoundTripTrade[] = [];

  for (const [symbol, symOrders] of bySymbol) {
    const sorted = [...symOrders].sort((a, b) => {
      const t = a.timestamp.getTime() - b.timestamp.getTime();
      if (t !== 0) return t;
      return a.rowIndex - b.rowIndex;
    });

    let lots: Lot[] = [];
    let direction: Direction | null = null;
    let entryFills: Fill[] = [];
    let exitFills: Fill[] = [];
    let realizedPnlAccum = 0;
    let averagingDownRealizedPnl = 0;
    let hasAveragingDown = false;

    const finalize = (isOpen: boolean) => {
      if (entryFills.length === 0 || direction === null) return;
      const qtyEntered = sum(entryFills.map((f) => f.qty));
      const qtyExited = sum(exitFills.map((f) => f.qty));
      results.push({
        id: nextId(),
        symbol,
        direction,
        entryFills: [...entryFills],
        exitFills: [...exitFills],
        isOpen,
        entryTime: entryFills[0].timestamp,
        exitTime: exitFills.length > 0 ? exitFills[exitFills.length - 1].timestamp : null,
        qtyEntered,
        qtyExited,
        avgEntryPrice: weightedAvgPrice(entryFills),
        avgExitPrice: exitFills.length > 0 ? weightedAvgPrice(exitFills) : null,
        realizedPnl: realizedPnlAccum,
        holdingMinutes:
          exitFills.length > 0
            ? (exitFills[exitFills.length - 1].timestamp.getTime() - entryFills[0].timestamp.getTime()) / 60000
            : null,
        hasAveragingDown,
        averagingDownPnl: averagingDownRealizedPnl,
      });
    };

    const resetLifecycle = (initialLot: Lot, initialDirection: Direction) => {
      lots = [initialLot];
      direction = initialDirection;
      entryFills = [{ qty: initialLot.qty, price: initialLot.price, timestamp: initialLot.timestamp }];
      exitFills = [];
      realizedPnlAccum = 0;
      averagingDownRealizedPnl = 0;
      hasAveragingDown = false;
    };

    for (const order of sorted) {
      const orderSign: 1 | -1 = order.side === "BUY" ? 1 : -1;

      if (lots.length === 0) {
        resetLifecycle(
          { qty: order.qty, price: order.price, timestamp: order.timestamp, isAveragingDown: false },
          orderSign === 1 ? "LONG" : "SHORT",
        );
        continue;
      }

      const positionSign = direction === "LONG" ? 1 : -1;

      if (orderSign === positionSign) {
        const priorAvg = weightedAvgPrice(entryFills);
        const isAveragingDown = direction === "LONG" ? order.price < priorAvg : order.price > priorAvg;
        if (isAveragingDown) hasAveragingDown = true;
        lots.push({ qty: order.qty, price: order.price, timestamp: order.timestamp, isAveragingDown });
        entryFills.push({
          qty: order.qty,
          price: order.price,
          timestamp: order.timestamp,
          isAveragingDown,
        });
        continue;
      }

      let remaining = order.qty;
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const matchQty = Math.min(remaining, lot.qty);
        const pnl = (order.price - lot.price) * matchQty * positionSign;
        realizedPnlAccum += pnl;
        if (lot.isAveragingDown) averagingDownRealizedPnl += pnl;
        exitFills.push({ qty: matchQty, price: order.price, timestamp: order.timestamp });
        lot.qty -= matchQty;
        remaining -= matchQty;
        if (lot.qty === 0) lots.shift();
      }

      if (lots.length === 0 && remaining === 0) {
        finalize(false);
        lots = [];
        direction = null;
        entryFills = [];
        exitFills = [];
      } else if (lots.length === 0 && remaining > 0) {
        finalize(false);
        resetLifecycle(
          { qty: remaining, price: order.price, timestamp: order.timestamp, isAveragingDown: false },
          orderSign === 1 ? "LONG" : "SHORT",
        );
      }
      // else: partial exit, lifecycle continues open
    }

    if (lots.length > 0) {
      finalize(true);
    }
  }

  results.sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
  return results;
}

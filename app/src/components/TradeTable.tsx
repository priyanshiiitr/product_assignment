import type { RoundTripTrade } from "../analysis";
import { formatDateTime, formatSignedRupees } from "../format";

interface TradeTableProps {
  trades: RoundTripTrade[];
}

export function TradeTable({ trades }: TradeTableProps) {
  if (trades.length === 0) return null;

  return (
    <details className="trade-details">
      <summary>The {trades.length} trade{trades.length === 1 ? "" : "s"} behind this</summary>
      <div className="trade-table-wrap">
        <table className="trade-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Qty</th>
              <th>P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id}>
                <td>{t.symbol}</td>
                <td>{t.direction === "LONG" ? "Long" : "Short"}</td>
                <td>{formatDateTime(t.entryTime)}</td>
                <td>{t.exitTime ? formatDateTime(t.exitTime) : "Still open"}</td>
                <td>{t.qtyExited || t.qtyEntered}</td>
                <td className={t.realizedPnl < 0 ? "pnl-neg" : "pnl-pos"}>{formatSignedRupees(t.realizedPnl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

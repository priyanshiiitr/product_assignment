import type { Order, ParseError, ParseResult, Side } from "./types";

const REQUIRED_HEADERS = ["timestamp", "symbol", "side", "qty", "price"];

function parseTimestamp(raw: string): Date | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(trimmed)
    ? trimmed.replace(" ", "T")
    : trimmed;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseSide(raw: string): Side | null {
  const s = raw.trim().toUpperCase();
  if (s === "BUY" || s === "SELL") return s;
  return null;
}

export function parseCsv(text: string): ParseResult {
  const errors: ParseError[] = [];
  const orders: Order[] = [];

  const lines = text
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    errors.push({ rowIndex: 0, raw: "", message: "The file is empty." });
    return { orders, errors };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  if (missing.length > 0) {
    errors.push({
      rowIndex: 0,
      raw: lines[0],
      message: `Missing required column(s): ${missing.join(", ")}. Expected: timestamp, symbol, side, qty, price.`,
    });
    return { orders, errors };
  }

  const colIndex = {
    timestamp: header.indexOf("timestamp"),
    symbol: header.indexOf("symbol"),
    side: header.indexOf("side"),
    qty: header.indexOf("qty"),
    price: header.indexOf("price"),
  };

  for (let i = 1; i < lines.length; i += 1) {
    const raw = lines[i];
    const cols = raw.split(",").map((c) => c.trim());

    if (cols.length < REQUIRED_HEADERS.length) {
      errors.push({ rowIndex: i, raw, message: "Row has fewer columns than expected." });
      continue;
    }

    const timestampRaw = cols[colIndex.timestamp];
    const symbolRaw = cols[colIndex.symbol];
    const sideRaw = cols[colIndex.side];
    const qtyRaw = cols[colIndex.qty];
    const priceRaw = cols[colIndex.price];

    const timestamp = parseTimestamp(timestampRaw);
    if (!timestamp) {
      errors.push({ rowIndex: i, raw, message: `Could not read timestamp "${timestampRaw}".` });
      continue;
    }

    const symbol = symbolRaw.trim().toUpperCase();
    if (symbol.length === 0) {
      errors.push({ rowIndex: i, raw, message: "Symbol is empty." });
      continue;
    }

    const side = parseSide(sideRaw);
    if (!side) {
      errors.push({ rowIndex: i, raw, message: `Side must be BUY or SELL, got "${sideRaw}".` });
      continue;
    }

    const qty = Number(qtyRaw);
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.push({ rowIndex: i, raw, message: `Qty must be a positive number, got "${qtyRaw}".` });
      continue;
    }

    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
      errors.push({ rowIndex: i, raw, message: `Price must be a positive number, got "${priceRaw}".` });
      continue;
    }

    orders.push({ timestamp, symbol, side, qty, price, rowIndex: i });
  }

  return { orders, errors };
}

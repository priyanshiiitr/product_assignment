import { describe, expect, it } from "vitest";
import { parseCsv } from "../csv";

describe("parseCsv", () => {
  it("reports an error for an empty file", () => {
    const { orders, errors } = parseCsv("");
    expect(orders).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("reports an error for missing required columns", () => {
    const { orders, errors } = parseCsv("timestamp,symbol,qty,price\n2026-08-03 10:00,TCS,10,100");
    expect(orders).toHaveLength(0);
    expect(errors[0].message).toMatch(/missing required column/i);
  });

  it("skips bad rows with a clear message but keeps good ones", () => {
    const csv = [
      "timestamp,symbol,side,qty,price",
      "2026-08-03 10:00,TCS,BUY,10,100",
      "not-a-date,TCS,BUY,10,100",
      "2026-08-03 10:05,TCS,HOLD,10,100",
      "2026-08-03 10:10,TCS,SELL,-5,100",
      "2026-08-03 10:15,TCS,SELL,10,abc",
      "2026-08-03 10:20,TCS,SELL,10,110",
    ].join("\n");
    const { orders, errors } = parseCsv(csv);
    expect(orders).toHaveLength(2);
    expect(errors).toHaveLength(4);
    for (const e of errors) {
      expect(e.message.length).toBeGreaterThan(0);
    }
  });

  it("parses a well-formed file with no errors", () => {
    const csv = [
      "timestamp,symbol,side,qty,price",
      "2026-08-03 10:00,TCS,BUY,10,100",
      "2026-08-03 10:30,TCS,SELL,10,110",
    ].join("\n");
    const { orders, errors } = parseCsv(csv);
    expect(orders).toHaveLength(2);
    expect(errors).toHaveLength(0);
  });
});

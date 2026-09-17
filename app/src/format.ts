export function formatDateTime(d: Date): string {
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatMonthRange(dates: Date[]): string {
  if (dates.length === 0) return "";
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${first.toLocaleDateString("en-IN", opts)} – ${last.toLocaleDateString("en-IN", opts)}`;
}

export function formatSignedRupees(n: number): string {
  const abs = Math.round(Math.abs(n)).toLocaleString("en-IN");
  return n < 0 ? `-₹${abs}` : `₹${abs}`;
}

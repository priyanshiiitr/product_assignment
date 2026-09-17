import type { ParseError } from "../analysis";

interface ErrorBannerProps {
  errors: ParseError[];
  fatal: boolean;
}

export function ErrorBanner({ errors, fatal }: ErrorBannerProps) {
  if (errors.length === 0) return null;
  const shown = errors.slice(0, 5);

  return (
    <div className={fatal ? "banner banner-error" : "banner banner-warn"}>
      <p className="banner-title">
        {fatal
          ? "We couldn't read this file."
          : `We skipped ${errors.length} row${errors.length === 1 ? "" : "s"} we couldn't read.`}
      </p>
      <ul className="banner-list">
        {shown.map((e, i) => (
          <li key={i}>
            Row {e.rowIndex + 1}: {e.message}
          </li>
        ))}
      </ul>
      {errors.length > shown.length && <p className="banner-more">…and {errors.length - shown.length} more.</p>}
    </div>
  );
}

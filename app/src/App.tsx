import { useMemo, useState } from "react";
import { SAMPLE_TRADERS, buildMonthlyReview, pairOrdersIntoTrades, parseCsv, type Order, type ParseError } from "./analysis";
import { InputScreen } from "./components/InputScreen";
import { ErrorBanner } from "./components/ErrorBanner";
import { ReviewDocument } from "./components/ReviewDocument";

type Source = { kind: "sample"; label: string } | { kind: "upload"; fileName: string } | null;

function App() {
  const [source, setSource] = useState<Source>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [csvErrors, setCsvErrors] = useState<ParseError[]>([]);

  const trades = useMemo(() => pairOrdersIntoTrades(orders), [orders]);
  const review = useMemo(() => buildMonthlyReview(trades), [trades]);

  const reset = () => {
    setSource(null);
    setOrders([]);
    setCsvErrors([]);
  };

  const handleSelectSample = (traderId: string) => {
    const trader = SAMPLE_TRADERS.find((t) => t.id === traderId);
    if (!trader) return;
    setOrders(trader.generate(trader.defaultSeed));
    setCsvErrors([]);
    setSource({ kind: "sample", label: `Sample data — ${trader.label}` });
  };

  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const { orders: parsed, errors } = parseCsv(text);
      setOrders(parsed);
      setCsvErrors(errors);
      setSource({ kind: "upload", fileName: file.name });
    };
    reader.readAsText(file);
  };

  return (
    <div className="app-shell">
      {source === null ? (
        <InputScreen onSelectSample={handleSelectSample} onUploadFile={handleUploadFile} />
      ) : orders.length === 0 ? (
        <div className="review">
          <div className="review-topbar">
            <button type="button" className="link-btn" onClick={reset}>
              ← Try another
            </button>
          </div>
          <h1 className="review-title">We couldn't build a review from this file.</h1>
          <ErrorBanner errors={csvErrors} fatal />
        </div>
      ) : (
        <>
          {csvErrors.length > 0 && <ErrorBanner errors={csvErrors} fatal={false} />}
          <ReviewDocument
            review={review}
            sourceLabel={source.kind === "sample" ? source.label : `Your file — ${source.fileName}`}
            onReset={reset}
          />
        </>
      )}
    </div>
  );
}

export default App;

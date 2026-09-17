import { useRef } from "react";
import { SAMPLE_TRADERS } from "../analysis";

interface InputScreenProps {
  onSelectSample: (traderId: string) => void;
  onUploadFile: (file: File) => void;
}

export function InputScreen({ onSelectSample, onUploadFile }: InputScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="intro">
      <p className="eyebrow">A monthly review for active traders</p>
      <h1>Find out what your last month of trading actually cost you.</h1>
      <p className="intro-lede">
        Upload a CSV of your orders, or try it on one of five sample traders below. Either way, this looks only at
        your own trades — nothing is sent anywhere, and nothing here is investment advice.
      </p>

      <div className="upload-box">
        <p className="upload-label">Your own order history</p>
        <p className="upload-hint">CSV with columns: timestamp, symbol, side, qty, price</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="divider">
        <span>or try a sample trader</span>
      </div>

      <div className="sample-grid">
        {SAMPLE_TRADERS.map((t) => (
          <button key={t.id} type="button" className="sample-card" onClick={() => onSelectSample(t.id)}>
            <span className="sample-name">{t.label}</span>
            <span className="sample-desc">{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

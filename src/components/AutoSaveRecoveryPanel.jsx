import { useMemo, useState } from "react";
import { readRecoverySnapshot, summarizeRecoverySnapshot } from "../lib/autoSaveRecovery.js";

export default function AutoSaveRecoveryPanel({ saveStatus }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const recovery = useMemo(() => readRecoverySnapshot(), [refreshKey]);
  const rows = useMemo(() => summarizeRecoverySnapshot(recovery), [recovery]);

  return (
    <section className="autosave-recovery-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Autosave Recovery</p>
          <h2>{recovery.status}</h2>
        </div>

        <div className="workflow-stats">
          <span>{saveStatus?.status || "unknown"}</span>
          <span>{recovery.found ? "recoverable" : "waiting"}</span>
        </div>
      </div>

      <p className="recovery-detail">{recovery.detail}</p>

      <div className="recovery-grid">
        {rows.map((row) => (
          <div key={row.label}>
            <span>{row.label}</span>
            <strong>{String(row.value)}</strong>
          </div>
        ))}
      </div>

      <button className="recovery-refresh" type="button" onClick={() => setRefreshKey((value) => value + 1)}>
        Refresh Recovery Preview
      </button>
    </section>
  );
}

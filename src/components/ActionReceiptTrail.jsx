import { buildReceiptSummary, getReceiptTone } from "../lib/actionReceipts.js";

export default function ActionReceiptTrail({ receipts }) {
  const safeReceipts = Array.isArray(receipts) ? receipts : [];
  const summary = buildReceiptSummary(safeReceipts);

  return (
    <section className="action-center-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Action Center</p>
          <h2>{summary.total ? `${summary.total} confirmed action receipt(s)` : "No confirmed actions yet"}</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.guarded} guarded</span>
          <span>{summary.withReason} with reason</span>
          <span>{summary.companies} company lane(s)</span>
        </div>
      </div>

      <div className="action-center-helper">
        <strong>This is the local receipt trail.</strong>
        <span>When you confirm an action with a reason, The Teller records the mock receipt here.</span>
      </div>

      <div className="receipt-list">
        {safeReceipts.length > 0 ? (
          safeReceipts.slice(0, 6).map((receipt) => (
            <article className={`receipt-card ${getReceiptTone(receipt)}`} key={receipt.id}>
              <div>
                <strong>{receipt.actionLabel}</strong>
                <span>{receipt.intentTypeLabel} • {receipt.severity} • {receipt.humanTime}</span>
              </div>

              <p>{receipt.entityLabel} • {receipt.drawer} • {receipt.recordTitle}</p>

              {receipt.reason && <em>Reason: {receipt.reason}</em>}
            </article>
          ))
        ) : (
          <article className="receipt-card">
            <div>
              <strong>Nothing captured yet</strong>
              <span>Waiting for confirmed action</span>
            </div>
            <p>Click an action like Escalate, Step-Up, Approve, or Resolve. Add a reason. Confirm it. The receipt will show here.</p>
          </article>
        )}
      </div>
    </section>
  );
}

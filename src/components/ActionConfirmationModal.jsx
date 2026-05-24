export default function ActionConfirmationModal({
  confirmation,
  reason,
  setReason,
  reasonError,
  onConfirm,
  onCancel,
}) {
  if (!confirmation) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="action-confirmation-modal" role="dialog" aria-modal="true">
        <div>
          <p className="eyebrow">Action Confirmation</p>
          <h2>{confirmation.title}</h2>
          <p>{confirmation.detail}</p>
        </div>

        <div className="confirmation-grid">
          <div>
            <span>Company</span>
            <strong>{confirmation.entityLabel}</strong>
          </div>
          <div>
            <span>Drawer</span>
            <strong>{confirmation.drawerLabel}</strong>
          </div>
          <div>
            <span>Intent Type</span>
            <strong>{confirmation.intentType.label}</strong>
          </div>
          <div>
            <span>Severity</span>
            <strong>{confirmation.intentType.severity}</strong>
          </div>
        </div>

        <div className={`confirmation-warning ${confirmation.intentType.tone}`}>
          <strong>{confirmation.warning}</strong>
          <span>Backend persistence is not active yet. This captures a local mock intent only.</span>
        </div>

        {confirmation.requiresReason && (
          <div className="confirmation-reason-box">
            <label htmlFor="confirmation-reason">Reason</label>
            <textarea
              id="confirmation-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={confirmation.reasonPlaceholder}
              rows={4}
            />
            {reasonError && <strong className="reason-error">{reasonError}</strong>}
          </div>
        )}

        <div className="confirmation-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            {confirmation.cancelLabel}
          </button>
          <button type="button" className="primary" onClick={onConfirm}>
            {confirmation.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

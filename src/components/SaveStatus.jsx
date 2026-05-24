import { formatSavedTime } from "../lib/autoSave.js";

export default function SaveStatus({ saveStatus }) {
  const statusLabel = {
    ready: "Autosave ready",
    saving: "Saving",
    saved: "Saved",
    error: "Autosave issue",
  }[saveStatus.status] || "Autosave";

  return (
    <div className={saveStatus.status === "error" ? "save-strip error" : "save-strip"}>
      <span>{statusLabel}</span>
      <strong>{formatSavedTime(saveStatus.lastSavedAt)}</strong>
      {saveStatus.recoveredAt && <small>Recovered draft from {formatSavedTime(saveStatus.recoveredAt)}</small>}
    </div>
  );
}

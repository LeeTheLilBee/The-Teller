import { checkpointManifest } from "../data/checkpointManifest.js";
import { getDevCheckSummary } from "./devChecks.js";

export function getDevHealthInspector({ checks, systemStatus, batchSummary, saveStatus }) {
  const devSummary = getDevCheckSummary(checks);
  const failedChecks = checks.filter((check) => !check.pass);
  const passedChecks = checks.filter((check) => check.pass);

  const healthScore = devSummary.total ? Math.round((devSummary.passed / devSummary.total) * 100) : 0;

  let level = "Healthy";
  if (healthScore < 100) level = "Needs Review";
  if (healthScore < 85) level = "Warning";
  if (healthScore < 70) level = "Critical";

  return {
    level,
    healthScore,
    devSummary,
    failedChecks,
    passedChecks,
    systemStatus,
    batchSummary,
    saveStatus,
    checkpoint: checkpointManifest.checkpoint,
    pendingSaveBatch: checkpointManifest.pendingSaveBatch,
    savedThrough: checkpointManifest.savedThrough,
    nextLikelyPack: checkpointManifest.nextLikelyPack,
    cards: [
      {
        title: "Build Readiness",
        detail: `${healthScore}% check score`,
        meta: failedChecks.length ? `${failedChecks.length} check(s) need review` : "All registered checks are passing",
        tone: failedChecks.length ? "watch" : "steady",
      },
      {
        title: "Autosave",
        detail: saveStatus?.status || "unknown",
        meta: saveStatus?.message || "Autosave status will update during app usage.",
        tone: saveStatus?.status === "error" ? "guarded" : "steady",
      },
      {
        title: "Checkpoint",
        detail: checkpointManifest.checkpoint,
        meta: `Saved through ${checkpointManifest.savedThrough}. Pending: ${checkpointManifest.pendingSaveBatch}.`,
        tone: "steady",
      },
      {
        title: "Next Pack",
        detail: checkpointManifest.nextLikelyPack,
        meta: "This is the planned next implementation target.",
        tone: "steady",
      },
    ],
  };
}

import { getDevCheckSummary } from "./devChecks.js";

export function getSystemStatus(checks, saveStatus) {
  const devSummary = getDevCheckSummary(checks);
  const autosaveHealthy = saveStatus.status !== "error";

  let status = "Healthy";
  if (!devSummary.healthy || !autosaveHealthy) status = "Needs Review";
  if (devSummary.failed >= 3) status = "Attention Required";

  return {
    status,
    devSummary,
    autosaveHealthy,
    headline: status === "Healthy" ? "The Teller is operating cleanly." : "The Teller needs a review.",
    detail: `${devSummary.passed}/${devSummary.total} checks passing • Autosave ${autosaveHealthy ? "online" : "needs attention"}`,
  };
}

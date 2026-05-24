import { onboardingTracks, workers, workerTypes } from "../data/workersSeed.js";
import { documents } from "../data/documentsSeed.js";
import { approvals } from "../data/approvalsSeed.js";
import { issues } from "../data/issuesSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

export function getWorkerTypeLabel(workerTypeKey) {
  return workerTypes.find((type) => type.key === workerTypeKey)?.label || "Worker";
}

export function getTrackForWorker(worker) {
  return onboardingTracks.find((track) => track.workerType === worker.workerType) || null;
}

export function getWorkerDocuments(worker) {
  return documents.filter((document) => document.ownerType === "worker" && document.ownerId === worker.id);
}

export function getWorkerApprovals(worker) {
  return approvals.filter((approval) => approval.entityKey === worker.entityKey && approval.title.toLowerCase().includes(worker.workerType.replace("_", " ").split(" ")[0]));
}

export function getWorkerIssues(worker) {
  return issues.filter((issue) => issue.ownerType === "worker" && issue.ownerId === worker.id);
}

export function getWorkerReadiness(worker) {
  const track = getTrackForWorker(worker);
  const workerDocs = getWorkerDocuments(worker);
  const workerIssues = getWorkerIssues(worker);

  const missingDocs = workerDocs.filter((document) => ["Missing", "Needs review"].includes(document.status));
  const blockedByDocument = missingDocs.length > 0;
  const blockedByIssue = workerIssues.some((issue) => issue.status === "Open");
  const complete = worker.onboardingStatus === "Complete" && !blockedByDocument && !blockedByIssue;

  let readiness = "Needs Review";
  if (complete) readiness = "Cleared";
  if (blockedByDocument) readiness = "Document Block";
  if (blockedByIssue) readiness = "Issue Open";

  return {
    workerId: worker.id,
    track,
    workerTypeLabel: getWorkerTypeLabel(worker.workerType),
    documentCount: workerDocs.length,
    missingDocumentCount: missingDocs.length,
    issueCount: workerIssues.length,
    blockedByDocument,
    blockedByIssue,
    complete,
    readiness,
  };
}

export function getScopedOnboardingQueue(entityKey) {
  return filterRecordsByEntity(workers, entityKey).map((worker) => ({
    worker,
    readiness: getWorkerReadiness(worker),
  }));
}

export function getPayOnboardSummary(entityKey) {
  const queue = getScopedOnboardingQueue(entityKey);

  const total = queue.length;
  const cleared = queue.filter((item) => item.readiness.complete).length;
  const needsDocs = queue.filter((item) => item.readiness.blockedByDocument).length;
  const openIssues = queue.filter((item) => item.readiness.blockedByIssue).length;

  return {
    total,
    cleared,
    needsDocs,
    openIssues,
    queue,
  };
}

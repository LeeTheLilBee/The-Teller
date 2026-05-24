import { documents } from "../data/documentsSeed.js";
import { issues } from "../data/issuesSeed.js";
import { workers } from "../data/workersSeed.js";
import { getWorkerReadiness } from "./payOnboard.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeDetailCard(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getWorkerDetailSummary(entityKey) {
  const scopedWorkers = filterRecordsByEntity(workers, entityKey);

  const rows = scopedWorkers.map((worker) => {
    const readiness = getWorkerReadiness(worker);
    const workerDocs = documents.filter((document) => document.ownerId === worker.id);
    const workerIssues = issues.filter((issue) => issue.ownerId === worker.id);

    return {
      worker,
      readiness,
      docs: workerDocs,
      issues: workerIssues,
      tone: readiness.blockedByDocument || readiness.blockedByIssue ? "guarded" : "steady",
    };
  });

  const blocked = rows.filter((item) => item.readiness.blockedByDocument || item.readiness.blockedByIssue).length;
  const cleared = rows.filter((item) => item.readiness.complete).length;

  return {
    rows,
    total: rows.length,
    blocked,
    cleared,
    cards: rows.length
      ? rows.map(({ worker, readiness, docs, issues, tone }) =>
          makeDetailCard(
            worker.displayName,
            `${readiness.workerTypeLabel} • ${worker.status} • ${readiness.readiness}`,
            `${docs.length} document(s) • ${issues.length} issue(s) • ${worker.nextAction}`,
            tone
          )
        )
      : [
          makeDetailCard(
            "No workers yet",
            "This company has no worker records in this lane.",
            "Ready for first worker setup."
          ),
        ],
  };
}

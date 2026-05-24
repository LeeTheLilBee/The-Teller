import { documentRequests } from "../data/documentRequestsSeed.js";
import { documents } from "../data/documentsSeed.js";
import { workers } from "../data/workersSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeCard(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getDocumentRequestSummary(entityKey) {
  const requests = filterRecordsByEntity(documentRequests, entityKey);
  const docs = filterRecordsByEntity(documents, entityKey);

  const open = requests.filter((item) => ["Open", "Review", "Protected"].includes(item.status)).length;
  const highPriority = requests.filter((item) => ["High", "Recipient-sensitive"].includes(item.priority)).length;
  const missingDocs = docs.filter((item) => ["Missing", "Needs review"].includes(item.status)).length;

  return {
    requests,
    documents: docs,
    total: requests.length,
    open,
    highPriority,
    missingDocs,
    cards: requests.length
      ? requests.map((item) => {
          const worker = workers.find((candidate) => candidate.id === item.ownerId);
          return makeCard(
            item.title,
            `${item.requestType} • ${item.status} • ${item.priority}`,
            `${worker?.displayName || item.ownerId} • ${item.dueLabel}. ${item.nextAction}`,
            ["High", "Recipient-sensitive"].includes(item.priority) ? "guarded" : "steady"
          );
        })
      : [makeCard("No document requests", "This company has no active document requests.", "Clear")],
  };
}

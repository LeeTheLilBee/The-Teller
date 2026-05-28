
const KNOWN_WORKFLOW_KEYS = [
  "the_teller_employee_manager_queue_v1",
  "the_teller_employee_response_queue_v1",
  "the_teller_owner_escalation_queue_v1",
  "the_teller_final_resolution_packets_v1",
  "the_teller_tower_backup_queue_v1",
  "the_teller_tower_backup_items_v1",
  "the_teller_tower_access_request_inbox_v1",
];

export const WORKFLOW_STATUS_COPY = {
  submitted: {
    label: "Submitted",
    summary: "The employee sent a request into The Teller.",
    tone: "new",
  },
  manager_reviewing: {
    label: "Manager reviewing",
    summary: "The request is waiting for manager review.",
    tone: "active",
  },
  needs_info: {
    label: "Needs info",
    summary: "More information or proof is needed before the request can move forward.",
    tone: "warn",
  },
  manager_decided: {
    label: "Manager decided",
    summary: "The manager has responded to the request.",
    tone: "done",
  },
  sent_upward: {
    label: "Sent upward",
    summary: "The request was escalated for owner or Tower review.",
    tone: "upward",
  },
  owner_reviewing: {
    label: "Owner reviewing",
    summary: "The item is waiting for owner oversight.",
    tone: "active",
  },
  owner_decided: {
    label: "Owner decided",
    summary: "The owner made a decision on the escalated item.",
    tone: "done",
  },
  final_receipt: {
    label: "Final receipt created",
    summary: "A receipt packet exists for the resolved workflow.",
    tone: "receipt",
  },
  archive_ready: {
    label: "Archive ready",
    summary: "The receipt is ready for future Archive Vault handoff.",
    tone: "archive",
  },
  sealed: {
    label: "Sealed / no action needed",
    summary: "The active work is complete and no longer needs attention.",
    tone: "sealed",
  },
};

function safeRead(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function lower(value) {
  return normalizeText(value).toLowerCase();
}

function compactId(value) {
  const text = normalizeText(value);
  if (!text) return "No proof ref";

  const parts = text.split("-");
  const prefix = parts[0] || "REF";
  const tail = text.slice(-6).toUpperCase();

  return `${prefix}-${tail}`;
}

function timestampOf(item) {
  return (
    item?.createdAt ||
    item?.updatedAt ||
    item?.resolvedAt ||
    item?.archiveReadyAt ||
    item?.timestamp ||
    ""
  );
}

export function humanProofRef(value) {
  return compactId(value);
}

export function classifyWorkflowStatus(item) {
  const text = lower(JSON.stringify(item || {}));

  if (text.includes("archive vault ready") || item?.archiveReady) return "archive_ready";
  if (text.includes("final-receipt") || text.includes("final receipt") || item?.resolutionStatus) return "final_receipt";
  if (text.includes("owner approved") || text.includes("owner rejected") || text.includes("resolved")) return "owner_decided";
  if (text.includes("needs owner review")) return "owner_reviewing";
  if (text.includes("sent upward") || text.includes("escalated")) return "sent_upward";
  if (text.includes("needs proof") || text.includes("needs more info") || text.includes("more information")) return "needs_info";
  if (text.includes("approved") || text.includes("rejected") || text.includes("manager reviewed")) return "manager_decided";
  if (text.includes("needs manager review") || text.includes("managerstatus")) return "manager_reviewing";

  return "submitted";
}

export function getWorkflowStatusCopy(status) {
  return WORKFLOW_STATUS_COPY[status] || WORKFLOW_STATUS_COPY.submitted;
}

export function buildWorkflowItem(source, item, fallbackTitle = "Workflow item") {
  const status = classifyWorkflowStatus(item);
  const copy = getWorkflowStatusCopy(status);
  const id = item?.id || item?.requestId || item?.sourceRequestId || item?.sourceEscalationId || `${source}-${Math.random()}`;

  return {
    id,
    source,
    proofRef: humanProofRef(id),
    title:
      item?.title ||
      item?.target ||
      item?.action ||
      item?.requestedAccess ||
      item?.resolutionStatus ||
      fallbackTitle,
    body:
      item?.body ||
      item?.summary ||
      item?.reason ||
      item?.ownerNote ||
      item?.managerResponse ||
      copy.summary,
    employeeName: item?.employeeName || item?.requestedBy || item?.payload?.employeeName || "Unassigned",
    businessKey: item?.businessKey || item?.payload?.businessKey || "simpleepay",
    status,
    statusLabel: copy.label,
    statusSummary: copy.summary,
    tone: copy.tone,
    createdAt: timestampOf(item),
    raw: item,
  };
}

export function readWorkflowLifecycleItems() {
  if (typeof window === "undefined") return [];

  const buckets = [];

  KNOWN_WORKFLOW_KEYS.forEach((key) => {
    safeRead(key).forEach((item) => {
      buckets.push(buildWorkflowItem(key, item));
    });
  });

  const deduped = [];
  const seen = new Set();

  buckets.forEach((item) => {
    const key = `${item.source}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped.sort((a, b) => {
    const bTime = new Date(b.createdAt || 0).getTime();
    const aTime = new Date(a.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export function getRoleWorkflowItems(role = "all", employeeName = "") {
  const items = readWorkflowLifecycleItems();

  if (role === "employee" && employeeName) {
    return items.filter((item) => item.employeeName === employeeName || item.employeeName === "Unassigned");
  }

  if (role === "manager") {
    return items.filter((item) => {
      return [
        "submitted",
        "manager_reviewing",
        "needs_info",
        "manager_decided",
        "sent_upward",
      ].includes(item.status);
    });
  }

  if (role === "owner") {
    return items.filter((item) => {
      return [
        "sent_upward",
        "owner_reviewing",
        "owner_decided",
        "final_receipt",
        "archive_ready",
      ].includes(item.status);
    });
  }

  if (role === "tower") {
    return items.filter((item) => {
      const text = lower(`${item.source} ${item.title} ${item.body}`);
      return text.includes("tower") || text.includes("receipt") || text.includes("archive") || text.includes("owner");
    });
  }

  return items;
}

export function getWorkflowCounts(items = []) {
  return items.reduce((acc, item) => {
    acc.total += 1;
    acc[item.status] = (acc[item.status] || 0) + 1;

    if (["submitted", "manager_reviewing", "needs_info", "sent_upward", "owner_reviewing"].includes(item.status)) {
      acc.active += 1;
    } else {
      acc.closed += 1;
    }

    return acc;
  }, {
    total: 0,
    active: 0,
    closed: 0,
  });
}

export function getWorkflowEmptyState(role) {
  if (role === "employee") {
    return {
      title: "No workflow history yet.",
      body: "Requests, manager replies, owner decisions, receipts, and archive-ready records will show here once they exist.",
      next: "Submit a request when you need help, proof, or a Tower-backed record.",
    };
  }

  if (role === "manager") {
    return {
      title: "No manager workflow records yet.",
      body: "Employee requests, follow-ups, proof needs, and sent-upward items will show here.",
      next: "When employees send requests, this timeline will explain where each one stands.",
    };
  }

  if (role === "owner") {
    return {
      title: "No owner workflow records yet.",
      body: "Only escalations, owner decisions, receipts, and archive-ready records appear here.",
      next: "When a manager sends something upward, owner oversight will activate.",
    };
  }

  if (role === "tower") {
    return {
      title: "No Tower lifecycle records yet.",
      body: "Tower backups, formal receipts, clearance requests, and archive-prep records will appear here.",
      next: "As workflows move through The Teller, Tower proof will collect automatically.",
    };
  }

  return {
    title: "No workflow records yet.",
    body: "Lifecycle records will appear once work begins.",
    next: "Start a request or decision flow to generate records.",
  };
}

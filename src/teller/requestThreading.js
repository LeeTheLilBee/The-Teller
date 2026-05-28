
const THREAD_KEYS = [
  "the_teller_employee_manager_queue_v1",
  "the_teller_employee_response_queue_v1",
  "the_teller_owner_escalation_queue_v1",
  "the_teller_final_resolution_packets_v1",
  "the_teller_tower_backup_queue_v1",
  "the_teller_tower_backup_items_v1",
  "the_teller_tower_access_request_inbox_v1",
];

function safeRead(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function text(value) {
  return String(value || "").trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

export function shortProofRef(value, fallback = "PROOF") {
  const raw = text(value);
  if (!raw) return `${fallback}-PENDING`;

  const clean = raw.replace(/[^a-zA-Z0-9-]/g, "");
  const prefix = clean.split("-")[0] || fallback;
  const tail = clean.slice(-6).toUpperCase();

  return `${prefix}-${tail || "REF"}`;
}

function getTime(item) {
  return (
    item?.createdAt ||
    item?.updatedAt ||
    item?.resolvedAt ||
    item?.archiveReadyAt ||
    item?.timestamp ||
    ""
  );
}

function getEmployeeName(item) {
  return (
    item?.employeeName ||
    item?.requestedBy ||
    item?.payload?.employeeName ||
    item?.sourceRequest?.employeeName ||
    item?.payload?.followUp?.employeeName ||
    item?.payload?.escalation?.employeeName ||
    "Employee"
  );
}

function getBusinessKey(item) {
  return (
    item?.businessKey ||
    item?.payload?.businessKey ||
    item?.sourceRequest?.businessKey ||
    item?.payload?.followUp?.businessKey ||
    item?.payload?.escalation?.businessKey ||
    "simpleepay"
  );
}

function getPrimaryId(item) {
  return (
    item?.id ||
    item?.requestId ||
    item?.parentRequestId ||
    item?.sourceRequestId ||
    item?.sourceEscalationId ||
    item?.ownerEscalationId ||
    item?.finalPacketId ||
    item?.towerBackupId ||
    ""
  );
}

function collectIds(item, into = new Set()) {
  if (!item || typeof item !== "object") return into;

  [
    "id",
    "requestId",
    "parentRequestId",
    "parentResponseId",
    "sourceRequestId",
    "sourceEscalationId",
    "ownerEscalationId",
    "finalPacketId",
    "towerBackupId",
    "archiveTowerBackupId",
  ].forEach((key) => {
    if (item[key]) into.add(String(item[key]));
  });

  if (item.payload && typeof item.payload === "object") collectIds(item.payload, into);
  if (item.sourceRequest && typeof item.sourceRequest === "object") collectIds(item.sourceRequest, into);
  if (item.escalation && typeof item.escalation === "object") collectIds(item.escalation, into);
  if (item.followUp && typeof item.followUp === "object") collectIds(item.followUp, into);
  if (item.managerResponse && typeof item.managerResponse === "object") collectIds(item.managerResponse, into);
  if (item.response && typeof item.response === "object") collectIds(item.response, into);

  return into;
}

function inferActor(source, item) {
  const joined = lower(`${source} ${item?.source || ""} ${item?.action || ""} ${item?.title || ""} ${item?.resolutionStatus || ""}`);

  if (joined.includes("employee_response") || joined.includes("employee_portal") || joined.includes("emp-followup")) return "Employee";
  if (joined.includes("manager") || joined.includes("mgr")) return "Manager";
  if (joined.includes("owner") || joined.includes("final-receipt")) return "Owner";
  if (joined.includes("tower") || joined.includes("archive")) return "Tower";

  return "The Teller";
}

function inferStage(source, item) {
  const joined = lower(JSON.stringify(item || {}));
  const sourceText = lower(source);

  if (joined.includes("archive vault ready") || item?.archiveReady) {
    return {
      key: "archive_ready",
      label: "Archive ready",
      tone: "archive",
      next: "No action needed. This is ready for future Archive Vault handoff.",
    };
  }

  if (sourceText.includes("final_resolution") || joined.includes("final-receipt") || item?.resolutionStatus) {
    return {
      key: "final_receipt",
      label: "Final receipt",
      tone: "receipt",
      next: item?.archiveReady ? "Archive-ready." : "Archive prep is the next step if owner wants to seal it fully.",
    };
  }

  if (sourceText.includes("owner_escalation") || joined.includes("needs owner review")) {
    return {
      key: "owner_review",
      label: "Owner review",
      tone: "owner",
      next: "Owner should approve, reject, return, or resolve this item.",
    };
  }

  if (joined.includes("sent upward") || joined.includes("escalated")) {
    return {
      key: "sent_upward",
      label: "Sent upward",
      tone: "upward",
      next: "This is waiting for owner or Tower review.",
    };
  }

  if (joined.includes("needs proof") || joined.includes("needs more info") || joined.includes("more information")) {
    return {
      key: "needs_info",
      label: "Needs info",
      tone: "warn",
      next: "Employee should add the missing information or proof.",
    };
  }

  if (sourceText.includes("employee_response") || joined.includes("manager responded") || joined.includes("owner reviewed")) {
    return {
      key: "response",
      label: "Response sent",
      tone: "response",
      next: "Employee can review this response or add more information if needed.",
    };
  }

  if (sourceText.includes("tower_backup") || joined.includes("tower backup")) {
    return {
      key: "tower_backup",
      label: "Tower backup",
      tone: "tower",
      next: "This proof item is backed up for Tower/Archive review.",
    };
  }

  return {
    key: "submitted",
    label: "Submitted",
    tone: "new",
    next: "Manager review is the next step.",
  };
}

function titleOf(source, item) {
  return (
    item?.title ||
    item?.target ||
    item?.action ||
    item?.requestedAccess ||
    item?.resolutionStatus ||
    inferStage(source, item).label
  );
}

function bodyOf(source, item) {
  return (
    item?.body ||
    item?.summary ||
    item?.reason ||
    item?.managerResponse ||
    item?.ownerNote ||
    item?.payload?.managerNote ||
    item?.payload?.decision?.managerNote ||
    inferStage(source, item).next
  );
}

export function readAllThreadItems() {
  if (typeof window === "undefined") return [];

  const rows = [];

  THREAD_KEYS.forEach((key) => {
    safeRead(key).forEach((item) => {
      const stage = inferStage(key, item);
      const id = getPrimaryId(item) || `${key}-${Math.random()}`;

      rows.push({
        id,
        sourceKey: key,
        proofRef: shortProofRef(id),
        actor: inferActor(key, item),
        stageKey: stage.key,
        stageLabel: stage.label,
        tone: stage.tone,
        title: titleOf(key, item),
        body: bodyOf(key, item),
        employeeName: getEmployeeName(item),
        businessKey: getBusinessKey(item),
        createdAt: getTime(item),
        next: stage.next,
        raw: item,
        ids: Array.from(collectIds(item)),
      });
    });
  });

  return rows.sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return aTime - bTime;
  });
}

export function buildRequestThread(seed = {}, options = {}) {
  const seedIds = collectIds(seed);
  const seedEmployee = getEmployeeName(seed);
  const seedBusiness = getBusinessKey(seed);
  const all = readAllThreadItems();

  const related = all.filter((item) => {
    if (options.employeeName && item.employeeName === options.employeeName) return true;

    const hasSharedId = item.ids.some((id) => seedIds.has(String(id)));
    if (hasSharedId) return true;

    if (seedEmployee && seedEmployee !== "Employee" && item.employeeName === seedEmployee && item.businessKey === seedBusiness) {
      return true;
    }

    return false;
  });

  const deduped = [];
  const seen = new Set();

  related.forEach((item) => {
    const key = `${item.sourceKey}:${item.id}:${item.stageKey}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped;
}

export function getThreadSummary(thread = []) {
  const hasArchive = thread.some((item) => item.stageKey === "archive_ready");
  const hasReceipt = thread.some((item) => item.stageKey === "final_receipt");
  const hasOwner = thread.some((item) => item.stageKey === "owner_review" || item.actor === "Owner");
  const hasNeedsInfo = thread.some((item) => item.stageKey === "needs_info");
  const hasUpward = thread.some((item) => item.stageKey === "sent_upward");

  if (hasArchive) {
    return {
      label: "Sealed / archive ready",
      tone: "archive",
      body: "This thread has a receipt and is ready for Archive Vault handoff.",
      next: "No action needed unless someone reopens it.",
    };
  }

  if (hasReceipt) {
    return {
      label: "Resolved, archive prep pending",
      tone: "receipt",
      body: "This thread has a final receipt. Archive readiness is the remaining seal step.",
      next: "Owner can mark Archive Vault ready if appropriate.",
    };
  }

  if (hasOwner) {
    return {
      label: "Owner review path",
      tone: "owner",
      body: "This thread reached owner oversight.",
      next: "Owner decision or final receipt should close the loop.",
    };
  }

  if (hasUpward) {
    return {
      label: "Sent upward",
      tone: "upward",
      body: "Manager sent this item upward for owner or Tower review.",
      next: "Owner/Tower review is next.",
    };
  }

  if (hasNeedsInfo) {
    return {
      label: "Needs information",
      tone: "warn",
      body: "The request is waiting on proof, clarification, or follow-up.",
      next: "Employee should add the missing information.",
    };
  }

  if (thread.length) {
    return {
      label: "In progress",
      tone: "active",
      body: "This request thread has started and is moving through The Teller.",
      next: "The next role should respond or review.",
    };
  }

  return {
    label: "No connected thread yet",
    tone: "quiet",
    body: "No connected records were found yet.",
    next: "The thread will build as requests, responses, receipts, and backups are created.",
  };
}

import { formatIntentTime } from "./workflowIntents.js";

export function createActionReceipt(intent) {
  return {
    id: `receipt-${intent.id}`,
    intentId: intent.id,
    actionLabel: intent.actionLabel,
    intentTypeLabel: intent.intentTypeLabel,
    severity: intent.severity,
    tone: intent.tone,
    entityKey: intent.entityKey,
    entityLabel: intent.entityLabel,
    drawer: intent.drawer,
    recordTitle: intent.recordTitle,
    reason: intent.reason || "",
    status: "Local receipt captured",
    createdAt: intent.createdAt,
    humanTime: formatIntentTime(intent.createdAt),
  };
}

export function buildReceiptSummary(receipts = []) {
  const guarded = receipts.filter((receipt) => ["High", "Protected"].includes(receipt.severity)).length;
  const withReason = receipts.filter((receipt) => receipt.reason).length;
  const companies = new Set(receipts.map((receipt) => receipt.entityKey)).size;

  return {
    total: receipts.length,
    guarded,
    withReason,
    companies,
    latest: receipts[0] || null,
  };
}

export function getReceiptTone(receipt) {
  if (!receipt) return "steady";
  if (receipt.severity === "Protected") return "blocked";
  if (receipt.severity === "High") return "guarded";
  if (receipt.severity === "Medium") return "watch";
  return "steady";
}

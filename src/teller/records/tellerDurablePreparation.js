/*
 * Teller record acceptance boundary.
 *
 * A prepared form is not a durable record until the authenticated API
 * acknowledges its save. This module has no browser storage, signing
 * secrets, money movement or direct Vault access.
 */

function clean(value) {
  return String(value ?? "").trim();
}

export function tellerRecordScopeKey(session) {
  if (!session || typeof session !== "object") return "";
  const actor = session.actor || {};
  const business = session.business || {};
  return [
    session.sessionId || session.session_id || session.tower_session_id || "",
    session.towerReceiptId || session.tower_receipt_id || "",
    actor.id || actor.actor_id || actor.actorId || "",
    business.key || business.business_key || business.businessKey || "",
    session.role || "",
  ].map(clean).join("|");
}

export function mergeTellerDurableRecords(current = [], hydrated = [], limit = 250) {
  // Preserve already-acknowledged session records if an older hydration
  // snapshot arrives after a concurrent save. Do not infer durability here:
  // callers must pass only previously accepted, scope-matched records.
  const records = new Map();
  for (const record of [...hydrated, ...current]) {
    const id = clean(record?.record_id);
    if (!id) continue;
    const previous = records.get(id);
    const prevRevision = Number(previous?.persistence_revision || 0);
    const nextRevision = Number(record?.persistence_revision || 0);
    if (!previous || nextRevision >= prevRevision) records.set(id, record);
  }
  return [...records.values()].slice(0, limit);
}

export async function resolveTellerPreparedRecord({
  record,
  readRecords,
  validateRecord,
  findDuplicate,
  pendingIds,
  transport,
  hostedSession = false,
  expectedScopeKey = "",
  readScopeKey = () => expectedScopeKey,
} = {}) {
  const id = clean(record?.record_id);
  if (!id) return { accepted: false, status: "record_id_missing" };

  const validation = validateRecord?.(record);
  if (!validation?.valid) {
    return {
      accepted: false,
      status: "validation_failed",
      problemCount: validation?.problems?.length || 0,
    };
  }

  const existing = readRecords?.() || [];
  const duplicate = findDuplicate?.(existing, record);
  if (duplicate) {
    return {
      accepted: false,
      status: "duplicate",
      duplicateOf: clean(duplicate.record_id),
    };
  }

  if (!pendingIds || typeof pendingIds.has !== "function") {
    return { accepted: false, status: "pending_tracking_unavailable" };
  }

  if (pendingIds.has(id)) {
    return { accepted: false, status: "submission_in_progress" };
  }

  if (readScopeKey() !== expectedScopeKey) {
    return { accepted: false, status: "tower_identity_changed" };
  }

  const connected = transport?.connected === true;
  if (hostedSession && !connected) {
    return { accepted: false, status: "authenticated_repository_unavailable" };
  }

  pendingIds.add(id);
  try {
    if (!connected) {
      if (readScopeKey() !== expectedScopeKey) {
        return { accepted: false, status: "tower_identity_changed" };
      }
      return {
        accepted: true,
        durable: false,
        status: "session_only",
        record,
      };
    }

    const result = await transport.saveRecord(record);
    const acknowledged = result?.record;
    if (
      !acknowledged ||
      clean(acknowledged.record_id) !== id
    ) {
      return { accepted: false, status: "invalid_durable_ack" };
    }

    if (readScopeKey() !== expectedScopeKey) {
      // The server may have saved under the old authorized scope; do not
      // inject its response into the newly selected actor/business view.
      return { accepted: false, status: "tower_identity_changed" };
    }

    return {
      accepted: true,
      durable: true,
      status: "durable",
      record: acknowledged,
      idempotentReplay: result?.idempotent_replay === true,
    };
  } catch {
    // Keep the draft for retry. The API's idempotency contract handles an
    // ambiguous save acknowledgement without inventing a successful write.
    return { accepted: false, status: "persistence_failed" };
  } finally {
    pendingIds.delete(id);
  }
}

import {
  sanitizeTellerRecordPayload,
} from "../../../src/teller/records/tellerRecordSchema.js";


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function iso(
  value
) {
  if (!value) {
    return "";
  }


  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }


  return String(
    value
  );
}


function jsonEqual(
  left,
  right
) {
  return (
    JSON.stringify(left) ===
    JSON.stringify(right)
  );
}


export function assertPersistableTellerRecord(
  record,
  scope
) {
  if (!record?.record_id) {
    throw new Error(
      "Persisted Teller record requires record_id."
    );
  }


  if (!record?.record_version) {
    throw new Error(
      "Persisted Teller record requires record_version."
    );
  }


  if (!record?.source) {
    throw new Error(
      "Persisted Teller record requires source."
    );
  }


  if (!record?.record_status) {
    throw new Error(
      "Persisted Teller record requires record_status."
    );
  }


  const recordBusiness =
    clean(
      record.business_key
    );


  const scopeBusiness =
    clean(
      scope?.businessKey
    );


  if (
    !recordBusiness ||
    recordBusiness !== scopeBusiness
  ) {
    throw new Error(
      "Teller record business does not match the authorized persistence scope."
    );
  }


  const rawPayload =
    record.payload || {};


  const sanitizedPayload =
    sanitizeTellerRecordPayload(
      rawPayload
    );


  if (
    !jsonEqual(
      rawPayload,
      sanitizedPayload
    )
  ) {
    throw new Error(
      "Forbidden sensitive fields reached the Teller persistence boundary."
    );
  }


  return true;
}


export function buildSafeTellerSearchText(
  record
) {
  const projection =
    record?.search_projection || {};


  return [
    projection.title,
    projection.form_id,
    projection.workflow_type,
    projection.category,
    projection.business_key,
    projection.record_status,
    record?.record_id,
  ]
    .filter(Boolean)
    .map(
      (value) =>
        clean(value)
    )
    .join(" ")
    .toLowerCase();
}


export function serializeTellerRecordForPersistence(
  record,
  scope,
  {
    idempotencyKey = "",
  } = {}
) {
  assertPersistableTellerRecord(
    record,
    scope
  );


  const safePayload =
    sanitizeTellerRecordPayload(
      record.payload || {}
    );


  const sourceId =
    clean(
      record.source_id
    );


  const fingerprint =
    clean(
      record
        ?.integrity
        ?.submission_fingerprint
    );


  const resolvedIdempotencyKey =
    clean(
      idempotencyKey
    ) ||
    sourceId ||
    fingerprint ||
    clean(
      record.record_id
    );


  if (!resolvedIdempotencyKey) {
    throw new Error(
      "Teller persistence requires an idempotency key."
    );
  }


  return Object.freeze({
    business_key:
      clean(
        scope.businessKey
      ),

    record_id:
      clean(
        record.record_id
      ),

    schema_version:
      clean(
        record.record_version
      ),

    source:
      clean(
        record.source
      ),

    source_id:
      sourceId,

    form_id:
      clean(
        record.form_id
      ),

    workflow_type:
      clean(
        record.workflow_type
      ),

    category:
      clean(
        record.category
      ),

    title:
      clean(
        record.title
      ),

    actor_role:
      clean(
        record.actor_role ||
        scope.actorRole
      ),

    record_status:
      clean(
        record.record_status
      ),

    payload:
      safePayload,

    search_projection: {
      ...(
        record.search_projection ||
        {}
      ),
    },

    integrity: {
      ...(
        record.integrity ||
        {}
      ),
    },

    submission_fingerprint:
      fingerprint,

    idempotency_key:
      resolvedIdempotencyKey,

    search_text:
      buildSafeTellerSearchText(
        record
      ),

    created_at:
      iso(
        record.created_at
      ) ||
      new Date().toISOString(),

    updated_at:
      iso(
        record.updated_at
      ) ||
      new Date().toISOString(),
  });
}


export function deserializePersistedTellerRecord(
  row,
  {
    auditHistory = [],
    auditHistoryLoaded = true,
  } = {}
) {
  if (!row) {
    return null;
  }


  return Object.freeze({
    record_version:
      row.schema_version,

    persistence_revision:
      Number(
        row.revision
      ),

    record_id:
      row.record_id,

    source:
      row.source,

    source_id:
      row.source_id,

    form_id:
      row.form_id,

    workflow_type:
      row.workflow_type,

    category:
      row.category,

    title:
      row.title,

    business_key:
      row.business_key,

    actor_role:
      row.actor_role,

    record_status:
      row.record_status,

    payload:
      row.payload || {},

    search_projection:
      row.search_projection || {},

    integrity:
      row.integrity || {},

    audit_history:
      auditHistory,

    audit_history_loaded:
      Boolean(
        auditHistoryLoaded
      ),

    persistence: {
      session_memory:
        false,

      production_repository_connected:
        true,

      production_persisted:
        true,
    },

    created_at:
      iso(
        row.created_at
      ),

    updated_at:
      iso(
        row.updated_at
      ),
  });
}

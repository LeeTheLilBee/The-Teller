import assert
  from "node:assert/strict";

import {
  createTellerRecordEnvelope,
} from "../src/teller/records/tellerRecordSchema.js";

import {
  createPostgresTellerRecordRepository,
} from "../server/teller/persistence/tellerPostgresRecordRepository.js";

import {
  serializeTellerRecordForPersistence,
} from "../server/teller/persistence/tellerRecordPersistenceSerializer.js";

import {
  readTellerPersistenceConfig,
} from "../server/teller/persistence/tellerPersistenceConfig.js";

import {
  assertTellerPersistenceScope,
} from "../server/teller/persistence/tellerPersistenceScope.js";

import {
  hydrateTellerRecords,
} from "../src/teller/persistence/tellerPersistenceHydration.js";


const scope = {
  businessKey:
    "simplee_world",

  actorId:
    "owner_001",

  actorRole:
    "owner",

  towerSessionId:
    "tower_session_001",
};


const baseRecord =
  createTellerRecordEnvelope({
    record_id:
      "teller_record_contract_001",

    source:
      "form",

    source_id:
      "submission_contract_001",

    form_id:
      "invoice_intake",

    workflow_type:
      "invoice_intake",

    category:
      "money",

    title:
      "Invoice Intake",

    business_key:
      "simplee_world",

    actor_role:
      "owner",

    payload: {
      values: {
        vendor_name:
          "Contract Vendor",

        invoice_number:
          "INV-001",

        total:
          "125.00",
      },
    },
  });


const record = {
  ...baseRecord,

  integrity: {
    submission_fingerprint:
      "submission_fp_contract_001",
  },
};


// ============================================================================================================
// FAIL-CLOSED CONFIG
// ============================================================================================================

const disabledConfig =
  readTellerPersistenceConfig(
    {}
  );


assert.equal(
  disabledConfig.configured,
  false
);


assert.equal(
  disabledConfig.enabled,
  false
);


// ============================================================================================================
// SCOPE
// ============================================================================================================

const trustedScope =
  assertTellerPersistenceScope(
    scope
  );


assert.equal(
  trustedScope.businessKey,
  "simplee_world"
);


assert.throws(
  () =>
    assertTellerPersistenceScope({
      ...scope,
      businessKey:
        "",
    })
);


// ============================================================================================================
// SERIALIZATION
// ============================================================================================================

const serialized =
  serializeTellerRecordForPersistence(
    record,
    trustedScope
  );


assert.equal(
  serialized.business_key,
  "simplee_world"
);


assert.equal(
  serialized.idempotency_key,
  "submission_contract_001"
);


assert.equal(
  serialized.search_text.includes(
    "contract vendor"
  ),
  false,
  "Raw payload values must not enter safe search text."
);


assert.equal(
  serialized.search_text.includes(
    "invoice intake"
  ),
  true
);


assert.throws(
  () =>
    serializeTellerRecordForPersistence(
      {
        ...record,

        payload: {
          values: {
            ssn:
              "000-00-0000",
          },
        },
      },
      trustedScope
    ),
  /Forbidden sensitive fields/
);


// ============================================================================================================
// FAKE POSTGRES TRANSPORT
// ============================================================================================================

function persistentRow(
  revision = 1
) {
  return {
    business_key:
      serialized.business_key,

    record_id:
      serialized.record_id,

    schema_version:
      serialized.schema_version,

    revision,

    source:
      serialized.source,

    source_id:
      serialized.source_id,

    form_id:
      serialized.form_id,

    workflow_type:
      serialized.workflow_type,

    category:
      serialized.category,

    title:
      serialized.title,

    actor_role:
      serialized.actor_role,

    record_status:
      serialized.record_status,

    payload:
      serialized.payload,

    search_projection:
      serialized.search_projection,

    integrity:
      serialized.integrity,

    submission_fingerprint:
      serialized.submission_fingerprint,

    idempotency_key:
      serialized.idempotency_key,

    search_text:
      serialized.search_text,

    created_at:
      new Date(
        serialized.created_at
      ),

    updated_at:
      new Date(
        serialized.updated_at
      ),
  };
}


class FakeClient {
  constructor() {
    this.queries = [];
    this.released = false;
    this.updateConflict = false;
  }


  async query(
    text,
    params = []
  ) {
    const compact =
      String(text)
        .replace(/\s+/g, " ")
        .trim();


    this.queries.push({
      text:
        compact,

      params,
    });


    if (
      compact === "BEGIN" ||
      compact === "COMMIT" ||
      compact === "ROLLBACK"
    ) {
      return {
        rows:
          [],
      };
    }


    if (
      compact.startsWith(
        "SELECT set_config"
      )
    ) {
      return {
        rows:
          [],
      };
    }


    if (
      compact.startsWith(
        "INSERT INTO teller_record_events"
      )
    ) {
      return {
        rows:
          [],
      };
    }


    if (
      compact.includes(
        "FROM teller_record_events"
      )
    ) {
      return {
        rows: [
          {
            event_id:
              "event_001",

            event_type:
              "record_prepared",

            actor_role:
              "owner",

            note:
              "",

            metadata:
              {},

            created_at:
              new Date(
                "2026-09-17T12:00:00.000Z"
              ),
          },
        ],
      };
    }


    if (
      compact.startsWith(
        "INSERT INTO teller_records"
      )
    ) {
      return {
        rows: [
          persistentRow(
            1
          ),
        ],
      };
    }


    if (
      compact.startsWith(
        "UPDATE teller_records"
      )
    ) {
      if (
        this.updateConflict
      ) {
        return {
          rows:
            [],
        };
      }


      return {
        rows: [
          persistentRow(
            2
          ),
        ],
      };
    }


    if (
      compact.startsWith(
        "SELECT revision FROM teller_records"
      )
    ) {
      return {
        rows: [
          {
            revision:
              2,
          },
        ],
      };
    }


    if (
      compact.startsWith(
        "SELECT * FROM teller_records"
      )
    ) {
      return {
        rows: [
          persistentRow(
            1
          ),
        ],
      };
    }


    throw new Error(
      `Unexpected fake SQL: ${compact}`
    );
  }


  release() {
    this.released =
      true;
  }
}


class FakePool {
  constructor() {
    this.client =
      new FakeClient();
  }


  async connect() {
    return this.client;
  }
}


const pool =
  new FakePool();


const repository =
  createPostgresTellerRecordRepository({
    pool,
  });


assert.equal(
  repository.configured,
  true
);


assert.equal(
  repository.persistent,
  true
);


// ============================================================================================================
// SAVE
// ============================================================================================================

const saved =
  await repository.saveRecord({
    scope,
    record,
  });


assert.equal(
  saved.persisted,
  true
);


assert.equal(
  saved.record.persistence
    .production_persisted,
  true
);


assert.equal(
  saved.record.persistence_revision,
  1
);


assert.ok(
  pool.client.queries.some(
    ({ text }) =>
      text.includes(
        "app.teller_business_key"
      )
  ),
  "Business isolation context was not installed."
);


// ============================================================================================================
// GET
// ============================================================================================================

const loaded =
  await repository.getRecord({
    scope,
    recordId:
      record.record_id,
  });


assert.equal(
  loaded.status,
  "ready"
);


assert.equal(
  loaded.record.record_id,
  record.record_id
);


// ============================================================================================================
// SAFE SEARCH
// ============================================================================================================

const searched =
  await repository.searchRecords({
    scope,

    query: {
      text:
        "invoice",

      category:
        "money",

      status:
        "prepared",

      limit:
        50,
    },
  });


assert.equal(
  searched.status,
  "ready"
);


assert.equal(
  searched.records.length,
  1
);


const searchSql =
  pool.client.queries
    .map(
      (entry) =>
        entry.text
    )
    .find(
      (text) =>
        text.includes(
          "search_text LIKE"
        )
    );


assert.ok(
  searchSql,
  "Safe search SQL was not executed."
);


assert.equal(
  searchSql.includes(
    "payload"
  ),
  false,
  "Search SQL must not search raw payload."
);


// ============================================================================================================
// OPTIMISTIC REVISION UPDATE
// ============================================================================================================

const updated =
  await repository.updateRecord({
    scope,
    record,
    expectedRevision:
      1,
  });


assert.equal(
  updated.status,
  "ready"
);


assert.equal(
  updated.record.persistence_revision,
  2
);


// ============================================================================================================
// CONFLICT
// ============================================================================================================

pool.client.updateConflict =
  true;


const conflict =
  await repository.updateRecord({
    scope,
    record,
    expectedRevision:
      1,
  });


assert.equal(
  conflict.status,
  "conflict"
);


assert.equal(
  conflict.current_revision,
  2
);


// ============================================================================================================
// HYDRATION FAIL-CLOSED
// ============================================================================================================

const disconnectedHydration =
  await hydrateTellerRecords({
    repository: {
      configured:
        false,

      persistent:
        false,
    },

    scope,
  });


assert.equal(
  disconnectedHydration.status,
  "not_connected"
);


const hydrated =
  await hydrateTellerRecords({
    repository: {
      configured:
        true,

      persistent:
        true,

      async searchRecords() {
        return {
          status:
            "ready",

          records: [
            saved.record,
          ],
        };
      },
    },

    scope,
  });


assert.equal(
  hydrated.status,
  "ready"
);


assert.equal(
  hydrated.hydrated,
  true
);


assert.equal(
  hydrated.records.length,
  1
);


console.log(
  "TINT001-TINT010 EXECUTABLE PERSISTENCE CONTRACT TEST PASSED"
);

console.log(
  "Fail-closed config: passed"
);

console.log(
  "Tower-derived business scope: passed"
);

console.log(
  "Sensitive-field persistence rejection: passed"
);

console.log(
  "Safe search projection: passed"
);

console.log(
  "PostgreSQL repository save/get/search: passed"
);

console.log(
  "Optimistic revision update: passed"
);

console.log(
  "Revision conflict response: passed"
);

console.log(
  "Business RLS transaction context: passed"
);

console.log(
  "Reload hydration contract: passed"
);

import assert
  from "node:assert/strict";

import {
  randomUUID,
} from "node:crypto";

import {
  createTellerPostgresPool,
} from "../server/teller/persistence/tellerPostgresPool.js";

import {
  createPostgresTellerRecordRepository,
} from "../server/teller/persistence/tellerPostgresRecordRepository.js";

import {
  createTellerRecordEnvelope,
} from "../src/teller/records/tellerRecordSchema.js";

import {
  appendTellerRecordHistory,
  createTellerRecordHistoryEvent,
} from "../src/teller/records/tellerRecordHistory.js";


const proofId =
  randomUUID()
    .replaceAll(
      "-",
      ""
    )
    .slice(
      0,
      18
    );


const businessKey =
  "simplee_world_staging";


const recordId =
  `teller_live_proof_${proofId}`;


const sourceId =
  `teller_live_submission_${proofId}`;


const scope = {
  businessKey,

  actorId:
    "owner_live_persistence_certification",

  actorRole:
    "owner",

  towerSessionId:
    `tower_staging_persistence_${proofId}`,
};


function makeRecord() {
  const base =
    createTellerRecordEnvelope({
      record_id:
        recordId,

      source:
        "system",

      source_id:
        sourceId,

      form_id:
        "persistence_certification",

      workflow_type:
        "live_persistence_certification",

      category:
        "integration_test",

      title:
        "Teller Live Persistence Certification",

      business_key:
        businessKey,

      actor_role:
        "owner",

      payload: {
        certification: {
          pack:
            "TINT011-TINT020",

          staging_only:
            true,

          proof_id:
            proofId,
        },
      },
    });


  return {
    ...base,

    integrity: {
      submission_fingerprint:
        `live_fp_${proofId}`,
    },
  };
}


const originalRecord =
  makeRecord();


let firstPool =
  null;

let secondPool =
  null;

let thirdPool =
  null;


try {
  // ==========================================================================================================
  // TINT015 — REAL WRITE
  // ==========================================================================================================

  firstPool =
    createTellerPostgresPool();


  const firstRepository =
    createPostgresTellerRecordRepository({
      pool:
        firstPool,
    });


  const firstSave =
    await firstRepository.saveRecord({
      scope,

      record:
        originalRecord,
    });


  assert.equal(
    firstSave.status,
    "ready"
  );


  assert.equal(
    firstSave.persisted,
    true
  );


  assert.equal(
    firstSave.created,
    true
  );


  assert.equal(
    firstSave.record
      .persistence
      .production_persisted,
    true
  );


  assert.equal(
    firstSave.record
      .persistence_revision,
    1
  );


  console.log(
    "TINT015 real durable write: PASSED"
  );


  // ==========================================================================================================
  // CLOSE FIRST CONNECTION COMPLETELY
  // ==========================================================================================================

  await firstPool.end();

  firstPool =
    null;


  console.log(
    "First PostgreSQL pool closed."
  );


  // ==========================================================================================================
  // TINT016 — BRAND NEW CONNECTION + LOAD SAME RECORD
  // ==========================================================================================================

  secondPool =
    createTellerPostgresPool();


  const secondRepository =
    createPostgresTellerRecordRepository({
      pool:
        secondPool,
    });


  const afterReconnect =
    await secondRepository.getRecord({
      scope,

      recordId,
    });


  assert.equal(
    afterReconnect.status,
    "ready"
  );


  assert.equal(
    afterReconnect.record
      .record_id,
    recordId
  );


  assert.equal(
    afterReconnect.record
      .payload
      ?.certification
      ?.proof_id,
    proofId
  );


  assert.equal(
    afterReconnect.record
      .persistence
      .production_persisted,
    true
  );


  console.log(
    "TINT016 disconnect/reconnect durability: PASSED"
  );


  // ==========================================================================================================
  // TINT017 — IDEMPOTENT REPLAY
  // ==========================================================================================================

  const replay =
    await secondRepository.saveRecord({
      scope,

      record:
        originalRecord,
    });


  assert.equal(
    replay.status,
    "ready"
  );


  assert.equal(
    replay.persisted,
    true
  );


  assert.equal(
    replay.created,
    false
  );


  assert.equal(
    replay.idempotent_replay,
    true
  );


  assert.equal(
    replay.record
      .record_id,
    recordId
  );


  console.log(
    "TINT017 idempotent replay: PASSED"
  );


  // ==========================================================================================================
  // TINT018 — REVISION UPDATE + STALE REVISION CONFLICT
  // ==========================================================================================================

  const updateEvent =
    createTellerRecordHistoryEvent({
      event:
        "live_persistence_certified",

      actor_role:
        "owner",

      note:
        "Real Render PostgreSQL durability proved.",
  });


  const updatedRecord =
    appendTellerRecordHistory(
      {
        ...afterReconnect.record,

        record_status:
          "approved",

        search_projection: {
          ...afterReconnect.record
            .search_projection,

          record_status:
            "approved",
        },

        updated_at:
          updateEvent.at,
      },
      updateEvent
    );


  const update =
    await secondRepository.updateRecord({
      scope,

      record:
        updatedRecord,

      expectedRevision:
        1,
    });


  assert.equal(
    update.status,
    "ready"
  );


  assert.equal(
    update.persisted,
    true
  );


  assert.equal(
    update.record
      .persistence_revision,
    2
  );


  const stale =
    await secondRepository.updateRecord({
      scope,

      record:
        updatedRecord,

      expectedRevision:
        1,
    });


  assert.equal(
    stale.status,
    "conflict"
  );


  assert.equal(
    stale.persisted,
    false
  );


  assert.equal(
    stale.current_revision,
    2
  );


  console.log(
    "TINT018 optimistic revision conflict: PASSED"
  );


  // ==========================================================================================================
  // TINT019 — CROSS-BUSINESS ISOLATION
  // ==========================================================================================================

  const wrongBusinessScope = {
    ...scope,

    businessKey:
      "wrong_business_staging",
  };


  const isolatedRead =
    await secondRepository.getRecord({
      scope:
        wrongBusinessScope,

      recordId,
    });


  assert.equal(
    isolatedRead.status,
    "not_found"
  );


  assert.equal(
    isolatedRead.record,
    null
  );


  const isolatedSearch =
    await secondRepository.searchRecords({
      scope:
        wrongBusinessScope,

      query: {
        text:
          proofId,

        limit:
          100,
      },
    });


  assert.equal(
    isolatedSearch.status,
    "ready"
  );


  assert.equal(
    isolatedSearch.records.length,
    0
  );


  console.log(
    "TINT019 cross-business isolation: PASSED"
  );


  // ==========================================================================================================
  // CLOSE SECOND CONNECTION
  // ==========================================================================================================

  await secondPool.end();

  secondPool =
    null;


  // ==========================================================================================================
  // TINT020 — THIRD CONNECTION / FINAL DURABILITY CERTIFICATION
  // ==========================================================================================================

  thirdPool =
    createTellerPostgresPool();


  const thirdRepository =
    createPostgresTellerRecordRepository({
      pool:
        thirdPool,
    });


  const finalRead =
    await thirdRepository.getRecord({
      scope,

      recordId,
    });


  assert.equal(
    finalRead.status,
    "ready"
  );


  assert.equal(
    finalRead.record
      .persistence_revision,
    2
  );


  assert.equal(
    finalRead.record
      .record_status,
    "approved"
  );


  assert.ok(
    finalRead.record
      .audit_history
      .some(
        (event) =>
          event.event ===
          "live_persistence_certified"
      )
  );


  console.log(
    "TINT020 third-connection durability certification: PASSED"
  );


  console.log(
    JSON.stringify(
      {
        proof_id:
          proofId,

        record_id:
          recordId,

        business_key:
          businessKey,

        final_revision:
          finalRead.record
            .persistence_revision,

        final_status:
          finalRead.record
            .record_status,

        durable:
          true,

        idempotency:
          true,

        optimistic_conflict:
          true,

        cross_business_isolation:
          true,
      }
    )
  );

} finally {

  if (firstPool) {
    await firstPool.end();
  }

  if (secondPool) {
    await secondPool.end();
  }

  if (thirdPool) {
    await thirdPool.end();
  }
}

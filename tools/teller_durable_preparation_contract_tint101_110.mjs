import assert from "node:assert/strict";

import {
  tellerRecordScopeKey,
  mergeTellerDurableRecords,
  resolveTellerPreparedRecord,
} from "../src/teller/records/tellerDurablePreparation.js";

const record = { record_id: "workflow_001", category: "people" };
const scope = "tower|receipt|actor|business|owner";
const session = {
  sessionId: "tower",
  towerReceiptId: "receipt",
  actor: { id: "actor" },
  business: { key: "business" },
  role: "owner",
};

assert.equal(tellerRecordScopeKey(session), scope);
assert.equal(tellerRecordScopeKey(null), "");

function args(extra = {}) {
  const pendingIds = new Set();
  const records = [];
  return {
    record,
    readRecords: () => records,
    validateRecord: () => ({ valid: true, problems: [] }),
    findDuplicate: () => null,
    pendingIds,
    hostedSession: true,
    expectedScopeKey: scope,
    readScopeKey: () => scope,
    transport: { connected: true, async saveRecord(input) {
      return { record: { ...input, persistence_revision: 1 } };
    }},
    ...extra,
  };
}

// A valid API acknowledgement is the ONLY durable acceptance.
{
  const result = await resolveTellerPreparedRecord(args());
  assert.equal(result.accepted, true);
  assert.equal(result.durable, true);
  assert.equal(result.status, "durable");
  assert.equal(result.record.record_id, record.record_id);
}

// No API transport in a hosted session must not silently become a local record.
{
  const result = await resolveTellerPreparedRecord(args({
    transport: null,
  }));
  assert.equal(result.accepted, false);
  assert.equal(result.status, "authenticated_repository_unavailable");
}

// Development-only/session-only preparations are explicitly NOT durable.
{
  const result = await resolveTellerPreparedRecord(args({
    hostedSession: false,
    transport: null,
  }));
  assert.equal(result.accepted, true);
  assert.equal(result.durable, false);
  assert.equal(result.status, "session_only");
}

// Lost response/network failure leaves the draft unaccepted for retry.
{
  const pendingIds = new Set();
  const result = await resolveTellerPreparedRecord(args({
    pendingIds,
    transport: {
      connected: true,
      async saveRecord() { throw Error("synthetic outage"); },
    },
  }));
  assert.equal(result.accepted, false);
  assert.equal(result.status, "persistence_failed");
  assert.equal(pendingIds.size, 0);
}

// No record may become durable based on a mismatched/missing server ack.
{
  const result = await resolveTellerPreparedRecord(args({
    transport: {
      connected: true,
      async saveRecord() { return { record: { record_id: "other" } }; },
    },
  }));
  assert.equal(result.accepted, false);
  assert.equal(result.status, "invalid_durable_ack");
}

// A late successful save from an old Tower business must not enter new UI.
{
  let currentScope = scope;
  const result = await resolveTellerPreparedRecord(args({
    readScopeKey: () => currentScope,
    transport: {
      connected: true,
      async saveRecord() {
        currentScope = "tower|receipt|other|other|owner";
        return { record: { ...record, persistence_revision: 1 } };
      },
    },
  }));
  assert.equal(result.accepted, false);
  assert.equal(result.status, "tower_identity_changed");
}

// Prevent double-submit while the first request is unresolved.
{
  let release;
  let requests = 0;
  const pendingIds = new Set();
  const state = args({
    pendingIds,
    transport: {
      connected: true,
      async saveRecord(input) {
        requests++;
        return new Promise(resolve => { release = () => resolve({ record: input }); });
      },
    },
  });
  const first = resolveTellerPreparedRecord(state);
  const duplicate = await resolveTellerPreparedRecord(state);
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.status, "submission_in_progress");
  assert.equal(requests, 1);
  release();
  assert.equal((await first).durable, true);
  assert.equal(pendingIds.size, 0);
}

// Validation and duplicate detection still block before a server request.
{
  const invalid = await resolveTellerPreparedRecord(args({
    validateRecord: () => ({ valid: false, problems: ["missing"] }),
  }));
  assert.equal(invalid.status, "validation_failed");
  const duplicate = await resolveTellerPreparedRecord(args({
    findDuplicate: () => ({ record_id: "workflow_previous" }),
  }));
  assert.equal(duplicate.status, "duplicate");
}

// An older hydration snapshot cannot erase a recently acknowledged save.
{
  const current = [{ record_id: "new", persistence_revision: 1 },
    { record_id: "same", persistence_revision: 3 }];
  const hydrated = [{ record_id: "same", persistence_revision: 2 },
    { record_id: "other", persistence_revision: 1 }];
  const result = mergeTellerDurableRecords(current, hydrated);
  assert.equal(result.length, 3);
  assert.equal(result.find(r => r.record_id === "same").persistence_revision, 3);
  assert.ok(result.find(r => r.record_id === "new"));
}

console.log("TINT101–110 durable preparation and acknowledgement: PASS");
console.log("Failed hosted save preserves draft and does not claim durability: YES");
console.log("Mismatched acknowledgement and old business scope: BLOCKED");
console.log("In-flight double-submit: BLOCKED");
console.log("Session-only DEV preparation distinguished from durable: YES");

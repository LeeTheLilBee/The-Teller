import assert from "node:assert/strict";

import {
  describeTellerRecordStorage,
  describeTellerRepositoryConnection,
} from "../src/teller/records/tellerRecordStorageTruth.js";

const durable = {
  record_id: "durable_1",
  persistence_revision: 3,
  persistence: {
    session_memory: false,
    production_repository_connected: true,
    production_persisted: true,
  },
};
const trusted = describeTellerRecordStorage(durable);
assert.equal(trusted.confirmed, true);
assert.equal(trusted.label, "Authenticated repository record");
assert.match(trusted.detail, /revision 3/);

const local = describeTellerRecordStorage({
  record_id: "session_1",
  persistence: {
    session_memory: true,
    production_repository_connected: false,
    production_persisted: false,
  },
});
assert.equal(local.confirmed, false);
assert.match(local.detail, /not confirmed/);

// URL configuration and user-supplied revision alone never prove durability.
assert.equal(describeTellerRecordStorage({
  record_id: "unconfirmed",
  persistence_revision: 1,
  persistence: { production_repository_connected: true },
}).confirmed, false);
assert.equal(describeTellerRecordStorage({
  record_id: "unconfirmed_2",
  persistence_revision: 0,
  persistence: {
    production_repository_connected: true,
    production_persisted: true,
  },
}).confirmed, false);

assert.equal(describeTellerRepositoryConnection({}).label, "Not connected");
assert.equal(describeTellerRepositoryConnection({
  configured: true,
  persistent: false,
  status: "checking",
}).label, "Checking");
assert.equal(describeTellerRepositoryConnection({
  configured: true,
  persistent: false,
  status: "error",
}).label, "Unavailable");

const verified = describeTellerRepositoryConnection({
  configured: true,
  persistent: true,
  status: "ready",
});
assert.equal(verified.label, "Verified");
assert.equal(verified.verified, true);
assert.equal(describeTellerRepositoryConnection({
  configured: true,
  persistent: false,
  status: "ready",
}).verified, false);

console.log("TINT111–120 records storage truth: PASS");
console.log("Hard-coded persisted labels replaced by server-ack evidence: YES");
console.log("Configured URL is not verified connectivity: YES");

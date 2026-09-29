import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(
  fs.readFileSync(
    new URL("../contracts/teller/teller_tower_connection_manifest_v1.json", import.meta.url),
    "utf8"
  )
);

assert.equal(manifest.contract_id, "teller-tower-connection-ready-v1");
assert.equal(manifest.teller.app_id, "teller");
assert.equal(manifest.teller.entry_path, "/teller");
assert.equal(manifest.teller.exchange_version, "tower-teller-exchange.v2");
assert.equal(manifest.tower.exchange_path, "/tower/teller/exchange");
assert.equal(manifest.shared_security.persistence_token_version, "tpt1");
assert.equal(manifest.shared_security.issuer, "tower");
assert.equal(manifest.shared_security.audience, "teller-persistence");
assert.equal(manifest.shared_security.maximum_lifetime_seconds, 600);
assert.equal(manifest.shared_security.minimum_secret_length, 32);
assert.equal(manifest.shared_security.browser_signing_secret, false);
assert.equal(manifest.shared_security.browser_database_credentials, false);
assert.equal(manifest.shared_security.persistence_token_storage, "memory_only");
assert.deepEqual(manifest.allowed_roles, ["employee", "manager", "owner"]);

for (const field of [
  "exchange_version",
  "access_verified",
  "app_id",
  "role",
  "target_path",
  "receipt_id",
  "expires_at_epoch",
  "navigation_context",
  "tower_session_id",
  "actor_id",
  "business_key",
  "persistence_access_token",
]) {
  assert.ok(manifest.required_exchange_response_fields.includes(field), field);
}

assert.equal(manifest.production_rules.direct_teller_open, "deny");
assert.equal(manifest.production_rules.react_mount_before_verified_exchange, false);
assert.equal(manifest.production_rules.fresh_handoff_required_after_reload, true);
assert.equal(manifest.production_rules.https_exchange_required, true);
assert.equal(manifest.production_rules.https_persistence_api_required, true);
assert.equal(manifest.production_rules.persistence_token_query_parameter, false);
assert.equal(manifest.production_rules.persistence_token_url_fragment, false);
assert.equal(manifest.production_rules.persistence_token_local_storage, false);
assert.equal(manifest.production_rules.persistence_token_session_storage, false);

const serialized = JSON.stringify(manifest);
assert.equal(serialized.includes("synthetic-ci"), false);
assert.equal(serialized.includes("postgres://"), false);
assert.equal(serialized.includes("postgresql://"), false);

console.log("Teller Tower connection manifest: PASS");

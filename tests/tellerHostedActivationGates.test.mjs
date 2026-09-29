import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const json = path => JSON.parse(read(path));
const canonical = "https://simplee-tower-ob-tunv.onrender.com";
const retired = "https://simplee-tower-ob.onrender.com";
const staticOrigin = "https://simplee-teller.onrender.com";
const apiOrigin = "https://simplee-teller-api-staging.onrender.com";
const exactTowerDeploy = "3db5fbc15f4a59c4ba1eeaf5bea32e8377f355c1";

test("all active Teller static build specs use canonical secondary Tower and never retired primary", () => {
  const pre = json("deploy/render/teller-static-pre-render-bootstrap-staging.json");
  const secure = json("deploy/render/teller-static-secure-bootstrap-staging.json");
  for (const config of [pre, secure]) {
    assert.equal(config.future_build_environment.VITE_TOWER_TELLER_EXCHANGE_URL, canonical + "/tower/teller/exchange");
    assert.equal(config.future_build_environment.VITE_TELLER_PERSISTENCE_API_URL, apiOrigin);
    assert.equal(JSON.stringify(config).includes(retired + "/tower/teller/exchange"), false);
    assert.deepEqual(
      Object.keys(config.future_build_environment).sort(),
      ["VITE_TELLER_PERSISTENCE_API_URL", "VITE_TOWER_TELLER_EXCHANGE_URL"],
    );
  }
  assert.equal(pre.required_tower_exchange_version, "tower-teller-exchange.v2");
  assert.equal(pre.current_truth.teller_static_site_activated, false);
  assert.equal(secure.current_truth.hosted_static_site_activated, false);
});

test("API origin policy targets the same Teller and canonical Tower origins", () => {
  const api = json("deploy/render/teller-api-staging.json");
  const allowed = api.public_runtime.TELLER_ALLOWED_ORIGINS.split(",").map(x => x.trim());
  assert.deepEqual(new Set(allowed), new Set([staticOrigin, canonical]));
  assert.equal(allowed.includes(retired), false);
  assert.equal(api.service.auto_deploy, false);
  assert.equal(api.must_not_use.auto_deploy_before_environment_is_complete, true);
});

test("cross-repo proof pins exact current LIVE Tower deploy source rather than an earlier Tower revision", () => {
  const workflow = read(".github/workflows/teller-tower-v2-crossrepo-proof.yml");
  assert.ok(workflow.includes("ref: " + exactTowerDeploy));
  assert.ok(!workflow.includes("ref: 88af02c06bbcf0029ff12b6e16a38c68c58bf928"));
  assert.ok(workflow.includes("Verify actual Tower issuer against Teller verifier"));
});

test("release remains source-only and does not imply hosted browser or money activation", () => {
  const pre = json("deploy/render/teller-static-pre-render-bootstrap-staging.json");
  const secure = json("deploy/render/teller-static-secure-bootstrap-staging.json");
  const doc = read("docs/teller/TELLER_TOWER_CONNECTION_HANDOFF_20260928.md");
  assert.equal(pre.current_truth.deployment_performed, false);
  assert.equal(pre.current_truth.render_mutation_performed, false);
  assert.equal(secure.current_truth.deployment_performed, false);
  assert.ok(doc.includes(canonical + "/tower/teller/exchange"));
  assert.ok(doc.includes("source integration testing only"));
  for (const field of ["TELLER_TOWER_TOKEN_SECRET", "DATABASE_URL"]) {
    assert.ok(!Object.keys(pre.future_build_environment).includes(field));
    assert.ok(!Object.keys(secure.future_build_environment).includes(field));
  }
});

// Exact future configuration contract only. No hosting mutation or credentials.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const origin = "https://simplee-tower-ob-tunv.onrender.com";
const retired = "https://simplee-tower-ob.onrender.com";
const spec = json("deploy/render/teller-static-secure-bootstrap-staging.json");
const preRender = json("deploy/render/teller-static-pre-render-bootstrap-staging.json");
const api = json("deploy/render/teller-api-staging.json");
const doc = readFileSync("docs/teller/TELLER_TOWER_V2_SOURCE_CROSSING_TINT081_090.md", "utf8");

assert.equal(
  spec.future_build_environment.VITE_TOWER_TELLER_EXCHANGE_URL,
  origin + "/tower/teller/exchange",
);
assert.equal(
  preRender.future_build_environment.VITE_TOWER_TELLER_EXCHANGE_URL,
  origin + "/tower/teller/exchange",
);
assert.equal(preRender.current_truth.teller_static_site_activated, false);
const allowed = api.public_runtime.TELLER_ALLOWED_ORIGINS.split(",").map(s => s.trim());
assert.ok(allowed.includes("https://simplee-teller.onrender.com"));
assert.ok(allowed.includes(origin));
assert.ok(!allowed.includes(retired));
assert.equal(new Set(allowed).size, allowed.length);
assert.ok(doc.includes(origin + "/tower/teller/exchange"));
assert.ok(!doc.includes("Teller remains configured to use the canonical primary URL above"));
assert.ok(doc.includes("currently deployed secondary Tower revision"));
assert.equal(spec.current_truth.hosted_static_site_activated, false);
assert.equal(api.must_not_use.auto_deploy_before_environment_is_complete, true);
console.log("Future Teller Tower origin pins secondary only; hosted activation remains held.");

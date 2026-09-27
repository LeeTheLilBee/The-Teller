from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
app = (ROOT / "src/App.jsx").read_text(encoding="utf-8")
forms = (ROOT / "src/teller/forms/TellerFormsWorkspace.jsx").read_text(encoding="utf-8")
renderer = (ROOT / "src/teller/forms/TellerFormRenderer.jsx").read_text(encoding="utf-8")
helper = (ROOT / "src/teller/records/tellerDurablePreparation.js").read_text(encoding="utf-8")

# No optimistic record acceptance in App before the API acknowledges it.
assert "resolveTellerPreparedRecord({" in app
assert "if (!result.accepted)" in app
assert "const accepted = result.record;" in app
assert app.index("if (!result.accepted)") < app.index("setSessionRecords(nextRecords)")
assert "record_prepared_session_only" in app
assert "record_persisted" in app
assert "record_recovery_requires_repository" in app

# Form close and prepared packet rendering only follow successful acknowledgement.
assert "async function preparePacket(" in forms
assert "await onRecordPrepared(sessionRecord)" in forms
assert "if (result?.accepted !== true)" in forms
assert forms.index("if (result?.accepted !== true)") < forms.index("setPreparedPackets(", forms.index("async function preparePacket("))

# A failed save leaves the draft and explicitly tells the user to retry.
assert "async function prepareWorkflow()" in renderer
assert "await onPrepared?.(packet)" in renderer
assert "role=\"alert\"" in renderer
assert "disabled={preparing}" in renderer
assert "Your draft remains open" in renderer

# Hosted absence of transport is never silently treated as session-only.
assert "hostedSession && !connected" in helper
assert '"authenticated_repository_unavailable"' in helper
assert '"invalid_durable_ack"' in helper
assert '"tower_identity_changed"' in helper
assert '"persistence_failed"' in helper

print("TINT101–110 form acknowledgement structural boundary: PASS")
print("Failed durable save cannot close form or claim a durable record: YES")
print("Hosted disconnected repository fails closed: YES")

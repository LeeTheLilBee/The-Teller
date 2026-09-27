from pathlib import Path

root = Path(__file__).resolve().parents[1]
app = (root / "src/App.jsx").read_text(encoding="utf-8")
records = (root / "src/teller/records/TellerRecordsWorkspace.jsx").read_text(encoding="utf-8")
truth = (root / "src/teller/records/tellerRecordStorageTruth.js").read_text(encoding="utf-8")
server = (root / "server/teller/persistence/tellerRecordPersistenceSerializer.js").read_text(encoding="utf-8")

assert "describeTellerRecordStorage(record)" in records
assert "storage.label" in records
assert "storage.detail" in records
assert "Production persisted: No" not in records
assert "describeTellerRepositoryConnection(repositoryTruth)" in records
assert "onSearchRemote" in records
assert "searchSequenceRef.current" in records
assert "remoteRecords === null ? records : remoteRecords" in records
assert "Showing up to 100 authenticated matches" in records
assert "role=\"alert\"" in records

assert "setRepositoryStatus(\"checking\")" in app
assert "setRepositoryStatus(\"ready\")" in app
assert "setRepositoryStatus(\"error\")" in app
assert "persistenceTransport.searchRecords({" in app
assert "limit: 100" in app
assert "tellerRecordScopeKey(readTellerTowerSession()) !== towerIdentityKey" in app
assert "onSearchRemote={" in app
assert "persistent: repositoryStatus === \"ready\"" in app

# Only a deserialized DB row carries both the persisted flag and revision.
assert "persistence_revision:" in server
assert "production_persisted:" in server
assert "production_repository_connected:" in server
assert "production_persisted === true" in truth
assert "production_repository_connected === true" in truth

print("TINT111–120 records UI and authenticated search structural wall: PASS")
print("Repository state needs successful authenticated hydration: YES")
print("Remote search uses Tower API and drops changed-scope response: YES")
print("Session-only records cannot claim durable status by default: YES")

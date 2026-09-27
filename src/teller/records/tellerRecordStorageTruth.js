/*
 * Presentation-only storage evidence.
 *
 * An authenticated repository response is serialized with BOTH the
 * production_persisted flag and a positive persistence revision. Neither
 * a configured URL nor a locally prepared form is proof of a durable save.
 * Teller's API and RLS remain the server-side authority.
 */
export function describeTellerRecordStorage(record) {
  const revision = Number(record?.persistence_revision);
  const confirmed = (
    record?.persistence?.production_persisted === true &&
    record?.persistence?.production_repository_connected === true &&
    Number.isSafeInteger(revision) &&
    revision >= 1
  );

  return Object.freeze({
    confirmed,
    label: confirmed
      ? "Authenticated repository record"
      : "Session-only or unconfirmed record",
    detail: confirmed
      ? `Production persisted · revision ${revision}`
      : "Production persistence not confirmed",
  });
}

export function describeTellerRepositoryConnection(repository) {
  if (!repository?.configured) {
    return Object.freeze({
      label: "Not connected",
      persistent: false,
      verified: false,
    });
  }
  if (repository.status === "ready" && repository.persistent === true) {
    return Object.freeze({
      label: "Verified",
      persistent: true,
      verified: true,
    });
  }
  if (repository.status === "error") {
    return Object.freeze({
      label: "Unavailable",
      persistent: false,
      verified: false,
    });
  }
  return Object.freeze({
    label: "Checking",
    persistent: false,
    verified: false,
  });
}

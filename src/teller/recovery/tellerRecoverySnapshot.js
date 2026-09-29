import {
  validateTellerRecordSet,
} from "./tellerProductionValidation.js";


function createSnapshotId() {
  const random =
    typeof crypto !== "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID().slice(0, 10)
      : Math.random()
          .toString(36)
          .slice(2, 12);

  return (
    `teller_recovery_${Date.now()}_${random}`
  );
}


function cloneValue(
  value
) {
  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


export function createTellerRecoverySnapshot(
  records = []
) {
  const validation =
    validateTellerRecordSet(
      records
    );


  if (!validation.valid) {
    throw new Error(
      "Recovery snapshot cannot be created from invalid Teller records."
    );
  }


  return Object.freeze({
    snapshot_id:
      createSnapshotId(),

    records:
      cloneValue(
        records
      ),

    record_count:
      records.length,

    persistence:
      "memory_only",

    survives_reload:
      false,

    production_backup:
      false,

    created_at:
      new Date().toISOString(),
  });
}


export function restoreTellerRecoverySnapshot(
  snapshot
) {
  if (
    !snapshot ||
    snapshot.persistence !==
      "memory_only"
  ) {
    throw new Error(
      "A valid Teller in-memory recovery snapshot is required."
    );
  }


  const records =
    cloneValue(
      snapshot.records || []
    );


  const validation =
    validateTellerRecordSet(
      records
    );


  if (!validation.valid) {
    throw new Error(
      "Recovery snapshot contains invalid Teller records."
    );
  }


  return records;
}

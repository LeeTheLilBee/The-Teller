import {
  sanitizeTellerRecordPayload,
} from "../records/tellerRecordSchema.js";


function stableSerialize(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return String(value);
  }


  if (Array.isArray(value)) {
    return (
      "[" +
      value
        .map(
          (item) =>
            stableSerialize(
              item
            )
        )
        .join(",")
      +
      "]"
    );
  }


  if (
    typeof value === "object"
  ) {
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}:${stableSerialize(value[key])}`
        )
        .join(",")
      +
      "}"
    );
  }


  return JSON.stringify(
    value
  );
}


function fnv1a(
  input
) {
  let hash =
    0x811c9dc5;

  for (
    let index = 0;
    index < input.length;
    index += 1
  ) {
    hash ^=
      input.charCodeAt(
        index
      );

    hash = Math.imul(
      hash,
      0x01000193
    );
  }

  return (
    hash >>> 0
  )
    .toString(16)
    .padStart(8, "0");
}


export function buildTellerSubmissionFingerprint(
  packet
) {
  const safe =
    sanitizeTellerRecordPayload({
      form_id:
        packet?.form_id || "",

      workflow_type:
        packet?.workflow_type || "",

      values:
        packet?.values || {},

      owner_approval_required:
        Boolean(
          packet
            ?.owner_approval_required
        ),

      tower_approval_required:
        Boolean(
          packet
            ?.tower_approval_required
        ),
    });


  return (
    `teller_submission_${fnv1a(
      stableSerialize(
        safe
      )
    )}`
  );
}


export function getTellerRecordFingerprint(
  record
) {
  return (
    record
      ?.integrity
      ?.submission_fingerprint
    ||
    ""
  );
}


export function findDuplicateTellerRecord(
  records = [],
  candidateRecord
) {
  const fingerprint =
    getTellerRecordFingerprint(
      candidateRecord
    );


  if (!fingerprint) {
    return null;
  }


  return (
    (records || [])
      .find(
        (record) =>
          record.record_id !==
            candidateRecord.record_id &&
          getTellerRecordFingerprint(
            record
          ) === fingerprint
      )
    ||
    null
  );
}

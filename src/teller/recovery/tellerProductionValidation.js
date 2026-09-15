import {
  TELLER_FORBIDDEN_RECORD_KEYS,
} from "../records/tellerRecordSchema.js";


function cleanKey(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}


function walkForbiddenKeys(
  value,
  path = ""
) {
  const problems = [];


  if (
    value === null ||
    value === undefined
  ) {
    return problems;
  }


  if (Array.isArray(value)) {
    value.forEach(
      (item, index) => {
        problems.push(
          ...walkForbiddenKeys(
            item,
            `${path}[${index}]`
          )
        );
      }
    );

    return problems;
  }


  if (
    typeof value !== "object"
  ) {
    return problems;
  }


  Object.entries(value)
    .forEach(
      ([key, item]) => {
        const normalized =
          cleanKey(
            key
          );

        const nextPath =
          path
            ? `${path}.${key}`
            : key;


        if (
          TELLER_FORBIDDEN_RECORD_KEYS
            .includes(
              normalized
            )
        ) {
          problems.push({
            code:
              "forbidden_record_key",

            path:
              nextPath,

            key:
              normalized,
          });

          return;
        }


        problems.push(
          ...walkForbiddenKeys(
            item,
            nextPath
          )
        );
      }
    );


  return problems;
}


export function validateTellerProductionRecord(
  record
) {
  const problems = [];


  if (!record) {
    return {
      valid:
        false,

      problems: [
        {
          code:
            "record_missing",
        },
      ],
    };
  }


  if (!record.record_id) {
    problems.push({
      code:
        "record_id_missing",
    });
  }


  if (!record.record_version) {
    problems.push({
      code:
        "record_version_missing",
    });
  }


  if (!record.source) {
    problems.push({
      code:
        "record_source_missing",
    });
  }


  if (!record.record_status) {
    problems.push({
      code:
        "record_status_missing",
    });
  }


  if (!record.search_projection) {
    problems.push({
      code:
        "search_projection_missing",
    });
  }


  if (
    record.persistence
      ?.production_persisted === true
  ) {
    problems.push({
      code:
        "false_production_persistence_claim",
    });
  }


  if (
    record.persistence
      ?.production_repository_connected === true
  ) {
    problems.push({
      code:
        "unexpected_production_repository_claim",
    });
  }


  problems.push(
    ...walkForbiddenKeys(
      record.payload || {},
      "payload"
    )
  );


  return {
    valid:
      problems.length === 0,

    problems,
  };
}


export function validateTellerRecordSet(
  records = []
) {
  const results =
    (records || [])
      .map(
        (record) => ({
          record_id:
            record?.record_id || "",

          ...validateTellerProductionRecord(
            record
          ),
        })
      );


  return {
    total:
      results.length,

    valid_count:
      results.filter(
        (result) =>
          result.valid
      ).length,

    invalid_count:
      results.filter(
        (result) =>
          !result.valid
      ).length,

    valid:
      results.every(
        (result) =>
          result.valid
      ),

    results,
  };
}

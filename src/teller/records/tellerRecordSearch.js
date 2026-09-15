function clean(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}


function safeSearchText(
  record
) {
  const projection =
    record?.search_projection || {};

  return [
    projection.title,
    projection.form_id,
    projection.workflow_type,
    projection.category,
    projection.business_key,
    projection.record_status,
    record?.record_id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}


export function buildTellerRecordSearchIndex(
  records = []
) {
  return (records || [])
    .map(
      (record) => ({
        record,

        searchable_text:
          safeSearchText(
            record
          ),
      })
    );
}


export function searchTellerRecords(
  records = [],
  query = {}
) {
  const text =
    clean(
      query.text
    );

  const category =
    clean(
      query.category
    );

  const status =
    clean(
      query.status
    );

  const business =
    clean(
      query.business
    );


  const indexed =
    buildTellerRecordSearchIndex(
      records
    );


  return indexed
    .filter(
      ({ record, searchable_text }) => {
        const projection =
          record.search_projection || {};


        if (
          text &&
          !searchable_text.includes(
            text
          )
        ) {
          return false;
        }


        if (
          category &&
          clean(
            projection.category
          ) !== category
        ) {
          return false;
        }


        if (
          status &&
          clean(
            record.record_status
          ) !== status
        ) {
          return false;
        }


        if (
          business &&
          clean(
            projection.business_key
          ) !== business
        ) {
          return false;
        }


        return true;
      }
    )
    .map(
      ({ record }) =>
        record
    )
    .sort(
      (left, right) =>
        String(
          right.updated_at || ""
        ).localeCompare(
          String(
            left.updated_at || ""
          )
        )
    );
}


export function getTellerRecordSearchFacets(
  records = []
) {
  const categories =
    new Set();

  const statuses =
    new Set();

  const businesses =
    new Set();


  (records || [])
    .forEach(
      (record) => {
        const projection =
          record.search_projection || {};


        if (
          projection.category
        ) {
          categories.add(
            projection.category
          );
        }


        if (
          record.record_status
        ) {
          statuses.add(
            record.record_status
          );
        }


        if (
          projection.business_key
        ) {
          businesses.add(
            projection.business_key
          );
        }
      }
    );


  return {
    categories:
      [...categories].sort(),

    statuses:
      [...statuses].sort(),

    businesses:
      [...businesses].sort(),
  };
}

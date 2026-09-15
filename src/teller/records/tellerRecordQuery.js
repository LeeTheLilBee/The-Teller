export const EMPTY_TELLER_RECORD_QUERY =
  Object.freeze({
    text: "",
    category: "",
    status: "",
    business: "",
  });


export function normalizeTellerRecordQuery(
  query = {}
) {
  return {
    text:
      String(
        query.text || ""
      ).trim(),

    category:
      String(
        query.category || ""
      ).trim(),

    status:
      String(
        query.status || ""
      ).trim(),

    business:
      String(
        query.business || ""
      ).trim(),
  };
}


export function hasActiveTellerRecordFilters(
  query = {}
) {
  const normalized =
    normalizeTellerRecordQuery(
      query
    );

  return Boolean(
    normalized.text ||
    normalized.category ||
    normalized.status ||
    normalized.business
  );
}


export function clearTellerRecordQuery() {
  return {
    ...EMPTY_TELLER_RECORD_QUERY,
  };
}

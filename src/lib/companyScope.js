export function filterRecordsByEntity(records, entityKey) {
  if (!Array.isArray(records)) return [];
  if (entityKey === "world") return records;
  return records.filter((record) => record.entityKey === entityKey);
}

export function countRecordsByEntity(records, entityKey) {
  return filterRecordsByEntity(records, entityKey).length;
}

export function groupRecordsByEntity(records) {
  return records.reduce((groups, record) => {
    const key = record.entityKey || "unknown";
    groups[key] = groups[key] || [];
    groups[key].push(record);
    return groups;
  }, {});
}

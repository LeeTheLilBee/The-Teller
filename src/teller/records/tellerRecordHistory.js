function createHistoryId() {
  const random =
    typeof crypto !== "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID().slice(0, 10)
      : Math.random()
          .toString(36)
          .slice(2, 12);

  return (
    `record_event_${Date.now()}_${random}`
  );
}


export function createTellerRecordHistoryEvent({
  event,
  actor_role = "",
  note = "",
  metadata = {},
}) {
  if (!event) {
    throw new Error(
      "Record history event is required."
    );
  }


  return Object.freeze({
    event_id:
      createHistoryId(),

    event,

    actor_role:
      String(
        actor_role || ""
      ),

    note:
      String(
        note || ""
      ),

    metadata:
      {
        ...metadata,
      },

    at:
      new Date().toISOString(),
  });
}


export function appendTellerRecordHistory(
  record,
  historyEvent
) {
  if (
    !record ||
    !historyEvent
  ) {
    return record;
  }


  return {
    ...record,

    audit_history: [
      ...(
        record.audit_history || []
      ),

      historyEvent,
    ],

    updated_at:
      historyEvent.at ||
      new Date().toISOString(),
  };
}

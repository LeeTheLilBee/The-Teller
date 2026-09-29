import {
  appendTellerRecordHistory,
  createTellerRecordHistoryEvent,
} from "../records/tellerRecordHistory.js";


export function canStartTellerRecordCorrection(
  record
) {
  return Boolean(
    record &&
    !record.workflow_lock?.locked &&
    ![
      "void",
      "closed",
    ].includes(
      record.record_status
    )
  );
}


export function startTellerRecordCorrection(
  record,
  {
    actor_role = "",
    reason = "",
  } = {}
) {
  if (
    !canStartTellerRecordCorrection(
      record
    )
  ) {
    throw new Error(
      "This Teller record cannot enter correction while locked or closed."
    );
  }


  const event =
    createTellerRecordHistoryEvent({
      event:
        "correction_requested",

      actor_role,

      note:
        String(
          reason || ""
        ),

      metadata: {
        prior_status:
          record.record_status,
      },
    });


  const updated =
    appendTellerRecordHistory(
      {
        ...record,

        record_status:
          "needs_correction",

        search_projection: {
          ...(
            record.search_projection ||
            {}
          ),

          record_status:
            "needs_correction",
        },

        correction: {
          required:
            true,

          requested_by_role:
            String(
              actor_role || ""
            ),

          reason:
            String(
              reason || ""
            ),

          requested_at:
            event.at,
        },
      },

      event
    );


  return updated;
}


export function clearTellerRecordCorrection(
  record,
  {
    actor_role = "",
    note = "",
  } = {}
) {
  const event =
    createTellerRecordHistoryEvent({
      event:
        "correction_cleared",

      actor_role,

      note,
    });


  return appendTellerRecordHistory(
    {
      ...record,

      record_status:
        "prepared",

      search_projection: {
        ...(
          record.search_projection ||
          {}
        ),

        record_status:
          "prepared",
      },

      correction: {
        required:
          false,

        cleared_by_role:
          String(
            actor_role || ""
          ),

        cleared_at:
          event.at,
      },
    },

    event
  );
}

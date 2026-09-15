import {
  appendTellerRecordHistory,
  createTellerRecordHistoryEvent,
} from "../records/tellerRecordHistory.js";


export function isTellerRecordLocked(
  record
) {
  return Boolean(
    record
      ?.workflow_lock
      ?.locked
  );
}


export function lockTellerRecord(
  record,
  {
    actor_role = "",
    reason = "",
  } = {}
) {
  if (!record) {
    return record;
  }


  const event =
    createTellerRecordHistoryEvent({
      event:
        "workflow_record_locked",

      actor_role,

      note:
        String(
          reason || ""
        ),
    });


  return appendTellerRecordHistory(
    {
      ...record,

      workflow_lock: {
        locked:
          true,

        lock_type:
          "session_workflow_lock",

        reason:
          String(
            reason || ""
          ),

        actor_role:
          String(
            actor_role || ""
          ),

        locked_at:
          event.at,

        tower_security_lock:
          false,
      },
    },

    event
  );
}


export function unlockTellerRecord(
  record,
  {
    actor_role = "",
    reason = "",
  } = {}
) {
  if (!record) {
    return record;
  }


  const event =
    createTellerRecordHistoryEvent({
      event:
        "workflow_record_unlocked",

      actor_role,

      note:
        String(
          reason || ""
        ),
    });


  return appendTellerRecordHistory(
    {
      ...record,

      workflow_lock: {
        locked:
          false,

        lock_type:
          "session_workflow_lock",

        reason:
          String(
            reason || ""
          ),

        actor_role:
          String(
            actor_role || ""
          ),

        unlocked_at:
          event.at,

        tower_security_lock:
          false,
      },
    },

    event
  );
}

export const TELLER_OPERATION_STATUS =
  Object.freeze({
    READY:
      "ready",

    RUNNING:
      "running",

    FAILED:
      "failed",

    RETRYABLE:
      "retryable",

    BLOCKED:
      "blocked",

    COMPLETE:
      "complete",
  });


function createOperationId() {
  const random =
    typeof crypto !== "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID().slice(0, 10)
      : Math.random()
          .toString(36)
          .slice(2, 12);

  return (
    `teller_operation_${Date.now()}_${random}`
  );
}


export function createTellerOperation({
  operation_type,
  record_id = "",
  max_retries = 3,
}) {
  return {
    operation_id:
      createOperationId(),

    operation_type,

    record_id,

    status:
      TELLER_OPERATION_STATUS.READY,

    attempt_count:
      0,

    max_retries:
      Number(
        max_retries || 0
      ),

    last_error:
      "",

    transport_connected:
      false,

    completed:
      false,

    created_at:
      new Date().toISOString(),

    updated_at:
      new Date().toISOString(),
  };
}


export function failTellerOperation(
  operation,
  error
) {
  const attemptCount =
    Number(
      operation
        ?.attempt_count || 0
    ) + 1;


  const maxRetries =
    Number(
      operation
        ?.max_retries || 0
    );


  const retryable =
    attemptCount <
    maxRetries;


  return {
    ...operation,

    attempt_count:
      attemptCount,

    status:
      retryable
        ? TELLER_OPERATION_STATUS.RETRYABLE
        : TELLER_OPERATION_STATUS.FAILED,

    last_error:
      String(
        error?.message ||
        error ||
        "Unknown operation failure"
      ),

    transport_connected:
      false,

    completed:
      false,

    updated_at:
      new Date().toISOString(),
  };
}


export function retryTellerOperation(
  operation
) {
  if (
    operation?.status !==
    TELLER_OPERATION_STATUS.RETRYABLE
  ) {
    return operation;
  }


  return {
    ...operation,

    status:
      TELLER_OPERATION_STATUS.READY,

    last_error:
      "",

    transport_connected:
      false,

    completed:
      false,

    updated_at:
      new Date().toISOString(),
  };
}


export function blockTellerOperation(
  operation,
  reason
) {
  return {
    ...operation,

    status:
      TELLER_OPERATION_STATUS.BLOCKED,

    last_error:
      String(
        reason || ""
      ),

    transport_connected:
      false,

    completed:
      false,

    updated_at:
      new Date().toISOString(),
  };
}

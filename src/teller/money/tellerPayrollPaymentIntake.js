export const TELLER_PAYROLL_INTAKE_ACTIONS =
  Object.freeze([
    {
      action_id: "cycle",
      form_id: "payroll_cycle_setup",
      label: "Payroll cycle",
      description:
        "Identify the pay period, payday, and payroll frequency before review.",
    },
    {
      action_id: "adjustment",
      form_id: "payroll_adjustment_request",
      label: "Payroll adjustment",
      description:
        "Request a reviewed payroll change for hours, pay, deduction review, or another correction.",
    },
    {
      action_id: "bonus",
      form_id: "bonus_commission_request",
      label: "Bonus / commission",
      description:
        "Prepare a bonus or commission item for approval and payroll review.",
    },
    {
      action_id: "off_cycle",
      form_id: "off_cycle_pay_request",
      label: "Off-cycle pay",
      description:
        "Request pay outside the normal payroll cycle without pretending payment has been sent.",
    },
    {
      action_id: "correction",
      form_id: "payroll_correction_request",
      label: "Payroll correction",
      description:
        "Document a payroll issue that needs investigation and correction.",
    },
  ]);


export const TELLER_PAYMENT_INTAKE_ACTIONS =
  Object.freeze([
    {
      action_id: "invoice",
      form_id: "invoice_intake",
      label: "Invoice",
      description:
        "Enter a bill or invoice that may lead to a payment workflow.",
    },
    {
      action_id: "payment",
      form_id: "payment_request",
      label: "Payment request",
      description:
        "Prepare a payment request for review and approval.",
    },
    {
      action_id: "reimbursement",
      form_id: "reimbursement_request",
      label: "Reimbursement",
      description:
        "Prepare a reimbursement request and its proof status.",
    },
    {
      action_id: "exception",
      form_id: "payment_exception_request",
      label: "Payment exception",
      description:
        "Report a failed, duplicate, incorrect, returned, or missing payment situation.",
    },
    {
      action_id: "refund",
      form_id: "refund_reversal_request",
      label: "Refund / reversal request",
      description:
        "Request review of a refund, void, or reversal without executing money movement.",
    },
  ]);


function formCount(
  packets,
  formId
) {
  return (packets || []).filter(
    (packet) =>
      packet?.form_id === formId
  ).length;
}


export function getTellerPayrollIntakeStatus(
  preparedPackets = []
) {
  const actions =
    TELLER_PAYROLL_INTAKE_ACTIONS.map(
      (action) => ({
        ...action,
        prepared_count:
          formCount(
            preparedPackets,
            action.form_id
          ),
      })
    );

  return {
    actions,

    prepared_count:
      actions.reduce(
        (total, action) =>
          total +
          action.prepared_count,
        0
      ),

    cycle_prepared:
      formCount(
        preparedPackets,
        "payroll_cycle_setup"
      ) > 0,
  };
}


export function getTellerPaymentIntakeStatus(
  preparedPackets = []
) {
  const actions =
    TELLER_PAYMENT_INTAKE_ACTIONS.map(
      (action) => ({
        ...action,
        prepared_count:
          formCount(
            preparedPackets,
            action.form_id
          ),
      })
    );

  return {
    actions,

    prepared_count:
      actions.reduce(
        (total, action) =>
          total +
          action.prepared_count,
        0
      ),
  };
}

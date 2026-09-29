export const TELLER_PAYROLL_INTAKE_VERSION = "1.0.0";
export const TELLER_PAYMENT_INTAKE_VERSION = "1.0.0";


function clean(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}


function packetsFor(
  packets,
  formId
) {
  return (packets || []).filter(
    (packet) =>
      packet?.form_id === formId
  );
}


function latestPacket(
  packets,
  formId
) {
  return (
    packetsFor(
      packets,
      formId
    )[0] || null
  );
}


function valuesFor(
  packets,
  formId
) {
  return (
    latestPacket(
      packets,
      formId
    )?.values || {}
  );
}


export function createBlankTellerPayrollIntakeRecord() {
  return {
    record_version:
      TELLER_PAYROLL_INTAKE_VERSION,

    payroll_intake_id: "",

    business: {
      business_key: "",
    },

    cycle: {
      pay_period_start: "",
      pay_period_end: "",
      scheduled_payday: "",
      pay_frequency: "",
      review_status: "not_started",
    },

    prepared_items: {
      adjustments: 0,
      bonuses_or_commissions: 0,
      off_cycle_requests: 0,
      corrections: 0,
    },

    processor: {
      connected: false,
      payroll_submitted: false,
      payroll_processed: false,
    },

    persistence: {
      mode: "session_memory_only",
      production_record_saved: false,
    },
  };
}


export function createBlankTellerPaymentIntakeRecord() {
  return {
    record_version:
      TELLER_PAYMENT_INTAKE_VERSION,

    payment_intake_id: "",

    business: {
      business_key: "",
    },

    prepared_items: {
      invoices: 0,
      payment_requests: 0,
      reimbursements: 0,
      exceptions: 0,
      refund_or_reversal_requests: 0,
    },

    processor: {
      connected: false,
      payment_sent: false,
      refund_sent: false,
      reversal_sent: false,
    },

    persistence: {
      mode: "session_memory_only",
      production_record_saved: false,
    },
  };
}


export function buildTellerPayrollPaymentPreview(
  packets = []
) {
  const payroll =
    createBlankTellerPayrollIntakeRecord();

  const payment =
    createBlankTellerPaymentIntakeRecord();


  const cycle =
    valuesFor(
      packets,
      "payroll_cycle_setup"
    );


  payroll.business.business_key =
    clean(
      cycle.business_unit
    );

  payroll.cycle.pay_period_start =
    clean(
      cycle.pay_period_start
    );

  payroll.cycle.pay_period_end =
    clean(
      cycle.pay_period_end
    );

  payroll.cycle.scheduled_payday =
    clean(
      cycle.scheduled_payday
    );

  payroll.cycle.pay_frequency =
    clean(
      cycle.pay_frequency
    );

  payroll.cycle.review_status =
    latestPacket(
      packets,
      "payroll_cycle_setup"
    )
      ? "prepared"
      : "not_started";


  payroll.prepared_items.adjustments =
    packetsFor(
      packets,
      "payroll_adjustment_request"
    ).length;

  payroll.prepared_items.bonuses_or_commissions =
    packetsFor(
      packets,
      "bonus_commission_request"
    ).length;

  payroll.prepared_items.off_cycle_requests =
    packetsFor(
      packets,
      "off_cycle_pay_request"
    ).length;

  payroll.prepared_items.corrections =
    packetsFor(
      packets,
      "payroll_correction_request"
    ).length;


  payment.prepared_items.invoices =
    packetsFor(
      packets,
      "invoice_intake"
    ).length;

  payment.prepared_items.payment_requests =
    packetsFor(
      packets,
      "payment_request"
    ).length;

  payment.prepared_items.reimbursements =
    packetsFor(
      packets,
      "reimbursement_request"
    ).length;

  payment.prepared_items.exceptions =
    packetsFor(
      packets,
      "payment_exception_request"
    ).length;

  payment.prepared_items.refund_or_reversal_requests =
    packetsFor(
      packets,
      "refund_reversal_request"
    ).length;


  return {
    payroll,
    payment,

    preview_only: true,

    workflow_transport_connected: false,
    payroll_processor_connected: false,
    payment_processor_connected: false,

    money_moved: false,

    persistence: {
      mode: "session_memory_only",
      production_record_saved: false,
    },
  };
}

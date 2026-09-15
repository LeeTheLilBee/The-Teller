export const TELLER_EMPLOYEE_SETUP_STEPS = Object.freeze([
  {
    step_id: "request",
    form_id: "new_hire_request",
    label: "New hire request",
    purpose:
      "Approve starting the employee setup workflow.",
  },
  {
    step_id: "person",
    form_id: "employee_personal_profile",
    label: "Personal profile",
    purpose:
      "Collect the employee's basic identity, contact, address, and emergency-contact details.",
  },
  {
    step_id: "assignment",
    form_id: "employment_assignment_setup",
    label: "Employment assignment",
    purpose:
      "Set the business, role, start date, department, manager, and work location.",
  },
  {
    step_id: "compensation",
    form_id: "compensation_setup_request",
    label: "Compensation setup",
    purpose:
      "Prepare the pay basis, pay rate, frequency, and effective date.",
  },
  {
    step_id: "documents",
    form_id: "employment_document_checklist",
    label: "Document checklist",
    purpose:
      "Track whether required payroll, eligibility, policy, and payment-setup workflows are complete.",
  },
]);


export function getTellerEmployeeSetupProgress(
  preparedPackets = []
) {
  const completedFormIds =
    new Set(
      (preparedPackets || [])
        .map((packet) => packet?.form_id)
        .filter(Boolean)
    );

  const steps =
    TELLER_EMPLOYEE_SETUP_STEPS.map(
      (step) => ({
        ...step,
        complete:
          completedFormIds.has(
            step.form_id
          ),
      })
    );

  const completed =
    steps.filter(
      (step) => step.complete
    ).length;

  const next =
    steps.find(
      (step) => !step.complete
    ) || null;

  return {
    steps,

    completed,
    total: steps.length,

    complete:
      completed === steps.length,

    next_step: next,
  };
}


export function getTellerEmployeeSetupFormIds() {
  return TELLER_EMPLOYEE_SETUP_STEPS.map(
    (step) => step.form_id
  );
}

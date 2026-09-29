import React, {
  useMemo,
} from "react";

import {
  getTellerEmployeeSetupProgress,
} from "./tellerEmploymentIntake.js";

import {
  buildTellerPeopleEmploymentPreview,
} from "./tellerPeopleRecordModel.js";


export default function TellerPeopleIntakePanel({
  role,
  preparedPackets = [],
  onOpenForm,
}) {
  const normalizedRole =
    String(role || "")
      .trim()
      .toLowerCase();

  const visible =
    normalizedRole === "manager" ||
    normalizedRole === "owner";

  const progress = useMemo(
    () =>
      getTellerEmployeeSetupProgress(
        preparedPackets
      ),
    [preparedPackets]
  );

  const preview = useMemo(
    () =>
      buildTellerPeopleEmploymentPreview(
        preparedPackets
      ),
    [preparedPackets]
  );


  if (!visible) {
    return null;
  }


  return (
    <section className="teller-people-intake">
      <div className="teller-people-intake-head">
        <div>
          <p className="teller-form-kicker">
            People intake
          </p>

          <h2>
            Set up an employee
          </h2>

          <p>
            Move through the employee setup
            packet without turning onboarding
            into one giant form.
          </p>
        </div>

        <div className="teller-people-intake-progress">
          <strong>
            {progress.completed}/{progress.total}
          </strong>

          <span>
            setup steps prepared
          </span>
        </div>
      </div>


      <div className="teller-people-step-grid">
        {progress.steps.map(
          (step, index) => (
            <button
              key={step.step_id}
              type="button"
              className={
                `teller-people-step ${
                  step.complete
                    ? "is-complete"
                    : ""
                }`
              }
              onClick={() =>
                onOpenForm?.(
                  step.form_id
                )
              }
            >
              <span>
                {index + 1}
              </span>

              <div>
                <strong>
                  {step.label}
                </strong>

                <p>
                  {step.purpose}
                </p>
              </div>

              <small>
                {
                  step.complete
                    ? "Prepared"
                    : "Open"
                }
              </small>
            </button>
          )
        )}
      </div>


      <div className="teller-people-intake-footer">
        <div>
          <small>
            Person preview
          </small>

          <strong>
            {
              preview.person
                .identity
                .legal_name ||
              "No employee name entered yet"
            }
          </strong>
        </div>

        <div>
          <small>
            Assignment
          </small>

          <strong>
            {
              preview.employment
                .assignment
                .job_title ||
              "No job assignment entered yet"
            }
          </strong>
        </div>

        <div>
          <small>
            Production record
          </small>

          <strong>
            Not saved yet
          </strong>
        </div>
      </div>


      {progress.next_step ? (
        <button
          type="button"
          className="teller-people-next"
          onClick={() =>
            onOpenForm?.(
              progress.next_step.form_id
            )
          }
        >
          Continue setup · {
            progress.next_step.label
          }
        </button>
      ) : (
        <div className="teller-people-complete">
          <strong>
            Setup packet prepared.
          </strong>

          <span>
            Production persistence and
            workflow transport are still
            separate later steps.
          </span>
        </div>
      )}
    </section>
  );
}

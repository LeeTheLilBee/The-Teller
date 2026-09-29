import React, {
  useMemo,
} from "react";

import {
  getTellerPayrollIntakeStatus,
  getTellerPaymentIntakeStatus,
} from "./tellerPayrollPaymentIntake.js";

import {
  buildTellerPayrollPaymentPreview,
} from "./tellerPayrollPaymentModel.js";


function IntakeColumn({
  kicker,
  title,
  description,
  actions,
  onOpenForm,
}) {
  return (
    <article className="teller-money-intake-column">
      <p className="teller-form-kicker">
        {kicker}
      </p>

      <h3>
        {title}
      </h3>

      <p className="teller-money-intake-description">
        {description}
      </p>

      <div className="teller-money-action-list">
        {actions.map(
          (action) => (
            <button
              type="button"
              key={action.action_id}
              onClick={() =>
                onOpenForm?.(
                  action.form_id
                )
              }
            >
              <div>
                <strong>
                  {action.label}
                </strong>

                <p>
                  {action.description}
                </p>
              </div>

              <small>
                {
                  action.prepared_count
                    ? `${action.prepared_count} prepared`
                    : "Open"
                }
              </small>
            </button>
          )
        )}
      </div>
    </article>
  );
}


export default function TellerPayrollPaymentPanel({
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


  const payroll = useMemo(
    () =>
      getTellerPayrollIntakeStatus(
        preparedPackets
      ),
    [preparedPackets]
  );


  const payments = useMemo(
    () =>
      getTellerPaymentIntakeStatus(
        preparedPackets
      ),
    [preparedPackets]
  );


  const preview = useMemo(
    () =>
      buildTellerPayrollPaymentPreview(
        preparedPackets
      ),
    [preparedPackets]
  );


  if (!visible) {
    return null;
  }


  return (
    <section className="teller-money-intake">

      <div className="teller-money-intake-head">
        <div>
          <p className="teller-form-kicker">
            Money intake
          </p>

          <h2>
            Payroll & Payments
          </h2>

          <p>
            Prepare the paperwork and review
            inputs before any real payroll or
            payment system is connected.
          </p>
        </div>

        <div className="teller-money-intake-stats">

          <div>
            <strong>
              {payroll.prepared_count}
            </strong>

            <span>
              payroll items prepared
            </span>
          </div>

          <div>
            <strong>
              {payments.prepared_count}
            </strong>

            <span>
              payment items prepared
            </span>
          </div>

        </div>
      </div>


      <div className="teller-money-intake-grid">

        <IntakeColumn
          kicker="Payroll"
          title="Payroll intake"
          description="Cycle setup, adjustments, additional earnings, off-cycle review, and payroll corrections."
          actions={payroll.actions}
          onOpenForm={onOpenForm}
        />


        <IntakeColumn
          kicker="Payments"
          title="Payment intake"
          description="Invoices, payment requests, reimbursements, exceptions, refunds, voids, and reversal review."
          actions={payments.actions}
          onOpenForm={onOpenForm}
        />

      </div>


      <div className="teller-money-intake-truth">

        <div>
          <small>
            Payroll processor
          </small>

          <strong>
            Not connected
          </strong>
        </div>


        <div>
          <small>
            Payment processor
          </small>

          <strong>
            Not connected
          </strong>
        </div>


        <div>
          <small>
            Money moved
          </small>

          <strong>
            No
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


      {preview.payroll.cycle.review_status ===
      "prepared" ? (
        <div className="teller-money-cycle-note">
          <strong>
            Payroll cycle prepared
          </strong>

          <span>
            {
              preview.payroll
                .cycle
                .pay_period_start || "—"
            }
            {" → "}
            {
              preview.payroll
                .cycle
                .pay_period_end || "—"
            }

            {" · Payday "}

            {
              preview.payroll
                .cycle
                .scheduled_payday || "—"
            }
          </span>
        </div>
      ) : null}

    </section>
  );
}


import React, { useState } from "react";
import {
  createBridgeId,
  createTowerBackupItem,
  saveEmployeeManagerItem,
  saveTowerBackupItem,
} from "./managerOwnerBridge";
import "./employeeStandaloneWorkspace.css";

const employeeRequestTypes = [
  ["missing_punch", "Missing punch"],
  ["pay_question", "Pay question"],
  ["document_update", "Document update"],
  ["proof_upload", "Send proof"],
  ["schedule_question", "Schedule question"],
  ["tax_document", "Tax document"],
  ["manager_help", "Need manager help"],
];

function EmployeeBadge({ children, tone = "quiet" }) {
  return <span className={`emp-badge emp-badge-${tone}`}>{children}</span>;
}

function createEmployeeRequest(form) {
  const id = createBridgeId("EMP-REQ");
  const createdAt = new Date().toISOString();

  return {
    id,
    source: "employee_portal",
    employeeName: form.employeeName || "Employee",
    businessKey: form.businessKey,
    requestType: form.requestType,
    title: form.title || `${form.employeeName || "Employee"} · ${form.requestLabel}`,
    body: form.body || "Employee submitted a request for manager review.",
    proofStatus: form.proofStatus,
    urgency: form.urgency,
    managerStatus: "Needs manager review",
    createdAt,
    towerBackedUp: true,
  };
}

export default function EmployeeStandaloneWorkspace() {
  const [activity, setActivity] = useState([]);
  const [form, setForm] = useState({
    employeeName: "",
    businessKey: "simpleepay",
    requestType: "missing_punch",
    title: "",
    body: "",
    proofStatus: "No proof attached yet",
    urgency: "Normal",
  });

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function submitToManager() {
    const selectedType = employeeRequestTypes.find(([key]) => key === form.requestType);
    const request = createEmployeeRequest({
      ...form,
      requestLabel: selectedType?.[1] || "Employee request",
    });

    const towerBackup = createTowerBackupItem({
      source: "employee_portal",
      action: "Employee sent request to manager",
      target: request.title,
      summary: "Employee-to-manager request backed up to The Tower local handoff queue.",
      payload: request,
    });

    saveEmployeeManagerItem(request);
    saveTowerBackupItem(towerBackup);

    setActivity((current) => [
      {
        id: createBridgeId("EMP-ACTIVITY"),
        title: "Sent to manager",
        body: `${request.title} was sent to the manager board and backed up to The Tower.`,
        createdAt: new Date().toISOString(),
        requestId: request.id,
        towerBackupId: towerBackup.id,
      },
      ...current,
    ].slice(0, 10));

    setForm((current) => ({
      ...current,
      title: "",
      body: "",
      proofStatus: "No proof attached yet",
      urgency: "Normal",
    }));
  }

  return (
    <main className="employee-workspace">
      <section className="emp-hero">
        <div>
          <p className="emp-kicker">Employee portal · The Teller</p>
          <h1>Pay, documents, and proof without the maze.</h1>
          <p>
            Employees can check pay-related items, see document placeholders, and send payroll/proof questions
            back to their manager. Every request is also backed up locally for The Tower.
          </p>
          <div className="emp-badge-row">
            <EmployeeBadge tone="strong">Employee view</EmployeeBadge>
            <EmployeeBadge>Simple + familiar</EmployeeBadge>
            <EmployeeBadge tone="warn">Tower-backed requests</EmployeeBadge>
          </div>
        </div>
      </section>

      <section className="emp-grid">
        <article className="emp-panel emp-focus-card">
          <p className="emp-kicker">Pay snapshot</p>
          <h2>This pay period</h2>
          <div className="emp-pay-facts">
            <div>
              <span>Estimated hours</span>
              <strong>32.5</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>Pending review</strong>
            </div>
            <div>
              <span>Next payday</span>
              <strong>Friday</strong>
            </div>
          </div>
          <p>
            This is a placeholder pay snapshot. Later it can connect to real payroll runs,
            time cards, manager approvals, and paystub history.
          </p>
        </article>

        <article className="emp-panel">
          <p className="emp-kicker">Quick cards</p>
          <h2>What employees can check.</h2>
          <div className="emp-card-stack">
            <div>
              <span>Clock-in card</span>
              <strong>Review punches and shift records.</strong>
            </div>
            <div>
              <span>Documents</span>
              <strong>Policy acknowledgments, onboarding, direct deposit.</strong>
            </div>
            <div>
              <span>Paystubs</span>
              <strong>Placeholder for paystub view and downloads.</strong>
            </div>
            <div>
              <span>Tax documents</span>
              <strong>Placeholder for W-2 / tax forms later.</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="emp-panel emp-request-panel">
        <div className="emp-section-head">
          <div>
            <p className="emp-kicker">Send to manager</p>
            <h2>Ask for help, send proof, or flag payroll.</h2>
            <p>This request goes to the manager board and creates a Tower backup copy.</p>
          </div>
          <EmployeeBadge tone="warn">Tower backup</EmployeeBadge>
        </div>

        <div className="emp-form-grid">
          <label>
            <span>Employee name</span>
            <input
              value={form.employeeName}
              onChange={(event) => updateForm("employeeName", event.target.value)}
              placeholder="Example: Maya J."
            />
          </label>

          <label>
            <span>Business</span>
            <select value={form.businessKey} onChange={(event) => updateForm("businessKey", event.target.value)}>
              <option value="simpleepay">SimpleePay</option>
              <option value="skincare">SimpleeSkincare</option>
              <option value="onthego">SimpleeOnTheGo</option>
              <option value="property">SimpleeProperty</option>
              <option value="mrktrade">MrkTrade admin only</option>
            </select>
          </label>

          <label>
            <span>Request type</span>
            <select value={form.requestType} onChange={(event) => updateForm("requestType", event.target.value)}>
              {employeeRequestTypes.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Proof status</span>
            <select value={form.proofStatus} onChange={(event) => updateForm("proofStatus", event.target.value)}>
              <option>No proof attached yet</option>
              <option>Proof ready</option>
              <option>Proof needs upload</option>
              <option>Manager needs to verify</option>
            </select>
          </label>

          <label>
            <span>Urgency</span>
            <select value={form.urgency} onChange={(event) => updateForm("urgency", event.target.value)}>
              <option>Normal</option>
              <option>Important</option>
              <option>Payroll urgent</option>
            </select>
          </label>

          <label className="emp-wide">
            <span>Short title</span>
            <input
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Example: My clock-out is missing"
            />
          </label>

          <label className="emp-wide">
            <span>Message to manager</span>
            <textarea
              value={form.body}
              onChange={(event) => updateForm("body", event.target.value)}
              rows={5}
              placeholder="Explain what happened or what proof you need reviewed..."
            />
          </label>
        </div>

        <button type="button" className="emp-primary" onClick={submitToManager}>
          Send to manager + Tower backup
        </button>
      </section>

      {activity.length ? (
        <section className="emp-panel">
          <div className="emp-section-head">
            <div>
              <p className="emp-kicker">Employee activity</p>
              <h2>Recent requests.</h2>
            </div>
            <EmployeeBadge tone="strong">{activity.length}</EmployeeBadge>
          </div>

          <div className="emp-activity-grid">
            {activity.map((item) => (
              <article key={item.id}>
                <span>{item.requestId}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>Tower backup: {item.towerBackupId}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

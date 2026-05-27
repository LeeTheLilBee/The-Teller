
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

const employeeTasks = [
  {
    key: "pay",
    eyebrow: "Pay review",
    title: "Check this pay period.",
    body: "Review hours, payday status, and anything that might need manager eyes.",
    status: "Pending review",
  },
  {
    key: "proof",
    eyebrow: "Proof / issue",
    title: "Send something to manager.",
    body: "Missing punch, pay question, document update, or proof request.",
    status: "Action available",
  },
  {
    key: "docs",
    eyebrow: "Documents",
    title: "View employee paperwork.",
    body: "Onboarding, direct deposit, acknowledgments, paystubs, and tax placeholders.",
    status: "Coming online",
  },
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
  const [activeTask, setActiveTask] = useState("proof");
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
      <section className="emp-command-card">
        <div className="emp-command-copy">
          <p className="emp-kicker">Employee lane · The Teller</p>
          <h1>Your pay, proof, and paperwork in one calm place.</h1>
          <p>
            Check what matters, send questions or proof to your manager, and keep a quiet Tower-backed trail
            when payroll or documents need review.
          </p>

          <div className="emp-command-badges">
            <EmployeeBadge tone="strong">Employee view</EmployeeBadge>
            <EmployeeBadge>Manager-routed requests</EmployeeBadge>
            <EmployeeBadge tone="warn">Tower-backed trail</EmployeeBadge>
          </div>
        </div>

        <aside className="emp-pay-orb">
          <p className="emp-kicker">This pay period</p>
          <strong>32.5 hrs</strong>
          <span>Estimated hours</span>
          <div>
            <EmployeeBadge tone="warn">Pending review</EmployeeBadge>
          </div>
        </aside>
      </section>

      <section className="emp-task-shell">
        <div className="emp-task-rail">
          {employeeTasks.map((task) => (
            <button
              key={task.key}
              type="button"
              className={activeTask === task.key ? "is-active" : ""}
              onClick={() => setActiveTask(task.key)}
            >
              <span>{task.eyebrow}</span>
              <strong>{task.title}</strong>
              <small>{task.status}</small>
            </button>
          ))}
        </div>

        <div className="emp-task-stage">
          {activeTask === "pay" ? (
            <section className="emp-stage-panel">
              <p className="emp-kicker">Pay review</p>
              <h2>What you can check right now.</h2>
              <div className="emp-mini-grid">
                <article>
                  <span>Hours</span>
                  <strong>32.5 estimated</strong>
                  <p>Placeholder until real time-card data is connected.</p>
                </article>
                <article>
                  <span>Payday</span>
                  <strong>Friday</strong>
                  <p>Pay run status and final approval will connect later.</p>
                </article>
                <article>
                  <span>Questions</span>
                  <strong>Send to manager</strong>
                  <p>Use the proof/question form if something looks wrong.</p>
                </article>
              </div>
            </section>
          ) : null}

          {activeTask === "proof" ? (
            <section className="emp-stage-panel emp-request-panel">
              <div className="emp-section-head">
                <div>
                  <p className="emp-kicker">Send to manager</p>
                  <h2>Ask for help, send proof, or flag payroll.</h2>
                  <p>This goes to the manager board and creates a local Tower backup copy.</p>
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
          ) : null}

          {activeTask === "docs" ? (
            <section className="emp-stage-panel">
              <p className="emp-kicker">Documents</p>
              <h2>Paperwork without the scavenger hunt.</h2>
              <div className="emp-doc-grid">
                <article>
                  <span>Paystubs</span>
                  <strong>Placeholder</strong>
                  <p>Future paystub viewer and downloads.</p>
                </article>
                <article>
                  <span>Tax documents</span>
                  <strong>Placeholder</strong>
                  <p>Future W-2 / tax document area.</p>
                </article>
                <article>
                  <span>Employee docs</span>
                  <strong>Placeholder</strong>
                  <p>Onboarding, policies, direct deposit, and acknowledgments.</p>
                </article>
                <article>
                  <span>Proof uploads</span>
                  <strong>Manager-routed</strong>
                  <p>Proof requests can be sent to manager from the proof tab.</p>
                </article>
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {activity.length ? (
        <section className="emp-activity-panel">
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

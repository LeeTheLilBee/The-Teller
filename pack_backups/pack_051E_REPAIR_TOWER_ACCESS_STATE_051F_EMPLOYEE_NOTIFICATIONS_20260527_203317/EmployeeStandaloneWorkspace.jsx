
import React, { useEffect, useState } from "react";
import {
  createBridgeId,
  createTowerBackupItem,
  saveEmployeeManagerItem,
  saveTowerBackupItem,
  readEmployeeResponseQueue,
} from "./managerOwnerBridge";
import "./employeeStandaloneWorkspace.css";

const portalEmployee = {
  name: "Maya J.",
  businessKey: "simpleepay",
  businessLabel: "SimpleePay",
  role: "Payroll Assistant",
  manager: "Manager Portal",
  hours: "32.5",
  payStatus: "Pending review",
  nextPayday: "Friday",
};

const employeeRequestTypes = [
  ["missing_punch", "Missing punch"],
  ["pay_question", "Pay question"],
  ["document_update", "Document update"],
  ["proof_upload", "Send proof"],
  ["schedule_question", "Schedule question"],
  ["tax_document", "Tax document"],
  ["manager_help", "Need manager help"],
  ["tower_record", "Tower record / secure document request"],
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
    employeeName: portalEmployee.name,
    businessKey: portalEmployee.businessKey,
    requestType: form.requestType,
    title: form.title || `${portalEmployee.name} · ${form.requestLabel}`,
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
  const [managerResponses, setManagerResponses] = useState([]);
  const [form, setForm] = useState({
    requestType: "missing_punch",
    title: "",
    body: "",
    proofStatus: "No proof attached yet",
    urgency: "Normal",
  });

  function refreshEmployeeResponses() {
    const responses = readEmployeeResponseQueue()
      .filter((item) => item.employeeName === portalEmployee.name)
      .slice(0, 10);

    setManagerResponses(responses);
  }

  useEffect(() => {
    refreshEmployeeResponses();

    function handleBridgeUpdate() {
      refreshEmployeeResponses();
    }

    window.addEventListener("the-teller-bridge-updated", handleBridgeUpdate);
    window.addEventListener("storage", handleBridgeUpdate);

    return () => {
      window.removeEventListener("the-teller-bridge-updated", handleBridgeUpdate);
      window.removeEventListener("storage", handleBridgeUpdate);
    };
  }, []);

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
      <section className="emp-simple-hero">
        <div className="emp-hero-copy">
          <p className="emp-kicker">Employee lane · The Teller</p>
          <h1>Pay questions, proof, and manager help.</h1>
          <p>
            This is the employee’s calm money lane. Hours and payroll status are visible here.
            Questions or proof can be sent to the manager, and the request is backed up to The Tower.
          </p>

          <div className="emp-command-badges">
            <EmployeeBadge tone="strong">{portalEmployee.name}</EmployeeBadge>
            <EmployeeBadge>{portalEmployee.businessLabel}</EmployeeBadge>
            <EmployeeBadge tone="warn">Tower-backed requests</EmployeeBadge>
          </div>
        </div>

        <aside className="emp-hours-card">
          <p className="emp-kicker">This pay period</p>
          <strong>{portalEmployee.hours}</strong>
          <span>estimated hours</span>

          <div className="emp-hours-facts">
            <div>
              <small>Status</small>
              <b>{portalEmployee.payStatus}</b>
            </div>
            <div>
              <small>Next payday</small>
              <b>{portalEmployee.nextPayday}</b>
            </div>
            <div>
              <small>Clock-in</small>
              <b>Tower controlled</b>
            </div>
          </div>
        </aside>
      </section>

      <section className="emp-main-flow">
        <article className="emp-request-card">
          <div className="emp-section-head">
            <div>
              <p className="emp-kicker">Send to manager</p>
              <h2>Need something fixed or reviewed?</h2>
              <p>
                Send a pay question, missing punch note, document update, proof message, or Tower record request to the manager.
                The Tower keeps a backup trail automatically.
              </p>
            </div>
            <EmployeeBadge tone="warn">Tower backup</EmployeeBadge>
          </div>

          <div className="emp-form-grid">
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
        </article>

        <aside className="emp-side-card">
          <p className="emp-kicker">Profile context</p>
          <h3>{portalEmployee.name}</h3>
          <p>{portalEmployee.businessLabel} · {portalEmployee.role}</p>

          <div className="emp-side-list">
            <div>
              <span>Manager</span>
              <strong>{portalEmployee.manager}</strong>
            </div>
            <div>
              <span>Secure docs</span>
              <strong>Tower / Archive later</strong>
            </div>
            <div>
              <span>Clock-in</span>
              <strong>Handled by The Tower</strong>
            </div>
          </div>
        </aside>
      </section>

      {managerResponses.length ? (
        <section className="emp-activity-panel emp-manager-responses">
          <div className="emp-section-head">
            <div>
              <p className="emp-kicker">Manager responses</p>
              <h2>Replies from manager.</h2>
            </div>
            <EmployeeBadge tone="strong">{managerResponses.length}</EmployeeBadge>
          </div>

          <div className="emp-activity-grid">
            {managerResponses.map((item) => (
              <article key={item.id} className="emp-manager-response-card">
                <span>{item.responseStatus}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>Proof: {item.proofStatus}</small>
                <small>Tower-backed: {item.towerBackedUp ? "Yes" : "No"}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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

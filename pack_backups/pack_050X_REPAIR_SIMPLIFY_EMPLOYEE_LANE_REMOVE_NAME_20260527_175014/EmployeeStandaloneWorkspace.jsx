
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
    eyebrow: "Manager request",
    title: "Send proof or ask a question.",
    body: "Missing punch, pay question, document update, or proof request.",
    status: "Action available",
  },
  {
    key: "profile",
    eyebrow: "Profile",
    title: "My employee profile.",
    body: "Contact, role, manager, business, and profile update placeholders.",
    status: "Secure profile",
  },
  {
    key: "docs",
    eyebrow: "Secure docs",
    title: "My documents.",
    body: "Paystubs, tax docs, direct deposit, acknowledgments, and proof records.",
    status: "Tower-backed",
  },
];

const employeeSecureDocs = [
  {
    key: "paystubs",
    label: "Paystubs",
    title: "Paystub viewer",
    body: "Placeholder for current and historical paystub downloads.",
    status: "Coming online",
    tower: true,
  },
  {
    key: "tax",
    label: "Tax documents",
    title: "W-2 / tax forms",
    body: "Placeholder for annual tax forms and tax document access.",
    status: "Secure placeholder",
    tower: true,
  },
  {
    key: "direct_deposit",
    label: "Direct deposit",
    title: "Payment destination",
    body: "Placeholder for bank/payment setup. Changes should route through secure review.",
    status: "Tower-sensitive",
    tower: true,
  },
  {
    key: "policies",
    label: "Policies",
    title: "Acknowledgments",
    body: "Placeholder for handbook, agreements, and policy acknowledgment records.",
    status: "Needs versioning",
    tower: false,
  },
  {
    key: "proof",
    label: "Proof vault",
    title: "Proof and requests",
    body: "Placeholder for proof packets sent to managers or attached to payroll questions.",
    status: "Manager-routed",
    tower: true,
  },
  {
    key: "profile_docs",
    label: "Profile docs",
    title: "Identity and onboarding",
    body: "Placeholder for onboarding profile documents and employee record updates.",
    status: "Secure profile",
    tower: true,
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
          <h1>Profile, pay, documents, and proof in one secure lane.</h1>
          <p>
            Employees can check pay-related items, view secure document placeholders, update profile items,
            and send questions or proof to managers with a local Tower-backed trail.
          </p>

          <div className="emp-command-badges">
            <EmployeeBadge tone="strong">Employee view</EmployeeBadge>
            <EmployeeBadge>Manager-routed requests</EmployeeBadge>
            <EmployeeBadge tone="warn">Tower-backed docs</EmployeeBadge>
          </div>
        </div>

        <aside className="emp-identity-card">
          <p className="emp-kicker">Employee profile</p>
          <strong>Maya J.</strong>
          <span>SimpleePay · Payroll Assistant</span>
          <div className="emp-profile-mini">
            <div>
              <small>Manager</small>
              <b>Manager Portal</b>
            </div>
            <div>
              <small>Status</small>
              <b>Active</b>
            </div>
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
                  <span>Paystub</span>
                  <strong>Secure docs</strong>
                  <p>Paystub records will live inside Secure Docs.</p>
                </article>
                <article>
                  <span>Questions</span>
                  <strong>Send to manager</strong>
                  <p>Use the manager request tab if anything looks off.</p>
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

          {activeTask === "profile" ? (
            <section className="emp-stage-panel">
              <p className="emp-kicker">Employee profile</p>
              <h2>Your secure employee record.</h2>

              <div className="emp-profile-layout">
                <article className="emp-profile-large">
                  <span>Profile snapshot</span>
                  <strong>Maya J.</strong>
                  <p>SimpleePay · Payroll Assistant · Active employee placeholder.</p>
                  <div className="emp-profile-tags">
                    <EmployeeBadge tone="strong">Active</EmployeeBadge>
                    <EmployeeBadge>Manager-routed updates</EmployeeBadge>
                    <EmployeeBadge tone="warn">Tower-backed changes</EmployeeBadge>
                  </div>
                </article>

                <div className="emp-profile-list">
                  <article>
                    <span>Contact details</span>
                    <strong>Placeholder</strong>
                    <p>Phone, email, emergency contact, and address updates.</p>
                  </article>
                  <article>
                    <span>Role / business</span>
                    <strong>SimpleePay</strong>
                    <p>Role, assigned business, manager, and PayRole later.</p>
                  </article>
                  <article>
                    <span>Payment setup</span>
                    <strong>Tower-sensitive</strong>
                    <p>Direct deposit and payment destination changes need secure review.</p>
                  </article>
                  <article>
                    <span>Profile update</span>
                    <strong>Send to manager</strong>
                    <p>Employee profile updates can route to manager with Tower backup.</p>
                  </article>
                </div>
              </div>
            </section>
          ) : null}

          {activeTask === "docs" ? (
            <section className="emp-stage-panel">
              <div className="emp-section-head">
                <div>
                  <p className="emp-kicker">Secure documents</p>
                  <h2>Pay, tax, profile, and proof records.</h2>
                  <p>These are placeholders now, but the structure is ready for Archive Vault and Tower control.</p>
                </div>
                <EmployeeBadge tone="warn">Tower backup ready</EmployeeBadge>
              </div>

              <div className="emp-doc-grid">
                {employeeSecureDocs.map((doc) => (
                  <article key={doc.key} className={doc.tower ? "is-tower-doc" : ""}>
                    <span>{doc.label}</span>
                    <strong>{doc.title}</strong>
                    <p>{doc.body}</p>
                    <small>{doc.status}</small>
                  </article>
                ))}
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


import React, { useEffect, useState } from "react";
import {
  createBridgeId,
  createTowerBackupItem,
  saveEmployeeManagerItem,
  saveTowerBackupItem,
  readEmployeeResponseQueue,
} from "./managerOwnerBridge";
import "./employeeStandaloneWorkspace.css";


import FinalReceiptViewer from "./FinalReceiptViewer.jsx";
const EMPLOYEE_SEEN_MANAGER_RESPONSES_KEY = "the_teller_employee_seen_manager_responses_v1";

function readSeenEmployeeResponseIds() {
  try {
    const raw = window.localStorage.getItem(EMPLOYEE_SEEN_MANAGER_RESPONSES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSeenEmployeeResponseIds(ids) {
  try {
    window.localStorage.setItem(
      EMPLOYEE_SEEN_MANAGER_RESPONSES_KEY,
      JSON.stringify(Array.from(new Set(ids)).slice(0, 150))
    );
  } catch {
    // localStorage is optional
  }
}

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


function createEmployeeNotice({ type = "info", title, body, target }) {
  return {
    id: `EMP-NOTICE-${Math.floor(100000 + Math.random() * 900000)}`,
    type,
    title,
    body,
    target,
    createdAt: new Date().toISOString(),
  };
}

function EmployeeNotificationsDropdown({ notifications, open, setOpen, onClear }) {
  return (
    <div className="emp-notifications-shell">
      <button
        type="button"
        className={`emp-notifications-button ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
      >
        Notifications
        {notifications.length ? <span>{notifications.length}</span> : null}
      </button>

      {open ? (
        <aside className="emp-notifications-menu">
          <div className="emp-section-head">
            <div>
              <p className="emp-kicker">Employee notifications</p>
              <h2>Updates from your lane.</h2>
            </div>
            {notifications.length ? (
              <button type="button" className="emp-secondary-button" onClick={onClear}>
                Clear
              </button>
            ) : null}
          </div>

          <div className="emp-notice-list">
            {notifications.length ? notifications.map((notice) => (
              <article key={notice.id} className={`emp-notice emp-notice-${notice.type}`}>
                <span>{notice.type}</span>
                <strong>{notice.title}</strong>
                <p>{notice.body}</p>
                {notice.target ? <small>{notice.target}</small> : null}
              </article>
            )) : (
              <article className="emp-notice emp-notice-empty">
                <span>Quiet</span>
                <strong>No employee notifications yet.</strong>
                <p>Requests and manager replies will show here.</p>
              </article>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
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
  const [employeeNotificationsOpen, setEmployeeNotificationsOpen] = useState(false);
  const [employeeNotifications, setEmployeeNotifications] = useState([]);
  const [selectedManagerResponse, setSelectedManagerResponse] = useState(null);
  const [employeeFollowUpDraft, setEmployeeFollowUpDraft] = useState({
    title: "",
    body: "",
    proofStatus: "Additional info provided",
    urgency: "Normal",
  });
  const [form, setForm] = useState({
    requestType: "missing_punch",
    title: "",
    body: "",
    proofStatus: "No proof attached yet",
    urgency: "Normal",
  });

  function pushEmployeeNotice(notice) {
    setEmployeeNotifications((current) => [notice, ...current].slice(0, 12));
  }

  function clearEmployeeNotifications() {
    setEmployeeNotifications([]);
    setEmployeeNotificationsOpen(false);
  }

  function refreshEmployeeResponses() {
    const responses = readEmployeeResponseQueue()
      .filter((item) => item.employeeName === portalEmployee.name)
      .slice(0, 10);

    const seenIds = readSeenEmployeeResponseIds();
    const seenSet = new Set(seenIds);
    const freshResponses = responses.filter((item) => item?.id && !seenSet.has(item.id));

    if (freshResponses.length) {
      freshResponses.forEach((item) => {
        pushEmployeeNotice(createEmployeeNotice({
          type: String(item.responseStatus || "").toLowerCase().includes("tower") ? "tower" : "manager",
          title: item.responseStatus || "Manager responded",
          body: item.body || "Your manager responded to your request.",
          target: item.title || item.id,
        }));
      });

      saveSeenEmployeeResponseIds([
        ...freshResponses.map((item) => item.id),
        ...seenIds,
      ]);

      setEmployeeNotificationsOpen(true);
    }

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

  function openManagerResponseDetail(response) {
    setSelectedManagerResponse(response);
    setEmployeeFollowUpDraft({
      title: `Follow-up · ${response.title || "Manager response"}`,
      body: "",
      proofStatus: "Additional info provided",
      urgency: String(response.responseStatus || "").toLowerCase().includes("proof") ? "Important" : "Normal",
    });
  }

  function updateEmployeeFollowUpDraft(key, value) {
    setEmployeeFollowUpDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function sendManagerResponseFollowUp() {
    if (!selectedManagerResponse) return;

    const followUp = {
      id: createBridgeId("EMP-FOLLOWUP"),
      source: "employee_portal",
      employeeName: portalEmployee.name,
      businessKey: portalEmployee.businessKey,
      requestType: selectedManagerResponse.responseStatus === "Needs More Info" ? "tower_record" : "manager_help",
      title: employeeFollowUpDraft.title || `Follow-up · ${selectedManagerResponse.title}`,
      body: employeeFollowUpDraft.body || "Employee added more information to a manager response.",
      proofStatus: employeeFollowUpDraft.proofStatus,
      urgency: employeeFollowUpDraft.urgency,
      managerStatus: "Employee follow-up needs manager review",
      createdAt: new Date().toISOString(),
      towerBackedUp: true,
      parentResponseId: selectedManagerResponse.id,
      parentRequestId: selectedManagerResponse.requestId,
      followUpType: "employee_response_follow_up",
    };

    const towerBackup = createTowerBackupItem({
      source: "employee_portal",
      action: "Employee added more information to manager response",
      target: followUp.title,
      summary: "Employee follow-up to manager response backed up to The Tower local handoff queue.",
      payload: {
        followUp,
        managerResponse: selectedManagerResponse,
      },
    });

    saveEmployeeManagerItem(followUp);
    saveTowerBackupItem(towerBackup);

    pushEmployeeNotice(createEmployeeNotice({
      type: followUp.requestType === "tower_record" ? "tower" : "sent",
      title: "Follow-up sent",
      body: "Your added information was sent back to the manager and backed up to The Tower.",
      target: followUp.id,
    }));
    setEmployeeNotificationsOpen(true);

    setActivity((current) => [
      {
        id: createBridgeId("EMP-ACTIVITY"),
        title: "Follow-up sent",
        body: `${followUp.title} was sent back to the manager.`,
        createdAt: new Date().toISOString(),
        requestId: followUp.id,
        towerBackupId: towerBackup.id,
      },
      ...current,
    ].slice(0, 10));

    setSelectedManagerResponse(null);
    setEmployeeFollowUpDraft({
      title: "",
      body: "",
      proofStatus: "Additional info provided",
      urgency: "Normal",
    });
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

    pushEmployeeNotice(createEmployeeNotice({
      type: request.requestType === "tower_record" ? "tower" : "sent",
      title: request.requestType === "tower_record" ? "Tower request sent" : "Sent to manager",
      body: `${request.title} was sent to your manager and backed up to The Tower.`,
      target: request.id,
    }));
    setEmployeeNotificationsOpen(true);

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
      <div className="emp-corner-tools">
        <EmployeeNotificationsDropdown
          notifications={employeeNotifications}
          open={employeeNotificationsOpen}
          setOpen={setEmployeeNotificationsOpen}
          onClear={clearEmployeeNotifications}
        />
      </div>

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
              <article
                key={item.id}
                className="emp-manager-response-card emp-clickable-response"
                onClick={() => openManagerResponseDetail(item)}
              >
                <span>{item.responseStatus}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>Proof: {item.proofStatus}</small>
                <small>Tower-backed: {item.towerBackedUp ? "Yes" : "No"}</small>
                <button type="button" onClick={(event) => {
                  event.stopPropagation();
                  openManagerResponseDetail(item);
                }}>
                  Add more info
                </button>
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
      
      <FinalReceiptViewer mode="employee" employeeName={portalEmployee.name} />

      {selectedManagerResponse ? (
        <div className="emp-response-detail-overlay" role="dialog" aria-modal="true">
          <section className="emp-response-detail-modal">
            <div className="emp-section-head">
              <div>
                <p className="emp-kicker">Manager response detail</p>
                <h2>{selectedManagerResponse.title}</h2>
                <p>{selectedManagerResponse.body}</p>
              </div>
              <button type="button" className="emp-secondary-button" onClick={() => setSelectedManagerResponse(null)}>
                Close
              </button>
            </div>

            <div className="emp-response-detail-grid">
              <article>
                <span>Status</span>
                <strong>{selectedManagerResponse.responseStatus}</strong>
              </article>
              <article>
                <span>Proof</span>
                <strong>{selectedManagerResponse.proofStatus}</strong>
              </article>
              <article>
                <span>Manager</span>
                <strong>{selectedManagerResponse.managerName}</strong>
              </article>
              <article>
                <span>Tower</span>
                <strong>{selectedManagerResponse.towerBackedUp ? "Backed up" : "Not backed up"}</strong>
              </article>
            </div>

            <section className="emp-followup-card">
              <p className="emp-kicker">Add more information</p>
              <h3>Send a follow-up back to manager.</h3>
              <p>
                Use this when the manager needs more proof, you need to correct something,
                or you want to add detail before they decide.
              </p>

              <div className="emp-followup-grid">
                <label>
                  <span>Proof status</span>
                  <select
                    value={employeeFollowUpDraft.proofStatus}
                    onChange={(event) => updateEmployeeFollowUpDraft("proofStatus", event.target.value)}
                  >
                    <option>Additional info provided</option>
                    <option>Proof ready</option>
                    <option>Proof still missing</option>
                    <option>Needs manager review</option>
                  </select>
                </label>

                <label>
                  <span>Urgency</span>
                  <select
                    value={employeeFollowUpDraft.urgency}
                    onChange={(event) => updateEmployeeFollowUpDraft("urgency", event.target.value)}
                  >
                    <option>Normal</option>
                    <option>Important</option>
                    <option>Payroll urgent</option>
                  </select>
                </label>

                <label className="emp-wide">
                  <span>Follow-up title</span>
                  <input
                    value={employeeFollowUpDraft.title}
                    onChange={(event) => updateEmployeeFollowUpDraft("title", event.target.value)}
                    placeholder="Example: Here is the missing proof"
                  />
                </label>

                <label className="emp-wide">
                  <span>More information</span>
                  <textarea
                    value={employeeFollowUpDraft.body}
                    onChange={(event) => updateEmployeeFollowUpDraft("body", event.target.value)}
                    rows={5}
                    placeholder="Add the correction, proof note, or extra detail for your manager..."
                  />
                </label>
              </div>

              <button type="button" className="emp-primary" onClick={sendManagerResponseFollowUp}>
                Send follow-up to manager + Tower backup
              </button>
            </section>
          </section>
        </div>
      ) : null}

    </main>
  );
}


import React, { useEffect, useState } from "react";
import {
  createBridgeId,
  readManagerReturnQueue,
  readManagerSubmissions,
  readEmployeeManagerQueue,
  updateEmployeeManagerItem,
  createEmployeeResponseItem,
  saveEmployeeResponseItem,
  createTowerBackupItem,
  saveTowerBackupItem,
  saveManagerSubmission,
  updateManagerReturnItem,
  createManagerReReviewSubmission,
} from "./managerOwnerBridge";
import "./managerStandaloneWorkspace.css";

const managerBusinessOptions = [
  ["simpleepay", "SimpleePay"],
  ["skincare", "SimpleeSkincare"],
  ["onthego", "SimpleeOnTheGo"],
  ["property", "SimpleeProperty"],
  ["mrktrade", "MrkTrade"],
];

const managerIssueOptions = [
  ["clock", "Clock-in / shift issue"],
  ["edit", "Manager time edit"],
  ["proof", "Proof request"],
  ["expense", "Money item"],
  ["tower", "Tower-sensitive item"],
];

function buildManagerSubmission(form) {
  const id = createBridgeId("MGR-SUBMIT");
  const createdAt = new Date().toISOString();

  return {
    id,
    key: id,
    businessKey: form.businessKey,
    source: "manager_standalone",
    label: form.issueTypeLabel,
    title: form.title || `${form.person || "Manager item"} · ${form.issueTypeLabel}`,
    detail: form.managerNote || "Manager submitted this item for owner review.",
    money: form.moneyImpact || "Needs review",
    status: form.proofStatus,
    risk: form.risk,
    proof: form.proofStatus === "Needs proof" ? "Manager proof needed" : "Manager-submitted proof context",
    tower: Boolean(form.towerSensitive),
    person: form.person || "Unassigned person",
    submittedAt: createdAt,
    managerBridge: {
      submittedBy: "Manager standalone board",
      submittedAt: new Date(createdAt).toLocaleString(),
      managerDecision: form.managerDecision || "Needs owner review",
      managerRiskFlag: form.risk,
      managerNote: form.managerNote || "Manager submitted this from the standalone manager board.",
      recommendation: form.recommendation || "Owner should review before money moves.",
      ownerDefault: form.towerSensitive ? "Send to Tower" : "Pending owner review",
      disagreementRisk: form.risk === "High" || form.towerSensitive,
      towerRequired: Boolean(form.towerSensitive),
    },
  };
}


function createManagerNotice({ type = "info", title, body, target }) {
  const random = Math.floor(100000 + Math.random() * 900000);

  return {
    id: `MGR-NOTICE-${random}`,
    type,
    title,
    body,
    target,
    createdAt: new Date().toISOString(),
  };
}

function managerNoticeTone(type = "info") {
  const map = {
    submitted: "strong",
    returned: "warn",
    proof: "warn",
    ready: "strong",
    tower: "warn",
    status: "quiet",
    info: "quiet",
  };

  return map[type] || "quiet";
}

function ManagerNotificationsDropdown({ notifications, open, setOpen, onClear }) {
  return (
    <div className="mgr-notifications-shell">
      <button
        type="button"
        className={`mgr-notifications-button ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
      >
        Notifications
        {notifications.length ? <span>{notifications.length}</span> : null}
      </button>

      {open ? (
        <aside className="mgr-notifications-menu">
          <div className="mgr-section-head">
            <div>
              <p className="mgr-kicker">Manager notifications</p>
              <h2>Recent board activity.</h2>
            </div>
            {notifications.length ? (
              <button type="button" className="mgr-secondary" onClick={onClear}>
                Clear
              </button>
            ) : null}
          </div>

          <div className="mgr-notice-list">
            {notifications.length ? notifications.map((notice) => (
              <article key={notice.id} className={`mgr-notice mgr-notice-${notice.type}`}>
                <div className="mgr-card-top">
                  <ManagerBadge tone={managerNoticeTone(notice.type)}>{notice.type}</ManagerBadge>
                  <small>{new Date(notice.createdAt).toLocaleTimeString()}</small>
                </div>
                <strong>{notice.title}</strong>
                <p>{notice.body}</p>
                {notice.target ? <small>{notice.target}</small> : null}
              </article>
            )) : (
              <article className="mgr-empty">
                <p className="mgr-kicker">Quiet</p>
                <strong>No manager notifications yet.</strong>
                <p>Manager submissions, owner returns, and response actions will appear here.</p>
              </article>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function ManagerActivityTrail({ activity }) {
  if (!activity.length) return null;

  return (
    <section className="mgr-panel mgr-activity-panel">
      <div className="mgr-section-head">
        <div>
          <p className="mgr-kicker">Manager activity trail</p>
          <h2>Recent manager-side actions.</h2>
        </div>
        <ManagerBadge tone="strong">{activity.length}</ManagerBadge>
      </div>

      <div className="mgr-activity-grid">
        {activity.map((item) => (
          <article key={item.id} className={`mgr-activity-card is-${item.type}`}>
            <span>{item.type}</span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            {item.target ? <small>{item.target}</small> : null}
            <small>{new Date(item.createdAt).toLocaleString()}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function ManagerBadge({ children, tone = "quiet" }) {
  return <span className={`mgr-badge mgr-badge-${tone}`}>{children}</span>;
}


function normalizeManagerStatus(value = "") {
  return String(value || "").toLowerCase();
}

function getManagerWorkItems(returnQueue, submissions) {
  const returnedItems = returnQueue.map((item) => ({
    ...item,
    workType: "returned",
    displayTitle: item.title,
    displayBody: item.reason || item.ownerNote || "Owner returned this item for manager action.",
    displayStatus: item.managerStatus || "Needs manager action",
    displayRisk: item.risk || item.managerContext?.managerRiskFlag || "Medium",
    displayBusiness: item.business || item.businessKey || "Owner Review Desk",
    createdAt: item.createdAt,
  }));

  const submittedItems = submissions.map((item) => ({
    ...item,
    workType: "submitted",
    displayTitle: item.title,
    displayBody: item.detail || item.managerBridge?.managerNote || "Manager submitted this item upward.",
    displayStatus: item.status || "Submitted upward",
    displayRisk: item.risk || item.managerBridge?.managerRiskFlag || "Medium",
    displayBusiness: item.businessKey || "Manager submission",
    createdAt: item.submittedAt,
  }));

  return [...returnedItems, ...submittedItems].sort((a, b) => {
    const left = new Date(a.createdAt || 0).getTime();
    const right = new Date(b.createdAt || 0).getTime();
    return right - left;
  });
}

function managerFilterMatches(item, filter) {
  const status = normalizeManagerStatus(item.displayStatus);
  const risk = normalizeManagerStatus(item.displayRisk);
  const workType = item.workType;
  const tower = Boolean(item.tower || item.towerSensitive || item.managerContext?.towerRequired || item.managerBridge?.towerRequired);

  if (filter === "all") return true;
  if (filter === "returned") return workType === "returned";
  if (filter === "needs_action") return workType === "returned" && (status.includes("needs") || status.includes("action"));
  if (filter === "proof_gathering") return status.includes("proof") || status.includes("gather");
  if (filter === "ready_review") return status.includes("ready") || status.includes("re-review");
  if (filter === "submitted") return workType === "submitted";
  if (filter === "tower") return tower || risk === "high";
  if (filter === "completed") return status.includes("acknowledged") || status.includes("sent back") || status.includes("complete");

  return true;
}

function ManagerFilterTabs({ activeFilter, setActiveFilter, workItems }) {
  const filters = [
    ["all", "All"],
    ["returned", "Returned by Owner"],
    ["needs_action", "Needs Manager Action"],
    ["proof_gathering", "Proof Being Gathered"],
    ["ready_review", "Ready for Owner"],
    ["submitted", "Submitted Upward"],
    ["tower", "Tower-sensitive"],
    ["completed", "Completed"],
  ];

  return (
    <section className="mgr-filter-panel">
      <div className="mgr-section-head">
        <div>
          <p className="mgr-kicker">Manager work lanes</p>
          <h2>Filter the board by what needs doing.</h2>
        </div>
        <ManagerBadge tone="strong">{workItems.length} total</ManagerBadge>
      </div>

      <div className="mgr-filter-tabs">
        {filters.map(([key, label]) => {
          const count = workItems.filter((item) => managerFilterMatches(item, key)).length;

          return (
            <button
              key={key}
              type="button"
              className={activeFilter === key ? "is-active" : ""}
              onClick={() => setActiveFilter(key)}
            >
              {label}
              <span>{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ManagerUnifiedWorkBoard({ workItems, activeFilter, onOpenReturn, onMarkReturn }) {
  const filtered = workItems.filter((item) => managerFilterMatches(item, activeFilter));

  return (
    <section className="mgr-panel">
      <div className="mgr-section-head">
        <div>
          <p className="mgr-kicker">Manager work queue</p>
          <h2>One board for returned items and submitted work.</h2>
          <p>Use the lanes above to move through manager tasks without hunting around the page.</p>
        </div>
        <ManagerBadge tone="warn">{filtered.length} showing</ManagerBadge>
      </div>

      <div className="mgr-work-grid">
        {filtered.length ? filtered.map((item) => (
          <article key={`${item.workType}-${item.id || item.key}`} className={`mgr-work-card is-${item.workType} ${item.tower || item.managerContext?.towerRequired || item.managerBridge?.towerRequired ? "is-tower" : ""}`}>
            <div className="mgr-card-top">
              <span>{item.workType === "returned" ? "Returned by owner" : "Submitted upward"}</span>
              <small>{item.displayStatus}</small>
            </div>

            <strong>{item.displayTitle}</strong>
            <p>{item.displayBody}</p>

            <div className="mgr-work-meta">
              <small>{item.displayBusiness}</small>
              <small>Risk: {item.displayRisk}</small>
              {item.tower || item.managerContext?.towerRequired || item.managerBridge?.towerRequired ? <small>Tower-sensitive</small> : null}
            </div>

            {item.workType === "returned" ? (
              <div className="mgr-card-actions">
                <button type="button" onClick={() => onOpenReturn(item)}>Open details</button>
                <button type="button" onClick={() => onMarkReturn(item.id, "Manager acknowledged")}>Acknowledge</button>
                <button type="button" onClick={() => onMarkReturn(item.id, "Proof being gathered")}>Gather proof</button>
                <button type="button" onClick={() => onMarkReturn(item.id, "Ready for owner re-review")}>Ready</button>
              </div>
            ) : (
              <div className="mgr-card-actions">
                <button type="button" disabled>Owner review pending</button>
              </div>
            )}
          </article>
        )) : (
          <article className="mgr-empty">
            <p className="mgr-kicker">Nothing in this lane</p>
            <strong>No manager work matches this filter.</strong>
            <p>Switch lanes or wait for an owner send-back/submission update.</p>
          </article>
        )}
      </div>
    </section>
  );
}



function ManagerEmployeeRequestDock({ requests, onMark, onOpen }) {
  if (!requests.length) return null;

  return (
    <section className="mgr-panel mgr-employee-request-dock">
      <div className="mgr-section-head">
        <div>
          <p className="mgr-kicker">Employee requests</p>
          <h2>Employee items sent back to manager.</h2>
          <p>These came from the employee portal and were backed up to The Tower.</p>
        </div>
        <ManagerBadge tone="warn">{requests.length}</ManagerBadge>
      </div>

      <div className="mgr-employee-request-grid">
        {requests.map((item) => (
          <article key={item.id} className={`mgr-employee-request-card ${item.urgency === "Payroll urgent" ? "is-urgent" : ""}`}>
            <div className="mgr-card-top">
              <span>{item.employeeName}</span>
              <small>{item.managerStatus}</small>
            </div>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            {item.managerResponse ? <p className="mgr-employee-response-preview">Response: {item.managerResponse}</p> : null}
            <div className="mgr-work-meta">
              <small>{item.businessKey}</small>
              <small>{item.proofStatus}</small>
              <small>{item.urgency}</small>
              <small>Tower-backed</small>
            </div>
            <div className="mgr-card-actions">
              <button type="button" onClick={() => onOpen(item)}>Open details</button>
              <button type="button" onClick={() => onMark(item.id, "Manager acknowledged")}>Acknowledge</button>
              <button type="button" onClick={() => onMark(item.id, "Proof being reviewed")}>Review proof</button>
              <button type="button" onClick={() => onMark(item.id, "Ready for manager decision")}>Ready</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}


export default function ManagerStandaloneWorkspace() {
  const [submissions, setSubmissions] = useState([]);
  const [returnQueue, setReturnQueue] = useState([]);
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [selectedEmployeeRequest, setSelectedEmployeeRequest] = useState(null);
  const [employeeResponseDraft, setEmployeeResponseDraft] = useState({
    responseStatus: "Manager responded",
    proofStatus: "Manager reviewed",
    title: "",
    body: "",
    managerName: "Manager Portal",
  });
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);
  const [activeManagerFilter, setActiveManagerFilter] = useState("all");
  const [managerNotificationsOpen, setManagerNotificationsOpen] = useState(false);
  const [managerNotifications, setManagerNotifications] = useState([]);
  const [managerActivity, setManagerActivity] = useState([]);
  const [managerResponse, setManagerResponse] = useState({
    proofStatus: "Ready for owner re-review",
    correctionStatus: "Corrected / explained",
    risk: "Medium",
    recommendation: "",
    managerResponse: "",
    towerSensitive: false,
  });
  const [form, setForm] = useState({
    businessKey: "simpleepay",
    issueType: "clock",
    issueTypeLabel: "Clock-in / shift issue",
    person: "",
    title: "",
    moneyImpact: "",
    proofStatus: "Needs review",
    risk: "Medium",
    managerDecision: "",
    managerNote: "",
    recommendation: "",
    towerSensitive: false,
  });


  function openTowerEvidence() {
    try {
      const now = new Date();
      const request = {
        id: `TOWER-ACCESS-${Math.floor(100000 + Math.random() * 900000)}`,
        sourceApp: "The Teller",
        sourceLane: "manager",
        requestedBy: "Manager Dashboard",
        requestedAccess: "Tower Evidence Viewer",
        reason: "Open Teller backup/evidence queue from manager dashboard.",
        createdAt: now.toISOString(),
        status: "Pending Tower clearance",
      };

      window.sessionStorage.removeItem("the_teller_tower_clearance_v1");
      window.sessionStorage.removeItem("the_teller_tower_clearance_token_v1");
      window.sessionStorage.setItem("the_teller_tower_access_request_v1", JSON.stringify(request));
    } catch {
      // session storage is optional
    }

    window.location.href = `${window.location.origin}${window.location.pathname}?teller_view=tower`;
  }

  function refreshBridgeData() {
    setSubmissions(readManagerSubmissions());
    setReturnQueue(readManagerReturnQueue());
    setEmployeeRequests(readEmployeeManagerQueue());
  }

  function pushManagerNotice(notice) {
    setManagerNotifications((current) => [notice, ...current].slice(0, 12));
    setManagerActivity((current) => [notice, ...current].slice(0, 12));
  }

  function clearManagerNotifications() {
    setManagerNotifications([]);
    setManagerNotificationsOpen(false);
  }

  useEffect(() => {
    refreshBridgeData();

    function handleUpdate() {
      refreshBridgeData();
    }

    window.addEventListener("the-teller-bridge-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("the-teller-bridge-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const managerWorkItems = getManagerWorkItems(returnQueue, submissions);

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function submitManagerItem() {
    const option = managerIssueOptions.find(([key]) => key === form.issueType);
    const item = buildManagerSubmission({
      ...form,
      issueTypeLabel: option?.[1] || "Manager issue",
    });

    saveManagerSubmission(item);
    refreshBridgeData();

    pushManagerNotice(createManagerNotice({
      type: item.tower ? "tower" : "submitted",
      title: "Submitted to owner Review Desk",
      body: `${item.title} was sent upward for owner review.`,
      target: item.businessKey,
    }));
    setManagerNotificationsOpen(true);

    setForm((current) => ({
      ...current,
      person: "",
      title: "",
      moneyImpact: "",
      managerDecision: "",
      managerNote: "",
      recommendation: "",
      towerSensitive: false,
    }));
  }

  function openEmployeeRequest(item) {
    setSelectedEmployeeRequest(item);
    setEmployeeResponseDraft({
      responseStatus: item.managerStatus || "Manager responded",
      proofStatus: item.proofStatus || "Manager reviewed",
      title: `Response · ${item.title}`,
      body: "",
      managerName: "Manager Portal",
    });
  }

  function updateEmployeeResponseDraft(key, value) {
    setEmployeeResponseDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function sendEmployeeResponse() {
    if (!selectedEmployeeRequest) return;

    const responseItem = createEmployeeResponseItem(selectedEmployeeRequest, employeeResponseDraft);
    const towerBackup = createTowerBackupItem({
      source: "manager_board",
      action: "Manager responded to employee request",
      target: responseItem.title,
      summary: "Manager-to-employee response backed up to The Tower local handoff queue.",
      payload: {
        request: selectedEmployeeRequest,
        response: responseItem,
      },
    });

    saveEmployeeResponseItem(responseItem);
    saveTowerBackupItem(towerBackup);

    updateEmployeeManagerItem(selectedEmployeeRequest.id, {
      managerStatus: employeeResponseDraft.responseStatus,
      managerResponse: employeeResponseDraft.body,
      proofStatus: employeeResponseDraft.proofStatus,
      managerRespondedAt: new Date().toISOString(),
      employeeResponseId: responseItem.id,
      towerBackupId: towerBackup.id,
    });

    refreshBridgeData();

    if (typeof pushManagerNotice === "function") {
      pushManagerNotice(createManagerNotice({
        type: employeeResponseDraft.responseStatus.toLowerCase().includes("proof") ? "proof" : "ready",
        title: "Response sent to employee",
        body: `${responseItem.title} was sent back to the employee and backed up to The Tower.`,
        target: responseItem.id,
      }));
    }

    setSelectedEmployeeRequest(null);
  }

  function markEmployeeRequest(id, status) {
    updateEmployeeManagerItem(id, {
      managerStatus: status,
      managerUpdatedAt: new Date().toISOString(),
    });
    refreshBridgeData();

    if (typeof pushManagerNotice === "function") {
      pushManagerNotice(createManagerNotice({
        type: status.toLowerCase().includes("proof") ? "proof" : "status",
        title: "Employee request updated",
        body: `Manager marked employee request as: ${status}.`,
        target: id,
      }));
    }
  }

  function markReturnItem(id, status) {
    updateManagerReturnItem(id, {
      managerStatus: status,
      managerUpdatedAt: new Date().toISOString(),
    });
    refreshBridgeData();

    const type = String(status).toLowerCase().includes("proof")
      ? "proof"
      : String(status).toLowerCase().includes("ready")
        ? "ready"
        : "status";

    pushManagerNotice(createManagerNotice({
      type,
      title: "Return item status updated",
      body: `Manager marked a returned item as: ${status}.`,
      target: id,
    }));
  }

  function openReturnItem(item) {
    setSelectedReturnItem(item);
    setManagerResponse({
      proofStatus: item.proofStatus || "Ready for owner re-review",
      correctionStatus: item.correctionStatus || "Corrected / explained",
      risk: item.risk || "Medium",
      recommendation: item.managerContext?.managerRecommendation || "",
      managerResponse: item.managerResponse || "",
      towerSensitive: Boolean(item.tower),
    });
  }

  function updateManagerResponse(key, value) {
    setManagerResponse((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function sendReturnBackToOwner() {
    if (!selectedReturnItem) return;

    const reReviewItem = createManagerReReviewSubmission(selectedReturnItem, managerResponse);

    pushManagerNotice(createManagerNotice({
      type: reReviewItem.tower ? "tower" : "ready",
      title: "Sent back to owner",
      body: `${reReviewItem.title} was returned to owner for re-review.`,
      target: reReviewItem.businessKey,
    }));

    setManagerNotificationsOpen(true);
    setSelectedReturnItem(null);
    refreshBridgeData();
  }

  return (
    <main className="manager-standalone-workspace">
      <div className="mgr-tower-evidence-entry">
        <button type="button" onClick={openTowerEvidence}>
          Open Tower Evidence
        </button>
        <span>Protected backup queue</span>
      </div>

      <div className="mgr-corner-tools">
        <ManagerNotificationsDropdown
          notifications={managerNotifications}
          open={managerNotificationsOpen}
          setOpen={setManagerNotificationsOpen}
          onClear={clearManagerNotifications}
        />
      </div>

      <section className="mgr-hero">
        <div>
          <p className="mgr-kicker">Manager board · The Teller</p>
          <h1>Manager workbench for payroll, proof, and money issues.</h1>
          <p>
            Managers submit small-picture money issues here. Owner-reviewed items can also come back here
            for proof, correction, explanation, or Tower handoff prep.
          </p>
          <div className="mgr-badge-row">
            <ManagerBadge tone="strong">{submissions.length} submitted</ManagerBadge>
            <ManagerBadge tone="warn">{returnQueue.length} returned by owner</ManagerBadge>
            <ManagerBadge>Money-side only</ManagerBadge>
            <ManagerNotificationsDropdown
              notifications={managerNotifications}
              open={managerNotificationsOpen}
              setOpen={setManagerNotificationsOpen}
              onClear={clearManagerNotifications}
            />
          </div>
        </div>
      </section>

      <ManagerEmployeeRequestDock
        requests={employeeRequests}
        onMark={markEmployeeRequest}
        onOpen={openEmployeeRequest}
      />

      <ManagerFilterTabs
        activeFilter={activeManagerFilter}
        setActiveFilter={setActiveManagerFilter}
        workItems={managerWorkItems}
      />

      <ManagerUnifiedWorkBoard
        workItems={managerWorkItems}
        activeFilter={activeManagerFilter}
        onOpenReturn={openReturnItem}
        onMarkReturn={markReturnItem}
      />

      <section className="mgr-board-grid">
        <article className="mgr-panel mgr-submit-panel">
          <div>
            <p className="mgr-kicker">Submit to owner Review Desk</p>
            <h2>Send an issue up for owner review.</h2>
            <p>Use this for clock-ins, time edits, proof requests, money issues, and protected items.</p>
          </div>

          <div className="mgr-form-grid">
            <label>
              <span>Business</span>
              <select value={form.businessKey} onChange={(event) => updateForm("businessKey", event.target.value)}>
                {managerBusinessOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Issue type</span>
              <select value={form.issueType} onChange={(event) => updateForm("issueType", event.target.value)}>
                {managerIssueOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Employee / record</span>
              <input value={form.person} onChange={(event) => updateForm("person", event.target.value)} placeholder="Example: Maya J." />
            </label>

            <label>
              <span>Money impact</span>
              <input value={form.moneyImpact} onChange={(event) => updateForm("moneyImpact", event.target.value)} placeholder="Example: $118.40" />
            </label>

            <label>
              <span>Proof status</span>
              <select value={form.proofStatus} onChange={(event) => updateForm("proofStatus", event.target.value)}>
                <option>Needs review</option>
                <option>Needs proof</option>
                <option>Proof attached</option>
                <option>Tower required</option>
              </select>
            </label>

            <label>
              <span>Risk</span>
              <select value={form.risk} onChange={(event) => updateForm("risk", event.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>

            <label className="mgr-wide">
              <span>Title</span>
              <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Example: Missing punch needs proof" />
            </label>

            <label className="mgr-wide">
              <span>Manager decision</span>
              <input value={form.managerDecision} onChange={(event) => updateForm("managerDecision", event.target.value)} placeholder="Example: Needs explanation before payroll closes" />
            </label>

            <label className="mgr-wide">
              <span>Manager note</span>
              <textarea value={form.managerNote} onChange={(event) => updateForm("managerNote", event.target.value)} rows={4} placeholder="Write what the manager saw..." />
            </label>

            <label className="mgr-wide">
              <span>Recommendation</span>
              <input value={form.recommendation} onChange={(event) => updateForm("recommendation", event.target.value)} placeholder="Example: Request proof before approving" />
            </label>

            <label className="mgr-check">
              <input type="checkbox" checked={form.towerSensitive} onChange={(event) => updateForm("towerSensitive", event.target.checked)} />
              <span>Tower-sensitive / protected change</span>
            </label>
          </div>

          <button type="button" className="mgr-primary" onClick={submitManagerItem}>
            Submit to owner Review Desk
          </button>
        </article>

        <article className="mgr-panel mgr-secondary-panel">
          <div className="mgr-section-head">
            <div>
              <p className="mgr-kicker">Returned by owner · detail list</p>
              <h2>Original returned-item list.</h2>
            </div>
            <ManagerBadge tone="warn">{returnQueue.length}</ManagerBadge>
          </div>

          <div className="mgr-card-list">
            {returnQueue.length ? returnQueue.map((item) => (
              <article key={item.id} className="mgr-return-card">
                <div className="mgr-card-top">
                  <span>{item.business || "Owner review"}</span>
                  <small>{item.managerStatus || "Needs manager action"}</small>
                </div>
                <strong>{item.title}</strong>
                <p>{item.reason}</p>
                {item.ownerNote ? <p className="mgr-note">Owner note: {item.ownerNote}</p> : null}
                <div className="mgr-card-actions">
                  <button type="button" onClick={() => openReturnItem(item)}>Open details</button>
                  <button type="button" onClick={() => markReturnItem(item.id, "Manager acknowledged")}>Acknowledge</button>
                  <button type="button" onClick={() => markReturnItem(item.id, "Proof being gathered")}>Gather proof</button>
                  <button type="button" onClick={() => markReturnItem(item.id, "Ready for owner re-review")}>Ready for re-review</button>
                </div>
              </article>
            )) : (
              <article className="mgr-empty">
                <p className="mgr-kicker">Nothing returned yet</p>
                <strong>Owner send-backs will appear here.</strong>
                <p>When Solice sends a payroll/proof item back to the manager, it lands in this queue.</p>
              </article>
            )}
          </div>
        </article>
      </section>

      <ManagerActivityTrail activity={managerActivity} />

      <section className="mgr-panel">
        <div className="mgr-section-head">
          <div>
            <p className="mgr-kicker">Submitted upward</p>
            <h2>Recent manager submissions.</h2>
          </div>
          <ManagerBadge tone="strong">{submissions.length}</ManagerBadge>
        </div>

        <div className="mgr-submission-grid">
          {submissions.length ? submissions.slice(0, 8).map((item) => (
            <article key={item.id || item.key} className="mgr-submission-card">
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <small>{item.status} · {item.risk} · {item.money}</small>
            </article>
          )) : (
            <article className="mgr-empty">
              <p className="mgr-kicker">No submissions</p>
              <strong>Submitted items will show here.</strong>
              <p>Use the manager form to submit the first issue to owner review.</p>
            </article>
          )}
        </div>
      </section>
      {selectedEmployeeRequest ? (
        <div className="mgr-employee-detail-overlay" role="dialog" aria-modal="true">
          <section className="mgr-employee-detail-modal">
            <div className="mgr-section-head">
              <div>
                <p className="mgr-kicker">Employee request detail</p>
                <h2>{selectedEmployeeRequest.title}</h2>
                <p>{selectedEmployeeRequest.body}</p>
              </div>
              <button type="button" className="mgr-secondary" onClick={() => setSelectedEmployeeRequest(null)}>
                Close
              </button>
            </div>

            <div className="mgr-return-detail-grid">
              <article>
                <span>Employee</span>
                <strong>{selectedEmployeeRequest.employeeName}</strong>
              </article>
              <article>
                <span>Status</span>
                <strong>{selectedEmployeeRequest.managerStatus}</strong>
              </article>
              <article>
                <span>Proof</span>
                <strong>{selectedEmployeeRequest.proofStatus}</strong>
              </article>
              <article>
                <span>Tower</span>
                <strong>{selectedEmployeeRequest.towerBackedUp ? "Backed up" : "Needs backup"}</strong>
              </article>
            </div>

            <div className="mgr-response-form">
              <label>
                <span>Response status</span>
                <select value={employeeResponseDraft.responseStatus} onChange={(event) => updateEmployeeResponseDraft("responseStatus", event.target.value)}>
                  <option>Manager responded</option>
                  <option>Need more proof</option>
                  <option>Proof reviewed</option>
                  <option>Ready for payroll review</option>
                  <option>Resolved</option>
                </select>
              </label>

              <label>
                <span>Proof status</span>
                <select value={employeeResponseDraft.proofStatus} onChange={(event) => updateEmployeeResponseDraft("proofStatus", event.target.value)}>
                  <option>Manager reviewed</option>
                  <option>Proof accepted</option>
                  <option>More proof needed</option>
                  <option>No proof needed</option>
                  <option>Sent upward</option>
                </select>
              </label>

              <label>
                <span>Manager</span>
                <input
                  value={employeeResponseDraft.managerName}
                  onChange={(event) => updateEmployeeResponseDraft("managerName", event.target.value)}
                  placeholder="Manager Portal"
                />
              </label>

              <label className="mgr-wide">
                <span>Response title</span>
                <input
                  value={employeeResponseDraft.title}
                  onChange={(event) => updateEmployeeResponseDraft("title", event.target.value)}
                  placeholder="Response title"
                />
              </label>

              <label className="mgr-wide">
                <span>Response to employee</span>
                <textarea
                  value={employeeResponseDraft.body}
                  onChange={(event) => updateEmployeeResponseDraft("body", event.target.value)}
                  rows={5}
                  placeholder="Write the response the employee should see..."
                />
              </label>
            </div>

            <div className="mgr-return-detail-actions">
              <button type="button" className="mgr-primary" onClick={sendEmployeeResponse}>
                Send response to employee + Tower backup
              </button>
              <button type="button" className="mgr-secondary" onClick={() => markEmployeeRequest(selectedEmployeeRequest.id, "Proof being reviewed")}>
                Mark proof being reviewed
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {selectedReturnItem ? (
        <div className="mgr-return-detail-overlay" role="dialog" aria-modal="true">
          <section className="mgr-return-detail-modal">
            <div className="mgr-section-head">
              <div>
                <p className="mgr-kicker">Returned by owner</p>
                <h2>{selectedReturnItem.title}</h2>
                <p>{selectedReturnItem.reason}</p>
              </div>
              <button type="button" className="mgr-secondary" onClick={() => setSelectedReturnItem(null)}>
                Close
              </button>
            </div>

            <div className="mgr-return-detail-grid">
              <article>
                <span>Owner note</span>
                <strong>{selectedReturnItem.ownerNote || "No owner note provided."}</strong>
              </article>
              <article>
                <span>Manager status</span>
                <strong>{selectedReturnItem.managerStatus || "Needs manager action"}</strong>
              </article>
              <article>
                <span>Business</span>
                <strong>{selectedReturnItem.business || "Owner Review Desk"}</strong>
              </article>
              <article>
                <span>Returned at</span>
                <strong>{selectedReturnItem.createdAt ? new Date(selectedReturnItem.createdAt).toLocaleString() : "Recently"}</strong>
              </article>
            </div>

            <div className="mgr-response-form">
              <label>
                <span>Proof status</span>
                <select value={managerResponse.proofStatus} onChange={(event) => updateManagerResponse("proofStatus", event.target.value)}>
                  <option>Ready for owner re-review</option>
                  <option>Proof attached</option>
                  <option>Proof still missing</option>
                  <option>Needs more time</option>
                  <option>Tower required</option>
                </select>
              </label>

              <label>
                <span>Correction status</span>
                <select value={managerResponse.correctionStatus} onChange={(event) => updateManagerResponse("correctionStatus", event.target.value)}>
                  <option>Corrected / explained</option>
                  <option>Proof gathered</option>
                  <option>Manager disagrees</option>
                  <option>Unable to resolve</option>
                  <option>Escalate to Tower</option>
                </select>
              </label>

              <label>
                <span>Risk</span>
                <select value={managerResponse.risk} onChange={(event) => updateManagerResponse("risk", event.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

              <label className="mgr-wide">
                <span>Recommendation</span>
                <input
                  value={managerResponse.recommendation}
                  onChange={(event) => updateManagerResponse("recommendation", event.target.value)}
                  placeholder="Example: Owner can approve after reviewing attached proof"
                />
              </label>

              <label className="mgr-wide">
                <span>Manager response</span>
                <textarea
                  value={managerResponse.managerResponse}
                  onChange={(event) => updateManagerResponse("managerResponse", event.target.value)}
                  rows={5}
                  placeholder="Explain what was corrected, what proof was found, or why this needs escalation..."
                />
              </label>

              <label className="mgr-check">
                <input
                  type="checkbox"
                  checked={managerResponse.towerSensitive}
                  onChange={(event) => updateManagerResponse("towerSensitive", event.target.checked)}
                />
                <span>Tower-sensitive / needs protected re-review</span>
              </label>
            </div>

            <div className="mgr-return-detail-actions">
              <button type="button" className="mgr-primary" onClick={sendReturnBackToOwner}>
                Send back to owner
              </button>
              <button type="button" className="mgr-secondary" onClick={() => markReturnItem(selectedReturnItem.id, "Proof being gathered")}>
                Mark proof being gathered
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

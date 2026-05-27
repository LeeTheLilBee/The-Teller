
import React, { useEffect, useState } from "react";
import {
  createBridgeId,
  readManagerReturnQueue,
  readManagerSubmissions,
  saveManagerSubmission,
  updateManagerReturnItem,
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

function ManagerBadge({ children, tone = "quiet" }) {
  return <span className={`mgr-badge mgr-badge-${tone}`}>{children}</span>;
}

export default function ManagerStandaloneWorkspace() {
  const [submissions, setSubmissions] = useState([]);
  const [returnQueue, setReturnQueue] = useState([]);
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

  function refreshBridgeData() {
    setSubmissions(readManagerSubmissions());
    setReturnQueue(readManagerReturnQueue());
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

  function markReturnItem(id, status) {
    updateManagerReturnItem(id, {
      managerStatus: status,
      managerUpdatedAt: new Date().toISOString(),
    });
    refreshBridgeData();
  }

  return (
    <main className="manager-standalone-workspace">
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
          </div>
        </div>
      </section>

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

        <article className="mgr-panel">
          <div className="mgr-section-head">
            <div>
              <p className="mgr-kicker">Returned by owner</p>
              <h2>Items sent back for manager action.</h2>
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
    </main>
  );
}

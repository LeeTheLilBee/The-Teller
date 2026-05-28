
import React, { useEffect, useMemo, useState } from "react";
import {
  buildRequestThread,
  getThreadSummary,
  shortProofRef,
} from "./requestThreading";
import "./requestThreadPanel.css";

function ThreadBadge({ children, tone = "quiet" }) {
  return <span className={`thread-badge thread-badge-${tone}`}>{children}</span>;
}

function ThreadRow({ item }) {
  return (
    <article className={`thread-row thread-row-${item.tone}`}>
      <div className="thread-rail">
        <span />
      </div>

      <div className="thread-row-body">
        <div className="thread-row-top">
          <ThreadBadge tone={item.tone}>{item.stageLabel}</ThreadBadge>
          <ThreadBadge>{item.actor}</ThreadBadge>
          <ThreadBadge>{item.proofRef}</ThreadBadge>
        </div>

        <strong>{item.title}</strong>
        <p>{item.body}</p>

        <div className="thread-meta-row">
          <small>{item.employeeName}</small>
          <small>{item.businessKey}</small>
          {item.createdAt ? <small>{new Date(item.createdAt).toLocaleString()}</small> : null}
        </div>

        <div className="thread-next-card">
          <span>What happens next</span>
          <p>{item.next}</p>
        </div>
      </div>
    </article>
  );
}

export default function RequestThreadPanel({
  seed,
  employeeName = "",
  title = "Connected request thread",
  compact = false,
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((value) => value + 1);
    }

    window.addEventListener("the-teller-bridge-updated", refresh);
    window.addEventListener("the-teller-receipts-updated", refresh);
    window.addEventListener("the-teller-tower-plugin-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("the-teller-bridge-updated", refresh);
      window.removeEventListener("the-teller-receipts-updated", refresh);
      window.removeEventListener("the-teller-tower-plugin-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const thread = useMemo(() => {
    return buildRequestThread(seed || {}, { employeeName });
  }, [seed, employeeName, tick]);

  const summary = getThreadSummary(thread);
  const visible = compact ? thread.slice(-5) : thread;

  return (
    <section className={`request-thread-panel request-thread-${summary.tone}`}>
      <div className="thread-head">
        <div>
          <p className="thread-kicker">Connected thread</p>
          <h3>{title}</h3>
          <p>{summary.body}</p>
        </div>

        <div className="thread-head-badges">
          <ThreadBadge tone={summary.tone}>{summary.label}</ThreadBadge>
          <ThreadBadge>{visible.length} records</ThreadBadge>
          {seed?.id ? <ThreadBadge>{shortProofRef(seed.id)}</ThreadBadge> : null}
        </div>
      </div>

      <div className="thread-summary-card">
        <span>What happens next</span>
        <p>{summary.next}</p>
      </div>

      {visible.length ? (
        <div className="thread-list">
          {visible.map((item) => (
            <ThreadRow key={`${item.sourceKey}-${item.id}-${item.stageKey}`} item={item} />
          ))}
        </div>
      ) : (
        <article className="thread-empty">
          <span>No connected records yet</span>
          <strong>This thread will build automatically.</strong>
          <p>When an employee submits, a manager responds, an owner decides, or Tower backs it up, the thread will fill in.</p>
        </article>
      )}
    </section>
  );
}

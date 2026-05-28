
import React, { useEffect, useMemo, useState } from "react";
import {
  getRoleWorkflowItems,
  getWorkflowCounts,
  getWorkflowEmptyState,
  getWorkflowStatusCopy,
} from "./workflowLifecycle";
import "./workflowLifecyclePanel.css";

function LifecycleBadge({ children, tone = "quiet" }) {
  return <span className={`workflow-badge workflow-badge-${tone}`}>{children}</span>;
}

function WorkflowStep({ item }) {
  const copy = getWorkflowStatusCopy(item.status);

  return (
    <article className={`workflow-step workflow-step-${item.tone}`}>
      <div className="workflow-step-dot" />
      <div className="workflow-step-body">
        <div className="workflow-step-top">
          <span>{item.statusLabel}</span>
          <small>{item.proofRef}</small>
        </div>
        <strong>{item.title}</strong>
        <p>{item.body || copy.summary}</p>
        <div className="workflow-step-meta">
          <small>{item.employeeName}</small>
          <small>{item.businessKey}</small>
          {item.createdAt ? <small>{new Date(item.createdAt).toLocaleString()}</small> : null}
        </div>
      </div>
    </article>
  );
}

export default function WorkflowLifecyclePanel({ role = "all", employeeName = "", compact = false }) {
  const [items, setItems] = useState([]);

  function refresh() {
    setItems(getRoleWorkflowItems(role, employeeName));
  }

  useEffect(() => {
    refresh();

    function handleUpdate() {
      refresh();
    }

    window.addEventListener("the-teller-bridge-updated", handleUpdate);
    window.addEventListener("the-teller-receipts-updated", handleUpdate);
    window.addEventListener("the-teller-tower-plugin-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("the-teller-bridge-updated", handleUpdate);
      window.removeEventListener("the-teller-receipts-updated", handleUpdate);
      window.removeEventListener("the-teller-tower-plugin-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [role, employeeName]);

  const counts = useMemo(() => getWorkflowCounts(items), [items]);
  const empty = getWorkflowEmptyState(role);
  const visibleItems = compact ? items.slice(0, 5) : items.slice(0, 9);

  return (
    <section className={`workflow-lifecycle-panel workflow-role-${role}`}>
      <div className="workflow-head">
        <div>
          <p className="workflow-kicker">Workflow lifecycle</p>
          <h2>{role === "tower" ? "Proof trail." : "Where the work stands."}</h2>
          <p>
            A plain-language timeline for requests, reviews, escalations, receipts, and archive readiness.
          </p>
        </div>

        <div className="workflow-badge-row">
          <LifecycleBadge tone="strong">{counts.active} active</LifecycleBadge>
          <LifecycleBadge>{counts.closed} closed</LifecycleBadge>
          <LifecycleBadge tone="quiet">{counts.total} total</LifecycleBadge>
        </div>
      </div>

      {items.length ? (
        <>
          <div className="workflow-status-strip">
            {Object.entries(counts)
              .filter(([key]) => !["total", "active", "closed"].includes(key))
              .map(([key, value]) => {
                const copy = getWorkflowStatusCopy(key);
                return (
                  <span key={key} className={`workflow-status-pill workflow-status-${copy.tone}`}>
                    {copy.label}: {value}
                  </span>
                );
              })}
          </div>

          <div className="workflow-timeline">
            {visibleItems.map((item) => (
              <WorkflowStep key={`${item.source}-${item.id}`} item={item} />
            ))}
          </div>

          {items.length > visibleItems.length ? (
            <details className="workflow-more-drawer">
              <summary>Show older lifecycle records ({items.length - visibleItems.length})</summary>
              <div className="workflow-timeline workflow-timeline-older">
                {items.slice(visibleItems.length, visibleItems.length + 12).map((item) => (
                  <WorkflowStep key={`${item.source}-${item.id}`} item={item} />
                ))}
              </div>
            </details>
          ) : null}
        </>
      ) : (
        <article className="workflow-empty-state">
          <span>Nothing active</span>
          <strong>{empty.title}</strong>
          <p>{empty.body}</p>
          <small>{empty.next}</small>
        </article>
      )}
    </section>
  );
}

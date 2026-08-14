/*
 * THE TELLER / SIMPLEEPAY
 * GP481–GP490
 * TELLER — WORKFLOW-SAFE STATUS DRAWER WIRING
 *
 * Reusable drawer component only.
 * Not mounted into live Employee/Manager/Owner pages yet.
 *
 * No Tower API call.
 * No Vault API call.
 * No raw Vault links/files.
 */

import React, { useMemo } from "react";
import "./tellerTowerRequestStatusDrawer.css";

import {
  assertTowerResultWorkflowSafe,
} from "./tellerTowerRequestQueue.js";

import {
  buildWorkflowSafeStatusList,
  buildWorkflowSafeStatusSummary,
} from "./tellerTowerRequestStatusWiring.js";

export const TELLER_STATUS_DRAWER_PACK = Object.freeze({
  pack_id: "GP481-GP490",
  title: "TELLER — WORKFLOW-SAFE STATUS DRAWER WIRING",
  source_app: "teller",
  target_app: "tower",
  direct_tower_call_allowed: false,
  direct_vault_access_allowed: false,
  visible_ui_mounted: false,
  workflow_safe_status_only: true,
  doctrine: "Teller can ask. Tower must decide. Vault only answers Tower.",
});

function normalizeRole(role) {
  return role || "employee";
}

function toneLabel(tone) {
  const labels = {
    waiting: "Waiting",
    attention: "Needs attention",
    blocked: "Blocked",
    ready: "Ready",
    closed: "Closed",
    info: "Info",
  };

  return labels[tone] || "Status";
}

function priorityLabel(priority) {
  const labels = {
    now: "Now",
    next: "Next",
    soon: "Soon",
    later: "Later",
    done: "Done",
  };

  return labels[priority] || "Review";
}

export function TellerTowerRequestStatusDrawer({
  queueItems = [],
  viewerRole = "employee",
  open = false,
  title = "Tower request status",
  onClose = null,
}) {
  const safeViewerRole = normalizeRole(viewerRole);

  const { statusList, summary } = useMemo(() => {
    queueItems.forEach((item) =>
      assertTowerResultWorkflowSafe(item, "Drawer queue item")
    );

    return {
      statusList: buildWorkflowSafeStatusList(queueItems, safeViewerRole),
      summary: buildWorkflowSafeStatusSummary(queueItems, safeViewerRole),
    };
  }, [queueItems, safeViewerRole]);

  if (!open) {
    return null;
  }

  return (
    <aside
      className="teller-tower-status-drawer"
      aria-label="Workflow-safe Tower request status drawer"
      data-pack-id={TELLER_STATUS_DRAWER_PACK.pack_id}
      data-direct-tower-call-allowed="false"
      data-direct-vault-access-allowed="false"
    >
      <div className="teller-tower-status-drawer__scrim" aria-hidden="true" />

      <section className="teller-tower-status-drawer__panel">
        <header className="teller-tower-status-drawer__header">
          <div>
            <p className="teller-tower-status-drawer__eyebrow">
              Teller → Tower
            </p>
            <h2>{title}</h2>
            <p className="teller-tower-status-drawer__summary">
              {summary.summary_label}
            </p>
          </div>

          {typeof onClose === "function" ? (
            <button
              type="button"
              className="teller-tower-status-drawer__close"
              onClick={onClose}
              aria-label="Close Tower request status drawer"
            >
              Close
            </button>
          ) : null}
        </header>

        <div className="teller-tower-status-drawer__doctrine">
          <span>Teller can ask.</span>
          <span>Tower must decide.</span>
          <span>Vault only answers Tower.</span>
        </div>

        <div className="teller-tower-status-drawer__guardrail">
          <strong>Workflow-safe only.</strong>
          <span>No raw Vault links, files, downloads, public links, or shared folders are shown here.</span>
        </div>

        {statusList.cards.length === 0 ? (
          <div className="teller-tower-status-drawer__empty">
            No Tower workflow requests are open.
          </div>
        ) : (
          <div className="teller-tower-status-drawer__cards">
            {statusList.cards.map((card) => (
              <article
                key={`${card.request_id}-${card.queue_status}`}
                className={`teller-tower-status-drawer__card teller-tower-status-drawer__card--${card.tone}`}
              >
                <div className="teller-tower-status-drawer__card-top">
                  <div>
                    <p className="teller-tower-status-drawer__card-eyebrow">
                      {card.workflow_type}
                    </p>
                    <h3>{card.subject_label}</h3>
                  </div>

                  <div className="teller-tower-status-drawer__chips">
                    <span>{toneLabel(card.tone)}</span>
                    <span>{priorityLabel(card.priority)}</span>
                  </div>
                </div>

                <p className="teller-tower-status-drawer__status">
                  {card.display_label}
                </p>

                <p className="teller-tower-status-drawer__safe-summary">
                  {card.safe_summary}
                </p>

                <div className="teller-tower-status-drawer__next">
                  <strong>Next:</strong>
                  <span>{card.next_action}</span>
                </div>

                <div className="teller-tower-status-drawer__meta">
                  <span>{card.business_context}</span>
                  <span>{card.requested_output_type}</span>
                  <span>{card.sensitivity_level}</span>
                </div>

                {card.tower_receipts ? (
                  <details className="teller-tower-status-drawer__receipts">
                    <summary>Safe receipt IDs</summary>
                    <dl>
                      {Object.entries(card.tower_receipts).map(([key, value]) =>
                        value ? (
                          <React.Fragment key={key}>
                            <dt>{key}</dt>
                            <dd>{value}</dd>
                          </React.Fragment>
                        ) : null
                      )}
                    </dl>
                  </details>
                ) : null}

                <p className="teller-tower-status-drawer__vault-safe-label">
                  {card.vault_proof_reference_safe_label}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}

export function buildTellerTowerStatusDrawerProps({
  queueItems = [],
  viewerRole = "employee",
  open = false,
  title = "Tower request status",
  onClose = null,
} = {}) {
  queueItems.forEach((item) =>
    assertTowerResultWorkflowSafe(item, "Drawer props queue item")
  );

  return Object.freeze({
    queueItems,
    viewerRole,
    open,
    title,
    onClose,
    direct_tower_call_allowed: false,
    direct_vault_access_allowed: false,
    workflow_safe_status_only: true,
  });
}

export function getTellerTowerStatusDrawerReadiness() {
  return Object.freeze({
    pack_id: TELLER_STATUS_DRAWER_PACK.pack_id,
    title: TELLER_STATUS_DRAWER_PACK.title,
    drawer_component_ready: true,
    drawer_not_mounted_to_live_pages: true,
    no_visible_ui_clutter_added: true,
    no_tower_api_call: true,
    no_vault_api_call: true,
    no_raw_vault_links: true,
    no_raw_vault_files: true,
    no_download_links: true,
    workflow_safe_status_only: true,
    ready_for_next_corridor:
      "TELLER GP491-GP500 — Workflow-Safe Closeout + Save",
  });
}

export default TellerTowerRequestStatusDrawer;

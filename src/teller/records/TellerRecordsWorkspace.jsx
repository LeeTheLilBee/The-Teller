import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  searchTellerRecords,
  getTellerRecordSearchFacets,
} from "./tellerRecordSearch.js";

import {
  EMPTY_TELLER_RECORD_QUERY,
  clearTellerRecordQuery,
} from "./tellerRecordQuery.js";

import {
  createUnconfiguredTellerRecordRepository,
  tellerRecordRepositoryTruth,
} from "./tellerRecordRepository.js";

import {
  humanizeTellerRecordToken,
} from "./tellerRecordSchema.js";

import {
  describeTellerRecordStorage,
  describeTellerRepositoryConnection,
} from "./tellerRecordStorageTruth.js";

import "./tellerRecords.css";

import TellerRecoveryPanel
  from "../recovery/TellerRecoveryPanel.jsx";

import "../recovery/tellerRecovery.css";


function SelectFilter({
  label,
  value,
  values,
  onChange,
}) {
  return (
    <label className="teller-record-filter">

      <span>
        {label}
      </span>

      <select
        value={value}

        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >

        <option value="">
          All
        </option>

        {values.map(
          (item) => (
            <option
              key={item}
              value={item}
            >
              {
                humanizeTellerRecordToken(
                  item
                )
              }
            </option>
          )
        )}

      </select>

    </label>
  );
}


function TellerRecordCard({
  record,
}) {
  const projection =
    record.search_projection || {};

  const storage = describeTellerRecordStorage(record);


  return (
    <article className="teller-record-card">

      <div className="teller-record-card-top">

        <div>
          <small>
            {
              humanizeTellerRecordToken(
                projection.category ||
                "record"
              )
            }
          </small>

          <strong>
            {
              projection.title ||
              record.title ||
              "Teller record"
            }
          </strong>
        </div>


        <span>
          {
            humanizeTellerRecordToken(
              record.record_status
            )
          }
        </span>

      </div>


      <div className="teller-record-meta">

        <div>
          <small>
            Workflow
          </small>

          <strong>
            {
              humanizeTellerRecordToken(
                projection.workflow_type
              )
            }
          </strong>
        </div>


        <div>
          <small>
            Business
          </small>

          <strong>
            {
              humanizeTellerRecordToken(
                projection.business_key ||
                "Current business"
              )
            }
          </strong>
        </div>


        <div>
          <small>
            Source
          </small>

          <strong>
            {
              humanizeTellerRecordToken(
                record.source
              )
            }
          </strong>
        </div>


        <div>
          <small>
            Prepared
          </small>

          <strong>
            {
              record.created_at
                ? new Date(
                    record.created_at
                  ).toLocaleString()
                : "This session"
            }
          </strong>
        </div>

      </div>


      <div className="teller-record-card-truth">

        <span>{storage.label}</span>

        <span>{storage.detail}</span>

      </div>

    </article>
  );
}


export default function TellerRecordsWorkspace({
  open,
  onClose,
  role,
  records = [],
  recoveryEvents = [],
  onReplaceRecords,
  onSearchRemote = null,
  repository =
    createUnconfiguredTellerRecordRepository(),
}) {
  const [
    query,
    setQuery,
  ] = useState({
    ...EMPTY_TELLER_RECORD_QUERY,
  });

  const [remoteRecords, setRemoteRecords] = useState(null);
  const [remoteSearchStatus, setRemoteSearchStatus] = useState("idle");
  const [remoteSearchError, setRemoteSearchError] = useState("");
  const searchSequenceRef = useRef(0);

  useEffect(() => {
    if (!open) {
      searchSequenceRef.current += 1;
      setRemoteRecords(null);
      setRemoteSearchStatus("idle");
      setRemoteSearchError("");
    }
  }, [open]);


  const repositoryTruth =
    useMemo(
      () =>
        tellerRecordRepositoryTruth(
          repository
        ),
      [repository]
    );


  const repositoryConnection =
    describeTellerRepositoryConnection(repositoryTruth);


  const facets =
    useMemo(
      () =>
        getTellerRecordSearchFacets(
          records
        ),
      [records]
    );


  // The initial list searches loaded records only. Explicit authenticated
  // search requests up to 100 matches from the current Tower/RLS business.
  const visibleSource = remoteRecords === null ? records : remoteRecords;
  const results = useMemo(
    () => searchTellerRecords(
      visibleSource,
      remoteRecords === null ? query : { ...query, text: "" }
    ),
    [visibleSource, remoteRecords, query]
  );


  function updateQuery(key, value) {
    searchSequenceRef.current += 1;
    setRemoteRecords(null);
    setRemoteSearchStatus("idle");
    setRemoteSearchError("");
    setQuery((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    searchSequenceRef.current += 1;
    setRemoteRecords(null);
    setRemoteSearchStatus("idle");
    setRemoteSearchError("");
    setQuery(clearTellerRecordQuery());
  }

  async function runAuthenticatedSearch() {
    if (typeof onSearchRemote !== "function") return;
    const serial = ++searchSequenceRef.current;
    setRemoteRecords(null);
    setRemoteSearchStatus("loading");
    setRemoteSearchError("");
    try {
      const found = await onSearchRemote(query);
      if (serial !== searchSequenceRef.current) return;
      if (!Array.isArray(found)) throw new Error("Invalid repository response.");
      setRemoteRecords(found);
      setRemoteSearchStatus("complete");
    } catch {
      if (serial !== searchSequenceRef.current) return;
      setRemoteRecords(null);
      setRemoteSearchStatus("error");
      setRemoteSearchError(
        "Authenticated search could not be completed. Loaded records may not include all history."
      );
    }
  }


  if (!open) {
    return null;
  }


  return (
    <div
      className="teller-records-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Teller Records and Search"
    >

      <section className="teller-records-shell">

        <header className="teller-records-header">

          <div>
            <p className="teller-records-kicker">
              The Teller
            </p>

            <h1>
              Records & Search
            </h1>

            <p>
              Find loaded session records or search the
              authenticated repository within your Tower business scope.
            </p>
          </div>


          <button
            type="button"
            className="teller-records-close"
            onClick={onClose}
            aria-label="Close records"
          >
            ×
          </button>

        </header>


        <section className="teller-records-truth">

          <div>
            <small>
              Production repository
            </small>

            <strong>
              {
                repositoryConnection.label
              }
            </strong>
          </div>


          <div>
            <small>
              Session records
            </small>

            <strong>
              {records.length}
            </strong>
          </div>


          <div>
            <small>
              Loaded search results
            </small>

            <strong>
              {results.length}
            </strong>
          </div>


          <div>
            <small>
              Viewer
            </small>

            <strong>
              {
                humanizeTellerRecordToken(
                  role
                )
              }
            </strong>
          </div>

        </section>


        <section className="teller-record-search-controls">

          <label className="teller-record-search-box">

            <span>
              Search records
            </span>

            <input
              type="search"

              value={
                query.text
              }

              onChange={(event) =>
                updateQuery(
                  "text",
                  event.target.value
                )
              }

              onKeyDown={(event) => {
                if (event.key === "Enter" && onSearchRemote) {
                  event.preventDefault();
                  void runAuthenticatedSearch();
                }
              }}

              placeholder="Search form, workflow, category, business…"
            />

          </label>


          <div className="teller-record-filter-grid">

            <SelectFilter
              label="Category"

              value={
                query.category
              }

              values={
                facets.categories
              }

              onChange={(value) =>
                updateQuery(
                  "category",
                  value
                )
              }
            />


            <SelectFilter
              label="Status"

              value={
                query.status
              }

              values={
                facets.statuses
              }

              onChange={(value) =>
                updateQuery(
                  "status",
                  value
                )
              }
            />


            <SelectFilter
              label="Business"

              value={
                query.business
              }

              values={
                facets.businesses
              }

              onChange={(value) =>
                updateQuery(
                  "business",
                  value
                )
              }
            />


            <button
              type="button"
              className="teller-record-clear-filters"

              onClick={clearFilters}
            >
              Clear
            </button>

            {onSearchRemote ? (
              <button
                type="button"
                className="teller-record-clear-filters"
                onClick={() => { void runAuthenticatedSearch(); }}
                disabled={remoteSearchStatus === "loading"}
              >
                {remoteSearchStatus === "loading"
                  ? "Searching…"
                  : "Search authenticated records"}
              </button>
            ) : null}

          </div>

          {remoteSearchError ? (
            <p role="alert" className="teller-form-error">
              {remoteSearchError}
            </p>
          ) : null}

          {remoteSearchStatus === "complete" ? (
            <p role="status">
              Showing up to 100 authenticated matches in the current
              Tower-authorized business. Protected payload values are not searched.
            </p>
          ) : null}

        </section>


        <section className="teller-record-results">

          <div className="teller-record-results-head">

            <div>
              <p className="teller-records-kicker">
                Records
              </p>

              <h2>
                {
                  remoteSearchStatus === "loading"
                    ? "Searching authenticated records…"
                    : results.length
                      ? `${results.length} found`
                      : "No matching records"
                }
              </h2>
            </div>


            <span>
              Search indexes safe record metadata,
              not protected payload values.
            </span>

          </div>


          {remoteSearchStatus === "loading" ? (
            <article className="teller-record-empty" role="status">
              Searching the authenticated repository…
            </article>
          ) : results.length ? (
            <div className="teller-record-list">

              {results.map(
                (record) => (
                  <TellerRecordCard
                    key={
                      record.record_id
                    }

                    record={
                      record
                    }
                  />
                )
              )}

            </div>
          ) : (
            <article className="teller-record-empty">

              <strong>
                {
                  visibleSource.length
                    ? "Nothing matches these filters."
                    : remoteSearchStatus === "complete"
                      ? "No authenticated matches."
                      : "No records loaded yet."
                }
              </strong>

              <p>
                {
                  visibleSource.length
                    ? "Clear a filter or try another search."
                    : remoteSearchStatus === "complete"
                      ? "Change your filters or search text and try again."
                      : "Prepare a Teller form or run an authenticated search."
                }
              </p>

            </article>
          )}

        </section>


        <TellerRecoveryPanel
          role={
            role
          }

          records={
            records
          }

          recoveryEvents={
            recoveryEvents
          }

          onReplaceRecords={
            onReplaceRecords
          }
        />


        {!repositoryConnection.verified ? (
          <article className="teller-record-production-boundary">
            <strong>
              {repositoryConnection.label === "Checking"
                ? "Checking the authenticated record connection."
                : repositoryConnection.label === "Unavailable"
                  ? "Authenticated record connection unavailable."
                  : "Production record storage is not connected yet."}
            </strong>
            <p>
              Only records with an acknowledged persistence revision are
              labelled durable. Session-only records are never presented as
              confirmed database saves.
            </p>
          </article>
        ) : null}

      </section>

    </div>
  );
}

import React, {
  useMemo,
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

import "./tellerRecords.css";


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

        <span>
          Session record
        </span>

        <span>
          Production persisted: No
        </span>

      </div>

    </article>
  );
}


export default function TellerRecordsWorkspace({
  open,
  onClose,
  role,
  records = [],
  repository =
    createUnconfiguredTellerRecordRepository(),
}) {
  const [
    query,
    setQuery,
  ] = useState({
    ...EMPTY_TELLER_RECORD_QUERY,
  });


  const repositoryTruth =
    useMemo(
      () =>
        tellerRecordRepositoryTruth(
          repository
        ),
      [repository]
    );


  const facets =
    useMemo(
      () =>
        getTellerRecordSearchFacets(
          records
        ),
      [records]
    );


  const results =
    useMemo(
      () =>
        searchTellerRecords(
          records,
          query
        ),
      [
        records,
        query,
      ]
    );


  function updateQuery(
    key,
    value
  ) {
    setQuery(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
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
              Find workflow records prepared
              during this Teller session.
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
                repositoryTruth.configured
                  ? "Connected"
                  : "Not connected"
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
              Search results
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

              onClick={() =>
                setQuery(
                  clearTellerRecordQuery()
                )
              }
            >
              Clear
            </button>

          </div>

        </section>


        <section className="teller-record-results">

          <div className="teller-record-results-head">

            <div>
              <p className="teller-records-kicker">
                Records
              </p>

              <h2>
                {
                  results.length
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


          {results.length ? (
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
                  records.length
                    ? "Nothing matches these filters."
                    : "No records prepared yet."
                }
              </strong>

              <p>
                {
                  records.length
                    ? "Clear a filter or try another search."
                    : "Prepare a Teller form and its session record will appear here."
                }
              </p>

            </article>
          )}

        </section>


        {!repositoryTruth.configured ? (
          <article className="teller-record-production-boundary">

            <strong>
              Production record storage is not connected yet.
            </strong>

            <p>
              These searchable records exist only
              in the active Teller session. This
              screen does not pretend they were
              saved to a production database.
            </p>

          </article>
        ) : null}

      </section>

    </div>
  );
}

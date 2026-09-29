import {
  createHash,
} from "node:crypto";

import {
  withTellerBusinessTransaction,
} from "./tellerPersistenceScope.js";

import {
  deserializePersistedTellerRecord,
  serializeTellerRecordForPersistence,
} from "./tellerRecordPersistenceSerializer.js";


export const TELLER_POSTGRES_REPOSITORY_STATUS =
  Object.freeze({
    READY:
      "ready",

    NOT_FOUND:
      "not_found",

    CONFLICT:
      "conflict",

    ERROR:
      "error",
  });


function boundedLimit(
  value
) {
  const parsed =
    Number.parseInt(
      String(
        value || "50"
      ),
      10
    );


  if (!Number.isFinite(parsed)) {
    return 50;
  }


  return Math.max(
    1,
    Math.min(
      parsed,
      100
    )
  );
}


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function deterministicEventId(
  recordId,
  event
) {
  if (event?.event_id) {
    return String(
      event.event_id
    );
  }


  const digest =
    createHash(
      "sha256"
    )
      .update(
        JSON.stringify({
          record_id:
            recordId,

          event:
            event?.event || "",

          at:
            event?.at || "",

          actor_role:
            event?.actor_role || "",

          note:
            event?.note || "",
        })
      )
      .digest(
        "hex"
      )
      .slice(
        0,
        24
      );


  return (
    `record_event_${digest}`
  );
}


function eventRows(
  record
) {
  return (
    record?.audit_history || []
  )
    .filter(Boolean)
    .map(
      (event) => ({
        event_id:
          deterministicEventId(
            record.record_id,
            event
          ),

        event_type:
          String(
            event.event ||
            "record_event"
          ),

        actor_role:
          String(
            event.actor_role ||
            record.actor_role ||
            ""
          ),

        note:
          String(
            event.note ||
            ""
          ),

        metadata:
          {
            ...(
              event.metadata ||
              {}
            ),
          },

        created_at:
          event.at ||
          record.updated_at ||
          new Date().toISOString(),
      })
    );
}


async function persistHistory(
  client,
  scope,
  record
) {
  for (
    const event
    of eventRows(
      record
    )
  ) {
    await client.query(
      `
        INSERT INTO teller_record_events (
          business_key,
          record_id,
          event_id,
          event_type,
          actor_role,
          note,
          metadata,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7::jsonb,
          $8::timestamptz
        )
        ON CONFLICT (
          business_key,
          event_id
        )
        DO NOTHING
      `,
      [
        scope.businessKey,
        record.record_id,
        event.event_id,
        event.event_type,
        event.actor_role,
        event.note,
        JSON.stringify(
          event.metadata
        ),
        event.created_at,
      ]
    );
  }
}


async function loadHistory(
  client,
  businessKey,
  recordId
) {
  const result =
    await client.query(
      `
        SELECT
          event_id,
          event_type,
          actor_role,
          note,
          metadata,
          created_at
        FROM teller_record_events
        WHERE
          business_key = $1
          AND record_id = $2
        ORDER BY
          created_at ASC,
          event_id ASC
      `,
      [
        businessKey,
        recordId,
      ]
    );


  return result.rows.map(
    (row) => ({
      event_id:
        row.event_id,

      event:
        row.event_type,

      actor_role:
        row.actor_role,

      note:
        row.note,

      metadata:
        row.metadata || {},

      at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(
              row.created_at
            ),
    })
  );
}


function rowValues(
  row
) {
  return [
    row.business_key,
    row.record_id,
    row.schema_version,
    row.source,
    row.source_id,
    row.form_id,
    row.workflow_type,
    row.category,
    row.title,
    row.actor_role,
    row.record_status,
    JSON.stringify(
      row.payload
    ),
    JSON.stringify(
      row.search_projection
    ),
    JSON.stringify(
      row.integrity
    ),
    row.submission_fingerprint,
    row.idempotency_key,
    row.search_text,
    row.created_at,
    row.updated_at,
  ];
}


export function createPostgresTellerRecordRepository({
  pool,
} = {}) {
  if (
    !pool ||
    typeof pool.connect !== "function"
  ) {
    throw new Error(
      "PostgreSQL Teller repository requires a pool."
    );
  }


  return Object.freeze({
    repository_id:
      "postgresql",

    status:
      TELLER_POSTGRES_REPOSITORY_STATUS.READY,

    configured:
      true,

    persistent:
      true,


    async saveRecord({
      scope,
      record,
      idempotencyKey = "",
    }) {
      return withTellerBusinessTransaction(
        pool,
        scope,
        async (
          client,
          trusted
        ) => {
          const row =
            serializeTellerRecordForPersistence(
              record,
              trusted,
              {
                idempotencyKey,
              }
            );


          const insert =
            await client.query(
              `
                INSERT INTO teller_records (
                  business_key,
                  record_id,
                  schema_version,
                  source,
                  source_id,
                  form_id,
                  workflow_type,
                  category,
                  title,
                  actor_role,
                  record_status,
                  payload,
                  search_projection,
                  integrity,
                  submission_fingerprint,
                  idempotency_key,
                  search_text,
                  created_at,
                  updated_at
                )
                VALUES (
                  $1,
                  $2,
                  $3,
                  $4,
                  $5,
                  $6,
                  $7,
                  $8,
                  $9,
                  $10,
                  $11,
                  $12::jsonb,
                  $13::jsonb,
                  $14::jsonb,
                  $15,
                  $16,
                  $17,
                  $18::timestamptz,
                  $19::timestamptz
                )
                ON CONFLICT (
                  business_key,
                  idempotency_key
                )
                DO NOTHING
                RETURNING *
              `,
              rowValues(
                row
              )
            );


          let persistedRow =
            insert.rows[0] ||
            null;


          let idempotentReplay =
            false;


          if (!persistedRow) {
            const replay =
              await client.query(
                `
                  SELECT *
                  FROM teller_records
                  WHERE
                    business_key = $1
                    AND idempotency_key = $2
                  LIMIT 1
                `,
                [
                  trusted.businessKey,
                  row.idempotency_key,
                ]
              );


            persistedRow =
              replay.rows[0] ||
              null;


            idempotentReplay =
              Boolean(
                persistedRow
              );
          }


          if (!persistedRow) {
            throw new Error(
              "Teller record insert produced no durable record."
            );
          }


          await persistHistory(
            client,
            trusted,
            record
          );


          const history =
            await loadHistory(
              client,
              trusted.businessKey,
              persistedRow.record_id
            );


          return {
            status:
              TELLER_POSTGRES_REPOSITORY_STATUS.READY,

            persisted:
              true,

            created:
              !idempotentReplay,

            idempotent_replay:
              idempotentReplay,

            record:
              deserializePersistedTellerRecord(
                persistedRow,
                {
                  auditHistory:
                    history,
                }
              ),
          };
        }
      );
    },


    async getRecord({
      scope,
      recordId,
    }) {
      return withTellerBusinessTransaction(
        pool,
        scope,
        async (
          client,
          trusted
        ) => {
          const result =
            await client.query(
              `
                SELECT *
                FROM teller_records
                WHERE
                  business_key = $1
                  AND record_id = $2
                LIMIT 1
              `,
              [
                trusted.businessKey,
                clean(
                  recordId
                ),
              ]
            );


          const row =
            result.rows[0] ||
            null;


          if (!row) {
            return {
              status:
                TELLER_POSTGRES_REPOSITORY_STATUS.NOT_FOUND,

              record:
                null,
            };
          }


          const history =
            await loadHistory(
              client,
              trusted.businessKey,
              row.record_id
            );


          return {
            status:
              TELLER_POSTGRES_REPOSITORY_STATUS.READY,

            record:
              deserializePersistedTellerRecord(
                row,
                {
                  auditHistory:
                    history,
                }
              ),
          };
        }
      );
    },


    async searchRecords({
      scope,
      query = {},
    }) {
      return withTellerBusinessTransaction(
        pool,
        scope,
        async (
          client,
          trusted
        ) => {
          const text =
            clean(
              query.text
            ).toLowerCase();


          const category =
            clean(
              query.category
            );


          const status =
            clean(
              query.status
            );


          const limit =
            boundedLimit(
              query.limit
            );


          const result =
            await client.query(
              `
                SELECT *
                FROM teller_records
                WHERE
                  business_key = $1

                  AND (
                    $2 = ''
                    OR search_text LIKE
                      ('%' || $2 || '%')
                  )

                  AND (
                    $3 = ''
                    OR category = $3
                  )

                  AND (
                    $4 = ''
                    OR record_status = $4
                  )

                ORDER BY
                  updated_at DESC,
                  record_id DESC

                LIMIT $5
              `,
              [
                trusted.businessKey,
                text,
                category,
                status,
                limit,
              ]
            );


          return {
            status:
              TELLER_POSTGRES_REPOSITORY_STATUS.READY,

            records:
              result.rows.map(
                (row) =>
                  deserializePersistedTellerRecord(
                    row,
                    {
                      auditHistory:
                        [],

                      auditHistoryLoaded:
                        false,
                    }
                  )
              ),

            query: {
              text,
              category,
              status,
              limit,
            },
          };
        }
      );
    },


    async updateRecord({
      scope,
      record,
      expectedRevision,
    }) {
      return withTellerBusinessTransaction(
        pool,
        scope,
        async (
          client,
          trusted
        ) => {
          const revision =
            Number(
              expectedRevision
            );


          if (
            !Number.isInteger(
              revision
            ) ||
            revision < 1
          ) {
            throw new Error(
              "Teller record update requires a positive expected revision."
            );
          }


          const row =
            serializeTellerRecordForPersistence(
              record,
              trusted,
              {
                idempotencyKey:
                  record
                    ?.persistence
                    ?.idempotency_key ||
                  record.source_id ||
                  record
                    ?.integrity
                    ?.submission_fingerprint ||
                  record.record_id,
              }
            );


          const result =
            await client.query(
              `
                UPDATE teller_records
                SET
                  schema_version = $3,
                  source = $4,
                  source_id = $5,
                  form_id = $6,
                  workflow_type = $7,
                  category = $8,
                  title = $9,
                  actor_role = $10,
                  record_status = $11,
                  payload = $12::jsonb,
                  search_projection = $13::jsonb,
                  integrity = $14::jsonb,
                  submission_fingerprint = $15,
                  search_text = $16,
                  updated_at = $17::timestamptz,
                  revision = revision + 1
                WHERE
                  business_key = $1
                  AND record_id = $2
                  AND revision = $18
                RETURNING *
              `,
              [
                row.business_key,
                row.record_id,
                row.schema_version,
                row.source,
                row.source_id,
                row.form_id,
                row.workflow_type,
                row.category,
                row.title,
                row.actor_role,
                row.record_status,
                JSON.stringify(
                  row.payload
                ),
                JSON.stringify(
                  row.search_projection
                ),
                JSON.stringify(
                  row.integrity
                ),
                row.submission_fingerprint,
                row.search_text,
                row.updated_at,
                revision,
              ]
            );


          const updated =
            result.rows[0] ||
            null;


          if (!updated) {
            const current =
              await client.query(
                `
                  SELECT
                    revision
                  FROM teller_records
                  WHERE
                    business_key = $1
                    AND record_id = $2
                  LIMIT 1
                `,
                [
                  trusted.businessKey,
                  row.record_id,
                ]
              );


            if (!current.rows[0]) {
              return {
                status:
                  TELLER_POSTGRES_REPOSITORY_STATUS.NOT_FOUND,

                persisted:
                  false,

                record:
                  null,
              };
            }


            return {
              status:
                TELLER_POSTGRES_REPOSITORY_STATUS.CONFLICT,

              persisted:
                false,

              record:
                null,

              expected_revision:
                revision,

              current_revision:
                Number(
                  current.rows[0].revision
                ),
            };
          }


          await persistHistory(
            client,
            trusted,
            record
          );


          const history =
            await loadHistory(
              client,
              trusted.businessKey,
              updated.record_id
            );


          return {
            status:
              TELLER_POSTGRES_REPOSITORY_STATUS.READY,

            persisted:
              true,

            record:
              deserializePersistedTellerRecord(
                updated,
                {
                  auditHistory:
                    history,
                }
              ),
          };
        }
      );
    },


    async appendHistoryEvent({
      scope,
      recordId,
      historyEvent,
    }) {
      return withTellerBusinessTransaction(
        pool,
        scope,
        async (
          client,
          trusted
        ) => {
          const event =
            {
              event_id:
                deterministicEventId(
                  recordId,
                  historyEvent
                ),

              event_type:
                String(
                  historyEvent?.event ||
                  "record_event"
                ),

              actor_role:
                String(
                  historyEvent?.actor_role ||
                  trusted.actorRole
                ),

              note:
                String(
                  historyEvent?.note ||
                  ""
                ),

              metadata:
                {
                  ...(
                    historyEvent?.metadata ||
                    {}
                  ),
                },

              created_at:
                historyEvent?.at ||
                new Date().toISOString(),
            };


          await client.query(
            `
              INSERT INTO teller_record_events (
                business_key,
                record_id,
                event_id,
                event_type,
                actor_role,
                note,
                metadata,
                created_at
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7::jsonb,
                $8::timestamptz
              )
              ON CONFLICT (
                business_key,
                event_id
              )
              DO NOTHING
            `,
            [
              trusted.businessKey,
              clean(
                recordId
              ),
              event.event_id,
              event.event_type,
              event.actor_role,
              event.note,
              JSON.stringify(
                event.metadata
              ),
              event.created_at,
            ]
          );


          return {
            status:
              TELLER_POSTGRES_REPOSITORY_STATUS.READY,

            persisted:
              true,

            event,
          };
        }
      );
    },
  });
}

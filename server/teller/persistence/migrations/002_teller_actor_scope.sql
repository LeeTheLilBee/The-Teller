BEGIN;


-- -------------------------------------------------------------------------------------------------------------
-- Add actor identity to durable Teller records.
-- -------------------------------------------------------------------------------------------------------------

ALTER TABLE teller_records
    ADD COLUMN IF NOT EXISTS actor_id TEXT;


-- -------------------------------------------------------------------------------------------------------------
-- Historical backfill
--
-- Migration 001 FORCEs RLS on teller_records.
--
-- The database owner must be able to see the historical rows long enough to
-- backfill actor_id. NO FORCE preserves RLS for ordinary roles while allowing
-- the table owner to perform this migration safely.
--
-- This occurs inside one transaction and FORCE is restored before COMMIT.
-- -------------------------------------------------------------------------------------------------------------

ALTER TABLE teller_records
    NO FORCE ROW LEVEL SECURITY;


UPDATE teller_records
SET actor_id = 'legacy_unknown'
WHERE
    actor_id IS NULL
    OR BTRIM(actor_id) = '';


ALTER TABLE teller_records
    ALTER COLUMN actor_id SET NOT NULL;


ALTER TABLE teller_records
    ALTER COLUMN actor_id
    SET DEFAULT NULLIF(
        current_setting(
            'app.teller_actor_id',
            true
        ),
        ''
    );


CREATE INDEX IF NOT EXISTS idx_teller_records_business_actor_updated
    ON teller_records (
        business_key,
        actor_id,
        updated_at DESC
    );


-- -------------------------------------------------------------------------------------------------------------
-- Restore FORCE before installing the new actor-aware policies.
-- -------------------------------------------------------------------------------------------------------------

ALTER TABLE teller_records
    FORCE ROW LEVEL SECURITY;


-- -------------------------------------------------------------------------------------------------------------
-- Teller record authorization
--
-- Owner:
--   may access all records inside the authenticated business.
--
-- Manager / employee:
--   may access only records whose actor_id matches the authenticated actor.
--
-- Team delegation is deliberately NOT inferred here.
-- -------------------------------------------------------------------------------------------------------------

DROP POLICY IF EXISTS teller_records_business_isolation
    ON teller_records;


CREATE POLICY teller_records_business_isolation
    ON teller_records
    USING (
        business_key =
        NULLIF(
            current_setting(
                'app.teller_business_key',
                true
            ),
            ''
        )

        AND (

            NULLIF(
                current_setting(
                    'app.teller_role',
                    true
                ),
                ''
            ) = 'owner'

            OR

            actor_id =
            NULLIF(
                current_setting(
                    'app.teller_actor_id',
                    true
                ),
                ''
            )
        )
    )
    WITH CHECK (
        business_key =
        NULLIF(
            current_setting(
                'app.teller_business_key',
                true
            ),
            ''
        )

        AND (

            NULLIF(
                current_setting(
                    'app.teller_role',
                    true
                ),
                ''
            ) = 'owner'

            OR

            actor_id =
            NULLIF(
                current_setting(
                    'app.teller_actor_id',
                    true
                ),
                ''
            )
        )
    );


-- -------------------------------------------------------------------------------------------------------------
-- Event authorization follows the parent record.
--
-- This prevents a same-business employee/manager from gaining wider audit-history visibility
-- than the record itself allows.
-- -------------------------------------------------------------------------------------------------------------

DROP POLICY IF EXISTS teller_record_events_business_isolation
    ON teller_record_events;


CREATE POLICY teller_record_events_business_isolation
    ON teller_record_events
    USING (
        business_key =
        NULLIF(
            current_setting(
                'app.teller_business_key',
                true
            ),
            ''
        )

        AND

        EXISTS (
            SELECT
                1

            FROM teller_records AS parent_record

            WHERE
                parent_record.business_key =
                    teller_record_events.business_key

                AND parent_record.record_id =
                    teller_record_events.record_id
        )
    )
    WITH CHECK (
        business_key =
        NULLIF(
            current_setting(
                'app.teller_business_key',
                true
            ),
            ''
        )

        AND

        EXISTS (
            SELECT
                1

            FROM teller_records AS parent_record

            WHERE
                parent_record.business_key =
                    teller_record_events.business_key

                AND parent_record.record_id =
                    teller_record_events.record_id
        )
    );


ALTER TABLE teller_record_events
    FORCE ROW LEVEL SECURITY;


COMMIT;

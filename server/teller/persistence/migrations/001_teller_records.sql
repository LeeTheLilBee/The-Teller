BEGIN;


CREATE TABLE IF NOT EXISTS teller_records (
    business_key TEXT NOT NULL
        CHECK (BTRIM(business_key) <> ''),

    record_id TEXT NOT NULL
        CHECK (BTRIM(record_id) <> ''),

    schema_version TEXT NOT NULL
        CHECK (BTRIM(schema_version) <> ''),

    revision BIGINT NOT NULL DEFAULT 1
        CHECK (revision > 0),

    source TEXT NOT NULL
        CHECK (BTRIM(source) <> ''),

    source_id TEXT NOT NULL DEFAULT '',

    form_id TEXT NOT NULL DEFAULT '',

    workflow_type TEXT NOT NULL DEFAULT '',

    category TEXT NOT NULL DEFAULT '',

    title TEXT NOT NULL DEFAULT '',

    actor_role TEXT NOT NULL DEFAULT '',

    record_status TEXT NOT NULL
        CHECK (BTRIM(record_status) <> ''),

    payload JSONB NOT NULL DEFAULT '{}'::jsonb,

    search_projection JSONB NOT NULL DEFAULT '{}'::jsonb,

    integrity JSONB NOT NULL DEFAULT '{}'::jsonb,

    submission_fingerprint TEXT NOT NULL DEFAULT '',

    idempotency_key TEXT NOT NULL
        CHECK (BTRIM(idempotency_key) <> ''),

    search_text TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL,

    PRIMARY KEY (
        business_key,
        record_id
    ),

    UNIQUE (
        business_key,
        idempotency_key
    )
);


CREATE TABLE IF NOT EXISTS teller_record_events (
    business_key TEXT NOT NULL
        CHECK (BTRIM(business_key) <> ''),

    record_id TEXT NOT NULL
        CHECK (BTRIM(record_id) <> ''),

    event_id TEXT NOT NULL
        CHECK (BTRIM(event_id) <> ''),

    event_type TEXT NOT NULL
        CHECK (BTRIM(event_type) <> ''),

    actor_role TEXT NOT NULL DEFAULT '',

    note TEXT NOT NULL DEFAULT '',

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL,

    PRIMARY KEY (
        business_key,
        event_id
    ),

    CONSTRAINT teller_record_events_record_fk
        FOREIGN KEY (
            business_key,
            record_id
        )
        REFERENCES teller_records (
            business_key,
            record_id
        )
        ON DELETE RESTRICT
);


CREATE INDEX IF NOT EXISTS idx_teller_records_business_updated
    ON teller_records (
        business_key,
        updated_at DESC
    );


CREATE INDEX IF NOT EXISTS idx_teller_records_business_category
    ON teller_records (
        business_key,
        category
    );


CREATE INDEX IF NOT EXISTS idx_teller_records_business_status
    ON teller_records (
        business_key,
        record_status
    );


CREATE INDEX IF NOT EXISTS idx_teller_records_business_form
    ON teller_records (
        business_key,
        form_id
    );


CREATE INDEX IF NOT EXISTS idx_teller_record_events_record_created
    ON teller_record_events (
        business_key,
        record_id,
        created_at
    );


ALTER TABLE teller_records
    ENABLE ROW LEVEL SECURITY;


ALTER TABLE teller_records
    FORCE ROW LEVEL SECURITY;


ALTER TABLE teller_record_events
    ENABLE ROW LEVEL SECURITY;


ALTER TABLE teller_record_events
    FORCE ROW LEVEL SECURITY;


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
    );


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
    );


COMMIT;

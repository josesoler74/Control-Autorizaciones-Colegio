CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE school_student (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_code VARCHAR(60) NOT NULL UNIQUE,
    display_name VARCHAR(160) NOT NULL,
    classroom VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE guardian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(160) NOT NULL,
    phone_e164 VARCHAR(20) NOT NULL,
    phone_verified_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student_guardian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES school_student(id),
    guardian_id UUID NOT NULL REFERENCES guardian(id),
    relationship VARCHAR(60) NOT NULL,
    verified_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(student_id, guardian_id)
);

CREATE TABLE school_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    event_at TIMESTAMPTZ NOT NULL,
    response_deadline TIMESTAMPTZ NOT NULL,
    consent_text TEXT NOT NULL,
    consent_version VARCHAR(40) NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    CONSTRAINT valid_deadline CHECK (response_deadline <= event_at)
);

CREATE TABLE authorization_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES school_activity(id),
    student_id UUID NOT NULL REFERENCES school_student(id),
    guardian_id UUID NOT NULL REFERENCES guardian(id),
    token_hash CHAR(64) NOT NULL UNIQUE,
    token_expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    provider_message_id VARCHAR(160),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(activity_id, student_id, guardian_id)
);

CREATE TABLE authorization_response (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL UNIQUE REFERENCES authorization_request(id),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('AUTHORIZED', 'NOT_AUTHORIZED')),
    consent_version VARCHAR(40) NOT NULL,
    responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_ip_hash VARCHAR(128)
);

CREATE TABLE audit_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(60) NOT NULL,
    actor_type VARCHAR(20) NOT NULL,
    actor_id UUID,
    entity_type VARCHAR(60) NOT NULL,
    entity_id UUID NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    previous_hash CHAR(64),
    event_hash CHAR(64) NOT NULL
);

CREATE INDEX idx_activity_deadline ON school_activity(response_deadline);
CREATE INDEX idx_request_activity_status ON authorization_request(activity_id, status);
CREATE INDEX idx_request_guardian ON authorization_request(guardian_id);
CREATE INDEX idx_audit_entity ON audit_event(entity_type, entity_id, created_at);

-- Defensa adicional: la aplicación debe usar un rol que no tenga UPDATE/DELETE.
-- Este trigger impide modificaciones accidentales incluso desde roles con permisos DML.
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit_event is append-only';
END;
$$;

CREATE TRIGGER audit_event_no_update_delete
BEFORE UPDATE OR DELETE ON audit_event
FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

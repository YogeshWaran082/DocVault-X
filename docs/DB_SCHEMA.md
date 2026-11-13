# DocVault X — PostgreSQL Schema Specification (14 Tables)

All tables use UUID Primary Keys, UTC timestamps, and tenant isolation (`organization_id`).

```sql
-- 1. Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(64) NOT NULL DEFAULT 'standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Memberships
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(64) NOT NULL DEFAULT 'sender', -- 'owner', 'admin', 'sender', 'recipient', 'auditor'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

-- 4. Devices
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_public_key TEXT NOT NULL,
    platform VARCHAR(64) NOT NULL, -- 'windows', 'macos', 'android', 'ios', 'web_pwa'
    attestation_status VARCHAR(64) NOT NULL DEFAULT 'unverified',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- 5. Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    mime_declared VARCHAR(128) NOT NULL,
    mime_detected VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256_ciphertext VARCHAR(64) NOT NULL,
    current_version_id UUID,
    status VARCHAR(64) NOT NULL DEFAULT 'active', -- 'active', 'revoked', 'deleted', 'quarantined'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 6. Document Versions
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    object_key TEXT NOT NULL,
    container_version INT NOT NULL DEFAULT 1,
    wrapped_dek_ref TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Policies
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    mode VARCHAR(64) NOT NULL DEFAULT 'SECURE_NATIVE', -- 'NORMAL_EXPORT', 'SECURE_NATIVE', 'OFFLINE_PWA'
    expires_at_utc TIMESTAMPTZ,
    max_opens INT,
    offline_lease_seconds INT NOT NULL DEFAULT 86400,
    allow_export BOOLEAN NOT NULL DEFAULT FALSE,
    allow_print BOOLEAN NOT NULL DEFAULT FALSE,
    watermark_template TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    superseded_at TIMESTAMPTZ
);

-- 8. Grants
CREATE TABLE grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies(id),
    status VARCHAR(64) NOT NULL DEFAULT 'active', -- 'active', 'revoked'
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- 9. Licenses
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    policy_version INT NOT NULL DEFAULT 1,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    not_before TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    lease_expires_at TIMESTAMPTZ NOT NULL,
    license_jti VARCHAR(128) UNIQUE NOT NULL,
    signed_payload TEXT NOT NULL,
    revoked_at TIMESTAMPTZ
);

-- 10. Share Links
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Access Events
CREATE TABLE access_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    device_id UUID REFERENCES devices(id),
    event_type VARCHAR(64) NOT NULL, -- 'opened', 'viewed', 'expired_denied', 'revoked_denied', 'offline_synced'
    event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    offline_reported BOOLEAN NOT NULL DEFAULT FALSE,
    metadata_redacted JSONB
);

-- 12. Conversion Jobs
CREATE TABLE conversion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    preview_object_key TEXT,
    error_code VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 13. Deletion Jobs
CREATE TABLE deletion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    error_code VARCHAR(64)
);

-- 14. Audit Events
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id),
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash VARCHAR(64),
    details_redacted JSONB
);
```

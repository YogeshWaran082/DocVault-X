# DocVault X — Universal Offline Protected Document Platform
## Cursor / Google Antigravity Master Implementation Specification
Version 1.0 — 2026-11-12

## Mission
Build a production-oriented multi-platform SaaS for uploading any binary document, encrypting it into a `.dvx` container, assigning signed access policies, distributing protected files, and viewing supported formats offline through controlled clients. Support Web, Windows, macOS, Android, iOS, and installable PWA. Offer an explicitly UNPROTECTED standard-file export for compatibility with Adobe Reader, Chrome and Microsoft Office. Never claim offline remote deletion, tamper-proof DRM, guaranteed expiry, or control over copied original files.

## Non-negotiable security invariants
1. Ordinary PDFs/DOCX/XLSX/PPTX and other standard exports are not expiry-enforceable. Warn before exporting.
2. Protected `.dvx` files require a DocVault client; encrypted data is never silently exported to native applications.
3. Offline expiry is enforced by honest clients using locally cached signed licenses and best-effort rollback detection. Fully user-controlled devices can bypass it; document that limitation.
4. Server revocation only takes effect once the client reconnects or its preissued offline lease expires. Short leases improve revocation but reduce offline availability.
5. No silent deletion of arbitrary local files. Delete only app-owned cached ciphertext and key material when permitted; backups, screenshots and external copies cannot be guaranteed removed.
6. Use audited cryptographic libraries, not custom crypto. Authenticated encryption with fresh random nonces and verified associated data; key wrapping and rotation. Never put plaintext file keys in metadata, URLs or logs.
7. For an expired license, deny access and attempt secure key removal; do not claim forensic secure erase on flash storage.
8. Do not claim full prevention of screenshot, print, copy, screen recording or memory extraction. Implement platform-dependent deterrents only.
9. Treat conversion engines, archives, media decoders and document renderers as hostile-input parsers. Isolate/sandbox and resource-limit them.
10. Build accessible UX, explicit user consent, privacy controls, audit logs and a threat model.

## Product modes
- Mode A NORMAL_EXPORT: export original standard file for native apps. Works offline; no enforceable expiry, revocation or destruction. UI must show 'Unprotected export'.
- Mode B SECURE_NATIVE: encrypted `.dvx` container, viewed in DocVault desktop/mobile apps, with locally signed lease and device-bound key where supported. Best available policy control, still not absolute.
- Mode C OFFLINE_PWA: encrypted `.dvx` imported into installed PWA, viewed using Web Crypto and local storage. Best-effort expiry; browser storage can be cleared, copied or tampered with; OS/browser capabilities vary.

## Formats
Store arbitrary binary files without format restriction except configurable upload size and malware policies. Viewer capabilities by plugin: PDF (PDF.js), images (safe decoding), TXT/MD/JSON (escaped text), CSV (bounded grid), office files (server-side sandboxed LibreOffice preview conversion where appropriate, or carefully selected safe client renderer), slides (converted pages), audio/video (supported codecs), archives (bounded listing, no arbitrary extraction), other (encrypted storage only). Record per-format support: store, preview, edit, print, export. Do not promise universal offline editing.

## User roles and journeys
Roles: platform_admin, organization_owner, organization_admin, sender, recipient, auditor. Tenant isolation mandatory.
Sender: sign in -> upload -> scan/validate -> encrypt -> choose mode -> set expiry policy -> select recipients/devices -> create share -> download/share invitation -> view audit/revoke.
Recipient: accept invitation -> verify identity online once -> enroll device -> obtain signed offline license -> download `.dvx` -> open in supported viewer offline -> show remaining lease -> deny after expiry -> reconnect to refresh license or learn of revocation.
Recipient without app: can choose unprotected original only if sender explicitly allows; explain risk.

## UX screens
Public: landing, features, security limitations, pricing placeholder, help, privacy/terms.
Auth: login, signup, email verification, MFA, reset, organization switcher.
Dashboard: totals, recent files, expiring soon, offline license status, alerts.
Documents: list/search/filter, upload wizard, detail, versions, preview, access grants, revoke, retention/deletion.
Sharing: recipient invites, link settings, device enrollment, license delivery, audit.
Viewer: supported content, watermark, expiry/lease countdown, offline badge, access-denied, license-expired, file-corrupt, unsupported format, reconnect needed.
Admin: teams, roles, security policies, API keys, audit exports, storage, billing placeholders.
Responsive UI: desktop nav/sidebar, mobile bottom navigation, keyboard support, WCAG AA-oriented contrast, dark/light theme, empty/error/loading states.

## Monorepo structure
```
docvault-x/
  apps/
    web/                   # Next.js dashboard and PWA
    desktop/               # Tauri 2 + Rust secure viewer
    mobile/                # Flutter + native Android/iOS secure storage
    api/                   # NestJS/TypeScript API
    worker/                # BullMQ worker: scanning, conversion, cleanup
  packages/
    ui/                    # shared design system
    contracts/             # OpenAPI, generated types, zod schemas
    crypto-core/           # audited Rust crypto crate + bindings
    policy-core/           # canonical policy parser and evaluator
    file-format/           # .dvx parser/spec, fuzz tests
    config/                # lint/format/tsconfig
  infrastructure/
    docker/ terraform/ k8s/ monitoring/
  docs/
    architecture/ threat-model/ security/ api/ adr/ runbooks/
  tests/
    e2e/ integration/ security/ fixtures/ compatibility/
  .github/workflows/
  README.md
```

## Technology
Web: Next.js, TypeScript, Tailwind, shadcn/ui, TanStack Query; offline PWA with IndexedDB and Web Crypto.
API: NestJS/TypeScript, PostgreSQL, Prisma, Redis, BullMQ, object storage (S3/R2), KMS/HSM-backed key wrapping, OpenAPI.
Desktop: Tauri 2 + Rust; OS keystore where available. Mobile: Flutter with native Android Keystore / iOS Keychain/Secure Enclave integration where feasible.
Deployment: Docker, CI/CD, HTTPS, structured logs, metrics, tracing, migrations, automated backup, secrets manager.

## Database schema (PostgreSQL, UUID PKs, tenant-scoped)
- organizations(id, name, plan, created_at)
- users(id, email, name, password_hash_nullable, mfa_enabled, created_at)
- memberships(id, organization_id, user_id, role, created_at)
- devices(id, organization_id, user_id, device_public_key, platform, attestation_status, enrolled_at, revoked_at)
- documents(id, organization_id, owner_user_id, title, mime_declared, mime_detected, size_bytes, sha256_ciphertext, current_version_id, status, created_at, deleted_at)
- document_versions(id, document_id, object_key, container_version, wrapped_dek_ref, size_bytes, created_at)
- policies(id, organization_id, document_id, version, mode, expires_at_utc, max_opens, offline_lease_seconds, allow_export, allow_print, watermark_template, created_at, superseded_at)
- grants(id, organization_id, document_id, recipient_user_id, policy_id, status, granted_at, revoked_at)
- licenses(id, organization_id, grant_id, device_id, policy_version, issued_at, not_before, expires_at, lease_expires_at, license_jti, signed_payload, revoked_at)
- share_links(id, organization_id, grant_id, token_hash, expires_at, max_uses, used_count, created_at)
- access_events(id, organization_id, document_id, user_id, device_id, event_type, event_time, offline_reported, metadata_redacted)
- conversion_jobs(id, organization_id, document_version_id, status, preview_object_key, error_code, created_at, completed_at)
- deletion_jobs(id, organization_id, document_id, requested_at, completed_at, status, error_code)
- audit_events(id, organization_id, actor_user_id, action, target_type, target_id, timestamp, ip_hash, details_redacted)
- key_versions(id, organization_id, kms_key_ref, state, created_at, retired_at)
Indexes: organization_id on all tenant data; (document_id, event_time), (user_id, created_at), (expires_at), unique license_jti, token_hash. FK constraints, retention policies, RLS or equivalent defense in depth. Store UTC timestamps and show user timezone.

## API architecture (versioned REST, OpenAPI, authorization on every endpoint)
Auth: POST /v1/auth/register, /login, /refresh, /logout, /mfa/verify; GET /v1/me.
Organizations: GET/POST /v1/organizations; GET/POST /v1/organizations/:id/members.
Documents: POST /v1/documents/uploads/initiate; POST /v1/documents/uploads/complete; GET /v1/documents; GET /v1/documents/:id; GET /v1/documents/:id/versions; DELETE /v1/documents/:id.
Policies: POST /v1/documents/:id/policies; GET /v1/documents/:id/policies; POST /v1/documents/:id/revoke.
Grants: POST /v1/documents/:id/grants; GET /v1/documents/:id/grants; DELETE /v1/grants/:id.
Devices: POST /v1/devices/enroll/challenge; POST /v1/devices/enroll/complete; GET /v1/devices; POST /v1/devices/:id/revoke.
Licenses: POST /v1/licenses/issue; POST /v1/licenses/refresh; POST /v1/licenses/sync; GET /v1/licenses/:id/status.
Downloads: POST /v1/documents/:id/protected-download; POST /v1/documents/:id/unprotected-export (requires explicit permission + acknowledgement).
Events: POST /v1/events/batch; GET /v1/documents/:id/access-events; GET /v1/audit.
Health: GET /health/live, /health/ready.
Use short-lived signed upload/download URLs, idempotency keys for mutating operations, rate limits, pagination, schema validation, malware scanning, access control, and secure error codes. Do not issue decryption keys solely on knowledge of document URL.

## .dvx encrypted container specification v1
Magic `DVX1`, version, algorithm suite ID, bounded header length, canonical CBOR metadata, random per-file DEK, chunked AEAD ciphertext, authenticated chunk ordering and final manifest/hash, recipient/device key envelopes, signed policy reference, signature algorithm/key id. Chunk size fixed and documented; unique nonces per key and chunk; authenticated associated data includes document ID, version, chunk index, total count, policy binding. Verify before render; reject truncated/reordered/duplicate chunks, unsupported versions, oversized headers, malformed manifests, replayed licenses. Signing keys separate from encryption keys. Write test vectors, fuzzers, and interoperability fixtures. License envelope includes document ID/version, recipient, device binding, policy version, not_before, absolute expiry, offline lease expiry, issued_at, unique JTI, algorithm/key ID, signature. Keep file key wrapped to device public key / platform keystore where supported. If secure hardware not available, mark assurance as reduced.

## Offline expiry policy semantics
Effective deadline = min(document_absolute_expiry, license_lease_expiry, any applicable first-open duration expiry, other policy limits). If local trusted time cannot be established, fail closed for high-security policy, or show reduced-assurance status for configurable low-security mode. Detect backwards clock jumps against persisted high-water mark and monotonic elapsed time within process/session. A reboot or device compromise limits reliability. Device enrollment and initial license issuance require connectivity. On expiration, deny opening and clear app-managed unwrapped keys and previews. Sync access events later, marking them as client-reported and not independently verified. Server-side revocation propagates on reconnect; never promise instant offline revocation.

## Security threat model (STRIDE)
Assets: plaintext, DEKs, private device keys, signed policies, user identities, tenant data, audit trails.
Attackers: unauthenticated internet adversary, malicious recipient, compromised device, malicious admin, document parser exploit, insider with storage access.
Threats and mitigations:
- Spoofing: MFA, phishing-resistant auth where possible, device enrollment challenge, signed licenses.
- Tampering: AEAD, canonical signed policy, signature verification, anti-replay identifiers.
- Repudiation: immutable server-side audit logs; offline events labeled unverified.
- Information disclosure: encryption at rest/in transit, KMS, tenant isolation, least privilege, redacted logs, no plaintext previews in shared cache.
- Denial of service: upload quotas, rate limits, parser timeouts, decompression bomb detection, worker isolation.
- Elevation of privilege: RBAC + ABAC, per-document grants, automated authorization tests, admin separation.
- Recipient bypass: OS clock rollback, patched app, key/memory extraction, screenshots, backup restore, virtual machine snapshots; cannot guarantee prevention on attacker-owned hardware. Reduce risk with short leases, hardware-backed keys, watermark, platform attestation when available, and honest disclosure.
- Native export: irreversibly loses enforcement; explicit confirmation, warning and audit event.
- PWA compromise: XSS, service worker poisoning, IndexedDB theft; strict CSP, integrity, minimal trusted JS, secure origin, no secrets in localStorage.
- Malicious files: sandbox converters and decoders; antivirus scanning, no macro execution, zip bomb limits.

## Delivery phases and acceptance criteria
Phase 0 — discovery, ADRs, exact format support matrix, threat model, UX wireframes, monorepo, CI; acceptance: reviewed architecture and limitations.
Phase 1 — auth, organizations, RBAC, database, S3 upload, dashboard; acceptance: cross-tenant access denied, file validation and audit.
Phase 2 — .dvx Rust crypto-core, signed policies, key wrapping, format test vectors; acceptance: round-trip, tamper/truncation rejection, fuzzing.
Phase 3 — desktop secure viewer for PDF/images/text, device enrollment, offline license, expiry UI; acceptance: open offline before expiry, deny after expiry in honest-client tests, clearly report clock rollback limitations.
Phase 4 — recipient sharing, invitations, revocation, offline leases, events; acceptance: online revocation works, offline revocation delayed until sync/lease expiry.
Phase 5 — mobile clients and PWA, platform storage integration, format support; acceptance: supported formats open offline after initial provisioning; unsupported formats display clear error.
Phase 6 — office previews, conversion workers, media, archives, watermark, native unprotected export; acceptance: sandbox limits, format matrix, export warning.
Phase 7 — security hardening, accessibility, penetration test, performance/load tests, backups/restore, monitoring, privacy compliance, staged production release.
Do not claim 100% security, 100% feature parity, or guaranteed self-destruction.

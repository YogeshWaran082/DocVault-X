# DocVault X — Development Roadmap & Phase Tracking

## Development Phases

- [x] **Phase 0 — Discovery, Architecture & Core Scaffolding**
  - Architecture documents, threat model, API contracts, database schema, security limitations.
  - Monorepo structure, package configuration, and infrastructure definition.
- [ ] **Phase 1 — Core Platform, Authentication, Tenancy & Document Upload (Current Focus)**
  - PostgreSQL 14-table schema with Prisma ORM / Migrations.
  - Multi-tenant authentication (register, login, refresh, sessions, password hashing, MFA).
  - Organizations & role-based memberships (owner, admin, sender, recipient, auditor).
  - Document upload pipeline (chunked/multipart S3 upload initiation, completion, validation, checksums).
  - Modern web dashboard (Next.js, responsive Tailwind UI, document explorer, statistics, upload modal).
  - Comprehensive unit and integration test suite verifying tenant isolation and file ingest.
- [ ] **Phase 2 — Cryptographic Core & .dvx Container Engine**
  - AES-256-GCM chunked AEAD implementation with authenticated metadata headers.
  - Canonical CBOR serialization and Ed25519 policy signing.
  - Fuzzing and container validation (anti-tamper, chunk reordering detection).
- [ ] **Phase 3 — Desktop Secure Viewer & Offline Leases**
  - Tauri 2 + Rust native viewer.
  - Hardware-backed keystore integration & monotonic clock tracking.
  - Dynamic watermarking & lease expiry enforcement.
- [ ] **Phase 4 — Recipient Sharing, Revocation & Audit Logging**
  - Secure invitations, share link generator, device challenge/response enrollment.
  - Real-time online revocation and lease synchronization.
- [ ] **Phase 5 — Mobile Clients & Offline PWA**
  - PWA WebCrypto storage & Flutter secure container rendering.
- [ ] **Phase 6 — Multi-format Previews & Conversion Sandboxing**
  - Sandboxed LibreOffice conversion workers, safe archive inspection.
- [ ] **Phase 7 — Production Hardening & Security Audit**
  - End-to-end security audit, load testing, disaster recovery verification.

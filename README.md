# DocVault X — Universal Offline Protected Document Platform

DocVault X is an enterprise-grade document security and controlled offline-distribution platform designed to protect sensitive intellectual property, compliance records, and confidential files across untrusted and intermittently disconnected environments.

## Non-Negotiable Security Invariants & Limitations

1. **Ordinary PDF/Office Files (Mode A)**: Standard exports opened in Adobe Acrobat or Microsoft Office **cannot enforce expiry or revocation** once exported. The platform explicitly labels these as **UNPROTECTED EXPORTS**.
2. **Protected Containers (Mode B - `.dvx`)**: Uses AES-256-GCM chunked AEAD encryption. Controlled offline access is enforced by honest DocVault clients using signed licenses, bounded offline leases, and monotonic clock checks.
3. **Physical & Root Limitations**: Software cannot prevent an attacker with administrative, kernel, debugger, snapshot, or physical camera access from capturing content. Dynamic forensic watermarks act as an accountable deterrent.
4. **Offline Revocation Window**: Server revocation takes effect when the client reconnects or when its pre-issued offline lease expires.

---

## Dual Document Opening Modes

DocVault X supports two distinct document opening paradigms:

### Mode A: Secure Browser Share Link (Zero Install)
* **How it works:** Sender creates an expiring share link. Recipient opens the link directly in Chrome, Edge, Safari, or Firefox without software installation, registration, OTP, or login.
* **First-Open Expiry:** Countdown timer begins upon the recipient's first successful open.
* **Server-Enforced Expiry:** The moment the timer elapses (e.g., 1 minute, 50 minutes, 24 hours), the server returns `410 Gone`, wipes decrypted memory blobs, and displays **"Session Expired — Access Denied"**.
* **Protections:** Print, copy, and raw download UI disabled; optional single-session restriction (`409 Conflict` on concurrent access); atomic max-open limits.

### Mode B: DVX Browser Viewer ("Open .dvx File")
* **How it works:** Users select an encrypted `.dvx` container from their device on the DocVault X site (`/#/dvx`).
* **Container Integrity:** Validates `DVX1` magic signature, version, and metadata structure.
* **Server-Mediated Decryption:** Decrypts in memory only after validating user identity or share token authorization. Plaintext is streamed with `Cache-Control: no-store` into the full-height canvas viewer.
* **Automatic Revocation:** Session heartbeat check cuts off access if revoked or expired.

---

## Architecture & Monorepo Structure

```
docvault-x/
  apps/
    web/                   # React + TypeScript + Tailwind SaaS Dashboard & PWA
    api/                   # Express/TypeScript API with multi-tenant auth & encryption
  packages/
    contracts/             # Shared Zod schemas, OpenAPI definitions, TypeScript types
    crypto-core/           # AES-256-GCM chunked AEAD, DEK generation, Ed25519 signing
    policy-core/           # Monotonic clock tracking, offline lease evaluation
    file-format/           # .dvx container encoder, decoder, and header inspection
    ui/                    # Shared UI helpers (watermarks, mode badges)
    config/                # Base tsconfig and lint rules
  infrastructure/
    docker/                # Docker compose (PostgreSQL 16, Redis 7, MinIO)
  docs/
    architecture/          # System architecture specifications
    security/              # STRIDE threat model & invariants
    API.md                 # REST API specification v1
    DB_SCHEMA.md           # 14-table PostgreSQL schema
    FORMAT_SUPPORT_MATRIX.md
    SECURITY_LIMITATIONS.md
    TEST_PLAN.md
    ROADMAP.md
```

---

## Quickstart & Local Setup

### 1. Prerequisites
- Node.js >= 20
- pnpm >= 12
- Docker (optional, for running PostgreSQL, Redis, and MinIO)

### 2. Infrastructure Services (Optional Docker)
To start local PostgreSQL, Redis, and MinIO:
```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 3. Installation & Compilation
```bash
# Install dependencies
pnpm install

# Build all packages and applications
pnpm --filter @docvault/contracts run build
pnpm --filter @docvault/crypto-core run build
pnpm --filter @docvault/policy-core run build
pnpm --filter @docvault/file-format run build
pnpm --filter @docvault/ui run build
pnpm --filter @docvault/api run build
pnpm --filter @docvault/web run build
```

### 4. Running the Complete Test Suite
```bash
# Run all unit and API integration tests
(cd packages/crypto-core && node --test dist/index.test.js)
(cd packages/policy-core && node --test dist/index.test.js)
(cd packages/file-format && node --test dist/index.test.js)
(cd apps/api && node --test dist/app.test.js)
```

### 5. Running API & Web Server
```bash
# Start backend API (port 4000)
cd apps/api && node dist/main.js

# In another terminal, start frontend dev server (port 3000)
cd apps/web && ./node_modules/.bin/vite
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Secure Browser Document Viewer (No App Install Required)

Receiver can open protected documents directly in Chrome, Edge, Safari, or Firefox without installing any software. Expiry is enforced server-side.

### Receiver Browser Workflow
1. **Sender Creates Share Link**: Sender selects expiry (e.g. 1 minute, 50 minutes, 24 hours), optional max views, and optional watermark.
2. **Generates Browser URL**: Recipient receives an expiring link (`/#/share/<token>`).
3. **Zero-Install Viewing**: Recipient opens in any browser. Server validates authorization and authoritative clock, delivering protected memory-only stream with strict `Cache-Control: no-store` headers.
4. **Live Expiry & Heartbeat**: Active viewer runs heartbeat checks every 3 seconds. The moment the server clock marks expiry or the sender revokes the link:
   - The document view immediately closes and clears memory blobs.
   - The screen renders **"Document Expired — Access Denied"**.
   - Subsequent fetch requests are rejected with `410 Gone`.

---

## Completed Phase 1 Milestones

- [x] **Repository Audit & Foundation**: Produced full architecture specs, threat model, API specification, 14-table database schema, and security limitations.
- [x] **Monorepo Structure**: Standardized monorepo with `@docvault/contracts`, `@docvault/crypto-core`, `@docvault/policy-core`, `@docvault/file-format`, `@docvault/ui`, `apps/api`, and `apps/web`.
- [x] **PostgreSQL 14-Table Architecture**: Complete relational model (`organizations`, `users`, `memberships`, `devices`, `documents`, `document_versions`, `policies`, `grants`, `licenses`, `share_links`, `access_events`, `conversion_jobs`, `deletion_jobs`, `audit_events`).
- [x] **Multi-Tenant Authentication & RBAC**: Tenant-scoped registration, JWT & refresh token issuance, role-based authorization (`owner`, `admin`, `sender`, `recipient`, `auditor`), and cross-tenant boundary isolation.
- [x] **Real Document Ingestion & Encryption**: Multipart upload directly encrypts files into `.dvx` containers using AES-256-GCM chunked AEAD (64 KB chunks), calculates SHA-256 ciphertext hash, and wraps DEK with KMS keys.
- [x] **Offline Lease Licensing**: Cryptographic device enrollment challenge/response, and Ed25519-signed offline lease tokens with monotonic clock rollback detection.
- [x] **Mode A Unprotected Export**: Enforces mandatory user consent warnings; standard files explicitly labeled unprotected.
- [x] **Modern Web UI**: Responsive dashboard, upload modal with mode selection, document explorer, live secure viewer preview with dynamic watermarking and lease countdown, and security audit log viewer.

# DocVault X — Dual Viewer Architecture & Implementation Report

**Document Version:** 1.0.0  
**Date:** November 2026  
**Implementation Status:** Fully Implemented & Tested (37/37 Tests Passed)  

---

## 1. Project Overview & Mission

DocVault X has been upgraded to provide two distinct, enterprise-grade document opening workflows while strictly preserving all existing database records, multi-tenant isolation, cryptographic algorithms (AES-256-GCM chunked AEAD), and sender vault retention:

1. **Mode A: Secure Browser Share Link**
   * Instant browser viewing via URL (`/#/share/:token`) across Chrome, Edge, Safari, and Firefox.
   * Zero recipient software installation, zero registration, and zero OTP.
   * Cryptographically secure 256-bit base64url tokens, stored only as SHA-256 hashes in database.
   * Authoritative server-side clock evaluation on every request (client countdown is purely visual).
   * First-Open Expiry semantics (`expiryType: 'FIRST_OPEN'`): countdown starts on first recipient open, establishing an immutable shared expiry timestamp for all sessions.
   * Atomic maximum opens limit (`openCount >= maxOpens` returns `403 Forbidden`).
   * Optional Single Active Session restriction (`singleSessionOnly: true` returns `409 Conflict` on concurrent access).
   * Immediate sender revocation invalidates all active sessions in real time.
   * At expiry: viewer hides document, zeroizes in-memory blobs, and displays **"Session Expired — Access Denied"**. Subsequent refreshes or reopenings receive `410 Gone`.

2. **Mode B: DVX Browser Viewer**
   * Direct in-browser container inspection and viewing via **"Open .dvx File"** (`/#/dvx`).
   * Recipient or auditor selects an encrypted `.dvx` file from local storage.
   * Step 1 — Inspection (`POST /api/v1/dvx/inspect`): Parses `DVX1` header, version, cipherSuite, and metadata payload, verifying cryptographic structure without decrypting chunks.
   * Step 2 — Authorization (`POST /api/v1/dvx/authorize`): Validates user identity (Bearer JWT) or share token, checks document status, policy lease, and revocation.
   * Step 3 — Decrypted Preview (`GET /api/v1/dvx/preview/:sessionId`): Server unwraps DEK using master KMS key and decrypts chunks in memory only, delivering a memory-only stream with `Cache-Control: no-store, no-cache, must-revalidate, private, max-age=0`.
   * Real-time heartbeat validation (`GET /api/v1/dvx/sessions/:sessionId/status`) cuts off access upon expiry or revocation.

---

## 2. Root Cause Analysis & Resolution of PDF Viewer Height Bug

### 2.1 The Problem
Previously, documents opened in a very short (~150px - 200px) horizontal strip, leaving most of the browser viewport empty.

### 2.2 Root Causes Identified
1. **Native `<iframe>` Default Fallback Sizing:** Embedding `<iframe src="blob:..." />` inside CSS Flexbox caused WebKit/Blink browsers to default to inline replaced element dimensions (300px × 150px).
2. **Missing `min-h-0` in Flexbox Chain:** Flex items default to `min-height: auto`. Without `min-h-0` on `main` and parent containers, children collapsed instead of expanding to fill remaining viewport height.
3. **Browser PDF Plugin Restrictions:** Native PDF plugins do not support dynamic scaling, Fit Width / Fit Page geometry, or custom UI suppression (e.g. native download/print toolbars).

### 2.3 The Solution: Reusable Canvas Document Viewer (`PdfViewer.tsx`)
* Built with `pdfjs-dist` (v4.10.38) and native HTML5 `<canvas>` rendering.
* Viewport hierarchy structured with `flex-1 min-h-0 w-full relative overflow-hidden bg-slate-900`.
* Toolbar pinned at top; document scroll container fills 100% of remaining screen height.
* Features:
  * **Fit Width:** Automatically scales canvas width to match container width.
  * **Fit Page:** Scales entire page height/width to fit within visible viewport height without vertical overflow.
  * **Zoom Controls:** In (`+`), Out (`-`), and Reset (`100%`).
  * **Navigation:** Jump to page input, Previous/Next page buttons, Page indicator.
  * **Fullscreen:** HTML5 Fullscreen API toggle.
  * **ResizeObserver:** Recomputes scale automatically on window resize or mobile orientation changes.
  * **Render Cancellation Protection:** Tracks active `renderTask` per page to avoid concurrency collision during rapid zoom actions.

---

## 3. Architecture & API Specifications

### New & Updated Endpoints:

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/documents/:id/shares` | Authenticated (Sender) | Create expiring share link with first-open or absolute expiry, max opens, watermark, single-session. |
| `GET` | `/api/v1/documents/:id/shares` | Authenticated (Sender) | List all shares for document. |
| `POST` | `/api/v1/shares/:id/revoke` | Authenticated (Sender) | Instantly revoke share link and terminate active viewer sessions. |
| `POST` | `/api/v1/shares/:id/extend` | Authenticated (Sender) | Extend share expiry duration (e.g. +30m). |
| `POST` | `/api/v1/shares/:id/regenerate` | Authenticated (Sender) | Issue fresh 256-bit token while invalidating old token. |
| `POST` | `/api/v1/shares/:token/session` | Public | Receiver opens share link. Evaluates expiry, max opens, and first-open timer. |
| `GET` | `/api/v1/viewer/sessions/:id/status` | Public | Viewer heartbeat check. Returns 200 (active), 410 (expired), or 403 (revoked). |
| `GET` | `/api/v1/viewer/sessions/:id/content` | Public | Streams decrypted memory-only content with `Cache-Control: no-store`. |
| `POST` | `/api/v1/dvx/inspect` | Public | Multipart upload to inspect `.dvx` container header (`DVX1`), metadata, and version. |
| `POST` | `/api/v1/dvx/authorize` | Optional Auth / Token | Authorizes DVX decryption for logged-in owner or recipient with share token. |
| `GET` | `/api/v1/dvx/preview/:sessionId` | Public | Streams decrypted plaintext for authorized DVX session. |
| `GET` | `/api/v1/dvx/sessions/:id/status` | Public | Heartbeat check for DVX viewing session. |
| `GET` | `/api/v1/audit/metrics` | Authenticated | Organization storage metrics (total documents, storage bytes, active/expired shares). |
| `GET` | `/api/v1/audit/alerts` | Authenticated | Real-time security alerts (`CONCURRENT_SESSION_BLOCKED`, `FORWARDED_LINK_DETECTED`, etc.). |

---

## 4. Automated Test Results

Total Automated Tests: **37 Passing (0 Failing, 0 Skipped)**

```
▶ DocVault X API Integration Tests
  ✔ verifies health endpoints
  ✔ registers user A with Organization A
  ✔ logs in user A and verifies profile via /me
  ✔ uploads a document, encrypts to .dvx container with real AES-256-GCM
  ✔ downloads the protected .dvx container and verifies DVX1 header
  ✔ enforces multi-tenant isolation: Tenant B cannot access Tenant A documents
  ✔ issues signed offline lease license for enrolled device
  ✔ handles Mode A unprotected export with mandatory security disclosure
  ✔ revokes document access and blocks subsequent downloads
  ▶ Secure Browser Document Viewer (No App Required & Server-Side Expiry)
    ✔ creates an expiring browser share link (e.g. 1 minute expiry)
    ✔ authorizes receiver browser session without software installation
    ✔ enforces server-side expiry: content is blocked after duration finishes
    ✔ sender instant revocation immediately terminates active viewer
    ✔ implements first-open expiry semantics with authoritative shared timestamp
    ✔ enforces atomic max-open limits and records security alert
    ✔ enforces single-session policy (concurrent / forwarded viewing block)
    ✔ preserves original encrypted documents in sender vault even after share expiry and revocation
    ✔ extends share expiry and regenerates share tokens
    ✔ reports accurate storage metrics and security audit alerts
    ✔ validates document filename and sanitizes title
    ✔ denies unauthorized preview access
    ✔ Mode B: inspects a valid .dvx container file and extracts metadata
    ✔ Mode B: rejects corrupted or truncated .dvx container files
    ✔ Mode B: denies authorization if credentials or share token are missing
    ✔ Mode B: authorizes logged-in owner and streams memory-decrypted preview
    ✔ Mode B: authorizes recipient with share token and enforces automatic expiration
✔ DocVault X API Integration Tests (5712ms)
▶ DvxCryptoEngine (4 unit tests passing)
▶ DvxContainerParser (2 unit tests passing)
▶ PolicyEngine (5 unit tests passing)
```

---

## 5. Security Invariants & Disclosures

1. **Original Vault Persistence:** Original encrypted `.dvx` containers and version records in the sender's vault are never deleted or affected when temporary share links expire or are revoked.
2. **Authoritative Server Clock:** Client countdown timers are purely informational. Expiry is enforced by monotonic server time.
3. **Memory-Only Invariant:** Decrypted plaintext is never written to disk or browser IndexedDB in view-only sessions.
4. **Physical Capture Disclosure:** Ordinary web browsers run on client-controlled operating systems. While right-click copy, text selection, and browser printing are blocked by DocVault X, physical camera photography and OS-level screenshot tools (e.g. Snipping Tool) cannot be prevented by any web browser.

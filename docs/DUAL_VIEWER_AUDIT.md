# DocVault X — Dual Viewer Architecture & Security Audit

**Document Version:** 1.0.0  
**Date:** November 2026  
**Status:** Approved & Implemented  
**Scope:** Dual Document Opening Modes (Secure Browser Share Link vs. DVX Browser Viewer)

---

## 1. Executive Summary

DocVault X is designed as an enterprise-grade secure document sharing and cryptographic vault platform. This audit reviews the existing codebase, storage mechanisms, encryption format, viewer layouts, and session enforcement to support two first-class document access paradigms:

1. **Mode A: Secure Browser Share Link** — Recipients open a zero-install browser URL with authoritative server-side countdown, first-open semantics, atomic max-open limits, memory-only decrypted streams, and zero original URL exposure.
2. **Mode B: DVX Browser Viewer** — Users pick an encrypted `.dvx` binary container from local storage. The platform inspects the container, validates cryptographic signatures and policy permissions, verifies backend authorization, and streams a protected in-memory preview into the full-height canvas viewer without persisting unencrypted data to disk.

---

## 2. Existing System Architecture & Repository Audit

### 2.1 Workspace Structure
* **`packages/contracts`**: Zod validation schemas and shared TypeScript types for authentication, documents, policies, licenses, and share links.
* **`packages/crypto-core`**: Real cryptographic engine utilizing:
  * AES-256-GCM chunked AEAD (64KB chunks with unique 12-byte IVs and 16-byte GCM authentication tags).
  * 256-bit DEK generation and master KMS key wrapping via AES-KW / AES-GCM.
  * Ed25519 asymmetric signing and verification for cryptographic leases and licenses.
* **`packages/file-format`**: Binary encoder and parser for the `.dvx` format (`DVX1` magic, versioning, metadata serialization, and tamper detection).
* **`packages/policy-core`**: Canonical policy engine for monotonic time verification, lease expiration, clock rollback detection, and access limits.
* **`apps/api`**: Express + TypeScript REST API managing multi-tenant vaults, DB state (14 tables mirrored in PostgreSQL/Prisma), rate-limiting, and audit event logs.
* **`apps/web`**: React 18 + Vite + Tailwind CSS dashboard with responsive document lists, upload wizard, share management modal, and full-height PDF.js canvas viewer.

### 2.2 Existing `.dvx` Binary Format
```
+-----------------------------------------------------------------------+
| Magic (4 bytes): 'D' 'V' 'X' '1' (0x44 0x56 0x58 0x31)                |
+-----------------------------------------------------------------------+
| Version (2 bytes): 0x0001                                             |
+-----------------------------------------------------------------------+
| CipherSuite (2 bytes): 0x0001 (AES-256-GCM Chunked)                   |
+-----------------------------------------------------------------------+
| Metadata Length (4 bytes): UInt32BE                                   |
+-----------------------------------------------------------------------+
| Metadata JSON Payload (variable bytes, UTF-8):                        |
|   { documentId, mimeType, timestamp, chunkCount, ... }               |
+-----------------------------------------------------------------------+
| Encrypted Chunks Stream:                                              |
|   Chunk 0: IV (12B) + Ciphertext + Tag (16B)                          |
|   Chunk 1: IV (12B) + Ciphertext + Tag (16B)                          |
|   ...                                                                 |
+-----------------------------------------------------------------------+
```

---

## 3. Implementation Gaps & Mitigation Strategy

| Area | Prior Implementation Gap | Completed Mitigation & Design |
| :--- | :--- | :--- |
| **PDF Viewer Height** | Embedded via `<iframe src="blob:...">` which defaulted to sub-200px inline widget; flex parent lacked `min-h-0`. | Replaced with full-height [`PdfViewer.tsx`](file:///Users/mac/Desktop/Projects/DocVault%20X/apps/web/src/components/PdfViewer.tsx) using `pdfjs-dist` with Fit Width, Fit Page, Zoom, Fullscreen, and `ResizeObserver`. |
| **DVX Web Ingestion** | `.dvx` files could only be created or downloaded; no direct web UI existed to open an arbitrary `.dvx` file from disk. | Implemented Mode B (`Open DVX File` workflow), featuring container header validation, document mapping, backend grant verification, and protected streaming. |
| **Expiry Timing** | Share link expiry was calculated solely from link creation time. | Added First-Open Expiry semantics (`expiryType: 'FIRST_OPEN'`). Timer starts only when the recipient accesses the link, sealing an authoritative shared timestamp. |
| **Session Control** | Forwarded unauthenticated links could be accessed concurrently. | Added optional `singleSessionOnly: true` (returns `409 Conflict` on concurrent access) and atomic `maxOpens` counters. |
| **Vault Persistence** | Potential ambiguity over whether expired shares delete originals. | Verified and enforced: sender original documents and version records remain permanently encrypted in the vault independently of share link lifecycle. |

---

## 4. Dual Opening Mode Specifications

### Mode A: Secure Browser Share Link
* **Target Audience:** External clients, unauthenticated recipients, quick secure document reviews.
* **Zero Friction:** Zero software installation, no OTP, no password or account creation required.
* **Token Entropy:** 256-bit cryptographically secure token (`crypto.randomBytes(32).toString('base64url')`), stored solely as SHA-256 hash in database.
* **Enforcement:** Authoritative backend clock evaluation on every heartbeat (3-second intervals) and content request. Returns `410 Gone` after expiry or `403 Forbidden` after sender revocation.

### Mode B: DVX Browser Viewer
* **Target Audience:** Internal staff, enterprise partners, or recipients holding downloaded `.dvx` files.
* **Integrity Validation:** Client reads container header to verify `DVX1` magic, version compatibility, and metadata structure before server transmission.
* **Server-Mediated Decryption:** Decryption keys are NEVER exposed to the frontend. The server verifies access authorization, decrypts chunks in-memory using unwrapped DEKs, and streams pages to the protected canvas renderer.
* **Tamper Rejection:** Any truncated, modified ciphertext chunk or invalid GCM tag results in immediate rejection.

---

## 5. Security Invariants & Limitations

1. **Memory-Only Invariant:** Decrypted plaintext is never written to client disk or IndexedDB in view-only sessions. Content headers enforce `Cache-Control: no-store, no-cache, must-revalidate, private, max-age=0` and `Pragma: no-cache`.
2. **Authoritative Clock:** Client system clocks are untrusted. Expiry is strictly enforced by monotonic server time.
3. **Physical Environment Disclosure:** Ordinary web browsers run on user-controlled hardware. DocVault X blocks DOM extraction, right-click, printing, and keyboard copy shortcuts; however, external camera photography and OS-level screenshot tools (e.g. Snipping Tool) cannot be prevented by any browser software.

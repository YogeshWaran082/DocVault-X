# DocVault X — System Architecture Specification

## 1. Architectural Overview

DocVault X is an enterprise-grade document security and controlled offline-distribution platform designed to protect sensitive intellectual property, compliance records, and confidential files across untrusted and intermittently disconnected environments.

### System Components

```
+-----------------------------------------------------------------------------------+
|                                 Client Surfaces                                   |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Web App (Next.js)  |  | Desktop (Tauri/Rust) |  | Mobile / Offline PWA      |  |
|  | Admin & Sender Hub |  | Hardware Keystore    |  | IndexedDB + WebCrypto     |  |
|  +---------+----------+  +----------+-----------+  +-------------+-------------+  |
+------------|------------------------|----------------------------|----------------+
             |                        |                            |
             | HTTPS / TLS 1.3        | HTTPS / TLS 1.3            | HTTPS / TLS 1.3
             v                        v                            v
+-----------------------------------------------------------------------------------+
|                             API Gateway & Core API                                |
|                                                                                   |
|  - NestJS / Express Type-safe Routing                                             |
|  - JWT & Session Auth with MFA & Tenant Scoping (org_id enforcement)              |
|  - Rate Limiter, Schema Validator (Zod), Idempotency Guard                        |
|  - Policy Engine & Cryptographic Key Broker                                       |
+-------------------------------------+---------------------------------------------+
                                      |
       +------------------------------+------------------------------+
       |                              |                              |
       v                              v                              v
+---------------+             +---------------+             +----------------+
|  PostgreSQL   |             |  Redis Cache  |             | S3-Compatible  |
|  14 Tables    |             |  & BullMQ     |             | Object Storage |
|  Multi-tenant |             |  Workers      |             | (Encrypted)    |
+---------------+             +---------------+             +----------------+
```

## 2. Three Document Opening Modes

1. **Mode A: NORMAL_EXPORT (Unprotected Export)**
   - Plaintext binary file (PDF, DOCX, XLSX, etc.) is exported directly for opening in standard applications (Adobe Acrobat, Microsoft Office, Google Chrome).
   - **Crucial Security Disclosure**: No enforceable expiry, revocation, or copy protection is possible once exported. Prominently labeled with amber alerts before export.
2. **Mode B: SECURE_NATIVE (.dvx Container in Native Viewer)**
   - AES-256-GCM chunk-authenticated container (`.dvx`) opened exclusively via DocVault native clients (desktop/mobile).
   - Enforces cryptographic leases, hardware-backed keys (where available), tamper-resistant monotonic clock validation, dynamic watermarking, and local key zeroization upon expiry.
3. **Mode C: OFFLINE_PWA (Web Crypto in Browser Sandbox)**
   - Web-based offline client caching `.dvx` in sandboxed IndexedDB with Ephemeral WebCrypto keys.
   - Best-effort protection bounded by browser sandboxing guarantees.

## 3. Cryptographic Hierarchy and Key Lifecycle

```
Master Tenant Key (KMS / HSM)
        │
        ▼ (Wraps)
Document Encryption Key (DEK) ─── AES-256-GCM ───► File Ciphertext Chunks (64 KB)
        │
        ▼ (Wrapped per authorized device)
Device Wrapped Key (DWK) = ECDH(EphemeralPriv, DevicePubKey) + HKDF + AES-KW
```

- **DEK Generation**: 256-bit cryptographic pseudorandom key generated per document version.
- **Envelope Encryption**: DEK is stored encrypted on the server wrapped by KMS/Master Key.
- **Client Issuance**: Upon verifying grant policies, the server wraps the DEK specifically for the recipient's registered device public key.
- **Signature Engine**: Ed25519 signs policies and license tokens.

## 4. Multi-Tenant Isolation Model

Every query, mutation, storage key, and audit log is strictly partitioned by `organization_id`. Database queries strictly validate that the active authenticated session has legitimate membership in the requested organization. Cross-tenant reads and IDOR vectors are blocked at both middleware and repository layers.

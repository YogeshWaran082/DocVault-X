# DocVault X — Threat Model (STRIDE) & Security Invariants

## 1. Non-Negotiable Invariants & Limitations

1. **Physical & Host Root Control**: No software running on client hardware can prevent a user with administrative, kernel, debugger, snapshot, or physical RAM access from extracting data or circumventing local checks.
2. **Standard File Compatibility**: Plaintext PDF/Office files cannot self-destruct once exported. The UI and API must explicitly classify them as **UNPROTECTED EXPORTS**.
3. **Offline Revocation Window**: Server revocation is not instantaneous for disconnected clients; it activates once the pre-issued offline cryptographic lease expires or when the client reconnects.

## 2. STRIDE Analysis

| Threat Category | Specific Attack Vector | DocVault X Countermeasure / Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Credential theft, session hijacking, rogue client impersonation | Argon2id/bcrypt password hashing, mandatory MFA support, Ed25519 device key challenges, short-lived JWTs. |
| **Tampering** | Modifying `.dvx` container chunks, manipulating policies, altering local clocks | AES-256-GCM chunk MACs, canonical CBOR signed headers, monotonic clock tracking with high-water marks, Ed25519 signatures. |
| **Repudiation** | Denying document access or administrative privilege usage | Append-only tenant audit log table (`audit_events`), client signed access receipts (`access_events` flagged as client-reported). |
| **Information Disclosure** | Cloud storage breach, memory dumps, metadata leakage | Per-file 256-bit DEK, envelope encryption, zeroization of decryption keys in memory upon window destruction, encrypted chunk transit. |
| **Denial of Service** | Archive decompression bombs, massive file uploads, API flooding | Upload size limits, rate limiting (Redis token bucket), strict parser sandboxing, chunked streaming processing. |
| **Elevation of Privilege** | Cross-tenant IDOR, recipient privilege escalation | Strict tenant-scoped queries (`WHERE organization_id = ...`), role-based access control (RBAC), immutable grants. |

## 3. Defense-in-Depth Measures

- **Hostile Input Parsing**: File sniffers and preview renderers are run in sandboxed contexts with strictly bounded CPU and memory limits.
- **Key Hygiene**: Cryptographic keys are never emitted in plaintext logs, error stacks, or serialized REST responses.
- **Clean Disposal**: On license expiration, local client databases trigger zeroization of cached DEKs and clear decrypted memory buffers.

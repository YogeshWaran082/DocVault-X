# DocVault X — Comprehensive Test Plan

## 1. Test Levels & Strategy

1. **Unit Testing**:
   - Cryptographic routines: AEAD chunking, roundtrips, nonce uniqueness, tampering rejection.
   - Policy evaluation: Offline lease calculation, monotonic clock skew checks, role-based checks.
   - Validation: File size bounds, MIME type verification, checksum generation.

2. **Integration Testing**:
   - Multi-tenant boundary isolation: Ensure tenant A cannot view, query, or delete tenant B documents.
   - Document Ingestion: Full upload initiation, chunk upload, assembly/verification, and metadata persistence.
   - Authentication lifecycle: Registration, login, JWT validation, token refresh, and logout revocation.

3. **Security & Boundary Tests**:
   - Cross-tenant IDOR vectors on documents, grants, devices, and policies.
   - Malformed container injection: Header truncation, chunk bit-flipping, forged signatures.
   - Offline lease expiration: Clock forward jump, clock backwards rollback detection.

4. **End-to-End Tests**:
   - Web frontend flows: Login, organization selection, document upload modal, document list, policy configuration.

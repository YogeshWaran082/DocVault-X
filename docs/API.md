# DocVault X — REST API Specification v1

Base URL: `/api/v1`
Authentication: Bearer JWT or Session Cookie. Header `X-Organization-Id` for multi-tenant context.

## Authentication & Identity
- `POST /v1/auth/register`: Create user account & default tenant organization.
- `POST /v1/auth/login`: Authenticate email + password, issue JWT + refresh token.
- `POST /v1/auth/refresh`: Refresh access tokens.
- `POST /v1/auth/logout`: Revoke active session.
- `GET /v1/auth/me`: Fetch current profile, organizations, and permissions.

## Organizations & Team
- `GET /v1/organizations`: List organizations the current user belongs to.
- `POST /v1/organizations`: Create new tenant organization.
- `GET /v1/organizations/:id/members`: List organization members & roles.
- `POST /v1/organizations/:id/members`: Invite user to organization.

## Document Ingest & Management
- `POST /v1/documents/uploads/initiate`: Request upload token and signed storage parameters.
- `POST /v1/documents/uploads/complete`: Finalize uploaded document, compute SHA-256, record initial version.
- `GET /v1/documents`: List documents with tenant-scoped filtering, pagination, and status.
- `GET /v1/documents/:id`: Fetch document details, policies, and versions.
- `DELETE /v1/documents/:id`: Soft delete / schedule cryptographic destruction of document.

## Policies & Access Control
- `POST /v1/documents/:id/policies`: Create or supersede document expiry and access policy.
- `GET /v1/documents/:id/policies`: Get policy history and active version.
- `POST /v1/documents/:id/revoke`: Instantly revoke all active grants for a document.

## Grants & Devices
- `POST /v1/documents/:id/grants`: Grant recipient access with specific policy.
- `GET /v1/documents/:id/grants`: List all active grants for document.
- `DELETE /v1/grants/:id`: Revoke specific recipient grant.
- `POST /v1/devices/enroll/challenge`: Request cryptographic enrollment challenge for device.
- `POST /v1/devices/enroll/complete`: Complete enrollment with signed device public key.
- `GET /v1/devices`: List enrolled user devices.

## Licenses & Offline Leases
- `POST /v1/licenses/issue`: Issue signed offline lease token and wrapped DEK for enrolled device.
- `POST /v1/licenses/refresh`: Heartbeat to extend lease and report offline access events.
- `GET /v1/licenses/:id/status`: Check license validity.

## Downloads
- `POST /v1/documents/:id/protected-download`: Download encrypted `.dvx` container.
- `POST /v1/documents/:id/unprotected-export`: Download decrypted original binary (explicit acknowledgment required).

## Audit & Observability
- `GET /v1/documents/:id/access-events`: Access logs and offline-reported sync events.
- `GET /v1/audit`: Complete organization audit trail.
- `GET /health/live`, `/health/ready`: System liveness and dependency status.

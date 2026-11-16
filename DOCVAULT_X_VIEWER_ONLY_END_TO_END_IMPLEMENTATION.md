# DocVault X — Viewer-Only Cross-Platform Application
## End-to-End Architecture, Implementation, Security, Testing & Release Master Plan

**Version:** 1.0  
**Date:** 2026-11-16  
**Audience:** Google Antigravity Agent, engineering team, QA, DevOps  
**Scope:** Existing DocVault X website + viewer-only Windows, macOS, Android and iOS applications

> **Critical boundary:** The existing website retains the landing page, admin dashboard, sender uploads, vault administration, sharing configuration, analytics and backend management. **Native apps are viewer-only**. They must never duplicate admin or sender management functionality.
>
> **Security truth:** No software can guarantee prevention of every screenshot, screen recording, external camera capture, OS compromise or extraction of pixels already displayed. Android native secure-window controls are strong against standard capture paths; protections differ significantly across other platforms. Distinguish *enforced*, *best effort*, *unsupported*, and *untested*.

---

## 1. Product goals and acceptance criteria

### 1.1 Product vision

Build one branded **DocVault X Universal Document Viewer** experience with consistent dark navy/teal design, shared document rendering logic and native platform integrations. A receiver should be able to open a permitted local document, an encrypted `.dvx` container, or an authorized secure share link in the appropriate viewer app. For protected documents, access and expiry are enforced by the backend whenever online authorization is required.

### 1.2 In scope

- Web: preserve landing, admin dashboard, sender vault, uploads, secure share creation, existing web viewer.
- Native: viewer-only desktop (Windows/macOS) and mobile (Android/iOS).
- Documents: PDF; DOC/DOCX; XLS/XLSX/CSV; PPT/PPTX; common images; TXT/MD/JSON; authenticated `.dvx` containers. Unsupported formats fail gracefully.
- Viewer: full-height responsive rendering, zoom, fit width/page, page navigation, search when supported, fullscreen, keyboard and touch accessibility.
- Protected access: high-entropy links, revocation, time-limited sessions, maximum opens, optional first-open claim and single active session, watermark, audit trail.
- Native integrations: Open With/file associations, deep/universal links, file pickers, lifecycle masking, packaging and updates.
- Restriction policy: hide/disable save, download, export, copy and print in restricted viewer; avoid exposing original-file URLs; implement OS-specific capture mitigations.

### 1.3 Explicitly out of scope

- Admin dashboard inside native applications.
- Sender-side upload, share generation, user management or analytics inside native apps.
- Universal guaranteed screenshot or recording prevention.
- Guaranteed offline self-destruction, deletion or revocation on untrusted recipient devices.
- Claiming all arbitrary formats can be previewed without a supported adapter.

### 1.4 Definition of done

1. Existing web routes and sender workflows continue to work after changes.
2. All native apps show only viewer-related screens and have the same visual design tokens.
3. Authorized `.dvx` and secure links open correctly; unauthorized, expired and revoked access is rejected.
4. A one-minute test link expires using **server time** and cannot be reopened via refresh or a new session.
5. Protected previews do not expose unrestricted original-file URLs or persistent plaintext downloads.
6. Platform security test reports accurately classify capture protections and limitations.
7. Desktop and mobile packages are actually built and smoke-tested on the respective operating systems; unbuilt targets are marked pending.
8. CI builds, automated tests, migrations and deployment docs are available.

---

## 2. Current-state audit: mandatory first step

The agent must inspect the **actual repository**, not assume frameworks, folder paths, schemas or APIs. Identify the current frontend, backend, router, database, encryption and `.dvx` binary format, storage, share session logic, and document renderer. Record existing working behavior and gaps before editing.

**Audit outputs:**

- `docs/01_EXISTING_PROJECT_AUDIT.md`
- `docs/02_FEATURE_MATRIX.md` (implemented / partial / missing / untested)
- `docs/03_ARCHITECTURE_DECISIONS.md`
- `docs/04_MIGRATION_AND_ROLLBACK.md`

Before any folder move: create a clean version-control checkpoint, document required environment variables, run baseline build/test, and capture current routes. Do not delete or migrate live data without a verified backup and explicit approval.

---

## 3. Recommended architecture

```text
                         DOCVAULT X PRODUCT
                                  |
                 +----------------+----------------+
                 |                                 |
       EXISTING WEBSITE                   VIEWER-ONLY APPS
  Landing / Admin / Sender Vault         (no admin, no sender tools)
  Upload / Share Management                    |
  Existing Web Viewer                  +--------+--------+
                 |                     |                 |
                 |             Windows + macOS    Android + iOS
                 |               Tauri 2         Capacitor + native
                 |                     |                 |
                 +---------------------+-----------------+
                                       |
                           SHARED VIEWER PACKAGES
                  UI / file adapters / API client / types
                                       |
                              DOCVAULT X BACKEND
                    Authentication / Share authorization
                   Preview conversion / Expiry / Audit
                   Encryption / Database / Private storage
```

### 3.1 Technology choices (validate against existing code)

| Concern | Preferred approach | Important notes |
|---|---|---|
| Web UI | Reuse existing React/Next.js/TypeScript or actual stack | No forced rewrite |
| Shared design | Tailwind / current component library + tokens | Match existing UI |
| Desktop shell | Tauri 2 | Verify plugin support, target build toolchains |
| Mobile shell | Capacitor + native plugins | Android Kotlin and iOS Swift as needed |
| PDF | PDF.js | Render inside custom viewer, not unrestricted browser PDF URL |
| Office | Sandboxed server conversion to preview PDF/images | Macros disabled, resource quotas |
| Images/text | Safe in-app rendering | Sanitize text/HTML and file types |
| DVX | Reuse existing authenticated encryption format | Never invent format without audit |
| Backend | Reuse existing backend and DB | No duplicate API service |
| Storage | Private encrypted object store | No public originals |
| Test | Unit + integration + Playwright + native device tests | Capture testing must be on real OS |

### 3.2 Monorepo layout (target, not mandatory migration)

```text
DocVault-X/
├── apps/
│   ├── web/                        # EXISTING landing + admin + sender vault + web viewer
│   │   └── [existing source layout]
│   ├── viewer-desktop/             # VIEWER ONLY: Tauri, Windows/macOS
│   │   ├── src/
│   │   └── src-tauri/
│   └── viewer-mobile/              # VIEWER ONLY: Capacitor, Android/iOS
│       ├── src/
│       ├── android/
│       └── ios/
├── packages/
│   ├── design-tokens/              # Colors, type, spacing, icon conventions
│   ├── viewer-ui/                  # Viewer shell, toolbar, status, overlays
│   ├── document-engine/            # Format adapters, PDF rendering, navigation
│   ├── dvx-engine/                 # Container parser/validation interfaces
│   ├── api-client/                 # Typed backend clients and session refresh
│   ├── security-policy/            # Policy model + platform capability reporting
│   └── shared-types/               # Document, share, session, error types
├── services/
│   ├── api/                        # EXISTING backend (move only if justified)
│   └── conversion-worker/          # Isolated Office/image preview generation
├── docs/
│   ├── architecture/
│   ├── security/
│   ├── testing/
│   └── release/
└── [workspace config and existing tooling]
```

**Migration rule:** If existing website and backend are already in one working root, they may stay there initially. Add viewer packages and native shells incrementally; move the web application only when tests and import mappings are ready. Avoid premature monorepo refactoring.

---

## 4. Unified UI/UX specification

### 4.1 Brand tokens

| Token | Value |
|---|---|
| Background | `#0A1222` |
| Surface | `#17253A` |
| Accent | `#2DD4BF` |
| Primary text | `#F8FAFC` |
| Secondary text | `#A8B8CD` |
| Border | `#34455D` |
| Error | Accessible red consistent with theme |
| Font | Use existing licensed/system-safe UI font |

### 4.2 Native viewer screens ONLY

1. **Viewer Home:** Open File, Open DVX, Open Secure Link, recent local files (opt-in; avoid storing confidential filenames unnecessarily).
2. **File Picker / Import:** File type validation, file size, progress, cancel.
3. **Secure Link Entry:** Paste URL or handle native deep link; show authorization state.
4. **Protected Viewer:** File name, access status, time remaining, page count, zoom, fullscreen, watermark, privacy shield.
5. **Unrestricted Local Viewer:** Standard supported local file preview; do not falsely apply server expiry.
6. **Authorization Error:** Invalid link, expired, revoked, max opens, connection required, unsupported format.
7. **Session Expired:** Opaque document cover; no further protected page access.
8. **Viewer Settings:** Theme, accessibility, supported formats, privacy explanation; no admin controls.

### 4.3 Responsive behavior

- Desktop: compact title bar, file pane optional, document canvas centered, side thumbnails optional, keyboard shortcuts for navigation.
- Mobile: compact top bar, bottom viewer controls, pinch zoom, safe-area handling, accessible tap targets.
- Tablet: responsive two-pane layout when width permits.
- Preserve actual PDF aspect ratio and vertical scroll; avoid fixed-height strips and clipping.
- Support screen readers, keyboard focus, reduced-motion preferences and high contrast.

---

## 5. End-to-end user flows

### Flow A — Sender uses existing website

```text
Sender signs into existing website
  -> uploads document to encrypted vault
  -> system validates and stores original
  -> conversion worker creates safe preview assets
  -> sender configures expiry, max opens, watermark, restrictions
  -> server creates high-entropy share token and stores token hash
  -> sender copies secure HTTPS link or exports authorized DVX container
  -> sender can inspect activity and revoke share on WEB ONLY
```

### Flow B — Recipient opens secure link in viewer app

```text
Recipient taps https://.../share/<token>
  -> OS universal/app link opens installed DocVault X viewer if configured
  -> otherwise secure WEB viewer opens (fallback)
  -> app exchanges token for scoped viewer session
  -> backend checks token hash, expiry, revocation, max opens, policy
  -> if allowed, protected previews stream through authenticated endpoints
  -> viewer shows watermark and remaining time from server expiry
  -> every content request rechecks authorization
  -> on expiry/revocation: deny requests, mask content, show Session Expired
```

**Link forwarding caveat:** Without recipient login/OTP/identity verification, the first person possessing a link can potentially claim it. A first-open binding and one-session policy reduce casual forwarding after claim, but do not prove intended recipient identity.

### Flow C — Recipient opens `.dvx` file

```text
OS Open With DocVault X OR app file picker
  -> validate magic/version/length and parse bounded metadata
  -> verify authenticated container integrity
  -> determine required key and authorization scheme
  -> online authorization where server-managed key is required
  -> decrypt only in authorized viewer process / controlled backend
  -> render via shared document engine
  -> apply policy and expiry checks
  -> clear app-managed plaintext buffers where feasible on close/expiry
```

Do not assume a standalone `.dvx` file can be opened offline: offline access requires a separate, explicitly designed key and policy model. Offline expiry and remote revocation cannot be guaranteed against device clock manipulation, backups, copied keys or compromised endpoints.

### Flow D — Local ordinary PDF / Office document

```text
Open File -> detect type -> validate and parse safely -> render locally
```

A local unprotected document is not a server-controlled protected share. Do not claim remote expiry or guaranteed no-save restrictions for user-owned local files. Apply restriction policies only when document classification and access context justify them.

---

## 6. Document rendering engine

### 6.1 Adapter contract

Create a typed `DocumentAdapter` interface with: `canOpen`, `open`, `getMetadata`, `renderPage` or `renderViewport`, `search` when supported, `close`, and cleanup. Keep format-specific parsing separate from the shared viewer UI.

### 6.2 Format implementation

- **PDF:** PDF.js worker, lazy pages, resize observer, text search when allowed, virtualized multipage view, zoom, page navigation.
- **DOC/DOCX:** server-side isolated conversion to PDF/images for protected files; if local offline support is needed, evaluate a compatible on-device renderer and document fidelity limitations.
- **XLS/XLSX/CSV:** sandbox conversion or safe read-only grid preview; support sheet tabs and bounded row/column rendering. Never evaluate formulas/macros.
- **PPT/PPTX:** convert to slide previews; next/previous slide navigation.
- **Images:** decode safely, orientation correction, zoom/pan, avoid embedding unsafe metadata.
- **TXT/MD/JSON:** text preview with escaping, bounded file sizes, optional search; do not execute HTML or scripts.
- **DVX:** parse/authenticate container, authorize key access, delegate decrypted supported payload to adapter.
- **Unsupported:** clear error with type and support guidance, never unsafe fallback execution.

### 6.3 Conversion worker isolation

Use isolated processes/containers with no outbound network, limited CPU/RAM/time/disk, no macros, temporary encrypted/sanitized files, malware scanning as appropriate, strict MIME validation, and automatic cleanup. Document how conversions preserve or lose formatting fidelity.

---

## 7. Security architecture and policy

### 7.1 Threat model

Threats include stolen/forwarded links, brute-force token guessing, replay, concurrent access, client cache, leaked originals, malicious document parser exploits, untrusted devices, screen capture, offline clock rollback and admin credential compromise.

Security controls should target realistic risks without promising perfect DRM.

### 7.2 Share/session requirements

- Generate at least 128 bits of cryptographically secure random share-token entropy (prefer 256 bits).
- Store only a server-side hash of share tokens; do not log raw tokens.
- Use TLS/HTTPS, scoped viewer sessions and secure cookie or equivalent app token storage.
- Use server time and UTC for all expiries.
- Atomic first-open claim and max-open enforcement in database transactions.
- Support immediate revoke and optional one-active-session policy.
- Revalidate on every preview/page/chunk request, not only initial link load.
- Avoid public object URLs and unrestricted original-file response routes.
- Set no-store caching headers and disable persistent plaintext service-worker caching.
- Use rate limiting, audit events and consistent access-denied responses.

### 7.3 Strict viewer restrictions

For **restricted protected documents**:

- No Save, Save As, Download, Export or Share File UI.
- No Print or Print to PDF UI; disable app-initiated printing.
- Disable normal text selection/copy and drag-to-export in the viewer.
- Do not expose unrestricted original file downloads or raw browser-native PDF embeds.
- Prefer protected page/image rendering with short-lived authorization and watermark.
- Mask on focus loss/backgrounding where supported; require deliberate reveal after focus returns if configured.
- Avoid unnecessary persistent plaintext caches, temp files and logs.
- Show clear `Session Expired`, `Access Revoked` and `Access Restricted` states.

**Limitation:** Removing UI actions does not prevent a technically capable recipient from extracting displayed content on a device they control. A browser cannot reliably detect OS screenshot utilities or block screen recording. A visible watermark helps accountability, not prevention.

### 7.4 Platform capture capability matrix

| Platform | Screenshot | Screen recording | Practical approach |
|---|---|---|---|
| Android native | Strong for standard OS capture paths | Strong for many standard capture paths | `FLAG_SECURE` on all sensitive windows; verify on real devices |
| iOS native | No universal pre-capture screenshot prevention | Detect some capture/mirroring states and mask | Native capture-state APIs + lifecycle privacy overlay |
| Windows desktop | Partial, OS/version/capture-path dependent | Partial | Evaluate `SetWindowDisplayAffinity` and test limitations |
| macOS desktop | No universal reliable capture prevention | Limited | App lifecycle privacy masking; platform-specific documented mitigations |
| Web | Not reliably preventable | Not reliably preventable | Focus/visibility mask + watermark; no false claims |

If a document policy requires a capability the platform cannot provide, the backend may **deny viewing on that platform**. This is a product policy decision, not a guarantee against external cameras or compromised clients. Make unsupported-capability handling explicit to the sender.

### 7.5 DVX encryption

- Audit existing format before modification; preserve compatibility where safe.
- Prefer authenticated encryption such as AES-256-GCM with unique nonces per key; verify tags before using plaintext.
- Separate container encryption keys from global key-encryption/master keys.
- Never ship server master keys or reusable global secrets inside apps.
- Authenticate metadata and validate version, length and size bounds.
- Define key rotation, lost-key recovery policy, backward compatibility and secure failure paths.
- Never interpret a file extension alone as proof of a safe encrypted file.

---

## 8. Backend API and data model

**Use actual existing routes where possible; these are conceptual interfaces, not assumed implemented endpoints.**

### 8.1 Suggested API responsibilities

| Endpoint pattern | Purpose | Authorization |
|---|---|---|
| `POST /api/documents` | Sender upload | Authenticated sender, web only |
| `POST /api/documents/:id/shares` | Create protected link | Authorized sender, web only |
| `POST /api/shares/:token/session` | Exchange share token for viewer session | Share-token validation |
| `GET /api/viewer/sessions/:id/status` | Current access, expiry, capabilities | Scoped session |
| `GET /api/viewer/sessions/:id/pages/:page` | Authorized preview page | Scoped session + per-request policy |
| `POST /api/shares/:id/revoke` | Sender revoke | Authorized sender, web only |
| `POST /api/dvx/inspect` | Safe container metadata inspection | Rate-limited, no secret leakage |
| `POST /api/dvx/authorize` | Key/session authorization | Explicit authorized access grant |
| `GET /api/viewer/capabilities` | Policy/platform capability negotiation | Scoped or public safe metadata |

Do not put raw long-lived share tokens into analytics logs. Where URLs carry tokens, minimize referrer exposure, configure appropriate `Referrer-Policy`, and exchange them for scoped sessions promptly.

### 8.2 Data concepts

`documents`, `document_versions`, `encrypted_containers`, `document_previews`, `share_links`, `viewer_sessions`, `document_policies`, `access_events`, `revocation_events`, `conversion_jobs`.

Fields for share/session should cover hashed token, owner, document ID, created/expiry timestamps, first-open timestamp, max opens, opens used, claim/session binding, revoked timestamp, policy version and audit metadata. Use migrations with backward-compatible deployment order.

### 8.3 Session expiry semantics

Distinguish **expiry from creation** and **expiry after first successful open**. If a share is configured for 1 minute, its UI countdown must correspond to the authoritative server expiry; never show an unrelated 49-minute timer. Avoid treating page reload as a new open if product policy defines a single continuing session.

---

## 9. Native platform implementation

### 9.1 Windows + macOS — viewer-only Tauri

- Add `apps/viewer-desktop` with Tauri 2 integration and shared viewer UI.
- Configure OS file picker, drag/drop, `.dvx` association and appropriate PDF/Office Open With support (avoid hijacking default app unexpectedly).
- Register secure deep links with validated allowlist and safe token handling.
- Restrict app menu and application-level print/save commands for protected content.
- Use OS keychain/credential storage for scoped secrets where applicable.
- Apply platform-specific window capture mitigations with documented limits.
- Implement background mask, lock screen and recent-file privacy settings.
- Produce Windows installer and macOS app bundle, signing/notarization instructions, update strategy.
- Validate builds on real Windows and macOS systems; do not claim cross-compilation equals runtime validation.

### 9.2 Android — viewer-only Capacitor

- Add `apps/viewer-mobile` with Capacitor and Android native project.
- Integrate `ACTION_VIEW`/`ACTION_OPEN_DOCUMENT` and URI content providers correctly; do not assume unrestricted filesystem paths.
- Register supported deep links and `.dvx` MIME/extension handling.
- Apply `WindowManager.LayoutParams.FLAG_SECURE` to every sensitive Activity/window and test dialogs, multitasking thumbnails, overlays and lifecycle transitions.
- Keep plaintext out of shared external storage; use private app storage and clean up temp files.
- Add system back handling, safe areas, pinch zoom and responsive controls.
- Produce debug APK and release AAB workflow with signing instructions; do not invent signing keys.

### 9.3 iOS — viewer-only Capacitor

- Integrate document picker, supported file type declarations and Universal Links.
- Use native APIs to observe supported screen capture/mirroring states; mask content during detected capture where possible.
- Hide sensitive previews when backgrounded or in app switcher.
- Restrict in-app Save/Share/Print controls for protected content.
- Implement iPhone and iPad adaptive layouts, safe areas, orientation and accessibility.
- Generate Xcode project, entitlements and signing guidance. iOS release build/signing requires macOS/Xcode and appropriate Apple credentials.

### 9.4 Web fallback

- Keep existing secure browser viewer accessible for recipients who do not install an app.
- Explain weaker screenshot protections on web, without blocking all web access unless sender policy explicitly requires a native capability.
- Ensure public share URLs are HTTPS and point to a deployed domain, not `localhost`.

---

## 10. Phased implementation and checkpoints

### Phase 0 — Audit and baseline

**Tasks:** inspect repo, map routes and data flows, run current tests, backup/migration plan, inventory actual DVX format.  
**Exit gate:** audit + gap matrix approved; baseline builds documented.

### Phase 1 — Design system and shared viewer shell

**Tasks:** tokens, shared UI package, desktop/mobile responsive viewer shell, status/error overlays, accessibility.  
**Exit gate:** same design on 375px mobile, 768px tablet, 1440px desktop; no clipping.

### Phase 2 — Universal document engine

**Tasks:** PDF.js full-height viewer, format adapters, safe Office preview pipeline, search, zoom, pagination, error states.  
**Exit gate:** representative fixtures for every claimed format pass preview and security tests.

### Phase 3 — Secure links and DVX

**Tasks:** session API, hashed share tokens, atomic max opens, expiry, revoke, `.dvx` validation, authorization, watermark.  
**Exit gate:** one-minute expiry and unauthorized-access tests pass; originals retained.

### Phase 4 — Desktop viewer

**Tasks:** Tauri app, Open With, file picker, deep links, native capture mitigations, packaging.  
**Exit gate:** Windows and macOS smoke tests; actual installers built where toolchains available.

### Phase 5 — Android viewer

**Tasks:** Capacitor Android, native picker/deep links, `FLAG_SECURE`, lifecycle privacy, APK/AAB.  
**Exit gate:** screenshot and built-in recorder tests on physical Android devices; APK launches and opens authorized DVX/share.

### Phase 6 — iOS viewer

**Tasks:** Capacitor iOS, file types, Universal Links, capture-state masking, iPhone/iPad UI, Xcode builds.  
**Exit gate:** actual iPhone/iPad tests; limitations documented.

### Phase 7 — Hardening and QA

**Tasks:** authorization fuzzing, malformed DVX inputs, cache checks, conversion sandbox, concurrency, accessibility, performance, device matrix.  
**Exit gate:** no critical security issues; explicit residual risk report.

### Phase 8 — Deployment and release

**Tasks:** HTTPS, env/secrets, migrations, backups, CI, desktop signing, Android Play readiness, iOS App Store readiness, monitoring and rollback.  
**Exit gate:** production checklist signed off; no release claim without verified artifacts.

**Execution guidance:** Implement phase-by-phase. Each phase must include code changes, tests, evidence and a checkpoint report. Do not run a single destructive full-project rewrite.

---

## 11. Testing matrix

### 11.1 Core tests

- Existing landing page, admin login, sender upload and share generation remain functional.
- Viewer-only native apps have no admin routes, sender upload or share generation.
- PDF single/multipage, zoom, scroll, search, fit-width and fit-page.
- Word, Excel, PowerPoint, image, text and DVX sample previews.
- Corrupted/truncated/modified DVX rejection; unsupported version handling.
- Secure link opened directly in app, fallback web, refresh, expired and revoked.
- One-minute expiry using server time; first-open and creation-based variants.
- Max opens with parallel requests and race conditions.
- No unrestricted original URLs, no sensitive logs and no plaintext persistent cache.
- Watermark visibility across zoom, pages, mobile and desktop.
- Print/Save/Export/Copy UI disabled for protected documents.
- Android screenshot and recording capture tests; iOS capture-state tests; Windows/macOS capture-path tests.
- Offline/reconnect and app background/foreground handling.
- Accessibility, mobile orientation, screen reader and keyboard navigation.
- Conversion worker resource exhaustion and malicious-file inputs.

### 11.2 Required evidence

For each test record: platform, OS version, device, build version, test steps, actual result, screenshot/log evidence when safe, PASS/FAIL/NOT RUN and issue ID. Screenshot tests must be performed on actual target OS; emulators alone are insufficient for security assurance.

### 11.3 Release blockers

- Unauthorized recipient can obtain original plaintext from a public URL.
- Expired/revoked shares continue serving protected pages.
- Global DVX master keys embedded in client binaries.
- Unsupported capture capability marketed as guaranteed protection.
- Native app unexpectedly contains admin/sender management.
- Destructive database migration without tested rollback.

---

## 12. Deployment, packaging and operations

### 12.1 Infrastructure

- Production HTTPS domain with verified share/deep-link routing.
- API behind authenticated authorization controls and rate limits.
- Private encrypted object storage and controlled preview asset access.
- Database migrations, backups and restore drills.
- Isolated conversion workers with strict resource limits.
- Secret management, key rotation and audit retention policy.
- Logs/metrics/alerts for failed authorization, conversion failures and expired sessions.

### 12.2 Platform releases

| Platform | Artifact | Required release work |
|---|---|---|
| Web | Deployed HTTPS site | Domain, routing, security headers, monitoring |
| Windows | Signed installer | Windows test VM/device, code signing, updater |
| macOS | Signed/notarized app | macOS toolchain, Apple Developer credentials |
| Android | APK for testing; AAB for store | Android signing, Play Console policies |
| iOS | Signed Xcode archive / TestFlight | macOS + Xcode, Apple signing, App Store review |

Do not publish or distribute production binaries without user approval. Do not embed production credentials in app bundles.

### 12.3 Rollback

Use feature flags for native viewer launch and security policy rollout. Keep backwards-compatible API versions during transition. Take database backups before migrations and document rollback commands. Revoke compromised share sessions without deleting originals.

---

## 13. Antigravity agent operating instructions

**Paste the following into the Antigravity Agent after opening the existing DocVault X project:**

```text
You are implementing the attached DOCVAULT_X_VIEWER_ONLY_END_TO_END_IMPLEMENTATION.md.

IMPORTANT PRODUCT BOUNDARY:
- The EXISTING WEBSITE retains Landing Page, Admin Dashboard, Sender Upload, Vault Management, Share Generation and Analytics.
- Windows, macOS, Android and iOS applications are VIEWER ONLY.
- Never add an admin dashboard or sender tools to native applications.

FIRST ACTIONS:
1. Read this Markdown file completely.
2. Inspect the actual repository and report its current architecture.
3. Run baseline builds/tests; report commands and results.
4. Create docs/01_EXISTING_PROJECT_AUDIT.md, docs/02_FEATURE_MATRIX.md,
   docs/03_ARCHITECTURE_DECISIONS.md and docs/04_MIGRATION_AND_ROLLBACK.md.
5. Show the concrete folder plan mapped to existing files.
6. Preserve existing working code, encryption format, database and uploads.

EXECUTION:
- Implement phases 1–8 sequentially with checkpoints.
- Prioritize full-height PDF viewer, secure share expiry, DVX authorization,
  shared viewer UI, then native wrappers and platform security.
- Do not create fake security or mock success states.
- For every phase list modified files, tests run, passes, failures and blockers.
- If a platform build toolchain or signing credential is unavailable,
  prepare source/configuration and mark the build NOT RUN, not completed.
- Do not promise 100% screenshot or screen-recording blocking.
- Do not deploy, publish or delete production data without explicit approval.

DELIVERABLE:
Maintain docs/DOCVAULT_X_IMPLEMENTATION_PROGRESS.md and finish with
DOCVAULT_X_FINAL_VERIFICATION_REPORT.md, including real build artifacts,
platform capability matrix, known limitations and release readiness.

START NOW WITH AUDIT AND BASELINE. DO NOT REWRITE THE PROJECT.
```

---

## 14. Final acceptance checklist

- [ ] Existing website unchanged in purpose: landing + admin + sender workflows.
- [ ] Native apps contain viewer screens only.
- [ ] Shared DocVault X UI theme consistent across all platforms.
- [ ] PDF and supported Office/image/text previews tested.
- [ ] DVX file association and authorized opening tested.
- [ ] Secure share links open via native deep links and web fallback.
- [ ] Server-side expiry/revocation/max opens tested, including concurrency.
- [ ] No unrestricted original-file URL accessible to recipients.
- [ ] No Save/Download/Export/Print UI in protected viewer.
- [ ] Native capture mitigation implemented where supported and tested.
- [ ] Screenshot/recording limitations documented honestly per platform.
- [ ] Original encrypted document remains in sender vault after share expiry.
- [ ] Windows and macOS packages built/tested or explicitly pending.
- [ ] Android APK/AAB built/tested or explicitly pending.
- [ ] iOS archive/TestFlight build tested or explicitly pending.
- [ ] Security, accessibility, performance and rollback reports completed.

---

## 15. Immediate next steps for the project owner

1. Open the **existing** DocVault X project in Google Antigravity.
2. Add this Markdown file to the repository root (or `docs/`).
3. Paste the Agent instructions from section 13.
4. Review the initial audit and migration plan before permitting large folder moves.
5. Complete the web viewer + secure authorization foundation before native packaging.
6. Test Android capture protection on a physical device; test each desktop/iOS target separately.
7. Only enable public download buttons on the landing page after the relevant app build exists and is verified.

**Product summary:** One website for administration and sharing; four native viewer-only applications; one shared design and document engine; one secure backend; platform-specific privacy controls with honest limitations.

# DocVault X — Feature Support Matrix
**Master Plan Version:** 1.0  
**Updated:** 2026-11-16  

Status Definitions:
- **IMPLEMENTED:** Fully coded, automated tests passing, integrated into active codebase.
- **PARTIAL:** Foundation exists in core/api/web, requires native shell wrapper or conversion adapter.
- **MISSING:** Not yet instantiated in codebase; scheduled in execution phases.
- **UNTESTED:** Code present, requires target OS hardware / signing validation.

---

## 1. Web Platform (Existing Website)

| Component / Feature | Scope | Status | Notes |
|---|---|---|---|
| Apple Dark Landing Page | Web Public | **IMPLEMENTED** | True black `#000000`, Cupertino pills, macOS controls, responsive layout |
| Download App CTAs | Web Public | **IMPLEMENTED** | All action buttons route to `#downloads` section; in-browser modal disabled |
| Discrete Secret Admin Gate | Web Public | **IMPLEMENTED** | 3 rapid clicks on footer Facebook icon navigates to admin auth |
| Admin Authentication | Web Sender | **IMPLEMENTED** | Password hash verification via bcrypt, JWT issuance, profile validation |
| Sender Vault & Uploads | Web Sender | **IMPLEMENTED** | Multi-tenant isolation, encrypted storage, metadata management |
| Share Link Generation | Web Sender | **IMPLEMENTED** | 128+ bit tokens, server-side expiry, max opens, watermark settings |
| Instant Share Revocation | Web Sender | **IMPLEMENTED** | Sender can invalidate active links in real-time |
| Web Document Viewer (Fallback) | Web Receiver | **IMPLEMENTED** | PDF.js viewer with dynamic forensic watermark and anti-print CSS |
| Server-Authoritative Expiry | Web Receiver | **IMPLEMENTED** | Verified by automated tests; streams 403 on expiry |
| Atomic Max Open Limits | Web Receiver | **IMPLEMENTED** | Race-condition proof database transaction counter |
| Single Active Session Guard | Web Receiver | **IMPLEMENTED** | Blocks concurrent or forwarded link viewing |

---

## 2. Universal Document Engine & Format Support

| Format / Container | Viewing Method | Status | Notes |
|---|---|---|---|
| PDF (.pdf) | PDF.js memory stream | **IMPLEMENTED** | Full-height canvas, zoom (75%-220%), multi-page pagination |
| DVX (.dvx) | Authenticated decryption | **IMPLEMENTED** | AES-256-GCM 64KB chunk decryption, Ed25519 signature verification |
| Images (.png, .jpg, .webp) | Safe DOM/Canvas renderer | **PARTIAL** | Web client displays images; shared adapter integration in Phase 2 |
| Plain Text & Markdown (.txt, .md) | Sanitized text viewport | **PARTIAL** | Basic rendering ready; bounded row virtualization in Phase 2 |
| Microsoft Word (.docx, .doc) | Server preview pipeline | **PARTIAL** | Serverless conversion worker scheduled in Phase 2 |
| Microsoft Excel (.xlsx, .csv) | Safe read-only grid / PDF | **PARTIAL** | Read-only preview pipeline scheduled in Phase 2 |
| Microsoft PowerPoint (.pptx) | Slide preview conversion | **PARTIAL** | Sandboxed slide conversion pipeline scheduled in Phase 2 |

---

## 3. Native Viewer-Only Applications (Windows, macOS, Android, iOS)

| Target Platform | Core Technology | Status | Platform Security Capabilities & Truth |
|---|---|---|---|
| **Windows Desktop App** | Tauri 2 (Rust + Web) | **MISSING** (Phase 4) | `SetWindowDisplayAffinity(WDA_MONITOR)` partial shield; no admin/sender tools |
| **macOS Desktop App** | Tauri 2 (Rust + Web) | **MISSING** (Phase 4) | Window defocus blur; app switcher masking; no admin/sender tools |
| **Android Mobile App** | Capacitor + Kotlin | **MISSING** (Phase 5) | `FLAG_SECURE` hardware window shield; screenshot/recording blocked on OS |
| **iOS Mobile App** | Capacitor + Swift | **MISSING** (Phase 6) | `UIScreen.capturedDidChangeNotification` observation + app switcher privacy |

---

## 4. Security & Protection Capabilities

| Security Mechanism | Platform | Status | Implementation Truth |
|---|---|---|---|
| Dynamic Forensic Watermark | All platforms | **IMPLEMENTED** | Email, IP, and timestamp tiled across canvas at 22-degree angle |
| Anti-Print CSS & Menu Disable | Web & Native | **IMPLEMENTED** | `@media print { display: none }`, context menu and shortcuts disabled |
| Copy / Text Selection Blocker | Web & Native | **IMPLEMENTED** | `user-select: none`, drag-drop export disabled |
| No Save / No Export UI | Native Viewers | **MISSING** (Phase 1) | Native viewer shells will contain no download or save-as buttons |
| Memory-Only Decryption | All platforms | **IMPLEMENTED** | Plaintext never written to unencrypted disk cache |
| Server-Side Expiry Enforcement | All platforms | **IMPLEMENTED** | Backend cuts off data chunks immediately upon timestamp expiry |
| OS Screenshot Block (Android) | Android | **MISSING** (Phase 5) | Enforced via `WindowManager.LayoutParams.FLAG_SECURE` |
| OS Screenshot Shield (Windows) | Windows | **MISSING** (Phase 4) | Best effort via display affinity APIs |
| App Switcher Privacy Blur | Mobile & Desktop | **PARTIAL** | Web uses window blur; native hooks scheduled in Phase 4-6 |

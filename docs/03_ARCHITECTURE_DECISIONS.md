# DocVault X — Architecture Decision Records (ADRs)
**Document Version:** 1.0  
**Date:** 2026-11-16  

---

## ADR-01: Preservation of Existing Working Monorepo

- **Context:** The repository is already structured as a working pnpm monorepo with `apps/web`, `apps/api`, and `@docvault/*` shared packages (`crypto-core`, `policy-core`, `file-format`, `contracts`, `ui`).
- **Decision:** Do NOT rewrite or disrupt the existing repository structure. Build incrementally by introducing shared viewer packages (`packages/viewer-ui`, `packages/document-engine`) and native shells (`apps/viewer-desktop`, `apps/viewer-mobile`) alongside existing applications.
- **Consequences:** Zero regression risk for the active live website (`https://docvault-x.vercel.app/`), zero disruption to existing database schemas and encryption logic.

---

## ADR-02: Strict Viewer-Only Boundary for Native Applications

- **Context:** Senders upload confidential documents, manage tenant vaults, create links, and view audit analytics on the web. Receivers need a lightweight, dedicated, sandboxed viewer for opening `.dvx` containers and secure share links.
- **Decision:** All native applications (Windows, macOS, Android, iOS) are strictly **Viewer-Only**. They must NEVER include:
  1. Admin dashboard or admin authentication routes.
  2. Document upload or sender vault management.
  3. Share link generation, tenant user administration, or billing.
- **Consequences:** Eliminates attack surfaces on untrusted recipient devices, reduces native bundle size, and prevents credential harvesting.

---

## ADR-03: Shared Document Engine & Format Adapters

- **Context:** Both the existing web fallback viewer and the 4 native apps need identical rendering behavior, watermark appearance, and zoom/scroll physics.
- **Decision:** Extract document rendering logic into a shared package (`@docvault/document-engine`) with a typed `DocumentAdapter` contract (`canOpen`, `open`, `getMetadata`, `renderPage`, `renderViewport`, `search`, `close`).
- **Consequences:** Bug fixes and performance improvements in rendering or watermarking automatically benefit all 5 targets (Web, Windows, macOS, Android, iOS).

---

## ADR-04: Desktop (Tauri 2) and Mobile (Capacitor) Shell Selection

- **Context:** Desktop requires high-performance native windowing, low memory overhead, and platform security flags without the massive resource bloat of Electron. Mobile requires standard Android/iOS platform bindings (`FLAG_SECURE`, Universal Links).
- **Decision:**
  - **Desktop:** Tauri 2 (Rust + native webview). Native memory usage under 40MB, built-in file associations, deep linking, and C-interop for Windows `SetWindowDisplayAffinity`.
  - **Mobile:** Capacitor 6+ with custom native Kotlin/Swift plugins for hardware window security.
- **Consequences:** Keeps shared web/React document engine reusable while accessing platform-native security APIs.

---

## ADR-05: Realistic Security Posture & Honest Platform Capabilities

- **Context:** Commercial DRM solutions often claim "100% screenshot blocking" which is mathematically impossible when untrusted users control operating system kernels, virtual machines, or external analog cameras.
- **Decision:** Clearly classify and enforce platform capabilities:
  - **Enforced:** Android `FLAG_SECURE` blocks standard system screenshots, recording, and multitasking thumbnails.
  - **Best Effort:** Windows display affinity masks window from standard GDI/DWM capture paths; iOS observes screen recording events; desktop blurs canvas on window defocus.
  - **Accountability Shield:** Dynamic forensic watermarking (user email, IP, timestamp) permanently visible across all viewports to deter external camera capture.
- **Consequences:** Honest security model that protects customer data without making false cryptographic guarantees.

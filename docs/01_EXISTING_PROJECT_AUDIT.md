# DocVault X — Existing Project Audit
**Audit Date:** 2026-11-16  
**Auditor:** Google Antigravity Agent  
**Repository Path:** `/Users/mac/Desktop/Dev Projects/DocVault X` & `/Users/mac/Desktop/Projects/DocVault X`  
**Git Remote:** `https://github.com/YogeshWaran082/DocVault-X.git` (branch: `main`)

---

## 1. Executive Summary

A comprehensive repository inspection and baseline build/test audit was performed on the active DocVault X codebase. The project is an operational pnpm monorepo containing a high-security document sharing platform with authenticated encryption, forensic watermarking, dual-viewer architecture (Mode A & Mode B), and server-enforced access policies.

All 7 workspace packages and applications build with **zero TypeScript errors**, and all 37 automated tests pass with **100% success rate**.

---

## 2. Monorepo Structure & Package Map

```
DocVault-X/
├── apps/
│   ├── web/                    # React 18 + Vite + Tailwind frontend (Landing, Admin, Vault, Viewer)
│   └── api/                    # Express.js + TypeScript backend with multi-tenant crypto & session management
├── packages/
│   ├── contracts/              # Shared TypeScript interfaces (Document, Policy, DVX, User, ShareSession)
│   ├── crypto-core/            # AES-256-GCM chunking (64KB), HKDF-SHA256, Ed25519 signing
│   ├── file-format/            # DVX1 binary container parser/serializer (CBOR header + AEAD chunks)
│   ├── policy-core/            # Policy verification, lease evaluation, clock rollback detection
│   └── ui/                     # Shared UI components and layout primitives
├── api/
│   └── index.js                # Bundled CJS serverless entry for Vercel deployment
├── docs/                       # Architecture, security, schema, and audit documentation
├── DOCVAULT_X_VIEWER_ONLY_END_TO_END_IMPLEMENTATION.md # Master execution specification
├── package.json                # Workspace scripts (build, test, lint, bundle:api)
└── pnpm-workspace.yaml         # Workspace inclusion: apps/*, packages/*
```

---

## 3. Technology Stack & Component Inventory

### 3.1 Frontend (`apps/web`)
- **Framework:** React 18.3.1, TypeScript 5.4.5, Vite 5.4.21
- **Styling:** Tailwind CSS 3.4.3 with custom Apple dark tokens (`#000000`, `#161617`, `#1d1d1f`, `#0071e3`, `#2997ff`)
- **Icons:** Lucide React (`lucide-react@0.378.0`)
- **PDF Engine:** `pdfjs-dist@4.10.38` with web worker integration
- **Routes & Views:**
  - `LandingPage.tsx`: Apple-themed corporate landing with macOS window chrome, OpenAI/StripesShop preview, download-only CTAs, and invisible 3-click Facebook admin gate.
  - `AuthScreen.tsx`: Discrete Admin Authentication (Email & Password)
  - `Navbar.tsx` & `App.tsx`: Sender document management vault, upload modal, share link modal, and live document viewer with dynamic forensic watermarking.

### 3.2 Backend (`apps/api`)
- **Runtime:** Node.js (v20+ target), Express 4.19.2, TypeScript
- **Security & Crypto:** Web Crypto API / Node.js `crypto` module, `bcryptjs`, `jsonwebtoken`
- **Validation:** Zod 3.23.8
- **File Ingestion:** Multer (memory/disk buffer quarantine)
- **Deployment Bridge:** `serverless.ts` bundled via `esbuild` to `api/index.js` for zero-cold-start Vercel serverless execution.
- **Routes Active:**
  - `/api/auth/*`: Registration, login, profile validation (`/me`)
  - `/api/documents/*`: Encrypted document upload, metadata listing, tenant isolation
  - `/api/shares/*`: High-entropy link creation (128+ bit tokens), server-side expiry, instant revocation
  - `/api/viewer/*`: Scoped session token exchange, chunked memory preview streaming, watermark metadata
  - `/api/dvx/*`: Container validation, CBOR header inspection, key authorization
  - `/api/audit/*`: Security alerts, unauthorized attempt logging, access events

### 3.3 Core Cryptographic System (`packages/crypto-core`)
- **Cipher:** Authenticated AES-256-GCM operating over 64KB discrete chunks.
- **Key Derivation:** HKDF-SHA256 with unique cryptographic salt per document.
- **Digital Signatures:** Ed25519 keypairs for policy leases, tamper detection, and offline licenses.
- **Integrity Guarantee:** Any bit flipped or truncated in a chunk causes immediate authentication tag rejection before plaintext memory allocation.

### 3.4 Binary Container Format (`packages/file-format`)
- **Magic Bytes:** `DVX1` (0x44 0x56 0x58 0x31)
- **Header Structure:** CBOR-encoded header containing format version, cipher metadata, chunk sizes, and encrypted DEK (Data Encryption Key).
- **Payload:** Sequential 64KB AEAD blocks followed by 16-byte authentication tags.

---

## 4. Baseline Build & Test Execution Results

### 4.1 Build Verification (`pnpm -r run build`)
```
Scope: 7 of 8 workspace projects
packages/contracts build: Done in 558ms
packages/ui build: Done in 1.8s
packages/crypto-core build: Done in 1.5s
packages/policy-core build: Done in 1.7s
packages/file-format build: Done in 1.0s
apps/api build: Done in 3.0s
apps/web build: Done in 3.24s (dist/assets/index.js 716.86 kB, dist/assets/index.css 59.56 kB)
Status: PASSED (0 ERRORS across all 7 packages)
```

### 4.2 Automated Test Verification (`pnpm -r run test`)
```
Scope: 7 of 8 workspace projects
packages/crypto-core: 4 passed, 0 failed (102ms)
packages/policy-core: 5 passed, 0 failed (77ms)
packages/file-format: 2 passed, 0 failed (88ms)
apps/api: 26 passed, 0 failed (5308ms)
Total Tests: 37 passed, 0 failed, 0 skipped
Status: 100% PASS
```

---

## 5. Critical Findings & Boundary Enforcement

1. **Website vs Viewer Separation:**
   - The current `apps/web` contains the full web ecosystem (Landing, Admin Auth, Sender Vault, Share Generation, and Web Viewer).
   - Under the master implementation plan, **native applications (Windows, macOS, Android, iOS) must strictly be Viewer-Only**. Native apps will never bundle or expose admin or sender features.
2. **Security Truth & OS Restrictions:**
   - Android: `FLAG_SECURE` provides strong hardware-enforced protection against OS screenshots and screen recording.
   - iOS: Native capture-state observation and app-switcher privacy masking are supported; universal pre-capture screenshot blocking is unavailable in iOS SDK.
   - Windows: `SetWindowDisplayAffinity(WDA_MONITOR)` provides partial capture shielding.
   - macOS: Window capture shielding is limited; focus loss and window defocus blurring provide effective privacy protection.
   - Web: Dynamic forensic watermarking and anti-print CSS shields provide accountability; absolute capture prevention is mathematically impossible in a standard browser.
3. **Server-Enforced Expiry:**
   - All protected link countdowns and session closures are authoritative on the server. When duration passes, API preview streams return HTTP 403 `EXPIRED`.

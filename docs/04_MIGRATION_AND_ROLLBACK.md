# DocVault X — Migration, Safety & Rollback Plan
**Document Version:** 1.0  
**Date:** 2026-11-16  

---

## 1. Version Control Checkpoints

Before implementing any new native viewer packages or extracting shared components:
1. Ensure the working tree is clean on `main` branch.
2. Tag the current production release baseline:
   ```bash
   git tag -a v1.0.0-baseline -m "Production baseline with Apple dark theme landing and verified 37 tests passing"
   ```
3. Feature developments must take place on dedicated branches (e.g., `feature/viewer-packages`, `feature/desktop-tauri`, `feature/mobile-capacitor`) and merge only after 100% build and test pass.

---

## 2. Environment Variables & Secret Safety

The following environment variables are maintained in `.env` (never committed to Git):
```bash
# Backend Security Secrets
JWT_SECRET=production_high_entropy_jwt_secret_min_32_chars
MASTER_KEY_SEED=cryptographically_random_256_bit_hex_seed

# Service Ports & URLs
PORT=4000
FRONTEND_URL=https://docvault-x.vercel.app

# Storage Backend
STORAGE_DRIVER=local # or 's3' for production private bucket
LOCAL_STORAGE_PATH=./data/vault_storage
```
**Safety Invariant:** Client applications and native installers must NEVER embed or pack `MASTER_KEY_SEED` or database credentials.

---

## 3. Incremental Package Extraction Strategy

To guarantee zero downtime and prevent import breakage:
1. **Step 1:** Create new shared packages (`packages/viewer-ui`, `packages/document-engine`) without deleting existing code in `apps/web`.
2. **Step 2:** Write unit tests for the extracted packages and verify via `pnpm build && pnpm test`.
3. **Step 3:** Switch `apps/web` imports to consume the new shared packages. Verify that `apps/web` builds and functions identically.
4. **Step 4:** Consume the same shared packages in `apps/viewer-desktop` and `apps/viewer-mobile`.

---

## 4. Rollback Procedure

If any regression occurs during deployment:
1. **Web Frontend Rollback:**
   ```bash
   git checkout main
   git revert HEAD
   git push origin main # Triggers immediate Vercel re-deployment of previous build
   ```
2. **Database Rollback:**
   - Active database uses additive schema changes only. Old columns are deprecated rather than deleted immediately to maintain backward compatibility with running instances.
3. **Emergency Share Revocation:**
   - In case a share token is compromised, invoke `/api/shares/:id/revoke` to terminate active sessions immediately without deleting the original encrypted file in the sender's vault.

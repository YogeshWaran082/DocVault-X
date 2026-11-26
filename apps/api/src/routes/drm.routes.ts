import { Router, Request, Response } from 'express';
import * as crypto from 'node:crypto';
import { db } from '../storage/db.js';
import { vault } from '../storage/vault.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { PolicyEngine } from '@docvault/policy-core';
import { ValidateLicenseRequestSchema } from '@docvault/contracts';

export const drmRouter = Router();

/**
 * 1. POST /drm/open
 * Atomically opens a protected document via share token or resumes an active session.
 * Prevents concurrent opens from bypassing maximum open limits.
 * Validates:
 *   - Share token authenticity
 *   - Server-enforced expiry timestamp
 *   - Revocation status (document & share)
 *   - Maximum allowed successful opens
 *   - Single active session constraint
 * Returns authorized viewer session credentials (sessionId + 256-bit sessionToken).
 */
drmRouter.post('/open', (req: Request, res: Response) => {
  const token = req.body?.token || req.query['token'];
  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      error: 'Unable to Open Document',
      reason: 'Invalid or Unauthorized Link',
      code: 'MISSING_TOKEN'
    });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
  const userAgent = req.headers['user-agent'] || null;

  const resumeSessionToken = (req.headers['x-session-token'] as string | undefined) || req.body?.sessionToken;

  const result = db.atomicallyOpenShare(tokenHash, {
    ipHash,
    userAgent,
    resumeSessionToken
  });

  if (result.outcome === 'DENIED') {
    if (result.reason === 'EXPIRED') {
      return res.status(410).json({
        error: 'Unable to Open Document',
        reason: 'Document Expired',
        code: 'EXPIRED',
        expiredAt: result.share?.expiresAt
      });
    }

    if (result.reason === 'MAX_OPENS_REACHED') {
      return res.status(403).json({
        error: 'Unable to Open Document',
        reason: 'Maximum Open Count Reached',
        code: 'MAX_OPENS_REACHED',
        maxOpens: result.share?.maxOpens,
        openCount: result.share?.openCount
      });
    }

    if (result.reason === 'ACCESS_REVOKED') {
      return res.status(403).json({
        error: 'Unable to Open Document',
        reason: 'Access Revoked',
        code: 'ACCESS_REVOKED'
      });
    }

    if (result.reason === 'SINGLE_SESSION_CONFLICT') {
      return res.status(409).json({
        error: 'Unable to Open Document',
        reason: 'Single-session policy active: This document is already open in another active browser session or was forwarded. Concurrent viewing is restricted.',
        code: 'SINGLE_SESSION_CONFLICT'
      });
    }

    return res.status(404).json({
      error: 'Unable to Open Document',
      reason: 'Invalid or Unauthorized Link',
      code: 'INVALID_LINK'
    });
  }

  const { session, rawSessionToken, share, document: doc } = result;
  const isResumed = result.outcome === 'RESUMED';

  if (!isResumed) {
    db.recordAccessEvent({
      organizationId: share!.organizationId,
      documentId: doc!.id,
      userId: null,
      deviceId: null,
      eventType: 'drm_session_opened',
      offlineReported: false,
      metadataRedacted: JSON.stringify({
        shareId: share!.id,
        ipHash,
        openCount: share!.openCount,
        maxOpens: share!.maxOpens
      })
    });
  }

  const now = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((new Date(session!.expiresAt).getTime() - now) / 1000));
  const remainingOpens = share!.maxOpens !== null ? Math.max(0, share!.maxOpens - share!.openCount) : null;

  return res.status(isResumed ? 200 : 201).json({
    sessionId: session!.id,
    sessionToken: rawSessionToken,
    isResumed,
    documentTitle: doc!.title,
    mimeType: doc!.mimeDetected,
    expiresAt: session!.expiresAt,
    remainingSeconds,
    openCount: share!.openCount,
    maxOpens: share!.maxOpens,
    remainingOpens,
    watermarkTemplate: share!.watermarkTemplate,
    allowDownload: false,
    singleSessionOnly: share!.singleSessionOnly
  });
});

/**
 * 2. GET /drm/sessions/:id/validate
 * Validates an authorized viewer session.
 * Used for viewer heartbeats, re-authentications, and lease checks.
 */
drmRouter.get('/sessions/:id/validate', (req: Request, res: Response) => {
  const sessionId = req.params['id']!;
  const sessionToken = (req.headers['x-session-token'] as string | undefined) || (req.query['token'] as string | undefined);

  const validation = db.validateViewerSessionDetailed(sessionId, sessionToken);

  if (!validation.valid) {
    if (validation.reason === 'EXPIRED') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(410).json({
        error: 'Unable to Open Document',
        reason: 'Document Expired',
        code: 'EXPIRED',
        expiredAt: validation.session?.expiresAt
      });
    }

    if (validation.reason === 'ACCESS_REVOKED') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(403).json({
        error: 'Unable to Open Document',
        reason: 'Access Revoked',
        code: 'ACCESS_REVOKED'
      });
    }

    if (validation.reason === 'INVALID_TOKEN') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(403).json({
        error: 'Unable to Open Document',
        reason: 'Invalid or Unauthorized Link',
        code: 'INVALID_TOKEN'
      });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(404).json({
      error: 'Unable to Open Document',
      reason: 'Invalid or Unauthorized Link',
      code: 'INVALID_LINK'
    });
  }

  const { session, share } = validation;
  db.touchAccessSession(session!.id);

  const now = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((new Date(session!.expiresAt).getTime() - now) / 1000));
  const remainingOpens = share && share.maxOpens !== null ? Math.max(0, share.maxOpens - share.openCount) : null;

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.json({
    active: true,
    sessionId: session!.id,
    expiresAt: session!.expiresAt,
    remainingSeconds,
    openCount: share ? share.openCount : 1,
    maxOpens: share ? share.maxOpens : null,
    remainingOpens,
    serverTimeUtc: new Date().toISOString()
  });
});

/**
 * 3. GET /drm/sessions/:id/content
 * Delivers protected content ONLY to verified, active, unexpired viewer sessions.
 * Never exposes unrestricted original PDF URLs.
 * Sets strict HTTP no-store caching headers.
 */
drmRouter.get('/sessions/:id/content', (req: Request, res: Response) => {
  const sessionId = req.params['id']!;
  const sessionToken = (req.headers['x-session-token'] as string | undefined) || (req.query['token'] as string | undefined);

  const validation = db.validateViewerSessionDetailed(sessionId, sessionToken);

  if (!validation.valid) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (validation.reason === 'EXPIRED') {
      return res.status(410).json({
        error: 'Unable to Open Document',
        reason: 'Document Expired',
        code: 'EXPIRED'
      });
    }
    if (validation.reason === 'ACCESS_REVOKED') {
      return res.status(403).json({
        error: 'Unable to Open Document',
        reason: 'Access Revoked',
        code: 'ACCESS_REVOKED'
      });
    }
    return res.status(403).json({
      error: 'Unable to Open Document',
      reason: 'Invalid or Unauthorized Link',
      code: 'INVALID_SESSION'
    });
  }

  const { session, document: targetDoc } = validation;

  const versions = db.findVersionsByDocument(targetDoc!.id);
  const latestVersion = versions[versions.length - 1];
  if (!latestVersion) {
    return res.status(404).json({
      error: 'Unable to Open Document',
      reason: 'Invalid or Unauthorized Link',
      code: 'MISSING_PAYLOAD'
    });
  }

  // Decrypt on-the-fly in server RAM
  const plaintext = vault.getDecryptedOriginal(latestVersion.objectKey, latestVersion.wrappedDekRef);

  db.recordAccessEvent({
    organizationId: targetDoc!.organizationId,
    documentId: targetDoc!.id,
    userId: null,
    deviceId: null,
    eventType: 'drm_content_delivered',
    offlineReported: false,
    metadataRedacted: JSON.stringify({ sessionId: session!.id })
  });

  // Strict anti-caching headers: prevents browser disk/cache preservation
  res.setHeader('Content-Type', targetDoc!.mimeDetected || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${targetDoc!.title}"`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  return res.send(plaintext);
});

/**
 * 4. POST /drm/shares/:id/revoke
 * Instantly revokes document share access and terminates all active viewer sessions.
 */
drmRouter.post('/shares/:id/revoke', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const share = db.findShareLinkById(req.params['id']!);
  if (!share || share.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: 'Share link not found' });
  }

  db.revokeShareLink(share.id);

  db.recordAuditEvent({
    organizationId: req.user!.organizationId,
    actorUserId: req.user!.id,
    action: 'SHARE_LINK_REVOKED',
    targetType: 'share_link',
    targetId: share.id,
    ipHash: null,
    detailsRedacted: null
  });

  return res.json({
    success: true,
    message: 'Share link and all active viewer sessions revoked'
  });
});

/**
 * 5. GET /drm/shares/:id/stats
 * Retrieves real-time DRM access statistics for an individual share link.
 */
drmRouter.get('/shares/:id/stats', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const share = db.findShareLinkById(req.params['id']!);
  if (!share || share.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: 'Share link not found' });
  }

  const stats = db.getShareStats(share.id);
  return res.json({ stats });
});

/**
 * 6. POST /drm/licenses/validate
 * Cross-platform license validation interface for future native DocVault X viewers:
 *   - Android DocVault X Viewer
 *   - iOS DocVault X Viewer
 *   - Windows DocVault X Viewer
 *   - macOS DocVault X Viewer
 * Note: Arbitrary third-party PDF readers (e.g. generic Acrobat) do not enforce these DRM policies.
 */
drmRouter.post('/licenses/validate', (req: Request, res: Response) => {
  const parse = ValidateLicenseRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  const { licenseJti, deviceId, currentClientTimeUtc } = parse.data;

  const license = db.findLicenseByJti(licenseJti);
  if (!license) {
    return res.status(404).json({
      isValid: false,
      reason: 'License not found',
      isExpired: false,
      isRevoked: false
    });
  }

  if (deviceId && license.deviceId !== deviceId) {
    return res.status(403).json({
      isValid: false,
      reason: 'Device ID mismatch: License is bound to another enrolled hardware device',
      isExpired: false,
      isRevoked: false
    });
  }

  const grant = db.findGrantById(license.grantId);
  const isRevoked = Boolean(license.revokedAt) || (grant ? grant.status === 'revoked' : false);

  const clientTime = currentClientTimeUtc ? new Date(currentClientTimeUtc) : new Date();
  const evaluation = PolicyEngine.evaluate({
    currentTimeUtc: clientTime,
    licenseNotBeforeUtc: new Date(license.notBefore),
    licenseLeaseExpiresUtc: new Date(license.leaseExpiresAt),
    documentAbsoluteExpiryUtc: new Date(license.expiresAt),
    currentOpenCount: 1,
    maxOpens: null,
    isRevoked
  });

  return res.json({
    isValid: evaluation.isPermitted,
    reason: evaluation.reason,
    isExpired: !evaluation.isPermitted && evaluation.reason?.includes('EXPIRED') || false,
    isRevoked,
    remainingSeconds: evaluation.remainingLeaseSeconds,
    effectiveDeadlineUtc: evaluation.effectiveDeadlineUtc?.toISOString()
  });
});

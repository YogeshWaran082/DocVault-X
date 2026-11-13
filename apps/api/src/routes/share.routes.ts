import { Router, Request, Response } from 'express';
import * as crypto from 'node:crypto';
import { db } from '../storage/db.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

export const shareRouter = Router();

/**
 * 1. POST /documents/:id/shares: Create an expiring share link (Sender)
 */
export const documentShareRouter = Router();
documentShareRouter.use(authenticate);

documentShareRouter.post(
  '/:id/shares',
  requireRole(['owner', 'admin', 'sender']),
  (req: AuthenticatedRequest, res: Response) => {
    const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const schema = z.object({
      expirySeconds: z.number().int().min(1).max(60 * 60 * 24 * 365).default(60), // default 1 minute (60s)
      expiryType: z.enum(['FIRST_OPEN', 'ABSOLUTE']).default('FIRST_OPEN'),
      maxOpens: z.number().int().positive().nullable().optional(),
      watermarkTemplate: z.string().max(255).nullable().optional(),
      allowDownload: z.boolean().default(false),
      singleSessionOnly: z.boolean().default(false),
      alertOnSuspiciousAccess: z.boolean().default(true)
    });

    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
    }

    const now = new Date();
    // For ABSOLUTE, timer starts immediately. For FIRST_OPEN, timer will start upon first receiver open.
    const expiresAt = parse.data.expiryType === 'ABSOLUTE'
      ? new Date(now.getTime() + parse.data.expirySeconds * 1000).toISOString()
      : new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(); // Standby pending first open

    // High entropy random token (32 bytes = 256 bits of entropy)
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const share = db.createShareLink({
      organizationId: req.user!.organizationId,
      documentId: doc.id,
      tokenHash,
      rawToken,
      expiryType: parse.data.expiryType,
      durationSeconds: parse.data.expirySeconds,
      expiresAt,
      maxOpens: parse.data.maxOpens || null,
      watermarkTemplate: parse.data.watermarkTemplate || null,
      allowDownload: parse.data.allowDownload,
      singleSessionOnly: parse.data.singleSessionOnly,
      alertOnSuspiciousAccess: parse.data.alertOnSuspiciousAccess
    });

    db.recordAuditEvent({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.id,
      action: 'SHARE_LINK_CREATED',
      targetType: 'share_link',
      targetId: share.id,
      ipHash: null,
      detailsRedacted: JSON.stringify({
        expiresAt: share.expiresAt,
        expiryType: share.expiryType,
        durationSeconds: share.durationSeconds,
        maxOpens: share.maxOpens,
        expirySeconds: parse.data.expirySeconds,
        singleSessionOnly: share.singleSessionOnly
      })
    });

    return res.status(201).json({
      shareId: share.id,
      token: rawToken,
      expiresAt: share.expiresAt,
      expiryType: share.expiryType,
      durationSeconds: share.durationSeconds,
      firstOpenedAt: share.firstOpenedAt,
      maxOpens: share.maxOpens,
      openCount: share.openCount,
      singleSessionOnly: share.singleSessionOnly
    });
  }
);

documentShareRouter.get('/:id/shares', (req: AuthenticatedRequest, res: Response) => {
  const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const shares = db.listShareLinksByDocument(doc.id);
  return res.json({ shares });
});

/**
 * 2. POST /shares/:id/revoke: Sender revokes active share link
 */
shareRouter.post('/:id/revoke', authenticate, (req: AuthenticatedRequest, res: Response) => {
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

  return res.json({ success: true, message: 'Share link and all active viewer sessions revoked' });
});

/**
 * 2b. POST /shares/:id/extend: Sender extends expiry of an active or expired link
 */
shareRouter.post('/:id/extend', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    additionalSeconds: z.number().int().min(1).max(60 * 60 * 24 * 365).default(1800) // default 30 mins
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  const share = db.findShareLinkById(req.params['id']!);
  if (!share || share.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: 'Share link not found' });
  }

  const updated = db.extendShareExpiry(share.id, parse.data.additionalSeconds);
  if (!updated) {
    return res.status(500).json({ error: 'Failed to extend share link' });
  }

  db.recordAuditEvent({
    organizationId: req.user!.organizationId,
    actorUserId: req.user!.id,
    action: 'SHARE_LINK_EXTENDED',
    targetType: 'share_link',
    targetId: share.id,
    ipHash: null,
    detailsRedacted: JSON.stringify({
      additionalSeconds: parse.data.additionalSeconds,
      newExpiresAt: updated.expiresAt
    })
  });

  return res.json({ success: true, share: updated });
});

/**
 * 2c. POST /shares/:id/regenerate: Sender regenerates token for a link
 */
shareRouter.post('/:id/regenerate', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const share = db.findShareLinkById(req.params['id']!);
  if (!share || share.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: 'Share link not found' });
  }

  const newRawToken = crypto.randomBytes(32).toString('base64url');
  const newTokenHash = crypto.createHash('sha256').update(newRawToken).digest('hex');
  const newExpiresAt = share.expiryType === 'ABSOLUTE'
    ? new Date(Date.now() + share.durationSeconds * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

  const regenerated = db.regenerateShareLink(share.id, newRawToken, newTokenHash, newExpiresAt);

  db.recordAuditEvent({
    organizationId: req.user!.organizationId,
    actorUserId: req.user!.id,
    action: 'SHARE_LINK_REGENERATED',
    targetType: 'share_link',
    targetId: share.id,
    ipHash: null,
    detailsRedacted: null
  });

  return res.json({ success: true, share: regenerated, token: newRawToken });
});

/**
 * 3. POST /shares/:token/session: Receiver opens share link without an account
 */
shareRouter.post('/:token/session', (req: Request, res: Response) => {
  const token = req.params['token']!;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
  const userAgent = req.headers['user-agent'] || null;

  const share = db.findShareLinkByTokenHash(tokenHash);
  if (!share) {
    return res.status(404).json({ error: 'Invalid or expired document link' });
  }

  const doc = db.findDocumentById(share.organizationId, share.documentId) ||
    ((db as any).state?.documents || []).find((d: any) => d.id === share.documentId);

  if (!doc) {
    return res.status(404).json({ error: 'Document is no longer available' });
  }

  // 1. Check revocation
  if (share.revokedAt) {
    db.recordSecurityAlert({
      organizationId: share.organizationId,
      documentId: doc.id,
      shareLinkId: share.id,
      severity: 'medium',
      alertType: 'REVOKED_ACCESS_ATTEMPT',
      message: `Attempted access on revoked share link from IP ${ipHash}`,
      ipHash,
      userAgent
    });
    return res.status(403).json({ error: 'Access revoked: Document owner has disabled this share link' });
  }

  // 2. Check authoritative server clock expiry (even after refresh or reopening!)
  const now = new Date();
  if (now.getTime() >= new Date(share.expiresAt).getTime()) {
    db.recordSecurityAlert({
      organizationId: share.organizationId,
      documentId: doc.id,
      shareLinkId: share.id,
      severity: 'low',
      alertType: 'EXPIRED_ACCESS_ATTEMPT',
      message: `Attempted access after expiration on share link from IP ${ipHash}`,
      ipHash,
      userAgent
    });
    return res.status(410).json({ error: 'Document expired: Access duration has ended' });
  }

  // 2b. If first-open expiry semantics, establish the single authoritative expiry timestamp on the first successful open
  if (share.expiryType === 'FIRST_OPEN' && !share.firstOpenedAt) {
    const authoritativeExpiresAt = new Date(now.getTime() + share.durationSeconds * 1000).toISOString();
    db.markShareLinkFirstOpened(share.id, authoritativeExpiresAt);
    share.expiresAt = authoritativeExpiresAt;
    share.firstOpenedAt = now.toISOString();
  }

  // 3. Check maximum views / opens limit
  if (share.maxOpens !== null && share.openCount >= share.maxOpens) {
    db.recordSecurityAlert({
      organizationId: share.organizationId,
      documentId: doc.id,
      shareLinkId: share.id,
      severity: 'medium',
      alertType: 'MAX_OPENS_EXCEEDED',
      message: `Maximum allowed views (${share.maxOpens}) exceeded for share link from IP ${ipHash}`,
      ipHash,
      userAgent
    });
    return res.status(403).json({ error: 'Maximum views exceeded for this share link' });
  }

  // 4. Single-session / Concurrent session restriction
  if (share.singleSessionOnly) {
    const activeSessions = db.getActiveSessionsForShare(share.id);
    if (activeSessions.length > 0) {
      db.recordSecurityAlert({
        organizationId: share.organizationId,
        documentId: doc.id,
        shareLinkId: share.id,
        severity: 'high',
        alertType: 'CONCURRENT_SESSION_BLOCKED',
        message: `Blocked concurrent session attempt from IP ${ipHash}. Document has singleSessionOnly policy and is already active.`,
        ipHash,
        userAgent
      });
      return res.status(409).json({
        error: 'Single-session policy active: This document is already open in another active browser session or was forwarded. Concurrent viewing is restricted.'
      });
    }
  }

  // 5. Forwarded link detection
  if (share.boundIpHash && share.boundIpHash !== ipHash) {
    db.recordSecurityAlert({
      organizationId: share.organizationId,
      documentId: doc.id,
      shareLinkId: share.id,
      severity: 'medium',
      alertType: 'FORWARDED_LINK_DETECTED',
      message: `Share link opened from new IP ${ipHash} (originally opened by ${share.boundIpHash}). Potential link forwarding detected.`,
      ipHash,
      userAgent
    });
  } else if (!share.boundIpHash) {
    share.boundIpHash = ipHash;
  }

  // Atomically increment open count
  db.incrementShareLinkOpenCount(share.id);

  // Generate 256-bit session token
  const rawSessionToken = crypto.randomBytes(32).toString('base64url');
  const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');

  const session = db.createAccessSession({
    shareLinkId: share.id,
    documentId: doc.id,
    sessionTokenHash,
    ipHash,
    userAgent,
    expiresAt: share.expiresAt
  });

  db.recordAccessEvent({
    organizationId: share.organizationId,
    documentId: doc.id,
    userId: null,
    deviceId: null,
    eventType: 'receiver_session_started',
    offlineReported: false,
    metadataRedacted: JSON.stringify({ shareId: share.id, ipHash, singleSession: share.singleSessionOnly })
  });

  const remainingSeconds = Math.max(0, Math.floor((new Date(share.expiresAt).getTime() - now.getTime()) / 1000));

  return res.status(201).json({
    sessionId: session.id,
    sessionToken: rawSessionToken,
    documentTitle: doc.title,
    mimeType: doc.mimeDetected,
    expiresAt: share.expiresAt,
    remainingSeconds,
    watermarkTemplate: share.watermarkTemplate,
    allowDownload: false, // In view-only mode, download is always disabled for receiver
    singleSessionOnly: share.singleSessionOnly
  });
});

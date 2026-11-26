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
 * 2d. GET /shares/:id/stats: Sender retrieves DRM access statistics
 */
shareRouter.get('/:id/stats', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const share = db.findShareLinkById(req.params['id']!);
  if (!share || share.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: 'Share link not found' });
  }

  const stats = db.getShareStats(share.id);
  return res.json({ stats });
});

/**
 * 3. POST /shares/:token/session: Receiver opens share link without an account
 * Atomically checks expiry, max opens, revocation, single-session, or resumes active session.
 */
shareRouter.post('/:token/session', (req: Request, res: Response) => {
  const token = req.params['token']!;
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
        error: 'Unable to Open Document: Maximum views exceeded for this share link',
        reason: 'Maximum Open Count Reached',
        code: 'MAX_OPENS_REACHED',
        maxOpens: result.share?.maxOpens,
        openCount: result.share?.openCount
      });
    }

    if (result.reason === 'ACCESS_REVOKED') {
      return res.status(403).json({
        error: 'Unable to Open Document: Access revoked: Document owner has disabled this share link',
        reason: 'Access Revoked',
        code: 'ACCESS_REVOKED'
      });
    }

    if (result.reason === 'SINGLE_SESSION_CONFLICT') {
      return res.status(409).json({
        error: 'Unable to Open Document: Single-session policy active: This document is already open in another active browser session or was forwarded. Concurrent viewing is restricted.',
        reason: 'Maximum Open Count Reached',
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
      eventType: 'receiver_session_started',
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

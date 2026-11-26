import { Router, Request, Response } from 'express';
import { db } from '../storage/db.js';
import { vault } from '../storage/vault.js';

export const viewerRouter = Router();

/**
 * Validates session, authoritative server clock, and revocation status
 */
function validateViewerSession(req: Request, res: Response) {
  const sessionId = req.params['id']!;
  const sessionToken = (req.headers['x-session-token'] as string | undefined) || (req.query['token'] as string | undefined);

  const validation = db.validateViewerSessionDetailed(sessionId, sessionToken);

  if (!validation.valid) {
    if (validation.reason === 'EXPIRED') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.status(410).json({
        error: 'Unable to Open Document',
        reason: 'Document Expired',
        code: 'EXPIRED',
        expiredAt: validation.session?.expiresAt
      });
      return null;
    }

    if (validation.reason === 'ACCESS_REVOKED') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.status(403).json({
        error: 'Unable to Open Document',
        reason: 'Access Revoked',
        code: 'ACCESS_REVOKED'
      });
      return null;
    }

    if (validation.reason === 'INVALID_TOKEN') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.status(403).json({
        error: 'Unable to Open Document',
        reason: 'Invalid or Unauthorized Link',
        code: 'INVALID_TOKEN'
      });
      return null;
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(404).json({
      error: 'Unable to Open Document',
      reason: 'Invalid or Unauthorized Link',
      code: 'INVALID_LINK'
    });
    return null;
  }

  return { session: validation.session!, share: validation.share, document: validation.document! };
}

/**
 * 1. GET /viewer/sessions/:id/status: Active viewer heartbeat check
 */
viewerRouter.get('/sessions/:id/status', (req: Request, res: Response) => {
  const validated = validateViewerSession(req, res);
  if (!validated) return;

  const { session, share } = validated;
  db.touchAccessSession(session.id);

  const now = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - now) / 1000));
  const remainingOpens = share && share.maxOpens !== null ? Math.max(0, share.maxOpens - share.openCount) : null;

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.json({
    active: true,
    expiresAt: session.expiresAt,
    remainingSeconds,
    openCount: share ? share.openCount : 1,
    maxOpens: share ? share.maxOpens : null,
    remainingOpens,
    serverTimeUtc: new Date().toISOString()
  });
});

/**
 * 2. GET /viewer/sessions/:id/content: Protected preview content delivery
 * Strictly enforces no-store and validates server clock on every chunk/page request!
 */
viewerRouter.get('/sessions/:id/content', (req: Request, res: Response) => {
  const validated = validateViewerSession(req, res);
  if (!validated) return;

  const { session, document: targetDoc } = validated;

  const versions = db.findVersionsByDocument(targetDoc.id);
  const latestVersion = versions[versions.length - 1];
  if (!latestVersion) {
    return res.status(404).json({
      error: 'Unable to Open Document',
      reason: 'Invalid or Unauthorized Link',
      code: 'MISSING_PAYLOAD'
    });
  }

  // Decrypt on-the-fly in server RAM only
  const plaintext = vault.getDecryptedOriginal(latestVersion.objectKey, latestVersion.wrappedDekRef);

  db.recordAccessEvent({
    organizationId: targetDoc.organizationId,
    documentId: targetDoc.id,
    userId: null,
    deviceId: null,
    eventType: 'viewer_page_delivered',
    offlineReported: false,
    metadataRedacted: JSON.stringify({ sessionId: session.id })
  });

  // Strict anti-caching headers: prevents browser disk/cache preservation
  res.setHeader('Content-Type', targetDoc.mimeDetected || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${targetDoc.title}"`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  return res.send(plaintext);
});

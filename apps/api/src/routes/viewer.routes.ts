import { Router, Request, Response } from 'express';
import { db } from '../storage/db.js';
import { vault } from '../storage/vault.js';

export const viewerRouter = Router();

/**
 * Validates session, authoritative server clock, and revocation status
 */
function validateViewerSession(req: Request, res: Response) {
  const sessionId = req.params['id']!;
  const session = db.findAccessSessionById(sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return null;
  }

  // Check session revocation
  if (session.revokedAt) {
    db.recordSecurityAlert({
      organizationId: 'default',
      documentId: session.documentId,
      shareLinkId: session.shareLinkId || undefined,
      severity: 'medium',
      alertType: 'REVOKED_ACCESS_ATTEMPT',
      message: `Viewer attempted access on terminated session ${sessionId.substring(0, 8)}`,
      ipHash: session.ipHash,
      userAgent: session.userAgent
    });
    res.status(403).json({ error: 'Access revoked: Session has been terminated by document owner' });
    return null;
  }

  // Check parent share link status (if linked to a share link)
  const share = session.shareLinkId ? db.findShareLinkById(session.shareLinkId) : undefined;
  if (session.shareLinkId) {
    if (!share || share.revokedAt) {
      db.recordSecurityAlert({
        organizationId: share ? share.organizationId : 'default',
        documentId: session.documentId,
        shareLinkId: session.shareLinkId,
        severity: 'medium',
        alertType: 'REVOKED_ACCESS_ATTEMPT',
        message: `Viewer attempted access on revoked share link`,
        ipHash: session.ipHash,
        userAgent: session.userAgent
      });
      res.status(403).json({ error: 'Access revoked: Share link has been revoked' });
      return null;
    }
  }

  // Authoritative server clock check: no reliance on client browser time!
  const now = new Date();
  const isExpired = now.getTime() >= new Date(session.expiresAt).getTime() ||
    (share && now.getTime() >= new Date(share.expiresAt).getTime());

  if (isExpired) {
    db.recordSecurityAlert({
      organizationId: share ? share.organizationId : 'default',
      documentId: session.documentId,
      shareLinkId: session.shareLinkId || undefined,
      severity: 'low',
      alertType: 'EXPIRED_ACCESS_ATTEMPT',
      message: `Viewer attempted to fetch content after expiry`,
      ipHash: session.ipHash,
      userAgent: session.userAgent
    });
    res.status(410).json({
      error: 'Document expired: Access duration has ended',
      expiredAt: session.expiresAt
    });
    return null;
  }

  return { session, share };
}

/**
 * 1. GET /viewer/sessions/:id/status: Active viewer heartbeat check
 */
viewerRouter.get('/sessions/:id/status', (req: Request, res: Response) => {
  const validated = validateViewerSession(req, res);
  if (!validated) return;

  const { session, share } = validated;
  db.touchAccessSession(session.id);

  const now = new Date();
  const remainingSeconds = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - now.getTime()) / 1000));

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.json({
    active: true,
    expiresAt: session.expiresAt,
    remainingSeconds,
    openCount: share ? share.openCount : 1,
    maxOpens: share ? share.maxOpens : null
  });
});

/**
 * 2. GET /viewer/sessions/:id/content: Protected preview content delivery
 * Strictly enforces no-store and validates server clock on every chunk/page request!
 */
viewerRouter.get('/sessions/:id/content', (req: Request, res: Response) => {
  const validated = validateViewerSession(req, res);
  if (!validated) return;

  const { session } = validated;

  const allDocs = (db as any).state?.documents || [];
  const targetDoc = allDocs.find((d: any) => d.id === session.documentId);

  if (!targetDoc || targetDoc.status !== 'active') {
    return res.status(404).json({ error: 'Document not found or inactive' });
  }

  const versions = db.findVersionsByDocument(targetDoc.id);
  const latestVersion = versions[versions.length - 1];
  if (!latestVersion) {
    return res.status(404).json({ error: 'Document version payload missing' });
  }

  // Decrypt on-the-fly in server RAM
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

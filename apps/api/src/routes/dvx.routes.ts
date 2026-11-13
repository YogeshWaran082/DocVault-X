import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as crypto from 'node:crypto';
import { db } from '../storage/db.js';
import { vault } from '../storage/vault.js';
import { DvxContainerParser } from '@docvault/file-format';
import { z } from 'zod';

export const dvxRouter = Router();

const upload = multer({
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB max
});

/**
 * 1. POST /api/v1/dvx/inspect:
 * Validates file signature (DVX1), container version, metadata structure and integrity.
 */
dvxRouter.post('/inspect', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ isValid: false, error: 'No .dvx file uploaded' });
  }

  const inspection = DvxContainerParser.inspect(req.file.buffer);
  if (!inspection.isValid || !inspection.metadata) {
    return res.status(400).json({
      isValid: false,
      error: inspection.error || 'Invalid or corrupted DVX container'
    });
  }

  const documentId = inspection.metadata.documentId;
  const doc = (db as any).state?.documents?.find((d: any) => d.id === documentId);

  return res.json({
    isValid: true,
    version: inspection.version,
    cipherSuite: inspection.cipherSuite,
    documentId,
    mimeType: inspection.metadata.mimeType,
    createdAt: inspection.metadata.createdAt,
    totalChunks: inspection.metadata.totalChunks,
    originalSizeBytes: inspection.metadata.originalSizeBytes,
    documentTitle: doc ? doc.title : null,
    documentExists: Boolean(doc),
    status: doc ? doc.status : 'not_registered'
  });
});

/**
 * 2. POST /api/v1/dvx/authorize:
 * Validates user or share-token permissions, document policy, expiry and revocation.
 */
dvxRouter.post('/authorize', (req: Request, res: Response) => {
  const schema = z.object({
    documentId: z.string().uuid(),
    token: z.string().optional()
  });

  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  const { documentId, token } = parse.data;
  const doc = (db as any).state?.documents?.find((d: any) => d.id === documentId);
  if (!doc) {
    return res.status(404).json({ error: 'Document record not found in system' });
  }

  if (doc.status === 'revoked') {
    return res.status(403).json({ error: 'Document access has been revoked by the owner' });
  }

  let authorized = false;
  let expiresAt: string = new Date(Date.now() + 3600 * 1000).toISOString();
  let shareLinkId: string | null = null;
  let watermarkTemplate: string | null = null;

  // Option A: Authorization via Bearer Token (Logged in user)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawJwt = authHeader.substring(7);
    try {
      const parts = rawJwt.split('.');
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (payload.organizationId === doc.organizationId) {
          authorized = true;
          const policy = db.getActivePolicy(doc.id);
          const leaseSec = policy ? policy.offlineLeaseSeconds : 3600;
          expiresAt = new Date(Date.now() + leaseSec * 1000).toISOString();
          watermarkTemplate = policy?.watermarkTemplate || null;
        }
      }
    } catch {
      // Ignored
    }
  }

  // Option B: Authorization via Share Token
  if (!authorized && token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const share = db.findShareLinkByTokenHash(tokenHash);

    if (share && share.documentId === doc.id) {
      if (share.revokedAt) {
        return res.status(403).json({ error: 'Share link has been revoked' });
      }

      const now = new Date();
      if (now.getTime() >= new Date(share.expiresAt).getTime()) {
        return res.status(410).json({ error: 'Share link has expired' });
      }

      if (share.maxOpens !== null && share.openCount >= share.maxOpens) {
        return res.status(403).json({ error: 'Maximum views exceeded for this share link' });
      }

      // Check singleSessionOnly
      if (share.singleSessionOnly) {
        const activeSessions = db.getActiveSessionsForShare(share.id);
        if (activeSessions.length > 0) {
          return res.status(409).json({ error: 'Single-session policy active: DVX document is currently open in another session' });
        }
      }

      // First-open semantics
      if (share.expiryType === 'FIRST_OPEN' && !share.firstOpenedAt) {
        const authoritativeExpiresAt = new Date(now.getTime() + share.durationSeconds * 1000).toISOString();
        db.markShareLinkFirstOpened(share.id, authoritativeExpiresAt);
        share.expiresAt = authoritativeExpiresAt;
        share.firstOpenedAt = now.toISOString();
      }

      db.incrementShareLinkOpenCount(share.id);
      authorized = true;
      shareLinkId = share.id;
      expiresAt = share.expiresAt;
      watermarkTemplate = share.watermarkTemplate;
    }
  }

  if (!authorized) {
    return res.status(401).json({
      error: 'Authorization required: Please log in or provide a valid share token to view this .dvx document.'
    });
  }

  // Generate 256-bit session token
  const rawSessionToken = crypto.randomBytes(32).toString('base64url');
  const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

  const session = db.createAccessSession({
    shareLinkId: shareLinkId,
    documentId: doc.id,
    sessionTokenHash,
    ipHash,
    userAgent: req.headers['user-agent'] || null,
    expiresAt
  });

  const remainingSeconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

  return res.status(201).json({
    sessionId: session.id,
    sessionToken: rawSessionToken,
    documentTitle: doc.title,
    mimeType: doc.mimeDetected,
    expiresAt,
    remainingSeconds,
    watermarkTemplate
  });
});

/**
 * 3. GET /api/v1/dvx/preview/:sessionId:
 * Streams memory-decrypted plaintext preview with no-store headers.
 */
dvxRouter.get('/preview/:sessionId', (req: Request, res: Response) => {
  const sessionId = req.params['sessionId']!;
  const session = db.findAccessSessionById(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Invalid or expired DVX viewing session' });
  }

  if (session.revokedAt) {
    return res.status(403).json({ error: 'Access revoked: Viewing session was invalidated' });
  }

  const now = new Date();
  if (now.getTime() >= new Date(session.expiresAt).getTime()) {
    return res.status(410).json({ error: 'Session expired: Document access duration has elapsed' });
  }

  const doc = (db as any).state?.documents?.find((d: any) => d.id === session.documentId);
  if (!doc || doc.status === 'revoked') {
    return res.status(403).json({ error: 'Document access revoked' });
  }

  const versions = db.findVersionsByDocument(doc.id);
  if (!versions || versions.length === 0) {
    return res.status(404).json({ error: 'Document version ciphertext not found' });
  }

  const latestVersion = versions[versions.length - 1]!;

  try {
    const plaintext = vault.getDecryptedOriginal(latestVersion.objectKey, latestVersion.wrappedDekRef);

    res.setHeader('Content-Type', doc.mimeDetected || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.title)}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    db.touchAccessSession(session.id);
    return res.status(200).send(plaintext);
  } catch (err: any) {
    console.error('DVX preview decryption error:', err);
    return res.status(500).json({ error: 'Failed to decrypt DVX container in memory' });
  }
});

/**
 * 4. GET /api/v1/dvx/sessions/:sessionId/status:
 * Real-time heartbeat validation.
 */
dvxRouter.get('/sessions/:sessionId/status', (req: Request, res: Response) => {
  const session = db.findAccessSessionById(req.params['sessionId']!);
  if (!session) {
    return res.status(404).json({ active: false, error: 'Session not found' });
  }

  if (session.revokedAt) {
    return res.status(403).json({ active: false, error: 'Session revoked' });
  }

  const now = new Date();
  if (now.getTime() >= new Date(session.expiresAt).getTime()) {
    return res.status(410).json({ active: false, error: 'Session expired' });
  }

  const remainingSeconds = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - now.getTime()) / 1000));
  return res.json({
    active: true,
    expiresAt: session.expiresAt,
    remainingSeconds
  });
});

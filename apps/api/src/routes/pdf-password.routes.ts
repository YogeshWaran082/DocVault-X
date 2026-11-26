import { Router, Request, Response } from 'express';
import * as crypto from 'node:crypto';
import { db } from '../storage/db.js';
import { vault } from '../storage/vault.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';

export const pdfPasswordRouter = Router();

const RETRIEVAL_HONESTY_NOTICE =
  'Server-side expiry and retrieval limits only control future password retrievals from the server. Any PDF already downloaded by a recipient who knows its password remains accessible offline.';

/**
 * GET /api/v1/pdf-passwords/:token/status
 * Public status check for an optional password retrieval link.
 * NEVER exposes the password.
 */
pdfPasswordRouter.get('/:token/status', (req: Request, res: Response) => {
  const token = req.params['token'] || '';
  if (!token) {
    return res.status(400).json({ error: 'Retrieval token is required' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = db.findPdfPasswordByTokenHash(tokenHash);
  if (!record) {
    return res.status(404).json({
      active: false,
      code: 'NOT_FOUND',
      error: 'Password retrieval link not found'
    });
  }

  const doc = db.findDocumentById(record.organizationId, record.documentId);
  const now = Date.now();
  const isExpired = new Date(record.expiresAt).getTime() <= now;
  const isRevoked = Boolean(record.revokedAt) || !doc || doc.status !== 'active';
  const maxReached =
    record.maxRetrievals !== null && record.retrievalCount >= record.maxRetrievals;
  const remainingRetrievals =
    record.maxRetrievals !== null
      ? Math.max(0, record.maxRetrievals - record.retrievalCount)
      : null;

  return res.json({
    active: !isExpired && !isRevoked && !maxReached,
    documentTitle: doc?.title || 'Protected PDF',
    expiresAt: record.expiresAt,
    maxRetrievals: record.maxRetrievals,
    retrievalCount: record.retrievalCount,
    remainingRetrievals,
    isExpired,
    isRevoked,
    maxReached,
    permissions: record.permissions,
    notice: RETRIEVAL_HONESTY_NOTICE
  });
});

/**
 * POST /api/v1/pdf-passwords/:token/retrieve
 * Atomically retrieves the document opening password if not expired, revoked, or exhausted.
 * Uses POST so link prefetchers do not accidentally consume a retrieval count.
 * NEVER exposes the owner permission password.
 */
pdfPasswordRouter.post('/:token/retrieve', (req: Request, res: Response) => {
  const token = req.params['token'] || '';
  if (!token) {
    return res.status(400).json({ error: 'Retrieval token is required' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = db.findPdfPasswordByTokenHash(tokenHash);
  if (!record) {
    return res.status(404).json({
      code: 'NOT_FOUND',
      error: 'Password retrieval link not found'
    });
  }

  const doc = db.findDocumentById(record.organizationId, record.documentId);
  if (!doc || doc.status !== 'active' || record.revokedAt) {
    return res.status(403).json({
      code: 'REVOKED',
      error: 'Password retrieval link has been revoked or document is no longer active'
    });
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return res.status(410).json({
      code: 'EXPIRED',
      error: 'Password retrieval link has expired'
    });
  }

  const updated = db.incrementPdfPasswordRetrieval(record.id);
  if (!updated) {
    return res.status(410).json({
      code: 'MAX_RETRIEVALS_REACHED',
      error: 'Maximum password retrieval count has been reached'
    });
  }

  let password: string;
  try {
    password = vault.decryptSecret(updated.encryptedUserPassword);
  } catch {
    return res.status(500).json({ error: 'Failed to decrypt stored password' });
  }

  db.recordAuditEvent({
    organizationId: record.organizationId,
    actorUserId: null,
    action: 'PDF_PASSWORD_RETRIEVED',
    targetType: 'pdf_password',
    targetId: record.id,
    ipHash: null,
    detailsRedacted: JSON.stringify({
      documentId: record.documentId,
      retrievalCount: updated.retrievalCount,
      maxRetrievals: updated.maxRetrievals
    })
  });

  const remainingRetrievals =
    updated.maxRetrievals !== null
      ? Math.max(0, updated.maxRetrievals - updated.retrievalCount)
      : null;

  return res.json({
    password,
    documentTitle: doc.title,
    expiresAt: updated.expiresAt,
    maxRetrievals: updated.maxRetrievals,
    retrievalCount: updated.retrievalCount,
    remainingRetrievals,
    permissions: updated.permissions,
    notice: RETRIEVAL_HONESTY_NOTICE
  });
});

/**
 * POST /api/v1/pdf-passwords/:id/revoke
 * Authenticated sender revokes an optional password retrieval link.
 */
pdfPasswordRouter.post(
  '/:id/revoke',
  authenticate,
  requireRole(['owner', 'admin', 'sender']),
  (req: AuthenticatedRequest, res: Response) => {
    const record = db.findPdfPasswordById(req.params['id'] || '');
    if (!record || record.organizationId !== req.user!.organizationId) {
      return res.status(404).json({ error: 'Password retrieval record not found' });
    }

    db.revokePdfPasswordRecord(record.id);

    db.recordAuditEvent({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.id,
      action: 'PDF_PASSWORD_LINK_REVOKED',
      targetType: 'pdf_password',
      targetId: record.id,
      ipHash: null,
      detailsRedacted: JSON.stringify({ documentId: record.documentId })
    });

    return res.json({ success: true, message: 'Password retrieval link revoked' });
  }
);

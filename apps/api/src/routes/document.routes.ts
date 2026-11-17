import { Router, Response } from 'express';
import multer from 'multer';
import { db } from '../storage/db.js';
import { vault } from '../storage/vault.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import {
  InitiateUploadRequestSchema,
  CreatePolicyRequestSchema
} from '@docvault/contracts';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { hashDocumentPassword, verifyDocumentPassword } from '../security/document-password.js';

export const documentRouter = Router();

const upload = multer({
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB max
});

function canReadDocument(req: AuthenticatedRequest, documentId: string): boolean {
  return req.user!.role !== 'recipient' || db.hasActiveGrant(documentId, req.user!.id);
}

documentRouter.use(authenticate);

/**
 * 1. POST /uploads/initiate: Initiate chunked / signed upload
 */
documentRouter.post(
  '/uploads/initiate',
  requireRole(['owner', 'admin', 'sender']),
  (req: AuthenticatedRequest, res: Response) => {
    const parse = InitiateUploadRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
    }

    const uploadId = uuidv4();
    const objectKey = `${req.user!.organizationId}/${uploadId}.dvx`;

    return res.status(201).json({
      uploadId,
      objectKey,
      uploadUrl: `/api/v1/documents/upload-direct?uploadId=${uploadId}`
    });
  }
);

/**
 * 2. POST /upload-direct: Upload file payload directly, encrypt to .dvx container & persist
 */
documentRouter.post(
  '/upload-direct',
  requireRole(['owner', 'admin', 'sender']),
  upload.single('file'),
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided in multipart payload' });
    }

    // Filename & Title validation
    const rawFilename = req.file.originalname || 'document.bin';
    const sanitizedFilename = rawFilename.replace(/[/\\?%*:|"<>]/g, '_').trim();
    if (!sanitizedFilename || sanitizedFilename.length === 0) {
      return res.status(400).json({ error: 'Invalid filename provided' });
    }

    const rawTitle = (req.body['title'] as string) || sanitizedFilename;
    const title = rawTitle.replace(/[/\\?%*:|"<>]/g, '_').trim().slice(0, 255);
    if (!title || title.length === 0) {
      return res.status(400).json({ error: 'Document title cannot be empty' });
    }
    const documentPassword = typeof req.body['password'] === 'string' ? req.body['password'] : null;
    if (documentPassword && (documentPassword.length < 6 || documentPassword.length > 128)) {
      return res.status(400).json({ error: 'Document password must be between 6 and 128 characters' });
    }

    const mimeDeclared = req.file.mimetype || 'application/octet-stream';
    const mimeDetected = mimeDeclared; // Can be enhanced with file-type sniffer

    const doc = db.createDocument({
      organizationId: req.user!.organizationId,
      ownerUserId: req.user!.id,
      title,
      mimeDeclared,
      mimeDetected,
      sizeBytes: req.file.size,
      sha256Ciphertext: '', // populated after encryption
      currentVersionId: null,
      status: 'active'
    });

    // Encrypt into .dvx container and store in vault
    const { objectKey, sha256Ciphertext, wrappedDekRef } = vault.storeDocument(
      doc.id,
      req.file.buffer,
      mimeDetected
    );

    const version = db.createDocumentVersion({
      documentId: doc.id,
      objectKey,
      containerVersion: 1,
      wrappedDekRef,
      sizeBytes: req.file.size
    });

    db.updateDocument(doc.id, {
      currentVersionId: version.id,
      sha256Ciphertext
    });

    // Create default policy with 50 minutes lease (3000s) and clean watermark-free setup
    const policy = db.createPolicy({
      organizationId: req.user!.organizationId,
      documentId: doc.id,
      version: 1,
      mode: 'SECURE_NATIVE',
      expiresAtUtc: null,
      maxOpens: null,
      offlineLeaseSeconds: 3000, // 50 minutes default
      allowExport: false,
      allowPrint: true,
      watermarkTemplate: null, // No watermark by default as requested
      passwordHash: hashDocumentPassword(documentPassword)
    });

    db.recordAuditEvent({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.id,
      action: 'DOCUMENT_UPLOADED',
      targetType: 'document',
      targetId: doc.id,
      ipHash: null,
      detailsRedacted: JSON.stringify({ title: doc.title, sizeBytes: doc.sizeBytes })
    });

    return res.status(201).json({
      document: {
        ...doc,
        currentVersionId: version.id,
        sha256Ciphertext
      },
      version,
      policy: { ...policy, passwordHash: undefined, hasPassword: Boolean(policy.passwordHash) }
    });
  }
);

/**
 * 3. GET /: List documents in active tenant
 */
documentRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const status = req.query['status'] as string | undefined;
  const search = req.query['search'] as string | undefined;

  const docs = db
    .listDocuments(req.user!.organizationId, { status, search })
    .filter(doc => canReadDocument(req, doc.id))
    .map(doc => ({ ...doc, hasPassword: Boolean(db.getActivePolicy(doc.id)?.passwordHash) }));
  return res.json({ documents: docs });
});

/**
 * 4. GET /:id: Document detail with active policy and versions
 */
documentRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  if (!canReadDocument(req, doc.id)) {
    return res.status(403).json({ error: 'Access to this document has not been granted' });
  }

  const versions = db.findVersionsByDocument(doc.id);
  const activePolicy = db.getActivePolicy(doc.id);
  const grants = req.user!.role === 'recipient' ? [] : db.listGrantsByDocument(doc.id);

  return res.json({
    document: { ...doc, hasPassword: Boolean(activePolicy?.passwordHash) },
    versions,
    activePolicy: activePolicy ? { ...activePolicy, passwordHash: undefined, hasPassword: Boolean(activePolicy.passwordHash) } : null,
    grants
  });
});

/**
 * 5. DELETE /:id: Delete / revoke document
 */
documentRouter.delete(
  '/:id',
  requireRole(['owner', 'admin', 'sender']),
  (req: AuthenticatedRequest, res: Response) => {
    const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    db.updateDocument(doc.id, {
      status: 'deleted',
      deletedAt: new Date().toISOString()
    });

    // Clean up stored objects
    const versions = db.findVersionsByDocument(doc.id);
    for (const v of versions) {
      vault.deleteObject(v.objectKey);
    }

    db.recordAuditEvent({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.id,
      action: 'DOCUMENT_DELETED',
      targetType: 'document',
      targetId: doc.id,
      ipHash: null,
      detailsRedacted: null
    });

    return res.json({ success: true, message: 'Document securely deleted' });
  }
);

/**
 * 6. POST /:id/policies: Update or supersede policy
 */
documentRouter.post(
  '/:id/policies',
  requireRole(['owner', 'admin', 'sender']),
  (req: AuthenticatedRequest, res: Response) => {
    const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const parse = CreatePolicyRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
    }

    const activePolicy = db.getActivePolicy(doc.id);
    const nextVersion = activePolicy ? activePolicy.version + 1 : 1;
    const hasField = (field: string) => Object.prototype.hasOwnProperty.call(req.body, field);

    const policy = db.createPolicy({
      organizationId: req.user!.organizationId,
      documentId: doc.id,
      version: nextVersion,
      mode: hasField('mode') ? parse.data.mode : activePolicy?.mode || 'SECURE_NATIVE',
      expiresAtUtc: hasField('expiresAtUtc') ? parse.data.expiresAtUtc || null : activePolicy?.expiresAtUtc || null,
      maxOpens: hasField('maxOpens') ? parse.data.maxOpens || null : activePolicy?.maxOpens || null,
      offlineLeaseSeconds: hasField('offlineLeaseSeconds') ? parse.data.offlineLeaseSeconds : activePolicy?.offlineLeaseSeconds || 86400,
      allowExport: hasField('allowExport') ? parse.data.allowExport : activePolicy?.allowExport || false,
      allowPrint: hasField('allowPrint') ? parse.data.allowPrint : activePolicy?.allowPrint || false,
      watermarkTemplate: hasField('watermarkTemplate') ? parse.data.watermarkTemplate || null : activePolicy?.watermarkTemplate || null,
      passwordHash: parse.data.password === undefined
        ? activePolicy?.passwordHash || null
        : hashDocumentPassword(parse.data.password)
    });

    db.recordAuditEvent({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.id,
      action: 'POLICY_UPDATED',
      targetType: 'policy',
      targetId: policy.id,
      ipHash: null,
      detailsRedacted: JSON.stringify({ mode: policy.mode, version: policy.version })
    });

    return res.status(201).json({ policy: { ...policy, passwordHash: undefined, hasPassword: Boolean(policy.passwordHash) } });
  }
);

/**
 * 7. POST /:id/revoke: Revoke document access immediately
 */
documentRouter.post(
  '/:id/revoke',
  requireRole(['owner', 'admin', 'sender']),
  (req: AuthenticatedRequest, res: Response) => {
    const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    db.updateDocument(doc.id, { status: 'revoked' });

    // Revoke all grants
    const grants = db.listGrantsByDocument(doc.id);
    for (const g of grants) {
      db.revokeGrant(g.id);
    }

    db.recordAuditEvent({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.id,
      action: 'DOCUMENT_REVOKED',
      targetType: 'document',
      targetId: doc.id,
      ipHash: null,
      detailsRedacted: null
    });

    return res.json({ success: true, message: 'Document and all associated grants revoked' });
  }
);

/**
 * 8. POST /:id/grants: Grant access to a recipient
 */
documentRouter.post(
  '/:id/grants',
  requireRole(['owner', 'admin', 'sender']),
  (req: AuthenticatedRequest, res: Response) => {
    const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const schema = z.object({
      recipientEmail: z.string().email(),
      recipientName: z.string().min(2).optional()
    });

    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
    }

    let recipient = db.findUserByEmail(parse.data.recipientEmail);
    if (!recipient) {
      recipient = db.createUser({
        email: parse.data.recipientEmail,
        name: parse.data.recipientName || parse.data.recipientEmail.split('@')[0]!,
        passwordHash: null,
        mfaEnabled: false
      });
      db.createMembership(req.user!.organizationId, recipient.id, 'recipient');
    }

    const activePolicy = db.getActivePolicy(doc.id);
    if (!activePolicy) {
      return res.status(400).json({ error: 'No active policy found for document' });
    }

    const grant = db.createGrant({
      organizationId: req.user!.organizationId,
      documentId: doc.id,
      recipientUserId: recipient.id,
      policyId: activePolicy.id,
      status: 'active'
    });

    db.recordAuditEvent({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.id,
      action: 'GRANT_ISSUED',
      targetType: 'grant',
      targetId: grant.id,
      ipHash: null,
      detailsRedacted: JSON.stringify({ recipientEmail: recipient.email })
    });

    return res.status(201).json({ grant, recipient });
  }
);

/**
 * 9. POST /:id/protected-download: Download the encrypted .dvx container
 */
documentRouter.post('/:id/protected-download', (req: AuthenticatedRequest, res: Response) => {
  const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  if (!canReadDocument(req, doc.id)) {
    return res.status(403).json({ error: 'Access to this document has not been granted' });
  }

  if (doc.status !== 'active') {
    return res.status(403).json({ error: `Cannot download: document is ${doc.status}` });
  }

  const versions = db.findVersionsByDocument(doc.id);
  const latestVersion = versions[versions.length - 1];
  if (!latestVersion) {
    return res.status(404).json({ error: 'No document version found' });
  }

  const dvxBinary = vault.getDvxBinary(latestVersion.objectKey);

  db.recordAccessEvent({
    organizationId: req.user!.organizationId,
    documentId: doc.id,
    userId: req.user!.id,
    deviceId: null,
    eventType: 'protected_download',
    offlineReported: false,
    metadataRedacted: null
  });

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.title}.dvx"`);
  return res.send(dvxBinary);
});

/**
 * 10. POST /:id/unprotected-export: Export decrypted original standard file (Mode A)
 * MANDATORY: Requires explicit consent acknowledgment
 */
documentRouter.post(
  '/:id/unprotected-export',
  requireRole(['owner', 'admin', 'sender']),
  (req: AuthenticatedRequest, res: Response) => {
    const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const activePolicy = db.getActivePolicy(doc.id);
    if (!activePolicy || !activePolicy.allowExport) {
      return res.status(403).json({
        error: 'Export forbidden: Document policy does not allow unprotected export'
      });
    }
    if (!verifyDocumentPassword(req.body?.password, activePolicy.passwordHash)) {
      return res.status(423).json({
        error: req.body?.password ? 'INVALID_DOCUMENT_PASSWORD' : 'DOCUMENT_PASSWORD_REQUIRED',
        requiresPassword: true,
        message: req.body?.password ? 'Incorrect document password' : 'A password is required to export this document'
      });
    }

    const acknowledgeWarning = req.body['acknowledgeUnprotectedExport'] === true;
    if (!acknowledgeWarning) {
      return res.status(400).json({
        error:
          'Explicit acknowledgment required: Standard file exports permanently lose self-destruct, offline expiry, and revocation enforcement. Pass acknowledgeUnprotectedExport: true'
      });
    }

    const versions = db.findVersionsByDocument(doc.id);
    const latestVersion = versions[versions.length - 1];
    if (!latestVersion) {
      return res.status(404).json({ error: 'No document version found' });
    }

    const plaintext = vault.getDecryptedOriginal(latestVersion.objectKey, latestVersion.wrappedDekRef);

    db.recordAuditEvent({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.id,
      action: 'UNPROTECTED_EXPORT_PERFORMED',
      targetType: 'document',
      targetId: doc.id,
      ipHash: null,
      detailsRedacted: JSON.stringify({ warningAcknowledged: true })
    });

    res.setHeader('Content-Type', doc.mimeDetected);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.title}"`);
    res.setHeader('X-DocVault-Security-Status', 'UNPROTECTED_EXPORT');
    return res.send(plaintext);
  }
);

/**
 * 11. GET /:id/access-events: Access logs
 */
documentRouter.get('/:id/access-events', requireRole(['owner', 'admin', 'sender', 'auditor']), (req: AuthenticatedRequest, res: Response) => {
  const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const events = db.listAccessEvents(doc.id);
  return res.json({ events });
});

/**
 * 12. POST /:id/view-content: Stream decrypted document content for in-app viewer
 */
documentRouter.post('/:id/view-content', (req: AuthenticatedRequest, res: Response) => {
  const doc = db.findDocumentById(req.user!.organizationId, req.params['id']!);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  if (!canReadDocument(req, doc.id)) {
    return res.status(403).json({ error: 'Access to this document has not been granted' });
  }

  if (doc.status !== 'active') {
    return res.status(403).json({ error: `Cannot view: document is ${doc.status}` });
  }

  const activePolicy = db.getActivePolicy(doc.id);
  if (!verifyDocumentPassword(req.body?.password, activePolicy?.passwordHash)) {
    return res.status(423).json({
      error: req.body?.password ? 'INVALID_DOCUMENT_PASSWORD' : 'DOCUMENT_PASSWORD_REQUIRED',
      requiresPassword: true,
      message: req.body?.password ? 'Incorrect document password' : 'A password is required to open this document'
    });
  }

  const versions = db.findVersionsByDocument(doc.id);
  const latestVersion = versions[versions.length - 1];
  if (!latestVersion) {
    return res.status(404).json({ error: 'No document version found' });
  }

  const plaintext = vault.getDecryptedOriginal(latestVersion.objectKey, latestVersion.wrappedDekRef);

  db.recordAccessEvent({
    organizationId: req.user!.organizationId,
    documentId: doc.id,
    userId: req.user!.id,
    deviceId: null,
    eventType: 'in_app_preview',
    offlineReported: false,
    metadataRedacted: null
  });

  res.setHeader('Content-Type', doc.mimeDetected || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${doc.title}"`);
  return res.send(plaintext);
});

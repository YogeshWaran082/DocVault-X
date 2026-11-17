import { Router, Response } from 'express';
import * as crypto from 'node:crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { db, DbDocument, DbPolicy } from '../storage/db.js';
import { vault } from '../storage/vault.js';
import { verifyDocumentPassword } from '../security/document-password.js';

export const pdfToolsRouter = Router();
pdfToolsRouter.use(authenticate, requireRole(['owner', 'admin', 'sender']));

const sourceSchema = z.object({
  documentId: z.string().uuid(),
  password: z.string().max(128).optional()
});

function loadSource(req: AuthenticatedRequest, documentId: string, password?: string) {
  const doc = db.findDocumentById(req.user!.organizationId, documentId);
  if (!doc) throw Object.assign(new Error('Document not found'), { status: 404 });
  if (doc.status !== 'active') throw Object.assign(new Error(`Document is ${doc.status}`), { status: 403 });
  if (!doc.mimeDetected.includes('pdf') && !doc.title.toLowerCase().endsWith('.pdf')) {
    throw Object.assign(new Error('This tool supports PDF documents only'), { status: 415 });
  }
  const policy = db.getActivePolicy(doc.id);
  if (!verifyDocumentPassword(password, policy?.passwordHash)) {
    throw Object.assign(new Error(password ? 'Incorrect document password' : 'Document password required'), {
      status: 423,
      code: password ? 'INVALID_DOCUMENT_PASSWORD' : 'DOCUMENT_PASSWORD_REQUIRED',
      requiresPassword: true
    });
  }
  const versions = db.findVersionsByDocument(doc.id);
  const version = versions[versions.length - 1];
  if (!version) throw Object.assign(new Error('No document version found'), { status: 404 });
  return {
    doc,
    policy,
    bytes: vault.getDecryptedOriginal(version.objectKey, version.wrappedDekRef)
  };
}

function processedTitle(source: DbDocument, suffix: string): string {
  const base = source.title.replace(/\.pdf$/i, '').slice(0, 220);
  return `${base} — ${suffix}.pdf`;
}

function createProcessedCopy(
  req: AuthenticatedRequest,
  source: DbDocument,
  sourcePolicy: DbPolicy | undefined,
  bytes: Buffer,
  suffix: string,
  action: string
) {
  const doc = db.createDocument({
    organizationId: req.user!.organizationId,
    ownerUserId: req.user!.id,
    title: processedTitle(source, suffix),
    mimeDeclared: 'application/pdf',
    mimeDetected: 'application/pdf',
    sizeBytes: bytes.length,
    sha256Ciphertext: '',
    currentVersionId: null,
    status: 'active'
  });
  const stored = vault.storeDocument(doc.id, bytes, 'application/pdf');
  const version = db.createDocumentVersion({
    documentId: doc.id,
    objectKey: stored.objectKey,
    containerVersion: 1,
    wrappedDekRef: stored.wrappedDekRef,
    sizeBytes: bytes.length
  });
  const updated = db.updateDocument(doc.id, {
    currentVersionId: version.id,
    sha256Ciphertext: stored.sha256Ciphertext
  })!;
  db.createPolicy({
    organizationId: req.user!.organizationId,
    documentId: doc.id,
    version: 1,
    mode: sourcePolicy?.mode || 'SECURE_NATIVE',
    expiresAtUtc: sourcePolicy?.expiresAtUtc || null,
    maxOpens: sourcePolicy?.maxOpens || null,
    offlineLeaseSeconds: sourcePolicy?.offlineLeaseSeconds || 3000,
    allowExport: sourcePolicy?.allowExport || false,
    allowPrint: sourcePolicy?.allowPrint ?? true,
    watermarkTemplate: sourcePolicy?.watermarkTemplate || null,
    passwordHash: sourcePolicy?.passwordHash || null
  });
  db.recordAuditEvent({
    organizationId: req.user!.organizationId,
    actorUserId: req.user!.id,
    action,
    targetType: 'document',
    targetId: updated.id,
    ipHash: null,
    detailsRedacted: JSON.stringify({ sourceDocumentId: source.id })
  });
  return { ...updated, hasPassword: Boolean(sourcePolicy?.passwordHash) };
}

function sendToolError(res: Response, error: unknown) {
  const failure = error as Error & { status?: number; code?: string; requiresPassword?: boolean };
  const encryptedPdf = /encrypted|password/i.test(failure.message || '');
  return res.status(failure.status || (encryptedPdf ? 422 : 500)).json({
    error: failure.code || (encryptedPdf ? 'NATIVE_PDF_PASSWORD_UNSUPPORTED' : 'PDF_TOOL_FAILED'),
    message: encryptedPdf
      ? 'This PDF has native encryption that cannot be edited in the browser workflow. Upload an unlocked PDF first.'
      : failure.message || 'PDF operation failed',
    requiresPassword: failure.requiresPassword || false
  });
}

pdfToolsRouter.post('/sign', async (req: AuthenticatedRequest, res: Response) => {
  const schema = sourceSchema.extend({
    signerName: z.string().trim().min(2).max(80),
    reason: z.string().trim().max(120).optional(),
    pageNumber: z.number().int().positive().default(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  try {
    const source = loadSource(req, parsed.data.documentId, parsed.data.password);
    const pdf = await PDFDocument.load(source.bytes);
    if (parsed.data.pageNumber > pdf.getPageCount()) return res.status(400).json({ error: 'Page number is outside this PDF' });
    const page = pdf.getPage(parsed.data.pageNumber - 1);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const boxWidth = Math.min(260, page.getWidth() - 48);
    const y = 32;
    page.drawRectangle({ x: 24, y, width: boxWidth, height: 58, color: rgb(0.96, 0.98, 1), borderColor: rgb(0.12, 0.45, 0.78), borderWidth: 1 });
    page.drawText(`Signed by ${parsed.data.signerName}`, { x: 36, y: y + 35, size: 11, font: bold, color: rgb(0.06, 0.16, 0.28) });
    page.drawText(parsed.data.reason || 'Approved in DocVault X', { x: 36, y: y + 19, size: 8, font, color: rgb(0.28, 0.36, 0.46) });
    page.drawText(new Date().toISOString(), { x: 36, y: y + 7, size: 7, font, color: rgb(0.42, 0.48, 0.57) });
    const output = Buffer.from(await pdf.save());
    const document = createProcessedCopy(req, source.doc, source.policy, output, 'Signed', 'PDF_SIGNED_COPY_CREATED');
    return res.status(201).json({ document });
  } catch (error) {
    return sendToolError(res, error);
  }
});

pdfToolsRouter.post('/redact', async (req: AuthenticatedRequest, res: Response) => {
  const rectangle = z.object({
    x: z.number().min(0), y: z.number().min(0), width: z.number().positive().max(2000), height: z.number().positive().max(2000)
  });
  const schema = sourceSchema.extend({
    pageNumber: z.number().int().positive(),
    rectangles: z.array(rectangle).min(1).max(20),
    label: z.string().trim().max(40).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  try {
    const source = loadSource(req, parsed.data.documentId, parsed.data.password);
    const pdf = await PDFDocument.load(source.bytes);
    if (parsed.data.pageNumber > pdf.getPageCount()) return res.status(400).json({ error: 'Page number is outside this PDF' });
    const page = pdf.getPage(parsed.data.pageNumber - 1);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    for (const rect of parsed.data.rectangles) {
      if (rect.x + rect.width > page.getWidth() || rect.y + rect.height > page.getHeight()) {
        return res.status(400).json({ error: 'A redaction area is outside the selected page' });
      }
      page.drawRectangle({ ...rect, color: rgb(0.03, 0.04, 0.06), opacity: 1 });
      if (parsed.data.label && rect.height >= 14) {
        page.drawText(parsed.data.label, { x: rect.x + 5, y: rect.y + Math.max(4, rect.height / 2 - 4), size: 8, font, color: rgb(1, 1, 1), maxWidth: Math.max(1, rect.width - 10) });
      }
    }
    const output = Buffer.from(await pdf.save({ useObjectStreams: false }));
    const document = createProcessedCopy(req, source.doc, source.policy, output, 'Redacted', 'PDF_REDACTED_COPY_CREATED');
    return res.status(201).json({ document, notice: 'Redaction areas were permanently drawn into the processed copy. Keep the source restricted for high-sensitivity workflows.' });
  } catch (error) {
    return sendToolError(res, error);
  }
});

pdfToolsRouter.post('/compare', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    leftDocumentId: z.string().uuid(), rightDocumentId: z.string().uuid(),
    leftPassword: z.string().max(128).optional(), rightPassword: z.string().max(128).optional()
  }).refine(value => value.leftDocumentId !== value.rightDocumentId, { message: 'Choose two different documents' });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  try {
    const left = loadSource(req, parsed.data.leftDocumentId, parsed.data.leftPassword);
    const right = loadSource(req, parsed.data.rightDocumentId, parsed.data.rightPassword);
    const [leftPdf, rightPdf] = await Promise.all([PDFDocument.load(left.bytes), PDFDocument.load(right.bytes)]);
    const maxPages = Math.max(leftPdf.getPageCount(), rightPdf.getPageCount());
    const changedPages: number[] = [];
    for (let index = 0; index < maxPages; index += 1) {
      const a = index < leftPdf.getPageCount() ? leftPdf.getPage(index) : null;
      const b = index < rightPdf.getPageCount() ? rightPdf.getPage(index) : null;
      if (!a || !b || a.getWidth() !== b.getWidth() || a.getHeight() !== b.getHeight()) changedPages.push(index + 1);
    }
    const leftHash = crypto.createHash('sha256').update(left.bytes).digest('hex');
    const rightHash = crypto.createHash('sha256').update(right.bytes).digest('hex');
    db.recordAuditEvent({ organizationId: req.user!.organizationId, actorUserId: req.user!.id, action: 'PDFS_COMPARED', targetType: 'document', targetId: left.doc.id, ipHash: null, detailsRedacted: JSON.stringify({ comparedWith: right.doc.id }) });
    return res.json({
      comparison: {
        identical: leftHash === rightHash,
        left: { id: left.doc.id, title: left.doc.title, pages: leftPdf.getPageCount(), sizeBytes: left.bytes.length },
        right: { id: right.doc.id, title: right.doc.title, pages: rightPdf.getPageCount(), sizeBytes: right.bytes.length },
        sizeDeltaBytes: right.bytes.length - left.bytes.length,
        pageCountDelta: rightPdf.getPageCount() - leftPdf.getPageCount(),
        pagesWithDimensionChanges: changedPages
      }
    });
  } catch (error) {
    return sendToolError(res, error);
  }
});

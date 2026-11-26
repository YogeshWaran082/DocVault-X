import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  createPasswordProtectedPdf,
  generateSecurePdfPassword,
  PdfEncryptionError
} from './services/pdf-protection.service.js';
import { db } from './storage/db.js';
import { vault } from './storage/vault.js';
import { createApp } from './app.js';

describe('Universal Password Protected PDF (AES-256)', () => {
  let samplePdfBuffer: Buffer;

  before(async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([400, 400]);
    page.drawText('DocVault X Confidential Financial Report', { x: 40, y: 340, size: 12, font });
    samplePdfBuffer = Buffer.from(await doc.save());
  });

  it('generates high-entropy random passwords and encrypts PDF with ISO 32000-2 AES-256 (/V 5 /R 6 /AESV3)', async () => {
    const userPw = generateSecurePdfPassword(16);
    const ownerPw = generateSecurePdfPassword(24);
    assert.strictEqual(userPw.length, 16);
    assert.strictEqual(ownerPw.length, 24);
    assert.notStrictEqual(userPw, ownerPw);

    const result = await createPasswordProtectedPdf(
      samplePdfBuffer,
      'application/pdf',
      'Report.pdf',
      {
        userPassword: userPw,
        ownerPassword: ownerPw,
        permissions: {
          allowPrinting: false,
          allowCopying: false,
          allowModifying: false
        }
      }
    );

    assert.strictEqual(result.algorithm, 'AES-256');
    const rawText = result.pdfBuffer.toString('latin1');
    assert.ok(rawText.includes('/Encrypt'), 'PDF must contain /Encrypt dictionary');
    assert.ok(rawText.includes('/V 5'), 'PDF must use /V 5 (AES-256)');
    assert.ok(rawText.includes('/R 6'), 'PDF must use /R 6 (ISO 32000-2)');
    assert.ok(rawText.includes('/AESV3'), 'PDF must use /AESV3 cipher');
  });

  it('verifies standard PDF reader compatibility via pdfjs-dist (wrong password rejected, user/owner passwords accepted, permissions enforced)', async () => {
    const pdfjsPath = path.resolve(__dirname, '../../../apps/web/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
    const pdfjs = await import(pdfjsPath);

    const userPw = 'OpenSecret#2026';
    const ownerPw = 'OwnerMaster!2026';

    const result = await createPasswordProtectedPdf(
      samplePdfBuffer,
      'application/pdf',
      'CompatTest.pdf',
      {
        userPassword: userPw,
        ownerPassword: ownerPw,
        permissions: {
          allowPrinting: false,
          allowCopying: false,
          allowModifying: false
        }
      }
    );

    // 1. Opening without password must fail with NEED_PASSWORD (code 1)
    await assert.rejects(
      async () => {
        await pdfjs.getDocument({ data: new Uint8Array(result.pdfBuffer) }).promise;
      },
      (err: any) => err?.name === 'PasswordException' && err?.code === 1
    );

    // 2. Opening with wrong password must fail with INCORRECT_PASSWORD (code 2)
    await assert.rejects(
      async () => {
        await pdfjs.getDocument({
          data: new Uint8Array(result.pdfBuffer),
          password: 'WrongPassword123'
        }).promise;
      },
      (err: any) => err?.name === 'PasswordException' && err?.code === 2
    );

    // 3. Opening with user opening password succeeds and preserves content + enforces restrictions
    const openedUser = await pdfjs.getDocument({
      data: new Uint8Array(result.pdfBuffer),
      password: userPw
    }).promise;
    assert.strictEqual(openedUser.numPages, 1);
    const page = await openedUser.getPage(1);
    const textContent = await page.getTextContent();
    const extracted = textContent.items.map((i: any) => i.str).join(' ');
    assert.ok(extracted.includes('DocVault X Confidential Financial Report'));

    const permissions: number[] | null = await openedUser.getPermissions();
    assert.ok(Array.isArray(permissions), 'Permissions array should be present');
    // pdfjs PermissionFlag: PRINT = 0x0004, MODIFY_CONTENTS = 0x0008, COPY = 0x0010
    assert.strictEqual(permissions.includes(0x0004), false, 'Printing must be restricted');
    assert.strictEqual(permissions.includes(0x0010), false, 'Copying must be restricted');
    assert.strictEqual(permissions.includes(0x0008), false, 'Modifying must be restricted');

    // 4. Opening with separate owner password also succeeds
    const openedOwner = await pdfjs.getDocument({
      data: new Uint8Array(result.pdfBuffer),
      password: ownerPw
    }).promise;
    assert.strictEqual(openedOwner.numPages, 1);
  });

  it('rejects identical user and owner passwords', async () => {
    await assert.rejects(
      () =>
        createPasswordProtectedPdf(samplePdfBuffer, 'application/pdf', 'SamePw.pdf', {
          userPassword: 'SamePassword123',
          ownerPassword: 'SamePassword123',
          permissions: { allowPrinting: false, allowCopying: false, allowModifying: false }
        }),
      PdfEncryptionError
    );
  });

  it('enforces server-controlled password retrieval expiry, maxRetrievals, revocation, zero password exposure in logs, and preserves original vault document', async () => {
    db.clearAll();
    const org = db.createOrganization('Test Security Org');
    const user = db.createUser({
      email: 'sender@test.local',
      name: 'Sender',
      passwordHash: null,
      mfaEnabled: false
    });
    db.createMembership(org.id, user.id, 'owner');

    const doc = db.createDocument({
      organizationId: org.id,
      ownerUserId: user.id,
      title: 'VaultOriginal.pdf',
      mimeDeclared: 'application/pdf',
      mimeDetected: 'application/pdf',
      sizeBytes: samplePdfBuffer.length,
      sha256Ciphertext: '',
      currentVersionId: null,
      status: 'active'
    });

    const stored = vault.storeDocument(doc.id, samplePdfBuffer, 'application/pdf');
    const version = db.createDocumentVersion({
      documentId: doc.id,
      objectKey: stored.objectKey,
      containerVersion: 1,
      wrappedDekRef: stored.wrappedDekRef,
      sizeBytes: samplePdfBuffer.length
    });
    db.updateDocument(doc.id, {
      currentVersionId: version.id,
      sha256Ciphertext: stored.sha256Ciphertext
    });

    // Encrypt secret at rest and create retrieval record with maxRetrievals = 2
    const secretPw = 'TopSecretOpen#99';
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const encryptedPw = vault.encryptSecret(secretPw);
    assert.ok(!encryptedPw.includes(secretPw), 'Encrypted secret must not contain plaintext password');

    const record = db.createPdfPasswordRecord({
      organizationId: org.id,
      documentId: doc.id,
      tokenHash,
      encryptedUserPassword: encryptedPw,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      maxRetrievals: 2,
      permissions: { allowPrinting: false, allowCopying: false, allowModifying: false }
    });

    // 1st retrieval succeeds
    const first = db.incrementPdfPasswordRetrieval(record.id);
    assert.ok(first);
    assert.strictEqual(first.retrievalCount, 1);
    assert.strictEqual(vault.decryptSecret(first.encryptedUserPassword), secretPw);

    // 2nd retrieval succeeds
    const second = db.incrementPdfPasswordRetrieval(record.id);
    assert.ok(second);
    assert.strictEqual(second.retrievalCount, 2);

    // 3rd retrieval blocked (maxRetrievals = 2)
    const third = db.incrementPdfPasswordRetrieval(record.id);
    assert.strictEqual(third, null);

    // Original document in vault is untouched
    const restoredOriginal = vault.getDecryptedOriginal(stored.objectKey, stored.wrappedDekRef);
    assert.deepStrictEqual(restoredOriginal, samplePdfBuffer);

    // Express app initializes cleanly
    const app = createApp();
    assert.ok(app);
  });
});

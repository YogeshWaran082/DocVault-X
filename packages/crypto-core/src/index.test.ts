import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as crypto from 'node:crypto';
import { DvxCryptoEngine } from './index.js';

describe('DvxCryptoEngine', () => {
  it('should roundtrip encrypt and decrypt binary data correctly', () => {
    const documentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const originalText = 'Highly confidential DocVault X classified payload. ' + 'A'.repeat(150000); // spans multiple chunks
    const plaintext = Buffer.from(originalText, 'utf8');
    const mimeType = 'application/pdf';

    const { dvxBinary, dek, sha256Ciphertext, metadata } = DvxCryptoEngine.encryptToDvx(
      plaintext,
      documentId,
      mimeType,
      undefined,
      64 * 1024
    );

    assert.ok(dvxBinary.length > plaintext.length);
    assert.strictEqual(metadata.documentId, documentId);
    assert.strictEqual(metadata.totalChunks, 3);
    assert.strictEqual(sha256Ciphertext.length, 64);

    const decrypted = DvxCryptoEngine.decryptDvx(dvxBinary, dek);
    assert.strictEqual(decrypted.plaintext.toString('utf8'), originalText);
    assert.strictEqual(decrypted.metadata.documentId, documentId);
  });

  it('should reject tampered ciphertext chunks', () => {
    const documentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const plaintext = Buffer.from('Sensitive financial figures', 'utf8');

    const { dvxBinary, dek } = DvxCryptoEngine.encryptToDvx(
      plaintext,
      documentId,
      'text/plain'
    );

    // Tamper with a byte near the end
    const tampered = Buffer.from(dvxBinary);
    const bytePos = tampered.length - 5;
    tampered[bytePos] = (tampered[bytePos] ?? 0) ^ 0xff;

    assert.throws(() => {
      DvxCryptoEngine.decryptDvx(tampered, dek);
    });
  });

  it('should wrap and unwrap DEK accurately', () => {
    const dek = DvxCryptoEngine.generateDek();
    const masterKey = crypto.randomBytes(32);

    const wrapped = DvxCryptoEngine.wrapKey(dek, masterKey);
    const unwrapped = DvxCryptoEngine.unwrapKey(wrapped, masterKey);

    assert.deepStrictEqual(unwrapped, dek);
  });

  it('should sign and verify policy/license payloads using Ed25519', () => {
    const { publicKey, privateKey } = DvxCryptoEngine.generateSigningKeyPair();
    const payload = JSON.stringify({ grantId: '123', expiresAt: '2026-12-31T23:59:59Z' });

    const signature = DvxCryptoEngine.signPayload(payload, privateKey);
    const isValid = DvxCryptoEngine.verifyPayloadSignature(payload, signature, publicKey);
    assert.strictEqual(isValid, true);

    const isTamperedValid = DvxCryptoEngine.verifyPayloadSignature(
      payload + 'tampered',
      signature,
      publicKey
    );
    assert.strictEqual(isTamperedValid, false);
  });
});

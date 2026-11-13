import * as crypto from 'node:crypto';

export const DVX_MAGIC = Buffer.from('DVX1', 'utf8');
export const DVX_VERSION = 1;
export const CIPHER_SUITE_AES_256_GCM = 1;
export const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64 KB

export interface DvxHeaderMetadata {
  documentId: string;
  version: number;
  mimeType: string;
  originalSizeBytes: number;
  totalChunks: number;
  chunkSize: number;
  createdAt: string;
}

export interface EncryptedContainer {
  dvxBinary: Buffer;
  dek: Buffer;
  sha256Ciphertext: string;
  metadata: DvxHeaderMetadata;
}

export class DvxCryptoEngine {
  /**
   * Generates a cryptographically secure 256-bit random Document Encryption Key (DEK).
   */
  static generateDek(): Buffer {
    return crypto.randomBytes(32);
  }

  /**
   * Encrypts plaintext binary buffer into a standardized .dvx container.
   */
  static encryptToDvx(
    plaintext: Buffer,
    documentId: string,
    mimeType: string,
    dek: Buffer = this.generateDek(),
    chunkSize: number = DEFAULT_CHUNK_SIZE
  ): EncryptedContainer {
    if (dek.length !== 32) {
      throw new Error('DEK must be exactly 32 bytes for AES-256-GCM');
    }

    const totalChunks = Math.ceil(plaintext.length / chunkSize) || 1;
    const metadata: DvxHeaderMetadata = {
      documentId,
      version: 1,
      mimeType,
      originalSizeBytes: plaintext.length,
      totalChunks,
      chunkSize,
      createdAt: new Date().toISOString()
    };

    const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
    const metadataLength = metadataBuffer.length;

    // Fixed header layout:
    // [0..3] Magic: "DVX1"
    // [4..5] Version: uint16BE (1)
    // [6..7] Cipher Suite: uint16BE (1)
    // [8..11] Metadata Length: uint32BE
    // [12..12+metadataLength-1] Metadata JSON
    const headerPrefix = Buffer.alloc(12);
    DVX_MAGIC.copy(headerPrefix, 0);
    headerPrefix.writeUInt16BE(DVX_VERSION, 4);
    headerPrefix.writeUInt16BE(CIPHER_SUITE_AES_256_GCM, 6);
    headerPrefix.writeUInt32BE(metadataLength, 8);

    // Random base IV (8 bytes)
    const baseNonce = crypto.randomBytes(8);

    const chunkBuffers: Buffer[] = [];

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      const start = chunkIdx * chunkSize;
      const end = Math.min(start + chunkSize, plaintext.length);
      const chunkPlaintext = plaintext.subarray(start, end);

      // Unique 12-byte IV per chunk: 8 bytes baseNonce + 4 bytes big-endian chunk index
      const iv = Buffer.alloc(12);
      baseNonce.copy(iv, 0);
      iv.writeUInt32BE(chunkIdx, 8);

      // Associated Authenticated Data (AAD): documentId:chunkIdx:totalChunks
      const aad = Buffer.from(`${documentId}:${chunkIdx}:${totalChunks}`, 'utf8');

      const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
      cipher.setAAD(aad);

      const encryptedChunk = Buffer.concat([cipher.update(chunkPlaintext), cipher.final()]);
      const authTag = cipher.getAuthTag(); // 16 bytes

      // Pack chunk: [4 bytes chunk ciphertext len] [encryptedChunk] [16 bytes auth tag]
      const chunkHeader = Buffer.alloc(4);
      chunkHeader.writeUInt32BE(encryptedChunk.length, 0);

      chunkBuffers.push(chunkHeader, encryptedChunk, authTag);
    }

    const dvxBinary = Buffer.concat([
      headerPrefix,
      metadataBuffer,
      baseNonce, // 8 bytes
      ...chunkBuffers
    ]);

    const sha256Ciphertext = crypto.createHash('sha256').update(dvxBinary).digest('hex');

    return {
      dvxBinary,
      dek,
      sha256Ciphertext,
      metadata
    };
  }

  /**
   * Decrypts a verified .dvx container buffer into original plaintext.
   */
  static decryptDvx(dvxBinary: Buffer, dek: Buffer): { plaintext: Buffer; metadata: DvxHeaderMetadata } {
    if (dvxBinary.length < 24) {
      throw new Error('Invalid container: buffer too small');
    }

    const magic = dvxBinary.subarray(0, 4);
    if (!magic.equals(DVX_MAGIC)) {
      throw new Error('Invalid container: magic mismatch (expected DVX1)');
    }

    const version = dvxBinary.readUInt16BE(4);
    if (version !== DVX_VERSION) {
      throw new Error(`Unsupported container version: ${version}`);
    }

    const cipherSuite = dvxBinary.readUInt16BE(6);
    if (cipherSuite !== CIPHER_SUITE_AES_256_GCM) {
      throw new Error(`Unsupported cipher suite: ${cipherSuite}`);
    }

    const metadataLength = dvxBinary.readUInt32BE(8);
    const metadataEnd = 12 + metadataLength;
    if (dvxBinary.length < metadataEnd + 8) {
      throw new Error('Invalid container: truncated header metadata');
    }

    const metadataBuffer = dvxBinary.subarray(12, metadataEnd);
    const metadata: DvxHeaderMetadata = JSON.parse(metadataBuffer.toString('utf8'));

    const baseNonce = dvxBinary.subarray(metadataEnd, metadataEnd + 8);
    let offset = metadataEnd + 8;

    const plaintextChunks: Buffer[] = [];

    for (let chunkIdx = 0; chunkIdx < metadata.totalChunks; chunkIdx++) {
      if (offset + 4 > dvxBinary.length) {
        throw new Error(`Invalid container: truncated chunk ${chunkIdx} header`);
      }

      const chunkCipherLen = dvxBinary.readUInt32BE(offset);
      offset += 4;

      if (offset + chunkCipherLen + 16 > dvxBinary.length) {
        throw new Error(`Invalid container: truncated chunk ${chunkIdx} payload or auth tag`);
      }

      const encryptedChunk = dvxBinary.subarray(offset, offset + chunkCipherLen);
      offset += chunkCipherLen;

      const authTag = dvxBinary.subarray(offset, offset + 16);
      offset += 16;

      const iv = Buffer.alloc(12);
      baseNonce.copy(iv, 0);
      iv.writeUInt32BE(chunkIdx, 8);

      const aad = Buffer.from(`${metadata.documentId}:${chunkIdx}:${metadata.totalChunks}`, 'utf8');

      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
      decipher.setAAD(aad);
      decipher.setAuthTag(authTag);

      const chunkPlaintext = Buffer.concat([decipher.update(encryptedChunk), decipher.final()]);
      plaintextChunks.push(chunkPlaintext);
    }

    return {
      plaintext: Buffer.concat(plaintextChunks),
      metadata
    };
  }

  /**
   * Key Wrapping: wraps DEK using Master / KMS Key using AES-256-KW or AES-256-GCM.
   */
  static wrapKey(keyToWrap: Buffer, wrappingKey: Buffer): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', wrappingKey, iv);
    const wrapped = Buffer.concat([cipher.update(keyToWrap), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, wrapped]).toString('base64');
  }

  /**
   * Key Unwrapping: unwraps DEK using Master / KMS Key.
   */
  static unwrapKey(wrappedB64: string, wrappingKey: Buffer): Buffer {
    const data = Buffer.from(wrappedB64, 'base64');
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const ciphertext = data.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', wrappingKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * Generates an Ed25519 signing keypair for signing licenses and policies.
   */
  static generateSigningKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }

  /**
   * Signs payload with Ed25519 private key.
   */
  static signPayload(payload: string, privateKeyPem: string): string {
    return crypto.sign(null, Buffer.from(payload, 'utf8'), privateKeyPem).toString('base64');
  }

  /**
   * Verifies payload signature with Ed25519 public key.
   */
  static verifyPayloadSignature(payload: string, signatureB64: string, publicKeyPem: string): boolean {
    return crypto.verify(null, Buffer.from(payload, 'utf8'), publicKeyPem, Buffer.from(signatureB64, 'base64'));
  }
}

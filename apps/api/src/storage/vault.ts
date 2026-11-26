import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { DvxCryptoEngine, EncryptedContainer } from '@docvault/crypto-core';

function getDataDirectory(): string {
  if (process.env['DATA_DIR']) {
    return process.env['DATA_DIR'];
  }
  if (process.env['VERCEL']) {
    return '/tmp/docvault_data';
  }
  return path.join(process.cwd(), 'data');
}

export class EncryptedVaultStorage {
  private baseDir: string;
  private masterKmsKey: Buffer;

  constructor(vaultDir?: string) {
    this.baseDir = vaultDir || path.join(getDataDirectory(), 'vault');
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch {
      // Safe fallback if directory creation fails
    }

    // Master Key loaded from environment or persistent secret
    const envKey = process.env['DOCVAULT_MASTER_KEY'];
    if (envKey) {
      this.masterKmsKey = Buffer.from(envKey, 'hex');
    } else {
      // Deterministic fallback for dev / test
      this.masterKmsKey = crypto.createHash('sha256').update('docvault-x-default-kms-dev-key').digest();
    }
  }

  /**
   * Stores raw plaintext file by encrypting it directly into a .dvx container.
   */
  public storeDocument(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string
  ): {
    objectKey: string;
    sha256Ciphertext: string;
    wrappedDekRef: string;
    encryptedContainer: EncryptedContainer;
  } {
    const dek = DvxCryptoEngine.generateDek();
    const encrypted = DvxCryptoEngine.encryptToDvx(fileBuffer, documentId, mimeType, dek);

    const objectKey = `${documentId}/v1.dvx`;
    const targetPath = path.join(this.baseDir, objectKey);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, encrypted.dvxBinary);

    // Wrap the DEK with master KMS key
    const wrappedDekRef = DvxCryptoEngine.wrapKey(dek, this.masterKmsKey);

    return {
      objectKey,
      sha256Ciphertext: encrypted.sha256Ciphertext,
      wrappedDekRef,
      encryptedContainer: encrypted
    };
  }

  /**
   * Retrieves the raw encrypted .dvx binary from storage.
   */
  public getDvxBinary(objectKey: string): Buffer {
    const targetPath = path.join(this.baseDir, objectKey);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File not found in storage: ${objectKey}`);
    }
    return fs.readFileSync(targetPath);
  }

  /**
   * Unwraps the DEK using master KMS key.
   */
  public unwrapDek(wrappedDekRef: string): Buffer {
    return DvxCryptoEngine.unwrapKey(wrappedDekRef, this.masterKmsKey);
  }

  /**
   * Decrypts and retrieves the original plaintext (used only for Mode A export with explicit audit).
   */
  public getDecryptedOriginal(objectKey: string, wrappedDekRef: string): Buffer {
    const dvxBinary = this.getDvxBinary(objectKey);
    const dek = this.unwrapDek(wrappedDekRef);
    const { plaintext } = DvxCryptoEngine.decryptDvx(dvxBinary, dek);
    return plaintext;
  }

  /**
   * Encrypts a UTF-8 secret (e.g. a PDF opening password) at rest using AES-256-GCM
   * keyed by the vault master KMS key.
   */
  public encryptSecret(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKmsKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  /**
   * Decrypts a UTF-8 secret previously encrypted with encryptSecret().
   */
  public decryptSecret(ciphertext: string): string {
    const parts = ciphertext.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted secret format');
    }
    const [ivB64, tagB64, dataB64] = parts as [string, string, string];
    const iv = Buffer.from(ivB64, 'base64url');
    const authTag = Buffer.from(tagB64, 'base64url');
    const data = Buffer.from(dataB64, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKmsKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  }

  /**
   * Securely deletes the ciphertext from storage.
   */
  public deleteObject(objectKey: string): void {
    const targetPath = path.join(this.baseDir, objectKey);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }
}

export const vault = new EncryptedVaultStorage();

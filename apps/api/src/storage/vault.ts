import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { DvxCryptoEngine, EncryptedContainer } from '@docvault/crypto-core';

export class EncryptedVaultStorage {
  private baseDir: string;
  private masterKmsKey: Buffer;

  constructor(vaultDir?: string) {
    this.baseDir = vaultDir || path.join(process.cwd(), 'data', 'vault');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
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

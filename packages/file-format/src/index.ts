import { DvxCryptoEngine, DvxHeaderMetadata, DVX_MAGIC, DVX_VERSION } from '@docvault/crypto-core';

export interface DvxContainerInspection {
  isValid: boolean;
  version?: number;
  cipherSuite?: number;
  metadata?: DvxHeaderMetadata;
  sha256Ciphertext?: string;
  error?: string;
}

export class DvxContainerParser {
  /**
   * Fast header and container inspection without full chunk decryption.
   */
  static inspect(dvxBinary: Buffer): DvxContainerInspection {
    if (dvxBinary.length < 24) {
      return { isValid: false, error: 'Container size below minimum threshold' };
    }

    const magic = dvxBinary.subarray(0, 4);
    if (!magic.equals(DVX_MAGIC)) {
      return { isValid: false, error: 'Invalid magic signature. Expected DVX1' };
    }

    const version = dvxBinary.readUInt16BE(4);
    if (version !== DVX_VERSION) {
      return { isValid: false, version, error: `Unsupported DVX version ${version}` };
    }

    const cipherSuite = dvxBinary.readUInt16BE(6);
    const metadataLength = dvxBinary.readUInt32BE(8);

    if (dvxBinary.length < 12 + metadataLength) {
      return { isValid: false, version, cipherSuite, error: 'Truncated metadata header' };
    }

    try {
      const metadataJson = dvxBinary.subarray(12, 12 + metadataLength).toString('utf8');
      const metadata: DvxHeaderMetadata = JSON.parse(metadataJson);
      return {
        isValid: true,
        version,
        cipherSuite,
        metadata
      };
    } catch {
      return { isValid: false, error: 'Malformed metadata JSON payload' };
    }
  }

  /**
   * Encodes a standard file into a .dvx container.
   */
  static encode(
    fileBuffer: Buffer,
    documentId: string,
    mimeType: string,
    dek?: Buffer
  ) {
    return DvxCryptoEngine.encryptToDvx(fileBuffer, documentId, mimeType, dek);
  }

  /**
   * Decodes a .dvx container back to original file content.
   */
  static decode(dvxBinary: Buffer, dek: Buffer) {
    return DvxCryptoEngine.decryptDvx(dvxBinary, dek);
  }
}

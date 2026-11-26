import * as crypto from 'node:crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { encryptPDF, AlreadyEncryptedError, PasswordEncodingError } from '@pdfsmaller/pdf-encrypt';

export interface PdfPermissionsOptions {
  allowPrinting: boolean;
  allowCopying: boolean;
  allowModifying: boolean;
}

export interface ProtectPdfOptions {
  userPassword: string;
  ownerPassword: string;
  permissions: PdfPermissionsOptions;
}

export interface ProtectPdfResult {
  pdfBuffer: Buffer;
  algorithm: 'AES-256';
  permissions: PdfPermissionsOptions;
}

const PASSWORD_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_';

/**
 * Generates a cryptographically secure random password suitable for PDF AES-256 (SASLprep-safe ASCII).
 */
export function generateSecurePdfPassword(length = 16): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARSET[bytes[i]! % PASSWORD_CHARSET.length];
  }
  return out;
}

/**
 * Converts supported non-PDF formats (PNG, JPEG, plain text) into a standard PDF buffer
 * so Universal Password Protected PDF works seamlessly across supported vault uploads.
 */
async function ensurePdfBytes(sourceBuffer: Buffer, mimeType: string, title: string): Promise<Uint8Array> {
  const isPdfHeader = sourceBuffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (mimeType === 'application/pdf' || isPdfHeader) {
    return new Uint8Array(sourceBuffer);
  }

  if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    const pdfDoc = await PDFDocument.create();
    const image =
      mimeType === 'image/png'
        ? await pdfDoc.embedPng(sourceBuffer)
        : await pdfDoc.embedJpg(sourceBuffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    return pdfDoc.save();
  }

  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  ) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(title);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const lineHeight = 14;
    const margin = 48;
    const pageWidth = 612;
    const pageHeight = 792;
    const maxCharsPerLine = 88;

    const rawText = sourceBuffer.toString('utf8').replace(/\r\n/g, '\n');
    const wrappedLines: string[] = [];
    for (const rawLine of rawText.split('\n')) {
      if (rawLine.length <= maxCharsPerLine) {
        wrappedLines.push(rawLine);
      } else {
        for (let i = 0; i < rawLine.length; i += maxCharsPerLine) {
          wrappedLines.push(rawLine.slice(i, i + maxCharsPerLine));
        }
      }
    }

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;
    for (const line of wrappedLines) {
      if (y < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      // Replace non-WinAnsi characters safely so StandardFonts.Helvetica never throws
      const safeLine = line.replace(/[^\x20-\x7E]/g, '?');
      page.drawText(safeLine, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1)
      });
      y -= lineHeight;
    }

    return pdfDoc.save();
  }

  throw new UnsupportedPdfConversionError(
    `Format "${mimeType}" cannot be converted to a password-protected PDF. Upload a PDF, PNG, JPEG, or text document.`
  );
}

export class UnsupportedPdfConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedPdfConversionError';
  }
}

export class PdfEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfEncryptionError';
  }
}

/**
 * Encrypts a document into a standard ISO 32000-2 / PDF 2.0 AES-256 (/V 5 /R 6 /AESV3)
 * password-protected PDF with separate user opening password, owner permission password,
 * and standard PDF reader permission flags.
 */
export async function createPasswordProtectedPdf(
  sourceBuffer: Buffer,
  mimeType: string,
  title: string,
  options: ProtectPdfOptions
): Promise<ProtectPdfResult> {
  if (!options.userPassword || options.userPassword.length < 4) {
    throw new PdfEncryptionError('Document opening password must be at least 4 characters.');
  }
  if (!options.ownerPassword || options.ownerPassword.length < 4) {
    throw new PdfEncryptionError('Owner permission password must be at least 4 characters.');
  }
  if (options.userPassword === options.ownerPassword) {
    throw new PdfEncryptionError('Owner permission password must be different from the document opening password.');
  }

  const pdfBytes = await ensurePdfBytes(sourceBuffer, mimeType, title);

  try {
    const encryptedBytes = await encryptPDF(pdfBytes, options.userPassword, {
      ownerPassword: options.ownerPassword,
      algorithm: 'AES-256',
      allowPrinting: options.permissions.allowPrinting,
      allowHighQualityPrint: options.permissions.allowPrinting,
      allowCopying: options.permissions.allowCopying,
      allowExtraction: options.permissions.allowCopying,
      allowModifying: options.permissions.allowModifying,
      allowAnnotating: options.permissions.allowModifying,
      allowFillingForms: options.permissions.allowModifying,
      allowAssembly: options.permissions.allowModifying
    });

    return {
      pdfBuffer: Buffer.from(encryptedBytes),
      algorithm: 'AES-256',
      permissions: options.permissions
    };
  } catch (err) {
    if (err instanceof AlreadyEncryptedError) {
      throw new PdfEncryptionError('The uploaded PDF is already encrypted and cannot be re-encrypted.');
    }
    if (err instanceof PasswordEncodingError) {
      throw new PdfEncryptionError(`Invalid password character: ${err.message}`);
    }
    throw err;
  }
}

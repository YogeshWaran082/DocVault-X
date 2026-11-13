import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { DvxContainerParser } from './index.js';

describe('DvxContainerParser', () => {
  it('correctly inspects and parses valid .dvx container header', () => {
    const docId = '11111111-2222-3333-4444-555555555555';
    const sampleContent = Buffer.from('DocVault X Sample Document Content', 'utf8');

    const encoded = DvxContainerParser.encode(sampleContent, docId, 'text/plain');
    const inspection = DvxContainerParser.inspect(encoded.dvxBinary);

    assert.strictEqual(inspection.isValid, true);
    assert.strictEqual(inspection.version, 1);
    assert.strictEqual(inspection.metadata?.documentId, docId);
    assert.strictEqual(inspection.metadata?.mimeType, 'text/plain');
    assert.strictEqual(inspection.metadata?.originalSizeBytes, sampleContent.length);

    const decoded = DvxContainerParser.decode(encoded.dvxBinary, encoded.dek);
    assert.strictEqual(decoded.plaintext.toString('utf8'), sampleContent.toString('utf8'));
  });

  it('rejects invalid or non-DVX binary', () => {
    const bogus = Buffer.from('RANDOM_CORRUPT_BYTES_XYZ_1234567890', 'utf8');
    const inspection = DvxContainerParser.inspect(bogus);
    assert.strictEqual(inspection.isValid, false);
    assert.match(inspection.error || '', /Invalid magic signature/);
  });
});

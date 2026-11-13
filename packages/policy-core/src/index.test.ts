import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { PolicyEngine, PolicyEvaluationInput } from './index.js';

describe('PolicyEngine', () => {
  const now = new Date('2026-11-12T12:00:00Z');

  it('permits access when within valid lease and limits', () => {
    const input: PolicyEvaluationInput = {
      currentTimeUtc: now,
      lastPersistedHighWaterMarkUtc: new Date('2026-11-12T11:59:00Z'),
      licenseNotBeforeUtc: new Date('2026-11-12T10:00:00Z'),
      licenseLeaseExpiresUtc: new Date('2026-11-13T12:00:00Z'), // 24h
      documentAbsoluteExpiryUtc: new Date('2026-11-15T00:00:00Z'),
      maxOpens: 5,
      currentOpenCount: 2,
      isRevoked: false
    };

    const result = PolicyEngine.evaluate(input);
    assert.strictEqual(result.isPermitted, true);
    assert.strictEqual(result.remainingLeaseSeconds, 86400);
    assert.strictEqual(result.isClockRollbackDetected, false);
  });

  it('detects clock rollback when currentTime is earlier than persisted high-water mark', () => {
    const input: PolicyEvaluationInput = {
      currentTimeUtc: new Date('2026-11-12T08:00:00Z'), // Rolled back 4 hours
      lastPersistedHighWaterMarkUtc: new Date('2026-11-12T12:00:00Z'),
      licenseNotBeforeUtc: new Date('2026-11-12T00:00:00Z'),
      licenseLeaseExpiresUtc: new Date('2026-11-13T00:00:00Z'),
      currentOpenCount: 1,
      isRevoked: false
    };

    const result = PolicyEngine.evaluate(input);
    assert.strictEqual(result.isPermitted, false);
    assert.strictEqual(result.isClockRollbackDetected, true);
    assert.match(result.reason || '', /CLOCK_ROLLBACK_DETECTED/);
  });

  it('denies access if expired', () => {
    const input: PolicyEvaluationInput = {
      currentTimeUtc: new Date('2026-11-14T00:00:00Z'),
      licenseNotBeforeUtc: new Date('2026-11-12T00:00:00Z'),
      licenseLeaseExpiresUtc: new Date('2026-11-13T00:00:00Z'), // Expired yesterday
      currentOpenCount: 1,
      isRevoked: false
    };

    const result = PolicyEngine.evaluate(input);
    assert.strictEqual(result.isPermitted, false);
    assert.match(result.reason || '', /EXPIRED/);
  });

  it('denies access if revoked', () => {
    const input: PolicyEvaluationInput = {
      currentTimeUtc: now,
      licenseNotBeforeUtc: new Date('2026-11-12T00:00:00Z'),
      licenseLeaseExpiresUtc: new Date('2026-11-13T00:00:00Z'),
      currentOpenCount: 1,
      isRevoked: true
    };

    const result = PolicyEngine.evaluate(input);
    assert.strictEqual(result.isPermitted, false);
    assert.match(result.reason || '', /REVOKED/);
  });

  it('denies access if max opens exceeded', () => {
    const input: PolicyEvaluationInput = {
      currentTimeUtc: now,
      licenseNotBeforeUtc: new Date('2026-11-12T00:00:00Z'),
      licenseLeaseExpiresUtc: new Date('2026-11-13T00:00:00Z'),
      maxOpens: 3,
      currentOpenCount: 3,
      isRevoked: false
    };

    const result = PolicyEngine.evaluate(input);
    assert.strictEqual(result.isPermitted, false);
    assert.match(result.reason || '', /MAX_OPENS_EXCEEDED/);
  });
});

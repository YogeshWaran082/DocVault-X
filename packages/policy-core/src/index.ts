export interface PolicyEvaluationInput {
  currentTimeUtc: Date;
  lastPersistedHighWaterMarkUtc?: Date;
  documentAbsoluteExpiryUtc?: Date | null;
  licenseLeaseExpiresUtc: Date;
  licenseNotBeforeUtc: Date;
  maxOpens?: number | null;
  currentOpenCount: number;
  isRevoked: boolean;
}

export interface PolicyEvaluationResult {
  isPermitted: boolean;
  reason?: string;
  effectiveDeadlineUtc?: Date;
  remainingLeaseSeconds?: number;
  isClockRollbackDetected: boolean;
}

export class PolicyEngine {
  /**
   * Evaluates access permission based on non-negotiable security invariants and offline lease rules.
   */
  static evaluate(input: PolicyEvaluationInput): PolicyEvaluationResult {
    if (input.isRevoked) {
      return {
        isPermitted: false,
        reason: 'REVOKED: Access has been revoked by the document owner or administrator.',
        isClockRollbackDetected: false
      };
    }

    // Check monotonic clock high-water mark to detect clock rollback attacks
    let isClockRollbackDetected = false;
    if (input.lastPersistedHighWaterMarkUtc) {
      if (input.currentTimeUtc.getTime() < input.lastPersistedHighWaterMarkUtc.getTime() - 60000) { // 1 min grace for minor jitter
        isClockRollbackDetected = true;
        return {
          isPermitted: false,
          reason: 'CLOCK_ROLLBACK_DETECTED: Local system clock appears to have been set backwards.',
          isClockRollbackDetected: true
        };
      }
    }

    // Check not_before
    if (input.currentTimeUtc.getTime() < input.licenseNotBeforeUtc.getTime()) {
      return {
        isPermitted: false,
        reason: 'NOT_YET_VALID: License is not valid yet.',
        isClockRollbackDetected
      };
    }

    // Check max opens
    if (input.maxOpens !== undefined && input.maxOpens !== null) {
      if (input.currentOpenCount >= input.maxOpens) {
        return {
          isPermitted: false,
          reason: 'MAX_OPENS_EXCEEDED: Document has reached maximum permitted views.',
          isClockRollbackDetected
        };
      }
    }

    // Calculate effective deadline: min(document_absolute_expiry, license_lease_expiry)
    let effectiveDeadline = input.licenseLeaseExpiresUtc;
    if (input.documentAbsoluteExpiryUtc && input.documentAbsoluteExpiryUtc < effectiveDeadline) {
      effectiveDeadline = input.documentAbsoluteExpiryUtc;
    }

    if (input.currentTimeUtc.getTime() >= effectiveDeadline.getTime()) {
      return {
        isPermitted: false,
        reason: 'EXPIRED: License lease or document access duration has expired.',
        effectiveDeadlineUtc: effectiveDeadline,
        remainingLeaseSeconds: 0,
        isClockRollbackDetected
      };
    }

    const remainingLeaseSeconds = Math.max(
      0,
      Math.floor((effectiveDeadline.getTime() - input.currentTimeUtc.getTime()) / 1000)
    );

    return {
      isPermitted: true,
      effectiveDeadlineUtc: effectiveDeadline,
      remainingLeaseSeconds,
      isClockRollbackDetected: false
    };
  }
}

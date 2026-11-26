import { z } from 'zod';

export const IssueLicenseRequestSchema = z.object({
  grantId: z.string().uuid(),
  deviceId: z.string().uuid()
});
export type IssueLicenseRequest = z.infer<typeof IssueLicenseRequestSchema>;

export const LicenseResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  grantId: z.string().uuid(),
  deviceId: z.string().uuid(),
  policyVersion: z.number(),
  issuedAt: z.string().datetime(),
  notBefore: z.string().datetime(),
  expiresAt: z.string().datetime(),
  leaseExpiresAt: z.string().datetime(),
  licenseJti: z.string(),
  signedPayload: z.string(),
  wrappedDek: z.string()
});
export type LicenseResponse = z.infer<typeof LicenseResponseSchema>;

export const ValidateLicenseRequestSchema = z.object({
  licenseJti: z.string(),
  deviceId: z.string().uuid().optional(),
  currentClientTimeUtc: z.string().datetime().optional()
});
export type ValidateLicenseRequest = z.infer<typeof ValidateLicenseRequestSchema>;

export const ValidateLicenseResponseSchema = z.object({
  isValid: z.boolean(),
  reason: z.string().optional(),
  isExpired: z.boolean(),
  isRevoked: z.boolean(),
  remainingSeconds: z.number().optional(),
  effectiveDeadlineUtc: z.string().datetime().optional()
});
export type ValidateLicenseResponse = z.infer<typeof ValidateLicenseResponseSchema>;


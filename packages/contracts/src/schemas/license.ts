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

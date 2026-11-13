import { z } from 'zod';

export const PlatformSchema = z.enum([
  'windows',
  'macos',
  'android',
  'ios',
  'web_pwa'
]);
export type Platform = z.infer<typeof PlatformSchema>;

export const EnrollDeviceChallengeRequestSchema = z.object({
  platform: PlatformSchema
});
export type EnrollDeviceChallengeRequest = z.infer<typeof EnrollDeviceChallengeRequestSchema>;

export const EnrollDeviceCompleteRequestSchema = z.object({
  challenge: z.string(),
  devicePublicKey: z.string(),
  signature: z.string(),
  platform: PlatformSchema
});
export type EnrollDeviceCompleteRequest = z.infer<typeof EnrollDeviceCompleteRequestSchema>;

export const DeviceResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  devicePublicKey: z.string(),
  platform: PlatformSchema,
  attestationStatus: z.string(),
  enrolledAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable().optional()
});
export type DeviceResponse = z.infer<typeof DeviceResponseSchema>;

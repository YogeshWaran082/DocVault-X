import { z } from 'zod';

export const ProtectionModeSchema = z.enum([
  'NORMAL_EXPORT',
  'SECURE_NATIVE',
  'OFFLINE_PWA'
]);
export type ProtectionMode = z.infer<typeof ProtectionModeSchema>;

export const CreatePolicyRequestSchema = z.object({
  mode: ProtectionModeSchema.default('SECURE_NATIVE'),
  expiresAtUtc: z.string().datetime().nullable().optional(),
  maxOpens: z.number().int().positive().nullable().optional(),
  offlineLeaseSeconds: z.number().int().min(60).max(60 * 60 * 24 * 30).default(86400), // Default 24 hrs
  allowExport: z.boolean().default(false),
  allowPrint: z.boolean().default(false),
  watermarkTemplate: z.string().max(255).nullable().optional(),
  password: z.string().min(6).max(128).nullable().optional()
});
export type CreatePolicyRequest = z.infer<typeof CreatePolicyRequestSchema>;

export const PolicyResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  documentId: z.string().uuid(),
  version: z.number().int(),
  mode: ProtectionModeSchema,
  expiresAtUtc: z.string().datetime().nullable(),
  maxOpens: z.number().int().nullable(),
  offlineLeaseSeconds: z.number().int(),
  allowExport: z.boolean(),
  allowPrint: z.boolean(),
  watermarkTemplate: z.string().nullable(),
  hasPassword: z.boolean().optional(),
  createdAt: z.string().datetime(),
  supersededAt: z.string().datetime().nullable()
});
export type PolicyResponse = z.infer<typeof PolicyResponseSchema>;

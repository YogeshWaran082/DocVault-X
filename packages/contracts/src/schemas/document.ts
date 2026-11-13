import { z } from 'zod';

export const DocumentStatusSchema = z.enum([
  'active',
  'revoked',
  'deleted',
  'quarantined'
]);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

export const InitiateUploadRequestSchema = z.object({
  title: z.string().min(1).max(255),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  sizeBytes: z.number().int().positive().max(1024 * 1024 * 500) // 500MB max default
});
export type InitiateUploadRequest = z.infer<typeof InitiateUploadRequestSchema>;

export const InitiateUploadResponseSchema = z.object({
  uploadId: z.string().uuid(),
  objectKey: z.string(),
  uploadUrl: z.string()
});
export type InitiateUploadResponse = z.infer<typeof InitiateUploadResponseSchema>;

export const CompleteUploadRequestSchema = z.object({
  uploadId: z.string().uuid(),
  sha256Ciphertext: z.string().length(64),
  wrappedDekRef: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  containerVersion: z.number().int().default(1)
});
export type CompleteUploadRequest = z.infer<typeof CompleteUploadRequestSchema>;

export const DocumentResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  title: z.string(),
  mimeDeclared: z.string(),
  mimeDetected: z.string(),
  sizeBytes: z.number(),
  sha256Ciphertext: z.string(),
  currentVersionId: z.string().uuid().nullable().optional(),
  status: DocumentStatusSchema,
  createdAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional()
});
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;

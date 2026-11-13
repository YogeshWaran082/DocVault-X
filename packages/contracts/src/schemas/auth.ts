import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'owner',
  'admin',
  'sender',
  'recipient',
  'auditor'
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
  organizationName: z.string().min(2).max(100).optional()
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1)
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    mfaEnabled: z.boolean()
  }),
  organization: z.object({
    id: z.string().uuid(),
    name: z.string(),
    role: UserRoleSchema
  }),
  accessToken: z.string(),
  refreshToken: z.string()
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

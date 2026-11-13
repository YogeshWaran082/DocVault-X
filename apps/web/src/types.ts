export interface User {
  id: string;
  email: string;
  name: string;
  mfaEnabled: boolean;
}

export interface Organization {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'sender' | 'recipient' | 'auditor';
}

export interface Document {
  id: string;
  organizationId: string;
  ownerUserId: string;
  title: string;
  mimeDeclared: string;
  mimeDetected: string;
  sizeBytes: number;
  sha256Ciphertext: string;
  currentVersionId?: string | null;
  status: 'active' | 'revoked' | 'deleted' | 'quarantined';
  createdAt: string;
  deletedAt?: string | null;
}

export interface Policy {
  id: string;
  organizationId: string;
  documentId: string;
  version: number;
  mode: 'NORMAL_EXPORT' | 'SECURE_NATIVE' | 'OFFLINE_PWA';
  expiresAtUtc: string | null;
  maxOpens: number | null;
  offlineLeaseSeconds: number;
  allowExport: boolean;
  allowPrint: boolean;
  watermarkTemplate: string | null;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  detailsRedacted: string | null;
}

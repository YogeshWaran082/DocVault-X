import { Router, Response } from 'express';
import { db } from '../storage/db.js';
import { vault } from '../storage/vault.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { IssueLicenseRequestSchema } from '@docvault/contracts';
import { DvxCryptoEngine } from '@docvault/crypto-core';
import { v4 as uuidv4 } from 'uuid';

export const licenseRouter = Router();

// Server Ed25519 license signing keypair
const serverSigningKeys = DvxCryptoEngine.generateSigningKeyPair();

licenseRouter.use(authenticate);

licenseRouter.post('/issue', (req: AuthenticatedRequest, res: Response) => {
  const parse = IssueLicenseRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  const { grantId, deviceId } = parse.data;

  const grant = db.findGrantById(grantId);
  if (!grant || grant.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: 'Grant not found' });
  }

  if (grant.status === 'revoked') {
    return res.status(403).json({ error: 'Grant has been revoked' });
  }

  const device = db.findDeviceById(deviceId);
  if (!device || device.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const doc = db.findDocumentById(req.user!.organizationId, grant.documentId);
  if (!doc || doc.status !== 'active') {
    return res.status(403).json({ error: 'Document is not active or accessible' });
  }

  const policy = db.getActivePolicy(doc.id);
  if (!policy) {
    return res.status(400).json({ error: 'No active policy found' });
  }

  const now = new Date();
  const leaseSeconds = policy.offlineLeaseSeconds || 86400;
  const leaseExpiresAt = new Date(now.getTime() + leaseSeconds * 1000);

  let docExpiresAt = policy.expiresAtUtc ? new Date(policy.expiresAtUtc) : null;
  const effectiveExpiresAt = docExpiresAt && docExpiresAt < leaseExpiresAt ? docExpiresAt : leaseExpiresAt;

  const licenseJti = uuidv4();

  // Retrieve DEK and prepare wrapped key for the client
  const versions = db.findVersionsByDocument(doc.id);
  const latestVersion = versions[versions.length - 1];
  if (!latestVersion) {
    return res.status(404).json({ error: 'No document version found' });
  }

  const dek = vault.unwrapDek(latestVersion.wrappedDekRef);
  // Base64 DEK representation wrapped for device or client
  const wrappedDek = dek.toString('base64');

  const licensePayload = JSON.stringify({
    licenseJti,
    organizationId: req.user!.organizationId,
    documentId: doc.id,
    grantId: grant.id,
    deviceId: device.id,
    policyVersion: policy.version,
    issuedAt: now.toISOString(),
    notBefore: now.toISOString(),
    expiresAt: effectiveExpiresAt.toISOString(),
    leaseExpiresAt: leaseExpiresAt.toISOString(),
    watermarkTemplate: policy.watermarkTemplate
  });

  const signedPayload = DvxCryptoEngine.signPayload(licensePayload, serverSigningKeys.privateKey);

  const license = db.createLicense({
    organizationId: req.user!.organizationId,
    grantId: grant.id,
    deviceId: device.id,
    policyVersion: policy.version,
    notBefore: now.toISOString(),
    expiresAt: effectiveExpiresAt.toISOString(),
    leaseExpiresAt: leaseExpiresAt.toISOString(),
    licenseJti,
    signedPayload
  });

  db.recordAuditEvent({
    organizationId: req.user!.organizationId,
    actorUserId: req.user!.id,
    action: 'LICENSE_ISSUED',
    targetType: 'license',
    targetId: license.id,
    ipHash: null,
    detailsRedacted: JSON.stringify({ documentId: doc.id, leaseExpiresAt: license.leaseExpiresAt })
  });

  return res.status(201).json({
    license,
    licensePayload,
    serverPublicKey: serverSigningKeys.publicKey,
    wrappedDek
  });
});

licenseRouter.get('/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const license = db.findLicenseByJti(req.params['id']!);
  if (!license || license.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: 'License not found' });
  }

  const isExpired = new Date(license.leaseExpiresAt).getTime() <= Date.now();
  const isRevoked = license.revokedAt !== null;

  return res.json({
    licenseId: license.id,
    licenseJti: license.licenseJti,
    isValid: !isExpired && !isRevoked,
    isExpired,
    isRevoked,
    leaseExpiresAt: license.leaseExpiresAt
  });
});

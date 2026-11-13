import { Router, Response } from 'express';
import { db } from '../storage/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { EnrollDeviceChallengeRequestSchema, EnrollDeviceCompleteRequestSchema } from '@docvault/contracts';
import * as crypto from 'node:crypto';

export const deviceRouter = Router();

deviceRouter.use(authenticate);

// In-memory challenge store: challenge -> userId
const challenges = new Map<string, { userId: string; expiresAt: number }>();

deviceRouter.post('/enroll/challenge', (req: AuthenticatedRequest, res: Response) => {
  const parse = EnrollDeviceChallengeRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  const challenge = crypto.randomBytes(32).toString('hex');
  challenges.set(challenge, {
    userId: req.user!.id,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });

  return res.json({ challenge });
});

deviceRouter.post('/enroll/complete', (req: AuthenticatedRequest, res: Response) => {
  const parse = EnrollDeviceCompleteRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  const { challenge, devicePublicKey, platform } = parse.data;
  const challengeEntry = challenges.get(challenge);

  if (!challengeEntry || challengeEntry.userId !== req.user!.id || Date.now() > challengeEntry.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired challenge' });
  }

  challenges.delete(challenge);

  const device = db.createDevice({
    organizationId: req.user!.organizationId,
    userId: req.user!.id,
    devicePublicKey,
    platform,
    attestationStatus: 'verified'
  });

  db.recordAuditEvent({
    organizationId: req.user!.organizationId,
    actorUserId: req.user!.id,
    action: 'DEVICE_ENROLLED',
    targetType: 'device',
    targetId: device.id,
    ipHash: null,
    detailsRedacted: JSON.stringify({ platform: device.platform })
  });

  return res.status(201).json({ device });
});

deviceRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const devices = db.listDevicesByUser(req.user!.id);
  return res.json({ devices });
});

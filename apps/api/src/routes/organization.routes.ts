import { Router, Response } from 'express';
import { db } from '../storage/db.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

export const organizationRouter = Router();

organizationRouter.use(authenticate);

organizationRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const memberships = db.findMembershipsByUser(req.user!.id);
  res.json({ organizations: memberships });
});

organizationRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    plan: z.string().default('standard')
  });

  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  const org = db.createOrganization(parse.data.name, parse.data.plan);
  const membership = db.createMembership(org.id, req.user!.id, 'owner');

  db.recordAuditEvent({
    organizationId: org.id,
    actorUserId: req.user!.id,
    action: 'ORGANIZATION_CREATED',
    targetType: 'organization',
    targetId: org.id,
    ipHash: null,
    detailsRedacted: null
  });

  return res.status(201).json({
    organization: org,
    role: membership.role
  });
});

organizationRouter.get('/:id/members', (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.organizationId !== req.params['id']) {
    return res.status(403).json({ error: 'Access denied to this organization' });
  }

  const members = db.listOrganizationMembers(req.params['id']!);
  return res.json({ members });
});

organizationRouter.post(
  '/:id/members',
  requireRole(['owner', 'admin']),
  (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.organizationId !== req.params['id']) {
      return res.status(403).json({ error: 'Access denied to this organization' });
    }

    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
      role: z.enum(['admin', 'sender', 'recipient', 'auditor'])
    });

    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
    }

    let user = db.findUserByEmail(parse.data.email);
    if (!user) {
      user = db.createUser({
        email: parse.data.email,
        name: parse.data.name,
        passwordHash: null,
        mfaEnabled: false
      });
    }

    const membership = db.createMembership(req.params['id']!, user.id, parse.data.role);

    db.recordAuditEvent({
      organizationId: req.params['id']!,
      actorUserId: req.user!.id,
      action: 'MEMBER_ADDED',
      targetType: 'membership',
      targetId: membership.id,
      ipHash: null,
      detailsRedacted: JSON.stringify({ userId: user.id, role: parse.data.role })
    });

    return res.status(201).json({ membership, user });
  }
);

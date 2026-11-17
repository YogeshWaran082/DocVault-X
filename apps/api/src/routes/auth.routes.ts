import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { db } from '../storage/db.js';
import { generateTokens, authenticate, AuthenticatedRequest, REFRESH_SECRET } from '../middleware/auth.js';
import { RegisterRequestSchema, LoginRequestSchema, RefreshRequestSchema, UserRole } from '@docvault/contracts';

export const authRouter = Router();

authRouter.post('/register', async (req, res: Response) => {
  if (process.env['NODE_ENV'] !== 'test' && process.env['ALLOW_PUBLIC_REGISTRATION'] !== 'true') {
    return res.status(403).json({ error: 'Public registration is disabled. Contact your administrator for access.' });
  }

  const parse = RegisterRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  const { email, name, password, organizationName } = parse.data;

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'User already registered with this email' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = db.createUser({
    email,
    name,
    passwordHash,
    mfaEnabled: false
  });

  const org = db.createOrganization(organizationName || `${name}'s Organization`);
  const membership = db.createMembership(org.id, user.id, 'owner');

  db.recordAuditEvent({
    organizationId: org.id,
    actorUserId: user.id,
    action: 'USER_REGISTERED',
    targetType: 'user',
    targetId: user.id,
    ipHash: null,
    detailsRedacted: JSON.stringify({ email: user.email })
  });

  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    organizationId: org.id,
    role: membership.role as UserRole
  });

  return res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      mfaEnabled: user.mfaEnabled
    },
    organization: {
      id: org.id,
      name: org.name,
      role: membership.role
    },
    accessToken,
    refreshToken
  });
});

authRouter.post('/login', async (req, res: Response) => {
  const parse = LoginRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  const { email, password } = parse.data;
  const user = db.findUserByEmail(email);
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const memberships = db.findMembershipsByUser(user.id);
  if (memberships.length === 0) {
    return res.status(403).json({ error: 'User does not belong to any organization' });
  }

  const primaryMembership = memberships[0]!;
  const org = db.findOrganizationById(primaryMembership.organizationId)!;

  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    organizationId: primaryMembership.organizationId,
    role: primaryMembership.role as UserRole
  });

  db.recordAuditEvent({
    organizationId: primaryMembership.organizationId,
    actorUserId: user.id,
    action: 'USER_LOGIN',
    targetType: 'user',
    targetId: user.id,
    ipHash: null,
    detailsRedacted: null
  });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      mfaEnabled: user.mfaEnabled
    },
    organization: {
      id: org.id,
      name: org.name,
      role: primaryMembership.role
    },
    accessToken,
    refreshToken
  });
});

authRouter.post('/refresh', (req, res: Response) => {
  const parse = RefreshRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
  }

  try {
    const decoded = jwt.verify(parse.data.refreshToken, REFRESH_SECRET) as {
      userId: string;
      organizationId: string;
      role: UserRole;
    };

    const user = db.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const membership = db.findMembership(decoded.organizationId, user.id);
    if (!membership) {
      return res.status(403).json({ error: 'Account no longer has access to this organization' });
    }

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      organizationId: decoded.organizationId,
      role: membership.role as UserRole
    });

    return res.json({ accessToken, refreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.user!.id)!;
  const memberships = db.findMembershipsByUser(user.id);
  const currentOrg = db.findOrganizationById(req.user!.organizationId);

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      mfaEnabled: user.mfaEnabled
    },
    currentOrganization: {
      id: currentOrg?.id,
      name: currentOrg?.name,
      role: req.user!.role
    },
    organizations: memberships
  });
});

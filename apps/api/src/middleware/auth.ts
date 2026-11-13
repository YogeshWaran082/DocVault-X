import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { db } from '../storage/db.js';
import { UserRole } from '@docvault/contracts';

export const JWT_SECRET = process.env['JWT_SECRET'] || 'docvault-x-jwt-dev-secret-super-secure';
export const REFRESH_SECRET = process.env['REFRESH_SECRET'] || 'docvault-x-refresh-dev-secret-super-secure';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateTokens(payload: { userId: string; organizationId: string; role: UserRole }) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token!, JWT_SECRET) as {
      userId: string;
      organizationId: string;
      role: UserRole;
    };

    const user = db.findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    // Optional override header for switching active organization if user belongs to multiple
    const requestedOrgId = (req.headers['x-organization-id'] as string) || decoded.organizationId;
    const membership = db.findMembership(requestedOrgId, user.id);

    if (!membership) {
      res.status(403).json({ error: 'Forbidden: No membership in requested organization' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: requestedOrgId,
      role: membership.role as UserRole
    };

    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired access token' });
    return;
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Insufficient role. Required one of: ${allowedRoles.join(', ')}`
      });
      return;
    }
    next();
  };
}

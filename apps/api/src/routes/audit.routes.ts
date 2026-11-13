import { Router, Response } from 'express';
import { db } from '../storage/db.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';

export const auditRouter = Router();

auditRouter.use(authenticate);

auditRouter.get('/', requireRole(['owner', 'admin', 'auditor']), (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 50;
  const events = db.listAuditEvents(req.user!.organizationId, limit);
  return res.json({ auditEvents: events });
});

auditRouter.get('/alerts', requireRole(['owner', 'admin', 'auditor', 'sender']), (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 50;
  const alerts = db.listSecurityAlerts(req.user!.organizationId, limit);
  return res.json({ alerts });
});

auditRouter.get('/metrics', requireRole(['owner', 'admin', 'auditor', 'sender']), (req: AuthenticatedRequest, res: Response) => {
  const metrics = db.getStorageMetrics(req.user!.organizationId);
  return res.json({ metrics });
});

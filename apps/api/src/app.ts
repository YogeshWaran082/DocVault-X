import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { authRouter } from './routes/auth.routes.js';
import { organizationRouter } from './routes/organization.routes.js';
import { documentRouter } from './routes/document.routes.js';
import { licenseRouter } from './routes/license.routes.js';
import { deviceRouter } from './routes/device.routes.js';
import { auditRouter } from './routes/audit.routes.js';
import { shareRouter, documentShareRouter } from './routes/share.routes.js';
import { viewerRouter } from './routes/viewer.routes.js';
import { dvxRouter } from './routes/dvx.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health checks
  app.get('/health/live', (_req: Request, res: Response) => {
    res.json({ status: 'live', timestamp: new Date().toISOString() });
  });

  app.get('/health/ready', (_req: Request, res: Response) => {
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  });

  // API v1 routes
  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/organizations', organizationRouter);
  v1.use('/documents', documentRouter);
  v1.use('/documents', documentShareRouter);
  v1.use('/shares', shareRouter);
  v1.use('/viewer', viewerRouter);
  v1.use('/dvx', dvxRouter);
  v1.use('/licenses', licenseRouter);
  v1.use('/devices', deviceRouter);
  v1.use('/audit', auditRouter);

  // OpenAPI JSON summary endpoint
  v1.get('/openapi.json', (_req: Request, res: Response) => {
    res.json({
      openapi: '3.0.0',
      info: {
        title: 'DocVault X API',
        version: '1.0.0',
        description: 'Universal Offline Self-Destructing Document Platform API'
      },
      paths: {
        '/auth/register': { post: { summary: 'Register user and organization' } },
        '/auth/login': { post: { summary: 'Login user' } },
        '/auth/refresh': { post: { summary: 'Refresh JWT access token' } },
        '/auth/me': { get: { summary: 'Get current user profile and tenant organizations' } },
        '/organizations': { get: { summary: 'List user organizations' }, post: { summary: 'Create organization' } },
        '/documents/uploads/initiate': { post: { summary: 'Initiate upload' } },
        '/documents/upload-direct': { post: { summary: 'Multipart upload with .dvx AES-256-GCM encryption' } },
        '/documents': { get: { summary: 'List tenant documents' } },
        '/documents/{id}': { get: { summary: 'Get document details' }, delete: { summary: 'Delete document' } },
        '/documents/{id}/policies': { post: { summary: 'Update document policy' } },
        '/documents/{id}/revoke': { post: { summary: 'Revoke document access' } },
        '/documents/{id}/grants': { post: { summary: 'Grant recipient access' } },
        '/documents/{id}/protected-download': { post: { summary: 'Download encrypted .dvx container' } },
        '/documents/{id}/unprotected-export': { post: { summary: 'Export decrypted standard file (Mode A)' } },
        '/licenses/issue': { post: { summary: 'Issue signed offline lease license' } },
        '/licenses/{id}/status': { get: { summary: 'Check license validity' } },
        '/devices/enroll/challenge': { post: { summary: 'Request device enrollment challenge' } },
        '/devices/enroll/complete': { post: { summary: 'Complete device enrollment' } },
        '/audit': { get: { summary: 'List tenant audit logs' } }
      }
    });
  });

  app.use('/api/v1', v1);
  app.use('/v1', v1);

  // Serve static web build if present
  const webDistPath = path.resolve(process.cwd(), '../web/dist');
  const webDistLocal = path.resolve(process.cwd(), 'apps/web/dist');
  const staticPath = fs.existsSync(webDistPath) ? webDistPath : (fs.existsSync(webDistLocal) ? webDistLocal : null);

  if (staticPath) {
    app.use(express.static(staticPath));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  return app;
}

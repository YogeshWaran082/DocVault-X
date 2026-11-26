import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

export interface DbUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface DbOrganization {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
}

export interface DbMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'sender' | 'recipient' | 'auditor';
  createdAt: string;
}

export interface DbDevice {
  id: string;
  organizationId: string;
  userId: string;
  devicePublicKey: string;
  platform: 'windows' | 'macos' | 'android' | 'ios' | 'web_pwa';
  attestationStatus: string;
  enrolledAt: string;
  revokedAt: string | null;
}

export interface DbDocument {
  id: string;
  organizationId: string;
  ownerUserId: string;
  title: string;
  mimeDeclared: string;
  mimeDetected: string;
  sizeBytes: number;
  sha256Ciphertext: string;
  currentVersionId: string | null;
  status: 'active' | 'revoked' | 'deleted' | 'quarantined';
  createdAt: string;
  deletedAt: string | null;
}

export interface DbDocumentVersion {
  id: string;
  documentId: string;
  objectKey: string;
  containerVersion: number;
  wrappedDekRef: string;
  sizeBytes: number;
  createdAt: string;
}

export interface DbPolicy {
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
  supersededAt: string | null;
}

export interface DbGrant {
  id: string;
  organizationId: string;
  documentId: string;
  recipientUserId: string;
  policyId: string;
  status: 'active' | 'revoked';
  grantedAt: string;
  revokedAt: string | null;
}

export interface DbLicense {
  id: string;
  organizationId: string;
  grantId: string;
  deviceId: string;
  policyVersion: number;
  issuedAt: string;
  notBefore: string;
  expiresAt: string;
  leaseExpiresAt: string;
  licenseJti: string;
  signedPayload: string;
  revokedAt: string | null;
}

export interface DbShareLink {
  id: string;
  organizationId: string;
  documentId: string;
  grantId?: string;
  tokenHash: string;
  rawToken?: string;
  expiryType: 'FIRST_OPEN' | 'ABSOLUTE';
  durationSeconds: number;
  firstOpenedAt: string | null;
  expiresAt: string;
  maxOpens: number | null;
  openCount: number;
  watermarkTemplate: string | null;
  allowDownload: boolean;
  singleSessionOnly: boolean;
  boundIpHash?: string | null;
  alertOnSuspiciousAccess: boolean;
  revokedAt: string | null;
  createdAt: string;
}

export interface DbSecurityAlert {
  id: string;
  organizationId: string;
  documentId: string;
  shareLinkId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alertType: 'EXPIRED_ACCESS_ATTEMPT' | 'MAX_OPENS_EXCEEDED' | 'FORWARDED_LINK_DETECTED' | 'CONCURRENT_SESSION_BLOCKED' | 'SUSPICIOUS_IP_SHIFT' | 'REVOKED_ACCESS_ATTEMPT';
  message: string;
  ipHash: string | null;
  userAgent: string | null;
  timestamp: string;
}

export interface DbAccessSession {
  id: string;
  shareLinkId?: string | null;
  documentId: string;
  sessionTokenHash: string;
  ipHash: string | null;
  userAgent: string | null;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  lastActiveAt: string;
}

export interface DbAccessEvent {
  id: string;
  organizationId: string;
  documentId: string;
  userId: string | null;
  deviceId: string | null;
  eventType: string;
  eventTime: string;
  offlineReported: boolean;
  metadataRedacted: string | null;
}

export interface DbConversionJob {
  id: string;
  organizationId: string;
  documentVersionId: string;
  status: string;
  previewObjectKey: string | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DbDeletionJob {
  id: string;
  organizationId: string;
  documentId: string;
  requestedAt: string;
  completedAt: string | null;
  status: string;
  errorCode: string | null;
}

export interface DbAuditEvent {
  id: string;
  organizationId: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  ipHash: string | null;
  detailsRedacted: string | null;
}

export interface DbKeyVersion {
  id: string;
  organizationId: string;
  kmsKeyRef: string;
  state: string;
  createdAt: string;
  retiredAt: string | null;
}

export interface DbPdfPasswordRecord {
  id: string;
  organizationId: string;
  documentId: string;
  tokenHash: string;
  encryptedUserPassword: string;
  expiresAt: string;
  maxRetrievals: number | null;
  retrievalCount: number;
  revokedAt: string | null;
  createdAt: string;
  permissions: {
    allowPrinting: boolean;
    allowCopying: boolean;
    allowModifying: boolean;
  };
}

export interface DatabaseState {
  organizations: DbOrganization[];
  users: DbUser[];
  memberships: DbMembership[];
  devices: DbDevice[];
  documents: DbDocument[];
  documentVersions: DbDocumentVersion[];
  policies: DbPolicy[];
  grants: DbGrant[];
  licenses: DbLicense[];
  shareLinks: DbShareLink[];
  accessSessions: DbAccessSession[];
  accessEvents: DbAccessEvent[];
  securityAlerts: DbSecurityAlert[];
  conversionJobs: DbConversionJob[];
  deletionJobs: DbDeletionJob[];
  auditEvents: DbAuditEvent[];
  keyVersions: DbKeyVersion[];
  pdfPasswordRecords?: DbPdfPasswordRecord[];
}

function getDataDirectory(): string {
  if (process.env['DATA_DIR']) {
    return process.env['DATA_DIR'];
  }
  if (process.env['VERCEL']) {
    return '/tmp/docvault_data';
  }
  return path.join(process.cwd(), 'data');
}

export class Database {
  private state: DatabaseState;
  private dbFilePath: string;

  constructor(filePath?: string) {
    this.dbFilePath = filePath || path.join(getDataDirectory(), 'docvault_db.json');
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch {
      // fallback to blank
    }
    const now = new Date().toISOString();
    return {
      organizations: [
        {
          id: 'demo-org-global-defense',
          name: 'Global Defense Labs',
          plan: 'enterprise',
          createdAt: now
        }
      ],
      users: [
        {
          id: 'demo-user-admin',
          email: 'admin@docvault-demo.com',
          name: 'Security Executive',
          passwordHash: '$2a$10$CyrJZyYTdA8QXQIJNmmyweiCO0ArXwvTpifauANh10W0gWjBSAHvy',
          mfaEnabled: false,
          createdAt: now
        }
      ],
      memberships: [
        {
          id: 'demo-mem-admin',
          organizationId: 'demo-org-global-defense',
          userId: 'demo-user-admin',
          role: 'owner',
          createdAt: now
        }
      ],
      devices: [],
      documents: [],
      documentVersions: [],
      policies: [],
      grants: [],
      licenses: [],
      shareLinks: [],
      accessSessions: [],
      accessEvents: [],
      securityAlerts: [],
      conversionJobs: [],
      deletionJobs: [],
      auditEvents: [],
      keyVersions: [],
      pdfPasswordRecords: []
    };
  }

  public persist() {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch {
      // In-memory operation if filesystem writes are restricted
    }
  }

  public clearAll() {
    this.state = {
      organizations: [],
      users: [],
      memberships: [],
      devices: [],
      documents: [],
      documentVersions: [],
      policies: [],
      grants: [],
      licenses: [],
      shareLinks: [],
      accessSessions: [],
      accessEvents: [],
      securityAlerts: [],
      conversionJobs: [],
      deletionJobs: [],
      auditEvents: [],
      keyVersions: [],
      pdfPasswordRecords: []
    };
    this.persist();
  }

  // --- Users ---
  public createUser(user: Omit<DbUser, 'id' | 'createdAt'>): DbUser {
    const existing = this.state.users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      throw new Error('User already exists with this email');
    }
    const record: DbUser = {
      ...user,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    this.state.users.push(record);
    this.persist();
    return record;
  }

  public findUserByEmail(email: string): DbUser | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): DbUser | undefined {
    return this.state.users.find(u => u.id === id);
  }

  // --- Organizations ---
  public createOrganization(name: string, plan: string = 'standard'): DbOrganization {
    const record: DbOrganization = {
      id: uuidv4(),
      name,
      plan,
      createdAt: new Date().toISOString()
    };
    this.state.organizations.push(record);
    this.persist();
    return record;
  }

  public findOrganizationById(id: string): DbOrganization | undefined {
    return this.state.organizations.find(o => o.id === id);
  }

  // --- Memberships ---
  public createMembership(organizationId: string, userId: string, role: DbMembership['role']): DbMembership {
    const existing = this.state.memberships.find(m => m.organizationId === organizationId && m.userId === userId);
    if (existing) {
      return existing;
    }
    const record: DbMembership = {
      id: uuidv4(),
      organizationId,
      userId,
      role,
      createdAt: new Date().toISOString()
    };
    this.state.memberships.push(record);
    this.persist();
    return record;
  }

  public findMembership(organizationId: string, userId: string): DbMembership | undefined {
    return this.state.memberships.find(m => m.organizationId === organizationId && m.userId === userId);
  }

  public findMembershipsByUser(userId: string): Array<DbMembership & { organizationName: string }> {
    return this.state.memberships
      .filter(m => m.userId === userId)
      .map(m => {
        const org = this.findOrganizationById(m.organizationId);
        return {
          ...m,
          organizationName: org ? org.name : 'Unknown'
        };
      });
  }

  public listOrganizationMembers(organizationId: string): Array<{ membership: DbMembership; user: DbUser }> {
    return this.state.memberships
      .filter(m => m.organizationId === organizationId)
      .map(m => ({
        membership: m,
        user: this.findUserById(m.userId)!
      }))
      .filter(entry => !!entry.user);
  }

  // --- Documents ---
  public createDocument(doc: Omit<DbDocument, 'id' | 'createdAt' | 'deletedAt'>): DbDocument {
    const record: DbDocument = {
      ...doc,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      deletedAt: null
    };
    this.state.documents.push(record);
    this.persist();
    return record;
  }

  public findDocumentById(organizationId: string, documentId: string): DbDocument | undefined {
    return this.state.documents.find(d => d.id === documentId && d.organizationId === organizationId && d.status !== 'deleted');
  }

  public listDocuments(organizationId: string, options?: { status?: string; search?: string }): DbDocument[] {
    return this.state.documents.filter(d => {
      if (d.organizationId !== organizationId) return false;
      if (options?.status && d.status !== options.status) return false;
      if (options?.search && !d.title.toLowerCase().includes(options.search.toLowerCase())) return false;
      return true;
    });
  }

  public updateDocument(documentId: string, updates: Partial<DbDocument>): DbDocument | undefined {
    const doc = this.state.documents.find(d => d.id === documentId);
    if (!doc) return undefined;
    Object.assign(doc, updates);
    this.persist();
    return doc;
  }

  // --- Document Versions ---
  public createDocumentVersion(version: Omit<DbDocumentVersion, 'id' | 'createdAt'>): DbDocumentVersion {
    const record: DbDocumentVersion = {
      ...version,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    this.state.documentVersions.push(record);
    this.persist();
    return record;
  }

  public findVersionsByDocument(documentId: string): DbDocumentVersion[] {
    return this.state.documentVersions.filter(v => v.documentId === documentId);
  }

  public findVersionById(versionId: string): DbDocumentVersion | undefined {
    return this.state.documentVersions.find(v => v.id === versionId);
  }

  // --- Policies ---
  public createPolicy(policy: Omit<DbPolicy, 'id' | 'createdAt' | 'supersededAt'>): DbPolicy {
    // Supersede previous active policy if any
    const existing = this.state.policies.find(p => p.documentId === policy.documentId && p.supersededAt === null);
    if (existing) {
      existing.supersededAt = new Date().toISOString();
    }
    const record: DbPolicy = {
      ...policy,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      supersededAt: null
    };
    this.state.policies.push(record);
    this.persist();
    return record;
  }

  public getActivePolicy(documentId: string): DbPolicy | undefined {
    return this.state.policies.find(p => p.documentId === documentId && p.supersededAt === null);
  }

  // --- Grants ---
  public createGrant(grant: Omit<DbGrant, 'id' | 'grantedAt' | 'revokedAt'>): DbGrant {
    const record: DbGrant = {
      ...grant,
      id: uuidv4(),
      grantedAt: new Date().toISOString(),
      revokedAt: null
    };
    this.state.grants.push(record);
    this.persist();
    return record;
  }

  public findGrantById(id: string): DbGrant | undefined {
    return this.state.grants.find(g => g.id === id);
  }

  public listGrantsByDocument(documentId: string): DbGrant[] {
    return this.state.grants.filter(g => g.documentId === documentId);
  }

  public revokeGrant(grantId: string): boolean {
    const grant = this.state.grants.find(g => g.id === grantId);
    if (grant) {
      grant.status = 'revoked';
      grant.revokedAt = new Date().toISOString();
      this.persist();
      return true;
    }
    return false;
  }

  // --- Devices ---
  public createDevice(device: Omit<DbDevice, 'id' | 'enrolledAt' | 'revokedAt'>): DbDevice {
    const record: DbDevice = {
      ...device,
      id: uuidv4(),
      enrolledAt: new Date().toISOString(),
      revokedAt: null
    };
    this.state.devices.push(record);
    this.persist();
    return record;
  }

  public findDeviceById(id: string): DbDevice | undefined {
    return this.state.devices.find(d => d.id === id);
  }

  public listDevicesByUser(userId: string): DbDevice[] {
    return this.state.devices.filter(d => d.userId === userId && d.revokedAt === null);
  }

  // --- Licenses ---
  public createLicense(license: Omit<DbLicense, 'id' | 'issuedAt' | 'revokedAt'>): DbLicense {
    const record: DbLicense = {
      ...license,
      id: uuidv4(),
      issuedAt: new Date().toISOString(),
      revokedAt: null
    };
    this.state.licenses.push(record);
    this.persist();
    return record;
  }

  public findLicenseByJti(jti: string): DbLicense | undefined {
    return this.state.licenses.find(l => l.licenseJti === jti);
  }

  public revokeLicense(id: string): boolean {
    const license = this.state.licenses.find(l => l.id === id);
    if (license) {
      license.revokedAt = new Date().toISOString();
      this.persist();
      return true;
    }
    return false;
  }

  // --- Share Links ---
  public createShareLink(link: Omit<DbShareLink, 'id' | 'openCount' | 'revokedAt' | 'createdAt' | 'firstOpenedAt'> & { firstOpenedAt?: string | null }): DbShareLink {
    const record: DbShareLink = {
      ...link,
      id: uuidv4(),
      firstOpenedAt: link.firstOpenedAt || null,
      openCount: 0,
      revokedAt: null,
      createdAt: new Date().toISOString()
    };
    this.state.shareLinks.push(record);
    this.persist();
    return record;
  }

  public findShareLinkByTokenHash(tokenHash: string): DbShareLink | undefined {
    return this.state.shareLinks.find(s => s.tokenHash === tokenHash);
  }

  public findShareLinkById(id: string): DbShareLink | undefined {
    return this.state.shareLinks.find(s => s.id === id);
  }

  public listShareLinksByDocument(documentId: string): DbShareLink[] {
    return this.state.shareLinks.filter(s => s.documentId === documentId);
  }

  public listAllShareLinks(organizationId: string): DbShareLink[] {
    return this.state.shareLinks.filter(s => s.organizationId === organizationId);
  }

  public incrementShareLinkOpenCount(id: string): DbShareLink | undefined {
    const link = this.state.shareLinks.find(s => s.id === id);
    if (link) {
      link.openCount += 1;
      this.persist();
      return link;
    }
    return undefined;
  }

  /**
   * Atomic DRM open verification and slot acquisition.
   * Prevents race conditions and guarantees that concurrent opens cannot bypass maxOpens.
   * If a valid session resume token is provided, resumes without consuming open count.
   */
  public atomicallyOpenShare(
    tokenHash: string,
    clientInfo: {
      ipHash: string;
      userAgent: string | null;
      resumeSessionToken?: string;
    }
  ): {
    outcome: 'GRANTED' | 'RESUMED' | 'DENIED';
    reason?: 'EXPIRED' | 'MAX_OPENS_REACHED' | 'ACCESS_REVOKED' | 'INVALID_LINK' | 'SINGLE_SESSION_CONFLICT';
    message?: string;
    session?: DbAccessSession;
    rawSessionToken?: string;
    share?: DbShareLink;
    document?: DbDocument;
  } {
    const share = this.findShareLinkByTokenHash(tokenHash);
    if (!share) {
      return { outcome: 'DENIED', reason: 'INVALID_LINK', message: 'Invalid or Unauthorized Link' };
    }

    const doc = this.state.documents.find(d => d.id === share.documentId && d.status !== 'deleted');
    if (!doc) {
      return { outcome: 'DENIED', reason: 'INVALID_LINK', message: 'Document is no longer available' };
    }

    // 1. Revocation checks (Document or Share Link)
    if (doc.status === 'revoked') {
      this.recordSecurityAlert({
        organizationId: share.organizationId,
        documentId: doc.id,
        shareLinkId: share.id,
        severity: 'medium',
        alertType: 'REVOKED_ACCESS_ATTEMPT',
        message: `Attempted access on revoked document from IP ${clientInfo.ipHash}`,
        ipHash: clientInfo.ipHash,
        userAgent: clientInfo.userAgent
      });
      return { outcome: 'DENIED', reason: 'ACCESS_REVOKED', message: 'Access Revoked' };
    }

    if (share.revokedAt) {
      this.recordSecurityAlert({
        organizationId: share.organizationId,
        documentId: doc.id,
        shareLinkId: share.id,
        severity: 'medium',
        alertType: 'REVOKED_ACCESS_ATTEMPT',
        message: `Attempted access on revoked share link from IP ${clientInfo.ipHash}`,
        ipHash: clientInfo.ipHash,
        userAgent: clientInfo.userAgent
      });
      return { outcome: 'DENIED', reason: 'ACCESS_REVOKED', message: 'Access Revoked' };
    }

    const now = new Date();

    // 2. Session Resume Check:
    // If a valid session token is presented for an active, unexpired, unrevoked session on this link,
    // resume viewing WITHOUT incrementing open count.
    if (clientInfo.resumeSessionToken) {
      const candidateHash = crypto.createHash('sha256').update(clientInfo.resumeSessionToken).digest('hex');
      const existingSession = this.state.accessSessions.find(
        s => s.shareLinkId === share.id && s.sessionTokenHash === candidateHash && !s.revokedAt
      );

      if (existingSession) {
        const isSessExpired = now.getTime() >= new Date(existingSession.expiresAt).getTime() ||
          now.getTime() >= new Date(share.expiresAt).getTime();

        if (!isSessExpired) {
          existingSession.lastActiveAt = now.toISOString();
          this.persist();
          return {
            outcome: 'RESUMED',
            session: existingSession,
            rawSessionToken: clientInfo.resumeSessionToken,
            share,
            document: doc
          };
        }
      }
    }

    // 3. Expiry check against authoritative server clock
    if (share.expiryType === 'ABSOLUTE' && now.getTime() >= new Date(share.expiresAt).getTime()) {
      this.recordSecurityAlert({
        organizationId: share.organizationId,
        documentId: doc.id,
        shareLinkId: share.id,
        severity: 'low',
        alertType: 'EXPIRED_ACCESS_ATTEMPT',
        message: `Attempted access after expiration on share link from IP ${clientInfo.ipHash}`,
        ipHash: clientInfo.ipHash,
        userAgent: clientInfo.userAgent
      });
      return { outcome: 'DENIED', reason: 'EXPIRED', message: 'Document Expired' };
    }

    if (share.expiryType === 'FIRST_OPEN' && share.firstOpenedAt && now.getTime() >= new Date(share.expiresAt).getTime()) {
      this.recordSecurityAlert({
        organizationId: share.organizationId,
        documentId: doc.id,
        shareLinkId: share.id,
        severity: 'low',
        alertType: 'EXPIRED_ACCESS_ATTEMPT',
        message: `Attempted access after expiration on first-open share link from IP ${clientInfo.ipHash}`,
        ipHash: clientInfo.ipHash,
        userAgent: clientInfo.userAgent
      });
      return { outcome: 'DENIED', reason: 'EXPIRED', message: 'Document Expired' };
    }

    // 4. Maximum Allowed Successful Opens Check (Atomic)
    if (share.maxOpens !== null && share.openCount >= share.maxOpens) {
      this.recordSecurityAlert({
        organizationId: share.organizationId,
        documentId: doc.id,
        shareLinkId: share.id,
        severity: 'medium',
        alertType: 'MAX_OPENS_EXCEEDED',
        message: `Maximum allowed opens (${share.maxOpens}) reached for share link from IP ${clientInfo.ipHash}`,
        ipHash: clientInfo.ipHash,
        userAgent: clientInfo.userAgent
      });
      return { outcome: 'DENIED', reason: 'MAX_OPENS_REACHED', message: 'Maximum Open Count Reached' };
    }

    // 5. Single active session check (if policy enabled)
    if (share.singleSessionOnly) {
      const activeSessions = this.getActiveSessionsForShare(share.id);
      if (activeSessions.length > 0) {
        this.recordSecurityAlert({
          organizationId: share.organizationId,
          documentId: doc.id,
          shareLinkId: share.id,
          severity: 'high',
          alertType: 'CONCURRENT_SESSION_BLOCKED',
          message: `Blocked concurrent session attempt from IP ${clientInfo.ipHash} on single-session document`,
          ipHash: clientInfo.ipHash,
          userAgent: clientInfo.userAgent
        });
        return {
          outcome: 'DENIED',
          reason: 'SINGLE_SESSION_CONFLICT',
          message: 'Single Active Session Restriction: Document is currently open in another session'
        };
      }
    }

    // 6. Forwarded link detection
    if (share.boundIpHash && share.boundIpHash !== clientInfo.ipHash) {
      this.recordSecurityAlert({
        organizationId: share.organizationId,
        documentId: doc.id,
        shareLinkId: share.id,
        severity: 'medium',
        alertType: 'FORWARDED_LINK_DETECTED',
        message: `Share link opened from new IP ${clientInfo.ipHash} (bound IP: ${share.boundIpHash})`,
        ipHash: clientInfo.ipHash,
        userAgent: clientInfo.userAgent
      });
    } else if (!share.boundIpHash) {
      share.boundIpHash = clientInfo.ipHash;
    }

    // 7. Establish first open deadline if FIRST_OPEN semantics
    if (share.expiryType === 'FIRST_OPEN' && !share.firstOpenedAt) {
      const authoritativeExpiresAt = new Date(now.getTime() + share.durationSeconds * 1000).toISOString();
      share.firstOpenedAt = now.toISOString();
      share.expiresAt = authoritativeExpiresAt;
    }

    // 8. Atomically increment open count
    share.openCount += 1;

    // 9. Generate 256-bit cryptographically secure session credential
    const rawSessionToken = crypto.randomBytes(32).toString('base64url');
    const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');

    const session = this.createAccessSession({
      shareLinkId: share.id,
      documentId: doc.id,
      sessionTokenHash,
      ipHash: clientInfo.ipHash,
      userAgent: clientInfo.userAgent,
      expiresAt: share.expiresAt
    });

    this.persist();

    return {
      outcome: 'GRANTED',
      session,
      rawSessionToken,
      share,
      document: doc
    };
  }

  /**
   * Validates viewer session with server authority, checks expiry, revocation, and token hash.
   */
  public validateViewerSessionDetailed(
    sessionId: string,
    sessionToken?: string
  ): {
    valid: boolean;
    reason?: 'EXPIRED' | 'ACCESS_REVOKED' | 'INVALID_LINK' | 'INVALID_TOKEN';
    message?: string;
    session?: DbAccessSession;
    share?: DbShareLink;
    document?: DbDocument;
  } {
    const session = this.findAccessSessionById(sessionId);
    if (!session) {
      return { valid: false, reason: 'INVALID_LINK', message: 'Session not found or invalid' };
    }

    if (session.revokedAt) {
      return { valid: false, reason: 'ACCESS_REVOKED', message: 'Access Revoked: Session has been terminated' };
    }

    if (sessionToken) {
      const hash = crypto.createHash('sha256').update(sessionToken).digest('hex');
      if (hash !== session.sessionTokenHash) {
        return { valid: false, reason: 'INVALID_TOKEN', message: 'Invalid or Unauthorized Link: Session credential mismatch' };
      }
    }

    const share = session.shareLinkId ? this.findShareLinkById(session.shareLinkId) : undefined;
    if (session.shareLinkId) {
      if (!share || share.revokedAt) {
        return { valid: false, reason: 'ACCESS_REVOKED', message: 'Access Revoked: Share link has been revoked' };
      }
    }

    const doc = this.state.documents.find(d => d.id === session.documentId && d.status !== 'deleted');
    if (!doc || doc.status === 'revoked') {
      return { valid: false, reason: 'ACCESS_REVOKED', message: 'Access Revoked: Document has been revoked or removed' };
    }

    const now = Date.now();
    const isExpired = now >= new Date(session.expiresAt).getTime() ||
      (share && now >= new Date(share.expiresAt).getTime());

    if (isExpired) {
      return { valid: false, reason: 'EXPIRED', message: 'Document Expired: Access duration has ended' };
    }

    return {
      valid: true,
      session,
      share,
      document: doc
    };
  }

  /**
   * Retrieves comprehensive DRM access statistics for a share link.
   */
  public getShareStats(shareId: string) {
    const share = this.state.shareLinks.find(s => s.id === shareId);
    if (!share) return null;
    const doc = this.state.documents.find(d => d.id === share.documentId);
    const now = Date.now();
    const isRevoked = Boolean(share.revokedAt) || (doc ? doc.status === 'revoked' : false);
    const isExpired = new Date(share.expiresAt).getTime() <= now;
    const activeSessions = this.state.accessSessions.filter(
      s => s.shareLinkId === share.id && !s.revokedAt && new Date(s.expiresAt).getTime() > now
    );

    return {
      shareId: share.id,
      documentId: share.documentId,
      documentTitle: doc ? doc.title : 'Unknown Document',
      expiryType: share.expiryType,
      durationSeconds: share.durationSeconds,
      firstOpenedAt: share.firstOpenedAt,
      expiresAt: share.expiresAt,
      maxOpens: share.maxOpens,
      openCount: share.openCount,
      remainingOpens: share.maxOpens !== null ? Math.max(0, share.maxOpens - share.openCount) : null,
      isExpired,
      isRevoked,
      revokedAt: share.revokedAt,
      activeSessionsCount: activeSessions.length,
      singleSessionOnly: share.singleSessionOnly,
      watermarkTemplate: share.watermarkTemplate,
      createdAt: share.createdAt
    };
  }


  public markShareLinkFirstOpened(id: string, expiresAt: string): DbShareLink | undefined {
    const link = this.state.shareLinks.find(s => s.id === id);
    if (link) {
      link.firstOpenedAt = new Date().toISOString();
      link.expiresAt = expiresAt;
      this.persist();
      return link;
    }
    return undefined;
  }

  public extendShareExpiry(id: string, additionalSeconds: number): DbShareLink | undefined {
    const link = this.state.shareLinks.find(s => s.id === id);
    if (link) {
      const currentExpiry = new Date(link.expiresAt).getTime();
      const newExpiry = new Date(Math.max(Date.now(), currentExpiry) + additionalSeconds * 1000).toISOString();
      link.expiresAt = newExpiry;
      link.revokedAt = null; // Un-revoke if expired

      // Also update any active sessions
      for (const sess of this.state.accessSessions) {
        if (sess.shareLinkId === id && !sess.revokedAt) {
          sess.expiresAt = newExpiry;
        }
      }
      this.persist();
      return link;
    }
    return undefined;
  }

  public regenerateShareLink(id: string, newRawToken: string, newTokenHash: string, newExpiresAt?: string): DbShareLink | undefined {
    const link = this.state.shareLinks.find(s => s.id === id);
    if (link) {
      link.rawToken = newRawToken;
      link.tokenHash = newTokenHash;
      link.openCount = 0;
      link.revokedAt = null;
      link.firstOpenedAt = null;
      if (newExpiresAt) {
        link.expiresAt = newExpiresAt;
      }
      // Revoke prior sessions from the old token
      for (const sess of this.state.accessSessions) {
        if (sess.shareLinkId === id && !sess.revokedAt) {
          sess.revokedAt = new Date().toISOString();
        }
      }
      this.persist();
      return link;
    }
    return undefined;
  }

  public getStorageMetrics(organizationId: string) {
    const orgDocs = this.state.documents.filter(d => d.organizationId === organizationId && d.status !== 'deleted');
    const totalStorageBytes = orgDocs.reduce((acc, d) => acc + d.sizeBytes, 0);
    const activeDocumentsCount = orgDocs.filter(d => d.status === 'active').length;
    const revokedDocumentsCount = orgDocs.filter(d => d.status === 'revoked').length;

    const orgShares = this.state.shareLinks.filter(s => s.organizationId === organizationId);
    const now = Date.now();
    let activeSharesCount = 0;
    let expiredSharesCount = 0;
    let revokedSharesCount = 0;

    for (const s of orgShares) {
      if (s.revokedAt) {
        revokedSharesCount++;
      } else if (new Date(s.expiresAt).getTime() <= now) {
        expiredSharesCount++;
      } else {
        activeSharesCount++;
      }
    }

    const activeSessionsCount = this.state.accessSessions.filter(
      sess => !sess.revokedAt && new Date(sess.expiresAt).getTime() > now
    ).length;

    return {
      totalDocuments: orgDocs.length,
      totalStorageBytes,
      activeDocumentsCount,
      revokedDocumentsCount,
      activeSharesCount,
      expiredSharesCount,
      revokedSharesCount,
      activeSessionsCount
    };
  }

  public revokeShareLink(id: string): boolean {
    const link = this.state.shareLinks.find(s => s.id === id);
    if (link) {
      link.revokedAt = new Date().toISOString();
      // Also revoke all active access sessions for this share
      for (const sess of this.state.accessSessions) {
        if (sess.shareLinkId === id && !sess.revokedAt) {
          sess.revokedAt = new Date().toISOString();
        }
      }
      this.persist();
      return true;
    }
    return false;
  }

  // --- Access Sessions (Browser Viewer) ---
  public createAccessSession(session: Omit<DbAccessSession, 'id' | 'revokedAt' | 'createdAt' | 'lastActiveAt'>): DbAccessSession {
    const now = new Date().toISOString();
    const record: DbAccessSession = {
      ...session,
      id: uuidv4(),
      revokedAt: null,
      createdAt: now,
      lastActiveAt: now
    };
    this.state.accessSessions.push(record);
    this.persist();
    return record;
  }

  public findAccessSessionById(id: string): DbAccessSession | undefined {
    return this.state.accessSessions.find(s => s.id === id);
  }

  public touchAccessSession(id: string): void {
    const sess = this.state.accessSessions.find(s => s.id === id);
    if (sess) {
      sess.lastActiveAt = new Date().toISOString();
      this.persist();
    }
  }

  public revokeAccessSession(id: string): boolean {
    const sess = this.state.accessSessions.find(s => s.id === id);
    if (sess) {
      sess.revokedAt = new Date().toISOString();
      this.persist();
      return true;
    }
    return false;
  }

  public getActiveSessionsForShare(shareLinkId: string): DbAccessSession[] {
    const now = Date.now();
    return this.state.accessSessions.filter(s =>
      s.shareLinkId === shareLinkId &&
      s.revokedAt === null &&
      new Date(s.expiresAt).getTime() > now
    );
  }

  public invalidateOtherSessionsForShare(shareLinkId: string, keepSessionId: string): void {
    const now = new Date().toISOString();
    for (const s of this.state.accessSessions) {
      if (s.shareLinkId === shareLinkId && s.id !== keepSessionId && s.revokedAt === null) {
        s.revokedAt = now;
      }
    }
    this.persist();
  }

  // --- Security Alerts ---
  public recordSecurityAlert(alert: Omit<DbSecurityAlert, 'id' | 'timestamp'>): DbSecurityAlert {
    const record: DbSecurityAlert = {
      ...alert,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    this.state.securityAlerts.push(record);
    this.persist();
    return record;
  }

  public listSecurityAlerts(organizationId: string, limit = 50): DbSecurityAlert[] {
    return this.state.securityAlerts
      .filter(a => a.organizationId === organizationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // --- Audit Events ---
  public recordAuditEvent(event: Omit<DbAuditEvent, 'id' | 'timestamp'>): DbAuditEvent {
    const record: DbAuditEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    this.state.auditEvents.push(record);
    this.persist();
    return record;
  }

  public listAuditEvents(organizationId: string, limit = 50): DbAuditEvent[] {
    return this.state.auditEvents
      .filter(a => a.organizationId === organizationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // --- Access Events ---
  public recordAccessEvent(event: Omit<DbAccessEvent, 'id' | 'eventTime'>): DbAccessEvent {
    const record: DbAccessEvent = {
      ...event,
      id: uuidv4(),
      eventTime: new Date().toISOString()
    };
    this.state.accessEvents.push(record);
    this.persist();
    return record;
  }

  public listAccessEvents(documentId: string): DbAccessEvent[] {
    return this.state.accessEvents
      .filter(e => e.documentId === documentId)
      .sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());
  }

  // --- Universal Password Protected PDF Retrieval Records ---
  private ensurePdfPasswordRecords(): DbPdfPasswordRecord[] {
    if (!this.state.pdfPasswordRecords) {
      this.state.pdfPasswordRecords = [];
    }
    return this.state.pdfPasswordRecords;
  }

  public createPdfPasswordRecord(
    record: Omit<DbPdfPasswordRecord, 'id' | 'retrievalCount' | 'revokedAt' | 'createdAt'>
  ): DbPdfPasswordRecord {
    const list = this.ensurePdfPasswordRecords();
    const created: DbPdfPasswordRecord = {
      ...record,
      id: uuidv4(),
      retrievalCount: 0,
      revokedAt: null,
      createdAt: new Date().toISOString()
    };
    list.push(created);
    this.persist();
    return created;
  }

  public findPdfPasswordByTokenHash(tokenHash: string): DbPdfPasswordRecord | undefined {
    return this.ensurePdfPasswordRecords().find(r => r.tokenHash === tokenHash);
  }

  public findPdfPasswordById(id: string): DbPdfPasswordRecord | undefined {
    return this.ensurePdfPasswordRecords().find(r => r.id === id);
  }

  public listPdfPasswordRecordsByDocument(documentId: string): DbPdfPasswordRecord[] {
    return this.ensurePdfPasswordRecords()
      .filter(r => r.documentId === documentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public incrementPdfPasswordRetrieval(id: string): DbPdfPasswordRecord | null {
    const record = this.findPdfPasswordById(id);
    if (!record) return null;
    if (record.revokedAt) return null;
    if (new Date(record.expiresAt).getTime() <= Date.now()) return null;
    if (record.maxRetrievals !== null && record.retrievalCount >= record.maxRetrievals) {
      return null;
    }
    record.retrievalCount += 1;
    this.persist();
    return record;
  }

  public revokePdfPasswordRecord(id: string): DbPdfPasswordRecord | undefined {
    const record = this.findPdfPasswordById(id);
    if (!record) return undefined;
    record.revokedAt = new Date().toISOString();
    this.persist();
    return record;
  }
}

export const db = new Database();

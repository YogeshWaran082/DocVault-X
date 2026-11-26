const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1';

export class DrmError extends Error {
  public reason: string;
  public code: string;
  public status: number;

  constructor(message: string, reason: string, code: string, status: number) {
    super(message);
    this.name = 'DrmError';
    this.reason = reason;
    this.code = code;
    this.status = status;
  }
}

export class ApiClient {
  private static token: string | null = localStorage.getItem('docvault_token');

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('docvault_token', token);
    } else {
      localStorage.removeItem('docvault_token');
    }
  }

  static getToken(): string | null {
    return this.token;
  }

  private static getHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { ...extra };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = this.getHeaders(options.headers as Record<string, string>);

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  }

  static async getMe() {
    return this.request<{
      user: import('../types').User;
      currentOrganization: import('../types').Organization;
      organizations: Array<{ organizationId: string; organizationName: string; role: string }>;
    }>('/auth/me');
  }

  static async listDocuments(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return this.request<{ documents: import('../types').Document[] }>(`/documents?${params.toString()}`);
  }

  static async getDocument(id: string) {
    return this.request<{
      document: import('../types').Document;
      activePolicy: import('../types').Policy;
      versions: any[];
      grants: any[];
    }>(`/documents/${id}`);
  }

  static async uploadDocument(formData: FormData) {
    const url = `${API_BASE}/documents/upload-direct`;
    const headers = this.getHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Upload failed with HTTP ${res.status}`);
    }
    return res.json();
  }

  static async updatePolicy(documentId: string, policy: Partial<import('../types').Policy>) {
    return this.request<{ policy: import('../types').Policy }>(`/documents/${documentId}/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    });
  }

  static async revokeDocument(documentId: string) {
    return this.request<{ success: boolean; message: string }>(`/documents/${documentId}/revoke`, {
      method: 'POST'
    });
  }

  static async deleteDocument(documentId: string) {
    return this.request<{ success: boolean; message: string }>(`/documents/${documentId}`, {
      method: 'DELETE'
    });
  }

  static async listAuditEvents() {
    return this.request<{ auditEvents: import('../types').AuditEvent[] }>('/audit');
  }

  static async fetchViewContent(documentId: string): Promise<Blob> {
    const url = `${API_BASE}/documents/${documentId}/view-content`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Failed to fetch document content');
    }
    return res.blob();
  }

  static async downloadProtected(documentId: string, filename: string) {
    const url = `${API_BASE}/documents/${documentId}/protected-download`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Protected download failed');
    }
    const blob = await res.blob();
    const link = window.document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.dvx`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  static async createShareLink(
    documentId: string,
    options: {
      expirySeconds: number;
      expiryType?: 'FIRST_OPEN' | 'ABSOLUTE';
      maxOpens?: number | null;
      watermarkTemplate?: string | null;
      singleSessionOnly?: boolean;
    }
  ) {
    return this.request<{
      shareId: string;
      token: string;
      expiresAt: string;
      expiryType: string;
      durationSeconds: number;
      maxOpens: number | null;
      singleSessionOnly: boolean;
    }>(`/documents/${documentId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
  }

  static async listShareLinks(documentId: string) {
    return this.request<{ shares: any[] }>(`/documents/${documentId}/shares`);
  }

  static async revokeShareLink(shareId: string) {
    return this.request<{ success: boolean; message: string }>(`/shares/${shareId}/revoke`, {
      method: 'POST'
    });
  }

  static async extendShareExpiry(shareId: string, additionalSeconds: number = 1800) {
    return this.request<{ success: boolean; share: any }>(`/shares/${shareId}/extend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalSeconds })
    });
  }

  static async regenerateShareLink(shareId: string) {
    return this.request<{ success: boolean; share: any; token: string }>(`/shares/${shareId}/regenerate`, {
      method: 'POST'
    });
  }

  static async getStorageMetrics() {
    return this.request<{
      metrics: {
        totalDocuments: number;
        totalStorageBytes: number;
        activeDocumentsCount: number;
        revokedDocumentsCount: number;
        activeSharesCount: number;
        expiredSharesCount: number;
        revokedSharesCount: number;
        activeSessionsCount: number;
      };
    }>('/audit/metrics');
  }

  static async initReceiverSession(token: string, resumeSessionToken?: string | null) {
    // Try primary DRM engine endpoint first, falling back to /shares/:token/session
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (resumeSessionToken) {
      headers['x-session-token'] = resumeSessionToken;
    }

    let res = await fetch(`${API_BASE}/drm/open`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token, sessionToken: resumeSessionToken || undefined })
    });

    if (!res.ok && res.status === 404) {
      res = await fetch(`${API_BASE}/shares/${token}/session`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionToken: resumeSessionToken || undefined })
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: 'Unable to Open Document',
        reason: 'Invalid or Unauthorized Link',
        code: 'ERROR'
      }));

      throw new DrmError(
        err.error || 'Unable to Open Document',
        err.reason || err.error || 'Invalid or Unauthorized Link',
        err.code || (res.status === 410 ? 'EXPIRED' : res.status === 403 ? 'ACCESS_REVOKED' : 'ERROR'),
        res.status
      );
    }

    return res.json() as Promise<{
      sessionId: string;
      sessionToken: string;
      isResumed?: boolean;
      documentTitle: string;
      mimeType: string;
      expiresAt: string;
      remainingSeconds: number;
      openCount: number;
      maxOpens: number | null;
      remainingOpens?: number | null;
      watermarkTemplate: string | null;
      allowDownload: boolean;
      singleSessionOnly?: boolean;
    }>;
  }

  static async checkViewerSessionStatus(sessionId: string, sessionToken?: string | null) {
    const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
    if (sessionToken) {
      headers['x-session-token'] = sessionToken;
    }

    let res = await fetch(`${API_BASE}/drm/sessions/${sessionId}/validate`, { headers });
    if (!res.ok && res.status === 404) {
      res = await fetch(`${API_BASE}/viewer/sessions/${sessionId}/status`, { headers });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: 'Unable to Open Document',
        reason: 'Session expired or revoked',
        code: 'ERROR'
      }));

      throw new DrmError(
        err.error || 'Unable to Open Document',
        err.reason || 'Session expired or revoked',
        err.code || (res.status === 410 ? 'EXPIRED' : 'ACCESS_REVOKED'),
        res.status
      );
    }

    return res.json() as Promise<{
      active: boolean;
      expiresAt: string;
      remainingSeconds: number;
      openCount: number;
      maxOpens: number | null;
      remainingOpens?: number | null;
      serverTimeUtc?: string;
    }>;
  }

  static async fetchReceiverContent(sessionId: string, sessionToken?: string | null): Promise<Blob> {
    const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
    if (sessionToken) {
      headers['x-session-token'] = sessionToken;
    }

    let res = await fetch(`${API_BASE}/drm/sessions/${sessionId}/content`, { headers });
    if (!res.ok && res.status === 404) {
      res = await fetch(`${API_BASE}/viewer/sessions/${sessionId}/content`, { headers });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: 'Unable to Open Document',
        reason: 'Content request denied',
        code: 'ERROR'
      }));

      throw new DrmError(
        err.error || 'Unable to Open Document',
        err.reason || 'Content request denied',
        err.code || (res.status === 410 ? 'EXPIRED' : 'ACCESS_REVOKED'),
        res.status
      );
    }

    return res.blob();
  }

  static async getShareStats(shareId: string) {
    return this.request<{
      stats: {
        shareId: string;
        documentId: string;
        documentTitle: string;
        expiryType: string;
        durationSeconds: number;
        firstOpenedAt: string | null;
        expiresAt: string;
        maxOpens: number | null;
        openCount: number;
        remainingOpens: number | null;
        isExpired: boolean;
        isRevoked: boolean;
        activeSessionsCount: number;
        singleSessionOnly: boolean;
        watermarkTemplate: string | null;
        createdAt: string;
      };
    }>(`/drm/shares/${shareId}/stats`);
  }

  static async validateLicense(params: {
    licenseJti: string;
    deviceId?: string;
    currentClientTimeUtc?: string;
  }) {
    return this.request<{
      isValid: boolean;
      reason?: string;
      isExpired: boolean;
      isRevoked: boolean;
      remainingSeconds?: number;
      effectiveDeadlineUtc?: string;
    }>('/drm/licenses/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  }

  static async inspectDvx(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${API_BASE}/dvx/inspect`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Failed to inspect DVX container');
    }
    return res.json() as Promise<{
      isValid: boolean;
      version: number;
      cipherSuite: number;
      documentId: string;
      mimeType: string;
      createdAt: string;
      totalChunks: number;
      originalSizeBytes: number;
      documentTitle: string | null;
      documentExists: boolean;
      status: string;
    }>;
  }

  static async authorizeDvx(documentId: string, token?: string) {
    const url = `${API_BASE}/dvx/authorize`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ documentId, token })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Authorization failed (${res.status})`);
    }
    return res.json() as Promise<{
      sessionId: string;
      sessionToken: string;
      documentTitle: string;
      mimeType: string;
      expiresAt: string;
      remainingSeconds: number;
      watermarkTemplate: string | null;
    }>;
  }

  static async checkDvxSessionStatus(sessionId: string, sessionToken?: string | null) {
    const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
    if (sessionToken) {
      headers['x-session-token'] = sessionToken;
    }
    const url = `${API_BASE}/dvx/sessions/${sessionId}/status`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Session status check failed (${res.status})`);
    }
    return res.json() as Promise<{
      active: boolean;
      expiresAt: string;
      remainingSeconds: number;
    }>;
  }

  static async fetchDvxContent(sessionId: string, sessionToken?: string | null): Promise<Blob> {
    const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
    if (sessionToken) {
      headers['x-session-token'] = sessionToken;
    }
    const url = `${API_BASE}/dvx/preview/${sessionId}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Failed to fetch DVX content (${res.status})`);
    }
    return res.blob();
  }

  static async listSecurityAlerts(limit: number = 50) {
    return this.request<{ alerts: any[] }>(`/audit/alerts?limit=${limit}`);
  }

  static async exportUnprotected(documentId: string, filename: string) {
    const url = `${API_BASE}/documents/${documentId}/unprotected-export`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ acknowledgeUnprotectedExport: true })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Export failed');
    }
    const blob = await res.blob();
    const link = window.document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  static async exportPasswordProtectedPdf(
    documentId: string,
    options: {
      passwordMode: 'custom' | 'random';
      userPassword?: string;
      ownerPasswordMode: 'custom' | 'random';
      ownerPassword?: string;
      permissions: {
        allowPrinting: boolean;
        allowCopying: boolean;
        allowModifying: boolean;
      };
      enablePasswordRetrieval: boolean;
      retrievalExpirySeconds?: number;
      maxRetrievals?: number | null;
    }
  ) {
    return this.request<{
      filename: string;
      mimeType: string;
      sizeBytes: number;
      algorithm: 'AES-256';
      permissions: {
        allowPrinting: boolean;
        allowCopying: boolean;
        allowModifying: boolean;
      };
      userPassword: string;
      ownerPasswordGenerated: boolean;
      pdfBase64: string;
      retrieval: {
        id: string;
        token: string;
        expiresAt: string;
        maxRetrievals: number | null;
      } | null;
    }>(`/documents/${documentId}/password-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
  }

  static async listPdfPasswordRecords(documentId: string) {
    return this.request<{
      records: Array<{
        id: string;
        documentId: string;
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
      }>;
    }>(`/documents/${documentId}/pdf-passwords`);
  }

  static async revokePdfPasswordRecord(recordId: string) {
    return this.request<{ success: boolean; message: string }>(`/pdf-passwords/${recordId}/revoke`, {
      method: 'POST'
    });
  }

  static async getPdfPasswordStatus(token: string) {
    const res = await fetch(`${API_BASE}/pdf-passwords/${encodeURIComponent(token)}/status`, {
      headers: { 'Cache-Control': 'no-store' }
    });
    const data = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) {
      throw new Error(data.error || `Status check failed (${res.status})`);
    }
    return data as {
      active: boolean;
      documentTitle: string;
      expiresAt: string;
      maxRetrievals: number | null;
      retrievalCount: number;
      remainingRetrievals: number | null;
      isExpired: boolean;
      isRevoked: boolean;
      maxReached: boolean;
      permissions: {
        allowPrinting: boolean;
        allowCopying: boolean;
        allowModifying: boolean;
      };
      notice: string;
    };
  }

  static async retrievePdfPassword(token: string) {
    const res = await fetch(`${API_BASE}/pdf-passwords/${encodeURIComponent(token)}/retrieve`, {
      method: 'POST',
      headers: { 'Cache-Control': 'no-store' }
    });
    const data = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) {
      throw new Error(data.error || `Password retrieval failed (${res.status})`);
    }
    return data as {
      password: string;
      documentTitle: string;
      expiresAt: string;
      maxRetrievals: number | null;
      retrievalCount: number;
      remainingRetrievals: number | null;
      permissions: {
        allowPrinting: boolean;
        allowCopying: boolean;
        allowModifying: boolean;
      };
      notice: string;
    };
  }
}

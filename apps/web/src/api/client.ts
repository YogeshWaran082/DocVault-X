const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1';
localStorage.removeItem('docvault_token');

export class ApiClient {
  private static token: string | null = sessionStorage.getItem('docvault_token');

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      sessionStorage.setItem('docvault_token', token);
    } else {
      sessionStorage.removeItem('docvault_token');
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

  private static expireSessionOnUnauthorized(response: Response) {
    if (response.status === 401 && this.token) {
      this.setToken(null);
      window.dispatchEvent(new Event('docvault:unauthorized'));
    }
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = this.getHeaders(options.headers as Record<string, string>);

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      if (res.status === 401 && endpoint !== '/auth/login') {
        this.setToken(null);
        window.dispatchEvent(new Event('docvault:unauthorized'));
      }
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
    this.expireSessionOnUnauthorized(res);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Upload failed with HTTP ${res.status}`);
    }
    return res.json();
  }

  static async updatePolicy(documentId: string, policy: Partial<import('../types').Policy> & { password?: string | null }) {
    return this.request<{ policy: import('../types').Policy }>(`/documents/${documentId}/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    });
  }

  static async signPdf(input: { documentId: string; password?: string; signerName: string; reason?: string; pageNumber: number }) {
    return this.request<{ document: import('../types').Document }>('/pdf-tools/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
  }

  static async redactPdf(input: { documentId: string; password?: string; pageNumber: number; rectangles: Array<{ x: number; y: number; width: number; height: number }>; label?: string }) {
    return this.request<{ document: import('../types').Document; notice: string }>('/pdf-tools/redact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
  }

  static async comparePdfs(input: { leftDocumentId: string; rightDocumentId: string; leftPassword?: string; rightPassword?: string }) {
    return this.request<{ comparison: import('../types').PdfComparison }>('/pdf-tools/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
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

  static async fetchViewContent(documentId: string, password?: string): Promise<Blob> {
    const url = `${API_BASE}/documents/${documentId}/view-content`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ password })
    });
    this.expireSessionOnUnauthorized(res);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      const requestError: any = new Error(err.message || err.error || 'Failed to fetch document content');
      requestError.status = res.status;
      requestError.code = err.error;
      requestError.requiresPassword = err.requiresPassword;
      throw requestError;
    }
    return res.blob();
  }

  static async downloadProtected(documentId: string, filename: string) {
    const url = `${API_BASE}/documents/${documentId}/protected-download`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders()
    });
    this.expireSessionOnUnauthorized(res);
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
      password?: string | null;
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
      hasPassword?: boolean;
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

  static async initReceiverSession(token: string, password?: string) {
    const url = `${API_BASE}/shares/${token}/session`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      const customErr: any = new Error(err.message || err.error || `Failed to open document (${res.status})`);
      customErr.status = res.status;
      customErr.code = err.error;
      customErr.requiresPassword = err.requiresPassword;
      throw customErr;
    }
    return res.json() as Promise<{
      sessionId: string;
      sessionToken: string;
      documentTitle: string;
      mimeType: string;
      expiresAt: string;
      remainingSeconds: number;
      watermarkTemplate: string | null;
      allowDownload: boolean;
    }>;
  }

  static async checkViewerSessionStatus(sessionId: string) {
    const url = `${API_BASE}/viewer/sessions/${sessionId}/status`;
    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-store' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Session check failed (${res.status})`);
    }
    return res.json() as Promise<{
      active: boolean;
      expiresAt: string;
      remainingSeconds: number;
      openCount: number;
      maxOpens: number | null;
    }>;
  }

  static async fetchReceiverContent(sessionId: string): Promise<Blob> {
    const url = `${API_BASE}/viewer/sessions/${sessionId}/content`;
    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-store' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Content request denied (${res.status})`);
    }
    return res.blob();
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
    this.expireSessionOnUnauthorized(res);
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

  static async checkDvxSessionStatus(sessionId: string) {
    const url = `${API_BASE}/dvx/sessions/${sessionId}/status`;
    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-store' }
    });
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

  static async fetchDvxContent(sessionId: string): Promise<Blob> {
    const url = `${API_BASE}/dvx/preview/${sessionId}`;
    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-store' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Failed to fetch DVX content (${res.status})`);
    }
    return res.blob();
  }

  static async listSecurityAlerts(limit: number = 50) {
    return this.request<{ alerts: any[] }>(`/audit/alerts?limit=${limit}`);
  }

  static async exportUnprotected(documentId: string, filename: string, password?: string) {
    const url = `${API_BASE}/documents/${documentId}/unprotected-export`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ acknowledgeUnprotectedExport: true, password })
    });
    this.expireSessionOnUnauthorized(res);
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
}

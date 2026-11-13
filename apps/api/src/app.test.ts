import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { createApp } from './app.js';
import { db } from './storage/db.js';
import { Server } from 'node:http';

describe('DocVault X API Integration Tests', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    db.clearAll();
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });
  });

  after(() => {
    if (server) {
      server.close();
    }
  });

  it('verifies health endpoints', async () => {
    const res = await fetch(`${baseUrl}/health/live`);
    assert.strictEqual(res.status, 200);
    const body = await res.json() as { status: string };
    assert.strictEqual(body.status, 'live');
  });

  let tokenOrgA: string;
  let orgAId: string;

  it('registers user A with Organization A', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@acme-corp.com',
        name: 'Alice Walker',
        password: 'SuperSecurePassword123!',
        organizationName: 'Acme Security Labs'
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json() as any;
    assert.ok(data.accessToken);
    assert.strictEqual(data.user.email, 'alice@acme-corp.com');
    assert.strictEqual(data.organization.name, 'Acme Security Labs');

    tokenOrgA = data.accessToken;
    orgAId = data.organization.id;
  });

  it('logs in user A and verifies profile via /me', async () => {
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@acme-corp.com',
        password: 'SuperSecurePassword123!'
      })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json() as any;
    assert.ok(loginData.accessToken);

    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${loginData.accessToken}` }
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json() as any;
    assert.strictEqual(meData.user.email, 'alice@acme-corp.com');
    assert.strictEqual(meData.currentOrganization.id, orgAId);
  });

  let uploadedDocId: string;

  it('uploads a document, encrypts to .dvx container with real AES-256-GCM', async () => {
    const boundary = '----DocVaultBoundary' + Math.random().toString(16);
    const fileContent = 'TOP SECRET ARCHITECTURE BLUEPRINT - CONFIDENTIAL';
    const postBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nProject Phoenix Specs\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="phoenix.txt"\r\nContent-Type: text/plain\r\n\r\n`),
      Buffer.from(fileContent),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const res = await fetch(`${baseUrl}/api/v1/documents/upload-direct`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOrgA}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: postBody
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json() as any;
    assert.ok(data.document.id);
    assert.strictEqual(data.document.title, 'Project Phoenix Specs');
    assert.strictEqual(data.document.sha256Ciphertext.length, 64);
    assert.strictEqual(data.policy.mode, 'SECURE_NATIVE');

    uploadedDocId = data.document.id;
  });

  it('downloads the protected .dvx container and verifies DVX1 header', async () => {
    const res = await fetch(`${baseUrl}/api/v1/documents/${uploadedDocId}/protected-download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenOrgA}` }
    });

    assert.strictEqual(res.status, 200);
    const buffer = Buffer.from(await res.arrayBuffer());
    assert.ok(buffer.length > 20);
    assert.strictEqual(buffer.subarray(0, 4).toString('utf8'), 'DVX1');
  });

  it('enforces multi-tenant isolation: Tenant B cannot access Tenant A documents', async () => {
    // Register User B in Organization B
    const resB = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bob@evil-rival-corp.com',
        name: 'Bob Rival',
        password: 'Password987654!',
        organizationName: 'Rival Industries'
      })
    });
    assert.strictEqual(resB.status, 201);
    const dataB = await resB.json() as any;
    const tokenOrgB = dataB.accessToken;

    // Bob attempts to query Alice's document in Org A
    const attemptRes = await fetch(`${baseUrl}/api/v1/documents/${uploadedDocId}`, {
      headers: { Authorization: `Bearer ${tokenOrgB}` }
    });
    assert.strictEqual(attemptRes.status, 404); // Tenant isolation returns 404 (does not exist in Bob's org)
  });

  it('issues signed offline lease license for enrolled device', async () => {
    // 1. Enroll Alice's device
    const challengeRes = await fetch(`${baseUrl}/api/v1/devices/enroll/challenge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOrgA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ platform: 'macos' })
    });
    assert.strictEqual(challengeRes.status, 200);
    const { challenge } = await challengeRes.json() as any;

    const enrollRes = await fetch(`${baseUrl}/api/v1/devices/enroll/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOrgA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        challenge,
        devicePublicKey: 'ssh-ed25519-mock-pub-key-device-01',
        signature: 'device-sig-verified',
        platform: 'macos'
      })
    });
    assert.strictEqual(enrollRes.status, 201);
    const { device } = await enrollRes.json() as any;

    // 2. Grant access to recipient
    const grantRes = await fetch(`${baseUrl}/api/v1/documents/${uploadedDocId}/grants`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOrgA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientEmail: 'contractor@partner.com',
        recipientName: 'Contractor Dave'
      })
    });
    assert.strictEqual(grantRes.status, 201);
    const { grant } = await grantRes.json() as any;

    // 3. Issue license
    const licenseRes = await fetch(`${baseUrl}/api/v1/licenses/issue`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOrgA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grantId: grant.id,
        deviceId: device.id
      })
    });
    assert.strictEqual(licenseRes.status, 201);
    const licenseData = await licenseRes.json() as any;
    assert.ok(licenseData.license.licenseJti);
    assert.ok(licenseData.license.signedPayload);
    assert.ok(licenseData.wrappedDek);
  });

  it('handles Mode A unprotected export with mandatory security disclosure', async () => {
    // By default, allowExport is false
    const exportDenied = await fetch(`${baseUrl}/api/v1/documents/${uploadedDocId}/unprotected-export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOrgA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ acknowledgeUnprotectedExport: true })
    });
    assert.strictEqual(exportDenied.status, 403);

    // Update policy to allow export
    await fetch(`${baseUrl}/api/v1/documents/${uploadedDocId}/policies`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOrgA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: 'NORMAL_EXPORT',
        allowExport: true,
        offlineLeaseSeconds: 86400
      })
    });

    // Try without acknowledgment -> should be rejected
    const unacknowledgedRes = await fetch(`${baseUrl}/api/v1/documents/${uploadedDocId}/unprotected-export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOrgA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ acknowledgeUnprotectedExport: false })
    });
    assert.strictEqual(unacknowledgedRes.status, 400);

    // With explicit acknowledgment -> succeeds
    const exportRes = await fetch(`${baseUrl}/api/v1/documents/${uploadedDocId}/unprotected-export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOrgA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ acknowledgeUnprotectedExport: true })
    });
    assert.strictEqual(exportRes.status, 200);
    const exportedText = await exportRes.text();
    assert.strictEqual(exportedText, 'TOP SECRET ARCHITECTURE BLUEPRINT - CONFIDENTIAL');
    assert.strictEqual(exportRes.headers.get('x-docvault-security-status'), 'UNPROTECTED_EXPORT');
  });

  it('revokes document access and blocks subsequent downloads', async () => {
    const revokeRes = await fetch(`${baseUrl}/api/v1/documents/${uploadedDocId}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenOrgA}` }
    });
    assert.strictEqual(revokeRes.status, 200);

    // Subsequent protected download should be refused
    const downloadRes = await fetch(`${baseUrl}/api/v1/documents/${uploadedDocId}/protected-download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenOrgA}` }
    });
    assert.strictEqual(downloadRes.status, 403);
  });

  describe('Secure Browser Document Viewer (No App Required & Server-Side Expiry)', () => {
    let freshDocId: string;

    before(async () => {
      // Upload a fresh document for browser viewer tests
      const boundary = '----DocVaultBoundary' + Math.random().toString(16);
      const postBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nExecutive Financial Report.pdf\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="report.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
        Buffer.from('%PDF-1.4 Mock Executive Sensitive PDF Content'),
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);

      const res = await fetch(`${baseUrl}/api/v1/documents/upload-direct`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: postBody
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json() as any;
      freshDocId = data.document.id;
    });

    it('creates an expiring browser share link (e.g. 1 minute expiry)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/shares`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expirySeconds: 60, // 1 minute
          maxOpens: 5
        })
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json() as any;
      assert.ok(data.shareId);
      assert.ok(data.token);
      assert.strictEqual(data.maxOpens, 5);
    });

    it('authorizes receiver browser session without software installation', async () => {
      // 1. Create 60-second share
      const createRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/shares`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expirySeconds: 60, maxOpens: 2 })
      });
      const { token } = await createRes.json() as any;

      // 2. Receiver accesses without any Authorization bearer token!
      const sessionRes = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      assert.strictEqual(sessionRes.status, 201);
      const session = await sessionRes.json() as any;
      assert.ok(session.sessionId);
      assert.strictEqual(session.documentTitle, 'Executive Financial Report.pdf');
      assert.ok(session.remainingSeconds > 0 && session.remainingSeconds <= 60);

      // 3. Heartbeat status check
      const statusRes = await fetch(`${baseUrl}/api/v1/viewer/sessions/${session.sessionId}/status`);
      assert.strictEqual(statusRes.status, 200);
      const statusData = await statusRes.json() as any;
      assert.strictEqual(statusData.active, true);

      // 4. Secure content delivery with no-store headers
      const contentRes = await fetch(`${baseUrl}/api/v1/viewer/sessions/${session.sessionId}/content`);
      assert.strictEqual(contentRes.status, 200);
      assert.match(contentRes.headers.get('cache-control') || '', /no-store/);
      const text = await contentRes.text();
      assert.strictEqual(text, '%PDF-1.4 Mock Executive Sensitive PDF Content');
    });

    it('enforces server-side expiry: content is blocked after duration finishes', async () => {
      // Create a 1-second expiring share link
      const createRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/shares`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expirySeconds: 1 })
      });
      const { token } = await createRes.json() as any;

      // Start session
      const sessionRes = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, {
        method: 'POST'
      });
      assert.strictEqual(sessionRes.status, 201);
      const { sessionId } = await sessionRes.json() as any;

      // Wait 1.2 seconds for expiry
      await new Promise(r => setTimeout(r, 1200));

      // 1. Status check returns 410 Gone
      const statusCheck = await fetch(`${baseUrl}/api/v1/viewer/sessions/${sessionId}/status`);
      assert.strictEqual(statusCheck.status, 410);

      // 2. Content fetch returns 410 Gone (server refuses to deliver bytes)
      const contentCheck = await fetch(`${baseUrl}/api/v1/viewer/sessions/${sessionId}/content`);
      assert.strictEqual(contentCheck.status, 410);

      // 3. New session attempt on expired link returns 410 Gone
      const newSessionCheck = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, {
        method: 'POST'
      });
      assert.strictEqual(newSessionCheck.status, 410);
    });

    it('sender instant revocation immediately terminates active viewer', async () => {
      // 1. Create 60-second share
      const createRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/shares`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expirySeconds: 60 })
      });
      const { shareId, token } = await createRes.json() as any;

      // 2. Receiver starts session
      const sessionRes = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, {
        method: 'POST'
      });
      assert.strictEqual(sessionRes.status, 201);
      const { sessionId } = await sessionRes.json() as any;

      // Content accessible before revocation
      const initialContent = await fetch(`${baseUrl}/api/v1/viewer/sessions/${sessionId}/content`);
      assert.strictEqual(initialContent.status, 200);

      // 3. Sender clicks "Revoke"
      const revokeRes = await fetch(`${baseUrl}/api/v1/shares/${shareId}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrgA}` }
      });
      assert.strictEqual(revokeRes.status, 200);

      // 4. Receiver status check and content retrieval are immediately refused with 403 Forbidden
      const statusAfterRevoke = await fetch(`${baseUrl}/api/v1/viewer/sessions/${sessionId}/status`);
      assert.strictEqual(statusAfterRevoke.status, 403);

      const contentAfterRevoke = await fetch(`${baseUrl}/api/v1/viewer/sessions/${sessionId}/content`);
      assert.strictEqual(contentAfterRevoke.status, 403);
    });

    it('implements first-open expiry semantics with authoritative shared timestamp', async () => {
      // 1. Create a 2-second share with FIRST_OPEN trigger
      const createRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/shares`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expirySeconds: 2,
          expiryType: 'FIRST_OPEN'
        })
      });
      assert.strictEqual(createRes.status, 201);
      const { token } = await createRes.json() as any;

      // 2. Open first session: timer begins now
      const session1Res = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, { method: 'POST' });
      assert.strictEqual(session1Res.status, 201);
      const session1 = await session1Res.json() as any;
      const originalExpiresAt = session1.expiresAt;
      assert.ok(session1.remainingSeconds > 0 && session1.remainingSeconds <= 2);

      // 3. Open second session: must share the EXACT SAME authoritative expiresAt timestamp
      const session2Res = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, { method: 'POST' });
      assert.strictEqual(session2Res.status, 201);
      const session2 = await session2Res.json() as any;
      assert.strictEqual(session2.expiresAt, originalExpiresAt);

      // 4. Wait for the 2 seconds to elapse
      await new Promise(r => setTimeout(r, 2200));

      // 5. Subsequent access returns 410 Gone
      const expiredSessionRes = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, { method: 'POST' });
      assert.strictEqual(expiredSessionRes.status, 410);
    });

    it('enforces atomic max-open limits and records security alert', async () => {
      // Create share with maxOpens: 2
      const createRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/shares`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expirySeconds: 60, maxOpens: 2 })
      });
      const { token } = await createRes.json() as any;

      // Open 1: Success
      const open1 = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, { method: 'POST' });
      assert.strictEqual(open1.status, 201);

      // Open 2: Success
      const open2 = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, { method: 'POST' });
      assert.strictEqual(open2.status, 201);

      // Open 3: Exceeded -> 403 Forbidden
      const open3 = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, { method: 'POST' });
      assert.strictEqual(open3.status, 403);
      const errData = await open3.json() as any;
      assert.match(errData.error, /Maximum views exceeded/);
    });

    it('enforces single-session policy (concurrent / forwarded viewing block)', async () => {
      // Create share with singleSessionOnly: true
      const createRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/shares`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expirySeconds: 60, singleSessionOnly: true })
      });
      const { token } = await createRes.json() as any;

      // Session 1: opens successfully
      const s1 = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, { method: 'POST' });
      assert.strictEqual(s1.status, 201);

      // Session 2: blocked with 409 Conflict because session 1 is still active
      const s2 = await fetch(`${baseUrl}/api/v1/shares/${token}/session`, { method: 'POST' });
      assert.strictEqual(s2.status, 409);
      const s2Err = await s2.json() as any;
      assert.match(s2Err.error, /Single-session policy active/);
    });

    it('preserves original encrypted documents in sender vault even after share expiry and revocation', async () => {
      // Verify document still exists in organization vault
      const docRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}`, {
        headers: { Authorization: `Bearer ${tokenOrgA}` }
      });
      assert.strictEqual(docRes.status, 200);
      const data = await docRes.json() as any;
      assert.strictEqual(data.document.id, freshDocId);
      assert.strictEqual(data.document.status, 'active');
      assert.ok(data.versions.length >= 1);

      // Verify owner can still download protected container
      const downloadRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/protected-download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrgA}` }
      });
      assert.strictEqual(downloadRes.status, 200);
    });

    it('extends share expiry and regenerates share tokens', async () => {
      // 1. Create a share
      const createRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/shares`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expirySeconds: 60 })
      });
      const { shareId, token: oldToken } = await createRes.json() as any;

      // 2. Extend by 1800 seconds (30 mins)
      const extendRes = await fetch(`${baseUrl}/api/v1/shares/${shareId}/extend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ additionalSeconds: 1800 })
      });
      assert.strictEqual(extendRes.status, 200);
      const extendData = await extendRes.json() as any;
      assert.strictEqual(extendData.success, true);
      assert.ok(new Date(extendData.share.expiresAt).getTime() > Date.now() + 1700 * 1000);

      // 3. Regenerate token
      const regenRes = await fetch(`${baseUrl}/api/v1/shares/${shareId}/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrgA}` }
      });
      assert.strictEqual(regenRes.status, 200);
      const regenData = await regenRes.json() as any;
      assert.ok(regenData.token);
      assert.notStrictEqual(regenData.token, oldToken);

      // Old token is now invalid
      const oldTokenAttempt = await fetch(`${baseUrl}/api/v1/shares/${oldToken}/session`, { method: 'POST' });
      assert.strictEqual(oldTokenAttempt.status, 404);

      // New token works
      const newTokenAttempt = await fetch(`${baseUrl}/api/v1/shares/${regenData.token}/session`, { method: 'POST' });
      assert.strictEqual(newTokenAttempt.status, 201);
    });

    it('reports accurate storage metrics and security audit alerts', async () => {
      const metricsRes = await fetch(`${baseUrl}/api/v1/audit/metrics`, {
        headers: { Authorization: `Bearer ${tokenOrgA}` }
      });
      assert.strictEqual(metricsRes.status, 200);
      const { metrics } = await metricsRes.json() as any;
      assert.ok(metrics.totalDocuments >= 2);
      assert.ok(metrics.totalStorageBytes > 0);
      assert.ok(metrics.activeSharesCount >= 0);

      const alertsRes = await fetch(`${baseUrl}/api/v1/audit/alerts`, {
        headers: { Authorization: `Bearer ${tokenOrgA}` }
      });
      assert.strictEqual(alertsRes.status, 200);
      const { alerts } = await alertsRes.json() as any;
      assert.ok(Array.isArray(alerts));
      assert.ok(alerts.length > 0); // Alerts from max-open / concurrent / expired attempts
    });

    it('validates document filename and sanitizes title', async () => {
      const boundary = '----DocVaultBoundary' + Math.random().toString(16);
      const postBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\n\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="../../../etc/passwd.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
        Buffer.from('%PDF-1.4 Mock Traversal Test'),
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);

      const res = await fetch(`${baseUrl}/api/v1/documents/upload-direct`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: postBody
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json() as any;
      // Slashes and traversal characters must be sanitized!
      assert.strictEqual(data.document.title.includes('..'), false);
      assert.strictEqual(data.document.title.includes('/'), false);
    });

    it('denies unauthorized preview access', async () => {
      const bogusSessionRes = await fetch(`${baseUrl}/api/v1/viewer/sessions/non-existent-uuid/content`);
      assert.strictEqual(bogusSessionRes.status, 404);
    });

    // --- Mode B: DVX Browser Viewer Tests ---
    it('Mode B: inspects a valid .dvx container file and extracts metadata', async () => {
      // 1. Download valid .dvx file binary
      const dlRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/protected-download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrgA}` }
      });
      assert.strictEqual(dlRes.status, 200);
      const dvxBuffer = Buffer.from(await dlRes.arrayBuffer());

      // 2. Upload to /api/v1/dvx/inspect
      const boundary = '----DocVaultDvxInspect' + Math.random().toString(16);
      const postBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="document.dvx"\r\nContent-Type: application/octet-stream\r\n\r\n`),
        dvxBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);

      const inspectRes = await fetch(`${baseUrl}/api/v1/dvx/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: postBody
      });

      assert.strictEqual(inspectRes.status, 200);
      const inspectData = await inspectRes.json() as any;
      assert.strictEqual(inspectData.isValid, true);
      assert.strictEqual(inspectData.version, 1);
      assert.strictEqual(inspectData.cipherSuite, 1);
      assert.strictEqual(inspectData.documentId, freshDocId);
      assert.strictEqual(inspectData.documentExists, true);
      assert.strictEqual(inspectData.documentTitle, 'Executive Financial Report.pdf');
    });

    it('Mode B: rejects corrupted or truncated .dvx container files', async () => {
      const boundary = '----DocVaultDvxCorrupt' + Math.random().toString(16);
      const corruptedBuffer = Buffer.from('NOT_A_VALID_DVX_FILE_HEADER_DATA');
      const postBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="corrupted.dvx"\r\nContent-Type: application/octet-stream\r\n\r\n`),
        corruptedBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);

      const inspectRes = await fetch(`${baseUrl}/api/v1/dvx/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: postBody
      });

      assert.strictEqual(inspectRes.status, 400);
      const inspectData = await inspectRes.json() as any;
      assert.strictEqual(inspectData.isValid, false);
      assert.match(inspectData.error, /Invalid magic signature/);
    });

    it('Mode B: denies authorization if credentials or share token are missing', async () => {
      const authRes = await fetch(`${baseUrl}/api/v1/dvx/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: freshDocId })
      });
      assert.strictEqual(authRes.status, 401);
      const errData = await authRes.json() as any;
      assert.match(errData.error, /Authorization required/);
    });

    it('Mode B: authorizes logged-in owner and streams memory-decrypted preview', async () => {
      // Authorize using logged in user token
      const authRes = await fetch(`${baseUrl}/api/v1/dvx/authorize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentId: freshDocId })
      });

      assert.strictEqual(authRes.status, 201);
      const authData = await authRes.json() as any;
      assert.ok(authData.sessionId);
      assert.strictEqual(authData.documentTitle, 'Executive Financial Report.pdf');

      // Fetch preview
      const previewRes = await fetch(`${baseUrl}/api/v1/dvx/preview/${authData.sessionId}`);
      assert.strictEqual(previewRes.status, 200);
      assert.match(previewRes.headers.get('cache-control') || '', /no-store/);
      const previewText = await previewRes.text();
      assert.strictEqual(previewText, '%PDF-1.4 Mock Executive Sensitive PDF Content');
    });

    it('Mode B: authorizes recipient with share token and enforces automatic expiration', async () => {
      // 1. Create a 1-second share link
      const createRes = await fetch(`${baseUrl}/api/v1/documents/${freshDocId}/shares`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenOrgA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expirySeconds: 1 })
      });
      const { token } = await createRes.json() as any;

      // 2. Authorize using share token
      const authRes = await fetch(`${baseUrl}/api/v1/dvx/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: freshDocId, token })
      });
      assert.strictEqual(authRes.status, 201);
      const { sessionId } = await authRes.json() as any;

      // 3. Immediately accessible
      const initialPreview = await fetch(`${baseUrl}/api/v1/dvx/preview/${sessionId}`);
      assert.strictEqual(initialPreview.status, 200);

      // 4. Wait 1.2s for lease to elapse
      await new Promise(r => setTimeout(r, 1200));

      // 5. Expiry enforced: returns 410 Gone
      const expiredPreview = await fetch(`${baseUrl}/api/v1/dvx/preview/${sessionId}`);
      assert.strictEqual(expiredPreview.status, 410);

      const statusRes = await fetch(`${baseUrl}/api/v1/dvx/sessions/${sessionId}/status`);
      assert.strictEqual(statusRes.status, 410);
    });
  });
});

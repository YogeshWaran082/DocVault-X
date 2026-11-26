import React, { useState, useEffect, useRef } from 'react';
import { Clock, ShieldAlert, KeyRound, Lock } from 'lucide-react';
import { ApiClient } from '../api/client';
import { PdfViewer } from './PdfViewer';

interface ReceiverViewerProps {
  token: string;
}

export type DrmDenialReason =
  | 'Document Expired'
  | 'Maximum Open Count Reached'
  | 'Access Revoked'
  | 'Invalid or Unauthorized Link';

export const ReceiverViewer: React.FC<ReceiverViewerProps> = ({ token }) => {
  const [session, setSession] = useState<{
    sessionId: string;
    sessionToken: string;
    documentTitle: string;
    mimeType: string;
    expiresAt: string;
    watermarkTemplate: string | null;
  } | null>(null);

  const [_remainingSeconds, setRemainingSeconds] = useState<number>(60);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denialReason, setDenialReason] = useState<DrmDenialReason | null>(null);
  const [denialDetails, setDenialDetails] = useState<string | null>(null);

  const blobUrlRef = useRef<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);

  const storageKey = `docvault_drm_sess_${token}`;

  // Helper to categorize denial reasons exactly per Phase 4 specification
  const classifyDenial = (err: any): { reason: DrmDenialReason; details: string } => {
    const code = err.code || '';
    const message = (err.message || '').toLowerCase();
    const reasonStr = (err.reason || '').toLowerCase();

    if (code === 'EXPIRED' || message.includes('expired') || reasonStr.includes('expired')) {
      return {
        reason: 'Document Expired',
        details: 'The viewing time limit for this document has elapsed. Server has terminated access.'
      };
    }

    if (
      code === 'MAX_OPENS_REACHED' ||
      message.includes('maximum') ||
      message.includes('max_opens') ||
      reasonStr.includes('maximum open')
    ) {
      return {
        reason: 'Maximum Open Count Reached',
        details: 'This document has reached the maximum number of allowed opens set by the sender.'
      };
    }

    if (
      code === 'ACCESS_REVOKED' ||
      message.includes('revoked') ||
      reasonStr.includes('revoked')
    ) {
      return {
        reason: 'Access Revoked',
        details: 'The document owner has revoked access to this document or terminated all active links.'
      };
    }

    if (code === 'SINGLE_SESSION_CONFLICT' || message.includes('single-session')) {
      return {
        reason: 'Maximum Open Count Reached',
        details: 'Single active session restriction: This document is currently open in another session.'
      };
    }

    return {
      reason: 'Invalid or Unauthorized Link',
      details: err.reason || err.message || 'The provided share link is invalid, corrupted, or does not exist.'
    };
  };

  // 1. Authorize session & retrieve protected content
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Retrieve cached session token for session resumption within the same browser tab
    const cachedSessionToken = sessionStorage.getItem(storageKey);

    ApiClient.initReceiverSession(token, cachedSessionToken)
      .then(async (data) => {
        if (!isMounted) return;

        setSession(data);
        sessionTokenRef.current = data.sessionToken;
        setRemainingSeconds(data.remainingSeconds);

        // Save session token in sessionStorage to enable seamless session resumes
        // without consuming additional open counts on zoom, page change, or refresh
        if (data.sessionToken) {
          try {
            sessionStorage.setItem(storageKey, data.sessionToken);
          } catch {
            // Ignore storage quota errors
          }
        }

        // Fetch protected document content with authorized short-lived session credential
        try {
          const blob = await ApiClient.fetchReceiverContent(data.sessionId, data.sessionToken);
          if (!isMounted) return;

          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setContentUrl(url);
        } catch (contentErr: any) {
          if (!isMounted) return;
          const denial = classifyDenial(contentErr);
          setDenialReason(denial.reason);
          setDenialDetails(denial.details);
          try {
            sessionStorage.removeItem(storageKey);
          } catch {}
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        const denial = classifyDenial(err);
        setDenialReason(denial.reason);
        setDenialDetails(denial.details);
        try {
          sessionStorage.removeItem(storageKey);
        } catch {}
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [token, storageKey]);

  // 2. Local countdown timer
  useEffect(() => {
    if (denialReason || loading || !session) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          cleanupAndDeny('Document Expired', 'The access duration for this document has concluded.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [denialReason, loading, session]);

  // 3. Authoritative server heartbeat check every 3 seconds
  useEffect(() => {
    if (denialReason || loading || !session) return;

    const heartbeat = setInterval(() => {
      ApiClient.checkViewerSessionStatus(session.sessionId, sessionTokenRef.current)
        .then((status) => {
          if (!status.active || status.remainingSeconds <= 0) {
            cleanupAndDeny('Document Expired', 'The access duration for this document has concluded.');
          } else {
            // Re-sync with authoritative server clock
            setRemainingSeconds(status.remainingSeconds);
          }
        })
        .catch((err) => {
          const denial = classifyDenial(err);
          cleanupAndDeny(denial.reason, denial.details);
        });
    }, 3000);

    return () => clearInterval(heartbeat);
  }, [denialReason, loading, session]);

  // Anti-print and anti-copy keyboard interceptors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
        alert('Notice: Printing and local raw saving are disabled for this protected document.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cleanupAndDeny = (reason: DrmDenialReason, details: string) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setContentUrl(null);
    setDenialReason(reason);
    setDenialDetails(details);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
  };

  // State 1: Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wide">Validating DRM Document License...</p>
          <p className="text-xs text-slate-400">Verifying server access policy and opening authorized session</p>
        </div>
      </div>
    );
  }

  // State 2: Access Denied ("Unable to Open Document")
  if (denialReason) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center space-y-5 shadow-2xl animate-fade-in">
          {/* Reason-specific Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border transition">
            {denialReason === 'Document Expired' && (
              <div className="w-full h-full rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
            )}
            {denialReason === 'Maximum Open Count Reached' && (
              <div className="w-full h-full rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Lock className="w-8 h-8" />
              </div>
            )}
            {denialReason === 'Access Revoked' && (
              <div className="w-full h-full rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>
            )}
            {denialReason === 'Invalid or Unauthorized Link' && (
              <div className="w-full h-full rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700">
                <KeyRound className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Exact Required Heading */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Unable to Open Document</h2>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mt-1 bg-slate-800/80 border border-slate-700 text-slate-200">
              Reason: {denialReason}
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {denialDetails}
          </p>

          {/* Security & Preserved Status Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 text-left space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
              <span>SECURITY POLICY ENFORCED</span>
              <span>AUTHORITATIVE SERVER CLOCK</span>
            </div>
            <p className="text-slate-400">
              • Access to this protected document is strictly regulated by server-side DRM policies.
            </p>
            <p className="text-slate-500">
              • The original encrypted document remains safely preserved in the sender's vault.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isPdf = session?.mimeType.includes('pdf') || session?.documentTitle.toLowerCase().endsWith('.pdf');
  const isImage = session?.mimeType.startsWith('image/');

  // State 3: Render Authorized Content
  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="h-screen w-screen flex flex-col bg-[#282c34] text-white select-none overflow-hidden"
    >
      {/* Main Viewport: Full screen edge-to-edge PDF / Document Viewer */}
      <main className="flex-1 flex flex-col min-h-0 w-full h-full relative overflow-hidden">
        {contentUrl && (
          <div className="flex-1 flex flex-col min-h-0 w-full h-full relative">
            {isPdf ? (
              <PdfViewer
                url={contentUrl}
                title={session?.documentTitle}
                watermarkText={session?.watermarkTemplate}
              />
            ) : isImage ? (
              <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-auto bg-[#525659]">
                <img
                  src={contentUrl}
                  alt={session?.documentTitle}
                  className="max-h-full max-w-full object-contain rounded shadow-2xl"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 w-full overflow-auto p-4 flex justify-center bg-[#525659]">
                <iframe
                  src={contentUrl}
                  title={session?.documentTitle}
                  className="w-full max-w-5xl h-full border-0 bg-slate-900 rounded shadow-2xl"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

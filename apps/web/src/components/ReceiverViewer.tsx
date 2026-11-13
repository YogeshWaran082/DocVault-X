import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Clock, AlertTriangle, ShieldAlert, Lock, Check } from 'lucide-react';
import { ApiClient } from '../api/client';
import { PdfViewer } from './PdfViewer';

interface ReceiverViewerProps {
  token: string;
}

export const ReceiverViewer: React.FC<ReceiverViewerProps> = ({ token }) => {
  const [session, setSession] = useState<{
    sessionId: string;
    documentTitle: string;
    mimeType: string;
    expiresAt: string;
    watermarkTemplate: string | null;
  } | null>(null);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(60);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<'EXPIRED' | 'REVOKED' | 'CONFLICT' | 'ERROR' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const blobUrlRef = useRef<string | null>(null);

  // 1. Initialize receiver session
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    ApiClient.initReceiverSession(token)
      .then(async (data) => {
        if (!isMounted) return;
        setSession(data);
        setRemainingSeconds(data.remainingSeconds);

        // Fetch protected preview content blob
        try {
          const blob = await ApiClient.fetchReceiverContent(data.sessionId);
          if (!isMounted) return;
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setContentUrl(url);
        } catch (err: any) {
          if (!isMounted) return;
          if (err.message && err.message.includes('410')) {
            setErrorState('EXPIRED');
          } else if (err.message && err.message.includes('403')) {
            setErrorState('REVOKED');
          } else if (err.message && err.message.includes('409')) {
            setErrorState('CONFLICT');
          } else {
            setErrorMessage(err.message || 'Failed to load document content');
            setErrorState('ERROR');
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.message && (err.message.includes('expired') || err.message.includes('410'))) {
          setErrorState('EXPIRED');
        } else if (err.message && (err.message.includes('revoked') || err.message.includes('403'))) {
          setErrorState('REVOKED');
        } else if (err.message && (err.message.includes('Single-session') || err.message.includes('409'))) {
          setErrorState('CONFLICT');
        } else {
          setErrorMessage(err.message || 'Unable to open document');
          setErrorState('ERROR');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [token]);

  // 2. Local countdown timer
  useEffect(() => {
    if (errorState || loading || !session) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          cleanupAndExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [errorState, loading, session]);

  // 3. Server heartbeat check every 3 seconds to guarantee server authority
  useEffect(() => {
    if (errorState || loading || !session) return;

    const heartbeat = setInterval(() => {
      ApiClient.checkViewerSessionStatus(session.sessionId)
        .then((status) => {
          if (!status.active || status.remainingSeconds <= 0) {
            cleanupAndExpire();
          } else {
            // Re-sync with authoritative server clock
            setRemainingSeconds(status.remainingSeconds);
          }
        })
        .catch((err) => {
          if (err.message && err.message.includes('410')) {
            cleanupAndExpire();
          } else if (err.message && err.message.includes('403')) {
            cleanupAndRevoke();
          }
        });
    }, 3000);

    return () => clearInterval(heartbeat);
  }, [errorState, loading, session]);

  // Anti-print and anti-copy keyboard interceptors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
        alert('Notice: Printing and saving raw content is disabled for this protected document.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cleanupAndExpire = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setContentUrl(null);
    setErrorState('EXPIRED');
  };

  const cleanupAndRevoke = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setContentUrl(null);
    setErrorState('REVOKED');
  };

  // Format seconds into HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // State: Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wide">Authorizing secure browser viewer session...</p>
          <p className="text-xs text-slate-400">Verifying server-side cryptographic lease</p>
        </div>
      </div>
    );
  }

  // State: Expired
  if (errorState === 'EXPIRED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-amber-500/30 p-8 text-center space-y-4 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Session Expired — Access Denied</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The viewing time for this document has concluded. The server has permanently revoked further access, and all cached memory has been zeroized. All future requests and browser refreshes are denied.
          </p>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-500 text-left space-y-1">
            <p>• Status: 410 Gone (Server-side enforced)</p>
            <p>• The original document remains permanently preserved in the sender's secure vault.</p>
          </div>
        </div>
      </div>
    );
  }

  // State: Conflict (Single-session breach)
  if (errorState === 'CONFLICT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-red-500/30 p-8 text-center space-y-4 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Single Active Session Restriction</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This document has a strict single-session policy and is already active in another browser tab or device. Concurrent viewing and forwarded link access are restricted.
          </p>
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            Status: 409 Conflict • Session locked
          </div>
        </div>
      </div>
    );
  }

  // State: Revoked
  if (errorState === 'REVOKED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-red-500/30 p-8 text-center space-y-4 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access Revoked — Access Denied</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The document sender or organization owner has revoked this share link. Access has been terminated immediately.
          </p>
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            Status: 403 Forbidden • Session terminated
          </div>
        </div>
      </div>
    );
  }

  // State: Other Error
  if (errorState === 'ERROR') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center space-y-4 shadow-2xl animate-fade-in">
          <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Document Unavailable</h2>
          <p className="text-xs text-slate-400">{errorMessage || 'Invalid document link'}</p>
        </div>
      </div>
    );
  }

  const isPdf = session?.mimeType.includes('pdf') || session?.documentTitle.toLowerCase().endsWith('.pdf');
  const isImage = session?.mimeType.startsWith('image/');

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="min-h-screen flex flex-col bg-slate-950 text-white select-none"
    >
      {/* Top Banner / Controls */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-white truncate max-w-xs sm:max-w-md">
                {session?.documentTitle}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">View Only • Protected Browser Session</p>
          </div>
        </div>

        {/* Live Remaining Time Countdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 shadow-sm">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">
                Remaining Access Time
              </span>
              <span className="text-sm font-mono font-bold text-amber-300">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Security info strip */}
      <div className="px-4 sm:px-8 py-1.5 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-3 h-3" /> Server Authorization Verified
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-brand-400" /> Decrypted in Memory Only
          </span>
        </div>
        <span className="text-[10px] text-slate-500 hidden sm:inline">
          Server-enforced automatic closure at expiry
        </span>
      </div>

      {/* Main Viewport: Occupies 100% remaining viewport height */}
      <main className="flex-1 flex flex-col min-h-0 w-full relative overflow-hidden bg-slate-950">
        {contentUrl && (
          <div className="flex-1 flex flex-col min-h-0 w-full h-full relative">
            {/* Document Renderers */}
            {isPdf ? (
              <PdfViewer
                url={contentUrl}
                title={session?.documentTitle}
                watermarkText={session?.watermarkTemplate}
              />
            ) : isImage ? (
              <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-auto">
                <img
                  src={contentUrl}
                  alt={session?.documentTitle}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 w-full overflow-auto p-4 flex justify-center">
                <iframe
                  src={contentUrl}
                  title={session?.documentTitle}
                  className="w-full max-w-5xl h-full border-0 bg-slate-900 rounded-xl"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

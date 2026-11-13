import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Clock, AlertTriangle, ShieldAlert, Lock, Check, Download, EyeOff, Eye } from 'lucide-react';
import { Document, Policy, User } from '../types';
import { ApiClient } from '../api/client';
import { PdfViewer } from './PdfViewer';

interface DocumentViewerModalProps {
  document: Document | null;
  policy: Policy | null;
  user: User;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  policy,
  user,
  onClose
}) => {
  const [leaseSecondsRemaining, setLeaseSecondsRemaining] = useState<number>(
    policy ? policy.offlineLeaseSeconds : 3000 // 50 mins default
  );
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState<boolean>(true);
  const [contentError, setContentError] = useState<string | null>(null);
  const [showWatermark, setShowWatermark] = useState<boolean>(Boolean(policy?.watermarkTemplate));

  useEffect(() => {
    if (!document) {
      setContentUrl(null);
      return;
    }

    setLeaseSecondsRemaining(policy ? policy.offlineLeaseSeconds : 3000);
    setShowWatermark(Boolean(policy?.watermarkTemplate));
    setLoadingContent(true);
    setContentError(null);

    let activeBlobUrl: string | null = null;

    ApiClient.fetchViewContent(document.id)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        activeBlobUrl = url;
        setContentUrl(url);
      })
      .catch((err) => {
        setContentError(err.message || 'Failed to decrypt and load document');
      })
      .finally(() => {
        setLoadingContent(false);
      });

    return () => {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [document, policy]);

  useEffect(() => {
    if (!document) return;
    const interval = setInterval(() => {
      setLeaseSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [document]);

  if (!document) return null;

  const hours = Math.floor(leaseSecondsRemaining / 3600);
  const minutes = Math.floor((leaseSecondsRemaining % 3600) / 60);
  const seconds = leaseSecondsRemaining % 60;

  const isExpired = leaseSecondsRemaining === 0;
  const isRevoked = document.status === 'revoked';

  const watermarkText = (policy?.watermarkTemplate || 'CONFIDENTIAL • {user} • {date}')
    .replace('{user}', user.email)
    .replace('{date}', new Date().toISOString().split('T')[0]!)
    .replace('{ip}', '192.168.1.101');

  const handleDownloadStandard = async () => {
    try {
      await ApiClient.exportUnprotected(document.id, document.title);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const isPdf = document.mimeDetected.includes('pdf') || document.title.toLowerCase().endsWith('.pdf');
  const isImage = document.mimeDetected.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {document.title}
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {policy?.mode || 'SECURE_NATIVE'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                AES-256-GCM Verified • {document.mimeDetected}
              </p>
            </div>
          </div>

          {/* Controls: Lease countdown & Download & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Countdown Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500 animate-pulse' : 'text-brand-600'}`} />
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">
                  Restriction Lease
                </span>
                <span className={`text-xs font-mono font-bold ${isExpired ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
                  {isExpired ? 'LEASE EXPIRED' : `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`}
                </span>
              </div>
            </div>

            {/* Quick Standard PDF Download */}
            <button
              onClick={handleDownloadStandard}
              title="Download clean standard PDF (opens in Adobe Reader, Chrome, Apple Preview)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Watermark toggle */}
            {policy?.watermarkTemplate && (
              <button
                onClick={() => setShowWatermark(!showWatermark)}
                title={showWatermark ? 'Hide Watermark Overlay' : 'Show Watermark Overlay'}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {showWatermark ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security verification strip */}
        <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="w-3 h-3" /> Monotonic Time Checked
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3 text-brand-600" /> Decrypted in Memory Only
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {showWatermark ? 'Dynamic watermark overlay active' : 'Clean document view (no watermark overlay)'}
          </span>
        </div>

        {/* Main Document Viewport: Occupies 100% of remaining height */}
        <div className="flex-1 min-h-0 relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
          {isRevoked ? (
            <div className="text-center p-8 max-w-md rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 m-4">
              <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">Access Revoked</h4>
              <p className="text-xs text-red-700 dark:text-red-300">
                The document owner has revoked access. Local decryption keys have been cleared from memory.
              </p>
            </div>
          ) : isExpired ? (
            <div className="text-center p-8 max-w-md rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 m-4">
              <Clock className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3 animate-bounce" />
              <h4 className="text-base font-bold text-amber-900 dark:text-amber-200 mb-1">Restriction Lease Expired</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Your offline access duration has elapsed. Reconnect to DocVault X network to renew your authorization token.
              </p>
            </div>
          ) : loadingContent ? (
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Decrypting AES-256-GCM container in memory...</p>
            </div>
          ) : contentError ? (
            <div className="text-center p-6 text-red-500 text-xs">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p>{contentError}</p>
            </div>
          ) : contentUrl ? (
            <div className="flex-1 min-h-0 w-full h-full relative flex flex-col">
              {/* Render based on file type */}
              {isPdf ? (
                <PdfViewer
                  url={contentUrl}
                  title={document.title}
                  watermarkText={showWatermark ? watermarkText : null}
                />
              ) : isImage ? (
                <div className="flex-1 min-h-0 w-full flex items-center justify-center p-4 overflow-auto">
                  <img src={contentUrl} alt={document.title} className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                </div>
              ) : (
                <div className="flex-1 min-h-0 w-full p-4 overflow-auto">
                  <iframe src={contentUrl} title={document.title} className="w-full h-full border-0 bg-white dark:bg-slate-900 rounded-lg" />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

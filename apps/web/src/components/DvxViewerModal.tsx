import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileCheck2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  KeyRound,
  FileBox,
  Eye
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { PdfViewer } from './PdfViewer';

interface DvxViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DvxViewerModal: React.FC<DvxViewerModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<{
    isValid: boolean;
    version: number;
    cipherSuite: number;
    documentId: string;
    mimeType: string;
    totalChunks: number;
    originalSizeBytes: number;
    createdAt: string;
    documentTitle: string | null;
    documentExists: boolean;
    status: string;
  } | null>(null);

  const [shareTokenInput, setShareTokenInput] = useState('');
  const [authorizing, setAuthorizing] = useState(false);
  const [session, setSession] = useState<{
    sessionId: string;
    documentTitle: string;
    mimeType: string;
    expiresAt: string;
    watermarkTemplate: string | null;
  } | null>(null);

  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [errorState, setErrorState] = useState<'EXPIRED' | 'REVOKED' | 'UNAUTHORIZED' | 'ERROR' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const blobUrlRef = useRef<string | null>(null);

  // Clean state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      cleanupState();
    }
  }, [isOpen]);

  const cleanupState = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFile(null);
    setInspecting(false);
    setInspectionResult(null);
    setShareTokenInput('');
    setAuthorizing(false);
    setSession(null);
    setContentUrl(null);
    setLoadingContent(false);
    setErrorState(null);
    setErrorMessage(null);
  };

  // 1. File Selection & Inspection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const selected = e.target.files[0];
    setFile(selected);
    setErrorState(null);
    setErrorMessage(null);
    setInspectionResult(null);
    setSession(null);
    setContentUrl(null);

    setInspecting(true);
    try {
      const result = await ApiClient.inspectDvx(selected);
      setInspectionResult(result);
    } catch (err: any) {
      setErrorState('ERROR');
      setErrorMessage(err.message || 'Invalid or corrupted .dvx file');
    } finally {
      setInspecting(false);
    }
  };

  // 2. Authorize and Decrypt
  const handleAuthorize = async () => {
    if (!inspectionResult) return;
    setAuthorizing(true);
    setErrorState(null);
    setErrorMessage(null);

    try {
      const auth = await ApiClient.authorizeDvx(
        inspectionResult.documentId,
        shareTokenInput.trim() || undefined
      );

      setSession(auth);
      setRemainingSeconds(auth.remainingSeconds);

      // Fetch memory stream
      setLoadingContent(true);
      const blob = await ApiClient.fetchDvxContent(auth.sessionId);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setContentUrl(url);
    } catch (err: any) {
      if (err.message && err.message.includes('410')) {
        setErrorState('EXPIRED');
      } else if (err.message && err.message.includes('403')) {
        setErrorState('REVOKED');
      } else if (err.message && (err.message.includes('401') || err.message.includes('Authorization required'))) {
        setErrorState('UNAUTHORIZED');
        setErrorMessage(err.message);
      } else {
        setErrorState('ERROR');
        setErrorMessage(err.message || 'Failed to authorize and open DVX file');
      }
    } finally {
      setAuthorizing(false);
      setLoadingContent(false);
    }
  };

  // 3. Heartbeat & Expiration
  useEffect(() => {
    if (!session || errorState) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const heartbeat = setInterval(() => {
      ApiClient.checkDvxSessionStatus(session.sessionId)
        .then((status) => {
          if (!status.active || status.remainingSeconds <= 0) {
            triggerExpire();
          } else {
            setRemainingSeconds(status.remainingSeconds);
          }
        })
        .catch((err) => {
          if (err.message && err.message.includes('410')) {
            triggerExpire();
          } else if (err.message && err.message.includes('403')) {
            setErrorState('REVOKED');
          }
        });
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    };
  }, [session, errorState]);

  const triggerExpire = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setContentUrl(null);
    setErrorState('EXPIRED');
  };

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isPdf = session?.mimeType.includes('pdf') || session?.documentTitle.toLowerCase().endsWith('.pdf');
  const isImage = session?.mimeType.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <FileBox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {session ? session.documentTitle : 'Open Encrypted .dvx Container'}
                </h3>
                {session && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Authorized Session
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Mode B: Universal Client Container Engine (AES-256-GCM)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {session && !errorState && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">
                    Remaining
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {formatTime(remainingSeconds)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
          {/* State: Expired */}
          {errorState === 'EXPIRED' && (
            <div className="text-center p-8 max-w-md rounded-2xl bg-amber-950/30 border border-amber-800 m-4 space-y-3 animate-fade-in">
              <Clock className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-white">Session Expired — Access Denied</h4>
              <p className="text-xs text-amber-300 leading-relaxed">
                The authorized viewing lease for this .dvx container has elapsed. Server has terminated the decryption session and memory buffers have been zeroized.
              </p>
            </div>
          )}

          {/* State: Revoked */}
          {errorState === 'REVOKED' && (
            <div className="text-center p-8 max-w-md rounded-2xl bg-red-950/30 border border-red-800 m-4 space-y-3 animate-fade-in">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
              <h4 className="text-base font-bold text-white">Access Revoked</h4>
              <p className="text-xs text-red-300 leading-relaxed">
                The document owner or enterprise policy has revoked access to this .dvx file.
              </p>
            </div>
          )}

          {/* State: Loading Decrypted Stream */}
          {loadingContent && (
            <div className="text-center p-8 space-y-3 animate-fade-in">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300">Decrypting AES-256-GCM chunks in memory...</p>
            </div>
          )}

          {/* State: Active Content View */}
          {contentUrl && !errorState && (
            <div className="flex-1 min-h-0 w-full h-full relative flex flex-col">
              {isPdf ? (
                <PdfViewer
                  url={contentUrl}
                  title={session?.documentTitle}
                  watermarkText={session?.watermarkTemplate}
                />
              ) : isImage ? (
                <div className="flex-1 min-h-0 w-full flex items-center justify-center p-4 overflow-auto">
                  <img
                    src={contentUrl}
                    alt={session?.documentTitle}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-0 w-full p-4 overflow-auto">
                  <iframe
                    src={contentUrl}
                    title={session?.documentTitle}
                    className="w-full h-full border-0 bg-slate-900 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* State: Initial File Selection & Authorization */}
          {!contentUrl && errorState !== 'EXPIRED' && errorState !== 'REVOKED' && (
            <div className="max-w-lg w-full p-6 space-y-5 animate-fade-in">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-2xl p-6 text-center transition cursor-pointer relative bg-slate-900/60">
                <input
                  type="file"
                  accept=".dvx"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileCheck2 className="w-8 h-8 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileBox className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-200">
                      Select or Drag .dvx Container File
                    </p>
                    <p className="text-xs text-slate-500">
                      AES-256-GCM Encrypted DocVault X Document Containers
                    </p>
                  </div>
                )}
              </div>

              {inspecting && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                  <span>Inspecting container header & cryptographic signature...</span>
                </div>
              )}

              {/* Inspection Info Card */}
              {inspectionResult && inspectionResult.isValid && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Valid DVX1 Container Verified</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Title</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {inspectionResult.documentTitle || 'Untitled Container'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">MIME Type</span>
                      <span className="font-mono text-slate-300">{inspectionResult.mimeType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Encryption</span>
                      <span className="text-slate-300">AES-256-GCM ({inspectionResult.totalChunks} chunks)</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">System Status</span>
                      <span className="capitalize text-emerald-400 font-semibold">{inspectionResult.status}</span>
                    </div>
                  </div>

                  {/* Authorization prompt */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-brand-400" />
                      <span>Authorization Passkey / Share Token (Optional for Owners)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Paste share token if opening as recipient"
                      value={shareTokenInput}
                      onChange={(e) => setShareTokenInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      If you are the document owner, your logged-in credentials will automatically authorize decryption.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    onClick={handleAuthorize}
                    disabled={authorizing}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    {authorizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validating Authorization & Decrypting in Memory...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Authorize & Open in Secure Viewer</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {errorState === 'ERROR' && errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

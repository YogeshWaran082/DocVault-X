import React, { useEffect, useState } from 'react';
import { KeyRound, Copy, Check, AlertTriangle, Shield, Lock, Info } from 'lucide-react';
import { ApiClient } from '../api/client';

interface PdfPasswordRetrievalViewProps {
  token: string;
}

export const PdfPasswordRetrievalView: React.FC<PdfPasswordRetrievalViewProps> = ({ token }) => {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof ApiClient.getPdfPasswordStatus>> | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrieving, setRetrieving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    ApiClient.getPdfPasswordStatus(token)
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message || 'Unable to load password retrieval link');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleReveal = async () => {
    setRetrieving(true);
    setError(null);
    try {
      const data = await ApiClient.retrievePdfPassword(token);
      setRevealedPassword(data.password);
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              retrievalCount: data.retrievalCount,
              remainingRetrievals: data.remainingRetrievals
            }
          : prev
      );
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve password');
    } finally {
      setRetrieving(false);
    }
  };

  const handleCopy = () => {
    if (!revealedPassword) return;
    navigator.clipboard.writeText(revealedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0A1222] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-950 text-brand-400 border border-brand-800 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">DocVault X Password Retrieval</h1>
            <p className="text-xs text-slate-400">AES-256 Password-Protected PDF</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Checking retrieval link status...</div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : status ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Document</span>
                <span className="font-semibold text-white truncate max-w-[220px]">
                  {status.documentTitle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Expires</span>
                <span className="text-slate-200">
                  {new Date(status.expiresAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Remaining Retrievals</span>
                <span className="text-slate-200">
                  {status.remainingRetrievals === null ? 'Unlimited' : status.remainingRetrievals}
                </span>
              </div>
            </div>

            {revealedPassword ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 space-y-2">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Document Opening Password
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-emerald-800 text-sm font-mono text-white select-all">
                    {revealedPassword}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ) : status.active ? (
              <button
                onClick={handleReveal}
                disabled={retrieving}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Shield className="w-4 h-4" />
                <span>{retrieving ? 'Retrieving...' : 'Reveal Document Password'}</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {status.isRevoked
                  ? 'This password retrieval link has been revoked.'
                  : status.isExpired
                  ? 'This password retrieval link has expired.'
                  : 'Maximum password retrieval count has been reached.'}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
              <span>{status.notice}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

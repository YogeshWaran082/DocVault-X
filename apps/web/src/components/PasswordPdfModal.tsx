import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  Download,
  ShieldBan,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Info
} from 'lucide-react';
import { Document } from '../types';
import { ApiClient } from '../api/client';

interface PasswordPdfModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordPdfModal: React.FC<PasswordPdfModalProps> = ({
  document,
  isOpen,
  onClose
}) => {
  const [passwordMode, setPasswordMode] = useState<'random' | 'custom'>('random');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

  const [ownerPasswordMode, setOwnerPasswordMode] = useState<'random' | 'custom'>('random');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  const [allowPrinting, setAllowPrinting] = useState(false);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowModifying, setAllowModifying] = useState(false);

  const [enablePasswordRetrieval, setEnablePasswordRetrieval] = useState(false);
  const [expiryValue, setExpiryValue] = useState(24);
  const [expiryUnit, setExpiryUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [maxRetrievals, setMaxRetrievals] = useState('1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    filename: string;
    userPassword: string;
    retrievalUrl: string | null;
    expiresAt: string | null;
    maxRetrievals: number | null;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<'password' | 'link' | null>(null);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (document && isOpen) {
      setError(null);
      setResult(null);
      setCopiedField(null);
      loadRecords();
    }
  }, [document, isOpen]);

  const loadRecords = async () => {
    if (!document) return;
    try {
      const data = await ApiClient.listPdfPasswordRecords(document.id);
      setRecords(data.records || []);
    } catch {
      // Ignore if backend offline
    }
  };

  if (!isOpen || !document) return null;

  const handleCopy = (text: string, field: 'password' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const triggerPdfDownload = (base64: string, filename: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const link = window.document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordMode === 'custom' && userPassword.length < 4) {
      setError('Document opening password must be at least 4 characters.');
      return;
    }
    if (ownerPasswordMode === 'custom' && ownerPassword.length < 4) {
      setError('Owner permission password must be at least 4 characters.');
      return;
    }
    if (
      passwordMode === 'custom' &&
      ownerPasswordMode === 'custom' &&
      userPassword === ownerPassword
    ) {
      setError('Owner permission password must differ from the document opening password.');
      return;
    }

    let multiplier = 3600;
    if (expiryUnit === 'minutes') multiplier = 60;
    if (expiryUnit === 'days') multiplier = 86400;
    const retrievalExpirySeconds = Math.max(60, expiryValue * multiplier);

    setLoading(true);
    try {
      const res = await ApiClient.exportPasswordProtectedPdf(document.id, {
        passwordMode,
        userPassword: passwordMode === 'custom' ? userPassword : undefined,
        ownerPasswordMode,
        ownerPassword: ownerPasswordMode === 'custom' ? ownerPassword : undefined,
        permissions: {
          allowPrinting,
          allowCopying,
          allowModifying
        },
        enablePasswordRetrieval,
        retrievalExpirySeconds: enablePasswordRetrieval ? retrievalExpirySeconds : undefined,
        maxRetrievals: enablePasswordRetrieval
          ? maxRetrievals
            ? parseInt(maxRetrievals, 10)
            : null
          : undefined
      });

      triggerPdfDownload(res.pdfBase64, res.filename);

      const retrievalUrl = res.retrieval
        ? `${window.location.origin}/#/pdf-password/${res.retrieval.token}`
        : null;

      setResult({
        filename: res.filename,
        userPassword: res.userPassword,
        retrievalUrl,
        expiresAt: res.retrieval?.expiresAt || null,
        maxRetrievals: res.retrieval?.maxRetrievals ?? null
      });

      if (enablePasswordRetrieval) {
        loadRecords();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export password-protected PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRecord = async (recordId: string) => {
    if (!window.confirm('Revoke this password retrieval link? Future retrievals will be blocked.')) {
      return;
    }
    try {
      await ApiClient.revokePdfPasswordRecord(recordId);
      loadRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Universal Password Protected PDF
              </h2>
              <p className="text-xs text-slate-500">
                Standard AES-256 encrypted .pdf compatible with Adobe, Chrome, Android &amp; iOS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleExport} className="space-y-4">
            {/* Document Opening Password */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-600" />
                  Document Opening Password (User)
                </span>
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPasswordMode('random')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      passwordMode === 'random'
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Random
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordMode('custom')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      passwordMode === 'custom'
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {passwordMode === 'random' ? (
                <p className="text-[11px] text-slate-500">
                  A cryptographically random 16-character password will be generated and shown once after export.
                </p>
              ) : (
                <div className="relative">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Enter opening password (min 4 characters)"
                    className="w-full pr-9 pl-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Separate Owner Permission Password */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Separate Owner Permission Password
                </span>
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setOwnerPasswordMode('random')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      ownerPasswordMode === 'random'
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Auto-Random
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnerPasswordMode('custom')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      ownerPasswordMode === 'custom'
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {ownerPasswordMode === 'random' ? (
                <p className="text-[11px] text-slate-500">
                  A separate 24-character owner password will lock permission settings so the opening password cannot bypass restrictions.
                </p>
              ) : (
                <div className="relative">
                  <input
                    type={showOwnerPassword ? 'text' : 'password'}
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Enter separate owner password (min 4 characters)"
                    className="w-full pr-9 pl-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showOwnerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* PDF Reader Restrictions */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                PDF Reader Restrictions (Unchecked = Blocked)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPrinting}
                    onChange={(e) => setAllowPrinting(e.target.checked)}
                    className="rounded border-slate-300 accent-brand-600"
                  />
                  <span>Allow Printing</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCopying}
                    onChange={(e) => setAllowCopying(e.target.checked)}
                    className="rounded border-slate-300 accent-brand-600"
                  />
                  <span>Allow Copying</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowModifying}
                    onChange={(e) => setAllowModifying(e.target.checked)}
                    className="rounded border-slate-300 accent-brand-600"
                  />
                  <span>Allow Editing</span>
                </label>
              </div>
            </div>

            {/* Optional Server-Controlled Password Retrieval Link */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-brand-600" />
                    Optional Server-Controlled Password Retrieval Link
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Leave off for direct offline password sharing, or enable an expiring retrieval link
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enablePasswordRetrieval}
                  onChange={(e) => setEnablePasswordRetrieval(e.target.checked)}
                  className="rounded border-slate-300 accent-brand-600 w-4 h-4"
                />
              </label>

              {enablePasswordRetrieval && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Link Expiry
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={expiryValue}
                        onChange={(e) => setExpiryValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                      />
                      <select
                        value={expiryUnit}
                        onChange={(e) => setExpiryUnit(e.target.value as any)}
                        className="flex-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Max Retrievals
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={maxRetrievals}
                      onChange={(e) => setMaxRetrievals(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Honest Scope Notice */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                Your original encrypted vault file is preserved untouched. Note: Server-side password expiry or retrieval limits only block future password retrievals from the server — they cannot invalidate an already-downloaded PDF once the recipient knows its password.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Encrypting PDF with AES-256...' : 'Export AES-256 Protected PDF'}</span>
            </button>
          </form>

          {/* Result Display */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Exported: {result.filename}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  AES-256 PDF
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Document Opening Password (share securely with recipient):
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-slate-900 dark:text-white select-all">
                    {result.userPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.userPassword, 'password')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    {copiedField === 'password' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'password' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {result.retrievalUrl && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Optional Password Retrieval Link:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.retrievalUrl}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(result.retrievalUrl!, 'link')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      {copiedField === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'link' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing Password Retrieval Links */}
          {records.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Active &amp; Past Password Retrieval Links ({records.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {records.map((r) => {
                  const expired = new Date(r.expiresAt).getTime() <= Date.now();
                  const revoked = Boolean(r.revokedAt);
                  const exhausted = r.maxRetrievals !== null && r.retrievalCount >= r.maxRetrievals;
                  const active = !expired && !revoked && !exhausted;
                  return (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span
                          className={`font-semibold ${
                            active ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {revoked ? 'Revoked' : expired ? 'Expired' : exhausted ? 'Limit Reached' : 'Active'}
                        </span>
                        <span className="text-slate-400 ml-2">
                          Retrievals: {r.retrievalCount}
                          {r.maxRetrievals !== null ? ` / ${r.maxRetrievals}` : ''}
                        </span>
                      </div>
                      {active && (
                        <button
                          type="button"
                          onClick={() => handleRevokeRecord(r.id)}
                          className="flex items-center gap-1 text-red-600 hover:underline font-semibold"
                        >
                          <ShieldBan className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

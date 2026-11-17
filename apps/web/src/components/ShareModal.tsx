import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  Link as LinkIcon,
  RotateCw,
  PlusCircle,
  ShieldBan,
  Lock
} from 'lucide-react';
import { Document } from '../types';
import { ApiClient } from '../api/client';

interface ShareModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ document, isOpen, onClose }) => {
  const [expiryValue, setExpiryValue] = useState<number>(1);
  const [expiryUnit, setExpiryUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
  const [expiryType, setExpiryType] = useState<'FIRST_OPEN' | 'ABSOLUTE'>('FIRST_OPEN');
  const [maxOpens, setMaxOpens] = useState<string>('');
  const [singleSessionOnly, setSingleSessionOnly] = useState(false);
  const [enablePassword, setEnablePassword] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkTemplate, setWatermarkTemplate] = useState('CONFIDENTIAL • {ip} • {date}');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeShares, setActiveShares] = useState<any[]>([]);
  const [shareFilter, setShareFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');

  useEffect(() => {
    if (document && isOpen) {
      setCreatedUrl(null);
      setError(null);
      setCopied(false);
      loadActiveShares();
    }
  }, [document, isOpen]);

  const loadActiveShares = async () => {
    if (!document) return;
    try {
      const data = await ApiClient.listShareLinks(document.id);
      setActiveShares(data.shares || []);
    } catch {
      // Ignored
    }
  };

  if (!isOpen || !document) return null;

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let multiplier = 60;
    if (expiryUnit === 'hours') multiplier = 3600;
    if (expiryUnit === 'days') multiplier = 86400;
    const expirySeconds = expiryValue * multiplier;

    try {
      const res = await ApiClient.createShareLink(document.id, {
        expirySeconds,
        expiryType,
        maxOpens: maxOpens ? parseInt(maxOpens, 10) : null,
        watermarkTemplate: enableWatermark ? watermarkTemplate : null,
        singleSessionOnly,
        password: enablePassword && accessPassword.trim() ? accessPassword.trim() : null
      });

      const fullUrl = `${window.location.origin}/#/share/${res.token}`;
      setCreatedUrl(fullUrl);
      loadActiveShares();
    } catch (err: any) {
      setError(err.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!window.confirm('Revoke access immediately? Active viewer sessions will be disconnected.')) return;
    try {
      await ApiClient.revokeShareLink(shareId);
      loadActiveShares();
    } catch (err: any) {
      alert(err.message || 'Revocation failed');
    }
  };

  const handleExtendExpiry = async (shareId: string, seconds: number = 1800) => {
    try {
      await ApiClient.extendShareExpiry(shareId, seconds);
      loadActiveShares();
    } catch (err: any) {
      alert(err.message || 'Extend expiry failed');
    }
  };

  const handleRegenerateShare = async (shareId: string) => {
    if (!window.confirm('Regenerate share token? Prior links and active viewer sessions will be invalidated.')) return;
    try {
      const res = await ApiClient.regenerateShareLink(shareId);
      const newUrl = `${window.location.origin}/#/share/${res.token}`;
      setCreatedUrl(newUrl);
      loadActiveShares();
    } catch (err: any) {
      alert(err.message || 'Regeneration failed');
    }
  };

  const filteredShares = activeShares.filter((s) => {
    const isExpired = new Date(s.expiresAt).getTime() <= Date.now();
    const isRevoked = Boolean(s.revokedAt);
    if (shareFilter === 'active') return !isRevoked && !isExpired;
    if (shareFilter === 'expired') return !isRevoked && isExpired;
    if (shareFilter === 'revoked') return isRevoked;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Secure Browser Share Link</h2>
              <p className="text-xs text-slate-500">Receiver opens in Chrome/Safari without installing any app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCreateShare} className="space-y-4">
            {/* Expiry Semantics Toggle: First Open vs Absolute */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Expiry Trigger Event:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExpiryType('FIRST_OPEN')}
                  className={`p-2 rounded-lg text-left border text-xs transition ${
                    expiryType === 'FIRST_OPEN'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-semibold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block font-bold">First Open (Recommended)</span>
                  <span className="text-[11px] text-slate-500">Timer begins when recipient opens link</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExpiryType('ABSOLUTE')}
                  className={`p-2 rounded-lg text-left border text-xs transition ${
                    expiryType === 'ABSOLUTE'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-semibold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block font-bold">Absolute Expiry</span>
                  <span className="text-[11px] text-slate-500">Timer begins immediately upon link generation</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Expiry Duration (Server-Enforced Self-Destruct)</span>
                </label>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                  {(['minutes', 'hours', 'days'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setExpiryUnit(unit)}
                      className={`px-2 py-0.5 rounded-md font-semibold capitalize transition ${
                        expiryUnit === unit
                          ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider & Quick Presets */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max={expiryUnit === 'minutes' ? 120 : expiryUnit === 'hours' ? 48 : 30}
                  value={expiryValue}
                  onChange={(e) => setExpiryValue(parseInt(e.target.value, 10))}
                  className="flex-1 accent-brand-600 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="1"
                    value={expiryValue}
                    onChange={(e) => setExpiryValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-xs font-bold bg-white dark:bg-slate-950"
                  />
                  <span className="text-xs font-semibold text-slate-500 uppercase">{expiryUnit}</span>
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 mr-1">Quick presets:</span>
                {[
                  { label: '1 min', val: 1, u: 'minutes' as const },
                  { label: '50 mins', val: 50, u: 'minutes' as const },
                  { label: '1 hour', val: 1, u: 'hours' as const },
                  { label: '24 hours', val: 24, u: 'hours' as const },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setExpiryValue(p.val);
                      setExpiryUnit(p.u);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                      expiryValue === p.val && expiryUnit === p.u
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Opens */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maximum Document Opens (Optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Unlimited if empty (e.g. 1 or 2)"
                value={maxOpens}
                onChange={(e) => setMaxOpens(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Single Session / One-Time Open Restriction */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={singleSessionOnly}
                  onChange={(e) => setSingleSessionOnly(e.target.checked)}
                  className="rounded accent-brand-600 w-4 h-4"
                />
                <span>Single Active Session Only (Block concurrent & forwarded viewing)</span>
              </label>
              <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                If checked, only one browser session can be active at a time. Anyone attempting to open the link concurrently or from a forwarded tab will be denied.
              </p>
            </div>

            {/* Watermark toggle */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={(e) => setEnableWatermark(e.target.checked)}
                  className="rounded accent-brand-600 w-4 h-4"
                />
                <span>Enable Forensic Watermark on Receiver's Screen</span>
              </label>
              {enableWatermark && (
                <input
                  type="text"
                  value={watermarkTemplate}
                  onChange={(e) => setWatermarkTemplate(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono"
                  placeholder="CONFIDENTIAL • {ip} • {date}"
                />
              )}
              <p className="text-[11px] text-slate-400 pl-6">
                {enableWatermark ? 'Dynamic watermark overlay will display recipient IP & time.' : 'Clean document view (no watermark overlay).'}
              </p>
            </div>

            {/* Password Protection */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="rounded accent-orange-600 w-4 h-4"
                />
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-500" />
                  <span>Secure Document with Access Password</span>
                </div>
              </label>

              {enablePassword && (
                <div className="pl-6 space-y-1.5 animate-in fade-in duration-200">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={enablePassword}
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      placeholder="Enter access password for receiver"
                      className="w-full px-3 py-1.5 pr-12 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Recipients must enter this exact password before the document decrypts and opens in memory.
                  </p>
                </div>
              )}
            </div>

            {/* Forwarded link security disclosure */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                ℹ️ Unauthenticated Link & Camera Disclosure:
              </span>
              Because recipients do not enter passwords, unauthenticated links can be forwarded to others unless Single Session or Maximum Opens is configured. Physical camera capture or OS-level screenshots cannot be reliably blocked.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              <span>{loading ? 'Generating Expiring Link...' : 'Generate Expiring Browser Link'}</span>
            </button>
          </form>

          {/* Generated Link Display */}
          {createdUrl && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 animate-fade-in">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                Link Generated! Share this URL with your recipient:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdUrl}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(createdUrl)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                🔒 Once opened by the receiver, the timer begins. When the time expires, access is blocked automatically by the server!
              </p>
            </div>
          )}

          {/* Share Links for this document with Active, Expired, Revoked tabs and Actions */}
          {activeShares.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Share Links for this File ({activeShares.length})
                </h4>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                  {(['all', 'active', 'expired', 'revoked'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setShareFilter(filter)}
                      className={`px-2 py-0.5 rounded capitalize transition font-medium ${
                        shareFilter === filter
                          ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 font-bold shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {filteredShares.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No {shareFilter} shares found</p>
                ) : (
                  filteredShares.map((s) => {
                    const isExpired = new Date(s.expiresAt).getTime() <= Date.now();
                    const isRevoked = Boolean(s.revokedAt);
                    const shareUrl = `${window.location.origin}/#/share/${s.rawToken || s.tokenHash}`;
                    return (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50/50 dark:bg-slate-950/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isRevoked
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800'
                                  : isExpired
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                            </span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              Opens: {s.openCount} {s.maxOpens ? `/ ${s.maxOpens}` : ''}
                            </span>
                            {s.singleSessionOnly && (
                              <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">
                                1 Session
                              </span>
                            )}
                          </div>

                          {/* Quick Actions: Copy Link */}
                          {s.rawToken && (
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(shareUrl)}
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1 transition"
                              title="Copy Share URL"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy Link</span>
                            </button>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>
                            Expires: {new Date(s.expiresAt).toLocaleTimeString()} ({new Date(s.expiresAt).toLocaleDateString()})
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Trigger: {s.expiryType === 'FIRST_OPEN' ? 'First Open' : 'Immediate'}
                          </span>
                        </div>

                        {/* Management Actions */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                          {/* Extend Expiry */}
                          <button
                            type="button"
                            onClick={() => handleExtendExpiry(s.id, 1800)}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium flex items-center gap-1 transition"
                            title="Add 30 minutes to expiry"
                          >
                            <PlusCircle className="w-3 h-3 text-emerald-600" />
                            <span>+30m</span>
                          </button>

                          {/* Regenerate Token */}
                          <button
                            type="button"
                            onClick={() => handleRegenerateShare(s.id)}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium flex items-center gap-1 transition"
                            title="Generate a brand new token and invalidate old links"
                          >
                            <RotateCw className="w-3 h-3 text-brand-600" />
                            <span>Regenerate</span>
                          </button>

                          {/* Revoke */}
                          {!isRevoked && (
                            <button
                              type="button"
                              onClick={() => handleRevokeShare(s.id)}
                              className="px-2 py-1 rounded border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 text-[11px] font-semibold flex items-center gap-1 transition"
                            >
                              <ShieldBan className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

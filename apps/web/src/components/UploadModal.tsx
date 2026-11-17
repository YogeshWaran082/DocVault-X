import React, { useState } from 'react';
import { X, Upload, Shield, AlertTriangle, FileText, CheckCircle2, Lock, Clock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { ApiClient } from '../api/client';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentPassword, setDocumentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'SECURE_NATIVE' | 'NORMAL_EXPORT' | 'OFFLINE_PWA'>('SECURE_NATIVE');
  // Timing restriction: defaults to 50 minutes (customizable to hours)
  const [timingValue, setTimingValue] = useState<number>(50);
  const [timingUnit, setTimingUnit] = useState<'minutes' | 'hours'>('minutes');
  const [maxOpens, setMaxOpens] = useState<string>('');
  const [enableWatermark, setEnableWatermark] = useState(false); // Default false: no watermark inside PDF as requested
  const [watermark, setWatermark] = useState('CONFIDENTIAL • {user} • {date}');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPdf = Boolean(file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')));

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (isPdf && documentPassword && documentPassword.length < 6) {
      setError('PDF password must contain at least 6 characters');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      if (isPdf && documentPassword) formData.append('password', documentPassword);

      const result = await ApiClient.uploadDocument(formData);

      // Compute lease seconds from timing unit (minutes or hours)
      const offlineLeaseSeconds = timingUnit === 'minutes' ? timingValue * 60 : timingValue * 3600;

      // If custom policy options were selected, update policy immediately
      const policyUpdate: any = {
        mode,
        offlineLeaseSeconds,
        maxOpens: maxOpens ? parseInt(maxOpens, 10) : null,
        allowExport: true, // Allow standard PDF export
        watermarkTemplate: enableWatermark ? watermark : null // No watermark by default
      };

      await ApiClient.updatePolicy(result.document.id, policyUpdate);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Upload & Encrypt Document</h2>
              <p className="text-xs text-slate-500">Universal .dvx AES-256-GCM Container Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Document File
            </label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-xl p-5 text-center transition cursor-pointer relative bg-slate-50/50 dark:bg-slate-950/50">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-brand-600" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'binary'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Click to browse or drag file here
                  </p>
                  <p className="text-xs text-slate-400">PDF, Office, Images, Text, Media (Up to 500MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Confidential Agreement"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          {isPdf && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mb-3 flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <label htmlFor="pdf-access-password" className="block text-xs font-semibold text-slate-900 dark:text-white">PDF access password <span className="font-normal text-slate-400">(optional)</span></label>
                  <p className="mt-0.5 text-[11px] leading-5 text-slate-500">Viewers must enter this password before DocVault decrypts the PDF.</p>
                </div>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="pdf-access-password"
                  type={showPassword ? 'text' : 'password'}
                  value={documentPassword}
                  onChange={(event) => setDocumentPassword(event.target.value)}
                  minLength={6}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide PDF password' : 'Show PDF password'} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Protection Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Protection Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMode('SECURE_NATIVE')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'SECURE_NATIVE'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-900 dark:text-brand-100 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Shield className="w-3.5 h-3.5 text-brand-600" />
                  <span>Secure Native (.dvx)</span>
                </div>
                <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                  Encrypted container with controlled lease and offline self-destruction.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('OFFLINE_PWA')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'OFFLINE_PWA'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Offline Web PWA</span>
                </div>
                <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                  Browser sandbox caching via Web Crypto and IndexedDB.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('NORMAL_EXPORT')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'NORMAL_EXPORT'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Normal File Mode</span>
                </div>
                <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                  Standard PDF opens directly in Adobe/Chrome.
                </p>
              </button>
            </div>
          </div>

          {/* Mode Warning & Restriction Timing */}
          {mode === 'NORMAL_EXPORT' ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Notice: Standard PDF Files Cannot Self-Destruct or Expire</span>
              </div>
              <p className="leading-relaxed">
                When you download a standard PDF to your desktop, applications like <strong>Adobe Acrobat, Apple Preview, and Google Chrome</strong> do not support self-destruct timers. The file will remain readable indefinitely once saved to disk.
              </p>
              <p className="font-semibold text-amber-950 dark:text-amber-100">
                👉 If you want the document to expire and lock automatically after {timingValue} {timingUnit}, select <strong>"Secure Native (.dvx)"</strong> or view it inside the DocVault X Secure Viewer.
              </p>
            </div>
          ) : (
            /* Restriction Timing (50 mins to hours) */
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-600" />
                    <span>Self-Destruct / Offline Lease Restriction Timing</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setTimingUnit('minutes')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition ${
                        timingUnit === 'minutes'
                          ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Minutes
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimingUnit('hours')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition ${
                        timingUnit === 'hours'
                          ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Hours
                    </button>
                  </div>
                </div>

                {/* Slider & Number Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max={timingUnit === 'minutes' ? 180 : 72}
                    value={timingValue}
                    onChange={(e) => setTimingValue(parseInt(e.target.value, 10))}
                    className="flex-1 accent-brand-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max={timingUnit === 'minutes' ? 1440 : 720}
                      value={timingValue}
                      onChange={(e) => setTimingValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-xs font-bold bg-white dark:bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-500 uppercase">{timingUnit}</span>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 mr-1">Quick presets:</span>
                  {[
                    { label: '1 min (Test)', val: 1, unit: 'minutes' as const },
                    { label: '30 mins', val: 30, unit: 'minutes' as const },
                    { label: '50 mins', val: 50, unit: 'minutes' as const },
                    { label: '1 hour', val: 1, unit: 'hours' as const },
                    { label: '24 hours', val: 24, unit: 'hours' as const },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setTimingValue(preset.val);
                        setTimingUnit(preset.unit);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                        timingValue === preset.val && timingUnit === preset.unit
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Opens */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Max Views / Opens Limit (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited if empty"
                  value={maxOpens}
                  onChange={(e) => setMaxOpens(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* Watermark Section (Clean: disabled by default as user requested) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={enableWatermark}
                onChange={(e) => setEnableWatermark(e.target.checked)}
                className="rounded accent-brand-600 w-4 h-4"
              />
              <span>Add Forensic Watermark Overlay across document</span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6">
              {enableWatermark
                ? 'Dynamic overlay with recipient identity will appear across pages.'
                : 'No watermark will be placed over your document (Clean view).'}
            </p>

            {enableWatermark && (
              <div className="pl-6 pt-1">
                <input
                  type="text"
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition"
            >
              {uploading ? (
                <span>Encrypting & Uploading...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Encrypt & Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

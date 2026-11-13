import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Lock, RefreshCw, EyeOff } from 'lucide-react';

export const SecurityBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Cryptographic Architecture & Transparency Disclosure:</strong> Offline document expiry is app-enforced via honest client leases.
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline shrink-0"
          >
            <span>{expanded ? 'Hide Details' : 'View Invariants'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950 dark:text-amber-100 mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Mode A (Normal Export)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Exports ordinary unencrypted PDF/Office files for standard apps. <strong>Expiry & remote revocation are impossible</strong> once exported.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950 dark:text-amber-100 mb-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Mode B (Secure Native .dvx)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                AES-256-GCM chunked container. Controlled offline access enforced via signed leases, monotonic clock checks, and key zeroization upon expiry.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950 dark:text-amber-100 mb-1">
                <EyeOff className="w-3.5 h-3.5" />
                <span>The Analog Hole & Root Limits</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                No software can physically block cameras taking pictures of the screen or kernel-level memory dumps on rooted devices. Dynamic watermarking acts as a forensic deterrent.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, FileX2, X } from 'lucide-react';

interface UnableToOpenPopupProps {
  isOpen: boolean;
  onDismiss: () => void;
  actionLabel?: string;
}

export const UnableToOpenPopup: React.FC<UnableToOpenPopupProps> = ({
  isOpen,
  onDismiss,
  actionLabel = 'Choose another file'
}) => {
  if (!isOpen) return null;

  return (
    <div className="error-popup-theme fixed inset-0 z-[100] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="unable-to-open-title">
      <button type="button" aria-label="Dismiss error" onClick={onDismiss} className="absolute inset-0 cursor-default" />
      <section className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-red-400/20 bg-[#111827] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <button type="button" onClick={onDismiss} aria-label="Close error" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
          <X className="h-4 w-4" />
        </button>

        <div className="relative mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300">
          <FileX2 className="h-7 w-7" />
          <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#111827] bg-red-500 text-white">
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
        </div>

        <h2 id="unable-to-open-title" className="text-xl font-semibold tracking-tight text-white">Unable to open</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-400">
          This file could not be opened. Check your access or choose a different file and try again.
        </p>

        <button type="button" onClick={onDismiss} autoFocus className="mt-6 h-11 w-full rounded-xl bg-white text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] active:scale-[0.985]">
          {actionLabel}
        </button>
      </section>
    </div>
  );
};

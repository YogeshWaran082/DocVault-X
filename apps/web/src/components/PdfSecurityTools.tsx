import React, { useMemo, useState } from 'react';
import { Check, Files, KeyRound, Loader2, Lock, LockOpen, PenLine, ScanLine, ShieldCheck, X } from 'lucide-react';
import { ApiClient } from '../api/client';
import { Document, PdfComparison } from '../types';

type ToolId = 'unlock' | 'protect' | 'sign' | 'redact' | 'compare';

interface PdfSecurityToolsProps {
  document: Document | null;
  documents: Document[];
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void | Promise<void>;
}

const tools: Array<{ id: ToolId; label: string; description: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'unlock', label: 'Unlock PDF', description: 'Remove the DocVault access password', icon: LockOpen },
  { id: 'protect', label: 'Protect PDF', description: 'Require a password before viewing', icon: ShieldCheck },
  { id: 'sign', label: 'Sign PDF', description: 'Add a dated approval stamp', icon: PenLine },
  { id: 'redact', label: 'Redact PDF', description: 'Create a copy with opaque redaction areas', icon: ScanLine },
  { id: 'compare', label: 'Compare PDF', description: 'Compare file identity and page structure', icon: Files }
];

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1.5">
    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
    {children}
  </label>
);

const inputClass = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export const PdfSecurityTools: React.FC<PdfSecurityToolsProps> = ({ document, documents, isOpen, onClose, onCompleted }) => {
  const [active, setActive] = useState<ToolId>('protect');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sourcePassword, setSourcePassword] = useState('');
  const [signerName, setSignerName] = useState('');
  const [reason, setReason] = useState('Approved');
  const [pageNumber, setPageNumber] = useState(1);
  const [x, setX] = useState(72);
  const [y, setY] = useState(72);
  const [width, setWidth] = useState(220);
  const [height, setHeight] = useState(36);
  const [label, setLabel] = useState('REDACTED');
  const [compareId, setCompareId] = useState('');
  const [comparePassword, setComparePassword] = useState('');
  const [comparison, setComparison] = useState<PdfComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const comparable = useMemo(() => documents.filter(item => item.id !== document?.id && (item.mimeDetected.includes('pdf') || item.title.toLowerCase().endsWith('.pdf')) && item.status === 'active'), [documents, document]);
  if (!isOpen || !document) return null;

  const selectTool = (tool: ToolId) => {
    setActive(tool); setError(null); setSuccess(null); setComparison(null);
  };

  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(null); setSuccess(null); setComparison(null);
    try {
      if (active === 'protect') {
        if (password.length < 6) throw new Error('Use at least 6 characters.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        await ApiClient.updatePolicy(document.id, { password });
        setSuccess('Password protection enabled.');
      } else if (active === 'unlock') {
        if (!document.hasPassword) throw new Error('This PDF does not have a DocVault password.');
        await ApiClient.updatePolicy(document.id, { password: null });
        setSuccess('DocVault password removed.');
      } else if (active === 'sign') {
        if (signerName.trim().length < 2) throw new Error('Enter the signer name.');
        const result = await ApiClient.signPdf({ documentId: document.id, password: sourcePassword || undefined, signerName, reason, pageNumber });
        setSuccess(`Created “${result.document.title}”.`);
      } else if (active === 'redact') {
        const result = await ApiClient.redactPdf({ documentId: document.id, password: sourcePassword || undefined, pageNumber, rectangles: [{ x, y, width, height }], label: label || undefined });
        setSuccess(`Created “${result.document.title}”.`);
      } else {
        if (!compareId) throw new Error('Choose a second PDF.');
        const result = await ApiClient.comparePdfs({ leftDocumentId: document.id, rightDocumentId: compareId, leftPassword: sourcePassword || undefined, rightPassword: comparePassword || undefined });
        setComparison(result.comparison);
        setSuccess(result.comparison.identical ? 'The PDF files are byte-for-byte identical.' : 'Differences found.');
      }
      await onCompleted();
    } catch (failure: any) {
      setError(failure.message || 'Unable to complete this PDF action.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="PDF security tools">
      <div className="flex max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/60 md:block">
          <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400">PDF SECURITY</p>
          <div className="mt-4 space-y-1.5">
            {tools.map(tool => { const Icon = tool.icon; return <button key={tool.id} type="button" onClick={() => selectTool(tool.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${active === tool.id ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700' : 'text-slate-600 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-slate-800/70'}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active === tool.id ? 'bg-brand-600 text-white' : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'}`}><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-semibold">{tool.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-400">{tool.description}</span></span></button>; })}
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">{document.title}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{tools.find(tool => tool.id === active)?.label}</h2><p className="mt-1 text-xs text-slate-500">{tools.find(tool => tool.id === active)?.description}</p></div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 md:hidden">{tools.map(tool => <button key={tool.id} onClick={() => selectTool(tool.id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${active === tool.id ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{tool.label}</button>)}</div>

          <form onSubmit={run} className="mt-6 space-y-4">
            {active === 'protect' && <div className="grid gap-4 sm:grid-cols-2"><Field label="New password"><input className={inputClass} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" /></Field><Field label="Confirm password"><input className={inputClass} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></Field></div>}
            {active === 'unlock' && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"><div className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" /> Remove access password</div><p className="mt-1">Authenticated vault users will be able to open this PDF without its current DocVault password.</p></div>}
            {(active === 'sign' || active === 'redact' || active === 'compare') && document.hasPassword && <Field label="Current password for this PDF"><input className={inputClass} type="password" value={sourcePassword} onChange={e => setSourcePassword(e.target.value)} placeholder="Required to process protected source" /></Field>}
            {active === 'sign' && <><div className="grid gap-4 sm:grid-cols-2"><Field label="Signer name"><input className={inputClass} value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Your full name" /></Field><Field label="Page"><input className={inputClass} type="number" min="1" value={pageNumber} onChange={e => setPageNumber(Number(e.target.value))} /></Field></div><Field label="Reason"><input className={inputClass} value={reason} onChange={e => setReason(e.target.value)} placeholder="Approved" /></Field><p className="text-[11px] leading-5 text-slate-400">Adds a visible approval stamp. This is not a certificate-based digital signature.</p></>}
            {active === 'redact' && <><div className="grid grid-cols-2 gap-3 sm:grid-cols-5"><Field label="Page"><input className={inputClass} type="number" min="1" value={pageNumber} onChange={e => setPageNumber(Number(e.target.value))} /></Field><Field label="X"><input className={inputClass} type="number" min="0" value={x} onChange={e => setX(Number(e.target.value))} /></Field><Field label="Y"><input className={inputClass} type="number" min="0" value={y} onChange={e => setY(Number(e.target.value))} /></Field><Field label="Width"><input className={inputClass} type="number" min="1" value={width} onChange={e => setWidth(Number(e.target.value))} /></Field><Field label="Height"><input className={inputClass} type="number" min="1" value={height} onChange={e => setHeight(Number(e.target.value))} /></Field></div><Field label="Optional label"><input className={inputClass} value={label} onChange={e => setLabel(e.target.value)} /></Field><p className="text-[11px] leading-5 text-slate-400">PDF coordinates begin at the bottom-left. The source stays unchanged; a restricted processed copy is created.</p></>}
            {active === 'compare' && <><Field label="Compare with"><select className={inputClass} value={compareId} onChange={e => setCompareId(e.target.value)}><option value="">Choose another PDF</option>{comparable.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>{documents.find(item => item.id === compareId)?.hasPassword && <Field label="Second PDF password"><input className={inputClass} type="password" value={comparePassword} onChange={e => setComparePassword(e.target.value)} /></Field>}<p className="text-[11px] leading-5 text-slate-400">Checks exact file identity, page count, byte size, and page dimensions. It does not perform visual pixel diffing.</p></>}

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"><span className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4" />{success}</span>{comparison && <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]"><div>Left: {comparison.left.pages} pages</div><div>Right: {comparison.right.pages} pages</div><div>Page delta: {comparison.pageCountDelta}</div><div>Size delta: {comparison.sizeDeltaBytes} bytes</div><div className="col-span-2">Dimension changes: {comparison.pagesWithDimensionChanges.join(', ') || 'None'}</div></div>}</div>}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" onClick={onClose} className="h-10 rounded-xl px-4 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button><button type="submit" disabled={loading} className="flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : active === 'unlock' ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{loading ? 'Processing…' : tools.find(tool => tool.id === active)?.label}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

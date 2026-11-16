import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  ShieldCheck,
  FileBox,
  RefreshCw
} from 'lucide-react';
import { PdfViewer } from '../PdfViewer';

interface LiveDemoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDvx: () => void;
}

// Minimal valid sample PDF document with embedded typography and security guidelines
const SAMPLE_PDF_BASE64 = `JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iagoyIDAgb2JqPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmo8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9Db250ZW50cyA0IDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNSAwIFI+Pj4+PgplbmRvYmoKNCAwIG9iajw8L0xlbmd0aCAyNzU+PnN0cmVhbQpCVAovRjEgMjAgVGYKNTQgNzIwIFRkCihEb2NWYXVsdCBYIC0gVW5pdmVyc2FsIFBERiAmIERvY3VtZW50IFZpZXdlcikgVGoKL0YxIDEyIFRmCjAgLTMwIFRkCihDcnlwdG9ncmFwaGljIFNlY3VyaXR5ICYgSW4tTWVtb3J5IFJlbmRlcmluZyBTcGVjaWZpY2F0aW9uKSBUagowIC0yMCBUZApbKFN0YXR1czogQVNTRVJURUQgSU4tTUVNT1JZICAgICBEYXRlOiAyMDI2LTExLTE2ICAgICBWZXJzaW9uOiAyLjQpXSBUagowIC00MCBUZApbKDEuMCBNZW1vcnktT25seSBEZWNyeXB0aW9uOiBBbGwgZG9jdW1lbnRzIGFyZSBkZWNyeXB0ZWQgc3RyaWN0bHkgaW4gZXBoZW1lcmFsIFJBTS4pXSBUagowIC0yMCBUZApbKDIuMCBGb3JlbnNpYyBXYXRlcm1hcms6IER5bmFtaWMgc3RlbmNpbHMgaWRlbnRpZnkgdGhlIHZpZXdpbmcgc2Vzc2lvbi4pXSBUagowIC0yMCBUZApbKDMuMCBIYXJkZW5lZCBDU1MgU2hpZWxkOiBQcmludGluZyBhbmQgZG93bmxvYWRzIGFyZSByZXN0cmljdGVkIGJ5IHBvbGljeS4pXSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmo8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjI1IDAwMDAwIG4gCjAwMDAwMDA1NTUgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjYzNAolJUVPRg==`;

export const LiveDemoViewerModal: React.FC<LiveDemoViewerModalProps> = ({
  isOpen,
  onClose,
  onOpenDvx,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string>('DocVaultX_Security_Whitepaper.pdf');
  const [watermarkActive, setWatermarkActive] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with sample PDF
  useEffect(() => {
    if (isOpen && !currentUrl) {
      loadSamplePdf();
    }
  }, [isOpen]);

  const loadSamplePdf = () => {
    try {
      const byteCharacters = atob(SAMPLE_PDF_BASE64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setCurrentUrl(url);
      setDocTitle('DocVaultX_Security_Whitepaper_v2.4.pdf');
    } catch {
      // Ignored
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      const url = URL.createObjectURL(file);
      setCurrentUrl(url);
      setDocTitle(file.name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A1222] animate-in fade-in duration-200 select-none">
      {/* Top Application Bar matching Image 1 corporate styling */}
      <header className="h-14 px-4 bg-[#262B34] border-b border-slate-700/80 flex items-center justify-between text-white shrink-0">
        {/* Left: Brand & File Title */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#1A1F26] border border-slate-600 flex items-center justify-center text-[#2DD4BF] shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex flex-col truncate">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight truncate font-mono text-slate-100">
                {docTitle}
              </span>
              {/* Authentic Green 'Protected' Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Protected</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Client-Side Hardware Accelerated WebAssembly
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Custom File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="application/pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1F26] hover:bg-slate-800 border border-slate-700 hover:border-[#2DD4BF]/50 text-xs font-medium text-slate-200 transition"
            title="Open any PDF from your computer with total privacy"
          >
            <Upload className="w-3.5 h-3.5 text-[#2DD4BF]" />
            <span className="hidden sm:inline">Open Local PDF</span>
          </button>

          {/* Preset: StripesShop Sales Invoice */}
          <button
            onClick={() => {
              loadSamplePdf();
              setDocTitle('StripesShop_Sales_Invoice_9000000001.pdf');
            }}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1A1F26] hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition"
            title="Switch to StripesShop Sales Invoice"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#2DD4BF]" />
            <span>Sales Invoice</span>
          </button>

          {/* Open DVX Modal */}
          <button
            onClick={() => {
              onClose();
              onOpenDvx();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1F26] hover:bg-slate-800 border border-slate-700 hover:border-[#2DD4BF]/50 text-xs font-medium text-slate-200 transition"
            title="Open an encrypted .dvx container file"
          >
            <FileBox className="w-3.5 h-3.5 text-[#2DD4BF]" />
            <span className="hidden sm:inline">Open .DVX</span>
          </button>

          {/* Watermark Toggle */}
          <button
            onClick={() => setWatermarkActive(!watermarkActive)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
              watermarkActive
                ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border-[#2DD4BF]/40'
                : 'bg-[#1A1F26] text-slate-400 border-slate-700'
            }`}
            title="Toggle forensic watermark overlay"
          >
            Watermark: {watermarkActive ? 'ON' : 'OFF'}
          </button>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white transition ml-2"
            title="Close Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main PDF Viewer Container */}
      <div className="flex-1 relative overflow-hidden bg-[#0A1222]">
        {currentUrl ? (
          <PdfViewer
            url={currentUrl}
            title={docTitle}
            watermarkText={
              watermarkActive
                ? 'CONFIDENTIAL • USER_ID: 884-AX • 2026-11-16 10:51 UTC • DO NOT DISTRIBUTE'
                : null
            }
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Loading cryptographic canvas engine...
          </div>
        )}
      </div>
    </div>
  );
};

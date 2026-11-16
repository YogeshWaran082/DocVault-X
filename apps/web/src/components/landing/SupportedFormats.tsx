import React from 'react';
import {
  FileText,
  Lock,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  FileCode2,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface FormatCard {
  name: string;
  extension: string;
  badge: string;
  badgeType: 'native' | 'conversion' | 'container';
  icon: React.ReactNode;
  description: string;
  features: string[];
}

export const SupportedFormats: React.FC = () => {
  const formats: FormatCard[] = [
    {
      name: 'PDF Documents',
      extension: '.pdf',
      badge: 'Native Engine Active',
      badgeType: 'native',
      icon: <FileText className="w-6 h-6 text-[#2997ff]" />,
      description:
        'Client-side hardware accelerated rendering with full page navigation, zoom, rotation, forensic watermarking, and text layer isolation.',
      features: ['Hardware Canvas Pipeline', 'Dynamic Watermark Stencil', 'Search & Thumbnails'],
    },
    {
      name: 'DVX Encrypted Container',
      extension: '.dvx',
      badge: 'Native Zero-Knowledge Container',
      badgeType: 'container',
      icon: <Lock className="w-6 h-6 text-[#2997ff]" />,
      description:
        'Tamper-evident authenticated container format with 64KB AES-256-GCM AEAD chunks, Ed25519 signed policies, and offline lease tokens.',
      features: ['Zero-Knowledge Decryption', 'Ed25519 Signed Policies', 'Cryptographic Kill-Switch'],
    },
    {
      name: 'Word Documents',
      extension: '.docx, .doc',
      badge: 'Secure Vault Conversion',
      badgeType: 'conversion',
      icon: <FileText className="w-6 h-6 text-[#f5f5f7]" />,
      description:
        'Ingested through our isolated serverless sandboxed conversion engine into vector representation, preventing direct macro and binary execution.',
      features: ['Typography Preservation', 'Sandboxed Pre-Processing', 'View-Only DRM Shield'],
    },
    {
      name: 'Excel Spreadsheets',
      extension: '.xlsx, .csv',
      badge: 'Secure Vault Conversion',
      badgeType: 'conversion',
      icon: <FileSpreadsheet className="w-6 h-6 text-[#34c759]" />,
      description:
        'Tabular workbook ingestion with multi-sheet preservation and cell formula privacy masking, blocking unauthorized formula exfiltration.',
      features: ['Multi-Sheet Tabs', 'Formula Obfuscation', 'Download Export Guard'],
    },
    {
      name: 'PowerPoint Slides',
      extension: '.pptx',
      badge: 'Secure Vault Conversion',
      badgeType: 'conversion',
      icon: <Presentation className="w-6 h-6 text-[#ff9f0a]" />,
      description:
        'Slide deck preservation rendered in high-fidelity slide viewer with speaker note concealment and restricted screen broadcast.',
      features: ['High-DPI Slide Render', 'Speaker Note Shield', 'Presentation Mode'],
    },
    {
      name: 'Images & Visuals',
      extension: '.png, .jpg, .webp, .svg',
      badge: 'Native Encrypted Buffer',
      badgeType: 'native',
      icon: <ImageIcon className="w-6 h-6 text-[#2997ff]" />,
      description:
        'Encrypted raster and vector decompression rendered directly to HTML5 canvas without creating temporary image files on the client disk.',
      features: ['No Disk Cache Leak', 'Deep Zoom Matrix', 'Context Menu Lock'],
    },
    {
      name: 'Code & Plain Text',
      extension: '.txt, .md, .json, .log',
      badge: 'Native Sandboxed Stream',
      badgeType: 'native',
      icon: <FileCode2 className="w-6 h-6 text-[#2997ff]" />,
      description:
        'Monospace stream viewer for technical reports, audit transcripts, and configuration keys with cryptographic checksum validation.',
      features: ['Syntax Line Numbering', 'Checksum Verification', 'Audit Trail Logging'],
    },
  ];

  return (
    <section id="formats" className="py-24 bg-[#000000] border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1d1d1f] border border-[#424245] text-[#2997ff] text-xs font-medium tracking-wide">
            <Layers className="w-3.5 h-3.5" />
            <span className="uppercase text-[11px] font-semibold">UNIVERSAL DOCUMENT COMPATIBILITY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-[#f5f5f7] tracking-tight">
            Supported File Formats
          </h2>

          <p className="text-base sm:text-lg text-[#86868b]">
            From ubiquitous PDFs to proprietary zero-knowledge encrypted .dvx containers, DocVault X provides a secure, audited reading environment.
          </p>
        </div>

        {/* Format Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formats.map((format) => (
            <div
              key={format.name}
              className="group relative rounded-3xl bg-[#161617] border border-[#333336] hover:border-[#424245] p-7 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Icon & Badge */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#1d1d1f] border border-[#424245] flex items-center justify-center transition-colors shadow-sm">
                    {format.icon}
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium tracking-wide bg-[#1d1d1f] text-[#2997ff] border border-[#333336]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
                    {format.badge}
                  </span>
                </div>

                {/* Name & Extension */}
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-[#f5f5f7] group-hover:text-white transition-colors">
                    {format.name}
                  </h3>
                  <span className="text-xs font-mono text-[#86868b]">
                    {format.extension}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[#a1a1a6] leading-relaxed mb-6 font-normal">
                  {format.description}
                </p>
              </div>

              {/* Feature Tags */}
              <div className="pt-4 border-t border-[#333336] flex flex-wrap gap-1.5">
                {format.features.map((feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1d1d1f] text-[11px] font-normal text-[#a1a1a6] border border-[#333336]"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#2997ff]" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Engine Transparency Notice */}
        <div className="mt-10 p-4 rounded-2xl bg-[#161617] border border-[#333336] text-center max-w-2xl mx-auto">
          <p className="text-xs text-[#86868b]">
            <strong className="text-[#f5f5f7] font-semibold">Engine Transparency:</strong> PDF and .DVX formats are rendered directly client-side in memory. Office documents (.docx, .xlsx, .pptx) are securely converted within an isolated zero-retention vault engine prior to viewing.
          </p>
        </div>
      </div>
    </section>
  );
};
